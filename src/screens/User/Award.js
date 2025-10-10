import React, { useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import COLORS from '../../constant/colors'
import { MaterialIcons } from '@expo/vector-icons'

const Award = () => {
  const [points, setPoints] = useState(1200)
  const [promos, setPromos] = useState([
    { id: 'p1', brand: 'Phúc Long', title: 'Voucher 30.000đ đồ uống', desc: 'Áp dụng tại cửa hàng Phúc Long', cost: 400, code: 'PL30K', redeemed: false },
    { id: 'p2', brand: 'Highlands Coffee', title: 'Voucher 25.000đ', desc: 'Áp dụng toàn quốc', cost: 350, code: 'HLC25K', redeemed: false },
    { id: 'p3', brand: 'Lotteria', title: 'Voucher 40.000đ', desc: 'Áp dụng đơn tối thiểu 100.000đ', cost: 500, code: 'LOT40K', redeemed: false },
    { id: 'p4', brand: 'Circle K', title: 'Voucher 20.000đ', desc: 'Áp dụng cho mọi sản phẩm', cost: 300, code: 'CK20K', redeemed: false },
  ])
  const [selectedPromo, setSelectedPromo] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [activeTab, setActiveTab] = useState('vouchers') // 'vouchers', 'history'

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

  const renderHeader = () => (
    <View>
      <View style={styles.balanceCard}>
        <View style={styles.balanceLeft}>
          <MaterialIcons name="emoji-events" size={28} color={COLORS.ORANGE_DARK} />
          <View style={styles.balanceTextWrap}>
            <Text style={styles.balanceLabel}>Điểm của bạn</Text>
            <Text style={styles.balanceValue}>{points.toLocaleString('vi-VN')}</Text>
          </View>
        </View>
        <View style={styles.balanceRight}>
          <MaterialIcons name="local-mall" size={20} color={COLORS.PURPLE} />
          <Text style={styles.balanceHint}>Tích điểm từ chuyến đi</Text>
        </View>
      </View>
    </View>
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
        <View style={styles.promoInfo}>
          <View style={styles.promoIconWrap}>
            <MaterialIcons name="local-offer" size={22} color={COLORS.WHITE} />
          </View>
          <View style={styles.promoTextWrap}>
            <Text style={styles.promoBrand}>{item.brand}</Text>
            <Text style={styles.promoTitle}>{item.title}</Text>
            <Text style={styles.promoDesc}>{item.desc}</Text>
            <View style={styles.promoMetaRow}>
              <View style={styles.costPill}>
                <MaterialIcons name="stars" size={14} color={COLORS.ORANGE_DARK} />
                <Text style={styles.costText}>{item.cost}</Text>
              </View>
              {item.redeemed && (
                <View style={styles.redeemedPill}>
                  <MaterialIcons name="check-circle" size={14} color={COLORS.WHITE} />
                  <Text style={styles.redeemedText}>Đã đổi: {item.code}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <TouchableOpacity
          disabled={disabled}
          onPress={() => openRedeemModal(item)}
          style={[styles.redeemBtn, (disabled || item.redeemed) && styles.redeemBtnDisabled]}
        >
          <Text style={styles.redeemBtnText}>{item.redeemed ? 'Đã đổi' : disabled ? 'Không đủ điểm' : 'Đổi voucher'}</Text>
        </TouchableOpacity>
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
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderTabs()}
      
      {activeTab === 'vouchers' ? (
        <FlatList
          data={promos}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Voucher đã đổi</Text>
          <FlatList
            data={redeemedVouchers}
            keyExtractor={(item) => item.id}
            renderItem={renderRedeemedVoucherItem}
            contentContainerStyle={styles.historyList}
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  balanceCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  balanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceTextWrap: {
    marginLeft: 12,
  },
  balanceLabel: {
    fontSize: 12,
    color: COLORS.GRAY,
  },
  balanceValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.PURPLE,
  },
  balanceRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceHint: {
    marginLeft: 6,
    fontSize: 12,
    color: COLORS.PURPLE,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.BLACK,
    marginBottom: 12,
  },
  promoCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  promoInfo: {
    flexDirection: 'row',
  },
  promoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  promoTextWrap: {
    flex: 1,
  },
  promoBrand: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.PURPLE,
    marginBottom: 2,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.BLACK,
  },
  promoDesc: {
    fontSize: 13,
    color: COLORS.GRAY_DARK,
    marginTop: 2,
  },
  promoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  costPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.BLUE_LIGHT,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
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
    backgroundColor: COLORS.PURPLE,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
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
    color: COLORS.PURPLE,
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
    backgroundColor: COLORS.PURPLE,
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
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.PURPLE,
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.GRAY,
  },
  activeTabText: {
    color: COLORS.PURPLE,
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