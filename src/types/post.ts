export type PostTier = 'free' | 'paid';

export type PostsFeedTierFilter = 'all' | PostTier;

export interface PostAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  subscribersCount: number;
  isVerified: boolean;
}

export interface Post {
  id: string;
  author: PostAuthor;
  title: string;
  body: string;
  preview: string;
  coverUrl: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  tier: PostTier;
  createdAt: string;
}

export interface PostsFeedData {
  posts: Post[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface PostsFeedResponse {
  ok: true;
  data: PostsFeedData;
}

export interface PostsFeedErrorBody {
  ok: false;
  error?: {
    code: string;
    message: string;
  };
}

export type FetchPostsFeedParams = {
  limit?: number;
  cursor?: string;
  tier: PostsFeedTierFilter;
};

export interface PostLikeToggleData {
  isLiked: boolean;
  likesCount: number;
}

export interface PostLikeToggleResponse {
  ok: true;
  data: PostLikeToggleData;
}

export interface PostLikeToggleErrorBody {
  ok: false;
  error?: {
    code: string;
    message: string;
  };
}
