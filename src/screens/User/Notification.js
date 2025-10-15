import React, { useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import COLORS from '../../constant/colors'
import { MaterialIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'

const Notification = () => {
  const navigation = useNavigation()
  const [activeTab, setActiveTab] = useState('all') // 'all', 'trips', 'promotions', 'services'
  
  // Mock data - Danh sách thông báo
  const [notifications, setNotifications] = useState([
    // Thông báo chuyến đi
    {
      id: 'notif1',
      type: 'trip',
      title: 'Chuyến đi đã được xác nhận',
      message: 'Chuyến đi từ ĐH FPT → Vincom của bạn đã được xác nhận. Thời gian: 14:30, 15/10/2024',
      time: '5 phút trước',
      icon: 'check-circle',
      iconColor: COLORS.GREEN,
      bgColor: COLORS.GREEN_LIGHT,
      isRead: false,
      tripCode: '#RD12345',
      date: '2024-10-15',
    },
    {
      id: 'notif2',
      type: 'promotion',
      title: 'Khuyến mãi mới: Giảm 30% cho chuyến đi đầu tiên',
      message: 'Chào mừng bạn đến với RideMate! Nhận ngay ưu đãi 30% cho chuyến đi đầu tiên của bạn.',
      time: '1 giờ trước',
      icon: 'local-offer',
      iconColor: COLORS.ORANGE,
      bgColor: COLORS.ORANGE_LIGHT,
      isRead: false,
      promoCode: 'FIRST30',
      validUntil: '31/10/2024',
    },
    {
      id: 'notif3',
      type: 'trip',
      title: 'Tài xế đang trên đường đến điểm đón',
      message: 'Nguyễn Văn A đang trên đường đến điểm đón của bạn. Dự kiến: 5 phút nữa.',
      time: '2 giờ trước',
      icon: 'directions-car',
      iconColor: COLORS.BLUE,
      bgColor: COLORS.BLUE_LIGHT,
      isRead: true,
      tripCode: '#RD12344',
      driverName: 'Nguyễn Văn A',
    },
    {
      id: 'notif4',
      type: 'service',
      title: 'Tính năng mới: Đặt chuyến định kỳ',
      message: 'Giờ đây bạn có thể đặt lịch chuyến đi thường xuyên hàng ngày/tuần. Tiết kiệm thời gian hơn!',
      time: '3 giờ trước',
      icon: 'update',
      iconColor: COLORS.PURPLE,
      bgColor: COLORS.PURPLE + '20',
      isRead: true,
    },
    {
      id: 'notif5',
      type: 'trip',
      title: 'Chuyến đi hoàn thành',
      message: 'Chuyến đi #RD12343 đã hoàn thành. Bạn nhận được 200 điểm thưởng.',
      time: '5 giờ trước',
      icon: 'verified',
      iconColor: COLORS.GREEN,
      bgColor: COLORS.GREEN_LIGHT,
      isRead: true,
      tripCode: '#RD12343',
      points: 200,
    },
    {
      id: 'notif6',
      type: 'promotion',
      title: 'Tích điểm nhận quà - Khuyến mãi tháng 10',
      message: 'Hoàn thành 5 chuyến đi trong tháng để nhận thêm 500 điểm thưởng. Hiện tại: 3/5 chuyến.',
      time: '1 ngày trước',
      icon: 'emoji-events',
      iconColor: COLORS.YELLOW,
      bgColor: COLORS.ORANGE_LIGHT,
      isRead: true,
      progress: '3/5',
    },
    {
      id: 'notif7',
      type: 'trip',
      title: 'Chuyến đi bị hủy',
      message: 'Rất tiếc, tài xế đã hủy chuyến #RD12342. Vui lòng đặt chuyến khác.',
      time: '1 ngày trước',
      icon: 'cancel',
      iconColor: COLORS.RED,
      bgColor: COLORS.RED_LIGHT,
      isRead: true,
      tripCode: '#RD12342',
    },
    {
      id: 'notif8',
      type: 'service',
      title: 'Cập nhật chính sách bảo mật',
      message: 'Chúng tôi đã cập nhật chính sách bảo mật để bảo vệ thông tin của bạn tốt hơn.',
      time: '2 ngày trước',
      icon: 'security',
      iconColor: COLORS.BLUE,
      bgColor: COLORS.BLUE_LIGHT,
      isRead: true,
    },
    {
      id: 'notif9',
      type: 'promotion',
      title: 'Giới thiệu bạn bè - Nhận 100 điểm',
      message: 'Mời bạn bè tham gia RideMate, cả hai cùng nhận 100 điểm thưởng cho mỗi lời mời thành công.',
      time: '3 ngày trước',
      icon: 'group-add',
      iconColor: COLORS.PRIMARY,
      bgColor: COLORS.BLUE_LIGHT,
      isRead: false,
    },
    {
      id: 'notif10',
      type: 'service',
      title: 'Bảo trì hệ thống',
      message: 'Hệ thống sẽ bảo trì vào 2:00 - 4:00 sáng ngày 20/10. Xin lỗi vì sự bất tiện này.',
      time: '4 ngày trước',
      icon: 'build',
      iconColor: COLORS.GRAY_DARK,
      bgColor: COLORS.GRAY_BG,
      isRead: true,
      scheduledDate: '20/10/2024',
      scheduledTime: '2:00 - 4:00 AM',
    },
  ])

  // Lọc thông báo theo tab
  const filteredNotifications = notifications.filter(notif => {
    if (activeTab === 'all') return true
    if (activeTab === 'trips') return notif.type === 'trip'
    if (activeTab === 'promotions') return notif.type === 'promotion'
    if (activeTab === 'services') return notif.type === 'service'
    return true
  })

  // Đếm số thông báo chưa đọc
  const unreadCount = notifications.filter(n => !n.isRead).length

  // Đánh dấu đã đọc
  const markAsRead = (notifId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notifId ? { ...n, isRead: true } : n)
    )
  }

  // Đánh dấu tất cả đã đọc
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    Alert.alert('Thành công', 'Đã đánh dấu tất cả thông báo là đã đọc')
  }

  // Xóa tất cả thông báo
  const clearAllNotifications = () => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc muốn xóa tất cả thông báo?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: () => {
            setNotifications([])
            Alert.alert('Thành công', 'Đã xóa tất cả thông báo')
          }
        }
      ]
    )
  }

  // Xóa một thông báo
  const deleteNotification = (notifId) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc muốn xóa thông báo này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: () => {
            setNotifications(prev => prev.filter(n => n.id !== notifId))
          }
        }
      ]
    )
  }

  const renderNotificationCard = ({ item }) => {
    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
        onPress={() => markAsRead(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationContent}>
          <View style={[styles.iconContainer, { backgroundColor: item.bgColor }]}>
            <MaterialIcons name={item.icon} size={24} color={item.iconColor} />
          </View>

          <View style={styles.notificationText}>
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationTitle} numberOfLines={2}>
                {item.title}
              </Text>
              {!item.isRead && <View style={styles.unreadDot} />}
            </View>
            
            <Text style={styles.notificationMessage} numberOfLines={3}>
              {item.message}
            </Text>

            {/* Thông tin bổ sung theo loại thông báo */}
            {item.tripCode && (
              <View style={styles.extraInfo}>
                <MaterialIcons name="confirmation-number" size={14} color={COLORS.BLUE} />
                <Text style={styles.extraInfoText}>{item.tripCode}</Text>
              </View>
            )}

            {item.promoCode && (
              <View style={styles.promoCodeBox}>
                <Text style={styles.promoCodeLabel}>Mã: </Text>
                <Text style={styles.promoCode}>{item.promoCode}</Text>
                <MaterialIcons name="content-copy" size={14} color={COLORS.PRIMARY} style={styles.copyIcon} />
              </View>
            )}

            {item.points && (
              <View style={styles.pointsBox}>
                <MaterialIcons name="stars" size={14} color={COLORS.ORANGE} />
                <Text style={styles.pointsText}>+{item.points} điểm</Text>
              </View>
            )}

            <View style={styles.notificationFooter}>
              <Text style={styles.notificationTime}>{item.time}</Text>
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation()
                  deleteNotification(item.id)
                }}
                style={styles.deleteButton}
              >
                <MaterialIcons name="delete-outline" size={18} color={COLORS.GRAY} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <MaterialIcons 
            name="notifications" 
            size={18} 
            color={activeTab === 'all' ? COLORS.PRIMARY : COLORS.GRAY} 
          />
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            Tất cả
          </Text>
          {unreadCount > 0 && activeTab === 'all' && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'trips' && styles.activeTab]}
          onPress={() => setActiveTab('trips')}
        >
          <MaterialIcons 
            name="directions-car" 
            size={18} 
            color={activeTab === 'trips' ? COLORS.PRIMARY : COLORS.GRAY} 
          />
          <Text style={[styles.tabText, activeTab === 'trips' && styles.activeTabText]}>
            Chuyến đi
          </Text>
          {notifications.filter(n => n.type === 'trip' && !n.isRead).length > 0 && activeTab === 'trips' && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {notifications.filter(n => n.type === 'trip' && !n.isRead).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'promotions' && styles.activeTab]}
          onPress={() => setActiveTab('promotions')}
        >
          <MaterialIcons 
            name="local-offer" 
            size={18} 
            color={activeTab === 'promotions' ? COLORS.PRIMARY : COLORS.GRAY} 
          />
          <Text style={[styles.tabText, activeTab === 'promotions' && styles.activeTabText]}>
            Khuyến mãi
          </Text>
          {notifications.filter(n => n.type === 'promotion' && !n.isRead).length > 0 && activeTab === 'promotions' && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {notifications.filter(n => n.type === 'promotion' && !n.isRead).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'services' && styles.activeTab]}
          onPress={() => setActiveTab('services')}
        >
          <MaterialIcons 
            name="settings" 
            size={18} 
            color={activeTab === 'services' ? COLORS.PRIMARY : COLORS.GRAY} 
          />
          <Text style={[styles.tabText, activeTab === 'services' && styles.activeTabText]}>
            Dịch vụ
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={28} color={COLORS.BLACK} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Thông báo</Text>
            {unreadCount > 0 && (
              <Text style={styles.headerSubtitle}>{unreadCount} chưa đọc</Text>
            )}
          </View>
        </View>

        {notifications.length > 0 && (
          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={markAllAsRead} style={styles.headerButton}>
                <MaterialIcons name="done-all" size={22} color={COLORS.PRIMARY} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={clearAllNotifications} style={styles.headerButton}>
              <MaterialIcons name="delete-sweep" size={22} color={COLORS.RED} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {renderTabs()}

      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotificationCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="notifications-none" size={80} color={COLORS.GRAY} />
            <Text style={styles.emptyTitle}>Không có thông báo</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'all' 
                ? 'Bạn chưa có thông báo nào' 
                : activeTab === 'trips'
                ? 'Không có thông báo về chuyến đi'
                : activeTab === 'promotions'
                ? 'Không có khuyến mãi nào'
                : 'Không có thông báo về dịch vụ'}
            </Text>
          </View>
        }
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.WHITE,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTextWrap: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.BLACK,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.PRIMARY,
    marginTop: 2,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 6,
  },
  tabContainer: {
    backgroundColor: COLORS.WHITE,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    elevation: 1,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: COLORS.GRAY_BG,
    gap: 6,
  },
  activeTab: {
    backgroundColor: COLORS.PRIMARY + '20',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.GRAY,
  },
  activeTabText: {
    color: COLORS.PRIMARY,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: COLORS.RED,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    paddingHorizontal: 6,
  },
  badgeText: {
    color: COLORS.WHITE,
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  notificationCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY,
  },
  notificationContent: {
    flexDirection: 'row',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.BLACK,
    flex: 1,
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.PRIMARY,
    marginLeft: 8,
    marginTop: 6,
  },
  notificationMessage: {
    fontSize: 13,
    color: COLORS.GRAY_DARK,
    lineHeight: 18,
    marginBottom: 8,
  },
  extraInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  extraInfoText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.BLUE,
  },
  promoCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.ORANGE_LIGHT,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  promoCodeLabel: {
    fontSize: 12,
    color: COLORS.GRAY_DARK,
  },
  promoCode: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.ORANGE,
    marginRight: 6,
  },
  copyIcon: {
    marginLeft: 4,
  },
  pointsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.ORANGE_LIGHT,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ORANGE,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  notificationTime: {
    fontSize: 11,
    color: COLORS.GRAY,
  },
  deleteButton: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.BLACK,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.GRAY,
    textAlign: 'center',
    lineHeight: 20,
  },
})

export default Notification

