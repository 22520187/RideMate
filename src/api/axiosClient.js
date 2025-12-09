import axios from "axios";
import { API_BASE_URL } from "@env";
import {
  getToken,
  getRefreshToken,
  saveToken,
  saveRefreshToken,
  clearTokens,
} from "../utils/storage";

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add token to header
axiosClient.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response with refresh token mechanism
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    if (status === 401 && !originalRequest?._retry) {
      // Try to refresh access token once
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          await clearTokens();
          isRefreshing = false;
          return Promise.reject(error);
        }

        // Call refresh endpoint directly using axios (without interceptors)
        const resp = await axios.post(
          `${API_BASE_URL}/api/auth/refresh-token`,
          { refreshToken }
        );
        const apiResponse = resp.data; // wrapper with data
        const authData = apiResponse.data;
        if (authData && authData.accessToken) {
          // Save new tokens
          await saveToken(authData.accessToken);
          if (authData.refreshToken)
            await saveRefreshToken(authData.refreshToken);
          // Update axiosClient defaults
          axiosClient.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${authData.accessToken}`;
          processQueue(null, authData.accessToken);
          return axiosClient(originalRequest);
        } else {
          processQueue(new Error("No access token returned"), null);
          await clearTokens();
          return Promise.reject(error);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        await clearTokens();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    // Not 401 or retried already
    return Promise.reject(error);
  }
);

export default axiosClient;
