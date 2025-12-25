import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckCircle, Clock } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import COLORS from "../../constant/colors";
import SnowEffect from "../../components/SnowEffect";

const PaymentSuccessScreen = ({ navigation, route }) => {
  const { amount, transactionId, orderInfo, isMembership } = route.params || {};

  const formatAmount = (inputAmount) => {
    if (!inputAmount) return "0 VNĐ";

    let numericAmount;
    if (typeof inputAmount === "number") {
      numericAmount = inputAmount;
    } else if (typeof inputAmount === "string") {
      const cleanAmount = inputAmount.trim().toUpperCase();
      if (cleanAmount.endsWith("K")) {
        const numberPart = cleanAmount.replace(/[^\d.]/g, "");
        numericAmount = parseFloat(numberPart) * 1000;
      } else {
        const numberPart = cleanAmount.replace(/[^\d.]/g, "");
        if (numberPart.includes(".")) {
          const parts = numberPart.split(".");
          if (parts.length === 2 && parts[1].length === 3) {
            numericAmount = parseInt(parts[0] + parts[1]);
          } else {
            numericAmount = parseFloat(numberPart);
          }
        } else {
          numericAmount = parseInt(numberPart) || 0;
        }
      }
    } else {
      numericAmount = Number(inputAmount) || 0;
    }

    if (isNaN(numericAmount) || !isFinite(numericAmount)) {
      return "0 VNĐ";
    }

    return `${Math.round(numericAmount).toLocaleString("vi-VN")} VNĐ`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <SnowEffect />
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={["#4CAF50", "#66BB6A"]}
            style={styles.iconBackground}
          >
            <CheckCircle size={64} color={COLORS.WHITE} />
          </LinearGradient>
        </View>

        <Text style={styles.title}>Thanh toán thành công!</Text>
        <Text style={styles.subtitle}>
          {isMembership
            ? "Gói hội viên của bạn đã được kích hoạt thành công."
            : "Giao dịch của bạn đã được thực hiện thành công."}
        </Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Nội dung:</Text>
            <Text style={styles.value}>{orderInfo || "Thanh toán"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Số tiền:</Text>
            <Text style={styles.amount}>{formatAmount(amount)}</Text>
          </View>
          {transactionId && (
            <>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.label}>Mã giao dịch:</Text>
                <Text style={styles.valueId}>{transactionId}</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.buttonPrimary}
            onPress={() => navigation.navigate("PaymentHistory")}
          >
            <LinearGradient
              colors={["#FF5370", "#FF8FAB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Clock size={20} color={COLORS.WHITE} />
              <Text style={styles.buttonText}>Xem lịch sử thanh toán</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  iconContainer: {
    marginBottom: 24,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.BLACK,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.GRAY,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#FFE5EC",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.BLACK,
    flex: 1,
    textAlign: "right",
    marginLeft: 16,
  },
  valueId: {
    fontSize: 12,
    color: COLORS.GRAY,
    flex: 1,
    textAlign: "right",
    marginLeft: 16,
    fontFamily: "monospace",
  },
  amount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 12,
  },
  actions: {
    width: "100%",
    gap: 16,
  },
  buttonPrimary: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  buttonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: "600",
  },
  buttonSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: "#FF5370",
    gap: 8,
  },
  buttonSecondaryText: {
    color: "#FF5370",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default PaymentSuccessScreen;
