import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  AppState,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  Search,
  Bell,
  Bike,
  Users,
  Gift,
  Clock,
  Star,
  ChevronRight,
  Ban,
  Package,
  Navigation,
  Sparkles,
  Award,
} from "lucide-react-native";
import COLORS from "../../../constant/colors";
import SCREENS from "../../../screens";
import { getProfile } from "../../../services/userService";
import { getMyVehicle } from "../../../services/vehicleService";
import { getUserData, getToken } from "../../../utils/storage";
import { getAllVouchers } from "../../../services/voucherService";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../../config/supabaseClient";
import AsyncStorageService from "../../../services/AsyncStorageService";
import SnowEffect from "../../../components/SnowEffect";
import SpinWheel from "../../../components/SpinWheel";
import {
  checkDailySpin,
  performSpin,
} from "../../../services/dailySpinService";

const { width, height } = Dimensions.get("window");

const Home = ({ navigation }) => {
  const [searchText, setSearchText] = useState("");
  const insets = useSafeAreaInsets();
  const [refreshKey, setRefreshKey] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [vehicleStatus, setVehicleStatus] = useState(null);
  const [showVehicleRequiredModal, setShowVehicleRequiredModal] =
    useState(false);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [canSpin, setCanSpin] = useState(false);
  const [spinInfo, setSpinInfo] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  useEffect(() => {
    checkSpinStatus();
  }, []);

  const checkSpinStatus = async () => {
    try {
      const response = await checkDailySpin();
      // Response structure: { statusCode, message, data: { ... } }
      const data = response?.data?.data || response?.data;

      console.log("🔍 Full Response:", JSON.stringify(response, null, 2));
      console.log("🔍 Spin Data:", JSON.stringify(data, null, 2));

      // Reset state first
      setCanSpin(false);
      setSpinInfo(null);

      if (data) {
        console.log("📊 Spin Data:", {
          canSpinToday: data.canSpinToday,
          rewardPoints: data.rewardPoints,
          spinTime: data.spinTime,
          hasRewardPoints: !!data.rewardPoints,
        });

        // Check canSpinToday - it should be a boolean
        // If canSpinToday is explicitly true, user can spin
        if (data.canSpinToday === true || data.canSpinToday === "true") {
          console.log("✅ Can spin today");
          setCanSpin(true);
          setSpinInfo(null);
        }
        // If canSpinToday is explicitly false, user cannot spin
        else if (data.canSpinToday === false || data.canSpinToday === "false") {
          console.log("❌ Cannot spin today");
          setCanSpin(false);

          // Set spinInfo if rewardPoints exists
          if (data.rewardPoints != null && data.rewardPoints !== undefined) {
            console.log(
              "💰 Setting spinInfo with rewardPoints:",
              data.rewardPoints
            );
            setSpinInfo({
              rewardPoints: data.rewardPoints,
              spinTime: data.spinTime,
            });
          } else {
            console.log("⚠️ Cannot spin but rewardPoints is null/undefined");
            setSpinInfo(null);
          }
        }
        // If canSpinToday is undefined/null - check if we have rewardPoints
        // If no rewardPoints, assume user can spin (database is empty)
        else {
          console.log("⚠️ canSpinToday is undefined/null");
          if (data.rewardPoints == null) {
            console.log(
              "✅ No rewardPoints found - assuming can spin (empty DB)"
            );
            setCanSpin(true);
            setSpinInfo(null);
          } else {
            console.log(
              "❌ Has rewardPoints but canSpinToday is undefined - cannot spin"
            );
            setCanSpin(false);
            setSpinInfo({
              rewardPoints: data.rewardPoints,
              spinTime: data.spinTime,
            });
          }
        }
      } else {
        console.log("⚠️ No data in response - defaulting to can spin");
        // If no data, assume user can spin (database might be empty)
        setCanSpin(true);
        setSpinInfo(null);
      }
    } catch (error) {
      console.error("❌ Error checking spin status:", error);
      console.error("Error response:", error?.response?.data);
      // Chỉ log error nếu không phải 404 hoặc 500 (endpoint có thể chưa được implement)
      if (error?.response?.status !== 404 && error?.response?.status !== 500) {
        console.error("Error checking spin status:", error);
      }
      // On error, default to can spin (in case of empty DB or API issues)
      setCanSpin(true);
      setSpinInfo(null);
    }
  };

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
    loadVouchers();
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
    console.log("🔧 Home: useEffect for realtime listener is running");
    let channel;
    const processedMatches = new Set(); // Track processed match IDs

    const setupRealtimeListener = async () => {
      try {
        console.log("🔧 Home: setupRealtimeListener called");
        
        // Get user from API instead of AsyncStorage for reliability
        const profileResp = await getProfile();
        const user = profileResp?.data?.data;
        
        console.log("🔧 Home: User from API:", user?.id, user?.userType);
        console.log("🔧 Home: Supabase client exists:", !!supabase);
        
        if (!user?.id) {
          console.log("⚠️ Home: Cannot setup listener - no user ID");
          return;
        }
        
        if (!supabase) {
          console.log("⚠️ Home: Cannot setup listener - no supabase client");
          return;
        }

        console.log("🔔 Home: Setting up MATCH listener for user:", user.id, user.userType);

        // Use ALL table events without filter to avoid schema mismatch
        channel = supabase
          .channel(`matches_all`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "matches",
            },
            (payload) => {
              const newMatch = payload.new;
              
              // Client-side filter by passenger_id
              if (newMatch?.passenger_id !== user.id) {
                return; // Not for this user
              }
              
              console.log("🔔 Home: Received MATCH update:", newMatch?.status, "Match ID:", newMatch?.id);

              // Check if already processed this match
              const matchKey = `${newMatch?.id}_${newMatch?.status}`;
              if (processedMatches.has(matchKey)) {
                console.log("⏭️ Home: Already processed match", matchKey, "- skipping");
                return;
              }

              if (
                newMatch &&
                (newMatch.status === "IN_PROGRESS" ||
                  newMatch.status === "ACCEPTED" ||
                  newMatch.status === "DRIVER_ARRIVED")
              ) {
                console.log(
                  `🚀 Match ${newMatch.id} is ${newMatch.status}. Navigating...`
                );

                // Mark as processed
                processedMatches.add(matchKey);

                if (newMatch.status === "IN_PROGRESS") {
                  Alert.alert(
                    "Chuyến đi bắt đầu",
                    "Tài xế đã bắt đầu chuyến đi!"
                  );
                }

                navigation.navigate(SCREENS.MATCHED_RIDE, {
                  rideId: newMatch.id,
                });
              }
            }
          )
          .subscribe((status, err) => {
            if (err) {
              console.error("❌ Home: Subscription error:", err);
            }
            console.log("📡 Home: Match subscription status:", status);
          });
      } catch (error) {
        console.error("❌ Home: Error in setupRealtimeListener:", error);
      }
    };

    setupRealtimeListener();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      processedMatches.clear(); // Clear on unmount
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
      const storedUser = await getUserData();
      let profileData = storedUser || null;
      if (storedUser) {
        setUserProfile(storedUser);
      }

      const token = await getToken();
      let currentProfile = storedUser;

      if (token) {
        try {
          const profileResp = await getProfile();
          console.log("✅ Home: Profile response:", profileResp);
          const profile = profileResp?.data?.data; // Fix: nested data
          console.log("👤 Home: Profile data:", profile);
          setUserProfile(profile);
          currentProfile = profile;

          if (profile) profileData = profile;

          // Update storage with fresh data
          if (profile) {
            // Note: getUserData returns object, but we can update if needed
          }
        } catch (apiErr) {
          console.warn(
            "⚠️ Home: API failed, using stored data:",
            apiErr.message
          );
        }
      } else {
        console.log("⚠️ Home: No token, using stored data only");
      }

      if (currentProfile?.userType === "DRIVER") {
        try {
          const vehicleResp = await getMyVehicle();
          const vehicle = vehicleResp?.data?.data ?? vehicleResp?.data;
          setVehicleStatus(vehicle?.status || null);
        } catch (err) {
          if (err.response?.status !== 404) {
            console.warn("⚠️ Home: Error fetching vehicle:", err.message);
          }
          setVehicleStatus(null);
        }
      } else {
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

    navigation.navigate("CreateFixedRouteScreen");
  };

  const loadVouchers = async () => {
    try {
      setLoadingVouchers(true);
      const response = await getAllVouchers();
      // Handle ApiResponse wrapper
      const vouchersData = response?.data?.data ?? response?.data ?? [];
      const vouchersList = Array.isArray(vouchersData) ? vouchersData : [];
      // Filter only active vouchers and limit to 4
      const activeVouchers = vouchersList.filter((v) => v.isActive).slice(0, 4);
      setVouchers(activeVouchers);
      console.log("✅ Home: Loaded", activeVouchers.length, "vouchers");
    } catch (error) {
      console.error("❌ Home: Error loading vouchers:", error);
      setVouchers([]);
    } finally {
      setLoadingVouchers(false);
    }
  };

  const getVoucherImage = (voucher) => {
    // Use imageUrl if available
    if (voucher?.imageUrl) {
      return voucher.imageUrl;
    }

    // Map voucher codes to specific brand images
    const codeImageMap = {
      STARBUCKS:
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop",
      MCDONALD:
        "https://images.unsplash.com/photo-1551782450-17144efb9c50?w=400&h=300&fit=crop",
      "COCA-COLA":
        "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=300&fit=crop",
      KFC: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&h=300&fit=crop",
      SHOPEE:
        "https://images.unsplash.com/photo-1555529908-3af0358c7f32?w=400&h=300&fit=crop",
      LAZADA:
        "https://images.unsplash.com/photo-1555529908-3af0358c7f32?w=400&h=300&fit=crop",
      TIKI: "https://images.unsplash.com/photo-1555529908-3af0358c7f32?w=400&h=300&fit=crop",
    };

    if (voucher?.voucherCode) {
      const upperCode = voucher.voucherCode.toUpperCase();
      for (const [brand, imageUrl] of Object.entries(codeImageMap)) {
        if (upperCode.includes(brand)) {
          return imageUrl;
        }
      }
    }

    // Fallback to type-based images
    const typeImageMap = {
      FOOD_AND_BEVERAGE:
        "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop",
      SHOPPING:
        "https://images.unsplash.com/photo-1555529908-3af0358c7f32?w=400&h=300&fit=crop",
      VEHICLE_SERVICE:
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
    };

    return (
      typeImageMap[voucher?.voucherType] ||
      "https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=400&h=300&fit=crop"
    );
  };

  const getVoucherBadge = (voucher) => {
    if (voucher?.voucherCode) {
      const upperCode = voucher.voucherCode.toUpperCase();
      if (upperCode.includes("STARBUCKS")) return "COFFEE";
      if (upperCode.includes("MCDONALD") || upperCode.includes("KFC"))
        return "FOOD";
      if (
        upperCode.includes("SHOPEE") ||
        upperCode.includes("LAZADA") ||
        upperCode.includes("TIKI")
      )
        return "SHOP";
    }
    return "HOT";
  };

  const getVoucherDiscount = (voucher) => {
    if (voucher?.discountAmount) {
      return `${voucher.discountAmount.toLocaleString()}đ`;
    }
    if (voucher?.discountPercentage) {
      return `${voucher.discountPercentage}%`;
    }
    return "Ưu đãi";
  };

  const renderCategory = ({ item }) => {
    const handleCategoryPress = () => {
      switch (item.id) {
        case 1: // Tạo chuyến
          handleCreateRide();
          break;
        case 2: // Tìm xe
          navigation.navigate(SCREENS.HOME_SEARCH);
          break;
        case 3: // Nhiệm vụ
          navigation.navigate("Mission");
          break;
        case 4: // Vòng quay
          setShowSpinWheel(true);
          break;
        case 5: // Voucher
          navigation.navigate("Voucher");
          break;
        case 6: // Tìm chuyến cố định
          navigation.navigate("FindFixedRouteScreen");
          break;
        default:
          break;
      }
    };

    return (
      <TouchableOpacity
        style={styles.categoryItem}
        onPress={handleCategoryPress}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.categoryIcon,
            { backgroundColor: item.color + "20" },
          ]}
        >
          <Text style={styles.categoryEmoji}>{item.icon}</Text>
        </View>
        <Text style={styles.categoryLabel} numberOfLines={2}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderChristmasFeature = ({ item }) => (
    <TouchableOpacity
      style={styles.featureCard}
      activeOpacity={0.85}
      onPress={() => {
        // Navigate to feature detail or show modal
        Alert.alert(item.title, item.subtitle);
      }}
    >
      <LinearGradient
        colors={item.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.featureGradient}
      >
        <View style={styles.featureTop}>
          <View style={styles.featureIconBig}>
            <Text style={styles.featureEmojiLarge}>{item.icon}</Text>
          </View>
        </View>
        <View style={styles.featureBottom}>
          <Text style={styles.featureTitle}>{item.title}</Text>
          <Text style={styles.featureSubtitle}>{item.subtitle}</Text>
        </View>
        <View style={styles.featureSparkle}>
          <Sparkles size={24} color="#FFF" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderDeal = ({ item }) => (
    <TouchableOpacity
      style={[styles.dealCard, { backgroundColor: item.color }]}
      activeOpacity={0.85}
      onPress={() => {
        navigation.navigate("Voucher", {
          title: item.title,
          subtitle: `Sử dụng mã: ${item.code}`,
          code: item.code,
          badge: "Ưu đãi hôm nay",
          validFrom: new Date().toLocaleDateString("vi-VN"),
          validTo: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toLocaleDateString("vi-VN"),
          terms: "Áp dụng cho chuyến đi trong hôm nay. Không cộng dồn ưu đãi.",
        });
      }}
    >
      <View style={styles.dealIconWrapper}>
        <Text style={styles.dealEmoji}>{item.icon}</Text>
      </View>
      <View style={styles.dealContent}>
        <Text style={styles.dealTitle}>{item.title}</Text>
        <View style={styles.dealCodeBadge}>
          <Text style={styles.dealCode}>{item.code}</Text>
        </View>
      </View>
      <View style={styles.dealDiscount}>
        <Text style={styles.dealDiscountText}>{item.discount}</Text>
      </View>
    </TouchableOpacity>
  );

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

  const categories = [
    { id: 1, icon: "🏍️", label: "Tạo chuyến", color: "#FF6B9D" },
    { id: 2, icon: "🔍", label: "Tìm xe", color: "#FFA07A" },
    { id: 6, icon: "📍", label: "Tìm chuyến cố định", color: "#4ECDC4" },
    { id: 3, icon: "🎯", label: "Nhiệm vụ", color: "#FF69B4" },
    { id: 4, icon: "🎰", label: "Vòng quay", color: "#FF5370" },
    { id: 5, icon: "🎫", label: "Voucher", color: "#FFB6C1" },
  ];

  const christmasFeatures = [
    {
      id: 1,
      title: "🎅 Đón Ông già Noel",
      subtitle: "Chuyến đi miễn phí mỗi ngày",
      gradient: ["#FF6B9D", "#FF8FAB"],
      icon: "🎅",
    },
    {
      id: 2,
      title: "🎄 Cây thông thần kỳ",
      subtitle: "Tích điểm nhận quà đặc biệt",
      gradient: ["#4ECDC4", "#44A08D"],
      icon: "🎄",
    },
    {
      id: 3,
      title: "⭐ Sao Kim cương",
      subtitle: "Ưu đãi lên đến 50%",
      gradient: ["#FFD700", "#FFA500"],
      icon: "⭐",
    },
  ];

  const quickStats = [
    { 
      icon: "🏍️", 
      label: "Chuyến đi", 
      value: userProfile?.totalRides?.toString() || "0", 
      color: "#FFB6C1" 
    },
    { 
      icon: "⭐", 
      label: "Đánh giá", 
      value: userProfile?.rating ? userProfile.rating.toFixed(1) : "0.0", 
      color: "#FFD700" 
    },
    { 
      icon: "🎁", 
      label: "Xu", 
      value: userProfile?.coins?.toString() || "0", 
      color: "#FF69B4" 
    },
  ];

  const todayDeals = [
    {
      id: 1,
      title: "Giảm 30% chuyến đầu",
      code: "XMAS30",
      discount: "30%",
      color: "#FF6B9D",
      icon: "🎅",
    },
    {
      id: 2,
      title: "Miễn phí 2km đầu",
      code: "XMAS2KM",
      discount: "FREE",
      color: "#4ECDC4",
      icon: "🎄",
    },
    {
      id: 3,
      title: "Tặng 100 điểm",
      code: "XMAS100",
      discount: "+100",
      color: "#FFD700",
      icon: "⭐",
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
      style={[styles.packageCard, item.popular && styles.packageCardPopular]}
      activeOpacity={0.85}
      onPress={() => {
        navigation.navigate("MemberDetail", {
          title: item.title,
          image: item.image,
          badge: item.badge,
          badgeColor: item.badgeColor,
          description: item.features.join("\n"),
          benefits: item.features,
          price: item.price,
        });
      }}
    >
      {item.popular && (
        <View style={styles.popularBanner}>
          <Sparkles size={12} color="#FFF" />
          <Text style={styles.popularText}>PHỔ BIẾN NHẤT</Text>
          <Sparkles size={12} color="#FFF" />
        </View>
      )}
      <Image source={{ uri: item.image }} style={styles.packageImage} />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.85)"]}
        style={styles.packageOverlay}
      >
        <View
          style={[styles.packageBadge, { backgroundColor: item.badgeColor }]}
        >
          <Text style={styles.packageBadgeText}>{item.badge}</Text>
        </View>
        <View style={styles.packageContent}>
          <Text style={styles.packageTitle}>{item.title}</Text>
          <Text style={styles.packagePrice}>{item.price}/tháng</Text>
          <View style={styles.packageFeatures}>
            {item.features.map((feature, index) => (
              <View key={index} style={styles.packageFeatureRow}>
                <View style={styles.packageCheckmark}>
                  <Text style={styles.checkIcon}>✓</Text>
                </View>
                <Text style={styles.packageFeature}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const handleSpinComplete = async () => {
    try {
      const response = await performSpin();
      const data = response?.data?.data || response?.data;

      if (data && data.rewardPoints) {
        // Set canSpin to false immediately to prevent multiple spins
        setCanSpin(false);

        // Cập nhật spinInfo với reward mới
        setSpinInfo({
          rewardPoints: data.rewardPoints,
          spinTime: data.spinTime,
        });

        // Update user coins
        if (userProfile) {
          setUserProfile({
            ...userProfile,
            coins: (userProfile.coins || 0) + data.rewardPoints,
          });
        }

        // Refresh spin status to ensure backend state is synced
        setTimeout(() => {
          checkSpinStatus();
        }, 500);

        return data.rewardPoints;
      }
      return null;
    } catch (error) {
      console.error("Error performing spin:", error);
      // If error, still set canSpin to false to prevent retry
      setCanSpin(false);
      Alert.alert(
        "Lỗi",
        error?.response?.data?.message || "Không thể quay vòng quay"
      );
      return null;
    }
  };

  return (
    <SafeAreaView key={refreshKey} style={styles.container} edges={["top"]}>
      <SnowEffect />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
      >
        <LinearGradient
          colors={["#FF5370", "#FF6B9D", "#FF8FAB"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerDecor}>
            <Text style={styles.decorBulb}>💡</Text>
            <Text style={styles.decorStar}>⭐</Text>
            <Text style={styles.decorSnow}>❄️</Text>
            <Text style={styles.decorTree}>🎄</Text>
          </View>

          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerLeft}>
                <TouchableOpacity
                  style={styles.avatarContainer}
                  onPress={() => navigation.navigate(SCREENS.PROFILE)}
                >
                  <View style={styles.avatarBorder}>
                    <Image
                      source={{
                        uri:
                          userProfile?.profilePictureUrl ||
                          "https://api.dicebear.com/7.x/avataaars/png?seed=cute",
                      }}
                      style={styles.avatarImage}
                    />
                  </View>
                  <View style={styles.santaHatSmall}>
                    <Text style={styles.santaIcon}>🎅</Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.greetingContainer}>
                  <Text style={styles.greetingText}>Hello,</Text>
                  <Text style={styles.userName}>
                    {userProfile?.fullName ||
                      userProfile?.phoneNumber ||
                      "Rider"}{" "}
                    🎄
                  </Text>
                </View>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.headerIconButton}
                  onPress={() => navigation.navigate("Notification")}
                >
                  <View style={styles.iconWrapper}>
                    <Bell size={20} color="#FF5370" />
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationCount}>3</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.searchContainer}
              onPress={() => navigation.navigate(SCREENS.HOME_SEARCH)}
              activeOpacity={0.9}
            >
              <View style={styles.searchIconCircle}>
                <Search size={18} color="#FF5370" />
              </View>
              <Text style={styles.searchPlaceholder}>
                Bạn muốn đi đâu hôm nay?
              </Text>
              <View style={styles.searchButton}>
                <Navigation size={16} color="#FFF" />
              </View>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.categoriesSection}>
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statsContainer}>
            {quickStats.map((stat, index) => (
              <View
                key={index}
                style={[
                  styles.statCard,
                  { backgroundColor: stat.color + "20" },
                ]}
              >
                <Text style={styles.statEmoji}>{stat.icon}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.pointsBanner}>
          <LinearGradient
            colors={["#FFD700", "#FFA500"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.pointsGradient}
          >
            <View style={styles.pointsLeft}>
              <View style={styles.pointsIconCircle}>
                <Star size={24} color="#FFF" fill="#FFF" />
              </View>
              <View style={styles.pointsTextContainer}>
                <Text style={styles.pointsLabel}>Điểm thưởng của bạn</Text>
                <Text style={styles.pointsValue}>
                  {userProfile?.coins || userPoints} điểm
                </Text>
              </View>
            </View>
            <View style={styles.pointsRight}>
              <TouchableOpacity
                style={styles.serviceItem}
                onPress={() => navigation.navigate("Mission")}
              >
                <View
                  style={[styles.serviceIcon, { backgroundColor: "#F3E5F5" }]}
                >
                  <Text style={styles.serviceEmoji}>🎁</Text>
                </View>
                <Text style={styles.serviceLabel}>Nhiệm vụ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.serviceItem}
                onPress={() => navigation.navigate("Voucher")}
              >
                <View
                  style={[styles.serviceIcon, { backgroundColor: "#E0F7FA" }]}
                >
                  <Text style={styles.serviceEmoji}>🎟️</Text>
                </View>
                <Text style={styles.serviceLabel}>Voucher</Text>
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
            </View>
          </LinearGradient>
          <FlatList
            data={christmasFeatures}
            renderItem={renderChristmasFeature}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuresList}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔥 Ưu đãi hôm nay</Text>
          </View>
          <FlatList
            data={todayDeals}
            renderItem={renderDeal}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dealsList}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⭐ Khuyến mãi đặc biệt</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
              <ChevronRight size={16} color="#FF5370" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={promotions}
            renderItem={renderPromotion}
            keyExtractor={(item) =>
              (item.id || item.voucherId || Math.random()).toString()
            }
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.promotionsList}
            ListEmptyComponent={
              loadingVouchers ? (
                <View style={styles.promotionLoadingContainer}>
                  <ActivityIndicator size="small" color="#FF5370" />
                </View>
              ) : null
            }
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>👑 Gói hội viên cao cấp</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
              <ChevronRight size={16} color="#FF5370" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={mockPackages}
            renderItem={renderPackage}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.packagesList}
          />
        </View>

        <View style={styles.footer}>
          <View style={styles.footerCard}>
            <View style={styles.footerTop}>
              <Text style={styles.footerEmoji}>🎅🎄⭐</Text>
              <Text style={styles.footerTitle}>
                Chúc bạn một mùa Giáng sinh an lành!
              </Text>
            </View>
            <Text style={styles.footerSubtitle}>
              Cùng RideMate tận hưởng những chuyến đi tuyệt vời ❤️
            </Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showVehicleRequiredModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVehicleRequiredModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalDecorTop}>
                <Text style={styles.modalDecorEmoji}>🎄</Text>
              </View>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.modalIconCircle}>
                <Text style={styles.modalEmoji}>🏍️</Text>
              </View>
              <Text style={styles.modalTitle}>Đăng ký xe của bạn!</Text>
              <Text style={styles.modalMessage}>
                Để tạo chuyến đi, bạn cần đăng ký thông tin xe trước nhé!
                {"\n\n"}
                Đi tới{" "}
                <Text style={styles.modalHighlight}>Quản lý tài khoản</Text> để
                hoàn tất đăng ký 🎁
              </Text>
            </View>
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
                <LinearGradient
                  colors={["#FF5370", "#FF6B9D"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonTextPrimary}>
                    Đăng ký ngay ✨
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <SpinWheel
        visible={showSpinWheel}
        onClose={() => setShowSpinWheel(false)}
        onSpinComplete={handleSpinComplete}
        canSpin={canSpin}
        spinInfo={spinInfo}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF5F7",
  },

  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    position: "relative",
  },
  headerDecor: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 6,
    marginBottom: 8,
  },
  decorBulb: { fontSize: 18, opacity: 0.8 },
  decorStar: { fontSize: 18, opacity: 0.8 },
  decorSnow: { fontSize: 18, opacity: 0.8 },
  decorTree: { fontSize: 18, opacity: 0.8 },
  header: {
    paddingTop: 8,
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
  avatarContainer: {
    position: "relative",
  },
  avatarBorder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 3,
    borderColor: "#FFF",
    padding: 2,
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
  },
  santaHatSmall: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 2,
  },
  santaIcon: {
    fontSize: 16,
  },
  greetingContainer: {
    justifyContent: "center",
  },
  greetingText: {
    fontSize: 14,
    color: "#FFF",
    fontWeight: "500",
    opacity: 0.95,
  },
  userName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFF",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
  },
  headerIconButton: {
    position: "relative",
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  notificationBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#FF5370",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  notificationCount: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 6,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  searchIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFE5EC",
    justifyContent: "center",
    alignItems: "center",
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: "#999",
    fontWeight: "500",
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FF5370",
    justifyContent: "center",
    alignItems: "center",
  },

  categoriesSection: {
    marginTop: 20,
  },
  categoriesList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryItem: {
    alignItems: "center",
    width: 70,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryEmoji: {
    fontSize: 28,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },

  statsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FF5370",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF5370",
  },

  pointsBanner: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  pointsGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  pointsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  pointsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pointsIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  pointsTextContainer: {
    flex: 1,
  },
  pointsLabel: {
    fontSize: 12,
    color: "#FFF",
    fontWeight: "600",
    opacity: 0.9,
  },
  pointsValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFF",
    marginTop: 2,
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  pointsButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },

  section: {
    marginTop: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FF5370",
  },

  featuresList: {
    paddingHorizontal: 20,
    gap: 14,
  },
  featureCard: {
    width: width * 0.7,
    height: 180,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  featureGradient: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
    position: "relative",
  },
  featureTop: {
    alignItems: "flex-start",
  },
  featureIconBig: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  featureEmojiLarge: {
    fontSize: 36,
  },
  featureBottom: {
    gap: 4,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFF",
  },
  featureSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFF",
    opacity: 0.9,
  },
  featureSparkle: {
    position: "absolute",
    top: 20,
    right: 20,
  },

  dealsList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  dealCard: {
    width: width * 0.75,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  dealIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  dealEmoji: {
    fontSize: 32,
  },
  dealContent: {
    flex: 1,
    gap: 6,
  },
  dealTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFF",
  },
  dealCodeBadge: {
    backgroundColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  dealCode: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFF",
  },
  dealDiscount: {
    backgroundColor: "#FFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  dealDiscountText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FF5370",
  },

  promotionsList: {
    paddingHorizontal: 20,
    gap: 14,
  },
  promotionLoadingContainer: {
    width: width * 0.8,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  promotionCard: {
    width: width * 0.8,
    height: 200,
    borderRadius: 24,
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
  },
  promotionOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingTop: 40,
  },
  promotionBadgeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  promotionBadge: {
    backgroundColor: "#FF5370",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  promotionBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFF",
  },
  promotionDiscount: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  promotionDiscountText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FF5370",
  },
  promotionContent: {
    gap: 4,
  },
  promotionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFF",
  },
  promotionSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFF",
    opacity: 0.95,
  },

  packagesList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  packageCard: {
    width: width * 0.72,
    height: 360,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    position: "relative",
  },
  packageCardPopular: {
    borderWidth: 3,
    borderColor: "#FFD700",
  },
  popularBanner: {
    position: "absolute",
    top: 20,
    left: -30,
    right: -30,
    backgroundColor: "#FFD700",
    paddingVertical: 6,
    paddingHorizontal: 40,
    transform: [{ rotate: "-45deg" }],
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  popularText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFF",
  },
  packageImage: {
    width: "100%",
    height: "100%",
  },
  packageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    justifyContent: "space-between",
  },
  packageBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 40,
  },
  packageBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFF",
  },
  packageContent: {
    gap: 8,
  },
  packageTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFF",
  },
  packagePrice: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFD700",
    marginBottom: 8,
  },
  packageFeatures: {
    gap: 8,
  },
  packageFeatureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  packageCheckmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#4ECDC4",
    justifyContent: "center",
    alignItems: "center",
  },
  checkIcon: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFF",
  },
  packageFeature: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFF",
    flex: 1,
  },

  footer: {
    paddingHorizontal: 20,
    marginTop: 32,
    marginBottom: 20,
  },
  footerCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: "#FFE5EC",
  },
  footerTop: {
    alignItems: "center",
    marginBottom: 12,
  },
  footerEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FF5370",
    textAlign: "center",
  },
  footerSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
    textAlign: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  modalHeader: {
    alignItems: "center",
    paddingTop: 12,
  },
  modalDecorTop: {
    marginBottom: -20,
  },
  modalDecorEmoji: {
    fontSize: 40,
  },
  modalBody: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 20,
  },
  modalIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFE5EC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modalEmoji: {
    fontSize: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FF5370",
    marginBottom: 12,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 15,
    fontWeight: "500",
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 28,
  },
  modalHighlight: {
    fontWeight: "800",
    color: "#FF5370",
  },
  modalButtons: {
    flexDirection: "row",
    paddingHorizontal: 32,
    gap: 12,
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonTextSecondary: {
    fontSize: 15,
    fontWeight: "700",
    color: "#999",
  },
  modalButtonPrimary: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalButtonGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonTextPrimary: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFF",
  },

  serviceItem: {
    alignItems: "center",
    gap: 8,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  serviceEmoji: {
    fontSize: 24,
  },
  serviceLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFF",
  },
});

export default Home;
