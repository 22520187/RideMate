import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constant/colors";

const tripStatuses = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ duyệt" },
  { key: "active", label: "Đang diễn ra" },
  { key: "completed", label: "Đã hoàn thành" },
  { key: "cancelled", label: "Đã hủy" },
];

const statusStyles = {
  pending: {
    color: COLORS.ORANGE_DARK,
    backgroundColor: COLORS.ORANGE_LIGHT,
    label: "Chờ duyệt",
  },
  active: {
    color: COLORS.BLUE,
    backgroundColor: COLORS.BLUE_LIGHT,
    label: "Đang diễn ra",
  },
  completed: {
    color: COLORS.GREEN,
    backgroundColor: COLORS.GREEN_LIGHT,
    label: "Đã hoàn thành",
  },
  cancelled: {
    color: COLORS.RED,
    backgroundColor: COLORS.RED_LIGHT,
    label: "Đã hủy",
  },
};

const initialTrips = [
  {
    id: "RM-2024-109",
    route: "Quận 1 → Thành phố Thủ Đức",
    driver: "Nguyễn Văn A",
    seats: 3,
    status: "pending",
    departureTime: "12/11/2024 • 08:00",
    price: "85.000đ",
  },
  {
    id: "RM-2024-110",
    route: "Quận 7 → Bình Thạnh",
    driver: "Trần Thị B",
    seats: 2,
    status: "active",
    departureTime: "Hôm nay • 10:30",
    price: "65.000đ",
  },
  {
    id: "RM-2024-111",
    route: "Tân Bình → Gò Vấp",
    driver: "Phạm Văn C",
    seats: 1,
    status: "completed",
    departureTime: "Hôm qua • 17:45",
    price: "55.000đ",
  },
  {
    id: "RM-2024-107",
    route: "Quận 4 → Quận 12",
    driver: "Đỗ Thị D",
    seats: 4,
    status: "cancelled",
    departureTime: "10/11/2024 • 19:15",
    price: "92.000đ",
  },
];

const TripManagement = () => {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [trips, setTrips] = useState(initialTrips);

  const filteredTrips = useMemo(() => {
    if (selectedFilter === "all") {
      return trips;
    }
    return trips.filter((trip) => trip.status === selectedFilter);
  }, [selectedFilter, trips]);

  const handleUpdateStatus = (tripId, nextStatus) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId
          ? {
              ...trip,
              status: nextStatus,
            }
          : trip
      )
    );
  };

  const renderActionButtons = (trip) => {
    switch (trip.status) {
      case "pending":
        return (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleUpdateStatus(trip.id, "active")}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.WHITE} />
              <Text style={styles.actionLabel}>Duyệt chuyến</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleUpdateStatus(trip.id, "cancelled")}
            >
              <Ionicons name="close-circle-outline" size={18} color={COLORS.WHITE} />
              <Text style={styles.actionLabel}>Từ chối</Text>
            </TouchableOpacity>
          </View>
        );
      case "active":
        return (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => handleUpdateStatus(trip.id, "completed")}
          >
            <Ionicons name="flag-outline" size={18} color={COLORS.WHITE} />
            <Text style={styles.actionLabel}>Đánh dấu hoàn thành</Text>
          </TouchableOpacity>
        );
      case "completed":
      case "cancelled":
      default:
        return null;
    }
  };

  const renderTripItem = ({ item }) => {
    const status = statusStyles[item.status];
    return (
      <View style={styles.tripCard}>
        <View style={styles.tripHeader}>
          <View>
            <Text style={styles.tripId}>{item.id}</Text>
            <Text style={styles.route}>{item.route}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.backgroundColor }]}> 
            <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <View style={styles.tripDetailsRow}>
          <View style={styles.tripDetail}>
            <Ionicons name="person-outline" size={16} color={COLORS.GRAY} />
            <Text style={styles.tripDetailText}>Tài xế: {item.driver}</Text>
          </View>
          <View style={styles.tripDetail}>
            <Ionicons name="people-outline" size={16} color={COLORS.GRAY} />
            <Text style={styles.tripDetailText}>{item.seats} chỗ trống</Text>
          </View>
        </View>
        <View style={styles.tripDetailsRow}>
          <View style={styles.tripDetail}>
            <Ionicons name="time-outline" size={16} color={COLORS.GRAY} />
            <Text style={styles.tripDetailText}>{item.departureTime}</Text>
          </View>
          <View style={styles.tripDetail}>
            <Ionicons name="cash-outline" size={16} color={COLORS.GRAY} />
            <Text style={styles.tripDetailText}>{item.price}</Text>
          </View>
        </View>
        <View style={styles.actionContainer}>{renderActionButtons(item)}</View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Quản lý chuyến đi</Text>
        <Text style={styles.subtitle}>Theo dõi trạng thái và duyệt các chuyến đi do tài xế tạo</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterContent}
      >
        {tripStatuses.map((status) => {
          const isActive = selectedFilter === status.key;
          return (
            <TouchableOpacity
              key={status.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setSelectedFilter(status.key)}
            >
              <Text style={[styles.filterLabel, isActive && styles.filterLabelActive]}>
                {status.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={filteredTrips}
        keyExtractor={(item) => item.id}
        renderItem={renderTripItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cloud-outline" size={48} color={COLORS.GRAY} />
            <Text style={styles.emptyTitle}>Không có chuyến đi nào</Text>
            <Text style={styles.emptyDescription}>
              Thử đổi bộ lọc hoặc kiểm tra lại sau.
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
  filterBar: {
    paddingHorizontal: 12,
    marginTop: 8,
  },
  filterContent: {
    paddingHorizontal: 8,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
  },
  filterChipActive: {
    backgroundColor: COLORS.BLUE,
    borderColor: COLORS.BLUE,
  },
  filterLabel: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  filterLabelActive: {
    color: COLORS.WHITE,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  tripCard: {
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
  tripHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  tripId: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.GRAY,
  },
  route: {
    marginTop: 4,
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
  tripDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  tripDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tripDetailText: {
    fontSize: 13,
    color: COLORS.GRAY,
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
  approveButton: {
    flex: 1,
    backgroundColor: COLORS.GREEN,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: COLORS.RED,
  },
  completeButton: {
    backgroundColor: COLORS.BLUE,
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

export default TripManagement;

