import axiosClient from "../api/axiosClient";
import endpoints from "../api/endpoints";

/**
 * User Mission Services
 */

// Get available missions for user
export const getAvailableMissions = () => {
  return axiosClient.get(endpoints.missions.available);
};

// Get user's missions
export const getMyMissions = () => {
  return axiosClient.get(endpoints.missions.myMissions);
};

// Accept a mission
export const acceptMission = (missionId) => {
  return axiosClient.post(endpoints.missions.accept(missionId));
};

// Claim mission reward
export const claimMissionReward = (missionId) => {
  return axiosClient.post(endpoints.missions.claim(missionId));
};

// Get user mission statistics
export const getMissionStats = () => {
  return axiosClient.get(endpoints.missions.stats);
};
