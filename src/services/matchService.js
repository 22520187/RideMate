import axiosClient from "../api/axiosClient";
import endpoints from "../api/endpoints";

export const getWaitingMatches = () => {
  return axiosClient.get(endpoints.matches.waiting);
};

export const acceptRide = (matchId) => {
  return axiosClient.post(endpoints.matches.accept(matchId));
};

export const cancelRide = (matchId) => {
  return axiosClient.post(endpoints.matches.cancel(matchId));
};

export const getMatchById = (matchId) => {
  return axiosClient.get(endpoints.matches.byId(matchId));
};

export const updateMatchStatus = (matchId, status) => {
  return axiosClient.put(endpoints.matches.updateStatus(matchId), { status });
}