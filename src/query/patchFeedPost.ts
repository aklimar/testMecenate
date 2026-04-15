import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import type { Post, PostsFeedData } from '../types/post';

export function patchPostInFeedQueries(
  queryClient: QueryClient,
  postId: string,
  patch: (post: Post) => Post
) {
  queryClient.setQueriesData<InfiniteData<PostsFeedData>>(
    { queryKey: ['posts', 'feed'], exact: false },
    (old) => {
      if (!old?.pages) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          posts: page.posts.map((p) => (p.id === postId ? patch(p) : p)),
        })),
      };
    }
  );
}
