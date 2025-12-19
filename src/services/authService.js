import axiosClient from "../api/axiosClient";
import endpoints from "../api/endpoints";

export const login = (data) => {
  return axiosClient.post(endpoints.auth.login, data);
};

export const register = (data) => {
  return axiosClient.post(endpoints.auth.register, data);
};

export const sendOtp = (data) => {
  return axiosClient.post(endpoints.auth.sendOtp, data);
};

export const verifyOtp = (data) => {
  return axiosClient.post(endpoints.auth.verifyOtp, data);
};

export const initiateRegister = (data) => {
  return axiosClient.post(endpoints.auth.registerInitiate, data);
};

export const completeRegistration = (data) => {
  return axiosClient.post(endpoints.auth.registerComplete, data);
};

export const refreshToken = () => {
  return axiosClient.post(endpoints.auth.refresh);
};

export const logout = () => {
  return axiosClient.post(endpoints.auth.logout);
};