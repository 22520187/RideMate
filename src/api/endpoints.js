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

  verification: {
    uploadIdCard: "/verification/id-card",
    verifyLiveness: "/verification/liveness",
    verifyPhase: "/verification/liveness/verify-phase",
    getStatus: (phoneNumber) => `/verification/status/${phoneNumber}`,
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
    getById: (id) => `/matches/${id}`,
  },

  // Alias for matches (for consistency)
  match: {
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
    getById: (id) => `/matches/${id}`,
  },

  reports: {
    create: "/reports",
    my: "/reports/my",
    byId: (id) => `/reports/${id}`,
  },

  reports: {
    create: "/reports",
    my: "/reports/my",
    byId: (id) => `/reports/${id}`,
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

    // Voucher management (Admin)
    vouchers: "/admin/vouchers",
  },

  // User mission endpoints
  missions: {
    available: "/missions/available",
    myMissions: "/missions/my-missions",
    accept: (id) => `/missions/${id}/accept`,
    claim: (id) => `/missions/${id}/claim`,
    stats: "/missions/stats",
  },

  driver: {
    location: "/driver/location",
    personalRide: "/driver/personal-ride",
  },

  fixedRoutes: {
    create: "/api/fixed-routes",
    update: (id) => `/api/fixed-routes/${id}`,
    delete: (id) => `/api/fixed-routes/${id}`,
    byId: (id) => `/api/fixed-routes/${id}`,
    myRoutes: "/api/fixed-routes/my-routes",
    all: "/api/fixed-routes",
    search: "/api/fixed-routes/search",
    updateStatus: (id) => `/api/fixed-routes/${id}/status`,
  },

  routeBookings: {
    create: "/api/route-bookings",
    accept: (id) => `/api/route-bookings/${id}/accept`,
    reject: (id) => `/api/route-bookings/${id}/reject`,
    cancel: (id) => `/api/route-bookings/${id}/cancel`,
    byId: (id) => `/api/route-bookings/${id}`,
    myBookings: "/api/route-bookings/my-bookings",
    pending: "/api/route-bookings/pending",
    byRoute: (routeId) => `/api/route-bookings/route/${routeId}`,
    start: (id) => `/api/route-bookings/${id}/start`,
    complete: (id) => `/api/route-bookings/${id}/complete`,
  },
  notifications: {
    list: "/notifications",
    markRead: (id) => `/notifications/${id}/read`,
    markAllRead: "/notifications/read-all",
    delete: (id) => `/notifications/${id}`,
  },

  feedback: {
    submit: "/feedback",
  },
};
