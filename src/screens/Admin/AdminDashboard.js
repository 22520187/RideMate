import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Image,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Svg, Circle } from "react-native-svg";
import COLORS from "../../constant/colors";
import * as adminService from "../../services/adminService";

const statsCards = [
  {
    label: "Tổng người dùng",
    value: "32.4K",
    icon: "people-outline",
    iconBg: COLORS.BLUE_LIGHT,
    iconColor: COLORS.BLUE,
  },
  {
    label: "Tổng chuyến đi",
    value: "86.1K",
    icon: "car-sport-outline",
    iconBg: COLORS.ORANGE_LIGHT,
    iconColor: COLORS.ORANGE,
  },
  {
    label: "Báo cáo đang xử lý",
    value: "214",
    icon: "alert-circle-outline",
    iconBg: COLORS.RED_LIGHT,
    iconColor: COLORS.ORANGE_DARK,
  },
  {
    label: "Mức hài lòng",
    value: "4.8/5",
    icon: "happy-outline",
    iconBg: COLORS.GREEN_LIGHT,
    iconColor: COLORS.GREEN,
  },
];

const tripTrend = [
  { day: "T2", trips: 940 },
  { day: "T3", trips: 1010 },
  { day: "T4", trips: 1180 },
  { day: "T5", trips: 1350 },
  { day: "T6", trips: 1600 },
  { day: "T7", trips: 1480 },
  { day: "CN", trips: 900 },
];

const topUsers = [
  {
    name: "Trần Quốc Việt",
    points: 9620,
    level: "Platinum",
    avatar: "https://i.pravatar.cc/150?img=12",
  },
  {
    name: "Nguyễn Thị Minh",
    points: 9310,
    level: "Gold",
    avatar: "https://i.pravatar.cc/150?img=32",
  },
  {
    name: "Hoàng Văn Nam",
    points: 9045,
    level: "Gold",
    avatar: "https://i.pravatar.cc/150?img=15",
  },
  {
    name: "Nguyễn Nhật Huy",
    points: 8920,
    level: "Silver",
    avatar: "https://i.pravatar.cc/150?img=20",
  },
  {
    name: "Đặng Lan Phương",
    points: 8785,
    level: "Silver",
    avatar: "https://i.pravatar.cc/150?img=45",
  },
];

const leaderboardPeriods = ["Hôm nay", "Tuần này", "Tháng này", "Tất cả"];

const voucherStats = [
  { label: "Circle K", value: 45, color: COLORS.SECONDARY },
  { label: "Highlands", value: 30, color: COLORS.PRIMARY },
  { label: "7-Eleven", value: 15, color: COLORS.ORANGE },
  { label: "FamilyMart", value: 10, color: COLORS.PURPLE },
];

const activeTrips = [
  {
    id: "RM-2024-125",
    route: "Quận 1 → Thành phố Thủ Đức",
    driver: {
      name: "Nguyễn Văn A",
      phone: "0901 234 567",
      rating: 4.8,
      vehicle: "Honda Wave RSX",
      licensePlate: "51G-12345",
    },
    passenger: {
      name: "Trần Thị Hoa",
      phone: "0908 765 432",
    },
    points: 50,
    departureTime: "10:30",
    departureDate: "12/11/2024",
    pickupLocation: "123 Nguyễn Huệ, Quận 1, TP.HCM",
    destination: "Trường Đại học Công nghệ, Thành phố Thủ Đức",
    status: "active",
  },
  {
    id: "RM-2024-126",
    route: "Quận 7 → Bình Thạnh",
    driver: {
      name: "Trần Thị B",
      phone: "0902 345 678",
      rating: 4.6,
      vehicle: "Yamaha Exciter",
      licensePlate: "51G-23456",
    },
    passenger: {
      name: "Phạm Thị Lan",
      phone: "0909 876 543",
    },
    points: 40,
    departureTime: "11:15",
    departureDate: "12/11/2024",
    pickupLocation: "456 Nguyễn Văn Linh, Quận 7, TP.HCM",
    destination: "789 Xô Viết Nghệ Tĩnh, Bình Thạnh, TP.HCM",
    status: "active",
  },
  {
    id: "RM-2024-127",
    route: "Tân Bình → Gò Vấp",
    driver: {
      name: "Phạm Văn C",
      phone: "0903 456 789",
      rating: 4.9,
      vehicle: "Honda SH",
      licensePlate: "51G-34567",
    },
    passenger: {
      name: "Hoàng Văn Nam",
      phone: "0910 111 222",
    },
    points: 35,
    departureTime: "12:00",
    departureDate: "12/11/2024",
    pickupLocation: "789 Cộng Hòa, Tân Bình, TP.HCM",
    destination: "321 Quang Trung, Gò Vấp, TP.HCM",
    status: "active",
  },
  {
    id: "RM-2024-128",
    route: "Quận 4 → Quận 12",
    driver: {
      name: "Đỗ Thị D",
      phone: "0904 567 890",
      rating: 4.7,
      vehicle: "Honda Vision",
      licensePlate: "51G-45678",
    },
    passenger: {
      name: "Lý Văn Tuấn",
      phone: "0913 444 555",
    },
    points: 60,
    departureTime: "13:45",
    departureDate: "12/11/2024",
    pickupLocation: "456 Khánh Hội, Quận 4, TP.HCM",
    destination: "789 Tân Thới Hiệp, Quận 12, TP.HCM",
    status: "active",
  },
];

