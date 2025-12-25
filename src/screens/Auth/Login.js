import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  Linking,
  ActivityIndicator,
} from "react-native";
import * as Location from "expo-location";

import { Bike } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import COLORS from "../../constant/colors";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomAlert from "../../components/CustomAlert";
import GradientHeader from "../../components/GradientHeader";
import SnowEffect from "../../components/SnowEffect";
import { validatePhoneNumber, formatPhoneNumber } from "../../config/auth";
import SCREENS from "..";
import { chatClient } from "../../utils/StreamClient";
import { ENV } from "../../config/env";
import {
  saveToken,
  saveRefreshToken,
  saveUserType,
  saveUserData,
  saveChatToken,
} from "../../utils/storage";
import endpoints from "../../api/endpoints";
import axiosClient from "../../api/axiosClient";

console.log("🔍 Login.js - EXPO_PUBLIC_API_BASE_URL:", ENV.API_BASE_URL);

const Login = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Custom Alert State
  const [customAlert, setCustomAlert] = useState({
    visible: false,
    title: "",
    message: "",
    buttons: [],
  });

  // Custom Alert Helper
  const showCustomAlert = (
    title,
    message,
    buttons = [{ text: "OK", onPress: () => {} }]
  ) => {
    setCustomAlert({
      visible: true,
      title,
      message,
      buttons,
    });
  };

  const handlePhoneLogin = async () => {
    console.log("Login button pressed");
    console.log("Phone number:", phoneNumber);

    if (!phoneNumber.trim() || !password.trim()) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Vui lòng nhập số điện thoại và mật khẩu",
      });
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Số điện thoại không hợp lệ",
      });
      return;
    }

    const formattedPhone = phoneNumber.replace(/\s/g, "");

    try {
      setIsLoading(true);

      console.log("API Configuration:");
      console.log("   Base URL:", ENV.API_BASE_URL);
      console.log("   Endpoint:", endpoints.auth.login);

      // Gửi null cho location - sẽ lấy sau khi đăng nhập thành công
      const response = await axiosClient.post(endpoints.auth.login, {
        phoneNumber: formattedPhone,
        password,
        currentLatitude: null,
        currentLongitude: null,
      });

      console.log("API Response:", response?.data);
      const authData = response?.data?.data;

      const { chatToken, user, accessToken, refreshToken, streamApiKey } =
        authData;
      console.log("User:", user);
      console.log("Access token:", accessToken);
      console.log("User type:", user.userType);
      console.log("ChatToken received:", chatToken ? "YES" : "NO");
      console.log("StreamApiKey from server:", streamApiKey);
      console.log("StreamApiKey from ENV:", ENV.STREAM_API_KEY);

      if (accessToken) {
        await saveToken(accessToken);
      }
      if (refreshToken) {
        await saveRefreshToken(refreshToken);
      }
      if (chatToken) {
        await saveChatToken(chatToken);
      }

      if (user) {
        await saveUserType(user.userType);
        await saveUserData(user);
      }

      try {
        if (chatToken && user?.id != null) {
          console.log("🔌 Connecting to Stream Chat...");
          console.log("   User ID:", user.id.toString());
          console.log("   User Name:", user.fullName);
          console.log("   ChatToken length:", chatToken?.length);
          console.log(
            "   StreamApiKey match:",
            streamApiKey === ENV.STREAM_API_KEY ? "YES" : "NO"
          );

          await chatClient.connectUser(
            {
              id: user.id.toString(),
              name: user.fullName,
              image: user.profilePictureUrl,
            },
            chatToken
          );
          console.log("✅ Stream connect successful");
        } else {
          console.warn(
            "⚠️ Cannot connect: chatToken=",
            !!chatToken,
            "userId=",
            user?.id
          );
        }
      } catch (streamError) {
        console.error("❌ Stream connect failed:", streamError.message);
        console.error("   Error details:", streamError);
      }

      // Lấy vị trí im lặng sau khi đăng nhập thành công
      (async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === "granted") {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
            });
            console.log(
              "Location obtained silently:",
              location.coords.latitude,
              location.coords.longitude
            );
          }
        } catch (locationError) {
          console.warn("Failed to get location silently:", locationError);
        }
      })();

      // Navigate directly without modal
      if (user.userType === "ADMIN") {
        console.log("Admin user detected - navigating to AdminStack");
        navigation.reset({
          index: 0,
          routes: [{ name: SCREENS.ADMIN_STACK }],
        });
      } else {
        console.log("Regular user detected - navigating to MainTabs");
        navigation.reset({
          index: 0,
          routes: [{ name: "MainTabs" }],
        });
      }
    } catch (error) {
      console.log("Login error:", error.message);

      // Xác định thông báo lỗi
      let errorTitle = "Đăng nhập thất bại";
      let errorMessage = "Đã xảy ra lỗi. Vui lòng thử lại.";

      if (error.response?.status === 404 || error.response?.status === 401) {
        errorTitle = "Sai thông tin đăng nhập";
        errorMessage =
          error.response?.data?.message ||
          "Số điện thoại hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      // Format datetime trong error message (nếu có)
      // Tìm pattern ISO datetime: 2025-12-31T23:59:59 hoặc 2025-12-31T23:59:59.123
      const isoDatePattern = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?)/g;
      errorMessage = errorMessage.replace(isoDatePattern, (match) => {
        try {
          const date = new Date(match);
          const day = String(date.getDate()).padStart(2, "0");
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const year = date.getFullYear();
          const hours = String(date.getHours()).padStart(2, "0");
          const minutes = String(date.getMinutes()).padStart(2, "0");
          const seconds = String(date.getSeconds()).padStart(2, "0");
          return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
        } catch (e) {
          return match; // Nếu parse lỗi thì giữ nguyên
        }
      });

      // Hiển thị Alert thay vì Toast
      showCustomAlert(errorTitle, errorMessage, [
        { text: "OK", onPress: () => {} },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserExists = async (phone) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(phone.slice(-1) % 2 === 0);
      }, 1000);
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <SnowEffect />
      <GradientHeader title="🔐 Đăng nhập" showBackButton={false} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Bike size={48} color={COLORS.WHITE} />
              </View>
              <Text style={styles.appName}>RideMate</Text>
              <Text style={styles.subtitle}>Đăng nhập để tiếp tục</Text>
            </View>

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Số điện thoại</Text>
              <View style={styles.phoneInputWrapper}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>+84</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Nhập số điện thoại"
                  placeholderTextColor={COLORS.PLACEHOLDER_COLOR}
                  value={phoneNumber}
                  onChangeText={(text) =>
                    setPhoneNumber(formatPhoneNumber(text))
                  }
                  keyboardType="phone-pad"
                  maxLength={15}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mật khẩu</Text>
              <View style={styles.phoneInputWrapper}>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor={COLORS.PLACEHOLDER_COLOR}
                  secureTextEntry={true}
                  value={password}
                  onChangeText={(password) => setPassword(password)}
                />
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                isLoading && styles.loginButtonDisabled,
              ]}
              onPress={handlePhoneLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={COLORS.WHITE} size="small" />
                  <Text style={styles.loginButtonText}>Đang đăng nhập...</Text>
                </View>
              ) : (
                <LinearGradient
                  colors={["#FF5370", "#FF6B9D", "#FF8FAB"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginButtonGradient}
                >
                  <Text style={styles.loginButtonText}>Đăng nhập</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>

            {/* Terms */}
            <Text style={styles.termsText}>
              Bằng cách đăng nhập, bạn đồng ý với{" "}
              <Text style={styles.termsLink}>Điều khoản sử dụng</Text> và{" "}
              <Text style={styles.termsLink}>Chính sách bảo mật</Text>
            </Text>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => {
              // Skip ID Card and Liveness, go straight to Phone Input
              navigation.navigate(SCREENS.PHONE_NUMBER_INPUT);
            }}
          >
            <Text style={styles.registerButtonText}>
              Chưa có tài khoản? Đăng ký
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Custom Alert Modal */}
      <CustomAlert
        visible={customAlert.visible}
        title={customAlert.title}
        message={customAlert.message}
        buttons={customAlert.buttons}
        onClose={() => setCustomAlert({ ...customAlert, visible: false })}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF5F7",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 20,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FF5370",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFE5EC",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  appName: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FF5370",
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#FF6B9D",
    fontWeight: "500",
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF5370",
    marginBottom: 12,
  },
  phoneInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFE5EC",
    borderRadius: 16,
    backgroundColor: COLORS.WHITE,
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  countryCode: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRightWidth: 2,
    borderRightColor: "#FFE5EC",
  },
  countryCodeText: {
    fontSize: 16,
    color: "#FF5370",
    fontWeight: "600",
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: COLORS.BLACK,
  },
  loginButton: {
    borderRadius: 16,
    marginBottom: 24,
    overflow: "hidden",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonDisabled: {
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  loginButtonGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  loginButtonText: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: "700",
  },

  termsText: {
    fontSize: 12,
    color: "#FF6B9D",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 24,
  },
  termsLink: {
    color: "#FF5370",
    fontWeight: "700",
  },
  adminAccess: {
    marginTop: 16,
    marginBottom: 16,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(0, 69, 83, 0.1)",
  },
  adminAccessText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#004553",
  },
  registerButton: {
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: COLORS.WHITE,
    borderWidth: 2,
    borderColor: "#FF5370",
    marginBottom: 24,
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  registerButtonText: {
    color: "#FF5370",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default Login;
