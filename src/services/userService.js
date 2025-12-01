import axiosClient from "../api/axiosClient";
import endpoints from "../api/endpoints";

export const getProfile = () => axiosClient.get(endpoints.user.profile);

export const updateProfile = (data) =>
  axiosClient.put(endpoints.user.update, data);
