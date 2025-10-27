import React, { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView, Dimensions, Image, AppState } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import COLORS from '../../constant/colors'
import { MaterialIcons } from '@expo/vector-icons'

const { width: screenWidth } = Dimensions.get('window')

const Award = () => {
  const [points, setPoints] = useState(1200)
  const insets = useSafeAreaInsets()
  const [refreshKey, setRefreshKey] = useState(0);

  // Force refresh SafeArea khi app resume từ background
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        // Force component re-render để refresh SafeArea insets
        setRefreshKey(prev => prev + 1);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  const [banners] = useState([
    { id: 'b1', title: 'Đổi điểm nhận voucher', subtitle: 'Tích điểm từ mỗi chuyến đi', image: require('../../../assets/banner1.png') },
    { id: 'b2', title: 'Ưu đãi đặc biệt', subtitle: 'Giảm giá lên đến 50%', image: require('../../../assets/banner2.jpg') },
    { id: 'b3', title: 'Chương trình mới', subtitle: 'Đổi điểm nhận quà tặng', image: require('../../../assets/banner3.jpg') },
  ])

  const [promos, setPromos] = useState([
    { id: 'p1', brand: 'Phúc Long', title: 'Voucher 30.000đ đồ uống', desc: 'Áp dụng tại cửa hàng Phúc Long', cost: 400, code: 'PL30K', redeemed: false, category: 'cafe', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&h=150&fit=crop' },
    { id: 'p2', brand: 'Highlands Coffee', title: 'Voucher 25.000đ', desc: 'Áp dụng toàn quốc', cost: 350, code: 'HLC25K', redeemed: false, category: 'cafe', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=150&fit=crop' },
    { id: 'p3', brand: 'Lotteria', title: 'Voucher 40.000đ', desc: 'Áp dụng đơn tối thiểu 100.000đ', cost: 500, code: 'LOT40K', redeemed: false, category: 'food', image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=200&h=150&fit=crop' },
    { id: 'p4', brand: 'Circle K', title: 'Voucher 20.000đ', desc: 'Áp dụng cho mọi sản phẩm', cost: 300, code: 'CK20K', redeemed: false, category: 'convenience', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=150&fit=crop' },
    { id: 'p5', brand: 'Starbucks', title: 'Voucher 50.000đ', desc: 'Áp dụng đồ uống cao cấp', cost: 600, code: 'SB50K', redeemed: false, category: 'cafe', image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200&h=150&fit=crop' },
    { id: 'p6', brand: 'McDonald\'s', title: 'Voucher 35.000đ', desc: 'Áp dụng combo burger', cost: 450, code: 'MC35K', redeemed: false, category: 'food', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=150&fit=crop' },
  ])

  const [categories] = useState([
    { id: 'all', name: 'Tất cả', icon: 'apps' },
    { id: 'cafe', name: 'Cà phê', icon: 'local-cafe' },
    { id: 'food', name: 'Đồ ăn', icon: 'restaurant' },
    { id: 'convenience', name: 'Tiện ích', icon: 'store' },
  ])
  const [selectedPromo, setSelectedPromo] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [activeTab, setActiveTab] = useState('vouchers') // 'vouchers', 'history'
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const bannerScrollRef = useRef(null)

  const [pointsHistory] = useState([
    {
      id: 'h1',
      amount: 200,
      type: 'earned',
      desc: 'Hoàn thành chuyến đi #123',
      date: '2025-10-08'
    },
    {
      id: 'h2',
      amount: -400,
      type: 'spent',
      desc: 'Đổi voucher Phúc Long 30.000đ',
      date: '2025-10-07'
    },
  ])

  const [redeemedVouchers] = useState([
    {
      id: 'rv1',
      brand: 'Phúc Long',
      title: 'Voucher 30.000đ đồ uống',
      code: 'PL30K',
      redeemedDate: '2025-10-07',
      expiryDate: '2025-11-07'
    }
  ])

  // Auto slide banner
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => {
        const nextIndex = prevIndex === banners.length - 1 ? 0 : prevIndex + 1
        // Scroll to the next banner
        if (bannerScrollRef.current) {
          bannerScrollRef.current.scrollTo({
            x: nextIndex * screenWidth,
            animated: true,
          })
        }
        return nextIndex
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [banners.length])

  // Filter promos by category
  const filteredPromos = selectedCategory === 'all'
    ? promos
    : promos.filter(promo => promo.category === selectedCategory)

  const canRedeem = (promo) => !promo.redeemed && points >= promo.cost

  const openRedeemModal = (promo) => {
    setSelectedPromo(promo)
    setModalVisible(true)
  }

  const confirmRedeem = () => {
    if (!selectedPromo) return
    if (points < selectedPromo.cost || selectedPromo.redeemed) {
      setModalVisible(false)
      return
    }
    setPoints(points - selectedPromo.cost)
    setPromos(prev => prev.map(p => p.id === selectedPromo.id ? { ...p, redeemed: true } : p))
    setModalVisible(false)
  }

  const renderBannerSlider = () => (
    <View style={styles.bannerContainer}>
      <ScrollView
        ref={bannerScrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth)
          setCurrentBannerIndex(index)
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
              index === currentBannerIndex && styles.bannerDotActive
            ]}
          />
        ))}
      </View>
    </View>
  )

  const renderHeader = () => (
    <View>
      {renderBannerSlider()}
      <View style={styles.balanceCard}>
        <View style={styles.balanceLeft}>
          <MaterialIcons name="emoji-events" size={24} color={COLORS.ORANGE_DARK} />
          <View style={styles.balanceTextWrap}>
            <Text style={styles.balanceLabel}>Điểm của bạn</Text>
            <Text style={styles.balanceValue}>{points.toLocaleString('vi-VN')}</Text>
          </View>
        </View>
        <View style={styles.balanceRight}>
          <MaterialIcons name="local-mall" size={18} color={COLORS.PRIMARY} />
          <Text style={styles.balanceHint}>Tích điểm từ chuyến đi</Text>
        </View>
      </View>
    </View>
  )

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
            selectedCategory === category.id && styles.categoryItemActive
          ]}
          onPress={() => setSelectedCategory(category.id)}
        >
          <MaterialIcons
            name={category.icon}
            size={20}
            color={selectedCategory === category.id ? COLORS.WHITE : COLORS.PRIMARY}
          />
          <Text style={[
            styles.categoryText,
            selectedCategory === category.id && styles.categoryTextActive
          ]}>
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'vouchers' && styles.activeTab]}
        onPress={() => setActiveTab('vouchers')}
      >
        <Text style={[styles.tabText, activeTab === 'vouchers' && styles.activeTabText]}>
          Đổi voucher
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'history' && styles.activeTab]}
        onPress={() => setActiveTab('history')}
      >
        <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
          Lịch sử
        </Text>
      </TouchableOpacity>
    </View>
  )

  const renderItem = ({ item }) => {
    const disabled = !canRedeem(item)
    return (
      <View style={styles.promoCard}>
        <Image source={{ uri: item.image }} style={styles.promoImage} />
        <View style={styles.promoContent}>
          <View style={styles.promoHeader}>
            <Text style={styles.promoBrand}>{item.brand}</Text>
            <View style={styles.costPill}>
              <MaterialIcons name="stars" size={14} color={COLORS.ORANGE_DARK} />
              <Text style={styles.costText}>{item.cost}</Text>
            </View>
          </View>
          <Text style={styles.promoTitle}>{item.title}</Text>
          <Text style={styles.promoDesc}>{item.desc}</Text>
          {item.redeemed && (
            <View style={styles.redeemedPill}>
              <MaterialIcons name="check-circle" size={14} color={COLORS.WHITE} />
              <Text style={styles.redeemedText}>Đã đổi: {item.code}</Text>
            </View>
          )}
          <TouchableOpacity
            disabled={disabled}
            onPress={() => openRedeemModal(item)}
            style={[styles.redeemBtn, (disabled || item.redeemed) && styles.redeemBtnDisabled]}
          >
            <Text style={styles.redeemBtnText}>{item.redeemed ? 'Đã đổi' : disabled ? 'Không đủ điểm' : 'Đổi voucher'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const renderPointHistoryItem = ({ item }) => (
    <View style={styles.historyCard}>
      <View style={styles.historyLeft}>
        <MaterialIcons
          name={item.type === 'earned' ? 'add-circle' : 'remove-circle'}
          size={24}
          color={item.type === 'earned' ? COLORS.GREEN : COLORS.ORANGE_DARK}
        />
        <View style={styles.historyTextWrap}>
          <Text style={styles.historyDesc}>{item.desc}</Text>
          <Text style={styles.historyDate}>{item.date}</Text>
        </View>
      </View>
      <Text style={[
        styles.historyAmount,
        item.type === 'earned' ? styles.earnedAmount : styles.spentAmount
      ]}>
        {item.type === 'earned' ? '+' : '-'}{Math.abs(item.amount)}
      </Text>
    </View>
  )

  const renderRedeemedVoucherItem = ({ item }) => (
    <View style={styles.redeemedCard}>
      <View style={styles.redeemedHeader}>
        <View style={styles.promoIconWrap}>
          <MaterialIcons name="local-offer" size={22} color={COLORS.WHITE} />
        </View>
        <View style={styles.redeemedTextWrap}>
          <Text style={styles.promoBrand}>{item.brand}</Text>
          <Text style={styles.promoTitle}>{item.title}</Text>
        </View>
      </View>
      <View style={styles.redeemedBody}>
        <View style={styles.redeemedRow}>
          <Text style={styles.redeemedLabel}>Mã voucher:</Text>
          <Text style={styles.redeemedValue}>{item.code}</Text>
        </View>
        <View style={styles.redeemedRow}>
          <Text style={styles.redeemedLabel}>Ngày đổi:</Text>
          <Text style={styles.redeemedValue}>{item.redeemedDate}</Text>
        </View>
        <View style={styles.redeemedRow}>
          <Text style={styles.redeemedLabel}>Hết hạn:</Text>
          <Text style={styles.redeemedValue}>{item.expiryDate}</Text>
        </View>
      </View>
    </View>
  )

  return (
    <SafeAreaView 
      key={refreshKey}
      style={styles.container}
      edges={['top']}
    >
      {renderHeader()}
      {renderTabs()}

      {activeTab === 'vouchers' ? (
        <View style={styles.voucherContainer}>
          {renderCategoryFilter()}
          <FlatList
            data={filteredPromos}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom }]}
            showsVerticalScrollIndicator={false}
          />
        </View>
      ) : (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Voucher đã đổi</Text>
          <FlatList
            data={redeemedVouchers}
            keyExtractor={(item) => item.id}
            renderItem={renderRedeemedVoucherItem}
            contentContainerStyle={[styles.historyList, { paddingBottom: insets.bottom }]}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              <>
                <Text style={[styles.historyTitle, styles.pointsHistoryTitle]}>
                  Lịch sử điểm thưởng
                </Text>
                <FlatList
                  data={pointsHistory}
                  keyExtractor={(item) => item.id}
                  renderItem={renderPointHistoryItem}
                  scrollEnabled={false}
                />
              </>
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
                <Text style={styles.modalLine}>Đối tác: <Text style={styles.modalStrong}>{selectedPromo.brand}</Text></Text>
                <Text style={styles.modalLine}>Voucher: <Text style={styles.modalStrong}>{selectedPromo.title}</Text></Text>
                <Text style={styles.modalLine}>Mã: <Text style={styles.modalStrong}>{selectedPromo.code}</Text></Text>
                <Text style={styles.modalLine}>Chi phí: <Text style={styles.modalStrong}>{selectedPromo.cost} điểm</Text></Text>
              </View>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalCancel]} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalConfirm]} onPress={confirmRedeem}>
                <Text style={[styles.modalBtnText, styles.modalConfirmText]}>Xác nhận</Text>
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
  listContent: {
    paddingTop: 20,
    paddingBottom: 24,
  },
  // Banner styles
  bannerContainer: {
    height: 180,
    marginBottom: 16,
  },
  bannerScroll: {
    flex: 1,
  },
  bannerSlide: {
    width: screenWidth,
    height: 180,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 16,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.WHITE,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: COLORS.WHITE,
    opacity: 0.9,
  },
  bannerDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: COLORS.PRIMARY,
    width: 20,
  },
  // Category filter styles
  categoryContainer: {
    marginBottom: 6,
    paddingBottom: 4,
  },
  categoryContent: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    height: 44,
    minHeight: 44,
    maxHeight: 44,
    elevation: 1,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    marginBottom: 5,
  },
  categoryItemActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  categoryText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.PRIMARY,
  },
  categoryTextActive: {
    color: COLORS.WHITE,
  },
  // Voucher container
  voucherContainer: {
    flex: 1,
  },
  balanceCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginHorizontal: 20,
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
  balanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceTextWrap: {
    marginLeft: 10,
  },
  balanceLabel: {
    fontSize: 11,
    color: COLORS.GRAY,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.GREEN,
  },
  balanceRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceHint: {
    marginLeft: 4,
    fontSize: 10,
    color: COLORS.BLACK,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.BLACK,
    marginBottom: 16,
  },
  promoCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    flexDirection: 'row',
    overflow: 'hidden',
    marginHorizontal: 20,
  },
  promoImage: {
    width: 120,
    height: 100,
    resizeMode: 'cover',
  },
  promoContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  promoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  promoBrand: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.BLUE,
    flex: 1,
  },
  promoTitle: {
    fontSize: 14,
    fontWeight: '700',
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.BLUE_LIGHT,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  costText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ORANGE_DARK,
  },
  redeemedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.GREEN,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  redeemedText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.WHITE,
  },
  redeemBtn: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
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
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.BLACK,
    textAlign: 'center',
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
    fontWeight: '800',
    color: COLORS.PRIMARY,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
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
    fontWeight: '800',
    color: COLORS.BLACK,
  },
  modalConfirmText: {
    color: COLORS.WHITE,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  activeTab: {
    borderBottomColor: COLORS.PRIMARY,
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
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
    fontWeight: '700',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    borderColor: COLORS.BLUE + '30',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyTextWrap: {
    marginLeft: 12,
    flex: 1,
  },
  historyDesc: {
    fontSize: 14,
    color: COLORS.BLACK,
    fontWeight: '600',
  },
  historyDate: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginTop: 2,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '700',
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
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  redeemedLabel: {
    fontSize: 13,
    color: COLORS.GRAY,
  },
  redeemedValue: {
    fontSize: 13,
    color: COLORS.BLACK,
    fontWeight: '600',
  },
})

export default Award