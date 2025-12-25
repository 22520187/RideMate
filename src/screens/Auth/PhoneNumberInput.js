import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Bike } from "lucide-react-native";
import COLORS from "../../constant/colors";
import Toast from "react-native-toast-message";
import SCREENS from "../../screens";
import {
  validatePhoneNumber,
  formatPhoneNumber,
} from "../../config/auth";
import SnowEffect from "../../components/SnowEffect";
import GradientHeader from "../../components/GradientHeader";

const PhoneNumberInput = ({ navigation, route }) => {
  const { tempId, livenessVerified, similarityScore } = route.params || {};
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
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

    const formattedPhone = phoneNumber.replace(/\s/g, "");
    
    // Direct navigation to OTP - Skip Face ID linking
    navigation.navigate(SCREENS.PHONE_VERIFICATION, {
    phoneNumber: formattedPhone,
    isExistingUser: false,
    mode: "register",
    verificationLinked: false,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <SnowEffect />
      <GradientHeader 
        title="📱 Đăng ký" 
        showBackButton={true} 
        onBackPress={() => navigation.goBack()} 
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Bike size={40} color={COLORS.WHITE} />
            </View>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Tạo tài khoản mới</Text>
            <Text style={styles.subtitle}>
              Nhập số điện thoại để bắt đầu hành trình cùng RideMate
            </Text>
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
                autoFocus
              />
            </View>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              isLoading && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={isLoading}
          >
            {isLoading ? (
               <View style={styles.continueButtonGradient}>
                  <Text style={styles.continueButtonText}>Đang xử lý...</Text>
               </View>
            ) : (
                <LinearGradient
                  colors={["#FF5370", "#FF6B9D", "#FF8FAB"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.continueButtonGradient}
                >
                  <Text style={styles.continueButtonText}>Tiếp tục</Text>
                </LinearGradient>
            )}
          </TouchableOpacity>

          {/* Help Text */}
          <Text style={styles.helpText}>
            Mã OTP sẽ được gửi đến số điện thoại này để xác thực
          </Text>
        </View>
      </KeyboardAvoidingView>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFE5EC",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
  titleContainer: {
    marginBottom: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FF5370",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#FF6B9D",
    fontWeight: "500",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 24,
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
  continueButton: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  continueButtonText: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: "700",
  },
  helpText: {
    fontSize: 14,
    color: "#FF6B9D",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 10,
  },
});

export default PhoneNumberInput;
