import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Crown, ShoppingBag } from "lucide-react-native";
import { MaterialIcons } from "@expo/vector-icons";
import COLORS from "../../../constant/colors";
import SCREENS from "../../index";
import axiosClient from "../../../api/axiosClient";
import endpoints from "../../../api/endpoints";
import SnowEffect from "../../../components/SnowEffect";

const TABS = {
  PACKAGES: "PACKAGES",
  PURCHASED: "PURCHASED",
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Default images for memberships
const getDefaultImage = (membershipId) => {
  const images = {
    "MEM-1001":
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=250&fit=crop", // Premium
    "MEM-1002":
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=250&fit=crop", // VIP
    "MEM-1003":
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=250&fit=crop", // Family
    "MEM-1004":
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=250&fit=crop", // Student
    "MEM-1005":
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop", // Basic
  };
  return (
    images[membershipId] ||
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=250&fit=crop"
  );
};

const Member = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState(TABS.PACKAGES);
  const [packages, setPackages] = useState([]);
  const [purchased, setPurchased] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch membership packages
  useEffect(() => {
    const fetchMemberships = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(endpoints.memberships.active);
        console.log("📦 Memberships API Response:", response.data);

        // ApiResponse structure: { statusCode, message, data }
        const memberships = response.data?.data || [];
        console.log("📦 Memberships data:", memberships);

        // Transform to match frontend format
        const transformed = memberships.map((m) => ({
          id: m.membershipId || `MEM-${m.id}`,
          membershipId: m.membershipId,
          title: m.name,
          description: m.description,
          image: getDefaultImage(m.membershipId),
          badge:
            m.subscribers > 1000 ? "HOT" : m.subscribers > 0 ? "NEW" : null,
          badgeColor: m.subscribers > 1000 ? COLORS.ORANGE : "#FFD700",
          price: m.price
            ? `${m.price.toLocaleString("vi-VN")}đ/tháng`
            : "Từ 49.000đ/tháng",
          priceValue: m.price,
          benefits: m.benefits || [],
          pointMultiplier: m.pointMultiplier,
          maxTripsPerDay: m.maxTripsPerDay,
          subscribers: m.subscribers || 0,
        }));

        setPackages(transformed);
      } catch (error) {
        console.error("Error fetching memberships:", error);
        // Fallback to empty array
        setPackages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMemberships();
  }, []);

  // Fetch purchased memberships
  useEffect(() => {
    const fetchPurchased = async () => {
      try {
        const response = await axiosClient.get(endpoints.payments.myMembership);
        const membership = response.data?.data;

        if (membership?.isActive) {
          setPurchased([
            {
              id: membership.id,
              title: membership.membershipName || "Gói hội viên",
              nextBilling: membership.endDate
                ? new Date(membership.endDate).toLocaleDateString("vi-VN")
                : "",
              status: "Đang hoạt động",
              image: getDefaultImage(membership.membershipId),
            },
          ]);
        } else {
          setPurchased([]);
        }
      } catch (error) {
        console.error("Error fetching purchased membership:", error);
        setPurchased([]);
      }
    };

    if (activeTab === TABS.PURCHASED) {
      fetchPurchased();
    }
  }, [activeTab]);

  const data = useMemo(
    () => (activeTab === TABS.PACKAGES ? packages : purchased),
    [activeTab, packages, purchased]
  );

  const renderPackageItem = ({ item }) => {
    // Calculate savings text from description or benefits
    const getSavingsText = () => {
      if (activeTab === TABS.PURCHASED) {
        return `Gia hạn: ${item.nextBilling}`;
      }

      // Try to extract savings from benefits
      const discountBenefit = item.benefits?.find((b) => b.includes("Giảm"));
      if (discountBenefit) {
        const discountMatch = discountBenefit.match(/(\d+)%/);
        if (discountMatch) {
          const discount = discountMatch[1];
          // Estimate savings (example calculation)
          const estimatedSavings = discount * 10000; // Rough estimate
          return `Tiết kiệm đến ${estimatedSavings.toLocaleString(
            "vi-VN"
          )} VNĐ/tháng`;
        }
      }

      return item.description || "Ưu đãi đặc biệt";
    };

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.card}
        onPress={() => {
          if (activeTab === TABS.PACKAGES) {
            navigation.navigate(SCREENS.MEMBER_DETAIL, {
              id: item.id,
              membershipId: item.membershipId,
              title: item.title,
              image: item.image,
              badge: item.badge,
              badgeColor: item.badgeColor,
              description: item.description,
              benefits: item.benefits,
              price: item.price,
              priceValue: item.priceValue,
            });
          }
        }}
      >
        {/* Image container with badge */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image }} style={styles.cardImage} />
          {/* Badge */}
          {item.badge && (
            <View
              style={[
                styles.badge,
                { backgroundColor: item.badgeColor || COLORS.ORANGE },
              ]}
            >
              {item.badge === "HOT" && (
                <MaterialIcons
                  name="local-fire-department"
                  size={12}
                  color={COLORS.WHITE}
                />
              )}
              {item.badge === "NEW" && <Crown size={12} color={COLORS.WHITE} />}
              <Text style={styles.badgeText}>{item.badge}</Text>
            </View>
          )}
        </View>

        {/* Content on right */}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
          </View>
          <Text style={styles.cardDescription} numberOfLines={2}>
            {getSavingsText()}
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardPrice}>{item.price}</Text>
            <TouchableOpacity
              style={styles.registerButton}
              onPress={(e) => {
                e.stopPropagation();
                if (activeTab === TABS.PACKAGES) {
                  navigation.navigate(SCREENS.MEMBER_DETAIL, {
                    id: item.id,
                    membershipId: item.membershipId,
                    title: item.title,
                    image: item.image,
                    badge: item.badge,
                    badgeColor: item.badgeColor,
                    description: item.description,
                    benefits: item.benefits,
                    price: item.price,
                    priceValue: item.priceValue,
                  });
                }
              }}
            >
              <Text style={styles.registerButtonText}>Đăng ký</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Snow Effect */}
      <SnowEffect />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={22} color={COLORS.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gói hội viên</Text>
        <TouchableOpacity
          onPress={() => {
            // Navigate to membership history if needed
            console.log("Navigate to history");
          }}
        >
          <Text style={styles.historyText}>Lịch sử</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === TABS.PACKAGES && styles.tabItemActive,
          ]}
          onPress={() => setActiveTab(TABS.PACKAGES)}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === TABS.PACKAGES && styles.tabTextActive,
            ]}
          >
            Khám phá
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === TABS.PURCHASED && styles.tabItemActive,
          ]}
          onPress={() => setActiveTab(TABS.PURCHASED)}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === TABS.PURCHASED && styles.tabTextActive,
            ]}
          >
            Gói của tôi
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5370" />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderPackageItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {activeTab === TABS.PACKAGES
                  ? "Không có gói hội viên nào"
                  : "Bạn chưa có gói hội viên nào"}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  header: {
    height: 56,
    backgroundColor: COLORS.PRIMARY,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    zIndex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: "700",
  },
  historyText: {
    color: COLORS.PRIMARY,
    fontSize: 14,
    fontWeight: "600",
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: COLORS.WHITE,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    overflow: "hidden",
    zIndex: 1,
    padding: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  tabText: {
    color: COLORS.GRAY_DARK,
    fontWeight: "600",
    fontSize: 14,
  },
  tabTextActive: {
    color: COLORS.WHITE,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: COLORS.GRAY,
    fontSize: 16,
  },
  card: {
    flexDirection: "row",
    borderRadius: 16,
    backgroundColor: COLORS.WHITE,
    overflow: "hidden",
    marginBottom: 16,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    height: 140,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  imageContainer: {
    position: "relative",
    width: 140,
    height: 140,
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  badgeText: {
    color: COLORS.WHITE,
    fontSize: 11,
    fontWeight: "700",
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.BLACK,
    marginBottom: 0,
    marginTop: 0,
  },
  cardDescription: {
    fontSize: 13,
    color: COLORS.GRAY,
    lineHeight: 18,
    marginBottom: 12,
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "auto",
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.PRIMARY,
    flex: 1,
  },
  registerButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    minWidth: 90,
    alignItems: "center",
  },
  registerButtonText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: "700",
  },
});

export default Member;
