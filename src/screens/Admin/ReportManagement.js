import React, { useMemo, useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constant/colors";

const filters = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ xử lý" },
  { key: "resolved", label: "Đã giải quyết" },
];

const statusStyles = {
  pending: {
    label: "Chờ xử lý",
    color: COLORS.ORANGE_DARK,
    background: COLORS.ORANGE_LIGHT,
  },
  resolved: {
    label: "Đã giải quyết",
    color: COLORS.GREEN,
    background: COLORS.GREEN_LIGHT,
  },
};

const initialReports = [
  {
    id: "REP-480",
    type: "Thái độ tài xế",
    reporter: "Trần Thị Thu",
    target: "Nguyễn Văn A",
    createdAt: "12/11/2024 • 09:15",
    status: "pending",
    details: "Tài xế có thái độ không hợp tác và to tiếng trong chuyến đi RM-2024-109.",
  },
  {
    id: "REP-482",
    type: "Giá tiền không hợp lý",
    reporter: "Nguyễn Hoàng",
    target: "Trần Thị B",
    createdAt: "11/11/2024 • 21:05",
    status: "pending",
    details: "Chuyến đi hiển thị phí phụ thu ngoài thỏa thuận ban đầu.",
  },
  {
    id: "REP-475",
    type: "Xe không đảm bảo",
    reporter: "Phạm Minh",
    target: "Đỗ Thị D",
    createdAt: "10/11/2024 • 14:22",
    status: "resolved",
    details: "Xe có mùi thuốc lá, người lái đã cam kết xử lý.",
  },
];

const actionTypes = [
  { key: "warning", label: "Cảnh báo", icon: "warning-outline", color: COLORS.ORANGE_DARK },
  { key: "suspend", label: "Khóa tài khoản", icon: "lock-closed-outline", color: COLORS.RED },
  { key: "notify", label: "Gửi thông báo", icon: "notifications-outline", color: COLORS.BLUE },
];

// Function để cập nhật user status (giả lập liên kết với UserManagement)
// Trong thực tế, đây sẽ là API call hoặc shared state/context
const updateUserStatus = (userName, status) => {
  // Giả lập: Trong thực tế sẽ cập nhật user trong UserManagement
  console.log(`Updating user ${userName} to status: ${status}`);
  // Có thể sử dụng context, event emitter, hoặc navigation params để truyền thông tin
};

