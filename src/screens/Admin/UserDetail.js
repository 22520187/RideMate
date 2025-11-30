import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constant/colors";

const UserDetail = ({ route, navigation }) => {
  const { user } = route.params || {};
  
  // Mock data - trong thực tế sẽ lấy từ API
  const [userData] = useState({
    ...user,
    email: "nguyenvana@example.com",
    address: "123 Đường ABC, Quận 1, TP.HCM",
    joinDate: "15/03/2024",
    totalPoints: 1250,
    currentPoints: 850,
    averageRating: user?.rating || 4.8,
    totalRatings: 42,
    driverLicenseStatus: user?.role === "driver" ? "approved" : "pending", // pending, approved, rejected
    driverLicenseNumber: "A123456789",
    driverLicenseExpiry: "15/12/2026",
    driverLicenseImage: null, // URL to license image
  });

  const [pointHistory] = useState([
    {
      id: "PH-001",
      type: "earn",
      amount: 50,
      description: "Hoàn thành chuyến đi RM-2024-109",
      date: "12/11/2024 • 08:30",
    },
    {
      id: "PH-002",
      type: "redeem",
      amount: -100,
      description: "Đổi voucher giảm 10%",
      date: "10/11/2024 • 14:20",
    },
    {
      id: "PH-003",
      type: "earn",
      amount: 50,
      description: "Hoàn thành chuyến đi RM-2024-108",
      date: "09/11/2024 • 18:15",
    },
  ]);

  // Thống kê chuyến đi - chỉ lưu số lượng
  const [tripStats] = useState({
    createdTrips: {
      total: 42,
      completed: 38,
      active: 2,
      cancelled: 2,
    },
    participatedTrips: {
      total: 18,
      completed: 16,
      active: 1,
      cancelled: 1,
    },
  });

  const [reportHistory] = useState([
    {
      id: "REP-480",
      type: "Thái độ tài xế",
      reporter: "Trần Thị Thu",
      status: "resolved",
      date: "12/11/2024 • 09:15",
    },
    {
      id: "REP-475",
      type: "Xe không đảm bảo",
      reporter: "Phạm Minh",
      status: "resolved",
      date: "10/11/2024 • 14:22",
    },
  ]);

  const [voucherHistory] = useState([
    {
      id: "VCH-001",
      name: "Giảm 10% chuyến đi",
      status: "used",
      usedDate: "10/11/2024 • 14:20",
      value: "10%",
    },
    {
      id: "VCH-002",
      name: "Giảm 50.000đ",
      status: "active",
      expiryDate: "30/11/2024",
      value: "50.000đ",
    },
  ]);

  const handleDriverLicenseAction = (action) => {
    // pending: approve, reject
    // approved/rejected: view details
    if (action === "approve") {
      // Update driver license status
      Alert.alert("Xác nhận", "Bạn có chắc chắn muốn duyệt bằng lái xe này?", [
        { text: "Hủy", style: "cancel" },
        {
          text: "Duyệt",
          onPress: () => {
            // Update status to approved
            console.log("Approved driver license");
          },
        },
      ]);
    } else if (action === "reject") {
      Alert.alert("Xác nhận", "Bạn có chắc chắn muốn từ chối bằng lái xe này?", [
        { text: "Hủy", style: "cancel" },
        {
          text: "Từ chối",
          onPress: () => {
            // Update status to rejected
            console.log("Rejected driver license");
          },
        },
      ]);
    }
  };

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

  const renderPointHistoryItem = ({ item }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyContent}>
        <Text style={styles.historyDescription}>{item.description}</Text>
        <Text style={styles.historyDate}>{item.date}</Text>
      </View>
      <Text
        style={[
          styles.historyAmount,
          item.type === "earn" ? styles.earnAmount : styles.redeemAmount,
        ]}
      >
        {item.type === "earn" ? "+" : ""}
        {item.amount} điểm
      </Text>
    </View>
  );


  const renderReportItem = ({ item }) => (
    <View style={styles.reportItem}>
      <View style={styles.reportInfo}>
        <Text style={styles.reportType}>{item.type}</Text>
        <Text style={styles.reportReporter}>Người báo cáo: {item.reporter}</Text>
        <Text style={styles.reportDate}>{item.date}</Text>
      </View>
      <View
        style={[
          styles.reportStatusBadge,
          item.status === "resolved"
            ? { backgroundColor: COLORS.GREEN_LIGHT }
            : { backgroundColor: COLORS.ORANGE_LIGHT },
        ]}
      >
        <Text
          style={[
            styles.reportStatusText,
            item.status === "resolved"
              ? { color: COLORS.GREEN }
              : { color: COLORS.ORANGE_DARK },
          ]}
        >
          {item.status === "resolved" ? "Đã giải quyết" : "Chờ xử lý"}
        </Text>
      </View>
    </View>
  );

  const renderVoucherItem = ({ item }) => (
    <View style={styles.voucherItem}>
      <View style={styles.voucherInfo}>
        <Text style={styles.voucherName}>{item.name}</Text>
        <Text style={styles.voucherValue}>Giá trị: {item.value}</Text>
        {item.usedDate && (
          <Text style={styles.voucherDate}>Đã dùng: {item.usedDate}</Text>
        )}
        {item.expiryDate && (
          <Text style={styles.voucherDate}>Hết hạn: {item.expiryDate}</Text>
        )}
      </View>
      <View
        style={[
          styles.voucherStatusBadge,
          item.status === "used"
            ? { backgroundColor: COLORS.GRAY_LIGHT }
            : { backgroundColor: COLORS.GREEN_LIGHT },
        ]}
      >
        <Text
          style={[
            styles.voucherStatusText,
            item.status === "used"
              ? { color: COLORS.GRAY }
              : { color: COLORS.GREEN },
          ]}
        >
          {item.status === "used" ? "Đã dùng" : "Còn hiệu lực"}
        </Text>
      </View>
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
          <Text style={styles.headerSubtitle}>{userData.name}</Text>
        </View>
      </View>

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
            {renderInfoRow("location-outline", "Địa chỉ", userData.address)}
            {renderInfoRow("calendar-outline", "Ngày tham gia", userData.joinDate)}
            {renderInfoRow("briefcase-outline", "Vai trò", userData.role === "driver" ? "Tài xế" : "Hành khách")}
            <View style={styles.statusRow}>
              <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.GRAY} />
              <Text style={styles.infoLabel}>Trạng thái:</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      userData.status === "active"
                        ? COLORS.GREEN_LIGHT
                        : userData.status === "suspended"
                        ? COLORS.ORANGE_LIGHT
                        : COLORS.RED_LIGHT,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        userData.status === "active"
                          ? COLORS.GREEN
                          : userData.status === "suspended"
                          ? COLORS.ORANGE_DARK
                          : COLORS.RED,
                    },
                  ]}
                >
                  {userData.status === "active"
                    ? "Hoạt động"
                    : userData.status === "suspended"
                    ? "Tạm khóa"
                    : "Bị cảnh báo"}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {/* Điểm + Lịch sử điểm */}
        {renderSection("star-outline", "Điểm thưởng", (
          <View style={styles.pointsCard}>
            <View style={styles.pointsSummary}>
              <View style={styles.pointsBox}>
                <Text style={styles.pointsValue}>{userData.currentPoints}</Text>
                <Text style={styles.pointsLabel}>Điểm hiện tại</Text>
              </View>
              <View style={styles.pointsBox}>
                <Text style={styles.pointsValue}>{userData.totalPoints}</Text>
                <Text style={styles.pointsLabel}>Tổng điểm tích lũy</Text>
              </View>
            </View>
            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>Lịch sử điểm</Text>
              <FlatList
                data={pointHistory}
                keyExtractor={(item) => item.id}
                renderItem={renderPointHistoryItem}
                scrollEnabled={false}
              />
            </View>
          </View>
        ))}

        {/* Rating trung bình */}
        {renderSection("star", "Đánh giá", (
          <View style={styles.ratingCard}>
            <View style={styles.ratingMain}>
              <Text style={styles.ratingValue}>{userData.averageRating.toFixed(1)}</Text>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= Math.round(userData.averageRating) ? "star" : "star-outline"}
                    size={24}
                    color={COLORS.YELLOW}
                  />
                ))}
              </View>
              <Text style={styles.ratingCount}>({userData.totalRatings} đánh giá)</Text>
            </View>
          </View>
        ))}

        {/* Thống kê chuyến đi đã tạo */}
        {userData.role === "driver" && renderSection("create-outline", "Chuyến đi đã tạo", (
          <View style={styles.tripStatsCard}>
            <View style={styles.tripStatsRow}>
              <View style={styles.tripStatBox}>
                <Text style={styles.tripStatValue}>{tripStats.createdTrips.total}</Text>
                <Text style={styles.tripStatLabel}>Tổng số</Text>
              </View>
              <View style={styles.tripStatBox}>
                <Text style={styles.tripStatValue}>{tripStats.createdTrips.completed}</Text>
                <Text style={styles.tripStatLabel}>Đã hoàn thành</Text>
              </View>
              <View style={styles.tripStatBox}>
                <Text style={styles.tripStatValue}>{tripStats.createdTrips.active}</Text>
                <Text style={styles.tripStatLabel}>Đang diễn ra</Text>
              </View>
              <View style={styles.tripStatBox}>
                <Text style={styles.tripStatValue}>{tripStats.createdTrips.cancelled}</Text>
                <Text style={styles.tripStatLabel}>Đã hủy</Text>
              </View>
            </View>
          </View>
        ))}

        {/* Thống kê chuyến đi đã tham gia */}
        {renderSection("people-outline", "Chuyến đi đã tham gia", (
          <View style={styles.tripStatsCard}>
            <View style={styles.tripStatsRow}>
              <View style={styles.tripStatBox}>
                <Text style={styles.tripStatValue}>{tripStats.participatedTrips.total}</Text>
                <Text style={styles.tripStatLabel}>Tổng số</Text>
              </View>
              <View style={styles.tripStatBox}>
                <Text style={styles.tripStatValue}>{tripStats.participatedTrips.completed}</Text>
                <Text style={styles.tripStatLabel}>Đã hoàn thành</Text>
              </View>
              <View style={styles.tripStatBox}>
                <Text style={styles.tripStatValue}>{tripStats.participatedTrips.active}</Text>
                <Text style={styles.tripStatLabel}>Đang diễn ra</Text>
              </View>
              <View style={styles.tripStatBox}>
                <Text style={styles.tripStatValue}>{tripStats.participatedTrips.cancelled}</Text>
                <Text style={styles.tripStatLabel}>Đã hủy</Text>
              </View>
            </View>
          </View>
        ))}

        {/* Lịch sử report */}
        {renderSection("alert-circle-outline", "Lịch sử báo cáo", (
          <View style={styles.reportsCard}>
            <FlatList
              data={reportHistory}
              keyExtractor={(item) => item.id}
              renderItem={renderReportItem}
              scrollEnabled={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Không có báo cáo nào</Text>
              }
            />
          </View>
        ))}

        {/* Lịch sử voucher */}
        {renderSection("gift-outline", "Lịch sử voucher", (
          <View style={styles.vouchersCard}>
            <FlatList
              data={voucherHistory}
              keyExtractor={(item) => item.id}
              renderItem={renderVoucherItem}
              scrollEnabled={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Không có voucher nào</Text>
              }
            />
          </View>
        ))}

        {/* Duyệt bằng lái xe */}
        {userData.role === "driver" || userData.driverLicenseStatus === "pending" ? (
          renderSection("card-outline", "Duyệt bằng lái xe", (
            <View style={styles.licenseCard}>
              {userData.driverLicenseStatus === "pending" ? (
                <>
                  <View style={styles.licenseInfo}>
                    <Text style={styles.licenseLabel}>Số bằng lái:</Text>
                    <Text style={styles.licenseValue}>{userData.driverLicenseNumber || "Chưa cập nhật"}</Text>
                  </View>
                  <View style={styles.licenseInfo}>
                    <Text style={styles.licenseLabel}>Ngày hết hạn:</Text>
                    <Text style={styles.licenseValue}>{userData.driverLicenseExpiry || "Chưa cập nhật"}</Text>
                  </View>
                  {userData.driverLicenseImage && (
                    <TouchableOpacity style={styles.licenseImageButton}>
                      <Ionicons name="image-outline" size={20} color={COLORS.BLUE} />
                      <Text style={styles.licenseImageText}>Xem ảnh bằng lái xe</Text>
                    </TouchableOpacity>
                  )}
                  <View style={styles.licenseActions}>
                    <TouchableOpacity
                      style={[styles.licenseButton, styles.approveButton]}
                      onPress={() => handleDriverLicenseAction("approve")}
                    >
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.WHITE} />
                      <Text style={styles.licenseButtonText}>Duyệt</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.licenseButton, styles.rejectButton]}
                      onPress={() => handleDriverLicenseAction("reject")}
                    >
                      <Ionicons name="close-circle" size={20} color={COLORS.WHITE} />
                      <Text style={styles.licenseButtonText}>Từ chối</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.licenseInfo}>
                    <Text style={styles.licenseLabel}>Số bằng lái:</Text>
                    <Text style={styles.licenseValue}>{userData.driverLicenseNumber}</Text>
                  </View>
                  <View style={styles.licenseInfo}>
                    <Text style={styles.licenseLabel}>Ngày hết hạn:</Text>
                    <Text style={styles.licenseValue}>{userData.driverLicenseExpiry}</Text>
                  </View>
                  <View
                    style={[
                      styles.licenseStatusBadge,
                      userData.driverLicenseStatus === "approved"
                        ? { backgroundColor: COLORS.GREEN_LIGHT }
                        : { backgroundColor: COLORS.RED_LIGHT },
                    ]}
                  >
                    <Text
                      style={[
                        styles.licenseStatusText,
                        userData.driverLicenseStatus === "approved"
                          ? { color: COLORS.GREEN }
                          : { color: COLORS.RED },
                      ]}
                    >
                      {userData.driverLicenseStatus === "approved" ? "Đã duyệt" : "Đã từ chối"}
                    </Text>
                  </View>
                </>
              )}
            </View>
          ))
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BG,
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
  pointsCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
  },
  pointsSummary: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  pointsBox: {
    flex: 1,
    backgroundColor: COLORS.BG,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.BLUE,
  },
  pointsLabel: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginTop: 4,
  },
  historySection: {
    marginTop: 8,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.BLACK,
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  historyContent: {
    flex: 1,
  },
  historyDescription: {
    fontSize: 14,
    color: COLORS.BLACK,
    fontWeight: "500",
  },
  historyDate: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginTop: 4,
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: "700",
  },
  earnAmount: {
    color: COLORS.GREEN,
  },
  redeemAmount: {
    color: COLORS.RED,
  },
  ratingCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 20,
  },
  ratingMain: {
    alignItems: "center",
  },
  ratingValue: {
    fontSize: 48,
    fontWeight: "700",
    color: COLORS.BLUE,
    marginBottom: 8,
  },
  ratingStars: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 8,
  },
  ratingCount: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  tripStatsCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
  },
  tripStatsRow: {
    flexDirection: "row",
    gap: 8,
  },
  tripStatBox: {
    flex: 1,
    backgroundColor: COLORS.BG,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  tripStatValue: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.BLUE,
  },
  tripStatLabel: {
    fontSize: 11,
    color: COLORS.GRAY,
    marginTop: 4,
    textAlign: "center",
  },
  reportsCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
  },
  reportItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  reportInfo: {
    flex: 1,
    marginRight: 12,
  },
  reportType: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.BLACK,
    marginBottom: 4,
  },
  reportReporter: {
    fontSize: 13,
    color: COLORS.GRAY,
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 12,
    color: COLORS.GRAY,
  },
  reportStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  reportStatusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  vouchersCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
  },
  voucherItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  voucherInfo: {
    flex: 1,
    marginRight: 12,
  },
  voucherName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.BLACK,
    marginBottom: 4,
  },
  voucherValue: {
    fontSize: 13,
    color: COLORS.GRAY,
    marginBottom: 4,
  },
  voucherDate: {
    fontSize: 12,
    color: COLORS.GRAY,
  },
  voucherStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  voucherStatusText: {
    fontSize: 11,
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

