import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
  Alert,
  TextInput,
  FlatList,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useNavigation } from "@react-navigation/native";
import axiosClient from "../../../api/axiosClient";
import endpoints from "../../../api/endpoints";
import COLORS from "../../../constant/colors";
import { ENV } from "../../../config/env";
import Toast from "react-native-toast-message";
import SCREENS from "../../index";
import { searchPlaces } from "../../../utils/api";
import { useDebounce } from "../../../hooks/useDebounce";

const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const DriverPersonalRideScreen = () => {
  const navigation = useNavigation();
  const mapRef = useRef(null);

  const [currentLocation, setCurrentLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 1000);

  // Get current location on mount
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Quyền truy cập vị trí bị từ chối",
        });
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      setCurrentLocation(region);

      // Get address using reverse geocoding if needed
      // For now, just set as "Vị trí hiện tại"
    })();
  }, []);

  // Handle Search
  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length >= 2) {
      performSearch(debouncedQuery);
    } else {
      setSuggestions([]);
      setIsSearching(false);
    }
  }, [debouncedQuery]);

  const performSearch = async (query) => {
    setIsSearching(true);
    try {
      const results = await searchPlaces(query);
      setSuggestions(results);
    } catch (error) {
      console.error("Search error:", error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLocation = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);

    const newDest = {
      latitude: lat,
      longitude: lng,
      address: item.display_name,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };

    setDestination(newDest);
    setSearchQuery(item.display_name);
    setSuggestions([]); // Clear suggestions

    // Fit map to both points
    if (currentLocation && mapRef.current) {
      setTimeout(() => {
        mapRef.current.fitToCoordinates([currentLocation, newDest], {
          edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
          animated: true,
        });
      }, 500);
    }
  };

  const handleStartRide = async () => {
    if (!destination || !currentLocation) {
      Toast.show({
        type: "error",
        text1: "Vui lòng chọn điểm đến",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log("🚀 Starting personal ride...");
      console.log("📍 Pickup:", currentLocation);
      console.log("📍 Dest:", destination);

      const payload = {
        pickupLatitude: currentLocation.latitude,
        pickupLongitude: currentLocation.longitude,
        pickupAddress: "Vị trí hiện tại", // TODO: Reverse geocode
        destinationLatitude: destination.latitude,
        destinationLongitude: destination.longitude,
        destinationAddress: destination.address,
        passengerName: "Khách vãng lai", // Or driver's name
        passengerPhone: "",
      };

      const response = await axiosClient.post(
        endpoints.driver.personalRide,
        payload
      );

      console.log("✅ Personal ride created:", response.data);

      if (response.data?.statusCode === 200) {
        const matchData = response.data.data;

        Toast.show({
          type: "success",
          text1: "Bắt đầu chuyến đi thành công!",
        });

        // Navigate to MatchedRideScreen
        navigation.navigate("MatchedRide", {
          // Standard data for MatchedRideScreen
          id: matchData.id,
          rideId: matchData.id,
          status: matchData.status,

          // Coordinates
          pickupLatitude: matchData.pickupLatitude,
          pickupLongitude: matchData.pickupLongitude,
          destinationLatitude: matchData.destinationLatitude,
          destinationLongitude: matchData.destinationLongitude,

          // Addresses
          pickupAddress: matchData.pickupAddress,
          destinationAddress: matchData.destinationAddress,
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
      }
    } catch (error) {
      console.error("❌ Start personal ride error:", error);
      Toast.show({
        type: "error",
        text1: "Không thể bắt đầu chuyến đi",
        text2: error.response?.data?.message || "Lỗi không xác định",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderSuggestionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSelectLocation(item)}
    >
      <View style={styles.iconContainer}>
        <MaterialIcons name="place" size={20} color={COLORS.PRIMARY} />
      </View>
      <View style={styles.suggestionContent}>
        <Text style={styles.suggestionText} numberOfLines={2}>
          {item.display_name}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={currentLocation}
        showsUserLocation={true}
      >
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Điểm đón"
            pinColor={COLORS.BLUE}
          />
        )}
        {destination && (
          <Marker
            coordinate={destination}
            title="Điểm đến"
            pinColor={COLORS.RED}
          />
        )}
      </MapView>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>

      <View style={styles.headerInput}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={COLORS.GRAY}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Nhập điểm đến..."
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (text.length === 0) {
                setSuggestions([]);
                setDestination(null);
              }
            }}
            placeholderTextColor={COLORS.GRAY}
          />
          {isSearching && <ActivityIndicator size="small" color="#FF5370" />}
          {searchQuery.length > 0 && !isSearching && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                setSuggestions([]);
                setDestination(null);
              }}
            >
              <Ionicons name="close-circle" size={20} color={COLORS.GRAY} />
            </TouchableOpacity>
          )}
        </View>

        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={suggestions}
              renderItem={renderSuggestionItem}
              keyExtractor={(item, index) => item.place_id || index.toString()}
              style={styles.suggestionsList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        )}
      </View>

      {destination && (
        <View style={styles.bottomCard}>
          <View style={styles.locationInfo}>
            <View style={styles.iconContainerBig}>
              <Ionicons name="location" size={24} color={COLORS.RED} />
            </View>
            <View style={styles.addressContainer}>
              <Text style={styles.addressLabel}>Điểm đến</Text>
              <Text style={styles.addressText} numberOfLines={2}>
                {destination.address}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.startButton, isLoading && styles.disabledButton]}
            onPress={handleStartRide}
            disabled={isLoading}
          >
            <Text style={styles.startButtonText}>
              {isLoading ? "Đang xử lý..." : "Bắt đầu chuyến đi của tôi"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 40,
    left: 20,
    zIndex: 10,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  headerInput: {
    position: "absolute",
    top: Platform.OS === "ios" ? 110 : 100, // Below back button
    left: 20,
    right: 20,
    zIndex: 5,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  suggestionsContainer: {
    backgroundColor: "white",
    marginTop: 8,
    borderRadius: 8,
    maxHeight: 250,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    overflow: "hidden",
  },
  suggestionsList: {
    paddingVertical: 4,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  iconContainer: {
    marginRight: 10,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 14,
    color: "#333",
  },
  bottomCard: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  iconContainerBig: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFEBEE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  addressContainer: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.BLACK,
  },
  startButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: COLORS.GRAY,
  },
  startButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default DriverPersonalRideScreen;
