import axiosClient from "../api/axiosClient";
import endpoints from "../api/endpoints";

/**
 * Service for managing fixed routes
 */
const fixedRouteService = {
  /**
   * Create a new fixed route (Driver only)
   */
  createRoute: async (routeData) => {
    try {
      const response = await axiosClient.post(
        endpoints.fixedRoutes.create,
        routeData
      );
      return response.data;
    } catch (error) {
      console.error("Error creating fixed route:", error);
      throw error;
    }
  },

  /**
   * Update an existing fixed route
   */
  updateRoute: async (routeId, routeData) => {
    try {
      const response = await axiosClient.put(
        endpoints.fixedRoutes.update(routeId),
        routeData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating fixed route:", error);
      throw error;
    }
  },

  /**
   * Delete a fixed route
   */
  deleteRoute: async (routeId) => {
    try {
      const response = await axiosClient.delete(
        endpoints.fixedRoutes.delete(routeId)
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting fixed route:", error);
      throw error;
    }
  },

  /**
   * Get route by ID
   */
  getRouteById: async (routeId) => {
    try {
      const response = await axiosClient.get(
        endpoints.fixedRoutes.byId(routeId)
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching route:", error);
      throw error;
    }
  },

  /**
   * Get all routes by current driver
   */
  getMyRoutes: async () => {
    try {
      const response = await axiosClient.get(endpoints.fixedRoutes.myRoutes);
      return response.data;
    } catch (error) {
      console.error("Error fetching my routes:", error);
      throw error;
    }
  },

  /**
   * Get all active routes
   */
  getAllActiveRoutes: async () => {
    try {
      const response = await axiosClient.get(endpoints.fixedRoutes.all);
      return response.data;
    } catch (error) {
      console.error("Error fetching active routes:", error);
      throw error;
    }
  },

  /**
   * Search for routes matching pickup and dropoff locations
   */
  searchRoutes: async (searchParams) => {
    try {
      const response = await axiosClient.post(
        endpoints.fixedRoutes.search,
        searchParams
      );
      return response.data;
    } catch (error) {
      console.error("Error searching routes:", error);
      throw error;
    }
  },

  /**
   * Update route status
   */
  updateRouteStatus: async (routeId, status) => {
    try {
      const response = await axiosClient.patch(
        `${endpoints.fixedRoutes.updateStatus(routeId)}?status=${status}`
      );
      return response.data;
    } catch (error) {
      console.error("Error updating route status:", error);
      throw error;
    }
  },
};

export default fixedRouteService;
