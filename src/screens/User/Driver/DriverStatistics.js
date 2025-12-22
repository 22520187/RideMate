import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Modal,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  LineChart,
  BarChart,
  PieChart,
  ProgressChart,
} from "react-native-chart-kit";
import { LinearGradient } from "expo-linear-gradient";
import COLORS from "../../../constant/colors";
import { getProfile } from "../../../services/userService";
import { getMatchHistory } from "../../../services/matchService";

const { width } = Dimensions.get("window");
const CHART_WIDTH = width - 40;

// Available charts configuration
const AVAILABLE_CHARTS = [
  { id: "earnings", name: "Thu nhập theo thời gian", icon: "trending-up" },
  { id: "ridesCount", name: "Số chuyến đi", icon: "bar-chart" },
  { id: "performance", name: "Hiệu suất", icon: "speedometer" },
  { id: "statusDistribution", name: "Phân bổ trạng thái", icon: "pie-chart" },
  { id: "peakHours", name: "Giờ cao điểm", icon: "time" },
  { id: "distance", name: "Quãng đường", icon: "navigate" },
  { id: "avgEarnings", name: "Thu nhập TB/ngày", icon: "cash" },
];

const DriverStatistics = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [rides, setRides] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("week"); // week, month, year
  const [customizeModalVisible, setCustomizeModalVisible] = useState(false);

  // Chart visibility state - default all visible
  const [visibleCharts, setVisibleCharts] = useState({
    earnings: true,
    ridesCount: true,
    performance: true,
    statusDistribution: true,
    peakHours: true,
    distance: true,
    avgEarnings: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch profile and ride history
      const [profileResp, ridesResp] = await Promise.all([
        getProfile(),
        getMatchHistory(),
      ]);

      const userData = profileResp?.data?.data ?? profileResp?.data;
      setProfile(userData);

      const ridesData = ridesResp?.data?.data ?? ridesResp?.data ?? [];
      const ridesList = Array.isArray(ridesData) ? ridesData : [];
      setRides(ridesList);
    } catch (error) {
      console.error("Failed to load statistics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Calculate statistics
  const stats = React.useMemo(() => {
    const completedRides = rides.filter(
      (r) => r.status === "COMPLETED" || r.status === "FINISHED"
    );
    const cancelledRides = rides.filter((r) => r.status === "CANCELLED");
    const totalEarnings = completedRides.reduce(
      (sum, r) => sum + (r.coin || 0),
      0
    );
    const averageRating = profile?.rating || 0;

    // Calculate rides by period
    const now = new Date();
    const getDateRange = (period) => {
      const start = new Date();
      if (period === "week") {
        start.setDate(now.getDate() - 7);
      } else if (period === "month") {
        start.setMonth(now.getMonth() - 1);
      } else {
        start.setFullYear(now.getFullYear() - 1);
      }
      return start;
    };

    const startDate = getDateRange(selectedPeriod);
    const periodRides = completedRides.filter(
      (r) => new Date(r.createdAt) >= startDate
    );

    return {
      totalRides: completedRides.length,
      cancelledRides: cancelledRides.length,
      totalEarnings,
      averageRating,
      periodRides: periodRides.length,
      completionRate:
        rides.length > 0
          ? ((completedRides.length / rides.length) * 100).toFixed(1)
          : 0,
    };
  }, [rides, profile, selectedPeriod]);

  // Chart data for earnings over time
  const earningsChartData = React.useMemo(() => {
    const days =
      selectedPeriod === "week" ? 7 : selectedPeriod === "month" ? 30 : 12;
    const labels = [];
    const data = [];

    if (selectedPeriod === "year") {
      // For year, show monthly data
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(
          date.getFullYear(),
          date.getMonth() + 1,
          0,
          23,
          59,
          59
        );

        const monthRides = rides.filter((r) => {
          const rideDate = new Date(r.createdAt);
          return (
            rideDate >= monthStart &&
            rideDate <= monthEnd &&
            (r.status === "COMPLETED" || r.status === "FINISHED")
          );
        });

        const monthEarnings = monthRides.reduce(
          (sum, r) => sum + (r.coin || 0),
          0
        );
        labels.push(date.toLocaleDateString("vi-VN", { month: "short" }));
        data.push(monthEarnings);
      }
    } else {
      // For week and month, show daily data
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));

        const dayRides = rides.filter((r) => {
          const rideDate = new Date(r.createdAt);
          return (
            rideDate >= dayStart &&
            rideDate <= dayEnd &&
            (r.status === "COMPLETED" || r.status === "FINISHED")
          );
        });

        const dayEarnings = dayRides.reduce((sum, r) => sum + (r.coin || 0), 0);

        if (selectedPeriod === "week") {
          labels.push(
            date
              .toLocaleDateString("vi-VN", { weekday: "short" })
              .substring(0, 2)
          );
        } else if (selectedPeriod === "month") {
          if (i % 5 === 0 || i === days - 1)
            labels.push(date.getDate().toString());
          else labels.push("");
        }

        data.push(dayEarnings);
      }
    }

    return { labels, data };
  }, [rides, selectedPeriod]);

  // Rides count chart data
  const ridesChartData = React.useMemo(() => {
    const days =
      selectedPeriod === "week" ? 7 : selectedPeriod === "month" ? 30 : 12;
    const data = [];

    if (selectedPeriod === "year") {
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(
          date.getFullYear(),
          date.getMonth() + 1,
          0,
          23,
          59,
          59
        );

        const monthRides = rides.filter((r) => {
          const rideDate = new Date(r.createdAt);
          return (
            rideDate >= monthStart &&
            rideDate <= monthEnd &&
            (r.status === "COMPLETED" || r.status === "FINISHED")
          );
        }).length;

        data.push(monthRides);
      }
    } else {
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));

        const dayRides = rides.filter((r) => {
          const rideDate = new Date(r.createdAt);
          return (
            rideDate >= dayStart &&
            rideDate <= dayEnd &&
            (r.status === "COMPLETED" || r.status === "FINISHED")
          );
        }).length;

        data.push(dayRides);
      }
    }

    return data;
  }, [rides, selectedPeriod]);

  // Status distribution pie chart
  const statusDistribution = React.useMemo(() => {
    const completed = rides.filter(
      (r) => r.status === "COMPLETED" || r.status === "FINISHED"
    ).length;
    const cancelled = rides.filter((r) => r.status === "CANCELLED").length;
    const rejected = rides.filter((r) => r.status === "REJECTED").length;

    return [
      {
        name: "Hoàn thành",
        population: completed,
        color: "#4CAF50",
        legendFontColor: "#1C1C1E",
        legendFontSize: 13,
      },
      {
        name: "Đã hủy",
        population: cancelled,
        color: "#F44336",
        legendFontColor: "#1C1C1E",
        legendFontSize: 13,
      },
      {
        name: "Từ chối",
        population: rejected,
        color: "#FF9800",
        legendFontColor: "#1C1C1E",
        legendFontSize: 13,
      },
    ].filter((item) => item.population > 0);
  }, [rides]);

  // Performance metrics (circular progress) - Shorten labels
  const performanceData = React.useMemo(() => {
    const completionRate = stats.completionRate / 100;
    const ratingRate = stats.averageRating / 5;
    const targetRate = stats.totalRides / 100; // Assume target is 100 rides

    return {
      labels: ["Hoàn thành", "Đánh giá", "Mục tiêu"],
      data: [completionRate, ratingRate, Math.min(targetRate, 1)],
    };
  }, [stats]);

  // Distance traveled chart (from API data)
  const distanceChartData = React.useMemo(() => {
    const days =
      selectedPeriod === "week" ? 7 : selectedPeriod === "month" ? 30 : 12;
    const labels = [];
    const data = [];

    if (selectedPeriod === "year") {
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(
          date.getFullYear(),
          date.getMonth() + 1,
          0,
          23,
          59,
          59
        );

        const monthDistance = rides
          .filter((r) => {
            const rideDate = new Date(r.createdAt);
            return (
              rideDate >= monthStart &&
              rideDate <= monthEnd &&
              (r.status === "COMPLETED" || r.status === "FINISHED")
            );
          })
          .reduce((sum, r) => sum + (r.distance || 0), 0);

        labels.push(date.toLocaleDateString("vi-VN", { month: "short" }));
        data.push((monthDistance / 1000).toFixed(1)); // Convert to km
      }
    } else {
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));

        const dayDistance = rides
          .filter((r) => {
            const rideDate = new Date(r.createdAt);
            return (
              rideDate >= dayStart &&
              rideDate <= dayEnd &&
              (r.status === "COMPLETED" || r.status === "FINISHED")
            );
          })
          .reduce((sum, r) => sum + (r.distance || 0), 0);

        if (selectedPeriod === "week") {
          labels.push(
            date
              .toLocaleDateString("vi-VN", { weekday: "short" })
              .substring(0, 2)
          );
        } else if (selectedPeriod === "month") {
          if (i % 5 === 0 || i === days - 1)
            labels.push(date.getDate().toString());
          else labels.push("");
        }

        data.push((dayDistance / 1000).toFixed(1)); // Convert to km
      }
    }

    return { labels, data: data.map((d) => parseFloat(d)) };
  }, [rides, selectedPeriod]);

  // Average earnings per day chart
  const avgEarningsChartData = React.useMemo(() => {
    const days =
      selectedPeriod === "week" ? 7 : selectedPeriod === "month" ? 30 : 12;
    const labels = [];
    const data = [];

    if (selectedPeriod === "year") {
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(
          date.getFullYear(),
          date.getMonth() + 1,
          0,
          23,
          59,
          59
        );

        const monthRides = rides.filter((r) => {
          const rideDate = new Date(r.createdAt);
          return (
            rideDate >= monthStart &&
            rideDate <= monthEnd &&
            (r.status === "COMPLETED" || r.status === "FINISHED")
          );
        });

        const monthEarnings = monthRides.reduce(
          (sum, r) => sum + (r.coin || 0),
          0
        );
        const daysInMonth = new Date(
          date.getFullYear(),
          date.getMonth() + 1,
          0
        ).getDate();
        const avgPerDay =
          monthRides.length > 0 ? monthEarnings / daysInMonth : 0;

        labels.push(date.toLocaleDateString("vi-VN", { month: "short" }));
        data.push(avgPerDay);
      }
    } else {
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));

        const dayRides = rides.filter((r) => {
          const rideDate = new Date(r.createdAt);
          return (
            rideDate >= dayStart &&
            rideDate <= dayEnd &&
            (r.status === "COMPLETED" || r.status === "FINISHED")
          );
        });

        const dayEarnings = dayRides.reduce((sum, r) => sum + (r.coin || 0), 0);

        if (selectedPeriod === "week") {
          labels.push(
            date
              .toLocaleDateString("vi-VN", { weekday: "short" })
              .substring(0, 2)
          );
        } else if (selectedPeriod === "month") {
          if (i % 5 === 0 || i === days - 1)
            labels.push(date.getDate().toString());
          else labels.push("");
        }

        data.push(dayEarnings);
      }
    }

    return { labels, data };
  }, [rides, selectedPeriod]);

  // Toggle chart visibility
  const toggleChart = (chartId) => {
    setVisibleCharts((prev) => ({
      ...prev,
      [chartId]: !prev[chartId],
    }));
  };

  // Peak hours analysis
  const peakHoursData = React.useMemo(() => {
    const hourCounts = Array(24).fill(0);

    rides
      .filter((r) => r.status === "COMPLETED" || r.status === "FINISHED")
      .forEach((ride) => {
        const hour = new Date(ride.createdAt).getHours();
        hourCounts[hour]++;
      });

    const labels = [];
    const data = [];

    // Group by 4-hour periods
    for (let i = 0; i < 24; i += 4) {
      const periodSum = hourCounts.slice(i, i + 4).reduce((a, b) => a + b, 0);
      labels.push(`${i}h-${i + 4}h`);
      data.push(periodSum);
    }

    return { labels, data };
  }, [rides]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thống kê</Text>
        <TouchableOpacity
          style={styles.customizeButton}
          onPress={() => setCustomizeModalVisible(true)}
        >
          <Ionicons name="options" size={24} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.PRIMARY]}
          />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <LinearGradient
            colors={[COLORS.PRIMARY, "#00A8A8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <View style={styles.statIconWhite}>
              <Ionicons name="car" size={24} color="#fff" />
            </View>
            <Text style={styles.statValueWhite}>{stats.totalRides}</Text>
            <Text style={styles.statLabelWhite}>Chuyến hoàn thành</Text>
          </LinearGradient>

          <LinearGradient
            colors={["#FFC107", "#FF9800"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <View style={styles.statIconWhite}>
              <Ionicons name="wallet" size={24} color="#fff" />
            </View>
            <Text style={styles.statValueWhite}>{stats.totalEarnings}</Text>
            <Text style={styles.statLabelWhite}>Tổng coin</Text>
          </LinearGradient>

          <LinearGradient
            colors={["#4CAF50", "#2E7D32"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <View style={styles.statIconWhite}>
              <Ionicons name="star" size={24} color="#fff" />
            </View>
            <Text style={styles.statValueWhite}>
              {stats.averageRating.toFixed(1)}
            </Text>
            <Text style={styles.statLabelWhite}>Đánh giá TB</Text>
          </LinearGradient>

          <LinearGradient
            colors={["#2196F3", "#1976D2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <View style={styles.statIconWhite}>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
            </View>
            <Text style={styles.statValueWhite}>{stats.completionRate}%</Text>
            <Text style={styles.statLabelWhite}>Tỷ lệ hoàn thành</Text>
          </LinearGradient>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === "week" && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod("week")}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === "week" && styles.periodButtonTextActive,
              ]}
            >
              7 ngày
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === "month" && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod("month")}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === "month" && styles.periodButtonTextActive,
              ]}
            >
              30 ngày
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === "year" && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod("year")}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === "year" && styles.periodButtonTextActive,
              ]}
            >
              1 năm
            </Text>
          </TouchableOpacity>
        </View>

        {/* Earnings Chart */}
        {visibleCharts.earnings && (
          <View style={styles.chartSection}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Thu nhập theo thời gian</Text>
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: COLORS.PRIMARY },
                    ]}
                  />
                  <Text style={styles.legendText}>Coin</Text>
                </View>
              </View>
            </View>
            <View style={styles.chartCard}>
              <LineChart
                data={{
                  labels: earningsChartData.labels,
                  datasets: [
                    {
                      data:
                        earningsChartData.data.length > 0
                          ? earningsChartData.data
                          : [0],
                      color: (opacity = 1) => COLORS.PRIMARY,
                      strokeWidth: 3,
                    },
                  ],
                }}
                width={CHART_WIDTH - 32}
                height={220}
                chartConfig={{
                  backgroundColor: "#fff",
                  backgroundGradientFrom: "#fff",
                  backgroundGradientTo: "#fff",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 69, 83, ${opacity})`,
                  labelColor: (opacity = 1) =>
                    `rgba(142, 142, 147, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: "5",
                    strokeWidth: "2",
                    stroke: COLORS.PRIMARY,
                    fill: "#fff",
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: "",
                    stroke: "#F0F0F0",
                    strokeWidth: 1,
                  },
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
              />
            </View>
          </View>
        )}

        {/* Rides Count Bar Chart */}
        {visibleCharts.ridesCount && (
          <View style={styles.chartSection}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Số chuyến đi</Text>
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: "#4CAF50" }]}
                  />
                  <Text style={styles.legendText}>Chuyến</Text>
                </View>
              </View>
            </View>
            <View style={styles.chartCard}>
              <BarChart
                data={{
                  labels: earningsChartData.labels,
                  datasets: [
                    {
                      data: ridesChartData.length > 0 ? ridesChartData : [0],
                    },
                  ],
                }}
                width={CHART_WIDTH - 32}
                height={220}
                chartConfig={{
                  backgroundColor: "#fff",
                  backgroundGradientFrom: "#fff",
                  backgroundGradientTo: "#fff",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                  labelColor: (opacity = 1) =>
                    `rgba(142, 142, 147, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: "",
                    stroke: "#F0F0F0",
                    strokeWidth: 1,
                  },
                }}
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
                showValuesOnTopOfBars
              />
            </View>
          </View>
        )}

        {/* Performance Progress Chart */}
        {visibleCharts.performance && (
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>Hiệu suất</Text>
            <View style={styles.chartCard}>
              <ProgressChart
                data={performanceData}
                width={CHART_WIDTH - 32}
                height={220}
                strokeWidth={16}
                radius={32}
                chartConfig={{
                  backgroundColor: "#fff",
                  backgroundGradientFrom: "#fff",
                  backgroundGradientTo: "#fff",
                  decimalPlaces: 2,
                  color: (opacity = 1, index) => {
                    const colors = [COLORS.PRIMARY, "#4CAF50", "#FF9800"];
                    return colors[index] || COLORS.PRIMARY;
                  },
                  labelColor: (opacity = 1) => `rgba(28, 28, 30, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                }}
                hideLegend={false}
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
              />
            </View>
          </View>
        )}

        {/* Status Distribution Pie Chart */}
        {visibleCharts.statusDistribution && statusDistribution.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>Phân bổ trạng thái</Text>
            <View style={styles.chartCard}>
              <PieChart
                data={statusDistribution}
                width={CHART_WIDTH - 32}
                height={220}
                chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
              />
            </View>
          </View>
        )}

        {/* Peak Hours Analysis */}
        {visibleCharts.peakHours && (
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>Giờ cao điểm</Text>
            <View style={styles.chartCard}>
              <BarChart
                data={{
                  labels: peakHoursData.labels,
                  datasets: [
                    {
                      data:
                        peakHoursData.data.length > 0
                          ? peakHoursData.data
                          : [0],
                    },
                  ],
                }}
                width={CHART_WIDTH - 32}
                height={220}
                chartConfig={{
                  backgroundColor: "#fff",
                  backgroundGradientFrom: "#fff",
                  backgroundGradientTo: "#fff",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
                  labelColor: (opacity = 1) =>
                    `rgba(142, 142, 147, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: "",
                    stroke: "#F0F0F0",
                    strokeWidth: 1,
                  },
                }}
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
                showValuesOnTopOfBars
              />
            </View>
          </View>
        )}

        {/* Distance Chart */}
        {visibleCharts.distance && (
          <View style={styles.chartSection}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Quãng đường (km)</Text>
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: "#9C27B0" }]}
                  />
                  <Text style={styles.legendText}>Km</Text>
                </View>
              </View>
            </View>
            <View style={styles.chartCard}>
              <LineChart
                data={{
                  labels: distanceChartData.labels,
                  datasets: [
                    {
                      data:
                        distanceChartData.data.length > 0
                          ? distanceChartData.data
                          : [0],
                      color: (opacity = 1) => `rgba(156, 39, 176, ${opacity})`,
                      strokeWidth: 3,
                    },
                  ],
                }}
                width={CHART_WIDTH - 32}
                height={220}
                chartConfig={{
                  backgroundColor: "#fff",
                  backgroundGradientFrom: "#fff",
                  backgroundGradientTo: "#fff",
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(156, 39, 176, ${opacity})`,
                  labelColor: (opacity = 1) =>
                    `rgba(142, 142, 147, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: "5",
                    strokeWidth: "2",
                    stroke: "#9C27B0",
                    fill: "#fff",
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: "",
                    stroke: "#F0F0F0",
                    strokeWidth: 1,
                  },
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
              />
            </View>
          </View>
        )}

        {/* Average Earnings Chart */}
        {visibleCharts.avgEarnings && (
          <View style={styles.chartSection}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Thu nhập TB/ngày</Text>
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: "#00BCD4" }]}
                  />
                  <Text style={styles.legendText}>Coin</Text>
                </View>
              </View>
            </View>
            <View style={styles.chartCard}>
              <BarChart
                data={{
                  labels: avgEarningsChartData.labels,
                  datasets: [
                    {
                      data:
                        avgEarningsChartData.data.length > 0
                          ? avgEarningsChartData.data
                          : [0],
                    },
                  ],
                }}
                width={CHART_WIDTH - 32}
                height={220}
                chartConfig={{
                  backgroundColor: "#fff",
                  backgroundGradientFrom: "#fff",
                  backgroundGradientTo: "#fff",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 188, 212, ${opacity})`,
                  labelColor: (opacity = 1) =>
                    `rgba(142, 142, 147, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: "",
                    stroke: "#F0F0F0",
                    strokeWidth: 1,
                  },
                }}
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
                showValuesOnTopOfBars
              />
            </View>
          </View>
        )}

        {/* Quick Insights */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Thông tin chi tiết</Text>

          {/* Insights Grid */}
          <View style={styles.insightsGrid}>
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Ionicons name="trending-up" size={20} color={COLORS.PRIMARY} />
                <Text style={styles.insightTitle}>Trong kỳ</Text>
              </View>
              <Text style={styles.insightValue}>{stats.periodRides}</Text>
              <Text style={styles.insightLabel}>chuyến đi</Text>
            </View>

            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Ionicons name="close-circle" size={20} color="#F44336" />
                <Text style={styles.insightTitle}>Đã hủy</Text>
              </View>
              <Text style={[styles.insightValue, { color: "#F44336" }]}>
                {stats.cancelledRides}
              </Text>
              <Text style={styles.insightLabel}>chuyến</Text>
            </View>

            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Ionicons name="cash" size={20} color="#4CAF50" />
                <Text style={styles.insightTitle}>TB/chuyến</Text>
              </View>
              <Text style={[styles.insightValue, { color: "#4CAF50" }]}>
                {stats.totalRides > 0
                  ? (stats.totalEarnings / stats.totalRides).toFixed(0)
                  : 0}
              </Text>
              <Text style={styles.insightLabel}>coin</Text>
            </View>

            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Ionicons name="time" size={20} color="#FF9800" />
                <Text style={styles.insightTitle}>Hôm nay</Text>
              </View>
              <Text style={[styles.insightValue, { color: "#FF9800" }]}>
                {
                  rides.filter((r) => {
                    const today = new Date();
                    const rideDate = new Date(r.createdAt);
                    return (
                      rideDate.toDateString() === today.toDateString() &&
                      (r.status === "COMPLETED" || r.status === "FINISHED")
                    );
                  }).length
                }
              </Text>
              <Text style={styles.insightLabel}>chuyến</Text>
            </View>
          </View>

          {/* Performance Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Ionicons name="analytics" size={24} color={COLORS.PRIMARY} />
              <Text style={styles.summaryTitle}>Tóm tắt hiệu suất</Text>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Tổng chuyến</Text>
                <Text style={styles.summaryValue}>{stats.totalRides}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Tổng thu nhập</Text>
                <Text style={[styles.summaryValue, { color: "#4CAF50" }]}>
                  {stats.totalEarnings}
                </Text>
              </View>
            </View>

            <View style={styles.summaryDividerHorizontal} />

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Đánh giá</Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#FFB800" />
                  <Text style={styles.summaryValue}>
                    {stats.averageRating.toFixed(1)}
                  </Text>
                </View>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Hoàn thành</Text>
                <Text style={[styles.summaryValue, { color: COLORS.PRIMARY }]}>
                  {stats.completionRate}%
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Customize Charts Modal */}
      <Modal
        visible={customizeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCustomizeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tùy chỉnh biểu đồ</Text>
              <TouchableOpacity onPress={() => setCustomizeModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1C1C1E" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalDescription}>
                Chọn biểu đồ bạn muốn hiển thị
              </Text>

              {AVAILABLE_CHARTS.map((chart) => (
                <View key={chart.id} style={styles.chartOption}>
                  <View style={styles.chartOptionLeft}>
                    <Ionicons
                      name={chart.icon}
                      size={24}
                      color={COLORS.PRIMARY}
                    />
                    <Text style={styles.chartOptionText}>{chart.name}</Text>
                  </View>
                  <Switch
                    value={visibleCharts[chart.id]}
                    onValueChange={() => toggleChart(chart.id)}
                    trackColor={{
                      false: "#E5E5EA",
                      true: COLORS.PRIMARY + "40",
                    }}
                    thumbColor={
                      visibleCharts[chart.id] ? COLORS.PRIMARY : "#f4f3f4"
                    }
                  />
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setCustomizeModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Xong</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  customizeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARY + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
  },

  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
  },
  statCard: {
    width: (width - 44) / 2,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statIconWhite: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  statValueWhite: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: "#8E8E93",
    textAlign: "center",
  },
  statLabelWhite: {
    fontSize: 13,
    color: "#FFFFFF",
    textAlign: "center",
    opacity: 0.9,
  },

  // Period Selector
  periodSelector: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
  },
  periodButtonTextActive: {
    color: "#fff",
  },

  // Chart Section
  chartSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  chartLegend: {
    flexDirection: "row",
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: "#8E8E93",
    fontWeight: "600",
  },
  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },

  // Summary Section
  summarySection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 16,
  },

  // Insights Grid
  insightsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  insightCard: {
    width: (width - 52) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8E8E93",
  },
  insightValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  insightLabel: {
    fontSize: 12,
    color: "#8E8E93",
  },

  // Summary Card
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 13,
    color: "#8E8E93",
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E5E5EA",
  },
  summaryDividerHorizontal: {
    height: 1,
    backgroundColor: "#E5E5EA",
    marginVertical: 16,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  modalBody: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 20,
  },
  chartOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  chartOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  chartOptionText: {
    fontSize: 16,
    color: "#1C1C1E",
    fontWeight: "500",
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  modalButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

export default DriverStatistics;
