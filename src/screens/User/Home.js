import React, { useState } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Image,
  Dimensions,
  FlatList
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
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
} from 'lucide-react-native'
import COLORS from '../../constant/colors'

const { width } = Dimensions.get('window')

const Home = ({ navigation }) => {
  const [searchText, setSearchText] = useState('')
  
  // Mock data for current ride status
  const currentRide = {
    hasActiveRide: true,
    type: 'driver', // 'driver' or 'passenger'
    destination: 'Trường Đại học Công nghệ',
    time: '15 phút',
    passengers: 2
  }

  // Mock data for points
  const userPoints = 1250

  const mainFunctions = [
    {
      id: 1,
      title: 'Tạo chuyến đi',
      subtitle: 'Người có xe',
      icon: Car,
      color: COLORS.GREEN,
      onPress: () => navigation.navigate('CreateRide')
    },
    {
      id: 2,
      title: 'Tìm người đi cùng',
      subtitle: 'Người không có xe',
      icon: Users,
      color: COLORS.BLUE,
      onPress: () => navigation.navigate('FindRide')
    },
    {
      id: 3,
      title: 'Điểm thưởng',
      subtitle: `${userPoints} điểm`,
      icon: Gift,
      color: COLORS.PURPLE,
      onPress: () => navigation.navigate('Rewards')
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
      title: 'Tin nhắn',
      subtitle: 'Chat hiện tại',
      icon: MessageCircle,
      color: COLORS.ORANGE,
      onPress: () => navigation.navigate('Messages')
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

  const renderPromotion = ({ item }) => (
    <TouchableOpacity style={styles.promotionCard}>
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.searchContainer}>
              <Search size={20} color={COLORS.GRAY} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm địa điểm"
                placeholderTextColor={COLORS.PLACEHOLDER_COLOR}
                value={searchText}
                onChangeText={setSearchText}
                onFocus={() => navigation.navigate('LocationSearch')}
              />
            </View>
            
            <TouchableOpacity style={styles.profileButton}>
              <User size={20} color={COLORS.WHITE} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.notificationButton}>
              <Bell size={24} color={COLORS.WHITE} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Current Ride Status */}
        {/* {currentRide.hasActiveRide && (
          <View style={styles.currentRideCard}>
            <View style={styles.currentRideHeader}>
              <Text style={styles.currentRideTitle}>
                {currentRide.type === 'driver' ? 'Chuyến đi của bạn' : 'Bạn đang tham gia'}
              </Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Đang diễn ra</Text>
              </View>
            </View>
            <View style={styles.currentRideContent}>
              <MapPin size={16} color={COLORS.GREEN} />
              <Text style={styles.destinationText}>{currentRide.destination}</Text>
            </View>
            <View style={styles.currentRideFooter}>
              <View style={styles.timeInfo}>
                <Clock size={14} color={COLORS.GRAY} />
                <Text style={styles.timeText}>{currentRide.time}</Text>
              </View>
              {currentRide.type === 'driver' && (
                <View style={styles.passengerInfo}>
                  <Users size={14} color={COLORS.BLUE} />
                  <Text style={styles.passengerText}>{currentRide.passengers} hành khách</Text>
                </View>
              )}
            </View>
          </View>
        )} */}

        {/* Main Functions Grid */}
        <View style={styles.functionsSection}>
          <Text style={styles.sectionTitle}>Dịch vụ</Text>
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

        {/* Payment and Rewards Cards */}
        {/* <View style={styles.paymentSection}>
          <TouchableOpacity style={styles.paymentCard}>
            <View style={styles.paymentContent}>
              <View style={styles.paymentTextContainer}>
                <Text style={styles.paymentTitle}>Payment</Text>
                <Text style={styles.paymentSubtitle}>Add a card</Text>
              </View>
              <View style={styles.paymentIcon}>
                <Gift size={24} color={COLORS.GREEN} />
              </View>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.rewardsCard}>
            <View style={styles.rewardsContent}>
              <View style={styles.rewardsTextContainer}>
                <Text style={styles.rewardsTitle}>RideMate Rewards</Text>
                <Text style={styles.rewardsSubtitle}>{userPoints}</Text>
              </View>
              <View style={styles.rewardsIcon}>
                <Star size={24} color={COLORS.YELLOW} />
              </View>
            </View>
          </TouchableOpacity>
        </View> */}

        {/* Promotions Carousel */}
        <View style={styles.promotionSection}>
          <View style={styles.promotionHeader}>
            <Text style={styles.sectionTitle}>Khuyến mãi</Text>
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
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
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
  notificationButton: {
    padding: 8,
    marginLeft: 8,
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
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.BLACK,
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  currentRideCard: {
    backgroundColor: COLORS.WHITE,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentRideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentRideTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.BLACK,
  },
  statusBadge: {
    backgroundColor: COLORS.GREEN_LIGHT,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.GREEN,
    fontWeight: '500',
  },
  currentRideContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  destinationText: {
    fontSize: 14,
    color: COLORS.BLACK,
    marginLeft: 8,
    flex: 1,
  },
  currentRideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginLeft: 4,
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passengerText: {
    fontSize: 12,
    color: COLORS.BLUE,
    marginLeft: 4,
  },
  functionsSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.BLACK,
    marginBottom: 16,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    justifyContent: 'space-between',
  },
  paymentCard: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rewardsCard: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentTextContainer: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.BLACK,
    marginBottom: 4,
  },
  paymentSubtitle: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  paymentIcon: {
    marginLeft: 8,
  },
  rewardsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rewardsTextContainer: {
    flex: 1,
  },
  rewardsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.BLACK,
    marginBottom: 4,
  },
  rewardsSubtitle: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  rewardsIcon: {
    marginLeft: 8,
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
})

export default Home