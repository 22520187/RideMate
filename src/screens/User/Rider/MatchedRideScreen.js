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
  TextInput,
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
import { useSharedPath } from "../../../hooks/useSharedPath";
import {
  getOrCreateDirectChannel,
  sendMessage,
  watchChannel,
  unwatchChannel,
} from "../../../services/chatService";
import { getProfile } from "../../../services/userService";
import { supabase } from "../../../config/supabaseClient";
import axiosClient from "../../../api/axiosClient";
import endpoints from "../../../api/endpoints";
import FeedbackModal from "../../../components/FeedbackModal";
import { submitFeedback } from "../../../services/feedbackService";

const { width, height } = Dimensions.get("window");

const MatchedRideScreen = ({ navigation, route }) => {
  const matchedRideData = route.params || {};
  const insets = useSafeAreaInsets();
  const [refreshKey, setRefreshKey] = useState(0);

  // Debug: Log received data
  useEffect(() => {
    console.log("📍 MatchedRideScreen received data:", {
      originCoordinate: matchedRideData.originCoordinate,
      destinationCoordinate: matchedRideData.destinationCoordinate,
      pickupLatitude: matchedRideData.pickupLatitude,
      pickupLongitude: matchedRideData.pickupLongitude,
      pickupAddress: matchedRideData.pickupAddress,
      destinationAddress: matchedRideData.destinationAddress,
    });
  }, []);

  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]);
  const [channel, setChannel] = useState(null);
  const [loadingChat, setLoadingChat] = useState(true);

  const [rideStatus, setRideStatus] = useState("matched"); // 'matched' | 'ongoing' | 'completed'
  const { path } = useSharedPath();
  const [rewardPoints, setRewardPoints] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false); // Chat modal state
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  // Retain legacy rating/comment state if needed, but FeedbackModal handles its own state
  const maxStars = 5;

  // Custom Alert Modal State
  const [customAlert, setCustomAlert] = useState({
    visible: false,
    title: "",
    message: "",
    buttons: [],
  });

  // State mới để quản lý việc tài xế đã đến điểm đón chưa
  const [driverArrived, setDriverArrived] = useState(false);
  // State quản lý việc tài xế đã bấm "Bắt đầu đón khách" chưa
  const [isMovingToPickup, setIsMovingToPickup] = useState(false);
  // State quản lý việc tài xế đã đến điểm đích chưa
  const [destinationArrived, setDestinationArrived] = useState(false);

  // Vehicle tracking state
  const initialDriverLocation = useMemo(() => {
    // Try to get driver location from matchedDriverCandidates
    if (
      matchedRideData.matchedDriverCandidates &&
      matchedRideData.matchedDriverCandidates.length > 0
    ) {
      const firstCandidate = matchedRideData.matchedDriverCandidates[0];
      if (firstCandidate.currentLatitude && firstCandidate.currentLongitude) {
        console.log("🚗 Using driver location from candidates:", {
          lat: firstCandidate.currentLatitude,
          lng: firstCandidate.currentLongitude,
        });
        return {
          latitude: firstCandidate.currentLatitude,
          longitude: firstCandidate.currentLongitude,
        };
      }
    }

    // Fallback: use pickup location with small offset (mock)
    const pickupPoint = matchedRideData.originCoordinate || {
      latitude: 21.0285,
      longitude: 105.8542,
    };

    console.log(
      "⚠️ No driver location in candidates, using mock offset from pickup"
    );
    return {
      latitude: pickupPoint.latitude - 0.008,
      longitude: pickupPoint.longitude - 0.006,
    };
  }, [
    matchedRideData.matchedDriverCandidates,
    matchedRideData.originCoordinate,
  ]);

  const [simRoutePoints, setSimRoutePoints] = useState([]);
  const simIndexRef = useRef(0);

  // KHÔNG reset simIndex khi đổi phase - để xe tiếp tục từ vị trí hiện tại
  // simIndex chỉ reset khi có route mới (trong handleRouteFetched)

  // Simulation Effect cho Driver - Mượt mà như Grab (Update mỗi 1.5s)
  useEffect(() => {
    let interval;
    if (
      matchedRideData.isDriver &&
      (isMovingToPickup || rideStatus === "ongoing") &&
      !driverArrived // Dừng simulation khi đã đến điểm đón
    ) {
      interval = setInterval(() => {
        // 1. Nếu có Route Points (Ưu tiên bám đường)
        if (simRoutePoints.length > 0) {
          // Giảm STEP xuống 1 điểm để chậm hơn
          const STEP = 1; // Di chuyển 1 điểm mỗi 2s → chậm và mượt
          let nextIndex = simIndexRef.current + STEP;

          // Clamp to end
          if (nextIndex >= simRoutePoints.length) {
            nextIndex = simRoutePoints.length - 1;
          }

          simIndexRef.current = nextIndex;
          const newPoint = simRoutePoints[nextIndex];

          console.log(
            `🚗 Sim Step (Route): Index ${nextIndex}/${simRoutePoints.length}`,
            newPoint
          );
          setVehicleLocation(newPoint);

          // API Update
          axiosClient
            .post(endpoints.driver.location, newPoint)
            .catch((err) => console.log("❌ Update loc error:", err));
        }
        // 2. Fallback: Di chuyển thẳng (Linear)
        else {
          setVehicleLocation((prev) => {
            if (!prev) return prev;

            const target =
              rideStatus === "ongoing"
                ? matchesDestinationCoordinate(
                    matchedRideData.destinationCoordinate
                  )
                : matchesOriginCoordinate(matchedRideData.originCoordinate);

            if (!target || !target.latitude) return prev;

            // Giảm MOVE_STEP để di chuyển chậm hơn
            const MOVE_STEP = 0.0004; // ~45m mỗi 2s

            const dLat = target.latitude - prev.latitude;
            const dLng = target.longitude - prev.longitude;
            const dist = Math.sqrt(dLat * dLat + dLng * dLng);

            if (dist < MOVE_STEP) {
              return { latitude: target.latitude, longitude: target.longitude };
            }

            const ratio = MOVE_STEP / dist;
            const newLat = prev.latitude + dLat * ratio;
            const newLng = prev.longitude + dLng * ratio;

            const newLoc = { latitude: newLat, longitude: newLng };

            console.log("🚗 Sim Step (Linear):", newLoc);

            axiosClient
              .post(endpoints.driver.location, newLoc)
              .catch((err) => console.log("❌ Update loc error:", err));

            return newLoc;
          });
        }
      }, 2000); // Tăng lên 2s để chậm hơn
    }
    return () => clearInterval(interval);
  }, [
    matchedRideData.isDriver,
    isMovingToPickup,
    rideStatus,
    simRoutePoints,
    driverArrived,
  ]);

  const handleRouteFetched = useCallback((points) => {
    // Chỉ update nếu points khác rỗng
    if (points && points.length > 0) {
      console.log("📍 Route Fetched for simulation:", points.length, "points");
      setSimRoutePoints(points);
      simIndexRef.current = 0; // Reset index khi có route mới
    }
  }, []);

  // Helper safe access
  const matchesOriginCoordinate = (coord) =>
    coord || { latitude: 21.0285, longitude: 105.8542 };
  const matchesDestinationCoordinate = (coord) =>
    coord || { latitude: 21.03, longitude: 105.85 };

  const [vehicleLocation, setVehicleLocation] = useState(initialDriverLocation);
  const [driverETA, setDriverETA] = useState("7 phút");
  const [driverDistance, setDriverDistance] = useState("2.3 km");

  // Logic to calculate info
  const calculateDistanceAndETA = (from, to) => {
    console.log("🧮 calculateDistanceAndETA called with:", {
      from: { lat: from?.latitude, lng: from?.longitude },
      to: { lat: to?.latitude, lng: to?.longitude },
    });

    const distanceKm = Math.sqrt(
      Math.pow((to.latitude - from.latitude) * 111, 2) +
        Math.pow((to.longitude - from.longitude) * 85, 2)
    );

    const durationMin = Math.ceil(distanceKm * 3);
    setDriverETA(`${Math.max(1, durationMin)} phút`);
    setDriverDistance(`${distanceKm.toFixed(1)} km`);

    console.log("📊 Calculated:", {
      distanceKm: distanceKm.toFixed(2),
      durationMin,
    });
  };

  const rideDetails = useMemo(
    () => ({
      from: matchedRideData.from || "Bến Xe Giáp Bát - Cống Đón/Trả Khách",
      to: matchedRideData.to || "Vincom Plaza",
      departureTime: matchedRideData.departureTime || "14:30",
      price: matchedRideData.price || "25,000đ",
      duration: matchedRideData.duration || "5 phút",
      distance: matchedRideData.distance || "2 km",
    }),
    [matchedRideData]
  );

  const originCoordinate = useMemo(
    () =>
      matchedRideData.originCoordinate || {
        latitude: 21.0285,
        longitude: 105.8542,
        description: rideDetails.from,
      },
    [matchedRideData.originCoordinate, rideDetails.from]
  );

  const destinationCoordinate = useMemo(
    () =>
      matchedRideData.destinationCoordinate || {
        latitude: 21.0152,
        longitude: 105.8415,
        description: rideDetails.to,
      },
    [matchedRideData.destinationCoordinate, rideDetails.to]
  );

  // 🎯 Ref để track đã notify arrival chưa (tránh duplicate)
  const hasNotifiedArrival = useRef(false);

  // Custom Alert Helper
  const showCustomAlert = (
    title,
    message,
    buttons = [{ text: "OK", onPress: () => {} }]
  ) => {
    setCustomAlert({
      visible: true,
      title,
      message,
      buttons,
    });
  };

  // 🎯 Callback khi tài xế đến điểm đón
  const handleDriverArrived = useCallback(() => {
    // Chỉ trigger một lần duy nhất
    if (hasNotifiedArrival.current) {
      console.log("⏭️ Already notified arrival, skipping...");
      return;
    }

    console.log("🏁 Driver arrived at pickup location!");
    hasNotifiedArrival.current = true;
    setDriverArrived(true); // Enable button "Bắt đầu chuyến đi"

    // Chỉ hiện thông báo cho driver
    if (matchedRideData.isDriver) {
      showCustomAlert(
        "Bạn đã đến điểm đón",
        "Hành khách đang chờ bạn. Hãy nhấn 'Bắt đầu chuyến đi' khi khách đã lên xe."
      );
    }
  }, [matchedRideData.isDriver]);

  // 🎯 Callback khi đến điểm đích
  const handleDestinationArrived = useCallback(() => {
    console.log("🏁 Arrived at destination!");

    // Chỉ set flag để hiển thị button "Hoàn thành chuyến đi"
    setDestinationArrived(true);

    // Hiển thị thông báo cho driver
    if (matchedRideData.isDriver) {
      showCustomAlert(
        "Đã đến điểm đích",
        "Bạn đã đến nơi. Hãy nhấn 'Hoàn thành chuyến đi' để kết thúc."
      );
    }
  }, [matchedRideData.isDriver]);

  // Initial ETA calc
  useEffect(() => {
    const pickupPoint = originCoordinate;
    console.log(
      "🚗 Initial vehicle location (from candidates):",
      initialDriverLocation
    );
    console.log("📍 Pickup point:", pickupPoint);
    calculateDistanceAndETA(initialDriverLocation, pickupPoint);
  }, []);

  // Fetch real driver location from Supabase on mount
  useEffect(() => {
    const fetchDriverLocation = async () => {
      const driverId = matchedRideData.isDriver
        ? matchedRideData.currentUserId
        : matchedRideData.driverId;

      if (!driverId) return;

      try {
        console.log(
          "📍 Fetching initial driver location for driver:",
          driverId
        );

        const { data, error } = await supabase
          .from("driver_locations")
          .select("latitude, longitude")
          .eq("driver_id", driverId)
          .limit(1);

        if (error) {
          console.warn("⚠️ Could not fetch driver location:", error.message);
          return;
        }

        console.log("📦 Supabase response:", {
          data,
          hasData: !!data,
          length: data?.length,
        });

        if (data && data.length > 0 && data[0].latitude && data[0].longitude) {
          const realLocation = {
            latitude: data[0].latitude,
            longitude: data[0].longitude,
          };

          console.log(
            "✅ Real driver location fetched from Supabase:",
            realLocation
          );
          setVehicleLocation(realLocation);

          // Recalculate ETA with real location
          calculateDistanceAndETA(realLocation, originCoordinate);
        } else {
          console.warn("⚠️ No driver location data in Supabase response");
        }
      } catch (err) {
        console.error("❌ Error fetching driver location:", err);
      }
    };

    fetchDriverLocation();
  }, [matchedRideData.driverId, matchedRideData.isDriver]);

  // Real-time Driver Location Tracking (subscribe to updates only)
  const isFirstUpdate = useRef(true);

  useEffect(() => {
    const driverId = matchedRideData.isDriver
      ? matchedRideData.currentUserId
      : matchedRideData.driverId;

    if (!driverId) return;

    console.log("📡 Subscribing to driver location:", driverId);

    const channel = supabase
      .channel(`driver_loc_${driverId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "driver_locations",
          filter: `driver_id=eq.${driverId}`,
        },
        (payload) => {
          console.log("📍 Realtime Location Update:", payload.new);

          // Skip proximity check for first update (might be stale data)
          if (isFirstUpdate.current) {
            console.log("⏭️ Skipping first update proximity check");
            isFirstUpdate.current = false;
            return;
          }

          // QUAN TRỌNG: Nếu là driver đang simulation, BỎ QUA update từ Supabase
          // Vì simulation đang control vehicleLocation, không để Supabase ghi đè
          if (
            matchedRideData.isDriver &&
            (isMovingToPickup || rideStatus === "ongoing")
          ) {
            console.log(
              "⏭️ Skipping Supabase update - driver is in simulation mode"
            );
            return;
          }

          if (payload.new && payload.new.latitude && payload.new.longitude) {
            const newLoc = {
              latitude: payload.new.latitude,
              longitude: payload.new.longitude,
            };
            setVehicleLocation(newLoc);

            // Check proximity
            const target =
              rideStatus === "matched"
                ? originCoordinate
                : destinationCoordinate;

            // Calculate distance roughly
            const dist = Math.sqrt(
              Math.pow((target.latitude - newLoc.latitude) * 111, 2) +
                Math.pow((target.longitude - newLoc.longitude) * 85, 2)
            );

            console.log(
              `📏 Distance to target (${rideStatus}): ${dist.toFixed(3)} km`
            );

            // If close (< 100m) and matched, trigger arrived
            if (rideStatus === "matched" && dist < 0.1) {
              handleDriverArrived();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchedRideData.driverId, matchedRideData.isDriver, rideStatus]);

  // Dynamic Route Logic
  const currentRouteOrigin = useMemo(() => {
    const origin =
      rideStatus === "matched" ? vehicleLocation : originCoordinate;
    console.log("🗺️ currentRouteOrigin:", { rideStatus, origin });
    return origin;
  }, [rideStatus, vehicleLocation, originCoordinate]);

  const currentRouteDestination = useMemo(() => {
    const destination =
      rideStatus === "matched" ? originCoordinate : destinationCoordinate;
    console.log("🗺️ currentRouteDestination:", { rideStatus, destination });
    return destination;
  }, [rideStatus, originCoordinate, destinationCoordinate]);

  // ... rest of code
  // Update RouteMap render:
  // origin={currentRouteOrigin}
  // destination={currentRouteDestination}

  const handlePress = (value) => {
    setRating(value);
  };

  const getReviewText = () => {
    const reviews = ["Tệ", "Ổn", "Tốt", "Rất tốt", "Xuất sắc"];
    return reviews[rating - 1] || "";
  };

  // Initialize Stream Chat channel on mount
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setLoadingChat(true);

        // Get current user ID from API
        const profileResp = await getProfile();
        const currentUser = profileResp?.data?.data;
        const currentUserId = currentUser?.id;
        const otherUserId = matchedRideData.isDriver
          ? matchedRideData.passengerId
          : matchedRideData.driverId;

        if (!currentUserId || !otherUserId) {
          console.warn("Missing user IDs for chat initialization", {
            currentUserId,
            otherUserId,
          });
          setLoadingChat(false);
          return;
        }

        // Create or get direct message channel
        const chatChannel = await getOrCreateDirectChannel(
          currentUserId,
          otherUserId,
          {
            rideId: matchedRideData.rideId,
            from: matchedRideData.from,
            to: matchedRideData.to,
          }
        );

        // Watch channel for real-time updates
        await watchChannel(chatChannel, {
          messages: { limit: 50 },
        });

        // Set up listener for new messages
        const handleMessage = (event) => {
          if (event.message) {
            setMessages((prev) => [...prev, event.message]);
          }
        };

        chatChannel.on("message.new", handleMessage);

        setChannel(chatChannel);

        // Load initial messages
        const initialMessages = chatChannel.state.messages || [];
        setMessages(initialMessages);

        setLoadingChat(false);

        return () => {
          chatChannel.off("message.new", handleMessage);
          unwatchChannel(chatChannel);
        };
      } catch (error) {
        console.warn("Error initializing chat:", error);
        setLoadingChat(false);
      }
    };

    initializeChat();
  }, [matchedRideData]);

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

  // Memoize objects to prevent unnecessary re-renders
  const otherPerson = useMemo(
    () =>
      matchedRideData.isDriver
        ? {
            name: matchedRideData.passengerName || "Nguyễn Văn A",
            phone: matchedRideData.passengerPhone || "0901234568",
            avatar:
              matchedRideData.passengerAvatar ||
              "https://i.pravatar.cc/150?img=13",
          }
        : {
            name: matchedRideData.driverName || "Nguyễn Xuân Tứ",
            phone: matchedRideData.driverPhone || "0901234569",
            avatar:
              matchedRideData.driverAvatar ||
              "https://i.pravatar.cc/150?img=14",
            rating: 4.9,
            vehicleModel: matchedRideData.vehicleModel || "Toyota Vios",
            licensePlate: matchedRideData.licensePlate || "30A-12345",
          },
    [matchedRideData]
  );

  const handleSend = async () => {
    if (!inputText.trim() || !channel) return;

    try {
      // Send message via Stream Chat
      await sendMessage(channel, inputText.trim());
      setInputText("");
    } catch (error) {
      console.warn("Error sending message:", error);
      showCustomAlert("Lỗi", "Không thể gửi tin nhắn. Vui lòng thử lại.");
    }
  };

  const handleCompleteRide = async () => {
    try {
      const rideId = matchedRideData.id || matchedRideData.rideId;
      console.log("Completing ride:", rideId);

      // 1. Cập nhật vị trí cuối cùng (tại điểm trả khách = destination) nếu là driver
      if (matchedRideData.isDriver) {
        const finalLocation = destinationCoordinate || vehicleLocation;
        console.log(
          "📍 Updating final driver location to destination:",
          finalLocation
        );
        try {
          // Update backend API
          await axiosClient.post(endpoints.driver.location, {
            latitude: finalLocation.latitude,
            longitude: finalLocation.longitude,
          });
          console.log(
            "✅ Driver location updated to destination successfully (API)"
          );

          // Also update Supabase directly để đảm bảo sync
          const driverId =
            matchedRideData.driverId || matchedRideData.currentUserId;
          if (driverId) {
            const { error } = await supabase
              .from("driver_locations")
              .update({
                latitude: finalLocation.latitude,
                longitude: finalLocation.longitude,
                last_updated: new Date().toISOString(),
              })
              .eq("driver_id", driverId);

            if (error) {
              console.warn("⚠️ Failed to update Supabase:", error);
            } else {
              console.log(
                "✅ Driver location updated to destination successfully (Supabase)"
              );
            }
          }
        } catch (locError) {
          console.warn("⚠️ Failed to update final location:", locError);
        }
      }

      // 2. Update backend status
      await axiosClient.put(endpoints.match.status(rideId), {
        status: "COMPLETED",
      });

      setRideStatus("completed");
      // Cộng điểm thưởng ngẫu nhiên
      const earned = Math.floor(Math.random() * 20) + 10;
      setRewardPoints(earned);

      // 3. Nếu là Driver, thông báo xong và về Home
      if (matchedRideData.isDriver) {
        showCustomAlert(
          "Hoàn thành chuyến đi",
          `Bạn đã hoàn thành chuyến đi thành công!\n+${earned} điểm thưởng`,
          [
            {
              text: "Về Đang Hoạt Động",
              onPress: () => {
                // Navigate về DriverMap với vị trí hiện tại (điểm trả khách)
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: "DriverMap",
                      params: {
                        initialLocation:
                          vehicleLocation || destinationCoordinate,
                      },
                    },
                  ],
                });
              },
            },
          ]
        );
      } else {
        // Nếu là Passenger, hiện modal đánh giá
        setShowFeedbackModal(true);
      }
    } catch (error) {
      console.error("Failed to complete ride:", error);
      showCustomAlert(
        "Lỗi",
        "Không thể hoàn thành chuyến đi. Vui lòng thử lại."
      );
    }
  };

  const handleAudioCall = useCallback(async () => {
    if (!channel) return;
    try {
      // Initiate audio call through Stream
      // In a real implementation, this would use Stream's Video SDK
      showCustomAlert("Gọi điện thoại", `Đang gọi ${otherPerson.name}...`, [
        { text: "Hủy", onPress: () => {} },
      ]);
      // TODO: Implement actual audio call using Stream Video SDK
    } catch (error) {
      console.warn("Error initiating audio call:", error);
    }
  }, [channel, otherPerson.name]);

  const handleVideoCall = useCallback(async () => {
    if (!channel) return;
    try {
      // Initiate video call through Stream
      showCustomAlert("Gọi video", `Đang gọi video ${otherPerson.name}...`, [
        { text: "Hủy", onPress: () => {} },
      ]);
      // TODO: Implement actual video call using Stream Video SDK
    } catch (error) {
      console.warn("Error initiating video call:", error);
    }
  }, [channel, otherPerson.name]);

  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      setIsSubmittingFeedback(true);
      const rideId = matchedRideData.id || matchedRideData.rideId;
      
      console.log("📝 Submitting feedback for ride:", rideId, feedbackData);
      
      await submitFeedback(
        rideId, 
        feedbackData.rating, 
        feedbackData.comment, 
        feedbackData.tags
      );
      
      setShowFeedbackModal(false);
      
      showCustomAlert(
        "Hoàn tất",
        "Cảm ơn bạn đã gửi đánh giá!",
        [{
            text: "Về trang chủ",
            onPress: () => {
                 navigation.reset({
                  index: 0,
                  routes: [{ name: "Home" }],
                });
            }
        }]
      );
    } catch (error) {
      console.error("Feedback submit error:", error);
      Alert.alert("Lỗi", "Không thể gửi đánh giá. Vui lòng thử lại.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <SafeAreaView key={refreshKey} style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
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
                {matchedRideData.isDriver
                  ? "Hành khách đã tham gia"
                  : "Tài xế sắp đến"}
              </Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        {/* Map Section - Takes 50% of screen */}
        <View style={styles.mapContainer}>
          <RouteMap
            vehicleLocation={vehicleLocation}
            driverLocation={initialDriverLocation}
            pickupLocation={originCoordinate} // Luôn luôn là điểm đón
            origin={currentRouteOrigin}
            destination={currentRouteDestination}
            height={height * 0.55} // Map chiếm 55% màn hình
            showRoute={true}
            fullScreen={false}
            rideStatus={rideStatus}
            isDriver={matchedRideData.isDriver}
            // Chỉ hiện xe và chạy animation khi đã bấm "Bắt đầu đón khách" hoặc đang chở khách
            showVehicle={
              (rideStatus === "matched" && isMovingToPickup) ||
              rideStatus === "ongoing"
            }
            startAnimation={
              (rideStatus === "matched" && isMovingToPickup) ||
              rideStatus === "ongoing"
            }
            onDriverArrived={handleDriverArrived}
            onDestinationArrived={handleDestinationArrived}
            onRouteFetched={handleRouteFetched}
          />
        </View>

        {/* Info Panel */}
        <KeyboardAvoidingView
          style={styles.infoPanel}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          {/* Ride Action Buttons */}
          <View
            style={{ paddingHorizontal: 16, marginTop: 10, marginBottom: 20 }}
          >
            {/* 🎯 THÔNG TIN KHÁCH HÀNG - Hiển thị cho cả matched và ongoing */}
            {matchedRideData.isDriver &&
              (rideStatus === "matched" || rideStatus === "ongoing") && (
                <View style={styles.customerInfoCard}>
                  <View style={styles.customerHeader}>
                    <Image
                      source={{
                        uri:
                          matchedRideData.passengerAvatar ||
                          "https://i.pravatar.cc/150?img=3",
                      }}
                      style={styles.customerAvatar}
                    />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={styles.customerNameLabel}>Khách hàng</Text>
                      <Text style={styles.customerName}>
                        {matchedRideData.passengerName}
                      </Text>
                      <View style={styles.customerRatingRow}>
                        <MaterialIcons
                          name="star"
                          size={16}
                          color={COLORS.ORANGE}
                        />
                        <Text style={styles.customerRatingText}>
                          {matchedRideData.passengerRating
                            ? matchedRideData.passengerRating.toFixed(1)
                            : "5.0"}
                        </Text>
                        <Text style={styles.customerPhone}>
                          {" "}
                          • {matchedRideData.passengerPhone}
                        </Text>
                      </View>
                    </View>

                    {/* Nút Chat Nhanh */}
                    <TouchableOpacity
                      style={styles.callButton}
                      onPress={() => setShowChatModal(true)}
                    >
                      <MaterialIcons
                        name="chat"
                        size={24}
                        color={COLORS.WHITE}
                      />
                      {messages.length > 0 && (
                        <View style={styles.chatBadgeSmall}>
                          <Text style={styles.chatBadgeTextSmall}>
                            {messages.length}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.locationSummary}>
                    <View style={styles.locationRow}>
                      <MaterialIcons
                        name="my-location"
                        size={16}
                        color={COLORS.BLUE}
                      />
                      <Text style={styles.locationText} numberOfLines={1}>
                        {matchedRideData.pickupAddress}
                      </Text>
                    </View>
                    <View style={[styles.locationRow, { marginTop: 8 }]}>
                      <MaterialIcons
                        name="location-on"
                        size={16}
                        color={COLORS.RED}
                      />
                      <Text style={styles.locationText} numberOfLines={1}>
                        {matchedRideData.destinationAddress}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

            {/* 🎯 Giai đoạn matched: Nút điều khiển cho driver */}
            {rideStatus === "matched" && matchedRideData.isDriver && (
              <View>
                {/* Logic nút bấm 3 trạng thái */}
                {!isMovingToPickup ? (
                  // 1. CHƯA ĐI => Button "Bắt đầu đón khách"
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      { backgroundColor: COLORS.PRIMARY, marginTop: 16 },
                    ]}
                    onPress={() => {
                      hasNotifiedArrival.current = false; // Reset để có thể notify khi đến
                      setIsMovingToPickup(true);
                      console.log("🚀 Driver started moving to pickup");
                      console.log(
                        "📍 Current simRoutePoints:",
                        simRoutePoints.length,
                        "points"
                      );
                      console.log(
                        "📍 Current vehicleLocation:",
                        vehicleLocation
                      );
                    }}
                  >
                    <Text style={styles.actionBtnText}>Bắt đầu đón khách</Text>
                  </TouchableOpacity>
                ) : !driverArrived ? (
                  // 2. ĐANG ĐI => Button Disabled
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      { backgroundColor: COLORS.GRAY, marginTop: 16 },
                    ]}
                    disabled={true}
                  >
                    <Text style={styles.actionBtnText}>
                      Đang di chuyển đến điểm đón...
                    </Text>
                  </TouchableOpacity>
                ) : (
                  // 3. ĐÃ ĐẾN => Button "Bắt đầu chuyến đi"
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      { backgroundColor: COLORS.PRIMARY, marginTop: 16 },
                    ]}
                    onPress={() => {
                      showCustomAlert(
                        "Bắt đầu chuyến đi",
                        "Xác nhận khách đã lên xe?",
                        [
                          {
                            text: "Hủy",
                            style: "cancel",
                            onPress: () => {},
                          },
                          {
                            text: "Bắt đầu",
                            onPress: () => {
                              console.log("🚀 Driver started trip");
                              hasNotifiedArrival.current = false; // Reset cho phase tiếp theo
                              setDriverArrived(false); // Reset để xe có thể chạy tiếp
                              setRideStatus("ongoing");
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <Text style={styles.actionBtnText}>Bắt đầu chuyến đi</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* 🎯 THÔNG TIN TÀI XẾ - Hiển thị cho passenger khi matched */}
            {rideStatus === "matched" && !matchedRideData.isDriver && (
              <View style={styles.customerInfoCard}>
                <View style={styles.customerHeader}>
                  <Image
                    source={{
                      uri:
                        matchedRideData.driverAvatar ||
                        "https://i.pravatar.cc/150?img=1",
                    }}
                    style={styles.customerAvatar}
                  />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.customerNameLabel}>Tài xế</Text>
                    <Text style={styles.customerName}>
                      {matchedRideData.driverName || "Tài xế"}
                    </Text>
                    <View style={styles.customerRatingRow}>
                      <MaterialIcons
                        name="star"
                        size={16}
                        color={COLORS.ORANGE}
                      />
                      <Text style={styles.customerRatingText}>
                        {matchedRideData.driverRating
                          ? matchedRideData.driverRating.toFixed(1)
                          : "5.0"}
                      </Text>
                      <Text style={styles.customerPhone}>
                        {" "}
                        • {matchedRideData.driverPhone || ""}
                      </Text>
                    </View>
                  </View>

                  {/* Nút Chat Nhanh */}
                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={() => setShowChatModal(true)}
                  >
                    <MaterialIcons name="chat" size={24} color={COLORS.WHITE} />
                    {messages.length > 0 && (
                      <View style={styles.chatBadgeSmall}>
                        <Text style={styles.chatBadgeTextSmall}>
                          {messages.length}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                {/* Vehicle Info - XanhSM Style */}
                {(matchedRideData.vehicleInfo ||
                  matchedRideData.vehicleModel ||
                  matchedRideData.licensePlate) && (
                  <View style={styles.vehicleInfoSection}>
                    <View style={styles.vehicleInfoCard}>
                      <View style={styles.vehicleInfoRow}>
                        <View style={styles.vehicleIconContainer}>
                          <MaterialIcons
                            name="two-wheeler"
                            size={24}
                            color={COLORS.PRIMARY}
                          />
                        </View>
                        <View style={styles.vehicleInfoContent}>
                          {matchedRideData.vehicleInfo ? (
                            <Text style={styles.vehicleModel}>
                              {matchedRideData.vehicleInfo}
                            </Text>
                          ) : (
                            <>
                              <Text style={styles.vehicleModel}>
                                {matchedRideData.vehicleModel || "Xe máy"}
                              </Text>
                              {matchedRideData.licensePlate && (
                                <Text style={styles.licensePlate}>
                                  {matchedRideData.licensePlate}
                                </Text>
                              )}
                            </>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                <View style={styles.divider} />

                <View style={styles.locationSummary}>
                  <View style={styles.locationRow}>
                    <MaterialIcons
                      name="my-location"
                      size={16}
                      color={COLORS.BLUE}
                    />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {matchedRideData.from || matchedRideData.pickupAddress}
                    </Text>
                  </View>
                  <View style={[styles.locationRow, { marginTop: 8 }]}>
                    <MaterialIcons
                      name="location-on"
                      size={16}
                      color={COLORS.RED}
                    />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {matchedRideData.to || matchedRideData.destinationAddress}
                    </Text>
                  </View>
                </View>

                {/* ETA Info */}
                <View style={styles.etaInfoRow}>
                  <MaterialIcons
                    name="schedule"
                    size={16}
                    color={COLORS.PRIMARY}
                  />
                  <Text style={styles.etaInfoText}>
                    Tài xế đang đến • ETA: {driverETA}
                  </Text>
                </View>
              </View>
            )}

            {/* 🎯 Giai đoạn ongoing: Đang trên đường đến đích */}
            {rideStatus === "ongoing" && (
              <>
                {/* Driver Coming Info - Only show for passengers */}
                {!matchedRideData.isDriver && (
                  <View style={styles.driverComingSection}>
                    <View style={styles.driverComingHeader}>
                      <View>
                        <Text style={styles.driverComingTitle}>
                          Tài xế đang đến
                        </Text>
                        <Text style={styles.driverComingSubtitle}>
                          Cách bạn {driverDistance}
                        </Text>
                      </View>
                      <View style={styles.etaBox}>
                        <MaterialIcons
                          name="schedule"
                          size={20}
                          color={COLORS.PRIMARY}
                        />
                        <Text style={styles.etaText}>{driverETA}</Text>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar} />
                    </View>

                    {/* Location Info */}
                    <View style={styles.locationInfoRow}>
                      <View style={styles.locationInfoItem}>
                        <MaterialIcons
                          name="my-location"
                          size={14}
                          color={COLORS.GREEN}
                        />
                        <Text style={styles.locationInfoText}>
                          {rideDetails.from}
                        </Text>
                      </View>
                      <View style={styles.locationInfoItem}>
                        <MaterialIcons
                          name="place"
                          size={14}
                          color={COLORS.RED}
                        />
                        <Text style={styles.locationInfoText}>
                          {rideDetails.to}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Button Hoàn thành - Chỉ enable khi đã đến đích */}
                {matchedRideData.isDriver ? (
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor: destinationArrived
                          ? COLORS.GREEN
                          : COLORS.GRAY,
                      },
                    ]}
                    onPress={() => handleCompleteRide()}
                    disabled={!destinationArrived}
                  >
                    <Text style={styles.actionBtnText}>
                      {destinationArrived
                        ? "Hoàn thành chuyến đi"
                        : "Đang đến điểm đích..."}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.waitingSection}>
                    <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                    <Text style={styles.waitingText}>
                      Đang trên đường đến đích...
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </ScrollView>

      {/* Chat Modal */}
      <ChatModal
        visible={showChatModal}
        onClose={() => setShowChatModal(false)}
        messages={messages}
        inputText={inputText}
        onInputChange={setInputText}
        onSend={handleSend}
        onAudioCall={handleAudioCall}
        onVideoCall={handleVideoCall}
        loading={loadingChat}
        currentUserId={matchedRideData.currentUserId}
        otherPersonName={otherPerson.name}
      />

      {/* Custom Alert Modal */}
      <CustomAlert
        visible={customAlert.visible}
        title={customAlert.title}
        message={customAlert.message}
        buttons={customAlert.buttons}
        onClose={() => setCustomAlert({ ...customAlert, visible: false })}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        visible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={handleFeedbackSubmit}
        isLoading={isSubmittingFeedback}
        driverName={matchedRideData.driverName}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  headerContainer: {
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  mapContainer: {
    height: height * 0.48,
    backgroundColor: COLORS.WHITE,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.BLACK,
  },
  headerSpacer: {
    width: 36,
  },
  infoPanel: {
    flex: 1, // Đảm bảo fill hết height
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 30,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  chatIconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  chatBadgeSmall: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: COLORS.RED,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  chatBadgeTextSmall: {
    color: COLORS.WHITE,
    fontSize: 10,
    fontWeight: "bold",
  },
  routeInfoSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.BLACK,
    marginLeft: 12,
    flex: 1,
    fontWeight: "500",
  },
  personInfoCard: {
    margin: 16,
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 18,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  driverMainInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  personAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  driverTextInfo: {
    flex: 1,
    marginLeft: 12,
  },
  personName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.BLACK,
    marginBottom: 2,
  },
  driverRole: {
    fontSize: 12,
    color: COLORS.GRAY,
    fontWeight: "500",
  },
  vehicleInfoBox: {
    alignItems: "flex-end",
  },
  vehicleModel: {
    fontSize: 16,
    color: COLORS.BLACK,
    fontWeight: "600",
    marginBottom: 6,
  },
  licensePlate: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.PRIMARY,
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  ratingSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  ratingSectionLabel: {
    fontSize: 12,
    color: COLORS.GRAY,
    fontWeight: "600",
    marginBottom: 6,
  },
  starsRow: {
    flexDirection: "row",
    gap: 4,
  },
  threeColumnInfo: {
    flexDirection: "row",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoColumn: {
    flex: 1,
  },
  infoColumnDivider: {
    width: 1,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 12,
  },
  infoColumnLabel: {
    fontSize: 11,
    color: COLORS.GRAY,
    fontWeight: "600",
    marginBottom: 6,
  },
  infoColumnValue: {
    fontSize: 13,
    color: COLORS.BLACK,
    fontWeight: "700",
  },
  personHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.BLACK,
    marginBottom: 2,
  },
  callBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.GREEN,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  messagesContainer: {
    maxHeight: 200,
    paddingHorizontal: 16,
    marginBottom: 8,
    height: 105,
  },
  loadingContainer: {
    height: 105,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  emptyMessagesContainer: {
    height: 105,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  emptyMessagesText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.GRAY,
  },
  messageRow: {
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  messageRowMyMessage: {
    justifyContent: "flex-end",
  },
  messageBubble: {
    backgroundColor: "#e8f0fe",
    padding: 12,
    borderRadius: 14,
    maxWidth: "80%",
    borderBottomLeftRadius: 4,
  },
  messageBubbleOwn: {
    backgroundColor: COLORS.PRIMARY,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    color: COLORS.BLACK,
  },
  messageTextOwn: {
    color: COLORS.WHITE,
  },
  messageTime: {
    fontSize: 11,
    color: COLORS.GRAY,
    marginTop: 4,
  },
  messageTimeOwn: {
    color: "rgba(255,255,255,0.7)",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    minHeight: 52,
    borderTopColor: COLORS.GRAY_LIGHT,
    backgroundColor: COLORS.WHITE,
    gap: 8,
  },
  inputField: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 36,
    maxHeight: 100,
    lineHeight: 20,
    color: COLORS.BLACK,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.GREEN,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  actionBtn: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  actionBtnText: {
    color: COLORS.WHITE,
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  waitingSection: {
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FFD54F",
  },
  waitingText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.BLACK,
    marginTop: 8,
    textAlign: "center",
  },
  waitingSubtext: {
    fontSize: 13,
    color: COLORS.GRAY,
    marginTop: 4,
    textAlign: "center",
  },
  driverComingSection: {
    backgroundColor: "#f0fef9",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#d4f4ea",
    shadowColor: COLORS.GREEN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  driverComingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  driverComingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.BLACK,
    marginBottom: 4,
  },
  driverComingSubtitle: {
    fontSize: 13,
    color: COLORS.GRAY,
    fontWeight: "500",
  },
  etaBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  etaText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.PRIMARY,
  },
  progressContainer: {
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 2,
    marginBottom: 12,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    width: "45%",
    backgroundColor: COLORS.GREEN,
    borderRadius: 2,
  },
  locationInfoRow: {
    gap: 10,
  },
  locationInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  locationInfoText: {
    fontSize: 13,
    color: COLORS.BLACK,
    fontWeight: "500",
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBox: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    padding: 24,
    width: "90%",
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    color: COLORS.BLACK,
  },
  modalSubtitle: {
    textAlign: "center",
    fontSize: 15,
    color: COLORS.GRAY,
    marginBottom: 16,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: COLORS.BLACK,
    marginTop: 12,
    minHeight: 80,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  star: {
    marginHorizontal: 5,
  },
  reviewText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.BLACK,
  },
  // Customer Info Card Styles
  customerInfoCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  customerHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  customerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.LIGHT_GRAY,
  },
  vehicleInfoSection: {
    paddingVertical: 8,
  },
  vehicleInfoCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  vehicleInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  vehicleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.WHITE,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginRight: 12,
  },
  vehicleInfoContent: {
    flex: 1,
  },
  etaInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  etaInfoText: {
    fontSize: 13,
    color: COLORS.PRIMARY,
    fontWeight: "600",
    marginLeft: 8,
  },
  customerNameLabel: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginBottom: 4,
  },
  customerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.BLACK,
  },
  customerRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  customerRatingText: {
    fontSize: 14,
    color: COLORS.BLACK,
    fontWeight: "600",
    marginLeft: 4,
    marginRight: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  callButton: {
    backgroundColor: COLORS.GREEN,
    padding: 10,
    borderRadius: 25,
    marginLeft: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 12,
  },
  locationSummary: {
    paddingHorizontal: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 14,
    color: COLORS.BLACK,
    marginLeft: 8,
    flex: 1,
  },
});

export default MatchedRideScreen;
