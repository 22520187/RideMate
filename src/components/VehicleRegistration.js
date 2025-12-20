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
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import COLORS from "../constant/colors";
import { registerVehicle } from "../services/vehicleService";
import { uploadImage } from "../services/uploadService";
import { processVehicleImage } from "../services/licensePlateService";
import Toast from "react-native-toast-message";
import ImagePickerModal from "./ImagePickerModal";

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
  
  // License plate scanning states
  const [plateImage, setPlateImage] = useState(null);
  const [scanningPlate, setScanningPlate] = useState(false);
  const [plateDetectionResult, setPlateDetectionResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState('plate'); // 'plate' | 'document'

  const vehicleTypes = [
    { label: "Xe máy", value: "MOTORBIKE" },
    { label: "Ô tô", value: "CAR" },
    { label: "Van", value: "VAN" },
    { label: "Tải", value: "TRUCK" },
  ];

  /**
   * Show image source selection
   */
  const showImageSourceModal = () => {
    setImagePickerVisible(true);
  };

  /**
   * Scan license plate from camera or gallery
   */
  const scanLicensePlate = async (sourceType = 'camera') => {
    try {
      let result;
      
      if (sourceType === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (permission.status !== 'granted') {
          Alert.alert(
            'Cần quyền truy cập',
            'Vui lòng cho phép ứng dụng truy cập Camera để chụp ảnh biển số xe.\n\nĐi tới Cài đặt > Quyền riêng tư > Camera để mở quyền.'
          );
          return;
        }
        
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permission.status !== 'granted') {
          Alert.alert(
            'Quyền bị từ chối',
            'Vui lòng cấp quyền truy cập thư viện ảnh.'
          );
          return;
        }
        
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'Images',
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setPlateImage(imageUri);
        setPlateDetectionResult(null);
        
        // Process the image
        setScanningPlate(true);
        Toast.show({
          type: 'info',
          text1: 'Đang xử lý...',
          text2: 'Vui lòng chờ trong giây lát',
        });

        const detectionResult = await processVehicleImage(imageUri);
        
        setScanningPlate(false);

        if (detectionResult.success) {
          setPlateDetectionResult(detectionResult);
          setScanError(null);
          // Auto-fill license plate
          setVehicleData((prev) => ({
            ...prev,
            licensePlate: detectionResult.plateNumber,
          }));
          
          Toast.show({
            type: 'success',
            text1: 'Thành công!',
            text2: `Đã phát hiện biển số: ${detectionResult.plateNumber}`,
          });
        } else {
          // If failed, clear image and show error
          setPlateImage(null);
          setPlateDetectionResult(null);
          setScanError(detectionResult.error || 'Không thể đọc biển số');
          
          Toast.show({
            type: 'error',
            text1: 'Không thành công',
            text2: detectionResult.error || 'Không thể đọc biển số',
          });
        }
      }
    } catch (error) {
      console.error('Error scanning license plate:', error);
      setScanningPlate(false);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Có lỗi xảy ra khi xử lý ảnh',
      });
    }
  };

  /**
   * Clear plate scan result
   */
  const clearPlateScan = () => {
    setPlateImage(null);
    setPlateDetectionResult(null);
    setScanError(null);
  };

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

    // Format: XX-XX YYYY or XX-XX YYYYY
    // Example: 54-L1 9999, 59-V1 12345
    // Also accept old logic just in case: XX-XX-YYYY (if logic changes back)
    
    // Regex explanation:
    // ^[0-9]{2}: Starts with 2 digits (Area code)
    // -: Hyphen
    // [A-Z0-9]{1,2}: 1 or 2 alphanumeric chars (Series)
    // [\s-]?: Optional space or hyphen separator
    // [0-9]{4,5}$: Ends with 4 or 5 digits
    const pattern = /^[0-9]{2}-[A-Z0-9]{1,2}[\s-]?[0-9]{4,5}$/;

    if (pattern.test(trimmed)) {
      return { valid: true, message: null };
    }

    return {
      valid: false,
      message:
        "Biển số phải có định dạng: XX-XX YYYY\nVí dụ: 54-L1 9999 hoặc 59-V1 12345",
    };
  };

  const handleImagePickerSelect = (source) => {
    // Wait for modal to close (handled by child)
    setTimeout(() => {
      if (pickerTarget === 'plate') {
        scanLicensePlate(source);
      } else {
        pickDocumentImage(source);
      }
    }, 500);
  };

  const pickDocumentImage = async (sourceType) => {
    let result;
    if (sourceType === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert(
          'Cần quyền truy cập',
          'Vui lòng cho phép ứng dụng truy cập Camera để chụp ảnh giấy tờ xe.\n\nĐi tới Cài đặt > Quyền riêng tư > Camera để mở quyền.'
        );
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
    } else {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          'Cần quyền truy cập',
          'Vui lòng cho phép ứng dụng truy cập Thư viện ảnh để tải lên ảnh giấy tờ xe.\n\nĐi tới Cài đặt > Quyền riêng tư > Ảnh để mở quyền.'
        );
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'Images',
        allowsEditing: true,
        quality: 0.8,
      });
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const newImage = {
        uri: asset.uri,
        name: asset.fileName || `doc_${Date.now()}.jpg`,
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
        
        // Create FormData specifically for React Native
        const formData = new FormData();
        formData.append('file', {
          uri: firstImage.uri,
          name: firstImage.name || 'image.jpg',
          type: firstImage.type || 'image/jpeg',
        });

        console.log("Uploading image...", firstImage.uri);
        const uploadResp = await uploadImage(formData);
        
        // Handle response format variations
        if (uploadResp?.data?.url) {
          registrationDocumentUrl = uploadResp.data.url;
        } else if (uploadResp?.data?.data?.url) {
          registrationDocumentUrl = uploadResp.data.data.url;
        } else if (uploadResp?.url) {
          registrationDocumentUrl = uploadResp.url;
        }

        if (!registrationDocumentUrl) {
          console.error("Upload response:", uploadResp);
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
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Đăng ký xe</Text>
            <TouchableOpacity onPress={handleSubmit} disabled={submitting} style={styles.headerButton}>
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
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.label}>Biển số xe *</Text>
            
            {/* License Plate Scanner Section */}
            <View style={styles.plateScannerSection}>
              <TouchableOpacity
                style={styles.imageUploadBox}
                onPress={() => {
                  console.log('📸 Image upload box pressed');
                  setPickerTarget('plate');
                  showImageSourceModal();
                }}
                disabled={scanningPlate}
                activeOpacity={0.7}
              >
                <Ionicons name="camera-outline" size={32} color={COLORS.PRIMARY} />
                <Text style={styles.imageUploadText}>Chụp/Chọn ảnh biển số</Text>
                <Text style={styles.imageUploadHint}>Nhấn để tải ảnh lên</Text>
              </TouchableOpacity>

              {/* Scan Error Message (shown when no image is selected but error occurred) */}
              {!plateImage && scanError && (
                <View style={styles.scanErrorBox}>
                  <MaterialIcons name="error-outline" size={20} color="#DC2626" />
                  <Text style={styles.scanErrorText}>{scanError}</Text>
                  <TouchableOpacity 
                    style={styles.retryTextButton}
                    onPress={() => showImageSourceModal()}
                  >
                    <Text style={styles.retryTextButtonLabel}>Thử lại ngay</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Image Preview & Results */}
              {plateImage && (
                <View style={styles.platePreviewContainer}>
                  <View style={styles.plateImageWrapper}>
                    <Image
                      source={{ uri: plateImage }}
                      style={styles.plateImage}
                    />
                    {scanningPlate && (
                      <View style={styles.scanningOverlay}>
                        <ActivityIndicator size="large" color={COLORS.WHITE} />
                        <Text style={styles.scanningText}>Đang xử lý...</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.clearImageButton}
                      onPress={clearPlateScan}
                    >
                      <Ionicons name="close-circle" size={24} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>

                  {/* Detection Result */}
                  {plateDetectionResult && !scanningPlate && (
                    <View
                      style={[
                        styles.detectionResult,
                        plateDetectionResult.success
                          ? styles.detectionSuccess
                          : styles.detectionError,
                      ]}
                    >
                      <View style={styles.detectionHeader}>
                        <Ionicons
                          name={
                            plateDetectionResult.success
                              ? 'checkmark-circle'
                              : 'close-circle'
                          }
                          size={20}
                          color={plateDetectionResult.success ? '#065F46' : '#EF4444'}
                        />
                        <Text style={[
                          styles.detectionTitle,
                          plateDetectionResult.success && { color: '#065F46' }
                        ]}>
                          {plateDetectionResult.success
                            ? 'Đã phát hiện biển số'
                            : 'Không thành công'}
                        </Text>
                      </View>

                      {plateDetectionResult.success && (
                        <>
                          <Text style={styles.detectedPlateNumber}>
                            {plateDetectionResult.plateNumber}
                          </Text>

                        </>
                      )}
                    </View>
                  )}
                </View>
              )}

              {/* Tips */}
              {!plateImage && (
                <View style={styles.tipsBox}>
                  <Ionicons name="bulb-outline" size={16} color="#0891B2" />
                  <Text style={styles.tipsText}>
                    Chụp ảnh biển số để tự động nhận diện
                  </Text>
                </View>
              )}
            </View>



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
                  onPress={() => {
                    setPickerTarget('document');
                    setImagePickerVisible(true);
                  }}
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
          {/* Image Picker Modal */}
      <ImagePickerModal
        visible={imagePickerVisible}
        onClose={() => setImagePickerVisible(false)}
        onCameraPress={() => handleImagePickerSelect('camera')}
        onLibraryPress={() => handleImagePickerSelect('gallery')}
        title={pickerTarget === 'plate' ? "Chọn ảnh biển số xe" : "Chọn ảnh giấy tờ xe"}
      />
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
  headerButton: {
    paddingVertical: 8,
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
  // License Plate Scanner Styles
  plateScannerSection: {
    marginBottom: 12,
  },
  imageUploadBox: {
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F8FF',
    marginBottom: 12,
  },
  imageUploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.PRIMARY,
    marginTop: 12,
  },
  imageUploadHint: {
    fontSize: 13,
    color: '#0369A1',
    marginTop: 4,
  },
  platePreviewContainer: {
    marginBottom: 12,
  },
  plateImageWrapper: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  plateImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningText: {
    color: COLORS.WHITE,
    fontSize: 14,
    marginTop: 8,
    fontWeight: '600',
  },
  clearImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
  },
  detectionResult: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  detectionSuccess: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  detectionError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  detectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  detectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  detectedPlateNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#065F46',
    textAlign: 'center',
    letterSpacing: 2,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    marginBottom: 12,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confidenceLabel: {
    fontSize: 13,
    color: '#065F46',
  },
  confidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  highConfidence: {
    backgroundColor: '#10B981',
  },
  mediumConfidence: {
    backgroundColor: '#F59E0B',
  },
  lowConfidence: {
    backgroundColor: '#EF4444',
  },
  confidenceText: {
    color: COLORS.WHITE,
    fontSize: 11,
    fontWeight: '600',
  },
  errorMessage: {
    fontSize: 13,
    color: '#991B1B',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorContainer: {
    alignItems: 'center',
    width: '100%',
  },
  retryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: COLORS.WHITE,
    fontWeight: '600',
    fontSize: 14,
  },
  tipsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  tipsText: {
    flex: 1,
    fontSize: 12,
    color: '#0369A1',
  },
  scanErrorBox: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  scanErrorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    marginVertical: 8,
  },
  retryTextButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#DC2626',
    borderRadius: 6,
  },
  retryTextButtonLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default VehicleRegistration;
