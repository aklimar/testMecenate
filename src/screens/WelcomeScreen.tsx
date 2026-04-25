import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../navigation/types';
import { rootStore } from '../stores/rootStore';
import { tokens } from '../theme/tokens';

const t = tokens;

type Nav = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>Добро пожаловать, новый пользователь</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Войти"
          onPress={() => {
            rootStore.session.setToken(Crypto.randomUUID());
            navigation.replace('Feed');
          }}
          style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? t.opacity.pressed : 1 }]}
        >
          <Text style={styles.primaryText}>Войти</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.color.background },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: t.space.lg },
  title: {
    ...t.typography.heroTitle,
    textAlign: 'center',
    color: t.color.foreground,
  },
  primaryBtn: {
    marginTop: t.space['2xl'],
    alignItems: 'center',
    borderRadius: t.radius.xl,
    backgroundColor: t.color.primary,
    paddingVertical: t.space.md,
  },
  primaryText: {
    ...t.typography.bodySemibold,
    color: t.color.primaryForeground,
  },
});
