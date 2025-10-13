import React, { useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView, TextInput, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import COLORS from '../../constant/colors'
import { MaterialIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'

const Report = () => {
  const navigation = useNavigation()
  const [selectedTrip, setSelectedTrip] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [reportModalVisible, setReportModalVisible] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [selectedReportType, setSelectedReportType] = useState('')
  const [activeTab, setActiveTab] = useState('driver') // 'driver' (Tôi có xe) hoặc 'passenger' (Tôi không có xe)

  // Mock data - chuyến đi đã hoàn thành
  // userRole: 'driver' = tôi là người lái xe, 'passenger' = tôi là người đi nhờ
  const [allTrips] = useState([
    // Các chuyến tôi là tài xế (có xe)
    {
      id: 'trip1',
      userRole: 'driver', // Tôi là tài xế
      tripCode: '#RD12345',
      driver: 'Tôi', // Tên của user hiện tại
      passenger: 'Trần Minh Tuấn',
      driverRating: 1200,
      passengerRating: 980,
      route: 'ĐH FPT → Vincom',
      startLocation: 'Đại học FPT, Hòa Lạc',
      endLocation: 'Vincom Center, Cầu Giấy',
      date: '2025-10-12',
      time: '14:30',
      duration: '25 phút',
      distance: '15.2 km',
      points: 200,
      vehicle: 'Honda Wave - 29A1-12345',
      status: 'completed',
    },
    {
      id: 'trip2',
      userRole: 'driver',
      tripCode: '#RD12346',
      driver: 'Tôi',
      passenger: 'Nguyễn Văn Bình',
      driverRating: 1200,
      passengerRating: 1100,
      route: 'Nhà riêng → AEON Mall',
      startLocation: 'Số 15, Phố Huế',
      endLocation: 'AEON Mall Long Biên',
      date: '2025-10-11',
      time: '09:15',
      duration: '35 phút',
      distance: '18.5 km',
      points: 200,
      vehicle: 'Honda Wave - 29A1-12345',
      status: 'completed',
    },
    {
      id: 'trip3',
      userRole: 'driver',
      tripCode: '#RD12347',
      driver: 'Tôi',
      passenger: 'Phạm Thị Hoa',
      driverRating: 1200,
      passengerRating: 1350,
      route: 'Công ty → Nhà riêng',
      startLocation: 'Tòa nhà Keangnam',
      endLocation: 'Chung cư Times City',
      date: '2025-10-10',
      time: '18:45',
      duration: '30 phút',
      distance: '12.8 km',
      points: 200,
      vehicle: 'Honda Wave - 29A1-12345',
      status: 'completed',
    },
    // Các chuyến tôi là hành khách (không có xe)
    {
      id: 'trip4',
      userRole: 'passenger', // Tôi là hành khách
      tripCode: '#RD12348',
      driver: 'Lê Văn Hùng',
      passenger: 'Tôi',
      driverRating: 1200,
      passengerRating: 1200,
      route: 'Hồ Gươm → Sân bay Nội Bài',
      startLocation: 'Hồ Hoàn Kiếm',
      endLocation: 'Sân bay Nội Bài',
      date: '2025-10-09',
      time: '06:00',
      duration: '45 phút',
      distance: '28.3 km',
      points: 250,
      vehicle: 'Honda SH - 29C1-45678',
      status: 'completed',
    },
    {
      id: 'trip5',
      userRole: 'passenger',
      tripCode: '#RD12349',
      driver: 'Trần Thị Mai',
      passenger: 'Tôi',
      driverRating: 1450,
      passengerRating: 1200,
      route: 'Nhà riêng → Trường ĐH',
      startLocation: 'Chung cư The Garden',
      endLocation: 'Đại học Bách Khoa',
      date: '2025-10-08',
      time: '07:30',
      duration: '20 phút',
      distance: '10.5 km',
      points: 150,
      vehicle: 'Yamaha Exciter - 30B2-98765',
      status: 'completed',
    },
    {
      id: 'trip6',
      userRole: 'passenger',
      tripCode: '#RD12350',
      driver: 'Phạm Minh Tuấn',
      passenger: 'Tôi',
      driverRating: 890,
      passengerRating: 1200,
      route: 'Siêu thị → Nhà',
      startLocation: 'BigC Thăng Long',
      endLocation: 'Khu đô thị Ciputra',
      date: '2025-10-07',
      time: '16:20',
      duration: '18 phút',
      distance: '8.7 km',
      points: 120,
      vehicle: 'Yamaha Sirius - 30A1-22334',
      status: 'completed',
    },
  ])

  // Loại báo cáo cho tab Driver (Tôi có xe) - báo cáo về hành khách
  const driverReportTypes = [
    { id: '1', title: 'Hành khách không đến đúng giờ', icon: 'access-time' },
    { id: '2', title: 'Hành khách không đến điểm hẹn', icon: 'location-off' },
    { id: '3', title: 'Hành khách có thái độ không tốt', icon: 'mood-bad' },
    { id: '4', title: 'Hành khách cung cấp sai thông tin', icon: 'person-outline' },
    { id: '5', title: 'Hành khách từ chối thanh toán', icon: 'money-off' },
    { id: '6', title: 'Hành khách hủy chuyến đột ngột', icon: 'cancel' },
    { id: '7', title: 'Hành khách có hành vi không phù hợp', icon: 'warning' },
    { id: '8', title: 'Vấn đề khác', icon: 'help-outline' },
  ]

  // Loại báo cáo cho tab Passenger (Tôi không có xe) - báo cáo về tài xế
  const passengerReportTypes = [
    { id: '1', title: 'Tài xế không đúng thông tin', icon: 'person-outline' },
    { id: '2', title: 'Tài xế lái xe không an toàn', icon: 'warning' },
    { id: '3', title: 'Tài xế có thái độ không tốt', icon: 'mood-bad' },
    { id: '4', title: 'Tài xế yêu cầu thanh toán không đúng', icon: 'attach-money' },
    { id: '5', title: 'Xe không đúng thông tin', icon: 'directions-bike' },
    { id: '6', title: 'Tài xế hủy chuyến đột ngột', icon: 'cancel' },
    { id: '7', title: 'Vấn đề khác', icon: 'help-outline' },
  ]

  // Filter trips theo activeTab
  const completedTrips = allTrips.filter(trip => trip.userRole === activeTab)
  
  // Lấy reportTypes phù hợp với tab hiện tại
  const reportTypes = activeTab === 'driver' ? driverReportTypes : passengerReportTypes

  const openTripDetail = (trip) => {
    setSelectedTrip(trip)
    setModalVisible(true)
  }

  const openReportModal = () => {
    setModalVisible(false)
    setReportModalVisible(true)
    setReportReason('')
    setSelectedReportType('')
  }

  const submitReport = () => {
    if (!selectedReportType) {
      Alert.alert('Thông báo', 'Vui lòng chọn loại vấn đề')
      return
    }
    if (!reportReason.trim()) {
      Alert.alert('Thông báo', 'Vui lòng mô tả chi tiết vấn đề')
      return
    }

    // Xử lý gửi báo cáo đến admin
    Alert.alert(
      'Thành công',
      'Báo cáo của bạn đã được gửi đến Admin. Chúng tôi sẽ xem xét và phản hồi trong thời gian sớm nhất.',
      [
        {
          text: 'OK',
          onPress: () => {
            setReportModalVisible(false)
            setReportReason('')
            setSelectedReportType('')
          }
        }
      ]
    )
  }

  const renderTripCard = ({ item }) => {
    // Hiển thị thông tin người cần báo cáo dựa trên role của user trong chuyến đi
    const personName = item.userRole === 'driver' ? item.passenger : item.driver
    const personRating = item.userRole === 'driver' ? item.passengerRating : item.driverRating
    const personLabel = item.userRole === 'driver' ? 'Hành khách' : 'Tài xế'
    
    return (
      <TouchableOpacity
        style={styles.tripCard}
        onPress={() => openTripDetail(item)}
        activeOpacity={0.7}
      >
        <View style={styles.tripHeader}>
          <View style={styles.tripIconWrap}>
            <MaterialIcons name="check-circle" size={24} color={COLORS.WHITE} />
          </View>
          <View style={styles.tripHeaderText}>
            <Text style={styles.tripCode}>{item.tripCode}</Text>
            <Text style={styles.tripDate}>{item.date} • {item.time}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={COLORS.GRAY} />
        </View>

        <View style={styles.tripRoute}>
          <View style={styles.routeIndicator}>
            <View style={styles.startDot} />
            <View style={styles.routeLine} />
            <View style={styles.endDot} />
          </View>
          <View style={styles.routeText}>
            <Text style={styles.locationText} numberOfLines={1}>{item.startLocation}</Text>
            <Text style={styles.locationText} numberOfLines={1}>{item.endLocation}</Text>
          </View>
        </View>

        <View style={styles.tripFooter}>
          <View style={styles.driverInfo}>
            <MaterialIcons name="person" size={16} color={COLORS.GRAY_DARK} />
            <Text style={styles.driverName}>{personName}</Text>
            <MaterialIcons name="emoji-events" size={14} color={COLORS.ORANGE_DARK} />
            <Text style={styles.rating}>{personRating}</Text>
          </View>
          <Text style={styles.fare}>{item.points} điểm</Text>
        </View>
      </TouchableOpacity>
    )
  }

  const renderReportTypeItem = (reportType) => {
    const isSelected = selectedReportType === reportType.id
    return (
      <TouchableOpacity
        key={reportType.id}
        style={[styles.reportTypeCard, isSelected && styles.reportTypeCardActive]}
        onPress={() => setSelectedReportType(reportType.id)}
      >
        <MaterialIcons 
          name={reportType.icon} 
          size={22} 
          color={isSelected ? COLORS.WHITE : COLORS.PRIMARY} 
        />
        <Text style={[styles.reportTypeText, isSelected && styles.reportTypeTextActive]}>
          {reportType.title}
        </Text>
        {isSelected && (
          <MaterialIcons name="check" size={20} color={COLORS.WHITE} style={styles.checkIcon} />
        )}
      </TouchableOpacity>
    )
  }

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'driver' && styles.activeTab]}
        onPress={() => setActiveTab('driver')}
      >
        <MaterialIcons 
          name="directions-car" 
          size={18} 
          color={activeTab === 'driver' ? COLORS.PRIMARY : COLORS.GRAY} 
        />
        <Text style={[styles.tabText, activeTab === 'driver' && styles.activeTabText]}>
          Tôi có xe
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'passenger' && styles.activeTab]}
        onPress={() => setActiveTab('passenger')}
      >
        <MaterialIcons 
          name="person" 
          size={18} 
          color={activeTab === 'passenger' ? COLORS.PRIMARY : COLORS.GRAY} 
        />
        <Text style={[styles.tabText, activeTab === 'passenger' && styles.activeTabText]}>
          Tôi không có xe
        </Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={28} color={COLORS.BLACK} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Báo cáo chuyến đi</Text>
          <Text style={styles.headerSubtitle}>Chọn chuyến đi để báo cáo vấn đề</Text>
        </View>
      </View>

      {renderTabs()}

      <FlatList
        data={completedTrips}
        keyExtractor={(item) => item.id}
        renderItem={renderTripCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="inbox" size={64} color={COLORS.GRAY} />
            <Text style={styles.emptyText}>
              {activeTab === 'driver' 
                ? 'Chưa có chuyến đi nào khi bạn là tài xế' 
                : 'Chưa có chuyến đi nào khi bạn là hành khách'}
            </Text>
          </View>
        }
      />

      {/* Modal chi tiết chuyến đi */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết chuyến đi</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={COLORS.BLACK} />
              </TouchableOpacity>
            </View>

             {selectedTrip && (() => {
                const personName = selectedTrip.userRole === 'driver' ? selectedTrip.passenger : selectedTrip.driver
                const personRating = selectedTrip.userRole === 'driver' ? selectedTrip.passengerRating : selectedTrip.driverRating
                const personLabel = selectedTrip.userRole === 'driver' ? 'Hành khách' : 'Tài xế'
                
                return (
                  <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
                    <View style={styles.detailSection}>
                      <View style={styles.detailHeader}>
                        <Text style={styles.detailTripCode}>{selectedTrip.tripCode}</Text>
                        <View style={styles.statusBadge}>
                          <MaterialIcons name="check-circle" size={16} color={COLORS.GREEN} />
                          <Text style={styles.statusText}>Hoàn thành</Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <MaterialIcons name="event" size={20} color={COLORS.PRIMARY} />
                        <Text style={styles.detailLabel}>Thời gian:</Text>
                        <Text style={styles.detailValue}>{selectedTrip.date} lúc {selectedTrip.time}</Text>
                      </View>

                      <View style={styles.detailDivider} />

                      <View style={styles.routeDetail}>
                        <View style={styles.routeIndicatorLarge}>
                          <View style={styles.startDotLarge} />
                          <View style={styles.routeLineLarge} />
                          <View style={styles.endDotLarge} />
                        </View>
                        <View style={styles.routeDetailText}>
                          <View style={styles.locationDetail}>
                            <Text style={styles.locationLabel}>Điểm đón</Text>
                            <Text style={styles.locationAddress}>{selectedTrip.startLocation}</Text>
                          </View>
                          <View style={[styles.locationDetail, styles.locationDetailEnd]}>
                            <Text style={styles.locationLabel}>Điểm đến</Text>
                            <Text style={styles.locationAddress}>{selectedTrip.endLocation}</Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.detailDivider} />

                      <View style={styles.detailRow}>
                        <MaterialIcons name="person" size={20} color={COLORS.PRIMARY} />
                        <Text style={styles.detailLabel}>{personLabel}:</Text>
                        <Text style={styles.detailValue}>{personName}</Text>
                        <MaterialIcons name="emoji-events" size={16} color={COLORS.ORANGE_DARK} style={styles.starIcon} />
                        <Text style={styles.detailRating}>{personRating}</Text>
                      </View>

                      {selectedTrip.userRole === 'passenger' && (
                        <View style={styles.detailRow}>
                          <MaterialIcons name="directions-bike" size={20} color={COLORS.PRIMARY} />
                          <Text style={styles.detailLabel}>Phương tiện:</Text>
                          <Text style={styles.detailValue}>{selectedTrip.vehicle}</Text>
                        </View>
                      )}

                      <View style={styles.detailRow}>
                        <MaterialIcons name="access-time" size={20} color={COLORS.PRIMARY} />
                        <Text style={styles.detailLabel}>Thời gian:</Text>
                        <Text style={styles.detailValue}>{selectedTrip.duration}</Text>
                      </View>

                      <View style={styles.detailRow}>
                        <MaterialIcons name="straighten" size={20} color={COLORS.PRIMARY} />
                        <Text style={styles.detailLabel}>Quãng đường:</Text>
                        <Text style={styles.detailValue}>{selectedTrip.distance}</Text>
                      </View>

                      <View style={styles.detailDivider} />

                      <View style={styles.fareRow}>
                        <Text style={styles.fareLabel}>Điểm thưởng:</Text>
                        <Text style={styles.fareValue}>{selectedTrip.points} điểm</Text>
                      </View>
                    </View>

                    <TouchableOpacity style={styles.reportButton} onPress={openReportModal}>
                      <MaterialIcons name="flag" size={20} color={COLORS.WHITE} />
                      <Text style={styles.reportButtonText}>Báo cáo vấn đề với Admin</Text>
                    </TouchableOpacity>
                  </ScrollView>
                )
              })()}
          </View>
        </View>
      </Modal>

      {/* Modal báo cáo */}
      <Modal
        visible={reportModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Báo cáo vấn đề</Text>
              <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={COLORS.BLACK} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              {selectedTrip && (
                <View style={styles.reportTripInfo}>
                  <Text style={styles.reportTripCode}>{selectedTrip.tripCode}</Text>
                  <Text style={styles.reportTripRoute}>{selectedTrip.route}</Text>
                </View>
              )}

              <Text style={styles.sectionLabel}>Chọn loại vấn đề:</Text>
              <View style={styles.reportTypeList}>
                {reportTypes.map(type => renderReportTypeItem(type))}
              </View>

              <Text style={styles.sectionLabel}>Mô tả chi tiết:</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Vui lòng mô tả chi tiết vấn đề bạn gặp phải..."
                placeholderTextColor={COLORS.GRAY}
                multiline
                numberOfLines={6}
                value={reportReason}
                onChangeText={setReportReason}
                textAlignVertical="top"
              />

              <View style={styles.reportActions}>
                <TouchableOpacity 
                  style={[styles.reportBtn, styles.reportCancel]} 
                  onPress={() => setReportModalVisible(false)}
                >
                  <Text style={styles.reportBtnText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.reportBtn, styles.reportSubmit]} 
                  onPress={submitReport}
                >
                  <Text style={[styles.reportBtnText, styles.reportSubmitText]}>Gửi báo cáo</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTextWrap: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.BLACK,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.GRAY_DARK,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  activeTab: {
    backgroundColor: COLORS.PRIMARY + '15',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.GRAY,
  },
  activeTabText: {
    color: COLORS.PRIMARY,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  tripCard: {
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
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tripIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tripHeaderText: {
    flex: 1,
  },
  tripCode: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.BLACK,
  },
  tripDate: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginTop: 2,
  },
  tripRoute: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  routeIndicator: {
    alignItems: 'center',
    marginRight: 12,
  },
  startDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.PRIMARY,
  },
  routeLine: {
    width: 2,
    height: 30,
    backgroundColor: COLORS.GRAY_LIGHT,
    marginVertical: 4,
  },
  endDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.ORANGE_DARK,
  },
  routeText: {
    flex: 1,
    justifyContent: 'space-between',
  },
  locationText: {
    fontSize: 14,
    color: COLORS.BLACK,
    fontWeight: '600',
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_LIGHT,
    paddingTop: 12,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverName: {
    fontSize: 13,
    color: COLORS.GRAY_DARK,
    marginLeft: 6,
    marginRight: 8,
  },
  rating: {
    fontSize: 13,
    color: COLORS.ORANGE_DARK,
    fontWeight: '700',
    marginLeft: 2,
  },
  fare: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.GREEN,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.GRAY,
    marginTop: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.BLACK,
  },
  modalBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailTripCode: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.BLUE,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.GREEN + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.GREEN,
    marginLeft: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.GRAY_DARK,
    marginLeft: 8,
    marginRight: 8,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.BLACK,
    fontWeight: '600',
    flex: 1,
  },
  starIcon: {
    marginLeft: 8,
  },
  detailRating: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ORANGE_DARK,
    marginLeft: 2,
  },
  detailDivider: {
    height: 1,
    backgroundColor: COLORS.GRAY_LIGHT,
    marginVertical: 16,
  },
  routeDetail: {
    flexDirection: 'row',
  },
  routeIndicatorLarge: {
    alignItems: 'center',
    marginRight: 16,
  },
  startDotLarge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.PRIMARY,
  },
  routeLineLarge: {
    width: 2,
    height: 60,
    backgroundColor: COLORS.GRAY_LIGHT,
    marginVertical: 6,
  },
  endDotLarge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.ORANGE_DARK,
  },
  routeDetailText: {
    flex: 1,
    justifyContent: 'space-between',
  },
  locationDetail: {
    marginBottom: 12,
  },
  locationDetailEnd: {
    marginTop: 12,
  },
  locationLabel: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 15,
    color: COLORS.BLACK,
    fontWeight: '600',
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.GREEN + '15',
    padding: 16,
    borderRadius: 12,
  },
  fareLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.BLACK,
  },
  fareValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.GREEN,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.RED,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  reportButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.WHITE,
    marginLeft: 8,
  },
  reportTripInfo: {
    backgroundColor: COLORS.BLUE_LIGHT,
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  reportTripCode: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.BLUE,
    marginBottom: 4,
  },
  reportTripRoute: {
    fontSize: 13,
    color: COLORS.GRAY_DARK,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.BLACK,
    marginBottom: 12,
  },
  reportTypeList: {
    marginBottom: 20,
  },
  reportTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    borderWidth: 2,
    borderColor: COLORS.GRAY_LIGHT,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  reportTypeCardActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  reportTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.BLACK,
    marginLeft: 12,
    flex: 1,
  },
  reportTypeTextActive: {
    color: COLORS.WHITE,
  },
  checkIcon: {
    marginLeft: 8,
  },
  textArea: {
    backgroundColor: COLORS.GRAY_BG,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: COLORS.BLACK,
    minHeight: 120,
    marginBottom: 20,
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 10,
  },
  reportBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  reportCancel: {
    backgroundColor: COLORS.GRAY_BG,
    marginRight: 8,
  },
  reportSubmit: {
    backgroundColor: COLORS.PRIMARY,
    marginLeft: 8,
  },
  reportBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.BLACK,
  },
  reportSubmitText: {
    color: COLORS.WHITE,
  },
})

export default Report

