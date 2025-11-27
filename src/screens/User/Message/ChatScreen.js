import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Channel, MessageList, MessageInput } from "stream-chat-expo";
import { chatClient } from "../../../utils/StreamClient";
import COLORS from "../../../constant/colors";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatScreen({ route, navigation }) {
  const { channelId } = route.params;
  const [channelName, setChannelName] = useState("");

  const channel = chatClient.channel("messaging", channelId);

  useEffect(() => {
    const fetchChannelName = async () => {
      await channel.watch();
      setChannelName(channel.data?.name || "Tin nhắn");
    };
    fetchChannelName();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{channelName}</Text>
      </View>

      {/* Chat */}
      <View style={{ flex: 1 }}>
        <Channel channel={channel}>
          <MessageList />
          <MessageInput />
        </Channel>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 15,
    paddingHorizontal: 12,
    elevation: 4,
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: "600",
  },
});
