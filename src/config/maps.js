// Map configuration và API keys
import * as Location from 'expo-location'

export const MAPS_CONFIG = {
  DEFAULT_REGION: {
    latitude: 10.7730765,
    longitude: 106.6583347,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  },
  
  MAP_STYLE: {
    mapType: 'standard', // 'satellite', 'hybrid', 'terrain'
    showsUserLocation: true,
    showsTraffic: false,
    showsBuildings: true,
    showsIndoorLevelPicker: true,
  },
  
  ROUTE_SETTINGS: {
    strokeWidth: 4,
    strokeColor: '#8B5CF6', // Purple
    mode: 'DRIVING', // 'WALKING', 'BICYCLING', 'TRANSIT', 'DRIVING'
  },
  
  // Mock data for demo - Trong thực tế sẽ được fetch từ API
  MOCK_LOCATIONS: [
    {
      description: 'Trường Đại học Bách Khoa TP.HCM - Đông Hoà',
      latitude: 10.7730765,
      longitude: 106.6583347,
    },
    {
      description: 'Vincom Plaza Nguyễn Huệ - Quận 1',
      latitude: 10.7823347,
      longitude: 106.7012347,
    },
    {
      description: 'Sân bay Tân Sơn Nhất - Tân Bình',
      latitude: 10.818181818,
      longitude: 106.6591919,
    },
    {
      description: 'Chợ Bến Thành - Quận 1',
      latitude: 10.7728888,
      longitude: 106.7000000,
    },
    {
      description: 'Nhà ga Sài Gòn - Quận 3',
      latitude: 10.7500000,
      longitude: 106.6500000,
    },
  ],
}

// Helper functions for map operations
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export const formatPrice = (distance, basePrice = 15000) => {
  const pricePerKm = 3000 // 3000đ/km
  const totalPrice = basePrice + (distance * pricePerKm)
  return `${totalPrice.toLocaleString('vi-VN')}đ`
}

export const formatDuration = (seconds) => {
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) {
    return `${minutes} phút`
  } else {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}p`
  }
}

// Location services
export const requestLocationPermission = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      throw new Error('Location permission not granted')
    }
    return true
  } catch (error) {
    console.error('Error requesting location permission:', error)
    return false
  }
}

export const getCurrentLocation = async () => {
  try {
    const hasPermission = await requestLocationPermission()
    if (!hasPermission) {
      throw new Error('Location permission denied')
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    })

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      description: 'Vị trí hiện tại',
    }
  } catch (error) {
    console.error('Error getting current location:', error)
    throw error
  }
}

export const reverseGeocode = async (latitude, longitude) => {
  try {
    const reverseGeocoded = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    })

    if (reverseGeocoded.length > 0) {
      const location = reverseGeocoded[0]
      let address = []
      
      if (location.name) address.push(location.name)
      if (location.streetNumber) address.push(location.streetNumber)
      if (location.street) address.push(location.street)
      if (location.district) address.push(location.district)
      if (location.city) address.push(location.city)

      return address.join(', ') || 'Vị trí hiện tại'
    }
    
    return 'Vị trí hiện tại'
  } catch (error) {
    console.error('Error reverse geocoding:', error)
    return 'Vị trí hiện tại'
  }
}
