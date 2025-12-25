import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";
import {
  CalendarClock,
  TicketPercent,
  Gift,
  Star,
  AlertCircle,
  ChevronLeft,
} from "lucide-react-native";
import COLORS from "../../constant/colors";
import { redeemVoucher } from "../../services/voucherService";
import { getProfile } from "../../services/userService";
import GradientHeader from "../../components/GradientHeader";
import SnowEffect from "../../components/SnowEffect";

const Voucher = ({ route, navigation }) => {
  const { 
    voucher, 
    userVoucher,
    myVouchers,
    mockVouchers,
    title,
    subtitle,
    image,
    badge: promoBadge,
    validFrom,
    validTo,
    terms,
    code: promoCode,
  } = route.params || {};
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemed, setRedeemed] = useState(!!userVoucher);
  const [currentUserVoucher, setCurrentUserVoucher] = useState(userVoucher);
  const [userPoints, setUserPoints] = useState(0);
  const [loadingPoints, setLoadingPoints] = useState(true);

  // Map voucher type to badge text
  const getVoucherTypeBadge = (type) => {
    switch (type) {
      case "FOOD_AND_BEVERAGE":
        return "Đồ ăn & Uống";
      case "SHOPPING":
        return "Mua sắm";
      case "VEHICLE_SERVICE":
        return "Dịch vụ xe";
      default:
        return "Ưu đãi";
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  // Load user points
  useEffect(() => {
    const loadUserPoints = async () => {
      try {
        setLoadingPoints(true);
        const profileResp = await getProfile();
        const profilePayload =
          profileResp?.data?.data ?? profileResp?.data ?? profileResp;
        const points = profilePayload?.coins ?? profilePayload?.userPoints ?? 0;
        const pointsNumber = Number(points) || 0;
        console.log("💰 [Voucher] Loaded user points:", {
          raw: points,
          converted: pointsNumber,
          profilePayload,
        });
        setUserPoints(pointsNumber);
      } catch (error) {
        console.error("Error loading user points:", error);
        setUserPoints(0);
      } finally {
        setLoadingPoints(false);
      }
    };

    if (voucher) {
      if (!redeemed) {
        loadUserPoints();
      } else {
        // If already redeemed, still load points to show updated balance
        loadUserPoints();
      }
    } else {
      setLoadingPoints(false);
    }
  }, [redeemed, voucher]);

  // Get display data
  const voucherData =
    currentUserVoucher?.voucher || userVoucher?.voucher || voucher;

  // Check if user has enough points (only check after loading points)
  const voucherCost = voucherData?.cost ? Number(voucherData.cost) : 0;
  const currentPoints = Number(userPoints) || 0;
  const hasEnoughPoints =
    !loadingPoints &&
    voucherData &&
    voucherData.cost != null &&
    !isNaN(voucherCost) &&
    !isNaN(currentPoints) &&
    currentPoints >= voucherCost;

  // Debug log
  if (voucherData && !loadingPoints) {
    console.log("🔍 [Voucher] Points check:", {
      voucherCost,
      currentPoints,
      hasEnoughPoints,
      userPoints,
      voucherDataCost: voucherData.cost,
      voucherDataCostType: typeof voucherData.cost,
      loadingPoints,
      comparison: `${currentPoints} >= ${voucherCost} = ${
        currentPoints >= voucherCost
      }`,
    });
  }

  // Handle redeem voucher
  const handleRedeem = async () => {
    if (!voucher || redeemed) return;

    // Show confirmation toast first, then proceed
    try {
      setIsRedeeming(true);
      const response = await redeemVoucher(voucher.id);

      // Unwrap API response (similar to Award.js)
      const unwrapApiPayload = (resp) => resp?.data?.data ?? resp?.data ?? resp;
      const unwrapApiMessage = (resp) => resp?.data?.message ?? resp?.message;
      const redeemPayload = unwrapApiPayload(response);
      const redeemMessage = unwrapApiMessage(response);

      // Check if redeem was successful
      if (response?.data?.statusCode === 200 || redeemPayload) {
        // Update state with the redeemed voucher
        if (redeemPayload) {
          setCurrentUserVoucher(redeemPayload);
        }
        setRedeemed(true);

        // Reload user points after successful redeem
        try {
          const profileResp = await getProfile();
          const profilePayload =
            profileResp?.data?.data ?? profileResp?.data ?? profileResp;
          const points =
            profilePayload?.coins ?? profilePayload?.userPoints ?? 0;
          const pointsNumber = Number(points) || 0;
          setUserPoints(pointsNumber);
          console.log(
            "💰 [Voucher] Points updated after redeem:",
            pointsNumber
          );
        } catch (error) {
          console.error("Error reloading points after redeem:", error);
        }

        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: redeemMessage || "Đổi voucher thành công!",
          position: "top",
          visibilityTime: 3000,
          onHide: () => {
            // Navigate back to refresh the previous screen
            navigation.goBack();
          },
        });
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
      setIsRedeeming(false);
    }
  };

  // Get voucher image based on type and code
  const getVoucherImage = (voucherType, voucherCode) => {
    const codeImageMap = {
      STARBUCKS:
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=400&fit=crop",
      MCDONALD:
        "https://images.unsplash.com/photo-1551782450-17144efb9c50?w=800&h=400&fit=crop",
      "COCA-COLA":
        "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&h=400&fit=crop",
      KFC: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800&h=400&fit=crop",
      LOTTERIA:
        "https://images.unsplash.com/photo-1551782450-17144efb9c50?w=800&h=400&fit=crop",
      SHOPEE:
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop",
      LAZADA:
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop",
      TIKI: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop",
      SENDO:
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop",
      VINFAST:
        "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=400&fit=crop",
      HONDA:
        "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=400&fit=crop",
      YAMAHA:
        "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=400&fit=crop",
      PETROL:
        "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&h=400&fit=crop",
    };

    if (voucherCode) {
      const upperCode = voucherCode.toUpperCase();
      for (const [brand, imageUrl] of Object.entries(codeImageMap)) {
        if (upperCode.includes(brand)) {
          return imageUrl;
        }
      }
    }

    const typeImageMap = {
      FOOD_AND_BEVERAGE:
        "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=400&fit=crop",
      SHOPPING:
        "https://images.unsplash.com/photo-1555529908-3af0358c7f32?w=800&h=400&fit=crop",
      VEHICLE_SERVICE:
        "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=400&fit=crop",
    };
    return typeImageMap[voucherType] || typeImageMap.FOOD_AND_BEVERAGE;
  };

  const badge = voucherData
    ? getVoucherTypeBadge(voucherData.voucherType)
    : "Ưu đãi";
  const code = voucherData?.voucherCode;
  const expiryDate = voucherData?.expiryDate;
  const description = voucherData?.description;
  const voucherImage = voucherData
    ? getVoucherImage(voucherData.voucherType, voucherData.voucherCode)
    : null;

  // MY VOUCHERS LIST MODE (Home service button passes myVouchers from API)
  if (!voucherData && Array.isArray(myVouchers) && !Array.isArray(mockVouchers)) {
    // UserVoucherDto: { id, status: UNUSED|REDEEMED|EXPIRED, acquiredDate, voucher: VoucherDto }
    const list = myVouchers
      .slice()
      .sort((a, b) => {
        const da = a?.voucher?.expiryDate ? new Date(a.voucher.expiryDate).getTime() : 0
        const db = b?.voucher?.expiryDate ? new Date(b.voucher.expiryDate).getTime() : 0
        return da - db
      })

    const statusLabel = (s) => {
      switch (s) {
        case 'UNUSED':
          return 'Khả dụng'
        case 'REDEEMED':
          return 'Đã dùng'
        case 'EXPIRED':
          return 'Hết hạn'
        default:
          return 'Voucher'
      }
    }

    const renderMyVoucherItem = ({ item }) => {
      const v = item?.voucher
      const itemBadge = getVoucherTypeBadge(v?.voucherType)
      const pillText = statusLabel(item?.status)
      return (
        <TouchableOpacity
          style={styles.listCard}
          activeOpacity={0.85}
          onPress={() => navigation.push('Voucher', { userVoucher: item })}
        >
          <View style={styles.listTopRow}>
            <View style={styles.listIconWrap}>
              <TicketPercent size={18} color={COLORS.WHITE} />
            </View>
            <View style={styles.listMain}>
              <Text style={styles.listCode}>{v?.voucherCode || 'VOUCHER'}</Text>
              {!!itemBadge && <Text style={styles.listBadgeText}>{itemBadge}</Text>}
              {!!v?.description && (
                <Text style={styles.listDesc} numberOfLines={2}>
                  {v.description}
                </Text>
              )}
            </View>
            <View style={styles.listPill}>
              <Text style={styles.listPillText}>{pillText}</Text>
            </View>
          </View>

          <View style={styles.listMetaRow}>
            <CalendarClock size={16} color={COLORS.PRIMARY} />
            <Text style={styles.listMetaText}>
              Hết hạn: {v?.expiryDate ? formatDate(v.expiryDate) : 'Không giới hạn'}
            </Text>
          </View>
        </TouchableOpacity>
      )
    }

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={22} color={COLORS.WHITE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Voucher của tôi</Text>
          <View style={{ width: 32 }} />
        </View>

        {list.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Bạn chưa có voucher nào</Text>
          </View>
        ) : (
          <FlatList
            data={list}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderMyVoucherItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          />
        )}
      </SafeAreaView>
    )
  }

  // PROMOTION MODE (Home "Ưu đãi hot" cards pass marketing params)
  if (!voucherData && !Array.isArray(mockVouchers) && (title || subtitle || image || promoBadge || validFrom || validTo || terms || promoCode)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={22} color={COLORS.WHITE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết ưu đãi</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {!!image && (
            <View style={styles.promoHero}>
              <Image source={{ uri: image }} style={styles.promoHeroImage} />
              <View style={styles.promoHeroOverlay} />
              <View style={styles.promoHeroContent}>
                {!!promoBadge && (
                  <View style={styles.badge}>
                    <TicketPercent size={14} color={COLORS.WHITE} />
                    <Text style={styles.badgeText}>{promoBadge}</Text>
                  </View>
                )}
                {!!title && <Text style={styles.title}>{title}</Text>}
                {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
              </View>
            </View>
          )}

          {!image && (
            <View style={styles.section}>
              {!!promoBadge && (
                <View style={styles.badge}>
                  <TicketPercent size={14} color={COLORS.WHITE} />
                  <Text style={styles.badgeText}>{promoBadge}</Text>
                </View>
              )}
              {!!title && <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>{title}</Text>}
              {!!subtitle && <Text style={styles.bodyText}>{subtitle}</Text>}
            </View>
          )}

          {(validFrom || validTo) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thời gian hiệu lực</Text>
              <View style={styles.card}>
                <View style={styles.row}>
                  <CalendarClock size={18} color={COLORS.PRIMARY} />
                  <Text style={styles.rowText}>
                    {validFrom ? `Từ ${validFrom}` : ''}
                    {validFrom && validTo ? '  •  ' : ''}
                    {validTo ? `Đến ${validTo}` : ''}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {!!promoCode && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mã ưu đãi</Text>
              <View style={styles.card}>
                <Text style={styles.code}>{promoCode}</Text>
                <Text style={styles.note}>Sao chép và nhập mã khi thanh toán (nếu có).</Text>
              </View>
            </View>
          )}

          {!!terms && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Điều kiện áp dụng</Text>
              <View style={styles.card}>
                <Text style={styles.bodyText}>{terms}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    )
  }

  // LIST MODE (Home service button passes mockVouchers)
  if (!voucherData && Array.isArray(mockVouchers)) {
    const list = mockVouchers
      .filter((v) => v?.status === 'AVAILABLE')
      .sort((a, b) => {
        const da = a?.expiryDate ? new Date(a.expiryDate).getTime() : 0
        const db = b?.expiryDate ? new Date(b.expiryDate).getTime() : 0
        return da - db
      })

    const renderListItem = ({ item }) => {
      const itemBadge = getVoucherTypeBadge(item?.voucherType)
      return (
        <TouchableOpacity
          style={styles.listCard}
          activeOpacity={0.85}
          onPress={() => navigation.push('Voucher', { voucher: item })}
        >
          <View style={styles.listTopRow}>
            <View style={styles.listIconWrap}>
              <TicketPercent size={18} color={COLORS.WHITE} />
            </View>
            <View style={styles.listMain}>
              <Text style={styles.listCode}>{item?.voucherCode || 'VOUCHER'}</Text>
              {!!itemBadge && <Text style={styles.listBadgeText}>{itemBadge}</Text>}
              {!!item?.description && (
                <Text style={styles.listDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
            </View>
            <View style={styles.listPill}>
              <Text style={styles.listPillText}>Khả dụng</Text>
            </View>
          </View>

          <View style={styles.listMetaRow}>
            <CalendarClock size={16} color={COLORS.PRIMARY} />
            <Text style={styles.listMetaText}>
              Hết hạn: {item?.expiryDate ? formatDate(item.expiryDate) : 'Không giới hạn'}
            </Text>
          </View>
        </TouchableOpacity>
      )
    }

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={22} color={COLORS.WHITE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Voucher</Text>
          <View style={{ width: 32 }} />
        </View>

        {list.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Chưa có voucher khả dụng</Text>
          </View>
        ) : (
          <FlatList
            data={list}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderListItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          />
        )}
      </SafeAreaView>
    )
  }

  if (!voucherData) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <SnowEffect />
        <GradientHeader
          title="🎁 Chi tiết khuyến mãi"
          onBackPress={() => navigation.goBack()}
          showBackButton={true}
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Không tìm thấy thông tin voucher</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <SnowEffect />
      <GradientHeader
        title="🎁 Chi tiết khuyến mãi"
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View style={styles.hero}>
          {voucherImage ? (
            <Image
              source={{ uri: voucherImage }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : null}
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
              <View style={styles.badge}>
                <TicketPercent size={14} color={COLORS.WHITE} />
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
              <Text style={styles.title}>{voucherData.voucherCode}</Text>
              {!!description && (
                <Text style={styles.subtitle}>{description}</Text>
              )}
            </View>
          </LinearGradient>
        </View>

        {/* Cost section - only show if not redeemed yet */}
        {!redeemed && voucher && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chi phí đổi điểm</Text>
            <View style={styles.card}>
              <View style={styles.costRow}>
                <View style={styles.costLeft}>
                  <Star size={18} color={COLORS.ORANGE_DARK} />
                  <Text style={styles.costLabel}>Số điểm cần:</Text>
                </View>
                <Text style={styles.costValue}>{voucherData.cost} điểm</Text>
              </View>
              <View style={styles.pointsInfoRow}>
                <View style={styles.pointsInfoLeft}>
                  <Star size={16} color="#FF5370" />
                  <Text style={styles.pointsInfoLabel}>Điểm hiện có:</Text>
                </View>
                <Text style={styles.pointsInfoValue}>
                  {loadingPoints ? "..." : userPoints} điểm
                </Text>
              </View>
              {!loadingPoints && !hasEnoughPoints && (
                <View style={styles.insufficientPointsContainer}>
                  <AlertCircle size={16} color={COLORS.RED || "#FF3B30"} />
                  <Text style={styles.insufficientPointsText}>
                    Không đủ điểm
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Status section - only show if redeemed */}
        {(currentUserVoucher || userVoucher) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trạng thái</Text>
            <View style={styles.card}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Trạng thái:</Text>
                <Text
                  style={[
                    styles.statusValue,
                    {
                      color:
                        (currentUserVoucher || userVoucher).status !== "UNUSED"
                          ? COLORS.GRAY
                          : COLORS.GREEN,
                    },
                  ]}
                >
                  {(currentUserVoucher || userVoucher).status === "REDEEMED"
                    ? "Đã sử dụng"
                    : (currentUserVoucher || userVoucher).status === "EXPIRED"
                    ? "Đã hết hạn"
                    : "Chưa sử dụng"}
                </Text>
              </View>
              {(currentUserVoucher || userVoucher).acquiredDate && (
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Ngày nhận:</Text>
                  <Text style={styles.statusValue}>
                    {formatDate(
                      (currentUserVoucher || userVoucher).acquiredDate
                    )}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thời gian hiệu lực</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <CalendarClock size={18} color="#FF5370" />
              <Text style={styles.rowText}>
                Hết hạn:{" "}
                {expiryDate ? formatDate(expiryDate) : "Không giới hạn"}
              </Text>
            </View>
          </View>
        </View>

        {redeemed ? (
          !!code && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mã áp dụng</Text>
              <View style={styles.card}>
                <Text style={styles.code}>{code}</Text>
                <Text style={styles.note}>Sao chép và nhập mã khi thanh toán.</Text>
              </View>
            </View>
          )
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mã áp dụng</Text>
            <View style={styles.card}>
              <Text style={styles.code}>{code}</Text>
              <Text style={styles.note}>
                Sao chép và nhập mã khi thanh toán.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mô tả</Text>
          <View style={styles.card}>
            <Text style={styles.bodyText}>
              {description ||
                "Áp dụng cho người dùng RideMate. Không cộng dồn với ưu đãi khác."}
            </Text>
          </View>
        </View>

        {/* Redeem button - only show if not redeemed yet */}
        {!redeemed && voucher && (
          <View style={styles.section}>
            {hasEnoughPoints ? (
              <TouchableOpacity
                style={[
                  styles.redeemButton,
                  isRedeeming && styles.redeemButtonDisabled,
                ]}
                onPress={handleRedeem}
                disabled={isRedeeming || loadingPoints}
              >
                {isRedeeming ? (
                  <ActivityIndicator color={COLORS.WHITE} />
                ) : (
                  <LinearGradient
                    colors={["#FF5370", "#FF6B9D", "#FF8FAB"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.redeemButtonGradient}
                  >
                    <Gift size={20} color={COLORS.WHITE} />
                    <Text style={styles.redeemButtonText}>
                      Đổi voucher với {voucherData.cost} điểm
                    </Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.disabledRedeemButton}>
                <AlertCircle size={20} color={COLORS.GRAY} />
                <Text style={styles.disabledRedeemButtonText}>
                  Không đủ điểm để đổi voucher
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
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
    marginBottom: 8,
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
  heroOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  heroContent: {
    alignItems: "flex-start",
  },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.ORANGE,
    marginBottom: 8,
  },
  badgeText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    color: COLORS.WHITE,
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 6,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    color: COLORS.WHITE,
    fontSize: 14,
    opacity: 0.95,
    lineHeight: 20,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.BLACK,
    marginBottom: 10,
  },
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  rowText: {
    marginLeft: 8,
    color: COLORS.BLACK,
  },
  code: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FF5370",
  },
  note: {
    color: COLORS.GRAY,
    marginTop: 6,
  },
  bodyText: {
    color: COLORS.BLACK,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.GRAY,
  },
  heroGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
    padding: 20,
    position: "relative",
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  costLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  costLabel: {
    fontSize: 15,
    color: COLORS.GRAY,
    fontWeight: "600",
  },
  costValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FF5370",
  },
  pointsInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  pointsInfoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pointsInfoLabel: {
    fontSize: 14,
    color: COLORS.GRAY,
    fontWeight: "500",
  },
  pointsInfoValue: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  insufficientPointsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF5F5",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFE5E5",
    marginTop: 8,
  },
  insufficientPointsText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.RED || "#FF3B30",
    flex: 1,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  redeemButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  redeemButtonGradient: {
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  redeemButtonDisabled: {
    backgroundColor: COLORS.GRAY,
  },
  redeemButtonText: {
    color: COLORS.WHITE,
    fontSize: 17,
    fontWeight: "700",
  },
  disabledRedeemButton: {
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  disabledRedeemButtonText: {
    color: COLORS.GRAY,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Voucher;
