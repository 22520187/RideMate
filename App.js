import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { MainStackNavigator } from "./src/navigation";
import COLORS from "./src/constant/colors";
import { OverlayProvider, Chat } from "stream-chat-expo";
import { chatClient } from "./src/utils/StreamClient";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import NotificationListener from "./src/components/NotificationListener";
import "./src/config/envTest"; // Debug: Test .env loading

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <OverlayProvider>
        <Chat client={chatClient}>
          <SafeAreaProvider>
            <NavigationContainer>
              <StatusBar style="auto" backgroundColor={COLORS.BLUE} />
              <MainStackNavigator />
              <NotificationListener />
              <Toast />
            </NavigationContainer>
          </SafeAreaProvider>
        </Chat>
      </OverlayProvider>
    </GestureHandlerRootView>
  );
}
