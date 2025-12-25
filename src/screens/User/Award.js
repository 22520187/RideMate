import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Image,
  AppState,
  ActivityIndicator,
} from "react-native";
import Toast from "react-native-toast-message";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import COLORS from "../../constant/colors";
import { MaterialIcons } from "@expo/vector-icons";
import {
  getAllVouchers,
  getMyVouchers,
  redeemVoucher,
} from "../../services/voucherService";
import { getProfile } from "../../services/userService";
import { useNavigation, useRoute } from "@react-navigation/native";
import GradientHeader from "../../components/GradientHeader";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles } from "lucide-react-native";
import SnowEffect from "../../components/SnowEffect";

const { width: screenWidth } = Dimensions.get("window");

const Award = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [points, setPoints] = useState(0);
  const insets = useSafeAreaInsets();
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === "active") {
        // Force component re-render để refresh SafeArea insets
        setRefreshKey((prev) => prev + 1);
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription?.remove();
  }, []);

  const [banners] = useState([
    {
      id: "b1",
      title: "Đổi điểm nhận voucher",
      subtitle: "Tích điểm từ mỗi chuyến đi",
      image: require("../../../assets/banner1.png"),
    },
    {
      id: "b2",
      title: "Ưu đãi đặc biệt",
      subtitle: "Giảm giá lên đến 50%",
      image: require("../../../assets/banner2.jpg"),
    },
    {
      id: "b3",
      title: "Chương trình mới",
      subtitle: "Đổi điểm nhận quà tặng",
      image: require("../../../assets/banner3.jpg"),
    },
  ]);

  const [promos, setPromos] = useState([]);
  const [myVouchers, setMyVouchers] = useState([]);

  const [categories] = useState([
    { id: "all", name: "Tất cả", icon: "apps" },
    { id: "food_and_beverage", name: "Đồ ăn & Uống", icon: "local-cafe" },
    { id: "shopping", name: "Mua sắm", icon: "shopping-cart" },
    { id: "vehicle_service", name: "Dịch vụ xe", icon: "local-gas-station" },
  ]);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState(
    route?.params?.initialTab || "vouchers"
  ); // 'vouchers', 'history'
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const bannerScrollRef = useRef(null);

  // Load data from API
  const loadData = async () => {
    try {
      const [vouchersResponse, myVouchersResponse, profileResponse] =
        await Promise.all([getAllVouchers(), getMyVouchers(), getProfile()]);

      const unwrapApiPayload = (resp) => resp?.data?.data ?? resp?.data ?? resp;

      console.log(
        "📦 Vouchers Response:",
        JSON.stringify(vouchersResponse, null, 2)
      );
      console.log(
        "📦 My Vouchers Response:",
        JSON.stringify(myVouchersResponse, null, 2)
      );
      console.log(
        "📦 Profile Response:",
        JSON.stringify(profileResponse, null, 2)
      );

      const vouchersPayload = unwrapApiPayload(vouchersResponse);
      const myVouchersPayload = unwrapApiPayload(myVouchersResponse);
      const profilePayload = unwrapApiPayload(profileResponse);

      // Vouchers list
      if (Array.isArray(vouchersPayload)) {
        console.log("✅ Setting promos:", vouchersPayload.length, "vouchers");
        setPromos(vouchersPayload);
      } else {
        console.log("❌ Vouchers response has no data array");
      }

      // My vouchers list
      if (Array.isArray(myVouchersPayload)) {
        console.log(
          "✅ Setting my vouchers:",
          myVouchersPayload.length,
          "vouchers"
        );
        setMyVouchers(myVouchersPayload);
      } else {
        console.log("❌ My vouchers response has no data array");
        // Empty array is still valid
        if (myVouchersResponse?.data || myVouchersResponse) {
          setMyVouchers([]);
        }
      }

      // Profile
      if (profilePayload) {
        console.log("✅ Setting points:", profilePayload.coins);
        setPoints(profilePayload.coins || 0);
      } else {
        console.log("❌ Profile response has no data field");
      }
    } catch (error) {
      console.error("❌ Error loading data:", error);
      console.error("Error details:", error.response?.data);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tải dữ liệu. Vui lòng thử lại.",
        position: "top",
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Refresh handler
  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Auto slide banner
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => {
        const nextIndex = prevIndex === banners.length - 1 ? 0 : prevIndex + 1;
        // Scroll to the next banner
        if (bannerScrollRef.current) {
          bannerScrollRef.current.scrollTo({
            x: nextIndex * screenWidth,
            animated: true,
          });
        }
        return nextIndex;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [banners.length]);

  // Get voucher type badge and category
  const getVoucherTypeInfo = (type) => {
    switch (type) {
      case "FOOD_AND_BEVERAGE":
        return {
          category: "food_and_beverage",
          icon: "local-cafe",
          label: "Đồ ăn & Uống",
        };
      case "SHOPPING":
        return {
          category: "shopping",
          icon: "shopping-cart",
          label: "Mua sắm",
        };
      case "VEHICLE_SERVICE":
        return {
          category: "vehicle_service",
          icon: "local-gas-station",
          label: "Dịch vụ xe",
        };
      default:
        return { category: "all", icon: "local-offer", label: "Khác" };
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  // Filter promos by category
  const filteredPromos =
    selectedCategory === "all"
      ? promos
      : promos.filter((promo) => {
          const typeInfo = getVoucherTypeInfo(promo.voucherType);
          return typeInfo.category === selectedCategory;
        });

  const canRedeem = (promo) => {
    // Check if user already has this voucher
    const alreadyHas = myVouchers.some((v) => v.voucher?.id === promo.id);
    return !alreadyHas && points >= promo.cost && promo.isActive;
  };

  const openRedeemModal = (promo) => {
    setSelectedPromo(promo);
    setModalVisible(true);
  };

  const confirmRedeem = async () => {
    if (!selectedPromo) return;

    try {
      setModalVisible(false);
      setLoading(true);

      const response = await redeemVoucher(selectedPromo.id);

      const unwrapApiPayload = (resp) => resp?.data?.data ?? resp?.data ?? resp;
      const unwrapApiMessage = (resp) => resp?.data?.message ?? resp?.message;
      const redeemPayload = unwrapApiPayload(response);
      const redeemMessage = unwrapApiMessage(response);

      // Check if redeem was successful (payload exists or statusCode 200)
      if (response?.data?.statusCode === 200 || redeemPayload) {
        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: redeemMessage || "Đổi voucher thành công!",
          position: "top",
          visibilityTime: 3000,
        });
        // Reload data
        await loadData();
      } else {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: redeemMessage || "Không thể đổi voucher.",
          position: "top",
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      console.error("Redeem error:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2:
          error.response?.data?.message ||
          error.message ||
          "Không thể đổi voucher. Vui lòng thử lại.",
        position: "top",
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const renderBannerSlider = () => (
    <View style={styles.bannerContainer}>
      <ScrollView
        ref={bannerScrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / screenWidth
          );
          setCurrentBannerIndex(index);
        }}
        style={styles.bannerScroll}
      >
        {banners.map((banner, index) => (
          <View key={banner.id} style={styles.bannerSlide}>
            <Image source={banner.image} style={styles.bannerImage} />
            {/* <View style={styles.bannerOverlay}>
              <Text style={styles.bannerTitle}>{banner.title}</Text>
              <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
            </View> */}
          </View>
        ))}
      </ScrollView>
      <View style={styles.bannerDots}>
        {banners.map((_, index) => (
          <View
            key={index}
            style={[
              styles.bannerDot,
              index === currentBannerIndex && styles.bannerDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );

  const renderHeader = () => (
    <View>
      {renderBannerSlider()}
      <View style={styles.balanceCard}>
        <View style={styles.balanceLeft}>
          <MaterialIcons
            name="emoji-events"
            size={24}
            color={COLORS.ORANGE_DARK}
          />
          <View style={styles.balanceTextWrap}>
            <Text style={styles.balanceLabel}>Điểm của bạn</Text>
            <Text style={styles.balanceValue}>
              {points.toLocaleString("vi-VN")}
            </Text>
          </View>
        </View>
        <View style={styles.balanceRight}>
          <MaterialIcons name="local-mall" size={18} color="#FF5370" />
          <Text style={styles.balanceHint}>Tích điểm từ chuyến đi</Text>
        </View>
      </View>
    </View>
  );

  const renderCategoryFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryContainer}
      contentContainerStyle={styles.categoryContent}
    >
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryItem,
            selectedCategory === category.id && styles.categoryItemActive,
          ]}
          onPress={() => setSelectedCategory(category.id)}
        >
          <MaterialIcons
            name={category.icon}
            size={20}
            color={selectedCategory === category.id ? COLORS.WHITE : "#FF5370"}
          />
          <Text
            style={[
              styles.categoryText,
              selectedCategory === category.id && styles.categoryTextActive,
            ]}
          >
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === "vouchers" && styles.activeTab]}
        onPress={() => setActiveTab("vouchers")}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === "vouchers" && styles.activeTabText,
          ]}
        >
          Đổi voucher
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === "history" && styles.activeTab]}
        onPress={() => setActiveTab("history")}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === "history" && styles.activeTabText,
          ]}
        >
          Lịch sử
        </Text>
      </TouchableOpacity>
    </View>
  );

  const getVoucherImage = (voucherType, voucherCode) => {
    // Map voucher codes to specific brand images
    const codeImageMap = {
      // Food & Beverage
      STARBUCKS:
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop",
      MCDONALD:
        "https://images.unsplash.com/photo-1551782450-17144efb9c50?w=400&h=300&fit=crop",
      "COCA-COLA":
        "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=300&fit=crop",
      KFC: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&h=300&fit=crop",
      LOTTERIA:
        "https://images.unsplash.com/photo-1551782450-17144efb9c50?w=400&h=300&fit=crop",
      // Shopping
      SHOPEE:
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop",
      LAZADA:
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop",
      TIKI: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop",
      SENDO:
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop",
      // Vehicle Service
      VINFAST:
        "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=300&fit=crop",
      HONDA:
        "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=300&fit=crop",
      YAMAHA:
        "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=300&fit=crop",
      PETROL:
        "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=400&h=300&fit=crop",
    };

    // Check if voucher code matches any brand
    if (voucherCode) {
      const upperCode = voucherCode.toUpperCase();
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
        "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=300&fit=crop",
    };
    return typeImageMap[voucherType] || typeImageMap.FOOD_AND_BEVERAGE;
  };

  const getBrandLogo = (voucherType) => {
    // Brand logo based on voucher type or voucher code
    const logoMap = {
      FOOD_AND_BEVERAGE: "☕",
      SHOPPING: "🛍️",
      VEHICLE_SERVICE: "🚗",
    };
    return logoMap[voucherType] || "🎁";
  };

  const getBrandName = (voucherCode) => {
    // Extract brand name from voucher code or use default
    if (voucherCode?.includes("STARBUCKS") || voucherCode?.includes("SB")) {
      return "Starbucks";
    }
    if (voucherCode?.includes("MCDONALD") || voucherCode?.includes("MCD")) {
      return "McDonald's";
    }
    if (voucherCode?.includes("COCA") || voucherCode?.includes("COKE")) {
      return "Coca-Cola";
    }
    return voucherCode || "Brand";
  };

  const renderItem = ({ item }) => {
    const disabled = !canRedeem(item);
    const alreadyHas = myVouchers.some((v) => v.voucher?.id === item.id);
    const typeInfo = getVoucherTypeInfo(item.voucherType);
    const voucherImage = getVoucherImage(item.voucherType, item.voucherCode);
    const brandLogo = getBrandLogo(item.voucherType);
    const brandName = getBrandName(item.voucherCode);

    return (
      <TouchableOpacity
        style={styles.promoCard}
        onPress={() => navigation.navigate("Voucher", { voucher: item })}
        activeOpacity={0.9}
      >
        {/* Image Container with Brand Logo - Full Width */}
        <View style={styles.promoImageContainer}>
          <Image
            source={{ uri: voucherImage }}
            style={styles.promoImage}
            resizeMode="cover"
          />
          {/* Brand Logo Overlay */}
          <View style={styles.brandLogoContainer}>
            <View style={styles.brandLogoCircle}>
              <Text style={styles.brandLogoEmoji}>{brandLogo}</Text>
            </View>
          </View>
        </View>

        {/* Content Section - Below Image */}
        <View style={styles.promoContent}>
          <View style={styles.promoHeader}>
            <Text style={styles.promoTitle} numberOfLines={2}>
              {item.description || `Get Free ${typeInfo.label} E-Voucher`}
            </Text>
          </View>

          <View style={styles.promoInfoRow}>
            <View style={styles.promoPointsContainer}>
              <MaterialIcons
                name="stars"
                size={16}
                color={COLORS.ORANGE_DARK}
              />
              <Text style={styles.promoPoints}>
                {item.cost?.toLocaleString("vi-VN") || "0"} points
              </Text>
            </View>

            <Text style={styles.promoBrand}>{brandName}</Text>
          </View>

          <View style={styles.actionRow}>
            {alreadyHas && (
              <View style={styles.redeemedPill}>
                <MaterialIcons
                  name="check-circle"
                  size={14}
                  color={COLORS.WHITE}
                />
                <Text style={styles.redeemedText}>Đã có</Text>
              </View>
            )}

            {!alreadyHas && (
              <>
                {!disabled ? (
                  <TouchableOpacity
                    onPress={() => openRedeemModal(item)}
                    style={styles.redeemBtn}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={["#FF5370", "#FF6B9D"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.redeemBtnGradient}
                    >
                      <Sparkles size={14} color="#FFF" />
                      <Text style={styles.redeemBtnText}>Đổi voucher ✨</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.insufficientPointsContainer}>
                    <MaterialIcons
                      name="error-outline"
                      size={16}
                      color={COLORS.RED || "#FF3B30"}
                    />
                    <Text style={styles.insufficientPointsText}>
                      Không đủ điểm
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderRedeemedVoucherItem = ({ item }) => {
    const voucher = item.voucher;
    // Status: UNUSED, REDEEMED, EXPIRED
    const isUsed = item.status === "REDEEMED" || item.status === "EXPIRED";

    return (
      <TouchableOpacity
        style={styles.redeemedCard}
        onPress={() => navigation.navigate("Voucher", { userVoucher: item })}
      >
        <View style={styles.redeemedHeader}>
          <View
            style={[
              styles.promoIconWrap,
              isUsed && { backgroundColor: COLORS.GRAY },
            ]}
          >
            <MaterialIcons name="local-offer" size={22} color={COLORS.WHITE} />
          </View>
          <View style={styles.redeemedTextWrap}>
            <Text style={styles.promoBrand}>{voucher.voucherCode}</Text>
            <Text style={styles.promoTitle} numberOfLines={1}>
              {voucher.description}
            </Text>
          </View>
          {isUsed && (
            <View style={styles.usedBadge}>
              <Text style={styles.usedBadgeText}>Đã dùng</Text>
            </View>
          )}
        </View>
        <View style={styles.redeemedBody}>
          <View style={styles.redeemedRow}>
            <Text style={styles.redeemedLabel}>Mã voucher:</Text>
            <Text style={styles.redeemedValue}>{voucher.voucherCode}</Text>
          </View>
          <View style={styles.redeemedRow}>
            <Text style={styles.redeemedLabel}>Ngày đổi:</Text>
            <Text style={styles.redeemedValue}>
              {formatDate(item.acquiredDate)}
            </Text>
          </View>
          <View style={styles.redeemedRow}>
            <Text style={styles.redeemedLabel}>Hết hạn:</Text>
            <Text style={styles.redeemedValue}>
              {formatDate(voucher.expiryDate)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5370" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView key={refreshKey} style={styles.container} edges={["top"]}>
      {/* Header */}
      <SnowEffect />
      <GradientHeader title="🎁 Phần thưởng" showBackButton={false} />

      {renderBannerSlider()}

      {/* Balance Card */}
      <View style={styles.balanceCardWrapper}>
        <View style={styles.balanceCard}>
          <View style={styles.balanceLeft}>
            <View style={styles.pointsIconWrapper}>
              <MaterialIcons name="emoji-events" size={28} color="#FFD700" />
            </View>
            <View style={styles.balanceTextWrap}>
              <Text style={styles.balanceLabel}>Điểm của bạn</Text>
              <Text style={styles.balanceValue}>
                {points.toLocaleString("vi-VN")}
              </Text>
            </View>
          </View>
          <View style={styles.balanceRight}>
            <MaterialIcons name="local-mall" size={18} color="#FF5370" />
          </View>
        </View>
      </View>

      {/* Tabs - Fixed */}
      {renderTabs()}

      {activeTab === "vouchers" ? (
        <View style={styles.voucherContainer}>
          {/* Category Filter - Fixed */}
          {renderCategoryFilter()}
          <FlatList
            data={filteredPromos}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 20 },
            ]}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🎁</Text>
                <Text style={styles.emptyText}>Chưa có voucher nào</Text>
                <Text style={styles.emptySubtext}>
                  Hãy tích điểm để đổi voucher nhé! 🎄
                </Text>
              </View>
            }
          />
        </View>
      ) : (
        <View style={styles.historyContainer}>
          <FlatList
            data={myVouchers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderRedeemedVoucherItem}
            contentContainerStyle={[
              styles.historyList,
              { paddingBottom: insets.bottom + 20 },
            ]}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>📜</Text>
                <Text style={styles.emptyText}>Bạn chưa đổi voucher nào</Text>
                <Text style={styles.emptySubtext}>
                  Lịch sử đổi voucher sẽ hiển thị tại đây ✨
                </Text>
              </View>
            }
          />
        </View>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Xác nhận đổi voucher</Text>
            {selectedPromo && (
              <View style={styles.modalBody}>
                <Text style={styles.modalLine}>
                  Mô tả:{" "}
                  <Text style={styles.modalStrong}>
                    {selectedPromo.description}
                  </Text>
                </Text>
                <Text style={styles.modalLine}>
                  Loại:{" "}
                  <Text style={styles.modalStrong}>
                    {selectedPromo.voucherType === "FOOD_AND_BEVERAGE"
                      ? "Đồ ăn & Uống"
                      : selectedPromo.voucherType === "SHOPPING"
                      ? "Mua sắm"
                      : selectedPromo.voucherType === "VEHICLE_SERVICE"
                      ? "Dịch vụ xe"
                      : "Khác"}
                  </Text>
                </Text>
                <Text style={styles.modalLine}>
                  Chi phí:{" "}
                  <Text style={styles.modalStrong}>
                    {selectedPromo.cost} điểm
                  </Text>
                </Text>
                <Text style={styles.modalLine}>
                  Điểm hiện tại:{" "}
                  <Text style={styles.modalStrong}>{points} điểm</Text>
                </Text>
                <Text style={styles.modalLine}>
                  Điểm còn lại:{" "}
                  <Text style={styles.modalStrong}>
                    {points - selectedPromo.cost} điểm
                  </Text>
                </Text>
              </View>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalConfirm]}
                onPress={confirmRedeem}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={["#FF5370", "#FF6B9D"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalConfirmGradient}
                >
                  <Sparkles size={14} color="#FFF" />
                  <Text style={[styles.modalBtnText, styles.modalConfirmText]}>
                    Xác nhận ✨
                  </Text>
                </LinearGradient>
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
    backgroundColor: "#FFF5F7",
  },
  // Header styles
  listContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  // Banner styles
  bannerContainer: {
    height: 160,
    marginTop: 16,
    marginBottom: 16,
  },
  bannerScroll: {
    flex: 1,
  },
  bannerSlide: {
    width: screenWidth,
    height: 160,
    position: "relative",
    paddingHorizontal: 20,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderRadius: 20,
  },
  bannerOverlay: {
    position: "absolute",
    bottom: 0,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.WHITE,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: COLORS.WHITE,
    opacity: 0.9,
  },
  bannerDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
  },
  bannerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.GRAY_LIGHT,
    marginHorizontal: 4,
  },
  bannerDotActive: {
    backgroundColor: "#FF5370",
    width: 20,
  },
  // Balance Card styles
  balanceCardWrapper: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  balanceCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: "#FFE5EC",
  },
  balanceLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  pointsIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFE5EC",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FF6B9D",
  },
  balanceTextWrap: {
    marginLeft: 14,
  },
  balanceLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FF5370",
  },
  balanceRight: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE5EC",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FF6B9D",
  },
  balanceHint: {
    marginLeft: 6,
    fontSize: 11,
    color: "#FF5370",
    fontWeight: "600",
  },
  // Tab styles
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 16,
    marginTop: 8,
    backgroundColor: "#FFE5EC",
    borderRadius: 16,
    padding: 4,
    paddingBottom: 12,
    borderWidth: 2,
    borderColor: "#FF6B9D",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: "#fff",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
  },
  activeTabText: {
    color: "#FF5370",
    fontWeight: "700",
  },
  // Category filter styles
  categoryContainer: {
    marginBottom: 16,
    paddingBottom: 16,
  },
  categoryContent: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#FFE5EC",
    height: 44,
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryItemActive: {
    backgroundColor: "#FF5370",
    borderColor: "#FF5370",
  },
  categoryText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#FF5370",
  },
  categoryTextActive: {
    color: "#fff",
  },
  // Voucher container
  voucherContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.BLACK,
    marginBottom: 16,
  },
  promoCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    flexDirection: "column",
    overflow: "hidden",
    marginHorizontal: 20,
    borderWidth: 2,
    borderColor: "#FFE5EC",
  },
  promoImageContainer: {
    width: "100%",
    height: 180,
    position: "relative",
    overflow: "hidden",
  },
  promoImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  brandLogoContainer: {
    position: "absolute",
    top: 8,
    left: 8,
    zIndex: 10,
  },
  brandLogoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FF5370",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  brandLogoEmoji: {
    fontSize: 24,
  },
  promoContent: {
    padding: 16,
  },
  promoHeader: {
    marginBottom: 12,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.BLACK,
    lineHeight: 22,
  },
  promoInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  promoPointsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  promoPoints: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.BLACK,
    marginLeft: 6,
  },
  promoBrand: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FF5370",
  },
  costPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.BLUE_LIGHT,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  costText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.ORANGE_DARK,
  },
  redeemedPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.GREEN,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  redeemedText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.WHITE,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  redeemBtn: {
    flex: 1,
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    overflow: "hidden",
  },
  redeemBtnGradient: {
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  redeemBtnDisabled: {
    backgroundColor: COLORS.GRAY,
    opacity: 0.7,
  },
  redeemBtnText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: "700",
  },
  insufficientPointsContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF5F5",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFE5E5",
  },
  insufficientPointsText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.RED || "#FF3B30",
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    borderWidth: 3,
    borderColor: "#FFE5EC",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.BLACK,
    textAlign: "center",
    marginBottom: 8,
  },
  modalBody: {
    marginBottom: 12,
  },
  modalLine: {
    fontSize: 14,
    color: COLORS.BLACK,
    marginVertical: 2,
  },
  modalStrong: {
    fontWeight: "800",
    color: "#FF5370",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    borderRadius: 12,
    alignItems: "center",
  },
  modalConfirmGradient: {
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    width: "100%",
  },
  modalCancel: {
    backgroundColor: COLORS.GRAY_BG,
    marginRight: 8,
  },
  modalConfirm: {
    marginLeft: 8,
    overflow: "hidden",
    borderRadius: 12,
  },
  modalBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.BLACK,
  },
  modalConfirmText: {
    color: COLORS.WHITE,
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  activeTab: {
    borderBottomColor: "#FF5370",
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.GRAY,
  },
  activeTabText: {
    color: "#FF5370",
  },
  historyContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.BLACK,
    marginBottom: 12,
  },
  historyList: {
    paddingBottom: 24,
  },
  redeemedCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    marginBottom: 8,
    padding: 16,
    borderWidth: 2,
    borderColor: "#FFE5EC",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  redeemedHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  redeemedTextWrap: {
    marginLeft: 12,
    flex: 1,
  },
  redeemedBody: {
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_LIGHT,
    paddingTop: 12,
  },
  redeemedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  redeemedLabel: {
    fontSize: 13,
    color: COLORS.GRAY,
  },
  redeemedValue: {
    fontSize: 13,
    color: COLORS.BLACK,
    fontWeight: "600",
  },
  promoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FF5370",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FF6B9D",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.GRAY,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: "#FF5370",
    marginTop: 8,
    fontWeight: "700",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  usedBadge: {
    backgroundColor: COLORS.GRAY,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  usedBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.WHITE,
  },
});

export default Award;
