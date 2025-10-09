import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import LocationSearch from '../../../components/LocationSearch'
import RouteMap from '../../../components/RouteMap'
import COLORS from '../../../constant/colors'

const DriverRide = ({
  styles,
  fromLocation,
  toLocation,
  fromSuggestions,
  toSuggestions,
  originCoordinate,
  destinationCoordinate,
  routeInfo,
  isLoadingDirections,
  onLocationSelect,
  onRequestSuggestions,
  onGetCurrentLocation,
  onSearch
}) => {
  return (
    <View style={styles.content}>
      <View style={styles.inputContainer}>
        <View style={styles.locationRow}>
          <View style={styles.locationSearchWrapper}>
            <LocationSearch
              placeholder="Điểm xuất phát"
              value={fromLocation}
              onChangeText={() => {}}
              onLocationSelect={(location) => onLocationSelect(location, 'from')}
              suggestions={fromSuggestions}
              showSuggestions={fromLocation.length > 2}
              onRequestSuggestions={(query) => onRequestSuggestions(query, 'from')}
              iconName="my-location"
            />
          </View>
          <TouchableOpacity 
            style={styles.currentLocationBtn}
            onPress={() => onGetCurrentLocation('from')}
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
              onChangeText={() => {}}
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
        onPress={onSearch}
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

      <Text style={styles.listTitle}>Người cần đi từ {fromLocation} đến {toLocation}</Text>
    </View>
  )
}

export default DriverRide


