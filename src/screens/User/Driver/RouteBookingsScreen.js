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
  Linking,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import COLORS from "../../../constant/colors";
import routeBookingService from "../../../services/routeBookingService";
import Toast from "react-native-toast-message";
import GradientHeader from "../../../components/GradientHeader";
import SnowEffect from "../../../components/SnowEffect";

/**
 * Screen for drivers to view and manage bookings for a specific route
 */
const RouteBookingsScreen = ({ navigation, route }) => {
  const { routeId } = route.params;

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("ALL"); // ALL, PENDING, ACCEPTED, IN_PROGRESS

  useEffect(() => {
    loadBookings();
  }, [routeId]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await routeBookingService.getBookingsByRoute(routeId);
      setBookings(response.data || []);
    } catch (error) {
      console.error("Error loading bookings:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tải danh sách đặt chỗ",
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const handleAcceptBooking = async (bookingId) => {
    try {
      await routeBookingService.acceptBooking(bookingId);
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Đã chấp nhận yêu cầu",
      });
      loadBookings();
    } catch (error) {
      console.error("Error accepting booking:", error);
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Không thể chấp nhận yêu cầu"
      );
    }
  };

  const handleRejectBooking = async (bookingId) => {
    Alert.alert("Xác nhận từ chối", "Bạn có chắc muốn từ chối yêu cầu này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Từ chối",
        style: "destructive",
        onPress: async () => {
          try {
            await routeBookingService.rejectBooking(bookingId);
            Toast.show({
              type: "success",
              text1: "Đã từ chối yêu cầu",
            });
            loadBookings();
          } catch (error) {
            console.error("Error rejecting booking:", error);
            Alert.alert("Lỗi", "Không thể từ chối yêu cầu");
          }
        },
      },
    ]);
  };

  const handleStartTrip = async (bookingId) => {
    Alert.alert(
      "Bắt đầu chuyến đi",
      "Bạn có chắc muốn bắt đầu chuyến đi này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Bắt đầu",
          onPress: async () => {
            try {
              const response = await routeBookingService.startTrip(bookingId);
              Toast.show({
                type: "success",
                text1: "Thành công",
                text2: "Đã bắt đầu chuyến đi",
              });

              // Navigate to map/ride screen
              if (response.data.matchId) {
                navigation.navigate("DriverRideScreen", {
                  matchId: response.data.matchId,
                  bookingId: bookingId,
                });
              }
            } catch (error) {
              console.error("Error starting trip:", error);
              Alert.alert("Lỗi", "Không thể bắt đầu chuyến đi");
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return COLORS.WARNING;
      case "ACCEPTED":
        return COLORS.SUCCESS;
      case "IN_PROGRESS":
        return COLORS.INFO;
      case "COMPLETED":
        return "#FF5370";
      case "REJECTED":
      case "CANCELLED":
        return COLORS.ERROR;
      default:
        return COLORS.GRAY;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "PENDING":
        return "Chờ xác nhận";
      case "ACCEPTED":
        return "Đã chấp nhận";
      case "IN_PROGRESS":
        return "Đang di chuyển";
      case "COMPLETED":
        return "Hoàn thành";
      case "REJECTED":
        return "Đã từ chối";
      case "CANCELLED":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filter === "ALL") return true;
    return booking.status === filter;
  });

  const renderBookingCard = ({ item }) => (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.passengerInfo}>
          <MaterialIcons name="person" size={24} color="#FF5370" />
          <View style={styles.passengerDetails}>
            <Text style={styles.passengerName}>{item.passengerName}</Text>
            <Text style={styles.passengerPhone}>{item.passengerPhone}</Text>
          </View>
        </View>
        <View style={styles.contactButtons}>
          <TouchableOpacity
            style={styles.contactButtonMessage}
            onPress={async () => {
              if (!item.passengerId) {
                Alert.alert("Lỗi", "Không tìm thấy thông tin hành khách");
                return;
              }

              try {
                const { getProfile } = require("../../../services/userService");
                const profileResp = await getProfile();
                const currentUserId =
                  profileResp?.data?.data?.id || profileResp?.data?.id;

                if (!currentUserId) {
                  Alert.alert("Lỗi", "Không thể lấy thông tin người dùng");
                  return;
                }

                const userIds = [currentUserId, item.passengerId].sort();
                const channelId = `dm-${userIds[0]}-${userIds[1]}`;

                navigation.navigate("ChatScreen", {
                  channelId,
                  otherUserId: item.passengerId,
                  otherUserName: item.passengerName,
                  otherUserAvatar: item.passengerAvatar || null,
                  otherUserPhone: item.passengerPhone || null,
                });
              } catch (error) {
                console.error("Error navigating to chat:", error);
                Alert.alert("Lỗi", "Không thể mở chat");
              }
            }}
          >
            <MaterialIcons name="chat-bubble" size={18} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.contactButtonCall}
            onPress={() => {
              const phoneNumber = item.passengerPhone?.replace(/\s/g, "");
              if (phoneNumber) {
                Linking.openURL(`tel:${phoneNumber}`);
              }
            }}
          >
            <MaterialIcons name="phone" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.bookingDetails}>
        <View style={styles.detailRow}>
          <MaterialIcons name="event" size={18} color={COLORS.GRAY} />
          <Text style={styles.detailText}>
            {new Date(item.bookingDate).toLocaleDateString("vi-VN")}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons name="event-seat" size={18} color={COLORS.GRAY} />
          <Text style={styles.detailText}>{item.numberOfSeats} chỗ</Text>
        </View>
      </View>

      <View style={styles.locationInfo}>
        <View style={styles.locationRow}>
          <MaterialIcons name="trip-origin" size={16} color={COLORS.SUCCESS} />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.pickupAddress}
          </Text>
        </View>
        <View style={styles.locationRow}>
          <MaterialIcons name="location-on" size={16} color={COLORS.ERROR} />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.dropoffAddress}
          </Text>
        </View>
      </View>

      {item.status === "PENDING" && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleAcceptBooking(item.id)}
          >
            <MaterialIcons name="check" size={20} color={COLORS.WHITE} />
            <Text style={styles.actionButtonText}>Chấp nhận</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleRejectBooking(item.id)}
          >
            <MaterialIcons name="close" size={20} color={COLORS.WHITE} />
            <Text style={styles.actionButtonText}>Từ chối</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

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
        title="🎫 Đặt chỗ"
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
      />

      <View style={styles.tabWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {["ALL", "PENDING", "ACCEPTED", "IN_PROGRESS"].map((filterOption) => (
            <TouchableOpacity
              key={filterOption}
              style={[
                styles.filterButton,
                filter === filterOption && styles.filterButtonActive,
              ]}
              onPress={() => setFilter(filterOption)}
            >
              {filter === filterOption ? (
                <LinearGradient
                  colors={["#FF5370", "#FF6B9D", "#FF8FAB"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.filterButtonGradient}
                >
                  <Text style={styles.filterButtonTextActive}>
                    {filterOption === "ALL"
                      ? "Tất cả"
                      : getStatusText(filterOption)}
                  </Text>
                </LinearGradient>
              ) : (
                <Text style={styles.filterButtonText}>
                  {filterOption === "ALL"
                    ? "Tất cả"
                    : getStatusText(filterOption)}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {filteredBookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons
            name="event-seat"
            size={80}
            color={COLORS.GRAY_LIGHT}
          />
          <Text style={styles.emptyText}>Chưa có đặt chỗ nào</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
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
    backgroundColor: "#FFF5F7",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.GRAY,
  },
  tabWrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "#FFF5F7",
  },
  filterScrollContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginRight: 8,
  },
  filterButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  filterButtonActive: {
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#FFE5EC",
  },
  filterButtonTextActive: {
    color: COLORS.WHITE,
    fontWeight: "700",
    fontSize: 14,
  },
  listContainer: {
    padding: 16,
  },
  bookingCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#FFE5EC",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  passengerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  passengerDetails: {
    marginLeft: 12,
    flex: 1,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.DARK,
  },
  passengerPhone: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginTop: 2,
  },
  contactButtons: {
    flexDirection: "row",
    gap: 8,
    marginRight: 8,
  },
  contactButtonMessage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FF5370",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  contactButtonCall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.SUCCESS,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: COLORS.SUCCESS,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.WHITE,
  },
  bookingDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginLeft: 4,
  },
  locationInfo: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.DARK,
    marginLeft: 8,
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  acceptButton: {
    backgroundColor: COLORS.SUCCESS,
  },
  rejectButton: {
    backgroundColor: COLORS.ERROR,
  },
  startButton: {
    backgroundColor: "#FF5370",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.WHITE,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.DARK,
    marginTop: 16,
    textAlign: "center",
  },
});

export default RouteBookingsScreen;
