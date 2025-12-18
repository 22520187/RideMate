import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { ChannelList } from "stream-chat-expo";
import COLORS from "../../../constant/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import { chatClient } from "../../../utils/StreamClient";
import { useEffect, useMemo, useState } from "react";
import { getChatToken, getUserData } from "../../../utils/storage";

export default function MessageListScreen({ navigation }) {
  const [isConnecting, setIsConnecting] = useState(false);

  const userId = useMemo(() => {
    return chatClient.user?.id || chatClient.userID || null;
  }, [chatClient.userID, chatClient.user?.id]);

  useEffect(() => {
    let isMounted = true;

    const reconnect = async () => {
      if (chatClient.userID || chatClient.user?.id) return;
      setIsConnecting(true);
      try {
        const [userData, chatToken] = await Promise.all([
          getUserData(),
          getChatToken(),
        ]);
        if (userData?.id != null && chatToken) {
          await chatClient.connectUser(
            {
              id: userData.id.toString(),
              name: userData.fullName,
              image: userData.profilePictureUrl,
            },
            chatToken
          );
        }
      } catch (e) {
        // ignore: UI will show fallback message
      } finally {
        if (isMounted) setIsConnecting(false);
      }
    };

    reconnect();
    return () => {
      isMounted = false;
    };
  }, []);

  const filters = useMemo(() => {
    if (!userId) return null;
    return {
      type: "messaging",
      members: { $in: [userId] },
    };
  }, [userId]);

  const sort = useMemo(() => ({ last_message_at: -1 }), []);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#fdfdfd" }}
      behavior="padding"
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TIN NHẮN</Text>
      </View>

      {/* Danh sách kênh chat */}
      {!filters ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>
            {isConnecting
              ? "Đang kết nối chat..."
              : "Chat chưa sẵn sàng. Vui lòng đăng nhập lại."}
          </Text>
        </View>
      ) : (
        <ChannelList
          filters={filters}
          sort={sort}
          onSelect={(channel) => {
            if (channel?.id) {
              navigation.navigate("ChatScreen", { channelId: channel.id });
            }
          }}
          style={styles.channelList}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  header: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 25,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.WHITE,
    textAlign: "center",
    backgroundColor: COLORS.PRIMARY,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  channelList: {
    flex: 1,
    marginTop: 8,
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.GRAY,
    textAlign: "center",
  },
});
