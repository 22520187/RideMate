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
  timeout: 15000,
});

axiosClient.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Detect FormData for React Native
  const isFormData =
    typeof FormData !== "undefined" &&
    (config.data instanceof FormData ||
      (config.data && typeof config.data.append === "function"));

  // If FormData → DO NOT set Content-Type
  if (isFormData) {
    delete config.headers["Content-Type"];
  } else {
    // JSON request → set JSON type
    if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }
  }

  return config;
});

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
  (response) => {
    // Return full response, not response.data
    return response;
  },

  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 401 && !originalRequest._retry) {
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

        const resp = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          { refreshToken }
        );

        const newTokens = resp.data?.data;
        if (!newTokens?.accessToken) {
          await clearTokens();
          return Promise.reject(error);
        }

        await saveToken(newTokens.accessToken);
        if (newTokens.refreshToken) {
          await saveRefreshToken(newTokens.refreshToken);
        }

        axiosClient.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${newTokens.accessToken}`;

        processQueue(null, newTokens.accessToken);

        originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
        return axiosClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        await clearTokens();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
