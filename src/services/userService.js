import axiosClient from "../api/axiosClient";
import endpoints from "../api/endpoints";

// Note: axiosClient interceptor already returns response.data
// So these functions return the data directly from the interceptor
export const getProfile = () => axiosClient.get(endpoints.user.profile);

export const updateProfile = (data) =>
  axiosClient.put(endpoints.user.update, data);

export const getUserById = (id) => axiosClient.get(endpoints.user.byId(id));
