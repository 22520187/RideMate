import React, { useState } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  FlatList,
  ScrollView
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import COLORS from '../../../constant/colors'
import LocationSearch from '../../../components/LocationSearch'
import RouteMap from '../../../components/RouteMap'
import { searchPlaces as osmSearchPlaces } from '../../../utils/api'

const PassengerRideScreen = ({ navigation }) => {
  const [toLocation, setToLocation] = useState('')
  const [originCoordinate, setOriginCoordinate] = useState(null)
  const [destinationCoordinate, setDestinationCoordinate] = useState(null)
  const [toSuggestions, setToSuggestions] = useState([])
  const [routePath, setRoutePath] = useState([])

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
      setToSuggestions(suggestions)
    } catch (error) {
      console.error('Error getting location suggestions:', error)
      setToSuggestions([])
    }
  }

  const handleChangeToText = (text) => {
    setToLocation(text)
    if (text.length <= 2) setToSuggestions([])
  }

  const handleLocationSelect = (location, type) => {
    setDestinationCoordinate(location)
    setToSuggestions([])
    setRoutePath([])
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

  return (
    <SafeAreaView style={styles.container}>
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
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.inputContainer}>
          <View style={styles.locationRow}>
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

        <TouchableOpacity style={styles.searchBtn} onPress={handleSearchAsPassenger}>
          <MaterialIcons name="search" size={20} color={COLORS.WHITE} />
          <Text style={styles.searchBtnText}>Tìm chuyến đi</Text>
        </TouchableOpacity>

        {toLocation && (
          <Text style={styles.listTitle}>Chuyến đi đến {toLocation}</Text>
        )}
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
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />
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
  },
  locationSearchWrapper: {
    flex: 1,
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
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.BLACK,
    marginBottom: 15,
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
  ratingText: {
    fontSize: 14,
    color: COLORS.BLACK,
    marginLeft: 5,
    fontWeight: '500',
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

export default PassengerRideScreen

