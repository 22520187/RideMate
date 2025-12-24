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
import { getMyVouchers } from "../../../services/voucherService";
import { getMyMissions } from "../../../services/missionService";
import { getUserData, getToken } from "../../../utils/storage";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../../config/supabaseClient";
import AsyncStorageService from "../../../services/AsyncStorageService";

const { width } = Dimensions.get("window");

const Home = ({ navigation }) => {
  const [searchText, setSearchText] = useState("");
  const insets = useSafeAreaInsets();
  const [refreshKey, setRefreshKey] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [vehicleStatus, setVehicleStatus] = useState(null);
  const [showVehicleRequiredModal, setShowVehicleRequiredModal] =
    useState(false);

  // API-backed data for Services: Missions + My Vouchers (used for Home badges/quick info)
  const [myMissions, setMyMissions] = useState([]);
  const [myVouchers, setMyVouchers] = useState([]);
  const [mockPromotions, setMockPromotions] = useState([]);
  const [mockPackages, setMockPackages] = useState([]);

  // Mock data for advertising sections: Hot Promotions + Membership Packages
  const buildMockPromotions = () => [
    {
      id: 1,
      title: "Tích điểm – đổi ngay voucher!",
      subtitle: "Đổi voucher giảm 30.000đ cho chuyến đầu tiên",
      image:
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=400&fit=crop",
      badge: "Ưu đãi đặc biệt",
      validFrom: "01/12/2025",
      validTo: "31/12/2025",
      terms:
        "Áp dụng cho người dùng RideMate. Không cộng dồn ưu đãi. Số lượng có hạn.",
      points: 0,
      // Optional marketing fields
      ctaLabel: "Xem chi tiết",
    },
    {
      id: 2,
      title: "Chuyến đi miễn phí",
      subtitle: "Hoàn 100% điểm cho chuyến đầu tiên",
      image:
        "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=400&fit=crop",
      badge: "Mới",
      validFrom: "15/12/2025",
      validTo: "15/01/2026",
      terms: "Hoàn điểm trong 24h sau khi kết thúc chuyến. Áp dụng 1 lần/tài khoản.",
      points: 0,
      ctaLabel: "Nhận ưu đãi",
    },
    {
      id: 3,
      title: "Đối tác Phúc Long",
      subtitle: "Giảm 20% khi đặt đồ uống",
      image:
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=400&fit=crop",
      badge: "Hot",
      validFrom: "01/12/2025",
      validTo: "31/01/2026",
      terms: "Áp dụng tại cửa hàng đối tác. Xuất trình mã tại quầy thanh toán.",
      points: 500,
      ctaLabel: "Đổi ngay",
    },
  ];

  const buildMockPackages = () => [
    {
      id: 1,
      title: "RideMate Premium",
      description: "Ưu đãi đặc biệt mọi chuyến xe\nTích điểm nhanh gấp đôi",
      image:
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=500&fit=crop",
      badge: "Phổ biến",
      badgeColor: COLORS.ORANGE,
      price: "49.000đ/tháng",
      benefits: [
        "Tích điểm x2 cho mọi chuyến",
        "Ưu tiên hỗ trợ trong giờ cao điểm",
        "Nhận ưu đãi độc quyền mỗi tuần",
      ],
    },
    {
      id: 2,
      title: "RideMate VIP",
      description: "Trải nghiệm dịch vụ cao cấp\nHỗ trợ ưu tiên 24/7",
      image:
        "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=500&fit=crop",
      badge: "Cao cấp",
      badgeColor: COLORS.PURPLE,
      price: "99.000đ/tháng",
      benefits: [
        "Tích điểm x3",
        "Hỗ trợ ưu tiên 24/7",
        "Ưu tiên ghép chuyến nhanh hơn",
      ],
    },
    {
      id: 3,
      title: "RideMate Family",
      description: "Chia sẻ cho cả gia đình\nTối đa 5 thành viên",
      image:
        "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&h=500&fit=crop",
      badge: "Tiết kiệm",
      badgeColor: COLORS.GREEN,
      price: "129.000đ/tháng",
      benefits: [
        "Tối đa 5 thành viên",
        "Tích điểm chung cho cả nhóm",
        "Ưu đãi theo nhóm mỗi tháng",
      ],
    },
  ];

  // Initialize advertising mock data once
  useEffect(() => {
    setMockPromotions(buildMockPromotions());
    setMockPackages(buildMockPackages());
  }, []);

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

  // Listen for realtime MATCH updates (to auto-navigate when trip starts/drivers accept)
  useEffect(() => {
    let channel;
    
    const setupRealtimeListener = async () => {
      const user = await AsyncStorageService.getUser();
      if (!user?.id || !supabase) return;

      console.log('🔔 Home: Setting up MATCH listener for passenger:', user.id);
      
      channel = supabase
        .channel(`public:matches:passenger_id=eq.${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*', // Listen for INSERT and UPDATE
            schema: 'public',
            table: 'matches',
            filter: `passenger_id=eq.${user.id}`,
          },
          (payload) => {
            const newMatch = payload.new;
            console.log('🔔 Home: Received MATCH update:', newMatch?.status);
            
            // Auto navigate based on status
            if (newMatch && (
                newMatch.status === 'IN_PROGRESS' || 
                newMatch.status === 'ACCEPTED' || 
                newMatch.status === 'DRIVER_ARRIVED'
            )) {
                console.log(`🚀 Match ${newMatch.id} is ${newMatch.status}. Navigating...`);
                
                // Show simple feedback
                if (newMatch.status === 'IN_PROGRESS') {
                    Alert.alert("Chuyến đi bắt đầu", "Tài xế đã bắt đầu chuyến đi!");
                }
                
                // Navigate to MatchedRideScreen with the match ID
                navigation.navigate(SCREENS.MATCHED_RIDE, { 
                    rideId: newMatch.id 
                });
            }
          }
        )
        .subscribe();
    };

    setupRealtimeListener();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadUserData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadUserData = async () => {
    try {
      console.log("🔄 Home: Loading user data...");

      // Load from storage first
      const storedUser = await getUserData();
      let profileData = storedUser || null;
      if (storedUser) {
        console.log("👤 Home: Loaded from storage:", storedUser);
        setUserProfile(storedUser);
      }

      // Then try to fetch from API if token exists
      const token = await getToken();
      let currentProfile = storedUser; // Dùng storedUser làm fallback

      if (token) {
        try {
          const [profileResp, myVouchersResp, myMissionsResp] =
            await Promise.all([
              getProfile(),
              getMyVouchers().catch((e) => {
                console.warn("⚠️ Home: getMyVouchers failed:", e?.message);
                return null;
              }),
              getMyMissions().catch((e) => {
                console.warn("⚠️ Home: getMyMissions failed:", e?.message);
                return null;
              }),
            ]);

          console.log("✅ Home: Profile response:", profileResp);
          const profile = profileResp?.data?.data; // Fix: nested data
          console.log("👤 Home: Profile data:", profile);
          setUserProfile(profile);
          currentProfile = profile; // Cập nhật currentProfile

          // Track latest profile locally for follow-up logic
          if (profile) profileData = profile;

          // My vouchers
          const myVPayload =
            myVouchersResp?.data?.data ?? myVouchersResp?.data ?? myVouchersResp;
          if (Array.isArray(myVPayload)) {
            setMyVouchers(myVPayload);
          } else if (myVouchersResp) {
            setMyVouchers([]);
          }

          // My missions
          const myMPayload =
            myMissionsResp?.data?.data ?? myMissionsResp?.data ?? myMissionsResp;
          if (Array.isArray(myMPayload)) {
            setMyMissions(myMPayload);
          } else if (myMissionsResp) {
            setMyMissions([]);
          }

          // Update storage with fresh data
          if (profile) {
            // Note: getUserData returns object, but we can update if needed
          }
        } catch (apiErr) {
          console.warn(
            "⚠️ Home: API failed, using stored data:",
            apiErr.message
          );
          // Keep stored data
        }
      } else {
        console.log("⚠️ Home: No token, using stored data only");
        setMyVouchers([]);
        setMyMissions([]);
      }

      // Chỉ fetch vehicle khi user là DRIVER
      if (currentProfile?.userType === "DRIVER") {
        try {
          const vehicleResp = await getMyVehicle();
          const vehicle = vehicleResp?.data?.data ?? vehicleResp?.data;
          console.log("🚗 Home: Vehicle status:", vehicle?.status);
          setVehicleStatus(vehicle?.status || null);
        } catch (err) {
          // Chỉ log nếu không phải 404 (vì 404 là bình thường nếu driver chưa đăng ký vehicle)
          if (err.response?.status !== 404) {
            console.warn("⚠️ Home: Error fetching vehicle:", err.message);
          } else {
            console.log("ℹ️ Home: No vehicle registered yet");
          }
          setVehicleStatus(null);
        }
      } else {
        // PASSENGER không cần vehicle
        setVehicleStatus(null);
      }
    } catch (err) {
      console.error("❌ Home: Failed to load user data:", err);
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
    if (!checkCanCreateRide()) {
      return;
    }

    // Navigate directly to Create Fixed Route
    navigation.navigate("CreateFixedRouteScreen");
  };

  const currentRide = {
    hasActiveRide: false,
    type: "driver",
    destination: "Trường Đại học Công nghệ",
    time: "15 phút",
    passengers: [],
  };

  const userPoints = 1250;

  // My vouchers: UserVoucherDto status = UNUSED | REDEEMED | EXPIRED
  const availableVoucherCount = myVouchers.filter(
    (v) => v?.status === "UNUSED"
  ).length;

  // My missions: UserMissionDto. Show count of missions that still need attention:
  // - not completed OR completed but reward not claimed
  const activeMissionCount = myMissions.filter(
    (m) => m?.isCompleted !== true || m?.rewardClaimed !== true
  ).length;

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
      subtitle: "Matching tài xế",
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

  const renderPromotion = ({ item }) => (
    <TouchableOpacity
      style={styles.promotionCard}
      onPress={() => {
        navigation.navigate("Voucher", {
          title: item.title,
          subtitle: item.subtitle,
          image: item.image,
          badge: item.badge,
          validFrom: item.validFrom,
          validTo: item.validTo,
          terms: item.terms,
          code: item.points > 0 ? undefined : "RIDEMATE30",
        });
      }}
    >
      <Image source={{ uri: item.image }} style={styles.promotionImage} />
      <View style={styles.promotionContent}>
        <View style={styles.promotionBadge}>
          <Star size={12} color={COLORS.YELLOW} />
          <Text style={styles.badgeText}>{item.badge}</Text>
        </View>
        <Text style={styles.promotionTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.promotionSubtitle} numberOfLines={1}>
          {item.subtitle}
        </Text>
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
                  {userProfile?.fullName || userProfile?.phoneNumber || "Rider"}
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

        {/* Quick Actions - 2 Large Cards */}
        <View style={styles.quickActionsSection}>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={handleCreateRide}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.quickActionGradient,
                  { backgroundColor: "#004553" },
                ]}
              >
                <View style={styles.quickActionEmoji}>
                  <Text style={styles.emojiText}>🚗</Text>
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
              <View
                style={[
                  styles.quickActionGradient,
                  { backgroundColor: "#00796B" },
                ]}
              >
                <View style={styles.quickActionEmoji}>
                  <Text style={styles.emojiText}>🔍</Text>
                </View>
                <Text style={styles.quickActionTitle}>Tìm người đi</Text>
                <Text style={styles.quickActionSubtitle}>Matching tài xế</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Add Row for Fixed Routes */}
          <View style={[styles.quickActionsRow, { marginTop: 14 }]}>
            <TouchableOpacity
              style={styles.quickActionCardWide}
              onPress={() => navigation.navigate("FixedRoutesScreen")}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.quickActionGradient,
                  {
                    backgroundColor: "#0097A7",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                ]}
              >
                <View style={styles.quickActionEmoji}>
                  <Text style={styles.emojiText}>🚌</Text>
                </View>
                <View style={{ marginLeft: 16 }}>
                  <Text style={styles.quickActionTitle}>Chuyến đi cố định</Text>
                  <Text style={styles.quickActionSubtitle}>
                    Tìm chuyến theo lịch trình
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Points Card */}
        <View style={styles.pointsCardSection}>
          <View style={styles.pointsCard}>
            <View style={styles.pointsLeft}>
              <View style={styles.activateBadge}>
                <Text style={styles.activateText}>Kích hoạt</Text>
              </View>
              <Text style={styles.pointsLabel}>RideMate Pay</Text>
            </View>
            <View style={styles.pointsDivider} />
            <View style={styles.pointsRight}>
              <Text style={styles.pointsValueLabel}>Điểm thưởng</Text>
              <View style={styles.pointsValueRow}>
                <Star size={16} color="#004553" />
                <Text style={styles.pointsValue}>
                  {userProfile?.coins || userPoints}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Services Section */}
        <View style={styles.servicesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dịch vụ</Text>
          </View>

          <View style={styles.servicesGrid}>
            <TouchableOpacity
              style={styles.serviceItem}
              onPress={() => navigation.navigate(SCREENS.MISSION)}
            >
              <View
                style={[styles.serviceIcon, { backgroundColor: "#F3E5F5" }]}
              >
                <Text style={styles.serviceEmoji}>🎁</Text>
              </View>
              <Text style={styles.serviceLabel}>Nhiệm vụ</Text>
              {activeMissionCount > 0 && (
                <View style={styles.serviceMiniBadge}>
                  <Text style={styles.serviceMiniBadgeText}>
                    {activeMissionCount} đang làm
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceItem}
              onPress={() =>
                navigation.navigate(SCREENS.VOUCHER, { myVouchers })
              }
            >
              <View
                style={[styles.serviceIcon, { backgroundColor: "#E0F7FA" }]}
              >
                <Text style={styles.serviceEmoji}>🎟️</Text>
              </View>
              <Text style={styles.serviceLabel}>Voucher</Text>
              {availableVoucherCount > 0 && (
                <View style={styles.serviceMiniBadge}>
                  <Text style={styles.serviceMiniBadgeText}>
                    {availableVoucherCount} khả dụng
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceItem}
              onPress={() => navigation.navigate("Member")}
            >
              <View
                style={[styles.serviceIcon, { backgroundColor: "#FFF8E1" }]}
              >
                <Text style={styles.serviceEmoji}>👑</Text>
              </View>
              <Text style={styles.serviceLabel}>Hội viên</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceItem}
              onPress={() => navigation.navigate("Notification")}
            >
              <View
                style={[styles.serviceIcon, { backgroundColor: "#FCE4EC" }]}
              >
                <Text style={styles.serviceEmoji}>🔔</Text>
              </View>
              <Text style={styles.serviceLabel}>Thông báo</Text>
            </TouchableOpacity>
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
            data={mockPromotions}
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
            data={mockPackages}
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
    paddingBottom: 28,
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
    marginTop: 2,
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
    borderRadius: 12,
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
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#004553",
    justifyContent: "center",
    alignItems: "center",
  },

  // Hero Banner
  heroBanner: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  heroGradient: {
    backgroundColor: "rgba(0, 69, 83, 0.06)",
    borderRadius: 16,
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
    fontSize: 24,
    fontWeight: "800",
    color: "#004553",
    marginBottom: 10,
    lineHeight: 30,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#004553",
    marginBottom: 18,
    opacity: 0.7,
  },
  heroButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#004553",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: "flex-start",
    gap: 6,
  },
  heroButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  heroImage: {
    width: 110,
    height: 110,
    resizeMode: "contain",
  },

  // Quick Actions
  quickActionsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#004553",
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: 14,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionCardWide: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionGradient: {
    backgroundColor: "#004553",
    padding: 24,
    alignItems: "center",
    minHeight: 160,
    justifyContent: "center",
  },
  quickActionEmoji: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emojiText: {
    fontSize: 32,
  },
  quickActionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 6,
    textAlign: "center",
  },
  quickActionSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },

  // Services Grid
  servicesSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  servicesGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  serviceItem: {
    alignItems: "center",
    width: (width - 40) / 4,
  },
  serviceIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  serviceEmoji: {
    fontSize: 24,
  },
  serviceLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#1C1C1E",
    textAlign: "center",
  },
  serviceMiniBadge: {
    marginTop: 6,
    backgroundColor: "rgba(0, 69, 83, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  serviceMiniBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#004553",
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
    marginTop: 28,
  },
  tipsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#004553",
    padding: 16,
    borderRadius: 12,
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

  // Points Card Section - Like Grab's payment card
  pointsCardSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  pointsCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  pointsLeft: {
    flex: 1,
  },
  activateBadge: {
    backgroundColor: "#004553",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  activateText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  pointsLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  pointsDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E5E5EA",
    marginHorizontal: 16,
  },
  pointsRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  pointsValueLabel: {
    fontSize: 12,
    color: "#8E8E93",
    marginBottom: 4,
  },
  pointsValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pointsValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#004553",
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
    width: width * 0.8,
    height: 120,
    borderRadius: 12,
    marginRight: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  promotionImage: {
    width: 120,
    height: "100%",
    resizeMode: "cover",
  },
  promotionContent: {
    flex: 1,
    padding: 14,
    justifyContent: "center",
  },
  promotionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 6,
    lineHeight: 20,
  },
  promotionSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 0,
  },
  promotionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 69, 83, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    gap: 4,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10,
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
    height: 180,
    borderRadius: 12,
    marginRight: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
