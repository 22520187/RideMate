import axios from "axios";
import { API_BASE_URL } from "@env";
import { getToken, clearToken } from "../utils/storage";

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to header
axiosClient.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response
axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const status = error.response?.status;
    if (status === 401) {
      console.warn("Token expired or unauthorized");
      // TODO: logout user, clear storage
      await clearToken();
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
