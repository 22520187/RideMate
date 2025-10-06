import React, { useState, useEffect } from 'react'
import { View, StyleSheet, Alert } from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import MapViewDirections from 'react-native-maps-directions'
import { MAPS_CONFIG } from '../config/maps'
import COLORS from '../constant/colors'

const RouteMap = ({ 
  origin = null, 
  destination = null, 
  height = 200,
  showRoute = true,
  markers = []
}) => {
  const [region, setRegion] = useState(MAPS_CONFIG.DEFAULT_REGION)

  useEffect(() => {
    if (origin && destination) {
      // Calculate center point between origin and destination
      const centerLat = (origin.latitude + destination.latitude) / 2
      const centerLng = (origin.longitude + destination.longitude) / 2
      
      // Calculate distance between points to adjust zoom level
      const latDelta = Math.abs(origin.latitude - destination.latitude) * 2
      const lngDelta = Math.abs(origin.longitude - destination.longitude) * 2
      
      setRegion({
        latitude: centerLat,
        longitude: centerLng,
        latitudeDelta: Math.max(latDelta, 0.01),
        longitudeDelta: Math.max(lngDelta, 0.01),
      })
    }
  }, [origin, destination])

  const getGoogleMapsApiKey = () => {
    return MAPS_CONFIG.GOOGLE_MAPS_API_KEY || ''
  }

  const handleDirectionsError = (errorMessage) => {
    console.log('Directions error:', errorMessage)
    if (errorMessage.includes('API key') || errorMessage.includes('Missing API Key')) {
      console.warn('MapViewDirections Error: Missing API Key. Please add GOOGLE_MAPS_API_KEY to .env file')
      return
    }
  }

  const renderMarkers = () => {
    const allMarkers = [...markers]
    
    if (origin) {
      allMarkers.push({
        ...origin,
        id: 'origin',
        title: 'Điểm xuất phát',
        description: origin.description || 'Điểm xuất phát'
      })
    }
    
    if (destination) {
      allMarkers.push({
        ...destination,
        id: 'destination',
        title: 'Điểm đến',
        description: destination.description || 'Điểm đến'
      })
    }

    return allMarkers.map(marker => (
      <Marker
        key={marker.id}
        coordinate={{
          latitude: marker.latitude,
          longitude: marker.longitude,
        }}
        title={marker.title}
        description={marker.description}
        pinColor={marker.id === 'origin' ? COLORS.GREEN : marker.id === 'destination' ? COLORS.RED : COLORS.PURPLE}
      />
    ))
  }

  return (
    <View style={[styles.mapContainer, { height }]}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        region={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
      >
        {showRoute && origin && destination && getGoogleMapsApiKey() && (
          <MapViewDirections
            origin={origin}
            destination={destination}
            apikey={getGoogleMapsApiKey()}
            strokeWidth={MAPS_CONFIG.ROUTE_SETTINGS.strokeWidth}
            strokeColor={MAPS_CONFIG.ROUTE_SETTINGS.strokeColor}
            mode={MAPS_CONFIG.ROUTE_SETTINGS.mode}
            onReady={(result) => {
              console.log('Route ready:', result.distance, result.duration)
              // Có thể update UI với thông tin về khoảng cách và thời gian
            }}
            onError={handleDirectionsError}
          />
        )}
        
        {renderMarkers()}
      </MapView>
    </View>
  )
}

const styles = StyleSheet.create({
  mapContainer: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  map: {
    flex: 1,
  },
})

export default RouteMap
