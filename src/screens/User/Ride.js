import React, { useState, useEffect } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  FlatList,
  Modal,
  Dimensions,
  TextInput
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import COLORS from '../../constant/colors'
import LocationSearch from '../../components/LocationSearch'
import DriverRide from './Rider/DriverRide'
import PassengerRide from './Rider/PassengerRide'
import { getCurrentLocation, reverseGeocode, searchPlaces, getDirections, MAPS_CONFIG } from '../../config/maps'

const Ride = () => {
  const [userMode, setUserMode] = useState(null) // 'driver' hoặc 'passenger'
  const [fromLocation, setFromLocation] = useState('')
  const [toLocation, setToLocation] = useState('')
  const [selectedPassengers, setSelectedPassengers] = useState([])
  const [maxPassengers, setMaxPassengers] = useState(3)
  const [originCoordinate, setOriginCoordinate] = useState(null)
  const [destinationCoordinate, setDestinationCoordinate] = useState(null)
  const [fromSuggestions, setFromSuggestions] = useState([])
  const [toSuggestions, setToSuggestions] = useState([])
  const [showRouteDetails, setShowRouteDetails] = useState(false)
  const [routeInfo, setRouteInfo] = useState(null)
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false)
  const [isLoadingDirections, setIsLoadingDirections] = useState(false)
  const [isScheduleModalVisible, setIsScheduleModalVisible] = useState(false)
  const [scheduleTime, setScheduleTime] = useState('')
  const [scheduleFromText, setScheduleFromText] = useState('')
  const [scheduleToText, setScheduleToText] = useState('')
  const [scheduleFromSuggestions, setScheduleFromSuggestions] = useState([])
  const [scheduleToSuggestions, setScheduleToSuggestions] = useState([])
  const [scheduleOriginCoordinate, setScheduleOriginCoordinate] = useState(null)
  const [scheduleDestinationCoordinate, setScheduleDestinationCoordinate] = useState(null)
  const [scheduledRides, setScheduledRides] = useState(null)
  const [scheduledRide, setScheduledRide] = useState(null)
  
  // Mock data cho demo
  const availablePassengers = [
    { id: 1, name: 'Nguyễn Văn A', rating: 4.8, distance: '200m', avatar: '👨' },
    { id: 2, name: 'Trần Thị B', rating: 4.9, distance: '150m', avatar: '👩' },
    { id: 3, name: 'Lê Văn C', rating: 4.7, distance: '300m', avatar: '👨‍💼' },
    { id: 4, name: 'Phạm Thị D', rating: 4.5, distance: '450m', avatar: '👩‍💼' },
  ]

  const availableRides = [
    { 
      id: 1, 
      driverName: 'Trần Văn X', 
      rating: 4.9, 
      carModel: 'Toyota Vios',
      departureTime: '14:30',
      price: '25,000đ',
      availableSeats: 2,
      fromLocation: 'Trường Đại học',
      toLocation: 'Vincom Plaza'
    },
    { 
      id: 2, 
      driverName: 'Nguyễn Thị Y', 
      rating: 4.7, 
      carModel: 'Honda City',
      departureTime: '15:00',
      price: '30,000đ',
      availableSeats: 1,
      fromLocation: 'Nhà ga',
      toLocation: 'Sân bay',
      path: []
    }
  ]

  // Hàm gọi Google Places API thực
  const searchPlacesAPI = async (query) => {
    try {
      const places = await searchPlaces(query, MAPS_CONFIG.GOOGLE_MAPS_API_KEY)
      return places
    } catch (error) {
      console.error('Error searching places:', error)
      return []
    }
  }

  const handleModeSelection = (mode) => {
    setUserMode(mode)
  }

  const handlePassengerSelect = (passenger) => {
    const isSelected = selectedPassengers.find(p => p.id === passenger.id)
    if (isSelected) {
      setSelectedPassengers(selectedPassengers.filter(p => p.id !== passenger.id))
    } else if (selectedPassengers.length < maxPassengers) {
      setSelectedPassengers([...selectedPassengers, passenger])
    } else {
      Alert.alert('Thông báo', `Bạn chỉ có thể chọn tối đa ${maxPassengers} người`)
    }
  }

  const handleLocationSuggestions = async (query, type) => {
    if (query.length < 3) return // Chỉ tìm kiếm khi có ít nhất 3 ký tự
    
    setIsLoadingPlaces(true)
    try {
      const suggestions = await searchPlacesAPI(query)
      if (type === 'from') {
        setFromSuggestions(suggestions)
      } else {
        setToSuggestions(suggestions)
      }
    } catch (error) {
      console.error('Error getting location suggestions:', error)
      // Fallback to empty array if API fails
      if (type === 'from') {
        setFromSuggestions([])
      } else {
        setToSuggestions([])
      }
    } finally {
      setIsLoadingPlaces(false)
    }
  }

  const handleScheduleSuggestions = async (query, type) => {
    if (query.length < 3) return
    setIsLoadingPlaces(true)
    try {
      const suggestions = await searchPlacesAPI(query)
      if (type === 'from') {
        setScheduleFromSuggestions(suggestions)
      } else {
        setScheduleToSuggestions(suggestions)
      }
    } catch (error) {
      if (type === 'from') {
        setScheduleFromSuggestions([])
      } else {
        setScheduleToSuggestions([])
      }
    } finally {
      setIsLoadingPlaces(false)
    }
  }

  const handleScheduleSelect = (location, type) => {
    if (type === 'from') {
      setScheduleOriginCoordinate(location)
      setScheduleFromSuggestions([])
    } else {
      setScheduleDestinationCoordinate(location)
      setScheduleToSuggestions([])
    }
  }

  const handleConfirmSchedule = () => {
    if (!scheduleFromText || !scheduleToText || !scheduleTime) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thời gian, điểm xuất phát và điểm đến')
      return
    }
    
    // Lưu thông tin lịch trình
    setScheduledRide({
      time: scheduleTime,
      from: scheduleFromText,
      to: scheduleToText
    })
    
    setFromLocation(scheduleFromText)
    setToLocation(scheduleToText)
    setOriginCoordinate(scheduleOriginCoordinate || null)
    setDestinationCoordinate(scheduleDestinationCoordinate || null) 
    setIsScheduleModalVisible(false)
    Alert.alert('Đã đặt lịch', `Khởi hành lúc ${scheduleTime}`)
  }

  const handleCancelSchedule = () => {
    Alert.alert(
      'Xóa lịch trình',
      'Bạn có chắc muốn xóa lịch trình này?',
      [
        {
          text: 'Hủy',
          style: 'cancel'
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            setScheduledRide(null)
            setFromLocation('')
            setToLocation('')
            setOriginCoordinate(null)
            setDestinationCoordinate(null)
            Alert.alert('Thành công', 'Đã xóa lịch trình')
          }
        }
      ]
    )
  }

  const handleLocationSelect = (location, type) => {
    if (type === 'from') {
      setOriginCoordinate(location)
      setFromSuggestions([])
    } else {
      setDestinationCoordinate(location)
      setToSuggestions([])
    }
  }

  const handleGetCurrentLocation = async (type) => {
    try {
      const currentLocation = await getCurrentLocation()
      const address = await reverseGeocode(currentLocation.latitude, currentLocation.longitude)
      
      if (type === 'from') {
        setFromLocation(address)
        setOriginCoordinate(currentLocation)
      } else {
        setToLocation(address)
        setDestinationCoordinate(currentLocation)
      }
      
      Alert.alert('Thành công', `Đã lấy vị trí hiện tại: ${address}`)
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền truy cập vị trí.')
    }
  }

  const handleSearchAsDriver = async () => {
    if (!fromLocation || !toLocation) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ điểm xuất phát và điểm đến')
      return
    }
    if (!originCoordinate || !destinationCoordinate) {
      Alert.alert('Lỗi', 'Vui lòng chọn địa điểm từ danh sách gợi ý')
      return
    }
    
    setIsLoadingDirections(true)
    try {
      // Sử dụng Google Directions API để lấy thông tin tuyến đường thực tế
      const directions = await getDirections(originCoordinate, destinationCoordinate, MAPS_CONFIG.GOOGLE_MAPS_API_KEY)
      
      // Tính giá cước dựa trên khoảng cách thực tế
      const distanceKm = directions.distanceValue / 1000 // Convert meters to km
      const price = calculatePrice(distanceKm)
      
      setRouteInfo({
        distance: directions.distance,
        duration: directions.duration,
        price: `${price.toLocaleString('vi-VN')}đ`
      })
      
      Alert.alert('Thành công', `Đang tìm kiếm người đi cùng từ ${fromLocation} đến ${toLocation}`)
    } catch (error) {
      console.error('Error getting directions:', error)
      Alert.alert('Lỗi', 'Không thể lấy thông tin tuyến đường. Vui lòng thử lại.')
    } finally {
      setIsLoadingDirections(false)
    }
  }

  const handleSearchAsPassenger = () => {
    if (!toLocation) {
      Alert.alert('Lỗi', 'Vui lòng nhập điểm đến')
      return
    }
    if (!destinationCoordinate) {
      Alert.alert('Lỗi', 'Vui lòng chọn địa điểm từ danh sách gợi ý')
      return
    }
    Alert.alert('Thành công', `Đang tìm kiếm chuyến đi đến ${toLocation}`)
  }

  const renderDriverInterface = () => (
    <DriverRide
      styles={styles}
      fromLocation={fromLocation}
      toLocation={toLocation}
      fromSuggestions={fromSuggestions}
      toSuggestions={toSuggestions}
      originCoordinate={originCoordinate}
      destinationCoordinate={destinationCoordinate}
      routeInfo={routeInfo}
      isLoadingDirections={isLoadingDirections}
      onLocationSelect={handleLocationSelect}
      onRequestSuggestions={handleLocationSuggestions}
      onGetCurrentLocation={handleGetCurrentLocation}
      onSearch={handleSearchAsDriver}
    />
  )

  const renderPassengerInterface = () => (
    <PassengerRide
      styles={styles}
      toLocation={toLocation}
      toSuggestions={toSuggestions}
      originCoordinate={originCoordinate}
      destinationCoordinate={destinationCoordinate}
      availableRides={availableRides}
      onLocationSelect={handleLocationSelect}
      onRequestSuggestions={handleLocationSuggestions}
      onSearch={handleSearchAsPassenger}
    />
  )

  if (!userMode) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.selectionContainer}>
          <Text style={styles.title}>Chọn chế độ của bạn</Text>
          <Text style={styles.subtitle}>Bạn muốn sử dụng RideMate như thế nào?</Text>
          
          <TouchableOpacity 
            style={styles.modeButton}
            onPress={() => handleModeSelection('driver')}
          >
            <MaterialIcons name="directions-car" size={32} color={COLORS.WHITE} />
            <Text style={styles.modeButtonText}>Tôi có xe</Text>
            <Text style={styles.modeButtonSubtext}>Chia sẻ chuyến đi của bạn</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.modeButton}
            onPress={() => handleModeSelection('passenger')}
          >
            <MaterialIcons name="person-add" size={32} color={COLORS.WHITE} />
            <Text style={styles.modeButtonText}>Tôi không có xe</Text>
            <Text style={styles.modeButtonSubtext}>Tìm chuyến đi phù hợp</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => setUserMode(null)}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.BLACK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {userMode === 'driver' ? 'Tôi có xe' : 'Tôi không có xe'}
        </Text>
        {userMode === 'driver' ? (
          <View style={styles.headerRight}>
            {scheduledRide ? (
              <TouchableOpacity 
                style={[styles.headerScheduleBtn, styles.headerCancelBtn]}
                onPress={handleCancelSchedule}
              >
                <MaterialIcons name="event-busy" size={18} color={COLORS.WHITE} />
                <Text style={styles.headerScheduleText}>Xóa lịch</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.headerScheduleBtn}
                onPress={() => setIsScheduleModalVisible(true)}
              >
                <MaterialIcons name="event" size={18} color={COLORS.WHITE} />
                <Text style={styles.headerScheduleText}>Đặt lịch</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>
      
      {userMode === 'driver' ? renderDriverInterface() : renderPassengerInterface()}

      {/* Modal đặt lịch */}
      <Modal
        visible={isScheduleModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsScheduleModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Đặt lịch chuyến</Text>
            <FlatList
              data={[]}
              keyExtractor={(item, index) => `modal-${index}`}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                <View>
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>Thời gian khởi hành</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="HH:MM DD/MM/YYYY"
                      value={scheduleTime}
                      onChangeText={setScheduleTime}
                      placeholderTextColor={COLORS.PLACEHOLDER_COLOR}
                    />
                  </View>
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>Điểm xuất phát</Text>
                    <LocationSearch
                      placeholder="Nhập điểm xuất phát"
                      value={scheduleFromText}
                      onChangeText={setScheduleFromText}
                      onLocationSelect={(loc) => handleScheduleSelect(loc, 'from')}
                      suggestions={scheduleFromSuggestions}
                      showSuggestions={scheduleFromText.length > 2}
                      onRequestSuggestions={(q) => handleScheduleSuggestions(q, 'from')}
                      iconName="my-location"
                    />
                  </View>
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>Điểm đến</Text>
                    <LocationSearch
                      placeholder="Nhập điểm đến"
                      value={scheduleToText}
                      onChangeText={setScheduleToText}
                      onLocationSelect={(loc) => handleScheduleSelect(loc, 'to')}
                      suggestions={scheduleToSuggestions}
                      showSuggestions={scheduleToText.length > 2}
                      onRequestSuggestions={(q) => handleScheduleSuggestions(q, 'to')}
                      iconName="place"
                    />
                  </View>
                </View>
              }
            />
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalCancel]}
                onPress={() => setIsScheduleModalVisible(false)}
              >
                <Text style={styles.modalBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalConfirm]}
                onPress={handleConfirmSchedule}
              >
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
  selectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.BLACK,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.GRAY,
    textAlign: 'center',
    marginBottom: 40,
  },
  modeButton: {
    backgroundColor: COLORS.PURPLE,
    borderRadius: 20,
    padding: 30,
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
    elevation: 5,
    shadowColor: COLORS.PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modeButtonText: {
    fontSize: 20, 
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginTop: 10,
    marginBottom: 5,
  },
  modeButtonSubtext: {
    fontSize: 14,
    color: COLORS.WHITE,
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  backBtn: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.BLACK,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerScheduleBtn: {
    backgroundColor: COLORS.BLUE,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerCancelBtn: {
    backgroundColor: COLORS.RED,
  },
  headerScheduleText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  headerSpacer: {
    width: 39, 
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.BLACK,
    marginVertical: 20,
    textAlign: 'center',
  },
  inputContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  locationRowTo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    
  },
  locationSearchWrapper: {
    flex: 1,
  },
  currentLocationBtn: {
    backgroundColor: COLORS.BLUE,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  currentLocationText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 5,
  },
  routeInfoContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  routeInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.BLACK,
    marginBottom: 15,
  },
  routeInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  routeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.BLUE_LIGHT,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
  },
  routeInfoText: {
    fontSize: 12,
    color: COLORS.BLACK,
    marginLeft: 5,
    fontWeight: '600',
  },
  settingsContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.BLACK,
    marginBottom: 15,
  },
  passengerLimitContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  passengerLimitBtn: {
    backgroundColor: COLORS.GRAY_BG,
    borderRadius: 20,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passengerLimitBtnActive: {
    backgroundColor: COLORS.PURPLE,
  },
  passengerLimitText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.GRAY_DARK,
  },
  passengerLimitTextActive: {
    color: COLORS.WHITE,
  },
  searchBtn: {
    backgroundColor: COLORS.PURPLE,
    borderRadius: 25,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  headerScheduleBtn: {
    backgroundColor: COLORS.BLUE,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerCancelBtn: {
    backgroundColor: COLORS.RED,
  },
  headerScheduleText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  searchBtnText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  searchBtnDisabled: {
    backgroundColor: COLORS.GRAY,
    opacity: 0.7,
    marginTop: 20,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.BLACK,
    marginBottom: 15,
  },
  passengerCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
  },
  passengerCardSelected: {
    borderColor: COLORS.GREEN,
    borderWidth: 2,
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  passengerAvatar: {
    fontSize: 24,
    marginRight: 15,
  },
  passengerDetails: {
    flex: 1,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.BLACK,
    marginBottom: 5,
  },
  passengerRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: COLORS.BLACK,
    marginLeft: 5,
    fontWeight: '500',
  },
  distanceText: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginLeft: 5,
  },
  confirmBtn: {
    backgroundColor: COLORS.GREEN,
    borderRadius: 25,
    padding: 18,
    marginBottom: 20,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
  rideCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.BLACK,
    marginBottom: 5,
  },
  driverRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.PURPLE,
  },
  rideDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  carModel: {
    fontSize: 16,
    color: COLORS.BLACK,
    fontWeight: '500',
  },
  seatsInfo: {
    fontSize: 14,
    color: COLORS.BLUE,
    fontWeight: '500',
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeText: {
    fontSize: 14,
    color: COLORS.BLACK,
    marginLeft: 10,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  timeText: {
    fontSize: 14,
    color: COLORS.BLUE,
    fontWeight: '600',
    marginLeft: 10,
  },
  joinBtn: {
    backgroundColor: COLORS.PURPLE,
    borderRadius: 20,
    padding: 15,
    alignItems: 'center',
  },
  joinBtnText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
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
    maxHeight: Dimensions.get('window').height * 0.85,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.BLACK,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalField: {
    marginVertical: 8,
  },
  modalLabel: {
    fontSize: 14,
    color: COLORS.GRAY_DARK,
    marginBottom: 6,
    fontWeight: '600',
  },
  modalInput: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
    fontSize: 16,
    color: COLORS.BLACK,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancel: {
    backgroundColor: COLORS.GRAY_BG,
    marginRight: 10,
  },
  modalConfirm: {
    backgroundColor: COLORS.PURPLE,
    marginLeft: 10,
  },
  modalBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.BLACK,
  },
  modalConfirmText: {
    color: COLORS.WHITE,
  },
})

export default Ride