import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ScrollView,
  Dimensions,
  AppState,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import COLORS from "../../../constant/colors";
import RouteMap from "../../../components/RouteMap";
import ChatModal from "../../../components/ChatModal";
import CustomAlert from "../../../components/CustomAlert";
import { Modal } from "react-native";
import {
  getOrCreateDirectChannel,
  sendMessage,
  watchChannel,
  unwatchChannel,
} from "../../../services/chatService";
import { getProfile } from "../../../services/userService";
import FeedbackModal from "../../../components/FeedbackModal";
import { submitFeedback } from "../../../services/feedbackService";
import useRideSession from "../../../hooks/useRideSession";
import useDriverLocation from "../../../hooks/useDriverLocation";
import { supabase } from "../../../config/supabaseClient";

const { width, height } = Dimensions.get("window");

/**
 * MatchedRideScreen - Simplified version using new unified hooks
 *
 * This screen handles the ride flow from matched -> in_progress -> completed
 * for both drivers and passengers.
 */
const MatchedRideScreen = ({ navigation, route }) => {
  const matchedRideData = route.params || {};
  const insets = useSafeAreaInsets();
  const isDriver = matchedRideData.isDriver || false;

  // ============================================
  // UNIFIED RIDE SESSION HOOK
  // ============================================
  const {
    rideStatus: apiStatus,
    driverLocation,
    routePoints,
    driverArrived,
    destinationArrived,
    matchData,
    loading: rideLoading,
    // Actions
    startRide,
    completeRide,
    cancelRide,
    updateRoute,
    markDriverArrived,
    markDestinationArrived,
  } = useRideSession(matchedRideData.id || matchedRideData.rideId, {
    isDriver,
    driverId: matchedRideData.driverId,
  });

  // Driver location tracking (only for drivers)
  const {
    currentLocation: myLocation,
    isTracking,
    isSimulating,
    simulateRoute,
    getCurrentLocation,
  } = useDriverLocation(isDriver);

  // ============================================
  // LOCAL STATE
  // ============================================
  // Map ride status from API to local status
  const rideStatus = useMemo(() => {
    let mappedStatus;
    if (apiStatus === "IN_PROGRESS" || apiStatus === "ONGOING") {
      mappedStatus = "ongoing";
    } else if (apiStatus === "COMPLETED") {
      mappedStatus = "completed";
    } else if (apiStatus === "CANCELLED") {
      mappedStatus = "cancelled";
    } else {
      mappedStatus = "matched"; // WAITING, ACCEPTED, or null
    }

    console.log("🔄 Ride status mapping:", { apiStatus, mappedStatus });
    return mappedStatus;
  }, [apiStatus]);

  const [showChatModal, setShowChatModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isCompletingRide, setIsCompletingRide] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Custom Alert Modal State
  const [customAlert, setCustomAlert] = useState({
    visible: false,
    title: "",
    message: "",
    buttons: [],
  });

  // Track route for simulation (fetched from RouteMap)
  const [currentMapPath, setCurrentMapPath] = useState(null);
  const currentMapPathRef = useRef(null); // Ref for reliable access in callbacks
  const [currentLocation, setCurrentLocation] = useState(null); // Driver's location from Supabase
  const lastRouteUpdateRef = useRef(0); // Throttle route updates

  // ============================================
  // VEHICLE LOCATION (for map display)
  // ============================================
  // For driver: use own location; For passenger: use driver's location from hook
  const vehicleLocation = useMemo(() => {
    if (isDriver) {
      return myLocation;
    }
    return driverLocation;
  }, [isDriver, myLocation, driverLocation]);

  // Initial driver location from driverLocation hook, matchData or matchedRideData
  const initialDriverLocation = useMemo(() => {
    // PRIORITY 1: For driver - use currentLocation from Supabase (fetched on mount)
    // For passenger - use driverLocation from Supabase subscription
    if (isDriver && currentLocation?.latitude && currentLocation?.longitude) {
      console.log(
        "📍 Driver: Using currentLocation from Supabase:",
        currentLocation
      );
      return currentLocation;
    }

    if (driverLocation?.latitude && driverLocation?.longitude) {
      console.log(
        "📍 Passenger: Using driverLocation from Supabase subscription:",
        driverLocation
      );
      return driverLocation;
    }

    // PRIORITY 2: Try to get from candidates in matchData (synced) or matchedRideData (passed)
    const candidates =
      matchData?.matchedDriverCandidates ||
      matchedRideData.matchedDriverCandidates;
    if (candidates?.length > 0) {
      const candidate = candidates[0];
      if (candidate.currentLatitude && candidate.currentLongitude) {
        console.log("📍 Using driver location from candidates:", {
          lat: candidate.currentLatitude,
          lng: candidate.currentLongitude,
        });
        return {
          latitude: candidate.currentLatitude,
          longitude: candidate.currentLongitude,
        };
      }
    }

    // PRIORITY 3: Try from matchedRideData.driverLocation passed from NearestDriverScreen
    if (
      matchedRideData.driverLocation?.latitude &&
      matchedRideData.driverLocation?.longitude
    ) {
      console.log(
        "📍 Using driverLocation from route params:",
        matchedRideData.driverLocation
      );
      return matchedRideData.driverLocation;
    }

    // PRIORITY 4: Fallback to pickup location with offset
    const pickupPoint =
      matchData?.pickupLatitude && matchData?.pickupLongitude
        ? {
            latitude: matchData.pickupLatitude,
            longitude: matchData.pickupLongitude,
          }
        : matchedRideData.originCoordinate || {
            latitude: 10.7769,
            longitude: 106.7009,
          };

    console.log(
      "📍 Using fallback driver location (pickup offset):",
      pickupPoint
    );
    return {
      latitude: pickupPoint.latitude - 0.008,
      longitude: pickupPoint.longitude - 0.006,
    };
  }, [matchData, matchedRideData, driverLocation, isDriver, currentLocation]);

  // ============================================
  // COORDINATES
  // ============================================
  const originCoordinate = useMemo(() => {
    // Priority 1: Use matchData from API
    if (matchData?.pickupLatitude && matchData?.pickupLongitude) {
      return {
        latitude: matchData.pickupLatitude,
        longitude: matchData.pickupLongitude,
        description: matchData.pickupAddress || "Điểm đón",
      };
    }
    // Priority 2: Use matchedRideData from navigation params
    if (matchedRideData.pickupLatitude && matchedRideData.pickupLongitude) {
      return {
        latitude: matchedRideData.pickupLatitude,
        longitude: matchedRideData.pickupLongitude,
        description:
          matchedRideData.pickupAddress || matchedRideData.from || "Điểm đón",
      };
    }
    // Priority 3: Use originCoordinate from navigation params
    if (
      matchedRideData.originCoordinate?.latitude &&
      matchedRideData.originCoordinate?.longitude
    ) {
      return matchedRideData.originCoordinate;
    }
    // Fallback: Default location
    return {
      latitude: 10.7769,
      longitude: 106.7009,
      description:
        matchedRideData.pickupAddress || matchedRideData.from || "Điểm đón",
    };
  }, [matchData, matchedRideData]);

  const destinationCoordinate = useMemo(() => {
    // Priority 1: Use matchData from API
    if (matchData?.destinationLatitude && matchData?.destinationLongitude) {
      return {
        latitude: matchData.destinationLatitude,
        longitude: matchData.destinationLongitude,
        description: matchData.destinationAddress || "Điểm đến",
      };
    }
    // Priority 2: Use matchedRideData from navigation params
    if (
      matchedRideData.destinationLatitude &&
      matchedRideData.destinationLongitude
    ) {
      return {
        latitude: matchedRideData.destinationLatitude,
        longitude: matchedRideData.destinationLongitude,
        description:
          matchedRideData.destinationAddress ||
          matchedRideData.to ||
          "Điểm đến",
      };
    }
    // Priority 3: Use destinationCoordinate from navigation params
    if (
      matchedRideData.destinationCoordinate?.latitude &&
      matchedRideData.destinationCoordinate?.longitude
    ) {
      return matchedRideData.destinationCoordinate;
    }
    // Fallback: Default location
    return {
      latitude: 10.773,
      longitude: 106.6583,
      description:
        matchedRideData.destinationAddress || matchedRideData.to || "Điểm đến",
    };
  }, [matchData, matchedRideData]);

  // FIX VẤN ĐỀ 1: Route origin/destination cho đúng theo phase
  // Phase 1 (matched): driver location → pickup
  // Phase 2 (ongoing): pickup → destination
  const currentRouteOrigin = useMemo(() => {
    if (rideStatus === "ongoing") {
      // Phase 2: Từ pickup location
      const origin = originCoordinate;
      console.log("📍 currentRouteOrigin (ongoing):", {
        latitude: origin?.latitude,
        longitude: origin?.longitude,
        description: origin?.description,
      });
      return origin;
    }
    // Phase 1: Từ driver location
    const origin = vehicleLocation || initialDriverLocation;
    console.log("📍 currentRouteOrigin (matched):", {
      latitude: origin?.latitude,
      longitude: origin?.longitude,
      fromVehicle: !!vehicleLocation,
      fromInitial: !!initialDriverLocation,
    });
    return origin;
  }, [rideStatus, vehicleLocation, originCoordinate, initialDriverLocation]);

  const currentRouteDestination = useMemo(() => {
    if (rideStatus === "ongoing") {
      // Phase 2: Đến destination
      const dest = destinationCoordinate;
      console.log("📍 currentRouteDestination (ongoing):", {
        latitude: dest?.latitude,
        longitude: dest?.longitude,
        description: dest?.description,
      });
      return dest;
    }
    // Phase 1: Đến pickup
    const dest = originCoordinate;
    console.log("📍 currentRouteDestination (matched):", {
      latitude: dest?.latitude,
      longitude: dest?.longitude,
      description: dest?.description,
    });
    return dest;
  }, [rideStatus, originCoordinate, destinationCoordinate]);

  // Debug logging for ride flow
  useEffect(() => {
    console.log("🔄 MatchedRideScreen state:", {
      matchId: matchedRideData.id || matchedRideData.rideId,
      driverId: matchedRideData.driverId,
      isDriver,
      rideStatus,
      driverLocation: driverLocation
        ? {
            lat: driverLocation.latitude?.toFixed(5),
            lng: driverLocation.longitude?.toFixed(5),
          }
        : null,
      vehicleLocation: vehicleLocation
        ? {
            lat: vehicleLocation.latitude?.toFixed(5),
            lng: vehicleLocation.longitude?.toFixed(5),
          }
        : null,
      driverArrived,
      destinationArrived,
    });
  }, [
    matchedRideData,
    isDriver,
    rideStatus,
    driverLocation,
    vehicleLocation,
    driverArrived,
    destinationArrived,
  ]);

  // Fetch driver's location from Supabase on mount (for driver only)
  useEffect(() => {
    if (!isDriver) return; // Only for driver

    const fetchDriverLocationFromSupabase = async () => {
      try {
        // Get driver ID from matchData or matchedRideData
        const currentDriverId = matchData?.driverId || matchedRideData.driverId;

        if (!currentDriverId) {
          console.warn("⚠️ Driver: No driverId found in matchData");
          // Fallback to GPS
          console.log("📍 Driver: Fetching GPS location as fallback...");
          const location = await getCurrentLocation();
          if (location) {
            console.log("✅ Driver GPS location:", location);
          }
          return;
        }

        console.log(
          "📍 Driver: Fetching location from Supabase for driverId:",
          currentDriverId
        );

        const { data, error } = await supabase
          .from("driver_locations")
          .select("driver_id, latitude, longitude, last_updated, driver_status")
          .eq("driver_id", currentDriverId)
          .maybeSingle();

        if (error) {
          console.error(
            "❌ Error fetching driver location from Supabase:",
            error
          );
          // Fallback to GPS
          const location = await getCurrentLocation();
          if (location) {
            console.log("✅ Driver GPS location (fallback):", location);
          }
          return;
        }

        if (data) {
          console.log("✅ Driver location from Supabase:", {
            driverId: data.driver_id,
            lat: data.latitude,
            lng: data.longitude,
            status: data.driver_status,
          });

          // Set as currentLocation so it's available for route rendering
          setCurrentLocation({
            latitude: data.latitude,
            longitude: data.longitude,
          });
        } else {
          console.warn(
            "⚠️ No driver location found in Supabase for driverId:",
            currentDriverId
          );
          // Fallback to GPS
          const location = await getCurrentLocation();
          if (location) {
            console.log("✅ Driver GPS location (fallback):", location);
          }
        }
      } catch (err) {
        console.error("❌ Exception fetching driver location:", err);
      }
    };

    fetchDriverLocationFromSupabase();
  }, [
    isDriver,
    matchData?.driverId,
    matchedRideData.driverId,
    getCurrentLocation,
  ]);

  // ============================================
  // OTHER PERSON INFO
  // ============================================
  const otherPerson = useMemo(() => {
    if (isDriver) {
      return {
        name: matchedRideData.passengerName || "Hành khách",
        phone: matchedRideData.passengerPhone || "",
        avatar:
          matchedRideData.passengerAvatar || "https://i.pravatar.cc/150?img=3",
        rating: matchedRideData.passengerRating || 4.8,
      };
    }
    return {
      name: matchedRideData.driverName || "Tài xế",
      phone: matchedRideData.driverPhone || "",
      avatar: matchedRideData.driverAvatar || "https://i.pravatar.cc/150?img=5",
      rating: matchedRideData.driverRating || 4.9,
      vehiclePlate: matchedRideData.vehiclePlateNumber || "XX-XXXX",
      vehicleName: matchedRideData.vehicleName || "Xe máy",
    };
  }, [isDriver, matchedRideData]);

  // ============================================
  // HANDLE RIDE NAVIGATION STATUS
  // ============================================
  useEffect(() => {
    if (rideStatus === "completed") {
      // Only show feedback modal for passenger
      // Driver will see coin reward notification and navigate
      if (isDriver) {
        // Driver: Show coin reward notification
        const earnedCoins = matchData?.coin || 10; // Get coins from match data
        showCustomAlert(
          "Hoàn thành chuyến đi",
          `Bạn đã hoàn thành chuyến đi thành công!\n+${earnedCoins} coin`,
          [
            {
              text: "Về trang chủ",
              onPress: () => {
                // Clear route state
                setCurrentMapPath(null);
                currentMapPathRef.current = null;
                navigation.navigate("MainTabs");
              },
            },
          ]
        );
      } else {
        // Passenger: Show feedback modal
        setShowFeedbackModal(true);
      }
    } else if (rideStatus === "cancelled") {
      Alert.alert("Thông báo", "Chuyến đi đã bị hủy.");
      navigation.navigate("Home");
    }
  }, [rideStatus, navigation, isDriver, matchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("🧹 Cleaning up MatchedRideScreen");
      setCurrentMapPath(null);
      currentMapPathRef.current = null;
    };
  }, []);

  // ============================================
  // HELPERS
  // ============================================
  const haversine = (coord1, coord2) => {
    if (!coord1 || !coord2) return Infinity;
    const R = 6371; // km
    const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((coord1.latitude * Math.PI) / 180) *
        Math.cos((coord2.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const shouldSyncPath = useMemo(() => {
    if (!routePoints || routePoints.length === 0) return false;

    // Phase 2 (ongoing): Sync route for PASSENGER only
    // Driver updates route, passenger syncs it
    if (rideStatus === "ongoing") {
      if (!isDriver) {
        console.log(
          "✅ Passenger syncing route for Phase 2 (ongoing):",
          routePoints.length,
          "points"
        );
        return true;
      } else {
        console.log(
          "⏭️ Driver: Skipping route sync for Phase 2 - using local route"
        );
        return false;
      }
    }

    // Phase 1 (matched): DON'T sync routePoints from database
    // The database route is pickup → destination (initial route)
    // But we need driver location → pickup
    // Let RouteMap fetch its own route based on origin/destination props
    console.log(
      "⏭️ Skipping route sync for Phase 1 (matched) - let RouteMap fetch driver→pickup route"
    );
    return false;
  }, [routePoints, vehicleLocation, rideStatus, isDriver]);

  const showCustomAlert = useCallback(
    (title, message, buttons = [{ text: "OK", onPress: () => {} }]) => {
      setCustomAlert({ visible: true, title, message, buttons });
    },
    []
  );

  // ============================================
  // CALLBACKS
  // ============================================
  const handleDriverArrived = useCallback(() => {
    console.log("🏁 Driver arrived at pickup!");
    markDriverArrived();

    if (isDriver) {
      showCustomAlert(
        "Bạn đã đến điểm đón",
        "Hành khách đang chờ bạn. Hãy nhấn 'Bắt đầu chuyến đi' khi khách đã lên xe."
      );
    } else {
      showCustomAlert(
        "Tài xế đã đến điểm đón",
        "Tài xế đang chờ bạn. Vui lòng lên xe để bắt đầu chuyến đi."
      );
    }
  }, [isDriver, markDriverArrived, showCustomAlert]);

  const handleDestinationArrived = useCallback(() => {
    console.log("🏁 Arrived at destination!");
    markDestinationArrived();

    if (isDriver) {
      showCustomAlert(
        "Đã đến điểm đích",
        "Bạn đã đến nơi. Hãy nhấn 'Hoàn thành chuyến đi' để kết thúc."
      );
    } else {
      showCustomAlert(
        "Đã đến điểm đích",
        "Bạn đã đến nơi. Chuyến đi sắp hoàn thành."
      );
    }
  }, [isDriver, markDestinationArrived, showCustomAlert]);

  const handleRouteFetched = useCallback(
    (points) => {
      console.log(
        `📍 Route fetched: ${
          points?.length || 0
        } points for phase: ${rideStatus}`
      );
      setCurrentMapPath(points);
      currentMapPathRef.current = points; // Store in ref for callbacks
      // Sync route to Supabase if driver
      if (isDriver && points && points.length > 0) {
        updateRoute(points);
      }
    },
    [isDriver, updateRoute, rideStatus]
  );

  // FIX VẤN ĐỀ 2: Simulation hoạt động đúng cho cả 2 phase
  const handleSimulate = useCallback(() => {
    // Luôn sử dụng currentMapPath (route mới nhất được fetch từ RouteMap)
    const pointsToSimulate = currentMapPath || routePoints;

    if (!pointsToSimulate || pointsToSimulate.length === 0) {
      Alert.alert("Chưa có lộ trình", "Vui lòng đợi bản đồ tải lộ trình.");
      return;
    }

    const phaseText =
      rideStatus === "ongoing" ? "Phase 2 (đến đích)" : "Phase 1 (đón khách)";

    Alert.alert(
      "Bắt đầu mô phỏng",
      `${phaseText}\nSẽ di chuyển qua ${pointsToSimulate.length} điểm trong 20 giây.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Bắt đầu",
          onPress: () => {
            console.log(`🚗 Starting simulation for ${phaseText}`);
            console.log(`Route: ${pointsToSimulate.length} points`);
            console.log(`From: ${JSON.stringify(pointsToSimulate[0])}`);
            console.log(
              `To: ${JSON.stringify(
                pointsToSimulate[pointsToSimulate.length - 1]
              )}`
            );

            // Không reset arrival flags nữa - để RouteMap tự xử lý
            // Chỉ cần gọi simulateRoute với đúng route
            // Tăng duration lên 60 giây để simulation mượt hơn
            simulateRoute(pointsToSimulate, 60000);
          },
        },
      ]
    );
  }, [rideStatus, currentMapPath, routePoints, simulateRoute]);

  const handleStartRide = useCallback(async () => {
    console.log("🚀 Starting ride (Phase 1 → Phase 2)");

    // Clear the local route so RouteMap will fetch fresh route for Phase 2
    setCurrentMapPath(null);
    currentMapPathRef.current = null;

    const result = await startRide();
    if (result.success) {
      showCustomAlert(
        "Chuyến đi đã bắt đầu",
        "Bạn đang trên đường đến điểm đích.",
        [
          {
            text: "OK",
            onPress: () => {
              // Wait for route to be fetched and check multiple times
              let attempts = 0;
              const maxAttempts = 10; // Try for 5 seconds (10 * 500ms)

              const checkAndStartSimulation = () => {
                attempts++;
                const route = currentMapPathRef.current; // Use ref for latest value
                console.log(
                  `🔍 Checking for Phase 2 route (attempt ${attempts}/${maxAttempts})`
                );

                if (route && route.length > 10) {
                  console.log(
                    `✅ Route ready with ${route.length} points, starting simulation`
                  );
                  // Tăng duration lên 60 giây để simulation mượt hơn
                  simulateRoute(route, 60000);
                } else if (attempts < maxAttempts) {
                  console.log(
                    `⏳ Route not ready yet (${
                      route?.length || 0
                    } points), waiting...`
                  );
                  setTimeout(checkAndStartSimulation, 500);
                } else {
                  console.warn("⚠️ Timeout waiting for Phase 2 route");
                }
              };

              // Start checking after 1 second
              setTimeout(checkAndStartSimulation, 1000);
            },
          },
        ]
      );
    } else {
      showCustomAlert("Lỗi", result.error || "Không thể bắt đầu chuyến đi.");
    }
  }, [startRide, showCustomAlert, simulateRoute]);

  const handleCompleteRide = useCallback(async () => {
    console.log("✅ Completing ride");
    setIsCompletingRide(true);
    try {
      const result = await completeRide();
      if (result.success) {
        // Don't show feedback modal here - let useEffect handle it
        // based on rideStatus change
      } else {
        showCustomAlert(
          "Lỗi",
          result.error || "Không thể hoàn thành chuyến đi."
        );
      }
    } finally {
      setIsCompletingRide(false);
    }
  }, [completeRide, showCustomAlert]);

  const handleRouteTruncated = useCallback(
    (truncatedRoute) => {
      if (isDriver && truncatedRoute && truncatedRoute.length > 0) {
        // Throttle updates: only update every 5 seconds or if significant change
        const now = Date.now();
        if (now - lastRouteUpdateRef.current > 5000) {
          lastRouteUpdateRef.current = now;
          updateRoute(truncatedRoute);
        }
      }
    },
    [isDriver, updateRoute]
  );

  const handleFeedbackSubmit = async (feedbackData) => {
    setIsSubmittingFeedback(true);
    const rideId = matchedRideData.id || matchedRideData.rideId;

    const result = await submitFeedback(
      rideId,
      feedbackData.rating,
      feedbackData.comment,
      feedbackData.tags
    );

    setIsSubmittingFeedback(false);

    if (result.success) {
      Alert.alert("Cảm ơn bạn!", "Đánh giá của bạn đã được gửi thành công.");
    } else {
      // Check if error is duplicate feedback
      if (result.error && result.error.includes("already submitted feedback")) {
        Alert.alert(
          "Thông báo",
          "Bạn đã đánh giá chuyến đi này rồi. Cảm ơn bạn!"
        );
      }
      // Silently ignore other errors - don't show to user
    }

    // Always close modal and navigate
    setShowFeedbackModal(false);
    setCurrentMapPath(null);
    currentMapPathRef.current = null;
    navigation.navigate("MainTabs");
  };

  const handleCall = useCallback(() => {
    if (otherPerson.phone) {
      Linking.openURL(`tel:${otherPerson.phone}`);
    }
  }, [otherPerson.phone]);

  // ============================================
  // RENDER
  // ============================================
  if (rideLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="arrow-back" size={24} color={COLORS.BLACK} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>
                {isDriver
                  ? rideStatus === "ongoing"
                    ? "Đang đưa khách"
                    : "Đang đón khách"
                  : rideStatus === "ongoing"
                  ? "Đang di chuyển"
                  : "Tài xế sắp đến"}
              </Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        {/* Map Section */}
        <View style={styles.mapContainer}>
          <RouteMap
            vehicleLocation={
              vehicleLocation ||
              (driverArrived ? originCoordinate : initialDriverLocation)
            }
            driverLocation={initialDriverLocation}
            pickupLocation={originCoordinate}
            origin={currentRouteOrigin}
            destination={currentRouteDestination}
            path={shouldSyncPath ? routePoints : null}
            height={height * 0.55}
            showRoute={true}
            fullScreen={false}
            rideStatus={rideStatus}
            isDriver={isDriver}
            showVehicle={true}
            startAnimation={
              rideStatus === "matched" || rideStatus === "ongoing"
            }
            onDriverArrived={handleDriverArrived}
            onDestinationArrived={handleDestinationArrived}
            onRouteFetched={handleRouteFetched}
            onRouteTruncated={handleRouteTruncated}
            matchedDriverId={matchData?.driverId || matchedRideData.driverId}
            isSimulating={isSimulating}
          />
        </View>

        {/* Info Panel */}
        <KeyboardAvoidingView
          style={styles.infoPanel}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Person Info Card */}
          <View style={styles.personCard}>
            <View style={styles.personHeader}>
              <Image
                source={{ uri: otherPerson.avatar }}
                style={styles.personAvatar}
              />
              <View style={styles.personInfo}>
                <Text style={styles.personLabel}>
                  {isDriver ? "Hành khách" : "Tài xế"}
                </Text>
                <Text style={styles.personName}>{otherPerson.name}</Text>
                <View style={styles.ratingRow}>
                  <FontAwesome name="star" size={14} color="#FFD700" />
                  <Text style={styles.ratingText}>{otherPerson.rating}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                <MaterialIcons name="call" size={22} color={COLORS.WHITE} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.callButton,
                  { backgroundColor: COLORS.PRIMARY, marginLeft: 8 },
                ]}
                onPress={() => setShowChatModal(true)}
              >
                <MaterialIcons name="chat" size={22} color={COLORS.WHITE} />
              </TouchableOpacity>
            </View>

            {/* Vehicle Info (for passenger) */}
            {!isDriver && otherPerson.vehiclePlate && (
              <View style={styles.vehicleInfo}>
                <MaterialIcons
                  name="two-wheeler"
                  size={20}
                  color={COLORS.GRAY}
                />
                <Text style={styles.vehicleText}>
                  {otherPerson.vehicleName} • {otherPerson.vehiclePlate}
                </Text>
              </View>
            )}

            {/* Divider */}
            <View style={styles.divider} />

            {/* Route Info */}
            <View style={styles.routeInfo}>
              <View style={styles.routeRow}>
                <View
                  style={[styles.routeDot, { backgroundColor: COLORS.GREEN }]}
                />
                <Text style={styles.routeText} numberOfLines={1}>
                  {matchedRideData.pickupAddress ||
                    originCoordinate.description}
                </Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routeRow}>
                <View
                  style={[styles.routeDot, { backgroundColor: COLORS.PRIMARY }]}
                />
                <Text style={styles.routeText} numberOfLines={1}>
                  {matchedRideData.destinationAddress ||
                    destinationCoordinate.description}
                </Text>
              </View>
            </View>

            {/* Price Info */}
            {matchedRideData.fare && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Giá chuyến đi</Text>
                <Text style={styles.priceValue}>
                  {matchedRideData.fare.toLocaleString("vi-VN")}đ
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {isDriver && rideStatus === "matched" && (
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: driverArrived
                      ? COLORS.GREEN
                      : COLORS.PRIMARY,
                  },
                  isSimulating && styles.disabledButton,
                ]}
                disabled={isSimulating}
                onPress={driverArrived ? handleStartRide : handleSimulate}
              >
                <Text style={styles.primaryButtonText}>
                  {driverArrived ? "Bắt đầu chuyến đi" : "Bắt đầu đón khách"}
                </Text>
              </TouchableOpacity>
            )}

            {isDriver && rideStatus === "ongoing" && (
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: destinationArrived
                      ? COLORS.GREEN
                      : COLORS.PRIMARY,
                  },
                  (isCompletingRide || isSimulating) && styles.disabledButton,
                ]}
                disabled={isCompletingRide || isSimulating}
                onPress={
                  destinationArrived ? handleCompleteRide : handleSimulate
                }
              >
                {isCompletingRide ? (
                  <ActivityIndicator color={COLORS.WHITE} />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {destinationArrived
                      ? "Hoàn thành chuyến đi"
                      : "Mô phỏng đến điểm đích"}
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {!isDriver && (
              <View style={styles.statusInfo}>
                <MaterialIcons
                  name={
                    rideStatus === "ongoing" ? "directions-car" : "access-time"
                  }
                  size={20}
                  color={COLORS.PRIMARY}
                />
                <Text style={styles.statusText}>
                  {rideStatus === "ongoing"
                    ? "Đang trên đường đến điểm đích"
                    : "Tài xế đang đến đón bạn"}
                </Text>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </ScrollView>

      {/* Chat Modal */}
      <ChatModal
        visible={showChatModal}
        onClose={() => setShowChatModal(false)}
        otherUser={{
          id: isDriver ? matchedRideData.passengerId : matchedRideData.driverId,
          name: otherPerson.name,
          avatar: otherPerson.avatar,
        }}
        otherPersonName={otherPerson.name}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        visible={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          // Clear route state
          setCurrentMapPath(null);
          currentMapPathRef.current = null;
          navigation.navigate("MainTabs");
        }}
        onSubmit={handleFeedbackSubmit}
        isSubmitting={isSubmittingFeedback}
        otherPersonName={otherPerson.name}
        isDriver={isDriver}
      />

      {/* Custom Alert */}
      <CustomAlert
        visible={customAlert.visible}
        title={customAlert.title}
        message={customAlert.message}
        buttons={customAlert.buttons}
        onClose={() => setCustomAlert({ ...customAlert, visible: false })}
      />
    </SafeAreaView>
  );
};

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.GRAY,
  },
  // Header
  headerContainer: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  headerSpacer: {
    width: 40,
  },
  // Map
  mapContainer: {
    backgroundColor: "#F5F5F5",
  },
  // Info Panel
  infoPanel: {
    padding: 16,
  },
  // Person Card
  personCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  personHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  personAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.LIGHT_GRAY,
  },
  personInfo: {
    flex: 1,
    marginLeft: 12,
  },
  personLabel: {
    fontSize: 12,
    color: COLORS.GRAY,
  },
  personName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  ratingText: {
    fontSize: 14,
    color: COLORS.BLACK,
    fontWeight: "600",
    marginLeft: 4,
  },
  callButton: {
    backgroundColor: COLORS.GREEN,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  vehicleInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  vehicleText: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 16,
  },
  // Route Info
  routeInfo: {
    paddingHorizontal: 4,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  routeText: {
    fontSize: 14,
    color: COLORS.BLACK,
    flex: 1,
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: "#E0E0E0",
    marginLeft: 4,
    marginVertical: 4,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.PRIMARY,
  },
  // Action Buttons
  actionButtons: {
    marginTop: 16,
  },
  primaryButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.WHITE,
  },
  statusInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    backgroundColor: "#F0F7FF",
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default MatchedRideScreen;
