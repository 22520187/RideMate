import axiosClient from "../api/axiosClient";
import endpoints from "../api/endpoints";

/**
 * Admin Dashboard Services
 */

// Get overall dashboard statistics
export const getDashboardStats = () => {
  return axiosClient.get(endpoints.admin.dashboardStats);
};

// Get chart data by type (users, sessions, messages, vouchers, revenue)
export const getChartData = (type = "users") => {
  return axiosClient.get(endpoints.admin.dashboardCharts(type));
};

// Get trip statistics
export const getTripStats = () => {
  return axiosClient.get(endpoints.admin.tripStats);
};

// Get active trips
export const getActiveTrips = () => {
  return axiosClient.get(endpoints.admin.activeTrips);
};

// Get top users
export const getTopUsers = (limit = 10) => {
  return axiosClient.get(endpoints.admin.topUsers(limit));
};

// Get membership statistics
export const getMembershipStats = () => {
  return axiosClient.get(endpoints.admin.membershipStats);
};

// Get revenue statistics
export const getRevenueStats = () => {
  return axiosClient.get(endpoints.admin.revenueStats);
};

/**
 * User Management Services
 */

// Get all users with filters and pagination
export const getUsers = (params = {}) => {
  return axiosClient.get(endpoints.admin.users, { params });
};

// Get user by ID
export const getUserById = (id) => {
  return axiosClient.get(endpoints.admin.userById(id));
};

// Get user statistics
export const getUserStatistics = () => {
  return axiosClient.get(endpoints.admin.userStatistics);
};

// Get all users (alias for getUsers)
export const getAllUsers = (params = {}) => {
  return axiosClient.get(endpoints.admin.users, { params });
};

// Get pending driver approvals
export const getPendingDrivers = (params = {}) => {
  return axiosClient.get(endpoints.admin.pendingDrivers, { params });
};

// Approve driver
export const approveDriver = (id, data) => {
  return axiosClient.post(endpoints.admin.approveDriver(id), data);
};

// Reject driver
export const rejectDriver = (id, data) => {
  return axiosClient.post(endpoints.admin.rejectDriver(id), data);
};

// Toggle user active status (activate/deactivate)
export const toggleUserStatus = (id, data) => {
  return axiosClient.patch(endpoints.admin.toggleUserStatus(id), data);
};

/**
 * Trip Management Services
 */

// Get all trips with filters and pagination
export const getTrips = (params = {}) => {
  return axiosClient.get(endpoints.admin.trips, { params });
};

// Get trip by ID
export const getTripById = (id) => {
  return axiosClient.get(endpoints.admin.tripById(id));
};

// Get trip statistics
export const getTripStatistics = () => {
  return axiosClient.get(endpoints.admin.tripStats);
};

/**
 * Report Management Services
 */

// Get all reports with filters and pagination
export const getReports = (params = {}) => {
  return axiosClient.get(endpoints.admin.reports, { params });
};

// Get report by ID
export const getReportById = (id) => {
  return axiosClient.get(endpoints.admin.reportById(id));
};

// Update report status
export const updateReportStatus = (id, data) => {
  return axiosClient.patch(endpoints.admin.updateReportStatus(id), data);
};

// Get report statistics
export const getReportStatistics = () => {
  return axiosClient.get(endpoints.admin.reportStats);
};

/**
 * Voucher Management Services
 */

// Get all vouchers
export const getVouchers = () => {
  return axiosClient.get(endpoints.vouchers.list);
};

// Create voucher
export const createVoucher = (data) => {
  return axiosClient.post(endpoints.vouchers.create, data);
};

// Update voucher
export const updateVoucher = (id, data) => {
  return axiosClient.put(endpoints.vouchers.update(id), data);
};

// Delete voucher
export const deleteVoucher = (id) => {
  return axiosClient.delete(endpoints.vouchers.delete(id));
};

/**
 * Mission Management Services (Admin)
 */

// Get all missions with filters and pagination
export const getMissions = (params = {}) => {
  return axiosClient.get(endpoints.admin.missions, { params });
};

// Get mission by ID
export const getMissionById = (id) => {
  return axiosClient.get(endpoints.admin.missionById(id));
};

// Create mission
export const createMission = (data) => {
  return axiosClient.post(endpoints.admin.createMission, data);
};

// Update mission
export const updateMission = (id, data) => {
  return axiosClient.put(endpoints.admin.updateMission(id), data);
};

// Delete mission
export const deleteMission = (id) => {
  return axiosClient.delete(endpoints.admin.deleteMission(id));
};

// Get mission statistics
export const getMissionStats = () => {
  return axiosClient.get(endpoints.admin.missionStats);
};
