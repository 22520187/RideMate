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
import COLORS from "../../constant/colors";
import Toast from "react-native-toast-message";
import SCREENS from "../../screens";
import {
  validatePhoneNumber,
  formatPhoneNumber,
} from "../../config/auth";

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
    
    setIsLoading(true);
    try {
      // Link temporary verification data to this phone number
      console.log('🔗 Linking temp verification to phone:', formattedPhone);
      const { linkTempVerificationToUser } = require('../../services/verificationService');
      await linkTempVerificationToUser(tempId, formattedPhone);
      
      console.log('✅ Verification data linked successfully!');
      
      // Navigate to OTP verification
      navigation.navigate(SCREENS.PHONE_VERIFICATION, {
        phoneNumber: formattedPhone,
        isExistingUser: false,
        mode: "register",
        verificationLinked: true,
      });
    } catch (error) {
      console.error('❌ Error linking verification:', error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.response?.data?.message || "Không thể liên kết dữ liệu xác thực. Vui lòng thử lại.",
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
          {/* Header */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.BLACK} />
          </TouchableOpacity>

          {/* Success Icon */}
          <View style={styles.successContainer}>
            <View style={styles.successCircle}>
              <Ionicons name="checkmark" size={60} color={COLORS.WHITE} />
            </View>
            <Text style={styles.successTitle}>Xác thực thành công!</Text>
            <Text style={styles.successSubtitle}>
              Căn cước công dân của bạn đã được xác thực
            </Text>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Nhập số điện thoại</Text>
            <Text style={styles.subtitle}>
              Vui lòng nhập số điện thoại để hoàn tất đăng ký
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
            <Text style={styles.continueButtonText}>
              {isLoading ? "Đang xử lý..." : "Tiếp tục"}
            </Text>
          </TouchableOpacity>

          {/* Help Text */}
          <Text style={styles.helpText}>
            Mã OTP sẽ được gửi đến số điện thoại này
          </Text>
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "start",
    marginBottom: 20,
  },
  successContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.BLACK,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: COLORS.GRAY,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  titleContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.BLACK,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.GRAY,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
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
  continueButton: {
    backgroundColor: "#004553",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  continueButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: "600",
  },
  helpText: {
    fontSize: 14,
    color: COLORS.GRAY,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default PhoneNumberInput;
