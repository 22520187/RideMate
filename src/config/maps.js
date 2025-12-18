// Map configuration và API keys
import * as Location from "expo-location";

export const MAPS_CONFIG = {
  DEFAULT_REGION: {
    latitude: 10.7730765,
    longitude: 106.6583347,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  },

  MAP_STYLE: {
    mapType: "standard", // 'satellite', 'hybrid', 'terrain'
    showsUserLocation: true,
    showsTraffic: false,
    showsBuildings: true,
    showsIndoorLevelPicker: true,
  },

  ROUTE_SETTINGS: {
    strokeWidth: 4,
    strokeColor: "#8B5CF6", // Purple
    mode: "DRIVING", // 'WALKING', 'BICYCLING', 'TRANSIT', 'DRIVING'
  },

  // Mock data for demo - Trong thực tế sẽ được fetch từ API
  MOCK_LOCATIONS: [
    {
      description: "Trường Đại học Bách Khoa TP.HCM - Đông Hoà",
      latitude: 10.7730765,
      longitude: 106.6583347,
    },
    {
      description: "Vincom Plaza Nguyễn Huệ - Quận 1",
      latitude: 10.7823347,
      longitude: 106.7012347,
    },
    {
      description: "Sân bay Tân Sơn Nhất - Tân Bình",
      latitude: 10.818181818,
      longitude: 106.6591919,
    },
    {
      description: "Chợ Bến Thành - Quận 1",
      latitude: 10.7728888,
      longitude: 106.7,
    },
    {
      description: "Nhà ga Sài Gòn - Quận 3",
      latitude: 10.75,
      longitude: 106.65,
    },
  ],
};

// Helper functions for map operations
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const formatPrice = (distance, basePrice = 15000) => {
  const pricePerKm = 3000; // 3000đ/km
  const totalPrice = basePrice + distance * pricePerKm;
  return `${totalPrice.toLocaleString("vi-VN")}đ`;
};

export const formatDuration = (seconds) => {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} phút`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}p`;
  }
};

// Location services
export const requestLocationPermission = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Location permission not granted");
    }
    return true;
  } catch (error) {
    console.error("Error requesting location permission:", error);
    return false;
  }
};

export const getCurrentLocation = async () => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      throw new Error("Location permission denied");
    }

    // 🚀 Tối ưu: Sử dụng Low accuracy để lấy nhanh hơn
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Low, // Thay đổi từ High sang Low
      maximumAge: 10000, // Cache 10 giây
      timeout: 5000, // Timeout 5 giây
    });

    const { latitude, longitude } = location.coords;

    // Lấy địa chỉ thực tế thay vì "Vị trí hiện tại"
    let description = "Vị trí hiện tại";
    try {
      description = await reverseGeocode(latitude, longitude);
    } catch (error) {
      console.warn("Reverse geocode failed, using default description");
    }

    return {
      latitude,
      longitude,
      description,
    };
  } catch (error) {
    console.error("Error getting current location:", error);
    throw error;
  }
};

export const reverseGeocode = async (latitude, longitude) => {
  try {
    const reverseGeocoded = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (reverseGeocoded.length > 0) {
      const location = reverseGeocoded[0];
      let address = [];

      // 🎯 Cải thiện: Thêm địa chỉ theo thứ tự hợp lý hơn
      // Số nhà + Tên đường
      if (location.streetNumber) address.push(location.streetNumber);
      if (location.street) address.push(location.street);

      // Nếu không có street, dùng name
      if (!location.street && location.name) address.push(location.name);

      // Quận/Huyện
      if (location.district || location.subregion) {
        address.push(location.district || location.subregion);
      }

      // Thành phố
      if (location.city) address.push(location.city);

      const fullAddress = address.join(", ");
      return fullAddress || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }

    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
};
