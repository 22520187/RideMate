import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Linking, // Thêm Linking để fix lỗi không tìm thấy biến khi mở link bằng chứng
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import COLORS from "../../constant/colors";
import { getMatchDetail } from "../../services/matchService";
import { getProfile } from "../../services/userService";
import { createReport } from "../../services/reportService";
import ImagePickerModal from "../../components/ImagePickerModal";
import { uploadImage, normalizeMimeType } from "../../services/uploadService";
import GradientHeader from "../../components/GradientHeader";
import SnowEffect from "../../components/SnowEffect";

const REPORT_CATEGORIES = [
  { key: "SAFETY", label: "An toàn" },
  { key: "BEHAVIOR", label: "Hành vi / Thái độ" },
  { key: "LOST_ITEM", label: "Quên đồ" },
  { key: "PAYMENT", label: "Thanh toán" },
  { key: "APP_ISSUE", label: "Lỗi ứng dụng" },
  { key: "OTHER", label: "Khác" },
];

const RideDetail = ({ route, navigation }) => {
  const { rideId } = route.params;

  // -- Core State --
  const [loading, setLoading] = useState(true);
  const [ride, setRide] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  // -- Report Modal State --
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportCategory, setReportCategory] = useState("SAFETY");
  const [reportTitle, setReportTitle] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  // -- Image Picker State --
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [evidenceUploading, setEvidenceUploading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const normalizeRideDetail = (raw) => {
      const status =
        raw?.status ??
        raw?.matchStatus ??
        raw?.rideStatus ??
        raw?.state ??
        "UNKNOWN";
      const pickupAddress =
        raw?.pickupAddress ??
        raw?.pickup_address ??
        raw?.startLocation ??
        "Điểm đón";
      const destinationAddress =
        raw?.destinationAddress ??
        raw?.destination_address ??
        raw?.endLocation ??
        "Điểm đến";

      const coinRaw = raw?.coin ?? raw?.coins ?? raw?.price ?? 0;
      const coin = typeof coinRaw === "number" ? coinRaw : Number(coinRaw) || 0;

      const distanceRaw = raw?.distance ?? raw?.distanceMeters ?? 0;
      const distance =
        typeof distanceRaw === "number"
          ? distanceRaw
          : Number(distanceRaw) || 0;

      const durationRaw = raw?.duration ?? raw?.durationMinutes ?? 0;
      const duration =
        typeof durationRaw === "number"
          ? durationRaw
          : Number(durationRaw) || 0;

      const createdAt = raw?.createdAt ?? new Date().toISOString();

      const driverId = raw?.driverId ?? raw?.driver?.id;
      const driver = driverId
        ? {
            id: driverId,
            name: raw?.driverName ?? raw?.driver?.fullName ?? "Tài xế",
            phone: raw?.driverPhone ?? raw?.driver?.phoneNumber ?? "",
            avatar: raw?.driverAvatar ?? raw?.driver?.profilePictureUrl,
            rating: raw?.driverRating ?? raw?.driver?.rating ?? 0,
            vehicle: raw?.vehicle
              ? {
                  brand: raw?.vehicle?.make ?? "",
                  model: raw?.vehicle?.model ?? "",
                  color: raw?.vehicle?.color ?? "",
                  licensePlate: raw?.vehicle?.licensePlate ?? "",
                  info: raw?.vehicleInfo,
                }
              : null,
          }
        : null;

      const passengerId = raw?.passengerId ?? raw?.passenger?.id;
      const passenger = passengerId
        ? {
            id: passengerId,
            name:
              raw?.passengerName ?? raw?.passenger?.fullName ?? "Khách hàng",
            phone: raw?.passengerPhone ?? raw?.passenger?.phoneNumber ?? "",
            avatar: raw?.passengerAvatar ?? raw?.passenger?.profilePictureUrl,
          }
        : null;

      return {
        id: raw?.id ?? rideId,
        passengerId,
        driverId,
        status,
        pickupAddress,
        destinationAddress,
        coin,
        distance,
        duration,
        createdAt,
        driver,
        passenger,
        messages: raw?.messages ?? [],
      };
    };

    const fetchDetail = async () => {
      try {
        setLoading(true);
        const profileResp = await getProfile();
        const userData = profileResp?.data?.data ?? profileResp?.data;
        if (isMounted) setCurrentUserId(userData?.id);

        const resp = await getMatchDetail(rideId);
        const payload = resp?.data?.data ?? resp?.data ?? null;
        const normalized = normalizeRideDetail(payload);
        if (isMounted) setRide(normalized);
      } catch (err) {
        console.warn("Failed to load ride detail:", err?.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [rideId]);

  // -- Helpers --
  const getStatusColor = (status) => {
    switch (status) {
      case "COMPLETED":
        return COLORS.GREEN;
      case "CANCELLED":
        return COLORS.RED;
      case "IN_PROGRESS":
        return "#2196F3";
      default:
        return COLORS.GRAY;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "COMPLETED":
        return "Hoàn thành";
      case "CANCELLED":
        return "Đã hủy";
      case "IN_PROGRESS":
        return "Đang diễn ra";
      default:
        return status;
    }
  };

  const handleMessage = () => {
    if (!ride?.id) return;
    const isDriver = currentUserId === ride.driverId;
    const otherPerson = isDriver ? ride.passenger : ride.driver;
    if (!otherPerson) return;

    const userIds = [currentUserId, otherPerson.id].sort();
    const channelId = `dm-${userIds[0]}-${userIds[1]}`;

    navigation.navigate("ChatScreen", {
      channelId,
      otherUserId: otherPerson.id,
      otherUserName: otherPerson.name,
      otherUserAvatar: otherPerson.avatar,
      otherUserPhone: otherPerson.phone || null,
      rideInfo: { from: ride.pickupAddress, to: ride.destinationAddress },
    });
  };

  // -- Report Logic --
  const openReportModal = () => {
    setReportCategory("SAFETY");
    setReportTitle("");
    setReportDescription("");
    setEvidenceUrl("");
    setReportModalVisible(true);
  };

  const closeReportModal = () => {
    if (reportSubmitting || evidenceUploading) return;
    setReportModalVisible(false);
  };

  const ensureFileUri = async (inputUri) => {
    let uri = inputUri;
    if (!uri) return uri;
    if (Platform.OS === "android" && uri.startsWith("content://")) {
      const dest = `${FileSystem.cacheDirectory}upload_${Date.now()}.jpg`;
      await FileSystem.copyAsync({ from: uri, to: dest });
      uri = dest;
    }
    return Platform.OS === "android" &&
      !uri.startsWith("file://") &&
      !uri.startsWith("http")
      ? `file://${uri}`
      : uri;
  };

  const uploadEvidenceImage = async (asset) => {
    try {
      setEvidenceUploading(true);
      const rawUri = asset?.uri;
      if (!rawUri) throw new Error("Không tìm thấy ảnh");

      const uri = await ensureFileUri(rawUri);
      const fileName = asset?.fileName || `evidence_${Date.now()}.jpg`;
      const mimeType = normalizeMimeType(asset?.type, fileName);

      const uploadResp = await uploadImage({
        uri,
        name: fileName,
        type: mimeType,
      });
      const url = uploadResp?.data?.url;
      if (!url) throw new Error("Upload thất bại");

      setEvidenceUrl(url);
      Alert.alert("Thành công", "Đã tải ảnh minh chứng");
    } catch (err) {
      Alert.alert("Lỗi", err.message);
    } finally {
      setEvidenceUploading(false);
    }
  };

  const handlePickEvidence = async (sourceType) => {
    setImagePickerVisible(false);
    setTimeout(async () => {
      try {
        const isCamera = sourceType === "camera";
        const permission = isCamera
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            "Cần quyền truy cập",
            "Vui lòng cấp quyền để thực hiện chức năng này."
          );
          return;
        }

        const result = isCamera
          ? await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              quality: 0.8,
            })
          : await ImagePicker.launchImageLibraryAsync({
              allowsEditing: true,
              quality: 0.8,
            });

        if (!result.canceled && result.assets?.length > 0) {
          await uploadEvidenceImage(result.assets[0]);
        }
      } catch (err) {
        Alert.alert("Lỗi", "Không thể chọn ảnh");
      }
    }, 400);
  };

  const submitReport = async () => {
    if (!ride?.driver?.id)
      return Alert.alert("Lỗi", "Thông tin đối tượng báo cáo không hợp lệ.");
    if (!reportTitle.trim() || !reportDescription.trim())
      return Alert.alert(
        "Thiếu thông tin",
        "Vui lòng nhập đầy đủ tiêu đề và mô tả."
      );

    try {
      setReportSubmitting(true);
      await createReport({
        matchId: ride.id,
        reportedUserId: ride.driver.id,
        title: reportTitle.trim(),
        description: reportDescription.trim(),
        category: reportCategory,
        evidenceUrl: evidenceUrl?.trim() || null,
      });
      Alert.alert("Thành công", "Báo cáo của bạn đã được gửi.", [
        { text: "OK", onPress: () => setReportModalVisible(false) },
      ]);
    } catch (err) {
      Alert.alert(
        "Lỗi",
        err?.response?.data?.message || "Không thể gửi báo cáo."
      );
    } finally {
      setReportSubmitting(false);
    }
  };

  // -- Render Logic --
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <SnowEffect />
        <GradientHeader
          title="🚗 Chi tiết chuyến đi"
          onBackPress={() => navigation.goBack()}
          showBackButton={true}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5370" />
        </View>
      </SafeAreaView>
    );
  }

  if (!ride) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <SnowEffect />
        <GradientHeader
          title="🚗 Chi tiết chuyến đi"
          onBackPress={() => navigation.goBack()}
          showBackButton={true}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>Không tìm thấy chuyến đi</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isDriver = currentUserId === ride.driverId;
  const otherPerson = isDriver ? ride.passenger : ride.driver;
  const statusColor = getStatusColor(ride.status);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <SnowEffect />
      <GradientHeader
        title="🚗 Chi tiết chuyến đi"
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <LinearGradient
            colors={["#FF5370", "#FF6B9D", "#FF8FAB"]}
            style={styles.statusGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons
              name={
                ride.status === "COMPLETED"
                  ? "checkmark-circle"
                  : "alert-circle"
              }
              size={32}
              color="#fff"
            />
            <Text style={styles.statusText}>{getStatusText(ride.status)}</Text>
            <Text style={styles.statusSubtext}>
              {new Date(ride.createdAt).toLocaleString("vi-VN")}
            </Text>
          </LinearGradient>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isDriver ? "👤 Thông tin khách hàng" : "👤 Thông tin tài xế"}
          </Text>
          {otherPerson ? (
            <View style={styles.driverCard}>
              <Image
                source={{
                  uri: otherPerson.avatar || "https://i.pravatar.cc/150?img=14",
                }}
                style={styles.driverAvatar}
              />
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{otherPerson.name}</Text>
                {otherPerson.phone && (
                  <Text style={styles.phoneText}>{otherPerson.phone}</Text>
                )}
                {!isDriver && (
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={16} color="#FFB800" />
                    <Text style={styles.ratingText}>{otherPerson.rating}</Text>
                  </View>
                )}
                {!isDriver && ride.driver?.vehicle && (
                  <Text style={styles.vehicleText}>
                    {ride.driver.vehicle.brand} {ride.driver.vehicle.model} -{" "}
                    {ride.driver.vehicle.licensePlate}
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.driverCard}>
              <Text>Đang cập nhật...</Text>
            </View>
          )}
        </View>

        {/* Route Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗺️ Lộ trình</Text>
          <View style={styles.routeCard}>
            <View style={styles.routeRow}>
              <View style={styles.routeIconContainer}>
                <View
                  style={[styles.routeDot, { backgroundColor: "#FF5370" }]}
                />
                <View style={styles.routeLine} />
              </View>
              <View style={styles.routeContent}>
                <Text style={styles.routeLabel}>Điểm đón</Text>
                <Text style={styles.routeAddress}>{ride.pickupAddress}</Text>
              </View>
            </View>
            <View style={styles.routeRow}>
              <View style={styles.routeIconContainer}>
                <View
                  style={[styles.routeDot, { backgroundColor: "#FF5370" }]}
                />
              </View>
              <View style={styles.routeContent}>
                <Text style={styles.routeLabel}>Điểm đến</Text>
                <Text style={styles.routeAddress}>
                  {ride.destinationAddress}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Ride Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Thông tin chuyến đi</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="cash-outline" size={20} color="#FF5370" />
                <Text style={styles.detailLabel}>Giá cước</Text>
                <Text style={styles.detailValue}>{ride.coin} coin</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailItem}>
                <Ionicons name="navigate-outline" size={20} color="#FF5370" />
                <Text style={styles.detailLabel}>Khoảng cách</Text>
                <Text style={styles.detailValue}>
                  {ride.distance >= 1000
                    ? `${(ride.distance / 1000).toFixed(1)} km`
                    : `${Math.round(ride.distance)} m`}
                </Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={20} color="#FF5370" />
                <Text style={styles.detailLabel}>Thời gian</Text>
                <Text style={styles.detailValue}>
                  {ride.duration || 0} phút
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleMessage}
          >
            <LinearGradient
              colors={["#FF5370", "#FF6B9D", "#FF8FAB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}
            >
              <Ionicons
                name="chatbubble-outline"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.primaryButtonText}>Nhắn tin</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={openReportModal}
          >
            <Text style={styles.secondaryButtonText}>Báo cáo vấn đề</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Report Modal */}
      <Modal
        visible={reportModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeReportModal}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeReportModal}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{ width: "100%" }}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={styles.modalContainer}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Báo cáo vấn đề</Text>
                <TouchableOpacity onPress={closeReportModal}>
                  <Ionicons name="close" size={22} color="#1C1C1E" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <Text style={styles.inputLabel}>Loại vấn đề *</Text>
                <View style={styles.categoryGrid}>
                  {REPORT_CATEGORIES.map((c) => (
                    <TouchableOpacity
                      key={c.key}
                      style={[
                        styles.categoryChip,
                        reportCategory === c.key && styles.categoryChipActive,
                      ]}
                      onPress={() => setReportCategory(c.key)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          reportCategory === c.key &&
                            styles.categoryChipTextActive,
                        ]}
                      >
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Tiêu đề *</Text>
                <TextInput
                  style={styles.textInput}
                  value={reportTitle}
                  onChangeText={setReportTitle}
                  placeholder="Nhập tiêu đề..."
                />

                <Text style={styles.inputLabel}>Mô tả chi tiết *</Text>
                <TextInput
                  style={styles.textArea}
                  value={reportDescription}
                  onChangeText={setReportDescription}
                  multiline
                  placeholder="Mô tả cụ thể..."
                />

                <Text style={styles.inputLabel}>Bằng chứng</Text>
                <View style={styles.evidenceRow}>
                  <TextInput
                    style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                    value={evidenceUrl}
                    onChangeText={setEvidenceUrl}
                    placeholder="URL ảnh..."
                  />
                  <TouchableOpacity
                    style={styles.uploadBtn}
                    onPress={() => setImagePickerVisible(true)}
                    disabled={evidenceUploading}
                  >
                    {evidenceUploading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons
                        name="cloud-upload-outline"
                        size={18}
                        color="#fff"
                      />
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalCancel]}
                    onPress={closeReportModal}
                  >
                    <Text>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalSubmit]}
                    onPress={submitReport}
                    disabled={reportSubmitting}
                  >
                    {reportSubmitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={{ color: "#fff" }}>Gửi</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </Pressable>
        </Pressable>
      </Modal>

      <ImagePickerModal
        visible={imagePickerVisible}
        onClose={() => setImagePickerVisible(false)}
        onCameraPress={() => handlePickEvidence("camera")}
        onLibraryPress={() => handlePickEvidence("library")}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF5F7" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  statusCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  statusGradient: { padding: 24, alignItems: "center" },
  statusText: { fontSize: 18, fontWeight: "700", color: "#fff", marginTop: 8 },
  statusSubtext: { fontSize: 14, color: "rgba(255,255,255,0.9)", marginTop: 4 },
  section: { marginBottom: 20, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FF5370",
    marginBottom: 12,
  },
  driverCard: {
    flexDirection: "row",
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "#FFE5EC",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  driverAvatar: { width: 64, height: 64, borderRadius: 32 },
  driverInfo: { flex: 1, marginLeft: 12 },
  driverName: { fontSize: 16, fontWeight: "700" },
  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  ratingText: { marginLeft: 4, fontWeight: "600" },
  routeCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "#FFE5EC",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  routeRow: { flexDirection: "row", marginBottom: 20 },
  routeIconContainer: { alignItems: "center", marginRight: 16 },
  routeDot: { width: 12, height: 12, borderRadius: 6 },
  routeLine: { width: 2, height: 40, backgroundColor: "#E0E0E0" },
  routeContent: { flex: 1 },
  routeLabel: { fontSize: 12, color: "#8E8E93" },
  routeAddress: { fontSize: 15, fontWeight: "600" },
  detailsCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "#FFE5EC",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  detailRow: { flexDirection: "row", justifyContent: "space-between" },
  detailItem: { flex: 1, alignItems: "center", gap: 4 },
  detailDivider: { width: 1, backgroundColor: "#E0E0E0", marginHorizontal: 8 },
  detailLabel: { fontSize: 12, color: "#8E8E93", marginTop: 4 },
  detailValue: { fontSize: 16, fontWeight: "700", color: "#1C1C1E" },
  phoneText: { fontSize: 14, color: "#8E8E93", marginTop: 2 },
  vehicleText: { fontSize: 13, color: "#8E8E93", marginTop: 4 },
  actionSection: { paddingHorizontal: 16, gap: 12, marginBottom: 20 },
  primaryButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonGradient: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: { color: "#fff", fontWeight: "700" },
  secondaryButton: {
    backgroundColor: COLORS.WHITE,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFE5EC",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  secondaryButtonText: { fontWeight: "600", color: "#FF5370" },
  emptyText: { fontSize: 16, color: "#8E8E93", marginTop: 20 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalBody: { padding: 20 },
  inputLabel: { fontWeight: "700", marginBottom: 8, marginTop: 10 },
  textInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  textArea: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
  },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  categoryChip: {
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  categoryChipActive: {
    backgroundColor: "#FF5370",
    borderColor: "#FF5370",
  },
  categoryChipTextActive: { color: "#fff" },
  uploadBtn: {
    backgroundColor: "#FF5370",
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  evidenceRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    marginBottom: 40,
  },
  modalBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center" },
  modalCancel: { backgroundColor: "#F5F5F5" },
  modalSubmit: { backgroundColor: "#FF5370" },
});

export default RideDetail;
