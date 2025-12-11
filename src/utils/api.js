// Gọi API Nominatim để tìm địa điểm
export async function searchPlaces(query) {
  console.log('Searching for:', query);
  
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&countrycodes=VN&q=${encodeURIComponent(query)}`;
    console.log('📡 Fetching URL:', url);
    
    const res = await fetch(url, {
      headers: { 
        "User-Agent": "RideMateApp/1.0 (contact@ridemate.com)",
        "Accept": "application/json",
        "Accept-Language": "vi-VN,vi;q=0.9"
      },
    });
    
    console.log('Response status:', res.status);
    
    // Kiểm tra status code trước khi parse JSON
    if (!res.ok) {
      const errorText = await res.text();
      console.error('API Error:', res.status, errorText.substring(0, 200));
      console.log('Using fallback data due to API error');
      return getFallbackPlaces(query);
    }
    
    // Kiểm tra content-type để đảm bảo là JSON
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Invalid content-type:', contentType);
      console.log('Using fallback data');
      return getFallbackPlaces(query);
    }
    
    const data = await res.json();
    
    // Kiểm tra nếu data không phải là array
    if (!Array.isArray(data)) {
      console.error('Invalid response format:', typeof data);
      console.log('Using fallback data');
      return getFallbackPlaces(query);
    }
    
    console.log('Data received:', data.length, 'results');
    
    // Nếu không có kết quả, trả về fallback
    if (data.length === 0) {
      console.log('No results found, using fallback');
      return getFallbackPlaces(query);
    }
    
    return data;
  } catch (e) {
    console.error("Search error", e);
    console.log('Using fallback data');
    
    // Fallback data - trả về dữ liệu mẫu khi API fail
    return getFallbackPlaces(query);
  }
}

// Fallback places data khi không có kết nối API
function getFallbackPlaces(query) {
  const q = String(query || '').trim().toLowerCase();
  const popularPlaces = [
    { 
      display_name: 'Đại học Công nghệ Thông tin - ĐHQG TP.HCM, Linh Trung, Thủ Đức, TP.HCM, Việt Nam',
      lat: '10.8700',
      lon: '106.8033',
      place_id: 'uit-1'
    },
    { 
      display_name: 'Trường Đại học Bách Khoa TP.HCM - Đông Hoà, Dĩ An, Bình Dương, Việt Nam',
      lat: '10.7730765',
      lon: '106.6583347',
      place_id: 'bkhcm-1'
    },
    { 
      display_name: 'Đại học Quốc gia TP.HCM - Linh Trung, Thủ Đức, TP.HCM, Việt Nam',
      lat: '10.8700',
      lon: '106.8033',
      place_id: 'vnu-1'
    },
    { 
      display_name: 'Vincom Plaza Nguyễn Huệ - Quận 1, TP.HCM, Việt Nam',
      lat: '10.7823347',
      lon: '106.7012347',
      place_id: 'vincom-1'
    },
    { 
      display_name: 'Sân bay Tân Sơn Nhất - Tân Bình, TP.HCM, Việt Nam',
      lat: '10.8181818',
      lon: '106.6591919',
      place_id: 'airport-1'
    },
    { 
      display_name: 'Chợ Bến Thành - Quận 1, TP.HCM, Việt Nam',
      lat: '10.7728888',
      lon: '106.7000000',
      place_id: 'market-1'
    },
    { 
      display_name: 'Nhà ga Sài Gòn - Quận 3, TP.HCM, Việt Nam',
      lat: '10.7500000',
      lon: '106.6500000',
      place_id: 'station-1'
    },
    { 
      display_name: 'Landmark 81 - Bình Thạnh, TP.HCM, Việt Nam',
      lat: '10.7947',
      lon: '106.7222',
      place_id: 'landmark-1'
    },
    { 
      display_name: 'Crescent Mall - Quận 7, TP.HCM, Việt Nam',
      lat: '10.7324',
      lon: '106.7208',
      place_id: 'mall-1'
    },
  ];

  // Từ khóa tìm kiếm phổ biến
  const keywords = {
    'đại học công nghệ thông tin': ['uit-1', 'vnu-1'],
    'uit': ['uit-1'],
    'đại học quốc gia': ['vnu-1', 'uit-1'],
    'bách khoa': ['bkhcm-1'],
    'sân bay': ['airport-1'],
    'chợ': ['market-1'],
    'nhà ga': ['station-1'],
    'vincom': ['vincom-1'],
    'landmark': ['landmark-1'],
    'crescent': ['mall-1'],
  };

  // Tìm theo từ khóa
  let matchedIds = [];
  for (const [keyword, ids] of Object.entries(keywords)) {
    if (q.includes(keyword)) {
      matchedIds.push(...ids);
    }
  }

  // Nếu có match theo keyword, trả về các địa điểm đó
  if (matchedIds.length > 0) {
    const matched = popularPlaces.filter(place => matchedIds.includes(place.place_id));
    if (matched.length > 0) {
      return matched;
    }
  }

  // Lọc theo query trong display_name
  const filtered = popularPlaces.filter(place => {
    const name = place.display_name.toLowerCase();
    // Tách query thành các từ
    const queryWords = q.split(/\s+/).filter(w => w.length > 1);
    // Kiểm tra xem có từ nào trong query xuất hiện trong tên không
    return queryWords.some(word => name.includes(word));
  });

  // Nếu không tìm thấy, trả về tất cả
  return filtered.length > 0 ? filtered : popularPlaces;
}

// Tính toán đường đi đơn giản (fallback khi API không hoạt động)
function calculateSimpleRoute(from, to, numPoints = 50) {
  const path = [];
  const latDiff = to.latitude - from.latitude;
  const lonDiff = to.longitude - from.longitude;
  
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    // Sử dụng easing function để đường đi mượt hơn
    const easedT = t * t * (3 - 2 * t); // Smoothstep function
    
    path.push({
      latitude: from.latitude + latDiff * easedT,
      longitude: from.longitude + lonDiff * easedT,
    });
  }
  
  return path;
}

// Gọi API OSRM để vẽ đường đi
export async function getRoute(from, to) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson`;
    console.log('Fetching route:', url);
    
    const res = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
    });
    
    console.log('Route response status:', res.status);
    
    // Kiểm tra status code trước khi parse JSON
    if (!res.ok) {
      const errorText = await res.text();
      console.error(' Route API Error:', res.status, errorText.substring(0, 200));
      console.log('Using fallback simple route calculation');
      // Sử dụng fallback khi API lỗi
      return calculateSimpleRoute(from, to);
    }
    
    // Kiểm tra content-type để đảm bảo là JSON
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Invalid route content-type:', contentType);
      console.log('Using fallback simple route calculation');
      return calculateSimpleRoute(from, to);
    }
    
    const data = await res.json();
    
    // Kiểm tra nếu không có routes
    if (!data.routes || !data.routes.length || !data.routes[0]) {
      console.log('No routes found, using fallback');
      return calculateSimpleRoute(from, to);
    }
    
    const route = data.routes[0];
    if (!route.geometry || !route.geometry.coordinates) {
      console.log('⚠️ No geometry in route, using fallback');
      return calculateSimpleRoute(from, to);
    }
    
    const path = route.geometry.coordinates.map(([lon, lat]) => ({
      latitude: lat,
      longitude: lon,
    }));
    
    console.log('Route calculated:', path.length, 'points');
    return path;
  } catch (e) {
    console.error("Route error", e);
    console.log('Using fallback simple route calculation');
    // Sử dụng fallback khi có exception
    return calculateSimpleRoute(from, to);
  }
}
