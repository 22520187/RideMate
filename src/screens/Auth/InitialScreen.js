import React, { useState, useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getToken } from "../../utils/storage";

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
        // User is logged in - go to main app
        navigation.replace("MainTabs");
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
