import type { Comment } from '../types/comment';
import type { PostAuthor } from '../types/post';
import { API_BASE } from './constants';
import { getSessionBearerToken } from './sessionToken';

function parsePostAuthor(raw: unknown): PostAuthor | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const a = raw as Record<string, unknown>;
  if (
    typeof a.id !== 'string' ||
    typeof a.username !== 'string' ||
    typeof a.displayName !== 'string' ||
    typeof a.avatarUrl !== 'string' ||
    typeof a.bio !== 'string' ||
    typeof a.subscribersCount !== 'number' ||
    typeof a.isVerified !== 'boolean'
  ) {
    return null;
  }
  return {
    id: a.id,
    username: a.username,
    displayName: a.displayName,
    avatarUrl: a.avatarUrl,
    bio: a.bio,
    subscribersCount: a.subscribersCount,
    isVerified: a.isVerified,
  };
}

export function parseCommentPayload(raw: unknown): Comment | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const c = raw as Record<string, unknown>;
  const author = parsePostAuthor(c.author);
  if (
    !author ||
    typeof c.id !== 'string' ||
    typeof c.postId !== 'string' ||
    typeof c.text !== 'string' ||
    typeof c.createdAt !== 'string'
  ) {
    return null;
  }
  return {
    id: c.id,
    postId: c.postId,
    author,
    text: c.text,
    createdAt: c.createdAt,
  };
}

export function getRealtimeWsUrl(): string | null {
  const token = getSessionBearerToken()?.trim();
  if (!token) return null;
  const wsOrigin = API_BASE.replace(/^https:/i, 'wss:').replace(/^http:/i, 'ws:');
  return `${wsOrigin}/ws?token=${encodeURIComponent(token)}`;
}

export type ParsedWsMessage =
  | { kind: 'ping' }
  | { kind: 'like_updated'; postId: string; likesCount: number }
  | { kind: 'comment_added'; postId: string; comment: Comment }
  | { kind: 'unknown' };

export function parseWsMessage(raw: string): ParsedWsMessage {
  try {
    const json = JSON.parse(raw) as Record<string, unknown>;
    const type = json.type ?? json.event;
    switch (type) {
      case 'ping':
        return { kind: 'ping' };
      case 'like_updated': {
        let postId: string | undefined;
        let likesCount: number | undefined;
        if (typeof json.postId === 'string') postId = json.postId;
        if (typeof json.likesCount === 'number') likesCount = json.likesCount;
        const payload = json.payload;
        if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
          const p = payload as Record<string, unknown>;
          if (typeof p.postId === 'string') postId = p.postId;
          if (typeof p.likesCount === 'number') likesCount = p.likesCount;
        }
        if (postId !== undefined && likesCount !== undefined) {
          return { kind: 'like_updated', postId, likesCount };
        }
        return { kind: 'unknown' };
      }
      case 'comment_added': {
        let postId: string | undefined =
          typeof json.postId === 'string' ? json.postId : undefined;
        let commentRaw: unknown = json.comment;
        const payload = json.payload;
        if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
          const p = payload as Record<string, unknown>;
          if (typeof p.postId === 'string') postId = p.postId;
          if ('comment' in p) commentRaw = p.comment;
        }
        const comment = parseCommentPayload(commentRaw);
        if (comment !== null) {
          const pid = postId ?? comment.postId;
          return { kind: 'comment_added', postId: pid, comment };
        }
        return { kind: 'unknown' };
      }
      default:
        return { kind: 'unknown' };
    }
  } catch {
    return { kind: 'unknown' };
  }
}

const lastLocalLikeTouchAt = new Map<string, number>();
const IGNORE_WS_LIKE_MS = 3000;

export function markPostLikeSyncedFromServer(postId: string) {
  lastLocalLikeTouchAt.set(postId, Date.now());
}

export function clearPostLikeWsGrace(postId: string) {
  lastLocalLikeTouchAt.delete(postId);
}

export function shouldApplyWsLikeUpdate(postId: string): boolean {
  const t = lastLocalLikeTouchAt.get(postId);
  if (t === undefined) return true;
  const elapsed = Date.now() - t;
  if (elapsed > IGNORE_WS_LIKE_MS) {
    lastLocalLikeTouchAt.delete(postId);
    return true;
  }
  return false;
}
