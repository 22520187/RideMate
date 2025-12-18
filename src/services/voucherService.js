import axiosClient from "../api/axiosClient";
import endpoints from "../api/endpoints";

/**
 * Get all available vouchers
 * Note: axiosClient interceptor already returns response.data
 */
export const getAllVouchers = async () => {
  try {
    console.log("🎁 Calling getAllVouchers API...", endpoints.vouchers.list);
    const response = await axiosClient.get(endpoints.vouchers.list);
    console.log(
      "✅ getAllVouchers success:",
      response?.data?.length,
      "vouchers"
    );
    return response; // Interceptor already returned response.data (array of vouchers)
  } catch (error) {
    console.error("❌ Error getting vouchers:", error.message, error.code);
    throw error;
  }
};

/**
 * Get user's vouchers
 * Note: axiosClient interceptor already returns response.data
 */
export const getMyVouchers = async () => {
  try {
    console.log(
      "👤 Calling getMyVouchers API...",
      endpoints.vouchers.myVouchers
    );
    const response = await axiosClient.get(endpoints.vouchers.myVouchers);
    console.log(
      "✅ getMyVouchers success:",
      response?.data?.length,
      "vouchers"
    );
    return response; // Interceptor already returned response.data (array of user vouchers)
  } catch (error) {
    console.error("❌ Error getting my vouchers:", error.message, error.code);
    throw error;
  }
};

/**
 * Redeem a voucher using points
 * @param {number} voucherId
 * Note: axiosClient interceptor already returns response.data
 */
export const redeemVoucher = async (voucherId) => {
  try {
    console.log(
      "🎉 Calling redeemVoucher API...",
      endpoints.vouchers.redeem(voucherId)
    );
    const response = await axiosClient.post(
      endpoints.vouchers.redeem(voucherId)
    );
    console.log("✅ redeemVoucher success");
    return response; // Interceptor already returned response.data
  } catch (error) {
    console.error("❌ Error redeeming voucher:", error.message, error.code);
    throw error;
  }
};

/**
 * Create a new voucher (Admin only)
 * @param {Object} voucherData
 * Note: axiosClient interceptor already returns response.data
 */
export const createVoucher = async (voucherData) => {
  try {
    console.log("✨ Calling createVoucher API...", endpoints.vouchers.create);
    const response = await axiosClient.post(
      endpoints.vouchers.create,
      voucherData
    );
    console.log("✅ createVoucher success");
    return response; // Interceptor already returned response.data
  } catch (error) {
    console.error("❌ Error creating voucher:", error.message, error.code);
    throw error;
  }
};
