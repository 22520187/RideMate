import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
  LayoutAnimation,
  UIManager,
  Modal,
  FlatList,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearTokens } from "../../utils/storage";
import { normalizeMimeType } from "../../services/uploadService";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import COLORS from "../../constant/colors";
import { getProfile } from "../../services/userService";
import { getMyVehicle, registerVehicle } from "../../services/vehicleService";
import { uploadImage } from "../../services/uploadService";
import AsyncStorageService from "../../services/AsyncStorageService";
import { chatClient } from "../../utils/StreamClient";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Profile() {
  const navigation = useNavigation();
  const [profile, setProfile] = useState({
    fullName: "",
    dob: null,
    address: "",
    licensePlate: "",
    phone: "",
    bankAccountNumber: "",
    bankName: "",
    verificationImage: null,
    email: "",
    profilePictureUrl: "",
    rating: 5.0,
    coins: 100,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const DEFAULT_AVATAR = "https://randomuser.me/api/portraits/lego/1.jpg";

  const update = (key, value) => {
    setProfile((p) => ({ ...p, [key]: value }));
    setErrors((e) => ({ ...e, [key]: null }));
  };

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUserAndVehicle();
  }, []);

  const fetchUserAndVehicle = async () => {
    try {
      setLoading(true);
      const apiResp = await getProfile();
      const user = apiResp?.data?.data;

      // Load saved profile from AsyncStorage
      const savedProfile = await AsyncStorageService.getProfile();
      if (user) {
        setProfile((p) => ({
          ...p,
          fullName: user.fullName || savedProfile?.fullName || "",
          phone: user.phoneNumber || savedProfile?.phone || "",
          email: user.email || savedProfile?.email || "",
          profilePictureUrl: user.profilePictureUrl || "",
          rating: user.rating || 0,
          coins: user.coins || 0,
          dob: savedProfile?.dob ? new Date(savedProfile.dob) : p.dob,
          address: savedProfile?.address || "",
          bankAccountNumber: savedProfile?.bankAccountNumber || "",
          bankName: savedProfile?.bankName || "",
        }));

        // Try to fetch vehicle info
        try {
          const vehResp = await getMyVehicle();
          const vehicle = vehResp?.data?.data;

          if (vehicle) {
            setRegistered(true);
            setApproved(vehicle.status === "APPROVED");
            setVehicleData({
              licensePlate: vehicle.licensePlate || "",
              make: vehicle.make || "",
              model: vehicle.model || "",
              color: vehicle.color || "",
              capacity: vehicle.capacity || 1,
              vehicleType: vehicle.vehicleType || "MOTORBIKE",
              images: vehicle.registrationDocumentUrl
                ? [{ uri: vehicle.registrationDocumentUrl }]
                : [],
              registrationDocumentUrl: vehicle.registrationDocumentUrl || "",
            });
          } else {
            console.log("No vehicle found");
            setRegistered(false);
          }
        } catch (e) {
          console.warn("Failed to fetch vehicle:", e);
          setRegistered(false);
        }
      }
    } catch (err) {
      console.warn("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const [registered, setRegistered] = useState(false);
  const [approved, setApproved] = useState(false);
  const [vehicleData, setVehicleData] = useState({
    licensePlate: "",
    make: "",
    model: "",
    color: "",
    capacity: 1,
    vehicleType: "MOTORBIKE",
    images: [],
    registrationDocumentUrl: "",
  });
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpenVisible, setConfirmOpenVisible] = useState(false);
  const [vehicleTypeModalVisible, setVehicleTypeModalVisible] = useState(false);

  // Helper function to format license plate
  const formatLicensePlate = (text) => {
    // Remove all spaces and convert to uppercase
    let formatted = text.replace(/\s/g, "").toUpperCase();

    // Remove any non-alphanumeric except dash
    formatted = formatted.replace(/[^0-9A-Z-]/g, "");

    // Auto-format: XX-YZZZZ or XX-YY-ZZZZ
    // Pattern: 2 digits, 1-2 letters, dash, 4-5 digits
    // Limit to max 10 characters (e.g., "51AB-12345")
    if (formatted.length > 10) {
      formatted = formatted.substring(0, 10);
    }

    return formatted;
  };

  // Helper function to validate license plate format
  const validateLicensePlate = (plate) => {
    if (!plate || !plate.trim()) {
      return { valid: false, message: "Biển số xe không được để trống" };
    }

    const trimmed = plate.trim().toUpperCase();
    // Backend regex: ^[0-9]{2}[A-Z]{1,2}-[0-9]{4,5}$
    const regex = /^[0-9]{2}[A-Z]{1,2}-[0-9]{4,5}$/;

    if (!regex.test(trimmed)) {
      return {
        valid: false,
        message:
          "Biển số phải có định dạng: XX-YZZZZ hoặc XX-YY-ZZZZ\nVí dụ: 30A-12345 hoặc 51AB-12345",
      };
    }

    return { valid: true, message: null };
  };

  const vehicleTypes = [
    { label: "Xe máy", value: "MOTORBIKE" },
    { label: "Ô tô", value: "CAR" },
    { label: "Van", value: "VAN" },
    { label: "Tải", value: "TRUCK" },
  ];

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
      quality: 0.8,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      const name =
        asset.fileName ||
        asset.uri.split("/").pop() ||
        `photo_${Date.now()}.jpg`;
      const ext = (name && name.split(".").pop()) || "jpg";
      const getMimeType = (assetType, fileName) => {
        if (assetType && assetType.startsWith("image/")) {
          return assetType;
        }
        const ext =
          (fileName && fileName.split(".").pop()?.toLowerCase()) || "jpg";
        const mimeMap = {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          gif: "image/gif",
          webp: "image/webp",
        };
        return mimeMap[ext] || "image/jpeg";
      };

      const type = getMimeType(asset.type, name);

      if (editing) {
        setVehicleData((prev) => ({
          ...prev,
          images: [...prev.images, { uri: asset.uri, name, type }],
        }));
      } else {
        update("verificationImage", {
          uri: asset.uri,
          fileName: name,
          type,
        });
      }
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Không có quyền", "Cần cấp quyền camera để chụp ảnh.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      const name =
        asset.fileName ||
        asset.uri.split("/").pop() ||
        `photo_${Date.now()}.jpg`;
      const ext = (name && name.split(".").pop()) || "jpg";
      const type = asset.type || `image/${ext === "jpg" ? "jpeg" : ext}`;

      if (editing) {
        setVehicleData((prev) => ({
          ...prev,
          images: [...prev.images, { uri: asset.uri, name, type }],
        }));
      } else {
        update("verificationImage", {
          uri: asset.uri,
          fileName: name,
          type,
        });
      }
    }
  };

  const appendImageFromUri = (uri) => {
    const name = uri.split("/").pop();
    const ext = (name && name.split(".").pop()) || "jpg";
    const type = `image/${ext === "jpg" ? "jpeg" : ext}`;

    setVehicleData((prev) => ({
      ...prev,
      images: [...prev.images, { uri, name, type }],
    }));
  };

  const removeImageAt = (index) => {
    setVehicleData((prev) => {
      const newArr = [...prev.images];
      newArr.splice(index, 1);
      return { ...prev, images: newArr };
    });
  };

  const onOpenRegisterConfirm = () => {
    setConfirmOpenVisible(true);
  };

  const confirmOpenRegister = async () => {
    setConfirmOpenVisible(false);
    setEditing(true);
  };

  const cancelEditing = () => {
    if (!registered) {
      setVehicleData({ licensePlate: "", images: [] });
    } else {
      fetchUserAndVehicle();
    }
    setEditing(false);
  };

  const uriToBlob = async (uri) => {
    const resp = await fetch(uri);
    const blob = await resp.blob();
    return blob;
  };

  const submitRegistration = async () => {
    // Validate required fields
    if (!vehicleData.licensePlate?.trim()) {
      setErrors((e) => ({
        ...e,
        licensePlate: "Biển số xe không được để trống",
      }));
      Alert.alert("Thiếu thông tin", "Vui lòng nhập biển số xe.");
      return;
    }

    // Validate license plate format
    const licenseValidation = validateLicensePlate(vehicleData.licensePlate);
    if (!licenseValidation.valid) {
      setErrors((e) => ({ ...e, licensePlate: licenseValidation.message }));
      Alert.alert("Lỗi định dạng", licenseValidation.message);
      return;
    }
    if (!vehicleData.make?.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập hãng xe.");
      return;
    }
    if (!vehicleData.model?.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập dòng xe.");
      return;
    }
    if (!vehicleData.color?.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập màu sắc.");
      return;
    }
    if (!vehicleData.capacity || vehicleData.capacity < 1) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập sức chứa (tối thiểu 1).");
      return;
    }
    if (!vehicleData.vehicleType) {
      Alert.alert("Thiếu thông tin", "Vui lòng chọn loại xe.");
      return;
    }
    if (!vehicleData.images || vehicleData.images.length === 0) {
      Alert.alert("Thiếu ảnh", "Vui lòng thêm ít nhất 1 ảnh xác thực.");
      return;
    }

    try {
      setSubmitting(true);

      // Upload first image to get registrationDocumentUrl
      let registrationDocumentUrl = vehicleData.registrationDocumentUrl;

      // If no URL stored yet, upload the first local image
      if (!registrationDocumentUrl) {
        const firstImage = vehicleData.images[0];
        if (!firstImage.uri.startsWith("http")) {
          // Local image - need to upload
          console.log("[UPLOAD] Preparing to upload image:", {
            uri: firstImage.uri,
            name: firstImage.name,
            type: firstImage.type,
          });

          let imageUri = firstImage.uri;
          if (Platform.OS === "android") {
            if (
              !imageUri.startsWith("file://") &&
              !imageUri.startsWith("http")
            ) {
              imageUri = `file://${imageUri}`;
            }
          } else {
            if (imageUri.startsWith("file://")) {
              imageUri = imageUri.replace("file://", "");
            }
          }

          const fileName = firstImage.name || `registration_${Date.now()}.jpg`;
          const mimeType = normalizeMimeType(firstImage.type, fileName);

          const uploadForm = new FormData();
          uploadForm.append("file", {
            uri: imageUri,
            type: mimeType, // Đảm bảo là MIME type hợp lệ
            name: fileName,
          });

          console.log("[UPLOAD] Uploading with:", {
            uri: imageUri,
            type: mimeType,
            name: fileName,
          });

          try {
            const uploadResp = await uploadImage(uploadForm);
            registrationDocumentUrl = uploadResp?.data?.url;

            if (!registrationDocumentUrl) {
              Alert.alert("Lỗi", "Không thể tải ảnh lên. Vui lòng thử lại.");
              return;
            }
          } catch (uploadError) {
            console.error("[UPLOAD] Upload error:", uploadError);
            const errorMessage =
              uploadError?.message ||
              "Không thể tải ảnh lên. Vui lòng thử lại.";
            Alert.alert("Lỗi upload", errorMessage);
            return;
          }
        } else {
          // Already a remote URL
          registrationDocumentUrl = firstImage.uri;
        }
      }
      const formattedLicensePlate = vehicleData.licensePlate
        .trim()
        .toUpperCase();
      const vehicleRegisterData = {
        licensePlate: formattedLicensePlate,
        make: vehicleData.make.trim(),
        model: vehicleData.model.trim(),
        color: vehicleData.color.trim(),
        capacity: parseInt(vehicleData.capacity),
        vehicleType: vehicleData.vehicleType,
        registrationDocumentUrl: registrationDocumentUrl,
      };

      // Call API using vehicleService wrapper
      const apiResp = await registerVehicle(vehicleRegisterData);
      const vehicleResp = apiResp?.data?.data; // Get actual VehicleResponse from ApiResponse

      Alert.alert(
        "Thành công",
        vehicleResp?.message ||
          apiResp?.message ||
          "Đã gửi thông tin xe. Đang chờ admin duyệt.\n\nSau khi xe được duyệt, bạn sẽ có thể tạo chuyến đi."
      );

      setRegistered(true);
      setApproved(vehicleResp?.status === "APPROVED");
      setVehicleData((prev) => ({
        ...prev,
        licensePlate: vehicleResp?.licensePlate || prev.licensePlate,
        make: vehicleResp?.make || prev.make,
        model: vehicleResp?.model || prev.model,
        color: vehicleResp?.color || prev.color,
        capacity: vehicleResp?.capacity || prev.capacity,
        vehicleType: vehicleResp?.vehicleType || prev.vehicleType,
        registrationDocumentUrl: vehicleResp?.registrationDocumentUrl,
        images: vehicleResp?.registrationDocumentUrl
          ? [{ uri: vehicleResp.registrationDocumentUrl }]
          : prev.images,
      }));
      setEditing(false);

      fetchUserAndVehicle();
    } catch (err) {
      console.warn("Vehicle registration error:", err);
      console.warn("Error details:", {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status,
        config: err?.config,
      });

      let errorMessage = "Gửi thông tin thất bại. Vui lòng thử lại.";

      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        if (err.message.includes("Network Error")) {
          errorMessage =
            "Lỗi kết nối. Vui lòng kiểm tra kết nối mạng và thử lại.";
        } else {
          errorMessage = err.message;
        }
      }

      Alert.alert("Lỗi", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };
  function renderImageItem({ item, index }) {
    const remote = item.uri && item.uri.startsWith("http");
    return (
      <View style={styles.thumbWrap}>
        <Image source={{ uri: item.uri }} style={styles.thumbnail} />
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() =>
            Alert.alert("Xóa ảnh", "Bạn có chắc muốn xóa ảnh này?", [
              { text: "Huỷ", style: "cancel" },
              {
                text: "Xóa",
                style: "destructive",
                onPress: () => removeImageAt(index),
              },
            ])
          }
        >
          <MaterialIcons name="close" size={18} color="#fff" />
        </TouchableOpacity>
        {remote && (
          <View style={styles.remoteBadge}>
            <Text style={styles.remoteBadgeText}>Đã lưu</Text>
          </View>
        )}
      </View>
    );
  }

  const validate = () => {
    const e = {};
    if (!profile.fullName || profile.fullName.trim().length < 2)
      e.fullName = "Vui lòng nhập họ tên đầy đủ";
    if (!profile.dob) e.dob = "Chọn ngày sinh";
    else if (getAge(profile.dob) < 16)
      e.dob = "Người dùng phải từ 16 tuổi trở lên";
    if (!profile.phone || !/^\+?\d{7,15}$/.test(profile.phone.trim()))
      e.phone = "Số điện thoại không đúng định dạng";
    if (
      profile.bankAccountNumber &&
      !/^\d{6,22}$/.test(profile.bankAccountNumber.trim())
    )
      e.bankAccountNumber = "Số tài khoản không hợp lệ";
    if (!profile.address) e.address = "Vui lòng nhập địa chỉ thường trú";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const getAge = (dob) => {
    const diff = Date.now() - dob.getTime();
    const ageDt = new Date(diff);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  const submitProfile = async () => {
    if (!validate()) {
      Alert.alert("Lỗi", "Vui lòng sửa các trường có lỗi trước khi gửi.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("fullName", profile.fullName.trim());
      formData.append("dob", profile.dob.toISOString());
      formData.append("phone", profile.phone.trim());
      formData.append("address", profile.address.trim());
      formData.append("licensePlate", profile.licensePlate.trim());
      formData.append("bankAccountNumber", profile.bankAccountNumber.trim());
      formData.append("bankName", profile.bankName.trim());

      if (profile.verificationImage) {
        formData.append("verificationImage", {
          uri: profile.verificationImage.uri,
          name: profile.verificationImage.fileName,
          type: profile.verificationImage.type,
        });
      }

      // Save to AsyncStorage
      await AsyncStorageService.saveProfile({
        fullName: profile.fullName.trim(),
        dob: profile.dob.toISOString(),
        phone: profile.phone.trim(),
        address: profile.address.trim(),
        licensePlate: profile.licensePlate.trim(),
        bankAccountNumber: profile.bankAccountNumber.trim(),
        bankName: profile.bankName.trim(),
        email: profile.email,
        profilePictureUrl: profile.profilePictureUrl,
        rating: profile.rating,
        coins: profile.coins,
      });

      console.log("Gửi form:", formData);
      Alert.alert("Thành công", "Thông tin đã được lưu!");
      // onSuccess(formData); // commented out since no API call
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Không thể lưu thông tin, thử lại sau!");
    } finally {
      setLoading(false);
    }
  };

  const FieldError = ({ field }) =>
    errors[field] ? (
      <Text style={styles.errorText}>{errors[field]}</Text>
    ) : null;

  const handleLogout = async () => {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          try {
            // Clear all stored data
            await AsyncStorage.multiRemove([
              "userData",
              "userProfile",
              "connectionId",
              "recentSearches",
            ]);
            await clearTokens();
            await chatClient.disconnectUser();
            // Navigate to Login and reset stack
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          } catch (error) {
            console.warn("Error during logout:", error);
            // Still navigate even if clear fails
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#fdfdfd" }}
      behavior="padding"
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>QUẢN LÝ TÀI KHOẢN</Text>

        {/* Thông tin cá nhân */}
        <View style={[styles.section, { marginTop: 80 }]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="person" size={20} color={COLORS.PRIMARY} />
            <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          </View>

          {/* Ảnh đại diện */}
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: DEFAULT_AVATAR,
                // uri: profile.profilePictureUrl || DEFAULT_AVATAR,
              }}
              style={styles.avatar}
            />
            <View style={styles.ratingCoinsContainer}>
              <View style={styles.ratingContainer}>
                <MaterialIcons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>
                  {profile.rating?.toFixed(1) || "0.0"}
                </Text>
              </View>
              <View style={styles.coinsContainer}>
                <FontAwesome5 name="coins" size={14} color="#FFD700" />
                <Text style={styles.coinsText}>{profile.coins || 0}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.label}>Họ và tên</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Nguyễn Văn A"
            value={profile.fullName}
            onChangeText={(t) => update("fullName", t)}
          />
          <FieldError field="fullName" />

          <Text style={[styles.label, { marginTop: 12 }]}>Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: "#f5f5f5" }]}
            placeholder="VD: user@example.com"
            value={profile.email}
            editable={false}
          />

          <Text style={[styles.label, { marginTop: 12 }]}>Số điện thoại</Text>
          <TextInput
            style={[styles.input, { backgroundColor: "#f5f5f5" }]}
            placeholder="VD: 0987654321"
            keyboardType="phone-pad"
            value={profile.phone}
            editable={false}
          />

          <Text style={[styles.label, { marginTop: 12 }]}>Ngày sinh</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={styles.datePickerButton}
          >
            <Text style={{ color: profile.dob ? "#111" : "#777" }}>
              {profile.dob
                ? profile.dob.toLocaleDateString()
                : "Chọn ngày sinh"}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={profile.dob || new Date(1990, 0, 1)}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={(e, d) => {
                setShowDatePicker(false);
                if (d) update("dob", d);
              }}
            />
          )}
          <FieldError field="dob" />

          <Text style={[styles.label, { marginTop: 12 }]}>
            Địa chỉ thường trú
          </Text>
          <TextInput
            style={styles.input}
            placeholder="VD: KTX Khu B ĐHQG TP.HCM"
            value={profile.address}
            onChangeText={(t) => update("address", t)}
          />
          <FieldError field="address" />
        </View>

        {/* Xe & xác thực */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionHeader} activeOpacity={0.8}>
            <FontAwesome5 name="car" size={18} color={COLORS.PRIMARY} />
            <Text style={styles.sectionTitle}>Xe & Xác thực</Text>
          </TouchableOpacity>
          <View style={{ marginTop: 10 }}>
            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator />
              </View>
            ) : (
              <>
                {!registered ? (
                  // Not registered
                  <View style={styles.notRegisteredBox}>
                    <Text style={styles.infoText}>
                      Bạn chưa đăng ký thông tin xe.
                    </Text>
                    <TouchableOpacity
                      style={styles.openBtn}
                      onPress={onOpenRegisterConfirm}
                    >
                      <Text style={styles.openBtnText}>
                        Mở để đăng ký thông tin xe
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.registeredBox}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.label}>Trạng thái</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          approved
                            ? styles.statusApproved
                            : styles.statusPending,
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {approved ? "Đã duyệt" : "Đang chờ duyệt"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.vehicleInfoContainer}>
                      <View style={styles.vehicleInfoRow}>
                        <View style={styles.vehicleInfoItem}>
                          <Text style={styles.label}>Biển số xe</Text>
                          <Text style={styles.valueText}>
                            {vehicleData.licensePlate || "-"}
                          </Text>
                        </View>
                        <View style={styles.vehicleInfoItem}>
                          <Text style={styles.label}>Hãng xe</Text>
                          <Text style={styles.valueText}>
                            {vehicleData.make || "-"}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.vehicleInfoRow}>
                        <View style={styles.vehicleInfoItem}>
                          <Text style={styles.label}>Dòng xe</Text>
                          <Text style={styles.valueText}>
                            {vehicleData.model || "-"}
                          </Text>
                        </View>
                        <View style={styles.vehicleInfoItem}>
                          <Text style={styles.label}>Màu sắc</Text>
                          <Text style={styles.valueText}>
                            {vehicleData.color || "-"}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.vehicleInfoRow}>
                        <View style={styles.vehicleInfoItem}>
                          <Text style={styles.label}>Sức chứa</Text>
                          <Text style={styles.valueText}>
                            {vehicleData.capacity || "-"} người
                          </Text>
                        </View>
                        <View style={styles.vehicleInfoItem}>
                          <Text style={styles.label}>Loại xe</Text>
                          <Text style={styles.valueText}>
                            {vehicleTypes.find(
                              (v) => v.value === vehicleData.vehicleType
                            )?.label ||
                              vehicleData.vehicleType ||
                              "-"}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Text style={[styles.label, { marginTop: 10 }]}>
                      Ảnh xác thực
                    </Text>
                    {vehicleData.images && vehicleData.images.length > 0 ? (
                      <FlatList
                        horizontal
                        data={vehicleData.images}
                        keyExtractor={(it, idx) =>
                          it.id ? String(it.id) : it.uri + idx
                        }
                        renderItem={({ item }) => (
                          <Image
                            source={{ uri: item.uri }}
                            style={styles.thumbnail}
                          />
                        )}
                        contentContainerStyle={{ paddingVertical: 8 }}
                        showsHorizontalScrollIndicator={false}
                      />
                    ) : (
                      <Text style={{ color: "#888", marginTop: 8 }}>
                        Chưa có ảnh
                      </Text>
                    )}

                    <View style={{ marginTop: 12, flexDirection: "row" }}>
                      <TouchableOpacity
                        style={[
                          styles.actionBtn,
                          { backgroundColor: "#0d6efd" },
                        ]}
                        onPress={() => {
                          setEditing(true);
                        }}
                      >
                        <Text style={styles.actionBtnText}>Chỉnh sửa</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.actionBtn,
                          { marginLeft: 10, backgroundColor: "#6c757d" },
                        ]}
                        onPress={() => {
                          setRefreshing(true);
                          fetchUserAndVehicle().finally(() =>
                            setRefreshing(false)
                          );
                        }}
                      >
                        <Text style={styles.actionBtnText}>
                          {refreshing ? "Đang tải..." : "Tải lại"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <Modal
                  visible={editing}
                  animationType="slide"
                  onRequestClose={cancelEditing}
                  transparent={true}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                      <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                          {registered
                            ? "Chỉnh sửa thông tin xe"
                            : "Đăng ký thông tin xe"}
                        </Text>
                        <TouchableOpacity onPress={cancelEditing}>
                          <MaterialIcons name="close" size={22} color="#333" />
                        </TouchableOpacity>
                      </View>

                      <ScrollView
                        showsVerticalScrollIndicator={true}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{
                          paddingVertical: 12,
                          paddingHorizontal: 12,
                        }}
                      >
                        <Text style={styles.label}>Biển số xe</Text>
                        <TextInput
                          style={[
                            styles.input,
                            errors.licensePlate && styles.inputError,
                          ]}
                          placeholder="VD: 30A-12345 hoặc 51AB-12345"
                          value={vehicleData.licensePlate}
                          onChangeText={(t) => {
                            const formatted = formatLicensePlate(t);
                            setVehicleData((p) => ({
                              ...p,
                              licensePlate: formatted,
                            }));
                            // Clear error when user types
                            if (errors.licensePlate) {
                              setErrors((e) => ({ ...e, licensePlate: null }));
                            }
                          }}
                          autoCapitalize="characters"
                          maxLength={10}
                        />
                        {errors.licensePlate && (
                          <Text style={styles.errorText}>
                            {errors.licensePlate}
                          </Text>
                        )}

                        <Text style={[styles.label, { marginTop: 12 }]}>
                          Hãng xe
                        </Text>
                        <TextInput
                          style={styles.input}
                          placeholder="VD: Honda"
                          value={vehicleData.make}
                          onChangeText={(t) =>
                            setVehicleData((p) => ({ ...p, make: t }))
                          }
                        />

                        <Text style={[styles.label, { marginTop: 12 }]}>
                          Dòng xe
                        </Text>
                        <TextInput
                          style={styles.input}
                          placeholder="VD: Wave RSX"
                          value={vehicleData.model}
                          onChangeText={(t) =>
                            setVehicleData((p) => ({ ...p, model: t }))
                          }
                        />

                        <Text style={[styles.label, { marginTop: 12 }]}>
                          Màu sắc
                        </Text>
                        <TextInput
                          style={styles.input}
                          placeholder="VD: Đỏ"
                          value={vehicleData.color}
                          onChangeText={(t) =>
                            setVehicleData((p) => ({ ...p, color: t }))
                          }
                        />

                        <Text style={[styles.label, { marginTop: 12 }]}>
                          Sức chứa (người)
                        </Text>
                        <TextInput
                          style={styles.input}
                          placeholder="VD: 2"
                          keyboardType="numeric"
                          value={String(vehicleData.capacity)}
                          onChangeText={(t) =>
                            setVehicleData((p) => ({
                              ...p,
                              capacity: parseInt(t) || 1,
                            }))
                          }
                        />

                        <Text style={[styles.label, { marginTop: 12 }]}>
                          Loại xe
                        </Text>
                        <TouchableOpacity
                          style={[
                            styles.input,
                            { justifyContent: "center", paddingVertical: 12 },
                          ]}
                          onPress={() => setVehicleTypeModalVisible(true)}
                        >
                          <Text style={{ fontSize: 14, color: "#333" }}>
                            {vehicleTypes.find(
                              (v) => v.value === vehicleData.vehicleType
                            )?.label || "Chọn loại xe"}
                          </Text>
                        </TouchableOpacity>

                        <Text style={[styles.label, { marginTop: 12 }]}>
                          Ảnh xác thực (CMND/CCCD/GPLX)
                        </Text>

                        <FlatList
                          data={vehicleData.images}
                          horizontal
                          keyExtractor={(it, idx) =>
                            it.id ? String(it.id) : it.uri + idx
                          }
                          renderItem={renderImageItem}
                          ItemSeparatorComponent={() => (
                            <View style={{ width: 8 }} />
                          )}
                          style={{ marginVertical: 8, maxHeight: 120 }}
                          showsHorizontalScrollIndicator={false}
                        />

                        <View style={{ flexDirection: "row", gap: 8 }}>
                          <TouchableOpacity
                            style={styles.photoButton}
                            onPress={pickImage}
                          >
                            <MaterialIcons
                              name="photo-library"
                              size={20}
                              color="#fff"
                            />
                            <Text style={styles.photoButtonText}>
                              + Thêm ảnh
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.photoButton,
                              { backgroundColor: "#17a2b8" },
                            ]}
                            onPress={takePhoto}
                          >
                            <MaterialIcons
                              name="camera"
                              size={20}
                              color="#fff"
                            />
                            <Text style={styles.photoButtonText}>Camera</Text>
                          </TouchableOpacity>
                        </View>

                        <View style={{ marginTop: 14 }}>
                          <TouchableOpacity
                            style={[
                              styles.submitBtn,
                              submitting && { opacity: 0.8 },
                            ]}
                            onPress={submitRegistration}
                            disabled={submitting}
                          >
                            {submitting ? (
                              <ActivityIndicator color="#fff" />
                            ) : (
                              <Text style={styles.submitBtnText}>
                                {registered ? "Lưu thay đổi" : "Đăng ký"}
                              </Text>
                            )}
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={cancelEditing}
                            disabled={submitting}
                          >
                            <Text style={styles.cancelBtnText}>Hủy</Text>
                          </TouchableOpacity>

                          <Text
                            style={{
                              color: "#666",
                              marginTop: 8,
                              fontSize: 12,
                            }}
                          >
                            Lưu ý: Thông tin sẽ được gửi cho Admin để duyệt. Sau
                            khi được duyệt, phần "Xe & Xác thực" sẽ luôn hiển
                            thị và không thể gỡ bỏ phần này; bạn chỉ có thể
                            chỉnh sửa thông tin.
                          </Text>
                        </View>
                      </ScrollView>
                    </View>
                  </View>
                </Modal>

                {/* Vehicle Type Picker Modal */}
                <Modal
                  transparent
                  visible={vehicleTypeModalVisible}
                  onRequestClose={() => setVehicleTypeModalVisible(false)}
                >
                  <View
                    style={{
                      flex: 1,
                      justifyContent: "flex-end",
                      backgroundColor: "rgba(0,0,0,0.5)",
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: "#fff",
                        borderTopLeftRadius: 12,
                        borderTopRightRadius: 12,
                        paddingVertical: 12,
                      }}
                    >
                      <View
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderBottomWidth: 1,
                          borderBottomColor: "#eee",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "600",
                            color: "#333",
                          }}
                        >
                          Chọn loại xe
                        </Text>
                      </View>
                      {vehicleTypes.map((type) => (
                        <TouchableOpacity
                          key={type.value}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            borderBottomWidth: 1,
                            borderBottomColor: "#f0f0f0",
                          }}
                          onPress={() => {
                            setVehicleData((p) => ({
                              ...p,
                              vehicleType: type.value,
                            }));
                            setVehicleTypeModalVisible(false);
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 14,
                              color:
                                vehicleData.vehicleType === type.value
                                  ? "#0d6efd"
                                  : "#333",
                              fontWeight:
                                vehicleData.vehicleType === type.value
                                  ? "600"
                                  : "400",
                            }}
                          >
                            {type.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </Modal>
                <Modal
                  visible={confirmOpenVisible}
                  animationType="fade"
                  transparent={true}
                  onRequestClose={() => setConfirmOpenVisible(false)}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.confirmBox}>
                      <Text style={styles.confirmTitle}>
                        Mở đăng ký thông tin xe?
                      </Text>
                      <Text style={{ color: "#444", marginTop: 8 }}>
                        Khi mở đăng ký, bạn sẽ nhập thông tin xe và gửi để Admin
                        duyệt. Sau khi được duyệt, bạn sẽ không thể gỡ phần
                        thông tin xe đã đăng ký này.
                      </Text>
                      <View style={{ flexDirection: "row", marginTop: 14 }}>
                        <TouchableOpacity
                          style={[
                            styles.confirmBtn,
                            { backgroundColor: COLORS.GRAY },
                          ]}
                          onPress={() => setConfirmOpenVisible(false)}
                        >
                          <Text style={styles.confirmBtnText}>Huỷ</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.confirmBtn,
                            {
                              marginLeft: 10,
                              backgroundColor: COLORS.PRIMARY,
                            },
                          ]}
                          onPress={confirmOpenRegister}
                        >
                          <Text style={styles.confirmBtnText}>Đồng ý</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>
              </>
            )}
          </View>
        </View>

        {/* Ngân hàng */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="university" size={18} color={COLORS.PRIMARY} />
            <Text style={styles.sectionTitle}>Ngân hàng</Text>
          </View>

          <Text style={styles.label}>Số tài khoản</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="VD: 1025905976"
            value={profile.bankAccountNumber}
            onChangeText={(t) => update("bankAccountNumber", t)}
          />
          <FieldError field="bankAccountNumber" />

          <Text style={[styles.label, { marginTop: 12 }]}>Tên ngân hàng</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Vietcombank"
            value={profile.bankName}
            onChangeText={(t) => update("bankName", t)}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && { opacity: 0.7 }]}
          onPress={submitProfile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Lưu</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color="#fff" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: COLORS.BG },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.WHITE,
    textAlign: "center",
    marginBottom: 16,
    backgroundColor: COLORS.PRIMARY,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 25,
    zIndex: 999,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    color: "#222",
  },
  label: { fontSize: 13, color: "#333", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    backgroundColor: "#fafafa",
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fafafa",
  },
  photoButton: {
    backgroundColor: COLORS.PRIMARY,
    marginTop: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  photoButtonText: { color: "#fff", fontWeight: "600" },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    resizeMode: "cover",
  },
  placeholderThumb: {
    width: 100,
    height: 100,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
  },
  submitText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  errorText: { color: "red", marginTop: 4 },
  inputError: {
    borderColor: "#ff4444",
    borderWidth: 1,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  photoButton: {
    marginTop: 10,
    backgroundColor: "#0d6efd",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  photoButtonText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "600",
  },
  notRegisteredBox: {
    alignItems: "center",
    paddingVertical: 14,
  },
  infoText: {
    color: "#555",
    marginBottom: 12,
  },
  openBtn: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  openBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  registeredBox: {
    paddingVertical: 6,
  },
  valueText: {
    fontSize: 15,
    color: "#111",
    marginTop: 6,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusApproved: {
    backgroundColor: "#d4edda",
  },
  statusPending: {
    backgroundColor: "#fff3cd",
  },
  statusText: {
    fontSize: 12,
    color: "#222",
    fontWeight: "700",
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "600",
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  submitBtn: {
    marginTop: 12,
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  submitBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  cancelBtn: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#444",
    fontWeight: "600",
  },
  confirmBox: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
  },
  confirmTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  // thumbs in form
  thumbWrap: {
    position: "relative",
    marginRight: 8,
  },
  removeBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  remoteBadge: {
    position: "absolute",
    left: 6,
    bottom: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  remoteBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
  },
  ratingCoinsContainer: {
    flexDirection: "row",
    marginTop: 10,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8DC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  coinsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8DC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  coinsText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  vehicleInfoContainer: {
    marginTop: 10,
  },
  vehicleInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  vehicleInfoItem: {
    flex: 1,
    marginHorizontal: 5,
  },
  logoutButton: {
    backgroundColor: "#dc3545",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },
});
