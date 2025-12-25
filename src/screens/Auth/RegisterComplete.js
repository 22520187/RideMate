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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Camera, User } from "lucide-react-native";
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
import SnowEffect from "../../components/SnowEffect";
import GradientHeader from "../../components/GradientHeader";

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
      Toast.show({ type: "error", text1: "Lỗi", text2: "Vui lòng nhập họ tên" });
      return;
    }
    if (!password || password.length < 8) {
      Toast.show({ type: "error", text1: "Lỗi", text2: "Mật khẩu phải có ít nhất 8 ký tự" });
      return;
    }
    if (password !== confirmPassword) {
      Toast.show({ type: "error", text1: "Lỗi", text2: "Mật khẩu xác nhận không khớp" });
      return;
    }
    setLoading(true);
    try {
      let profilePictureUrl = null;
      if (profilePicture) {
        try {
          const uploadResponse = await uploadImage({
            uri: profilePicture.uri,
            name: profilePicture.fileName || "profile.jpg",
            type: profilePicture.type || "image/jpeg",
          });
          profilePictureUrl = uploadResponse.data.url;
        } catch (uploadError) {
          console.warn("Profile picture upload failed:", uploadError.message);
          Toast.show({ type: "info", text1: "Thông báo", text2: "Upload ảnh thất bại, tiếp tục đăng ký" });
          profilePictureUrl = null; // Continue without image
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
      
      const authData = res.data.data;
      
      await saveToken(authData.accessToken);
      if (authData.refreshToken) await saveRefreshToken(authData.refreshToken);
      if (authData.chatToken) await saveChatToken(authData.chatToken);
      if (authData?.user) {
        await saveUserData(authData.user);
        if (authData.user.userType) await saveUserType(authData.user.userType);
      }
      
      if (authData?.chatToken && authData?.user) {
        try {
            await chatClient.connectUser(
            {
                id: authData.user.id.toString(),
                name: authData.user.fullName,
                image: profilePictureUrl || null,
            },
            authData.chatToken
            );
        } catch (e) {
            console.log("Stream connect error (ignored):", e);
        }
      }
      
      Toast.show({ type: "success", text1: "Thành công", text2: "Đăng ký thành công" });
      await new Promise((resolve) => setTimeout(resolve, 200));
      navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
    } catch (error) {
      console.error(error);
      Toast.show({ type: "error", text1: "Lỗi", text2: error?.response?.data?.message || "Đăng ký thất bại" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <SnowEffect />
      <GradientHeader 
        title="✨ Hoàn tất hồ sơ" 
        showBackButton={true} 
        onBackPress={() => navigation.goBack()} 
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Picker */}
          <View style={styles.imagePickerContainer}>
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
                    <User size={40} color="#FF6B9D" />
                    <View style={styles.cameraIconBadge}>
                        <Camera size={16} color={COLORS.WHITE} />
                    </View>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.uploadText}>Cập nhật ảnh đại diện</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
            
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Họ và tên <Text style={styles.required}>*</Text></Text>
                <TextInput
                style={styles.input}
                placeholder="Nhập họ tên đầy đủ"
                placeholderTextColor={COLORS.PLACEHOLDER_COLOR}
                value={fullName}
                onChangeText={setFullName}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email (mã hoá đơn)</Text>
                <TextInput
                style={styles.input}
                placeholder="example@email.com"
                placeholderTextColor={COLORS.PLACEHOLDER_COLOR}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mật khẩu <Text style={styles.required}>*</Text></Text>
                <TextInput
                style={styles.input}
                placeholder="Tối thiểu 8 ký tự"
                placeholderTextColor={COLORS.PLACEHOLDER_COLOR}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Xác nhận mật khẩu <Text style={styles.required}>*</Text></Text>
                <TextInput
                style={styles.input}
                placeholder="Nhập lại mật khẩu"
                placeholderTextColor={COLORS.PLACEHOLDER_COLOR}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                />
            </View>

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Bạn là ai?</Text>
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
                  🙆 Hành khách
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
                  🚗 Tài xế
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
               {loading ? (
                 <View style={styles.submitButtonGradient}>
                    <Text style={styles.submitButtonText}>Đang tạo tài khoản...</Text>
                 </View>
               ) : (
                <LinearGradient
                  colors={["#FF5370", "#FF6B9D", "#FF8FAB"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitButtonGradient}
                >
                  <Text style={styles.submitButtonText}>Hoàn tất đăng ký</Text>
                </LinearGradient>
               )}
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  container: { flex: 1, backgroundColor: "#FFF5F7" },
  keyboardAvoidingView: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  
  imagePickerContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  imagePickerButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.WHITE,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFE5EC",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  profileImage: {
    width: 94,
    height: 94,
    borderRadius: 47,
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  cameraIconBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "#FF5370",
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: COLORS.WHITE,
  },
  uploadText: {
    marginTop: 12,
    color: "#FF5370",
    fontSize: 14,
    fontWeight: "600",
  },

  formContainer: {},
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#004553",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF5370",
    marginBottom: 8,
  },
  required: {
    color: "red",
  },
  input: {
    borderWidth: 2,
    borderColor: "#FFE5EC",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.BLACK,
    backgroundColor: COLORS.WHITE,
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  
  typeRow: { flexDirection: "row", gap: 12, marginTop: 4, marginBottom: 24 },
  typeButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: "#FFE5EC",
    borderRadius: 12,
    backgroundColor: COLORS.WHITE,
    alignItems: "center",
  },
  typeButtonActive: {
    borderColor: "#FF5370",
    backgroundColor: "#FFF0F3",
  },
  typeText: { 
      color: COLORS.GRAY,
      fontWeight: '600',
      fontSize: 15
  },
  typeTextActive: { 
      color: "#FF5370",
      fontWeight: '700'
  },
  
  submitButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 10,
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  submitButtonDisabled: { backgroundColor: COLORS.GRAY_LIGHT, opacity: 0.7 },
  submitButtonText: { color: COLORS.WHITE, fontWeight: "700", fontSize: 18 },
});

export default RegisterComplete;
