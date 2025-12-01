import axiosClient from "../api/axiosClient";
import endpoints from "../api/endpoints";

export const login = (data) => {
  return axiosClient.post(endpoints.auth.login, data);
};

export const register = (data) => {
  return axiosClient.post(endpoints.auth.register, data);
};

export const refreshToken = () => {
  return axiosClient.post(endpoints.auth.refresh);
};
