import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
  Modal,
  Image,
  SafeAreaView,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../../config/supabaseClient";
import axiosClient from "../../../api/axiosClient";
import endpoints from "../../../api/endpoints";
import COLORS from "../../../constant/colors";
import Toast from "react-native-toast-message";
import useDriverOnlineStatus from "../../../hooks/useDriverOnlineStatus";
import SCREENS from "../../index";

const { width, height } = Dimensions.get("window");

const DriverMapScreen = ({ route }) => {
  const navigation = useNavigation();
  const mapRef = useRef(null);
  const { isOnline, setOnlineStatus } = useDriverOnlineStatus();

  const [currentLocation, setCurrentLocation] = useState(null);
  const [newMatch, setNewMatch] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initial location and permission
  useEffect(() => {
    (async () => {
      // Check if we have initialLocation from params (e.g., after completing a ride)
      const initialLocation = route?.params?.initialLocation;
      if (initialLocation) {
        console.log("📍 Using initialLocation from params:", initialLocation);

        // Set location từ params
        const newLocation = {
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setCurrentLocation(newLocation);

        // Animate map đến vị trí mới
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.animateToRegion(newLocation, 1000);
          }
        }, 500);

        // Update driver location in backend (database sẽ có location mới)
        try {
          await axiosClient.post(endpoints.driver.location, {
            latitude: initialLocation.latitude,
            longitude: initialLocation.longitude,
          });
          console.log("✅ Driver location synced with backend (destination)");
        } catch (error) {
          console.warn("⚠️ Failed to sync location:", error);
        }

        // GPS sẽ tự động cập nhật blue dot về vị trí thực tế
        // (Không cần fake, để GPS hoạt động tự nhiên)
        return;
      }

      // Otherwise, fetch location from Supabase (driver_locations table)
      try {
        console.log("📡 Fetching driver location from Supabase...");

        // Get current user profile to get driver_id
        const profileResponse = await axiosClient.get(endpoints.user.profile);
        const driverId = profileResponse?.data?.data?.id;

        if (!driverId) {
          console.warn("⚠️ No driver ID found");
          throw new Error("No driver ID");
        }

        console.log("👤 Driver ID:", driverId);

        const { data, error } = await supabase
          .from("driver_locations")
          .select("latitude, longitude")
          .eq("driver_id", driverId)
          .limit(1);

        if (error) {
          console.warn("⚠️ Supabase error:", error.message);
          throw error;
        }

        console.log("📦 Supabase response:", {
          data,
          hasData: !!data,
          length: data?.length,
        });

        if (data && data.length > 0 && data[0].latitude && data[0].longitude) {
          const dbLocation = data[0];
          console.log("✅ Found location in Supabase:", dbLocation);

          const savedLocation = {
            latitude: dbLocation.latitude,
            longitude: dbLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };

          setCurrentLocation(savedLocation);

          // Animate map đến vị trí từ database
          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.animateToRegion(savedLocation, 1000);
            }
          }, 500);

          console.log("📍 Using location from Supabase (last saved position)");
          return;
        } else {
          console.log("⚠️ No location data in Supabase");
        }
      } catch (error) {
        console.warn("⚠️ Failed to fetch location from Supabase:", error);
      }

      // Fallback: get current GPS location nếu không có trong Supabase
      console.log("📍 No Supabase location, using GPS...");
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Quyền truy cập vị trí bị từ chối",
          text2: "Vui lòng cấp quyền để nhận chuyến",
        });
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, [route?.params?.initialLocation]);

  // NOTE: Location updates are handled by backend/Supabase
  // Client chỉ fetch location từ Supabase, không tự update
  // Backend sẽ handle việc track GPS và update Supabase

  // Subscribe to Realtime Matches
  useEffect(() => {
    if (!isOnline) return;

    console.log("📡 Subscribing to matches...");

    // Subscribe to INSERT events on matches table
    const subscription = supabase
      .channel("driver-matches-map")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "matches",
          filter: `status=eq.WAITING`,
        },
        async (payload) => {
          console.log("🔔 New match received:", payload.new);

          const match = payload.new;

          // ⚠️ IMPORTANT: Supabase payload doesn't include joined user data
          // We MUST fetch full details from API to get passenger info
          try {
            const response = await axiosClient.get(
              endpoints.match.getById(match.id)
            );

            if (response?.data?.data) {
              const fullMatchData = response.data.data;

              console.log("📋 Full match data for modal:", {
                passengerName: fullMatchData.passengerName,
                passengerPhone: fullMatchData.passengerPhone,
                pickupAddress: fullMatchData.pickupAddress,
                coin: fullMatchData.coin,
              });

              setNewMatch(fullMatchData);
              setModalVisible(true);
            }
          } catch (error) {
            console.error("❌ Error fetching match details for modal:", error);
            // Fallback: show modal with limited data
            setNewMatch(match);
            setModalVisible(true);
          }

          // Play sound or vibrate here
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [isOnline]);

  const handleToggleOnline = async (value) => {
    setOnlineStatus(value);

    // Update backend status
    try {
      if (value) {
        // Bật ONLINE: Fetch location từ Supabase và update backend
        console.log("🟢 Going ONLINE - Fetching location from Supabase...");

        // Get driver ID
        const profileResponse = await axiosClient.get(endpoints.user.profile);
        const driverId = profileResponse?.data?.data?.id;

        if (driverId) {
          // Fetch location từ Supabase
          const { data, error } = await supabase
            .from("driver_locations")
            .select("latitude, longitude")
            .eq("driver_id", driverId)
            .limit(1);

          if (!error && data && data.length > 0) {
            const dbLocation = data[0];
            console.log("✅ Using location from Supabase:", dbLocation);

            // Update currentLocation state
            setCurrentLocation({
              latitude: dbLocation.latitude,
              longitude: dbLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });

            // Animate map
            if (mapRef.current) {
              mapRef.current.animateToRegion(
                {
                  latitude: dbLocation.latitude,
                  longitude: dbLocation.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                },
                1000
              );
            }
          }
        }

        // Update backend status
        await axiosClient.post(
          `${endpoints.driver.location}/status?status=ONLINE`
        );
        Toast.show({
          type: "success",
          text1: "Bạn đang ONLINE",
          text2: "Đang tìm kiếm chuyến đi...",
        });
      } else {
        // Tắt OFFLINE
        await axiosClient.post(
          `${endpoints.driver.location}/status?status=OFFLINE`
        );
        Toast.show({
          type: "info",
          text1: "Bạn đang OFFLINE",
          text2: "Hẹn gặp lại!",
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleAcceptRide = async () => {
    if (!newMatch) return;

    setIsLoading(true);
    try {
      console.log("🚗 Accepting ride:", newMatch.id);
      const response = await axiosClient.post(
        endpoints.match.accept(newMatch.id)
      );

      console.log("✅ Accept ride response:", response);

      // axiosClient returns: { data: { statusCode, message, data } }
      if (response?.data?.statusCode === 200) {
        setModalVisible(false);
        Toast.show({
          type: "success",
          text1: "Nhận chuyến thành công!",
        });

        const matchData = response.data.data;

        console.log("🚗 Full matchData:", matchData);
        console.log(
          "🚗 matchedDriverCandidates:",
          matchData.matchedDriverCandidates
        );
        console.log("🚗 Navigating with match data:", {
          pickupLat: matchData.pickupLatitude,
          pickupLng: matchData.pickupLongitude,
          candidates: matchData.matchedDriverCandidates?.length || 0,
          hasCandidates: !!matchData.matchedDriverCandidates,
        });

        // Navigate to MatchedRideScreen - NO SPREAD to prevent override
        navigation.navigate(SCREENS.MATCHED_RIDE, {
          // Coordinates (mapped)
          originCoordinate: {
            latitude: matchData.pickupLatitude,
            longitude: matchData.pickupLongitude,
            description: matchData.pickupAddress,
          },
          destinationCoordinate: {
            latitude: matchData.destinationLatitude,
            longitude: matchData.destinationLongitude,
            description: matchData.destinationAddress,
          },

          // Addresses
          from: matchData.pickupAddress,
          to: matchData.destinationAddress,
          pickupAddress: matchData.pickupAddress,
          destinationAddress: matchData.destinationAddress,

          // Coordinates (raw)
          pickupLatitude: matchData.pickupLatitude,
          pickupLongitude: matchData.pickupLongitude,
          destinationLatitude: matchData.destinationLatitude,
          destinationLongitude: matchData.destinationLongitude,

          // Match info
          id: matchData.id,
          rideId: matchData.id,
          coin: matchData.coin,
          price: `${matchData.coin || 0} xu`,
          status: matchData.status,

          // Driver info
          isDriver: true,
          driverId: matchData.driverId,
          currentUserId: matchData.driverId,

          // Passenger info
          passengerId: matchData.passengerId,
          passengerName: matchData.passengerName,
          passengerPhone: matchData.passengerPhone,
          passengerAvatar: matchData.passengerAvatar,

          // CRITICAL: Driver candidates with current location
          matchedDriverCandidates: matchData.matchedDriverCandidates,
        });
      } else {
        throw new Error(response?.data?.message || "Invalid response");
      }
    } catch (error) {
      console.error("❌ Accept ride error:", error);
      Toast.show({
        type: "error",
        text1: "Không thể nhận chuyến",
        text2:
          error.response?.data?.message || error.message || "Đã có lỗi xảy ra",
      });
      setModalVisible(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeclineRide = () => {
    setModalVisible(false);
    setNewMatch(null);
  };

  const centerMap = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Status Bar */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => {
              // Navigate về MainTabs (bottom tab navigator)
              navigation.navigate("MainTabs");
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isOnline ? "Đang hoạt động" : "Đang ngoại tuyến"}
          </Text>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={isOnline ? COLORS.PRIMARY : "#f4f3f4"}
            onValueChange={handleToggleOnline}
            value={isOnline}
          />
        </View>
      </SafeAreaView>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={
          currentLocation || {
            latitude: 10.7769,
            longitude: 106.7009,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }
        }
        showsUserLocation={false}
        followsUserLocation={false}
      >
        {/* Custom Marker - Hiển thị vị trí từ Supabase (currentLocation state) */}
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="Vị trí của bạn"
            description="Từ Supabase"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: COLORS.PRIMARY,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 4,
                borderColor: "white",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 3,
                elevation: 5,
              }}
            >
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: "white",
                }}
              />
            </View>
          </Marker>
        )}
      </MapView>

      {/* My Location Button */}
      <TouchableOpacity style={styles.myLocationButton} onPress={centerMap}>
        <MaterialIcons name="my-location" size={24} color={COLORS.PRIMARY} />
      </TouchableOpacity>

      {/* Bottom Status Card */}
      <View style={styles.bottomCard}>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOnline ? "#4CAF50" : "#F44336" },
            ]}
          />
          <Text style={styles.statusText}>
            {isOnline
              ? "Đang tìm kiếm khách hàng quanh đây..."
              : "Bật chế độ Online để nhận chuyến"}
          </Text>
        </View>
        {isOnline && (
          <Text style={styles.subText}>Giữ ứng dụng mở để nhận thông báo</Text>
        )}
      </View>

      {/* New Ride Request Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yêu cầu chuyến đi mới! 🚗</Text>
              <Text style={styles.timerText}>Hết hạn trong 30s</Text>
            </View>

            {newMatch && (
              <View style={styles.rideDetails}>
                <View style={styles.passengerInfo}>
                  <Image
                    source={{
                      uri:
                        newMatch.passengerAvatar || "https://i.pravatar.cc/150",
                    }}
                    style={styles.avatar}
                  />
                  <View>
                    <Text style={styles.passengerName}>
                      {newMatch.passengerName || "Khách hàng"}
                    </Text>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={14} color="#FFD700" />
                      <Text style={styles.ratingText}>5.0</Text>
                    </View>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceText}>
                      {newMatch.coin || 0} xu
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.locationContainer}>
                  <View style={styles.locationItem}>
                    <View
                      style={[styles.dot, { backgroundColor: COLORS.PRIMARY }]}
                    />
                    <View style={styles.locationTextContainer}>
                      <Text style={styles.locationLabel}>Điểm đón</Text>
                      <Text style={styles.addressText} numberOfLines={2}>
                        {newMatch.pickupAddress}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.tripLine} />

                  <View style={styles.locationItem}>
                    <View
                      style={[styles.dot, { backgroundColor: "#F44336" }]}
                    />
                    <View style={styles.locationTextContainer}>
                      <Text style={styles.locationLabel}>Điểm đến</Text>
                      <Text style={styles.addressText} numberOfLines={2}>
                        {newMatch.destinationAddress}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Only check distance if we have coordinates */}
                {currentLocation && newMatch.pickupLatitude && (
                  <View style={styles.tripInfo}>
                    <View style={styles.tripInfoItem}>
                      <Ionicons
                        name="navigate-outline"
                        size={16}
                        color="#666"
                      />
                      <Text style={styles.tripInfoText}>~2.5 km</Text>
                    </View>
                    <View style={styles.tripInfoItem}>
                      <Ionicons name="time-outline" size={16} color="#666" />
                      <Text style={styles.tripInfoText}>~10 phút</Text>
                    </View>
                  </View>
                )}

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.declineButton]}
                    onPress={handleDeclineRide}
                  >
                    <Text style={[styles.buttonText, { color: "#F44336" }]}>
                      Từ chối
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.acceptButton]}
                    onPress={handleAcceptRide}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Text style={styles.buttonText}>Đang nhận...</Text>
                    ) : (
                      <Text style={styles.buttonText}>Nhận chuyến</Text>
                    )}
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
    backgroundColor: "#fff",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingTop: Platform.OS === "android" ? 40 : 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
    height: 60,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  map: {
    flex: 1,
    width: width,
    height: height,
  },
  myLocationButton: {
    position: "absolute",
    bottom: 180,
    right: 20,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  bottomCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 20,
    paddingBottom: 40,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  subText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 22,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  timerText: {
    fontSize: 14,
    color: "#F44336",
    fontWeight: "600",
  },
  passengerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  passengerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    marginLeft: 4,
    color: "#666",
    fontWeight: "600",
  },
  priceContainer: {
    marginLeft: "auto",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceText: {
    color: "#4CAF50",
    fontWeight: "bold",
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 15,
  },
  locationContainer: {
    marginBottom: 20,
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 5,
    marginRight: 15,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  addressText: {
    fontSize: 15,
    color: "#333",
  },
  tripLine: {
    position: "absolute",
    left: 5,
    top: 20,
    bottom: 45,
    width: 2,
    backgroundColor: "#eee",
  },
  tripInfo: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 25,
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 10,
  },
  tripInfoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  tripInfoText: {
    marginLeft: 6,
    color: "#666",
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  declineButton: {
    backgroundColor: "#FFEBEE",
  },
  acceptButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
});

export default DriverMapScreen;
