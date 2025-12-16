export default {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    sendOtp: "/auth/send-otp",
    verifyOtp: "/auth/verify-otp",
    registerInitiate: "/auth/register/initiate",
    registerComplete: "/auth/register/complete",
    refresh: "/auth/refresh-token",
  },

  user: {
    profile: "/users/me",
    update: "/users",
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

  vouchers: {
    list: "/vouchers",
    myVouchers: "/vouchers/my-vouchers",
    redeem: (id) => `/vouchers/${id}/redeem`,
    create: "/vouchers",
  },

  missions: {
    available: "/missions/available",
    myMissions: "/missions/my-missions",
    accept: (id) => `/missions/${id}/accept`,
    claim: (id) => `/missions/${id}/claim`,
    stats: "/missions/stats",
  },

  upload: {
    image: "/upload/image",
  },
};
