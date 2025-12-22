import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import COLORS from "../../constant/colors";
import { getMatchDetail } from "../../services/matchService";
import { createReport } from "../../services/reportService";
import ImagePickerModal from "../../components/ImagePickerModal";
import { uploadImage, normalizeMimeType } from "../../services/uploadService";

const RideDetail = ({ route, navigation }) => {
  const { rideId } = route.params;
  const [loading, setLoading] = useState(true);
  const [ride, setRide] = useState(null);

  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportCategory, setReportCategory] = useState("SAFETY");
  const [reportTitle, setReportTitle] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [evidenceUploading, setEvidenceUploading] = useState(false);

  const REPORT_CATEGORIES = [
    { key: "SAFETY", label: "An toàn" },
    { key: "BEHAVIOR", label: "Hành vi / Thái độ" },
    { key: "LOST_ITEM", label: "Quên đồ" },
    { key: "PAYMENT", label: "Thanh toán" },
    { key: "APP_ISSUE", label: "Lỗi ứng dụng" },
    { key: "OTHER", label: "Khác" },
  ];

  useEffect(() => {
    let isMounted = true;

    const normalizeRideDetail = (raw) => {
      const status =
        raw?.status ?? raw?.matchStatus ?? raw?.rideStatus ?? raw?.state ?? "UNKNOWN";

      const pickupAddress =
        raw?.pickupAddress ?? raw?.pickup_address ?? raw?.startLocation ?? raw?.from ??
        "Điểm đón";
      const destinationAddress =
        raw?.destinationAddress ?? raw?.destination_address ?? raw?.endLocation ?? raw?.to ??
        "Điểm đến";

      const priceRaw = raw?.price ?? raw?.estimatedPrice ?? raw?.fare ?? 0;
      const price = typeof priceRaw === "number" ? priceRaw : Number(priceRaw) || 0;

      const distanceRaw = raw?.distance ?? raw?.distanceMeters ?? raw?.distance_meters ?? 0;
      const distance =
        typeof distanceRaw === "number" ? distanceRaw : Number(distanceRaw) || 0;

      const durationRaw =
        raw?.duration ?? raw?.durationMinutes ?? raw?.estimatedDuration ?? raw?.estimatedDurationMinutes ?? 0;
      const duration =
        typeof durationRaw === "number" ? durationRaw : Number(durationRaw) || 0;

      const createdAt =
        raw?.createdAt ?? raw?.created_at ?? raw?.createdDate ?? raw?.created_date ??
        new Date().toISOString();

      const driverRaw = raw?.driver ?? raw?.driverInfo ?? raw?.driverUser ?? null;
      const vehicleRaw = raw?.vehicle ?? driverRaw?.vehicle ?? raw?.driverVehicle ?? null;

      const driver = driverRaw
        ? {
            id: driverRaw?.id ?? driverRaw?.userId,
            name: driverRaw?.name ?? driverRaw?.fullName ?? raw?.driverName ?? "Tài xế",
            phone: driverRaw?.phone ?? raw?.driverPhone ?? "",
            avatar: driverRaw?.avatar ?? raw?.driverAvatar,
            rating: driverRaw?.rating ?? raw?.driverRating ?? 0,
            vehicle: vehicleRaw
              ? {
                  brand: vehicleRaw?.brand ?? vehicleRaw?.make ?? "",
                  model: vehicleRaw?.model ?? vehicleRaw?.vehicleModel ?? "",
                  color: vehicleRaw?.color ?? "",
                  licensePlate:
                    vehicleRaw?.licensePlate ?? vehicleRaw?.plate ?? raw?.licensePlate ?? "",
                }
              : null,
          }
        : null;

      return {
        id: raw?.id ?? rideId,
        status,
        pickupAddress,
        destinationAddress,
        price,
        distance,
        duration,
        createdAt,
        driver,
        messages: raw?.messages ?? [],
      };
    };

    const fetchDetail = async () => {
      try {
        setLoading(true);
        const resp = await getMatchDetail(rideId);
        const payload = resp?.data?.data ?? resp?.data ?? null;
        const normalized = normalizeRideDetail(payload);
        if (isMounted) setRide(normalized);
      } catch (err) {
        console.warn("Failed to load ride detail:", err?.message);
        if (isMounted) setRide(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetail();

    return () => {
      isMounted = false;
    };
  }, [rideId]);

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

  const handleCall = (phone) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  const handleMessage = () => {
    if (!ride?.id || !ride?.driver) return;
    navigation.navigate("ChatScreen", {
      rideId: ride.id,
      driver: {
        id: ride.driver.id || 1,
        name: ride.driver.name,
        avatar: ride.driver.avatar,
      },
      previousMessages: ride.messages || [],
    });
  };

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

    if (
      Platform.OS === "android" &&
      !uri.startsWith("file://") &&
      !uri.startsWith("http")
    ) {
      uri = `file://${uri}`;
    }

    return uri;
  };

  const uploadEvidenceImage = async (asset) => {
    try {
      setEvidenceUploading(true);

      const rawUri = asset?.uri;
      if (!rawUri) {
        Alert.alert("Lỗi", "Không tìm thấy ảnh để upload");
        return;
      }

      const uri = await ensureFileUri(rawUri);
      const fileName =
        asset?.fileName || asset?.name || `evidence_${Date.now()}.jpg`;
      const mimeType = normalizeMimeType(
        asset?.mimeType || asset?.type,
        fileName
      );

      const uploadResp = await uploadImage({ uri, name: fileName, type: mimeType });
      const url = uploadResp?.data?.url;
      if (!url) throw new Error("No image URL returned");

      setEvidenceUrl(url);
      Alert.alert("Thành công", "Đã tải ảnh minh chứng");
    } catch (err) {
      console.error("Upload evidence error:", err);
      Alert.alert("Lỗi", err?.message || "Không thể tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setEvidenceUploading(false);
    }
  };

  const handlePickEvidence = async (sourceType) => {
    setImagePickerVisible(false);

    setTimeout(async () => {
      try {
        let result;
        if (sourceType === "camera") {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) {
            Alert.alert(
              "Cần quyền truy cập",
              "Vui lòng cho phép ứng dụng truy cập Camera để chụp ảnh minh chứng."
            );
            return;
          }
          result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
          });
        } else {
          const permission =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!permission.granted) {
            Alert.alert(
              "Cần quyền truy cập",
              "Vui lòng cho phép ứng dụng truy cập Thư viện ảnh để chọn ảnh minh chứng."
            );
            return;
          }
          result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
          });
        }

        if (!result?.canceled && result?.assets?.length > 0) {
          await uploadEvidenceImage(result.assets[0]);
        }
      } catch (err) {
        console.error("Pick evidence error:", err);
        Alert.alert("Lỗi", "Không thể chọn ảnh");
      }
    }, 400);
  };

  const submitReport = async () => {
    if (!ride?.id) {
      Alert.alert("Lỗi", "Không tìm thấy matchId.");
      return;
    }
    if (!ride?.driver?.id) {
      Alert.alert("Lỗi", "Chưa có thông tin người bị báo cáo (tài xế).");
      return;
    }
    if (!reportTitle.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tiêu đề.");
      return;
    }
    if (!reportDescription.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập mô tả chi tiết.");
      return;
    }
    if (!reportCategory) {
      Alert.alert("Thiếu thông tin", "Vui lòng chọn loại vấn đề.");
      return;
    }

    try {
      setReportSubmitting(true);
      const payload = {
        matchId: ride.id,
        reportedUserId: ride.driver.id,
        title: reportTitle.trim(),
        description: reportDescription.trim(),
        category: reportCategory,
        evidenceUrl: evidenceUrl?.trim() || null,
      };

      const resp = await createReport(payload);
      const message =
        resp?.data?.message ||
        resp?.data?.meta?.message ||
        "Báo cáo đã được gửi.";

      Alert.alert("Thành công", message, [
        {
          text: "OK",
          onPress: () => {
            setReportModalVisible(false);
          },
        },
      ]);
    } catch (err) {
      console.error("Create report error:", err);
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Không thể gửi báo cáo. Vui lòng thử lại.";
      Alert.alert("Lỗi", apiMsg);
    } finally {
      setReportSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      </SafeAreaView>
    );
  }

  if (!ride) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết chuyến đi</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={{ color: "#8E8E93" }}>Không thể tải chi tiết chuyến đi</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = getStatusColor(ride.status);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết chuyến đi</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <LinearGradient
            colors={[statusColor, statusColor + "CC"]}
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
              size={48}
              color="#fff"
            />
            <Text style={styles.statusText}>{getStatusText(ride.status)}</Text>
            <Text style={styles.statusSubtext}>
              {new Date(ride.createdAt).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </LinearGradient>
        </View>

        {/* Driver Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin tài xế</Text>
          {ride.driver ? (
            <View style={styles.driverCard}>
              <Image
                source={{
                  uri:
                    ride.driver.avatar ||
                    "https://i.pravatar.cc/150?img=14",
                }}
                style={styles.driverAvatar}
              />
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{ride.driver.name}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={16} color="#FFB800" />
                  <Text style={styles.ratingText}>{ride.driver.rating}</Text>
                </View>
                {ride.driver.vehicle ? (
                  <>
                    <Text style={styles.vehicleText}>
                      {ride.driver.vehicle.brand} {ride.driver.vehicle.model} •{" "}
                      {ride.driver.vehicle.color}
                    </Text>
                    <Text style={styles.licensePlate}>
                      {ride.driver.vehicle.licensePlate}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.vehicleText}>
                    Chưa có thông tin xe
                  </Text>
                )}
              </View>
              <View style={styles.driverActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleCall(ride.driver.phone)}
                  disabled={!ride.driver.phone}
                >
                  <Ionicons name="call" size={20} color={COLORS.PRIMARY} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleMessage}
                >
                  <Ionicons
                    name="chatbubble"
                    size={20}
                    color={COLORS.PRIMARY}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.driverCard}>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>Chưa có tài xế</Text>
                <Text style={styles.vehicleText}>
                  Hệ thống đang tìm tài xế phù hợp cho chuyến đi này.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Route Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lộ trình</Text>
          <View style={styles.routeCard}>
            <View style={styles.routeRow}>
              <View style={styles.routeIconContainer}>
                <View style={[styles.routeDot, { backgroundColor: COLORS.PRIMARY }]} />
                <View style={styles.routeLine} />
              </View>
              <View style={styles.routeContent}>
                <Text style={styles.routeLabel}>Điểm đón</Text>
                <Text style={styles.routeAddress}>{ride.pickupAddress}</Text>
              </View>
            </View>

            <View style={styles.routeRow}>
              <View style={styles.routeIconContainer}>
                <View style={[styles.routeDot, { backgroundColor: COLORS.RED }]} />
              </View>
              <View style={styles.routeContent}>
                <Text style={styles.routeLabel}>Điểm đến</Text>
                <Text style={styles.routeAddress}>{ride.destinationAddress}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Trip Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin chuyến đi</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="cash-outline" size={24} color={COLORS.PRIMARY} />
                <Text style={styles.detailLabel}>Tổng tiền</Text>
                <Text style={styles.detailValue}>
                  {ride.price.toLocaleString()}đ
                </Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailItem}>
                <Ionicons name="navigate-outline" size={24} color={COLORS.PRIMARY} />
                <Text style={styles.detailLabel}>Quãng đường</Text>
                <Text style={styles.detailValue}>
                  {(ride.distance / 1000).toFixed(1)} km
                </Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={24} color={COLORS.PRIMARY} />
                <Text style={styles.detailLabel}>Thời gian</Text>
                <Text style={styles.detailValue}>{ride.duration} phút</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Messages */}
        {ride.messages && ride.messages.length > 0 && (
          <View style={styles.section}>
            <View style={styles.messagesHeader}>
              <Text style={styles.sectionTitle}>Tin nhắn</Text>
              <TouchableOpacity onPress={handleMessage}>
                <Text style={styles.viewAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.messagesCard}>
              <ScrollView 
                style={styles.messagesScroll}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                {ride.messages.map((message) => (
                  <View
                    key={message.id}
                    style={[
                      styles.messageRow,
                      message.sender === "passenger" && styles.messageRowRight,
                    ]}
                  >
                    <View
                      style={[
                        styles.messageBubble,
                        message.sender === "passenger" && styles.messageBubbleRight,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          message.sender === "passenger" && styles.messageTextRight,
                        ]}
                      >
                        {message.text}
                      </Text>
                      <Text
                        style={[
                          styles.messageTime,
                          message.sender === "passenger" && styles.messageTimeRight,
                        ]}
                      >
                        {message.time}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {ride.status === "COMPLETED" && (
            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Đặt lại chuyến này</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={openReportModal}
          >
            <Text style={styles.secondaryButtonText}>Báo cáo vấn đề</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Report modal */}
      <Modal
        visible={reportModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeReportModal}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeReportModal}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ width: "100%" }}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={styles.modalContainer}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Báo cáo vấn đề</Text>
                <TouchableOpacity onPress={closeReportModal} disabled={reportSubmitting || evidenceUploading}>
                  <Ionicons name="close" size={22} color="#1C1C1E" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.reportInfoCard}>
                  <Text style={styles.reportInfoTitle}>Chuyến #{ride?.id}</Text>
                  <Text style={styles.reportInfoSub}>
                    Người bị báo cáo: {ride?.driver?.name || "Tài xế"}
                  </Text>
                </View>

                <Text style={styles.inputLabel}>Loại vấn đề *</Text>
                <View style={styles.categoryGrid}>
                  {REPORT_CATEGORIES.map((c) => {
                    const active = reportCategory === c.key;
                    return (
                      <TouchableOpacity
                        key={c.key}
                        style={[
                          styles.categoryChip,
                          active && styles.categoryChipActive,
                        ]}
                        onPress={() => setReportCategory(c.key)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            active && styles.categoryChipTextActive,
                          ]}
                        >
                          {c.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.inputLabel}>Tiêu đề *</Text>
                <TextInput
                  style={styles.textInput}
                  value={reportTitle}
                  onChangeText={setReportTitle}
                  placeholder="Ví dụ: Tài xế lái xe quá nhanh"
                  placeholderTextColor="#8E8E93"
                  maxLength={120}
                />

                <Text style={styles.inputLabel}>Mô tả chi tiết *</Text>
                <TextInput
                  style={styles.textArea}
                  value={reportDescription}
                  onChangeText={setReportDescription}
                  placeholder="Mô tả cụ thể vấn đề bạn gặp phải..."
                  placeholderTextColor="#8E8E93"
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  maxLength={1000}
                />

                <Text style={styles.inputLabel}>Bằng chứng (URL ảnh)</Text>
                <View style={styles.evidenceRow}>
                  <TextInput
                    style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                    value={evidenceUrl}
                    onChangeText={setEvidenceUrl}
                    placeholder="https://res.cloudinary.com/..."
                    placeholderTextColor="#8E8E93"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.uploadBtn}
                    onPress={() => setImagePickerVisible(true)}
                    disabled={evidenceUploading || reportSubmitting}
                  >
                    {evidenceUploading ? (
                      <ActivityIndicator size="small" color={COLORS.WHITE} />
                    ) : (
                      <Ionicons name="cloud-upload-outline" size={18} color={COLORS.WHITE} />
                    )}
                  </TouchableOpacity>
                </View>

                {!!evidenceUrl?.trim() && (
                  <View style={styles.evidenceActions}>
                    <TouchableOpacity
                      style={styles.evidenceLinkBtn}
                      onPress={() => Linking.openURL(evidenceUrl.trim())}
                    >
                      <Ionicons name="open-outline" size={16} color={COLORS.PRIMARY} />
                      <Text style={styles.evidenceLinkText}>Mở link</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.evidenceClearBtn}
                      onPress={() => setEvidenceUrl("")}
                      disabled={evidenceUploading || reportSubmitting}
                    >
                      <Ionicons name="trash-outline" size={16} color={COLORS.RED} />
                      <Text style={styles.evidenceClearText}>Xóa</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalCancel]}
                    onPress={closeReportModal}
                    disabled={reportSubmitting || evidenceUploading}
                  >
                    <Text style={styles.modalCancelText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalSubmit]}
                    onPress={submitReport}
                    disabled={reportSubmitting || evidenceUploading}
                  >
                    {reportSubmitting ? (
                      <ActivityIndicator size="small" color={COLORS.WHITE} />
                    ) : (
                      <Text style={styles.modalSubmitText}>Gửi báo cáo</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>

              <ImagePickerModal
                visible={imagePickerVisible}
                onClose={() => setImagePickerVisible(false)}
                onCameraPress={() => handlePickEvidence("camera")}
                onLibraryPress={() => handlePickEvidence("library")}
                title="Chọn ảnh minh chứng"
              />
            </KeyboardAvoidingView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
  },

  // Status Card
  statusCard: {
    margin: 20,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  statusGradient: {
    padding: 32,
    alignItems: "center",
  },
  statusText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginTop: 12,
  },
  statusSubtext: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },

  // Section
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 12,
  },

  // Driver Card
  driverCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  driverAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F0F0F0",
  },
  driverInfo: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  vehicleText: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 4,
  },
  licensePlate: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.PRIMARY,
    marginTop: 2,
  },
  driverActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },

  // Route Card
  routeCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  routeRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  routeIconContainer: {
    alignItems: "center",
    marginRight: 16,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  routeLine: {
    width: 2,
    height: 40,
    backgroundColor: "#E0E0E0",
    marginVertical: 4,
  },
  routeContent: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    color: "#8E8E93",
    marginBottom: 4,
  },
  routeAddress: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1C1E",
    lineHeight: 20,
  },

  // Details Card
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  detailItem: {
    alignItems: "center",
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 8,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    marginTop: 4,
  },
  detailDivider: {
    width: 1,
    height: 60,
    backgroundColor: "#F0F0F0",
  },

  // Messages
  messagesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.PRIMARY,
  },
  messagesCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  messagesScroll: {
    maxHeight: 200,
  },
  messageRow: {
    marginBottom: 12,
    alignItems: "flex-start",
  },
  messageRowRight: {
    alignItems: "flex-end",
  },
  messageBubble: {
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 12,
    maxWidth: "80%",
  },
  messageBubbleRight: {
    backgroundColor: COLORS.PRIMARY,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    color: "#1C1C1E",
    lineHeight: 20,
  },
  messageTextRight: {
    color: "#fff",
  },
  messageTime: {
    fontSize: 11,
    color: "#8E8E93",
    marginTop: 4,
  },
  messageTimeRight: {
    color: "rgba(255,255,255,0.8)",
  },

  // Action Buttons
  actionSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
  },

  // Report modal
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
    paddingBottom: 12,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  reportInfoCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    marginBottom: 14,
  },
  reportInfoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  reportInfoSub: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 8,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1C1C1E",
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1C1C1E",
    minHeight: 120,
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryChip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    backgroundColor: "#fff",
  },
  categoryChipActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  categoryChipTextActive: {
    color: "#fff",
  },
  evidenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  uploadBtn: {
    height: 44,
    width: 44,
    borderRadius: 12,
    backgroundColor: COLORS.PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  evidenceActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  evidenceLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#F0F7FF",
  },
  evidenceLinkText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.PRIMARY,
  },
  evidenceClearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#FFF5F5",
  },
  evidenceClearText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.RED,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    marginBottom: 20,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancel: {
    backgroundColor: "#F5F5F5",
  },
  modalSubmit: {
    backgroundColor: COLORS.PRIMARY,
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  modalSubmitText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});

export default RideDetail;
