import React, { useState, useMemo, useCallback, useEffect } from "react";
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
import { Modal } from "react-native";
import { useSharedPath } from "../../../hooks/useSharedPath";
import {
  getOrCreateDirectChannel,
  sendMessage,
  watchChannel,
  unwatchChannel,
} from "../../../services/chatService";

const { width, height } = Dimensions.get("window");

const MatchedRideScreen = ({ navigation, route }) => {
  const matchedRideData = route.params || {};
  const insets = useSafeAreaInsets();
  const [refreshKey, setRefreshKey] = useState(0);

  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]);
  const [channel, setChannel] = useState(null);
  const [loadingChat, setLoadingChat] = useState(true);

  const [rideStatus, setRideStatus] = useState("matched"); // 'matched' | 'ongoing' | 'completed'
  const { path } = useSharedPath();
  const [rewardPoints, setRewardPoints] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0);
  const maxStars = 5;

  // Vehicle tracking state
  const [vehicleLocation, setVehicleLocation] = useState(null);
  const [driverETA, setDriverETA] = useState("7 phút");
  const [driverDistance, setDriverDistance] = useState("2.3 km");

  // Don't need dynamicRoutePath - MapViewDirections will handle routing
  // Just pass origin and destination to MapViewDirections component

  // Calculate distance and ETA between two points
  const calculateDistanceAndETA = (from, to) => {
    const distanceKm = Math.sqrt(
      Math.pow((to.latitude - from.latitude) * 111, 2) +
        Math.pow((to.longitude - from.longitude) * 85, 2)
    );

    const durationMin = Math.ceil(distanceKm * 3); // ~3 min per km
    setDriverETA(`${Math.max(1, durationMin)} phút`);
    setDriverDistance(`${distanceKm.toFixed(1)} km`);
  };

  // Simulate vehicle movement
  useEffect(() => {
    // Show vehicle immediately when screen loads (for demo)
    const initialLocation = {
      latitude: 21.0285 - 0.005, // Start 0.5km away from pickup
      longitude: 105.8542 - 0.003,
    };
    setVehicleLocation(initialLocation);
    console.log("🚗 Vehicle initialized on mount:", initialLocation);

    // Calculate initial distance/ETA
    const pickupPoint = { latitude: 21.0285, longitude: 105.8542 };
    calculateDistanceAndETA(initialLocation, pickupPoint);

    if (rideStatus === "ongoing") {
      // Update vehicle location every 3 seconds when ride is ongoing
      const interval = setInterval(() => {
        setVehicleLocation((prev) => {
          if (!prev) return null;

          // Move vehicle closer to pickup point
          const targetLat = 21.0285;
          const targetLng = 105.8542;

          // Calculate simple movement (move 10% closer each update)
          const newLat = prev.latitude + (targetLat - prev.latitude) * 0.1;
          const newLng = prev.longitude + (targetLng - prev.longitude) * 0.1;

          const newPosition = { latitude: newLat, longitude: newLng };

          // Calculate distance
          const distanceKm = Math.sqrt(
            Math.pow((targetLat - newLat) * 111, 2) +
              Math.pow((targetLng - newLng) * 85, 2)
          );

          console.log("🚗 Vehicle moving:", { newLat, newLng, distanceKm });

          // Update distance/ETA
          calculateDistanceAndETA(newPosition, {
            latitude: targetLat,
            longitude: targetLng,
          });

          // Stop when very close
          if (distanceKm < 0.1) {
            clearInterval(interval);
            Alert.alert("Thông báo", "Tài xế đã đến điểm đón!");
            return { latitude: targetLat, longitude: targetLng };
          }

          return newPosition;
        });
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [rideStatus]);

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

        // Assuming current user info is available in matchedRideData or navigation params
        const currentUserId = matchedRideData.currentUserId;
        const otherUserId = matchedRideData.isDriver
          ? matchedRideData.passengerId
          : matchedRideData.driverId;

        if (!currentUserId || !otherUserId) {
          console.warn("Missing user IDs for chat initialization");
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
    () => ({
      latitude: 21.0285,
      longitude: 105.8542,
      description: rideDetails.from,
    }),
    [rideDetails.from]
  );

  const destinationCoordinate = useMemo(
    () => ({
      latitude: 21.0152,
      longitude: 105.8415,
      description: rideDetails.to,
    }),
    [rideDetails.to]
  );

  const handleSend = async () => {
    if (!inputText.trim() || !channel) return;

    try {
      // Send message via Stream Chat
      await sendMessage(channel, inputText.trim());
      setInputText("");
    } catch (error) {
      console.warn("Error sending message:", error);
      Alert.alert("Lỗi", "Không thể gửi tin nhắn. Vui lòng thử lại.");
    }
  };

  const handleCompleteRide = () => {
    setRideStatus("completed");
    // Cộng điểm thưởng ngẫu nhiên
    const earned = Math.floor(Math.random() * 20) + 10;
    setRewardPoints(earned);

    // Hiện modal đánh giá
    setShowRatingModal(true);
  };

  const handleAudioCall = useCallback(async () => {
    if (!channel) return;
    try {
      // Initiate audio call through Stream
      // In a real implementation, this would use Stream's Video SDK
      Alert.alert("Gọi điện thoại", `Đang gọi ${otherPerson.name}...`, [
        { text: "Hủy" },
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
      Alert.alert("Gọi video", `Đang gọi video ${otherPerson.name}...`, [
        { text: "Hủy" },
      ]);
      // TODO: Implement actual video call using Stream Video SDK
    } catch (error) {
      console.warn("Error initiating video call:", error);
    }
  }, [channel, otherPerson.name]);

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
            origin={originCoordinate}
            destination={destinationCoordinate}
            height={height * 0.5}
            showRoute={true}
            fullScreen={false}
            rideStatus={rideStatus}
            vehicleLocation={vehicleLocation}
            pickupLocation={originCoordinate}
            showCheckpoints={true}
            useMapViewDirections={true}
          />
        </View>

        {/* Info Panel */}
        <KeyboardAvoidingView
          style={styles.infoPanel}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          {/* Route Info */}
          <View style={styles.routeInfoSection}>
            <View style={styles.locationRow}>
              <MaterialIcons
                name="radio-button-checked"
                size={16}
                color={COLORS.GREEN}
              />
              <Text style={styles.locationText}>{rideDetails.from}</Text>
            </View>
            <View style={styles.locationRow}>
              <MaterialIcons name="place" size={16} color={COLORS.RED} />
              <Text style={styles.locationText}>{rideDetails.to}</Text>
            </View>
          </View>

          {/* Driver/Passenger Info Card - Redesigned */}
          <View style={styles.personInfoCard}>
            {/* Driver Avatar, Name & Vehicle */}
            <View style={styles.driverMainInfo}>
              <Image
                source={{ uri: otherPerson.avatar }}
                style={styles.personAvatar}
              />
              <View style={styles.driverTextInfo}>
                <Text style={styles.personName}>{otherPerson.name}</Text>
                <Text style={styles.driverRole}>Driver</Text>
              </View>
              {!matchedRideData.isDriver && (
                <View style={styles.vehicleInfoBox}>
                  <Text style={styles.vehicleModel}>
                    {otherPerson.vehicleModel || "Toyota Avanza, Black"}
                  </Text>
                  <Text style={styles.licensePlate}>
                    {otherPerson.licensePlate || "B 1233 YH"}
                  </Text>
                </View>
              )}
            </View>

            {/* Rating Stars */}
            {!matchedRideData.isDriver && (
              <View style={styles.ratingSection}>
                <Text style={styles.ratingSectionLabel}>Rating</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <MaterialIcons
                      key={star}
                      name="star"
                      size={18}
                      color="#FFD700"
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Two Column Info: Payment Method | Travel Duration */}
            <View style={styles.threeColumnInfo}>
              <View style={styles.infoColumn}>
                <Text style={styles.infoColumnLabel}>Payment Method</Text>
                <Text style={styles.infoColumnValue}>e-Wallet</Text>
              </View>
              <View style={styles.infoColumnDivider} />
              <View style={styles.infoColumn}>
                <Text style={styles.infoColumnLabel}>Travel Duration</Text>
                <Text style={styles.infoColumnValue}>
                  {rideDetails.duration || "30 Minutes"}
                </Text>
              </View>
            </View>
          </View>

          {/* Ride Action Buttons */}
          <View
            style={{ paddingHorizontal: 16, marginTop: 8, marginBottom: 12 }}
          >
            {rideStatus === "matched" && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: COLORS.PRIMARY }]}
                onPress={() => setRideStatus("ongoing")}
              >
                <Text style={styles.actionBtnText}>🚗 Bắt đầu chuyến đi</Text>
              </TouchableOpacity>
            )}

            {rideStatus === "ongoing" && (
              <>
                {/* Driver Coming Info */}
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
                        name="radio-button-checked"
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

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: COLORS.GREEN }]}
                  onPress={() => handleCompleteRide()}
                >
                  <Text style={styles.actionBtnText}>
                    🏁 Hoàn thành chuyến đi
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Recent Messages */}
          {loadingChat ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.PRIMARY} />
              <Text style={{ marginTop: 8, color: COLORS.GRAY }}>
                Đang tải chat...
              </Text>
            </View>
          ) : messages.length > 0 ? (
            <ScrollView
              style={styles.messagesContainer}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((message) => {
                const isMyMessage =
                  message.user?.id === matchedRideData.currentUserId;
                return (
                  <View
                    key={message.id}
                    style={[
                      styles.messageRow,
                      isMyMessage && styles.messageRowMyMessage,
                    ]}
                  >
                    <View
                      style={[
                        styles.messageBubble,
                        isMyMessage && styles.messageBubbleOwn,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          isMyMessage && styles.messageTextOwn,
                        ]}
                      >
                        {message.text}
                      </Text>
                      <Text
                        style={[
                          styles.messageTime,
                          isMyMessage && styles.messageTimeOwn,
                        ]}
                      >
                        {message.created_at
                          ? new Date(message.created_at).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : ""}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.emptyMessagesContainer}>
              <MaterialIcons name="chat-bubble" size={40} color={COLORS.GRAY} />
              <Text style={styles.emptyMessagesText}>
                Bắt đầu cuộc trò chuyện
              </Text>
            </View>
          )}

          {/* Input Bar with Call Buttons */}
          <View
            style={[
              styles.inputBar,
              { paddingBottom: Math.max(insets.bottom, 12) },
            ]}
          >
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Tin nhắn..."
              style={styles.inputField}
              multiline
              placeholderTextColor={COLORS.PLACEHOLDER_COLOR}
              editable={!loadingChat}
            />
            <TouchableOpacity
              onPress={handleAudioCall}
              style={styles.callButton}
              disabled={loadingChat}
            >
              <MaterialIcons name="phone" size={18} color={COLORS.WHITE} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleVideoCall}
              style={[styles.callButton, { backgroundColor: COLORS.PRIMARY }]}
              disabled={loadingChat}
            >
              <MaterialIcons name="videocam" size={18} color={COLORS.WHITE} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSend}
              style={styles.sendButton}
              disabled={loadingChat}
            >
              <MaterialIcons name="send" size={18} color={COLORS.WHITE} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>

      {/* Rating Modal */}
      <Modal
        visible={showRatingModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowRatingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Đánh giá chuyến đi</Text>
            <Text style={styles.modalSubtitle}>
              Bạn nhận được{" "}
              <Text style={{ color: COLORS.PRIMARY, fontWeight: "600" }}>
                {rewardPoints}
              </Text>{" "}
              điểm thưởng 🎁!
            </Text>

            <View style={{ alignItems: "center", marginVertical: 10 }}>
              <View style={{ flexDirection: "row", marginBottom: 8 }}>
                {Array.from({ length: maxStars }).map((_, index) => {
                  const value = index + 1;
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handlePress(value)}
                      activeOpacity={0.7}
                      style={{ marginHorizontal: 4 }}
                    >
                      <FontAwesome
                        name={value <= rating ? "star" : "star-o"}
                        size={36}
                        color={value <= rating ? "#FFD700" : "#CCC"}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              {rating > 0 && (
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "500",
                    color: COLORS.BLACK,
                  }}
                >
                  {getReviewText()}
                </Text>
              )}
            </View>

            <TextInput
              placeholder="Nhận xét về đối phương..."
              style={styles.commentInput}
              multiline
              value={comment}
              onChangeText={setComment}
            />

            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: COLORS.PRIMARY, marginTop: 10 },
              ]}
              onPress={() => {
                setShowRatingModal(false);
                Alert.alert(
                  "Hoàn tất đánh giá",
                  `Cảm ơn bạn đã gửi đánh giá ${rating} sao cho bạn đồng hành này.`,
                  [{ text: "Đóng" }]
                );
                // TODO: Gửi rating + comment + matchedRideData lên backend
              }}
            >
              <Text style={styles.actionBtnText}>Gửi đánh giá</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
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
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
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
    fontSize: 12,
    color: COLORS.BLACK,
    fontWeight: "600",
    marginBottom: 2,
  },
  licensePlate: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.BLACK,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
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
});

export default MatchedRideScreen;
