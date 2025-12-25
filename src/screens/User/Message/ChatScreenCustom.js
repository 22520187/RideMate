import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { chatClient } from "../../../utils/StreamClient";
import COLORS from "../../../constant/colors";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatScreenCustom({ route, navigation }) {
  const { channelId, otherUserId, otherUserName, otherUserAvatar, rideInfo } =
    route.params || {};

  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    const initializeChannel = async () => {
      try {
        setLoading(true);

        const currentUserId = chatClient.userID || chatClient.user?.id;
        console.log("Initializing channel:", {
          channelId,
          currentUserId,
          otherUserId,
          otherUserName,
        });

        if (!currentUserId) {
          throw new Error("User chưa đăng nhập vào Stream Chat");
        }

        // Tạo members array - chỉ thêm otherUserId nếu có
        const members = [currentUserId];
        if (otherUserId) {
          members.push(otherUserId.toString());
        }

        // Get or create channel from Stream Chat
        const messageChannel = chatClient.channel("messaging", channelId, {
          name: otherUserName || "Chat",
          members: members,
        });

        // Create channel trước khi watch
        await messageChannel.create();

        // Watch the channel for updates
        await messageChannel.watch();
        setChannel(messageChannel);

        console.log("Channel initialized successfully:", messageChannel.id);

        // Load existing messages (không reverse vì messages đã đúng thứ tự)
        const channelState = messageChannel.state;
        const existingMessages = channelState.messages || [];

        // Filter unique messages by ID để tránh duplicate
        const uniqueMessages = existingMessages.filter(
          (msg, index, self) => index === self.findIndex((m) => m.id === msg.id)
        );

        setMessages(uniqueMessages);

        setLoading(false);
      } catch (error) {
        console.error("Error initializing channel:", error);
        Alert.alert(
          "Lỗi",
          "Không thể tải cuộc trò chuyện. Vui lòng đảm bảo cả 2 người đã đăng nhập."
        );
        setLoading(false);
      }
    };

    if (channelId) {
      initializeChannel();
    }
  }, [channelId, otherUserName, otherUserId]);

  // Listen for new messages
  useEffect(() => {
    if (!channel) return;

    const handleNewMessage = (event) => {
      if (event.message) {
        setMessages((prevMessages) => {
          // Kiểm tra xem message đã tồn tại chưa để tránh duplicate
          const exists = prevMessages.some(
            (msg) => msg.id === event.message.id
          );
          if (exists) {
            return prevMessages;
          }
          return [...prevMessages, event.message];
        });
        // Auto scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    };

    // Subscribe to new messages
    channel.on("message.new", handleNewMessage);

    return () => {
      channel.off("message.new", handleNewMessage);
    };
  }, [channel]);

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || !channel || sending) return;

    try {
      setSending(true);
      await channel.sendMessage({
        text: inputText.trim(),
      });
      setInputText("");

      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Lỗi", "Không thể gửi tin nhắn");
    } finally {
      setSending(false);
    }
  }, [inputText, channel, sending]);

  const handleAudioCall = useCallback(() => {
    Alert.alert("Gọi điện thoại", `Đang gọi ${otherUserName}...`, [
      { text: "Hủy" },
    ]);
  }, [otherUserName]);

  const handleVideoCall = useCallback(() => {
    Alert.alert("Gọi video", `Đang gọi video ${otherUserName}...`, [
      { text: "Hủy" },
    ]);
  }, [otherUserName]);

  const renderMessage = ({ item: message }) => {
    const isMyMessage = message.user?.id === chatClient.userID;
    const messageTime = message.created_at
      ? new Date(message.created_at).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    return (
      <View style={[styles.messageRow, isMyMessage && styles.myMessageRow]}>
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.otherMessageText,
            ]}
          >
            {message.text}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isMyMessage ? styles.myMessageTime : styles.otherMessageTime,
            ]}
          >
            {messageTime}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5370" />
          <Text style={styles.loadingText}>Đang tải chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header - Giống RideDetail */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          {otherUserAvatar ? (
            <Image
              source={{ uri: otherUserAvatar }}
              style={styles.headerAvatar}
            />
          ) : (
            <View style={[styles.headerAvatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={20} color="#8E8E93" />
            </View>
          )}
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {otherUserName || "Tin nhắn"}
            </Text>
            {rideInfo && (
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {rideInfo.from} → {rideInfo.to}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleAudioCall}
            style={styles.actionButton}
          >
            <Ionicons name="call" size={20} color={COLORS.PRIMARY} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleVideoCall}
            style={styles.actionButton}
          >
            <Ionicons name="videocam" size={20} color={COLORS.PRIMARY} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) =>
            item.id || `message-${index}-${item.created_at}`
          }
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={60} color="#8E8E93" />
              <Text style={styles.emptyText}>Chưa có tin nhắn</Text>
              <Text style={styles.emptySubtext}>
                Gửi tin nhắn đầu tiên để bắt đầu cuộc trò chuyện
              </Text>
            </View>
          }
        />

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor="#8E8E93"
              multiline
              maxLength={1000}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#8E8E93",
  },

  // Header - Giống RideDetail
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },

  // Chat Container
  chatContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
  },

  // Message Row - Giống RideDetail
  messageRow: {
    marginBottom: 12,
    alignItems: "flex-start",
  },
  myMessageRow: {
    alignItems: "flex-end",
  },

  // Message Bubble - Giống RideDetail
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
  },
  myMessageBubble: {
    backgroundColor: COLORS.PRIMARY,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: "#F5F5F5",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 16,
  },

  // Message Text - Giống RideDetail
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  myMessageText: {
    color: "#FFFFFF",
  },
  otherMessageText: {
    color: "#1C1C1E",
  },

  // Message Time - Giống RideDetail
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: "rgba(255,255,255,0.8)",
  },
  otherMessageTime: {
    color: "#8E8E93",
  },

  // Input Container
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    justifyContent: "center",
  },
  input: {
    fontSize: 15,
    color: "#1C1C1E",
    lineHeight: 20,
    paddingVertical: 0,
    textAlignVertical: "center",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
