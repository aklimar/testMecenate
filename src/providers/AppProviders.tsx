import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { observer } from 'mobx-react-lite';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { buildRealtimeWsUrl, parseWsMessage, shouldApplyWsLikeUpdate } from '../api/realtime';
import { upsertCommentInCache } from '../query/commentCache';
import { patchPostInFeedQueries } from '../query/patchFeedPost';
import { rootStore } from '../stores/rootStore';

const RealtimeSync = observer(function RealtimeSync({ queryClient }: { queryClient: QueryClient }) {
  const sessionToken = rootStore.session.token;

  useEffect(() => {
    const url = buildRealtimeWsUrl(sessionToken);
    if (!url) {
      rootStore.realtime.disconnect('idle');
      return;
    }

    rootStore.realtime.connect(url, {
      parseMessage: parseWsMessage,
      onMessage: (msg) => {
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
      },
    });

    return () => {
      rootStore.realtime.disconnect();
    };
  }, [queryClient, sessionToken]);

  return null;
});

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 60_000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeSync queryClient={queryClient} />
      {children}
    </QueryClientProvider>
  );
}
