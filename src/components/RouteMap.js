import React, { useState, useEffect } from 'react'
import { View, StyleSheet, Alert } from 'react-native'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import { MAPS_CONFIG } from '../config/maps'
import COLORS from '../constant/colors'

const RouteMap = ({ 
  origin = null, 
  destination = null, 
  height = 200,
  showRoute = true,
  markers = [],
  path = []
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
        pointerEvents="auto"
        collapsable={false}
      >
        {showRoute && path && path.length > 1 && (
          <Polyline
            coordinates={path}
            strokeWidth={MAPS_CONFIG.ROUTE_SETTINGS.strokeWidth}
            strokeColor={MAPS_CONFIG.ROUTE_SETTINGS.strokeColor}
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
    elevation: 1,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 0,
  },
  map: {
    flex: 1,
  },
})

export default RouteMap
