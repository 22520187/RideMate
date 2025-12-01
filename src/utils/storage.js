import * as SecureStore from "expo-secure-store";

// Lưu token
export async function saveToken(token) {
  try {
    await SecureStore.setItemAsync("authToken", token);
  } catch (error) {
    console.error("Error saving token:", error);
  }
}

// Lấy token
export async function getToken() {
  try {
    const token = await SecureStore.getItemAsync("authToken");
    return token;
  } catch (error) {
    console.error("Error getting token:", error);
    return null;
  }
}

// Xoá token (khi logout)
export async function clearToken() {
  try {
    await SecureStore.deleteItemAsync("authToken");
  } catch (error) {
    console.error("Error clearing token:", error);
  }
}
