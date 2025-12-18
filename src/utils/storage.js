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

// User type helpers
const USER_TYPE_KEY = "userType";
const USER_DATA_KEY = "userData";

// Lưu user type (ADMIN, DRIVER, PASSENGER)
export async function saveUserType(userType) {
  try {
    await SecureStore.setItemAsync(USER_TYPE_KEY, userType);
  } catch (error) {
    console.error("Error saving user type:", error);
  }
}

// Lấy user type
export async function getUserType() {
  try {
    const userType = await SecureStore.getItemAsync(USER_TYPE_KEY);
    return userType;
  } catch (error) {
    console.error("Error getting user type:", error);
    return null;
  }
}

// Lưu user data (id, fullName, etc.)
export async function saveUserData(userData) {
  try {
    await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error("Error saving user data:", error);
  }
}

// Lấy user data
export async function getUserData() {
  try {
    const userDataString = await SecureStore.getItemAsync(USER_DATA_KEY);
    return userDataString ? JSON.parse(userDataString) : null;
  } catch (error) {
    console.error("Error getting user data:", error);
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
    await SecureStore.deleteItemAsync(USER_TYPE_KEY);
    await SecureStore.deleteItemAsync(USER_DATA_KEY);
  } catch (error) {
    console.error("Error clearing tokens:", error);
  }
}
