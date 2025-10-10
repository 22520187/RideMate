// Gọi API Nominatim để tìm địa điểm
export async function searchPlaces(query) {
  console.log('🔍 Searching for:', query);
  
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&countrycodes=VN&q=${encodeURIComponent(query)}`;
    console.log('📡 Fetching URL:', url);
    
    const res = await fetch(url, {
      headers: { "User-Agent": "ExpoOSMApp/1.0 (example@example.com)" },
    });
    
    console.log('✅ Response status:', res.status);
    const data = await res.json();
    console.log('📦 Data received:', data.length, 'results');
    
    return data;
  } catch (e) {
    console.error("❌ Search error", e);
    console.log('🔄 Using fallback data');
    
    // Fallback data - trả về dữ liệu mẫu khi API fail
    return getFallbackPlaces(query);
  }
}

// Fallback places data khi không có kết nối API
function getFallbackPlaces(query) {
  const q = String(query || '').trim().toLowerCase();
  const popularPlaces = [
    { 
      display_name: 'Trường Đại học Bách Khoa TP.HCM - Đông Hoà, Dĩ An, Bình Dương, Việt Nam',
      lat: '10.7730765',
      lon: '106.6583347',
      place_id: '1'
    },
    { 
      display_name: 'Vincom Plaza Nguyễn Huệ - Quận 1, TP.HCM, Việt Nam',
      lat: '10.7823347',
      lon: '106.7012347',
      place_id: '2'
    },
    { 
      display_name: 'Sân bay Tân Sơn Nhất - Tân Bình, TP.HCM, Việt Nam',
      lat: '10.8181818',
      lon: '106.6591919',
      place_id: '3'
    },
    { 
      display_name: 'Chợ Bến Thành - Quận 1, TP.HCM, Việt Nam',
      lat: '10.7728888',
      lon: '106.7000000',
      place_id: '4'
    },
    { 
      display_name: 'Nhà ga Sài Gòn - Quận 3, TP.HCM, Việt Nam',
      lat: '10.7500000',
      lon: '106.6500000',
      place_id: '5'
    },
    { 
      display_name: 'Landmark 81 - Bình Thạnh, TP.HCM, Việt Nam',
      lat: '10.7947',
      lon: '106.7222',
      place_id: '6'
    },
    { 
      display_name: 'Crescent Mall - Quận 7, TP.HCM, Việt Nam',
      lat: '10.7324',
      lon: '106.7208',
      place_id: '7'
    },
  ];

  // Lọc theo query
  const filtered = popularPlaces.filter(place => 
    place.display_name.toLowerCase().includes(q)
  );

  // Nếu không tìm thấy, trả về tất cả
  return filtered.length > 0 ? filtered : popularPlaces;
}

// Gọi API OSRM để vẽ đường đi
export async function getRoute(from, to) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.routes || !data.routes[0]) return [];
    return data.routes[0].geometry.coordinates.map(([lon, lat]) => ({
      latitude: lat,
      longitude: lon,
    }));
  } catch (e) {
    console.error("Route error", e);
    return [];
  }
}
