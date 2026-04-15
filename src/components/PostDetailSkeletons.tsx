import { View } from 'react-native';
import { tokens } from '../theme/tokens';

const bone = tokens.color.border;

export function PostCardSkeleton() {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Загрузка публикации"
      className="overflow-hidden rounded-md border border-border bg-surface"
    >
      <View className="flex-row items-center gap-sm px-md pb-sm pt-md">
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: bone }} />
        <View className="min-w-0 flex-1">
          <View style={{ width: '55%', height: 16, borderRadius: 8, backgroundColor: bone }} />
        </View>
      </View>
      <View className="w-full overflow-hidden" style={{ aspectRatio: 16 / 9, backgroundColor: bone }} />
      <View className="gap-md px-md pb-md pt-md">
        <View style={{ width: '70%', height: 22, borderRadius: 8, backgroundColor: bone }} />
        <View className="gap-xs">
          <View style={{ width: '100%', height: 14, borderRadius: 7, backgroundColor: bone }} />
          <View style={{ width: '92%', height: 14, borderRadius: 7, backgroundColor: bone }} />
        </View>
        <View className="flex-row gap-sm pt-xs">
          <View style={{ width: 72, height: 36, borderRadius: 9999, backgroundColor: bone }} />
          <View style={{ width: 56, height: 36, borderRadius: 9999, backgroundColor: bone }} />
        </View>
      </View>
    </View>
  );
}

function CommentRowSkeleton() {
  return (
    <View className="flex-row gap-sm border-b border-border px-md py-md">
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: bone }} />
      <View className="min-w-0 flex-1 gap-sm">
        <View style={{ width: '45%', height: 14, borderRadius: 7, backgroundColor: bone }} />
        <View style={{ width: '100%', height: 12, borderRadius: 6, backgroundColor: bone }} />
        <View style={{ width: '78%', height: 12, borderRadius: 6, backgroundColor: bone }} />
      </View>
    </View>
  );
}

export function CommentsSkeletonList({ count = 6 }: { count?: number }) {
  return (
    <View accessibilityRole="progressbar" accessibilityLabel="Загрузка комментариев">
      {Array.from({ length: count }, (_, i) => (
        <CommentRowSkeleton key={i} />
      ))}
    </View>
  );
}

export function PostCommentsSectionTitleSkeleton() {
  return (
    <View className="border-b border-border bg-background px-md pb-sm pt-lg">
      <View style={{ width: 140, height: 14, borderRadius: 7, backgroundColor: bone }} />
    </View>
  );
}
