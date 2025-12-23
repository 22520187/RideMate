import axios from "axios";
import { ENV } from "../config/env";
import {
  getToken,
  getRefreshToken,
  saveToken,
  saveRefreshToken,
  clearTokens,
} from "../utils/storage";

// Debug: Check what value we\x27re getting from process.env
console.log("🔍 Debug EXPO_PUBLIC_API_BASE_URL:", ENV.API_BASE_URL);

const axiosClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 15000,
});

console.log("🔧 AxiosClient initialized with baseURL:", ENV.API_BASE_URL);
console.log("⏱️  Timeout set to: 15000ms");

axiosClient.interceptors.request.use(async (config) => {
  console.log(
    `📤 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${
      config.url
    }`
  );

  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("🔐 Authorization header added");
  } else {
    console.log("⚠️  No token found");
  }

  // Detect FormData for React Native
  const isFormData =
    typeof FormData !== "undefined" &&
    (config.data instanceof FormData ||
      (config.data && typeof config.data.append === "function"));

  // If FormData → DO NOT set Content-Type
  if (isFormData) {
    delete config.headers["Content-Type"];
    console.log("📎 FormData detected, Content-Type removed");
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
    console.log(
      `✅ API Response: ${
        response.status
      } ${response.config.method?.toUpperCase()} ${response.config.url}`
    );
    // Return full response, not response.data
    return response;
  },

  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    console.error(`❌ API Error:`, {
      message: error.message,
      code: error.code,
      status: status,
      url: originalRequest?.url,
      method: originalRequest?.method?.toUpperCase(),
      timeout: error.config?.timeout,
    });

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

        const resp = await axios.post(`${ENV.API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

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




