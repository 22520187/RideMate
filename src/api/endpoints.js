export default {
  auth: {
    login: "/api/api/auth/login",
    register: "/api/api/auth/register",
    sendOtp: "/api/api/auth/send-otp",
    verifyOtp: "/api/api/auth/verify-otp",
    registerInitiate: "/api/api/auth/register/initiate",
    registerComplete: "/api/api/auth/register/complete",
    refresh: "/api/api/auth/refresh-token",
  },

  user: {
    profile: "/user/profile",
    update: "/user/update",
  },

  ride: {
    list: "/ride",
    detail: (id) => `/ride/${id}`,
  },

  //... other endpoints
};
