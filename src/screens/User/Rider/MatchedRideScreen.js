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
import { getProfile } from "../../../services/userService";

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
            path={path}
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

          {/* Driver/Passenger Info Card */}
          <View style={styles.personInfoCard}>
            <View style={styles.personHeader}>
              <Image
                source={{ uri: otherPerson.avatar }}
                style={styles.personAvatar}
              />
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{otherPerson.name}</Text>
                {!matchedRideData.isDriver && otherPerson.rating && (
                  <View style={styles.ratingRow}>
                    <MaterialIcons
                      name="star"
                      size={16}
                      color={COLORS.ORANGE_DARK}
                    />
                    <Text style={styles.ratingText}>{otherPerson.rating}</Text>
                  </View>
                )}
              </View>

              {/* Vehicle Info (only for passenger view) - inline with avatar and name */}
              {!matchedRideData.isDriver && (
                <View style={styles.vehicleInfo}>
                  <Text style={styles.licensePlate}>
                    {otherPerson.licensePlate}
                  </Text>
                  <Text style={styles.vehicleModel}>
                    {otherPerson.vehicleModel}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Ride Action Buttons */}
          <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
            {rideStatus === "matched" && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: COLORS.PRIMARY }]}
                onPress={() => setRideStatus("ongoing")}
              >
                <Text style={styles.actionBtnText}>🚗 Bắt đầu chuyến đi</Text>
              </TouchableOpacity>
            )}

            {rideStatus === "ongoing" && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: COLORS.GREEN }]}
                onPress={() => handleCompleteRide()}
              >
                <Text style={styles.actionBtnText}>
                  🏁 Hoàn thành chuyến đi
                </Text>
              </TouchableOpacity>
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
    paddingTop: 8,
    paddingBottom: 8,
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  routeInfoSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.BLACK,
    marginLeft: 8,
    flex: 1,
  },
  personInfoCard: {
    margin: 10,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 10,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
  },
  personHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  personAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.GRAY_LIGHT,
    marginRight: 10,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.BLACK,
    marginBottom: 2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 13,
    color: COLORS.BLACK,
    marginLeft: 4,
    fontWeight: "500",
  },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.GREEN,
    justifyContent: "center",
    alignItems: "center",
  },
  vehicleInfo: {
    flexDirection: "column",
    alignItems: "flex-start",
    marginLeft: 10,
    justifyContent: "center",
  },
  licensePlate: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.BLACK,
    marginBottom: 2,
  },
  vehicleModel: {
    fontSize: 11,
    color: COLORS.GRAY,
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
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  messageRowMyMessage: {
    justifyContent: "flex-end",
  },
  messageBubble: {
    backgroundColor: COLORS.BLUE_LIGHT,
    padding: 12,
    borderRadius: 12,
    maxWidth: "80%",
  },
  messageBubbleOwn: {
    backgroundColor: COLORS.PRIMARY,
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
    paddingVertical: 6,
    borderTopWidth: 1,
    minHeight: 44,
    borderTopColor: COLORS.GRAY_LIGHT,
    backgroundColor: COLORS.WHITE,
    gap: 6,
  },
  inputField: {
    flex: 1,
    backgroundColor: COLORS.GRAY_BG,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    minHeight: 32,
    maxHeight: 100,
    lineHeight: 20,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },
  callButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.GREEN,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  actionBtnText: {
    color: COLORS.WHITE,
    fontWeight: "600",
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBox: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 20,
    width: "90%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
    color: COLORS.BLACK,
  },
  modalSubtitle: {
    textAlign: "center",
    fontSize: 14,
    color: COLORS.GRAY,
    marginBottom: 10,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: COLORS.BLACK,
    marginTop: 10,
    minHeight: 60,
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
    fontWeight: "500",
    color: "#333",
  },
});

export default MatchedRideScreen;
