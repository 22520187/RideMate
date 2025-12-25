import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, CreditCard, CheckCircle } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useFocusEffect } from "@react-navigation/native";
import COLORS from "../../constant/colors";
import {
  createPayment,
  confirmStripePayment,
} from "../../services/paymentService";
import GradientHeader from "../../components/GradientHeader";
import SnowEffect from "../../components/SnowEffect";

const PaymentScreen = ({ navigation, route }) => {
  const {
    amount,
    orderInfo,
    referenceId,
    referenceType,
    sessionId: initialSessionId,
    fromDeepLink,
  } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(initialSessionId || null);
  const [hasHandledCallback, setHasHandledCallback] = useState(false);

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

  // Parse amount to number (handles "299K", "299.000", etc.)
  const parseAmountToNumber = (amount) => {
    if (!amount) return 0;

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
          // Check if it's likely thousand separators
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
      return 0;
    }

    return Math.round(numericAmount);
  };

  const handlePayment = async () => {
    if (!amount || !orderInfo) {
      Alert.alert("Lỗi", "Thiếu thông tin thanh toán");
      return;
    }

    setLoading(true);
    try {
      // Parse amount correctly before sending to API
      const parsedAmount = parseAmountToNumber(amount);
      console.log("💰 Payment amount:", {
        original: amount,
        parsed: parsedAmount,
      });

      const response = await createPayment({
        amount: parsedAmount,
        orderInfo: orderInfo,
        referenceId: referenceId,
        referenceType: referenceType,
      });

      const paymentData = response?.data?.data;
      if (!paymentData?.paymentUrl) {
        throw new Error("Không nhận được payment URL");
      }

      setSessionId(paymentData.transId);

      // Open Stripe Checkout in browser
      const result = await WebBrowser.openBrowserAsync(paymentData.paymentUrl, {
        showInRecents: true,
        enableBarCollapsing: false,
      });

      // Handle browser result
      if (result.type === "cancel") {
        Alert.alert("Hủy", "Bạn đã hủy thanh toán");
      } else {
        // User closed browser or completed payment
        // For Expo Go: Deep link may not work, so we check payment status immediately
        // For production: Deep link will handle it, but we also check as fallback
        console.log("🌐 Browser closed, checking payment status...");
        console.log("💰 SessionId to check:", paymentData.transId);

        // Wait a bit for Stripe to process (if payment was just completed)
        setTimeout(async () => {
          await handlePaymentCallback(paymentData.transId);
        }, 2000); // Wait 2 seconds for Stripe to process
      }
    } catch (error) {
      console.error("Payment error:", error);
      Alert.alert(
        "Lỗi",
        error?.response?.data?.message || "Không thể thực hiện thanh toán"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle payment callback from deep link or browser close
  const handlePaymentCallback = async (sessionIdToCheck) => {
    if (!sessionIdToCheck) {
      console.warn("⚠️ No sessionId provided for payment callback");
      return;
    }

    if (hasHandledCallback) {
      console.log("✅ Payment callback already handled, skipping...");
      return;
    }

    setLoading(true);
    setHasHandledCallback(true);

    try {
      console.log(
        "💰 Checking payment status for sessionId:",
        sessionIdToCheck
      );
      const response = await confirmStripePayment(sessionIdToCheck);
      const paymentData = response?.data?.data;

      if (paymentData?.status === "SUCCESS") {
        const isMembership = referenceType === "MEMBERSHIP";
        Alert.alert(
          "Thành công",
          isMembership
            ? "Thanh toán thành công! Gói hội viên đã được kích hoạt."
            : "Thanh toán thành công!",
          [
            {
              text: "OK",
              onPress: () => {
                // Navigate back, and if it's membership, go back to Member screen
                if (isMembership) {
                  // Go back to Member screen (pop 2 screens: Payment -> MemberDetail -> Member)
                  navigation.navigate("Member");
                } else {
                  navigation.goBack();
                }
              },
            },
          ]
        );
      } else {
        Alert.alert("Thông báo", "Thanh toán chưa hoàn tất. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Payment confirmation error:", error);
      // Still check payment status
      Alert.alert("Thông báo", "Đang kiểm tra trạng thái thanh toán...");
    } finally {
      setLoading(false);
    }
  };

  // Handle deep link when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      // If opened from deep link, handle payment callback immediately
      if (fromDeepLink && initialSessionId && !hasHandledCallback) {
        console.log(
          "🔗 Payment screen opened from deep link, handling callback..."
        );
        handlePaymentCallback(initialSessionId);
      }
    }, [fromDeepLink, initialSessionId, hasHandledCallback])
  );

  // Listen for deep links while screen is mounted
  useEffect(() => {
    const handleDeepLink = (event) => {
      const { url } = event;
      console.log("🔗 Deep link received in PaymentScreen:", url);

      if (url) {
        const parsedUrl = Linking.parse(url);

        if (parsedUrl.path === "payment-success") {
          const sessionIdFromLink = parsedUrl.queryParams?.session_id;
          if (sessionIdFromLink && !hasHandledCallback) {
            console.log("💰 Handling payment success from deep link");
            setSessionId(sessionIdFromLink);
            handlePaymentCallback(sessionIdFromLink);
          }
        } else if (parsedUrl.path === "payment-cancel") {
          Alert.alert("Hủy", "Bạn đã hủy thanh toán");
        }
      }
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, [hasHandledCallback]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <SnowEffect />
      <GradientHeader
        title="💳 Thanh toán"
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <CreditCard size={48} color="#FF5370" />
          </View>

          <Text style={styles.title}>Thông tin thanh toán</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Mô tả:</Text>
            <Text style={styles.value}>{orderInfo || "Thanh toán"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Số tiền:</Text>
            <Text style={styles.amount}>{formatAmount(amount)}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.note}>
            Thanh toán an toàn qua Stripe. Bạn sẽ được chuyển đến trình duyệt để
            hoàn tất thanh toán.
          </Text>

          <Text style={styles.testCardTitle}>Thẻ test (Sandbox):</Text>
          <View style={styles.testCard}>
            <Text style={styles.testCardText}>Số thẻ: 4242 4242 4242 4242</Text>
            <Text style={styles.testCardText}>Ngày hết hạn: 12/25</Text>
            <Text style={styles.testCardText}>CVC: 123</Text>
            <Text style={styles.testCardText}>ZIP: 12345</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.WHITE} />
          ) : (
            <LinearGradient
              colors={["#FF5370", "#FF6B9D", "#FF8FAB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.payButtonGradient}
            >
              <CheckCircle size={20} color={COLORS.WHITE} />
              <Text style={styles.payButtonText}>Thanh toán</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF5F7",
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "#FFE5EC",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.BLACK,
    textAlign: "center",
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: COLORS.GRAY,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.BLACK,
    flex: 1,
    textAlign: "right",
  },
  amount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FF5370",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.GRAY_LIGHT,
    marginVertical: 20,
  },
  note: {
    fontSize: 14,
    color: COLORS.GRAY,
    lineHeight: 20,
    marginBottom: 16,
  },
  testCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.BLACK,
    marginBottom: 8,
  },
  testCard: {
    backgroundColor: COLORS.GRAY_LIGHT,
    borderRadius: 8,
    padding: 12,
  },
  testCardText: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginBottom: 4,
    fontFamily: "monospace",
  },
  footer: {
    padding: 16,
    backgroundColor: "#FFF5F7",
    borderTopWidth: 2,
    borderTopColor: "#FFE5EC",
  },
  payButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  payButtonGradient: {
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  payButtonDisabled: {
    backgroundColor: COLORS.GRAY,
  },
  payButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: "700",
  },
});

export default PaymentScreen;
