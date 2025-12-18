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
  Alert,
} from "react-native";
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
import { useNavigation } from "@react-navigation/native";

const { width: screenWidth } = Dimensions.get("window");

const Award = () => {
  const navigation = useNavigation();
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
  const [activeTab, setActiveTab] = useState("vouchers"); // 'vouchers', 'history'
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const bannerScrollRef = useRef(null);

  const [pointsHistory] = useState([
    {
      id: "h1",
      amount: 200,
      type: "earned",
      desc: "Hoàn thành chuyến đi #123",
      date: "2025-10-08",
    },
    {
      id: "h2",
      amount: -400,
      type: "spent",
      desc: "Đổi voucher",
      date: "2025-10-07",
    },
  ]);

  // Load data from API
  const loadData = async () => {
    try {
      const [vouchersResponse, myVouchersResponse, profileResponse] =
        await Promise.all([getAllVouchers(), getMyVouchers(), getProfile()]);

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

      // All APIs now return {statusCode, message, data}
      if (vouchersResponse?.data && Array.isArray(vouchersResponse.data)) {
        console.log(
          "✅ Setting promos:",
          vouchersResponse.data.length,
          "vouchers"
        );
        setPromos(vouchersResponse.data);
      } else {
        console.log("❌ Vouchers response has no data array");
      }

      if (myVouchersResponse?.data && Array.isArray(myVouchersResponse.data)) {
        console.log(
          "✅ Setting my vouchers:",
          myVouchersResponse.data.length,
          "vouchers"
        );
        setMyVouchers(myVouchersResponse.data);
      } else {
        console.log("❌ My vouchers response has no data array");
        // Empty array is still valid
        if (myVouchersResponse?.data) {
          setMyVouchers([]);
        }
      }

      if (profileResponse?.data) {
        console.log("✅ Setting points:", profileResponse.data.coins);
        setPoints(profileResponse.data.coins || 0);
      } else {
        console.log("❌ Profile response has no data field");
      }
    } catch (error) {
      console.error("❌ Error loading data:", error);
      console.error("Error details:", error.response?.data);
      Alert.alert("Lỗi", "Không thể tải dữ liệu. Vui lòng thử lại.");
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

      // Check if redeem was successful (statusCode 200 or has data)
      if (response?.statusCode === 200 || response?.data) {
        Alert.alert(
          "Thành công",
          response?.message || "Đổi voucher thành công!"
        );
        // Reload data
        await loadData();
      } else {
        Alert.alert("Lỗi", response?.message || "Không thể đổi voucher.");
      }
    } catch (error) {
      console.error("Redeem error:", error);
      Alert.alert(
        "Lỗi",
        error.response?.data?.message ||
          error.message ||
          "Không thể đổi voucher. Vui lòng thử lại."
      );
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
          <MaterialIcons name="local-mall" size={18} color={COLORS.PRIMARY} />
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
            color={
              selectedCategory === category.id ? COLORS.WHITE : COLORS.PRIMARY
            }
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

  const renderItem = ({ item }) => {
    const disabled = !canRedeem(item);
    const alreadyHas = myVouchers.some((v) => v.voucher?.id === item.id);
    const typeInfo = getVoucherTypeInfo(item.voucherType);

    return (
      <TouchableOpacity
        style={styles.promoCard}
        onPress={() => navigation.navigate("Voucher", { voucher: item })}
      >
        <View style={styles.promoImageContainer}>
          <MaterialIcons
            name={typeInfo.icon}
            size={48}
            color={COLORS.PRIMARY}
          />
        </View>
        <View style={styles.promoContent}>
          <View style={styles.promoHeader}>
            <Text style={styles.promoBrand}>{item.voucherCode}</Text>
            <View style={styles.costPill}>
              <MaterialIcons
                name="stars"
                size={14}
                color={COLORS.ORANGE_DARK}
              />
              <Text style={styles.costText}>{item.cost}</Text>
            </View>
          </View>
          <Text style={styles.promoTitle} numberOfLines={1}>
            {item.description}
          </Text>
          <Text style={styles.promoDesc} numberOfLines={2}>
            Hết hạn: {formatDate(item.expiryDate)}
          </Text>
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
          <TouchableOpacity
            disabled={disabled || alreadyHas}
            onPress={() => openRedeemModal(item)}
            style={[
              styles.redeemBtn,
              (disabled || alreadyHas) && styles.redeemBtnDisabled,
            ]}
          >
            <Text style={styles.redeemBtnText}>
              {alreadyHas
                ? "Đã đổi"
                : disabled
                ? "Không đủ điểm"
                : "Đổi voucher"}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPointHistoryItem = ({ item }) => (
    <View style={styles.historyCard}>
      <View style={styles.historyLeft}>
        <MaterialIcons
          name={item.type === "earned" ? "add-circle" : "remove-circle"}
          size={24}
          color={item.type === "earned" ? COLORS.GREEN : COLORS.ORANGE_DARK}
        />
        <View style={styles.historyTextWrap}>
          <Text style={styles.historyDesc}>{item.desc}</Text>
          <Text style={styles.historyDate}>{item.date}</Text>
        </View>
      </View>
      <Text
        style={[
          styles.historyAmount,
          item.type === "earned" ? styles.earnedAmount : styles.spentAmount,
        ]}
      >
        {item.type === "earned" ? "+" : "-"}
        {Math.abs(item.amount)}
      </Text>
    </View>
  );

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
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView key={refreshKey} style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Phần thưởng</Text>
          <Text style={styles.headerSubtitle}>
            Đổi điểm nhận voucher hấp dẫn
          </Text>
        </View>
      </View>

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
            <MaterialIcons name="local-mall" size={18} color="#004553" />
            <Text style={styles.balanceHint}>Từ chuyến đi</Text>
          </View>
        </View>
      </View>

      {renderTabs()}

      {activeTab === "vouchers" ? (
        <View style={styles.voucherContainer}>
          {renderCategoryFilter()}
          <FlatList
            data={filteredPromos}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom },
            ]}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons
                  name="card-giftcard"
                  size={64}
                  color={COLORS.GRAY_LIGHT}
                />
                <Text style={styles.emptyText}>Chưa có voucher nào</Text>
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
              { paddingBottom: insets.bottom },
            ]}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons
                  name="inbox"
                  size={64}
                  color={COLORS.GRAY_LIGHT}
                />
                <Text style={styles.emptyText}>Bạn chưa đổi voucher nào</Text>
              </View>
            }
            ListFooterComponent={
              myVouchers.length > 0 ? (
                <>
                  <Text
                    style={[styles.historyTitle, styles.pointsHistoryTitle]}
                  >
                    Lịch sử điểm thưởng
                  </Text>
                  <FlatList
                    data={pointsHistory}
                    keyExtractor={(item) => item.id}
                    renderItem={renderPointHistoryItem}
                    scrollEnabled={false}
                  />
                </>
              ) : null
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
                  Mã voucher:{" "}
                  <Text style={styles.modalStrong}>
                    {selectedPromo.voucherCode}
                  </Text>
                </Text>
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
              >
                <Text style={[styles.modalBtnText, styles.modalConfirmText]}>
                  Xác nhận
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
    backgroundColor: COLORS.WHITE,
  },
  // Header styles
  header: {
    backgroundColor: "#004553",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
  },
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
    backgroundColor: "#004553",
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
    shadowColor: "#004553",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
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
    backgroundColor: "rgba(0, 69, 83, 0.1)",
    justifyContent: "center",
    alignItems: "center",
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
    color: "#004553",
  },
  balanceRight: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 69, 83, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  balanceHint: {
    marginLeft: 6,
    fontSize: 11,
    color: "#004553",
    fontWeight: "600",
  },
  // Tab styles
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  activeTabText: {
    color: "#004553",
    fontWeight: "700",
  },
  // Category filter styles
  categoryContainer: {
    marginBottom: 16,
    paddingBottom: 4,
  },
  categoryContent: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 69, 83, 0.2)",
    height: 44,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryItemActive: {
    backgroundColor: "#004553",
    borderColor: "#004553",
  },
  categoryText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#004553",
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
    shadowColor: "#004553",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    flexDirection: "row",
    overflow: "hidden",
    marginHorizontal: 20,
  },
  promoImage: {
    width: 120,
    height: 100,
    resizeMode: "cover",
  },
  promoImageContainer: {
    width: 120,
    height: 100,
    backgroundColor: `${COLORS.PRIMARY}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  promoContent: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  promoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  promoBrand: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.BLUE,
    flex: 1,
  },
  promoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.BLACK,
    marginBottom: 4,
  },
  promoDesc: {
    fontSize: 12,
    color: COLORS.GRAY_DARK,
    marginBottom: 8,
    lineHeight: 16,
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
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  redeemedText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.WHITE,
  },
  redeemBtn: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 8,
    elevation: 2,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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
    color: COLORS.PRIMARY,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCancel: {
    backgroundColor: COLORS.GRAY_BG,
    marginRight: 8,
  },
  modalConfirm: {
    backgroundColor: COLORS.PRIMARY,
    marginLeft: 8,
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
    borderBottomColor: COLORS.PRIMARY,
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.GRAY,
  },
  activeTabText: {
    color: COLORS.PRIMARY,
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
  pointsHistoryTitle: {
    marginTop: 24,
  },
  historyList: {
    paddingBottom: 24,
  },
  historyCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: COLORS.BLUE,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.BLUE + "30",
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  historyTextWrap: {
    marginLeft: 12,
    flex: 1,
  },
  historyDesc: {
    fontSize: 14,
    color: COLORS.BLACK,
    fontWeight: "600",
  },
  historyDate: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginTop: 2,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 12,
  },
  earnedAmount: {
    color: COLORS.GREEN,
  },
  spentAmount: {
    color: COLORS.ORANGE_DARK,
  },
  redeemedCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    marginBottom: 8,
    padding: 16,
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
    backgroundColor: COLORS.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
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
  emptyText: {
    fontSize: 16,
    color: COLORS.GRAY,
    marginTop: 16,
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
