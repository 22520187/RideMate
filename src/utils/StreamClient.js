import { StreamChat } from "stream-chat";
import { STREAM_API_KEY } from "@env";

export const chatClient = StreamChat.getInstance(STREAM_API_KEY);
