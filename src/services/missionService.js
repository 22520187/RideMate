import axiosClient from "../api/axiosClient";
import endpoints from "../api/endpoints";

/**
 * Get available missions for current user
 * Note: axiosClient interceptor already returns response.data
 */
export const getAvailableMissions = async () => {
  try {
    const response = await axiosClient.get(endpoints.missions.available);
    return response;
  } catch (error) {
    console.error("Error getting available missions:", error);
    throw error;
  }
};

/**
 * Get all missions for current user (including progress)
 * Note: axiosClient interceptor already returns response.data
 */
export const getMyMissions = async () => {
  try {
    const response = await axiosClient.get(endpoints.missions.myMissions);
    return response;
  } catch (error) {
    console.error("Error getting my missions:", error);
    throw error;
  }
};

/**
 * Accept a mission
 * @param {number} missionId
 * Note: axiosClient interceptor already returns response.data
 */
export const acceptMission = async (missionId) => {
  try {
    const response = await axiosClient.post(endpoints.missions.accept(missionId));
    return response;
  } catch (error) {
    console.error("Error accepting mission:", error);
    throw error;
  }
};

/**
 * Claim mission reward
 * @param {number} missionId
 * Note: axiosClient interceptor already returns response.data
 */
export const claimMissionReward = async (missionId) => {
  try {
    const response = await axiosClient.post(endpoints.missions.claim(missionId));
    return response;
  } catch (error) {
    console.error("Error claiming mission reward:", error);
    throw error;
  }
};

/**
 * Get mission statistics for current user
 * Note: axiosClient interceptor already returns response.data
 */
export const getMissionStats = async () => {
  try {
    const response = await axiosClient.get(endpoints.missions.stats);
    return response;
  } catch (error) {
    console.error("Error getting mission stats:", error);
    throw error;
  }
};

