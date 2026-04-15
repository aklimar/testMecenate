import { COMMENTS_PAGE_SIZE, POSTS_PAGE_SIZE } from './constants';
import { api } from './client';
import type {
  AddCommentErrorBody,
  AddCommentResponse,
  Comment,
  CommentsListErrorBody,
  CommentsListResponse,
  CommentsPageData,
  PostDetailErrorBody,
  PostDetailResponse,
} from '../types/comment';
import type {
  FetchPostsFeedParams,
  Post,
  PostLikeToggleErrorBody,
  PostLikeToggleResponse,
  PostsFeedData,
  PostsFeedErrorBody,
  PostsFeedResponse,
} from '../types/post';

export async function fetchPostsFeed(params: FetchPostsFeedParams): Promise<PostsFeedData> {
  const limit = params.limit ?? POSTS_PAGE_SIZE;

  const query: Record<string, string | number> = { limit };
  switch (params.tier) {
    case 'free':
    case 'paid':
      query.tier = params.tier;
      break;
    case 'all':
    default:
      break;
  }
  if (params.cursor) {
    query.cursor = params.cursor;
  }

  const { data: json } = await api.get<PostsFeedResponse | PostsFeedErrorBody>('/posts', {
    params: query,
  });

  if (!json.ok) {
    const msg = json.error?.message ?? 'posts: ответ ok=false';
    throw new Error(msg);
  }

  return json.data;
}

export async function fetchPostById(postId: string): Promise<Post> {
  const { data: json } = await api.get<PostDetailResponse | PostDetailErrorBody>(
    `/posts/${encodeURIComponent(postId)}`
  );

  if (!json.ok) {
    const msg = json.error?.message ?? 'post: ответ ok=false';
    throw new Error(msg);
  }

  return json.data.post;
}

export async function fetchPostComments(
  postId: string,
  params: { limit?: number; cursor?: string }
): Promise<CommentsPageData> {
  const limit = params.limit ?? COMMENTS_PAGE_SIZE;
  const query: Record<string, string | number> = { limit };
  if (params.cursor) {
    query.cursor = params.cursor;
  }

  const { data: json } = await api.get<CommentsListResponse | CommentsListErrorBody>(
    `/posts/${encodeURIComponent(postId)}/comments`,
    { params: query }
  );

  if (!json.ok) {
    const msg = json.error?.message ?? 'comments: ответ ok=false';
    throw new Error(msg);
  }

  return json.data;
}

export async function addPostComment(postId: string, text: string): Promise<Comment> {
  const { data: json } = await api.post<AddCommentResponse | AddCommentErrorBody>(
    `/posts/${encodeURIComponent(postId)}/comments`,
    { text }
  );

  if (!json.ok) {
    const msg = json.error?.message ?? 'comment: ответ ok=false';
    throw new Error(msg);
  }

  return json.data.comment;
}

export async function togglePostLike(postId: string) {
  const { data: json } = await api.post<PostLikeToggleResponse | PostLikeToggleErrorBody>(
    `/posts/${encodeURIComponent(postId)}/like`
  );

  if (!json.ok) {
    const msg = json.error?.message ?? 'like: ответ ok=false';
    throw new Error(msg);
  }

  return json.data;
}
