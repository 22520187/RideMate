import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
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
 * Screen for passengers to book a seat on a fixed route
 */
const RouteBookingScreen = ({ navigation, route }) => {
  const {
    route: routeData,
    pickupLocation,
    destinationLocation,
    pickupAddress,
    destinationAddress,
  } = route.params;

  const [numberOfSeats, setNumberOfSeats] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleBooking = async () => {
    if (!pickupLocation || !destinationLocation) {
      Alert.alert("Lỗi", "Vui lòng chọn điểm đón và điểm đến");
      return;
    }

    Alert.alert(
      "Xác nhận đặt chỗ",
      `Bạn có chắc muốn đặt ${numberOfSeats} chỗ cho chuyến đi này?\nGiá: ${(
        routeData.pricePerSeat * numberOfSeats
      ).toLocaleString()}đ`,
      [
        { text: "Hủy", style: "cancel" },
        { text: "Xác nhận", onPress: confirmBooking },
      ]
    );
  };

  const confirmBooking = async () => {
    try {
      setLoading(true);

      const bookingData = {
        routeId: routeData.id,
        bookingDate: selectedDate.toISOString().split("T")[0], // Format: YYYY-MM-DD
        numberOfSeats: numberOfSeats,
        pickupAddress: pickupAddress || routeData.pickupAddress,
        pickupLatitude: pickupLocation.latitude,
        pickupLongitude: pickupLocation.longitude,
        dropoffAddress: destinationAddress || routeData.dropoffAddress,
        dropoffLatitude: destinationLocation.latitude,
        dropoffLongitude: destinationLocation.longitude,
      };

      const response = await routeBookingService.createBooking(bookingData);

      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Yêu cầu tham gia chuyến đi đã được gửi",
      });

      // Navigate to booking list or home
      navigation.navigate("MyBookingsScreen");
    } catch (error) {
      console.error("Error creating booking:", error);
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Không thể đặt chỗ. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
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

  const totalPrice = routeData.pricePerSeat * numberOfSeats;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <SnowEffect />
      <GradientHeader
        title="🎫 Đặt chỗ"
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Route Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin chuyến đi</Text>
          <View style={styles.card}>
            <Text style={styles.routeName}>{routeData.routeName}</Text>

            <View style={styles.locationContainer}>
              <MaterialIcons
                name="trip-origin"
                size={20}
                color={COLORS.success}
              />
              <Text style={styles.locationText}>{routeData.pickupAddress}</Text>
            </View>

            <View style={styles.locationContainer}>
              <MaterialIcons
                name="location-on"
                size={20}
                color={COLORS.error}
              />
              <Text style={styles.locationText}>
                {routeData.dropoffAddress}
              </Text>
            </View>

            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <MaterialIcons name="schedule" size={18} color={COLORS.gray} />
                <Text style={styles.detailText}>
                  {formatTime(routeData.departureTime)}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <MaterialIcons
                  name="straighten"
                  size={18}
                  color={COLORS.gray}
                />
                <Text style={styles.detailText}>
                  {formatDistance(routeData.distance)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Driver Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tài xế</Text>
          <View style={styles.card}>
            <View style={styles.driverRow}>
              <MaterialIcons name="person" size={24} color="#FF5370" />
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{routeData.driverName}</Text>
                <Text style={styles.driverPhone}>{routeData.driverPhone}</Text>
              </View>
              {routeData.driverRating && (
                <View style={styles.ratingContainer}>
                  <MaterialIcons name="star" size={20} color={COLORS.warning} />
                  <Text style={styles.ratingText}>
                    {routeData.driverRating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Vehicle Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phương tiện</Text>
          <View style={styles.card}>
            <Text style={styles.vehicleInfo}>{routeData.vehicleInfo}</Text>
            <View style={styles.seatsInfo}>
              <MaterialIcons name="event-seat" size={18} color={COLORS.gray} />
              <Text style={styles.seatsText}>
                {routeData.availableSeats}/{routeData.totalSeats} chỗ trống
              </Text>
            </View>
          </View>
        </View>

        {/* Number of Seats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Số lượng chỗ</Text>
          <View style={styles.card}>
            <View style={styles.seatsSelector}>
              <TouchableOpacity
                style={[
                  styles.seatButton,
                  numberOfSeats <= 1 && styles.seatButtonDisabled,
                ]}
                onPress={() => setNumberOfSeats(Math.max(1, numberOfSeats - 1))}
                disabled={numberOfSeats <= 1}
              >
                <MaterialIcons
                  name="remove"
                  size={24}
                  color={numberOfSeats <= 1 ? COLORS.lightGray : "#FF5370"}
                />
              </TouchableOpacity>
              <Text style={styles.seatsNumber}>{numberOfSeats}</Text>
              <TouchableOpacity
                style={[
                  styles.seatButton,
                  numberOfSeats >= routeData.availableSeats &&
                    styles.seatButtonDisabled,
                ]}
                onPress={() =>
                  setNumberOfSeats(
                    Math.min(routeData.availableSeats, numberOfSeats + 1)
                  )
                }
                disabled={numberOfSeats >= routeData.availableSeats}
              >
                <MaterialIcons
                  name="add"
                  size={24}
                  color={
                    numberOfSeats >= routeData.availableSeats
                      ? COLORS.lightGray
                      : "#FF5370"
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Price Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi tiết giá</Text>
          <View style={styles.card}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Giá mỗi chỗ:</Text>
              <Text style={styles.priceValue}>
                {routeData.pricePerSeat.toLocaleString()}đ
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Số lượng:</Text>
              <Text style={styles.priceValue}>x{numberOfSeats}</Text>
            </View>
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Tổng cộng:</Text>
              <Text style={styles.totalValue}>
                {totalPrice.toLocaleString()}đ
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Book Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.bookButton, loading && styles.bookButtonDisabled]}
          onPress={handleBooking}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.WHITE} />
          ) : (
            <LinearGradient
              colors={["#FF5370", "#FF6B9D", "#FF8FAB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bookButtonGradient}
            >
              <Text style={styles.bookButtonText}>Gửi yêu cầu tham gia</Text>
              <MaterialIcons
                name="arrow-forward"
                size={24}
                color={COLORS.WHITE}
              />
            </LinearGradient>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF5F7",
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FF5370",
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "#FFE5EC",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  routeName: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.dark,
    marginLeft: 8,
    flex: 1,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 4,
  },
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  driverInfo: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.dark,
  },
  driverPhone: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.dark,
    marginLeft: 4,
  },
  vehicleInfo: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.dark,
    marginBottom: 8,
  },
  seatsInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  seatsText: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 4,
  },
  seatsSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  seatButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFE5EC",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FF5370",
  },
  seatButtonDisabled: {
    backgroundColor: COLORS.lightGray,
  },
  seatsNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.dark,
    marginHorizontal: 32,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  priceValue: {
    fontSize: 14,
    color: COLORS.dark,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF5370",
  },
  footer: {
    padding: 16,
    backgroundColor: "#FFF5F7",
    borderTopWidth: 2,
    borderTopColor: "#FFE5EC",
  },
  bookButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  bookButtonGradient: {
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  bookButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.white,
    marginRight: 8,
  },
});

export default RouteBookingScreen;
