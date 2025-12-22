import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Dimensions,
  Modal,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import DateTimePicker from "@react-native-community/datetimepicker";
import COLORS from "../../constant/colors";
import { getMatchHistory } from "../../services/matchService";
import GradientHeader from "../../components/GradientHeader";

const { width } = Dimensions.get("window");

const RideHistory = ({ navigation }) => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Date filter states
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [tempFromDate, setTempFromDate] = useState(null);
  const [tempToDate, setTempToDate] = useState(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const normalizeRideItem = (raw) => {
    if (!raw) return null;

    const id = raw.id ?? raw.matchId ?? raw.rideId;
    const pickupAddress =
      raw.pickupAddress ?? raw.pickup_address ?? raw.startLocation ?? raw.from;
    const destinationAddress =
      raw.destinationAddress ??
      raw.destination_address ??
      raw.endLocation ??
      raw.to;
    const status =
      raw.status ?? raw.matchStatus ?? raw.rideStatus ?? raw.state ?? "UNKNOWN";

    // Use coin instead of price
    const coinRaw =
      raw.coin ?? raw.coins ?? raw.price ?? raw.estimatedPrice ?? raw.fare ?? 0;
    const coin = typeof coinRaw === "number" ? coinRaw : Number(coinRaw) || 0;

    const distanceRaw =
      raw.distance ?? raw.distanceMeters ?? raw.distance_meters;
    const distance =
      typeof distanceRaw === "number" ? distanceRaw : Number(distanceRaw) || 0;

    const createdAt =
      raw.createdAt ??
      raw.created_at ??
      raw.createdDate ??
      raw.created_date ??
      new Date().toISOString();

    return {
      id,
      pickupAddress,
      destinationAddress,
      status,
      coin,
      distance,
      createdAt,
    };
  };

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      console.log("🔄 Fetching ride history...");

      const response = await getMatchHistory();
      const payload = response?.data?.data ?? response?.data ?? [];
      const list = Array.isArray(payload) ? payload : [];
      const normalized = list.map(normalizeRideItem).filter(Boolean);
      // React list keys must be unique + stable. Backend data may contain missing/duplicate ids,
      // so we generate a separate internal key for rendering purposes.
      const normalizedWithKey = normalized.map((ride, idx) => ({
        ...ride,
        _key: `${ride.id ?? "noid"}-${ride.createdAt ?? "nodate"}-${idx}`,
      }));

      console.log("✅ Loaded ride history:", normalized.length, "rides");
      setRides(normalizedWithKey);
    } catch (error) {
      console.error("Failed to load ride history:", error);
      // Keep whatever we had; do not overwrite with mock data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Refresh when tab is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchHistory();
    });
    return unsubscribe;
  }, [navigation, fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  // Date filter handlers
  const handleFromDateChange = (event, selectedDate) => {
    // For Android, only apply when user confirms
    if (Platform.OS === "android") {
      if (event.type === "set" && selectedDate) {
        setTempFromDate(selectedDate);
      }
      setShowFromPicker(false);
      setFilterModalVisible(true);
    } else {
      // For iOS, update temp value as user scrolls (don't close)
      if (selectedDate) {
        setTempFromDate(selectedDate);
      }
    }
  };

  const handleToDateChange = (event, selectedDate) => {
    // For Android, only apply when user confirms
    if (Platform.OS === "android") {
      if (event.type === "set" && selectedDate) {
        setTempToDate(selectedDate);
      }
      setShowToPicker(false);
      setFilterModalVisible(true);
    } else {
      // For iOS, update temp value as user scrolls (don't close)
      if (selectedDate) {
        setTempToDate(selectedDate);
      }
    }
  };

  const confirmFromDatePicker = () => {
    setShowFromPicker(false);
    setFilterModalVisible(true);
  };

  const confirmToDatePicker = () => {
    setShowToPicker(false);
    setFilterModalVisible(true);
  };

  const cancelFromDatePicker = () => {
    setTempFromDate(fromDate); // Reset to original value
    setShowFromPicker(false);
    setFilterModalVisible(true);
  };

  const cancelToDatePicker = () => {
    setTempToDate(toDate); // Reset to original value
    setShowToPicker(false);
    setFilterModalVisible(true);
  };

  const openFromDatePicker = () => {
    setFilterModalVisible(false);
    setTimeout(() => {
      setShowFromPicker(true);
    }, 300);
  };

  const openToDatePicker = () => {
    setFilterModalVisible(false);
    setTimeout(() => {
      setShowToPicker(true);
    }, 300);
  };

  const clearFilters = () => {
    setFromDate(null);
    setToDate(null);
    setTempFromDate(null);
    setTempToDate(null);
    setFilterModalVisible(false);
  };

  const applyFilters = () => {
    // Apply temp dates to actual filter dates
    setFromDate(tempFromDate);
    setToDate(tempToDate);
    setFilterModalVisible(false);
  };

  const openFilterModal = () => {
    // Initialize temp dates with current filter values or today's date
    const today = new Date();
    setTempFromDate(fromDate || today);
    setTempToDate(toDate || today);
    setFilterModalVisible(true);
  };

  // Filter rides by date range
  const filteredRides = useMemo(() => {
    if (!fromDate && !toDate) return rides;

    return rides.filter((ride) => {
      const rideDate = new Date(ride.createdAt);

      if (fromDate && toDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        return rideDate >= from && rideDate <= to;
      } else if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        return rideDate >= from;
      } else if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        return rideDate <= to;
      }

      return true;
    });
  }, [rides, fromDate, toDate]);

  // Separate active and past rides
  const { activeRides, pastRides, chartData } = useMemo(() => {
    const active = filteredRides.filter(
      (ride) =>
        ride.status === "IN_PROGRESS" ||
        ride.status === "ONGOING" ||
        ride.status === "WAITING" ||
        ride.status === "PENDING"
    );
    const past = filteredRides.filter(
      (ride) =>
        ride.status === "COMPLETED" ||
        ride.status === "FINISHED" ||
        ride.status === "CANCELLED" ||
        ride.status === "REJECTED"
    );

    // Generate chart data - rides per day for last 7 days (use all rides for chart)
    const last7Days = [];
    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const count = filteredRides.filter((ride) => {
        const rideDate = new Date(ride.createdAt);
        return rideDate >= dayStart && rideDate <= dayEnd;
      }).length;

      last7Days.push({
        day: dayNames[dayStart.getDay()],
        count,
        isToday: i === 0,
      });
    }

    return { activeRides: active, pastRides: past, chartData: last7Days };
  }, [filteredRides]);

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
        return "#2196F3";
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

  const formatCoin = (coin) => {
    if (coin === null || coin === undefined) return "0 coin";
    const num = typeof coin === "number" ? coin : Number(coin);
    if (!Number.isFinite(num)) return "0 coin";
    return `${num.toLocaleString()} coin`;
  };

  const formatDistance = (distance) => {
    if (!distance) return "N/A";
    const num = typeof distance === "number" ? distance : Number(distance);
    if (!Number.isFinite(num)) return "N/A";
    return num >= 1000 ? `${(num / 1000).toFixed(1)}Km` : `${Math.round(num)}m`;
  };

  // Render chart bar
  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  const RideCard = ({ item }) => {
    const statusColor = getStatusColor(item.status);
    const statusText = getStatusText(item.status);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("RideDetail", { rideId: item.id })}
        activeOpacity={0.7}
      >
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusBadgeText}>{statusText}</Text>
        </View>

        <View style={styles.cardRow}>
          <View
            style={[styles.locationDot, { backgroundColor: COLORS.PRIMARY }]}
          />
          <View style={styles.cardContent}>
            <Text style={styles.addressText} numberOfLines={1}>
              {item.pickupAddress || item.startLocation || "Điểm đón"}
            </Text>
            <Text style={styles.labelText}>Pickup point</Text>
          </View>
        </View>

        <View style={styles.cardRow}>
          <View style={[styles.locationDot, { backgroundColor: COLORS.RED }]} />
          <View style={styles.cardContent}>
            <Text style={styles.addressText} numberOfLines={1}>
              {item.destinationAddress || item.endLocation || "Điểm đến"}
            </Text>
            <Text style={styles.labelText}>Destination</Text>
          </View>
          <View style={styles.distanceContainer}>
            <Text style={styles.distanceLabel}>Distance</Text>
            <Text style={styles.distanceText}>
              {formatDistance(item.distance)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Order History</Text>
          <Text style={styles.headerSubtitle}>
            Showing all your order history
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.filterButton,
            (fromDate || toDate) && styles.filterButtonActive,
          ]}
          onPress={openFilterModal}
        >
          <Ionicons
            name="filter"
            size={20}
            color={fromDate || toDate ? COLORS.WHITE : COLORS.PRIMARY}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => navigation.navigate("Notification")}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color={COLORS.PRIMARY}
          />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      {/* Active Filter Display */}
      {(fromDate || toDate) && (
        <View style={styles.activeFilterContainer}>
          <Ionicons name="calendar" size={16} color={COLORS.PRIMARY} />
          <Text style={styles.activeFilterText}>
            {fromDate && toDate
              ? `${fromDate.toLocaleDateString(
                  "vi-VN"
                )} - ${toDate.toLocaleDateString("vi-VN")}`
              : fromDate
              ? `Từ ${fromDate.toLocaleDateString("vi-VN")}`
              : `Đến ${toDate.toLocaleDateString("vi-VN")}`}
          </Text>
          <TouchableOpacity
            onPress={clearFilters}
            style={styles.clearFilterButton}
          >
            <Ionicons name="close-circle" size={18} color={COLORS.GRAY} />
          </TouchableOpacity>
        </View>
      )}

      {/* Chart Section */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Thống kê 7 ngày qua</Text>
        <LineChart
          data={{
            labels: chartData.map((d) => d.day),
            datasets: [
              {
                data: chartData.map((d) => d.count),
              },
            ],
          }}
          width={width - 40}
          height={180}
          chartConfig={{
            backgroundColor: "#ffffff",
            backgroundGradientFrom: "#ffffff",
            backgroundGradientTo: "#ffffff",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 69, 83, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(142, 142, 147, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: "4",
              strokeWidth: "2",
              stroke: COLORS.PRIMARY,
            },
            propsForBackgroundLines: {
              strokeDasharray: "", // solid lines
              stroke: "#F0F0F0",
              strokeWidth: 1,
            },
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
        />

        {/* Stats Summary */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{rides.length}</Text>
            <Text style={styles.statLabel}>Tổng chuyến</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: "#2196F3" }]}>
              {activeRides.length}
            </Text>
            <Text style={styles.statLabel}>Đang chạy</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.GREEN }]}>
              {
                pastRides.filter(
                  (r) => r.status === "COMPLETED" || r.status === "FINISHED"
                ).length
              }
            </Text>
            <Text style={styles.statLabel}>Hoàn thành</Text>
          </View>
        </View>
      </View>

      {/* Active Orders Section */}
      {activeRides.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active orders</Text>
          </View>
          {activeRides.map((ride) => (
            <RideCard key={ride._key ?? ride.id} item={ride} />
          ))}
        </>
      )}

      {/* Past Orders Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Past orders</Text>
      </View>
    </>
  );

  if (loading && rides.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GradientHeader title="Lịch sử" showBackButton={false} />
      <FlatList
        data={pastRides}
        keyExtractor={(item) => (item._key ?? item.id)?.toString()}
        renderItem={({ item }) => <RideCard item={item} />}
        ListHeaderComponent={renderHeader}
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

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}
        >
          <View
            style={styles.filterModal}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Lọc theo ngày</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1C1C1E" />
              </TouchableOpacity>
            </View>

            <View style={styles.filterModalContent}>
              {/* From Date */}
              <View style={styles.dateInputGroup}>
                <Text style={styles.dateLabel}>Từ ngày</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={openFromDatePicker}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={COLORS.PRIMARY}
                  />
                  <Text
                    style={[
                      styles.dateText,
                      !tempFromDate && styles.datePlaceholder,
                    ]}
                  >
                    {tempFromDate
                      ? tempFromDate.toLocaleDateString("vi-VN")
                      : "Chọn ngày"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* To Date */}
              <View style={styles.dateInputGroup}>
                <Text style={styles.dateLabel}>Đến ngày</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={openToDatePicker}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={COLORS.PRIMARY}
                  />
                  <Text
                    style={[
                      styles.dateText,
                      !tempToDate && styles.datePlaceholder,
                    ]}
                  >
                    {tempToDate
                      ? tempToDate.toLocaleDateString("vi-VN")
                      : "Chọn ngày"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Action Buttons */}
              <View style={styles.filterActions}>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={clearFilters}
                >
                  <Text style={styles.clearButtonText}>Xóa bộ lọc</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={applyFilters}
                >
                  <Text style={styles.applyButtonText}>Áp dụng</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Pickers */}
      {Platform.OS === "ios" ? (
        <>
          {/* iOS From Date Picker Modal */}
          <Modal
            visible={showFromPicker}
            transparent
            animationType="slide"
            onRequestClose={cancelFromDatePicker}
          >
            <TouchableOpacity
              style={styles.pickerModalOverlay}
              activeOpacity={1}
              onPress={cancelFromDatePicker}
            >
              <View
                style={styles.pickerModal}
                onStartShouldSetResponder={() => true}
              >
                <View style={styles.pickerHeader}>
                  <TouchableOpacity onPress={cancelFromDatePicker}>
                    <Text style={styles.pickerCancelText}>Hủy</Text>
                  </TouchableOpacity>
                  <Text style={styles.pickerTitle}>Chọn từ ngày</Text>
                  <TouchableOpacity onPress={confirmFromDatePicker}>
                    <Text style={styles.pickerDoneText}>Xong</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={tempFromDate || new Date()}
                  mode="date"
                  display="spinner"
                  onChange={handleFromDateChange}
                  maximumDate={tempToDate || new Date()}
                  textColor="#000"
                />
              </View>
            </TouchableOpacity>
          </Modal>

          {/* iOS To Date Picker Modal */}
          <Modal
            visible={showToPicker}
            transparent
            animationType="slide"
            onRequestClose={cancelToDatePicker}
          >
            <TouchableOpacity
              style={styles.pickerModalOverlay}
              activeOpacity={1}
              onPress={cancelToDatePicker}
            >
              <View
                style={styles.pickerModal}
                onStartShouldSetResponder={() => true}
              >
                <View style={styles.pickerHeader}>
                  <TouchableOpacity onPress={cancelToDatePicker}>
                    <Text style={styles.pickerCancelText}>Hủy</Text>
                  </TouchableOpacity>
                  <Text style={styles.pickerTitle}>Chọn đến ngày</Text>
                  <TouchableOpacity onPress={confirmToDatePicker}>
                    <Text style={styles.pickerDoneText}>Xong</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={tempToDate || new Date()}
                  mode="date"
                  display="spinner"
                  onChange={handleToDateChange}
                  minimumDate={tempFromDate}
                  maximumDate={new Date()}
                  textColor="#000"
                />
              </View>
            </TouchableOpacity>
          </Modal>
        </>
      ) : (
        <>
          {/* Android Date Pickers */}
          {showFromPicker && (
            <DateTimePicker
              value={tempFromDate || new Date()}
              mode="date"
              display="default"
              onChange={handleFromDateChange}
              maximumDate={tempToDate || new Date()}
            />
          )}
          {showToPicker && (
            <DateTimePicker
              value={tempToDate || new Date()}
              mode="date"
              display="default"
              onChange={handleToDateChange}
              minimumDate={tempFromDate}
              maximumDate={new Date()}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingBottom: 20,
  },

  // Header
  headerWrapper: {
    backgroundColor: "#fff",
    paddingTop: 10,
    paddingBottom: 16,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 12,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    position: "relative",
  },
  filterButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    position: "relative",
  },
  filterButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.PRIMARY,
  },

  // Active Filter Display
  activeFilterContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY + "15",
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  activeFilterText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.PRIMARY,
    fontWeight: "600",
  },
  clearFilterButton: {
    padding: 4,
  },

  // Chart Section
  chartSection: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 80,
    marginBottom: 16,
  },
  chartBar: {
    alignItems: "center",
    flex: 1,
  },
  barContainer: {
    height: 60,
    justifyContent: "flex-end",
  },
  bar: {
    width: 20,
    borderRadius: 4,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 11,
    color: "#8E8E93",
    marginTop: 6,
    fontWeight: "500",
  },
  chartLabelActive: {
    color: COLORS.PRIMARY,
    fontWeight: "700",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.PRIMARY,
  },
  statLabel: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#F0F0F0",
  },

  // Section
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    backgroundColor: "#fff",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
  },

  // Card
  card: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    position: "relative",
  },
  statusBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  addressText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 2,
  },
  labelText: {
    fontSize: 12,
    color: "#8E8E93",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  priceLabel: {
    fontSize: 11,
    color: "#8E8E93",
    marginBottom: 4,
  },
  priceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priceText: {
    fontSize: 13,
    fontWeight: "700",
  },
  distanceContainer: {
    alignItems: "flex-end",
  },
  distanceLabel: {
    fontSize: 11,
    color: "#8E8E93",
    marginBottom: 4,
  },
  distanceText: {
    fontSize: 13,
    color: "#1C1C1E",
    fontWeight: "500",
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    marginHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 8,
    textAlign: "center",
  },

  // Filter Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  filterModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
  },
  filterModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  filterModalContent: {
    padding: 20,
  },
  dateInputGroup: {
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  dateText: {
    fontSize: 15,
    color: "#1C1C1E",
    flex: 1,
  },
  datePlaceholder: {
    color: "#8E8E93",
  },
  filterActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  clearButton: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#8E8E93",
  },
  applyButton: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },

  // Picker Modal (iOS)
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  pickerModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  pickerCancelText: {
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "600",
  },
  pickerDoneText: {
    fontSize: 16,
    color: COLORS.PRIMARY,
    fontWeight: "700",
  },
});

export default RideHistory;
