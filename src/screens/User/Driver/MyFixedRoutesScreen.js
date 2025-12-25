import React, { useState, useEffect, useCallback } from "react";
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
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import COLORS from "../../../constant/colors";
import fixedRouteService from "../../../services/fixedRouteService";
import routeBookingService from "../../../services/routeBookingService";
import { getMatchDetail } from "../../../services/matchService";
import Toast from "react-native-toast-message";
import axiosClient from "../../../api/axiosClient";
import endpoints from "../../../api/endpoints";
import GradientHeader from "../../../components/GradientHeader";
import SnowEffect from "../../../components/SnowEffect";

/**
 * Screen for drivers to view and manage their fixed routes
 */
const MyFixedRoutesScreen = ({ navigation }) => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadMyRoutes();
    }, [])
  );

  const loadMyRoutes = async () => {
    try {
      setLoading(true);
      const response = await fixedRouteService.getMyRoutes();
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
    await loadMyRoutes();
    setRefreshing(false);
  };

  const handleDeleteRoute = (routeId) => {
    Alert.alert("Xác nhận xóa", "Bạn có chắc muốn xóa chuyến đi này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => confirmDelete(routeId),
      },
    ]);
  };

  const confirmDelete = async (routeId) => {
    try {
      await fixedRouteService.deleteRoute(routeId);
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Đã xóa chuyến đi",
      });
      loadMyRoutes();
    } catch (error) {
      console.error("Error deleting route:", error);
      Alert.alert("Lỗi", "Không thể xóa chuyến đi");
    }
  };

  const handleToggleStatus = async (routeId, currentStatus) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await fixedRouteService.updateRouteStatus(routeId, newStatus);
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: `Đã ${
          newStatus === "ACTIVE" ? "kích hoạt" : "tạm dừng"
        } chuyến đi`,
      });
      loadMyRoutes();
    } catch (error) {
      console.error("Error updating status:", error);
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái");
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    return `${hours}:${minutes}`;
  };

  const formatDistance = (meters) => {
    if (!meters) return "";
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const renderRouteCard = ({ item }) => {
    // Always display date if specificDates exists
    const displayDate = item.specificDates || null;
    const isActive = item.status === "ACTIVE";
    // Always count driver as +1 (driver is always included)
    const bookedSeats = item.totalSeats - item.availableSeats + 1;
    const seatPercentage = (bookedSeats / item.totalSeats) * 100;

    // Debug log
    console.log("Route item:", {
      id: item.id,
      specificDates: item.specificDates,
      displayDate: displayDate,
    });

    return (
      <TouchableOpacity
        style={styles.routeCard}
        activeOpacity={0.95}
        onPress={() =>
          navigation.navigate("RouteBookingsScreen", { routeId: item.id })
        }
      >
        {/* Card Header with Gradient */}
        <LinearGradient
          colors={
            isActive
              ? ["#FF5370", "#FF6B9D", "#FF8FAB"]
              : ["#9E9E9E", "#757575"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardHeader}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <MaterialIcons name="route" size={24} color="#FFF" />
              <Text style={styles.routeName} numberOfLines={1}>
                {item.routeName}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                isActive
                  ? styles.statusActiveGradient
                  : styles.statusInactiveGradient,
              ]}
            >
              <View
                style={[styles.statusDot, isActive && styles.statusDotPulse]}
              />
              <Text style={styles.statusText}>
                {isActive ? "Hoạt động" : "Tạm dừng"}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Card Body */}
        <View style={styles.cardBody}>
          {/* Route Path with Enhanced Timeline */}
          <View style={styles.routePathContainer}>
            <View style={styles.timelineContainer}>
              <View style={styles.pickupDotContainer}>
                <View style={styles.pickupDot}>
                  <MaterialIcons name="my-location" size={10} color="#FFF" />
                </View>
              </View>
              <View style={styles.timelineLine}>
                <View style={styles.timelineDash} />
              </View>
              <View style={styles.dropoffDotContainer}>
                <View style={styles.dropoffDot}>
                  <MaterialIcons name="place" size={10} color="#FFF" />
                </View>
              </View>
            </View>
            <View style={styles.addressesContainer}>
              <View style={styles.addressRow}>
                <View style={styles.addressLabelContainer}>
                  <Text style={styles.addressLabel}>Điểm đón</Text>
                </View>
                <Text style={styles.addressText} numberOfLines={2}>
                  {item.pickupAddress}
                </Text>
              </View>
              <View style={styles.addressSpacer} />
              <View style={styles.addressRow}>
                <View style={styles.addressLabelContainer}>
                  <Text style={styles.addressLabel}>Điểm đến</Text>
                </View>
                <Text style={styles.addressText} numberOfLines={2}>
                  {item.dropoffAddress}
                </Text>
              </View>
            </View>
          </View>

          {/* Info Grid */}
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <MaterialIcons name="event" size={18} color="#FF5370" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Ngày</Text>
                <Text style={styles.infoValue}>
                  {displayDate ? formatDate(displayDate) : "Chưa có"}
                </Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <MaterialIcons name="schedule" size={18} color="#FF5370" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Giờ khởi hành</Text>
                <Text style={styles.infoValue}>
                  {formatTime(item.departureTime)}
                </Text>
              </View>
            </View>
          </View>

          {/* Seat Progress */}
          <View style={styles.seatSection}>
            <View style={styles.seatHeader}>
              <View style={styles.seatIconTextContainer}>
                <MaterialIcons name="event-seat" size={18} color="#FF5370" />
                <Text style={styles.seatLabel}>Tình trạng chỗ ngồi</Text>
              </View>
              <Text style={styles.seatCount}>
                {bookedSeats}/{item.totalSeats}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${seatPercentage}%`,
                    backgroundColor:
                      seatPercentage >= 90
                        ? "#ef4444"
                        : seatPercentage >= 70
                        ? "#f59e0b"
                        : "#10b981",
                  },
                ]}
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButtonPrimary}
              onPress={() =>
                navigation.navigate("RouteBookingsScreen", { routeId: item.id })
              }
            >
              <LinearGradient
                colors={["#FF5370", "#FF6B9D", "#FF8FAB"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <MaterialIcons name="people" size={20} color="#FFF" />
                <Text style={styles.actionButtonTextPrimary}>Xem đặt chỗ</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButtonStart}
              onPress={async () => {
                console.log(
                  "🚀🚀🚀 BUTTON 'BẮT ĐẦU' CLICKED for route:",
                  item.id,
                  item.routeName
                );
                try {
                  Toast.show({
                    type: "info",
                    text1: "Đang xử lý...",
                  });

                  // 1. Check if there are any ACCEPTED or IN_PROGRESS bookings for this route first
                  console.log(
                    "📋 Step 1: Checking bookings for route:",
                    item.id
                  );
                  let acceptedBooking = null;
                  let inProgressBooking = null;
                  try {
                    const bookingsResponse =
                      await routeBookingService.getBookingsByRoute(item.id);
                    // Backend returns ApiResponse with data as array
                    const bookings = bookingsResponse?.data || [];
                    console.log("📋 Full bookings response:", bookingsResponse);
                    console.log("📋 Bookings for route:", bookings);
                    console.log(
                      "📋 Booking statuses:",
                      bookings.map((b) => ({
                        id: b.id,
                        status: b.status,
                        matchId: b.matchId,
                      }))
                    );
                    // Find first accepted booking (check both uppercase and case-insensitive)
                    acceptedBooking = bookings.find(
                      (b) =>
                        b.status === "ACCEPTED" ||
                        b.status?.toUpperCase() === "ACCEPTED"
                    );
                    // Also check for IN_PROGRESS booking with matchId (already started)
                    inProgressBooking = bookings.find(
                      (b) =>
                        (b.status === "IN_PROGRESS" ||
                          b.status?.toUpperCase() === "IN_PROGRESS") &&
                        b.matchId
                    );
                    if (acceptedBooking) {
                      console.log(
                        "✅ Found ACCEPTED booking:",
                        acceptedBooking.id,
                        "Status:",
                        acceptedBooking.status
                      );
                    } else if (inProgressBooking) {
                      console.log(
                        "✅ Found IN_PROGRESS booking with match:",
                        inProgressBooking.id,
                        "MatchId:",
                        inProgressBooking.matchId
                      );
                    } else {
                      console.log(
                        "⚠️ No ACCEPTED or IN_PROGRESS booking found, will use personal ride"
                      );
                    }
                  } catch (err) {
                    console.log("❌ Error checking bookings:", err);
                    // Ignore error and proceed to personal ride check
                  }

                  // 2. If there is an ACCEPTED or IN_PROGRESS booking -> Start Route Trip (to ensure match is published)
                  // Priority: ACCEPTED first, then IN_PROGRESS
                  const bookingToStart = acceptedBooking || inProgressBooking;

                  if (bookingToStart) {
                    const bookingStatus = bookingToStart.status;
                    console.log(
                      `🚀🚀🚀 Starting trip for ${bookingStatus} booking:`,
                      bookingToStart.id,
                      "Status:",
                      bookingStatus
                    );
                    try {
                      console.log(
                        "📤 Calling routeBookingService.startTrip with bookingId:",
                        bookingToStart.id
                      );
                      const response = await routeBookingService.startTrip(
                        bookingToStart.id
                      );
                      console.log("✅ startTrip response received:", response);

                      if (response.data) {
                        const bookingData = response.data;
                        const matchId =
                          bookingData.matchId ||
                          (bookingData.match ? bookingData.match.id : null);

                        if (matchId) {
                          // Fetch full match data to get all coordinates and addresses
                          try {
                            const matchResponse = await getMatchDetail(matchId);
                            const matchData = matchResponse?.data?.data;

                            if (matchData) {
                              // Navigate to MatchedRideScreen with full match data
                              navigation.navigate("MatchedRide", {
                                // Match info
                                id: matchData.id,
                                rideId: matchData.id,
                                status: matchData.status,

                                // Coordinates
                                pickupLatitude: matchData.pickupLatitude,
                                pickupLongitude: matchData.pickupLongitude,
                                destinationLatitude:
                                  matchData.destinationLatitude,
                                destinationLongitude:
                                  matchData.destinationLongitude,

                                // Addresses
                                pickupAddress: matchData.pickupAddress,
                                destinationAddress:
                                  matchData.destinationAddress,
                                from: matchData.pickupAddress,
                                to: matchData.destinationAddress,

                                // Driver (Me)
                                isDriver: true,
                                driverId: matchData.driverId,
                                currentUserId: matchData.driverId,

                                // Passenger
                                passengerId: matchData.passengerId,
                                passengerName: matchData.passengerName,
                                passengerPhone: matchData.passengerPhone,

                                // Session
                                sessionId: matchData.sessionId,
                              });

                              Toast.show({
                                type: "success",
                                text1: "Chuyến đi đã bắt đầu",
                                text2: "Đang điều hướng đến bản đồ...",
                              });
                            } else {
                              // Fallback: navigate with just matchId
                              navigation.navigate("MatchedRide", {
                                rideId: matchId,
                                isDriver: true,
                              });
                            }
                          } catch (matchError) {
                            console.error(
                              "Error fetching match details:",
                              matchError
                            );
                            // Fallback: navigate with just matchId
                            navigation.navigate("MatchedRide", {
                              rideId: matchId,
                              isDriver: true,
                            });
                          }
                        } else {
                          Toast.show({
                            type: "success",
                            text1: "Chuyến đi đã bắt đầu",
                            text2: "Vui lòng kiểm tra màn hình điều hướng",
                          });
                        }
                        return; // Stop here, don't create personal ride
                      } else {
                        console.error(
                          "❌ startTrip response has no data:",
                          response
                        );
                      }
                    } catch (startTripError) {
                      console.error(
                        "❌❌❌ ERROR calling startTrip:",
                        startTripError
                      );
                      console.error(
                        "Error details:",
                        startTripError.response?.data || startTripError.message
                      );
                      Toast.show({
                        type: "error",
                        text1: "Lỗi khi bắt đầu chuyến đi",
                        text2:
                          startTripError.response?.data?.message ||
                          startTripError.message,
                      });
                      return;
                    }
                  } else {
                    console.log(
                      "⚠️ No ACCEPTED booking found, will check for personal ride"
                    );
                  }

                  // 3. If NO accepted booking -> Start Personal Ride (original logic)
                  // Call API to start personal ride based on fixed route
                  const payload = {
                    pickupLatitude: item.pickupLatitude || 0,
                    pickupLongitude: item.pickupLongitude || 0,
                    pickupAddress: item.pickupAddress,
                    destinationLatitude: item.dropoffLatitude || 0,
                    destinationLongitude: item.dropoffLongitude || 0,
                    destinationAddress: item.dropoffAddress,
                    passengerName: item.passengerName || "Khách vãng lai",
                    passengerPhone: item.passengerPhone || "",
                    passengerId: null, // No passenger for personal/empty ride
                    // fixedRouteId: item.id
                  };

                  const response = await axiosClient.post(
                    endpoints.driver.personalRide,
                    payload
                  );

                  if (response.data?.statusCode === 200) {
                    const matchData = response.data.data;

                    // Navigate to MatchedRideScreen
                    navigation.navigate("MatchedRide", {
                      id: matchData.id,
                      rideId: matchData.id,
                      status: matchData.status,
                      pickupLatitude: matchData.pickupLatitude,
                      pickupLongitude: matchData.pickupLongitude,
                      destinationLatitude: matchData.destinationLatitude,
                      destinationLongitude: matchData.destinationLongitude,
                      pickupAddress: matchData.pickupAddress,
                      destinationAddress: matchData.destinationAddress,
                      from: matchData.pickupAddress,
                      to: matchData.destinationAddress,
                      isDriver: true,
                      driverId: matchData.driverId,
                      currentUserId: matchData.driverId,
                      passengerId: matchData.riderId,
                      passengerName: matchData.riderName,
                      passengerPhone: matchData.riderPhone,
                      sessionId: matchData.sessionId,
                    });
                  }
                } catch (error) {
                  console.error("❌ Start ride error:", error);
                  Toast.show({
                    type: "error",
                    text1: "Không thể bắt đầu chuyến đi",
                    text2: error.response?.data?.message || "Vui lòng thử lại",
                  });
                }
              }}
            >
              <LinearGradient
                colors={["#10b981", "#059669"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <MaterialIcons name="play-arrow" size={20} color="#FFF" />
                <Text style={styles.actionButtonTextPrimary}>Bắt đầu</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButtonSecondary}
              onPress={() => handleDeleteRoute(item.id)}
            >
              <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF5370" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <SnowEffect />
      <GradientHeader
        title="🚗 Chuyến đi của tôi"
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
        onRightPress={() => navigation.navigate("CreateFixedRouteScreen")}
        rightIcon="add"
      />

      {routes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <MaterialIcons name="route" size={80} color="#E0E0E0" />
          </View>
          <Text style={styles.emptyText}>Chưa có chuyến đi nào</Text>
          <Text style={styles.emptySubtext}>
            Tạo chuyến đi cố định để bắt đầu nhận khách
          </Text>
          <TouchableOpacity
            style={styles.createButtonEmpty}
            onPress={() => navigation.navigate("CreateFixedRouteScreen")}
          >
            <LinearGradient
              colors={[COLORS.PRIMARY, "#006B7D"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createButtonGradient}
            >
              <MaterialIcons name="add" size={24} color="#FFF" />
              <Text style={styles.createButtonText}>Tạo chuyến đi</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={routes}
          renderItem={renderRouteCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#FF5370"]}
              tintColor="#FF5370"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 8,
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
    letterSpacing: 0.5,
  },
  addButton: {
    padding: 4,
  },
  addButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  routeCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FFE5EC",
    elevation: 4,
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cardHeader: {
    padding: 16,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  routeName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
    marginLeft: 12,
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  statusActiveGradient: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  statusInactiveGradient: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFF",
    marginRight: 6,
  },
  statusDotPulse: {
    backgroundColor: "#4ade80",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardBody: {
    padding: 16,
  },
  routePathContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  timelineContainer: {
    alignItems: "center",
    marginRight: 16,
    paddingTop: 2,
  },
  pickupDotContainer: {
    padding: 4,
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
  },
  pickupDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FF5370",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  timelineLine: {
    width: 3,
    flex: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 6,
    borderRadius: 2,
    overflow: "hidden",
  },
  timelineDash: {
    width: "100%",
    height: "50%",
    backgroundColor: "#FF5370",
  },
  dropoffDotContainer: {
    padding: 4,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
  },
  dropoffDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addressesContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  addressRow: {
    flex: 1,
  },
  addressSpacer: {
    height: 12,
  },
  addressLabelContainer: {
    marginBottom: 6,
  },
  addressLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  addressText: {
    fontSize: 14,
    color: "#1F2937",
    lineHeight: 20,
    fontWeight: "500",
  },
  infoGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: "#1F2937",
    fontWeight: "700",
  },
  seatSection: {
    backgroundColor: "#F9FAFB",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  seatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  seatIconTextContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  seatLabel: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "600",
    marginLeft: 8,
  },
  seatCount: {
    fontSize: 15,
    color: "#1F2937",
    fontWeight: "700",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  availableSeatsText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    textAlign: "center",
  },
  dateBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 16,
  },
  dateBadgeText: {
    fontSize: 13,
    color: "#FF5370",
    fontWeight: "700",
    marginLeft: 6,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  actionButtonPrimary: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  actionButtonTextPrimary: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  actionButtonSecondary: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  actionButtonStart: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  createButtonEmpty: {
    marginTop: 32,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  createButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
    marginLeft: 10,
    letterSpacing: 0.5,
  },
});

export default MyFixedRoutesScreen;
