import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constant/colors";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  validatePhoneNumber,
  formatPhoneNumber,
  performGoogleAuth,
  performFacebookAuth,
} from "../../config/auth";
import SCREENS from "..";
import { chatClient } from "../../utils/StreamClient";
import { API_BASE_URL } from "@env";
import {
  saveToken,
  saveRefreshToken,
  saveUserType,
  saveUserData,
  saveChatToken,
} from "../../utils/storage";
import endpoints from "../../api/endpoints";
import axiosClient from "../../api/axiosClient";

console.log("🔍 Login.js - API_BASE_URL from @env:", API_BASE_URL);

const Login = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneLogin = async () => {
    console.log("✅ Login button pressed");
    console.log("📱 Phone number:", phoneNumber);
    console.log("🔐 Password:", password);

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
    console.log("📞 Formatted phone:", formattedPhone);

    try {
      setIsLoading(true);

      // Log API configuration
      console.log("🔧 API Configuration:");
      console.log("   Base URL:", API_BASE_URL);
      console.log("   Endpoint:", endpoints.auth.login);

      const response = await axiosClient.post(endpoints.auth.login, {
        phoneNumber: formattedPhone,
        password,
        currentLatitude: 10.7769,
        currentLongitude: 106.7009,
      });

      console.log("📦 API Response:", response?.data);
      const authData = response?.data?.data; // ApiResponse.data -> AuthResponse

      const { chatToken, user, accessToken, refreshToken } = authData;
      console.log("👤 Auth data:", authData);
      console.log("👤 User:", user);
      console.log("🔑 Access token:", accessToken);
      console.log("🔄 Refresh token:", refreshToken);
      console.log("🎭 User type:", user.userType);

      // Save tokens
      if (accessToken) {
        await saveToken(accessToken);
      }
      if (refreshToken) {
        await saveRefreshToken(refreshToken);
      }
      if (chatToken) {
        await saveChatToken(chatToken);
      }

      // Save user type and data
      if (user) {
        await saveUserType(user.userType);
        await saveUserData(user);
      }

      // Kết nối user lên Stream
      try {
        if (chatToken && user?.id != null) {
          await chatClient.connectUser(
            {
              id: user.id.toString(),
              name: user.fullName,
              image: user.profilePictureUrl,
            },
            chatToken
          );
        }
        console.log("💬 Stream connect successful");
      } catch (streamError) {
        console.log("⚠️  Stream connect failed:", streamError.message);
        // Không throw error, tiếp tục login
      }

      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Đăng nhập thành công!",
      });

      // Role-based navigation
      if (user.userType === "ADMIN") {
        console.log("🔐 Admin user detected - navigating to AdminStack");
        navigation.reset({
          index: 0,
          routes: [{ name: SCREENS.ADMIN_STACK }],
        });
      } else {
        console.log("👤 Regular user detected - navigating to MainTabs");
        navigation.reset({
          index: 0,
          routes: [{ name: "MainTabs" }],
        });
      }
    } catch (error) {
      console.log("❌ Login error:", error.message);
      console.log("🔍 Error details:", {
        code: error.code,
        status: error.response?.status,
        message: error.response?.data?.message,
      });
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.response?.data?.message || "Sai thông tin đăng nhập",
      });
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

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const result = await performGoogleAuth();

      if (result.success) {
        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: `Chào mừng ${result.user.name}!`,
        });
        // Navigate to main app
        navigation.reset({
          index: 0,
          routes: [{ name: "MainTabs" }],
        });
      } else {
        if (result.error !== "Authentication cancelled") {
          Toast.show({
            type: "error",
            text1: "Lỗi",
            text2: result.error || "Có lỗi xảy ra khi đăng nhập Google",
          });
        }
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Có lỗi xảy ra khi đăng nhập Google",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      setIsLoading(true);
      const result = await performFacebookAuth();

      if (result.success) {
        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: `Chào mừng ${result.user.name}!`,
        });
        // Navigate to main app
        navigation.reset({
          index: 0,
          routes: [{ name: "MainTabs" }],
        });
      } else {
        if (result.error !== "Authentication cancelled") {
          Toast.show({
            type: "error",
            text1: "Lỗi",
            text2: result.error || "Có lỗi xảy ra khi đăng nhập Facebook",
          });
        }
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Có lỗi xảy ra khi đăng nhập Facebook",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
                <Ionicons name="car" size={60} color={COLORS.WHITE} />
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
              <Text style={styles.loginButtonText}>
                {isLoading ? "Đang xử lý..." : "Tiếp tục"}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>hoặc</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialContainer}>
              <TouchableOpacity
                style={[
                  styles.socialButton,
                  styles.googleButton,
                  isLoading && styles.socialButtonDisabled,
                ]}
                onPress={handleGoogleLogin}
                disabled={isLoading}
              >
                <Ionicons name="logo-google" size={24} color="#DB4437" />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.socialButton,
                  styles.facebookButton,
                  isLoading && styles.socialButtonDisabled,
                ]}
                onPress={handleFacebookLogin}
                disabled={isLoading}
              >
                <Ionicons name="logo-facebook" size={24} color="#4267B2" />
                <Text style={styles.socialButtonText}>Facebook</Text>
              </TouchableOpacity>
            </View>

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
            onPress={async () => {
              // Validate phone number
              if (!phoneNumber.trim()) {
                Toast.show({
                  type: "error",
                  text1: "Lỗi",
                  text2: "Vui lòng nhập số điện thoại",
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
              navigation.navigate(SCREENS.PHONE_VERIFICATION, {
                phoneNumber: phoneNumber.replace(/\s/g, ""),
                isExistingUser: false,
                mode: "register",
              });
            }}
          >
            <Text style={styles.registerButtonText}>
              Chưa có tài khoản? Đăng ký
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    marginBottom: 10,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 60,
    backgroundColor: "#004553",
    justifyContent: "center",
    alignItems: "center",
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#004553",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.GRAY,
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#004553",
    marginBottom: 12,
  },
  phoneInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
    borderRadius: 12,
    backgroundColor: COLORS.WHITE,
  },
  countryCode: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: COLORS.GRAY_LIGHT,
  },
  countryCodeText: {
    fontSize: 16,
    color: COLORS.BLACK,
    fontWeight: "500",
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: COLORS.BLACK,
  },
  loginButton: {
    backgroundColor: "#004553",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  loginButtonDisabled: {
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  loginButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: COLORS.GRAY,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
    marginHorizontal: 6,
  },
  googleButton: {
    backgroundColor: COLORS.WHITE,
  },
  facebookButton: {
    backgroundColor: COLORS.WHITE,
  },
  socialButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.BLACK,
  },
  socialButtonDisabled: {
    opacity: 0.5,
  },
  termsText: {
    fontSize: 12,
    color: COLORS.GRAY,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 24,
  },
  termsLink: {
    color: "#004553",
    fontWeight: "500",
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
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: "#004553",
  },
  registerButtonText: {
    color: "#004553",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default Login;
