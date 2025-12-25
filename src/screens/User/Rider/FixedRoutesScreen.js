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
import { LinearGradient } from "expo-linear-gradient";
import COLORS from "../../../constant/colors";
import fixedRouteService from "../../../services/fixedRouteService";
import routeBookingService from "../../../services/routeBookingService";
import Toast from "react-native-toast-message";
import LocationSearch from "../../../components/LocationSearch";
import GradientHeader from "../../../components/GradientHeader";
import SnowEffect from "../../../components/SnowEffect";
import { supabase } from "../../../config/supabaseClient";
import AsyncStorageService from "../../../services/AsyncStorageService";
import SCREENS from "../../../screens";

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

  // 🔔 Realtime listener for match updates (when driver starts trip)
  useEffect(() => {
    let channel;

    const setupRealtimeListener = async () => {
      const user = await AsyncStorageService.getUser();
      if (!user?.id || !supabase) return;

      console.log(
        "🔔 FixedRoutesScreen: Setting up MATCH listener for passenger:",
        user.id
      );

      channel = supabase
        .channel(`public:matches:passenger_id=eq.${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "matches",
            filter: `passenger_id=eq.${user.id}`,
          },
          (payload) => {
            const newMatch = payload.new;
            console.log(
              "🔔 FixedRoutesScreen: Received MATCH update:",
              newMatch?.status
            );

            if (
              newMatch &&
              (newMatch.status === "IN_PROGRESS" ||
                newMatch.status === "ACCEPTED" ||
                newMatch.status === "DRIVER_ARRIVED")
            ) {
              console.log(
                `🚀 Match ${newMatch.id} is ${newMatch.status}. Navigating from FixedRoutesScreen...`
              );

              if (newMatch.status === "IN_PROGRESS") {
                Alert.alert(
                  "Chuyến đi bắt đầu",
                  "Tài xế đã bắt đầu chuyến đi!"
                );
              }

              navigation.navigate(SCREENS.MATCHED_RIDE, {
                rideId: newMatch.id,
              });
            }
          }
        )
        .subscribe();
    };

    setupRealtimeListener();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [navigation]);

  const searchRoutes = async () => {
    try {
      setLoading(true);
      const today = getLocalDateString(); // YYYY-MM-DD (local timezone)
      const searchDate = today; // Use today for now, can be extended to support date picker
      const response = await fixedRouteService.searchRoutes({
        pickupLatitude: pickupLocation.latitude,
        pickupLongitude: pickupLocation.longitude,
        dropoffLatitude: destinationLocation.latitude,
        dropoffLongitude: destinationLocation.longitude,
        pickupAddress: pickupAddress,
        dropoffAddress: destinationAddress,
        numberOfSeats: 1,
        travelDate: searchDate,
      });

      // Handle ApiResponse wrapper
      const routesData = response?.data?.data ?? response?.data ?? [];
      const routesList = Array.isArray(routesData) ? routesData : [];

      // Filter only routes for the search date (not today, but the date being searched)
      // This ensures that if user searches for tomorrow, they won't see today's routes (even 22h, 23h)
      const searchDateStr = searchDate; // YYYY-MM-DD format
      console.log(
        `🔍 Filtering routes for date: ${searchDateStr}, Total routes: ${routesList.length}`
      );
      const filteredRoutes = routesList.filter((route) => {
        // Must have specificDates to be shown
        if (!route.specificDates) {
          console.log(`Route ${route.id} filtered out: No specificDates`);
          return false;
        }

        try {
          // Handle both string and Date object formats
          let routeDateStr;
          if (typeof route.specificDates === "string") {
            // Extract YYYY-MM-DD from ISO string (e.g., "2025-12-25T00:00:00" -> "2025-12-25")
            // Also handle simple date strings like "2025-12-25"
            routeDateStr = route.specificDates.split("T")[0].split(" ")[0];
          } else {
            // Date object - convert to YYYY-MM-DD using local timezone (not UTC)
            const date = new Date(route.specificDates);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            routeDateStr = `${year}-${month}-${day}`;
          }

          // Strict comparison: only show routes that match the exact search date
          // This prevents showing today's routes (22h, 23h) when searching for tomorrow
          const matches = routeDateStr === searchDateStr;

          if (!matches) {
            console.log(
              `❌ Route ${
                route.id
              } filtered out: routeDate=${routeDateStr}, searchDate=${searchDateStr}, specificDates=${JSON.stringify(
                route.specificDates
              )}`
            );
          } else {
            console.log(
              `✅ Route ${route.id} matches: routeDate=${routeDateStr}, searchDate=${searchDateStr}`
            );
          }

          return matches;
        } catch (error) {
          console.warn(
            `⚠️ Error parsing route date for route ${route.id}:`,
            route.specificDates,
            error
          );
          return false;
        }
      });

      console.log(
        "🔍 Fixed Routes Response:",
        `Total: ${routesList.length}, Filtered: ${filteredRoutes.length} for date ${searchDateStr}`
      );

      // Debug: Log all routes to see what we're working with
      if (routesList.length > 0) {
        console.log(
          "📋 All routes received:",
          routesList.map((r) => ({
            id: r.id,
            routeName: r.routeName,
            specificDates: r.specificDates,
            type: typeof r.specificDates,
          }))
        );
      }

      if (filteredRoutes.length > 0) {
        console.log(
          "✅ Matching routes:",
          filteredRoutes.map((r) => ({ id: r.id, date: r.specificDates }))
        );
      } else if (routesList.length > 0) {
        console.log("⚠️ No routes matched the filter - all were filtered out");
      }

      setRoutes(filteredRoutes);
    } catch (error) {
      console.error("Error searching routes:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.response?.data?.message || "Không thể tìm kiếm chuyến đi",
      });
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAllRoutes = async () => {
    try {
      setLoading(true);
      const response = await fixedRouteService.getAllActiveRoutes();
      // Handle ApiResponse wrapper
      const routesData = response?.data?.data ?? response?.data ?? [];
      const routesList = Array.isArray(routesData) ? routesData : [];

      // Filter only routes for today (using local date)
      const todayStr = getLocalDateString(); // YYYY-MM-DD format (local timezone)
      const todayRoutes = routesList.filter((route) => {
        // Check if route has specificDates matching today
        if (route.specificDates) {
          try {
            // Handle both string and Date object formats
            let routeDateStr;
            if (typeof route.specificDates === "string") {
              // Extract YYYY-MM-DD from ISO string
              routeDateStr = route.specificDates.split("T")[0];
            } else {
              // Date object - convert to YYYY-MM-DD using local timezone (not UTC)
              const date = new Date(route.specificDates);
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, "0");
              const day = String(date.getDate()).padStart(2, "0");
              routeDateStr = `${year}-${month}-${day}`;
            }
            // Only show routes that match today's date exactly
            return routeDateStr === todayStr;
          } catch (error) {
            console.warn(
              "Error parsing route date:",
              route.specificDates,
              error
            );
            return false;
          }
        }
        // If no specificDates, don't show the route
        return false;
      });

      setRoutes(todayRoutes);
    } catch (error) {
      console.error("Error loading routes:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2:
          error.response?.data?.message || "Không thể tải danh sách chuyến đi",
      });
      setRoutes([]);
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

  // Helper function to get local date in YYYY-MM-DD format (not UTC)
  // This avoids timezone issues where UTC date might be previous day
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
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
    if (!timeString) return "--:--";
    try {
      const timeStr = String(timeString);
      const [hours, minutes] = timeStr.split(":");
      if (hours && minutes) {
        return `${hours}:${minutes}`;
      }
      return "--:--";
    } catch (error) {
      return "--:--";
    }
  };

  const formatDistance = (distance) => {
    if (!distance || distance === 0 || isNaN(Number(distance))) return "0km";

    const dist = Number(distance);
    // Check if distance is already in km (> 100 likely means it's in meters)
    if (dist > 100) {
      // Assume it's in meters
      if (dist < 1000) {
        return `${Math.round(dist)}m`;
      }
      return `${(dist / 1000).toFixed(1)}km`;
    } else {
      // Assume it's already in km
      return `${dist.toFixed(1)}km`;
    }
  };

  const handleBooking = async (item) => {
    if (item.availableSeats <= 0) {
      Alert.alert("Thông báo", "Chuyến đi này đã hết chỗ");
      return;
    }

    try {
      setBookingLoading(item.id); // Set loading state for this specific route
      // Use local date instead of UTC to avoid timezone issues
      // If user is in UTC+7 and it's 6:39 AM, UTC would be 11:39 PM previous day
      const today = getLocalDateString(); // YYYY-MM-DD format (local timezone)
      console.log("📅 Booking date (local):", today);
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
    if (!item) {
      return null;
    }

    const totalSeats = Number(item.totalSeats) || 0;
    const availableSeats = Number(item.availableSeats) || 0;
    const bookedSeats = totalSeats - availableSeats;
    const seatPercentage =
      totalSeats > 0 ? (bookedSeats / totalSeats) * 100 : 0;
    const isAvailable = availableSeats > 0;

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
      hasRating && typeof driverRating === "number" && !isNaN(driverRating)
        ? driverRating.toFixed(1)
        : hasRating
        ? String(driverRating)
        : "";

    return (
      <View style={styles.routeCard}>
        <View style={styles.cardHeader}>
          <View style={styles.routeNameRow}>
            <MaterialIcons name="directions-bus" size={20} color="#FF5370" />
            <Text style={styles.routeName} numberOfLines={1}>
              {item?.routeName ? String(item.routeName || "") : "Chuyến đi"}
            </Text>
          </View>
          {item?.pricePerSeat != null && Number(item.pricePerSeat) > 0 && (
            <View style={styles.priceTag}>
              <Text style={styles.priceValue}>
                {`${Number(item.pricePerSeat).toLocaleString("vi-VN")}đ`}
              </Text>
            </View>
          )}
        </View>

        {/* Pickup Location */}
        <View style={styles.locationRow}>
          <View style={[styles.locationDot, { backgroundColor: "#FF5370" }]} />
          <View style={styles.locationContent}>
            <Text style={styles.locationText} numberOfLines={1}>
              {item.pickupAddress
                ? String(item.pickupAddress)
                : "Chưa có thông tin"}
            </Text>
            <Text style={styles.locationLabel}>Pickup point</Text>
          </View>
        </View>

        {/* Destination Location */}
        <View style={styles.locationRow}>
          <View style={[styles.locationDot, { backgroundColor: "#FF6B6B" }]} />
          <View style={styles.locationContent}>
            <Text style={styles.locationText} numberOfLines={1}>
              {item.dropoffAddress
                ? String(item.dropoffAddress)
                : "Chưa có thông tin"}
            </Text>
            <Text style={styles.locationLabel}>Destination</Text>
          </View>
        </View>

        {/* Info Row: Time, Seats, Distance */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <MaterialIcons name="schedule" size={16} color="#6B7280" />
            <Text style={styles.infoText}>
              {formatTime(item.departureTime)}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="event-seat" size={16} color="#6B7280" />
            <Text style={styles.infoText}>
              {`${availableSeats}/${totalSeats}`}
            </Text>
          </View>
          {item.distance != null && item.distance !== undefined && (
            <View style={styles.infoItem}>
              <MaterialIcons name="straighten" size={16} color="#6B7280" />
              <Text style={styles.infoText}>
                {formatDistance(item.distance)}
              </Text>
            </View>
          )}
        </View>

        {/* Driver Info with Rating */}
        <View style={styles.driverInfoContainer}>
          {!!(item.driverName || item.driver?.name) && (
            <View style={styles.driverRow}>
              <MaterialIcons name="person" size={16} color="#6B7280" />
              <Text style={styles.driverName}>
                {String(item.driverName || item.driver?.name || "Tài xế")}
              </Text>
            </View>
          )}
          {hasRating && ratingText && ratingText.trim() !== "" && (
            <View style={styles.ratingBadge}>
              <MaterialIcons name="star" size={16} color="#FFA726" />
              <Text style={styles.ratingBadgeText}>{String(ratingText)}</Text>
            </View>
          )}
        </View>

        {/* Join Button */}
        <TouchableOpacity
          style={[
            styles.joinButton,
            (!isAvailable || bookingLoading === item.id) &&
              styles.joinButtonDisabled,
          ]}
          onPress={() => handleBooking(item)}
          disabled={!isAvailable || bookingLoading === item.id}
        >
          {bookingLoading === item.id ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : !isAvailable ? (
            <View style={styles.joinButtonDisabled}>
              <MaterialIcons name="block" size={20} color="#FFFFFF" />
              <Text style={styles.joinButtonText}>Hết chỗ</Text>
            </View>
          ) : (
            <LinearGradient
              colors={["#FF5370", "#FF6B9D", "#FF8FAB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.joinButtonGradient}
            >
              <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
              <Text style={styles.joinButtonText}>Yêu cầu tham gia</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF5370" />
        <Text style={styles.loadingText}>Đang tìm kiếm chuyến đi...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <SnowEffect />
      <GradientHeader
        title="📍 Tìm chuyến đi cố định"
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
      />

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
              <LinearGradient
                colors={["#FF5370", "#FF6B9D", "#FF8FAB"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.searchButtonGradient}
              >
                <MaterialIcons name="search" size={20} color="#FFFFFF" />
                <Text style={styles.searchButtonText}>Tìm kiếm</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={routes}
        renderItem={renderRouteCard}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={
          routes.length === 0 ? styles.emptyListContainer : styles.listContainer
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons
                name={
                  pickupLocation && destinationLocation
                    ? "search-off"
                    : "search"
                }
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
          ) : null
        }
        nestedScrollEnabled={true}
        removeClippedSubviews={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF5F7",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF5F7",
  },
  searchFormContainer: {
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 2,
    borderBottomColor: "#FFE5EC",
    elevation: 2,
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchForm: {
    padding: 16,
  },
  searchFormTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FF5370",
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
    borderRadius: 16,
    marginTop: 8,
    overflow: "hidden",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  searchButtonGradient: {
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
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
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#FFE5EC",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
    backgroundColor: "#FF5370",
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
    borderRadius: 16,
    marginTop: 4,
    overflow: "hidden",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  joinButtonGradient: {
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  joinButtonDisabled: {
    backgroundColor: "#9CA3AF",
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
