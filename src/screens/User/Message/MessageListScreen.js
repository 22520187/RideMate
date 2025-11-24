import React, { useEffect } from "react";
import { ChannelList } from "stream-chat-expo";
import { connectUserDev } from "../../../services/streamAuth";

export default function MessageListScreen({ navigation }) {
  useEffect(() => {
    // Đăng nhập user dev
    connectUserDev(
      "fish_7c930875-d89f-4145-bbca-f4dac5981821",
      "fish",
      "https://i.pravatar.cc/150?img=1"
    );
  }, []);

  const filters = { type: "messaging", members: { $in: ["fish"] } };
  const sort = { last_message_at: -1 };

  return (
    <ChannelList
      filters={filters}
      sort={sort}
      onSelect={(channel) =>
        navigation.navigate("ChatScreen", { channelId: channel.id })
      }
    />
  );
}
