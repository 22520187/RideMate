import { StreamChat } from "stream-chat";
import { ENV } from "../config/env";

export const chatClient = StreamChat.getInstance(ENV.STREAM_API_KEY);

