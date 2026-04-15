import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useSyncExternalStore } from 'react';
import { getRealtimeWsUrl, parseWsMessage, shouldApplyWsLikeUpdate } from '../api/realtime';
import { getSessionBearerToken, subscribeSessionBearer } from '../api/sessionToken';
import { upsertCommentInCache } from '../query/commentCache';
import { patchPostInFeedQueries } from '../query/patchFeedPost';

export function usePostsRealtime() {
  const queryClient = useQueryClient();
  const sessionKey = useSyncExternalStore(
    subscribeSessionBearer,
    () => getSessionBearerToken() ?? '',
    () => getSessionBearerToken() ?? ''
  );

  useEffect(() => {
    const url = getRealtimeWsUrl();
    if (!url) return;

    let ws: WebSocket | null = null;
    let stopped = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      ws = new WebSocket(url);

      ws.onmessage = (ev) => {
        const msg = parseWsMessage(String(ev.data));
        switch (msg.kind) {
          case 'like_updated':
            if (!shouldApplyWsLikeUpdate(msg.postId)) break;
            patchPostInFeedQueries(queryClient, msg.postId, (p) => ({ ...p, likesCount: msg.likesCount }));
            break;
          case 'comment_added':
            upsertCommentInCache(queryClient, msg.postId, msg.comment);
            break;
          case 'ping':
          case 'unknown':
          default:
            break;
        }
      };

      ws.onclose = () => {
        if (stopped) return;
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();

    return () => {
      stopped = true;
      if (reconnectTimer !== undefined) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [queryClient, sessionKey]);
}
