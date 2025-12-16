import axiosClient from "../api/axiosClient";
import endpoints from "../api/endpoints";

export const bookRide = async (rideData) => {
  try {
    const response = await axiosClient.post(endpoints.matches.book, rideData);
    return response;
  } catch (error) {
    throw error;
  }
};

export const acceptMatch = async (matchId) => {
  try {
    const response = await axiosClient.post(endpoints.matches.accept(matchId));
    return response;
  } catch (error) {
    throw error;
  }
};

export const cancelMatch = async (matchId) => {
  try {
    const response = await axiosClient.post(endpoints.matches.cancel(matchId));
    return response;
  } catch (error) {
    throw error;
  }
};

export const updateMatchStatus = async (matchId, statusData) => {
  try {
    const response = await axiosClient.put(
      endpoints.matches.status(matchId),
      statusData
    );
    return response;
  } catch (error) {
    throw error;
  }
};

export const getMatchDetail = async (matchId) => {
  try {
    const response = await axiosClient.get(endpoints.matches.detail(matchId));
    return response;
  } catch (error) {
    throw error;
  }
};

export const getMatchHistory = async () => {
  try {
    const response = await axiosClient.get(endpoints.matches.history);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getWaitingMatches = async () => {
  try {
    const response = await axiosClient.get(endpoints.matches.waiting);
    return response;
  } catch (error) {
    throw error;
  }
};

export const broadcastAsDriver = async (broadcastData) => {
  try {
    const response = await axiosClient.post(
      endpoints.matches.broadcastDriver,
      broadcastData
    );
    return response;
  } catch (error) {
    throw error;
  }
};

export const broadcastAsPassenger = async (broadcastData) => {
  try {
    const response = await axiosClient.post(
      endpoints.matches.broadcastPassenger,
      broadcastData
    );
    return response;
  } catch (error) {
    throw error;
  }
};

export const findMatches = async (searchCriteria) => {
  try {
    const response = await axiosClient.post(
      endpoints.matches.findMatches,
      searchCriteria
    );
    return response;
  } catch (error) {
    throw error;
  }
};
