import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import type { Comment, CommentsPageData } from '../types/comment';
import type { Post } from '../types/post';
import { patchPostInFeedQueries } from './patchFeedPost';

export function upsertCommentInCache(queryClient: QueryClient, postId: string, comment: Comment) {
  let isNew = false;
  queryClient.setQueryData<InfiniteData<CommentsPageData>>(['postComments', postId], (old) => {
    if (!old?.pages?.length) {
      isNew = true;
      return {
        pageParams: [undefined],
        pages: [{ comments: [comment], nextCursor: null, hasMore: false }],
      };
    }
    const exists = old.pages.some((p) => p.comments.some((c) => c.id === comment.id));
    if (exists) return old;
    isNew = true;
    const [first, ...rest] = old.pages;
    return {
      ...old,
      pages: [{ ...first, comments: [comment, ...first.comments] }, ...rest],
    };
  });
  if (isNew) {
    patchPostInFeedQueries(queryClient, postId, (p) => ({
      ...p,
      commentsCount: p.commentsCount + 1,
    }));
    queryClient.setQueryData<Post>(['post', postId], (old) =>
      old ? { ...old, commentsCount: old.commentsCount + 1 } : old
    );
  }
}
