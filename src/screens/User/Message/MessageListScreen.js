import { View, Text, StyleSheet } from "react-native";
import { ChannelList } from "stream-chat-expo";
import COLORS from "../../../constant/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import { chatClient } from "../../../utils/StreamClient";

export default function MessageListScreen({ navigation }) {
  const userId = chatClient.user.id;

  const filters = {
    type: "messaging",
    members: { $in: [userId] },
  };
  const sort = { last_message_at: -1 };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#fdfdfd" }}
      behavior="padding"
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TIN NHẮN</Text>
      </View>

      {/* Danh sách kênh chat */}
      <ChannelList
        filters={filters}
        sort={sort}
        onSelect={(channel) =>
          navigation.navigate("ChatScreen", { channelId: channel.id })
        }
        style={styles.channelList}
      />
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
});
