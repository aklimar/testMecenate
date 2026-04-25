import { StyleSheet, View } from 'react-native';
import { tokens } from '../theme/tokens';

const t = tokens;
const bone = t.color.border;

export function PostCardSkeleton() {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Загрузка публикации"
      style={styles.card}
    >
      <View style={styles.skelRow}>
        <View style={styles.skelAv} />
        <View style={styles.skelTitleBox}>
          <View style={styles.skelLineSm} />
        </View>
      </View>
      <View style={styles.skelMedia} />
      <View style={styles.skelBody}>
        <View style={styles.skelLineLg} />
        <View style={styles.skelGapXs}>
          <View style={styles.skelLineFull} />
          <View style={styles.skelLine92} />
        </View>
        <View style={styles.skelPillsRow}>
          <View style={styles.skelPillA} />
          <View style={styles.skelPillB} />
        </View>
      </View>
    </View>
  );
}

function CommentRowSkeleton() {
  return (
    <View style={styles.commentSkelRow}>
      <View style={styles.skelAv} />
      <View style={styles.skelCol}>
        <View style={styles.skelCmtTitle} />
        <View style={styles.skelCmtL1} />
        <View style={styles.skelCmtL2} />
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
    <View style={styles.sectTitleSkel}>
      <View style={styles.skelSectW} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', borderRadius: t.radius.md, borderWidth: 1, borderColor: t.color.border, backgroundColor: t.color.surface },
  skelRow: { flexDirection: 'row', alignItems: 'center', gap: t.space.sm, paddingHorizontal: t.space.md, paddingTop: t.space.md, paddingBottom: t.space.sm },
  skelAv: { width: t.size.avatar, height: t.size.avatar, borderRadius: t.size.avatar / 2, backgroundColor: bone },
  skelTitleBox: { minWidth: 0, flex: 1 },
  skelLineSm: { width: '55%', height: 16, borderRadius: t.radius.sm, backgroundColor: bone },
  skelMedia: { width: '100%', overflow: 'hidden', aspectRatio: 16 / 9, backgroundColor: bone },
  skelBody: { gap: t.space.md, paddingHorizontal: t.space.md, paddingTop: t.space.md, paddingBottom: t.space.md },
  skelLineLg: { width: '70%', height: 22, borderRadius: t.radius.sm, backgroundColor: bone },
  skelGapXs: { gap: t.space.xs },
  skelLineFull: { width: '100%', height: 14, borderRadius: 7, backgroundColor: bone },
  skelLine92: { width: '92%', height: 14, borderRadius: 7, backgroundColor: bone },
  skelPillsRow: { flexDirection: 'row', gap: t.space.sm, paddingTop: t.space.xs },
  skelPillA: { width: 72, height: 36, borderRadius: t.radius.full, backgroundColor: bone },
  skelPillB: { width: 56, height: 36, borderRadius: t.radius.full, backgroundColor: bone },
  commentSkelRow: { flexDirection: 'row', gap: t.space.sm, borderBottomWidth: 1, borderBottomColor: t.color.border, paddingHorizontal: t.space.md, paddingVertical: t.space.md },
  skelCol: { minWidth: 0, flex: 1, gap: t.space.sm },
  skelCmtTitle: { width: '45%', height: 14, borderRadius: 7, backgroundColor: bone },
  skelCmtL1: { width: '100%', height: 12, borderRadius: t.radius.sm, backgroundColor: bone },
  skelCmtL2: { width: '78%', height: 12, borderRadius: t.radius.sm, backgroundColor: bone },
  sectTitleSkel: { borderBottomWidth: 1, borderBottomColor: t.color.border, backgroundColor: t.color.background, paddingHorizontal: t.space.md, paddingTop: t.space.lg, paddingBottom: t.space.sm },
  skelSectW: { width: 140, height: 14, borderRadius: 7, backgroundColor: bone },
});
