import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import type { ImageStyle } from 'react-native';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Post } from '../types/post';
import { tokens } from '../theme/tokens';
import { CommentIcon } from './icons/CommentIcon';
import { PayIcon } from './icons/PayIcon';
import { PostLikePill } from './PostLikePill';

const t = tokens;

type Props = {
  post: Post;
  onLikePress?: () => void;
  isLikeBusy?: boolean;
  layout?: 'feed' | 'detail';
  onCardPress?: () => void;
};

function PaidPostTextSkeleton() {
  const bone = t.color.border;
  return (
    <View accessibilityLabel="Содержимое поста скрыто" accessibilityRole="progressbar" style={styles.skeletonTextCol}>
      <View style={styles.skeletonBlockGap}>
        <View style={{ width: '35%', height: 20, borderRadius: 22, backgroundColor: bone }} />
      </View>
      <View style={styles.skeletonBlockGap}>
        <View style={{ width: '100%', height: 30, borderRadius: 22, backgroundColor: bone }} />
      </View>
    </View>
  );
}

export function PostCard({ post, onLikePress, isLikeBusy, layout = 'feed', onCardPress }: Props) {
  const isPaid = post.tier === 'paid';

  const previewTrim = !isPaid ? post.preview.trim() : '';
  const bodyTrim = !isPaid ? post.body.trim() : '';

  const collapsedText = previewTrim || bodyTrim;
  const expandedText = bodyTrim || collapsedText;
  const hasDistinctBody = !!previewTrim && !!bodyTrim && bodyTrim !== previewTrim;

  const [descExpanded, setDescExpanded] = useState(false);
  const [collapsedTruncated, setCollapsedTruncated] = useState(false);
  const [descWidth, setDescWidth] = useState(0);

  const showExpandControl = !!collapsedText && (hasDistinctBody || collapsedTruncated);

  useEffect(() => {
    setDescExpanded(false);
    setCollapsedTruncated(false);
    setDescWidth(0);
  }, [post.id, previewTrim, bodyTrim]);

  const pillBg = t.color.pillBackground;
  const pillFg = t.color.pillForeground;

  const descriptionBlock = (
    <View style={styles.descBlockOuter}>
      {isPaid ? (
        <PaidPostTextSkeleton />
      ) : layout === 'detail' ? (
        <>
          <Text style={styles.titleLgBold}>{post.title}</Text>
          {expandedText ? <Text style={styles.bodySm}>{expandedText}</Text> : null}
        </>
      ) : (
        <>
          <Text style={styles.titleLgBold} numberOfLines={2}>
            {post.title}
          </Text>

          {collapsedText ? (
            <View
              onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                if (w > 0 && w !== descWidth) setDescWidth(w);
              }}
            >
              {descWidth > 0 ? (
                <Text
                  accessible={false}
                  style={[styles.bodySm, styles.measureHidden, { width: descWidth }]}
                  pointerEvents="none"
                  onTextLayout={(e) => setCollapsedTruncated(e.nativeEvent.lines.length > 2)}
                >
                  {collapsedText}
                </Text>
              ) : null}
              {!descExpanded ? (
                <>
                  <View style={styles.wFullOver}>
                    <Text style={styles.bodySm} ellipsizeMode="tail" numberOfLines={2}>
                      {collapsedText}
                    </Text>
                  </View>
                  {showExpandControl ? (
                    <Pressable
                      accessibilityRole="button"
                      style={({ pressed }) => [styles.linkBtn, { opacity: pressed ? t.opacity.pressed : 1 }]}
                      onPress={() => setDescExpanded(true)}
                    >
                      <Text style={styles.linkText}>Показать ещё</Text>
                    </Pressable>
                  ) : null}
                </>
              ) : (
                <>
                  <Text style={styles.bodySm}>{expandedText}</Text>
                  {showExpandControl ? (
                    <Pressable
                      style={({ pressed }) => [styles.linkBtn, { opacity: pressed ? t.opacity.pressed : 1 }]}
                      onPress={() => setDescExpanded(false)}
                    >
                      <Text style={styles.linkText}>Свернуть</Text>
                    </Pressable>
                  ) : null}
                </>
              )}
            </View>
          ) : null}
        </>
      )}
    </View>
  );

  const commentPillInner = (
    <>
      <CommentIcon color={pillFg} />
      <Text style={[styles.pillCount, { color: pillFg }]}>{post.commentsCount}</Text>
    </>
  );

  const buildActionsRow = (onCommentPillPress?: () => void) =>
    !isPaid ? (
      <View style={styles.actionsRow}>
        <PostLikePill
          likesCount={post.likesCount}
          isLiked={post.isLiked}
          disabled={!onLikePress || isLikeBusy}
          onPress={onLikePress}
          pillBg={pillBg}
          pillFg={pillFg}
        />
        {onCommentPillPress === undefined ? (
          <View style={[styles.pillRow, { backgroundColor: pillBg }]}>{commentPillInner}</View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Комментарии, открыть публикацию"
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            style={({ pressed }) => [styles.pillRow, { backgroundColor: pillBg, opacity: pressed ? t.opacity.pressed : 1 }]}
            onPress={onCommentPillPress}
          >
            {commentPillInner}
          </Pressable>
        )}
      </View>
    ) : null;

  const headerAndCover = (
    <>
      <View style={styles.headerRow}>
        <Image
          source={{ uri: post.author.avatarUrl }}
          style={styles.avatar as ImageStyle}
          contentFit="cover"
        />
        <Text style={styles.authorName} numberOfLines={1}>
          {post.author.displayName}
        </Text>
      </View>

      <View style={styles.coverWrap}>
        <Image
          source={{ uri: post.coverUrl }}
          style={styles.coverImg as ImageStyle}
          contentFit="cover"
          transition={200}
        />
        {isPaid ? (
          <>
            <BlurView
              intensity={Platform.OS === 'ios' ? 55 : 8}
              tint="systemMaterialLight"
              blurReductionFactor={2}
              experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : 'none'}
              style={StyleSheet.absoluteFill}
            />
            <View style={[StyleSheet.absoluteFill, styles.paidOverlay]} pointerEvents="box-none">
              <View style={styles.paidCol}>
                <View pointerEvents="none">
                  <PayIcon size={56} />
                </View>
                <View style={styles.scrimBox}>
                  <Text style={styles.scrimText}>
                    Контент скрыт пользователем.{'\n'}Доступ откроется после доната
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Отправить донат"
                  style={({ pressed }) => [styles.donateBtn, { opacity: pressed ? t.opacity.pressed : 1 }]}
                  onPress={() => {}}
                >
                  <Text style={styles.donateBtnText}>Отправить донат</Text>
                </Pressable>
              </View>
            </View>
          </>
        ) : null}
      </View>
    </>
  );

  if (onCardPress && !isPaid) {
    const feedActionsRow = buildActionsRow(onCardPress);
    return (
      <View style={styles.card}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Открыть публикацию"
          onPress={onCardPress}
          style={({ pressed }) => ({ opacity: pressed ? t.opacity.cardPress : 1 })}
        >
          {headerAndCover}
          <View style={styles.bodyFeed}>{descriptionBlock}</View>
        </Pressable>
        {feedActionsRow ? <View style={styles.bodyActions}>{feedActionsRow}</View> : null}
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {headerAndCover}
      <View style={styles.bodyStack}>
        {descriptionBlock}
        {buildActionsRow()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.color.border,
    backgroundColor: t.color.surface,
  },
  skeletonTextCol: { gap: t.space.sm },
  skeletonBlockGap: { gap: t.space.xs },
  descBlockOuter: { marginBottom: t.space.md },
  titleLgBold: {
    ...t.typography.titleLgBold,
    color: t.color.foreground,
    marginBottom: t.space.xs,
  },
  bodySm: {
    ...t.typography.caption,
    color: t.color.secondary,
  },
  measureHidden: { position: 'absolute', opacity: 0 },
  wFullOver: { width: '100%', overflow: 'hidden' },
  linkBtn: { marginTop: t.space.xs, alignSelf: 'flex-start' },
  linkText: {
    ...t.typography.captionSemibold,
    color: t.color.primary,
  },
  pillCount: {
    ...t.typography.captionMedium,
  },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: t.space.sm },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space.xs,
    borderRadius: t.radius.full,
    paddingHorizontal: t.space.md,
    paddingVertical: t.space.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space.sm,
    paddingHorizontal: t.space.md,
    paddingTop: t.space.md,
    paddingBottom: t.space.sm,
  },
  avatar: {
    width: t.size.avatar,
    height: t.size.avatar,
    borderRadius: t.size.avatar / 2,
  },
  authorName: {
    ...t.typography.bodySemibold,
    minWidth: 0,
    flex: 1,
    color: t.color.foreground,
  },
  coverWrap: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
    aspectRatio: 16 / 9,
  },
  coverImg: { width: '100%', height: '100%' },
  paidOverlay: { justifyContent: 'center', zIndex: 1, paddingHorizontal: t.space.md, paddingVertical: t.space.md },
  paidCol: { alignItems: 'center', gap: t.space.md },
  scrimBox: {
    borderRadius: t.radius.lg,
    backgroundColor: t.color.overlayScrim,
    paddingHorizontal: t.space.md,
    paddingVertical: t.space.sm,
  },
  scrimText: {
    ...t.typography.body,
    textAlign: 'center',
    color: t.color.onDark,
  },
  donateBtn: {
    borderRadius: t.radius.lg,
    backgroundColor: t.color.primary,
    paddingHorizontal: t.space.md,
    paddingVertical: t.space.md,
  },
  donateBtnText: {
    ...t.typography.bodySemibold,
    textAlign: 'center',
    color: t.color.primaryForeground,
  },
  bodyFeed: { paddingHorizontal: t.space.md, paddingTop: t.space.md, paddingBottom: t.space.sm },
  bodyActions: { paddingHorizontal: t.space.md, paddingTop: 0, paddingBottom: t.space.md },
  bodyStack: { paddingHorizontal: t.space.md, paddingBottom: t.space.md, paddingTop: t.space.md },
});
