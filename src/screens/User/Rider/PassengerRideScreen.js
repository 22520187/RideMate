import React, { useState } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  FlatList,
  Dimensions
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import COLORS from '../../../constant/colors'
import LocationSearch from '../../../components/LocationSearch'
import RouteMap from '../../../components/RouteMap'
import { getCurrentLocation, reverseGeocode } from '../../../config/maps'
import { searchPlaces as osmSearchPlaces } from '../../../utils/api'

const PassengerRideScreen = ({ navigation }) => {
  const [fromLocation, setFromLocation] = useState('')
  const [toLocation, setToLocation] = useState('')
  const [originCoordinate, setOriginCoordinate] = useState(null)
  const [destinationCoordinate, setDestinationCoordinate] = useState(null)
  const [fromSuggestions, setFromSuggestions] = useState([])
  const [toSuggestions, setToSuggestions] = useState([])
  const [routePath, setRoutePath] = useState([])
  const [activeInput, setActiveInput] = useState(null) // 'from' or 'to'

  // Tính toán chiều rộng cho suggestions
  const screenWidth = Dimensions.get('window').width
  const suggestionsWidth = screenWidth - 30 - 80 // 30px padding, 80px cho button "Hiện tại"

  // Mock data cho demo
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
      toLocation: 'Sân bay'
    }
  ]

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
    setActiveInput('from')
    if (text.length <= 2) setFromSuggestions([])
  }

  const handleChangeToText = (text) => {
    setToLocation(text)
    setActiveInput('to')
    if (text.length <= 2) setToSuggestions([])
  }

  const handleLocationSelect = (location, type) => {
    if (type === 'from') {
      setFromLocation(location.description)
      setOriginCoordinate({
        latitude: location.latitude,
        longitude: location.longitude,
        description: location.description,
        placeId: location.placeId
      })
      setFromSuggestions([])
    } else {
      setToLocation(location.description)
      setDestinationCoordinate({
        latitude: location.latitude,
        longitude: location.longitude,
        description: location.description,
        placeId: location.placeId
      })
      setToSuggestions([])
    }
    setActiveInput(null)
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

  const handleSearchAsPassenger = () => {
    if (!fromLocation || !toLocation) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ điểm xuất phát và điểm đến')
      return
    }
    if (!originCoordinate || !destinationCoordinate) {
      Alert.alert('Lỗi', 'Vui lòng chọn địa điểm từ danh sách gợi ý')
      return
    }
    Alert.alert('Thành công', `Đang tìm kiếm chuyến đi từ ${fromLocation} đến ${toLocation}`)
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color={COLORS.BLACK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tìm chuyến đi</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>
      
      <View style={styles.contentArea}>
        <RouteMap
          origin={originCoordinate}
          destination={destinationCoordinate}
          height={Dimensions.get('window').height}
          showRoute={true}
          path={routePath}
          fullScreen={true}
        />

        <View style={styles.overlayContainer} pointerEvents="box-none">
          <View style={styles.topControls} pointerEvents="box-none">
            <View style={styles.inputContainerWrapper} pointerEvents="auto">
              <View style={styles.inputContainer}>
                <View style={styles.locationRow}>
                  <View style={styles.locationSearchWrapper}>
                    <LocationSearch
                      placeholder="Điểm xuất phát"
                      value={fromLocation}
                      onChangeText={handleChangeFromText}
                      onLocationSelect={(location) => handleLocationSelect(location, 'from')}
                      iconName="my-location"
                      containerWidth={suggestionsWidth}
                    />
                  </View>
                  <TouchableOpacity 
                    style={styles.currentLocationBtn}
                    onPress={() => handleGetCurrentLocation('from')}
                  >
                    <MaterialIcons name="my-location" size={16} color={COLORS.WHITE} />
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
                      iconName="place"
                      containerWidth="100%"
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.bottomControls}>
            <View style={styles.searchSection}>
              <TouchableOpacity 
                style={styles.searchBtn} 
                onPress={handleSearchAsPassenger}
              >
                <MaterialIcons name="search" size={20} color={COLORS.WHITE} />
                <Text style={styles.searchBtnText}>Tìm chuyến đi</Text>
              </TouchableOpacity>

              {/* <Text style={styles.listTitle}>
                {(fromLocation && toLocation) 
                  ? `Chuyến đi từ ${fromLocation} đến ${toLocation}`
                  : 'Các chuyến đi có sẵn'}
              </Text> */}
            </View>

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
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.ridesListContent}
            />
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  safeArea: {
    backgroundColor: COLORS.WHITE,
    zIndex: 1000,
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
    width: 39, 
  },
  contentArea: {
    flex: 1,
    position: 'relative',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    justifyContent: 'space-between',
  },
  topControls: {
    paddingHorizontal: 15,
    paddingTop: 10,
    zIndex: 3000,
  },
  bottomControls: {
    paddingHorizontal: 15,
    paddingBottom: 15,
    paddingTop: 10,
    maxHeight: '50%',
    backgroundColor: 'transparent',
  },
  searchSection: {
    marginBottom: 10,
  },
  inputContainerWrapper: {
    position: 'relative',
  },
  inputContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 15,
    elevation: 5,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  suggestionsContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 10,
    marginTop: 8,
    elevation: 20,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    maxHeight: 200,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  suggestionContent: {
    flex: 1,
    marginLeft: 8,
  },
  suggestionTitle: {
    fontSize: 13,
    color: COLORS.BLACK,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  locationRowTo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: 80,
  },
  locationSearchWrapper: {
    flex: 1,
  },
  currentLocationBtn: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    width: 72,
    justifyContent: 'center',
    marginTop: 5,
  },
  currentLocationText: {
    color: COLORS.WHITE,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  searchBtn: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    marginBottom: 10,
  },
  searchBtnText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  ridesListContent: {
    paddingBottom: 20,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.BLACK,
    marginBottom: 10,
    backgroundColor: COLORS.WHITE,
    padding: 10,
    borderRadius: 10,
    elevation: 3,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  rideCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
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
    marginBottom: 12,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.BLACK,
    marginBottom: 4,
  },
  driverRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 13,
    color: COLORS.BLACK,
    marginLeft: 5,
    fontWeight: '500',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  rideDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  carModel: {
    fontSize: 14,
    color: COLORS.BLACK,
    fontWeight: '500',
  },
  seatsInfo: {
    fontSize: 13,
    color: COLORS.BLUE,
    fontWeight: '500',
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  routeText: {
    fontSize: 13,
    color: COLORS.BLACK,
    marginLeft: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  timeText: {
    fontSize: 13,
    color: COLORS.BLUE,
    fontWeight: '600',
    marginLeft: 8,
  },
  joinBtn: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  joinBtnText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: 'bold',
  },
})

export default PassengerRideScreen

