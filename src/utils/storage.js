import * as SecureStore from "expo-secure-store";

// Access token helpers (for backward compatibility expose saveToken/getToken)
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

// Lưu access token
export async function saveToken(token) {
  try {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  } catch (error) {
    console.error("Error saving access token:", error);
  }
}

// Lấy access token
export async function getToken() {
  try {
    const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    return token;
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
}

// Lưu refresh token
export async function saveRefreshToken(token) {
  try {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  } catch (error) {
    console.error("Error saving refresh token:", error);
  }
}

// Lấy refresh token
export async function getRefreshToken() {
  try {
    const token = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    return token;
  } catch (error) {
    console.error("Error getting refresh token:", error);
    return null;
  }
}

// Xoá access token (khi logout)
export async function clearToken() {
  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error("Error clearing access token:", error);
  }
}

// Xoá cả access + refresh token
export async function clearTokens() {
  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error("Error clearing tokens:", error);
  }
}
