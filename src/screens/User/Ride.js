import React, { useState, useEffect } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  FlatList,
  Modal,
  Dimensions
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import COLORS from '../../constant/colors'
import LocationSearch from '../../components/LocationSearch'
import RouteMap from '../../components/RouteMap'
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
    <View style={styles.content}>
      {/* Input địa điểm */}
      <View style={styles.inputContainer}>
        <View style={styles.locationRow}>
          <View style={styles.locationSearchWrapper}>
            <LocationSearch
              placeholder="Điểm xuất phát"
              value={fromLocation}
              onChangeText={setFromLocation}
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
              onChangeText={setToLocation}
              onLocationSelect={(location) => handleLocationSelect(location, 'to')}
              suggestions={toSuggestions}
              showSuggestions={toLocation.length > 2}
              onRequestSuggestions={(query) => handleLocationSuggestions(query, 'to')}
              iconName="place"
            />
          </View>
          {/* <TouchableOpacity 
            style={styles.currentLocationBtn}
            onPress={() => handleGetCurrentLocation('to')}
          > */}
            {/* <MaterialIcons name="my-location" size={20} color={COLORS.WHITE} />
            <Text style={styles.currentLocationText}>Hiện tại</Text> */}
          {/* </TouchableOpacity> */}
        </View>
      </View>

      {/* Bản đồ */}
      <RouteMap
        origin={originCoordinate}
        destination={destinationCoordinate}
        height={250}
        showRoute={true}
      />

      

      {/* Thông tin tuyến đường */}
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

      {/* Nút tìm kiếm */}
      <TouchableOpacity 
        style={[styles.searchBtn, isLoadingDirections && styles.searchBtnDisabled]} 
        onPress={handleSearchAsDriver}
        disabled={isLoadingDirections}
      >
        <MaterialIcons 
          name={isLoadingDirections ? "hourglass-empty" : "search"} 
          size={20} 
          color={COLORS.WHITE} 
        />
        <Text style={styles.searchBtnText}>
          {isLoadingDirections ? 'Đang tìm kiếm...' : 'Tìm người đi cùng'}
        </Text>
      </TouchableOpacity>

      {/* Danh sách người không có xe */}
      <Text style={styles.listTitle}>Người cần đi từ {fromLocation} đến {toLocation}</Text>
    </View>
  )

  const renderPassengerInterface = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Tôi không có xe</Text>
      
      {/* Input điểm đến */}
      <View style={styles.inputContainer}>
        <View style={styles.locationRow}>
          <View style={styles.locationSearchWrapper}>
            <LocationSearch
              placeholder="Điểm đến"
              value={toLocation}
              onChangeText={setToLocation}
              onLocationSelect={(location) => handleLocationSelect(location, 'to')}
              suggestions={toSuggestions}
              showSuggestions={toLocation.length > 2}
              onRequestSuggestions={(query) => handleLocationSuggestions(query, 'to')}
              iconName="place"
            />
          </View>
          <TouchableOpacity 
            style={styles.currentLocationBtn}
            onPress={() => handleGetCurrentLocation('to')}
          >
            <MaterialIcons name="my-location" size={20} color={COLORS.WHITE} />
            <Text style={styles.currentLocationText}>Hiện tại</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Nút tìm kiếm */}
      <TouchableOpacity style={styles.searchBtn} onPress={handleSearchAsPassenger}>
        <MaterialIcons name="search" size={20} color={COLORS.WHITE} />
        <Text style={styles.searchBtnText}>Tìm chuyến đi</Text>
      </TouchableOpacity>

      {/* Danh sách chuyến đi */}
      <Text style={styles.listTitle}>Chuyến đi đến {toLocation}</Text>
      <FlatList
        data={availableRides}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.rideCard}>
            <View style={styles.rideHeader}>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{item.driverName}</Text>
                <View style={styles.driverRating}>
                  <MaterialIcons name="star" size={16} color={COLORS.ORANGE_DARK} />
                  <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
              </View>
              <Text style={styles.price}>{item.price}</Text>
            </View>
            
            <View style={styles.rideDetails}>
              <Text style={styles.carModel}>{item.carModel}</Text>
              <Text style={styles.seatsInfo}>Còn {item.availableSeats} chỗ trống</Text>
            </View>
            
            <View style={styles.routeInfo}>
              <MaterialIcons name="radio-button-checked" size={16} color={COLORS.GREEN} />
              <Text style={styles.routeText}>{item.fromLocation}</Text>
            </View>
            <View style={styles.routeInfo}>
              <MaterialIcons name="place" size={16} color={COLORS.RED} />
              <Text style={styles.routeText}>{item.toLocation}</Text>
            </View>
            
            <View style={styles.timeContainer}>
              <MaterialIcons name="access-time" size={16} color={COLORS.BLUE} />
              <Text style={styles.timeText}>Khởi hành lúc {item.departureTime}</Text>
            </View>
            
            <TouchableOpacity style={styles.joinBtn}>
              <Text style={styles.joinBtnText}>Tham gia chuyến đi</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        keyExtractor={item => item.id.toString()}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
        <View style={styles.headerSpacer} />
      </View>
      
      {userMode === 'driver' ? renderDriverInterface() : renderPassengerInterface()}
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
  headerSpacer: {
    width: 39, // Same width as backBtn + marginRight
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
})

export default Ride