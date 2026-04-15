import { usePostsRealtime } from '../hooks/usePostsRealtime';

export function RealtimeBridge() {
  usePostsRealtime();
  return null;
}
