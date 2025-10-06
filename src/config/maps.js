// Map configuration và API keys
import { GOOGLE_MAPS_API_KEY } from '@env'
import * as Location from 'expo-location'

export const checkApiKeyStatus = () => {
  const apiKey = GOOGLE_MAPS_API_KEY
  const isValid = apiKey && apiKey !== 'YOUR_API_KEY_HERE' && apiKey.length > 10
  
  console.log('🔍 API Key Status Check:')
  console.log('  - Key exists:', !!apiKey)
  console.log('  - Key length:', apiKey ? apiKey.length : 0)
  console.log('  - Is default value:', apiKey === 'YOUR_API_KEY_HERE')
  console.log('  - Is empty:', apiKey === '')
  console.log('  - Is valid:', isValid)
  
  if (!isValid) {
    console.log('API Key không hợp lệ!')
  } else {
    console.log('API Key hợp lệ!')
  }
  
  return isValid
}

checkApiKeyStatus()

export const MAPS_CONFIG = {
  GOOGLE_MAPS_API_KEY: GOOGLE_MAPS_API_KEY || '',
  
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

// Google Places API functions
export const searchPlaces = async (query, apiKey) => {
  try {
    // Kiểm tra API key chi tiết hơn
    if (!apiKey || apiKey === '' || apiKey === 'YOUR_API_KEY_HERE' || apiKey.length < 10) {
      console.warn('⚠️ Google Places API key not configured properly, using fallback data')
      console.warn('📝 API Key status:', {
        exists: !!apiKey,
        length: apiKey ? apiKey.length : 0,
        isDefault: apiKey === 'YOUR_API_KEY_HERE',
        isEmpty: apiKey === ''
      })
      return getFallbackPlaces(query)
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}&region=vn&language=vi`
    )
    
    const data = await response.json()
    
    if (data.status === 'OK' && data.results) {
      return data.results.map(place => ({
        description: place.formatted_address,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        placeId: place.place_id,
        name: place.name
      }))
    } else {
      console.warn('Places API error:', data.status, data.error_message)
      return getFallbackPlaces(query)
    }
  } catch (error) {
    console.error('Error calling Places API:', error)
    return getFallbackPlaces(query)
  }
}

// Fallback places data khi không có API key
const getFallbackPlaces = (query) => {
  const popularPlaces = [
    { description: 'Trường Đại học Bách Khoa TP.HCM - Đông Hoà', latitude: 10.7730765, longitude: 106.6583347 },
    { description: 'Vincom Plaza Nguyễn Huệ - Quận 1', latitude: 10.7823347, longitude: 106.7012347 },
    { description: 'Sân bay Tân Sơn Nhất - Tân Bình', latitude: 10.818181818, longitude: 106.6591919 },
    { description: 'Chợ Bến Thành - Quận 1', latitude: 10.7728888, longitude: 106.7000000 },
    { description: 'Nhà ga Sài Gòn - Quận 3', latitude: 10.7500000, longitude: 106.6500000 },
    { description: 'Landmark 81 - Bình Thạnh', latitude: 10.7947, longitude: 106.7222 },
    { description: 'Crescent Mall - Quận 7', latitude: 10.7324, longitude: 106.7208 },
    { description: 'Diamond Plaza - Quận 1', latitude: 10.7778, longitude: 106.7008 },
    { description: 'Saigon Centre - Quận 1', latitude: 10.7778, longitude: 106.7008 },
    { description: 'Takashimaya Vietnam - Quận 1', latitude: 10.7778, longitude: 106.7008 }
  ]

  const filteredPlaces = popularPlaces.filter(place => 
    place.description.toLowerCase().includes(query.toLowerCase())
  )

  if (filteredPlaces.length === 0) {
    return [
      { 
        description: `${query} - Quận 1, HCM`, 
        latitude: 10.7730765 + (Math.random() - 0.5) * 0.02, 
        longitude: 106.6583347 + (Math.random() - 0.5) * 0.02 
      },
      { 
        description: `${query} - Quận 3, HCM`, 
        latitude: 10.7830765 + (Math.random() - 0.5) * 0.02, 
        longitude: 106.6683347 + (Math.random() - 0.5) * 0.02 
      },
      { 
        description: `${query} - Quận 5, HCM`, 
        latitude: 10.7530765 + (Math.random() - 0.5) * 0.02, 
        longitude: 106.6383347 + (Math.random() - 0.5) * 0.02 
      },
    ]
  }

  return filteredPlaces.slice(0, 3)
}

// Google Directions API function
export const getDirections = async (origin, destination, apiKey) => {
  try {
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      console.warn('Google Directions API key not configured, using fallback calculation')
      return getFallbackDirections(origin, destination)
    }

    const originStr = `${origin.latitude},${origin.longitude}`
    const destinationStr = `${destination.latitude},${destination.longitude}`
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&key=${apiKey}&language=vi&region=vn`
    )
    
    const data = await response.json()
    
    if (data.status === 'OK' && data.routes && data.routes.length > 0) {
      const route = data.routes[0]
      const leg = route.legs[0]
      
      return {
        distance: leg.distance.text,
        duration: leg.duration.text,
        distanceValue: leg.distance.value, // in meters
        durationValue: leg.duration.value, // in seconds
        polyline: route.overview_polyline.points
      }
    } else {
      console.warn('Directions API error:', data.status, data.error_message)
      return getFallbackDirections(origin, destination)
    }
  } catch (error) {
    console.error('Error calling Directions API:', error)
    return getFallbackDirections(origin, destination)
  }
}

// Fallback directions calculation
const getFallbackDirections = (origin, destination) => {
  const distance = calculateDistance(
    origin.latitude, 
    origin.longitude,
    destination.latitude, 
    destination.longitude
  )
  
  const duration = Math.round(distance * 2.5) // 2.5 minutes per km
  
  return {
    distance: `${distance.toFixed(1)} km`,
    duration: `${duration} phút`,
    distanceValue: distance * 1000, // convert to meters
    durationValue: duration * 60 // convert to seconds
  }
}