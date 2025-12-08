import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Channel, MessageList, MessageInput } from "stream-chat-expo";
import { chatClient } from "../../../utils/StreamClient";
import COLORS from "../../../constant/colors";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatScreen({ route, navigation }) {
  const { channelId, otherUserId, otherUserName, otherUserAvatar, rideInfo } =
    route.params || {};

  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeChannel = async () => {
      try {
        setLoading(true);

        // Get or create channel from Stream Chat
        const messageChannel = chatClient.channel("messaging", channelId, {
          name: otherUserName,
        });

        // Watch the channel for updates
        await messageChannel.watch();
        setChannel(messageChannel);
        setLoading(false);
      } catch (error) {
        console.warn("Error initializing channel:", error);
        Alert.alert("Lỗi", "Không thể tải cuộc trò chuyện");
        setLoading(false);
      }
    };

    if (channelId) {
      initializeChannel();
    }
  }, [channelId, otherUserName]);

  const handleAudioCall = useCallback(() => {
    Alert.alert("Gọi điện thoại", `Đang gọi ${otherUserName}...`, [
      { text: "Hủy" },
    ]);
    // TODO: Implement Stream Video SDK for actual calls
  }, [otherUserName]);

  const handleVideoCall = useCallback(() => {
    Alert.alert("Gọi video", `Đang gọi video ${otherUserName}...`, [
      { text: "Hủy" },
    ]);
    // TODO: Implement Stream Video SDK for actual calls
  }, [otherUserName]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Đang tải chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.BLACK} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          {otherUserAvatar && (
            <Image
              source={{ uri: otherUserAvatar }}
              style={styles.headerAvatar}
            />
          )}
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
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
            <MaterialIcons name="phone" size={20} color={COLORS.PRIMARY} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleVideoCall}
            style={styles.actionButton}
          >
            <MaterialIcons name="videocam" size={20} color={COLORS.PRIMARY} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat using Stream Chat components */}
      {channel && (
        <View style={styles.chatContainer}>
          <Channel channel={channel}>
            <MessageList />
            <MessageInput />
          </Channel>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.GRAY,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
    gap: 10,
  },
  backButton: {
    padding: 6,
  },
  headerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  headerTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  headerTitle: {
    color: COLORS.BLACK,
    fontSize: 16,
    fontWeight: "600",
  },
  headerSubtitle: {
    color: COLORS.GRAY,
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
});
