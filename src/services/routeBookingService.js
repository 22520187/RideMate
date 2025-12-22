import axiosClient from "../api/axiosClient";
import endpoints from "../api/endpoints";

/**
 * Service for managing route bookings
 */
const routeBookingService = {
  /**
   * Create a booking request (Passenger joins a route)
   */
  createBooking: async (bookingData) => {
    try {
      const response = await axiosClient.post(
        endpoints.routeBookings.create,
        bookingData
      );
      return response.data;
    } catch (error) {
      console.error("Error creating booking:", error);
      throw error;
    }
  },

  /**
   * Accept a booking request (Driver only)
   */
  acceptBooking: async (bookingId) => {
    try {
      const response = await axiosClient.post(
        endpoints.routeBookings.accept(bookingId)
      );
      return response.data;
    } catch (error) {
      console.error("Error accepting booking:", error);
      throw error;
    }
  },

  /**
   * Reject a booking request (Driver only)
   */
  rejectBooking: async (bookingId) => {
    try {
      const response = await axiosClient.post(
        endpoints.routeBookings.reject(bookingId)
      );
      return response.data;
    } catch (error) {
      console.error("Error rejecting booking:", error);
      throw error;
    }
  },

  /**
   * Cancel a booking (Passenger only)
   */
  cancelBooking: async (bookingId) => {
    try {
      const response = await axiosClient.post(
        endpoints.routeBookings.cancel(bookingId)
      );
      return response.data;
    } catch (error) {
      console.error("Error cancelling booking:", error);
      throw error;
    }
  },

  /**
   * Get booking by ID
   */
  getBookingById: async (bookingId) => {
    try {
      const response = await axiosClient.get(
        endpoints.routeBookings.byId(bookingId)
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching booking:", error);
      throw error;
    }
  },

  /**
   * Get all bookings by current user
   */
  getMyBookings: async (role = "passenger") => {
    try {
      const response = await axiosClient.get(
        `${endpoints.routeBookings.myBookings}?role=${role}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching my bookings:", error);
      throw error;
    }
  },

  /**
   * Get pending bookings for current driver
   */
  getPendingBookings: async () => {
    try {
      const response = await axiosClient.get(endpoints.routeBookings.pending);
      return response.data;
    } catch (error) {
      console.error("Error fetching pending bookings:", error);
      throw error;
    }
  },

  /**
   * Get all bookings for a specific route
   */
  getBookingsByRoute: async (routeId) => {
    try {
      const response = await axiosClient.get(
        endpoints.routeBookings.byRoute(routeId)
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching route bookings:", error);
      throw error;
    }
  },

  /**
   * Start trip for accepted booking (Driver only)
   */
  startTrip: async (bookingId) => {
    try {
      const response = await axiosClient.post(
        endpoints.routeBookings.start(bookingId)
      );
      return response.data;
    } catch (error) {
      console.error("Error starting trip:", error);
      throw error;
    }
  },

  /**
   * Complete trip (Driver only)
   */
  completeTrip: async (bookingId) => {
    try {
      const response = await axiosClient.post(
        endpoints.routeBookings.complete(bookingId)
      );
      return response.data;
    } catch (error) {
      console.error("Error completing trip:", error);
      throw error;
    }
  },
};

export default routeBookingService;
