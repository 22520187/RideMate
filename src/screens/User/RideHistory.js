import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constant/colors";
import axiosClient from "../../api/axiosClient";
import endpoints from "../../api/endpoints";

const RideHistory = ({ navigation }) => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all"); // all, completed, cancelled

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get(endpoints.matches.history);
      if (response?.data?.data) {
        setRides(response.data.data);
      }
    } catch (error) {
      console.error("Failed to load ride history:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const getFilteredRides = () => {
    if (filter === "all") return rides;
    if (filter === "completed") {
      return rides.filter(
        (ride) => ride.status === "COMPLETED" || ride.status === "FINISHED"
      );
    }
    if (filter === "cancelled") {
      return rides.filter(
        (ride) => ride.status === "CANCELLED" || ride.status === "REJECTED"
      );
    }
    return rides;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "COMPLETED":
      case "FINISHED":
        return COLORS.GREEN;
      case "CANCELLED":
      case "REJECTED":
        return COLORS.RED;
      case "IN_PROGRESS":
      case "ONGOING":
        return COLORS.BLUE;
      case "WAITING":
      case "PENDING":
        return COLORS.ORANGE;
      default:
        return COLORS.GRAY;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "COMPLETED":
      case "FINISHED":
        return "Hoàn thành";
      case "CANCELLED":
        return "Đã hủy";
      case "REJECTED":
        return "Bị từ chối";
      case "IN_PROGRESS":
      case "ONGOING":
        return "Đang diễn ra";
      case "WAITING":
      case "PENDING":
        return "Chờ xử lý";
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderRideCard = ({ item }) => {
    const statusColor = getStatusColor(item.status);
    const statusText = getStatusText(item.status);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("RideDetail", { rideId: item.id })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + "20" },
            ]}
          >
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusText}
            </Text>
          </View>
        </View>

        <View style={styles.locationContainer}>
          <View style={styles.locationRow}>
            <View
              style={[styles.locationDot, { backgroundColor: COLORS.BLUE }]}
            />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Điểm đón</Text>
              <Text style={styles.locationText} numberOfLines={1}>
                {item.pickupAddress || item.startLocation || "Không rõ"}
              </Text>
            </View>
          </View>

          <View style={styles.dashedLine} />

          <View style={styles.locationRow}>
            <View
              style={[styles.locationDot, { backgroundColor: COLORS.RED }]}
            />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Điểm đến</Text>
              <Text style={styles.locationText} numberOfLines={1}>
                {item.destinationAddress || item.endLocation || "Không rõ"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.infoItem}>
            <Ionicons name="cash-outline" size={16} color={COLORS.GRAY} />
            <Text style={styles.infoText}>
              {item.price ? `${item.price.toLocaleString()} đ` : "Chưa có giá"}
            </Text>
          </View>

          {item.distance && (
            <View style={styles.infoItem}>
              <Ionicons name="navigate-outline" size={16} color={COLORS.GRAY} />
              <Text style={styles.infoText}>
                {item.distance >= 1000
                  ? `${(item.distance / 1000).toFixed(1)} km`
                  : `${item.distance} m`}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const filteredRides = getFilteredRides();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.BLACK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử chuyến đi</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "all" && styles.filterButtonActive,
          ]}
          onPress={() => setFilter("all")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "all" && styles.filterTextActive,
            ]}
          >
            Tất cả
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "completed" && styles.filterButtonActive,
          ]}
          onPress={() => setFilter("completed")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "completed" && styles.filterTextActive,
            ]}
          >
            Hoàn thành
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "cancelled" && styles.filterButtonActive,
          ]}
          onPress={() => setFilter("cancelled")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "cancelled" && styles.filterTextActive,
            ]}
          >
            Đã hủy
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      ) : (
        <FlatList
          data={filteredRides}
          keyExtractor={(item) =>
            item.id?.toString() || Math.random().toString()
          }
          renderItem={renderRideCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.PRIMARY]}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={64} color={COLORS.GRAY} />
              <Text style={styles.emptyTitle}>Chưa có chuyến đi nào</Text>
              <Text style={styles.emptySubtitle}>
                Lịch sử chuyến đi của bạn sẽ hiển thị tại đây
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: COLORS.WHITE,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.BG,
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.GRAY,
  },
  filterTextActive: {
    color: COLORS.WHITE,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  locationContainer: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginBottom: 2,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.BLACK,
    fontWeight: "500",
  },
  dashedLine: {
    width: 2,
    height: 16,
    marginLeft: 5,
    marginVertical: 4,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.GRAY_LIGHT,
    borderStyle: "dashed",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_LIGHT,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.BLACK,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.BLACK,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginTop: 8,
    textAlign: "center",
  },
});

export default RideHistory;
