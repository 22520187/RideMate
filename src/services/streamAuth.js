import { chatClient } from "../utils/StreamClient";

export const connectUserDev = async (userId, name, avatarURL) => {
  try {
    await chatClient.connectUser(
      {
        id: userId,
        name,
        image: avatarURL,
      },
      chatClient.devToken(userId) // development token
    );
    console.log("User connected successfully");
  } catch (err) {
    console.error("Stream connect error:", err);
  }
};
