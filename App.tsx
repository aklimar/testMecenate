import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AppProviders } from './src/providers/AppProviders';

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProviders>
        <NavigationContainer>
          <View style={styles.root}>
            <AppNavigator />
            <StatusBar style="dark" />
          </View>
        </NavigationContainer>
      </AppProviders>
    </SafeAreaProvider>
  );
}
