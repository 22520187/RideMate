import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { CheckCircle2, ChevronLeft, Crown } from "lucide-react-native";
import COLORS from "../../../constant/colors";
import SCREENS from "../../index";
import GradientHeader from "../../../components/GradientHeader";
import SnowEffect from "../../../components/SnowEffect";

const MemberDetail = ({ route, navigation }) => {
  const {
    id,
    membershipId, // Membership ID from API (e.g., "MEM-1001")
    title,
    image,
    benefits = [],
    price,
    priceValue, // Direct price value from API
    badge,
    badgeColor,
    description,
  } = route.params || {};

  const parsePrice = (priceString) => {
    if (!priceString) return priceValue || 49000; // Use priceValue if available

    // Handle different formats: "299K", "299.000", "299000", or number
    const cleanPrice = String(priceString).trim().toUpperCase();

    // Check if it ends with "K" (thousand)
    if (cleanPrice.endsWith("K")) {
      const numberPart = cleanPrice.replace(/[^\d.]/g, "");
      const parsed = parseFloat(numberPart) * 1000;
      return Math.round(parsed) || priceValue || 49000;
    }

    // Remove "đ / tháng" and extract number
    const match = cleanPrice.match(/[\d.]+/);
    if (!match) return priceValue || 49000;

    // Remove dots (thousand separators) and convert to number
    const numberStr = match[0].replace(/\./g, "");
    return parseInt(numberStr) || priceValue || 49000;
  };

  const handleSubscribe = () => {
    const amount = parsePrice(price);
    // Use membershipId from API (e.g., "MEM-1001") instead of id
    const finalMembershipId = membershipId || id || "MEM-1001";

    if (!finalMembershipId) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin gói hội viên");
      return;
    }

    navigation.navigate(SCREENS.PAYMENT, {
      amount: amount,
      orderInfo: `Thanh toán gói ${title || "Hội viên"}`,
      referenceId: finalMembershipId, // Use membershipId (e.g., "MEM-1001")
      referenceType: "MEMBERSHIP",
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <SnowEffect />
      <GradientHeader
        title="👑 Chi tiết gói"
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View style={styles.hero}>
          {!!image && (
            <Image source={{ uri: image }} style={styles.heroImage} />
          )}
          <LinearGradient
            colors={[
              "rgba(255, 83, 112, 0.85)",
              "rgba(255, 107, 157, 0.8)",
              "rgba(255, 143, 171, 0.75)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              {!!badge && (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: "rgba(255, 255, 255, 0.3)" },
                  ]}
                >
                  <Text style={styles.badgeEmoji}>👑</Text>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              )}
              <Text style={styles.title}>{title || "Gói Hội Viên"}</Text>
              {!!description && (
                <Text style={styles.subtitle}>{description}</Text>
              )}
            </View>
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✨ Quyền lợi</Text>
          <View style={styles.card}>
            {(benefits.length
              ? benefits
              : [
                  "Ưu đãi giá mỗi chuyến đi",
                  "Tích điểm nhanh gấp đôi",
                  "Hỗ trợ ưu tiên 24/7",
                ]
            ).map((b, idx) => (
              <View key={idx} style={styles.benefitRow}>
                <View style={styles.checkIconContainer}>
                  <Text style={styles.checkEmoji}>✓</Text>
                </View>
                <Text style={styles.benefitText}>{b}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Giá tiền</Text>
          <View style={styles.card}>
            <Text style={styles.priceText}>{price || "49.000đ / tháng"}</Text>
            <Text style={styles.noteText}>
              Hủy bất cứ lúc nào. Không ràng buộc.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleSubscribe}
          activeOpacity={0.9}
          style={styles.ctaButtonWrapper}
        >
          <LinearGradient
            colors={["#FF5370", "#FF6B9D", "#FF8FAB"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>Đăng ký ngay ✨</Text>
          </LinearGradient>
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
  hero: {
    height: 220,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
    resizeMode: "cover",
  },
  heroGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
    padding: 20,
    position: "relative",
  },
  heroContent: {
    alignItems: "flex-start",
  },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  badgeEmoji: {
    fontSize: 16,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "800",
  },
  title: {
    color: "#FFF",
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 6,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    color: "#FFF",
    fontSize: 14,
    opacity: 0.95,
    lineHeight: 20,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FF5370",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "#FFE5EC",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  checkIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFE5EC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#FF6B9D",
  },
  checkEmoji: {
    fontSize: 16,
    color: "#FF5370",
    fontWeight: "800",
  },
  benefitText: {
    flex: 1,
    color: "#1A1A1A",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
  },
  priceText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FF5370",
    marginBottom: 8,
  },
  noteText: {
    color: "#8E8E93",
    fontSize: 13,
    fontWeight: "500",
  },
  footer: {
    padding: 16,
    backgroundColor: "#FFF5F7",
    borderTopWidth: 2,
    borderTopColor: "#FFE5EC",
  },
  ctaButtonWrapper: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  ctaButton: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
  },
});

export default MemberDetail;
