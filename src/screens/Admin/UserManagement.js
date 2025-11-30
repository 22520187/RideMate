import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constant/colors";
import SCREENS from "../../screens";

const roleFilters = [
  { key: "all", label: "Tất cả" },
  { key: "flagged", label: "Bị cảnh báo" },
  { key: "banned", label: "Bị cấm" },
  { key: "licenses", label: "Duyệt đơn" },
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
  banned: {
    label: "Bị cấm",
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

const initialLicenseApplications = [
  {
    id: "LIC-001",
    userId: "USR-1005",
    userName: "Nguyễn Văn E",
    phone: "0911 222 333",
    licenseNumber: "A987654321",
    expiryDate: "20/12/2027",
    submittedDate: "13/11/2024 • 10:30",
    licenseImage: "https://via.placeholder.com/400x250/4A90E2/FFFFFF?text=Driver+License+Image", // URL to image
    status: "pending",
  },
  {
    id: "LIC-002",
    userId: "USR-1006",
    userName: "Trần Văn F",
    phone: "0922 333 444",
    licenseNumber: "B123456789",
    expiryDate: "15/08/2026",
    submittedDate: "12/11/2024 • 14:20",
    licenseImage: "https://via.placeholder.com/400x250/4A90E2/FFFFFF?text=Driver+License+Image",
    status: "pending",
  },
  {
    id: "LIC-003",
    userId: "USR-1007",
    userName: "Lê Thị G",
    phone: "0933 444 555",
    licenseNumber: "C456789012",
    expiryDate: "10/05/2028",
    submittedDate: "11/11/2024 • 09:15",
    licenseImage: "https://via.placeholder.com/400x250/4A90E2/FFFFFF?text=Driver+License+Image",
    status: "pending",
  },
];

const UserManagement = () => {
  const navigation = useNavigation();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState(initialUsers);
  const [licenseApplications, setLicenseApplications] = useState(initialLicenseApplications);

  const pendingLicenses = useMemo(() => {
    return licenseApplications.filter((app) => app.status === "pending");
  }, [licenseApplications]);

  const listDescriptor = useMemo(() => {
    if (filter === "licenses") {
      return pendingLicenses
        .filter((app) => {
          if (!search.trim()) return true;
          const keyword = search.trim().toLowerCase();
          return (
            app.userName.toLowerCase().includes(keyword) ||
            app.phone.toLowerCase().includes(keyword) ||
            app.userId.toLowerCase().includes(keyword) ||
            app.licenseNumber.toLowerCase().includes(keyword)
          );
        })
        .map((app) => ({ ...app, type: "license" }));
    }

    const filteredUsers = users
      .filter((user) => {
        if (filter === "all") return true;
        if (filter === "flagged") return user.status === "flagged";
        if (filter === "banned") return user.status === "banned";
        return false;
      })
      .filter((user) => {
        if (!search.trim()) return true;
        const keyword = search.trim().toLowerCase();
        return (
          user.name.toLowerCase().includes(keyword) ||
          user.phone.toLowerCase().includes(keyword) ||
          user.id.toLowerCase().includes(keyword)
        );
      })
      .map((user) => ({ ...user, type: "user" }));

    // Khi filter là "all", thêm cả đơn bằng lái xe vào danh sách
    if (filter === "all") {
      const filteredLicenses = pendingLicenses
        .filter((app) => {
          if (!search.trim()) return true;
          const keyword = search.trim().toLowerCase();
          return (
            app.userName.toLowerCase().includes(keyword) ||
            app.phone.toLowerCase().includes(keyword) ||
            app.userId.toLowerCase().includes(keyword) ||
            app.licenseNumber.toLowerCase().includes(keyword)
          );
        })
        .map((app) => ({ ...app, type: "license" }));
      
      return [...filteredUsers, ...filteredLicenses];
    }

    return filteredUsers;
  }, [filter, search, users, pendingLicenses]);

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

  const handleUserPress = (user) => {
    navigation.navigate(SCREENS.ADMIN_USER_DETAIL, { user });
  };

  const handleLicenseAction = (licenseId, action) => {
    Alert.alert(
      action === "approve" ? "Duyệt bằng lái xe" : "Từ chối bằng lái xe",
      action === "approve"
        ? "Bạn có chắc chắn muốn duyệt đơn này?"
        : "Bạn có chắc chắn muốn từ chối đơn này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: action === "approve" ? "Duyệt" : "Từ chối",
          style: action === "reject" ? "destructive" : "default",
          onPress: () => {
            setLicenseApplications((prev) =>
              prev.map((app) =>
                app.id === licenseId
                  ? { ...app, status: action === "approve" ? "approved" : "rejected" }
                  : app
              )
            );
            // Trong thực tế, sẽ gọi API để cập nhật
          },
        },
      ]
    );
  };

  const renderLicenseItem = ({ item }) => (
    <View style={styles.licenseCard}>
      <View style={styles.licenseHeader}>
        <View>
          <Text style={styles.licenseUserName}>{item.userName}</Text>
          <Text style={styles.licenseUserId}>{item.userId}</Text>
        </View>
        <View style={[styles.licenseStatusBadge, { backgroundColor: COLORS.ORANGE_LIGHT }]}>
          <Text style={[styles.licenseStatusText, { color: COLORS.ORANGE_DARK }]}>
            Chờ duyệt
          </Text>
        </View>
      </View>

      <View style={styles.licenseInfoRow}>
        <Ionicons name="call-outline" size={16} color={COLORS.GRAY} />
        <Text style={styles.licenseInfoText}>{item.phone}</Text>
      </View>
      <View style={styles.licenseInfoRow}>
        <Ionicons name="card-outline" size={16} color={COLORS.GRAY} />
        <Text style={styles.licenseInfoText}>Số bằng: {item.licenseNumber}</Text>
      </View>
      <View style={styles.licenseInfoRow}>
        <Ionicons name="calendar-outline" size={16} color={COLORS.GRAY} />
        <Text style={styles.licenseInfoText}>Hết hạn: {item.expiryDate}</Text>
      </View>
      <View style={styles.licenseInfoRow}>
        <Ionicons name="time-outline" size={16} color={COLORS.GRAY} />
        <Text style={styles.licenseInfoText}>Gửi: {item.submittedDate}</Text>
      </View>

      {item.licenseImage && (
        <View style={styles.licenseImageContainer}>
          <Text style={styles.licenseImageLabel}>Ảnh bằng lái xe:</Text>
          <Image
            source={{ uri: item.licenseImage }}
            style={styles.licenseImage}
            resizeMode="contain"
          />
        </View>
      )}

      <View style={styles.licenseActions}>
        <TouchableOpacity
          style={[styles.licenseActionButton, styles.approveLicenseButton]}
          onPress={() => handleLicenseAction(item.id, "approve")}
        >
          <Ionicons name="checkmark-circle" size={18} color={COLORS.WHITE} />
          <Text style={styles.licenseActionText}>Duyệt</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.licenseActionButton, styles.rejectLicenseButton]}
          onPress={() => handleLicenseAction(item.id, "reject")}
        >
          <Ionicons name="close-circle" size={18} color={COLORS.WHITE} />
          <Text style={styles.licenseActionText}>Từ chối</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderItem = ({ item }) => {
    if (item.type === "license") {
      return renderLicenseItem({ item });
    }
    return renderUserItem({ item });
  };

  const renderUserItem = ({ item }) => {
    const style = statusStyles[item.status] || statusStyles.active;
    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => handleUserPress(item)}
        activeOpacity={0.7}
      >
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
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Quản lý người dùng</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={COLORS.GRAY} />
        <TextInput
          style={styles.searchInput}
          placeholder={
            filter === "licenses"
              ? "Tìm kiếm theo tên, số điện thoại"
              : "Tìm kiếm theo tên, số điện thoại"
          }
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
              {item.key === "licenses" && pendingLicenses.length > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{pendingLicenses.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={listDescriptor}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name={filter === "licenses" ? "card-outline" : "people-outline"}
              size={48}
              color={COLORS.GRAY}
            />
            <Text style={styles.emptyTitle}>
              {filter === "licenses"
                ? "Không có đơn chờ duyệt"
                : "Không có người dùng phù hợp"}
            </Text>
            <Text style={styles.emptyDescription}>
              {filter === "licenses"
                ? "Tất cả đơn duyệt bằng lái xe đã được xử lý."
                : "Điều chỉnh tiêu chí lọc hoặc kiểm tra lại sau."}
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
    lineHeight: 20,
  },
  searchContainer: {
    marginHorizontal: 20,
    marginBottom: 12,
    marginTop: 12,
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
    marginTop: 8,
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
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
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
  filterBadge: {
    backgroundColor: COLORS.RED,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  filterBadgeText: {
    fontSize: 11,
    color: COLORS.WHITE,
    fontWeight: "700",
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
  licenseCard: {
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
  licenseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  licenseUserName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  licenseUserId: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.GRAY,
  },
  licenseStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  licenseStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  licenseInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  licenseInfoText: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  licenseImageContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  licenseImageLabel: {
    fontSize: 13,
    color: COLORS.GRAY,
    marginBottom: 8,
    fontWeight: "500",
  },
  licenseImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: COLORS.BG,
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
  },
  licenseActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  licenseActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  approveLicenseButton: {
    backgroundColor: COLORS.GREEN,
  },
  rejectLicenseButton: {
    backgroundColor: COLORS.RED,
  },
  licenseActionText: {
    fontSize: 14,
    color: COLORS.WHITE,
    fontWeight: "600",
  },
});

export default UserManagement;

