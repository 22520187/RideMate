import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constant/colors";
import * as adminService from "../../services/adminService";
import { unwrapApiData } from "../../utils/unwrapApiData";
import SCREENS from "../index";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const filterTabs = [
  { key: "all", label: "Tất cả", icon: "people-outline" },
  { key: "DRIVER", label: "Tài xế", icon: "car-outline" },
  { key: "PASSENGER", label: "Hành khách", icon: "person-outline" },
  { key: "PENDING", label: "Chờ duyệt", icon: "time-outline" },
  { key: "ADMIN", label: "Admin", icon: "shield-checkmark-outline" },
];

const UserManagement = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingUserId, setSubmittingUserId] = useState(null);
  const [selectedTab, setSelectedTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchUsers = useCallback(async (pageNum = 0, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (pageNum === 0) {
        setLoading(true);
      }

      // Special tab: pending drivers (fast list, no pagination)
      if (selectedTab === "PENDING") {
        const res = await adminService.getPendingDrivers();
        const payload = unwrapApiData(res);
        const list = Array.isArray(payload) ? payload : [];

        const q = searchQuery.trim().toLowerCase();
        const filtered =
          q.length === 0
            ? list
            : list.filter((u) => {
                const fullName = (u.fullName || "").toLowerCase();
                const phone = (u.phoneNumber || "").toLowerCase();
                const email = (u.email || "").toLowerCase();
                return (
                  fullName.includes(q) || phone.includes(q) || email.includes(q)
                );
              });

        setUsers(filtered);
        setHasMore(false);
        setPage(0);
        return;
      }

      // Other tabs: pageable /admin/users with userType filter
      const userType = selectedTab === "all" ? null : selectedTab;
      const response = await adminService.getAllUsers({
        userType,
        searchTerm: searchQuery,
        page: pageNum,
        size: 20,
      });

      const pageData = unwrapApiData(response) || {};
      const usersData = Array.isArray(pageData?.content)
        ? pageData.content
        : Array.isArray(pageData?.users)
        ? pageData.users
        : [];
      const totalPages =
        typeof pageData?.totalPages === "number" ? pageData.totalPages : 1;

      if (refresh || pageNum === 0) {
        setUsers(usersData);
      } else {
        setUsers((prev) => [...prev, ...usersData]);
      }

      setHasMore(pageNum < totalPages - 1);
      setPage(pageNum);
    } catch (error) {
      console.error("Error fetching users:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedTab, searchQuery]);

  const fetchStatistics = useCallback(async () => {
    try {
      const res = await adminService.getUserStatistics();
      const stats = unwrapApiData(res);
      setStatistics(stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  }, []);

  useEffect(() => {
    fetchUsers(0);
    fetchStatistics();
  }, [selectedTab, searchQuery]);

  const onRefresh = useCallback(() => {
    fetchUsers(0, true);
    fetchStatistics();
  }, [fetchUsers, fetchStatistics]);

  const loadMore = useCallback(() => {
    if (selectedTab === "PENDING") return;
    if (!loading && hasMore) {
      fetchUsers(page + 1);
    }
  }, [selectedTab, loading, hasMore, page, fetchUsers]);

  const handleUserPress = (user) => {
    navigation.navigate(SCREENS.ADMIN_USER_DETAIL, { userId: user.id, user });
  };

  const approveDriver = useCallback(
    (user) => {
      if (!user?.id) return;
      Alert.alert("Duyệt tài xế", `Duyệt tài xế "${user.fullName}"?`, [
        { text: "Hủy", style: "cancel" },
        {
          text: "Duyệt",
          onPress: async () => {
            try {
              setSubmittingUserId(user.id);
              await adminService.approveDriver(user.id);
              Alert.alert("Thành công", "Đã duyệt tài xế.");
              fetchUsers(0, true);
              fetchStatistics();
            } catch (e) {
              console.error("Approve driver error:", e);
              Alert.alert("Lỗi", "Không thể duyệt tài xế.");
            } finally {
              setSubmittingUserId(null);
            }
          },
        },
      ]);
    },
    [fetchUsers, fetchStatistics]
  );

  const rejectDriver = useCallback(
    (user) => {
      if (!user?.id) return;

      const doReject = async (rejectionReason) => {
        try {
          setSubmittingUserId(user.id);
          await adminService.rejectDriver(user.id, { rejectionReason });
          Alert.alert("Thành công", "Đã từ chối duyệt.");
          fetchUsers(0, true);
          fetchStatistics();
        } catch (e) {
          console.error("Reject driver error:", e);
          Alert.alert("Lỗi", "Không thể từ chối duyệt.");
        } finally {
          setSubmittingUserId(null);
        }
      };

      Alert.alert("Từ chối duyệt", `Chọn lý do từ chối "${user.fullName}"`, [
        { text: "Hủy", style: "cancel" },
        { text: "Thiếu giấy tờ", onPress: () => doReject("Thiếu giấy tờ") },
        {
          text: "Thông tin không hợp lệ",
          onPress: () => doReject("Thông tin không hợp lệ"),
        },
      ]);
    },
    [fetchUsers, fetchStatistics]
  );

  const getStatusStyle = (isActive, driverApprovalStatus) => {
    if (!isActive) {
      return {
        label: "Bị khóa",
        color: "#F44336",
        bg: "#FFEBEE",
      };
    }
    if (driverApprovalStatus === "PENDING") {
      return {
        label: "Chờ duyệt",
        color: "#FF9800",
        bg: "#FFF3E0",
      };
    }
    return {
      label: "Hoạt động",
      color: "#4CAF50",
      bg: "#E8F5E9",
    };
  };

  const renderStatCard = (icon, label, value, color) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.statIconContainer, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statInfo}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.headerTitle}>Quản lý người dùng</Text>
          <Text style={styles.headerSubtitle}>
            {statistics?.totalUsers || 0} người dùng
          </Text>
        </View>
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        {renderStatCard(
          "people",
          "Tổng người dùng",
          statistics?.totalUsers || 0,
          COLORS.PRIMARY
        )}
        {renderStatCard(
          "car",
          "Tài xế",
          statistics?.totalDrivers || 0,
          "#4CAF50"
        )}
        {renderStatCard(
          "person",
          "Hành khách",
          statistics?.totalPassengers || 0,
          "#FF9800"
        )}
        {renderStatCard(
          "time",
          "Chờ duyệt",
          statistics?.pendingDriverApprovals || 0,
          "#F44336"
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.GRAY} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm theo tên, số điện thoại..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.GRAY}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color={COLORS.GRAY} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterTabs}
      >
        {filterTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.filterTab,
              selectedTab === tab.key && styles.filterTabActive,
            ]}
            onPress={() => setSelectedTab(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={18}
              color={selectedTab === tab.key ? "#FFFFFF" : COLORS.GRAY}
            />
            <Text
              style={[
                styles.filterTabText,
                selectedTab === tab.key && styles.filterTabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderUserCard = ({ item }) => {
    const status = getStatusStyle(item.isActive, item.driverApprovalStatus);
    const isPending = item.driverApprovalStatus === "PENDING";
    const isSubmittingThis = submittingUserId === item.id;

    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => handleUserPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.userCardHeader}>
          <View style={styles.userAvatar}>
            {item.profilePictureUrl ? (
              <Image
                source={{ uri: item.profilePictureUrl }}
                style={styles.avatarImage}
              />
            ) : (
              <Ionicons name="person" size={24} color={COLORS.GRAY} />
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.fullName}</Text>
            <Text style={styles.userPhone}>{item.phoneNumber}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        <View style={styles.userCardFooter}>
          <View style={styles.userStat}>
            <Ionicons
              name={
                item.userType === "DRIVER"
                  ? "car"
                  : item.userType === "ADMIN"
                  ? "shield-checkmark"
                  : "person"
              }
              size={16}
              color={COLORS.PRIMARY}
            />
            <Text style={styles.userStatText}>
              {item.userType === "DRIVER"
                ? "Tài xế"
                : item.userType === "ADMIN"
                ? "Admin"
                : "Hành khách"}
            </Text>
          </View>

          <View style={styles.userStat}>
            <Ionicons name="star" size={16} color="#FFB300" />
            <Text style={styles.userStatText}>
              {item.rating?.toFixed(1) || "N/A"}
            </Text>
          </View>

          <View style={styles.userStat}>
            <Ionicons name="wallet" size={16} color="#4CAF50" />
            <Text style={styles.userStatText}>{item.coins || 0} xu</Text>
          </View>

          {selectedTab === "PENDING" && isPending ? (
            <View style={styles.pendingActions}>
              <TouchableOpacity
                style={[styles.pendingButton, styles.approveSmall]}
                onPress={() => approveDriver(item)}
                disabled={isSubmittingThis}
              >
                <Ionicons
                  name="checkmark"
                  size={16}
                  color={COLORS.WHITE}
                />
                <Text style={styles.pendingButtonText}>Duyệt</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pendingButton, styles.rejectSmall]}
                onPress={() => rejectDriver(item)}
                disabled={isSubmittingThis}
              >
                <Ionicons name="close" size={16} color={COLORS.WHITE} />
                <Text style={styles.pendingButtonText}>Từ chối</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <TouchableOpacity style={styles.viewButton}>
            <Ionicons name="chevron-forward" size={20} color={COLORS.PRIMARY} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color={COLORS.GRAY} />
      <Text style={styles.emptyText}>Không tìm thấy người dùng</Text>
      <Text style={styles.emptySubtext}>
        {searchQuery
          ? "Thử tìm kiếm với từ khóa khác"
          : "Chưa có người dùng nào trong hệ thống"}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading || page === 0) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.PRIMARY} />
      </View>
    );
  };

  if (loading && page === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FlatList
        data={users}
        renderItem={renderUserCard}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
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
  listContent: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 20,
    paddingBottom: 16,
    marginBottom: 12,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.BLACK,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - 52) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.BLACK,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.GRAY,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.BLACK,
    marginLeft: 8,
  },
  filterTabs: {
    paddingHorizontal: 20,
    paddingBottom: 4,
    gap: 8,
    alignItems: "center",
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.GRAY,
  },
  filterTabTextActive: {
    color: "#FFFFFF",
  },
  userCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  userCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.BLACK,
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  userCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  pendingActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginLeft: 6,
  },
  pendingButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  approveSmall: {
    backgroundColor: COLORS.GREEN,
  },
  rejectSmall: {
    backgroundColor: COLORS.RED,
  },
  pendingButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.WHITE,
  },
  userStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  userStatText: {
    fontSize: 13,
    color: COLORS.GRAY,
    fontWeight: "500",
  },
  viewButton: {
    marginLeft: "auto",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.BLACK,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.GRAY,
    textAlign: "center",
  },
  footerLoader: {
    paddingVertical: 20,
  },
});

export default UserManagement;
