import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import COLORS from "../constant/colors";
import { registerVehicle } from "../services/vehicleService";
import { uploadImage } from "../services/uploadService";

const VehicleRegistration = ({ visible, onClose, onSuccess }) => {
  const [vehicleData, setVehicleData] = useState({
    licensePlate: "",
    make: "",
    model: "",
    color: "",
    capacity: "1",
    vehicleType: "MOTORBIKE",
    images: [],
    registrationDocumentUrl: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [vehicleTypeModalVisible, setVehicleTypeModalVisible] = useState(false);
  const [errors, setErrors] = useState({});

  const vehicleTypes = [
    { label: "Xe máy", value: "MOTORBIKE" },
    { label: "Ô tô", value: "CAR" },
    { label: "Van", value: "VAN" },
    { label: "Tải", value: "TRUCK" },
  ];

  const formatLicensePlate = (text) => {
    let formatted = text.replace(/\s/g, "").toUpperCase();
    formatted = formatted.replace(/[^0-9A-Z-]/g, "");

    if (formatted.length > 2 && !formatted.includes("-")) {
      if (/^[0-9]{2}[A-Z]/.test(formatted)) {
        formatted = formatted.slice(0, 2) + "-" + formatted.slice(2);
      }
    }

    if (formatted.length > 5 && formatted.split("-").length === 2) {
      const parts = formatted.split("-");
      if (parts[1].length > 1 && /^[A-Z0-9]/.test(parts[1])) {
        const secondPart = parts[1];
        if (/^[A-Z]{1,2}[0-9]/.test(secondPart) && secondPart.length > 2) {
          const letters = secondPart.match(/^[A-Z]{1,2}/)[0];
          const numbers = secondPart.slice(letters.length);
          formatted = parts[0] + "-" + letters + "-" + numbers;
        }
      }
    }

    return formatted;
  };

  const validateLicensePlate = (plate) => {
    const trimmed = plate.trim();
    if (!trimmed)
      return { valid: false, message: "Biển số không được để trống" };

    const pattern1 = /^[0-9]{2}[A-Z]-[0-9]{4,5}$/;
    const pattern2 = /^[0-9]{2}[A-Z]{1,2}-[0-9]{4,5}$/;

    if (pattern1.test(trimmed) || pattern2.test(trimmed)) {
      return { valid: true, message: null };
    }

    return {
      valid: false,
      message:
        "Biển số phải có định dạng: XX-YZZZZ hoặc XX-YY-ZZZZ\nVí dụ: 30A-12345 hoặc 51AB-12345",
    };
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert(
        "Quyền bị từ chối",
        "Vui lòng cấp quyền truy cập thư viện ảnh."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const newImage = {
        uri: asset.uri,
        name: asset.fileName || `image_${Date.now()}.jpg`,
        type: asset.type || "image/jpeg",
      };
      setVehicleData((prev) => ({
        ...prev,
        images: [...prev.images, newImage],
      }));
    }
  };

  const removeImageAt = (index) => {
    setVehicleData((prev) => {
      const newImages = [...prev.images];
      newImages.splice(index, 1);
      return { ...prev, images: newImages };
    });
  };

  const uriToBlob = async (uri) => {
    const resp = await fetch(uri);
    const blob = await resp.blob();
    return blob;
  };

  const handleSubmit = async () => {
    // Validate
    setErrors({});

    if (!vehicleData.licensePlate?.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập biển số xe.");
      return;
    }

    const licenseValidation = validateLicensePlate(vehicleData.licensePlate);
    if (!licenseValidation.valid) {
      setErrors({ licensePlate: licenseValidation.message });
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

    if (!vehicleData.capacity || parseInt(vehicleData.capacity) < 1) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập sức chứa (tối thiểu 1).");
      return;
    }

    if (!vehicleData.images || vehicleData.images.length === 0) {
      Alert.alert("Thiếu ảnh", "Vui lòng thêm ít nhất 1 ảnh xác thực.");
      return;
    }

    try {
      setSubmitting(true);

      // Upload first image
      let registrationDocumentUrl = vehicleData.registrationDocumentUrl;

      if (!registrationDocumentUrl) {
        const firstImage = vehicleData.images[0];
        const blob = await uriToBlob(firstImage.uri);
        const file = new File([blob], firstImage.name, {
          type: firstImage.type,
        });

        console.log("Uploading image...");
        const uploadResp = await uploadImage(file);
        registrationDocumentUrl = uploadResp?.url;

        if (!registrationDocumentUrl) {
          throw new Error("Không nhận được URL từ upload service");
        }
      }

      // Register vehicle
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

      const apiResp = await registerVehicle(vehicleRegisterData);
      const vehicleResp = apiResp?.data?.data;

      Alert.alert(
        "Thành công",
        "Đã gửi thông tin xe. Đang chờ admin duyệt.\n\nSau khi xe được duyệt, bạn sẽ có thể tạo chuyến đi.",
        [
          {
            text: "OK",
            onPress: () => {
              // Reset form
              setVehicleData({
                licensePlate: "",
                make: "",
                model: "",
                color: "",
                capacity: "1",
                vehicleType: "MOTORBIKE",
                images: [],
                registrationDocumentUrl: "",
              });
              onSuccess && onSuccess(vehicleResp);
              onClose();
            },
          },
        ]
      );
    } catch (err) {
      console.warn("Vehicle registration error:", err);
      let errorMessage = "Gửi thông tin thất bại. Vui lòng thử lại.";

      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      Alert.alert("Lỗi", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const renderImageItem = ({ item, index }) => (
    <View style={styles.imageItem}>
      <Image source={{ uri: item.uri }} style={styles.imagePreview} />
      <TouchableOpacity
        style={styles.removeImageButton}
        onPress={() => removeImageAt(index)}
      >
        <MaterialIcons name="close" size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Đăng ký xe</Text>
            <TouchableOpacity onPress={handleSubmit} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator size="small" color={COLORS.PRIMARY} />
              ) : (
                <Text style={styles.saveText}>Gửi</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.label}>Biển số xe *</Text>
            <TextInput
              style={[styles.input, errors.licensePlate && styles.inputError]}
              placeholder="VD: 30A-12345 hoặc 51AB-12345"
              value={vehicleData.licensePlate}
              onChangeText={(text) => {
                const formatted = formatLicensePlate(text);
                setVehicleData((prev) => ({
                  ...prev,
                  licensePlate: formatted,
                }));
                if (errors.licensePlate) {
                  setErrors((e) => ({ ...e, licensePlate: null }));
                }
              }}
              autoCapitalize="characters"
              maxLength={11}
            />
            {errors.licensePlate && (
              <Text style={styles.errorText}>{errors.licensePlate}</Text>
            )}

            <Text style={styles.label}>Hãng xe *</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Honda, Yamaha"
              value={vehicleData.make}
              onChangeText={(text) =>
                setVehicleData((prev) => ({ ...prev, make: text }))
              }
            />

            <Text style={styles.label}>Dòng xe *</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Wave RSX, Vision"
              value={vehicleData.model}
              onChangeText={(text) =>
                setVehicleData((prev) => ({ ...prev, model: text }))
              }
            />

            <Text style={styles.label}>Màu sắc *</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Đỏ, Xanh, Đen"
              value={vehicleData.color}
              onChangeText={(text) =>
                setVehicleData((prev) => ({ ...prev, color: text }))
              }
            />

            <Text style={styles.label}>Sức chứa (người) *</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: 2"
              keyboardType="numeric"
              value={vehicleData.capacity}
              onChangeText={(text) =>
                setVehicleData((prev) => ({ ...prev, capacity: text }))
              }
            />

            <Text style={styles.label}>Loại xe *</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setVehicleTypeModalVisible(true)}
            >
              <Text style={styles.inputText}>
                {vehicleTypes.find((v) => v.value === vehicleData.vehicleType)
                  ?.label || "Chọn loại xe"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Ảnh giấy tờ xe (CMND/CCCD/GPLX) *</Text>
            <FlatList
              data={vehicleData.images}
              horizontal
              keyExtractor={(item, idx) => item.uri + idx}
              renderItem={renderImageItem}
              ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
              style={styles.imageList}
              showsHorizontalScrollIndicator={false}
              ListFooterComponent={
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={pickImage}
                >
                  <MaterialIcons
                    name="add-a-photo"
                    size={32}
                    color={COLORS.PRIMARY}
                  />
                  <Text style={styles.addImageText}>Thêm ảnh</Text>
                </TouchableOpacity>
              }
            />

            <View style={styles.infoBox}>
              <MaterialIcons
                name="info-outline"
                size={20}
                color={COLORS.PRIMARY}
              />
              <Text style={styles.infoText}>
                Thông tin xe sẽ được gửi đến admin để xét duyệt. Vui lòng đảm
                bảo thông tin chính xác.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Vehicle Type Picker Modal */}
      <Modal
        transparent
        visible={vehicleTypeModalVisible}
        onRequestClose={() => setVehicleTypeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModal}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Chọn loại xe</Text>
            </View>
            {vehicleTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={styles.pickerItem}
                onPress={() => {
                  setVehicleData((prev) => ({
                    ...prev,
                    vehicleType: type.value,
                  }));
                  setVehicleTypeModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    vehicleData.vehicleType === type.value &&
                      styles.pickerItemTextActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  cancelText: {
    fontSize: 16,
    color: COLORS.GRAY,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  saveText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.PRIMARY,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1C1C1E",
    backgroundColor: "#F8F9FA",
  },
  inputError: {
    borderColor: "#FF3B30",
  },
  inputText: {
    fontSize: 16,
    color: "#1C1C1E",
  },
  errorText: {
    fontSize: 12,
    color: "#FF3B30",
    marginTop: 4,
  },
  imageList: {
    marginTop: 12,
    maxHeight: 120,
  },
  imageItem: {
    position: "relative",
    marginRight: 8,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FF3B30",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F8FF",
  },
  addImageText: {
    fontSize: 12,
    color: COLORS.PRIMARY,
    marginTop: 4,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#F0F8FF",
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#004553",
    marginLeft: 12,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  pickerModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 12,
  },
  pickerHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  pickerItemText: {
    fontSize: 16,
    color: "#333",
  },
  pickerItemTextActive: {
    color: COLORS.PRIMARY,
    fontWeight: "600",
  },
});

export default VehicleRegistration;
