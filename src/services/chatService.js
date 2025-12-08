import { chatClient } from "../utils/StreamClient";
import { getToken } from "../utils/storage";

/**
 * Initialize Stream Chat client with user
 * @param {string} userId - User's unique ID
 * @param {string} userName - User's display name
 * @param {string} userAvatar - User's avatar URL
 */
export const initializeChatClient = async (userId, userName, userAvatar) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error("No auth token available");
    }

    // Connect user to Stream Chat
    await chatClient.connectUser(
      {
        id: userId,
        name: userName,
        image: userAvatar,
      },
      token
    );

    return { success: true };
  } catch (error) {
    console.warn("Error initializing chat client:", error);
    return { success: false, error };
  }
};

/**
 * Create or get a direct message channel between two users
 * @param {string} currentUserId - Current user's ID
 * @param {string} otherUserId - Other user's ID
 * @param {object} channelConfig - Additional channel config
 * @returns {Promise<Channel>}
 */
export const getOrCreateDirectChannel = async (
  currentUserId,
  otherUserId,
  channelConfig = {}
) => {
  try {
    // Create channel with user IDs in sorted order for consistency
    const userIds = [currentUserId, otherUserId].sort();
    const channelId = `ridemate-${userIds.join("-")}`;

    // Get or create channel
    const channel = chatClient.channel("messaging", channelId, {
      members: userIds,
      ...channelConfig,
    });

    await channel.create();
    return channel;
  } catch (error) {
    console.warn("Error creating/getting channel:", error);
    throw error;
  }
};

/**
 * Send a message to a channel
 * @param {Channel} channel - Stream Chat channel
 * @param {string} messageText - Message content
 * @param {object} attachments - Optional attachments
 */
export const sendMessage = async (channel, messageText, attachments = []) => {
  try {
    if (!messageText?.trim() && attachments.length === 0) {
      throw new Error("Message cannot be empty");
    }

    const response = await channel.sendMessage({
      text: messageText,
      attachments,
    });

    return response;
  } catch (error) {
    console.warn("Error sending message:", error);
    throw error;
  }
};

/**
 * Load message history for a channel
 * @param {Channel} channel - Stream Chat channel
 * @param {number} limit - Number of messages to load (default: 50)
 */
export const loadChannelMessages = async (channel, limit = 50) => {
  try {
    await channel.query({ messages: { limit } });
    return channel.state.messages;
  } catch (error) {
    console.warn("Error loading messages:", error);
    throw error;
  }
};

/**
 * Watch channel for real-time updates
 * @param {Channel} channel - Stream Chat channel
 * @param {object} options - Watch options
 */
export const watchChannel = async (channel, options = {}) => {
  try {
    await channel.watch(options);
    return channel;
  } catch (error) {
    console.warn("Error watching channel:", error);
    throw error;
  }
};

/**
 * Stop watching a channel
 * @param {Channel} channel - Stream Chat channel
 */
export const unwatchChannel = async (channel) => {
  try {
    await channel.stopWatching();
  } catch (error) {
    console.warn("Error unwatching channel:", error);
  }
};

/**
 * Get or create a call for a channel
 * Assumes backend has a call creation endpoint
 * @param {string} channelId - Stream Chat channel ID
 * @param {string} callType - 'audio' or 'video'
 */
export const initiateCall = async (channelId, callType = "audio") => {
  try {
    // This would typically be called via your backend
    // For now, return a call object that can be used with Stream Video SDK
    return {
      channelId,
      callType,
      initiatedAt: new Date(),
    };
  } catch (error) {
    console.warn("Error initiating call:", error);
    throw error;
  }
};

/**
 * Disconnect chat client
 */
export const disconnectChatClient = async () => {
  try {
    await chatClient.disconnectUser();
  } catch (error) {
    console.warn("Error disconnecting chat:", error);
  }
};
