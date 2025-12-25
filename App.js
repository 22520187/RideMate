import React, { useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import * as Linking from "expo-linking";
import { MainStackNavigator } from "./src/navigation";
import COLORS from "./src/constant/colors";
import { OverlayProvider, Chat } from "stream-chat-expo";
import { chatClient } from "./src/utils/StreamClient";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import NotificationListener from "./src/components/NotificationListener";
import "./src/config/envTest"; // Debug: Test .env loading

export default function App() {
  const navigationRef = useRef(null);

  useEffect(() => {
    // Log app scheme configuration
    Linking.getInitialURL().then((url) => {
      console.log("📱 App scheme configured in app.json: 'ridemate'");
      console.log("📱 Initial URL (if any):", url);
    });

    // Get and log the app's deep link scheme
    const getScheme = async () => {
      try {
        // expo-linking automatically uses the scheme from app.json
        const scheme = "ridemate"; // This comes from app.json "scheme": "ridemate"
        console.log("🔗 App deep link scheme:", scheme);
        console.log(
          "🔗 Example deep link: ridemate://payment-success?session_id=xxx"
        );
      } catch (error) {
        console.error("Error getting scheme:", error);
      }
    };
    getScheme();

    // Handle deep link when app is already open
    const handleDeepLink = (event) => {
      const { url } = event;
      console.log("🔗 Deep link received:", url);

      if (url) {
        const parsedUrl = Linking.parse(url);
        console.log("🔗 Parsed URL:", parsedUrl);
        console.log("🔗 Scheme:", parsedUrl.scheme);
        console.log("🔗 Path:", parsedUrl.path);
        console.log("🔗 Query params:", parsedUrl.queryParams);

        // Handle payment success/cancel
        // Support exp:// (Expo Go) - URL format: exp://localhost:8081?session_id=xxx
        // Check if URL has session_id query param (payment success) or order_id (payment cancel)
        const sessionId = parsedUrl.queryParams?.session_id;
        const orderId = parsedUrl.queryParams?.order_id;

        // If URL has session_id, it's a payment success callback
        // If URL has order_id but no session_id, it might be a cancel
        if (sessionId || orderId) {
          console.log("💰 Payment callback detected:", {
            scheme: parsedUrl.scheme,
            path: parsedUrl.path,
            sessionId,
            orderId,
          });

          if (sessionId && navigationRef.current) {
            console.log(
              "✅ Navigating to Payment screen with sessionId:",
              sessionId
            );
            // Navigate to Payment screen with sessionId
            navigationRef.current.navigate("Payment", {
              sessionId: sessionId,
              orderId: orderId,
              fromDeepLink: true,
            });
          } else if (orderId && !sessionId) {
            console.log("❌ Payment cancelled - orderId:", orderId);
            // Payment was cancelled, could navigate to Payment screen to show cancel message
            if (navigationRef.current) {
              navigationRef.current.navigate("Payment", {
                orderId: orderId,
                cancelled: true,
                fromDeepLink: true,
              });
            }
          } else {
            console.warn("⚠️ Missing sessionId or navigationRef not ready");
          }
        }
      }
    };

    // Listen for deep links when app is running
    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log("🔗 App opened with deep link:", url);
        setTimeout(() => {
          handleDeepLink({ url });
        }, 1000); // Wait for navigation to be ready
      } else {
        console.log("📱 App opened normally (no deep link)");
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const AppContent = () => (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <OverlayProvider>
        <Chat client={chatClient}>
          <SafeAreaProvider>
            <NavigationContainer ref={navigationRef}>
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

  return <AppContent />;
}
