import React, { useState, useEffect } from 'react'
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
  Alert
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
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
} from 'lucide-react-native'
import COLORS from '../../../constant/colors'
import SCREENS from '../../../screens'
import { getProfile } from '../../../services/userService'
import { getMyVehicle } from '../../../services/vehicleService'

const { width } = Dimensions.get('window')

const Home = ({ navigation }) => {
  const [searchText, setSearchText] = useState('')
  const insets = useSafeAreaInsets();
  const [refreshKey, setRefreshKey] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [vehicleStatus, setVehicleStatus] = useState(null);
  const [showVehicleRequiredModal, setShowVehicleRequiredModal] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        setRefreshKey(prev => prev + 1);
        loadUserData();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadUserData = async () => {
    try {
      const profileResp = await getProfile();
      const profile = profileResp?.data;
      setUserProfile(profile);

      if (profile && (profile.userType === 'DRIVER' || profile.userType === 'PASSENGER')) {
        try {
          const vehicleResp = await getMyVehicle();
          const vehicle = vehicleResp?.data;
          setVehicleStatus(vehicle?.status || null);
        } catch (err) {
          setVehicleStatus(null);
        }
      }
    } catch (err) {
      console.warn('Failed to load user data:', err);
    }
  };

  const checkCanCreateRide = () => {
    if (!userProfile) {
      Alert.alert('Lỗi', 'Không thể tải thông tin người dùng');
      return false;
    }

    if (userProfile.userType === 'PASSENGER' && !vehicleStatus) {
      setShowVehicleRequiredModal(true);
      return false;
    }
    if (vehicleStatus === 'PENDING') {
      Alert.alert(
        'Xe đang chờ duyệt',
        'Thông tin xe của bạn đang được admin xem xét. Vui lòng chờ phê duyệt để có thể tạo chuyến đi.',
        [{ text: 'Đã hiểu' }]
      );
      return false;
    }

    if (vehicleStatus === 'REJECTED') {
      Alert.alert(
        'Xe bị từ chối',
        'Thông tin xe của bạn không được phê duyệt. Vui lòng cập nhật lại thông tin trong mục Quản lý tài khoản.',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Đi tới Profile', onPress: () => navigation.navigate(SCREENS.PROFILE) }
        ]
      );
      return false;
    }

    return true;
  };

  const handleCreateRide = () => {
    if (checkCanCreateRide() == false) {
      navigation.navigate('DriverRide');
    } else {
      navigation.navigate('DriverRide');
    }
  };

  const currentRide = {
    hasActiveRide: false,
    type: 'driver',
    destination: 'Trường Đại học Công nghệ',
    time: '15 phút',
    passengers: []
  }

  const userPoints = 1250

  const mainFunctions = [
    {
      id: 1,
      title: 'Tạo chuyến đi',
      subtitle: 'Người có xe',
      icon: Car,
      color: COLORS.GREEN,
      onPress: handleCreateRide
    },
    {
      id: 2,
      title: 'Tìm người đi cùng',
      subtitle: 'Người không có xe',
      icon: Users,
      color: COLORS.BLUE,
      onPress: () => navigation.navigate('PassengerRide')
    },
    {
      id: 3,
      title: 'Nhiệm vụ',
      subtitle: `${userPoints} điểm`,
      icon: Gift,
      color: COLORS.PURPLE,
      onPress: () => navigation.navigate('Mission')
    },
    {
      id: 4,
      title: 'Lịch sử chuyến đi',
      subtitle: 'Xem các chuyến đã tham gia',
      icon: Clock,
      color: COLORS.Fresh_Air,
      onPress: () => navigation.navigate('RideHistory')
    },
    {
      id: 5,
      title: 'Hội viên',
      subtitle: 'Xem hội viên',
      icon: Package,
      color: COLORS.ORANGE,
      onPress: () => navigation.navigate('Member')
    },
    {
      id: 6,
      title: 'Báo cáo',
      subtitle: 'Báo cáo vấn đề',
      icon: Ban,
      color: COLORS.RED,
      onPress: () => navigation.navigate('Report')
    }
  ]

  const promotions = [
    {
      id: 1,
      title: 'Tích điểm – đổi ngay voucher!',
      subtitle: 'Đổi ngay voucher 30k tại Katinat',
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=200&fit=crop',
      badge: 'Ưu đãi đặc biệt',
      points: userPoints
    },
    {
      id: 2,
      title: 'Chuyến đi miễn phí',
      subtitle: 'Hoàn 100% điểm cho chuyến đầu tiên',
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=200&fit=crop',
      badge: 'Mới',
      points: 0
    },
    {
      id: 3,
      title: 'Đối tác Phúc Long',
      subtitle: 'Giảm 20% khi đặt đồ uống',
      image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=200&fit=crop',
      badge: 'Hot',
      points: 500
    }
  ]

  const packages = [
    {
      id: 1,
      title: 'RideMate Premium',
      description: 'Ưu đãi đặc biệt mọi chuyến xe\nTích điểm nhanh gấp đôi',
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=250&fit=crop',
      badge: 'Phổ biến',
      badgeColor: COLORS.ORANGE,
    },
    {
      id: 2,
      title: 'RideMate VIP',
      description: 'Trải nghiệm dịch vụ cao cấp\nHỗ trợ ưu tiên 24/7',
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=250&fit=crop',
      badge: 'Cao cấp',
      badgeColor: COLORS.PURPLE,
    },
    {
      id: 3,
      title: 'RideMate Family',
      description: 'Chia sẻ cho cả gia đình\nTối đa 5 thành viên',
      image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&h=250&fit=crop',
      badge: 'Tiết kiệm',
      badgeColor: COLORS.GREEN,
    },
  ]

  const renderPromotion = ({ item }) => (
    <TouchableOpacity style={styles.promotionCard} onPress={() => {
      navigation.navigate('Voucher', {
        title: item.title,
        subtitle: item.subtitle,
        image: item.image,
        badge: item.badge,
        validFrom: '01/10/2025',
        validTo: '31/12/2025',
        terms: 'Áp dụng cho chuyến đi đầu tiên trong ngày. Không cộng dồn ưu đãi.',
        code: item.points > 0 ? undefined : 'RIDEMATE30'
      })
    }}>
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
  )

  const renderPackage = ({ item }) => (
    <TouchableOpacity 
      style={styles.packageCard} 
      activeOpacity={0.8}
      onPress={() => {
        navigation.navigate('MemberDetail', {
          title: item.title,
          image: item.image,
          badge: item.badge,
          badgeColor: item.badgeColor,
          description: item.description,
          benefits: item.benefits,
          price: item.price,
        })
      }}
    >
      <Image source={{ uri: item.image }} style={styles.packageImage} />
      <View style={styles.packageOverlay}>
        <View style={[styles.packageBadge, { backgroundColor: item.badgeColor }]}>
          <Text style={styles.packageBadgeText}>{item.badge}</Text>
        </View>
        <View style={styles.packageContent}>
          <Text style={styles.packageTitle}>{item.title}</Text>
          <Text style={styles.packageDescription}>{item.description}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView 
      key={refreshKey}
      style={styles.container}
      edges={['top']}
    >
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
      >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <TouchableOpacity 
                style={styles.searchContainer}
                onPress={() => navigation.navigate(SCREENS.HOME_SEARCH)}
              >
                <Search size={20} color={COLORS.GRAY} style={styles.searchIcon} />
                <Text style={styles.searchPlaceholder}>Tìm địa điểm</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate(SCREENS.PROFILE)}>
                <User size={20} color={COLORS.WHITE} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.notificationButton}
                onPress={() => navigation.navigate('Notification')}
              >
                <Bell size={24} color={COLORS.WHITE} />
                {/* Badge cho thông báo chưa đọc */}
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>3</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Functions Grid */}
          <View style={styles.functionsSection}>
            <View style={styles.functionsGrid}>
              {mainFunctions.map((item) => {
                const IconComponent = item.icon
                return (
                  <TouchableOpacity 
                    key={item.id} 
                    style={styles.functionCard}
                    onPress={item.onPress}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                      <IconComponent size={20} color={item.color} />
                    </View>
                    <Text style={styles.functionTitle}>{item.title}</Text>
                    <Text style={styles.functionSubtitle}>{item.subtitle}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* Promotions Carousel */}
          <View style={styles.promotionSection}>
            <View style={styles.promotionHeader}>
            <View style={styles.packageHeaderLeft}>
                <Ticket size={24} color={COLORS.PRIMARY} />
                <Text style={styles.packageSectionTitle}>Khuyến mãi</Text>
              </View>
              <TouchableOpacity style={styles.seeAllButton}>
                <Text style={styles.seeAllText}>Xem tất cả</Text>
                <ChevronRight size={16} color={COLORS.PRIMARY} />
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

          {/* Packages Section */}
          <View style={styles.packagesSection}>
            <View style={styles.packageHeader}>
              <View style={styles.packageHeaderLeft}>
                <Package size={24} color={COLORS.PRIMARY} />
                <Text style={styles.packageSectionTitle}>Gói Hội Viên RideMate</Text>
              </View>
              <TouchableOpacity style={styles.seeAllButton}>
                <Text style={styles.seeAllText}>Xem tất cả</Text>
                <ChevronRight size={16} color={COLORS.PRIMARY} />
              </TouchableOpacity>
            </View>
            <Text style={styles.packageSectionSubtitle}>
              Trải nghiệm đặc quyền - Tiết kiệm mọi chuyến đi
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

        {/* Modal hướng dẫn đăng ký xe */}
        <Modal
          visible={showVehicleRequiredModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowVehicleRequiredModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalIconContainer}>
                <AlertCircle size={60} color={COLORS.ORANGE} />
              </View>
              
              <Text style={styles.modalTitle}>Cần đăng ký xe</Text>
              
              <Text style={styles.modalMessage}>
                Để có thể tạo chuyến đi, bạn cần đăng ký thông tin xe trước.{'\n\n'}
                Vui lòng vào <Text style={styles.modalHighlight}>Quản lý tài khoản</Text> để đăng ký xe của bạn.{'\n\n'}
                Sau khi đăng ký, admin sẽ xem xét và phê duyệt. Khi xe được duyệt, bạn sẽ có thể tạo chuyến đi.
              </Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={() => setShowVehicleRequiredModal(false)}
                >
                  <Text style={styles.modalButtonTextSecondary}>Để sau</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={() => {
                    setShowVehicleRequiredModal(false);
                    navigation.navigate(SCREENS.PROFILE);
                  }}
                >
                  <Text style={styles.modalButtonTextPrimary}>Đăng ký ngay</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,
    marginRight: 12,
    minHeight: 40,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: COLORS.PLACEHOLDER_COLOR,
    marginLeft: 8,
  },
  notificationButton: {
    padding: 8,
    marginLeft: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.RED,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
  },
  notificationBadgeText: {
    color: COLORS.WHITE,
    fontSize: 10,
    fontWeight: '700',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.BLUE,
    borderWidth: 1,
    borderColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  functionsSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  functionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  functionCard: {
    width: (width - 64) / 3,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: COLORS.BLUE,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.BLUE + '30',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  functionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.BLACK,
    textAlign: 'center',
    marginBottom: 2,
  },
  functionSubtitle: {
    fontSize: 10,
    color: COLORS.GRAY,
    textAlign: 'center',
  },
  promotionSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
  },
  promotionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: '500',
    marginRight: 4,
  },
  promotionList: {
    paddingRight: 16,
  },
  promotionCard: {
    width: width * 0.8,
    height: 160,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  promotionImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  promotionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  promotionContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  promotionTextContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  promotionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.WHITE,
    marginBottom: 4,
  },
  promotionSubtitle: {
    fontSize: 14,
    color: COLORS.WHITE,
    marginBottom: 8,
    opacity: 0.9,
  },
  promotionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.YELLOW + '90',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    color: COLORS.ORANGE_DARK,
    marginLeft: 4,
    fontWeight: '500',
  },
  // Packages Section Styles
  packagesSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  packageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  packageSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.BLACK,
  },
  packageSectionSubtitle: {
    fontSize: 13,
    color: COLORS.GRAY_DARK,
    marginBottom: 16,
  },
  packagesList: {
    paddingRight: 16,
  },
  packageCard: {
    width: width * 0.7,
    height: 200,
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  packageImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  packageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'space-between',
    padding: 16,
  },
  packageBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  packageBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.WHITE,
  },
  packageContent: {
    justifyContent: 'flex-end',
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.WHITE,
    marginBottom: 6,
  },
  packageDescription: {
    fontSize: 13,
    color: COLORS.WHITE,
    opacity: 0.95,
    lineHeight: 18,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalIconContainer: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.BLACK,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: COLORS.GRAY_DARK,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalHighlight: {
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  modalButtonPrimary: {
    backgroundColor: COLORS.PRIMARY,
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.GRAY_DARK,
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.WHITE,
  },
})

export default Home