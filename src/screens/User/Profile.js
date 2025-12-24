import React, { useState, useEffect } from "react";
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
  StatusBar,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import {
  ChevronRight,
  User,
  Car,
  CreditCard,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  Star,
  Edit,
  Camera,
  FileText,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import { useNavigation } from "@react-navigation/native";
import COLORS from "../../constant/colors";
import { getProfile, updateProfile } from "../../services/userService";
import { getMyVehicle } from "../../services/vehicleService";
import { normalizeMimeType, uploadImage } from "../../services/uploadService";
import { logout } from "../../services/authService";
import { clearTokens } from "../../utils/storage";
import { chatClient } from "../../utils/StreamClient";
import DateTimePicker from "@react-native-community/datetimepicker";
import VehicleRegistration from "../../components/VehicleRegistration";
import ImagePickerModal from "../../components/ImagePickerModal";
import GradientHeader from "../../components/GradientHeader";

const Profile = () => {
  const navigation = useNavigation();
  const [profile, setProfile] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    dob: null,
    address: "",
    bankAccountNumber: "",
    bankName: "",
    profilePictureUrl: "",
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

      // Fetch user profile
      const profileResp = await getProfile();
      // Some endpoints return UserDto directly in response.data,
      // others return ApiResponse { statusCode, message, data } in response.data.data
      const userData = profileResp?.data?.data ?? profileResp?.data;
      console.log("👤 [Profile] User data from API:", {
        totalRides: userData?.totalRides,
        coins: userData?.coins,
        rating: userData?.rating,
      });
      setProfile(userData);

      // Initialize edit form
      setEditForm({
        fullName: userData?.fullName || "",
        email: userData?.email || "",
        phoneNumber: userData?.phoneNumber || "",
        dob: userData?.dob ? new Date(userData.dob) : null,
        address: userData?.address || "",
        bankAccountNumber: userData?.bankAccountNumber || "",
        bankName: userData?.bankName || "",
        profilePictureUrl: userData?.profilePictureUrl || "",
      });

      // Fetch vehicle info - chỉ khi user là DRIVER
      if (userData?.userType === "DRIVER") {
        try {
          const vehicleResp = await getMyVehicle();
          const vehicleData = vehicleResp?.data?.data ?? vehicleResp?.data;
          console.log("📦 Vehicle data loaded:", vehicleData);
          console.log(
            "🖼️ Registration document URL:",
            vehicleData?.registrationDocumentUrl
          );
          setVehicle(vehicleData);
        } catch (err) {
          // Chỉ log nếu không phải 404 (vì 404 là bình thường nếu driver chưa đăng ký vehicle)
          if (err.response?.status !== 404) {
            console.warn("⚠️ Error fetching vehicle:", err.message);
          } else {
            console.log("ℹ️ No vehicle registered yet");
          }
          setVehicle(null);
        }
      } else {
        // PASSENGER không cần vehicle
        setVehicle(null);
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin người dùng");
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
    console.log("handlePickImage called with:", sourceType);
    setImagePickerVisible(false); // Close modal first

    // Wait for modal to close completely
    setTimeout(async () => {
      try {
        console.log("Requesting permission...");
        let result;

        if (sourceType === "camera") {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) {
            Alert.alert(
              "Cần quyền truy cập",
              "Vui lòng cho phép ứng dụng truy cập Camera để chụp ảnh đại diện.\n\nĐi tới Cài đặt > Quyền riêng tư > Camera."
            );
            return;
          }
          console.log("Launching camera...");
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
            Alert.alert(
              "Cần quyền truy cập",
              "Vui lòng cho phép ứng dụng truy cập Thư viện ảnh để chọn ảnh đại diện.\n\nĐi tới Cài đặt > Quyền riêng tư > Ảnh."
            );
            return;
          }
          console.log("Launching image library...");
          result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          console.log("Library closed. Result:", result?.canceled);
        }

        if (!result.canceled && result.assets && result.assets.length > 0) {
          await uploadProfileImage(result.assets[0]);
        }
      } catch (error) {
        console.error("Pick image error:", error);
        Alert.alert("Lỗi", "Không thể chọn ảnh");
      }
    }, 600); // Same timeout as VehicleRegistration
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
        asset?.fileName || asset?.name || `profile_${Date.now()}.jpg`;
      const mimeType = normalizeMimeType(
        asset?.mimeType || asset?.type,
        fileName
      );

      console.log("[UPLOAD] Uploading with:", {
        uri,
        type: mimeType,
        name: fileName,
      });

      const formData = new FormData();
      formData.append("file", {
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
        // Update profile with new image URL
        await updateProfile({ profilePictureUrl: imageUrl });

        // Refresh profile data
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

      // Basic email validation
      if (editForm.email && !/\S+@\S+\.\S+/.test(editForm.email)) {
        Alert.alert("Lỗi", "Email không hợp lệ");
        return;
      }

      // Basic phone validation
      if (
        editForm.phoneNumber &&
        !/^(\+84|0)[0-9]{9}$/.test(editForm.phoneNumber)
      ) {
        Alert.alert("Lỗi", "Số điện thoại không hợp lệ");
        return;
      }

      setUploading(true);

      const updateData = {
        fullName: editForm.fullName,
        email: editForm.email,
        phoneNumber: editForm.phoneNumber,
        profilePictureUrl: editForm.profilePictureUrl,
        dob: editForm.dob ? editForm.dob.toISOString().split("T")[0] : null, // Format as YYYY-MM-DD
        address: editForm.address,
        bankName: editForm.bankName,
        bankAccountNumber: editForm.bankAccountNumber,
      };

      await updateProfile(updateData);
      console.log("✅ Profile updated successfully");
      await fetchData();
      console.log("✅ Data refetched after update");
      setEditModalVisible(false);
      Alert.alert("Thành công", "Đã cập nhật thông tin");
    } catch (error) {
      console.error("Update profile error:", error);
      Alert.alert("Lỗi", "Không thể cập nhật thông tin. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          try {
            try {
              await logout();
            } catch (apiErr) {
              console.log(
                "⚠️ Logout API failed (continuing local logout):",
                apiErr?.message
              );
            }
            await chatClient.disconnectUser();
            await clearTokens();
            Alert.alert("Thành công", "Đăng xuất thành công", [
              {
                text: "OK",
                onPress: () => {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: "Login" }],
                  });
                },
              },
            ]);
          } catch (err) {
            console.error("Logout error:", err);
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
        <GradientHeader title="Tài khoản" showBackButton={false} />

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
                    "https://api.dicebear.com/7.x/avataaars/png?seed=user",
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
                {profile?.fullName || "Người dùng"}
              </Text>
              <Text style={styles.profilePhone}>
                {profile?.phoneNumber || "Chưa cập nhật"}
              </Text>
              {profile?.rating != null && (
                <View style={styles.ratingContainer}>
                  <Star size={14} color="#FFC107" fill="#FFC107" />
                  <Text style={styles.ratingText}>
                    {profile.rating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setEditModalVisible(true)}
            style={styles.editIconButton}
          >
            <Edit size={20} color={COLORS.PRIMARY} />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile?.coins || 0}</Text>
            <Text style={styles.statLabel}>Điểm thưởng</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile?.totalRides || 0}</Text>
            <Text style={styles.statLabel}>Chuyến đi</Text>
          </View>
        </View>

        {/* Vehicle Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phương tiện</Text>

          {/* Custom Vehicle Card with Status Badge */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setVehicleModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <Car size={22} color={COLORS.PRIMARY} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>
                {vehicle ? "Thông tin xe" : "Đăng ký xe"}
              </Text>
              <Text style={styles.menuSubtitle}>
                {vehicle &&
                vehicle.make &&
                vehicle.model &&
                vehicle.licensePlate
                  ? `${vehicle.make} ${vehicle.model} • ${vehicle.licensePlate}`
                  : vehicle
                  ? "Thông tin xe chưa đầy đủ"
                  : "Đăng ký để làm tài xế"}
              </Text>
              {vehicle?.status && (
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        vehicle.status === "PENDING"
                          ? "#FFF3CD"
                          : vehicle.status === "APPROVED"
                          ? "#D1E7DD"
                          : "#F8D7DA",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          vehicle.status === "PENDING"
                            ? "#856404"
                            : vehicle.status === "APPROVED"
                            ? "#0F5132"
                            : "#842029",
                      },
                    ]}
                  >
                    {vehicle.status === "PENDING"
                      ? "Chờ duyệt"
                      : vehicle.status === "APPROVED"
                      ? "Đã duyệt"
                      : "Bị từ chối"}
                  </Text>
                </View>
              )}
            </View>
            {!vehicle && (
              <View style={[styles.badge, { backgroundColor: "#FFC107" }]}>
                <Text style={styles.badgeText}>!</Text>
              </View>
            )}
            <ChevronRight size={20} color="#C7C7CC" />
          </TouchableOpacity>

          {/* Driver Status - Show if user has vehicle (any status) */}
          {vehicle && (
            <>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate("DriverStatus")}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconContainer}>
                  <MaterialIcons
                    name="online-prediction"
                    size={22}
                    color={COLORS.PRIMARY}
                  />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>Trạng thái tài xế</Text>
                  <Text style={styles.menuSubtitle}>
                    Bật/tắt chế độ nhận chuyến
                  </Text>
                </View>
                <ChevronRight size={20} color="#C7C7CC" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate("DriverStatistics")}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconContainer}>
                  <MaterialIcons
                    name="bar-chart"
                    size={22}
                    color={COLORS.PRIMARY}
                  />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>Thống kê & Báo cáo</Text>
                  <Text style={styles.menuSubtitle}>
                    Xem hiệu suất và thu nhập
                  </Text>
                </View>
                <ChevronRight size={20} color="#C7C7CC" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate("MyFixedRoutesScreen")}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconContainer}>
                  <MaterialIcons
                    name="route"
                    size={22}
                    color={COLORS.PRIMARY}
                  />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>Chuyến đi của tôi</Text>
                  <Text style={styles.menuSubtitle}>
                    Quản lý chuyến đi cố định
                  </Text>
                </View>
                <ChevronRight size={20} color="#C7C7CC" />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Trip Management Section - For Passengers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chuyến đi</Text>
          <MenuItem
            icon={FileText}
            title="Yêu cầu chuyến đi cố định"
            subtitle="Danh sách các yêu cầu của bạn"
            onPress={() => navigation.navigate("MyBookingsScreen")}
          />
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tài khoản</Text>
          <MenuItem
            icon={User}
            title="Thông tin cá nhân"
            subtitle="Cập nhật thông tin của bạn"
            onPress={() => setEditModalVisible(true)}
          />
          <MenuItem
            icon={CreditCard}
            title="Thanh toán"
            subtitle="Thẻ và ví điện tử"
            onPress={() =>
              Alert.alert("Thông báo", "Tính năng đang phát triển")
            }
          />
          <MenuItem
            icon={Bell}
            title="Thông báo"
            subtitle="Cài đặt thông báo"
            onPress={() => navigation.navigate("Notification")}
          />
        </View>

        {/* Security Section */}
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
        <View style={styles.editModal}>
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

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <ScrollView style={styles.editContent}>
              {/* Avatar Picker */}
              <View style={styles.avatarPickerContainer}>
                <TouchableOpacity
                  onPress={() => setImagePickerVisible(true)}
                  activeOpacity={0.8}
                  disabled={uploading}
                  style={styles.avatarPickerButton}
                >
                  <Image
                    source={{
                      uri:
                        profile?.profilePictureUrl ||
                        "https://api.dicebear.com/7.x/avataaars/png?seed=user",
                    }}
                    style={styles.editAvatar}
                  />
                  {uploading && (
                    <View style={styles.editUploadingOverlay}>
                      <ActivityIndicator size="small" color={COLORS.WHITE} />
                    </View>
                  )}
                  <View style={styles.editCameraButton}>
                    <Camera size={20} color={COLORS.WHITE} />
                  </View>
                </TouchableOpacity>
                <Text style={styles.avatarPickerHint}>
                  Nhấn để thay đổi ảnh đại diện
                </Text>
              </View>

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
                <Text style={styles.inputLabel}>Ngày sinh</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text
                    style={[
                      styles.dateText,
                      !editForm.dob && styles.datePlaceholder,
                    ]}
                  >
                    {editForm.dob
                      ? editForm.dob.toLocaleDateString("vi-VN")
                      : "Chọn ngày sinh"}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={editForm.dob || new Date(1990, 0, 1)}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setEditForm({ ...editForm, dob: selectedDate });
                      }
                    }}
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Địa chỉ</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={editForm.address}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, address: text })
                  }
                  placeholder="Nhập địa chỉ"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.email}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, email: text })
                  }
                  placeholder="Nhập email"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
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
                <Text style={styles.inputLabel}>Ngày sinh</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text
                    style={[
                      styles.dateText,
                      !editForm.dob && styles.datePlaceholder,
                    ]}
                  >
                    {editForm.dob
                      ? editForm.dob.toLocaleDateString("vi-VN")
                      : "Chọn ngày sinh"}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={editForm.dob || new Date(1990, 0, 1)}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setEditForm({ ...editForm, dob: selectedDate });
                      }
                    }}
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Địa chỉ</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={editForm.address}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, address: text })
                  }
                  placeholder="Nhập địa chỉ"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tên ngân hàng</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.bankName}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, bankName: text })
                  }
                  placeholder="Ví dụ: Vietcombank"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Số tài khoản</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.bankAccountNumber}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, bankAccountNumber: text })
                  }
                  placeholder="Nhập số tài khoản"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>

          {/* Image Picker Modal - Inside Edit Modal like VehicleRegistration */}
          <ImagePickerModal
            visible={imagePickerVisible}
            onClose={() => setImagePickerVisible(false)}
            onCameraPress={() => handlePickImage("camera")}
            onLibraryPress={() => handlePickImage("library")}
            title="Chọn ảnh đại diện"
          />
        </View>
      </Modal>

      {/* Vehicle Registration Modal */}
      <VehicleRegistration
        visible={vehicleModalVisible}
        onClose={() => setVehicleModalVisible(false)}
        onSuccess={(vehicleData) => {
          setVehicle(vehicleData);
          fetchData(); // Refresh data
        }}
        initialVehicle={vehicle} // Pass existing vehicle data
      />
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
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.WHITE,
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
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  editIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F8FF",
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.PRIMARY,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "500",
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
  statusBadge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
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
    backgroundColor: "#DC3545",
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
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
    backgroundColor: "#FFFFFF",
    paddingTop: 30,
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
  avatarPickerContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarPickerButton: {
    position: "relative",
  },
  editAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F0F0F0",
    borderWidth: 3,
    borderColor: COLORS.PRIMARY,
  },
  editUploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  editCameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: COLORS.WHITE,
  },
  avatarPickerHint: {
    marginTop: 12,
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#F9F9F9",
    marginBottom: 12,
    color: "#1C1C1E",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  dateButton: {
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#F9F9F9",
    marginBottom: 12,
  },
  dateText: {
    fontSize: 16,
    color: "#1C1C1E",
  },
  datePlaceholder: {
    color: "#999",
  },

  // Bottom Sheet (for image picker in edit modal)
  bottomSheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  bottomSheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  bottomSheet: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 20,
    textAlign: "center",
  },
  bottomSheetOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F8F9FA",
    marginBottom: 12,
    gap: 12,
  },
  bottomSheetOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  bottomSheetCancel: {
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  bottomSheetCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8E8E93",
    flex: 1,
    textAlign: "center",
  },
});

export default Profile;
