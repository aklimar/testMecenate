import type { Post, PostAuthor } from './post';

export interface Comment {
  id: string;
  postId: string;
  author: PostAuthor;
  text: string;
  createdAt: string;
}

export interface CommentsPageData {
  comments: Comment[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CommentsListResponse {
  ok: true;
  data: CommentsPageData;
}

export interface CommentsListErrorBody {
  ok: false;
  error?: { code: string; message: string };
}

export interface PostDetailData {
  post: Post;
}

export interface PostDetailResponse {
  ok: true;
  data: PostDetailData;
}

export interface PostDetailErrorBody {
  ok: false;
  error?: { code: string; message: string };
}

export interface AddCommentResponse {
  ok: true;
  data: { comment: Comment };
}

export interface AddCommentErrorBody {
  ok: false;
  error?: { code: string; message: string };
}
