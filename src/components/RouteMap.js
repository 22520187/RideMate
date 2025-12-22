import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  Platform,
  Easing,
} from "react-native";
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  AnimatedRegion,
} from "react-native-maps";
import polyline from "@mapbox/polyline";
import COLORS from "../constant/colors";
import { supabase } from "../config/supabaseClient";
import * as Location from "expo-location";

const { width, height: windowHeight } = Dimensions.get("window");

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
  isDriver = false, // Để biết user là driver hay passenger
  onDriverArrived = null, // Callback khi tài xế đến điểm đón
  onDestinationArrived = null, // Callback khi đến điểm đích
  onRouteFetched = null, // Callback trả về danh sách điểm route
}) => {
  // Ref quản lý vòng lặp animation
  const indexRef = useRef(0);
  const routeRef = useRef([]);
  const hasNotifiedArrival = useRef(false);
  const mapRef = useRef(null);

  // State quản lý đường đi và vị trí xe
  const [osmRoute, setOsmRoute] = useState([]);
  const [remainingRoute, setRemainingRoute] = useState([]);
  const [carPosition, setCarPosition] = useState(null);

  // State quản lý nearby drivers (cho passenger)
  const [nearbyDrivers, setNearbyDrivers] = useState([]);

  // Sync phase with rideStatus
  const [phase, setPhase] = useState("to_pickup");
  useEffect(() => {
    if (rideStatus === "ongoing") {
      setPhase("to_destination");
      setOsmRoute([]);
      hasNotifiedArrival.current = false;
    } else {
      setPhase("to_pickup");
    }
  }, [rideStatus]);

  const start = origin && origin.latitude ? origin : null;
  const end = destination && destination.latitude ? destination : null;
  const pickupPoint = start;
  const destinationPoint = end;

  // Fetch nearby drivers (chỉ cho passenger, trong vòng 5km)
  useEffect(() => {
    if (isDriver || !pickupPoint) return; // Chỉ passenger mới fetch

    const fetchNearbyDrivers = async () => {
      try {
        console.log("📡 Fetching nearby drivers within 5km...");

        // Get all online drivers
        const { data, error } = await supabase
          .from("driver_locations")
          .select("driver_id, latitude, longitude, driver_status")
          .eq("driver_status", "ONLINE");

        if (error) {
          console.warn("⚠️ Error fetching drivers:", error);
          return;
        }

        if (!data || data.length === 0) {
          console.log("ℹ️ No online drivers found");
          setNearbyDrivers([]);
          return;
        }

        // Filter drivers within 5km
        const nearby = data.filter((driver) => {
          const distance = calculateDistance(
            pickupPoint.latitude,
            pickupPoint.longitude,
            driver.latitude,
            driver.longitude
          );
          return distance <= 5; // 5km radius
        });

        console.log(`✅ Found ${nearby.length} drivers within 5km`);
        setNearbyDrivers(nearby);
      } catch (err) {
        console.error("❌ Error fetching nearby drivers:", err);
      }
    };

    // Fetch immediately
    fetchNearbyDrivers();

    // Refresh every 10 seconds
    const interval = setInterval(fetchNearbyDrivers, 10000);

    return () => clearInterval(interval);
  }, [isDriver, pickupPoint]);

  // Helper: Calculate distance in km
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
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
        // Giai đoạn 1: Từ VỊ TRÍ XE HIỆN TẠI đến điểm đón
        // Ưu tiên vehicleLocation (realtime), fallback driverLocation (initial)
        startPoint = vehicleLocation || driverLocation;
        endPoint = pickupLocation;
        console.log("🚗 Phase 1: Vehicle → Pickup", {
          vehicleLocation,
          driverLocation,
          using: vehicleLocation ? "vehicleLocation" : "driverLocation",
        });
      } else {
        // Giai đoạn 2: Từ VỊ TRÍ XE HIỆN TẠI đến điểm đích
        startPoint = vehicleLocation || pickupLocation; // Ưu tiên vehicleLocation, fallback pickupLocation
        endPoint = destinationPoint;
        console.log("🚗 Phase 2: Current Vehicle Location → Destination", {
          vehicleLocation,
          pickupLocation,
          using: vehicleLocation ? "vehicleLocation" : "pickupLocation",
        });
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

        // Callback trả route points về parent component
        if (onRouteFetched) {
          onRouteFetched(points);
        }

        // Nếu đang showVehicle, truncate path ngay từ vị trí xe hiện tại
        if (showVehicle && vehicleLocation) {
          console.log(
            "📍 Route fetched, truncating from current vehicle location"
          );
          // Delay một chút để state update
          setTimeout(() => truncatePath(vehicleLocation), 100);
        }

        // Zoom map vào đường đi - CHỈ LẦN ĐẦU (không zoom khi xe đang chạy)
        if (mapRef.current && !showVehicle) {
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

  // Ref để track đã fetch route lần đầu chưa
  const hasInitialRoute = useRef(false);

  // Gọi API khi component mount hoặc tọa độ thay đổi
  useEffect(() => {
    // Không fetch route nếu đã arrived (để tránh infinite loop)
    if (hasNotifiedArrival.current) {
      console.log("⏭️ Already arrived, skipping route fetch");
      return;
    }

    // Nếu đang showVehicle (xe đang chạy) và đã có route rồi → KHÔNG refetch
    if (showVehicle && hasInitialRoute.current && osmRoute.length > 0) {
      console.log("⏭️ Vehicle is moving and route exists, skipping refetch");
      return;
    }

    fetchRoute();
    if (osmRoute.length > 0) {
      hasInitialRoute.current = true;
    }
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

  // State cho Animation xe mượt mà
  const [carRotation, setCarRotation] = useState(0);
  const driverMarkerRef = useRef(null); // Ref cho Marker.Animated

  // Animated value cho vị trí xe - Khởi tạo bằng driverLocation ban đầu
  const carCoordinate = useRef(
    new AnimatedRegion({
      latitude: driverLocation?.latitude || 10.77254,
      longitude: driverLocation?.longitude || 106.69763,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    })
  ).current;

  // 1. Lắng nghe cập nhật vị trí xe từ Supabase (vehicleLocation)
  const prevVehicleLocation = useRef(null);

  useEffect(() => {
    // Nếu không có vehicleLocation hoặc chưa enable showVehicle thì bỏ qua
    if (!showVehicle || !vehicleLocation || !vehicleLocation.latitude) return;

    // Log update
    // console.log("📍 New vehicle location update:", vehicleLocation);

    // Tính toán rotation (góc quay xe) dựa trên 2 điểm liên tiếp
    if (prevVehicleLocation.current) {
      const prev = prevVehicleLocation.current;
      const curr = vehicleLocation;

      // Tính góc bearing (hướng di chuyển)
      const dLat = curr.latitude - prev.latitude;
      const dLng = curr.longitude - prev.longitude;

      if (Math.abs(dLat) > 0.00001 || Math.abs(dLng) > 0.00001) {
        // Tính bearing theo chuẩn navigation (0° = North, clockwise)
        let bearing = Math.atan2(dLng, dLat) * (180 / Math.PI);

        // Normalize to 0-360
        bearing = (bearing + 360) % 360;

        // Smooth rotation: Tránh nhảy 359° -> 0° bằng cách chọn đường ngắn nhất
        const currentRotation = carRotation;
        let diff = bearing - currentRotation;

        // Normalize diff to -180 to 180
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;

        // Apply smooth rotation
        const newRotation = (currentRotation + diff + 360) % 360;
        setCarRotation(newRotation);
      }
    }

    // Lưu vị trí hiện tại cho lần tính toán tiếp theo
    prevVehicleLocation.current = vehicleLocation;

    // a. Animate Vehicle Marker - Khớp với interval 2s
    const DURATION = 1800; // 1.8s animation cho mỗi lần update 2s -> Mượt + còn buffer 0.2s

    if (Platform.OS === "android") {
      if (driverMarkerRef.current) {
        driverMarkerRef.current.animateMarkerToCoordinate(
          vehicleLocation,
          DURATION
        );
      }
    } else {
      // Sử dụng easing function để animation mượt mà như Grab
      carCoordinate
        .timing({
          latitude: vehicleLocation.latitude,
          longitude: vehicleLocation.longitude,
          duration: DURATION,
          easing: Easing.inOut(Easing.ease), // Smooth acceleration & deceleration
          useNativeDriver: false,
        })
        .start();
    }

    // c. Truncate Path (Cắt path theo vị trí xe)
    truncatePath(vehicleLocation);

    // Check arrival (nếu khoảng cách đến đích < 50m)
    checkArrival(vehicleLocation);
  }, [vehicleLocation, showVehicle]);

  // FIX: Khởi tạo vị trí xe ngay lập tức khi showVehicle bật lên hoặc driverLocation có data
  useEffect(() => {
    if (showVehicle && (driverLocation || vehicleLocation)) {
      const startLoc = vehicleLocation || driverLocation;
      if (startLoc && startLoc.latitude) {
        console.log("🚗 Initializing vehicle at:", startLoc);
        // Set ngay lập tức không animation để xe "nhảy" về đúng chỗ
        carCoordinate.setValue({
          latitude: startLoc.latitude,
          longitude: startLoc.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
        // Cũng cập nhật remaining route ngay từ đầu
        if (osmRoute.length > 0) {
          console.log("📍 Truncating initial path from vehicle location");
          truncatePath(startLoc);
        }
      }
    }
  }, [showVehicle, osmRoute.length]); // Thêm osmRoute.length để trigger khi route được fetch

  // Hàm cắt path dựa trên vị trí xe gần nhất
  const lastTruncateIndex = useRef(0);

  const truncatePath = (currentLoc) => {
    if (!osmRoute || osmRoute.length === 0) {
      // Không log nếu đã arrived (tránh spam log)
      if (!hasNotifiedArrival.current) {
        console.log("⚠️ No route to truncate");
      }
      return;
    }

    // Tìm điểm gần xe nhất trên route
    let minIs = -1;
    let minDis = 1000000;

    // Tối ưu: Bắt đầu search từ vị trí cũ (xe không đi lùi)
    const startIdx = Math.max(0, lastTruncateIndex.current);
    // Tăng search range lên 100 điểm để đảm bảo tìm được
    const searchLimit = Math.min(osmRoute.length, startIdx + 100);

    for (let i = startIdx; i < searchLimit; i++) {
      const point = osmRoute[i];
      const dis = Math.sqrt(
        Math.pow(point.latitude - currentLoc.latitude, 2) +
          Math.pow(point.longitude - currentLoc.longitude, 2)
      );
      if (dis < minDis) {
        minDis = dis;
        minIs = i;
      }
    }

    // Nếu tìm thấy điểm gần nhất
    if (minIs !== -1) {
      // Nếu đã đến cuối route (điểm cuối cùng)
      if (minIs >= osmRoute.length - 1) {
        console.log(`✂️ Reached end of route, clearing path`);
        setRemainingRoute([]);
        return;
      }

      // Update nếu:
      // 1. Lần đầu tiên (lastTruncateIndex = 0) → Set luôn
      // 2. Có thay đổi (tiến ít nhất 1 điểm) → Update liên tục để path rút ngắn
      if (
        lastTruncateIndex.current === 0 ||
        minIs > lastTruncateIndex.current
      ) {
        console.log(
          `✂️ Truncating route: ${minIs}/${osmRoute.length} (distance: ${(
            minDis * 111
          ).toFixed(0)}m)`
        );
        lastTruncateIndex.current = minIs;
        // Cắt path từ điểm hiện tại đến cuối
        const newRoute = osmRoute.slice(minIs);
        setRemainingRoute(newRoute);
        console.log(`📍 Remaining route set: ${newRoute.length} points`);
      }
    } else if (!hasNotifiedArrival.current) {
      // Chỉ log nếu chưa arrived
      console.log("⚠️ Could not find nearest point on route");
    }
  };

  const checkArrival = (currentLoc) => {
    const target = phase === "to_pickup" ? pickupLocation : destinationPoint;
    if (!target) return;

    const dis =
      Math.sqrt(
        Math.pow(target.latitude - currentLoc.latitude, 2) +
          Math.pow(target.longitude - currentLoc.longitude, 2)
      ) * 111000; // Độ conversion thô ra mét

    if (dis < 15) {
      // Giảm xuống 15m để chính xác hơn (tránh trigger sớm)
      if (phase === "to_pickup") {
        // Đến điểm đón
        if (onDriverArrived && hasNotifiedArrival.current === false) {
          console.log(
            "🏁 Driver Arrived at Pickup - Distance:",
            dis.toFixed(1)
          );
          hasNotifiedArrival.current = true;
          // Clear BOTH routes để dừng hẳn
          setOsmRoute([]);
          setRemainingRoute([]);
          routeRef.current = [];
          onDriverArrived();
        }
      } else if (phase === "to_destination") {
        // Đến điểm đích
        if (hasNotifiedArrival.current === false) {
          console.log(
            "🏁 Driver Arrived at Destination - Distance:",
            dis.toFixed(1)
          );
          hasNotifiedArrival.current = true;
          // Clear BOTH routes để dừng hẳn
          setOsmRoute([]);
          setRemainingRoute([]);
          routeRef.current = [];
          // Callback về parent component
          if (onDestinationArrived) {
            onDestinationArrived();
          }
        }
      }
    }
  };

  // Update phase logic
  useEffect(() => {
    if (rideStatus === "ongoing") {
      console.log("🔄 Phase changed to: ongoing");
      setPhase("to_destination");
      // KHÔNG clear osmRoute ngay - để nó được thay thế bởi route mới
      setRemainingRoute([]); // Clear remaining route để bắt đầu fresh
      hasNotifiedArrival.current = false; // Reset để có thể notify destination arrival
      lastTruncateIndex.current = 0; // Reset truncate index về 0
      prevVehicleLocation.current = null; // Reset prev location
      hasInitialRoute.current = false; // Reset để fetch route mới cho phase 2
    } else {
      console.log("🔄 Phase changed to: to_pickup");
      setPhase("to_pickup");
    }
  }, [rideStatus]);

  // Viewport logic - Use default Ho Chi Minh City center if no coordinates
  const DEFAULT_CENTER = {
    latitude: 10.7730765,
    longitude: 106.6583347,
  };
  const mapRegion = start || end || DEFAULT_CENTER;

  return (
    <View style={[styles.container, { height }]}>
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
        showsUserLocation={!isDriver}
        followsUserLocation={!isDriver}
      >
        {/* Đường màu primary (Path) */}
        {/* Logic: 
            - Nếu showVehicle = true: CHỈ hiển thị remainingRoute (path còn lại phía trước xe)
            - Nếu showVehicle = false: Hiển thị osmRoute (preview full path)
        */}
        {(() => {
          const pathToShow = showVehicle ? remainingRoute : osmRoute;
          console.log("🗺️ Path render:", {
            showVehicle,
            osmRouteLength: osmRoute.length,
            remainingRouteLength: remainingRoute.length,
            pathToShowLength: pathToShow.length,
            willRender: pathToShow.length > 0,
          });
          return pathToShow.length > 0;
        })() && (
          <>
            {/* Border cho Polyline (Vẽ trước, nằm dưới) */}
            <Polyline
              coordinates={showVehicle ? remainingRoute : osmRoute}
              strokeWidth={10} // Rộng hơn path chính
              strokeColor={COLORS.WHITE} // Màu viền (trắng để nổi bật)
              strokeLinecap="round"
              strokeLinejoin="round"
              zIndex={9}
            />
            {/* Path Chính (Vẽ sau, nằm trên) */}
            <Polyline
              coordinates={showVehicle ? remainingRoute : osmRoute}
              strokeWidth={6}
              strokeColor={COLORS.PRIMARY} // Màu chính của app
              strokeLinecap="round"
              strokeLinejoin="round"
              zIndex={10}
            />
          </>
        )}

        {/* --- LOGIC MARKER --- */}

        {/* Điểm Xuất Phát ban đầu (Driver Start) - Chỉ hiện ở phase 1 và khi CHƯA hiện xe */}
        {start && phase === "to_pickup" && !showVehicle && (
          <Marker coordinate={start} title="Vị trí tài xế" pinColor="green" />
        )}

        {/* Điểm Đón Khách (Pickup Point) */}
        {/* Phase 1 (Target): ĐỎ. Phase 2 (Start): XANH */}
        {pickupLocation && (
          <Marker
            coordinate={pickupLocation}
            title="Điểm đón khách"
            pinColor={phase === "to_pickup" ? "red" : "green"}
          />
        )}

        {/* Điểm Đến (Destination) - Chỉ hiện khi ở phase 2 hoặc preview */}
        {end && phase === "to_destination" && (
          <Marker coordinate={end} title="Điểm đến" pinColor="red" />
        )}

        {/* Xe Máy Di Chuyển - CHỈ hiển thị khi showVehicle = true */}
        {showVehicle && (
          <Marker.Animated
            ref={driverMarkerRef}
            coordinate={carCoordinate}
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true}
          >
            {/* Icon xe cố định - Giống Grab/XanhSM */}
            <View style={styles.vehicleMarker}>
              <View style={styles.vehicleIcon}>
                <View style={styles.vehicleBody} />
              </View>
            </View>
          </Marker.Animated>
        )}

        {/* Nearby Drivers - Chỉ hiển thị cho passenger */}
        {!isDriver &&
          nearbyDrivers.map((driver, index) => (
            <Marker
              key={`driver-${driver.driver_id}-${index}`}
              coordinate={{
                latitude: driver.latitude,
                longitude: driver.longitude,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: COLORS.PRIMARY,
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 3,
                  borderColor: "white",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 3,
                  elevation: 5,
                }}
              >
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: "white",
                  }}
                />
              </View>
            </Marker>
          ))}
      </MapView>
      {/* Đã xóa Debug Panel */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width,
    overflow: "hidden",
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
  // Vehicle Marker Styles - Giống Grab/XanhSM
  vehicleMarker: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleIcon: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
  },
  vehicleBody: {
    width: 16,
    height: 16,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
  },
});

export default RouteMap;
