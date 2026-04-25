import { useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LikeIcon } from './icons/LikeIcon';
import { tokens } from '../theme/tokens';

const t = tokens;

const ROW = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: t.space.xs,
  borderRadius: t.radius.full,
  paddingHorizontal: t.space.md,
  paddingVertical: t.space.sm,
};

const COUNT_FONT = {
  ...t.typography.captionMedium,
  height: t.lineHeight.sm,
  padding: 0,
  paddingVertical: 0,
  margin: 0,
  borderWidth: 0,
  minWidth: 10,
  ...(Platform.OS === 'android' ? { includeFontPadding: false as const, textAlignVertical: 'center' as const } : {}),
};

type Props = {
  likesCount: number;
  isLiked: boolean;
  disabled?: boolean;
  onPress?: () => void;
  pillBg: string;
  pillFg: string;
};

export function PostLikePill({ likesCount, isLiked, disabled, onPress, pillBg, pillFg }: Props) {
  const likedSv = useSharedValue(isLiked ? 1 : 0);
  const prevLikedRef = useRef(isLiked);

  useEffect(() => {
    if (prevLikedRef.current === isLiked) return;
    prevLikedRef.current = isLiked;
    likedSv.value = withTiming(isLiked ? 1 : 0, { duration: 260 });
  }, [isLiked, likedSv]);

  const pillAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(likedSv.value, [0, 1], [pillBg, t.color.like]),
  }));

  const countColorStyle = useAnimatedStyle(() => ({
    color: interpolateColor(likedSv.value, [0, 1], [pillFg, t.color.primaryForeground]),
  }));

  const outlineIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - likedSv.value,
  }));

  const filledIconStyle = useAnimatedStyle(() => ({
    opacity: likedSv.value,
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isLiked ? 'Убрать лайк' : 'Лайк'}
      accessibilityState={{ disabled: disabled ?? false, selected: isLiked }}
      disabled={disabled}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
    >
      <Animated.View style={[ROW, pillAnimatedStyle]}>
        <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={[{ position: 'absolute' }, outlineIconStyle]} pointerEvents="none">
            <LikeIcon size={24} color={pillFg} />
          </Animated.View>
          <Animated.View style={[{ position: 'absolute' }, filledIconStyle]} pointerEvents="none">
            <LikeIcon size={24} color={t.color.primaryForeground} filled />
          </Animated.View>
        </View>
        <Animated.Text style={[COUNT_FONT, countColorStyle]}>{likesCount}</Animated.Text>
      </Animated.View>
    </Pressable>
  );
}
