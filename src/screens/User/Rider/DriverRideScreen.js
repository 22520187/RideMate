import React, { useState } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  Dimensions,
  TextInput,
  Modal,
  FlatList,
  ScrollView
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import COLORS from '../../../constant/colors'
import LocationSearch from '../../../components/LocationSearch'
import RouteMap from '../../../components/RouteMap'
import { getCurrentLocation, reverseGeocode } from '../../../config/maps'
import { searchPlaces as osmSearchPlaces, getRoute as osrmGetRoute } from '../../../utils/api'

const DriverRideScreen = ({ navigation }) => {
  const [fromLocation, setFromLocation] = useState('')
  const [toLocation, setToLocation] = useState('')
  const [originCoordinate, setOriginCoordinate] = useState(null)
  const [destinationCoordinate, setDestinationCoordinate] = useState(null)
  const [fromSuggestions, setFromSuggestions] = useState([])
  const [toSuggestions, setToSuggestions] = useState([])
  const [routeInfo, setRouteInfo] = useState(null)
  const [routePath, setRoutePath] = useState([])
  const [isLoadingDirections, setIsLoadingDirections] = useState(false)
  const [isScheduleModalVisible, setIsScheduleModalVisible] = useState(false)
  const [scheduleTime, setScheduleTime] = useState('')
  const [scheduleFromText, setScheduleFromText] = useState('')
  const [scheduleToText, setScheduleToText] = useState('')
  const [scheduleFromSuggestions, setScheduleFromSuggestions] = useState([])
  const [scheduleToSuggestions, setScheduleToSuggestions] = useState([])
  const [scheduleOriginCoordinate, setScheduleOriginCoordinate] = useState(null)
  const [scheduleDestinationCoordinate, setScheduleDestinationCoordinate] = useState(null)
  const [scheduledRide, setScheduledRide] = useState(null)

  const calculatePrice = (distanceKm) => {
    const basePrice = 15000
    const pricePerKm = 3000
    return Math.round(basePrice + distanceKm * pricePerKm)
  }

  const searchPlacesAPI = async (query) => {
    try {
      const places = await osmSearchPlaces(query)
      return places.map(p => ({
        description: p.display_name || p.name,
        latitude: parseFloat(p.lat),
        longitude: parseFloat(p.lon)
      }))
    } catch (error) {
      console.error('Error searching places:', error)
      return []
    }
  }

  const handleLocationSuggestions = async (query, type) => {
    if (query.length < 3) return
    
    try {
      const suggestions = await searchPlacesAPI(query)
      if (type === 'from') {
        setFromSuggestions(suggestions)
      } else {
        setToSuggestions(suggestions)
      }
    } catch (error) {
      console.error('Error getting location suggestions:', error)
      if (type === 'from') {
        setFromSuggestions([])
      } else {
        setToSuggestions([])
      }
    }
  }

  const handleChangeFromText = (text) => {
    setFromLocation(text)
    if (text.length <= 2) setFromSuggestions([])
  }

  const handleChangeToText = (text) => {
    setToLocation(text)
    if (text.length <= 2) setToSuggestions([])
  }

  const handleScheduleSuggestions = async (query, type) => {
    if (query.length < 3) return
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
    setRoutePath([])
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
      const path = await osrmGetRoute(originCoordinate, destinationCoordinate)
      setRoutePath(path)

      let distanceKm = 0
      for (let i = 1; i < path.length; i++) {
        const a = path[i - 1]
        const b = path[i]
        const dLat = (b.latitude - a.latitude) * Math.PI / 180
        const dLon = (b.longitude - a.longitude) * Math.PI / 180
        const lat1 = a.latitude * Math.PI / 180
        const lat2 = b.latitude * Math.PI / 180
        const sinDLat = Math.sin(dLat / 2)
        const sinDLon = Math.sin(dLon / 2)
        const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon
        const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
        distanceKm += 6371 * c
      }
      const durationMinutes = Math.round(distanceKm * 2.5)
      const price = calculatePrice(distanceKm)

      setRouteInfo({
        distance: `${distanceKm.toFixed(1)} km`,
        duration: `${durationMinutes} phút`,
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.BLACK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo chuyến đi</Text>
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
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.inputContainer}>
          <View style={styles.locationRow}>
            <View style={styles.locationSearchWrapper}>
              <LocationSearch
                placeholder="Điểm xuất phát"
                value={fromLocation}
                onChangeText={handleChangeFromText}
                onLocationSelect={(location) => handleLocationSelect(location, 'from')}
                suggestions={fromSuggestions}
                showSuggestions={fromLocation.length > 2}
                onRequestSuggestions={(query) => handleLocationSuggestions(query, 'from')}
                iconName="my-location"
              />
            </View>
            <TouchableOpacity 
              style={styles.currentLocationBtn}
              onPress={() => handleGetCurrentLocation('from')}
            >
              <MaterialIcons name="my-location" size={20} color={COLORS.WHITE} />
              <Text style={styles.currentLocationText}>Hiện tại</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.locationRowTo}>
            <View style={styles.locationSearchWrapper}>
              <LocationSearch
                placeholder="Điểm đến"
                value={toLocation}
                onChangeText={handleChangeToText}
                onLocationSelect={(location) => handleLocationSelect(location, 'to')}
                suggestions={toSuggestions}
                showSuggestions={toLocation.length > 2}
                onRequestSuggestions={(query) => handleLocationSuggestions(query, 'to')}
                iconName="place"
              />
            </View>
          </View>
        </View>

        <RouteMap
          origin={originCoordinate}
          destination={destinationCoordinate}
          height={250}
          showRoute={true}
          path={routePath}
        />

        {routeInfo && (
          <View style={styles.routeInfoContainer}>
            <Text style={styles.routeInfoTitle}>Thông tin tuyến đường</Text>
            <View style={styles.routeInfoRow}>
              <View style={styles.routeInfoItem}>
                <MaterialIcons name="directions-car" size={16} color={COLORS.PURPLE} />
                <Text style={styles.routeInfoText}>{routeInfo.distance}</Text>
              </View>
              <View style={styles.routeInfoItem}>
                <MaterialIcons name="access-time" size={16} color={COLORS.BLUE} />
                <Text style={styles.routeInfoText}>{routeInfo.duration}</Text>
              </View>
              <View style={styles.routeInfoItem}>
                <MaterialIcons name="attach-money" size={16} color={COLORS.GREEN} />
                <Text style={styles.routeInfoText}>{routeInfo.price}</Text>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.searchBtn, isLoadingDirections && styles.searchBtnDisabled]} 
          onPress={handleSearchAsDriver}
          disabled={isLoadingDirections}
        >
          <MaterialIcons 
            name={isLoadingDirections ? 'hourglass-empty' : 'search'} 
            size={20} 
            color={COLORS.WHITE} 
          />
          <Text style={styles.searchBtnText}>
            {isLoadingDirections ? 'Đang tìm kiếm...' : 'Tìm người đi cùng'}
          </Text>
        </TouchableOpacity>

        {fromLocation && toLocation && (
          <Text style={styles.listTitle}>Người cần đi từ {fromLocation} đến {toLocation}</Text>
        )}
      </ScrollView>

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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
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
    zIndex: 2500,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  locationRowTo: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginTop: 20,
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
  searchBtnText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  searchBtnDisabled: {
    backgroundColor: COLORS.GRAY,
    opacity: 0.7,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.BLACK,
    marginBottom: 15,
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

export default DriverRideScreen

