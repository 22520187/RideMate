import axiosClient from "../api/axiosClient";
import endpoints from "../api/endpoints";

/**
 * Get user profile
 * Note: axiosClient interceptor already returns response.data
 */
export const getProfile = () => {
  console.log("📋 Calling getProfile API...");
  return axiosClient
    .get(endpoints.user.profile)
    .then((response) => {
      console.log("✅ getProfile success:", response?.data);
      return response;
    })
    .catch((error) => {
      console.error("❌ getProfile failed:", error.message);
      throw error;
    });
};

export const updateProfile = (data) => {
  console.log(
    "✏️  Calling updateProfile API...",
    endpoints.user.update,
    "with data:",
    data
  );
  return axiosClient
    .patch(endpoints.user.update, data)
    .then((response) => {
      console.log("✅ updateProfile success, response:", response.data);
      return response;
    })
    .catch((error) => {
      console.error("❌ updateProfile failed:", error.message);
      throw error;
    });
};
