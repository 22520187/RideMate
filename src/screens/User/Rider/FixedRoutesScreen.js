import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import COLORS from "../../../constant/colors";
import fixedRouteService from "../../../services/fixedRouteService";
import routeBookingService from "../../../services/routeBookingService";
import Toast from "react-native-toast-message";
import LocationSearch from "../../../components/LocationSearch";

/**
 * Screen for passengers to search and view fixed routes
 */
const FixedRoutesScreen = ({ navigation, route }) => {
  const {
    pickupLocation: initialPickupLocation,
    destinationLocation: initialDestinationLocation,
    pickupAddress: initialPickupAddress,
    destinationAddress: initialDestinationAddress,
  } = route.params || {};

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(null); // Track which route is being booked

  // Search state - always show search form
  const [pickupAddress, setPickupAddress] = useState(
    initialPickupAddress || ""
  );
  const [pickupLocation, setPickupLocation] = useState(
    initialPickupLocation || null
  );

  const [destinationAddress, setDestinationAddress] = useState(
    initialDestinationAddress || ""
  );
  const [destinationLocation, setDestinationLocation] = useState(
    initialDestinationLocation || null
  );

  useEffect(() => {
    // Only search if both locations are provided from navigation
    if (pickupLocation && destinationLocation) {
      searchRoutes();
    }
    // Don't load all routes by default - wait for user to search
  }, []);

  const searchRoutes = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const response = await fixedRouteService.searchRoutes({
        pickupLatitude: pickupLocation.latitude,
        pickupLongitude: pickupLocation.longitude,
        dropoffLatitude: destinationLocation.latitude,
        dropoffLongitude: destinationLocation.longitude,
        pickupAddress: pickupAddress,
        dropoffAddress: destinationAddress,
        numberOfSeats: 1,
        travelDate: today,
      });

      const routesData = response.data || [];
      console.log(
        "🔍 Fixed Routes Response:",
        JSON.stringify(routesData.slice(0, 1), null, 2)
      );
      setRoutes(routesData);
    } catch (error) {
      console.error("Error searching routes:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tìm kiếm chuyến đi",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAllRoutes = async () => {
    try {
      setLoading(true);
      const response = await fixedRouteService.getAllActiveRoutes();
      setRoutes(response.data || []);
    } catch (error) {
      console.error("Error loading routes:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tải danh sách chuyến đi",
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (pickupLocation && destinationLocation) {
      await searchRoutes();
    } else {
      await loadAllRoutes();
    }
    setRefreshing(false);
  };

  const handlePickupSelect = (location) => {
    setPickupAddress(location.description);
    setPickupLocation({
      latitude: location.latitude,
      longitude: location.longitude,
    });
  };

  const handleDestinationSelect = (location) => {
    setDestinationAddress(location.description);
    setDestinationLocation({
      latitude: location.latitude,
      longitude: location.longitude,
    });
  };

  const handleSearch = () => {
    if (!pickupLocation || !destinationLocation) {
      Alert.alert("Lỗi", "Vui lòng chọn điểm đón và điểm đến");
      return;
    }
    searchRoutes();
  };

  const handleJoinRoute = (routeItem) => {
    if (routeItem.availableSeats <= 0) {
      Alert.alert("Thông báo", "Chuyến đi này đã hết chỗ");
      return;
    }

    navigation.navigate("RouteBookingScreen", {
      route: routeItem,
      pickupLocation: pickupLocation,
      destinationLocation: destinationLocation,
      pickupAddress: pickupAddress,
      destinationAddress: destinationAddress,
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    return `${hours}:${minutes}`;
  };

  const formatDistance = (distance) => {
    if (!distance || distance === 0) return "";

    // Check if distance is already in km (> 100 likely means it's in meters)
    if (distance > 100) {
      // Assume it's in meters
      if (distance < 1000) {
        return `${Math.round(distance)}m`;
      }
      return `${(distance / 1000).toFixed(1)}km`;
    } else {
      // Assume it's already in km
      return `${distance.toFixed(1)}km`;
    }
  };

  const handleBooking = async (item) => {
    if (item.availableSeats <= 0) {
      Alert.alert("Thông báo", "Chuyến đi này đã hết chỗ");
      return;
    }

    try {
      setBookingLoading(item.id); // Set loading state for this specific route
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const response = await routeBookingService.createBooking({
        routeId: item.id,
        pickupLatitude: pickupLocation?.latitude,
        pickupLongitude: pickupLocation?.longitude,
        dropoffLatitude: destinationLocation?.latitude,
        dropoffLongitude: destinationLocation?.longitude,
        pickupAddress: pickupAddress || item.pickupAddress,
        dropoffAddress: destinationAddress || item.dropoffAddress,
        numberOfSeats: 1,
        bookingDate: today,
      });

      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Yêu cầu tham gia đã được gửi!",
      });

      // Refresh the routes list
      if (pickupLocation && destinationLocation) {
        await searchRoutes();
      }
    } catch (error) {
      console.error("Error booking route:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2:
          error.response?.data?.message ||
          "Không thể đặt chỗ. Vui lòng thử lại.",
      });
    } finally {
      setBookingLoading(null); // Clear loading state
    }
  };

  const renderRouteCard = ({ item }) => {
    const bookedSeats = item.totalSeats - item.availableSeats;
    const seatPercentage = (bookedSeats / item.totalSeats) * 100;
    const isAvailable = item.availableSeats > 0;

    // Get rating from multiple possible fields - prioritize driverRating field
    const driverRating =
      item.driverRating !== undefined && item.driverRating !== null
        ? item.driverRating
        : item.driver?.rating !== undefined && item.driver?.rating !== null
        ? item.driver.rating
        : item.rating !== undefined && item.rating !== null
        ? item.rating
        : null;

    // Show rating if it exists (including 0)
    const hasRating = driverRating !== null && driverRating !== undefined;

    // Format rating text
    const ratingText =
      hasRating && typeof driverRating === "number"
        ? driverRating.toFixed(1)
        : hasRating
        ? String(driverRating)
        : "";


    if (!item) {
      return null;
    }

    return (
      <View style={styles.routeCard}>
        <View style={styles.cardHeader}>
          <View style={styles.routeNameRow}>
            <MaterialIcons name="directions-bus" size={20} color="#004553" />
            <Text style={styles.routeName} numberOfLines={1}>
              {item?.routeName ? String(item.routeName) : "Chuyến đi"}
            </Text>
          </View>
          {item?.pricePerSeat && item.pricePerSeat > 0 && (
            <View style={styles.priceTag}>
              <Text style={styles.priceValue}>
                {`${Number(item.pricePerSeat).toLocaleString()}đ`}
              </Text>
            </View>
          )}
        </View>

        {/* Pickup Location */}
        <View style={styles.locationRow}>
          <View style={[styles.locationDot, { backgroundColor: "#004553" }]} />
          <View style={styles.locationContent}>
            <Text style={styles.locationText} numberOfLines={1}>
              {item.pickupAddress ? String(item.pickupAddress) : "Chưa có thông tin"}
            </Text>
            <Text style={styles.locationLabel}>Pickup point</Text>
          </View>
        </View>

        {/* Destination Location */}
        <View style={styles.locationRow}>
          <View style={[styles.locationDot, { backgroundColor: "#FF6B6B" }]} />
          <View style={styles.locationContent}>
            <Text style={styles.locationText} numberOfLines={1}>
              {item.dropoffAddress ? String(item.dropoffAddress) : "Chưa có thông tin"}
            </Text>
            <Text style={styles.locationLabel}>Destination</Text>
          </View>
        </View>

        {/* Info Row: Time, Seats, Distance */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <MaterialIcons name="schedule" size={16} color="#6B7280" />
            <Text style={styles.infoText}>
              {formatTime(item.departureTime) || "--:--"}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="event-seat" size={16} color="#6B7280" />
            <Text style={styles.infoText}>
              {String(item.availableSeats || 0) +
                "/" +
                String(item.totalSeats || 0)}
            </Text>
          </View>
          {item.distance && (
            <View style={styles.infoItem}>
              <MaterialIcons name="straighten" size={16} color="#6B7280" />
              <Text style={styles.infoText}>
                {formatDistance(item.distance) || "0km"}
              </Text>
            </View>
          )}
        </View>

        {/* Driver Info with Rating */}
        <View style={styles.driverInfoContainer}>
          {(item.driverName || item.driver?.name) && (
            <View style={styles.driverRow}>
              <MaterialIcons name="person" size={16} color="#6B7280" />
              <Text style={styles.driverName}>
                {String(item.driverName || item.driver?.name || "")}
              </Text>
            </View>
          )}
          {hasRating && ratingText && (
            <View style={styles.ratingBadge}>
              <MaterialIcons name="star" size={16} color="#FFA726" />
              <Text style={styles.ratingBadgeText}>{ratingText}</Text>
            </View>
          )}
        </View>

        {/* Join Button */}
        <TouchableOpacity
          style={[
            styles.joinButton,
            (!isAvailable || bookingLoading === item.id) && styles.joinButtonDisabled
          ]}
          onPress={() => handleBooking(item)}
          disabled={!isAvailable || bookingLoading === item.id}
        >
          {bookingLoading === item.id ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <MaterialIcons
              name={isAvailable ? "check-circle" : "block"}
              size={20}
              color="#FFFFFF"
            />
          )}
          <Text style={styles.joinButtonText}>
            {bookingLoading === item.id
              ? "Đang xử lý..."
              : isAvailable
              ? "Yêu cầu tham gia"
              : "Hết chỗ"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tìm kiếm chuyến đi...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chuyến đi cố định</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search form - always visible */}
      {true && (
        <View style={styles.searchFormContainer}>
          <View style={styles.searchForm}>
            <Text style={styles.searchFormTitle}>Tìm kiếm chuyến đi</Text>

            <View style={[styles.searchInputSection, { zIndex: 10 }]}>
              <Text style={styles.searchLabel}>Điểm đón</Text>
              <LocationSearch
                placeholder="Nhập điểm đón"
                value={pickupAddress}
                onChangeText={setPickupAddress}
                onLocationSelect={handlePickupSelect}
                iconName="trip-origin"
              />
            </View>

            <View style={[styles.searchInputSection, { zIndex: 5 }]}>
              <Text style={styles.searchLabel}>Điểm đến</Text>
              <LocationSearch
                placeholder="Nhập điểm đến"
                value={destinationAddress}
                onChangeText={setDestinationAddress}
                onLocationSelect={handleDestinationSelect}
                iconName="location-on"
              />
            </View>

            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}
            >
              <MaterialIcons name="search" size={20} color="#FFFFFF" />
              <Text style={styles.searchButtonText}>Tìm kiếm</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={routes}
        renderItem={renderRouteCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={
          routes.length === 0 ? styles.emptyListContainer : styles.listContainer
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <MaterialIcons 
                name={pickupLocation && destinationLocation ? "search-off" : "search"} 
                size={80} 
                color="#E5E7EB" 
              />
              <Text style={styles.emptyText}>
                {pickupLocation && destinationLocation 
                  ? "Không tìm thấy chuyến đi" 
                  : "Tìm kiếm chuyến đi cố định"}
              </Text>
              <Text style={styles.emptySubtext}>
                {pickupLocation && destinationLocation
                  ? "Không có chuyến đi nào phù hợp với tuyến đường của bạn vào ngày hôm nay"
                  : "Nhập điểm đón và điểm đến để tìm chuyến đi phù hợp"}
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#004553",
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  searchIconButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  searchFormContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#D1D5DB",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchForm: {
    padding: 16,
  },
  searchFormTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.dark,
    marginBottom: 16,
  },
  searchInputSection: {
    marginBottom: 16,
    zIndex: 1,
  },
  searchLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.dark,
    marginBottom: 8,
  },
  searchButton: {
    backgroundColor: "#004553",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
    padding: 16,
  },
  routeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  routeNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  routeName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginLeft: 8,
    flex: 1,
  },
  priceTag: {
    backgroundColor: "#004553",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    marginRight: 12,
  },
  locationContent: {
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  locationLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#D1D5DB",
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
    marginLeft: 4,
  },
  driverInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  driverName: {
    fontSize: 13,
    color: "#6B7280",
    flex: 1,
    marginLeft: 6,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  ratingBadgeText: {
    fontSize: 14,
    color: "#C2410C",
    fontWeight: "700",
    marginLeft: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  ratingText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    marginLeft: 2,
  },
  joinButton: {
    backgroundColor: "#004553",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  joinButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  joinButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.dark,
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 8,
    textAlign: "center",
  },
});

export default FixedRoutesScreen;
