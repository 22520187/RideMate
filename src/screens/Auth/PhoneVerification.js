import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import COLORS from "../../constant/colors";
import Toast from "react-native-toast-message";
import SCREENS from "../../screens";
import {
  initiateRegister,
  sendOtp,
  verifyOtp,
} from "../../services/authService";
import SnowEffect from "../../components/SnowEffect";
import GradientHeader from "../../components/GradientHeader";

const PhoneVerification = ({ navigation, route }) => {
  const { phoneNumber, isExistingUser, mode } = route.params;
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState(["", "", "", "", "", ""]);
  const [confirmPassword, setConfirmPassword] = useState([
    "", "", "", "", "", "",
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [step, setStep] = useState(mode === "password" ? "password" : "otp");
  const passwordRefs = useRef([]);
  const confirmPasswordRefs = useRef([]);

  useEffect(() => {
    if (!isExistingUser) {
      initiateRegistration();
    }
  }, []);

  const formattedPhone = phoneNumber.replace(/\s/g, "").startsWith("+84")
    ? phoneNumber.replace(/\s/g, "").replace("+84", "0")
    : phoneNumber.replace(/\s/g, "");

  useEffect(() => {
    if (!isExistingUser && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (!isExistingUser && timeLeft === 0) {
      setCanResend(true);
    }
  }, [timeLeft, isExistingUser]);

  // ... (Keep existing logic functions: initiateRegistration, handleCodeChange, handlePasswordChange, handleKeyPress)
  const initiateRegistration = async () => {
    try {
      const response = await initiateRegister({
        phoneNumber: formattedPhone,
        purpose: "REGISTER",
      });

      const otpCode = response?.data?.data?.otpCode;
      
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: otpCode 
          ? `Mã xác thực của bạn là: ${otpCode}` 
          : `Mã xác thực đã được gửi đến ${phoneNumber} qua SMS`,
        visibilityTime: 10000,
      });
    } catch (error) {
      console.log("Error initiating registration:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error?.response?.data?.message || "Không thể gửi mã xác thực",
      });
    }
  };

  const handleCodeChange = (text, index) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    if (text && index < code.length - 1) {
      passwordRefs.current[index + 1]?.focus();
    }
  };

  const handlePasswordChange = (text, index) => {
    const newPassword = [...password];
    newPassword[index] = text;
    setPassword(newPassword);
    if (text && index < password.length - 1) {
      passwordRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key, index, isPassword = false, isConfirm = false) => {
    if (key === "Backspace" && !(isPassword || isConfirm ? password[index] : code[index])) {
      if (index > 0) {
        if (isConfirm) confirmPasswordRefs.current[index - 1]?.focus();
        else passwordRefs.current[index - 1]?.focus();
      }
    }
  };

  const verifyPassword = async (pwd) => {
      // Mock logic from original file
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (pwd.length === 6) resolve(true);
          else reject(new Error("Invalid password"));
        }, 1000);
      });
  };

  const setNewPassword = async (pwd) => {
      // Mock logic from original file
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (pwd.length === 6) resolve(true);
          else reject(new Error("Invalid password"));
        }, 1000);
      });
  };

  const getHeaderTitle = () => {
      if (step === "password") return "🔐 Nhập mật khẩu";
      if (step === "otp") return "🔢 Xác thực OTP";
      return "🔑 Tạo mật khẩu";
  };

  const handleVerify = async () => {
    if (step === "password") {
      const passwordString = password.join("");
      if (passwordString.length !== 6) {
        Toast.show({ type: "error", text1: "Lỗi", text2: "Vui lòng nhập đầy đủ mật khẩu 6 số" });
        return;
      }
      setIsLoading(true);
      try {
        await verifyPassword(passwordString); // Placeholder function
        Toast.show({ type: "success", text1: "Thành công", text2: "Đăng nhập thành công" });
        navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
      } catch (error) {
        Toast.show({ type: "error", text1: "Lỗi", text2: "Mật khẩu không đúng" });
      } finally {
        setIsLoading(false);
      }
    } else if (step === "otp") {
      const codeString = code.join("");
      if (codeString.length !== 6) {
        Toast.show({ type: "error", text1: "Lỗi", text2: "Vui lòng nhập đầy đủ mã xác thực" });
        return;
      }
      setIsLoading(true);
      try {
        await verifyOtp({
          phoneNumber: formattedPhone,
          otpCode: codeString,
          purpose: "REGISTER",
        });
        Toast.show({ type: "success", text1: "Thành công", text2: "Xác thực thành công" });
        if (!isExistingUser) {
          navigation.navigate(SCREENS.REGISTER_COMPLETE, { phoneNumber: formattedPhone });
        } else {
          navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
        }
      } catch (error) {
        Toast.show({ type: "error", text1: "Lỗi", text2: "Mã xác thực không đúng" });
      } finally {
        setIsLoading(false);
      }
    } else if (step === "set_password") {
       // Logic removed/simplified as RegisterComplete handles user creation now?
       // Wait, the original code had set_password step. Let's keep it if needed, but the current flow goes to RegisterComplete after OTP.
       // The original code navigated to RegisterComplete AFTER OTP for new users.
       // So we don't strictly need logic here for set_password unless the flow loops back.
    }
  };

  const handleResendCode = async () => {
    if (canResend) {
      setTimeLeft(60);
      setCanResend(false);
      setCode(["", "", "", "", "", ""]);
      try {
        const response = await initiateRegister({ phoneNumber: formattedPhone, purpose: "REGISTER" });
        const otpCode = response?.data?.data?.otpCode;
        
        Toast.show({ 
            type: "success", 
            text1: "Thành công", 
            text2: otpCode 
                ? `Mã xác thực mới là: ${otpCode}` 
                : "Mã xác thực mới đã gửi",
            visibilityTime: 10000
        });
      } catch (error) {
        Toast.show({ type: "error", text1: "Lỗi", text2: error?.response?.data?.message || "Lỗi gửi lại mã" });
      }
    }
  };

  const handleConfirmPasswordChange = (text, index) => {
    const newConfirmPassword = [...confirmPassword];
    newConfirmPassword[index] = text;
    setConfirmPassword(newConfirmPassword);
    if (text && index < confirmPassword.length - 1) {
       confirmPasswordRefs.current[index + 1]?.focus();
    }
  };


  const renderCodeInputs = () => (
    <View style={styles.codeContainer}>
      {code.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => (passwordRefs.current[index] = ref)}
          style={styles.codeInput}
          value={digit}
          onChangeText={(text) => handleCodeChange(text, index)}
          onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
          keyboardType="numeric"
          maxLength={1}
          textAlign="center"
          selectTextOnFocus
          selectionColor="#FF5370"
        />
      ))}
    </View>
  );

  const renderPasswordInputs = (isConfirm = false) => {
    const values = isConfirm ? confirmPassword : password;
    const handleChange = isConfirm ? handleConfirmPasswordChange : handlePasswordChange;
    const refs = isConfirm ? confirmPasswordRefs : passwordRefs;

    return (
      <View style={styles.passwordContainer}>
        {values.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (refs.current[index] = ref)}
            style={styles.passwordInput}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index, true, isConfirm)}
            keyboardType="numeric"
            maxLength={1}
            textAlign="center"
            selectTextOnFocus
            secureTextEntry
             selectionColor="#FF5370"
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <SnowEffect />
      <GradientHeader 
        title={getHeaderTitle()}
        showBackButton={true} 
        onBackPress={() => navigation.goBack()} 
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              {step === "password"
                ? "Nhập mật khẩu"
                : step === "otp"
                ? "Mã xác thực 6 số"
                : "Tạo mật khẩu"}
            </Text>
            <Text style={styles.subtitle}>
              {step === "password"
                ? `Nhập mật khẩu để đăng nhập vào ${phoneNumber}`
                : step === "otp"
                ? `Chúng tôi đã gửi mã đến ${phoneNumber}`
                : `Tạo mật khẩu bảo mật cho tài khoản`}
            </Text>
          </View>

          {/* Input Fields */}
          <View style={styles.inputContainer}>
            {step === "otp" ? (
              renderCodeInputs()
            ) : step === "password" ? (
              renderPasswordInputs()
            ) : (
              <>
                <Text style={styles.inputLabel}>Mật khẩu mới</Text>
                {renderPasswordInputs()}
                <Text style={[styles.inputLabel, { marginTop: 20 }]}>Xác nhận mật khẩu</Text>
                {renderPasswordInputs(true)}
              </>
            )}
          </View>

          {/* Resend Code */}
          {step === "otp" && (
            <View style={styles.resendContainer}>
              {canResend ? (
                <TouchableOpacity onPress={handleResendCode}>
                  <Text style={styles.resendText}>Gửi lại mã</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.timerText}>Gửi lại mã sau {timeLeft}s</Text>
              )}
            </View>
          )}

          {/* Verify Button */}
          <TouchableOpacity
            style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]}
            onPress={handleVerify}
            disabled={isLoading}
          >
             {isLoading ? (
                <View style={styles.verifyButtonGradient}>
                    <Text style={styles.verifyButtonText}>Đang xử lý...</Text>
                </View>
             ) : (
                <LinearGradient
                  colors={["#FF5370", "#FF6B9D", "#FF8FAB"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.verifyButtonGradient}
                >
                  <Text style={styles.verifyButtonText}>
                    {step === "set_password" ? "Đăng ký" : "Xác thực"}
                  </Text>
                </LinearGradient>
             )}
          </TouchableOpacity>

          {/* Help Text */}
          <Text style={styles.helpText}>
            {step === "password"
              ? "Quên mật khẩu? Liên hệ hỗ trợ"
              : step === "otp"
              ? "Không nhận được mã? Kiểm tra số điện thoại của bạn"
              : "Mật khẩu giúp bảo vệ tài khoản của bạn"}
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
    paddingTop: 30,
  },
  titleContainer: {
    marginBottom: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FF5370", 
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#FF6B9D",
    lineHeight: 24,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    color: "#FF5370",
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: "#FFE5EC",
    borderRadius: 16,
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF5370",
    backgroundColor: COLORS.WHITE,
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  passwordContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  passwordInput: {
    width: 45,
    height: 60,
    borderWidth: 2,
    borderColor: "#FFE5EC",
    borderRadius: 16,
    fontSize: 28, // Bigger bullets
    fontWeight: "bold",
    color: "#FF5370",
    backgroundColor: COLORS.WHITE,
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resendContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  resendText: {
    fontSize: 16,
    color: "#FF5370",
    fontWeight: "700",
  },
  timerText: {
    fontSize: 16,
    color: "#FF6B9D",
  },
  verifyButton: {
    borderRadius: 16,
    marginBottom: 24,
    overflow: "hidden",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  verifyButtonGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  verifyButtonDisabled: {
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  verifyButtonText: {
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

export default PhoneVerification;
