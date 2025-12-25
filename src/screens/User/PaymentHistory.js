import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import COLORS from "../../constant/colors";
import { getMyPayments, getMyMembership } from "../../services/paymentService";
import Toast from "react-native-toast-message";
import GradientHeader from "../../components/GradientHeader";
import SnowEffect from "../../components/SnowEffect";

const PaymentHistory = ({ navigation }) => {
  const [payments, setPayments] = useState([]);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentsResponse, membershipResponse] = await Promise.all([
        getMyPayments(),
        getMyMembership(),
      ]);

      // Backend returns ApiResponse<List<PaymentResponse>>
      // Structure: { success: true, message: "...", data: [...] }
      // Axios wraps in response.data, so paymentsResponse.data is the ApiResponse
      const paymentsData =
        paymentsResponse?.data?.data || paymentsResponse?.data || [];
      const paymentsList = Array.isArray(paymentsData) ? paymentsData : [];

      setPayments(paymentsList);

      // Membership response
      const membershipData =
        membershipResponse?.data?.data || membershipResponse?.data;
      if (membershipData) {
        setMembership(membershipData);
      }
    } catch (error) {
      console.error("Error loading payment data:", error);
      console.error("Error details:", error?.response?.data);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2:
          error?.response?.data?.message || "Không thể tải lịch sử thanh toán",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatAmount = (amount) => {
    if (!amount) return "0 VNĐ";

    // Handle different formats: "499K", "499.000", "499000", or number
    let numericAmount;
    if (typeof amount === "number") {
      numericAmount = amount;
    } else if (typeof amount === "string") {
      // Remove spaces and convert to uppercase
      const cleanAmount = amount.trim().toUpperCase();

      // Check if it ends with "K" (thousand)
      if (cleanAmount.endsWith("K")) {
        const numberPart = cleanAmount.replace(/[^\d.]/g, "");
        numericAmount = parseFloat(numberPart) * 1000;
      } else {
        // Remove all non-digit characters except decimal point, then parse
        const numberPart = cleanAmount.replace(/[^\d.]/g, "");
        // If has dots, might be thousand separators (e.g., "499.000")
        if (numberPart.includes(".")) {
          // Check if it's likely thousand separators (more than 3 digits after last dot)
          const parts = numberPart.split(".");
          if (parts.length === 2 && parts[1].length === 3) {
            // Likely thousand separator: "499.000" -> 499000
            numericAmount = parseInt(parts[0] + parts[1]);
          } else {
            // Decimal number
            numericAmount = parseFloat(numberPart);
          }
        } else {
          numericAmount = parseInt(numberPart) || 0;
        }
      }
    } else {
      numericAmount = Number(amount) || 0;
    }

    // Ensure it's a valid number
    if (isNaN(numericAmount) || !isFinite(numericAmount)) {
      return "0 VNĐ";
    }

    return `${Math.round(numericAmount).toLocaleString("vi-VN")} VNĐ`;
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "SUCCESS":
        return COLORS.GREEN;
      case "PENDING":
      case "PROCESSING":
        return COLORS.ORANGE;
      case "FAILED":
      case "CANCELLED":
      case "EXPIRED":
        return COLORS.RED;
      default:
        return COLORS.GRAY;
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case "SUCCESS":
        return <CheckCircle size={20} color={COLORS.GREEN} />;
      case "PENDING":
      case "PROCESSING":
        return <Clock size={20} color={COLORS.ORANGE} />;
      case "FAILED":
      case "CANCELLED":
      case "EXPIRED":
        return <XCircle size={20} color={COLORS.RED} />;
      default:
        return <Clock size={20} color={COLORS.GRAY} />;
    }
  };

  const getStatusText = (status) => {
    switch (status?.toUpperCase()) {
      case "SUCCESS":
        return "Thành công";
      case "PENDING":
        return "Đang chờ";
      case "PROCESSING":
        return "Đang xử lý";
      case "FAILED":
        return "Thất bại";
      case "CANCELLED":
        return "Đã hủy";
      case "EXPIRED":
        return "Hết hạn";
      default:
        return status || "Không xác định";
    }
  };

  const renderMembershipCard = () => {
    if (!membership || !membership.isActive) {
      return (
        <View style={styles.membershipCard}>
          <View style={styles.membershipHeader}>
            <CreditCard size={24} color="#FF5370" />
            <Text style={styles.membershipTitle}>Gói hội viên</Text>
          </View>
          <Text style={styles.noMembershipText}>
            Bạn chưa có gói hội viên đang hoạt động
          </Text>
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={() => navigation.navigate("Member")}
          >
            <LinearGradient
              colors={["#FF5370", "#FF6B9D", "#FF8FAB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.subscribeButtonGradient}
            >
              <Text style={styles.subscribeButtonText}>Đăng ký ngay</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={[styles.membershipCard, styles.activeMembershipCard]}>
        <View style={styles.membershipHeader}>
          <CreditCard size={24} color={COLORS.GREEN} />
          <Text style={styles.membershipTitle}>
            Gói hội viên đang hoạt động
          </Text>
        </View>
        <Text style={styles.membershipName}>{membership.membershipName}</Text>
        <View style={styles.membershipInfo}>
          <View style={styles.membershipInfoRow}>
            <Calendar size={16} color={COLORS.GRAY} />
            <Text style={styles.membershipInfoText}>
              Hết hạn: {formatDate(membership.endDate)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderPaymentItem = ({ item }) => {
    const statusColor = getStatusColor(item.status);
    const statusIcon = getStatusIcon(item.status);
    const statusText = getStatusText(item.status);

    return (
      <View style={styles.paymentItem}>
        <View style={styles.paymentHeader}>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentOrderInfo} numberOfLines={1}>
              {item.orderInfo || "Thanh toán"}
            </Text>
            <Text style={styles.paymentOrderId}>Mã: {item.orderId}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + "20" },
            ]}
          >
            {statusIcon}
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusText}
            </Text>
          </View>
        </View>

        <View style={styles.paymentDetails}>
          <View style={styles.paymentDetailRow}>
            <Text style={styles.paymentDetailLabel}>Số tiền:</Text>
            <Text style={styles.paymentAmount}>
              {formatAmount(item.amount)}
            </Text>
          </View>

          {item.referenceType === "MEMBERSHIP" && (
            <View style={styles.paymentDetailRow}>
              <Text style={styles.paymentDetailLabel}>Loại:</Text>
              <Text style={styles.paymentDetailValue}>Gói hội viên</Text>
            </View>
          )}

          {item.paidAt && (
            <View style={styles.paymentDetailRow}>
              <Text style={styles.paymentDetailLabel}>Thanh toán:</Text>
              <Text style={styles.paymentDetailValue}>
                {formatDate(item.paidAt)}
              </Text>
            </View>
          )}

          {item.createdAt && (
            <View style={styles.paymentDetailRow}>
              <Text style={styles.paymentDetailLabel}>Tạo lúc:</Text>
              <Text style={styles.paymentDetailValue}>
                {formatDate(item.createdAt)}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <SnowEffect />
        <GradientHeader
          title="💳 Lịch sử thanh toán"
          onBackPress={() => navigation.goBack()}
          showBackButton={true}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5370" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <SnowEffect />
      <GradientHeader
        title="💳 Lịch sử thanh toán"
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
      />

      <FlatList
        data={payments}
        renderItem={renderPaymentItem}
        keyExtractor={(item) => item.paymentId?.toString() || item.orderId}
        ListHeaderComponent={renderMembershipCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#FF5370"]}
            tintColor="#FF5370"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <CreditCard size={48} color={COLORS.GRAY} />
            <Text style={styles.emptyText}>Chưa có lịch sử thanh toán</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF5F7",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
  },
  membershipCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#FFE5EC",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  activeMembershipCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#FF5370",
  },
  membershipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  membershipTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  membershipName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF5370",
    marginBottom: 8,
  },
  membershipInfo: {
    marginTop: 8,
  },
  membershipInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  membershipInfoText: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  noMembershipText: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginBottom: 12,
  },
  subscribeButton: {
    borderRadius: 16,
    alignSelf: "flex-start",
    marginTop: 8,
    overflow: "hidden",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  subscribeButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  subscribeButtonText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: "600",
  },
  paymentItem: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#FFE5EC",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  paymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  paymentInfo: {
    flex: 1,
    marginRight: 12,
  },
  paymentOrderInfo: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.BLACK,
    marginBottom: 4,
  },
  paymentOrderId: {
    fontSize: 12,
    color: COLORS.GRAY,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  paymentDetails: {
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_LIGHT,
    paddingTop: 12,
  },
  paymentDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  paymentDetailLabel: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  paymentDetailValue: {
    fontSize: 14,
    color: COLORS.BLACK,
    fontWeight: "500",
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF5370",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.GRAY,
    marginTop: 16,
  },
});

export default PaymentHistory;
