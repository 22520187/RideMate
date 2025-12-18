import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import COLORS from "../../constant/colors";
import * as adminService from "../../services/adminService";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const AdminDashboard = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [chartData, setChartData] = useState({
    users: null,
    sessions: null,
    trips: null,
  });
  const [selectedPeriod, setSelectedPeriod] = useState("Last 7 Days");

  const isLargeScreen = width >= 768;

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [stats, usersChart, sessionsChart] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getChartData("users"),
        adminService.getChartData("sessions"),
      ]);

      setDashboardStats(stats);
      setChartData({
        users: usersChart,
        sessions: sessionsChart,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, [fetchDashboardData]);

  // Key stats only - reduced from 8 to 3 main cards
  const stats = useMemo(() => {
    if (!dashboardStats) return [];

    return [
      {
        label: "Total Users",
        value: formatNumber(dashboardStats.totalUsers || 0),
        change: "+2.5%",
        isPositive: true,
        bgColor: ["#667eea", "#764ba2"],
        icon: "people",
        iconColor: "#FFFFFF",
      },
      {
        label: "Active Trips",
        value: formatNumber(dashboardStats.totalCompletedTrips || 0),
        change: "+12.5%",
        isPositive: true,
        bgColor: ["#f093fb", "#f5576c"],
        icon: "car-sport",
        iconColor: "#FFFFFF",
      },
      {
        label: "Total Sessions",
        value: formatNumber(dashboardStats.totalSessions || 0),
        change: "+8.3%",
        isPositive: true,
        bgColor: ["#4facfe", "#00f2fe"],
        icon: "stats-chart",
        iconColor: "#FFFFFF",
      },
    ];
  }, [dashboardStats]);

  // Trip breakdown pie chart data
  const tripsPieData = useMemo(() => {
    if (!dashboardStats) return [];

    const completed = dashboardStats.totalCompletedTrips || 0;
    const cancelled = dashboardStats.totalCancelledTrips || 0;
    const total = completed + cancelled;

    if (total === 0) return [];

    return [
      {
        name: "Completed",
        count: completed,
        color: "#4CAF50",
        legendFontColor: "#7F7F7F",
        legendFontSize: 12,
      },
      {
        name: "Cancelled",
        count: cancelled,
        color: "#F44336",
        legendFontColor: "#7F7F7F",
        legendFontSize: 12,
      },
    ];
  }, [dashboardStats]);

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.welcomeLabel}>WELCOME BACK</Text>
        <Text style={styles.userName}>Jack Doeson</Text>
      </View>
      <TouchableOpacity style={styles.profileButton}>
        <Ionicons
          name="person-circle-outline"
          size={40}
          color={COLORS.PRIMARY}
        />
      </TouchableOpacity>
    </View>
  );

  const renderPeriodSelector = () => (
    <View style={styles.periodContainer}>
      <Text style={styles.periodLabel}>{selectedPeriod}</Text>
    </View>
  );

  const renderStatCard = (item, index) => (
    <LinearGradient
      key={index}
      colors={item.bgColor}
      style={[styles.statCard, isLargeScreen && styles.statCardLarge]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.statCardHeader}>
        <View style={styles.statIconWhite}>
          <Ionicons name={item.icon} size={28} color={item.iconColor} />
        </View>
      </View>
      <Text style={styles.statValue}>{item.value}</Text>
      <Text style={styles.statLabelWhite}>{item.label}</Text>
      <View style={styles.changeContainerWhite}>
        <Ionicons
          name={item.isPositive ? "trending-up" : "trending-down"}
          size={14}
          color="#FFFFFF"
        />
        <Text style={styles.changeTextWhite}>{item.change}</Text>
      </View>
    </LinearGradient>
  );

  const chartConfig = {
    backgroundGradientFrom: "#FFFFFF",
    backgroundGradientTo: "#FFFFFF",
    color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForLabels: {
      fontSize: 10,
    },
  };

  const renderLineChart = () => {
    if (
      !chartData.users ||
      !chartData.users.labels ||
      chartData.users.labels.length === 0
    ) {
      return (
        <View style={styles.chartPlaceholder}>
          <Ionicons name="analytics-outline" size={40} color={COLORS.GRAY} />
          <Text style={styles.placeholderText}>No chart data available</Text>
        </View>
      );
    }

    // Take last 7 days only
    const last7Days = chartData.users.labels.slice(-7);
    const last7DaysData = chartData.users.data.slice(-7);

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Ionicons name="trending-up" size={20} color={COLORS.PRIMARY} />
          <Text style={styles.chartTitle}>New Users (Last 7 Days)</Text>
        </View>
        <LineChart
          data={{
            labels: last7Days.map((d) => d.slice(5)),
            datasets: [
              {
                data: last7DaysData,
                color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
                strokeWidth: 3,
              },
            ],
          }}
          width={SCREEN_WIDTH - 40}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withInnerLines={false}
          withOuterLines={true}
          withVerticalLines={false}
          withHorizontalLines={true}
          withDots={true}
          withShadow={true}
        />
      </View>
    );
  };

  const renderBarChart = () => {
    if (
      !chartData.sessions ||
      !chartData.sessions.labels ||
      chartData.sessions.labels.length === 0
    ) {
      return (
        <View style={styles.chartPlaceholder}>
          <Ionicons name="bar-chart-outline" size={40} color={COLORS.GRAY} />
          <Text style={styles.placeholderText}>No chart data available</Text>
        </View>
      );
    }

    // Take last 7 days only
    const last7Days = chartData.sessions.labels.slice(-7);
    const last7DaysData = chartData.sessions.data.slice(-7);

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Ionicons name="bar-chart" size={20} color="#4CAF50" />
          <Text style={styles.chartTitle}>Sessions (Last 7 Days)</Text>
        </View>
        <BarChart
          data={{
            labels: last7Days.map((d) => d.slice(5)),
            datasets: [
              {
                data: last7DaysData,
              },
            ],
          }}
          width={SCREEN_WIDTH - 40}
          height={220}
          chartConfig={{
            ...chartConfig,
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          }}
          style={styles.chart}
          withInnerLines={false}
          showValuesOnTopOfBars={true}
          fromZero={true}
        />
      </View>
    );
  };

  const renderPieChart = () => {
    if (tripsPieData.length === 0) {
      return (
        <View style={styles.chartPlaceholder}>
          <Ionicons name="pie-chart-outline" size={40} color={COLORS.GRAY} />
          <Text style={styles.placeholderText}>No trip data available</Text>
        </View>
      );
    }

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Ionicons name="pie-chart" size={20} color="#FF9800" />
          <Text style={styles.chartTitle}>Trip Status Distribution</Text>
        </View>
        <PieChart
          data={tripsPieData}
          width={SCREEN_WIDTH - 40}
          height={200}
          chartConfig={chartConfig}
          accessor="count"
          backgroundColor="transparent"
          paddingLeft="15"
          style={styles.chart}
          absolute
        />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderHeader()}
        {renderPeriodSelector()}

        {/* Main Stats Cards - Only 3 Key Metrics */}
        <View
          style={[styles.statsGrid, isLargeScreen && styles.statsGridLarge]}
        >
          {stats.map((item, index) => renderStatCard(item, index))}
        </View>

        {/* Charts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionSubtitle}>ANALYTICS</Text>
            <Text style={styles.sectionTitle}>Performance Overview</Text>
          </View>

          {renderLineChart()}
          {renderBarChart()}
          {renderPieChart()}
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionSubtitle}>QUICK STATS</Text>
            <Text style={styles.sectionTitle}>System Overview</Text>
          </View>

          <View style={styles.quickStatsGrid}>
            <View style={styles.quickStatCard}>
              <Ionicons name="car" size={24} color="#9C27B0" />
              <Text style={styles.quickStatValue}>
                {formatNumber(dashboardStats?.totalVehicles || 0)}
              </Text>
              <Text style={styles.quickStatLabel}>Vehicles</Text>
            </View>
            <View style={styles.quickStatCard}>
              <Ionicons name="pricetag" size={24} color="#FF9800" />
              <Text style={styles.quickStatValue}>
                {formatNumber(dashboardStats?.totalVouchers || 0)}
              </Text>
              <Text style={styles.quickStatLabel}>Vouchers</Text>
            </View>
            <View style={styles.quickStatCard}>
              <Ionicons name="alert-circle" size={24} color="#F44336" />
              <Text style={styles.quickStatValue}>
                {formatNumber(dashboardStats?.totalReports || 0)}
              </Text>
              <Text style={styles.quickStatLabel}>Reports</Text>
            </View>
            <View style={styles.quickStatCard}>
              <Ionicons name="close-circle" size={24} color="#FF5722" />
              <Text style={styles.quickStatValue}>
                {formatNumber(dashboardStats?.totalCancelledTrips || 0)}
              </Text>
              <Text style={styles.quickStatLabel}>Cancelled</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.GRAY,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  welcomeLabel: {
    fontSize: 11,
    color: COLORS.GRAY,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  periodContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  periodLabel: {
    fontSize: 14,
    color: COLORS.GRAY,
    fontWeight: "500",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 12,
  },
  statsGridLarge: {
    paddingHorizontal: 20,
    gap: 16,
  },
  statCard: {
    width: (SCREEN_WIDTH - 52) / 3,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    minHeight: 160,
  },
  statCardLarge: {
    width: (SCREEN_WIDTH - 56) / 3,
  },
  statCardHeader: {
    marginBottom: 12,
  },
  statIconWhite: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  changeContainerWhite: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  changeTextWhite: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
    marginTop: 8,
  },
  statLabelWhite: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "600",
  },
  chartContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartPlaceholder: {
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  placeholderText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.GRAY,
  },
  quickStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  quickStatCard: {
    width: (SCREEN_WIDTH - 64) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    minHeight: 120,
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.BLACK,
    marginTop: 12,
  },
  quickStatLabel: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginTop: 6,
    textAlign: "center",
    fontWeight: "500",
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: COLORS.GRAY,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
});

const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num?.toString() || "0";
};

export default AdminDashboard;
