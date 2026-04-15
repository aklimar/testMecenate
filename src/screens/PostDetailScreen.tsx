import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useHeaderHeight } from '@react-navigation/elements';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  ListRenderItem,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  addPostComment,
  fetchPostById,
  fetchPostComments,
  togglePostLike,
} from '../api/posts';
import {
  clearPostLikeWsGrace,
  markPostLikeSyncedFromServer,
} from '../api/realtime';
import { COMMENTS_PAGE_SIZE } from '../api/constants';
import { NotFoundIcon } from '../components/icons/NotFoundIcon';
import { SendIcon } from '../components/icons/SendIcon';
import { PostCard } from '../components/PostCard';
import {
  CommentsSkeletonList,
  PostCardSkeleton,
  PostCommentsSectionTitleSkeleton,
} from '../components/PostDetailSkeletons';
import type { RootStackParamList } from '../navigation/types';
import { upsertCommentInCache } from '../query/commentCache';
import { patchPostInFeedQueries } from '../query/patchFeedPost';
import type { Comment } from '../types/comment';
import { tokens } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'PostDetail'>;

function CommentRow({ item }: { item: Comment }) {
  return (
    <View className="flex-row gap-sm border-b border-border px-md py-md">
      <Image
        source={{ uri: item.author.avatarUrl }}
        style={{ width: 40, height: 40, borderRadius: 20 }}
        contentFit="cover"
      />
      <View className="min-w-0 flex-1">
        <Text className="text-base font-semibold text-foreground">{item.author.displayName}</Text>
        <Text className="mt-xs text-sm text-secondary">{item.text}</Text>
      </View>
    </View>
  );
}

function LoadFail({ onRefresh }: { onRefresh: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-lg py-2xl">
      <NotFoundIcon size={96} />
      <Text className="mt-md text-center text-base text-foreground">Не удалось загрузить публикацию</Text>
      <Pressable className="mt-md rounded-lg bg-primary px-lg py-md" onPress={onRefresh}>
        <Text className="font-semibold text-primaryForeground">Обновить</Text>
      </Pressable>
    </View>
  );
}

