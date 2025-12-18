import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Text, Dimensions } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import polyline from "@mapbox/polyline";
import COLORS from "../constant/colors";

const { width, height } = Dimensions.get("window");

const RouteMap = ({
  // Thứ tự ưu tiên: vehicleLocation/pickupLocation > origin/destination > default HCM
  origin = null,
  destination = null,
  vehicleLocation = null,
  pickupLocation = null,
  driverLocation = null, // Vị trí ban đầu của tài xế
  height = 200,
  showRoute = true,
  fullScreen = false,
  rideStatus = "matched",
  startAnimation = false, // Changed to false by default - only animate when explicitly set
  showVehicle = false, // New prop to control vehicle visibility
  onDriverArrived = null, // Callback khi tài xế đến điểm đón
}) => {
  // Default coordinates - only used as fallback for map center
  const DEFAULT_CENTER = { latitude: 10.77254, longitude: 106.69763 };

  // Xác định start/end: KHÔNG dùng default nếu không có origin/destination
  const start = origin && origin.latitude ? origin : null;
  const end = destination && destination.latitude ? destination : null;

  // Định nghĩa pickupPoint và destinationPoint từ các props
  const pickupPoint = start;
  const destinationPoint = end;

  // State quản lý giai đoạn: 'to_pickup' (đến điểm đón) hoặc 'to_destination' (đến đích)
  const [phase, setPhase] = useState("to_pickup");

  const mapRef = useRef(null);

  // State quản lý đường đi và vị trí xe
  const [osmRoute, setOsmRoute] = useState([]);
  const [remainingRoute, setRemainingRoute] = useState([]); // Path còn lại từ xe đến đích
  const [carPosition, setCarPosition] = useState(null); // Start as null

  // Ref quản lý vòng lặp animation
  const indexRef = useRef(0);
  const routeRef = useRef([]); // Lưu route vào ref để truy cập trong setInterval
  const hasNotifiedArrival = useRef(false); // Ref để tránh gọi callback nhiều lần

  // 1. Fetch OSRM Route - hỗ trợ 2 giai đoạn
  const fetchRoute = async () => {
    try {
      let startPoint, endPoint;

      // TRƯỜNG HỢP 1: Chưa có driver (chỉ preview route) - VẼ TRỰC TIẾP pickup → destination
      if (!driverLocation || !showVehicle) {
        startPoint = pickupPoint;
        endPoint = destinationPoint;
        console.log("📍 Simple Route: Pickup → Destination (no driver yet)");
      }
      // TRƯỜNG HỢP 2: Đã có driver - VẼ 2 GIAI ĐOẠN
      else if (phase === "to_pickup") {
        // Giai đoạn 1: Từ vị trí tài xế đến điểm đón
        startPoint = driverLocation;
        endPoint = pickupPoint;
        console.log("🚗 Phase 1: Driver → Pickup");
      } else {
        // Giai đoạn 2: Từ điểm đón đến điểm đích
        startPoint = pickupPoint;
        endPoint = destinationPoint;
        console.log("🚗 Phase 2: Pickup → Destination");
      }

      // Check null trước - nếu thiếu toạ độ thì KHÔNG vẽ gì cả
      if (
        !startPoint ||
        !startPoint.latitude ||
        !endPoint ||
        !endPoint.latitude
      ) {
        console.log("⚠️ Missing coordinates. Not drawing any route.");
        // Clear route if coordinates are missing
        setOsmRoute([]);
        routeRef.current = [];
        return;
      }

      // Log kiểm tra tọa độ đầu vào
      console.log("📍 Fetching route from:", startPoint, "to:", endPoint);

      const startStr = `${startPoint.longitude},${startPoint.latitude}`;
      const endStr = `${endPoint.longitude},${endPoint.latitude}`;

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
        const start =
          phase === "to_pickup" ? driverLocation || pickupPoint : pickupPoint;
        const end = phase === "to_pickup" ? pickupPoint : destinationPoint;

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

      let start, end;
      // Xác định start/end giống như logic ở trên
      if (!driverLocation || !showVehicle) {
        start = pickupPoint;
        end = destinationPoint;
      } else if (phase === "to_pickup") {
        start = driverLocation;
        end = pickupPoint;
      } else {
        start = pickupPoint;
        end = destinationPoint;
      }

      if (start && end) {
        for (let i = 0; i <= 20; i++) {
          const t = i / 20;
          fallbackRoute.push({
            latitude: start.latitude + (end.latitude - start.latitude) * t,
            longitude: start.longitude + (end.longitude - start.longitude) * t,
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
    showVehicle, // Thêm dependency này để biết khi nào có driver
    phase,
    driverLocation?.latitude,
    driverLocation?.longitude,
    pickupPoint?.latitude,
    pickupPoint?.longitude,
    destinationPoint?.latitude,
    destinationPoint?.longitude,
  ]);

  // 2. Logic Animation xe chạy MỀM MẠI (chỉ khi showVehicle = true)
  useEffect(() => {
    // Chỉ chạy animation khi:
    // 1. showVehicle = true (ví dụ: sau khi matching)
    // 2. startAnimation = true
    // 3. Có đường đi
    if (!showVehicle || !startAnimation || osmRoute.length === 0) {
      return;
    }

    // 🎯 FIX 1: Reset vị trí xe về điểm HIỆN TẠI của tài xế (vehicleLocation), không phải pickup point
    // Điều này đảm bảo xe xuất hiện ở vị trí thực tế của tài xế khi tìm thấy
    let startPosition;
    if (phase === "to_pickup") {
      // Giai đoạn 1: Xe bắt đầu từ vị trí hiện tại của tài xế
      startPosition = driverLocation; // 🎯 LẤY VỊ TRÍ HIỆN TẠI CỦA TÀI XẾ
    } else {
      // Giai đoạn 2: Xe bắt đầu từ pickup point
      startPosition = pickupPoint;
    }

    if (startPosition) {
      setCarPosition(startPosition);
      indexRef.current = 0;
      setRemainingRoute(osmRoute);
      hasNotifiedArrival.current = false;
    }

    // ✨ SMOOTH INTERPOLATION - Tối ưu cho animation mượt
    let progressRef = 0;

    // 🎯 OPTIMAL SETTINGS: 3 giây giữa các waypoints
    // 100ms interval × 30 steps = 3000ms (3 giây)
    const ANIMATION_INTERVAL = 100; // ms - update mỗi 100ms
    const PROGRESS_STEP = 1 / 30; // ~0.033 - 30 steps để đi từ waypoint này sang waypoint kế (3s)

    const interval = setInterval(() => {
      const currentRoute = routeRef.current;
      const currentIndex = indexRef.current;

      // Check đã đến cuối chưa
      if (currentIndex >= currentRoute.length - 1) {
        clearInterval(interval);
        setRemainingRoute([]);

        if (phase === "to_pickup") {
          console.log("🏁 Tài xế đã đến điểm đón!");

          if (onDriverArrived && !hasNotifiedArrival.current) {
            hasNotifiedArrival.current = true;
            onDriverArrived();
          }

          setTimeout(() => {
            console.log("🚀 Bắt đầu giai đoạn 2: Đi đến đích");
            setPhase("to_destination");
          }, 2000);
        } else {
          console.log("🏁 Xe đã đến điểm đến cuối cùng!");
        }
        return;
      }

      const currentPoint = currentRoute[currentIndex];
      const nextPoint = currentRoute[currentIndex + 1];

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

      // ✨ SMOOTH INTERPOLATION: Di chuyển từ từ giữa 2 waypoints
      progressRef += PROGRESS_STEP;

      if (progressRef >= 1.0) {
        progressRef = 0;
        indexRef.current = currentIndex + 1;
      }

      // Linear interpolation giữa currentPoint và nextPoint
      const lat =
        currentPoint.latitude +
        (nextPoint.latitude - currentPoint.latitude) * progressRef;
      const lng =
        currentPoint.longitude +
        (nextPoint.longitude - currentPoint.longitude) * progressRef;

      // 1. Cập nhật vị trí xe (smooth)
      setCarPosition({ latitude: lat, longitude: lng });

      // 2. Cập nhật path còn lại
      const remaining = currentRoute.slice(currentIndex + 1);
      setRemainingRoute(remaining);
    }, ANIMATION_INTERVAL);

    return () => clearInterval(interval);
  }, [
    showVehicle,
    startAnimation,
    osmRoute,
    phase,
    driverLocation,
    pickupPoint,
  ]); // Thêm phase vào dependencies

  // 3. Auto focus camera - CHỈ khi animation bắt đầu, KHÔNG follow liên tục
  useEffect(() => {
    if (
      showVehicle &&
      startAnimation &&
      osmRoute.length > 0 &&
      mapRef.current
    ) {
      // Chỉ fit camera 1 lần duy nhất khi bắt đầu animation
      // Điều này giúp camera KHÔNG giật khi xe di chuyển

      const coordinates = [];

      // 🎯 FIX: Focus theo từng giai đoạn
      if (phase === "to_pickup") {
        // Giai đoạn 1: Focus vào route từ driver → pickup
        if (driverLocation) coordinates.push(driverLocation);
        if (pickupPoint) coordinates.push(pickupPoint);
        console.log("📸 Camera focus: Driver → Pickup");
      } else {
        // Giai đoạn 2: Focus vào route từ pickup → destination
        if (pickupPoint) coordinates.push(pickupPoint);
        if (destinationPoint) coordinates.push(destinationPoint);
        console.log("📸 Camera focus: Pickup → Destination");
      }

      if (coordinates.length > 0) {
        setTimeout(() => {
          mapRef.current.fitToCoordinates(coordinates, {
            edgePadding: { top: 120, right: 120, bottom: 120, left: 120 },
            animated: true,
          });
        }, 300); // Delay nhẹ để map render xong
      }
    }
  }, [
    showVehicle,
    startAnimation,
    phase,
    driverLocation,
    pickupPoint,
    destinationPoint,
  ]); // CHỈ trigger khi bắt đầu animation hoặc đổi phase

  // Determine map region - use first available coordinate or default
  const mapRegion = start || end || DEFAULT_CENTER;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: mapRegion.latitude,
          longitude: mapRegion.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Đường màu primary (Path) */}
        {/* Nếu vehicle đang chạy, hiển thị remaining path, nếu không hiển thị full path */}
        {(showVehicle && remainingRoute.length > 0 ? remainingRoute : osmRoute)
          .length > 0 && (
          <Polyline
            coordinates={
              showVehicle && remainingRoute.length > 0
                ? remainingRoute
                : osmRoute
            }
            strokeWidth={6}
            strokeColor={COLORS.PRIMARY} // Primary color của app
            strokeLinecap="round"
            strokeLinejoin="round"
            zIndex={10} // Đảm bảo nổi lên trên
          />
        )}

        {/* Điểm xuất phát (marker xanh) - LUÔN hiển thị */}
        {start && (
          <Marker
            coordinate={start}
            title={
              !driverLocation || !showVehicle
                ? "Điểm xuất phát"
                : phase === "to_pickup"
                ? "Điểm đón khách"
                : "Điểm xuất phát"
            }
            pinColor="green"
          />
        )}

        {/* Điểm đến (marker đỏ) */}
        {/* Hiển thị khi: KHÔNG có driver (preview) HOẶC đang ở giai đoạn 2 */}
        {end &&
          (!driverLocation || !showVehicle || phase === "to_destination") && (
            <Marker coordinate={end} title="Điểm đến" pinColor="red" />
          )}

        {/* Xe Máy Di Chuyển - CHỈ hiển thị khi showVehicle = true */}
        {showVehicle && carPosition && (
          <Marker coordinate={carPosition} anchor={{ x: 0.5, y: 0.5 }}>
            {/* Icon xe - cố định, không xoay theo hướng di chuyển */}
            <Text style={{ fontSize: 28 }}>🏍️</Text>
          </Marker>
        )}
      </MapView>

      {/* Panel thông tin debug (Hiển thị góc dưới để biết app có chạy ko) */}
      <View style={styles.debugPanel}>
        <Text>Points: {osmRoute.length}</Text>
        <Text>Vehicle: {showVehicle ? "Yes" : "No"}</Text>
        <Text>
          Phase: {phase === "to_pickup" ? "Đến điểm đón" : "Đến đích"}
        </Text>
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
