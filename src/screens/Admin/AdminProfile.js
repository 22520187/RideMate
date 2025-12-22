import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import COLORS from "../../constant/colors";
import SCREENS from "../../screens";
import { logout } from "../../services/authService";
import { clearTokens } from "../../utils/storage";
import { chatClient } from "../../utils/StreamClient";
import { MaterialIcons } from "@expo/vector-icons";
import {
  ChevronRight,
  User,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  Edit,
  Camera,
} from "lucide-react-native";
import { getProfile, updateProfile } from "../../services/userService";
import { normalizeMimeType, uploadImage } from "../../services/uploadService";

const AdminProfile = () => {
  const navigation = useNavigation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [editForm, setEditForm] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    userType: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchData();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const profileResp = await getProfile();
      // Some endpoints return UserDto directly in response.data,
      // others return ApiResponse { statusCode, message, data } in response.data.data
      const userData = profileResp?.data?.data ?? profileResp?.data;

      setProfile(userData);
      setEditForm({
        fullName: userData?.fullName || "",
        phoneNumber: userData?.phoneNumber || userData?.phone || "",
        email: userData?.email || "",
        userType: userData?.userType || "",
      });
    } catch (error) {
      console.error("Failed to load admin profile:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin quản trị viên");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handlePickImage = async (sourceType) => {
    try {
      setImagePickerVisible(false);

      let result;
      if (sourceType === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert("Lỗi", "Cần cấp quyền truy cập camera");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert("Lỗi", "Cần cấp quyền truy cập thư viện ảnh");
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadProfileImage(result.assets[0]);
      }
    } catch (error) {
      console.error("Pick image error:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh");
    }
  };

  const ensureFileUri = async (inputUri) => {
    let uri = inputUri;
    if (!uri) return uri;

    // Android: content:// -> copy to cache => file://
    if (Platform.OS === "android" && uri.startsWith("content://")) {
      const dest = `${FileSystem.cacheDirectory}upload_${Date.now()}.jpg`;
      await FileSystem.copyAsync({ from: uri, to: dest });
      uri = dest;
    }

    // Android: plain path -> file://
    if (
      Platform.OS === "android" &&
      !uri.startsWith("file://") &&
      !uri.startsWith("http")
    ) {
      uri = `file://${uri}`;
    }

    return uri;
  };

  const uploadProfileImage = async (asset) => {
    try {
      setUploading(true);

      const rawUri = asset?.uri;
      if (!rawUri) {
        Alert.alert("Lỗi", "Không tìm thấy ảnh để upload");
        return;
      }

      // Normalize uri for upload
      let uri = await ensureFileUri(rawUri);

      // Resize/compress to reduce upload failures (server limits / connection reset)
      try {
        const manipulated = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 1024 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        uri = await ensureFileUri(manipulated?.uri || uri);
      } catch (manipErr) {
        console.log("[UPLOAD] Image compress skipped:", manipErr?.message);
      }

      const fileName =
        asset?.fileName || asset?.name || `admin_profile_${Date.now()}.jpg`;
      const mimeType = normalizeMimeType(
        asset?.mimeType || asset?.type,
        fileName
      );

      console.log("[UPLOAD] Uploading with:", {
        uri,
        type: mimeType,
        name: fileName,
      });

      const fileInfo = {
        uri,
        type: mimeType,
        name: fileName,
      };

      // Upload image
      const uploadResp = await uploadImage(fileInfo);
      const imageUrl = uploadResp?.data?.url;

      if (imageUrl) {
        await updateProfile({ profilePictureUrl: imageUrl });
        await fetchData();
        Alert.alert("Thành công", "Đã cập nhật ảnh đại diện");
      } else {
        throw new Error("No image URL returned");
      }
    } catch (error) {
      console.error("Upload image error:", error);
      Alert.alert("Lỗi", "Không thể tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (!editForm.fullName.trim()) {
        Alert.alert("Lỗi", "Vui lòng nhập họ tên");
        return;
      }

      setUploading(true);
      const updateData = {
        fullName: editForm.fullName,
        phoneNumber: editForm.phoneNumber,
      };
      await updateProfile(updateData);
      await fetchData();
      setEditModalVisible(false);
      Alert.alert("Thành công", "Đã cập nhật thông tin");
    } catch (error) {
      console.error("Update admin profile error:", error);
      Alert.alert("Lỗi", "Không thể cập nhật thông tin. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
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
              console.log(
                "⚠️ Logout API failed (continuing local logout):",
                apiErr?.message
              );
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

  const MenuItem = ({
    icon: Icon,
    title,
    subtitle,
    onPress,
    showBadge,
    badgeColor = COLORS.RED,
  }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuIconContainer}>
        <Icon size={22} color={COLORS.PRIMARY} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {showBadge && (
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>!</Text>
        </View>
      )}
      <ChevronRight size={20} color="#C7C7CC" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.PRIMARY]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tài khoản</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileLeft}>
            <TouchableOpacity
              onPress={() => setImagePickerVisible(true)}
              activeOpacity={0.8}
              disabled={uploading}
            >
              <Image
                source={{
                  uri:
                    profile?.profilePictureUrl ||
                    "https://api.dicebear.com/7.x/avataaars/png?seed=admin",
                }}
                style={styles.avatar}
              />
              {uploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color={COLORS.WHITE} />
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {profile?.fullName || "Quản trị viên"}
              </Text>
              <Text style={styles.profilePhone}>
                {profile?.email || "Chưa cập nhật email"}
              </Text>
              <Text style={styles.profileSub}>
                {profile?.phoneNumber || "Chưa cập nhật số điện thoại"}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setEditModalVisible(true)}
            style={styles.editIconButton}
          >
            <Edit size={20} color={COLORS.PRIMARY} />
          </TouchableOpacity>
        </View>

        {/* Personal Info (schema-aligned) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Họ và tên</Text>
              <Text style={styles.infoValue}>{profile?.fullName || "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Số điện thoại</Text>
              <Text style={styles.infoValue}>
                {profile?.phoneNumber || "-"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{profile?.email || "-"}</Text>
            </View>
            <View style={[styles.infoRow, styles.infoRowLast]}>
              <Text style={styles.infoLabel}>Loại tài khoản</Text>
              <Text style={styles.infoValue}>{profile?.userType || "-"}</Text>
            </View>
          </View>
        </View>
        {/* Security & Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bảo mật & Hỗ trợ</Text>
          <MenuItem
            icon={Shield}
            title="Bảo mật"
            subtitle="Mật khẩu và xác thực"
            onPress={() =>
              Alert.alert("Thông báo", "Tính năng đang phát triển")
            }
          />
          <MenuItem
            icon={HelpCircle}
            title="Trợ giúp"
            subtitle="Câu hỏi thường gặp"
            onPress={() =>
              Alert.alert("Thông báo", "Tính năng đang phát triển")
            }
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <LogOut size={22} color={COLORS.WHITE} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>Phiên bản 1.0.0</Text>
      </ScrollView>

      {/* Image Picker Modal */}
      <Modal
        visible={imagePickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setImagePickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setImagePickerVisible(false)}
        >
          <View style={styles.imagePickerModal}>
            <Text style={styles.modalTitle}>Chọn ảnh đại diện</Text>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => handlePickImage("camera")}
            >
              <Camera size={24} color={COLORS.PRIMARY} />
              <Text style={styles.modalOptionText}>Chụp ảnh</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => handlePickImage("library")}
            >
              <MaterialIcons
                name="photo-library"
                size={24}
                color={COLORS.PRIMARY}
              />
              <Text style={styles.modalOptionText}>Chọn từ thư viện</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalOption, styles.modalCancel]}
              onPress={() => setImagePickerVisible(false)}
            >
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <SafeAreaView style={styles.editModal} edges={["top"]}>
          <View style={styles.editHeader}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Text style={styles.editCancel}>Hủy</Text>
            </TouchableOpacity>
            <Text style={styles.editTitle}>Chỉnh sửa thông tin</Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator size="small" color={COLORS.PRIMARY} />
              ) : (
                <Text style={styles.editSave}>Lưu</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.editContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Họ và tên *</Text>
              <TextInput
                style={styles.textInput}
                value={editForm.fullName}
                onChangeText={(text) =>
                  setEditForm({ ...editForm, fullName: text })
                }
                placeholder="Nhập họ tên"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Số điện thoại</Text>
              <TextInput
                style={styles.textInput}
                value={editForm.phoneNumber}
                onChangeText={(text) =>
                  setEditForm({ ...editForm, phoneNumber: text })
                }
                placeholder="Nhập số điện thoại"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[styles.textInput, styles.textInputDisabled]}
                value={editForm.email}
                editable={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Loại tài khoản</Text>
              <TextInput
                style={[styles.textInput, styles.textInputDisabled]}
                value={editForm.userType}
                editable={false}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#004553",
    letterSpacing: -0.5,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8F9FA",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  profileLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F0F0F0",
    borderWidth: 3,
    borderColor: COLORS.PRIMARY,
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  profilePhone: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 2,
  },
  profileSub: {
    fontSize: 13,
    color: "#8E8E93",
  },
  editIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F8FF",
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  infoCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "600",
    marginLeft: 12,
    flexShrink: 1,
    textAlign: "right",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F8FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: "#8E8E93",
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  badgeText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: "700",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.RED,
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: COLORS.RED,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.WHITE,
  },
  version: {
    textAlign: "center",
    fontSize: 13,
    color: "#C7C7CC",
    marginTop: 24,
    marginBottom: 32,
  },

  // Image Picker Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  imagePickerModal: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 20,
    textAlign: "center",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F8F9FA",
    marginBottom: 12,
    gap: 12,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  modalCancel: {
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8E8E93",
    flex: 1,
    textAlign: "center",
  },

  // Edit Modal
  editModal: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  editHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  editCancel: {
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "600",
  },
  editTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  editSave: {
    fontSize: 16,
    color: COLORS.PRIMARY,
    fontWeight: "700",
  },
  editContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1C1C1E",
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  textInputDisabled: {
    backgroundColor: "#F3F4F6",
    color: "#6B7280",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
});

export default AdminProfile;
