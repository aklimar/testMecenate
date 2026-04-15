import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setSessionBearerToken } from '../api/sessionToken';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-1 justify-center px-lg">
        <Text className="text-center text-2xl font-bold leading-8 text-foreground">
          Добро пожаловать, новый пользователь
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Войти"
          className="mt-2xl items-center rounded-xl bg-primary py-md active:opacity-90"
          onPress={() => {
            setSessionBearerToken(Crypto.randomUUID());
            navigation.replace('Feed');
          }}
        >
          <Text className="text-base font-semibold text-primaryForeground">Войти</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
