import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "../../constant/colors";
import Toast from "react-native-toast-message";
import SCREENS from "../../screens";
import {
  initiateRegister,
  sendOtp,
  verifyOtp,
} from "../../services/authService";

const PhoneVerification = ({ navigation, route }) => {
  const { phoneNumber, isExistingUser, mode } = route.params;
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState(["", "", "", "", "", ""]);
  const [confirmPassword, setConfirmPassword] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [step, setStep] = useState(mode === "password" ? "password" : "otp");
  const passwordRefs = useRef([]);
  const confirmPasswordRefs = useRef([]);

  useEffect(() => {
    if (!isExistingUser) {
      // Send OTP for new user registration via API
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

  const sendOTP = async () => {
    try {
      // Call API to send OTP (fallback to general sendOtp if needed)
      await sendOtp({
        phoneNumber: formattedPhone,
        purpose: "REGISTER",
      });

      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: `Mã xác thực đã được gửi đến ${phoneNumber} qua SMS`,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể gửi mã xác thực",
      });
    }
  };

  const initiateRegistration = async () => {
    try {
      await initiateRegister({
        phoneNumber: formattedPhone,
        purpose: "REGISTER",
      });

      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: `Mã xác thực đã được gửi đến ${phoneNumber} qua SMS`,
      });
    } catch (error) {
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

    // Auto focus next input
    if (text && index < code.length - 1) {
      passwordRefs.current[index + 1]?.focus();
    }
  };

  const handlePasswordChange = (text, index) => {
    const newPassword = [...password];
    newPassword[index] = text;
    setPassword(newPassword);

    // Auto focus next input
    if (text && index < password.length - 1) {
      passwordRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    key,
    index,
    isPassword = false,
    isConfirm = false
  ) => {
    if (
      key === "Backspace" &&
      !(isPassword || isConfirm ? password[index] : code[index])
    ) {
      // Focus previous input on backspace
      if (index > 0) {
        if (isConfirm) {
          confirmPasswordRefs.current[index - 1]?.focus();
        } else if (isPassword) {
          passwordRefs.current[index - 1]?.focus();
        } else {
          passwordRefs.current[index - 1]?.focus();
        }
      }
    }
  };

  const handleVerify = async () => {
    if (step === "password") {
      // Verify password for existing user
      const passwordString = password.join("");
      if (passwordString.length !== 6) {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Vui lòng nhập đầy đủ mật khẩu 6 số",
        });
        return;
      }

      setIsLoading(true);
      try {
        // Simulate password verification
        await verifyPassword(passwordString);
        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: "Đăng nhập thành công",
        });
        // Navigate to main app
        navigation.reset({
          index: 0,
          routes: [{ name: "MainTabs" }],
        });
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Mật khẩu không đúng",
        });
      } finally {
        setIsLoading(false);
      }
    } else if (step === "otp") {
      // Verify OTP
      const codeString = code.join("");
      if (codeString.length !== 6) {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Vui lòng nhập đầy đủ mã xác thực",
        });
        return;
      }

      setIsLoading(true);
      try {
        // Call API to verify OTP for registration
        await verifyOtp({
          phoneNumber: formattedPhone,
          otpCode: codeString,
          purpose: "REGISTER",
        });
        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: "Xác thực thành công",
        });
        // Move to password setting step for new users
        if (!isExistingUser) {
          // Navigate to registration completion screen to collect profile
          navigation.navigate(SCREENS.REGISTER_COMPLETE, {
            phoneNumber: formattedPhone,
          });
          setPassword(["", "", "", "", "", ""]);
          setConfirmPassword(["", "", "", "", "", ""]);
        } else {
          // Navigate to main app for existing users
          navigation.reset({
            index: 0,
            routes: [{ name: "MainTabs" }],
          });
        }
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Mã xác thực không đúng",
        });
      } finally {
        setIsLoading(false);
      }
    } else if (step === "set_password") {
      // Set new password
      const passwordString = password.join("");
      const confirmPasswordString = confirmPassword.join("");

      if (passwordString.length !== 6) {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Vui lòng nhập đầy đủ mật khẩu 6 số",
        });
        return;
      }

      if (confirmPasswordString.length !== 6) {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Vui lòng xác nhận mật khẩu",
        });
        return;
      }

      if (passwordString !== confirmPasswordString) {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Mật khẩu xác nhận không khớp",
        });
        return;
      }

      setIsLoading(true);
      try {
        // Simulate setting new password
        await setNewPassword(passwordString);
        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: "Đăng ký thành công",
        });
        // Navigate to main app
        navigation.reset({
          index: 0,
          routes: [{ name: "MainTabs" }],
        });
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Không thể đặt mật khẩu",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const verifyOTP = async (otp) => {
    // Simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // For demo purposes, accept any 6-digit code
        if (otp.length === 6) {
          resolve(true);
        } else {
          reject(new Error("Invalid OTP"));
        }
      }, 1000);
    });
  };

  const verifyPassword = async (pwd) => {
    // Simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // For demo purposes, accept any 6-digit password
        if (pwd.length === 6) {
          resolve(true);
        } else {
          reject(new Error("Invalid password"));
        }
      }, 1000);
    });
  };

  const setNewPassword = async (pwd) => {
    // Simulate API call to set new password
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (pwd.length === 6) {
          resolve(true);
        } else {
          reject(new Error("Invalid password"));
        }
      }, 1000);
    });
  };

  const handleConfirmPasswordChange = (text, index) => {
    const newConfirmPassword = [...confirmPassword];
    newConfirmPassword[index] = text;
    setConfirmPassword(newConfirmPassword);

    // Auto focus next input
    if (text && index < confirmPassword.length - 1) {
      confirmPasswordRefs.current[index + 1]?.focus();
    }
  };

  const handleResendCode = async () => {
    if (canResend) {
      setTimeLeft(60);
      setCanResend(false);
      setCode(["", "", "", "", "", ""]);
      try {
        await initiateRegister({
          phoneNumber: formattedPhone,
          purpose: "REGISTER",
        });

        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: `Mã xác thực mới đã được gửi đến ${phoneNumber} qua SMS`,
        });
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2:
            error?.response?.data?.message || "Không thể gửi lại mã xác thực",
        });
      }
    }
  };

  const renderCodeInputs = () => {
    return (
      <View style={styles.codeContainer}>
        {code.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (passwordRefs.current[index] = ref)}
            style={styles.codeInput}
            value={digit}
            onChangeText={(text) => handleCodeChange(text, index)}
            onKeyPress={({ nativeEvent }) =>
              handleKeyPress(nativeEvent.key, index)
            }
            keyboardType="numeric"
            maxLength={1}
            textAlign="center"
            selectTextOnFocus
          />
        ))}
      </View>
    );
  };

  const renderPasswordInputs = (isConfirm = false) => {
    const values = isConfirm ? confirmPassword : password;
    const handleChange = isConfirm
      ? handleConfirmPasswordChange
      : handlePasswordChange;
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
            onKeyPress={({ nativeEvent }) =>
              handleKeyPress(nativeEvent.key, index, true, isConfirm)
            }
            keyboardType="numeric"
            maxLength={1}
            textAlign="center"
            selectTextOnFocus
            secureTextEntry
          />
        ))}
      </View>
    );
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

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              {step === "password"
                ? "Nhập mật khẩu"
                : step === "otp"
                ? "Xác thực số điện thoại"
                : "Tạo mật khẩu mới"}
            </Text>
            <Text style={styles.subtitle}>
              {step === "password"
                ? `Nhập mật khẩu 6 số cho ${phoneNumber}`
                : step === "otp"
                ? `Nhập mã xác thực 6 số đã gửi đến ${phoneNumber}`
                : `Tạo mật khẩu 6 số cho tài khoản ${phoneNumber}`}
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
                <Text style={styles.inputLabel}>Nhập mật khẩu mới</Text>
                {renderPasswordInputs()}
                <Text style={[styles.inputLabel, { marginTop: 20 }]}>
                  Xác nhận mật khẩu
                </Text>
                {renderPasswordInputs(true)}
              </>
            )}
          </View>

          {/* Resend Code (only for OTP) */}
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
            style={[
              styles.verifyButton,
              isLoading && styles.verifyButtonDisabled,
            ]}
            onPress={handleVerify}
            disabled={isLoading}
          >
            <Text style={styles.verifyButtonText}>
              {isLoading
                ? "Đang xử lý..."
                : step === "set_password"
                ? "Đăng ký"
                : "Xác thực"}
            </Text>
          </TouchableOpacity>

          {/* Help Text */}
          <Text style={styles.helpText}>
            {step === "password"
              ? "Quên mật khẩu? Liên hệ hỗ trợ"
              : step === "otp"
              ? "Không nhận được mã? Kiểm tra tin nhắn spam"
              : "Mật khẩu phải có đủ 6 số"}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  inputLabel: {
    fontSize: 16,
    color: COLORS.GRAY,
    marginBottom: 12,
  },
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
  titleContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.BLACK,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.GRAY,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  codeInput: {
    width: 52,
    height: 52,
    borderWidth: 2,
    borderColor: COLORS.GRAY_LIGHT,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.BLACK,
    backgroundColor: COLORS.WHITE,
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
    borderColor: COLORS.GRAY_LIGHT,
    borderRadius: 12,
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.BLACK,
    backgroundColor: COLORS.WHITE,
  },
  resendContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  resendText: {
    fontSize: 16,
    color: COLORS.BLUE,
    fontWeight: "500",
  },
  timerText: {
    fontSize: 16,
    color: COLORS.GRAY,
  },
  verifyButton: {
    backgroundColor: COLORS.BLUE,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  verifyButtonDisabled: {
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  verifyButtonText: {
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

export default PhoneVerification;
