import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Text, Animated, Dimensions } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import polyline from "@mapbox/polyline";

const { width, height } = Dimensions.get("window");

// --- HÀM TÍNH GÓC QUAY (Bearing) ---
const getBearing = (startLat, startLng, destLat, destLng) => {
  const startLatRad = (startLat * Math.PI) / 180;
  const startLngRad = (startLng * Math.PI) / 180;
  const destLatRad = (destLat * Math.PI) / 180;
  const destLngRad = (destLng * Math.PI) / 180;

  const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(destLatRad) -
    Math.sin(startLatRad) *
      Math.cos(destLatRad) *
      Math.cos(destLngRad - startLngRad);
  const brng = Math.atan2(y, x);
  return ((brng * 180) / Math.PI + 360) % 360;
};

const RouteMap = ({
  // Thứ tự ưu tiên: vehicleLocation/pickupLocation > origin/destination > default HCM
  origin = null,
  destination = null,
  vehicleLocation = null,
  pickupLocation = null,
  height = 200,
  showRoute = true,
  fullScreen = false,
  rideStatus = "matched",
}) => {
  // Default coordinates
  const DEFAULT_START = { latitude: 10.77254, longitude: 106.69763 };
  const DEFAULT_END = { latitude: 10.77699, longitude: 106.69532 };

  // Xác định start/end: ưu tiên vehicleLocation/pickupLocation
  const start =
    vehicleLocation && vehicleLocation.latitude
      ? vehicleLocation
      : origin && origin.latitude
      ? origin
      : DEFAULT_START;
  const end =
    pickupLocation && pickupLocation.latitude
      ? pickupLocation
      : destination && destination.latitude
      ? destination
      : DEFAULT_END;

  const mapRef = useRef(null);

  // State quản lý đường đi và vị trí xe
  const [osmRoute, setOsmRoute] = useState([]);
  const [carPosition, setCarPosition] = useState(pickupPoint); // Xe bắt đầu từ điểm đón
  const [carRotation, setCarRotation] = useState(0);

  // Ref quản lý vòng lặp animation (Quan trọng để fix lỗi closure)
  const indexRef = useRef(0);
  const routeRef = useRef([]); // Lưu route vào ref để truy cập trong setInterval

  // 1. Fetch OSRM Route
  const fetchRoute = async () => {
    try {
      // Check null trước
      if (
        !pickupPoint ||
        !pickupPoint.latitude ||
        !destinationPoint ||
        !destinationPoint.latitude
      ) {
        console.log(
          "⚠️ Missing coordinates. Pickup:",
          pickupPoint,
          "Destination:",
          destinationPoint
        );
        // Fallback: Tạo route đơn giản từ pickup đến destination
        const fallbackRoute = [];
        if (pickupPoint && destinationPoint) {
          for (let i = 0; i <= 20; i++) {
            const t = i / 20;
            fallbackRoute.push({
              latitude:
                pickupPoint.latitude +
                (destinationPoint.latitude - pickupPoint.latitude) * t,
              longitude:
                pickupPoint.longitude +
                (destinationPoint.longitude - pickupPoint.longitude) * t,
            });
          }
          setOsmRoute(fallbackRoute);
          routeRef.current = fallbackRoute;
        }
        return;
      }

      // Log kiểm tra tọa độ đầu vào
      console.log(
        "📍 Fetching route from:",
        pickupPoint,
        "to:",
        destinationPoint
      );

      const startStr = `${pickupPoint.longitude},${pickupPoint.latitude}`;
      const endStr = `${destinationPoint.longitude},${destinationPoint.latitude}`;

      // QUAN TRỌNG: Dùng HTTPS
      const url = `https://router.project-osrm.org/route/v1/driving/${startStr};${endStr}?overview=full&geometries=polyline`;

      const response = await fetch(url);

      // Check response status
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();

      if (json.routes && json.routes.length > 0) {
        const route = json.routes[0];

        // Decode polyline using @mapbox/polyline
        const decodedPoints = polyline.decode(route.geometry);
        const points = decodedPoints.map((point) => ({
          latitude: point[0],
          longitude: point[1],
        }));

        console.log(`✅ Tìm thấy đường: ${points.length} điểm tọa độ`);
        console.log(`📏 Khoảng cách: ${(route.distance / 1000).toFixed(1)} km`);
        console.log(`⏱ Thời gian: ${(route.duration / 60).toFixed(0)} phút`);

        setOsmRoute(points);
        routeRef.current = points; // Update ref ngay lập tức
        indexRef.current = 0; // Reset index về 0

        // Zoom map vào đường đi
        if (mapRef.current) {
          mapRef.current.fitToCoordinates(points, {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          });
        }
      } else {
        console.warn("⚠️ API không trả về đường đi nào.", json);
        // Fallback to straight line
        const fallbackRoute = [];
        for (let i = 0; i <= 20; i++) {
          const t = i / 20;
          fallbackRoute.push({
            latitude: start.latitude + (end.latitude - start.latitude) * t,
            longitude: start.longitude + (end.longitude - start.longitude) * t,
          });
        }
        setOsmRoute(fallbackRoute);
        routeRef.current = fallbackRoute;
      }
    } catch (error) {
      console.error("❌ Lỗi gọi API OSRM:", error.message);
      // Fallback to straight line route khi API fail
      const fallbackRoute = [];
      if (pickupPoint && destinationPoint) {
        for (let i = 0; i <= 20; i++) {
          const t = i / 20;
          fallbackRoute.push({
            latitude:
              pickupPoint.latitude +
              (destinationPoint.latitude - pickupPoint.latitude) * t,
            longitude:
              pickupPoint.longitude +
              (destinationPoint.longitude - pickupPoint.longitude) * t,
          });
        }
        setOsmRoute(fallbackRoute);
        routeRef.current = fallbackRoute;
        console.log("📍 Using fallback straight-line route");
      }
    }
  };

  // Gọi API khi component mount hoặc tọa độ thay đổi
  useEffect(() => {
    fetchRoute();
  }, [
    pickupPoint?.latitude,
    pickupPoint?.longitude,
    destinationPoint?.latitude,
    destinationPoint?.longitude,
  ]);

  // 2. Logic Animation xe chạy (Fix lỗi đứng yên)
  useEffect(() => {
    // Nếu chưa có đường thì không chạy
    if (osmRoute.length === 0) return;

    const interval = setInterval(() => {
      const currentRoute = routeRef.current;
      const currentIndex = indexRef.current;

      // Kiểm tra xem còn điểm tiếp theo không
      if (currentIndex < currentRoute.length - 1) {
        const nextIndex = currentIndex + 1;
        const currentPoint = currentRoute[currentIndex];
        const nextPoint = currentRoute[nextIndex];

        // Guard: Check null
        if (
          !currentPoint ||
          !nextPoint ||
          !currentPoint.latitude ||
          !nextPoint.latitude
        ) {
          console.warn("⚠️ Invalid route point at index", currentIndex);
          return;
        }

        // 1. Cập nhật vị trí xe
        setCarPosition(nextPoint);

        // 2. Tính góc quay
        try {
          const angle = getBearing(
            currentPoint.latitude,
            currentPoint.longitude,
            nextPoint.latitude,
            nextPoint.longitude
          );
          setCarRotation(angle);
        } catch (e) {
          console.error("❌ Error calculating bearing:", e);
        }

        // 3. Tăng index
        indexRef.current = nextIndex;
      } else {
        // Đến đích -> Dừng hoặc Lặp lại (ở đây mình cho dừng)
        clearInterval(interval);
        console.log("🏁 Đã đến đích!");
      }
    }, 100); // Tốc độ 100ms mỗi bước nhảy

    return () => clearInterval(interval);
  }, [osmRoute]); // Chỉ chạy lại effect khi osmRoute thay đổi

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: start.latitude,
          longitude: start.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {/* Đường màu xanh (Path) */}
        {osmRoute.length > 0 && (
          <Polyline
            coordinates={osmRoute}
            strokeWidth={5}
            strokeColor="#007AFF" // Xanh dương đậm
            zIndex={10} // Đảm bảo nổi lên trên
          />
        )}

        {/* Điểm đón (A) */}
        <Marker coordinate={start} title="Điểm đón" pinColor="green" />

        {/* Điểm đến (B) */}
        <Marker coordinate={end} title="Điểm đến" pinColor="red" />

        {/* Xe Máy Di Chuyển */}
        {carPosition && (
          <Marker coordinate={carPosition} anchor={{ x: 0.5, y: 0.5 }}>
            <View
              style={{
                transform: [{ rotate: `${carRotation}deg` }],
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Icon xe máy */}
              <View style={styles.carIcon}>
                <Text style={{ fontSize: 20 }}>🏍️</Text>
              </View>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Panel thông tin debug (Hiển thị góc dưới để biết app có chạy ko) */}
      <View style={styles.debugPanel}>
        <Text>Points: {osmRoute.length}</Text>
        <Text>Lat: {carPosition?.latitude.toFixed(5)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: height,
    width: width,
  },
  map: {
    flex: 1,
  },
  carIcon: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 5,
    borderWidth: 2,
    borderColor: "#004553",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  debugPanel: {
    position: "absolute",
    bottom: 20,
    left: 20,
    backgroundColor: "rgba(255,255,255,0.8)",
    padding: 10,
    borderRadius: 8,
  },
});

export default RouteMap;
