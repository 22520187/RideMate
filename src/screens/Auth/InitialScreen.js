import React, { useState, useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getToken, getChatToken, getUserData, getUserType } from "../../utils/storage";
import { chatClient } from "../../utils/StreamClient";

const InitialScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkInitialScreen();
  }, []);

  const checkInitialScreen = async () => {
    try {
      // Check if user has completed onboarding
      const onboardingCompleted = await AsyncStorage.getItem(
        "@onboarding_completed"
      );

      // Check if user is logged in
      const token = await getToken();

      if (!onboardingCompleted) {
        // First time user - show onboarding
        navigation.replace("Onboarding");
      } else if (token) {
        // Best-effort reconnect Stream Chat so Message tab won't crash after app restart
        try {
          if (!chatClient.userID) {
            const [userData, chatToken] = await Promise.all([
              getUserData(),
              getChatToken(),
            ]);
            if (userData?.id != null && chatToken) {
              await chatClient.connectUser(
                {
                  id: userData.id.toString(),
                  name: userData.fullName,
                  image: userData.profilePictureUrl,
                },
                chatToken
              );
            }
          }
        } catch (streamError) {
          console.log("⚠️ Stream reconnect failed:", streamError?.message);
          // Do not block app navigation
        }
        // User is logged in - route by userType (ADMIN goes to AdminStack)
        const userType = await getUserType();
        if (userType === "ADMIN") {
          navigation.replace("AdminStack");
        } else {
          navigation.replace("MainTabs");
        }
      } else {
        // User has seen onboarding but not logged in
        navigation.replace("Login");
      }
    } catch (error) {
      console.error("Error checking initial screen:", error);
      // Default to onboarding on error
      navigation.replace("Onboarding");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#004553" />
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});

export default InitialScreen;
