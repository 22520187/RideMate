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
  Modal,
  Image,
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
import {
  broadcastAsPassenger,
  findMatches,
  acceptMatch,
  cancelMatch,
} from "../../../services/matchService";
import { formatVND } from "../../../utils/utils";
import AsyncStorageService from "../../../services/AsyncStorageService";

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
  const [isDriverModalVisible, setIsDriverModalVisible] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeLeft, setSearchTimeLeft] = useState(60);
  const [searchInterval, setSearchInterval] = useState(null);
  const [isConfirmationModalVisible, setIsConfirmationModalVisible] =
    useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);

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
      const currentLocation = await getCurrentLocation();
      const address = await reverseGeocode(
        currentLocation.latitude,
        currentLocation.longitude
      );

      if (type === "from") {
        setFromLocation(address);
        setOriginCoordinate(currentLocation);
      } else {
        setToLocation(address);
        setDestinationCoordinate(currentLocation);
      }

      Alert.alert("Thành công", `Đã lấy vị trí hiện tại: ${address}`);
    } catch (error) {
      Alert.alert(
        "Lỗi",
        "Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền truy cập vị trí."
      );
    }
  };

  const handleSearchAsPassenger = async () => {
    if (!fromLocation || !toLocation) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ điểm xuất phát và điểm đến");
      return;
    }
    if (!originCoordinate || !destinationCoordinate) {
      Alert.alert("Lỗi", "Vui lòng chọn địa điểm từ danh sách gợi ý");
      return;
    }

    // Broadcast as passenger looking for drivers
    try {
      await broadcastAsPassenger({
        pickupAddress: fromLocation,
        destinationAddress: toLocation,
        pickupLatitude: originCoordinate.latitude,
        pickupLongitude: originCoordinate.longitude,
        destinationLatitude: destinationCoordinate.latitude,
        destinationLongitude: destinationCoordinate.longitude,
      });
    } catch (error) {
      console.error("Broadcast error:", error);
      Alert.alert("Lỗi", "Không thể broadcast tìm kiếm tài xế");
      return;
    }

    // Start searching for drivers
    setIsSearching(true);
    setSearchTimeLeft(60);
    setIsDriverModalVisible(true);

    // Start polling for matches
    const interval = setInterval(async () => {
      setSearchTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsSearching(false);
          setIsDriverModalVisible(false);
          Alert.alert(
            "Thông báo",
            "Không tìm thấy tài xế nào trong thời gian quy định"
          );
          return 0;
        }
        return prev - 1;
      });

      try {
        const response = await findMatches({
          type: "passenger",
          pickupLatitude: originCoordinate.latitude,
          pickupLongitude: originCoordinate.longitude,
          destinationLatitude: destinationCoordinate.latitude,
          destinationLongitude: destinationCoordinate.longitude,
        });

        const matches = response?.data?.data || [];
        if (matches.length > 0) {
          clearInterval(interval);
          setIsSearching(false);
          setAvailableDrivers(
            matches.map((match) => ({
              id: match.id,
              driverName: match.driverName,
              rating: match.driverRating || 4.5,
              carModel: match.vehicleModel || "Toyota Vios",
              departureTime: new Date().toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              price: match.estimatedPrice || "25,000đ",
              availableSeats: match.availableSeats || 2,
              fromLocation: match.pickupAddress,
              toLocation: match.destinationAddress,
              licensePlate: match.licensePlate || `30A-${12345 + match.id}`,
              driverPhone: match.driverPhone,
              driverAvatar:
                "https://randomuser.me/api/portraits/lego/1.jpg" ||
                match.driverAvatar,
            }))
          );
        }
      } catch (error) {
        console.error("Find matches error:", error);
      }
    }, 2000); // Poll every 2 seconds

    setSearchInterval(interval);
  };

  const handleSelectDriver = (driver) => {
    setSelectedDriver(driver);
    setIsDriverModalVisible(false);
    setIsConfirmationModalVisible(true);
  };

  const handleConfirmDriverSelection = async () => {
    if (!selectedDriver) return;

    try {
      // For passengers accepting drivers, we need to send the passenger's ID (current user)
      // since the passenger is the one who broadcast the ride request
      const currentUserId = await AsyncStorageService.getUserId();
      const response = await acceptMatch(currentUserId);
      const matchData = response?.data?.data; // Get the match response data

      // Clear search interval
      if (searchInterval) {
        clearInterval(searchInterval);
        setSearchInterval(null);
      }

      setIsConfirmationModalVisible(false);
      setIsSearching(false);

      navigation.navigate("MatchedRide", {
        isDriver: false,
        driverId: selectedDriver.id, // Keep driver ID for chat
        driverName: selectedDriver.driverName,
        driverPhone: selectedDriver.driverPhone,
        driverAvatar: selectedDriver.driverAvatar,
        vehicleModel: selectedDriver.carModel,
        licensePlate: selectedDriver.licensePlate,
        rideId: matchData?.id || currentUserId, // Use real match ID if available
        from: fromLocation,
        to: toLocation,
        departureTime: selectedDriver.departureTime,
        price: selectedDriver.price,
        duration: "30 phút",
        distance: "12 km",
      });
    } catch (error) {
      console.error("Accept match error:", error);
      Alert.alert("Lỗi", "Không thể chấp nhận chuyến đi. Vui lòng thử lại.");
      setIsConfirmationModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView key={refreshKey} style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color={COLORS.BLACK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tìm chuyến đi</Text>
          <View style={styles.headerSpacer} />
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
        />

        <View style={styles.overlayContainer} pointerEvents="box-none">
          <View style={styles.topControls} pointerEvents="box-none">
            <View style={styles.inputContainerWrapper} pointerEvents="auto">
              <View style={styles.inputContainer}>
                <View style={styles.locationRow}>
                  <View style={styles.locationSearchWrapper}>
                    <LocationSearch
                      placeholder="Điểm xuất phát"
                      value={fromLocation}
                      onChangeText={handleChangeFromText}
                      onLocationSelect={(location) =>
                        handleLocationSelect(location, "from")
                      }
                      iconName="my-location"
                      containerWidth={suggestionsWidth}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.currentLocationBtn}
                    onPress={() => handleGetCurrentLocation("from")}
                  >
                    <MaterialIcons
                      name="my-location"
                      size={16}
                      color={COLORS.WHITE}
                    />
                    <Text style={styles.currentLocationText}>Hiện tại</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.locationRowTo}>
                  <View style={styles.locationSearchWrapper}>
                    <LocationSearch
                      placeholder="Điểm đến"
                      value={toLocation}
                      onChangeText={handleChangeToText}
                      onLocationSelect={(location) =>
                        handleLocationSelect(location, "to")
                      }
                      iconName="place"
                      containerWidth="100%"
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.bottomControls}>
            <View style={styles.searchSection}>
              <TouchableOpacity
                style={styles.searchBtn}
                onPress={handleSearchAsPassenger}
              >
                <MaterialIcons name="search" size={20} color={COLORS.WHITE} />
                <Text style={styles.searchBtnText}>Tìm chuyến đi</Text>
              </TouchableOpacity>

              {/* <Text style={styles.listTitle}>
                {(fromLocation && toLocation) 
                  ? `Chuyến đi từ ${fromLocation} đến ${toLocation}`
                  : 'Các chuyến đi có sẵn'}
              </Text> */}
            </View>

            <FlatList
              data={availableRides}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.rideCard}>
                  <View style={styles.rideHeader}>
                    <View style={styles.driverInfo}>
                      <Text style={styles.driverName}>{item.driverName}</Text>
                      <View style={styles.driverRating}>
                        <MaterialIcons
                          name="star"
                          size={16}
                          color={COLORS.ORANGE_DARK}
                        />
                        <Text style={styles.ratingText}>{item.rating}</Text>
                      </View>
                    </View>
                    <Text style={styles.price}>{item.price}</Text>
                  </View>
                  <View style={styles.rideDetails}>
                    <Text style={styles.carModel}>{item.carModel}</Text>
                    <Text style={styles.seatsInfo}>
                      Còn {item.availableSeats} chỗ trống
                    </Text>
                  </View>
                  <View style={styles.routeInfo}>
                    <MaterialIcons
                      name="radio-button-checked"
                      size={16}
                      color={COLORS.GREEN}
                    />
                    <Text style={styles.routeText}>{item.fromLocation}</Text>
                  </View>
                  <View style={styles.routeInfo}>
                    <MaterialIcons name="place" size={16} color={COLORS.RED} />
                    <Text style={styles.routeText}>{item.toLocation}</Text>
                  </View>
                  <View style={styles.timeContainer}>
                    <MaterialIcons
                      name="access-time"
                      size={16}
                      color={COLORS.BLUE}
                    />
                    <Text style={styles.timeText}>
                      Khởi hành lúc {item.departureTime}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.joinBtn}
                    onPress={() => {
                      navigation.navigate("MatchedRide", {
                        isDriver: false,
                        driverName: item.driverName,
                        driverPhone: "0901234569",
                        driverAvatar: `https://i.pravatar.cc/150?img=${
                          item.id + 10
                        }`,
                        vehicleModel: item.carModel,
                        licensePlate: `30A-${12345 + item.id}`,
                        from: fromLocation || item.fromLocation,
                        to: toLocation || item.toLocation,
                        departureTime: item.departureTime,
                        price: item.price,
                        duration: "30 phút",
                        distance: "12 km",
                        rideId: item.id,
                      });
                    }}
                  >
                    <Text style={styles.joinBtnText}>Tham gia chuyến đi</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={[
                styles.ridesListContent,
                { paddingBottom: insets.bottom },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Driver Selection Modal */}
      <Modal
        visible={isDriverModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          if (searchInterval) {
            clearInterval(searchInterval);
            setSearchInterval(null);
          }
          setIsDriverModalVisible(false);
          setIsSearching(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              if (searchInterval) {
                clearInterval(searchInterval);
                setSearchInterval(null);
              }
              setIsDriverModalVisible(false);
              setIsSearching(false);
            }}
          />
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn tài xế</Text>
              <TouchableOpacity
                onPress={() => {
                  if (searchInterval) {
                    clearInterval(searchInterval);
                    setSearchInterval(null);
                  }
                  setIsDriverModalVisible(false);
                  setIsSearching(false);
                }}
              >
                <MaterialIcons name="close" size={24} color={COLORS.BLACK} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              {isSearching
                ? `Đang tìm kiếm... (${searchTimeLeft}s)`
                : `${availableDrivers.length} tài xế đang tìm hành khách từ ${fromLocation} đến ${toLocation}`}
            </Text>

            <FlatList
              data={availableDrivers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.driverCard}
                  onPress={() => handleSelectDriver(item)}
                >
                  <Image
                    source={{ uri: item.driverAvatar }}
                    style={styles.driverAvatar}
                  />
                  <View style={styles.driverInfo}>
                    <Text style={styles.driverName}>{item.driverName}</Text>
                    <View style={styles.driverDetails}>
                      <MaterialIcons
                        name="phone"
                        size={14}
                        color={COLORS.GRAY}
                      />
                      <Text style={styles.driverPhone}>{item.driverPhone}</Text>
                    </View>
                    <View style={styles.driverDetails}>
                      <MaterialIcons
                        name="star"
                        size={14}
                        color={COLORS.ORANGE_DARK}
                      />
                      <Text style={styles.driverRating}>{item.rating}</Text>
                      <Text style={styles.driverReviews}>(10 đánh giá)</Text>
                    </View>
                    <Text style={styles.carInfo}>
                      {item.carModel} - {item.licensePlate}
                    </Text>
                  </View>
                  <View style={styles.driverActions}>
                    <Text style={styles.price}>{formatVND(item.price)}</Text>
                    <TouchableOpacity
                      style={styles.selectBtn}
                      onPress={() => handleSelectDriver(item)}
                    >
                      <MaterialIcons
                        name="check-circle"
                        size={20}
                        color={COLORS.GREEN}
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}
              style={[styles.driversList, { paddingBottom: insets.bottom }]}
            />
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        visible={isConfirmationModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsConfirmationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.confirmationModal, { paddingBottom: insets.bottom }]}
          >
            <View style={styles.confirmationHeader}>
              <Text style={styles.confirmationTitle}>Xác nhận ghép chuyến</Text>
              <TouchableOpacity
                onPress={() => setIsConfirmationModalVisible(false)}
                style={styles.closeBtn}
              >
                <MaterialIcons name="close" size={24} color={COLORS.GRAY} />
              </TouchableOpacity>
            </View>

            {selectedDriver && (
              <View style={styles.confirmationContent}>
                <View style={styles.confirmationDriverCard}>
                  <Image
                    source={{ uri: selectedDriver.driverAvatar }}
                    style={styles.confirmationAvatar}
                  />
                  <View style={styles.confirmationDriverInfo}>
                    <Text style={styles.confirmationDriverName}>
                      {selectedDriver.driverName}
                    </Text>
                    <View style={styles.confirmationDriverDetails}>
                      <MaterialIcons
                        name="phone"
                        size={16}
                        color={COLORS.GRAY}
                      />
                      <Text style={styles.confirmationDriverPhone}>
                        {selectedDriver.driverPhone}
                      </Text>
                    </View>
                    <View style={styles.confirmationDriverDetails}>
                      <MaterialIcons
                        name="directions-car"
                        size={16}
                        color={COLORS.GRAY}
                      />
                      <Text style={styles.confirmationVehicle}>
                        {selectedDriver.carModel} -{" "}
                        {selectedDriver.licensePlate}
                      </Text>
                    </View>
                    <View style={styles.confirmationDriverDetails}>
                      <MaterialIcons
                        name="location-on"
                        size={16}
                        color={COLORS.GRAY}
                      />
                      <Text style={styles.confirmationRoute}>
                        {fromLocation} → {toLocation}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.confirmationPrice}>
                  <Text style={styles.priceLabel}>Giá dự kiến:</Text>
                  <Text style={styles.priceValue}>
                    {formatVND(selectedDriver.price)}
                  </Text>
                </View>

                <View style={styles.confirmationWarning}>
                  <MaterialIcons name="info" size={20} color={COLORS.ORANGE} />
                  <Text style={styles.confirmationWarningText}>
                    Sau khi xác nhận, tài xế sẽ bắt đầu đến đón bạn. Vui lòng
                    chuẩn bị và đảm bảo thông tin liên lạc chính xác.
                  </Text>
                </View>

                <View style={styles.confirmationActions}>
                  <TouchableOpacity
                    style={[styles.confirmationBtn, styles.cancelBtn]}
                    onPress={() => setIsConfirmationModalVisible(false)}
                  >
                    <Text style={styles.cancelBtnText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmationBtn, styles.confirmBtn]}
                    onPress={handleConfirmDriverSelection}
                  >
                    <Text style={styles.confirmBtnText}>Ghép chuyến</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  safeArea: {
    backgroundColor: COLORS.WHITE,
    zIndex: 1000,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  backBtn: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.BLACK,
    flex: 1,
  },
  headerSpacer: {
    width: 39,
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
    zIndex: 100,
    justifyContent: "space-between",
  },
  topControls: {
    paddingHorizontal: 15,
    paddingTop: 10,
    zIndex: 3000,
  },
  bottomControls: {
    paddingHorizontal: 15,
    paddingBottom: 15,
    paddingTop: 10,
    maxHeight: "50%",
    backgroundColor: "transparent",
  },
  searchSection: {
    marginBottom: 10,
  },
  inputContainerWrapper: {
    position: "relative",
  },
  inputContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 15,
    elevation: 5,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  suggestionsContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 10,
    marginTop: 8,
    elevation: 20,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    maxHeight: 200,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  suggestionContent: {
    flex: 1,
    marginLeft: 8,
  },
  suggestionTitle: {
    fontSize: 13,
    color: COLORS.BLACK,
    fontWeight: "500",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  locationRowTo: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginRight: 80,
  },
  locationSearchWrapper: {
    flex: 1,
  },
  currentLocationBtn: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
    width: 72,
    justifyContent: "center",
    marginTop: 5,
  },
  currentLocationText: {
    color: COLORS.WHITE,
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },
  searchBtn: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    padding: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    marginBottom: 10,
  },
  searchBtnText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  ridesListContent: {
    paddingBottom: 20,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.BLACK,
    marginBottom: 10,
    backgroundColor: COLORS.WHITE,
    padding: 10,
    borderRadius: 10,
    elevation: 3,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  rideCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 3,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rideHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.BLACK,
    marginBottom: 4,
  },
  driverRating: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 13,
    color: COLORS.BLACK,
    marginLeft: 5,
    fontWeight: "500",
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.PRIMARY,
  },
  rideDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  carModel: {
    fontSize: 14,
    color: COLORS.BLACK,
    fontWeight: "500",
  },
  seatsInfo: {
    fontSize: 13,
    color: COLORS.BLUE,
    fontWeight: "500",
  },
  routeInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  routeText: {
    fontSize: 13,
    color: COLORS.BLACK,
    marginLeft: 8,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  timeText: {
    fontSize: 13,
    color: COLORS.BLUE,
    fontWeight: "600",
    marginLeft: 8,
  },
  joinBtn: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  joinBtnText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: "bold",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    minHeight: "40%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.BLACK,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.GRAY,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  driversList: {
    paddingHorizontal: 20,
  },
  driverCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.BG,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    borderColor: COLORS.BLUE,
    borderWidth: 2,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.BLACK,
    marginBottom: 4,
  },
  driverDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  driverPhone: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginLeft: 4,
  },
  driverRating: {
    fontSize: 12,
    color: COLORS.ORANGE_DARK,
    marginLeft: 4,
  },
  driverReviews: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginLeft: 4,
  },
  carInfo: {
    fontSize: 12,
    color: COLORS.BLUE,
    marginTop: 4,
  },
  driverActions: {
    alignItems: "center",
  },
  selectBtn: {
    marginTop: 5,
  },
  // Confirmation Modal Styles
  confirmationModal: {
    backgroundColor: COLORS.WHITE,
    margin: 20,
    borderRadius: 16,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  confirmationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.BLACK,
  },
  closeBtn: {
    padding: 4,
  },
  confirmationContent: {
    padding: 20,
  },
  confirmationDriverCard: {
    flexDirection: "row",
    backgroundColor: COLORS.GRAY_LIGHT + "30",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  confirmationAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.GRAY_LIGHT,
    borderColor: COLORS.BLUE,
    borderWidth: 2,
  },
  confirmationDriverInfo: {
    flex: 1,
    marginLeft: 16,
  },
  confirmationDriverName: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.BLACK,
    marginBottom: 8,
  },
  confirmationDriverDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  confirmationDriverPhone: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginLeft: 6,
  },
  confirmationVehicle: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginLeft: 6,
    flex: 1,
  },
  confirmationRoute: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginLeft: 6,
    flex: 1,
  },
  confirmationPrice: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.GREEN + "10",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 16,
    color: COLORS.BLACK,
    fontWeight: "500",
  },
  priceValue: {
    fontSize: 18,
    color: COLORS.GREEN,
    fontWeight: "600",
  },
  confirmationWarning: {
    flexDirection: "row",
    backgroundColor: COLORS.ORANGE + "10",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.ORANGE,
  },
  confirmationWarningText: {
    fontSize: 14,
    color: COLORS.BLACK,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  confirmationActions: {
    flexDirection: "row",
    gap: 12,
  },
  confirmationBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.GRAY,
  },
  confirmBtn: {
    backgroundColor: COLORS.GREEN,
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.WHITE,
  },
});

export default PassengerRideScreen;