const membershipStats = [
  { label: "Premium", value: 1250, color: COLORS.ORANGE },
  { label: "VIP", value: 680, color: COLORS.PURPLE },
  { label: "Family", value: 420, color: COLORS.GREEN },
];

const VoucherPieChart = ({ data }) => {
  const radius = 50;
  const strokeWidth = 18;
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const circumference = 2 * Math.PI * radius;
  const center = radius + strokeWidth / 2;

  let cumulative = 0;

  return (
    <View style={styles.pieWrapper}>
      <Svg width={center * 2} height={center * 2}>
        {data.map((segment, index) => {
          const segmentLength = (segment.value / total) * circumference;
          const circle = (
            <Circle
              key={segment.label}
              cx={center}
              cy={center}
              r={radius}
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segmentLength} ${
                circumference - segmentLength
              }`}
              strokeDashoffset={-cumulative}
              strokeLinecap="round"
              fill="transparent"
              transform={`rotate(-90 ${center} ${center})`}
            />
          );
          cumulative += segmentLength;
          return circle;
        })}
        <Text style={styles.pieCenterLabel}>{total}%</Text>
      </Svg>
    </View>
  );
};

const MembershipBarChart = ({ data }) => {
  const maxValue = Math.max(...data.map((item) => item.value));
  const chartHeight = 120;

  return (
    <View style={styles.barChartContainer}>
      {data.map((item, index) => {
        const height = (item.value / maxValue) * chartHeight;
        return (
          <View key={item.label} style={styles.barChartItem}>
            <View style={styles.barChartBarWrapper}>
              <View
                style={[
                  styles.barChartBar,
                  { height, backgroundColor: item.color },
                ]}
              />
              <Text style={styles.barChartValue}>{item.value}</Text>
            </View>
            <Text style={styles.barChartLabel}>{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
};

const AdminDashboard = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const [activePeriod, setActivePeriod] = useState(leaderboardPeriods[3]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [tripDetailVisible, setTripDetailVisible] = useState(false);

  // API data states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [tripStats, setTripStats] = useState(null);
  const [activeTripsData, setActiveTripsData] = useState([]);
  const [topUsersData, setTopUsersData] = useState([]);
  const [membershipData, setMembershipData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [chartData, setChartData] = useState(null);

  const highestTrip = useMemo(
    () => (chartData?.data ? Math.max(...chartData.data) : 1600),
    [chartData]
  );
  const isLargeScreen = width >= 768;
  const podiumTopThree = topUsersData.slice(0, 3);
  const remainingUsers = topUsersData.slice(3);

  const handleSelectPeriod = (period) => {
    setActivePeriod(period);
    setDropdownVisible(false);
  };

  const totalMemberships = useMemo(() => {
    return membershipData?.totalMembers || 0;
  }, [membershipData]);

  const handleViewTripDetail = (trip) => {
    setSelectedTrip(trip);
    setTripDetailVisible(true);
  };

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const [
        statsRes,
        tripStatsRes,
        activeTripsRes,
        topUsersRes,
        membershipRes,
        revenueRes,
        chartRes,
      ] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getTripStats(),
        adminService.getActiveTrips(),
        adminService.getTopUsers(10),
        adminService.getMembershipStats(),
        adminService.getRevenueStats(),
        adminService.getChartData("sessions"), // or "users" based on preference
      ]);

      setDashboardStats(statsRes.data);
      setTripStats(tripStatsRes.data);
      setActiveTripsData(activeTripsRes.data || []);
      setTopUsersData(topUsersRes.data || []);
      setMembershipData(membershipRes.data);
      setRevenueData(revenueRes.data);
      setChartData(chartRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Transform API data to statsCards format
  const statsCards = useMemo(() => {
    if (!dashboardStats) return [];

    return [
      {
        label: "Tổng người dùng",
        value: formatNumber(dashboardStats.totalUsers),
        icon: "people-outline",
        iconBg: COLORS.BLUE_LIGHT,
        iconColor: COLORS.BLUE,
      },
      {
        label: "Tổng chuyến đi",
        value: formatNumber(tripStats?.completedTrips || 0),
        icon: "car-sport-outline",
        iconBg: COLORS.ORANGE_LIGHT,
        iconColor: COLORS.ORANGE,
      },
      {
        label: "Báo cáo đang xử lý",
        value: formatNumber(dashboardStats.totalReports),
        icon: "alert-circle-outline",
        iconBg: COLORS.RED_LIGHT,
        iconColor: COLORS.ORANGE_DARK,
      },
      {
        label: "Tổng phiên",
        value: formatNumber(dashboardStats.totalSessions),
        icon: "happy-outline",
        iconBg: COLORS.GREEN_LIGHT,
        iconColor: COLORS.GREEN,
      },
    ];
  }, [dashboardStats, tripStats]);

  // Transform chart data to tripTrend format
  const tripTrend = useMemo(() => {
    if (!chartData || !chartData.labels || !chartData.data) {
      return [];
    }

    return chartData.labels.map((label, index) => ({
      day: formatDateLabel(label),
      trips: chartData.data[index] || 0,
    }));
  }, [chartData]);

  // Transform membership data
  const membershipStats = useMemo(() => {
    if (!membershipData || !membershipData.tierDistribution) {
      return [];
    }

    const colors = {
      Bronze: COLORS.ORANGE,
      Silver: COLORS.GRAY,
      Gold: "#FFD700",
      Platinum: COLORS.BLUE,
    };

    return Object.entries(membershipData.tierDistribution).map(
      ([tier, count]) => ({
        label: tier,
        value: count,
        color: colors[tier] || COLORS.PRIMARY,
      })
    );
  }, [membershipData]);

  // Transform revenue data to voucher stats for pie chart
  const voucherStats = useMemo(() => {
    if (!revenueData || !revenueData.topVouchers) {
      return [];
    }

    const voucherColors = [
      COLORS.SECONDARY,
      COLORS.PRIMARY,
      COLORS.ORANGE,
      COLORS.PURPLE,
      COLORS.GREEN,
    ];

    const topVouchers = Object.entries(revenueData.topVouchers).slice(0, 5); // Top 5 vouchers

    const total = topVouchers.reduce((sum, [_, count]) => sum + count, 0);

    return topVouchers.map(([name, count], index) => ({
      label: name,
      value: total > 0 ? Math.round((count / total) * 100) : 0,
      color: voucherColors[index] || COLORS.BLUE,
      count: count, // Keep actual count for display
    }));
  }, [revenueData]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.BLUE} />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tổng quan Admin</Text>
          <Text style={styles.subtitle}>
            Cập nhật nhanh tình trạng hoạt động trên RideMate
          </Text>
        </View>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.BLUE]}
            tintColor={COLORS.BLUE}
          />
        }
      >
        <View style={styles.statsGrid}>
          {statsCards.map((item) => (
            <View key={item.label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: item.iconBg }]}>
                <Ionicons name={item.icon} size={22} color={item.iconColor} />
              </View>
              <Text style={styles.statLabel}>{item.label}</Text>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statChange}>{item.change}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Lưu lượng chuyến đi</Text>
              <Text style={styles.sectionSubtitle}>
                Phân bố số chuyến trong 7 ngày gần nhất
              </Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.linkText}>Tải dữ liệu</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.chartRow}>
            <View style={styles.barChart}>
              {tripTrend.map((item) => {
                const height = (item.trips / highestTrip) * 140;
                return (
                  <View key={item.day} style={styles.barWrapper}>
                    <Text style={styles.barValue}>{item.trips}</Text>
                    <View style={[styles.bar, { height }]} />
                    <Text style={styles.barLabel}>{item.day}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Bảng xếp hạng điểm</Text>
              <Text style={styles.sectionSubtitle}>
                Top {topUsersData.length} người dùng xuất sắc
              </Text>
            </View>
            <TouchableOpacity
              style={styles.combobox}
              onPress={() => setDropdownVisible(true)}
            >
              <Text style={styles.comboboxText}>{activePeriod}</Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.GRAY} />
            </TouchableOpacity>
          </View>

          {topUsersData.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={48} color={COLORS.GRAY} />
              <Text style={styles.emptyStateText}>
                Chưa có dữ liệu xếp hạng
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.leaderboardContainer}>
                <View style={styles.podiumWrapper}>
                  {podiumTopThree.length > 0 &&
                    [1, 0, 2]
                      .filter((index) => podiumTopThree[index])
                      .map((podiumIndex, orderIndex) => {
                        const user = podiumTopThree[podiumIndex];
                        const isChampion = podiumIndex === 0;
                        const podiumStyles =
                          orderIndex === 0
                            ? styles.podiumSecond
                            : orderIndex === 2
                            ? styles.podiumThird
                            : styles.podiumChampion;
                        return (
                          <View
                            key={user.userId}
                            style={[styles.podiumCard, podiumStyles]}
                          >
                            <View style={styles.podiumBadge}>
                              <Text
                                style={[
                                  styles.podiumBadgeText,
                                  isChampion && styles.podiumBadgeTextPrimary,
                                ]}
                              >
                                {podiumIndex + 1}
                              </Text>
                            </View>
                            <Text
                              style={[
                                styles.podiumScore,
                                isChampion && styles.podiumScorePrimary,
                              ]}
                            >
                              {user.coins} điểm
                            </Text>
                            <Text style={styles.podiumTripsLabel}>
                              Điểm tích lũy
                            </Text>
                            <Image
                              source={{
                                uri:
                                  user.profilePictureUrl ||
                                  "https://via.placeholder.com/150",
                              }}
                              style={styles.podiumAvatar}
                            />
                            <Text style={styles.podiumName}>
                              {user.fullName}
                            </Text>
                            <Text style={styles.podiumLevel}>
                              {user.membershipTier}
                            </Text>
                          </View>
                        );
                      })}
                </View>

                <View style={styles.rankingList}>
                  {remainingUsers.map((user, index) => (
                    <View key={user.userId} style={styles.rankRow}>
                      <View style={styles.rankNumber}>
                        <Text style={styles.rankNumberLabel}>{index + 4}</Text>
                      </View>
                      <Image
                        source={{
                          uri:
                            user.profilePictureUrl ||
                            "https://via.placeholder.com/150",
                        }}
                        style={styles.rankAvatar}
                      />
                      <View style={styles.rankInfo}>
                        <Text style={styles.rankName}>{user.fullName}</Text>
                        <Text style={styles.rankLevel}>
                          {user.membershipTier}
                        </Text>
                      </View>
                      <Text style={styles.rankPoints}>{user.coins} điểm</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}
        </View>

        <View
          style={[
            styles.doubleColumn,
            !isLargeScreen && styles.doubleColumnStack,
          ]}
        >
          <View
            style={[
              styles.section,
              styles.column,
              !isLargeScreen && styles.columnFull,
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tỉ lệ đổi voucher</Text>
              <Text style={styles.sectionSubtitle}>
                Top 5 voucher phổ biến nhất
              </Text>
            </View>
            {voucherStats.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="ticket-outline" size={48} color={COLORS.GRAY} />
                <Text style={styles.emptyStateText}>
                  Chưa có dữ liệu voucher
                </Text>
              </View>
            ) : (
              <>
                <VoucherPieChart data={voucherStats} />
                <View style={styles.legendList}>
                  {voucherStats.map((item) => (
                    <View key={item.label} style={styles.legendItem}>
                      <View
                        style={[
                          styles.legendDot,
                          { backgroundColor: item.color },
                        ]}
                      />
                      <Text style={styles.legendLabel}>{item.label}</Text>
                      <Text style={styles.legendValue}>{item.value}%</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>

          <View
            style={[
              styles.section,
              styles.column,
              !isLargeScreen && styles.columnFull,
            ]}
          >
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Thống kê gói nâng cấp</Text>
                <Text style={styles.sectionSubtitle}>
                  Tổng {totalMemberships.toLocaleString()} người dùng
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (navigation) {
                    navigation.navigate("MembershipManagement");
                  }
                }}
              >
                <Text style={styles.linkText}>Quản lý gói</Text>
              </TouchableOpacity>
            </View>
            <MembershipBarChart data={membershipStats} />
            <View style={styles.membershipLegend}>
              {membershipStats.map((item) => (
                <View key={item.label} style={styles.membershipLegendItem}>
                  <View
                    style={[
                      styles.membershipLegendDot,
                      { backgroundColor: item.color },
                    ]}
                  />
                  <Text style={styles.membershipLegendLabel}>{item.label}</Text>
                  <Text style={styles.membershipLegendValue}>
                    {item.value.toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Chuyến đi đang diễn ra</Text>
              <Text style={styles.sectionSubtitle}>
                {activeTripsData.length} chuyến đi đang hoạt động
              </Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.linkText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          {activeTripsData.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={48} color={COLORS.GRAY} />
              <Text style={styles.emptyStateText}>
                Không có chuyến đi đang hoạt động
              </Text>
            </View>
          ) : (
            activeTripsData.map((trip) => (
              <TouchableOpacity
                key={trip.sessionId}
                style={styles.activeTripRow}
                onPress={() => handleViewTripDetail(trip)}
                activeOpacity={0.7}
              >
                <View style={styles.activeTripInfo}>
                  <View style={styles.activeTripHeader}>
                    <Text style={styles.activeTripId}>#{trip.sessionId}</Text>
                    <View
                      style={[
                        styles.activeTripStatusBadge,
                        {
                          backgroundColor:
                            trip.status === "IN_PROGRESS"
                              ? COLORS.GREEN_LIGHT
                              : COLORS.BLUE_LIGHT,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.activeTripStatusText,
                          {
                            color:
                              trip.status === "IN_PROGRESS"
                                ? COLORS.GREEN
                                : COLORS.BLUE,
                          },
                        ]}
                      >
                        {trip.status === "IN_PROGRESS"
                          ? "Đang diễn ra"
                          : "Đã ghép"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.activeTripRoute}>
                    {trip.startLocation} → {trip.endLocation}
                  </Text>
                  <View style={styles.activeTripDetails}>
                    <View style={styles.activeTripDetail}>
                      <Ionicons
                        name="person-outline"
                        size={14}
                        color={COLORS.GRAY}
                      />
                      <Text style={styles.activeTripDetailText}>
                        {trip.driverName}
                      </Text>
                    </View>
                    <View style={styles.activeTripDetail}>
                      <Ionicons
                        name="car-outline"
                        size={14}
                        color={COLORS.GRAY}
                      />
                      <Text style={styles.activeTripDetailText}>
                        {trip.vehicleInfo}
                      </Text>
                    </View>
                    <View style={styles.activeTripDetail}>
                      <Ionicons
                        name="people-outline"
                        size={14}
                        color={COLORS.GRAY}
                      />
                      <Text style={styles.activeTripDetailText}>
                        {trip.totalRiders}/
                        {trip.seatsAvailable + trip.totalRiders} chỗ
                      </Text>
                    </View>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={COLORS.GRAY}
                />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        transparent
        visible={dropdownVisible}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDropdownVisible(false)}
        >
          <View style={styles.dropdownContainer}>
            {leaderboardPeriods.map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.dropdownItem,
                  activePeriod === period && styles.dropdownItemActive,
                ]}
                onPress={() => handleSelectPeriod(period)}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    activePeriod === period && styles.dropdownItemTextActive,
                  ]}
                >
                  {period}
                </Text>
                {activePeriod === period && (
                  <Ionicons name="checkmark" size={20} color={COLORS.PRIMARY} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        transparent
        visible={tripDetailVisible}
        animationType="slide"
        onRequestClose={() => setTripDetailVisible(false)}
      >
        <View style={styles.tripDetailOverlay}>
          <View style={styles.tripDetailContainer}>
            {selectedTrip && (
              <>
                <View style={styles.tripDetailHeader}>
                  <Text style={styles.tripDetailTitle}>Chi tiết chuyến đi</Text>
                  <TouchableOpacity onPress={() => setTripDetailVisible(false)}>
                    <Ionicons name="close" size={24} color={COLORS.BLACK} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.tripDetailSection}>
                    <Text style={styles.tripDetailSectionTitle}>
                      Thông tin chuyến đi
                    </Text>
                    <View style={styles.tripDetailInfoRow}>
                      <Text style={styles.tripDetailLabel}>Mã chuyến:</Text>
                      <Text style={styles.tripDetailValue}>
                        {selectedTrip.id}
                      </Text>
                    </View>
                    <View style={styles.tripDetailInfoRow}>
                      <Text style={styles.tripDetailLabel}>Tuyến đường:</Text>
                      <Text style={styles.tripDetailValue}>
                        {selectedTrip.route}
                      </Text>
                    </View>
                    <View style={styles.tripDetailInfoRow}>
                      <Text style={styles.tripDetailLabel}>Thời gian:</Text>
                      <Text style={styles.tripDetailValue}>
                        {selectedTrip.departureTime} -{" "}
                        {selectedTrip.departureDate}
                      </Text>
                    </View>
                    <View style={styles.tripDetailInfoRow}>
                      <Text style={styles.tripDetailLabel}>Điểm thưởng:</Text>
                      <View style={styles.pointsContainer}>
                        <Ionicons name="star" size={16} color={COLORS.YELLOW} />
                        <Text style={styles.tripDetailValue}>
                          {selectedTrip.points} điểm
                        </Text>
                      </View>
                    </View>
                    <View style={styles.tripDetailInfoRow}>
                      <Text style={styles.tripDetailLabel}>Trạng thái:</Text>
                      <View
                        style={[
                          styles.tripDetailStatusBadge,
                          { backgroundColor: COLORS.GREEN_LIGHT },
                        ]}
                      >
                        <Text
                          style={[
                            styles.tripDetailStatusText,
                            { color: COLORS.GREEN },
                          ]}
                        >
                          Đang diễn ra
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.tripDetailSection}>
                    <Text style={styles.tripDetailSectionTitle}>Địa điểm</Text>
                    <View style={styles.locationRow}>
                      <View style={styles.locationDot} />
                      <View style={styles.locationInfo}>
                        <Text style={styles.locationLabel}>Điểm đón:</Text>
                        <Text style={styles.locationText}>
                          {selectedTrip.pickupLocation}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.locationRow}>
                      <View
                        style={[
                          styles.locationDot,
                          styles.locationDotDestination,
                        ]}
                      />
                      <View style={styles.locationInfo}>
                        <Text style={styles.locationLabel}>Điểm đến:</Text>
                        <Text style={styles.locationText}>
                          {selectedTrip.destination}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.tripDetailSection}>
                    <Text style={styles.tripDetailSectionTitle}>Tài xế</Text>
                    <View style={styles.driverCard}>
                      <View style={styles.driverInfo}>
                        <Ionicons
                          name="person-circle"
                          size={40}
                          color={COLORS.PRIMARY}
                        />
                        <View style={styles.driverDetails}>
                          <Text style={styles.driverName}>
                            {selectedTrip.driver.name}
                          </Text>
                          <View style={styles.driverRating}>
                            <Ionicons
                              name="star"
                              size={14}
                              color={COLORS.YELLOW}
                            />
                            <Text style={styles.driverRatingText}>
                              {selectedTrip.driver.rating}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.driverContact}>
                        <Ionicons
                          name="call-outline"
                          size={16}
                          color={COLORS.GRAY}
                        />
                        <Text style={styles.driverPhone}>
                          {selectedTrip.driver.phone}
                        </Text>
                      </View>
                      <View style={styles.driverVehicle}>
                        <Ionicons
                          name="car-outline"
                          size={16}
                          color={COLORS.GRAY}
                        />
                        <Text style={styles.driverVehicleText}>
                          {selectedTrip.driver.vehicle} -{" "}
                          {selectedTrip.driver.licensePlate}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.tripDetailSection}>
                    <Text style={styles.tripDetailSectionTitle}>
                      Hành khách
                    </Text>
                    <View style={styles.passengerCard}>
                      <Ionicons
                        name="person-outline"
                        size={24}
                        color={COLORS.PRIMARY}
                      />
                      <View style={styles.passengerInfo}>
                        <Text style={styles.passengerName}>
                          {selectedTrip.passenger.name}
                        </Text>
                        <View style={styles.passengerContact}>
                          <Ionicons
                            name="call-outline"
                            size={14}
                            color={COLORS.GRAY}
                          />
                          <Text style={styles.passengerPhone}>
                            {selectedTrip.passenger.phone}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 20,
  },
  header: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    width: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.WHITE,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: COLORS.WHITE,
    opacity: 0.9,
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 30,
    backgroundColor: COLORS.PRIMARY,
    gap: 6,
  },
  headerButtonLabel: {
    color: COLORS.WHITE,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: COLORS.WHITE,
    borderRadius: 18,
    padding: 16,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.GRAY,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.BLACK,
    marginVertical: 6,
  },
  statChange: {
    fontSize: 12,
    color: COLORS.GRAY,
  },
  section: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    padding: 18,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.BLACK,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.GRAY,
    marginTop: 6,
  },
  combobox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
    backgroundColor: COLORS.WHITE,
    minWidth: 100,
  },
  comboboxText: {
    fontSize: 14,
    color: COLORS.BLACK,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    minWidth: 200,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  dropdownItemActive: {
    backgroundColor: COLORS.BLUE_LIGHT,
  },
  dropdownItemText: {
    fontSize: 14,
    color: COLORS.BLACK,
    fontWeight: "500",
  },
  dropdownItemTextActive: {
    color: COLORS.PRIMARY,
    fontWeight: "600",
  },
  linkText: {
    fontSize: 13,
    color: COLORS.PRIMARY,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  chartRow: {
    flexDirection: "row",
    gap: 16,
  },
  barChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    flex: 1.4,
    height: 200,
  },
  barWrapper: {
    alignItems: "center",
    justifyContent: "flex-end",
    flex: 1,
  },
  barValue: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.GRAY,
    marginBottom: 6,
  },
  bar: {
    width: 20,
    borderRadius: 12,
    backgroundColor: COLORS.SECONDARY,
  },
  barLabel: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.GRAY,
  },
  chartSummary: {
    flex: 1,
    gap: 14,
  },
  summaryItem: {
    backgroundColor: COLORS.BG,
    borderRadius: 16,
    padding: 14,
    flex: 1,
    minWidth: "48%",
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  summaryLabel: {
    marginTop: 4,
    color: COLORS.GRAY,
    fontSize: 12,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.GRAY_LIGHT,
  },
  userRank: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.BG,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  userRankText: {
    fontWeight: "700",
    color: COLORS.SECONDARY,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.BLACK,
  },
  userLevel: {
    fontSize: 12,
    color: COLORS.GRAY,
  },
  userPoints: {
    fontWeight: "600",
    color: COLORS.ORANGE_DARK,
  },
  leaderboardContainer: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
  podiumWrapper: {
    flexDirection: "row",
    flex: 1,
    gap: 12,
    justifyContent: "space-between",
    alignItems: "flex-end",
    minWidth: 260,
  },
  podiumCard: {
    flex: 1,
    borderRadius: 22,
    paddingVertical: 20,
    paddingTop: 36,
    paddingHorizontal: 12,
    alignItems: "center",
    position: "relative",
    borderWidth: 1,
    borderColor: "#E4E9FB",
    backgroundColor: "#F4F6FE",
  },
  podiumChampion: {
    flex: 1.2,
    backgroundColor: "#FFF5D7",
    borderColor: "#FFE28A",
    shadowColor: COLORS.ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  podiumSecond: {
    marginTop: 24,
    backgroundColor: "#E4F1FF",
    borderColor: "#A4D4FF",
  },
  podiumThird: {
    marginTop: 36,
    backgroundColor: "#F3E7FF",
    borderColor: "#D3B7FF",
  },
  podiumScore: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.BLACK,
    marginTop: 12,
  },
  podiumScorePrimary: {
    color: COLORS.ORANGE_DARK,
  },
  podiumTripsLabel: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginBottom: 8,
  },
  podiumAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: COLORS.WHITE,
    marginBottom: 14,
  },
  podiumBadge: {
    position: "absolute",
    top: -16,
    left: "50%",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.WHITE,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    transform: [{ translateX: -16 }],
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  podiumBadgeText: {
    fontWeight: "700",
    color: COLORS.GRAY,
  },
  podiumBadgeTextPrimary: {
    color: COLORS.ORANGE_DARK,
  },
  podiumName: {
    fontWeight: "600",
    color: COLORS.BLACK,
    textAlign: "center",
  },
  podiumLevel: {
    fontSize: 12,
    color: COLORS.GRAY,
  },
  rankingList: {
    flex: 1,
    minWidth: 220,
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.GRAY_LIGHT,
  },
  rankNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  rankNumberLabel: {
    fontWeight: "700",
    color: COLORS.GRAY,
  },
  rankAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  rankInfo: {
    flex: 1,
  },
  rankName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.BLACK,
  },
  rankLevel: {
    fontSize: 12,
    color: COLORS.GRAY,
  },
  rankPoints: {
    fontWeight: "700",
    color: COLORS.SECONDARY,
  },
  doubleColumn: {
    flexDirection: "row",
    gap: 16,
  },
  doubleColumnStack: {
    flexWrap: "wrap",
  },
  column: {
    flex: 1,
  },
  columnFull: {
    minWidth: "100%",
  },
  legendList: {
    marginTop: 12,
    gap: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendLabel: {
    flex: 1,
    color: COLORS.BLACK,
  },
  legendValue: {
    fontWeight: "600",
    color: COLORS.GRAY,
  },
  barChartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    height: 150,
    marginVertical: 20,
    paddingHorizontal: 8,
  },
  barChartItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  barChartBarWrapper: {
    alignItems: "center",
    justifyContent: "flex-end",
    width: "100%",
    marginBottom: 8,
  },
  barChartBar: {
    width: "80%",
    borderRadius: 8,
    minHeight: 20,
  },
  barChartValue: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  barChartLabel: {
    fontSize: 12,
    color: COLORS.GRAY,
    textAlign: "center",
  },
  membershipLegend: {
    marginTop: 12,
    gap: 10,
  },
  membershipLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  membershipLegendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  membershipLegendLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.BLACK,
    fontWeight: "500",
  },
  membershipLegendValue: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  activeTripRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.GRAY_LIGHT,
  },
  activeTripInfo: {
    flex: 1,
  },
  activeTripHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  activeTripId: {
    fontSize: 13,
    color: COLORS.GRAY,
    fontWeight: "600",
  },
  activeTripStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeTripStatusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  activeTripRoute: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.BLACK,
    marginBottom: 10,
  },
  activeTripDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  activeTripDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  activeTripDetailText: {
    fontSize: 13,
    color: COLORS.GRAY,
  },
  pieWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  pieCenterLabel: {
    position: "absolute",
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  tripDetailOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  tripDetailContainer: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    padding: 20,
  },
  tripDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  tripDetailTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  tripDetailSection: {
    marginBottom: 24,
  },
  tripDetailSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.BLACK,
    marginBottom: 12,
  },
  tripDetailInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  tripDetailLabel: {
    fontSize: 14,
    color: COLORS.GRAY,
    flex: 1,
  },
  tripDetailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.BLACK,
    flex: 2,
    textAlign: "right",
  },
  tripDetailStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-end",
  },
  tripDetailStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  locationRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.GREEN,
    marginRight: 12,
    marginTop: 4,
  },
  locationDotDestination: {
    backgroundColor: COLORS.RED,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.BLACK,
    fontWeight: "500",
  },
  driverCard: {
    backgroundColor: COLORS.BG,
    borderRadius: 12,
    padding: 16,
  },
  driverInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  driverDetails: {
    marginLeft: 12,
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.BLACK,
    marginBottom: 4,
  },
  driverRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  driverRatingText: {
    fontSize: 14,
    color: COLORS.BLACK,
    fontWeight: "500",
  },
  driverContact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  driverPhone: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  driverVehicle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  driverVehicleText: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  passengerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.BG,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  passengerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  passengerName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.BLACK,
    marginBottom: 4,
  },
  passengerContact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  passengerPhone: {
    fontSize: 13,
    color: COLORS.GRAY,
  },
  pointsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.BG,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.GRAY,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.GRAY,
  },
});

// Helper functions
const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

const formatDateLabel = (dateStr) => {
  // Convert "2025-12-15" to "15/12"
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dateStr;
};

export default AdminDashboard;
