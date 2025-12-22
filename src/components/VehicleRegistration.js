import React, { useState, useEffect } from "react";
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
  InteractionManager,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import COLORS from "../constant/colors";
import { registerVehicle } from "../services/vehicleService";
import { uploadImage } from "../services/uploadService";
import { processVehicleImage } from "../services/licensePlateService";
import Toast from "react-native-toast-message";
import ImagePickerModal from "./ImagePickerModal";

const VehicleRegistration = ({
  visible,
  onClose,
  onSuccess,
  initialVehicle = null,
}) => {
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
  const [plateImage, setPlateImage] = useState(null);
  const [scanningPlate, setScanningPlate] = useState(false);
  const [plateDetectionResult, setPlateDetectionResult] = useState(null);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState("plate");

  const vehicleTypes = [
    { label: "Xe máy", value: "MOTORBIKE" },
    { label: "Ô tô", value: "CAR" },
    { label: "Van", value: "VAN" },
    { label: "Tải", value: "TRUCK" },
  ];

  useEffect(() => {
    if (visible && initialVehicle) {
      const initialImages = initialVehicle.registrationDocumentUrl
        ? [
            {
              uri: initialVehicle.registrationDocumentUrl,
              name: "registration_document.jpg",
              type: "image/jpeg",
            },
          ]
        : [];

      if (initialVehicle.licensePlateImageUrl) {
        setPlateImage(initialVehicle.licensePlateImageUrl);
        setPlateDetectionResult({
          success: true,
          plateNumber: initialVehicle.licensePlate,
        });
      }

      setVehicleData({
        licensePlate: initialVehicle.licensePlate || "",
        make: initialVehicle.make || "",
        model: initialVehicle.model || "",
        color: initialVehicle.color || "",
        capacity: String(initialVehicle.capacity || "1"),
        vehicleType: initialVehicle.vehicleType || "MOTORBIKE",
        images: initialImages,
        registrationDocumentUrl: initialVehicle.registrationDocumentUrl || "",
      });
    } else if (visible && !initialVehicle) {
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
      setPlateImage(null);
      setPlateDetectionResult(null);
    }
  }, [visible, initialVehicle]);

  const handleImagePickerSelect = async (source) => {
    const { status } =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Quyền truy cập", "Bạn cần cấp quyền để tiếp tục.");
      return;
    }

    setImagePickerVisible(false);

    setTimeout(() => {
      InteractionManager.runAfterInteractions(() => {
        executePicker(source);
      });
    }, 600);
  };

  const executePicker = async (source) => {
    const options = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: pickerTarget === "plate" ? [4, 3] : undefined,
      quality: 0.8,
    };

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      if (pickerTarget === "plate") {
        processPlate(uri);
      } else {
        const asset = result.assets[0];
        setVehicleData((prev) => ({
          ...prev,
          images: [
            ...prev.images,
            {
              uri,
              name: asset.fileName || `doc_${Date.now()}.jpg`,
              type: "image/jpeg",
            },
          ],
        }));
      }
    }
  };

  const processPlate = async (uri) => {
    setPlateImage(uri);
    setScanningPlate(true);
    try {
      const res = await processVehicleImage(uri);
      if (res.success) {
        setPlateDetectionResult(res);
        setVehicleData((prev) => ({ ...prev, licensePlate: res.plateNumber }));
        Toast.show({ type: "success", text1: "Nhận diện thành công" });
      } else {
        setPlateImage(null);
        Alert.alert("Lỗi", "Không tìm thấy biển số. Vui lòng chụp rõ hơn.");
      }
    } catch (e) {
      setPlateImage(null);
    } finally {
      setScanningPlate(false);
    }
  };

  const handleSubmit = async () => {
    if (!vehicleData.licensePlate) {
      Alert.alert("Lỗi", "Vui lòng quét biển số xe trước.");
      return;
    }
    setSubmitting(true);
    try {
      let docUrl = vehicleData.registrationDocumentUrl;
      if (!docUrl && vehicleData.images.length > 0) {
        const fileInfo = {
          uri: vehicleData.images[0].uri,
          name: "doc.jpg",
          type: "image/jpeg",
        };
        const res = await uploadImage(fileInfo);
        docUrl = res?.data?.url || res?.url;
      }
      let plateUrl = null;
      if (plateImage && !plateImage.startsWith("http")) {
        const fileInfo = {
          uri: plateImage,
          name: "plate.jpg",
          type: "image/jpeg",
        };
        const res = await uploadImage(fileInfo);
        plateUrl = res?.data?.url || res?.url;
      }
      await registerVehicle({
        ...vehicleData,
        registrationDocumentUrl: docUrl,
        licensePlateImageUrl: plateUrl,
        capacity: parseInt(vehicleData.capacity),
      });
      Alert.alert("Thành công", "Thông tin đã được gửi duyệt.", [
        {
          text: "OK",
          onPress: () => {
            onSuccess?.();
            onClose();
          },
        },
      ]);
    } catch (err) {
      Alert.alert("Lỗi", "Gửi thông tin thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
            <Text style={styles.title}>
              {initialVehicle ? "Thông tin xe" : "Đăng ký xe"}
            </Text>
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
            <Text style={styles.label}>Nhận diện biển số *</Text>
            <TouchableOpacity
              style={styles.imageUploadBox}
              onPress={() => {
                setPickerTarget("plate");
                setImagePickerVisible(true);
              }}
            >
              <Ionicons
                name="camera-outline"
                size={32}
                color={COLORS.PRIMARY}
              />
              <Text style={styles.imageUploadText}>
                Chụp ảnh biển số để nhận diện
              </Text>
            </TouchableOpacity>

            {plateImage && (
              <View style={styles.platePreviewContainer}>
                <Image source={{ uri: plateImage }} style={styles.plateImage} />
                {scanningPlate && (
                  <View style={styles.scanningOverlay}>
                    <ActivityIndicator color="#fff" />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.clearImageButton}
                  onPress={() => {
                    setPlateImage(null);
                    setVehicleData({ ...vehicleData, licensePlate: "" });
                  }}
                >
                  <Ionicons name="close-circle" size={24} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            )}

            {vehicleData.licensePlate !== "" && (
              <View style={styles.plateDisplayContainer}>
                <View style={styles.plateCard}>
                  <View style={styles.plateLine} />
                  <Text style={styles.plateText}>
                    {vehicleData.licensePlate}
                  </Text>
                </View>
                <Text style={styles.plateHint}>
                  Biển số đã được hệ thống ghi nhận
                </Text>
              </View>
            )}

            <Text style={styles.label}>Hãng xe *</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Honda, Yamaha"
              value={vehicleData.make}
              onChangeText={(t) => setVehicleData({ ...vehicleData, make: t })}
            />

            <Text style={styles.label}>Dòng xe *</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Wave RSX, Vision"
              value={vehicleData.model}
              onChangeText={(t) => setVehicleData({ ...vehicleData, model: t })}
            />

            <Text style={styles.label}>Màu sắc *</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Đỏ, Xanh, Đen"
              value={vehicleData.color}
              onChangeText={(t) => setVehicleData({ ...vehicleData, color: t })}
            />

            <Text style={styles.label}>Sức chứa (người) *</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="VD: 2"
              value={vehicleData.capacity}
              onChangeText={(t) =>
                setVehicleData({ ...vehicleData, capacity: t })
              }
            />

            <Text style={styles.label}>Loại phương tiện *</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setVehicleTypeModalVisible(true)}
            >
              <Text style={styles.inputText}>
                {
                  vehicleTypes.find((v) => v.value === vehicleData.vehicleType)
                    ?.label
                }
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Ảnh giấy tờ liên quan *</Text>
            <FlatList
              data={vehicleData.images}
              horizontal
              keyExtractor={(_, i) => i.toString()}
              renderItem={({ item, index }) => (
                <View style={styles.imageItem}>
                  <Image
                    source={{ uri: item.uri }}
                    style={styles.imagePreview}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => {
                      const n = [...vehicleData.images];
                      n.splice(index, 1);
                      setVehicleData({ ...vehicleData, images: n });
                    }}
                  >
                    <MaterialIcons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
              ListFooterComponent={
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={() => {
                    setPickerTarget("document");
                    setImagePickerVisible(true);
                  }}
                >
                  <MaterialIcons
                    name="add-a-photo"
                    size={30}
                    color={COLORS.PRIMARY}
                  />
                </TouchableOpacity>
              }
            />
            <View style={{ height: 40 }} />
          </ScrollView>

          <ImagePickerModal
            visible={imagePickerVisible}
            onClose={() => setImagePickerVisible(false)}
            onCameraPress={() => handleImagePickerSelect("camera")}
            onLibraryPress={() => handleImagePickerSelect("gallery")}
            title={
              pickerTarget === "plate" ? "Chọn ảnh biển số" : "Thêm ảnh giấy tờ"
            }
          />

          <Modal
            transparent
            visible={vehicleTypeModalVisible}
            animationType="fade"
          >
            <View style={styles.modalOverlay}>
              <View style={styles.pickerModal}>
                <Text style={styles.pickerTitle}>Chọn loại xe</Text>
                {vehicleTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={styles.pickerItem}
                    onPress={() => {
                      setVehicleData({
                        ...vehicleData,
                        vehicleType: type.value,
                      });
                      setVehicleTypeModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        vehicleData.vehicleType === type.value && {
                          color: COLORS.PRIMARY,
                          fontWeight: "700",
                        },
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={{ padding: 20 }}
                  onPress={() => setVehicleTypeModalVisible(false)}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      color: "red",
                      fontWeight: "600",
                    }}
                  >
                    Đóng
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },
  cancelText: { fontSize: 16, color: "#8E8E93" },
  title: { fontSize: 18, fontWeight: "700", color: "#1C1C1E" },
  saveText: { fontSize: 16, fontWeight: "700", color: COLORS.PRIMARY },
  content: { flex: 1, paddingHorizontal: 20 },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 10,
    marginTop: 20,
  },
  row: { flexDirection: "row", gap: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#F9F9F9",
    marginBottom: 12,
  },
  inputText: { fontSize: 16, color: "#1C1C1E" },
  imageUploadBox: {
    borderWidth: 1.5,
    borderColor: COLORS.PRIMARY,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 25,
    alignItems: "center",
    backgroundColor: "#F0F7FF",
  },
  imageUploadText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    marginTop: 8,
    fontWeight: "500",
  },
  platePreviewContainer: {
    marginTop: 15,
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
  },
  plateImage: { width: "100%", height: 200 },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  clearImageButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#FFF",
    borderRadius: 20,
  },
  plateDisplayContainer: { alignItems: "center", marginVertical: 20 },
  plateCard: {
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: "#333",
    borderRadius: 8,
    width: "70%",
    paddingVertical: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  plateLine: {
    width: "100%",
    height: 1.5,
    backgroundColor: "#333",
    marginBottom: 5,
  },
  plateText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1C1C1E",
    letterSpacing: 2,
  },
  plateHint: { fontSize: 12, color: "#8E8E93", marginTop: 8 },
  imageItem: { marginRight: 12, position: "relative", marginTop: 10 },
  imagePreview: { width: 100, height: 100, borderRadius: 12 },
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
    borderWidth: 1.5,
    borderColor: COLORS.PRIMARY,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  pickerModal: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    padding: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: "#EEE",
  },
  pickerItem: {
    padding: 18,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F2F2F2",
  },
  pickerItemText: { fontSize: 16, textAlign: "center", color: "#333" },
});

export default VehicleRegistration;
