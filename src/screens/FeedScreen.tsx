import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { observer } from 'mobx-react-lite';
import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { POSTS_PAGE_SIZE } from '../api/constants';
import { fetchPostsFeed, togglePostLike } from '../api/posts';
import { clearPostLikeWsGrace, markPostLikeSyncedFromServer } from '../api/realtime';
import { NotFoundIcon } from '../components/icons/NotFoundIcon';
import { PostCard } from '../components/PostCard';
import type { RootStackParamList } from '../navigation/types';
import { patchPostInFeedQueries } from '../query/patchFeedPost';
import { rootStore } from '../stores/rootStore';
import type { Post, PostsFeedTierFilter } from '../types/post';
import { tokens } from '../theme/tokens';

const t = tokens;

const POST_GAP = t.space.smMd;
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
    <View style={styles.failWrap}>
      <NotFoundIcon size={112} />
      <Text style={styles.failText}>Не удалось загрузить публикации</Text>
      <Pressable
        onPress={onRefresh}
        style={({ pressed }) => [styles.primaryBtnLg, { opacity: pressed ? t.opacity.pressed : 1 }]}
      >
        <Text style={styles.primaryBtnText}>Обновить</Text>
      </Pressable>
    </View>
  );
}

export const FeedScreen = observer(function FeedScreen() {
  const tier = rootStore.feed.tier;
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
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.toolbar}>
        <View style={styles.toolbarRow}>
          <Text style={styles.screenTitle}>Лента</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Выйти"
            hitSlop={8}
            onPress={() => {
              rootStore.session.clear();
              rootStore.feed.setTier('all');
              rootStore.realtime.disconnect('idle');
              queryClient.clear();
              navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
            }}
            style={({ pressed }) => [styles.dangerBtn, { opacity: pressed ? t.opacity.pressed : 1 }]}
          >
            <Text style={styles.dangerBtnText}>Выйти</Text>
          </Pressable>
        </View>
        <SegmentedControl
          values={['Все', 'Бесплатные', 'Платные']}
          selectedIndex={feedTierToSegmentIndex(tier)}
          onChange={(e) => rootStore.feed.setTierBySegmentIndex(e.nativeEvent.selectedSegmentIndex)}
          appearance="light"
          backgroundColor={t.color.surface}
          tintColor={t.color.primary}
          fontStyle={{
            ...t.typography.captionMedium,
            color: t.color.segmentInactive,
          }}
          activeFontStyle={{
            ...t.typography.captionSemibold,
            color: t.color.primaryForeground,
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
          contentContainerStyle={styles.listContent}
          style={styles.list}
          refreshControl={
            <RefreshControl refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => query.refetch()} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.35}
          ListEmptyComponent={
            query.isPending ? (
              <View style={styles.loadingBlock}>
                <ActivityIndicator size="large" />
                <Text style={styles.loadingText}>Загрузка...</Text>
              </View>
            ) : (
              <PublicationsLoadFail onRefresh={() => query.refetch()} />
            )
          }
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <View style={styles.footerPad}>
                <ActivityIndicator />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.color.background },
  toolbar: { borderBottomWidth: 1, borderBottomColor: t.color.border, paddingHorizontal: t.space.md, paddingVertical: t.space.sm },
  toolbarRow: {
    marginBottom: t.space.sm,
    minHeight: t.size.touchMin,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: t.space.sm,
  },
  screenTitle: {
    ...t.typography.title,
    color: t.color.foreground,
  },
  dangerBtn: {
    borderRadius: t.radius.lg,
    backgroundColor: t.color.danger,
    paddingHorizontal: t.space.md,
    paddingVertical: t.space.sm,
  },
  dangerBtnText: {
    ...t.typography.bodySemibold,
    color: t.color.primaryForeground,
  },
  list: { flex: 1, backgroundColor: t.color.background },
  listContent: { flexGrow: 1, paddingTop: POST_GAP, paddingBottom: t.space['2xl'] },
  failWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: t.space.lg },
  failText: {
    ...t.typography.body,
    marginTop: t.space.md,
    textAlign: 'center',
    color: t.color.foreground,
  },
  primaryBtnLg: {
    marginTop: t.space.md,
    borderRadius: t.radius.lg,
    backgroundColor: t.color.primary,
    paddingHorizontal: t.space.lg,
    paddingVertical: t.space.md,
  },
  primaryBtnText: {
    ...t.typography.bodySemibold,
    color: t.color.primaryForeground,
  },
  loadingBlock: { alignItems: 'center', paddingHorizontal: t.space.md, paddingVertical: t.space['2xl'] },
  loadingText: { ...t.typography.caption, marginTop: t.space.md, color: t.color.muted },
  footerPad: { paddingVertical: t.space.lg },
});
