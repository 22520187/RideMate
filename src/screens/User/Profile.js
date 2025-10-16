import { useState } from "react";
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
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import COLORS from "../../constant/colors";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";

// enable animation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Profile({
  apiEndpoint = "https://example.com/api/profile",
  authToken = null,
  onSuccess = () => {},
}) {
  const [profile, setProfile] = useState({
    fullName: "",
    dob: null,
    address: "",
    licensePlate: "",
    phone: "",
    bankAccountNumber: "",
    bankName: "",
    verificationImage: null,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showVehicleSection, setShowVehicleSection] = useState(false);

  const update = (key, value) => {
    setProfile((p) => ({ ...p, [key]: value }));
    setErrors((e) => ({ ...e, [key]: null }));
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
      quality: 0.8,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      update("verificationImage", {
        uri: asset.uri,
        fileName: asset.fileName || `photo_${Date.now()}.jpg`,
        type: "image/jpeg",
      });
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
      update("verificationImage", {
        uri: asset.uri,
        fileName: `photo_${Date.now()}.jpg`,
        type: "image/jpeg",
      });
    }
  };

  const validate = () => {
    const e = {};
    if (!profile.fullName || profile.fullName.trim().length < 2)
      e.fullName = "Nhập họ tên hợp lệ";
    if (!profile.dob) e.dob = "Chọn ngày sinh";
    else if (getAge(profile.dob) < 16)
      e.dob = "Người dùng phải từ 16 tuổi trở lên";
    if (!profile.phone || !/^\+?\d{7,15}$/.test(profile.phone.trim()))
      e.phone = "Số điện thoại không đúng định dạng";
    if (
      profile.bankAccountNumber &&
      !/^\d{6,22}$/.test(profile.bankAccountNumber.trim())
    )
      e.bankAccountNumber = "Số tài khoản có vẻ không hợp lệ";
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

      console.log("Gửi form:", formData);
      Alert.alert("✅ Thành công", "Thông tin đã được gửi!");
      onSuccess(formData);
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Không thể gửi thông tin, thử lại sau!");
    } finally {
      setLoading(false);
    }
  };

  const FieldError = ({ field }) =>
    errors[field] ? (
      <Text style={styles.errorText}>{errors[field]}</Text>
    ) : null;

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
        <Text style={styles.title}>🧾 Hồ sơ người dùng</Text>

        {/* Thông tin cá nhân */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="person" size={20} color={COLORS.PRIMARY} />
            <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          </View>

          <Text style={styles.label}>Họ và tên</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Nguyễn Văn A"
            value={profile.fullName}
            onChangeText={(t) => update("fullName", t)}
          />
          <FieldError field="fullName" />

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
        </View>

        {/* Xe & xác thực */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => {
              LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut
              );
              setShowVehicleSection((v) => !v);
            }}
          >
            <FontAwesome5 name="car" size={18} color={COLORS.PRIMARY} />
            <Text style={styles.sectionTitle}>Xe & Xác thực</Text>
            <MaterialIcons
              name={
                showVehicleSection ? "keyboard-arrow-up" : "keyboard-arrow-down"
              }
              size={22}
              color="#555"
              style={{ marginLeft: "auto" }}
            />
          </TouchableOpacity>

          {showVehicleSection && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.label}>Biển số xe</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: 51A-123.45"
                value={profile.licensePlate}
                onChangeText={(t) => update("licensePlate", t)}
              />

              <Text style={[styles.label, { marginTop: 12 }]}>
                Ảnh xác thực (CMND/CCCD/GPLX)
              </Text>
              {profile.verificationImage ? (
                <Image
                  source={{ uri: profile.verificationImage.uri }}
                  style={styles.thumbnail}
                />
              ) : (
                <View style={styles.placeholderThumb}>
                  <Text style={{ color: "#888" }}>Chưa có ảnh</Text>
                </View>
              )}

              <TouchableOpacity
                onPress={() =>
                  Alert.alert("Chọn ảnh", "", [
                    { text: "Thư viện", onPress: pickImage },
                    { text: "Camera", onPress: takePhoto },
                    { text: "Huỷ", style: "cancel" },
                  ])
                }
                style={styles.photoButton}
              >
                <Text style={styles.photoButtonText}>Chọn ảnh</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Liên hệ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="phone" size={18} color={COLORS.PRIMARY} />
            <Text style={styles.sectionTitle}>Liên hệ</Text>
          </View>
          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: 0987654321"
            keyboardType="phone-pad"
            value={profile.phone}
            onChangeText={(t) => update("phone", t)}
          />
          <FieldError field="phone" />
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.PRIMARY,
    textAlign: "center",
    marginBottom: 16,
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
});
