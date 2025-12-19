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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constant/colors";
import axiosClient from "../../api/axiosClient";
import endpoints from "../../api/endpoints";

const { width } = Dimensions.get("window");

// Mock data for testing
const MOCK_RIDES = [
  {
    id: 1,
    pickupAddress: "456 Elm Street, Springfield",
    destinationAddress: "739 Main Street, Springfield",
    price: 12,
    distance: 12000,
    status: "IN_PROGRESS",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    pickupAddress: "123 Oak Avenue, Downtown",
    destinationAddress: "456 Pine Road, Uptown",
    price: 25,
    distance: 8500,
    status: "PENDING",
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
  {
    id: 3,
    pickupAddress: "789 Maple Drive, Westside",
    destinationAddress: "321 Cedar Lane, Eastside",
    price: 18,
    distance: 15000,
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  },
  {
    id: 4,
    pickupAddress: "555 Birch Boulevard, North",
    destinationAddress: "888 Willow Way, South",
    price: 30,
    distance: 20000,
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
  },
  {
    id: 5,
    pickupAddress: "222 Spruce Street, Central",
    destinationAddress: "999 Ash Avenue, Suburb",
    price: 15,
    distance: 10000,
    status: "CANCELLED",
    createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
  },
  {
    id: 6,
    pickupAddress: "111 Cherry Lane, Eastside",
    destinationAddress: "444 Walnut Street, Westside",
    price: 22,
    distance: 18000,
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
  },
  {
    id: 7,
    pickupAddress: "777 Poplar Avenue, Downtown",
    destinationAddress: "333 Hickory Road, Uptown",
    price: 28,
    distance: 22000,
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
  },
  {
    id: 8,
    pickupAddress: "666 Redwood Drive, North",
    destinationAddress: "222 Sequoia Way, South",
    price: 35,
    distance: 25000,
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 518400000).toISOString(), // 6 days ago
  },
  {
    id: 9,
    pickupAddress: "888 Magnolia Boulevard, Central",
    destinationAddress: "555 Dogwood Lane, Suburb",
    price: 20,
    distance: 16000,
    status: "CANCELLED",
    createdAt: new Date(Date.now() - 604800000).toISOString(), // 7 days ago
  },
  {
    id: 10,
    pickupAddress: "999 Sycamore Street, Westside",
    destinationAddress: "111 Beech Avenue, Eastside",
    price: 24,
    distance: 19000,
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 691200000).toISOString(), // 8 days ago
  },
];

const RideHistory = ({ navigation }) => {
  const [rides, setRides] = useState(MOCK_RIDES); // Use mock data
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      console.log("🔄 Fetching ride history...");
      
      // Comment out API call to use mock data
      // const response = await axiosClient.get(endpoints.matches.history);
      // if (response?.data?.data) {
      //   setRides(response.data.data);
      // }
      
      // Use mock data instead
      console.log("✅ Using mock data:", MOCK_RIDES.length, "rides");
      setRides(MOCK_RIDES);
      
    } catch (error) {
      console.error("Failed to load ride history:", error);
      // Fallback to mock data on error
      setRides(MOCK_RIDES);
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
    const unsubscribe = navigation.addListener('focus', () => {
      fetchHistory();
    });
    return unsubscribe;
  }, [navigation, fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  // Separate active and past rides
  const { activeRides, pastRides, chartData } = useMemo(() => {
    const active = rides.filter(
      (ride) => ride.status === "IN_PROGRESS" || ride.status === "ONGOING" || 
               ride.status === "WAITING" || ride.status === "PENDING"
    );
    const past = rides.filter(
      (ride) => ride.status === "COMPLETED" || ride.status === "FINISHED" || 
               ride.status === "CANCELLED" || ride.status === "REJECTED"
    );

    // Generate chart data - rides per day for last 7 days
    const last7Days = [];
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const count = rides.filter(ride => {
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
  }, [rides]);

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

  const formatPrice = (price) => {
    if (!price) return "N/A";
    return `${price.toLocaleString()}đ`;
  };

  const formatDistance = (distance) => {
    if (!distance) return "N/A";
    return distance >= 1000 ? `${(distance / 1000).toFixed(1)}Km` : `${distance}m`;
  };

  // Render chart bar
  const maxCount = Math.max(...chartData.map(d => d.count), 1);
  
  const RideCard = ({ item }) => {
    const statusColor = getStatusColor(item.status);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("RideDetail", { rideId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardRow}>
          <View style={[styles.locationDot, { backgroundColor: COLORS.PRIMARY }]} />
          <View style={styles.cardContent}>
            <Text style={styles.addressText} numberOfLines={1}>
              {item.pickupAddress || item.startLocation || "Điểm đón"}
            </Text>
            <Text style={styles.labelText}>Pickup point</Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Payment</Text>
            <View style={[styles.priceBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.priceText, { color: statusColor }]}>
                {formatPrice(item.price)}
              </Text>
            </View>
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
            <Text style={styles.distanceText}>{formatDistance(item.distance)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Order History</Text>
          <Text style={styles.headerSubtitle}>Showing all your order history</Text>
        </View>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => navigation.navigate("Notification")}
        >
          <Ionicons name="notifications-outline" size={24} color={COLORS.PRIMARY} />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      {/* Chart Section */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Thống kê 7 ngày qua</Text>
        <View style={styles.chartContainer}>
          {chartData.map((item, index) => (
            <View key={index} style={styles.chartBar}>
              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.bar, 
                    { 
                      height: item.count > 0 ? (item.count / maxCount) * 60 : 4,
                      backgroundColor: item.isToday ? COLORS.PRIMARY : '#E0E0E0',
                    }
                  ]} 
                />
              </View>
              <Text style={[
                styles.chartLabel, 
                item.isToday && styles.chartLabelActive
              ]}>
                {item.day}
              </Text>
            </View>
          ))}
        </View>
        
        {/* Stats Summary */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{rides.length}</Text>
            <Text style={styles.statLabel}>Tổng chuyến</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#2196F3' }]}>{activeRides.length}</Text>
            <Text style={styles.statLabel}>Đang chạy</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.GREEN }]}>
              {pastRides.filter(r => r.status === 'COMPLETED' || r.status === 'FINISHED').length}
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
            <RideCard key={ride.id} item={ride} />
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
      <FlatList
        data={pastRides}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 4,
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
});

export default RideHistory;
