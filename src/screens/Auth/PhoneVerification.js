import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import COLORS from '../../constant/colors';
import Toast from 'react-native-toast-message';

const PhoneVerification = ({ navigation, route }) => {
  const { phoneNumber, isExistingUser } = route.params;
  const [code, setCode] = useState(['', '', '', '']);
  const [password, setPassword] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!isExistingUser) {
      // Send OTP for new user registration
      sendOTP();
    }
  }, []);

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
      // Simulate sending OTP
      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: `Mã xác thực đã được gửi đến ${phoneNumber}`,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể gửi mã xác thực',
      });
    }
  };

  const handleCodeChange = (text, index) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto focus next input
    if (text && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePasswordChange = (text, index) => {
    const newPassword = [...password];
    newPassword[index] = text;
    setPassword(newPassword);

    // Auto focus next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key, index, isPassword = false) => {
    if (key === 'Backspace' && !(isPassword ? password[index] : code[index])) {
      // Focus previous input on backspace
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleVerify = async () => {
    if (isExistingUser) {
      // Verify password for existing user
      const passwordString = password.join('');
      if (passwordString.length !== 6) {
        Toast.show({
          type: 'error',
          text1: 'Lỗi',
          text2: 'Vui lòng nhập đầy đủ mật khẩu 6 số',
        });
        return;
      }

      setIsLoading(true);
      try {
        // Simulate password verification
        await verifyPassword(passwordString);
        Toast.show({
          type: 'success',
          text1: 'Thành công',
          text2: 'Đăng nhập thành công',
        });
        // Navigate to main app
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Lỗi',
          text2: 'Mật khẩu không đúng',
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      // Verify OTP for new user
      const codeString = code.join('');
      if (codeString.length !== 4) {
        Toast.show({
          type: 'error',
          text1: 'Lỗi',
          text2: 'Vui lòng nhập đầy đủ mã xác thực',
        });
        return;
      }

      setIsLoading(true);
      try {
        // Simulate OTP verification
        await verifyOTP(codeString);
        Toast.show({
          type: 'success',
          text1: 'Thành công',
          text2: 'Xác thực thành công',
        });
        // Navigate to main app
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Lỗi',
          text2: 'Mã xác thực không đúng',
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
        // For demo purposes, accept any 4-digit code
        if (otp.length === 4) {
          resolve(true);
        } else {
          reject(new Error('Invalid OTP'));
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
          reject(new Error('Invalid password'));
        }
      }, 1000);
    });
  };

  const handleResendCode = async () => {
    if (canResend) {
      setTimeLeft(60);
      setCanResend(false);
      setCode(['', '', '', '']);
      await sendOTP();
    }
  };

  const renderCodeInputs = () => {
    return (
      <View style={styles.codeContainer}>
        {code.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputRefs.current[index] = ref)}
            style={styles.codeInput}
            value={digit}
            onChangeText={(text) => handleCodeChange(text, index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
            keyboardType="numeric"
            maxLength={1}
            textAlign="center"
            selectTextOnFocus
          />
        ))}
      </View>
    );
  };

  const renderPasswordInputs = () => {
    return (
      <View style={styles.passwordContainer}>
        {password.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputRefs.current[index] = ref)}
            style={styles.passwordInput}
            value={digit}
            onChangeText={(text) => handlePasswordChange(text, index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index, true)}
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
              {isExistingUser ? 'Nhập mật khẩu' : 'Xác thực số điện thoại'}
            </Text>
            <Text style={styles.subtitle}>
              {isExistingUser
                ? `Nhập mật khẩu 6 số cho ${phoneNumber}`
                : `Nhập mã xác thực 4 số đã gửi đến ${phoneNumber}`}
            </Text>
          </View>

          {/* Input Fields */}
          <View style={styles.inputContainer}>
            {isExistingUser ? renderPasswordInputs() : renderCodeInputs()}
          </View>

          {/* Resend Code (only for OTP) */}
          {!isExistingUser && (
            <View style={styles.resendContainer}>
              {canResend ? (
                <TouchableOpacity onPress={handleResendCode}>
                  <Text style={styles.resendText}>Gửi lại mã</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.timerText}>
                  Gửi lại mã sau {timeLeft}s
                </Text>
              )}
            </View>
          )}

          {/* Verify Button */}
          <TouchableOpacity
            style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]}
            onPress={handleVerify}
            disabled={isLoading}
          >
            <Text style={styles.verifyButtonText}>
              {isLoading ? 'Đang xác thực...' : 'Xác thực'}
            </Text>
          </TouchableOpacity>

          {/* Help Text */}
          <Text style={styles.helpText}>
            {isExistingUser
              ? 'Quên mật khẩu? Liên hệ hỗ trợ'
              : 'Không nhận được mã? Kiểm tra tin nhắn spam'}
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
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  codeInput: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: COLORS.GRAY_LIGHT,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.BLACK,
    backgroundColor: COLORS.WHITE,
  },
  passwordContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  passwordInput: {
    width: 45,
    height: 60,
    borderWidth: 2,
    borderColor: COLORS.GRAY_LIGHT,
    borderRadius: 12,
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.BLACK,
    backgroundColor: COLORS.WHITE,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  resendText: {
    fontSize: 16,
    color: COLORS.BLUE,
    fontWeight: '500',
  },
  timerText: {
    fontSize: 16,
    color: COLORS.GRAY,
  },
  verifyButton: {
    backgroundColor: COLORS.BLUE,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  verifyButtonDisabled: {
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  verifyButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 14,
    color: COLORS.GRAY,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PhoneVerification;
