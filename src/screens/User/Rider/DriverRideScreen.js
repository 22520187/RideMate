import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  TextInput,
  Modal,
  FlatList,
  ScrollView,
  AppState,
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
import {
  searchPlaces as osmSearchPlaces,
  getRoute as osrmGetRoute,
} from "../../../utils/api";
import { useSharedPath } from "../../../hooks/useSharedPath";

const DriverRideScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [refreshKey, setRefreshKey] = useState(0);
  const { updatePath } = useSharedPath();

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
  const [routeInfo, setRouteInfo] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const [isLoadingDirections, setIsLoadingDirections] = useState(false);
  const [isScheduleModalVisible, setIsScheduleModalVisible] = useState(false);
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleFromText, setScheduleFromText] = useState("");
  const [scheduleToText, setScheduleToText] = useState("");
  const [scheduleFromSuggestions, setScheduleFromSuggestions] = useState([]);
  const [scheduleToSuggestions, setScheduleToSuggestions] = useState([]);
  const [scheduleOriginCoordinate, setScheduleOriginCoordinate] =
    useState(null);
  const [scheduleDestinationCoordinate, setScheduleDestinationCoordinate] =
    useState(null);
  const [scheduledRide, setScheduledRide] = useState(null);
  const [activeInput, setActiveInput] = useState(null); // 'from' or 'to'
  const [isPassengerModalVisible, setIsPassengerModalVisible] = useState(false);
  const [availablePassengers, setAvailablePassengers] = useState([]);

  // Update path để MatchedRideScreen dùng chung thông qua hook useSharedPath để lưu trữ
  useEffect(() => {
    updatePath(routePath);
  }, [routePath]);

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

  const calculatePrice = (distanceKm) => {
    const basePrice = 15000;
    const pricePerKm = 3000;
    return Math.round(basePrice + distanceKm * pricePerKm);
  };

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

  const handleScheduleSuggestions = async (query, type) => {
    if (query.length < 3) return;
    try {
      const suggestions = await searchPlacesAPI(query);
      if (type === "from") {
        setScheduleFromSuggestions(suggestions);
      } else {
        setScheduleToSuggestions(suggestions);
      }
    } catch (error) {
      if (type === "from") {
        setScheduleFromSuggestions([]);
      } else {
        setScheduleToSuggestions([]);
      }
    }
  };

  const handleScheduleSelect = (location, type) => {
    if (type === "from") {
      setScheduleOriginCoordinate(location);
      setScheduleFromSuggestions([]);
    } else {
      setScheduleDestinationCoordinate(location);
      setScheduleToSuggestions([]);
    }
  };

  const handleConfirmSchedule = () => {
    if (!scheduleFromText || !scheduleToText || !scheduleTime) {
      Alert.alert(
        "Lỗi",
        "Vui lòng nhập đầy đủ thời gian, điểm xuất phát và điểm đến"
      );
      return;
    }

    setScheduledRide({
      time: scheduleTime,
      from: scheduleFromText,
      to: scheduleToText,
    });

    setFromLocation(scheduleFromText);
    setToLocation(scheduleToText);
    setOriginCoordinate(scheduleOriginCoordinate || null);
    setDestinationCoordinate(scheduleDestinationCoordinate || null);
    setIsScheduleModalVisible(false);
    Alert.alert("Đã đặt lịch", `Khởi hành lúc ${scheduleTime}`);
  };

  const handleCancelSchedule = () => {
    Alert.alert("Xóa lịch trình", "Bạn có chắc muốn xóa lịch trình này?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => {
          setScheduledRide(null);
          setFromLocation("");
          setToLocation("");
          setOriginCoordinate(null);
          setDestinationCoordinate(null);
          Alert.alert("Thành công", "Đã xóa lịch trình");
        },
      },
    ]);
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

  const handleSearchAsDriver = async () => {
    if (!fromLocation || !toLocation) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ điểm xuất phát và điểm đến");
      return;
    }
    if (!originCoordinate || !destinationCoordinate) {
      Alert.alert("Lỗi", "Vui lòng chọn địa điểm từ danh sách gợi ý");
      return;
    }

    setIsLoadingDirections(true);
    try {
      const path = await osrmGetRoute(originCoordinate, destinationCoordinate);
      setRoutePath(path);

      let distanceKm = 0;
      for (let i = 1; i < path.length; i++) {
        const a = path[i - 1];
        const b = path[i];
        const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
        const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
        const lat1 = (a.latitude * Math.PI) / 180;
        const lat2 = (b.latitude * Math.PI) / 180;
        const sinDLat = Math.sin(dLat / 2);
        const sinDLon = Math.sin(dLon / 2);
        const h =
          sinDLat * sinDLat +
          Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
        const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
        distanceKm += 6371 * c;
      }
      const durationMinutes = Math.round(distanceKm * 2.5);
      const price = calculatePrice(distanceKm);

      setRouteInfo({
        distance: `${distanceKm.toFixed(1)} km`,
        duration: `${durationMinutes} phút`,
        price: `${price.toLocaleString("vi-VN")}đ`,
      });

      // Mock data for available passengers
      const mockPassengers = [
        {
          id: 1,
          name: "Nguyễn Văn A",
          phone: "0901234567",
          avatar: "https://i.pravatar.cc/150?img=12",
          departureTime: "14:30",
          from: "Bến Xe Giáp Bát",
          to: toLocation,
          rating: 4.8,
          reviews: 23,
        },
        {
          id: 2,
          name: "Trần Thị B",
          phone: "0901234568",
          avatar: "https://i.pravatar.cc/150?img=13",
          departureTime: "15:00",
          from: "Nhà ga Hà Nội",
          to: toLocation,
          rating: 4.9,
          reviews: 45,
        },
        {
          id: 3,
          name: "Lê Văn C",
          phone: "0901234569",
          avatar: "https://i.pravatar.cc/150?img=14",
          departureTime: "15:30",
          from: "Aeon Mall Long Biên",
          to: toLocation,
          rating: 4.7,
          reviews: 18,
        },
      ];
      setAvailablePassengers(mockPassengers);
      setIsPassengerModalVisible(true);
      // Alert.alert('Đã tìm thấy hành khách!', `Có ${mockPassengers.length} người đang tìm đi cùng`)
    } catch (error) {
      console.error("Error getting directions:", error);
      Alert.alert(
        "Lỗi",
        "Không thể lấy thông tin tuyến đường. Vui lòng thử lại."
      );
    } finally {
      setIsLoadingDirections(false);
    }
  };

  const handleSelectPassenger = (passenger) => {
    const durationMinutes = Math.round(
      parseFloat(routeInfo.distance.replace(" km", "")) * 2.5
    );
    const distanceKm = parseFloat(routeInfo.distance.replace(" km", ""));
    const price = calculatePrice(distanceKm);

    navigation.navigate("MatchedRide", {
      isDriver: true,
      passengerName: passenger.name,
      passengerPhone: passenger.phone,
      passengerAvatar: passenger.avatar,
      from: fromLocation,
      to: toLocation,
      departureTime: scheduledRide?.time || passenger.departureTime,
      price: routeInfo.price,
      duration: routeInfo.duration,
      distance: routeInfo.distance,
    });
    setIsPassengerModalVisible(false);
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
          <Text style={styles.headerTitle}>Tạo chuyến đi</Text>
          <View style={styles.headerRight}>
            {scheduledRide ? (
              <TouchableOpacity
                style={[styles.headerScheduleBtn, styles.headerCancelBtn]}
                onPress={handleCancelSchedule}
              >
                <MaterialIcons
                  name="event-busy"
                  size={18}
                  color={COLORS.WHITE}
                />
                <Text style={styles.headerScheduleText}>Xóa lịch</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.headerScheduleBtn}
                onPress={() => setIsScheduleModalVisible(true)}
              >
                <MaterialIcons name="event" size={18} color={COLORS.WHITE} />
                <Text style={styles.headerScheduleText}>Đặt lịch</Text>
              </TouchableOpacity>
            )}
          </View>
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
                      forceHideSuggestions={isLoadingDirections}
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
                      forceHideSuggestions={isLoadingDirections}
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.bottomControls} pointerEvents="box-none">
            {routeInfo && (
              <View style={styles.routeInfoContainer} pointerEvents="auto">
                <View style={styles.routeInfoRow}>
                  <View style={styles.routeInfoItem}>
                    <MaterialIcons
                      name="directions-car"
                      size={16}
                      color={COLORS.PRIMARY}
                    />
                    <Text style={styles.routeInfoText}>
                      {routeInfo.distance}
                    </Text>
                  </View>
                  <View style={styles.routeInfoItem}>
                    <MaterialIcons
                      name="access-time"
                      size={16}
                      color={COLORS.BLUE}
                    />
                    <Text style={styles.routeInfoText}>
                      {routeInfo.duration}
                    </Text>
                  </View>
                  <View style={styles.routeInfoItem}>
                    <MaterialIcons
                      name="attach-money"
                      size={16}
                      color={COLORS.GREEN}
                    />
                    <Text style={styles.routeInfoText}>{routeInfo.price}</Text>
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.searchBtn,
                isLoadingDirections && styles.searchBtnDisabled,
              ]}
              onPress={handleSearchAsDriver}
              disabled={isLoadingDirections}
              pointerEvents="auto"
            >
              <MaterialIcons
                name={isLoadingDirections ? "hourglass-empty" : "search"}
                size={20}
                color={COLORS.WHITE}
              />
              <Text style={styles.searchBtnText}>
                {isLoadingDirections ? "Đang tìm kiếm..." : "Tìm người đi cùng"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Modal đặt lịch */}
      <Modal
        visible={isScheduleModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsScheduleModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Đặt lịch chuyến</Text>
            <FlatList
              data={[]}
              keyExtractor={(item, index) => `modal-${index}`}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                <View>
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>Thời gian khởi hành</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="HH:MM DD/MM/YYYY"
                      value={scheduleTime}
                      onChangeText={setScheduleTime}
                      placeholderTextColor={COLORS.PLACEHOLDER_COLOR}
                    />
                  </View>
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>Điểm xuất phát</Text>
                    <LocationSearch
                      placeholder="Nhập điểm xuất phát"
                      value={scheduleFromText}
                      onChangeText={setScheduleFromText}
                      onLocationSelect={(loc) =>
                        handleScheduleSelect(loc, "from")
                      }
                      suggestions={scheduleFromSuggestions}
                      showSuggestions={scheduleFromText.length > 2}
                      onRequestSuggestions={(q) =>
                        handleScheduleSuggestions(q, "from")
                      }
                      iconName="my-location"
                    />
                  </View>
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>Điểm đến</Text>
                    <LocationSearch
                      placeholder="Nhập điểm đến"
                      value={scheduleToText}
                      onChangeText={setScheduleToText}
                      onLocationSelect={(loc) =>
                        handleScheduleSelect(loc, "to")
                      }
                      suggestions={scheduleToSuggestions}
                      showSuggestions={scheduleToText.length > 2}
                      onRequestSuggestions={(q) =>
                        handleScheduleSuggestions(q, "to")
                      }
                      iconName="place"
                    />
                  </View>
                </View>
              }
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancel]}
                onPress={() => setIsScheduleModalVisible(false)}
              >
                <Text style={styles.modalBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalConfirm]}
                onPress={handleConfirmSchedule}
              >
                <Text style={[styles.modalBtnText, styles.modalConfirmText]}>
                  Xác nhận
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Passenger Selection Modal */}
      <Modal
        visible={isPassengerModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsPassengerModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsPassengerModalVisible(false)}
          />
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn hành khách</Text>
              <TouchableOpacity
                onPress={() => setIsPassengerModalVisible(false)}
              >
                <MaterialIcons name="close" size={24} color={COLORS.BLACK} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              {availablePassengers.length} người đang tìm đi cùng từ{" "}
              {fromLocation} đến {toLocation}
            </Text>

            <FlatList
              data={availablePassengers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.passengerCard}
                  onPress={() => handleSelectPassenger(item)}
                >
                  <Image
                    source={{ uri: item.avatar }}
                    style={styles.passengerAvatar}
                  />
                  <View style={styles.passengerInfo}>
                    <Text style={styles.passengerName}>{item.name}</Text>
                    <View style={styles.passengerDetails}>
                      <MaterialIcons
                        name="phone"
                        size={14}
                        color={COLORS.GRAY}
                      />
                      <Text style={styles.passengerPhone}>{item.phone}</Text>
                    </View>
                    <View style={styles.passengerDetails}>
                      <MaterialIcons
                        name="star"
                        size={14}
                        color={COLORS.ORANGE_DARK}
                      />
                      <Text style={styles.passengerRating}>{item.rating}</Text>
                      <Text style={styles.passengerReviews}>
                        ({item.reviews} đánh giá)
                      </Text>
                    </View>
                  </View>
                  <View style={styles.passengerActions}>
                    <Text style={styles.departureTime}>
                      {item.departureTime}
                    </Text>
                    <TouchableOpacity
                      style={styles.selectBtn}
                      onPress={() => handleSelectPassenger(item)}
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
              style={[styles.passengersList, { paddingBottom: insets.bottom }]}
            />
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerScheduleBtn: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  headerCancelBtn: {
    backgroundColor: COLORS.RED,
  },
  headerScheduleText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
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
    zIndex: 100,
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
  routeInfoContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 5,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  routeInfoRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  routeInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.BLUE_LIGHT,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  routeInfoText: {
    fontSize: 12,
    color: COLORS.BLACK,
    marginLeft: 5,
    fontWeight: "600",
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
  },
  searchBtnText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  searchBtnDisabled: {
    backgroundColor: COLORS.GRAY,
    opacity: 0.7,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: Dimensions.get("window").height * 0.85,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.BLACK,
    marginBottom: 10,
    textAlign: "center",
  },
  modalField: {
    marginVertical: 8,
  },
  modalLabel: {
    fontSize: 14,
    color: COLORS.GRAY_DARK,
    marginBottom: 6,
    fontWeight: "600",
  },
  modalInput: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
    fontSize: 16,
    color: COLORS.BLACK,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCancel: {
    backgroundColor: COLORS.GRAY_BG,
    marginRight: 10,
  },
  modalConfirm: {
    backgroundColor: COLORS.PRIMARY,
    marginLeft: 10,
  },
  modalBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  modalConfirmText: {
    color: COLORS.WHITE,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginBottom: 16,
    textAlign: "center",
  },
  passengersList: {
    maxHeight: 400,
  },
  passengerCard: {
    flexDirection: "row",
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  passengerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  passengerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.BLACK,
    marginBottom: 4,
  },
  passengerDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  passengerPhone: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginLeft: 4,
  },
  passengerRating: {
    fontSize: 12,
    color: COLORS.ORANGE_DARK,
    marginLeft: 4,
    fontWeight: "600",
  },
  passengerReviews: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginLeft: 4,
  },
  passengerActions: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  departureTime: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginBottom: 4,
  },
  selectBtn: {
    backgroundColor: COLORS.GREEN + "20",
    borderRadius: 20,
    padding: 4,
  },
});

export default DriverRideScreen;