const ReportManagement = () => {
  const [filter, setFilter] = useState("all");
  const [reports, setReports] = useState(initialReports);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedAction, setSelectedAction] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [reporterResponse, setReporterResponse] = useState("");

  const filteredReports = useMemo(() => {
    if (filter === "all") {
      return reports;
    }
    return reports.filter((report) => report.status === filter);
  }, [filter, reports]);

  const openActionModal = (report) => {
    setSelectedReport(report);
    setSelectedAction("");
    setAdminNote("");
    setReporterResponse("");
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedReport(null);
    setSelectedAction("");
    setAdminNote("");
    setReporterResponse("");
  };

  const handleSubmitAction = () => {
    if (!selectedAction) {
      Alert.alert("Thông báo", "Vui lòng chọn một hành động xử lý");
      return;
    }

    if (!adminNote.trim()) {
      Alert.alert("Thông báo", "Vui lòng thêm ghi chú xử lý");
      return;
    }

    // Thực hiện hành động dựa trên loại được chọn
    switch (selectedAction) {
      case "warning":
        updateUserStatus(selectedReport.target, "flagged");
        Alert.alert("Thành công", "Đã gửi cảnh báo cho người dùng");
        break;
      case "suspend":
        updateUserStatus(selectedReport.target, "suspended");
        Alert.alert("Thành công", "Đã khóa tài khoản người dùng");
        break;
      case "notify":
        Alert.alert("Thành công", "Đã gửi thông báo cho cả hai bên");
        break;
    }

    // Cập nhật trạng thái báo cáo
    setReports((prev) =>
      prev.map((report) =>
        report.id === selectedReport.id
          ? {
              ...report,
              status: "resolved",
              actionTaken: selectedAction,
              adminNote,
              reporterResponse,
              resolvedAt: new Date().toLocaleString("vi-VN"),
            }
          : report
      )
    );

    closeModal();
  };

  const renderActions = (report) => {
    if (report.status === "resolved") {
      return null;
    }
    
    return (
      <TouchableOpacity
        style={[styles.actionButton, styles.processButton]}
        onPress={() => openActionModal(report)}
      >
        <Ionicons name="settings-outline" size={18} color={COLORS.WHITE} />
        <Text style={styles.actionLabel}>Xử lý báo cáo</Text>
      </TouchableOpacity>
    );
  };

  const renderReportItem = ({ item }) => {
    const statusStyle = statusStyles[item.status];
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.reportId}>{item.id}</Text>
            <Text style={styles.type}>{item.type}</Text>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: statusStyle.background }]}
          >
            <Text style={[styles.statusLabel, { color: statusStyle.color }]}>
              {statusStyle.label}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="person-circle-outline" size={16} color={COLORS.GRAY} />
          <Text style={styles.metaText}>Người báo cáo: {item.reporter}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="car-outline" size={16} color={COLORS.GRAY} />
          <Text style={styles.metaText}>Người bị báo cáo: {item.target}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={16} color={COLORS.GRAY} />
          <Text style={styles.metaText}>{item.createdAt}</Text>
        </View>

        <Text style={styles.details}>{item.details}</Text>
        
        {item.resolvedAt && (
          <View style={styles.resolvedInfo}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.GREEN} />
            <Text style={styles.resolvedText}>Đã xử lý: {item.resolvedAt}</Text>
          </View>
        )}

        <View style={styles.actionContainer}>{renderActions(item)}</View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Xử lý báo cáo</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {filters.map((item) => {
          const isActive = filter === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setFilter(item.key)}
            >
              <Text style={[styles.filterLabel, isActive && styles.filterLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredReports}
        keyExtractor={(item) => item.id}
        renderItem={renderReportItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={COLORS.GRAY} />
            <Text style={styles.emptyTitle}>Không có báo cáo nào</Text>
            <Text style={styles.emptyDescription}>
              Tất cả báo cáo hiện đã được xử lý.
            </Text>
          </View>
        }
      />

      {/* Modal xử lý chi tiết */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Xử lý báo cáo</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={COLORS.BLACK} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              {selectedReport && (
                <>
                  <View style={styles.reportInfoCard}>
                    <Text style={styles.reportInfoId}>{selectedReport.id}</Text>
                    <Text style={styles.reportInfoType}>{selectedReport.type}</Text>
                    <View style={styles.reportInfoRow}>
                      <Text style={styles.reportInfoLabel}>Người báo cáo:</Text>
                      <Text style={styles.reportInfoValue}>{selectedReport.reporter}</Text>
                    </View>
                    <View style={styles.reportInfoRow}>
                      <Text style={styles.reportInfoLabel}>Người bị báo cáo:</Text>
                      <Text style={styles.reportInfoValue}>{selectedReport.target}</Text>
                    </View>
                  </View>

                  <Text style={styles.sectionTitle}>Chọn hành động xử lý:</Text>
                  <View style={styles.actionTypeList}>
                    {actionTypes.map((action) => {
                      const isSelected = selectedAction === action.key;
                      return (
                        <TouchableOpacity
                          key={action.key}
                          style={[
                            styles.actionTypeCard,
                            isSelected && styles.actionTypeCardSelected,
                            isSelected && { borderColor: action.color },
                          ]}
                          onPress={() => setSelectedAction(action.key)}
                        >
                          <Ionicons
                            name={action.icon}
                            size={22}
                            color={isSelected ? action.color : COLORS.GRAY}
                          />
                          <Text
                            style={[
                              styles.actionTypeLabel,
                              isSelected && { color: action.color, fontWeight: "700" },
                            ]}
                          >
                            {action.label}
                          </Text>
                          {isSelected && (
                            <Ionicons
                              name="checkmark-circle"
                              size={20}
                              color={action.color}
                              style={styles.checkIcon}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={styles.sectionTitle}>Ghi chú xử lý (bắt buộc):</Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Nhập ghi chú về cách xử lý báo cáo này..."
                    placeholderTextColor={COLORS.GRAY}
                    multiline
                    numberOfLines={4}
                    value={adminNote}
                    onChangeText={setAdminNote}
                    textAlignVertical="top"
                  />

                  <Text style={styles.sectionTitle}>Phản hồi cho người báo cáo (tùy chọn):</Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Nhập phản hồi sẽ được gửi cho người báo cáo..."
                    placeholderTextColor={COLORS.GRAY}
                    multiline
                    numberOfLines={4}
                    value={reporterResponse}
                    onChangeText={setReporterResponse}
                    textAlignVertical="top"
                  />

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={closeModal}
                    >
                      <Text style={styles.cancelButtonText}>Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.submitButton]}
                      onPress={handleSubmitAction}
                    >
                      <Text style={styles.submitButtonText}>Xác nhận xử lý</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    width: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.WHITE,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: COLORS.WHITE,
    opacity: 0.9,
    lineHeight: 20,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  filterChip: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
  },
  filterChipActive: {
    borderColor: COLORS.BLUE,
    backgroundColor: COLORS.BLUE_LIGHT,
  },
  filterLabel: {
    fontSize: 13,
    color: COLORS.GRAY,
  },
  filterLabelActive: {
    color: COLORS.BLUE,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  reportId: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginBottom: 4,
  },
  type: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.GRAY,
    flex: 1,
  },
  details: {
    marginTop: 14,
    fontSize: 14,
    color: COLORS.BLACK,
    lineHeight: 20,
  },
  actionContainer: {
    marginTop: 16,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 6,
  },
  processButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  resolvedInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    padding: 10,
    backgroundColor: COLORS.GREEN_LIGHT,
    borderRadius: 8,
  },
  resolvedText: {
    fontSize: 12,
    color: COLORS.GREEN,
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  modalBody: {
    padding: 20,
  },
  reportInfoCard: {
    backgroundColor: COLORS.BLUE_LIGHT,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  reportInfoId: {
    fontSize: 14,
    color: COLORS.BLUE,
    fontWeight: "600",
    marginBottom: 4,
  },
  reportInfoType: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.BLACK,
    marginBottom: 12,
  },
  reportInfoRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  reportInfoLabel: {
    fontSize: 14,
    color: COLORS.GRAY_DARK,
    fontWeight: "600",
    marginRight: 8,
  },
  reportInfoValue: {
    fontSize: 14,
    color: COLORS.BLACK,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.BLACK,
    marginBottom: 12,
    marginTop: 8,
  },
  actionTypeList: {
    marginBottom: 20,
  },
  actionTypeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    borderWidth: 2,
    borderColor: COLORS.GRAY_LIGHT,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  actionTypeCardSelected: {
    backgroundColor: COLORS.BLUE_LIGHT,
  },
  actionTypeLabel: {
    fontSize: 14,
    color: COLORS.BLACK,
    marginLeft: 12,
    flex: 1,
  },
  checkIcon: {
    marginLeft: 8,
  },
  textArea: {
    backgroundColor: COLORS.GRAY_BG,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: COLORS.BLACK,
    minHeight: 100,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: COLORS.GRAY_BG,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  submitButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.WHITE,
  },
  actionLabel: {
    fontSize: 13,
    color: COLORS.WHITE,
    fontWeight: "600",
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.BLACK,
  },
  emptyDescription: {
    fontSize: 13,
    color: COLORS.GRAY,
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 18,
  },
});

export default ReportManagement;

