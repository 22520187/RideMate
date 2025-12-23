import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constant/colors";
import * as adminService from "../../services/adminService";
import { unwrapApiData } from "../../utils/unwrapApiData";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const filterTabs = [
  { key: "all", label: "Tất cả", icon: "document-text-outline" },
  { key: "PENDING", label: "Chờ xử lý", icon: "time-outline" },
  { key: "PROCESSING", label: "Đang xử lý", icon: "sync-outline" },
  { key: "RESOLVED", label: "Đã giải quyết", icon: "checkmark-circle-outline" },
  { key: "REJECTED", label: "Từ chối", icon: "close-circle-outline" },
];

const statusConfig = {
  PENDING: {
    label: "Chờ xử lý",
    color: "#FF9800",
    bg: "#FFF3E0",
  },
  PROCESSING: {
    label: "Đang xử lý",
    color: "#2196F3",
    bg: "#E3F2FD",
  },
  RESOLVED: {
    label: "Đã giải quyết",
    color: "#4CAF50",
    bg: "#E8F5E9",
  },
  REJECTED: {
    label: "Đã từ chối",
    color: "#F44336",
    bg: "#FFEBEE",
  },
};

const categoryConfig = {
  SAFETY: { label: "An toàn", icon: "shield-checkmark", color: "#F44336" },
  BEHAVIOR: { label: "Hành vi", icon: "person", color: "#FF9800" },
  LOST_ITEM: { label: "Mất đồ", icon: "briefcase", color: "#9C27B0" },
  PAYMENT: { label: "Thanh toán", icon: "wallet", color: "#4CAF50" },
  APP_ISSUE: { label: "Lỗi ứng dụng", icon: "bug", color: "#2196F3" },
  OTHER: { label: "Khác", icon: "ellipsis-horizontal", color: "#757575" },
};

const actionTypes = [
  {
    key: "WARNING",
    label: "Cảnh báo",
    icon: "warning",
    color: "#FF9800",
    description: "Gửi cảnh báo tới người dùng vi phạm",
  },
  {
    key: "LOCK_7_DAYS",
    label: "Khóa 7 ngày",
    icon: "lock-closed",
    color: "#F44336",
    description: "Khóa tài khoản trong 7 ngày",
  },
  {
    key: "LOCK_30_DAYS",
    label: "Khóa 30 ngày",
    icon: "lock-closed",
    color: "#D32F2F",
    description: "Khóa tài khoản trong 30 ngày",
  },
  {
    key: "LOCK_PERMANENT",
    label: "Khóa vĩnh viễn",
    icon: "ban",
    color: "#B71C1C",
    description: "Khóa tài khoản vĩnh viễn",
  },
];

