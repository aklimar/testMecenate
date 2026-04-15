import './global.css';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AppProviders } from './src/providers/AppProviders';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProviders>
        <NavigationContainer>
          <View className="flex-1">
            <AppNavigator />
            <StatusBar style="dark" />
          </View>
        </NavigationContainer>
      </AppProviders>
    </SafeAreaProvider>
  );
}