export function PostDetailScreen({ route }: Props) {
  const { postId } = route.params;
  const queryClient = useQueryClient();
  const headerHeight = useHeaderHeight();
  const [draft, setDraft] = useState('');

  const postQuery = useQuery({
    queryKey: ['post', postId],
    queryFn: () => fetchPostById(postId),
  });

  const commentsQuery = useInfiniteQuery({
    queryKey: ['postComments', postId],
    queryFn: ({ pageParam }) =>
      fetchPostComments(postId, {
        limit: COMMENTS_PAGE_SIZE,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => {
      switch (last.hasMore) {
        case true:
          return last.nextCursor ?? undefined;
        case false:
        default:
          return undefined;
      }
    },
  });

  const comments = useMemo(
    () => commentsQuery.data?.pages.flatMap((p) => p.comments) ?? [],
    [commentsQuery.data?.pages]
  );

  const toggleLike = useMutation({
    mutationFn: togglePostLike,
    onMutate: async (id) => {
      markPostLikeSyncedFromServer(id);
      await queryClient.cancelQueries({ queryKey: ['posts', 'feed'], exact: false });
      await queryClient.cancelQueries({ queryKey: ['post', id] });
      const feedSnaps = queryClient.getQueriesData({ queryKey: ['posts', 'feed'], exact: false });
      const postSnap = queryClient.getQueryData(['post', id]);
      patchPostInFeedQueries(queryClient, id, (p) => ({
        ...p,
        isLiked: !p.isLiked,
        likesCount: p.isLiked ? Math.max(0, p.likesCount - 1) : p.likesCount + 1,
      }));
      queryClient.setQueryData(['post', id], (old: unknown) => {
        if (!old || typeof old !== 'object') return old;
        const o = old as { isLiked: boolean; likesCount: number };
        return {
          ...o,
          isLiked: !o.isLiked,
          likesCount: o.isLiked ? Math.max(0, o.likesCount - 1) : o.likesCount + 1,
        };
      });
      return { feedSnaps, postSnap };
    },
    onError: (_err, id, context) => {
      clearPostLikeWsGrace(id);
      context?.feedSnaps.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      if (context?.postSnap !== undefined) {
        queryClient.setQueryData(['post', id], context.postSnap);
      }
    },
    onSuccess: (data, id) => {
      patchPostInFeedQueries(queryClient, id, (p) => ({
        ...p,
        isLiked: data.isLiked,
        likesCount: data.likesCount,
      }));
      queryClient.setQueryData(['post', id], (old: unknown) => {
        if (!old || typeof old !== 'object') return old;
        return { ...(old as object), isLiked: data.isLiked, likesCount: data.likesCount };
      });
      markPostLikeSyncedFromServer(id);
    },
  });

  const addComment = useMutation({
    mutationFn: (text: string) => addPostComment(postId, text),
    onSuccess: (comment) => {
      upsertCommentInCache(queryClient, postId, comment);
      setDraft('');
    },
  });

  const commentComposerLocked =
    postQuery.isPending || commentsQuery.isPending || addComment.isPending;

  const onEndReached = useCallback(() => {
    if (commentsQuery.hasNextPage && !commentsQuery.isFetchingNextPage) {
      commentsQuery.fetchNextPage();
    }
  }, [commentsQuery]);

  const renderComment: ListRenderItem<Comment> = useCallback(
    ({ item }) => <CommentRow item={item} />,
    []
  );

  const listHeader = useMemo(() => {
    switch (postQuery.isPending) {
      case true:
        return (
          <View>
            <PostCardSkeleton />
            <PostCommentsSectionTitleSkeleton />
          </View>
        );
      case false:
      default:
        if (postQuery.isError || !postQuery.data) {
          return null;
        }
        return (
          <View>
            <PostCard
              post={postQuery.data}
              layout="detail"
              onLikePress={() => toggleLike.mutate(postId)}
              isLikeBusy={toggleLike.isPending}
            />
            <Text className="border-b border-border bg-background px-md pb-sm pt-lg text-sm font-medium text-secondary">
              {postQuery.data.commentsCount} комментариев
            </Text>
          </View>
        );
    }
  }, [postQuery.isPending, postQuery.isError, postQuery.data, postId, toggleLike]);

  if (postQuery.isError) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <LoadFail onRefresh={() => postQuery.refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
      >
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={renderComment}
          ListHeaderComponent={listHeader}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
          style={{ flex: 1, backgroundColor: tokens.color.background }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl
              refreshing={commentsQuery.isRefetching && !commentsQuery.isFetchingNextPage}
              onRefresh={() => {
                commentsQuery.refetch();
                postQuery.refetch();
              }}
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.35}
          ListEmptyComponent={
            commentsQuery.isPending ? (
              <CommentsSkeletonList count={6} />
            ) : (
              <Text className="px-md py-lg text-center text-sm text-muted">Пока нет комментариев</Text>
            )
          }
          ListFooterComponent={
            commentsQuery.isFetchingNextPage ? (
              <View className="py-md">
                <ActivityIndicator />
              </View>
            ) : null
          }
        />
        <View className="border-t border-border bg-surface px-md py-sm">
          <View className="flex-row items-center gap-sm">
            <TextInput
              className="max-h-24 min-h-[44px] flex-1 rounded-xl border border-border bg-background px-md py-sm text-base text-foreground"
              placeholder="Ваш комментарий..."
              placeholderTextColor={tokens.color.muted}
              value={draft}
              onChangeText={setDraft}
              multiline
              maxLength={2000}
              editable={!commentComposerLocked}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Отправить комментарий"
              disabled={!draft.trim() || commentComposerLocked}
              onPress={() => addComment.mutate(draft.trim())}
              className="h-11 w-11 items-center justify-center rounded-full active:opacity-90"
            >
              <SendIcon
                size={28}
                color={
                  !draft.trim() || commentComposerLocked ? '#D5C9FF' : tokens.color.primary
                }
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
