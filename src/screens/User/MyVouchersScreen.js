import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import {
  TicketPercent,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import COLORS from "../../constant/colors";
import { getMyVouchers } from "../../services/voucherService";
import GradientHeader from "../../components/GradientHeader";
import SnowEffect from "../../components/SnowEffect";

const MyVouchersScreen = ({ navigation }) => {
  const [myVouchers, setMyVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all"); // 'all', 'unused', 'used', 'expired'

  const loadVouchers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getMyVouchers();
      console.log("📦 [MyVouchers] API Response:", response);

      // Handle different response structures
      // response could be: response.data.data (ApiResponse wrapper) or response.data (direct array)
      const vouchers = Array.isArray(response?.data?.data)
        ? response.data.data
        : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];

      console.log("✅ [MyVouchers] Parsed vouchers:", vouchers.length);
      setMyVouchers(vouchers);
    } catch (error) {
      console.error("❌ Error loading vouchers:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tải danh sách voucher. Vui lòng thử lại.",
        position: "top",
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadVouchers();
    }, [loadVouchers])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadVouchers();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getVoucherStatus = (userVoucher) => {
    if (userVoucher.status === "REDEEMED" || userVoucher.status === "USED") {
      return { label: "Đã sử dụng", color: "#8E8E93", icon: "used" };
    }
    if (userVoucher.status === "EXPIRED") {
      return { label: "Đã hết hạn", color: "#FF5370", icon: "expired" };
    }
    const expiryDate = userVoucher.voucher?.expiryDate;
    if (expiryDate) {
      const now = new Date();
      const expiry = new Date(expiryDate);
      if (expiry < now) {
        return { label: "Đã hết hạn", color: "#FF5370", icon: "expired" };
      }
    }
    return { label: "Chưa sử dụng", color: "#4ECDC4", icon: "unused" };
  };

  const getVoucherTypeInfo = (type) => {
    switch (type) {
      case "FOOD_AND_BEVERAGE":
        return { label: "Đồ ăn & Uống", emoji: "🍔", color: "#FF6B9D" };
      case "SHOPPING":
        return { label: "Mua sắm", emoji: "🛍️", color: "#4ECDC4" };
      case "VEHICLE_SERVICE":
        return { label: "Dịch vụ xe", emoji: "🚗", color: "#FFA07A" };
      default:
        return { label: "Ưu đãi", emoji: "🎁", color: "#FFB6C1" };
    }
  };

  const filteredVouchers = myVouchers.filter((item) => {
    if (filter === "all") return true;
    const status = getVoucherStatus(item);
    if (filter === "unused") return status.icon === "unused";
    if (filter === "used") return status.icon === "used";
    if (filter === "expired") return status.icon === "expired";
    return true;
  });

  const renderVoucherItem = ({ item }) => {
    const voucher = item.voucher || {};
    const status = getVoucherStatus(item);
    const typeInfo = getVoucherTypeInfo(voucher.voucherType);

    return (
      <TouchableOpacity
        style={styles.voucherCard}
        onPress={() => navigation.navigate("Voucher", { userVoucher: item })}
        activeOpacity={0.8}
      >
        <View style={styles.voucherHeader}>
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: typeInfo.color + "20" },
            ]}
          >
            <Text style={styles.typeEmoji}>{typeInfo.emoji}</Text>
            <Text style={[styles.typeLabel, { color: typeInfo.color }]}>
              {typeInfo.label}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: status.color + "20" },
            ]}
          >
            {status.icon === "unused" && (
              <CheckCircle size={14} color={status.color} />
            )}
            {status.icon === "used" && (
              <XCircle size={14} color={status.color} />
            )}
            {status.icon === "expired" && (
              <Clock size={14} color={status.color} />
            )}
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        <View style={styles.voucherContent}>
          <Text style={styles.voucherDescription} numberOfLines={2}>
            {voucher.description || "Voucher ưu đãi"}
          </Text>
          <View style={styles.dateContainer}>
            <Calendar size={14} color="#8E8E93" />
            <Text style={styles.dateText}>
              Hết hạn:{" "}
              {voucher.expiryDate
                ? formatDate(voucher.expiryDate)
                : "Không giới hạn"}
            </Text>
          </View>
        </View>

        <View style={styles.arrowContainer}>
          <MaterialIcons name="chevron-right" size={24} color="#FF5370" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterButton = (filterKey, label) => {
    const isActive = filter === filterKey;
    return (
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setFilter(filterKey)}
      >
        {isActive ? (
          <LinearGradient
            colors={["#FF5370", "#FF6B9D", "#FF8FAB"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.filterGradient}
          >
            <Text style={styles.filterTextActive}>{label}</Text>
          </LinearGradient>
        ) : (
          <View style={styles.filterTextContainer}>
            <Text style={styles.filterText}>{label}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <SnowEffect />
      <GradientHeader
        title="🎫 Voucher của tôi"
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
      />

      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {renderFilterButton("all", "Tất cả")}
          {renderFilterButton("unused", "Chưa dùng")}
          {renderFilterButton("used", "Đã dùng")}
          {renderFilterButton("expired", "Hết hạn")}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5370" />
        </View>
      ) : (
        <FlatList
          data={filteredVouchers}
          keyExtractor={(item) => String(item.id || item.voucher?.id)}
          renderItem={renderVoucherItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#FF5370"]}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Chưa có voucher</Text>
              <Text style={styles.emptySubtitle}>
                {filter === "all"
                  ? "Bạn chưa đổi voucher nào. Hãy tích điểm để đổi voucher nhé!"
                  : `Không có voucher ${
                      filter === "unused"
                        ? "chưa dùng"
                        : filter === "used"
                        ? "đã dùng"
                        : "hết hạn"
                    }`}
              </Text>
              {filter === "all" && (
                <TouchableOpacity
                  style={styles.goToAwardButton}
                  onPress={() =>
                    navigation.navigate("MainTabs", { screen: "Award" })
                  }
                >
                  <LinearGradient
                    colors={["#FF5370", "#FF6B9D", "#FF8FAB"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.goToAwardGradient}
                  >
                    <Text style={styles.goToAwardText}>Đi đến Reward ✨</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF5F7",
  },
  filterContainer: {
    backgroundColor: "#FFE5EC",
    paddingVertical: 16,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#FF6B9D",
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  filterButton: {
    marginRight: 8,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  filterGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  filterTextContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255, 83, 112, 0.15)",
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  filterText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
  filterTextActive: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
  listContent: {
    padding: 16,
  },
  voucherCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#FFE5EC",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  voucherHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  typeEmoji: {
    fontSize: 16,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  voucherContent: {
    marginBottom: 12,
    flex: 1,
  },
  voucherDescription: {
    fontSize: 15,
    color: "#1A1A1A",
    lineHeight: 22,
    fontWeight: "600",
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  dateText: {
    fontSize: 12,
    color: "#8E8E93",
  },
  arrowContainer: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: [{ translateY: -12 }],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF5370",
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "#8E8E93",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  goToAwardButton: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  goToAwardGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  goToAwardText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 14,
  },
});

export default MyVouchersScreen;
