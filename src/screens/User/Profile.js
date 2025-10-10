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
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import COLORS from "../../constant/colors";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";

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

  const update = (key, value) => {
    setProfile((p) => ({ ...p, [key]: value }));
    setErrors((e) => ({ ...e, [key]: null }));
  };

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.status !== "granted") {
      Alert.alert(
        "Quyền bị từ chối",
        "Cần quyền truy cập thư viện ảnh để chọn ảnh."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const file = {
        uri: asset.uri,
        fileName: asset.fileName || `photo_${Date.now()}.jpg`,
        type: asset.type || "image/jpeg",
      };
      update("verificationImage", file);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.status !== "granted") {
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
    if (!profile.fullName || profile.fullName.trim().length < 2) {
      e.fullName = "Vui lòng nhập họ tên hợp lệ";
    }
    if (!profile.dob) {
      e.dob = "Chọn ngày sinh";
    } else {
      const age = getAge(profile.dob);
      if (age < 16) e.dob = "Người dùng phải từ 16 tuổi trở lên";
    }
    if (!profile.phone || !/^\+?\d{7,15}$/.test(profile.phone.trim())) {
      e.phone = "Số điện thoại không đúng định dạng";
    }
    // if (!profile.licensePlate || profile.licensePlate.trim().length < 3) {
    //   e.licensePlate = "Nhập biển số xe (nếu có)";
    // }
    // if (!profile.verificationImage) e.verificationImage = "Chọn ảnh xác thực";
    if (
      profile.bankAccountNumber &&
      !/^\d{6,22}$/.test(profile.bankAccountNumber.trim())
    ) {
      e.bankAccountNumber = "Số tài khoản có vẻ không hợp lệ";
    }
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
      // nếu backend chấp nhận multipart/form-data (ảnh)
      const formData = new FormData();
      formData.append("fullName", profile.fullName.trim());
      formData.append("dob", profile.dob.toISOString());
      formData.append("licensePlate", profile.licensePlate.trim());
      formData.append("phone", profile.phone.trim());
      formData.append("bankAccountNumber", profile.bankAccountNumber.trim());
      formData.append("bankName", profile.bankName.trim());

      if (profile.verificationImage) {
        formData.append("verificationImage", {
          uri: profile.verificationImage.uri,
          fileName: profile.verificationImage.fileName,
          type: profile.verificationImage.type,
        });
      }

      // axios
      // const headers = {
      //   "Content-Type": "multipart/form-data",
      // };
      // if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

      // const res = await axios.post(apiEndpoint, formData, {
      //   headers,
      // });

      // if (res.status >= 200 && res.status < 300) {
      //   Alert.alert("Thành công", "Thông tin cá nhân đã được cập nhật.");
      //   onSuccess(res.data);
      // } else {
      //   Alert.alert("Lỗi server", `Trạng thái: ${res.status}`);
      // }
      console.log(formData);
    } catch (err) {
      console.error(
        "submitProfile error:",
        err?.response || err.message || err
      );
      const msg =
        err?.response?.data?.message ||
        err.message ||
        "Có lỗi khi gửi dữ liệu. Vui lòng thử lại.";
      Alert.alert("Lỗi", msg);
    } finally {
      setLoading(false);
    }
  };

  const FieldError = ({ field }) =>
    errors[field] ? (
      <Text style={styles.errorText}>{errors[field]}</Text>
    ) : null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Quản lý hồ sơ</Text>

        {/* SECTION: Thông tin cá nhân */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

          <Text style={styles.label}>Họ và tên</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Nguyễn Văn A"
            value={profile.fullName}
            onChangeText={(t) => update("fullName", t)}
            returnKeyType="done"
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
          <FieldError field="dob" />
          {showDatePicker && (
            <DateTimePicker
              value={profile.dob || new Date(1990, 0, 1)}
              mode="date"
              maximumDate={new Date()}
              display="default"
              onChange={(e, selectedDate) => {
                setShowDatePicker(Platform.OS === "ios");
                if (selectedDate) update("dob", selectedDate);
              }}
            />
          )}

          <Text style={[styles.label, { marginTop: 12 }]}>
            Địa chỉ thường trú
          </Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Kí túc xá Khu B ĐHQG TPHCM"
            value={profile.address}
            onChangeText={(t) => update("address", t)}
            returnKeyType="done"
          />
          <FieldError field="address" />
        </View>

        {/* SECTION: Xe & Xác thực */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Xe & Xác thực</Text>

          <Text style={styles.label}>Biển số xe</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: 51A-123.45"
            value={profile.licensePlate}
            onChangeText={(t) => update("licensePlate", t)}
          />
          <FieldError field="licensePlate" />

          <Text style={[styles.label, { marginTop: 12 }]}>
            Ảnh xác thực (CMND/CCCD/GPLX)
          </Text>
          {profile.verificationImage ? (
            <View>
              <Image
                source={{ uri: profile.verificationImage.uri }}
                style={styles.thumbnail}
              />
              <Text style={{ marginTop: 8 }}>
                {profile.verificationImage.fileName}
              </Text>
            </View>
          ) : (
            <View style={styles.placeholderThumb}>
              <Text style={{ color: "#888" }}>Chưa có ảnh</Text>
            </View>
          )}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              onPress={() => {
                Alert.alert("Chọn ảnh", "", [
                  { text: "Thư viện", onPress: pickImage },
                  { text: "Camera", onPress: takePhoto },
                  { text: "Huỷ", style: "cancel" },
                ]);
              }}
              style={styles.photoButton}
            >
              <Text style={styles.photoButtonText}>Chọn ảnh</Text>
            </TouchableOpacity>
          </View>
          <FieldError field="verificationImage" />
        </View>

        {/* SECTION: Liên hệ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Liên hệ</Text>

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

        {/* SECTION: Ngân hàng */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin ngân hàng</Text>

          <Text style={styles.label}>Số tài khoản</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: 1025905976"
            keyboardType="number-pad"
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

        {/* Submit */}
        <View style={{ marginVertical: 20 }}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={submitProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Lưu</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
    marginTop: 32,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  section: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    backgroundColor: "#f8f9fb",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: "#333",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    backgroundColor: "#fff",
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
  photoButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.PURPLE,
    marginTop: 12,
  },
  photoButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ccc",
    marginTop: 2,
  },
  placeholderThumb: {
    width: 80,
    height: 80,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
    marginTop: 12,
  },
  submitButton: {
    backgroundColor: COLORS.PURPLE,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontWeight: "700",
  },
  errorText: {
    color: COLORS.RED,
    marginTop: 6,
  },
});
