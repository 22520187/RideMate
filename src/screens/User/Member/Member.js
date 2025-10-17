import React, { useMemo, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ChevronLeft, Crown, ShoppingBag } from 'lucide-react-native'
import COLORS from '../../../constant/colors'
import SCREENS from '../../index'

const TABS = {
  PACKAGES: 'PACKAGES',
  PURCHASED: 'PURCHASED',
}

const mockPackages = [
  {
    id: 'pkg-premium',
    title: 'RideMate Premium',
    description: 'Ưu đãi đặc biệt mọi chuyến xe • Tích điểm nhanh gấp đôi',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=250&fit=crop',
    badge: 'Phổ biến',
    badgeColor: COLORS.ORANGE,
    price: '49.000đ / tháng',
    benefits: ['Ưu đãi giá mỗi chuyến đi', 'Tích điểm nhanh gấp đôi', 'Hỗ trợ ưu tiên 24/7'],
  },
  {
    id: 'pkg-vip',
    title: 'RideMate VIP',
    description: 'Trải nghiệm dịch vụ cao cấp • Hỗ trợ ưu tiên 24/7',
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=250&fit=crop',
    badge: 'Cao cấp',
    badgeColor: COLORS.PURPLE,
    price: '99.000đ / tháng',
    benefits: ['Ưu tiên ghép chuyến', 'Hỗ trợ riêng 24/7', 'Ưu đãi đối tác'],
  },
]

const mockPurchased = [
  {
    id: 'subs-001',
    title: 'RideMate Premium',
    nextBilling: '20/11/2025',
    status: 'Đang hoạt động',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=250&fit=crop',
  },
]

const Member = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState(TABS.PACKAGES)

  const data = useMemo(() => (activeTab === TABS.PACKAGES ? mockPackages : mockPurchased), [activeTab])

  const renderPackageItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.card}
      onPress={() => {
        if (activeTab === TABS.PACKAGES) {
          navigation.navigate(SCREENS.MEMBER_DETAIL, {
            title: item.title,
            image: item.image,
            badge: item.badge,
            badgeColor: item.badgeColor,
            description: item.description,
            benefits: item.benefits,
            price: item.price,
          })
        }
      }}
    >
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <View style={styles.cardOverlay} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeaderRow}>
          <View style={[styles.smallBadge, { backgroundColor: activeTab === TABS.PACKAGES ? COLORS.PRIMARY : COLORS.GREEN }] }>
            {activeTab === TABS.PACKAGES ? <Crown size={14} color={COLORS.WHITE} /> : <ShoppingBag size={14} color={COLORS.WHITE} />}
            <Text style={styles.smallBadgeText}>
              {activeTab === TABS.PACKAGES ? (item.badge || 'Gợi ý') : item.status}
            </Text>
          </View>
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardSubtitle} numberOfLines={2}>
          {activeTab === TABS.PACKAGES ? item.description : `Gia hạn: ${item.nextBilling}`}
        </Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color={COLORS.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hội viên</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === TABS.PACKAGES && styles.tabItemActive]}
          onPress={() => setActiveTab(TABS.PACKAGES)}
        >
          <Text style={[styles.tabText, activeTab === TABS.PACKAGES && styles.tabTextActive]}>Các gói hội viên</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === TABS.PURCHASED && styles.tabItemActive]}
          onPress={() => setActiveTab(TABS.PURCHASED)}
        >
          <Text style={[styles.tabText, activeTab === TABS.PURCHASED && styles.tabTextActive]}>Đã mua</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderPackageItem}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  header: {
    height: 56,
    backgroundColor: COLORS.PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
  },
  tabItemActive: {
    backgroundColor: COLORS.PRIMARY + '10',
  },
  tabText: {
    color: COLORS.GRAY_DARK,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.PRIMARY,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    height: 160,
    borderRadius: 14,
    backgroundColor: COLORS.WHITE,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  cardOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)'
  },
  cardContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  cardHeaderRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  smallBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  smallBadgeText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: '700',
  },
  cardTitle: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  cardSubtitle: {
    color: COLORS.WHITE,
    opacity: 0.95,
  },
})

export default Member


