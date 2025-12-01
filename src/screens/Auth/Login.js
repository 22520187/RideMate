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

const Login = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneLogin = async () => {
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

    try {
      setIsLoading(true);

      // Gọi API backend
      const response = await fetch(`${API_BASE_URL}/api/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: phoneNumber.replace(/\s/g, ""),
          password,
        }),
      });

      if (!response.ok) throw new Error("Login failed");

      const res = await response.json();

      const { chatToken, user } = res.data;

      // Kết nối user lên Stream
      await chatClient.connectUser(
        {
          id: user.id.toString(),
          name: user.fullName,
          image: user.profilePictureUrl,
        },
        chatToken
      );

      console.log("Stream user connected successfully");

      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Đăng nhập thành công!",
      });

      // Redirect sang MainTabs
      navigation.reset({
        index: 0,
        routes: [{ name: "MainTabs" }],
      });
    } catch (error) {
      console.log(error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Sai thông tin đăng nhập",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserExists = async (phone) => {
    // Simulate API call - replace with actual API
    return new Promise((resolve) => {
      setTimeout(() => {
        // For demo purposes, assume user exists if phone ends with even number
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
                onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
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

        <TouchableOpacity
          style={styles.adminAccess}
          onPress={() =>
            navigation.reset({
              index: 0,
              routes: [{ name: SCREENS.ADMIN_STACK }],
            })
          }
        >
          <Ionicons name="shield-checkmark" size={18} color={COLORS.BLUE} />
          <Text style={styles.adminAccessText}>Dành cho quản trị viên</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 60,
    backgroundColor: COLORS.BLUE,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.BLACK,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.GRAY,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.BLACK,
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
    backgroundColor: COLORS.BLUE,
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
  },
  termsLink: {
    color: COLORS.BLUE,
    fontWeight: "500",
  },
  adminAccess: {
    marginTop: 24,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.BLUE_LIGHT,
  },
  adminAccessText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.BLUE,
  },
});

export default Login;
