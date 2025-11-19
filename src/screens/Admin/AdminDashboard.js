import React, { useMemo } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constant/colors";

const AdminDashboard = ({ navigation }) => {
  const metrics = useMemo(
    () => [
      {
        key: "activeTrips",
        label: "Chuyến đi đang hoạt động",
        value: "12",
        trend: "+3 tuần này",
        icon: "car-outline",
        color: COLORS.BLUE,
        background: COLORS.BLUE_LIGHT,
      },
      {
        key: "newUsers",
        label: "Người dùng mới",
        value: "48",
        trend: "+12%",
        icon: "people-outline",
        color: COLORS.GREEN,
        background: COLORS.GREEN_LIGHT,
      },
      {
        key: "pendingReports",
        label: "Báo cáo chờ xử lý",
        value: "7",
        trend: "4 ưu tiên cao",
        icon: "warning-outline",
        color: COLORS.ORANGE_DARK,
        background: COLORS.ORANGE_LIGHT,
      },
    ],
    []
  );

  const managementModules = useMemo(
    () => [
      {
        title: "Quản lý chuyến đi",
        description: "Duyệt, theo dõi và điều chỉnh các chuyến đi",
        icon: "navigate-outline",
        color: COLORS.BLUE,
      },
      {
        title: "Quản lý người dùng",
        description: "Cập nhật trạng thái tài khoản và quyền hạn",
        icon: "person-circle-outline",
        color: COLORS.GREEN,
      },
      {
        title: "Xử lý báo cáo",
        description: "Theo dõi khiếu nại và phản hồi từ người dùng",
        icon: "alert-circle-outline",
        color: COLORS.ORANGE,
      },
      {
        title: "Đổi thưởng",
        description: "Quản lý ưu đãi và chương trình tích điểm",
        icon: "gift-outline",
        color: COLORS.PURPLE,
      },
      {
        title: "Thông tin cá nhân",
        description: "Cập nhật hồ sơ và bảo mật tài khoản quản trị",
        icon: "settings-outline",
        color: COLORS.SECONDARY,
      },
    ],
    []
  );

  const recentActivities = useMemo(
    () => [
      {
        id: "activity-1",
        title: "Đã duyệt chuyến đi RM-2024-109",
        timestamp: "10 phút trước",
      },
      {
        id: "activity-2",
        title: "Khóa tạm thời tài khoản Nguyễn A",
        timestamp: "35 phút trước",
      },
      {
        id: "activity-3",
        title: "Đánh dấu đã xử lý báo cáo #482",
        timestamp: "1 giờ trước",
      },
    ],
    []
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Chào mừng trở lại,</Text>
            <Text style={styles.adminName}>Quản trị viên RideMate</Text>
          </View>
          <Ionicons name="shield-checkmark" size={32} color={COLORS.BLUE} />
        </View>

        <View style={styles.metricWrapper}>
          {metrics.map((metric) => (
            <View key={metric.key} style={[styles.metricCard, { backgroundColor: metric.background }]}>
              <View style={[styles.metricIconWrapper, { backgroundColor: metric.color }]}>
                <Ionicons name={metric.icon} size={22} color={COLORS.WHITE} />
              </View>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={styles.metricLabel}>{metric.label}</Text>
              <Text style={styles.metricTrend}>{metric.trend}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chức năng quản lý</Text>
          <View style={styles.moduleGrid}>
            {managementModules.map((module) => (
              <View
                key={module.title}
                style={styles.moduleCard}
              >
                <View style={[styles.moduleIconWrapper, { backgroundColor: module.color }]}>
                  <Ionicons name={module.icon} size={26} color={COLORS.WHITE} />
                </View>
                <View style={styles.moduleContent}>
                  <Text style={styles.moduleTitle}>{module.title}</Text>
                  <Text style={styles.moduleDescription}>{module.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={COLORS.GRAY} />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Hoạt động gần đây</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.activityList}>
            {recentActivities.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons name="time-outline" size={20} color={COLORS.BLUE} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityTimestamp}>{activity.timestamp}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: COLORS.GRAY,
    marginBottom: 4,
  },
  adminName: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  metricWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: "30%",
    padding: 16,
    borderRadius: 16,
    marginBottom: 4,
  },
  metricIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  metricLabel: {
    fontSize: 13,
    color: COLORS.GRAY,
    marginTop: 6,
  },
  metricTrend: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginTop: 4,
  },
  section: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.BLACK,
    marginBottom: 16,
  },
  moduleGrid: {
    gap: 12,
  },
  moduleCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  moduleIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  moduleContent: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.BLACK,
    marginBottom: 4,
  },
  moduleDescription: {
    fontSize: 13,
    color: COLORS.GRAY,
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  viewAll: {
    fontSize: 13,
    color: COLORS.BLUE,
    fontWeight: "600",
  },
  activityList: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    paddingVertical: 12,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.BLUE_LIGHT,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.BLACK,
  },
  activityTimestamp: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.GRAY,
  },
});

export default AdminDashboard;

