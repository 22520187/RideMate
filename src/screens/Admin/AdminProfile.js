import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import COLORS from "../../constant/colors";
import SCREENS from "../../screens";
import { logout } from "../../services/authService";
import { clearTokens } from "../../utils/storage";
import { chatClient } from "../../utils/StreamClient";

const initialProfile = {
  fullName: "Quản trị viên RideMate",
  email: "admin@ridemate.vn",
  phone: "+84 901 234 567",
  role: "Super Admin",
};

const AdminProfile = () => {
  const navigation = useNavigation();
  const [profile, setProfile] = useState(initialProfile);
  const [editing, setEditing] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const handleChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setEditing(false);
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert(
        "Quyền bị từ chối",
        "Cần quyền truy cập thư viện ảnh để chọn ảnh."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleChangePassword = () => {
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu mới và xác nhận mật khẩu không khớp");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    // TODO: Implement actual password change API call
    Alert.alert("Thành công", "Đổi mật khẩu thành công");
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          try {
            // 1) Call backend logout (best-effort)
            try {
              await logout();
            } catch (apiErr) {
              console.log("⚠️ Logout API failed (continuing local logout):", apiErr?.message);
            }

            // Disconnect from Stream Chat
            try {
              await chatClient.disconnectUser();
              console.log("💬 Disconnected from Stream Chat");
            } catch (streamError) {
              console.log("⚠️  Stream disconnect failed:", streamError.message);
            }

            // Clear all authentication data
            await clearTokens(); // Clears tokens, userType, userData
            await AsyncStorage.clear(); // Clear onboarding flag

            // Inform user then navigate to Login screen
            Alert.alert("Thành công", "Đăng xuất thành công", [
              {
                text: "OK",
                onPress: () => {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: SCREENS.LOGIN }],
                  });
                },
              },
            ]);
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Lỗi", "Có lỗi xảy ra khi đăng xuất");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Hồ sơ quản trị</Text>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
          <View style={styles.avatarContainer}>
            <TouchableOpacity
              onPress={editing ? pickImage : undefined}
              disabled={!editing}
              style={styles.avatarWrapper}
            >
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={50} color={COLORS.GRAY} />
                </View>
              )}
              {editing && (
                <View style={styles.avatarEditIcon}>
                  <Ionicons name="camera" size={20} color={COLORS.WHITE} />
                </View>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Họ và tên</Text>
            <TextInput
              style={[styles.input, !editing && styles.inputDisabled]}
              value={profile.fullName}
              editable={editing}
              onChangeText={(value) => handleChange("fullName", value)}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Email đăng nhập</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={profile.email}
              editable={false}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput
              style={[styles.input, !editing && styles.inputDisabled]}
              value={profile.phone}
              editable={editing}
              onChangeText={(value) => handleChange("phone", value)}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Vai trò</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={profile.role}
              editable={false}
            />
          </View>
          <View style={styles.footerActions}>
            {editing ? (
              <>
                <TouchableOpacity
                  style={[styles.footerButton, styles.cancelButton]}
                  onPress={() => {
                    setProfile(initialProfile);
                    setAvatar(null);
                    setEditing(false);
                  }}
                >
                  <Text style={styles.cancelLabel}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.footerButton, styles.saveButton]}
                  onPress={handleSave}
                >
                  <Text style={styles.saveLabel}>Lưu thay đổi</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.footerButton, styles.primaryButton]}
                onPress={() => setEditing(true)}
              >
                <Text style={styles.primaryLabel}>Chỉnh sửa thông tin</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Đổi mật khẩu</Text>
          <Text style={styles.sectionDescription}>
            Đặt lại mật khẩu mạnh để bảo vệ tài khoản của bạn
          </Text>
          <View style={styles.field}>
            <Text style={styles.label}>Mật khẩu hiện tại</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={passwordData.currentPassword}
                onChangeText={(value) =>
                  handlePasswordChange("currentPassword", value)
                }
                secureTextEntry={!showPasswords.currentPassword}
                placeholder="Nhập mật khẩu hiện tại"
              />
              <TouchableOpacity
                onPress={() =>
                  setShowPasswords((prev) => ({
                    ...prev,
                    currentPassword: !prev.currentPassword,
                  }))
                }
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPasswords.currentPassword ? "eye-off" : "eye"}
                  size={20}
                  color={COLORS.GRAY}
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Mật khẩu mới</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={passwordData.newPassword}
                onChangeText={(value) =>
                  handlePasswordChange("newPassword", value)
                }
                secureTextEntry={!showPasswords.newPassword}
                placeholder="Nhập mật khẩu mới"
              />
              <TouchableOpacity
                onPress={() =>
                  setShowPasswords((prev) => ({
                    ...prev,
                    newPassword: !prev.newPassword,
                  }))
                }
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPasswords.newPassword ? "eye-off" : "eye"}
                  size={20}
                  color={COLORS.GRAY}
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={passwordData.confirmPassword}
                onChangeText={(value) =>
                  handlePasswordChange("confirmPassword", value)
                }
                secureTextEntry={!showPasswords.confirmPassword}
                placeholder="Nhập lại mật khẩu mới"
              />
              <TouchableOpacity
                onPress={() =>
                  setShowPasswords((prev) => ({
                    ...prev,
                    confirmPassword: !prev.confirmPassword,
                  }))
                }
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPasswords.confirmPassword ? "eye-off" : "eye"}
                  size={20}
                  color={COLORS.GRAY}
                />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            style={styles.changePasswordButton}
            onPress={handleChangePassword}
          >
            <Text style={styles.changePasswordLabel}>Đổi mật khẩu</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.WHITE} />
            <Text style={styles.logoutLabel}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.WHITE,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: COLORS.WHITE,
    opacity: 0.9,
    lineHeight: 20,
  },
  section: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.BLACK,
    marginBottom: 12,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 8,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.GRAY_BG,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.GRAY_BG,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.GRAY_LIGHT,
  },
  avatarEditIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.BLUE,
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: COLORS.WHITE,
  },
  sectionDescription: {
    fontSize: 13,
    color: COLORS.GRAY,
    marginBottom: 16,
    lineHeight: 18,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: COLORS.GRAY,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.BLACK,
  },
  inputDisabled: {
    backgroundColor: COLORS.GRAY_BG,
    color: COLORS.GRAY,
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  quickActionContent: {
    flex: 1,
    marginLeft: 14,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.BLACK,
  },
  quickActionDescription: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.GRAY,
    lineHeight: 18,
  },
  footerActions: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  footerButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.BLUE,
  },
  primaryLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.WHITE,
  },
  cancelButton: {
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  cancelLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.GRAY,
  },
  saveButton: {
    backgroundColor: COLORS.BLUE,
  },
  saveLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.WHITE,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.BLACK,
  },
  eyeIcon: {
    padding: 4,
  },
  changePasswordButton: {
    backgroundColor: COLORS.BLUE,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  changePasswordLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.WHITE,
  },
  logoutSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: COLORS.RED,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  logoutLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.WHITE,
  },
});

export default AdminProfile;
