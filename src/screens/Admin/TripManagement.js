import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constant/colors";
import * as adminService from "../../services/adminService";
import { unwrapApiData } from "../../utils/unwrapApiData";
import { useDebounce } from "../../hooks/useDebounce";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const filterTabs = [
  { key: "all", label: "Tất cả", icon: "list-outline" },
  { key: "PENDING", label: "Chờ xử lý", icon: "time-outline" },
  { key: "WAITING", label: "Đang chờ", icon: "radio-button-on-outline" },
  { key: "ACCEPTED", label: "Đã chấp nhận", icon: "people-outline" },
  { key: "IN_PROGRESS", label: "Đang đi", icon: "car-outline" },
  { key: "COMPLETED", label: "Hoàn thành", icon: "checkmark-circle-outline" },
  { key: "CANCELLED", label: "Đã hủy", icon: "close-circle-outline" },
];

const statusConfig = {
  PENDING: { label: "Chờ xử lý", color: "#FF9800", bg: "#FFF3E0", icon: "time" },
  WAITING: { label: "Đang chờ", color: "#2196F3", bg: "#E3F2FD", icon: "radio-button-on" },
  ACCEPTED: { label: "Đã chấp nhận", color: "#9C27B0", bg: "#F3E5F5", icon: "people" },
  IN_PROGRESS: { label: "Đang diễn ra", color: "#FF9800", bg: "#FFF3E0", icon: "car" },
  COMPLETED: { label: "Hoàn thành", color: "#4CAF50", bg: "#E8F5E9", icon: "checkmark-circle" },
  CANCELLED: { label: "Đã hủy", color: "#F44336", bg: "#FFEBEE", icon: "close-circle" },
};

