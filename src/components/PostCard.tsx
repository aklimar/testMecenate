import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Post } from '../types/post';
import { tokens } from '../theme/tokens';
import { CommentIcon } from './icons/CommentIcon';
import { PayIcon } from './icons/PayIcon';
import { PostLikePill } from './PostLikePill';

type Props = {
  post: Post;
  onLikePress?: () => void;
  isLikeBusy?: boolean;
  layout?: 'feed' | 'detail';
  onCardPress?: () => void;
};

function PaidPostTextSkeleton() {
  const bone = tokens.color.border;
  return (
    <View
      accessibilityLabel="Содержимое поста скрыто"
      accessibilityRole="progressbar"
      className="gap-sm"
    >
      <View className="gap-xs">
        <View style={{ width: '35%', height: 20, borderRadius: 22, backgroundColor: bone }} />
      </View>
      <View className="gap-xs">
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

  const pillBg = tokens.color.pillBackground;
  const pillFg = tokens.color.pillForeground;

  const descriptionBlock = (
    <View className="mb-md">
      {isPaid ? (
        <PaidPostTextSkeleton />
      ) : layout === 'detail' ? (
        <>
          <Text className="mb-xs text-lg font-bold text-foreground">{post.title}</Text>
          {expandedText ? <Text className="text-sm text-secondary">{expandedText}</Text> : null}
        </>
      ) : (
        <>
          <Text className="mb-xs text-lg font-bold text-foreground" numberOfLines={2}>
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
                  className="text-sm text-secondary"
                  pointerEvents="none"
                  style={{ position: 'absolute', opacity: 0, width: descWidth }}
                  onTextLayout={(e) => setCollapsedTruncated(e.nativeEvent.lines.length > 2)}
                >
                  {collapsedText}
                </Text>
              ) : null}
              {!descExpanded ? (
                <>
                  <View className="w-full overflow-hidden">
                    <Text className="text-sm text-secondary" ellipsizeMode="tail" numberOfLines={2}>
                      {collapsedText}
                    </Text>
                  </View>
                  {showExpandControl ? (
                    <Pressable
                      accessibilityRole="button"
                      className="mt-xs self-start"
                      onPress={() => setDescExpanded(true)}
                    >
                      <Text className="text-sm font-semibold text-primary">Показать ещё</Text>
                    </Pressable>
                  ) : null}
                </>
              ) : (
                <>
                  <Text className="text-sm text-secondary">{expandedText}</Text>
                  {showExpandControl ? (
                    <Pressable className="mt-xs self-start" onPress={() => setDescExpanded(false)}>
                      <Text className="text-sm font-semibold text-primary">Свернуть</Text>
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
      <Text className="text-sm font-medium" style={{ color: pillFg }}>
        {post.commentsCount}
      </Text>
    </>
  );

  const buildActionsRow = (onCommentPillPress?: () => void) =>
    !isPaid ? (
      <View className="flex-row gap-sm">
        <PostLikePill
          likesCount={post.likesCount}
          isLiked={post.isLiked}
          disabled={!onLikePress || isLikeBusy}
          onPress={onLikePress}
          pillBg={pillBg}
          pillFg={pillFg}
        />
        {onCommentPillPress === undefined ? (
          <View
            className="flex-row items-center gap-xs rounded-full px-md py-sm"
            style={{ backgroundColor: pillBg }}
          >
            {commentPillInner}
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Комментарии, открыть публикацию"
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            onPress={onCommentPillPress}
            className="flex-row items-center gap-xs rounded-full px-md py-sm active:opacity-90"
            style={{ backgroundColor: pillBg }}
          >
            {commentPillInner}
          </Pressable>
        )}
      </View>
    ) : null;

  const headerAndCover = (
    <>
      <View className="flex-row items-center gap-sm px-md pb-sm pt-md">
        <Image
          source={{ uri: post.author.avatarUrl }}
          style={{ width: 40, height: 40, borderRadius: 20 }}
          contentFit="cover"
        />
        <Text className="min-w-0 flex-1 text-base font-semibold text-foreground" numberOfLines={1}>
          {post.author.displayName}
        </Text>
      </View>

      <View className="relative w-full overflow-hidden" style={{ aspectRatio: 16 / 9 }}>
        <Image
          source={{ uri: post.coverUrl }}
          style={{ width: '100%', height: '100%' }}
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
            <View
              className="absolute inset-0 justify-center px-md py-md"
              pointerEvents="box-none"
              style={{ zIndex: 1 }}
            >
              <View className="items-center gap-md">
                <View pointerEvents="none">
                  <PayIcon size={56} />
                </View>
                <View className="rounded-lg bg-black/45 px-md py-sm">
                  <Text className="text-center text-base leading-5 text-white">
                    Контент скрыт пользователем.{'\n'}Доступ откроется после доната
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Отправить донат"
                  className="rounded-lg bg-primary px-md py-md active:opacity-90"
                  onPress={() => {}}
                >
                  <Text className="text-center text-base font-semibold text-primaryForeground">Отправить донат</Text>
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
      <View className="overflow-hidden rounded-md border border-border bg-surface">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Открыть публикацию"
          onPress={onCardPress}
          className="active:opacity-95"
        >
          {headerAndCover}
          <View className="px-md pt-md pb-sm">{descriptionBlock}</View>
        </Pressable>
        {feedActionsRow ? <View className="px-md pb-md pt-0">{feedActionsRow}</View> : null}
      </View>
    );
  }

  return (
    <View className="overflow-hidden rounded-md border border-border bg-surface">
      {headerAndCover}
      <View className="px-md pb-md pt-md">
        {descriptionBlock}
        {buildActionsRow()}
      </View>
    </View>
  );
}
