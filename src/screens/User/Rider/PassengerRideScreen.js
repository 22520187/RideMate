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
  Image,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { Bell } from "lucide-react-native";
import COLORS from "../../../constant/colors";
import LocationSearch from "../../../components/LocationSearch";
import RouteMap from "../../../components/RouteMap";
import RadarScanning from "../../../components/RadarScanning";
import { getCurrentLocation, reverseGeocode } from "../../../config/maps";
import { searchPlaces as osmSearchPlaces, getRoute } from "../../../utils/api";
import { getProfile } from "../../../services/userService";

const PassengerRideScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [refreshKey, setRefreshKey] = useState(0);

  // User profile state
  const [userProfile, setUserProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Force refresh SafeArea khi app resume từ background
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === "active") {
        // Force component re-render để refresh SafeArea insets
        setRefreshKey((prev) => prev + 1);
        loadUserProfile(); // Reload profile khi app active
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription?.remove();
  }, []);

  // Load user profile on mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  // Load profile when screen focused
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadUserProfile();
    });
    return unsubscribe;
  }, [navigation]);

  const loadUserProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const profileResp = await getProfile();
      const profile = profileResp?.data;
      setUserProfile(profile);
    } catch (error) {
      console.warn("Failed to load user profile:", error);
      // Không hiển thị alert để không làm phiền user
    } finally {
      setIsLoadingProfile(false);
    }
  };

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
  const [routeDistance, setRouteDistance] = useState("0");
  const [routeDuration, setRouteDuration] = useState("0");
  const [isSearching, setIsSearching] = useState(false); // Trạng thái đang tìm tài xế

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

  // Tính toán route, khoảng cách và thời gian khi có cả origin và destination
  useEffect(() => {
    const calculateRoute = async () => {
      if (originCoordinate && destinationCoordinate) {
        try {
          console.log("🗺️ Calculating route...");
          const path = await getRoute(originCoordinate, destinationCoordinate);

          if (!path || path.length === 0) {
            console.warn("⚠️ No route found");
            Alert.alert(
              "Không tìm thấy đường đi",
              "Không thể tính toán lộ trình giữa hai điểm này. Vui lòng chọn địa điểm khác.",
              [{ text: "OK" }]
            );
            setRoutePath([]);
            setRouteDistance("0");
            setRouteDuration("0");
            return;
          }

          setRoutePath(path);

          // Tính khoảng cách từ path
          let distanceKm = 0;
          for (let i = 1; i < path.length; i++) {
            const a = path[i - 1];
            const b = path[i];
            const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
            const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
            const lat1 = (a.latitude * Math.PI) / 180;
            const lat2 = (b.latitude * Math.PI) / 180;

            const haversine =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) *
                Math.cos(lat2) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
            const c =
              2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
            distanceKm += 6371 * c; // Earth radius in km
          }

          // Tính thời gian (giả sử tốc độ trung bình 30km/h)
          const durationMin = Math.ceil((distanceKm / 30) * 60);

          setRouteDistance(distanceKm.toFixed(1));
          setRouteDuration(durationMin.toString());

          console.log(
            `✅ Route calculated: ${distanceKm.toFixed(
              1
            )} km, ${durationMin} phút`
          );
        } catch (error) {
          console.error("❌ Error calculating route:", error);
        }
      } else {
        // Reset khi không có đủ tọa độ
        setRoutePath([]);
        setRouteDistance("0");
        setRouteDuration("0");
      }
    };

    calculateRoute();
  }, [originCoordinate, destinationCoordinate]);

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
    // Không cần reset routePath vì useEffect sẽ tự động tính toán lại khi coordinates thay đổi
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
      Alert.alert(
        "Lỗi",
        "Có lỗi không mong muốn xảy ra. Vui lòng thử lại hoặc nhập địa chỉ thủ công.",
        [{ text: "OK" }]
      );
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSearchAsPassenger = () => {
    if (!fromLocation || !toLocation) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng nhập đầy đủ điểm xuất phát và điểm đến để tìm chuyến đi.",
        [{ text: "OK" }]
      );
      return;
    }
    if (!originCoordinate || !destinationCoordinate) {
      Alert.alert(
        "Thông tin không hợp lệ",
        "Vui lòng chọn địa điểm từ danh sách gợi ý hoặc sử dụng nút lấy vị trí hiện tại.",
        [{ text: "OK" }]
      );
      return;
    }

    // Validate route distance
    if (routeDistance === "0" || !routePath || routePath.length === 0) {
      Alert.alert(
        "Chưa tính được lộ trình",
        "Vui lòng đợi hệ thống tính toán lộ trình hoặc chọn lại địa điểm.",
        [{ text: "OK" }]
      );
      return;
    }

    // Bắt đầu tìm kiếm - hiển thị radar animation
    setIsSearching(true);

    // Giả lập tìm kiếm trong 3-5 giây
    const searchTimeout = setTimeout(() => {
      // Auto-match với chuyến đầu tiên sau khi tìm thấy
      const matchedRide = availableRides[0]; // Lấy chuyến đầu tiên

      if (matchedRide) {
        setIsSearching(false);

        // Hiển thị thông báo tìm thấy
        Alert.alert(
          "🎉 Tìm thấy tài xế!",
          `${matchedRide.driverName} đang di chuyển đến điểm đón của bạn...`,
          [
            {
              text: "OK",
              onPress: () => {
                // Navigate to MatchedRideScreen
                navigation.navigate("MatchedRide", {
                  isDriver: false,
                  driverName: matchedRide.driverName,
                  driverPhone: "0901234569",
                  driverAvatar: `https://i.pravatar.cc/150?img=${
                    matchedRide.id + 10
                  }`,
                  vehicleModel: matchedRide.carModel,
                  licensePlate: `30A-${12345 + matchedRide.id}`,
                  from: fromLocation,
                  to: toLocation,
                  // Truyền tọa độ thực tế đã chọn
                  originCoordinate: originCoordinate,
                  destinationCoordinate: destinationCoordinate,
                  // Truyền vị trí thực của tài xế (giả lập cách pickup 0.5-1km)
                  driverLocation: {
                    latitude: originCoordinate.latitude - 0.008, // ~0.8km về phía nam
                    longitude: originCoordinate.longitude - 0.006, // ~0.5km về phía tây
                  },
                  departureTime: matchedRide.departureTime,
                  price: matchedRide.price,
                  duration: `${routeDuration} phút`,
                  distance: `${routeDistance} km`,
                  rideId: matchedRide.id,
                });
              },
            },
          ]
        );
      } else {
        setIsSearching(false);
        Alert.alert(
          "Thông báo",
          `Không tìm thấy chuyến đi phù hợp từ ${fromLocation} đến ${toLocation}`
        );
      }
    }, 3000); // 3 giây tìm kiếm

    // Cleanup nếu component unmount
    return () => clearTimeout(searchTimeout);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView key={refreshKey} style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#004553" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tìm chuyến đi</Text>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate("Notification")}
          >
            <Bell size={22} color="#004553" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
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
          startAnimation={false}
          showVehicle={false}
        />

        {/* Radar Scanning Overlay khi đang tìm kiếm */}
        {isSearching && (
          <View style={styles.searchingOverlay}>
            <View style={styles.searchingContent}>
              <RadarScanning size={250} />
              <Text style={styles.searchingText}>Đang tìm tài xế...</Text>
              <Text style={styles.searchingSubtext}>
                Vui lòng chờ trong giây lát
              </Text>
            </View>
          </View>
        )}

        <View style={styles.overlayContainer} pointerEvents="box-none">
          {/* Chỉ hiển thị input khi KHÔNG đang searching */}
          {!isSearching && (
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
                        placeholder="Điểm xuất phát"
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
                          <View style={styles.locationIconWrapper}>
                            <MaterialIcons
                              name="my-location"
                              size={18}
                              color={COLORS.PRIMARY}
                            />
                            <Text style={styles.locationButtonLabel}>
                              Vị trí hiện tại
                            </Text>
                          </View>
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
                        placeholder="Điểm đến"
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
          )}

          {/* Chỉ hiển thị info card khi KHÔNG đang searching */}
          {!isSearching && (
            <View style={styles.bottomControls} pointerEvents="auto">
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Khoảng cách</Text>
                    <Text style={styles.infoValue}>
                      {routeDistance} <Text style={styles.infoUnit}>km</Text>
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Thời gian dự kiến</Text>
                    <Text style={styles.infoValue}>
                      {routeDuration} <Text style={styles.infoUnit}>phút</Text>
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
          )}
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
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#004553",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 12,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
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
    borderRadius: 24,
    padding: 22,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 69, 83, 0.06)",
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
  locationIconWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationButtonLabel: {
    fontSize: 11,
    color: COLORS.PRIMARY,
    fontWeight: "500",
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 28,
    padding: 28,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 69, 83, 0.08)",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 28,
    paddingVertical: 8,
  },
  infoItem: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: "#8E8E93",
    marginBottom: 10,
    fontWeight: "600",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#004553",
    letterSpacing: -0.5,
  },
  infoUnit: {
    fontSize: 15,
    fontWeight: "600",
    color: "#8E8E93",
    marginLeft: 2,
  },
  nextBtn: {
    backgroundColor: "#004553",
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: "center",
    elevation: 8,
    shadowColor: "#004553",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    overflow: "hidden",
  },
  nextBtnText: {
    color: COLORS.WHITE,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  searchingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  searchingContent: {
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    borderRadius: 32,
    padding: 48,
    elevation: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 69, 83, 0.08)",
  },
  searchingText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#004553",
    marginTop: 28,
    letterSpacing: 0.3,
  },
  searchingSubtext: {
    fontSize: 15,
    color: "#8E8E93",
    marginTop: 10,
    fontWeight: "500",
  },
});

export default PassengerRideScreen;