const TripManagement = () => {
  const [selectedTab, setSelectedTab] = useState("all");
  const [trips, setTrips] = useState([]);
  const [statistics, setStatistics] = useState(null);
  
  const [initialLoading, setInitialLoading] = useState(true); 
  const [loading, setLoading] = useState(false); 

  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchTrips = useCallback(
    async (pageNum = 0, refresh = false, search = "") => {
      try {
        if (pageNum === 0 && !refresh) {
            if (!search) {
                setInitialLoading(true);
            }

        }

        if (refresh) {
          setRefreshing(true);
        } else if (pageNum > 0) {
          setLoading(true); 
        }

        const params = {
          page: pageNum,
          size: 20,
          sortBy: "createdAt",
          sortDirection: "DESC",
          search: search,
        };

        if (selectedTab !== "all") {
          params.status = selectedTab;
        }

        const response = await adminService.getTrips(params);
        const pageData = unwrapApiData(response) || {};
        const content = Array.isArray(pageData?.content) ? pageData.content : [];

        if (refresh || pageNum === 0) {
          setTrips(content);
        } else {
          setTrips((prev) => [...prev, ...content]);
        }

        setHasMore(!pageData.last);
        setPage(pageNum);
      } catch (error) {
        console.error("Error fetching trips:", error);
      } finally {
        setInitialLoading(false);
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedTab]
  );

  const fetchStatistics = useCallback(async () => {
    try {
      const res = await adminService.getTripStatistics();
      const stats = unwrapApiData(res);
      setStatistics(stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  }, []);

  useEffect(() => {
    fetchTrips(0, false, debouncedSearchTerm);
    fetchStatistics();
  }, [selectedTab, debouncedSearchTerm]);

  const onRefresh = useCallback(() => {
    fetchTrips(0, true, debouncedSearchTerm);
    fetchStatistics();
  }, [fetchTrips, fetchStatistics, debouncedSearchTerm]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore && !initialLoading) {
      fetchTrips(page + 1, false, debouncedSearchTerm);
    }
  }, [loading, hasMore, page, fetchTrips, debouncedSearchTerm, initialLoading]);

  const handleTripPress = async (trip) => {
    try {
      const detailRes = await adminService.getTripById(trip.id);
      const detailData = unwrapApiData(detailRes);
      setSelectedTrip(detailData);
      setModalVisible(true);
    } catch (error) {
      console.error("Error fetching trip detail:", error);
      Alert.alert("Lỗi", "Không thể tải chi tiết chuyến đi");
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  const formatLocation = (locationData) => {
    if (!locationData) return "Chưa xác định";

    try {
      if (typeof locationData === "object") {
        return locationData.address || locationData.name || "Vị trí bản đồ";
      }

      if (
        typeof locationData === "string" &&
        (locationData.trim().startsWith("{") ||
          locationData.trim().startsWith("["))
      ) {
        const parsed = JSON.parse(locationData);
        return parsed.address || parsed.name || locationData;
      }
      return locationData;
    } catch (error) {
      return locationData;
    }
  };

  const renderStatCard = (icon, label, value, color) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View
        style={[styles.statIconContainer, { backgroundColor: color + "15" }]}
      >
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
          <Text style={styles.headerTitle}>Quản lý chuyến đi</Text>
          <Text style={styles.headerSubtitle}>
            {statistics?.totalTrips || 0} chuyến đi
          </Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.GRAY} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo tên TX, KH hoặc mã chuyến..."
          value={searchTerm}
          onChangeText={setSearchTerm} 
          autoCapitalize="none"
          placeholderTextColor={COLORS.GRAY}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm("")}>
            <Ionicons name="close-circle" size={20} color={COLORS.GRAY} />
          </TouchableOpacity>
        )}
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        {renderStatCard("car", "Tổng chuyến", statistics?.totalTrips || 0, COLORS.PRIMARY)}
        {renderStatCard("radio-button-on", "Đang chờ", statistics?.waitingTrips || 0, "#2196F3")}
        {renderStatCard("time", "Đang đi", statistics?.inProgressTrips || 0, "#FF9800")}
        {renderStatCard("checkmark-circle", "Hoàn thành", statistics?.completedTrips || 0, "#4CAF50")}
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

  const renderTripCard = ({ item }) => {
    const status = statusConfig[item.status] || statusConfig.WAITING;
    const driverName = item.driver?.fullName; 
    const driverRating = item.driver?.rating;
    
    const passengerCount = item.matchedRidersCount || (item.passengers ? item.passengers.length : 0);

    return (
      <TouchableOpacity
        style={styles.tripCard}
        onPress={() => handleTripPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.tripHeader}>
          <Text style={styles.tripId}>#{item.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Ionicons name={status.icon} size={14} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        {/* Route Info */}
        <View style={styles.routeContainer}>
          <View style={styles.routePoints}>
            <View style={styles.pointStart}>
              <Ionicons name="location" size={20} color="#4CAF50" />
            </View>
            <View style={styles.routeLine} />
            <View style={styles.pointEnd}>
              <Ionicons name="location" size={20} color="#F44336" />
            </View>
          </View>
          <View style={styles.routeInfo}>
            <Text style={styles.routeLocation} numberOfLines={1}>
              {formatLocation(item.startLocation) || "Điểm đi"}
            </Text>
            <Text style={styles.routeLocation} numberOfLines={1}>
              {formatLocation(item.endLocation) || "Điểm đến"}
            </Text>
          </View>
        </View>

        {/* Driver Info - Chỉ hiện khi có tài xế */}
        {driverName && (
          <View style={styles.driverSection}>
            <View style={styles.driverAvatar}>
              <Ionicons name="person" size={20} color={COLORS.PRIMARY} />
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{driverName}</Text>
              <View style={styles.driverMeta}>
                <Ionicons name="star" size={12} color="#FFB300" />
                <Text style={styles.driverRating}>
                  {driverRating?.toFixed(1) || "N/A"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Trip Meta */}
        <View style={styles.tripMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="people" size={16} color={COLORS.PRIMARY} />
            <Text style={styles.metaText}>
              {passengerCount} hành khách
            </Text>
          </View>
          
          {item.fare != null && (
            <View style={styles.metaItem}>
              <Ionicons name="wallet" size={16} color="#4CAF50" />
              <Text style={styles.metaText}>{formatCurrency(item.fare)}</Text>
            </View>
          )}

          <View style={styles.metaItem}>
            <Ionicons name="time" size={16} color={COLORS.GRAY} />
            <Text style={styles.metaText}>{formatDate(item.startTime || item.createdAt)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTripDetail = () => {
    if (!selectedTrip) return null;

    const status = statusConfig[selectedTrip.status] || statusConfig.WAITING;
    const driver = selectedTrip.driver;
    const passengers = selectedTrip.passengers || [];

    return (
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết chuyến đi</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.BLACK} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Trip ID and Status */}
              <View style={styles.detailSection}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Mã chuyến</Text>
                  <Text style={styles.detailValue}>#{selectedTrip.id}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Trạng thái</Text>
                  <View
                    style={[styles.statusBadge, { backgroundColor: status.bg }]}
                  >
                    <Ionicons
                      name={status.icon}
                      size={14}
                      color={status.color}
                    />
                    <Text style={[styles.statusText, { color: status.color }]}>
                      {status.label}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Route */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Tuyến đường</Text>
                <View style={styles.routeDetail}>
                  <View style={styles.routePointRow}>
                    <View style={styles.pointStart}>
                      <Ionicons name="location" size={18} color="#4CAF50" />
                    </View>
                    <Text style={styles.routeDetailText}>
                      {formatLocation(selectedTrip.startLocation) || "Điểm đi"}
                    </Text>
                  </View>
                  <View style={styles.routeLineDetail} />
                  <View style={styles.routePointRow}>
                    <View style={styles.pointEnd}>
                      <Ionicons name="location" size={18} color="#F44336" />
                    </View>
                    <Text style={styles.routeDetailText}>
                      {formatLocation(selectedTrip.endLocation) || "Điểm đến"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Driver Info */}
              {driver && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Tài xế</Text>
                  <View style={styles.driverDetailCard}>
                    <View style={styles.driverDetailAvatar}>
                      <Ionicons
                        name="person"
                        size={24}
                        color={COLORS.PRIMARY}
                      />
                    </View>
                    <View style={styles.driverDetailInfo}>
                      <Text style={styles.driverDetailName}>
                        {driver.fullName}
                      </Text>
                      <Text style={styles.driverDetailPhone}>
                        {driver.phoneNumber || "N/A"}
                      </Text>
                      <View style={styles.driverDetailRating}>
                        <Ionicons name="star" size={14} color="#FFB300" />
                        <Text style={styles.driverDetailRatingText}>
                          {driver.rating?.toFixed(1) || "N/A"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Matched Riders */}
              {passengers.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>
                      Hành khách ({passengers.length})
                    </Text>
                    {passengers.map((rider, index) => (
                      <View key={index} style={styles.riderCard}>
                        <View style={styles.riderAvatar}>
                          <Ionicons name="person" size={20} color="#9C27B0" />
                        </View>
                        <View style={styles.riderInfo}>
                          <Text style={styles.riderName}>{rider.fullName}</Text>
                          <Text style={styles.riderPhone}>
                            {rider.phoneNumber || "N/A"}
                          </Text>
                        </View>
                        <View style={styles.riderRating}>
                          <Ionicons name="star" size={12} color="#FFB300" />
                          <Text style={styles.riderRatingText}>
                            {rider.rating?.toFixed(1) || "N/A"}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

              {/* Fare */}
              {selectedTrip.fare != null && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Giá cước</Text>
                  <View style={styles.fareCard}>
                    <Ionicons name="wallet" size={24} color="#4CAF50" />
                    <Text style={styles.fareAmount}>
                      {formatCurrency(selectedTrip.fare)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Time */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Thời gian</Text>
                <View style={styles.timeInfo}>
                  <View style={styles.timeRow}>
                    <Ionicons name="calendar" size={16} color={COLORS.GRAY} />
                    <Text style={styles.timeLabel}>Khởi hành:</Text>
                    <Text style={styles.timeValue}>
                      {formatDate(selectedTrip.startTime || selectedTrip.createdAt)}
                    </Text>
                  </View>
                  {selectedTrip.endTime && (
                    <View style={styles.timeRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={COLORS.GRAY}
                      />
                      <Text style={styles.timeLabel}>Kết thúc:</Text>
                      <Text style={styles.timeValue}>
                        {formatDate(selectedTrip.endTime)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="car-outline" size={64} color={COLORS.GRAY} />
      <Text style={styles.emptyText}>Không có chuyến đi nào</Text>
      <Text style={styles.emptySubtext}>
        {selectedTab === "all"
          ? "Chưa có chuyến đi nào trong hệ thống"
          : "Không có chuyến đi nào ở trạng thái này"}
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

  if (initialLoading) {
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
        data={trips}
        renderItem={renderTripCard}
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
        keyboardShouldPersistTaps="handled" 
      />
      {renderTripDetail()}
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
  tripCard: {
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
  tripHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  tripId: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.BLACK,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  routeContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  routePoints: {
    alignItems: "center",
    marginRight: 12,
  },
  pointStart: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: "#E0E0E0",
    marginVertical: 4,
  },
  pointEnd: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFEBEE",
    justifyContent: "center",
    alignItems: "center",
  },
  routeInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  routeLocation: {
    fontSize: 14,
    color: COLORS.BLACK,
    marginBottom: 4,
  },
  driverSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    marginBottom: 12,
  },
  driverAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.BLACK,
    marginBottom: 4,
  },
  driverMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  driverRating: {
    fontSize: 12,
    color: COLORS.GRAY,
    fontWeight: "500",
  },
  tripMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.GRAY,
    fontWeight: "500",
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
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.BLACK,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.BLACK,
  },
  routeDetail: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
  },
  routePointRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  routeLineDetail: {
    width: 2,
    height: 24,
    backgroundColor: "#E0E0E0",
    marginLeft: 15,
    marginVertical: 8,
  },
  routeDetailText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.BLACK,
  },
  driverDetailCard: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
  },
  driverDetailAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  driverDetailInfo: {
    flex: 1,
  },
  driverDetailName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.BLACK,
    marginBottom: 4,
  },
  driverDetailPhone: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginBottom: 6,
  },
  driverDetailRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  driverDetailRatingText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.BLACK,
  },
  riderCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  riderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3E5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  riderInfo: {
    flex: 1,
  },
  riderName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.BLACK,
    marginBottom: 2,
  },
  riderPhone: {
    fontSize: 12,
    color: COLORS.GRAY,
  },
  riderRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  riderRatingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F57C00",
  },
  fareCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  fareAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2E7D32",
  },
  timeInfo: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 13,
    color: COLORS.GRAY,
    fontWeight: "500",
  },
  timeValue: {
    fontSize: 13,
    color: COLORS.BLACK,
    fontWeight: "600",
    flex: 1,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.BLACK,
    height: "100%",
  },
});

export default TripManagement;