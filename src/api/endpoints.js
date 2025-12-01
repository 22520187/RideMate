export default {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    refresh: "/auth/refresh-token",
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
