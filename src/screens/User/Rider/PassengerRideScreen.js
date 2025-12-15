import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  AppState,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import COLORS from "../../../constant/colors";
import LocationSearch from "../../../components/LocationSearch";
import RouteMap from "../../../components/RouteMap";
import { getCurrentLocation, reverseGeocode } from "../../../config/maps";
import { searchPlaces as osmSearchPlaces } from "../../../utils/api";

const PassengerRideScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [refreshKey, setRefreshKey] = useState(0);

  // Force refresh SafeArea khi app resume từ background
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === "active") {
        // Force component re-render để refresh SafeArea insets
        setRefreshKey((prev) => prev + 1);
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription?.remove();
  }, []);
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [originCoordinate, setOriginCoordinate] = useState(null);
  const [destinationCoordinate, setDestinationCoordinate] = useState(null);
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [routePath, setRoutePath] = useState([]);
  const [activeInput, setActiveInput] = useState(null); // 'from' or 'to'
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [shouldAnimateRoute, setShouldAnimateRoute] = useState(false); // Kiểm soát animation

  // Xử lý destination từ params
  useEffect(() => {
    if (route?.params?.destination) {
      const destination = route.params.destination;
      setToLocation(destination.description);
      setDestinationCoordinate({
        latitude: destination.latitude,
        longitude: destination.longitude,
        description: destination.description,
        placeId: destination.placeId,
      });
    }
  }, [route?.params?.destination]);

  // Tính toán chiều rộng cho suggestions
  const screenWidth = Dimensions.get("window").width;
  const suggestionsWidth = screenWidth - 30 - 80; // 30px padding, 80px cho button "Hiện tại"

  // Mock data cho demo
  const availableRides = [
    {
      id: 1,
      driverName: "Trần Văn X",
      rating: 4.9,
      carModel: "Toyota Vios",
      departureTime: "14:30",
      price: "25,000đ",
      availableSeats: 2,
      fromLocation: "Trường Đại học",
      toLocation: "Vincom Plaza",
    },
    {
      id: 2,
      driverName: "Nguyễn Thị Y",
      rating: 4.7,
      carModel: "Honda City",
      departureTime: "15:00",
      price: "30,000đ",
      availableSeats: 1,
      fromLocation: "Nhà ga",
      toLocation: "Sân bay",
    },
  ];

  const searchPlacesAPI = async (query) => {
    try {
      const places = await osmSearchPlaces(query);
      return places.map((p) => ({
        description: p.display_name || p.name,
        latitude: parseFloat(p.lat),
        longitude: parseFloat(p.lon),
      }));
    } catch (error) {
      console.error("Error searching places:", error);
      return [];
    }
  };

  const handleLocationSuggestions = async (query, type) => {
    if (query.length < 3) return;

    try {
      const suggestions = await searchPlacesAPI(query);
      if (type === "from") {
        setFromSuggestions(suggestions);
      } else {
        setToSuggestions(suggestions);
      }
    } catch (error) {
      console.error("Error getting location suggestions:", error);
      if (type === "from") {
        setFromSuggestions([]);
      } else {
        setToSuggestions([]);
      }
    }
  };

  const handleChangeFromText = (text) => {
    setFromLocation(text);
    setActiveInput("from");
    if (text.length <= 2) setFromSuggestions([]);
  };

  const handleChangeToText = (text) => {
    setToLocation(text);
    setActiveInput("to");
    if (text.length <= 2) setToSuggestions([]);
  };

  const handleLocationSelect = (location, type) => {
    if (type === "from") {
      setFromLocation(location.description);
      setOriginCoordinate({
        latitude: location.latitude,
        longitude: location.longitude,
        description: location.description,
        placeId: location.placeId,
      });
      setFromSuggestions([]);
    } else {
      setToLocation(location.description);
      setDestinationCoordinate({
        latitude: location.latitude,
        longitude: location.longitude,
        description: location.description,
        placeId: location.placeId,
      });
      setToSuggestions([]);
    }
    setActiveInput(null);
    setRoutePath([]);
  };

  const handleGetCurrentLocation = async (type) => {
    try {
      setIsGettingLocation(true);

      // First, try to get current location with longer timeout (20 seconds)
      let currentLocation;
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Location timeout")), 20000)
        );

        currentLocation = await Promise.race([
          getCurrentLocation(),
          timeoutPromise,
        ]);
      } catch (locationError) {
        console.error("❌ Failed to get location:", locationError.message);
        Alert.alert(
          "Lỗi",
          locationError.message === "Location timeout"
            ? "Lấy vị trí quá lâu. Vui lòng thử lại hoặc nhập địa chỉ thủ công."
            : "Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền truy cập vị trí."
        );
        return;
      }

      // Then, reverse geocode to get address
      let address = "Vị trí hiện tại";
      try {
        const reverseGeoResult = await reverseGeocode(
          currentLocation.latitude,
          currentLocation.longitude
        );
        if (reverseGeoResult) {
          address = reverseGeoResult;
        }
      } catch (geocodeError) {
        console.warn("⚠️ Geocode failed, using coordinates:", geocodeError);
        // Use coordinates if geocoding fails
        address = `${currentLocation.latitude.toFixed(
          4
        )}, ${currentLocation.longitude.toFixed(4)}`;
      }

      if (type === "from") {
        setFromLocation(address);
        setOriginCoordinate(currentLocation);
      } else {
        setToLocation(address);
        setDestinationCoordinate(currentLocation);
      }

      Alert.alert("Thành công", `Đã lấy vị trí: ${address}`);
    } catch (error) {
      console.error("❌ Unexpected error:", error);
      Alert.alert("Lỗi", "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSearchAsPassenger = () => {
    if (!fromLocation || !toLocation) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ điểm xuất phát và điểm đến");
      return;
    }
    if (!originCoordinate || !destinationCoordinate) {
      Alert.alert("Lỗi", "Vui lòng chọn địa điểm từ danh sách gợi ý");
      return;
    }

    // Bật animation khi nhấn "Next"
    setShouldAnimateRoute(true);

    // Auto-match với chuyến đầu tiên sau khi tìm thấy
    const matchedRide = availableRides[0]; // Lấy chuyến đầu tiên
    if (matchedRide) {
      // Navigate to MatchedRideScreen sau 1.5 giây để giống như tìm thấy match
      setTimeout(() => {
        navigation.navigate("MatchedRide", {
          isDriver: false,
          driverName: matchedRide.driverName,
          driverPhone: "0901234569",
          driverAvatar: `https://i.pravatar.cc/150?img=${matchedRide.id + 10}`,
          vehicleModel: matchedRide.carModel,
          licensePlate: `30A-${12345 + matchedRide.id}`,
          from: fromLocation,
          to: toLocation,
          departureTime: matchedRide.departureTime,
          price: matchedRide.price,
          duration: "30 phút",
          distance: "12 km",
          rideId: matchedRide.id,
        });
      }, 1500);

      Alert.alert(
        "Tìm thấy chuyến!",
        `Đã tìm thấy ${matchedRide.driverName}. Đang kết nối...`
      );
    } else {
      Alert.alert(
        "Thông báo",
        `Không tìm thấy chuyến đi phù hợp từ ${fromLocation} đến ${toLocation}`
      );
    }
  };

  // Mock data cho route info
  const routeInfo = {
    distance: "26.7",
    duration: "38",
  };

  return (
    <View style={styles.container}>
      <SafeAreaView key={refreshKey} style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#004553" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tìm chuyến đi</Text>
          <View style={styles.profileBtn} />
        </View>
      </SafeAreaView>

      <View style={styles.contentArea}>
        <RouteMap
          origin={originCoordinate}
          destination={destinationCoordinate}
          height={Dimensions.get("window").height}
          showRoute={true}
          path={routePath}
          fullScreen={true}
          startAnimation={shouldAnimateRoute}
        />

        <View style={styles.overlayContainer} pointerEvents="box-none">
          <View style={styles.topControls} pointerEvents="box-none">
            <View style={styles.inputContainerWrapper} pointerEvents="auto">
              <View style={styles.inputContainer}>
                <View style={styles.locationInputRow}>
                  <MaterialIcons
                    name="radio-button-checked"
                    size={20}
                    color={COLORS.PRIMARY}
                    style={styles.locationIcon}
                  />
                  <View style={styles.inputWrapper}>
                    <LocationSearch
                      placeholder="Gulshan, Dhaka"
                      value={fromLocation}
                      onChangeText={handleChangeFromText}
                      onLocationSelect={(location) =>
                        handleLocationSelect(location, "from")
                      }
                      iconName=""
                      containerWidth="100%"
                      showClearButton={false}
                    />
                  </View>
                  {fromLocation ? (
                    <TouchableOpacity
                      style={styles.clearBtn}
                      onPress={() => {
                        setFromLocation("");
                        setOriginCoordinate(null);
                        setShouldAnimateRoute(false); // Reset animation
                      }}
                    >
                      <MaterialIcons
                        name="close"
                        size={20}
                        color={COLORS.GRAY}
                      />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.currentLocationBtn}
                      onPress={() => handleGetCurrentLocation("from")}
                      disabled={isGettingLocation}
                    >
                      {isGettingLocation ? (
                        <ActivityIndicator
                          size="small"
                          color={COLORS.PRIMARY}
                        />
                      ) : (
                        <MaterialIcons
                          name="my-location"
                          size={20}
                          color={COLORS.PRIMARY}
                        />
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.locationInputRow}>
                  <MaterialIcons
                    name="place"
                    size={20}
                    color={COLORS.PRIMARY}
                    style={styles.locationIcon}
                  />
                  <View style={styles.inputWrapper}>
                    <LocationSearch
                      placeholder="Diabari, Uttara"
                      value={toLocation}
                      onChangeText={handleChangeToText}
                      onLocationSelect={(location) =>
                        handleLocationSelect(location, "to")
                      }
                      iconName=""
                      containerWidth="100%"
                      showClearButton={false}
                    />
                  </View>
                  {toLocation ? (
                    <TouchableOpacity
                      style={styles.clearBtn}
                      onPress={() => {
                        setToLocation("");
                        setDestinationCoordinate(null);
                        setShouldAnimateRoute(false); // Reset animation
                      }}
                    >
                      <MaterialIcons
                        name="close"
                        size={20}
                        color={COLORS.GRAY}
                      />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </View>
          </View>

          <View style={styles.bottomControls} pointerEvents="auto">
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Total distance</Text>
                  <Text style={styles.infoValue}>
                    {routeInfo.distance} <Text style={styles.infoUnit}>km</Text>
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Possible time</Text>
                  <Text style={styles.infoValue}>
                    {routeInfo.duration}{" "}
                    <Text style={styles.infoUnit}>mins</Text>
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.nextBtn}
                onPress={handleSearchAsPassenger}
              >
                <Text style={styles.nextBtnText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8F5F3",
  },
  safeArea: {
    backgroundColor: "#FFFFFF",
    zIndex: 1000,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#004553",
    flex: 1,
    textAlign: "center",
  },
  profileBtn: {
    width: 40,
    height: 40,
  },
  contentArea: {
    flex: 1,
    position: "relative",
  },
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: "space-between",
  },
  topControls: {
    paddingHorizontal: 15,
    paddingTop: 15,
    zIndex: 10000,
  },
  bottomControls: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  inputContainerWrapper: {
    position: "relative",
  },
  inputContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    padding: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  locationInputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  locationIcon: {
    marginRight: 12,
  },
  inputWrapper: {
    flex: 1,
  },
  clearBtn: {
    padding: 4,
    marginLeft: 8,
  },
  currentLocationBtn: {
    padding: 6,
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 24,
    padding: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  infoItem: {
    flex: 1,
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 13,
    color: "#8E8E93",
    marginBottom: 8,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#004553",
  },
  infoUnit: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
  },
  nextBtn: {
    backgroundColor: "#004553",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#004553",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  nextBtnText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: "700",
  },
});

export default PassengerRideScreen;
