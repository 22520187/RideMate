import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { UserTabNavigator } from './src/navigation';
import COLORS from './src/constant/colors';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" backgroundColor={COLORS.BLUE} />
        <UserTabNavigator />
        <Toast />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}