import React from 'react'
import { View, Text, TouchableOpacity, FlatList } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import LocationSearch from '../../../components/LocationSearch'
import RouteMap from '../../../components/RouteMap'
import COLORS from '../../../constant/colors'

const PassengerRide = ({
  styles,
  toLocation,
  toSuggestions,
  originCoordinate,
  destinationCoordinate,
  routePath = [],
  availableRides,
  onLocationSelect,
  onRequestSuggestions,
  onSearch,
  onChangeToText
}) => {
  return (
    <View style={styles.content}>
      <View style={styles.inputContainer}>
        <View style={styles.locationRow}>
          <View style={styles.locationSearchWrapper}>
            <LocationSearch
              placeholder="Điểm đến"
              value={toLocation}
            onChangeText={onChangeToText}
              onLocationSelect={(location) => onLocationSelect(location, 'to')}
              suggestions={toSuggestions}
              showSuggestions={toLocation.length > 2}
              onRequestSuggestions={(query) => onRequestSuggestions(query, 'to')}
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

      <TouchableOpacity style={styles.searchBtn} onPress={onSearch}>
        <MaterialIcons name="search" size={20} color={COLORS.WHITE} />
        <Text style={styles.searchBtnText}>Tìm chuyến đi</Text>
      </TouchableOpacity>

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
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

export default PassengerRide


