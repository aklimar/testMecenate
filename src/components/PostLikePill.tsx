import { useEffect, useRef } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LikeIcon } from './icons/LikeIcon';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const LIKED_BG = '#FF2B75';
const LIKED_FG = '#FFFFFF';

const GAP = 4;
const ROW = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: GAP,
  borderRadius: 9999,
  paddingHorizontal: 12,
  paddingVertical: 8,
};

const COUNT_FONT = {
  fontSize: 14,
  fontWeight: '500' as const,
  padding: 0,
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
  const countSv = useSharedValue(likesCount);
  const likedSv = useSharedValue(isLiked ? 1 : 0);
  const prevLikesCountRef = useRef(likesCount);
  const prevLikedRef = useRef(isLiked);

  useEffect(() => {
    if (prevLikesCountRef.current === likesCount) return;
    prevLikesCountRef.current = likesCount;
    countSv.value = withTiming(likesCount, { duration: 320 });
  }, [likesCount, countSv]);

  useEffect(() => {
    if (prevLikedRef.current === isLiked) return;
    prevLikedRef.current = isLiked;
    likedSv.value = withTiming(isLiked ? 1 : 0, { duration: 260 });
  }, [isLiked, likedSv]);

  const pillAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(likedSv.value, [0, 1], [pillBg, LIKED_BG]),
  }));

  const countColorStyle = useAnimatedStyle(() => ({
    color: interpolateColor(likedSv.value, [0, 1], [pillFg, LIKED_FG]),
  }));

  const outlineIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - likedSv.value,
  }));

  const filledIconStyle = useAnimatedStyle(() => ({
    opacity: likedSv.value,
  }));

  const animatedCountProps = useAnimatedProps(() => {
    const n = Math.round(countSv.value);
    return {
      text: String(n),
      defaultValue: String(n),
    };
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isLiked ? 'Убрать лайк' : 'Лайк'}
      accessibilityState={{ disabled: disabled ?? false, selected: isLiked }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
    >
      <Animated.View style={[ROW, pillAnimatedStyle]}>
        <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={[{ position: 'absolute' }, outlineIconStyle]} pointerEvents="none">
            <LikeIcon size={24} color={pillFg} />
          </Animated.View>
          <Animated.View style={[{ position: 'absolute' }, filledIconStyle]} pointerEvents="none">
            <LikeIcon size={24} color={LIKED_FG} filled />
          </Animated.View>
        </View>
        <AnimatedTextInput
          editable={false}
          defaultValue={String(likesCount)}
          animatedProps={animatedCountProps}
          style={[COUNT_FONT, countColorStyle]}
          underlineColorAndroid="transparent"
          caretHidden
          pointerEvents="none"
        />
      </Animated.View>
    </Pressable>
  );
}
