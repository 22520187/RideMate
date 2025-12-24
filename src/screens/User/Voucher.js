import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, ActivityIndicator, FlatList } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CalendarClock, ChevronLeft, TicketPercent, Gift } from 'lucide-react-native'
import COLORS from '../../constant/colors'
import { redeemVoucher } from '../../services/voucherService'

const Voucher = ({ route, navigation }) => {
  const {
    voucher,
    userVoucher,
    mockVouchers,
    myVouchers,
    title,
    subtitle,
    image,
    badge: promoBadge,
    validFrom,
    validTo,
    terms,
    code: promoCode,
  } = route.params || {}
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [redeemed, setRedeemed] = useState(!!userVoucher)

  // Map voucher type to badge text
  const getVoucherTypeBadge = (type) => {
    switch (type) {
      case 'FOOD_AND_BEVERAGE':
        return 'Đồ ăn & Uống'
      case 'SHOPPING':
        return 'Mua sắm'
      case 'VEHICLE_SERVICE':
        return 'Dịch vụ xe'
      default:
        return 'Ưu đãi'
    }
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN')
  }

  // Handle redeem voucher
  const handleRedeem = async () => {
    if (!voucher || redeemed) return

    Alert.alert(
      'Đổi voucher',
      `Bạn có muốn đổi voucher này với ${voucher.cost} điểm không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đổi',
          onPress: async () => {
            try {
              setIsRedeeming(true)
              await redeemVoucher(voucher.id)
              setRedeemed(true)
              Alert.alert('Thành công', 'Đổi voucher thành công!')
            } catch (error) {
              console.error('Redeem error:', error)
              Alert.alert(
                'Lỗi',
                error.response?.data?.message || 'Không thể đổi voucher. Vui lòng thử lại.'
              )
            } finally {
              setIsRedeeming(false)
            }
          }
        }
      ]
    )
  }

  // Get display data
  const voucherData = userVoucher?.voucher || voucher
  const badge = voucherData ? getVoucherTypeBadge(voucherData.voucherType) : 'Ưu đãi'
  const code = voucherData?.voucherCode
  const expiryDate = voucherData?.expiryDate
  const description = voucherData?.description

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
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={22} color={COLORS.WHITE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết khuyến mãi</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Không tìm thấy thông tin voucher</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color={COLORS.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết khuyến mãi</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.hero}>
          <View style={styles.heroGradient}>
            <View style={styles.heroIconContainer}>
              <Gift size={64} color={COLORS.WHITE} />
            </View>
          </View>
          <View style={styles.heroContent}>
            <View style={styles.badge}>
              <TicketPercent size={14} color={COLORS.WHITE} />
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
            <Text style={styles.title}>{description || 'Ưu đãi'}</Text>
            {!redeemed ? (
              <Text style={styles.subtitle}>Mã sẽ hiển thị sau khi bạn đổi voucher.</Text>
            ) : (
              !!code && <Text style={styles.subtitle}>Mã: {code}</Text>
            )}
          </View>
        </View>

        {/* Cost section - only show if not redeemed yet */}
        {!redeemed && voucher && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chi phí đổi điểm</Text>
            <View style={styles.card}>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Số điểm cần:</Text>
                <Text style={styles.costValue}>{voucherData.cost} điểm</Text>
              </View>
            </View>
          </View>
        )}

        {/* Status section - only show if redeemed */}
        {userVoucher && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trạng thái</Text>
            <View style={styles.card}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Trạng thái:</Text>
                <Text style={[
                  styles.statusValue,
                  { color: userVoucher.status !== 'UNUSED' ? COLORS.GRAY : COLORS.GREEN }
                ]}>
                  {userVoucher.status === 'REDEEMED' ? 'Đã sử dụng' : 
                   userVoucher.status === 'EXPIRED' ? 'Đã hết hạn' : 
                   'Chưa sử dụng'}
                </Text>
              </View>
              {userVoucher.acquiredDate && (
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Ngày nhận:</Text>
                  <Text style={styles.statusValue}>{formatDate(userVoucher.acquiredDate)}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thời gian hiệu lực</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <CalendarClock size={18} color={COLORS.PRIMARY} />
              <Text style={styles.rowText}>
                Hết hạn: {expiryDate ? formatDate(expiryDate) : 'Không giới hạn'}
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
              <Text style={styles.note}>
                Bạn cần đổi voucher để xem mã.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mô tả</Text>
          <View style={styles.card}>
            <Text style={styles.bodyText}>
              {description || 'Áp dụng cho người dùng RideMate. Không cộng dồn với ưu đãi khác.'}
            </Text>
          </View>
        </View>

        {/* Redeem button - only show if not redeemed yet */}
        {!redeemed && voucher && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.redeemButton, isRedeeming && styles.redeemButtonDisabled]}
              onPress={handleRedeem}
              disabled={isRedeeming}
            >
              {isRedeeming ? (
                <ActivityIndicator color={COLORS.WHITE} />
              ) : (
                <>
                  <Gift size={20} color={COLORS.WHITE} />
                  <Text style={styles.redeemButtonText}>Đổi voucher với {voucherData.cost} điểm</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
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
  hero: {
    height: 200,
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)'
  },
  heroContent: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '700',
  },
  title: {
    color: COLORS.WHITE,
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.WHITE,
    opacity: 0.95,
    marginTop: 6,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.BLACK,
    marginBottom: 10,
  },
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rowText: {
    marginLeft: 8,
    color: COLORS.BLACK,
  },
  code: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.PRIMARY,
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.GRAY,
  },
  heroGradient: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroIconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 60,
    padding: 20,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  costValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.PRIMARY,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  redeemButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  redeemButtonDisabled: {
    backgroundColor: COLORS.GRAY,
  },
  redeemButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '700',
  },

  // List mode styles
  listCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  listTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  listIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listMain: {
    flex: 1,
    paddingRight: 10,
  },
  listCode: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.BLACK,
  },
  listBadgeText: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.GRAY,
  },
  listDesc: {
    marginTop: 6,
    fontSize: 13,
    color: COLORS.GRAY,
    lineHeight: 18,
  },
  listPill: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  listPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.GREEN,
  },
  listMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  listMetaText: {
    marginLeft: 8,
    fontSize: 12,
    color: COLORS.BLACK,
  },

  // Promotion mode styles
  promoHero: {
    height: 220,
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  promoHeroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  promoHeroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  promoHeroContent: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },
})

export default Voucher

