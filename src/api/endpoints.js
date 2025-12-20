export default {
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
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
    byId: (id) => `/users/${id}`,
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

  matches: {
    book: "/matches/book",
    accept: (id) => `/matches/${id}/accept`,
    cancel: (id) => `/matches/${id}/cancel`,
    status: (id) => `/matches/${id}/status`,
    detail: (id) => `/matches/${id}`,
    history: "/matches/history",
    waiting: "/matches/waiting",
    broadcastDriver: "/matches/broadcast/driver",
    broadcastPassenger: "/matches/broadcast/passenger",
    findMatches: "/matches/find",
    byId: (id) => `/matches/${id}`,
  },

  vouchers: {
    list: "/vouchers",
    myVouchers: "/vouchers/my-vouchers",
    redeem: (id) => `/vouchers/${id}/redeem`,
    create: "/vouchers",
    update: (id) => `/vouchers/${id}`,
    delete: (id) => `/vouchers/${id}`,
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

  admin: {
    // Dashboard statistics
    dashboardStats: "/admin/dashboard/stats",
    dashboardCharts: (type) => `/admin/dashboard/charts?type=${type}`,
    tripStats: "/admin/dashboard/stats/trips",
    activeTrips: "/admin/dashboard/active-trips",
    topUsers: (limit) => `/admin/dashboard/top-users?limit=${limit}`,
    membershipStats: "/admin/dashboard/stats/membership",
    revenueStats: "/admin/dashboard/stats/revenue",

    // User management
    users: "/admin/users",
    userById: (id) => `/admin/users/${id}`,
    userStatistics: "/admin/users/statistics",
    pendingDrivers: "/admin/users/pending-drivers",
    approveDriver: (id) => `/admin/users/${id}/approve-driver`,
    rejectDriver: (id) => `/admin/users/${id}/reject-driver`,
    // Backend: PATCH /admin/users/{id}/status
    toggleUserStatus: (id) => `/admin/users/${id}/status`,

    // Trip management
    trips: "/admin/trips",
    tripById: (id) => `/admin/trips/${id}`,

    // Report management
    reports: "/admin/reports",
    reportById: (id) => `/admin/reports/${id}`,
    updateReportStatus: (id) => `/admin/reports/${id}/status`,
    reportStats: "/admin/reports/statistics",

    // Mission management (Admin)
    missions: "/admin/missions",
    missionById: (id) => `/admin/missions/${id}`,
    createMission: "/admin/missions",
    updateMission: (id) => `/admin/missions/${id}`,
    deleteMission: (id) => `/admin/missions/${id}`,
    missionStats: "/admin/missions/stats",
  },

  // User mission endpoints
  missions: {
    available: "/missions/available",
    myMissions: "/missions/my-missions",
    accept: (id) => `/missions/${id}/accept`,
    claim: (id) => `/missions/${id}/claim`,
    stats: "/missions/stats",
  },
};
