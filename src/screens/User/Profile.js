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
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import COLORS from "../../constant/colors";
import { getProfile, updateProfile } from "../../services/userService";
import { getMyVehicle } from "../../services/vehicleService";
import { uploadImage } from "../../services/uploadService";
import { logout } from "../../services/authService";
import { clearTokens } from "../../utils/storage";
import { chatClient } from "../../utils/StreamClient";
import DateTimePicker from "@react-native-community/datetimepicker";
import VehicleRegistration from "../../components/VehicleRegistration";
import ImagePickerModal from "../../components/ImagePickerModal";

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
    dob: null,
    address: "",
    bankAccountNumber: "",
    bankName: "",
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
      setProfile(userData);

      // Initialize edit form
      setEditForm({
        fullName: userData?.fullName || "",
        dob: userData?.dob ? new Date(userData.dob) : null,
        address: userData?.address || "",
        bankAccountNumber: userData?.bankAccountNumber || "",
        bankName: userData?.bankName || "",
      });

      // Fetch vehicle info
      try {
        const vehicleResp = await getMyVehicle();
        const vehicleData = vehicleResp?.data?.data ?? vehicleResp?.data;
        setVehicle(vehicleData);
      } catch (err) {
        console.log("No vehicle found");
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
    console.log('handlePickImage called with:', sourceType);
    setImagePickerVisible(false); // Close modal first
    
    try {
      console.log('Requesting permission...');
      let result;
      
      if (sourceType === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Cần quyền truy cập',
            'Vui lòng cho phép ứng dụng truy cập Camera để chụp ảnh đại diện.\n\nĐi tới Cài đặt > Quyền riêng tư > Camera.'
          );
          return;
        }
        console.log('Launching camera...');
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: 'Images',
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Cần quyền truy cập',
            'Vui lòng cho phép ứng dụng truy cập Thư viện ảnh để chọn ảnh đại diện.\n\nĐi tới Cài đặt > Quyền riêng tư > Ảnh.'
          );
          return;
        }
        console.log('Launching image library...');
        result = await ImagePicker.launchImageLibraryAsync();
        console.log('Library closed. Result:', JSON.stringify(result));
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      setImagePickerVisible(false);
      console.error("Pick image error:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh");
    }
  };

  const uploadProfileImage = async (imageUri) => {
    try {
      setUploading(true);

      // Prepare image for upload
      let uri = imageUri;
      if (
        Platform.OS === "android" &&
        !uri.startsWith("file://") &&
        !uri.startsWith("http")
      ) {
        uri = `file://${uri}`;
      }

      const fileName = `profile_${Date.now()}.jpg`;
      const formData = new FormData();
      formData.append("file", {
        uri: uri,
        type: "image/jpeg",
        name: fileName,
      });

      // Upload image
      const uploadResp = await uploadImage(formData);
      console.log('Upload response:', JSON.stringify(uploadResp));
      const imageUrl = uploadResp?.data?.url;
      console.log('Got Image URL:', imageUrl);

      if (imageUrl) {
        // Update profile with new image URL
        const updateData = { profilePictureUrl: imageUrl };
        console.log('Updating profile with data:', JSON.stringify(updateData));
        await updateProfile(updateData);

        // Update local state without closing modal
        setProfile(prev => ({ ...prev, profilePictureUrl: imageUrl }));
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
        dob: editForm.dob ? editForm.dob.toISOString() : null,
        address: editForm.address,
        bankAccountNumber: editForm.bankAccountNumber,
        bankName: editForm.bankName,
      };

      await updateProfile(updateData);
      await fetchData();
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
            // 1) Call backend logout (best-effort)
            try {
              await logout();
            } catch (apiErr) {
              console.log("⚠️ Logout API failed (continuing local logout):", apiErr?.message);
            }

            // 2) Disconnect chat + clear local auth
            await chatClient.disconnectUser();
            await clearTokens();

            // 3) Inform user then navigate to Login
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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tài khoản</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileLeft}>
            <View>
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
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {profile?.fullName || "Người dùng"}
              </Text>
              <Text style={styles.profilePhone}>
                {profile?.phoneNumber || "Chưa cập nhật"}
              </Text>
              {typeof profile?.rating === "number" && (
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
          <MenuItem
            icon={Car}
            title={vehicle ? "Thông tin xe" : "Đăng ký xe"}
            subtitle={
              vehicle
                ? `${vehicle.make} ${vehicle.model} • ${vehicle.licensePlate}`
                : "Đăng ký để làm tài xế"
            }
            onPress={() => {
              if (!vehicle) {
                // Open vehicle registration modal
                setVehicleModalVisible(true);
              } else {
                // Show vehicle info
                Alert.alert(
                  "Thông tin xe",
                  `${vehicle.make} ${vehicle.model}\nBiển số: ${
                    vehicle.licensePlate
                  }\nMàu sắc: ${vehicle.color}\nSức chứa: ${
                    vehicle.capacity
                  } người\nTrạng thái: ${
                    vehicle.status === "APPROVED"
                      ? "✅ Đã duyệt"
                      : "⏳ Chờ duyệt"
                  }`,
                  [{ text: "OK" }]
                );
              }
            }}
            showBadge={!vehicle}
            badgeColor="#FFC107"
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

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <SafeAreaView style={styles.editModal} edges={["top"]}>
          <View style={styles.editHeader}>
            <TouchableOpacity 
              style={styles.headerButton} 
              onPress={() => setEditModalVisible(false)}
            >
              <Text style={styles.editCancel}>Hủy</Text>
            </TouchableOpacity>
            <Text style={styles.editTitle}>Chỉnh sửa thông tin</Text>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={handleSaveProfile} 
              disabled={uploading}
            >
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
                onPress={() => {
                  Alert.alert(
                    'Chọn ảnh đại diện',
                    'Chọn nguồn ảnh',
                    [
                      {
                        text: 'Chụp ảnh',
                        onPress: () => handlePickImage('camera'),
                      },
                      {
                        text: 'Chọn từ thư viện',
                        onPress: () => handlePickImage('library'),
                      },
                      {
                        text: 'Hủy',
                        style: 'cancel',
                      },
                    ]
                  );
                }}
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
              <Text style={styles.avatarPickerHint}>Nhấn để thay đổi ảnh đại diện</Text>
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
                Platform.OS === 'ios' ? (
                  <Modal
                    transparent
                    animationType="fade"
                    visible={showDatePicker}
                    onRequestClose={() => setShowDatePicker(false)}
                  >
                    <View style={styles.iosDatePickerOverlay}>
                      <View style={styles.iosDatePickerContainer}>
                        <View style={styles.iosDatePickerHeader}>
                          <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                            <Text style={styles.iosDatePickerCancel}>Hủy</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                            <Text style={styles.iosDatePickerDone}>Xong</Text>
                          </TouchableOpacity>
                        </View>
                        <DateTimePicker
                          value={editForm.dob || new Date(1990, 0, 1)}
                          mode="date"
                          display="spinner"
                          onChange={(event, selectedDate) => {
                            if (selectedDate) {
                              setEditForm(prev => ({ ...prev, dob: selectedDate }));
                            }
                          }}
                          style={{ height: 200 }}
                          textColor="#000000"
                        />
                      </View>
                    </View>
                  </Modal>
                ) : (
                  <DateTimePicker
                    value={editForm.dob || new Date(1990, 0, 1)}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (event.type === 'set' && selectedDate) {
                        setEditForm(prev => ({ ...prev, dob: selectedDate }));
                      }
                    }}
                  />
                )
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
        </SafeAreaView>
      </Modal>

      {/* Vehicle Registration Modal */}
      <VehicleRegistration
        visible={vehicleModalVisible}
        onClose={() => setVehicleModalVisible(false)}
        onSuccess={(vehicleData) => {
          setVehicle(vehicleData);
          fetchData(); // Refresh data
        }}
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
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 30, // Add bottom margin for scroll view
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
    backgroundColor: COLORS.WHITE,
  },
  editHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerButton: {
    paddingVertical: 8,
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
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  dateButton: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  dateText: {
    fontSize: 16,
    color: "#1C1C1E",
  },
  datePlaceholder: {
    color: "#999",
  },
  iosDatePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  iosDatePickerContainer: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  iosDatePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  iosDatePickerCancel: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '600',
  },
  iosDatePickerDone: {
    color: COLORS.PRIMARY,
    fontSize: 16,
    fontWeight: '700',
  },
  avatarPickerContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 20,
  },
  avatarPickerButton: {
    position: 'relative',
  },
  editAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
    borderWidth: 3,
    borderColor: COLORS.PRIMARY,
  },
  editCameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.PRIMARY,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.WHITE,
  },
  editUploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPickerHint: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E8E93',
  },
});

export default Profile;
