import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import COLORS from "../../../constant/colors";
import fixedRouteService from "../../../services/fixedRouteService";
import { getMyVehicle } from "../../../services/vehicleService";
import Toast from "react-native-toast-message";
import LocationSearch from "../../../components/LocationSearch";
import { searchPlaces } from "../../../utils/api";

/**
 * Screen for drivers to create a new fixed route
 */
const CreateFixedRouteScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [loadingVehicle, setLoadingVehicle] = useState(true);
  const [vehicle, setVehicle] = useState(null);

  // Form fields
  const [routeName, setRouteName] = useState("");
  const [description, setDescription] = useState("");

  // Pickup location
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupLocation, setPickupLocation] = useState(null);

  // Dropoff location
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState(null);

  // Schedule
  const [departureTime, setDepartureTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Pricing and capacity
  const [pricePerSeat, setPricePerSeat] = useState("");
  const [totalSeats, setTotalSeats] = useState("");

  useEffect(() => {
    loadVehicle();
  }, []);

  const loadVehicle = async () => {
    try {
      setLoadingVehicle(true);
      const response = await getMyVehicle();
      console.log(
        "📦 Vehicle API full response:",
        JSON.stringify(response, null, 2)
      );

      // Check if data is nested in response.data.data (common API structure)
      const vehicleData = response?.data?.data || response?.data;

      if (vehicleData) {
        setVehicle(vehicleData);
        console.log("✅ Vehicle loaded:", vehicleData);
        // Toast removed as requested because it's distracting
        // Toast.show({
        //   type: "success",
        //   text1: "Đã tải phương tiện",
        //   text2: `${vehicleData.model} - ${vehicleData.licensePlate}`,
        //   position: "top",
        // });
      } else {
        console.warn("⚠️ No vehicle data in response");
        // Don't block user, just show they can add vehicle later
      }
    } catch (error) {
      console.error("❌ Error loading vehicle:", error);
      console.error("Error details:", error.response?.data || error.message);
      // Don't show alert if vehicle not found, just continue
      // User can still create route and add vehicle later
    } finally {
      setLoadingVehicle(false);
    }
  };

  const handlePickupSelect = (location) => {
    setPickupAddress(location.description);
    setPickupLocation({
      latitude: location.latitude,
      longitude: location.longitude,
    });
  };

  const handleDropoffSelect = (location) => {
    setDropoffAddress(location.description);
    setDropoffLocation({
      latitude: location.latitude,
      longitude: location.longitude,
    });
  };

  const handleDateChange = (event, selected) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selected) {
      setSelectedDate(selected);
    }
  };

  const handleDatePickerDismiss = () => {
    setShowDatePicker(false);
  };

  const formatDisplayDate = (date) => {
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleTimeChange = (event, selectedTime) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setDepartureTime(selectedTime);
    }
  };

  const handleTimePickerDismiss = () => {
    setShowTimePicker(false);
  };

  const validateForm = () => {
    if (!routeName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên chuyến đi");
      return false;
    }
    if (!pickupAddress || !pickupLocation) {
      Alert.alert("Lỗi", "Vui lòng chọn điểm đón");
      return false;
    }
    if (!dropoffAddress || !dropoffLocation) {
      Alert.alert("Lỗi", "Vui lòng chọn điểm đến");
      return false;
    }
    if (!selectedDate) {
      Alert.alert("Lỗi", "Vui lòng chọn ngày hoạt động");
      return false;
    }
    if (!totalSeats || parseInt(totalSeats) <= 0) {
      Alert.alert("Lỗi", "Vui lòng nhập số chỗ hợp lệ");
      return false;
    }
    if (!vehicle) {
      Alert.alert(
        "Lỗi",
        "Không tìm thấy thông tin phương tiện. Vui lòng đăng ký xe trước."
      );
      return false;
    }
    return true;
  };

  const handleCreateRoute = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const routeData = {
        vehicleId: vehicle?.id || vehicle?.vehicleId,
        routeName: routeName.trim(),
        description: description.trim() || "",
        pickupAddress: pickupAddress,
        pickupLatitude: pickupLocation.latitude,
        pickupLongitude: pickupLocation.longitude,
        dropoffAddress: dropoffAddress,
        dropoffLatitude: dropoffLocation.latitude,
        dropoffLongitude: dropoffLocation.longitude,
        departureTime: departureTime.toTimeString().split(" ")[0], // HH:MM:SS
        specificDates: selectedDate.toISOString().split("T")[0], // yyyy-MM-dd
        pricePerSeat: 0,
        totalSeats: parseInt(totalSeats) || 1,
        pickupRadius: 500,
        dropoffRadius: 500,
      };

      console.log(
        "📦 Creating route with data:",
        JSON.stringify(routeData, null, 2)
      );
      console.log("🚗 Vehicle:", vehicle);
      console.log("💺 Total Seats:", totalSeats, "→", parseInt(totalSeats));

      await fixedRouteService.createRoute(routeData);

      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Đã tạo chuyến đi cố định",
      });

      navigation.goBack();
    } catch (error) {
      console.error("Error creating route:", error);
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Không thể tạo chuyến đi"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo chuyến đi cố định</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Route Name */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Tên chuyến đi <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Quận 1 → Thủ Đức"
            value={routeName}
            onChangeText={setRouteName}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Mô tả (tùy chọn)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Mô tả về chuyến đi..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Pickup Location */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Điểm đón <Text style={styles.required}>*</Text>
          </Text>
          <LocationSearch
            placeholder="Nhập địa chỉ điểm đón"
            value={pickupAddress}
            onChangeText={setPickupAddress}
            onLocationSelect={handlePickupSelect}
            iconName="trip-origin"
          />
        </View>

        {/* Dropoff Location */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Điểm đến <Text style={styles.required}>*</Text>
          </Text>
          <LocationSearch
            placeholder="Nhập địa chỉ điểm đến"
            value={dropoffAddress}
            onChangeText={setDropoffAddress}
            onLocationSelect={handleDropoffSelect}
            iconName="location-on"
          />
        </View>

        {/* Departure Time */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Giờ khởi hành <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => setShowTimePicker(true)}
          >
            <MaterialIcons
              name="schedule"
              size={24}
              color={COLORS.PRIMARY || COLORS.primary}
            />
            <Text style={styles.timeText}>
              {departureTime.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </TouchableOpacity>
          {showTimePicker && Platform.OS === "ios" && (
            <>
              <DateTimePicker
                value={departureTime}
                mode="time"
                is24Hour={true}
                display="spinner"
                onChange={handleTimeChange}
              />
              <View style={styles.iosPickerContainer}>
                <TouchableOpacity
                  style={styles.iosPickerButton}
                  onPress={() => setShowTimePicker(false)}
                >
                  <Text style={styles.iosPickerButtonText}>Xong</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          {showTimePicker && Platform.OS === "android" && (
            <DateTimePicker
              value={departureTime}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={handleTimeChange}
            />
          )}
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Ngày hoạt động <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDatePicker(true)}
          >
            <View style={styles.datePickerInput}>
              <MaterialIcons name="event" size={20} color={COLORS.PRIMARY} />
              <Text style={styles.datePickerInputText}>
                {formatDisplayDate(selectedDate)}
              </Text>
            </View>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          {Platform.OS === "ios" && showDatePicker && (
            <View style={styles.iosPickerContainer}>
              <TouchableOpacity
                style={styles.iosPickerButton}
                onPress={handleDatePickerDismiss}
              >
                <Text style={styles.iosPickerButtonText}>Xong</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Seats */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Số chỗ <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập số chỗ (VD: 2)"
            value={totalSeats}
            onChangeText={setTotalSeats}
            keyboardType="numeric"
          />
        </View>

        {/* Vehicle Info */}
        <View style={styles.section}>
          <Text style={styles.label}>Phương tiện</Text>
          {loadingVehicle ? (
            <View style={styles.vehicleCard}>
              <ActivityIndicator size="small" color={COLORS.PRIMARY} />
              <Text style={styles.vehicleText}>Đang tải phương tiện...</Text>
            </View>
          ) : vehicle ? (
            <View style={styles.vehicleCard}>
              <MaterialIcons
                name="directions-bike"
                size={24}
                color={COLORS.PRIMARY}
              />
              <Text style={styles.vehicleText}>
                {vehicle.model} - {vehicle.licensePlate}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.vehicleCard}
              onPress={() => navigation.navigate("VehicleRegistration")}
            >
              <MaterialIcons
                name="add-circle-outline"
                size={24}
                color={COLORS.GRAY}
              />
              <Text style={[styles.vehicleText, { color: COLORS.GRAY }]}>
                Chưa có phương tiện - Nhấn để đăng ký
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Create Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateRoute}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.WHITE} />
          ) : (
            <>
              <MaterialIcons name="add" size={24} color={COLORS.WHITE} />
              <Text style={styles.createButtonText}>Tạo chuyến đi</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.white,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  required: {
    color: COLORS.error,
  },
  input: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1C1C1E",
    borderWidth: 0,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  timeText: {
    fontSize: 16,
    color: "#1C1C1E",
    marginLeft: 12,
    fontWeight: "500",
  },
  datePickerInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  datePickerInputText: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.BLACK,
  },
  iosPickerContainer: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  iosPickerButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  iosPickerButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.WHITE,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  vehicleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    borderWidth: 0,
  },
  vehicleText: {
    fontSize: 16,
    color: "#1C1C1E",
    marginLeft: 12,
    fontWeight: "500",
  },
  footer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  createButton: {
    backgroundColor: COLORS.PRIMARY || COLORS.primary || "#007AFF",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  createButtonDisabled: {
    backgroundColor: "#C7C7CC",
    elevation: 0,
  },
  createButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 8,
  },
});

export default CreateFixedRouteScreen;
