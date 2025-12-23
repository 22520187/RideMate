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
import routeBookingService from "../../../services/routeBookingService";
import Toast from "react-native-toast-message";
import GradientHeader from "../../../components/GradientHeader";

/**
 * Screen for passengers to view their fixed route bookings/requests
 * Layout synchronized with Driver's RouteBookingsScreen
 */
const MyBookingsScreen = ({ navigation }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await routeBookingService.getMyBookings("passenger");
      setBookings(response.data || []);
    } catch (error) {
      console.error("Error loading bookings:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tải danh sách yêu cầu",
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

  const handleCancelBooking = (bookingId) => {
    Alert.alert(
      "Hủy yêu cầu",
      "Bạn có chắc muốn hủy yêu cầu đặt chỗ này không?",
      [
        { text: "Không", style: "cancel" },
        {
          text: "Có, hủy ngay",
          style: "destructive",
          onPress: async () => {
            try {
              await routeBookingService.cancelBooking(bookingId);
              Toast.show({
                type: "success",
                text1: "Thành công",
                text2: "Đã hủy yêu cầu đặt chỗ",
              });
              loadBookings(); // Reload list
            } catch (error) {
              console.error("Error cancelling booking:", error);
              Toast.show({
                type: "error",
                text1: "Lỗi",
                text2: "Không thể hủy yêu cầu",
              });
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return COLORS.warning;
      case "ACCEPTED":
        return COLORS.success;
      case "IN_PROGRESS":
        return COLORS.info;
      case "COMPLETED":
        return COLORS.primary;
      case "REJECTED":
      case "CANCELLED":
        return COLORS.error;
      default:
        return COLORS.gray;
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

  // Status mapping for filters to match Driver side layout logic but adapted for Tab needs if any
  // But here we implement horizontal filter tabs like Driver: "ALL", "PENDING", "ACCEPTED", "HISTORY"
  const filterTabs = ["ALL", "PENDING", "ACCEPTED", "HISTORY"];

  // Tab selection state: 'active' or 'history'
  const [activeTab, setActiveTab] = useState('active');

  const filteredBookings = bookings.filter((booking) => {
    if (activeTab === "active") {
        return ["PENDING", "ACCEPTED", "IN_PROGRESS"].includes(booking.status);
    }
    if (activeTab === "history") {
        return ["COMPLETED", "CANCELLED", "REJECTED"].includes(booking.status);
    }
    return true;
  });

  const formatTime = (dateString, timeString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
    
    if (timeString) {
        const [hours, minutes] = timeString.split(':');
        return `${hours}:${minutes} - ${formattedDate}`;
    }
    
    return formattedDate;
  };

  const renderBookingCard = ({ item }) => {
    const routeInfo = item.routeInfo || {};

    return (
      <View style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <View style={styles.routeInfo}>
            <MaterialIcons name="directions-bus" size={24} color={COLORS.primary} />
            <View style={styles.routeDetails}>
              <Text style={styles.routeName} numberOfLines={1}>{routeInfo.routeName || "Chuyến đi"}</Text>
               <Text style={styles.routePrice}>{item.totalPrice?.toLocaleString()}đ</Text>
            </View>
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
            <MaterialIcons name="event" size={18} color={COLORS.gray} />
            <Text style={styles.detailText}>
              {formatTime(item.bookingDate, routeInfo.departureTime)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialIcons name="event-seat" size={18} color={COLORS.gray} />
            <Text style={styles.detailText}>{item.numberOfSeats} chỗ</Text>
          </View>
        </View>

        <View style={styles.locationInfo}>
          <View style={styles.locationRow}>
            <MaterialIcons name="trip-origin" size={16} color={COLORS.success} />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.pickupAddress}
            </Text>
          </View>
          <View style={styles.locationRow}>
            <MaterialIcons name="location-on" size={16} color={COLORS.error} />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.dropoffAddress}
            </Text>
          </View>
        </View>

        {item.status === "PENDING" && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelBooking(item.id)}
            >
              <Text style={styles.actionButtonText}>Hủy yêu cầu</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GradientHeader title="Yêu cầu của tôi" onBackPress={() => navigation.goBack()} />

      <View style={styles.tabWrapper}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'active' && styles.activeTab]}
            onPress={() => setActiveTab('active')}
          >
            <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>Đang thực hiện</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>Lịch sử</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="assignment" size={80} color={COLORS.lightGray} />
              <Text style={styles.emptyText}>Chưa có yêu cầu nào</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
  },
  tabWrapper: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: COLORS.PRIMARY,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.GRAY,
  },
  activeTabText: {
    fontWeight: '700',
    color: COLORS.WHITE,
  },
  listContainer: {
    padding: 16,
  },
  bookingCard: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  routeInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  routeDetails: {
    marginLeft: 12,
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.dark,
  },
  routePrice: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "700",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.white,
  },
  bookingDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    fontSize: 14,
    color: COLORS.gray,
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
    color: COLORS.dark,
    marginLeft: 8,
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: 4,
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
  cancelButton: {
    backgroundColor: "#FFEBEE",
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.error,
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
    color: COLORS.dark,
    marginTop: 16,
    textAlign: "center",
  },
});

export default MyBookingsScreen;
