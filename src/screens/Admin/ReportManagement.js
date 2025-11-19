import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constant/colors";

const filters = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ xử lý" },
  { key: "in_progress", label: "Đang xử lý" },
  { key: "resolved", label: "Đã giải quyết" },
];

const statusStyles = {
  pending: {
    label: "Chờ xử lý",
    color: COLORS.ORANGE_DARK,
    background: COLORS.ORANGE_LIGHT,
  },
  in_progress: {
    label: "Đang xử lý",
    color: COLORS.BLUE,
    background: COLORS.BLUE_LIGHT,
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
    priority: "Cao",
    status: "pending",
    details: "Tài xế có thái độ không hợp tác và to tiếng trong chuyến đi RM-2024-109.",
  },
  {
    id: "REP-482",
    type: "Giá tiền không hợp lý",
    reporter: "Nguyễn Hoàng",
    target: "Trần Thị B",
    createdAt: "11/11/2024 • 21:05",
    priority: "Trung bình",
    status: "in_progress",
    details: "Chuyến đi hiển thị phí phụ thu ngoài thỏa thuận ban đầu.",
  },
  {
    id: "REP-475",
    type: "Xe không đảm bảo",
    reporter: "Phạm Minh",
    target: "Đỗ Thị D",
    createdAt: "10/11/2024 • 14:22",
    priority: "Thấp",
    status: "resolved",
    details: "Xe có mùi thuốc lá, người lái đã cam kết xử lý.",
  },
];

const ReportManagement = () => {
  const [filter, setFilter] = useState("all");
  const [reports, setReports] = useState(initialReports);

  const filteredReports = useMemo(() => {
    if (filter === "all") {
      return reports;
    }
    return reports.filter((report) => report.status === filter);
  }, [filter, reports]);

  const handleStatusChange = (reportId, status) => {
    setReports((prev) =>
      prev.map((report) =>
        report.id === reportId
          ? {
              ...report,
              status,
            }
          : report
      )
    );
  };

  const renderActions = (report) => {
    switch (report.status) {
      case "pending":
        return (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.inProgressButton]}
              onPress={() => handleStatusChange(report.id, "in_progress")}
            >
              <Ionicons name="time-outline" size={18} color={COLORS.WHITE} />
              <Text style={styles.actionLabel}>Đánh dấu đang xử lý</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.resolveButton]}
              onPress={() => handleStatusChange(report.id, "resolved")}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.WHITE} />
              <Text style={styles.actionLabel}>Hoàn tất</Text>
            </TouchableOpacity>
          </View>
        );
      case "in_progress":
        return (
          <TouchableOpacity
            style={[styles.actionButton, styles.resolveButton]}
            onPress={() => handleStatusChange(report.id, "resolved")}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.WHITE} />
            <Text style={styles.actionLabel}>Đánh dấu hoàn tất</Text>
          </TouchableOpacity>
        );
      case "resolved":
      default:
        return null;
    }
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
        <View style={styles.metaRow}>
          <Ionicons name="alert-circle-outline" size={16} color={COLORS.ORANGE_DARK} />
          <Text style={styles.metaText}>Mức độ ưu tiên: {item.priority}</Text>
        </View>

        <Text style={styles.details}>{item.details}</Text>

        <View style={styles.actionContainer}>{renderActions(item)}</View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Xử lý báo cáo</Text>
        <Text style={styles.subtitle}>
          Theo dõi khiếu nại và đảm bảo trải nghiệm an toàn cho người dùng
        </Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: COLORS.GRAY,
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
  inProgressButton: {
    flex: 1,
    backgroundColor: COLORS.SECONDARY,
  },
  resolveButton: {
    flex: 1,
    backgroundColor: COLORS.GREEN,
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

