import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { POSTS_PAGE_SIZE } from '../api/constants';
import { fetchPostsFeed, togglePostLike } from '../api/posts';
import { clearSessionBearerToken } from '../api/sessionToken';
import {
  clearPostLikeWsGrace,
  markPostLikeSyncedFromServer,
} from '../api/realtime';
import { NotFoundIcon } from '../components/icons/NotFoundIcon';
import { PostCard } from '../components/PostCard';
import type { RootStackParamList } from '../navigation/types';
import { patchPostInFeedQueries } from '../query/patchFeedPost';
import type { Post, PostsFeedTierFilter } from '../types/post';
import { tokens } from '../theme/tokens';

const POST_GAP = 12;
const SEGMENT_RADIUS = 22;
const SEGMENT_PAD = 10;

type FeedNav = NativeStackNavigationProp<RootStackParamList, 'Feed'>;

function feedTierToSegmentIndex(filter: PostsFeedTierFilter): number {
  switch (filter) {
    case 'all':
      return 0;
    case 'free':
      return 1;
    case 'paid':
      return 2;
    default:
      return 0;
  }
}

function PublicationsLoadFail({ onRefresh }: { onRefresh: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-lg">
      <NotFoundIcon size={112} />
      <Text className="mt-md text-center text-base text-foreground">Не удалось загрузить публикации</Text>
      <Pressable className="mt-md rounded-lg bg-primary px-lg py-md" onPress={onRefresh}>
        <Text className="font-semibold text-primaryForeground">Обновить</Text>
      </Pressable>
    </View>
  );
}

export function FeedScreen() {
  const [tier, setTier] = useState<PostsFeedTierFilter>('all');
  const queryClient = useQueryClient();
  const navigation = useNavigation<FeedNav>();

  const toggleLike = useMutation({
    mutationFn: togglePostLike,
    onMutate: async (postId) => {
      markPostLikeSyncedFromServer(postId);
      await queryClient.cancelQueries({ queryKey: ['posts', 'feed'], exact: false });
      const snapshots = queryClient.getQueriesData({ queryKey: ['posts', 'feed'], exact: false });
      patchPostInFeedQueries(queryClient, postId, (p) => ({
        ...p,
        isLiked: !p.isLiked,
        likesCount: p.isLiked ? Math.max(0, p.likesCount - 1) : p.likesCount + 1,
      }));
      return { snapshots };
    },
    onError: (_err, postId, context) => {
      clearPostLikeWsGrace(postId);
      context?.snapshots.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSuccess: (data, postId) => {
      patchPostInFeedQueries(queryClient, postId, (p) => ({
        ...p,
        isLiked: data.isLiked,
        likesCount: data.likesCount,
      }));
      markPostLikeSyncedFromServer(postId);
    },
  });

  const query = useInfiniteQuery({
    queryKey: ['posts', 'feed', tier],
    queryFn: ({ pageParam }) =>
      fetchPostsFeed({
        limit: POSTS_PAGE_SIZE,
        cursor: pageParam,
        tier,
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

  const posts = useMemo(() => query.data?.pages.flatMap((p) => p.posts) ?? [], [query.data?.pages]);

  const onTierChange = useCallback((index: number) => {
    switch (index) {
      case 0:
        setTier('all');
        break;
      case 1:
        setTier('free');
        break;
      case 2:
        setTier('paid');
        break;
      default:
        setTier('all');
    }
  }, []);

  const onEndReached = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [query]);

  const renderItem: ListRenderItem<Post> = useCallback(
    ({ item }) => {
      switch (item.tier) {
        case 'paid':
          return (
            <PostCard
              post={item}
              onLikePress={() => toggleLike.mutate(item.id)}
              isLikeBusy={toggleLike.isPending && toggleLike.variables === item.id}
            />
          );
        case 'free':
        default:
          return (
            <PostCard
              post={item}
              onLikePress={() => toggleLike.mutate(item.id)}
              isLikeBusy={toggleLike.isPending && toggleLike.variables === item.id}
              onCardPress={() => navigation.navigate('PostDetail', { postId: item.id })}
            />
          );
      }
    },
    [navigation, toggleLike]
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="border-b border-border px-md py-sm">
        <View className="mb-sm min-h-[44px] flex-row items-center justify-between gap-sm">
          <Text className="text-xl font-bold leading-tight text-foreground">Лента</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Выйти"
            hitSlop={8}
            onPress={() => {
              clearSessionBearerToken();
              queryClient.clear();
              navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
            }}
            className="rounded-lg bg-danger px-md py-sm active:opacity-90"
          >
            <Text className="text-base font-semibold leading-tight text-primaryForeground">Выйти</Text>
          </Pressable>
        </View>
        <SegmentedControl
          values={['Все', 'Бесплатные', 'Платные']}
          selectedIndex={feedTierToSegmentIndex(tier)}
          onChange={(e) => onTierChange(e.nativeEvent.selectedSegmentIndex)}
          appearance="light"
          backgroundColor={tokens.color.surface}
          tintColor={tokens.color.primary}
          fontStyle={{
            color: tokens.color.segmentInactive,
            fontSize: 14,
            fontWeight: '500',
          }}
          activeFontStyle={{
            color: tokens.color.primaryForeground,
            fontSize: 14,
            fontWeight: '600',
          }}
          style={{
            borderRadius: SEGMENT_RADIUS,
            height: SEGMENT_PAD * 2 + 28,
          }}
          sliderStyle={{
            borderRadius: SEGMENT_RADIUS,
          }}
          tabStyle={{
            paddingVertical: SEGMENT_PAD,
            paddingHorizontal: SEGMENT_PAD,
          }}
        />
      </View>

      {query.isError ? (
        <PublicationsLoadFail onRefresh={() => query.refetch()} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: POST_GAP }} />}
          contentContainerStyle={{ flexGrow: 1, paddingTop: POST_GAP, paddingBottom: 48 }}
          className="bg-background"
          refreshControl={
            <RefreshControl refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => query.refetch()} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.35}
          ListEmptyComponent={
            query.isPending ? (
              <View className="items-center px-md py-2xl">
                <ActivityIndicator size="large" />
                <Text className="mt-md text-sm text-muted">Загрузка...</Text>
              </View>
            ) : (
              <PublicationsLoadFail onRefresh={() => query.refetch()} />
            )
          }
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <View className="py-lg">
                <ActivityIndicator />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
