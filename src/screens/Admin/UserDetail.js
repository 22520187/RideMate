import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constant/colors";
import * as adminService from "../../services/adminService";
import { unwrapApiData } from "../../utils/unwrapApiData";
import { getVehiclesByDriver } from "../../services/vehicleService";

const UserDetail = ({ route, navigation }) => {
  const { userId, user: initialUser } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userData, setUserData] = useState(null);
  const [driverVehicles, setDriverVehicles] = useState([]);

  const formatUserType = useCallback((type) => {
    if (type === "DRIVER") return "Tài xế";
    if (type === "PASSENGER") return "Hành khách";
    if (type === "ADMIN") return "Admin";
    return type || "-";
  }, []);

  const normalizeApprovalStatus = useCallback((s) => {
    return (s ?? "").toString().trim().toUpperCase();
  }, []);

  const formatApprovalStatus = useCallback(
    (s) => {
      const v = normalizeApprovalStatus(s);
      if (v === "PENDING") return "Chờ duyệt";
      if (v === "APPROVED") return "Đã duyệt";
      if (v === "REJECTED" || v === "REJECT") return "Từ chối";
      if (v === "NONE") return "Không áp dụng";
      return v || "-";
    },
    [normalizeApprovalStatus]
  );

  const getApprovalTextColor = useCallback(
    (s) => {
      const v = normalizeApprovalStatus(s);
      if (v === "APPROVED") return COLORS.GREEN;
      if (v === "PENDING") return COLORS.ORANGE_DARK;
      if (v === "REJECTED" || v === "REJECT") return COLORS.RED;
      return COLORS.BLACK;
    },
    [normalizeApprovalStatus]
  );

  const formatPercent = useCallback((value) => {
    if (value == null || Number.isNaN(Number(value))) return "-";
    return `${Math.round(Number(value))}%`;
  }, []);

  const formatDate = useCallback((iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("vi-VN");
  }, []);

  const normalizeUser = useCallback((u) => {
    if (!u) return null;
    const fullName = u.fullName ?? u.name ?? "-";
    const phoneNumber = u.phoneNumber ?? u.phone ?? "-";
    const rating =
      typeof u.rating === "number"
        ? u.rating
        : typeof u.averageRating === "number"
        ? u.averageRating
        : 0;

    const userType = u.userType;
    const isDriver = userType === "DRIVER" || u.role === "driver";
    const isActive =
      typeof u.isActive === "boolean" ? u.isActive : u.status === "active";
    const joinDate = u.createdAt ? formatDate(u.createdAt) : u.joinDate ?? "-";

    return {
      // raw-ish fields (from backend)
      ...u,
      id: u.id ?? u.userId ?? u._id,
      fullName,
      phoneNumber,
      userType,
      isActive,
      rating,

      // fields used by the existing UI (legacy names)
      name: fullName,
      phone: phoneNumber,
      role: isDriver ? "driver" : "passenger",
      status:
        typeof u.isActive === "boolean"
          ? u.isActive
            ? "active"
            : "inactive"
          : u.status ?? "active",
      averageRating: rating,
      totalRatings: typeof u.totalRatings === "number" ? u.totalRatings : 0,

      // map backend driver fields into existing UI naming (so we can reuse styling)
      driverLicenseNumber: u.licenseNumber ?? u.driverLicenseNumber,
      driverLicenseStatus: u.driverApprovalStatus ?? u.driverLicenseStatus,
      vehicleInfo: u.vehicleInfo ?? "-",
      joinDate,
    };
  }, [formatDate]);

  // Hydrate quickly from the list item while the real API call runs
  useEffect(() => {
    if (initialUser) setUserData(normalizeUser(initialUser));
  }, [initialUser, normalizeUser]);

  const fetchUserDetail = useCallback(async () => {
    if (userId == null) {
      setLoading(false);
      Alert.alert("Lỗi", "Thiếu userId để xem chi tiết người dùng.");
      return;
    }
    try {
      setLoading(true);
      const res = await adminService.getUserById(userId);
      const payload = unwrapApiData(res);
      setUserData(normalizeUser(payload));
    } catch (err) {
      console.error("Error fetching user detail:", err);
      Alert.alert("Lỗi", "Không thể tải chi tiết người dùng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [userId, normalizeUser]);

  useEffect(() => {
    fetchUserDetail();
  }, [fetchUserDetail]);

  const headerSubtitle = useMemo(() => userData?.name ?? "", [userData]);

  const hasVehicleInfo =
    typeof userData?.vehicleInfo === "string" &&
    userData.vehicleInfo.trim().length > 0 &&
    userData.vehicleInfo.trim() !== "-";

  const fetchDriverVehicles = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await getVehiclesByDriver(userId);
      const payload = unwrapApiData(res);
      setDriverVehicles(Array.isArray(payload) ? payload : []);
    } catch (e) {
      console.error("Error fetching driver vehicles:", e);
      setDriverVehicles([]);
    }
  }, [userId]);

  useEffect(() => {
    if (userData?.userType === "DRIVER" && !hasVehicleInfo) {
      fetchDriverVehicles();
    }
  }, [userData?.userType, hasVehicleInfo, fetchDriverVehicles]);

  const bestVehicle = useMemo(() => {
    if (!Array.isArray(driverVehicles) || driverVehicles.length === 0) return null;
    const scoreStatus = (s) => {
      if (s === "APPROVED") return 3;
      if (s === "PENDING") return 2;
      if (s === "REJECTED") return 1;
      return 0;
    };
    return [...driverVehicles].sort((a, b) => {
      const sa = scoreStatus(a?.status);
      const sb = scoreStatus(b?.status);
      if (sb !== sa) return sb - sa;
      const ta = a?.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const tb = b?.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return tb - ta;
    })[0];
  }, [driverVehicles]);

  const derivedVehicleInfo = useMemo(() => {
    if (!bestVehicle) return "";
    const make = bestVehicle.make || "";
    const model = bestVehicle.model || "";
    const plate = bestVehicle.licensePlate || "";
    const pieces = [`${make} ${model}`.trim(), plate].filter(Boolean);
    return pieces.join(" - ");
  }, [bestVehicle]);

  // Prefer backend driverApprovalStatus; if missing, fall back to vehicle status
  const effectiveApprovalStatus = useMemo(() => {
    const raw = userData?.driverApprovalStatus ?? "";
    const v = normalizeApprovalStatus(raw);
    if (v) return v;
    return normalizeApprovalStatus(bestVehicle?.status);
  }, [userData?.driverApprovalStatus, bestVehicle?.status, normalizeApprovalStatus]);

  const approveDriver = useCallback(() => {
    if (!userId) return;
    Alert.alert("Xác nhận", "Bạn có chắc chắn muốn duyệt tài xế này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Duyệt",
        style: "default",
        onPress: async () => {
          try {
            setSubmitting(true);
            await adminService.approveDriver(userId);
            Alert.alert("Thành công", "Đã duyệt tài xế.");
            fetchUserDetail();
          } catch (e) {
            console.error("Approve driver error:", e);
            Alert.alert("Lỗi", "Không thể duyệt tài xế. Vui lòng thử lại.");
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  }, [userId, fetchUserDetail]);

  const rejectDriver = useCallback(() => {
    if (!userId) return;

    const doReject = async (rejectionReason) => {
      try {
        setSubmitting(true);
        await adminService.rejectDriver(userId, { rejectionReason });
        Alert.alert("Thành công", "Đã từ chối duyệt tài xế.");
        fetchUserDetail();
      } catch (e) {
        console.error("Reject driver error:", e);
        Alert.alert("Lỗi", "Không thể từ chối duyệt. Vui lòng thử lại.");
      } finally {
        setSubmitting(false);
      }
    };

    Alert.alert("Chọn lý do từ chối", "Vui lòng chọn một lý do:", [
      { text: "Hủy", style: "cancel" },
      { text: "Thiếu giấy tờ", onPress: () => doReject("Thiếu giấy tờ") },
      { text: "Thông tin không hợp lệ", onPress: () => doReject("Thông tin không hợp lệ") },
    ]);
  }, [userId, fetchUserDetail]);

  const toggleUserStatus = useCallback(() => {
    if (!userId || !userData) return;

    const nextIsActive = !userData.isActive;
    const actionLabel = nextIsActive ? "Mở khóa" : "Khóa";

    Alert.alert(
      `${actionLabel} tài khoản`,
      `Bạn có chắc chắn muốn ${actionLabel.toLowerCase()} tài khoản này?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: actionLabel,
          style: nextIsActive ? "default" : "destructive",
          onPress: async () => {
            try {
              setSubmitting(true);
              await adminService.toggleUserStatus(userId, { isActive: nextIsActive });
              Alert.alert("Thành công", `${actionLabel} tài khoản thành công.`);
              fetchUserDetail();
            } catch (e) {
              console.error("Toggle user status error:", e);
              Alert.alert("Lỗi", `Không thể ${actionLabel.toLowerCase()} tài khoản. Vui lòng thử lại.`);
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  }, [userId, userData, fetchUserDetail]);

  const renderSection = (icon, title, children) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={20} color={COLORS.BLUE} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );

  const renderInfoRow = (icon, label, value) => (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={COLORS.GRAY} />
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Chi tiết người dùng</Text>
          <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
        </View>
      </View>

      {loading && !userData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Đang tải chi tiết...</Text>
        </View>
      ) : !userData ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Không có dữ liệu người dùng.</Text>
        </View>
      ) : (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Thông tin cá nhân */}
        {renderSection("person-outline", "Thông tin cá nhân", (
          <View style={styles.infoCard}>
            {renderInfoRow("person-outline", "Họ tên", userData.name)}
            {renderInfoRow("call-outline", "Số điện thoại", userData.phone)}
            {renderInfoRow("mail-outline", "Email", userData.email)}
            {renderInfoRow("calendar-outline", "Ngày tham gia", userData.joinDate)}
            {renderInfoRow("briefcase-outline", "Vai trò", formatUserType(userData.userType))}
            {renderInfoRow("wallet-outline", "Xu", userData.coins ?? 0)}
            <View style={styles.statusRow}>
              <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.GRAY} />
              <Text style={styles.infoLabel}>Trạng thái:</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      userData.isActive
                        ? COLORS.GREEN_LIGHT
                        : COLORS.RED_LIGHT,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        userData.isActive ? COLORS.GREEN : COLORS.RED,
                    },
                  ]}
                >
                  {userData.isActive ? "Hoạt động" : "Bị khóa"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.toggleStatusButton,
                userData.isActive ? styles.lockButton : styles.unlockButton,
                submitting && styles.toggleStatusButtonDisabled,
              ]}
              onPress={toggleUserStatus}
              disabled={submitting}
              activeOpacity={0.8}
            >
              <Ionicons
                name={userData.isActive ? "lock-closed-outline" : "lock-open-outline"}
                size={18}
                color={COLORS.WHITE}
              />
              <Text style={styles.toggleStatusButtonText}>
                {userData.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Thống kê */}
        {renderSection("analytics-outline", "Thống kê", (
          <View style={styles.infoCard}>
            {renderInfoRow("star-outline", "Rating", (userData.rating ?? 0).toFixed(1))}
            {renderInfoRow("car-outline", "Chuyến hoàn thành", userData.totalRidesCompleted ?? 0)}
            {renderInfoRow("thumbs-up-outline", "Tỉ lệ nhận chuyến", formatPercent(userData.acceptanceRate))}
            {renderInfoRow("checkmark-done-outline", "Tỉ lệ hoàn thành", formatPercent(userData.completionRate))}
          </View>
        ))}

        {/* Duyệt bằng lái xe */}
        {userData.userType === "DRIVER" ? (
          renderSection("card-outline", "Xác minh tài xế", (
            <View style={styles.licenseCard}>
              <View style={styles.licenseInfo}>
                <Text style={styles.licenseLabel}>Trạng thái duyệt:</Text>
                <Text
                  style={[
                    styles.licenseValue,
                    { color: getApprovalTextColor(effectiveApprovalStatus) },
                  ]}
                >
                  {formatApprovalStatus(effectiveApprovalStatus)}
                </Text>
              </View>
              <View style={styles.licenseInfo}>
                <Text style={styles.licenseLabel}>Số bằng lái:</Text>
                <Text style={styles.licenseValue}>
                  {userData.licenseNumber || userData.driverLicenseNumber || "Chưa cập nhật"}
                </Text>
              </View>
              <View style={styles.licenseInfo}>
                <Text style={styles.licenseLabel}>Thông tin xe:</Text>
                <Text style={styles.licenseValue}>
                  {hasVehicleInfo
                    ? userData.vehicleInfo
                    : derivedVehicleInfo || "Chưa cập nhật"}
                </Text>
              </View>

              {effectiveApprovalStatus === "PENDING" ? (
                <>
                  <View style={styles.licenseActions}>
                    <TouchableOpacity
                      style={[styles.licenseButton, styles.approveButton]}
                      onPress={approveDriver}
                      disabled={submitting}
                    >
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.WHITE} />
                      <Text style={styles.licenseButtonText}>Duyệt</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.licenseButton, styles.rejectButton]}
                      onPress={rejectDriver}
                      disabled={submitting}
                    >
                      <Ionicons name="close-circle" size={20} color={COLORS.WHITE} />
                      <Text style={styles.licenseButtonText}>Từ chối</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : null}
            </View>
          ))
        ) : null}
      </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: COLORS.BG,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.GRAY,
  },
  header: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.WHITE,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.WHITE,
    opacity: 0.9,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  infoCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.GRAY,
    minWidth: 100,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.BLACK,
    fontWeight: "500",
    flex: 1,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  licenseCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
  },
  licenseInfo: {
    marginBottom: 12,
  },
  licenseLabel: {
    fontSize: 13,
    color: COLORS.GRAY,
    marginBottom: 4,
  },
  licenseValue: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.BLACK,
  },
  licenseImageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: COLORS.BG,
    borderRadius: 12,
    marginBottom: 16,
  },
  licenseImageText: {
    fontSize: 14,
    color: COLORS.BLUE,
    fontWeight: "500",
  },
  licenseActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  licenseButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  approveButton: {
    backgroundColor: COLORS.GREEN,
  },
  rejectButton: {
    backgroundColor: COLORS.RED,
  },
  licenseButtonText: {
    fontSize: 14,
    color: COLORS.WHITE,
    fontWeight: "600",
  },
  toggleStatusButton: {
    marginTop: 14,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  toggleStatusButtonDisabled: {
    opacity: 0.6,
  },
  lockButton: {
    backgroundColor: COLORS.RED,
  },
  unlockButton: {
    backgroundColor: COLORS.GREEN,
  },
  toggleStatusButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.WHITE,
  },
  licenseStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  licenseStatusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.GRAY,
    textAlign: "center",
    paddingVertical: 20,
  },
});

export default UserDetail;

