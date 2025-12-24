import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
} from "react-native";
import COLORS from "../../../constant/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import { chatClient } from "../../../utils/StreamClient";
import { useEffect, useMemo, useState } from "react";
import { getChatToken, getUserData } from "../../../utils/storage";
import GradientHeader from "../../../components/GradientHeader";
import { ChannelListItem } from "../../../components/ChannelListItem";

export default function MessageListScreen({ navigation }) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [userId, setUserId] = useState(null);
  const [connectionError, setConnectionError] = useState(false);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const reconnect = async () => {
      // Check if already connected
      const currentUserId = chatClient.user?.id || chatClient.userID;
      if (currentUserId) {
        if (isMounted) setUserId(currentUserId);
        return;
      }

      setIsConnecting(true);
      setConnectionError(false);

      try {
        const [userData, chatToken] = await Promise.all([
          getUserData(),
          getChatToken(),
        ]);

        console.log(
          "Chat reconnect - userData:",
          userData?.id,
          "hasToken:",
          !!chatToken
        );

        if (userData?.id != null && chatToken) {
          await chatClient.connectUser(
            {
              id: userData.id.toString(),
              name: userData.fullName,
              image: userData.profilePictureUrl,
            },
            chatToken
          );

          // Update userId after successful connection
          if (isMounted) {
            setUserId(userData.id.toString());
            console.log("Chat connected successfully for user:", userData.id);
          }
        } else {
          console.warn("Missing chatToken or userData for chat connection");
          if (isMounted) setConnectionError(true);
        }
      } catch (e) {
        console.error("Chat connection failed:", e.message);
        if (isMounted) setConnectionError(true);
      } finally {
        if (isMounted) setIsConnecting(false);
      }
    };

    reconnect();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load channels
  useEffect(() => {
    if (!userId) return;

    const loadChannels = async () => {
      try {
        setLoading(true);
        const filters = {
          type: "messaging",
          members: { $in: [userId] },
        };
        const sort = [{ last_message_at: -1 }];

        console.log("Loading channels for user:", userId);

        const channelsResponse = await chatClient.queryChannels(filters, sort, {
          watch: true,
          state: true,
        });

        console.log("Channels loaded:", channelsResponse.length);
        channelsResponse.forEach((ch, index) => {
          const members = Object.values(ch.state.members || {}).map((m) => ({
            id: m.user_id,
            name: m.user?.name,
          }));
          console.log(`Channel ${index + 1}:`, {
            id: ch.id,
            members: members,
            lastMessage: ch.state.messages[ch.state.messages.length - 1]?.text,
          });
        });

        // Filter unique channels by ID để tránh duplicate
        const uniqueChannels = channelsResponse.filter(
          (ch, index, self) => index === self.findIndex((c) => c.id === ch.id)
        );

        setChannels(uniqueChannels);
      } catch (error) {
        console.error("Error loading channels:", error);
      } finally {
        setLoading(false);
      }
    };

    loadChannels();

    // Listen for new messages to update channel list
    const handleEvent = (event) => {
      // Chỉ update nếu message thuộc về channel của user
      if (event.cid) {
        loadChannels();
      }
    };

    chatClient.on("message.new", handleEvent);
    chatClient.on("channel.updated", handleEvent);

    return () => {
      chatClient.off("message.new", handleEvent);
      chatClient.off("channel.updated", handleEvent);
    };
  }, [userId]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      edges={["top"]}
    >
      <GradientHeader title="TIN NHẮN" showBackButton={false} />

      {/* Danh sách kênh chat */}
      {!userId ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator
            size="large"
            color={COLORS.PRIMARY}
            animating={isConnecting}
          />
          <Text style={styles.loadingText}>
            {isConnecting
              ? "Đang kết nối chat..."
              : connectionError
              ? "Không thể kết nối chat. Vui lòng kiểm tra cấu hình hoặc đăng nhập lại."
              : "Chat chưa sẵn sàng. Vui lòng đăng nhập lại."}
          </Text>
          {(connectionError || !isConnecting) && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() =>
                navigation.reset({ index: 0, routes: [{ name: "Login" }] })
              }
            >
              <Text style={styles.retryButtonText}>Đăng nhập lại</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={channels}
          keyExtractor={(item, index) => item.id || `channel-${index}`}
          renderItem={({ item }) => (
            <ChannelListItem
              channel={item}
              currentUserId={userId}
              onPress={() => {
                // Lấy thông tin người kia từ channel members
                const otherMembers = Object.values(
                  item.state.members || {}
                ).filter((member) => member.user_id !== userId);
                const otherUser = otherMembers[0]?.user;

                navigation.navigate("ChatScreen", {
                  channelId: item.id,
                  otherUserId: otherUser?.id,
                  otherUserName: otherUser?.name || item.data?.name,
                  otherUserAvatar: otherUser?.image,
                  otherUserPhone: null, // Phone not available in channel data
                });
              }}
            />
          )}
          ListEmptyComponent={
            loading ? (
              <View style={styles.loadingWrapper}>
                <ActivityIndicator size="large" color={COLORS.PRIMARY} />
                <Text style={styles.loadingText}>Đang tải...</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  Chưa có cuộc trò chuyện nào
                </Text>
                <Text style={styles.emptySubtext}>
                  Tin nhắn của bạn sẽ xuất hiện ở đây
                </Text>
              </View>
            )
          }
          contentContainerStyle={
            channels.length === 0 ? styles.emptyListContainer : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  loadingText: {
    marginTop: 10,
    color: "#8E8E93",
    textAlign: "center",
    fontSize: 16,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: "600",
  },
  emptyListContainer: {
    flexGrow: 1,
  },
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
  },
});
