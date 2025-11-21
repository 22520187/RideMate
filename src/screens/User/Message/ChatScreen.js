import React from "react";
import { Channel, MessageList, MessageInput } from "stream-chat-expo";
import { chatClient } from "../../../utils/StreamClient";

export default function ChatScreen({ route, navigation }) {
  const { channelId } = route.params;

  const channel = chatClient.channel("messaging", channelId);

  return (
    <Channel channel={channel}>
      <MessageList />
      <MessageInput />
    </Channel>
  );
}
