export default {
  auth: {
    login: "/api/auth/login",
    register: "/api/auth/register",
    sendOtp: "/api/auth/send-otp",
    verifyOtp: "/api/auth/verify-otp",
    registerInitiate: "/api/auth/register/initiate",
    registerComplete: "/api/auth/register/complete",
    refresh: "/api/auth/refresh-token",
  },

  user: {
    profile: "/api/users/me",
    update: "/api/users",
  },

  vehicles: {
    register: "/vehicles/register",
    myVehicle: "/vehicles/my-vehicle",
    byId: (id) => `/vehicles/${id}`,
    updateStatus: (id) => `/vehicles/${id}/status`,
    listByDriver: (driverId) => `/vehicles/driver/${driverId}`,
    pending: "/vehicles/pending",
  },

  ride: {
    list: "/ride",
    detail: (id) => `/ride/${id}`,
  },

  //... other endpoints
};
