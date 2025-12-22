import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import COLORS from "../../constant/colors";
import { getMatchDetail } from "../../services/matchService";
import { getProfile } from "../../services/userService";

const RideDetail = ({ route, navigation }) => {
  const { rideId } = route.params;
  const [loading, setLoading] = useState(true);
  const [ride, setRide] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const normalizeRideDetail = (raw) => {
      const status =
        raw?.status ??
        raw?.matchStatus ??
        raw?.rideStatus ??
        raw?.state ??
        "UNKNOWN";

      const pickupAddress =
        raw?.pickupAddress ??
        raw?.pickup_address ??
        raw?.startLocation ??
        raw?.from ??
        "Điểm đón";
      const destinationAddress =
        raw?.destinationAddress ??
        raw?.destination_address ??
        raw?.endLocation ??
        raw?.to ??
        "Điểm đến";

      // Use coin instead of price
      const coinRaw =
        raw?.coin ??
        raw?.coins ??
        raw?.price ??
        raw?.estimatedPrice ??
        raw?.fare ??
        0;
      const coin = typeof coinRaw === "number" ? coinRaw : Number(coinRaw) || 0;

      const distanceRaw =
        raw?.distance ?? raw?.distanceMeters ?? raw?.distance_meters ?? 0;
      const distance =
        typeof distanceRaw === "number"
          ? distanceRaw
          : Number(distanceRaw) || 0;

      const durationRaw =
        raw?.duration ??
        raw?.durationMinutes ??
        raw?.estimatedDuration ??
        raw?.estimatedDurationMinutes ??
        0;
      const duration =
        typeof durationRaw === "number"
          ? durationRaw
          : Number(durationRaw) || 0;

      const createdAt =
        raw?.createdAt ??
        raw?.created_at ??
        raw?.createdDate ??
        raw?.created_date ??
        new Date().toISOString();

      // Parse driver info from multiple possible sources
      const driverId = raw?.driverId ?? raw?.driver?.id;
      const driverName =
        raw?.driverName ?? raw?.driver?.fullName ?? raw?.driver?.name;
      const driverPhone =
        raw?.driverPhone ?? raw?.driver?.phoneNumber ?? raw?.driver?.phone;
      const driverAvatar =
        raw?.driverAvatar ??
        raw?.driver?.profilePictureUrl ??
        raw?.driver?.avatar;
      const driverRating = raw?.driverRating ?? raw?.driver?.rating;

      // Parse passenger info (less info available in MatchResponse)
      const passengerId = raw?.passengerId ?? raw?.passenger?.id;
      const passengerName =
        raw?.passengerName ?? raw?.passenger?.fullName ?? raw?.passenger?.name;
      const passengerPhone =
        raw?.passengerPhone ??
        raw?.passenger?.phoneNumber ??
        raw?.passenger?.phone;
      const passengerAvatar =
        raw?.passengerAvatar ??
        raw?.passenger?.profilePictureUrl ??
        raw?.passenger?.avatar;
      // Note: passengerRating exists in MatchResponse but we don't show it

      // Parse vehicle info
      const vehicleModel = raw?.vehicleModel ?? raw?.vehicle?.model;
      const vehicleMake = raw?.vehicle?.make ?? "";
      const vehicleColor = raw?.vehicle?.color ?? "";
      const licensePlate = raw?.licensePlate ?? raw?.vehicle?.licensePlate;
      const vehicleInfo = raw?.vehicleInfo;

      const driver = driverId
        ? {
            id: driverId,
            name: driverName ?? "Tài xế",
            phone: driverPhone ?? "",
            avatar: driverAvatar,
            rating: driverRating ?? 0,
            vehicle:
              vehicleModel || licensePlate || vehicleInfo
                ? {
                    brand: vehicleMake,
                    model: vehicleModel ?? "",
                    color: vehicleColor,
                    licensePlate: licensePlate ?? "",
                    info: vehicleInfo,
                  }
                : null,
          }
        : null;

      const passenger = passengerId
        ? {
            id: passengerId,
            name: passengerName ?? "Khách hàng",
            phone: passengerPhone ?? "",
            avatar: passengerAvatar,
            // Don't include rating for passenger
          }
        : null;

      return {
        id: raw?.id ?? rideId,
        passengerId,
        driverId,
        status,
        pickupAddress,
        destinationAddress,
        coin,
        distance,
        duration,
        createdAt,
        driver,
        passenger,
        messages: raw?.messages ?? [],
      };
    };

    const fetchDetail = async () => {
      try {
        setLoading(true);

        // Fetch user profile to get current user ID
        const profileResp = await getProfile();
        const userData = profileResp?.data?.data ?? profileResp?.data;
        if (isMounted) setCurrentUserId(userData?.id);

        const resp = await getMatchDetail(rideId);
        const payload = resp?.data?.data ?? resp?.data ?? null;
        const normalized = normalizeRideDetail(payload);
        if (isMounted) setRide(normalized);
      } catch (err) {
        console.warn("Failed to load ride detail:", err?.message);
        if (isMounted) setRide(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetail();

    return () => {
      isMounted = false;
    };
  }, [rideId]);

  const getStatusColor = (status) => {
    switch (status) {
      case "COMPLETED":
        return COLORS.GREEN;
      case "CANCELLED":
        return COLORS.RED;
      case "IN_PROGRESS":
        return "#2196F3";
      default:
        return COLORS.GRAY;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "COMPLETED":
        return "Hoàn thành";
      case "CANCELLED":
        return "Đã hủy";
      case "IN_PROGRESS":
        return "Đang diễn ra";
      default:
        return status;
    }
  };

  const handleMessage = () => {
    if (!ride?.id) return;

    // Determine who to message based on current user role
    const isDriver = currentUserId === ride.driverId;
    const otherPerson = isDriver ? ride.passenger : ride.driver;

    if (!otherPerson) return;

    // Create unique channel ID cho mỗi cặp user (sort để đảm bảo consistency)
    const userIds = [currentUserId, otherPerson.id].sort();
    const channelId = `dm-${userIds[0]}-${userIds[1]}`;

    console.log("Opening chat:", {
      channelId,
      currentUserId,
      otherUserId: otherPerson.id,
      otherUserName: otherPerson.name,
    });

    navigation.navigate("ChatScreen", {
      channelId: channelId,
      otherUserId: otherPerson.id,
      otherUserName: otherPerson.name,
      otherUserAvatar: otherPerson.avatar,
      rideInfo: {
        from: ride.fromAddress || ride.pickupLocation,
        to: ride.toAddress || ride.dropoffLocation,
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      </SafeAreaView>
    );
  }

  if (!ride) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết chuyến đi</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={{ color: "#8E8E93" }}>
            Không thể tải chi tiết chuyến đi
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = getStatusColor(ride.status);

  // Determine if current user is the driver
  const isDriver = currentUserId === ride.driverId;
  const otherPerson = isDriver ? ride.passenger : ride.driver;
  const otherPersonLabel = isDriver
    ? "Thông tin khách hàng"
    : "Thông tin tài xế";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết chuyến đi</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <LinearGradient
            colors={[statusColor, statusColor + "CC"]}
            style={styles.statusGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons
              name={
                ride.status === "COMPLETED"
                  ? "checkmark-circle"
                  : "alert-circle"
              }
              size={48}
              color="#fff"
            />
            <Text style={styles.statusText}>{getStatusText(ride.status)}</Text>
            <Text style={styles.statusSubtext}>
              {new Date(ride.createdAt).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </LinearGradient>
        </View>

        {/* Driver/Passenger Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{otherPersonLabel}</Text>
          {otherPerson ? (
            <View style={styles.driverCard}>
              <Image
                source={{
                  uri: otherPerson.avatar || "https://i.pravatar.cc/150?img=14",
                }}
                style={styles.driverAvatar}
              />
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{otherPerson.name}</Text>
                {/* Show phone number */}
                {otherPerson.phone && (
                  <Text style={styles.phoneText}>{otherPerson.phone}</Text>
                )}
                {/* Show rating only for driver, not for passenger */}
                {!isDriver && otherPerson.rating !== undefined && (
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={16} color="#FFB800" />
                    <Text style={styles.ratingText}>{otherPerson.rating}</Text>
                  </View>
                )}
                {/* Show vehicle info only for driver */}
                {!isDriver && ride.driver?.vehicle ? (
                  <>
                    {ride.driver.vehicle.info ? (
                      <Text style={styles.vehicleText}>
                        {ride.driver.vehicle.info}
                      </Text>
                    ) : (
                      <>
                        <Text style={styles.vehicleText}>
                          {ride.driver.vehicle.brand}{" "}
                          {ride.driver.vehicle.model}
                          {ride.driver.vehicle.color
                            ? ` • ${ride.driver.vehicle.color}`
                            : ""}
                        </Text>
                        {ride.driver.vehicle.licensePlate && (
                          <Text style={styles.licensePlate}>
                            {ride.driver.vehicle.licensePlate}
                          </Text>
                        )}
                      </>
                    )}
                  </>
                ) : null}
              </View>
            </View>
          ) : (
            <View style={styles.driverCard}>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>
                  {isDriver ? "Chưa có khách hàng" : "Chưa có tài xế"}
                </Text>
                <Text style={styles.vehicleText}>
                  {isDriver
                    ? "Đang chờ khách hàng đặt chuyến."
                    : "Hệ thống đang tìm tài xế phù hợp cho chuyến đi này."}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Route Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lộ trình</Text>
          <View style={styles.routeCard}>
            <View style={styles.routeRow}>
              <View style={styles.routeIconContainer}>
                <View
                  style={[styles.routeDot, { backgroundColor: COLORS.PRIMARY }]}
                />
                <View style={styles.routeLine} />
              </View>
              <View style={styles.routeContent}>
                <Text style={styles.routeLabel}>Điểm đón</Text>
                <Text style={styles.routeAddress}>{ride.pickupAddress}</Text>
              </View>
            </View>

            <View style={styles.routeRow}>
              <View style={styles.routeIconContainer}>
                <View
                  style={[styles.routeDot, { backgroundColor: COLORS.RED }]}
                />
              </View>
              <View style={styles.routeContent}>
                <Text style={styles.routeLabel}>Điểm đến</Text>
                <Text style={styles.routeAddress}>
                  {ride.destinationAddress}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Trip Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin chuyến đi</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons
                  name="wallet-outline"
                  size={24}
                  color={COLORS.PRIMARY}
                />
                <Text style={styles.detailLabel}>Coin</Text>
                <Text style={styles.detailValue}>
                  {ride.coin ? ride.coin.toLocaleString() : "0"} coin
                </Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailItem}>
                <Ionicons
                  name="navigate-outline"
                  size={24}
                  color={COLORS.PRIMARY}
                />
                <Text style={styles.detailLabel}>Quãng đường</Text>
                <Text style={styles.detailValue}>
                  {ride.distance ? (ride.distance / 1000).toFixed(1) : "0"} km
                </Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailItem}>
                <Ionicons
                  name="time-outline"
                  size={24}
                  color={COLORS.PRIMARY}
                />
                <Text style={styles.detailLabel}>Thời gian</Text>
                <Text style={styles.detailValue}>
                  {ride.duration ? ride.duration : "0"} phút
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Messages */}
        {ride.messages && ride.messages.length > 0 && (
          <View style={styles.section}>
            <View style={styles.messagesHeader}>
              <Text style={styles.sectionTitle}>Tin nhắn</Text>
              <TouchableOpacity onPress={handleMessage}>
                <Text style={styles.viewAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.messagesCard}>
              <ScrollView
                style={styles.messagesScroll}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                {ride.messages.map((message) => (
                  <View
                    key={message.id}
                    style={[
                      styles.messageRow,
                      message.sender === "passenger" && styles.messageRowRight,
                    ]}
                  >
                    <View
                      style={[
                        styles.messageBubble,
                        message.sender === "passenger" &&
                          styles.messageBubbleRight,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          message.sender === "passenger" &&
                            styles.messageTextRight,
                        ]}
                      >
                        {message.text}
                      </Text>
                      <Text
                        style={[
                          styles.messageTime,
                          message.sender === "passenger" &&
                            styles.messageTimeRight,
                        ]}
                      >
                        {message.time}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {otherPerson && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleMessage}
            >
              <Ionicons
                name="chatbubble-outline"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.primaryButtonText}>
                {isDriver ? "Nhắn tin với khách hàng" : "Nhắn tin với tài xế"}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("Report")}
          >
            <Text style={styles.secondaryButtonText}>Báo cáo vấn đề</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
  },

  // Status Card
  statusCard: {
    margin: 20,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  statusGradient: {
    padding: 32,
    alignItems: "center",
  },
  statusText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginTop: 12,
  },
  statusSubtext: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },

  // Section
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 12,
  },

  // Driver Card
  driverCard: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  driverAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F0F0F0",
  },
  driverInfo: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  phoneText: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  vehicleText: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 4,
  },
  licensePlate: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.PRIMARY,
    marginTop: 2,
  },

  // Route Card
  routeCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  routeRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  routeIconContainer: {
    alignItems: "center",
    marginRight: 16,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  routeLine: {
    width: 2,
    height: 40,
    backgroundColor: "#E0E0E0",
    marginVertical: 4,
  },
  routeContent: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    color: "#8E8E93",
    marginBottom: 4,
  },
  routeAddress: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1C1E",
    lineHeight: 20,
  },

  // Details Card
  detailsCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  detailItem: {
    alignItems: "center",
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 8,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    marginTop: 4,
  },
  detailDivider: {
    width: 1,
    height: 60,
    backgroundColor: "#F0F0F0",
  },

  // Messages
  messagesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.PRIMARY,
  },
  messagesCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  messagesScroll: {
    maxHeight: 200,
  },
  messageRow: {
    marginBottom: 12,
    alignItems: "flex-start",
  },
  messageRowRight: {
    alignItems: "flex-end",
  },
  messageBubble: {
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 12,
    maxWidth: "80%",
  },
  messageBubbleRight: {
    backgroundColor: COLORS.PRIMARY,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    color: "#1C1C1E",
    lineHeight: 20,
  },
  messageTextRight: {
    color: "#fff",
  },
  messageTime: {
    fontSize: 11,
    color: "#8E8E93",
    marginTop: 4,
  },
  messageTimeRight: {
    color: "rgba(255,255,255,0.8)",
  },

  // Action Buttons
  actionSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  secondaryButton: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
  },
});

export default RideDetail;
