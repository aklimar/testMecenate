import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useHeaderHeight } from '@react-navigation/elements';
import { useCallback, useMemo, useState } from 'react';
import type { ImageStyle } from 'react-native';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  ListRenderItem,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addPostComment, fetchPostById, fetchPostComments, togglePostLike } from '../api/posts';
import { clearPostLikeWsGrace, markPostLikeSyncedFromServer } from '../api/realtime';
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

const t = tokens;

type Props = NativeStackScreenProps<RootStackParamList, 'PostDetail'>;

function CommentRow({ item }: { item: Comment }) {
  return (
    <View style={styles.commentRow}>
      <Image
        source={{ uri: item.author.avatarUrl }}
        style={styles.commentAvatar as ImageStyle}
        contentFit="cover"
      />
      <View style={styles.commentBody}>
        <Text style={styles.commentAuthor}>{item.author.displayName}</Text>
        <Text style={styles.commentText}>{item.text}</Text>
      </View>
    </View>
  );
}

function LoadFail({ onRefresh }: { onRefresh: () => void }) {
  return (
    <View style={styles.loadFail}>
      <NotFoundIcon size={96} />
      <Text style={styles.loadFailText}>Не удалось загрузить публикацию</Text>
      <Pressable
        onPress={onRefresh}
        style={({ pressed }) => [styles.loadFailBtn, { opacity: pressed ? t.opacity.pressed : 1 }]}
      >
        <Text style={styles.loadFailBtnText}>Обновить</Text>
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

  const commentComposerLocked = postQuery.isPending || commentsQuery.isPending || addComment.isPending;

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
            <Text style={styles.commentsMeta}>
              {postQuery.data.commentsCount} комментариев
            </Text>
          </View>
        );
    }
  }, [postQuery.isPending, postQuery.isError, postQuery.data, postId, toggleLike]);

  if (postQuery.isError) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <LoadFail onRefresh={() => postQuery.refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
      >
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={renderComment}
          ListHeaderComponent={listHeader}
          contentContainerStyle={styles.listContent}
          style={styles.list}
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
              <Text style={styles.emptyCopy}>Пока нет комментариев</Text>
            )
          }
          ListFooterComponent={
            commentsQuery.isFetchingNextPage ? (
              <View style={styles.footerPad}>
                <ActivityIndicator />
              </View>
            ) : null
          }
        />
        <View style={styles.composerBar}>
          <View style={styles.composerRow}>
            <TextInput
              style={styles.input}
              placeholder="Ваш комментарий..."
              placeholderTextColor={t.color.muted}
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
              style={({ pressed }) => [
                styles.sendBtn,
                { opacity: pressed && draft.trim() && !commentComposerLocked ? t.opacity.pressed : 1 },
              ]}
            >
              <SendIcon
                size={28}
                color={!draft.trim() || commentComposerLocked ? t.color.primarySoft : t.color.primary}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.color.background },
  kav: { flex: 1 },
  list: { flex: 1, backgroundColor: t.color.background },
  listContent: { flexGrow: 1, paddingBottom: t.space.sm },
  commentRow: {
    flexDirection: 'row',
    gap: t.space.sm,
    borderBottomWidth: 1,
    borderBottomColor: t.color.border,
    paddingHorizontal: t.space.md,
    paddingVertical: t.space.md,
  },
  commentAvatar: { width: t.size.avatar, height: t.size.avatar, borderRadius: t.size.avatar / 2 },
  commentBody: { minWidth: 0, flex: 1 },
  commentAuthor: {
    ...t.typography.bodySemibold,
    color: t.color.foreground,
  },
  commentText: {
    ...t.typography.caption,
    marginTop: t.space.xs,
    color: t.color.secondary,
  },
  commentsMeta: {
    borderTopWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: t.color.border,
    backgroundColor: t.color.background,
    paddingHorizontal: t.space.md,
    paddingTop: t.space.lg,
    paddingBottom: t.space.sm,
    ...t.typography.captionMedium,
    color: t.color.secondary,
  },
  loadFail: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: t.space.lg, paddingVertical: t.space['2xl'] },
  loadFailText: {
    ...t.typography.body,
    marginTop: t.space.md,
    textAlign: 'center',
    color: t.color.foreground,
  },
  loadFailBtn: {
    marginTop: t.space.md,
    borderRadius: t.radius.lg,
    backgroundColor: t.color.primary,
    paddingHorizontal: t.space.lg,
    paddingVertical: t.space.md,
  },
  loadFailBtnText: { ...t.typography.bodySemibold, color: t.color.primaryForeground },
  emptyCopy: { ...t.typography.caption, paddingHorizontal: t.space.md, paddingVertical: t.space.lg, textAlign: 'center', color: t.color.muted },
  footerPad: { paddingVertical: t.space.md },
  composerBar: { borderTopWidth: 1, borderTopColor: t.color.border, backgroundColor: t.color.surface, paddingHorizontal: t.space.md, paddingVertical: t.space.sm },
  composerRow: { flexDirection: 'row', alignItems: 'center', gap: t.space.sm },
  input: {
    minHeight: t.size.touchMin,
    maxHeight: t.size.inputMaxHeight,
    flex: 1,
    borderRadius: t.radius.xl,
    borderWidth: 1,
    borderColor: t.color.border,
    backgroundColor: t.color.background,
    paddingHorizontal: t.space.md,
    paddingVertical: t.space.sm,
    ...t.typography.body,
    color: t.color.foreground,
  },
  sendBtn: {
    width: t.size.iconButton,
    height: t.size.iconButton,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: t.radius.full,
  },
});
