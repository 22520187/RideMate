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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "../../constant/colors";
import Toast from "react-native-toast-message";
import { completeRegistration } from "../../services/authService";
import {
  saveToken,
  saveRefreshToken,
  saveChatToken,
  saveUserData,
  saveUserType,
} from "../../utils/storage";
import { chatClient } from "../../utils/StreamClient";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { uploadImage } from "../../services/uploadService";
import ImagePickerModal from "../../components/ImagePickerModal";

const RegisterComplete = ({ navigation, route }) => {
  const { phoneNumber } = route.params;
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userType, setUserType] = useState("PASSENGER");
  const [loading, setLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [showImagePicker, setShowImagePicker] = useState(false);

  const formattedPhone = phoneNumber.replace(/\s/g, "").startsWith("+84")
    ? phoneNumber.replace(/\s/g, "").replace("+84", "0")
    : phoneNumber.replace(/\s/g, "");

  const pickImage = async (fromCamera = false) => {
    try {
      const permissionResult = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Cần quyền truy cập để chọn ảnh",
        });
        return;
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

      if (!result.canceled) {
        // Compress and resize image
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 800 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        setProfilePicture(manipulatedImage);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể chọn ảnh",
      });
    } finally {
      setShowImagePicker(false);
    }
  };

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Vui lòng nhập họ tên",
      });
      return;
    }
    if (!password || password.length < 8) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Mật khẩu phải có ít nhất 8 ký tự",
      });
      return;
    }
    if (password !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Mật khẩu xác nhận không khớp",
      });
      return;
    }
    setLoading(true);
    try {
      let profilePictureUrl = null;

      // Upload profile picture if selected
      if (profilePicture) {
        try {
          const uploadResponse = await uploadImage({
            uri: profilePicture.uri,
            name: profilePicture.fileName || "profile.jpg",
            type: profilePicture.type || "image/jpeg",
          });
          profilePictureUrl = uploadResponse.data.url;
        } catch (uploadError) {
          console.warn(
            "Profile picture upload failed, continuing without it:",
            uploadError.message
          );
          Toast.show({
            type: "info",
            text1: "Thông báo",
            text2: "Upload ảnh thất bại, tiếp tục đăng ký",
          });
          profilePictureUrl = null;
        }
      }

      const res = await completeRegistration({
        phoneNumber: formattedPhone,
        fullName: fullName.trim(),
        password,
        userType,
        email: email.trim() || undefined,
        profilePictureUrl,
      });
      const apiResponse = res; // axiosClient returns ApiResponse object
      const authData = apiResponse.data.data; // actual AuthResponse payload
      console.log("🔑 Auth data received:", authData);
      console.log("🔑 Access token type:", typeof authData.accessToken);
      console.log("🔑 Access token value:", authData.accessToken);
      // Save tokens
      await saveToken(authData.accessToken);
      if (authData.refreshToken) await saveRefreshToken(authData.refreshToken);
      if (authData.chatToken) await saveChatToken(authData.chatToken);
      if (authData?.user) {
        await saveUserData(authData.user);
        if (authData.user.userType) await saveUserType(authData.user.userType);
      }
      // Connect to chat client using chatToken
      if (authData?.chatToken && authData?.user) {
        await chatClient.connectUser(
          {
            id: authData.user.id.toString(),
            name: authData.user.fullName,
            image: profilePictureUrl || null,
          },
          authData.chatToken
        );
      }
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Đăng ký thành công",
      });

      // Ensure storage is saved before navigation
      await new Promise((resolve) => setTimeout(resolve, 200));

      navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
    } catch (error) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error?.response?.data?.message || "Đăng ký thất bại",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Hoàn tất đăng ký</Text>
          <Text style={styles.subtitle}>
            Vui lòng nhập thông tin cá nhân để hoàn tất việc đăng ký
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Họ và tên</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập họ tên"
              value={fullName}
              onChangeText={setFullName}
            />

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>
              Ảnh đại diện
            </Text>
            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={() => setShowImagePicker(true)}
            >
              {profilePicture ? (
                <Image
                  source={{ uri: profilePicture.uri }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderText}>Chọn ảnh</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Mật khẩu</Text>
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>
              Xác nhận mật khẩu
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Xác nhận mật khẩu"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>
              Loại người dùng
            </Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  userType === "PASSENGER" && styles.typeButtonActive,
                ]}
                onPress={() => setUserType("PASSENGER")}
              >
                <Text
                  style={[
                    styles.typeText,
                    userType === "PASSENGER" && styles.typeTextActive,
                  ]}
                >
                  Hành khách
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  userType === "DRIVER" && styles.typeButtonActive,
                ]}
                onPress={() => setUserType("DRIVER")}
              >
                <Text
                  style={[
                    styles.typeText,
                    userType === "DRIVER" && styles.typeTextActive,
                  ]}
                >
                  Tài xế
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                loading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? "Đang xử lý..." : "Hoàn tất"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <ImagePickerModal
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onCameraPress={() => pickImage(true)}
        onLibraryPress={() => pickImage(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.WHITE },
  keyboardAvoidingView: { flex: 1 },
  content: { flex: 1, padding: 24 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 6,
    color: COLORS.BLACK,
  },
  subtitle: { fontSize: 14, color: COLORS.GRAY, marginBottom: 18 },
  inputContainer: { marginTop: 12 },
  inputLabel: { fontSize: 14, color: COLORS.GRAY, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.BLACK,
    backgroundColor: COLORS.WHITE,
  },
  typeRow: { flexDirection: "row", gap: 12, marginTop: 6 },
  typeButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
    borderRadius: 8,
    backgroundColor: COLORS.WHITE,
  },
  typeButtonActive: {
    borderColor: COLORS.BLUE,
    backgroundColor: COLORS.BLUE_LIGHT,
  },
  typeText: { color: COLORS.BLACK },
  typeTextActive: { color: COLORS.BLUE },
  submitButton: {
    marginTop: 18,
    backgroundColor: COLORS.BLUE,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonDisabled: { backgroundColor: COLORS.GRAY_LIGHT },
  submitButtonText: { color: COLORS.WHITE, fontWeight: "600" },
  imagePickerButton: {
    marginTop: 6,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: COLORS.GRAY_LIGHT,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: COLORS.WHITE,
  },
  profileImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    color: COLORS.GRAY,
    fontSize: 14,
  },
});

export default RegisterComplete;
