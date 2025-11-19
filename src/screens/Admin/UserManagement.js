import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constant/colors";

const roleFilters = [
  { key: "all", label: "Tất cả" },
  { key: "driver", label: "Tài xế" },
  { key: "passenger", label: "Hành khách" },
  { key: "flagged", label: "Bị cảnh báo" },
];

const statusStyles = {
  active: {
    label: "Hoạt động",
    color: COLORS.GREEN,
    background: COLORS.GREEN_LIGHT,
  },
  suspended: {
    label: "Tạm khóa",
    color: COLORS.ORANGE_DARK,
    background: COLORS.ORANGE_LIGHT,
  },
  flagged: {
    label: "Bị cảnh báo",
    color: COLORS.RED,
    background: COLORS.RED_LIGHT,
  },
};

const initialUsers = [
  {
    id: "USR-1001",
    name: "Nguyễn Văn A",
    phone: "0901 234 567",
    role: "driver",
    status: "pending",
    completedTrips: 42,
    rating: 4.8,
  },
  {
    id: "USR-1002",
    name: "Trần Thị B",
    phone: "0908 765 432",
    role: "passenger",
    status: "active",
    completedTrips: 18,
    rating: 4.6,
  },
  {
    id: "USR-1003",
    name: "Lê Văn C",
    phone: "0912 345 678",
    role: "driver",
    status: "flagged",
    completedTrips: 5,
    rating: 3.4,
  },
  {
    id: "USR-1004",
    name: "Phạm Thị D",
    phone: "0933 456 789",
    role: "passenger",
    status: "active",
    completedTrips: 27,
    rating: 4.9,
  },
];

const UserManagement = () => {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState(initialUsers);

  const listDescriptor = useMemo(() => {
    return users
      .filter((user) => {
        if (filter === "all") return true;
        if (filter === "flagged") return user.status === "flagged";
        return user.role === filter;
      })
      .filter((user) => {
        if (!search.trim()) return true;
        const keyword = search.trim().toLowerCase();
        return (
          user.name.toLowerCase().includes(keyword) ||
          user.phone.toLowerCase().includes(keyword) ||
          user.id.toLowerCase().includes(keyword)
        );
      });
  }, [filter, search, users]);

  const handleStatusChange = (userId, nextStatus) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? {
              ...user,
              status: nextStatus,
            }
          : user
      )
    );
  };

  const renderActions = (user) => {
    if (user.status === "flagged") {
      return (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.restoreButton]}
            onPress={() => handleStatusChange(user.id, "active")}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.WHITE} />
            <Text style={styles.actionLabel}>Gỡ cảnh báo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.suspendButton]}
            onPress={() => handleStatusChange(user.id, "suspended")}
          >
            <Ionicons name="close-circle-outline" size={18} color={COLORS.WHITE} />
            <Text style={styles.actionLabel}>Khóa tài khoản</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (user.status === "suspended") {
      return (
        <TouchableOpacity
          style={[styles.actionButton, styles.restoreButton]}
          onPress={() => handleStatusChange(user.id, "active")}
        >
          <Ionicons name="refresh" size={18} color={COLORS.WHITE} />
          <Text style={styles.actionLabel}>Mở khóa</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.actionButton, styles.suspendButton]}
        onPress={() => handleStatusChange(user.id, "flagged")}
      >
        <Ionicons name="alert-circle-outline" size={18} color={COLORS.WHITE} />
        <Text style={styles.actionLabel}>Đánh dấu cảnh báo</Text>
      </TouchableOpacity>
    );
  };

  const renderUserItem = ({ item }) => {
    const style = statusStyles[item.status] || statusStyles.active;
    return (
      <View style={styles.userCard}>
        <View style={styles.userHeader}>
          <View>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userId}>{item.id}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: style.background }]}
          >
            <Text style={[styles.badgeLabel, { color: style.color }]}>{style.label}</Text>
          </View>
        </View>

        <View style={styles.userInfoRow}>
          <Ionicons name="call-outline" size={16} color={COLORS.GRAY} />
          <Text style={styles.userInfoText}>{item.phone}</Text>
        </View>
        <View style={styles.userInfoRow}>
          <Ionicons name="briefcase-outline" size={16} color={COLORS.GRAY} />
          <Text style={styles.userInfoText}>
            Vai trò: {item.role === "driver" ? "Tài xế" : "Hành khách"}
          </Text>
        </View>
        <View style={styles.userStatsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{item.completedTrips}</Text>
            <Text style={styles.statLabel}>Chuyến hoàn thành</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{item.rating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Đánh giá trung bình</Text>
          </View>
        </View>

        <View style={styles.actionContainer}>{renderActions(item)}</View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Quản lý người dùng</Text>
        <Text style={styles.subtitle}>
          Giám sát trạng thái tài khoản và đảm bảo an toàn nền tảng
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={COLORS.GRAY} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm theo tên, số điện thoại hoặc mã người dùng"
          placeholderTextColor={COLORS.GRAY}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterRow}>
        {roleFilters.map((item) => {
          const active = filter === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setFilter(item.key)}
            >
              <Text style={[styles.filterChipLabel, active && styles.filterChipLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={listDescriptor}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={COLORS.GRAY} />
            <Text style={styles.emptyTitle}>Không có người dùng phù hợp</Text>
            <Text style={styles.emptyDescription}>
              Điều chỉnh tiêu chí lọc hoặc kiểm tra lại sau.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: COLORS.GRAY,
    lineHeight: 20,
  },
  searchContainer: {
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: COLORS.WHITE,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.BLACK,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 12,
  },
  filterChip: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
  },
  filterChipActive: {
    borderColor: COLORS.BLUE,
    backgroundColor: COLORS.BLUE_LIGHT,
  },
  filterChipLabel: {
    fontSize: 13,
    color: COLORS.GRAY,
  },
  filterChipLabelActive: {
    color: COLORS.BLUE,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  userCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  userHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  userId: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.GRAY,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  userInfoText: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  userStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.BG,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginTop: 4,
  },
  actionContainer: {
    marginTop: 16,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 6,
  },
  restoreButton: {
    flex: 1,
    backgroundColor: COLORS.GREEN,
  },
  suspendButton: {
    flex: 1,
    backgroundColor: COLORS.ORANGE_DARK,
  },
  actionLabel: {
    fontSize: 13,
    color: COLORS.WHITE,
    fontWeight: "600",
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.BLACK,
  },
  emptyDescription: {
    fontSize: 13,
    color: COLORS.GRAY,
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 18,
  },
});

export default UserManagement;

