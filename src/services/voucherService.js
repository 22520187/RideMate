import axiosClient from "../api/axiosClient";
import endpoints from "../api/endpoints";

/**
 * Get all available vouchers
 * Note: axiosClient interceptor already returns response.data
 */
export const getAllVouchers = async () => {
  try {
    const response = await axiosClient.get(endpoints.vouchers.list);
    return response; // Interceptor already returned response.data (array of vouchers)
  } catch (error) {
    console.error("Error getting vouchers:", error);
    throw error;
  }
};

/**
 * Get user's vouchers
 * Note: axiosClient interceptor already returns response.data
 */
export const getMyVouchers = async () => {
  try {
    const response = await axiosClient.get(endpoints.vouchers.myVouchers);
    return response; // Interceptor already returned response.data (array of user vouchers)
  } catch (error) {
    console.error("Error getting my vouchers:", error);
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
    const response = await axiosClient.post(endpoints.vouchers.redeem(voucherId));
    return response; // Interceptor already returned response.data
  } catch (error) {
    console.error("Error redeeming voucher:", error);
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
    const response = await axiosClient.post(endpoints.vouchers.create, voucherData);
    return response; // Interceptor already returned response.data
  } catch (error) {
    console.error("Error creating voucher:", error);
    throw error;
  }
};

