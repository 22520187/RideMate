import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  FlatList,
  AppState,
  Modal,
  Alert,
  ImageBackground,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  Search,
  Bell,
  User,
  Car,
  Users,
  Gift,
  Clock,
  MapPin,
  Star,
  ChevronRight,
  MessageCircle,
  Ban,
  Package,
  Ticket,
  AlertCircle,
  Heart,
  Sparkles,
  Navigation,
} from "lucide-react-native";
import COLORS from "../../../constant/colors";
import SCREENS from "../../../screens";
import { getProfile } from "../../../services/userService";
import { getMyVehicle } from "../../../services/vehicleService";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const Home = ({ navigation }) => {
  const [searchText, setSearchText] = useState("");
  const insets = useSafeAreaInsets();
  const [refreshKey, setRefreshKey] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [vehicleStatus, setVehicleStatus] = useState(null);
  const [showVehicleRequiredModal, setShowVehicleRequiredModal] =
    useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === "active") {
        setRefreshKey((prev) => prev + 1);
        loadUserData();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadUserData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadUserData = async () => {
    try {
      const profileResp = await getProfile();
      const profile = profileResp?.data;
      setUserProfile(profile);

      if (
        profile &&
        (profile.userType === "DRIVER" || profile.userType === "PASSENGER")
      ) {
        try {
          const vehicleResp = await getMyVehicle();
          const vehicle = vehicleResp?.data;
          setVehicleStatus(vehicle?.status || null);
        } catch (err) {
          setVehicleStatus(null);
        }
      }
    } catch (err) {
      console.warn("Failed to load user data:", err);
    }
  };

  const checkCanCreateRide = () => {
    if (!userProfile) {
      Alert.alert("Lỗi", "Không thể tải thông tin người dùng");
      return false;
    }

    if (userProfile.userType === "PASSENGER" && !vehicleStatus) {
      setShowVehicleRequiredModal(true);
      return false;
    }
    if (vehicleStatus === "PENDING") {
      Alert.alert(
        "Xe đang chờ duyệt",
        "Thông tin xe của bạn đang được admin xem xét. Vui lòng chờ phê duyệt để có thể tạo chuyến đi.",
        [{ text: "Đã hiểu" }]
      );
      return false;
    }

    if (vehicleStatus === "REJECTED") {
      Alert.alert(
        "Xe bị từ chối",
        "Thông tin xe của bạn không được phê duyệt. Vui lòng cập nhật lại thông tin trong mục Quản lý tài khoản.",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Đi tới Profile",
            onPress: () => navigation.navigate(SCREENS.PROFILE),
          },
        ]
      );
      return false;
    }

    return true;
  };

  const handleCreateRide = () => {
    if (checkCanCreateRide() == false) {
      navigation.navigate("DriverRide");
    } else {
      navigation.navigate("DriverRide");
    }
  };

  const currentRide = {
    hasActiveRide: false,
    type: "driver",
    destination: "Trường Đại học Công nghệ",
    time: "15 phút",
    passengers: [],
  };

  const userPoints = 1250;

  const mainFunctions = [
    {
      id: 1,
      title: "Tạo chuyến đi",
      subtitle: "Người có xe",
      icon: Car,
      color: COLORS.GREEN,
      onPress: handleCreateRide,
    },
    {
      id: 2,
      title: "Tìm người đi cùng",
      subtitle: "Người không có xe",
      icon: Users,
      color: COLORS.BLUE,
      onPress: () => navigation.navigate("PassengerRide"),
    },
    {
      id: 3,
      title: "Nhiệm vụ",
      subtitle: `${userPoints} điểm`,
      icon: Gift,
      color: COLORS.PURPLE,
      onPress: () => navigation.navigate("Mission"),
    },
    {
      id: 4,
      title: "Lịch sử chuyến đi",
      subtitle: "Xem các chuyến đã tham gia",
      icon: Clock,
      color: COLORS.Fresh_Air,
      onPress: () => navigation.navigate("RideHistory"),
    },
    {
      id: 5,
      title: "Hội viên",
      subtitle: "Xem hội viên",
      icon: Package,
      color: COLORS.ORANGE,
      onPress: () => navigation.navigate("Member"),
    },
    {
      id: 6,
      title: "Báo cáo",
      subtitle: "Báo cáo vấn đề",
      icon: Ban,
      color: COLORS.RED,
      onPress: () => navigation.navigate("Report"),
    },
  ];

  const promotions = [
    {
      id: 1,
      title: "Tích điểm – đổi ngay voucher!",
      subtitle: "Đổi ngay voucher 30k tại Katinat",
      image:
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=200&fit=crop",
      badge: "Ưu đãi đặc biệt",
      points: userPoints,
    },
    {
      id: 2,
      title: "Chuyến đi miễn phí",
      subtitle: "Hoàn 100% điểm cho chuyến đầu tiên",
      image:
        "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=200&fit=crop",
      badge: "Mới",
      points: 0,
    },
    {
      id: 3,
      title: "Đối tác Phúc Long",
      subtitle: "Giảm 20% khi đặt đồ uống",
      image:
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=200&fit=crop",
      badge: "Hot",
      points: 500,
    },
  ];

  const packages = [
    {
      id: 1,
      title: "RideMate Premium",
      description: "Ưu đãi đặc biệt mọi chuyến xe\nTích điểm nhanh gấp đôi",
      image:
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=250&fit=crop",
      badge: "Phổ biến",
      badgeColor: COLORS.ORANGE,
    },
    {
      id: 2,
      title: "RideMate VIP",
      description: "Trải nghiệm dịch vụ cao cấp\nHỗ trợ ưu tiên 24/7",
      image:
        "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=250&fit=crop",
      badge: "Cao cấp",
      badgeColor: COLORS.PURPLE,
    },
    {
      id: 3,
      title: "RideMate Family",
      description: "Chia sẻ cho cả gia đình\nTối đa 5 thành viên",
      image:
        "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&h=250&fit=crop",
      badge: "Tiết kiệm",
      badgeColor: COLORS.GREEN,
    },
  ];

  const renderPromotion = ({ item }) => (
    <TouchableOpacity
      style={styles.promotionCard}
      onPress={() => {
        navigation.navigate("Voucher", {
          title: item.title,
          subtitle: item.subtitle,
          image: item.image,
          badge: item.badge,
          validFrom: "01/10/2025",
          validTo: "31/12/2025",
          terms:
            "Áp dụng cho chuyến đi đầu tiên trong ngày. Không cộng dồn ưu đãi.",
          code: item.points > 0 ? undefined : "RIDEMATE30",
        });
      }}
    >
      <Image source={{ uri: item.image }} style={styles.promotionImage} />
      <View style={styles.promotionOverlay}>
        <View style={styles.promotionContent}>
          <View style={styles.promotionTextContainer}>
            <Text style={styles.promotionTitle}>{item.title}</Text>
            <Text style={styles.promotionSubtitle}>{item.subtitle}</Text>
            <View style={styles.promotionBadge}>
              <Star size={12} color={COLORS.YELLOW} />
              <Text style={styles.badgeText}>{item.badge}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderPackage = ({ item }) => (
    <TouchableOpacity
      style={styles.packageCard}
      activeOpacity={0.8}
      onPress={() => {
        navigation.navigate("MemberDetail", {
          title: item.title,
          image: item.image,
          badge: item.badge,
          badgeColor: item.badgeColor,
          description: item.description,
          benefits: item.benefits,
          price: item.price,
        });
      }}
    >
      <Image source={{ uri: item.image }} style={styles.packageImage} />
      <View style={styles.packageOverlay}>
        <View
          style={[styles.packageBadge, { backgroundColor: item.badgeColor }]}
        >
          <Text style={styles.packageBadgeText}>{item.badge}</Text>
        </View>
        <View style={styles.packageContent}>
          <Text style={styles.packageTitle}>{item.title}</Text>
          <Text style={styles.packageDescription}>{item.description}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView key={refreshKey} style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.avatarButton}
                onPress={() => navigation.navigate(SCREENS.PROFILE)}
              >
                <Image
                  source={{
                    uri:
                      userProfile?.profilePictureUrl ||
                      "https://api.dicebear.com/7.x/avataaars/png?seed=cute",
                  }}
                  style={styles.avatarImage}
                />
              </TouchableOpacity>
              <View>
                <Text style={styles.greetingText}>Xin chào,</Text>
                <Text style={styles.userName}>
                  {userProfile?.fullName || "Rider"}
                </Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => navigation.navigate("Notification")}
              >
                <Bell size={22} color="#004553" />
                <View style={styles.notificationDot} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <TouchableOpacity
            style={styles.searchContainer}
            onPress={() => navigation.navigate(SCREENS.HOME_SEARCH)}
            activeOpacity={0.9}
          >
            <View style={styles.searchLeft}>
              <Search size={20} color="#004553" />
              <Text style={styles.searchPlaceholder}>Bạn muốn đi đâu?</Text>
            </View>
            <View style={styles.searchIconRight}>
              <Navigation size={18} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroGradient}>
            <View style={styles.heroContent}>
              <View style={styles.heroTextContainer}>
                <Text style={styles.heroTitle}>
                  Đi cùng nhau, vui hơn gấp bội!
                </Text>
                <Text style={styles.heroSubtitle}>
                  Tiết kiệm chi phí, kết bạn mới
                </Text>
                <TouchableOpacity style={styles.heroButton}>
                  <Text style={styles.heroButtonText}>Khám phá ngay</Text>
                  <ChevronRight size={16} color="#fff" />
                </TouchableOpacity>
              </View>
              <Image
                source={{
                  uri: "https://cdn-icons-png.flaticon.com/512/3448/3448650.png",
                }}
                style={styles.heroImage}
              />
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bắt đầu nào!</Text>
          </View>

          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={handleCreateRide}
              activeOpacity={0.85}
            >
              <View style={styles.quickActionGradient}>
                <View style={styles.quickActionEmoji}>
                  <Text style={styles.emojiText}>🚙</Text>
                </View>
                <Text style={styles.quickActionTitle}>Tạo chuyến</Text>
                <Text style={styles.quickActionSubtitle}>
                  Lái xe & kiếm tiền
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate("PassengerRide")}
              activeOpacity={0.85}
            >
              <View style={styles.quickActionGradient}>
                <View style={styles.quickActionEmoji}>
                  <Text style={styles.emojiText}>🧑‍🤝‍🧑</Text>
                </View>
                <Text style={styles.quickActionTitle}>Tìm chuyến</Text>
                <Text style={styles.quickActionSubtitle}>Đi cùng bạn bè</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Services */}
        <View style={styles.servicesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dịch vụ</Text>
          </View>

          <View style={styles.servicesGrid}>
            <TouchableOpacity
              style={styles.serviceItem}
              onPress={() => navigation.navigate("Mission")}
            >
              <View style={styles.serviceIcon}>
                <Text style={styles.serviceEmoji}>🎁</Text>
              </View>
              <Text style={styles.serviceLabel}>Nhiệm vụ</Text>
              <View style={styles.pointsBadge}>
                <Star size={10} color="#004553" />
                <Text style={styles.pointsText}>{userPoints}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceItem}
              onPress={() => navigation.navigate("RideHistory")}
            >
              <View style={styles.serviceIcon}>
                <Text style={styles.serviceEmoji}>📋</Text>
              </View>
              <Text style={styles.serviceLabel}>Lịch sử</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceItem}
              onPress={() => navigation.navigate("Member")}
            >
              <View style={styles.serviceIcon}>
                <Text style={styles.serviceEmoji}>👑</Text>
              </View>
              <Text style={styles.serviceLabel}>Hội viên</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceItem}
              onPress={() => navigation.navigate("Report")}
            >
              <View style={styles.serviceIcon}>
                <Text style={styles.serviceEmoji}>💬</Text>
              </View>
              <Text style={styles.serviceLabel}>Hỗ trợ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tips Card */}
        <View style={styles.tipsSection}>
          <View style={styles.tipsCard}>
            <View style={styles.tipsContent}>
              <Text style={styles.tipsEmoji}>💡</Text>
              <View style={styles.tipsTextContainer}>
                <Text style={styles.tipsTitle}>Mẹo hay cho bạn!</Text>
                <Text style={styles.tipsText}>
                  Đặt chuyến sớm để có giá tốt nhất nhé~
                </Text>
              </View>
            </View>
            <Heart size={24} color="rgba(255,255,255,0.5)" />
          </View>
        </View>

        {/* Promotions */}
        <View style={styles.promotionSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Ưu đãi hot</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
              <ChevronRight size={16} color="#004553" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={promotions}
            renderItem={renderPromotion}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.promotionList}
          />
        </View>

        {/* Membership Cards */}
        <View style={styles.packagesSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Gói hội viên</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
              <ChevronRight size={16} color="#004553" />
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtitle}>
            Nâng cấp để nhận nhiều ưu đãi hơn
          </Text>
          <FlatList
            data={packages}
            renderItem={renderPackage}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.packagesList}
          />
        </View>
      </ScrollView>

      {/* Modal */}
      <Modal
        visible={showVehicleRequiredModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowVehicleRequiredModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalEmoji}>🚗</Text>
            <Text style={styles.modalTitle}>Đăng ký xe nào!</Text>
            <Text style={styles.modalMessage}>
              Bạn cần đăng ký thông tin xe trước khi tạo chuyến đi nhé!
              {"\n\n"}
              Vào <Text style={styles.modalHighlight}>
                Quản lý tài khoản
              </Text>{" "}
              để đăng ký xe của bạn nha~
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowVehicleRequiredModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Để sau</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={() => {
                  setShowVehicleRequiredModal(false);
                  navigation.navigate(SCREENS.PROFILE);
                }}
              >
                <Text style={styles.modalButtonTextPrimary}>
                  Đăng ký ngay ✨
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  // Header Styles
  header: {
    backgroundColor: "#004553",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  greetingEmoji: {
    fontSize: 32,
  },
  greetingText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "400",
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  notificationDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF6B6B",
    borderWidth: 2,
    borderColor: "#fff",
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#fff",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },

  // Search Bar
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    shadowColor: "#004553",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  searchLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: "#9CA3AF",
    flex: 1,
  },
  searchIconRight: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: "#004553",
    justifyContent: "center",
    alignItems: "center",
  },

  // Hero Banner
  heroBanner: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  heroGradient: {
    backgroundColor: "rgba(0, 69, 83, 0.05)",
    borderRadius: 24,
    padding: 20,
    overflow: "hidden",
  },
  heroContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#004553",
    marginBottom: 8,
    lineHeight: 28,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#004553",
    marginBottom: 16,
    opacity: 0.7,
  },
  heroButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#004553",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    alignSelf: "flex-start",
    gap: 6,
  },
  heroButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  heroImage: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },

  // Quick Actions
  quickActionsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#004553",
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  quickActionGradient: {
    backgroundColor: "#004553",
    padding: 20,
    alignItems: "center",
    minHeight: 150,
  },
  quickActionEmoji: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  emojiText: {
    fontSize: 28,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
    textAlign: "center",
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
  },

  // Services Grid
  servicesSection: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  servicesGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  serviceItem: {
    alignItems: "center",
    width: (width - 80) / 4,
  },
  serviceIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "rgba(0, 69, 83, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  serviceEmoji: {
    fontSize: 28,
  },
  serviceLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#004553",
    textAlign: "center",
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 69, 83, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
    gap: 3,
  },
  pointsText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#004553",
  },

  // Tips Card
  tipsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  tipsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#004553",
    padding: 16,
    borderRadius: 20,
  },
  tipsContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  tipsEmoji: {
    fontSize: 32,
  },
  tipsTextContainer: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
  },
  tipsText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
  },

  // Promotions Section
  promotionSection: {
    marginTop: 28,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  seeAllText: {
    fontSize: 14,
    color: "#004553",
    fontWeight: "600",
    marginRight: 4,
  },
  promotionList: {
    paddingHorizontal: 20,
  },
  promotionCard: {
    width: width * 0.72,
    height: 160,
    borderRadius: 24,
    marginRight: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  promotionImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  promotionOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
    padding: 16,
  },
  promotionContent: {
    flex: 1,
    justifyContent: "flex-end",
  },
  promotionTextContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  promotionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  promotionSubtitle: {
    fontSize: 13,
    color: "#fff",
    marginBottom: 10,
    opacity: 0.9,
  },
  promotionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: "flex-start",
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    color: "#004553",
    fontWeight: "600",
  },

  // Packages Section
  packagesSection: {
    marginTop: 28,
    paddingBottom: 20,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  packagesList: {
    paddingHorizontal: 20,
  },
  packageCard: {
    width: width * 0.7,
    height: 200,
    borderRadius: 24,
    marginRight: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  packageImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  packageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "space-between",
    padding: 16,
  },
  packageBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  packageBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  packageContent: {
    justifyContent: "flex-end",
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 6,
  },
  packageDescription: {
    fontSize: 13,
    color: "#fff",
    opacity: 0.9,
    lineHeight: 18,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 32,
    padding: 28,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    shadowColor: "#004553",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  modalEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#004553",
    marginBottom: 12,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  modalHighlight: {
    fontWeight: "700",
    color: "#004553",
  },
  modalButtons: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#004553",
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonTextSecondary: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },
  modalButtonTextPrimary: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});
export default Home;