const ReportManagement = () => {
  const [selectedTab, setSelectedTab] = useState("all");
  const [reports, setReports] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedAction, setSelectedAction] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReports = useCallback(
    async (pageNum = 0, refresh = false) => {
      try {
        if (refresh) {
          setRefreshing(true);
        } else if (pageNum === 0) {
          setLoading(true);
        }

        const params = {
          page: pageNum,
          size: 20,
          sortBy: "createdAt",
          sortDirection: "DESC",
        };

        if (selectedTab !== "all") {
          params.status = selectedTab;
        }

        const response = await adminService.getReports(params);
        const pageData = unwrapApiData(response) || {};
        const content = Array.isArray(pageData?.content) ? pageData.content : [];

        if (refresh || pageNum === 0) {
          setReports(content);
        } else {
          setReports((prev) => [...prev, ...content]);
        }

        setHasMore(!pageData.last);
        setPage(pageNum);
      } catch (error) {
        console.error("Error fetching reports:", error);
        Alert.alert("Lỗi", "Không thể tải danh sách báo cáo");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedTab]
  );

  const fetchStatistics = useCallback(async () => {
    try {
      const res = await adminService.getReportStatistics();
      const stats = unwrapApiData(res);
      setStatistics(stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  }, []);

  useEffect(() => {
    fetchReports(0);
    fetchStatistics();
  }, [selectedTab]);

  const onRefresh = useCallback(() => {
    fetchReports(0, true);
    fetchStatistics();
  }, [fetchReports, fetchStatistics]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchReports(page + 1);
    }
  }, [loading, hasMore, page, fetchReports]);

  const handleProcess = (report) => {
    setSelectedReport(report);
    setSelectedAction("");
    setAdminNote("");
    setModalVisible(true);
  };

  const handleSubmitAction = async () => {
    if (!selectedAction) {
      Alert.alert("Thông báo", "Vui lòng chọn hành động xử lý");
      return;
    }
    if (!adminNote.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập ghi chú xử lý");
      return;
    }

    try {
      setSubmitting(true);

      await adminService.updateReportStatus(selectedReport.id, {
        status: "RESOLVED",
        resolutionAction: selectedAction,
        resolutionNotes: adminNote,
      });

      Alert.alert("Thành công", "Đã xử lý báo cáo thành công");
      setModalVisible(false);
      fetchReports(0, true);
      fetchStatistics();
    } catch (error) {
      console.error("Error updating report:", error);
      Alert.alert("Lỗi", "Không thể cập nhật báo cáo");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderStatCard = (icon, label, value, color) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.statIconContainer, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statInfo}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.headerTitle}>Quản lý báo cáo</Text>
          <Text style={styles.headerSubtitle}>
            {statistics?.totalReports || 0} báo cáo
          </Text>
        </View>
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        {renderStatCard(
          "document-text",
          "Tổng báo cáo",
          statistics?.totalReports || 0,
          COLORS.PRIMARY
        )}
        {renderStatCard(
          "time",
          "Chờ xử lý",
          statistics?.pendingReports || 0,
          "#FF9800"
        )}
        {renderStatCard(
          "sync",
          "Đang xử lý",
          statistics?.processingReports || 0,
          "#2196F3"
        )}
        {renderStatCard(
          "checkmark-circle",
          "Đã giải quyết",
          statistics?.resolvedReports || 0,
          "#4CAF50"
        )}
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollView}
        contentContainerStyle={styles.filterTabs}
      >
        {filterTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.filterTab,
              selectedTab === tab.key && styles.filterTabActive,
            ]}
            onPress={() => setSelectedTab(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={18}
              color={selectedTab === tab.key ? "#FFFFFF" : COLORS.GRAY}
            />
            <Text
              style={[
                styles.filterTabText,
                selectedTab === tab.key && styles.filterTabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderReportCard = ({ item }) => {
    const status = statusConfig[item.status] || statusConfig.PENDING;
    const category = categoryConfig[item.category] || categoryConfig.OTHER;

    return (
      <View style={styles.reportCard}>
        <View style={styles.reportHeader}>
          <View style={styles.reportHeaderLeft}>
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: category.color + "15" },
              ]}
            >
              <Ionicons
                name={category.icon}
                size={16}
                color={category.color}
              />
              <Text style={[styles.categoryText, { color: category.color }]}>
                {category.label}
              </Text>
            </View>
            <Text style={styles.reportId}>#{item.id}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        {item.title && <Text style={styles.reportTitle}>{item.title}</Text>}
        <Text style={styles.reportDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.reportMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="person" size={14} color={COLORS.GRAY} />
            <Text style={styles.metaText}>
              {item.reporterName || "N/A"}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time" size={14} color={COLORS.GRAY} />
            <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>

        {(item.status === "PENDING" || item.status === "PROCESSING") && (
          <TouchableOpacity
            style={styles.processButton}
            onPress={() => handleProcess(item)}
          >
            <Ionicons name="settings" size={18} color="#FFFFFF" />
            <Text style={styles.processButtonText}>Xử lý báo cáo</Text>
          </TouchableOpacity>
        )}

        {item.status === "RESOLVED" && item.resolutionNotes && (
          <View style={styles.resolutionBox}>
            <View style={styles.resolutionHeader}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.resolutionTitle}>Kết quả xử lý</Text>
            </View>
            <Text style={styles.resolutionText}>{item.resolutionNotes}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color={COLORS.GRAY} />
      <Text style={styles.emptyText}>Không có báo cáo nào</Text>
      <Text style={styles.emptySubtext}>
        {selectedTab === "all"
          ? "Chưa có báo cáo nào trong hệ thống"
          : "Không có báo cáo nào ở trạng thái này"}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading || page === 0) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.PRIMARY} />
      </View>
    );
  };

  const renderActionModal = () => (
    <Modal
      visible={modalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Xử lý báo cáo</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={COLORS.BLACK} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {selectedReport && (
              <View style={styles.reportSummary}>
                <Text style={styles.summaryLabel}>Báo cáo: #{selectedReport.id}</Text>
                <Text style={styles.summaryText} numberOfLines={2}>
                  {selectedReport.description}
                </Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>Chọn hành động</Text>
            {actionTypes.map((action) => (
              <TouchableOpacity
                key={action.key}
                style={[
                  styles.actionOption,
                  selectedAction === action.key && styles.actionOptionActive,
                ]}
                onPress={() => setSelectedAction(action.key)}
              >
                <View
                  style={[
                    styles.actionIconContainer,
                    { backgroundColor: action.color + "15" },
                  ]}
                >
                  <Ionicons name={action.icon} size={20} color={action.color} />
                </View>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                  <Text style={styles.actionDescription}>
                    {action.description}
                  </Text>
                </View>
                {selectedAction === action.key && (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.PRIMARY} />
                )}
              </TouchableOpacity>
            ))}

            <Text style={styles.sectionTitle}>Ghi chú xử lý</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Nhập ghi chú chi tiết về quyết định xử lý..."
              value={adminNote}
              onChangeText={setAdminNote}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmitAction}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Xác nhận</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (loading && page === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FlatList
        data={reports}
        renderItem={renderReportCard}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
      {renderActionModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.GRAY,
  },
  listContent: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 20,
    paddingBottom: 16,
    marginBottom: 12,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.BLACK,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - 52) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.BLACK,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.GRAY,
  },
  filterScrollView: {
    paddingHorizontal: 20,
  },
  filterTabs: {
    gap: 8,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.GRAY,
  },
  filterTabTextActive: {
    color: "#FFFFFF",
  },
  reportCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  reportHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
  },
  reportId: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.GRAY,
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
  reportTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.BLACK,
    marginBottom: 8,
  },
  reportDescription: {
    fontSize: 14,
    color: COLORS.GRAY,
    lineHeight: 20,
    marginBottom: 12,
  },
  reportMeta: {
    flexDirection: "row",
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.GRAY,
  },
  processButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 12,
    gap: 6,
  },
  processButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  resolutionBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#4CAF50",
  },
  resolutionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  resolutionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4CAF50",
  },
  resolutionText: {
    fontSize: 13,
    color: "#2E7D32",
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.BLACK,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.GRAY,
    textAlign: "center",
  },
  footerLoader: {
    paddingVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  reportSummary: {
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.GRAY,
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
    color: COLORS.BLACK,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.BLACK,
    marginBottom: 12,
    marginTop: 8,
  },
  actionOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  actionOptionActive: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: "#E3F2FD",
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  actionInfo: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.BLACK,
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 12,
    color: COLORS.GRAY,
  },
  noteInput: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: COLORS.BLACK,
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.GRAY,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.PRIMARY,
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default ReportManagement;
