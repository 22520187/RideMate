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
import { MaterialIcons } from "@expo/vector-icons";
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
  rideStatus = null, // null = chưa match, "matched" = đã match nhưng chưa bắt đầu, "ongoing" = đã bắt đầu
  startAnimation = false, // Changed to false by default - only animate when explicitly set
  showVehicle = false, // New prop to control vehicle visibility
  isDriver = false, // Để biết user là driver hay passenger
  onDriverArrived = null, // Callback khi tài xế đến điểm đón
  onDestinationArrived = null, // Callback khi đến điểm đích
  onRouteFetched = null, // Callback trả về danh sách điểm route
  path = null, // Optional external path để đồng bộ route giữa 2 màn hình
  onRouteTruncated = null, // Callback khi route bị truncate (để sync lên Supabase)
  matchedDriverId = null, // Driver ID đã matched để filter nearby drivers
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
  const [isDriverMoving, setIsDriverMoving] = useState(false); // Track driver đang di chuyển

  // State quản lý nearby drivers (cho passenger)
  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  const [mapRegion, setMapRegion] = useState(null); // Track map center để fetch nearby drivers
  const [userLocation, setUserLocation] = useState(null); // Track user location

  // Sync phase with rideStatus
  const [phase, setPhase] = useState("to_pickup");
  useEffect(() => {
    if (rideStatus === "ongoing") {
      setPhase("to_destination");
      // CRITICAL: Clear route để fetch route mới cho phase 2
      // Đảm bảo cả driver và passenger đều fetch route mới (pickup → destination)
      setOsmRoute([]);
      routeRef.current = [];
      hasInitialRoute.current = false; // CRITICAL: Reset để fetch route mới
      hasNotifiedArrival.current = false;
      setIsDriverMoving(false); // Reset khi phase thay đổi
      lastTruncateIndex.current = 0; // Reset truncate index
      console.log(
        "🔄 Phase changed to to_destination - Route will be refetched"
      );
    } else if (rideStatus === "matched") {
      setPhase("to_pickup");
      // Khi matched, đảm bảo route được fetch từ driver location → pickup
      // CRITICAL: Chỉ clear route cho driver, không clear cho passenger nếu đã có path
      // Passenger sẽ nhận route từ driver qua path prop
      if (isDriver && (vehicleLocation || driverLocation)) {
        console.log(
          "🔄 Matched status - Driver will refetch route from driver location"
        );
        setOsmRoute([]);
        routeRef.current = [];
        hasInitialRoute.current = false;
        setIsDriverMoving(false); // Reset khi route mới được fetch
      } else if (!isDriver && path && Array.isArray(path) && path.length > 0) {
        // Passenger đã có path từ driver, không cần clear
        console.log("🔄 Matched status - Passenger has path, keeping route");
        setIsDriverMoving(false);
      }
    } else {
      setPhase("to_pickup");
      setIsDriverMoving(false); // Reset khi rideStatus thay đổi
    }
  }, [rideStatus, vehicleLocation, driverLocation]);

  const start = origin && origin.latitude ? origin : null;
  const end = destination && destination.latitude ? destination : null;
  // CRITICAL: pickupPoint phải là pickupLocation (điểm đón thực sự)
  // KHÔNG dùng start vì start có thể là driver location khi matched
  const pickupPoint = pickupLocation || start;
  const destinationPoint = end;

  // Get user's current location để hiển thị nearby drivers
  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.log("Location permission denied");
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.error("Error getting location:", error);
      }
    };

    getCurrentLocation();
  }, []);

  // Fetch nearby drivers (chỉ cho passenger, trong vòng 5km)
  // Luôn hiển thị dựa trên map center hoặc user location, không cần đợi input điểm đến/điểm đi
  // Chỉ dừng khi ongoing (đã bắt đầu chuyến đi), vẫn hiển thị khi matched hoặc null (chưa bắt đầu)
  useEffect(() => {
    // Dừng polling nếu:
    // 1. User là driver
    // 2. Ride đã ongoing (đã bắt đầu chuyến đi)
    if (isDriver || rideStatus === "ongoing") {
      console.log("⏸️ Skipping nearby drivers fetch:", {
        isDriver,
        rideStatus,
      });
      setNearbyDrivers([]); // Clear nearby drivers khi dừng
      return;
    }

    // Tiếp tục fetch nearby drivers nếu:
    // - rideStatus là null (chưa match - PassengerRideScreen)
    // - rideStatus là "matched" (đã match nhưng chưa bắt đầu - MatchedRideScreen)
    // - rideStatus là undefined hoặc giá trị khác

    // Xác định vị trí để fetch nearby drivers:
    // Ưu tiên: mapRegion center > pickupPoint > userLocation > DEFAULT_CENTER
    const DEFAULT_CENTER = {
      latitude: 10.7730765,
      longitude: 106.6583347,
    };
    const centerLocation = mapRegion
      ? { latitude: mapRegion.latitude, longitude: mapRegion.longitude }
      : pickupPoint
      ? { latitude: pickupPoint.latitude, longitude: pickupPoint.longitude }
      : userLocation
      ? { latitude: userLocation.latitude, longitude: userLocation.longitude }
      : DEFAULT_CENTER; // Luôn có giá trị mặc định để fetch nearby drivers

    const fetchNearbyDrivers = async () => {
      try {
        console.log(
          "📡 Fetching nearby drivers within 5km from:",
          centerLocation
        );

        // CRITICAL: Get all online drivers với location mới nhất từ Supabase
        // Order by last_updated DESC để đảm bảo location mới nhất
        const { data, error } = await supabase
          .from("driver_locations")
          .select("driver_id, latitude, longitude, driver_status, last_updated")
          .eq("driver_status", "ONLINE")
          .order("last_updated", { ascending: false });

        if (error) {
          console.warn("⚠️ Error fetching drivers:", error);
          return;
        }

        if (!data || data.length === 0) {
          console.log("ℹ️ No online drivers found");
          setNearbyDrivers([]);
          return;
        }

        // Filter drivers within 5km từ center location
        const nearby = data.filter((driver) => {
          const distance = calculateDistance(
            centerLocation.latitude,
            centerLocation.longitude,
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
  }, [isDriver, mapRegion, pickupPoint, userLocation, rideStatus]);

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

      // TRƯỜNG HỢP 1: Đã có driver - VẼ THEO PHASE
      // Phase được set dựa trên rideStatus: matched = to_pickup, ongoing = to_destination
      // Ưu tiên dùng origin/destination props nếu có (được tính toán từ MatchedRideScreen)
      if (phase === "to_pickup") {
        // Giai đoạn 1: Từ VỊ TRÍ XE HIỆN TẠI đến điểm đón
        // CRITICAL: KHÔNG dùng origin prop khi matched vì origin có thể là pickupPoint (A)
        // Chỉ dùng vehicleLocation hoặc driverLocation để đảm bảo route từ driver -> pickup
        // Nếu không có vehicleLocation/driverLocation, không fetch route (đợi sync từ driver)
        if (rideStatus === "matched" && !vehicleLocation && !driverLocation) {
          console.log(
            "⚠️ Phase 1 matched but no vehicle/driver location, skipping fetch (will use path from driver)"
          );
          return; // Không fetch route, đợi driver sync route qua path prop
        }
        // Ưu tiên vehicleLocation (realtime), fallback driverLocation (initial)
        // CRITICAL: KHÔNG dùng origin prop khi matched để tránh route từ A -> B
        // CRITICAL: Nếu không có vehicleLocation/driverLocation, không fetch route
        if (!vehicleLocation && !driverLocation) {
          console.log(
            "⚠️ Phase 1 matched but no vehicle/driver location, skipping fetch (will use path from driver)"
          );
          return; // Không fetch route, đợi driver sync route qua path prop
        }
        startPoint = vehicleLocation || driverLocation;
        // CRITICAL: endPoint PHẢI là pickupLocation để route đến marker đỏ
        // KHÔNG dùng destination khi phase = to_pickup
        endPoint = pickupLocation || pickupPoint;
        console.log("🚗 Phase 1 (to_pickup): Vehicle → Pickup", {
          phase,
          rideStatus,
          vehicleLocation,
          driverLocation,
          origin,
          pickupLocation: pickupLocation || pickupPoint,
          destination,
          using: vehicleLocation
            ? "vehicleLocation"
            : driverLocation
            ? "driverLocation"
            : "NONE - will use path from driver",
        });
      } else if (phase === "to_destination") {
        // Giai đoạn 2: Từ VỊ TRÍ XE HIỆN TẠI đến điểm đích
        startPoint = vehicleLocation || pickupLocation || origin; // Ưu tiên vehicleLocation, fallback pickupLocation, fallback origin
        endPoint = destinationPoint || destination;
        console.log(
          "🚗 Phase 2 (to_destination): Current Vehicle Location → Destination",
          {
            phase,
            rideStatus,
            vehicleLocation,
            pickupLocation,
            origin,
            destinationPoint,
            destination,
            using: vehicleLocation
              ? "vehicleLocation"
              : pickupLocation
              ? "pickupLocation"
              : "origin prop",
          }
        );
      } else {
        // Fallback: Nếu không có phase rõ ràng
        // CRITICAL: Khi matched, không dùng fallback này vì có thể route sai
        // Chỉ dùng khi chưa match (rideStatus = null)
        if (rideStatus === "matched") {
          console.log(
            "⚠️ Phase unclear but matched, skipping fallback route (will use path from driver)"
          );
          return; // Không fetch route, đợi driver sync route qua path prop
        }
        startPoint = origin || pickupPoint;
        endPoint = destination || destinationPoint;
        console.log("🚗 Fallback Route: Origin → Destination", {
          phase,
          rideStatus,
          startPoint,
          endPoint,
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
      console.log("📍 Route type:", {
        isPreview: !driverLocation && !vehicleLocation,
        isToPickup: phase === "to_pickup",
        isToDestination: phase === "to_destination",
        pickupPoint,
        destinationPoint,
      });

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
        console.log(`📱 Platform: ${Platform.OS}`);
        console.log(`🗺️ First 3 points:`, points.slice(0, 3));
        console.log(`🗺️ Last 3 points:`, points.slice(-3));

        // CRITICAL: Smooth transition khi route được cập nhật
        // Sử dụng animation để làm mượt việc thay đổi route
        setOsmRoute(points);
        routeRef.current = points; // Update ref ngay lập tức
        indexRef.current = 0; // Reset index về 0

        // CRITICAL: Khi mới fetch route, cả driver và passenger đều hiển thị full route
        // Truncate chỉ bắt đầu khi driver đang di chuyển (trong useEffect vehicleLocation)
        setRemainingRoute(points); // Set full route cho cả 2 role
        setIsDriverMoving(false); // Reset khi route mới được fetch

        // Update last refetch location khi route được fetch thành công
        if (isDriver && vehicleLocation) {
          lastRouteRefetchLocation.current = {
            latitude: vehicleLocation.latitude,
            longitude: vehicleLocation.longitude,
          };
        } else if (isDriver && driverLocation) {
          lastRouteRefetchLocation.current = {
            latitude: driverLocation.latitude,
            longitude: driverLocation.longitude,
          };
        }

        // CRITICAL: Chỉ gọi callback khi route thực sự thay đổi để tránh polling liên tục
        // So sánh với route hiện tại để tránh gọi callback không cần thiết
        // CRITICAL: Kiểm tra null safety để tránh lỗi "Cannot read property 'latitude' of undefined"
        const routeChanged =
          routeRef.current.length === 0 || // Chưa có route
          routeRef.current.length !== points.length || // Độ dài khác
          (routeRef.current.length > 0 &&
            points.length > 0 &&
            routeRef.current[0] &&
            routeRef.current[routeRef.current.length - 1] &&
            points[0] &&
            points[points.length - 1] &&
            (routeRef.current[0].latitude !== points[0].latitude ||
              routeRef.current[0].longitude !== points[0].longitude ||
              routeRef.current[routeRef.current.length - 1].latitude !==
                points[points.length - 1].latitude ||
              routeRef.current[routeRef.current.length - 1].longitude !==
                points[points.length - 1].longitude));

        if (routeChanged && onRouteFetched) {
          console.log("📞 Calling onRouteFetched callback - route changed");
          onRouteFetched(points);
        } else if (onRouteFetched) {
          console.log(
            "⏭️ Route unchanged, skipping onRouteFetched callback to avoid polling"
          );
        }

        // KHÔNG truncate ngay khi fetch route
        // Truncate chỉ bắt đầu khi xe thực sự di chuyển (vehicleLocation thay đổi)
        // if (showVehicle && vehicleLocation) {
        //   console.log(
        //     "📍 Route fetched, truncating from current vehicle location"
        //   );
        //   // Delay một chút để state update
        //   setTimeout(() => truncatePath(vehicleLocation), 100);
        // }

        // Zoom map vào đường đi - CHỈ LẦN ĐẦU (không zoom khi xe đang chạy)
        if (mapRef.current && !showVehicle) {
          // Platform-specific padding để map fit tốt hơn
          const edgePadding =
            Platform.OS === "ios"
              ? { top: 100, right: 100, bottom: 100, left: 100 } // iOS cần padding lớn hơn
              : { top: 50, right: 50, bottom: 50, left: 50 }; // Android fit tốt với padding nhỏ hơn

          mapRef.current.fitToCoordinates(points, {
            edgePadding,
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
      if (
        (!driverLocation && !vehicleLocation) ||
        (rideStatus === "matched" &&
          !showVehicle &&
          !driverLocation &&
          !vehicleLocation)
      ) {
        start = pickupPoint;
        end = destinationPoint;
      } else if (
        phase === "to_pickup" ||
        (rideStatus === "matched" && (driverLocation || vehicleLocation))
      ) {
        start = vehicleLocation || driverLocation;
        end = pickupPoint;
      } else {
        start = vehicleLocation || pickupPoint;
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

  // Nếu nhận được path từ bên ngoài (shared path) thì ưu tiên dùng path đó
  // CRITICAL: Path từ driver sync phải được ưu tiên tuyệt đối để đảm bảo driver và passenger dùng chung route
  useEffect(() => {
    if (!path) {
      // Nếu không có path, clear route để có thể fetch mới
      return;
    }

    let decodedPath = null;

    // Handle both array path and encoded polyline string
    if (Array.isArray(path) && path.length > 0) {
      // Path is already an array
      decodedPath = path;
    } else if (typeof path === "string" && path.length > 0) {
      // Path is an encoded polyline string - decode it
      console.log("🛣️ RouteMap: Received encoded polyline string, decoding...");
      try {
        const decodedPoints = polyline.decode(path);
        decodedPath = decodedPoints.map((point) => ({
          latitude: point[0],
          longitude: point[1],
        }));
        console.log("✅ Decoded polyline:", decodedPath.length, "points");
      } catch (decodeError) {
        console.error("❌ Failed to decode polyline:", decodeError);
        return;
      }
    } else {
      return;
    }

    console.log(
      "🛣️ RouteMap: Received external shared path, syncing internal route",
      {
        isDriver,
        pathLength: decodedPath.length,
        firstPoint: decodedPath[0],
        lastPoint: decodedPath[decodedPath.length - 1],
        currentOsmRouteLength: osmRoute.length,
        willUpdate:
          decodedPath.length !== osmRoute.length ||
          (decodedPath.length > 0 &&
            osmRoute.length > 0 &&
            decodedPath[0] &&
            osmRoute[0] &&
            (decodedPath[0].latitude !== osmRoute[0].latitude ||
              decodedPath[0].longitude !== osmRoute[0].longitude)),
      }
    );

    // CRITICAL: Đồng bộ route nội bộ với external path từ driver
    // Đảm bảo driver và passenger dùng CHÍNH XÁC cùng một route
    // CRITICAL: Passenger PHẢI luôn có route để hiển thị
    // Nếu passenger chưa có route hoặc route khác, luôn update
    // CRITICAL: Nếu osmRoute bị clear (length = 0) nhưng có path, luôn update
    // CRITICAL: Kiểm tra null safety để tránh lỗi "Cannot read property 'latitude' of undefined"
    // CRITICAL: Đối với passenger, luôn ưu tiên route từ driver (path) để đảm bảo sync đúng
    const shouldUpdate =
      osmRoute.length === 0
        ? true // Route bị clear hoặc chưa có, luôn update từ path
        : !isDriver
        ? true // CRITICAL: Passenger luôn update từ driver route để đảm bảo sync đúng
        : decodedPath.length !== osmRoute.length ||
          (decodedPath.length > 0 &&
            osmRoute.length > 0 &&
            decodedPath[0] &&
            decodedPath[decodedPath.length - 1] &&
            osmRoute[0] &&
            osmRoute[osmRoute.length - 1] &&
            (decodedPath[0].latitude !== osmRoute[0].latitude ||
              decodedPath[0].longitude !== osmRoute[0].longitude ||
              decodedPath[decodedPath.length - 1].latitude !==
                osmRoute[osmRoute.length - 1].latitude ||
              decodedPath[decodedPath.length - 1].longitude !==
                osmRoute[osmRoute.length - 1].longitude));

    if (shouldUpdate) {
      console.log("🔄 Updating route from external path:", {
        oldLength: osmRoute.length,
        newLength: decodedPath.length,
        isDriver,
        reason:
          !isDriver && osmRoute.length === 0
            ? "passenger has no route"
            : "route changed",
      });
      setOsmRoute(decodedPath);
      routeRef.current = decodedPath;
      hasInitialRoute.current = true;
      indexRef.current = 0;
    } else {
      // CRITICAL: Đối với passenger, luôn update để đảm bảo sync đúng với driver
      if (!isDriver) {
        console.log("🔄 Passenger: Force updating route from driver path", {
          osmRouteLength: osmRoute.length,
          decodedPathLength: decodedPath.length,
        });
        setOsmRoute(decodedPath);
        routeRef.current = decodedPath;
        hasInitialRoute.current = true;
        indexRef.current = 0;
        // CRITICAL: Set remainingRoute = osmRoute để đảm bảo full route được hiển thị
        // Truncate chỉ xảy ra khi driver đang di chuyển (trong useEffect vehicleLocation)
        setRemainingRoute(decodedPath);
        setIsDriverMoving(false); // Reset khi nhận route mới
        lastTruncateIndex.current = 0; // Reset truncate index
      } else {
        console.log("⏭️ Path unchanged, skipping update", {
          isDriver,
          osmRouteLength: osmRoute.length,
          decodedPathLength: decodedPath.length,
        });
      }
    }

    // KHÔNG gọi onRouteFetched khi nhận external path để tránh loop
    // (Driver đã lưu route rồi, không cần lưu lại)
    // Passenger chỉ cần sync display, không cần callback

    // CRITICAL: Khi nhận external path, cả driver và passenger đều hiển thị full route
    // Truncate chỉ bắt đầu khi driver đang di chuyển (trong useEffect vehicleLocation)
    // CRITICAL: Luôn set remainingRoute = osmRoute để đảm bảo route được hiển thị đầy đủ
    if (shouldUpdate) {
      setOsmRoute(decodedPath);
      setRemainingRoute(decodedPath); // CRITICAL: Set full route cho cả 2 role, không truncate
      setIsDriverMoving(false); // Reset khi nhận route mới
      lastTruncateIndex.current = 0; // Reset truncate index
    }

    // Update last refetch location khi nhận route mới
    if (isDriver && vehicleLocation) {
      lastRouteRefetchLocation.current = {
        latitude: vehicleLocation.latitude,
        longitude: vehicleLocation.longitude,
      };
    }
  }, [
    path,
    isDriver, // Thêm isDriver vào deps để đảm bảo sync đúng
  ]);

  // Track previous phase để detect phase change
  const prevPhaseRef = useRef(phase);

  // Gọi API khi component mount hoặc tọa độ thay đổi
  // CRITICAL: Tránh fetch route liên tục sau khi đã match
  useEffect(() => {
    // CRITICAL: Nếu phase thay đổi (to_pickup → to_destination hoặc ngược lại), luôn fetch route mới
    // Bỏ qua external path khi phase thay đổi để đảm bảo route mới được fetch đúng
    const phaseChanged = prevPhaseRef.current !== phase;
    if (phaseChanged) {
      console.log(
        `🔄 Phase changed: ${prevPhaseRef.current} → ${phase}, fetching new route`
      );
      prevPhaseRef.current = phase;
      hasInitialRoute.current = false; // Reset để fetch route mới
      // Clear route để fetch mới
      setOsmRoute([]);
      routeRef.current = [];
      fetchRoute();
      return;
    }

    // CRITICAL: Nếu đã có external path và route đã được set, KHÔNG fetch lại
    // Tránh polling liên tục sau khi match
    if (
      path &&
      ((Array.isArray(path) && path.length > 0) ||
        (typeof path === "string" && path.length > 0)) &&
      hasInitialRoute.current &&
      osmRoute.length > 0
    ) {
      console.log(
        "⏭️ RouteMap: External path provided and route exists, skipping fetchRoute",
        {
          isDriver,
          phase,
          pathType: Array.isArray(path) ? "array" : "string",
          pathLength: Array.isArray(path) ? path.length : path.length,
          osmRouteLength: osmRoute.length,
        }
      );
      return; // KHÔNG fetch route nội bộ khi đã có path và route đã được set
    }

    // CRITICAL: Khi matched (phase = to_pickup), DRIVER PHẢI fetch route mới từ driver location → pickup
    // CHỈ fetch một lần khi mới match, không fetch lại nếu đã có route
    if (
      path &&
      ((Array.isArray(path) && path.length > 0) ||
        (typeof path === "string" && path.length > 0))
    ) {
      // CRITICAL: Nếu là driver và phase = to_pickup và CHƯA có route, fetch route mới
      // Nếu đã có route rồi, không fetch lại để tránh loop
      if (isDriver && phase === "to_pickup" && !hasInitialRoute.current) {
        console.log(
          "🚗 Driver matched: Fetching new route from driver location → pickup (first time only)"
        );
        fetchRoute();
        return;
      }

      console.log("⏭️ RouteMap: External path provided, skipping fetchRoute", {
        isDriver,
        phase,
        pathType: Array.isArray(path) ? "array" : "string",
        pathLength: Array.isArray(path) ? path.length : path.length,
        hasInitialRoute: hasInitialRoute.current,
      });
      return; // KHÔNG fetch route nội bộ khi có path từ driver và path đúng
    }

    // Không fetch route nếu đã arrived (để tránh infinite loop)
    if (hasNotifiedArrival.current) {
      console.log("⏭️ Already arrived, skipping route fetch");
      return;
    }

    // Nếu đang showVehicle (xe đang chạy) và đã có route rồi → KHÔNG refetch
    // TRỪ KHI vehicleLocation thay đổi đáng kể (để tránh giật khi mount)
    if (showVehicle && hasInitialRoute.current && osmRoute.length > 0) {
      // Chỉ refetch nếu vehicleLocation thay đổi đáng kể (hơn 100m)
      if (vehicleLocation && prevVehicleLocation.current) {
        const dist = Math.sqrt(
          Math.pow(
            (vehicleLocation.latitude - prevVehicleLocation.current.latitude) *
              111,
            2
          ) +
            Math.pow(
              (vehicleLocation.longitude -
                prevVehicleLocation.current.longitude) *
                85,
              2
            )
        );
        if (dist < 0.1) {
          console.log(
            "⏭️ Vehicle is moving and route exists, skipping refetch"
          );
          return;
        }
      } else {
        console.log("⏭️ Vehicle is moving and route exists, skipping refetch");
        return;
      }
    }

    // CHỈ fetch route nếu chưa có route hoặc cần fetch mới
    if (!hasInitialRoute.current || osmRoute.length === 0) {
      fetchRoute();
      if (osmRoute.length > 0) {
        hasInitialRoute.current = true;
      }
    }
  }, [
    showVehicle, // Thêm dependency này để biết khi nào có driver
    phase,
    rideStatus, // Thêm rideStatus để biết khi nào matched
    vehicleLocation?.latitude, // Thêm vehicleLocation để refetch khi có vị trí xe
    vehicleLocation?.longitude,
    driverLocation?.latitude,
    driverLocation?.longitude,
    pickupPoint?.latitude,
    pickupPoint?.longitude,
    destinationPoint?.latitude,
    destinationPoint?.longitude,
    path, // Thêm path vào deps để detect khi external path thay đổi
  ]);

  // State cho Animation xe mượt mà
  // CRITICAL: Khởi tạo rotation = 0 để icon không bị xoay khi chưa di chuyển
  const [carRotation, setCarRotation] = useState(0);
  const driverMarkerRef = useRef(null); // Ref cho Marker.Animated

  // Animated value cho vị trí xe - Khởi tạo bằng vehicleLocation (realtime) hoặc driverLocation (initial)
  // Ưu tiên vehicleLocation vì đó là vị trí thực tế từ Supabase
  // Fallback to driverLocation > pickupLocation > start > defaultHCM
  const initialCarLat =
    vehicleLocation?.latitude ||
    driverLocation?.latitude ||
    pickupLocation?.latitude ||
    start?.latitude ||
    10.77254;

  const initialCarLng =
    vehicleLocation?.longitude ||
    driverLocation?.longitude ||
    pickupLocation?.longitude ||
    start?.longitude ||
    106.69763;

  // Initialize carCoordinate với vị trí ban đầu
  const carCoordinate = useRef(
    new AnimatedRegion({
      latitude: initialCarLat,
      longitude: initialCarLng,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    })
  ).current;

  // CRITICAL: Update carCoordinate khi vehicleLocation hoặc driverLocation thay đổi
  // Đảm bảo passenger có thể thấy driver icon ngay khi có location
  // Đảm bảo icon không bị biến mất khi location update
  useEffect(() => {
    const location = vehicleLocation || driverLocation;
    if (location && location.latitude && location.longitude) {
      console.log("📍 Updating carCoordinate from location:", {
        source: vehicleLocation ? "vehicleLocation" : "driverLocation",
        location,
        showVehicle,
      });
      // Update carCoordinate để marker hiển thị đúng vị trí
      // CRITICAL: Luôn update để đảm bảo icon không bị biến mất
      carCoordinate.setValue({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    } else if (showVehicle) {
      console.warn("⚠️ showVehicle is true but no location available:", {
        vehicleLocation,
        driverLocation,
      });
    }
  }, [
    vehicleLocation?.latitude,
    vehicleLocation?.longitude,
    driverLocation?.latitude,
    driverLocation?.longitude,
    showVehicle, // Add showVehicle to ensure it runs when showVehicle changes
  ]);

  // Update carCoordinate khi vehicleLocation thay đổi (đặc biệt là lần đầu khi fetch từ Supabase)
  useEffect(() => {
    if (
      vehicleLocation &&
      vehicleLocation.latitude &&
      vehicleLocation.longitude
    ) {
      // Nếu là lần đầu tiên set vehicleLocation, animate đến vị trí đó ngay lập tức
      // Không animate nếu đã có vehicleLocation trước đó (để tránh jump)
      const currentLat =
        carCoordinate.latitude._value || carCoordinate.latitude;
      const currentLng =
        carCoordinate.longitude._value || carCoordinate.longitude;

      const distance = Math.sqrt(
        Math.pow(vehicleLocation.latitude - currentLat, 2) +
          Math.pow(vehicleLocation.longitude - currentLng, 2)
      );

      // Nếu khoảng cách lớn (> 100m), có thể là lần đầu fetch từ Supabase
      // Set ngay lập tức không animate để tránh "chạy đến"
      if (distance * 111000 > 100) {
        console.log(
          "🚗 Setting initial vehicle position (no animation):",
          vehicleLocation
        );
        carCoordinate.setValue({
          latitude: vehicleLocation.latitude,
          longitude: vehicleLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      }
    }
  }, [vehicleLocation?.latitude, vehicleLocation?.longitude]);

  // 1. Lắng nghe cập nhật vị trí xe từ Supabase (vehicleLocation)
  const prevVehicleLocation = useRef(null);
  const lastRouteRefetchLocation = useRef(null); // Track vị trí lần cuối refetch route
  const routeRefetchDistance = 0.0005; // ~50-60m - Refetch route khi driver di chuyển xa hơn khoảng này

  useEffect(() => {
    // Nếu không có vehicleLocation hoặc chưa enable showVehicle thì bỏ qua
    // CRITICAL: Chỉ chạy logic này cho driver, passenger không cần sync location với route
    if (
      !showVehicle ||
      !vehicleLocation ||
      !vehicleLocation.latitude ||
      !isDriver
    )
      return;

    // CRITICAL: Refetch route khi driver di chuyển xa khỏi điểm bắt đầu route hiện tại
    // Điều này đảm bảo route luôn bám theo vị trí hiện tại của driver
    // CHỈ refetch khi driver đang di chuyển (có prevVehicleLocation) để tránh refetch ngay khi match
    if (
      isDriver &&
      osmRoute.length > 0 &&
      lastRouteRefetchLocation.current &&
      prevVehicleLocation.current
    ) {
      const distanceFromLastRefetch = Math.sqrt(
        Math.pow(
          vehicleLocation.latitude - lastRouteRefetchLocation.current.latitude,
          2
        ) +
          Math.pow(
            vehicleLocation.longitude -
              lastRouteRefetchLocation.current.longitude,
            2
          )
      );

      // Nếu driver di chuyển xa hơn threshold, refetch route từ vị trí hiện tại
      if (distanceFromLastRefetch > routeRefetchDistance) {
        console.log(
          "🔄 Driver moved far from route start, refetching route from current location",
          {
            distanceMeters: (distanceFromLastRefetch * 111000).toFixed(2),
            currentLocation: vehicleLocation,
            lastRefetchLocation: lastRouteRefetchLocation.current,
          }
        );

        // Update last refetch location
        lastRouteRefetchLocation.current = {
          latitude: vehicleLocation.latitude,
          longitude: vehicleLocation.longitude,
        };

        // Refetch route từ vị trí hiện tại đến destination
        hasInitialRoute.current = false;
        fetchRoute();
        return; // Return early để không sync location trong lần này
      }
    }

    // CRITICAL: Sync vehicleLocation với điểm gần nhất trên path để đảm bảo marker LUÔN trùng với path
    // Điều này đảm bảo driver luôn bám theo route, không lệch
    // CRITICAL: Kiểm tra null safety để tránh lỗi
    if (
      !vehicleLocation ||
      !vehicleLocation.latitude ||
      !vehicleLocation.longitude
    ) {
      console.warn(
        "⚠️ Invalid vehicleLocation in truncation logic:",
        vehicleLocation
      );
      return; // Không có vehicleLocation hợp lệ, bỏ qua
    }

    let syncedLocation = vehicleLocation;
    if (osmRoute.length > 0) {
      // Tìm điểm gần nhất trên toàn bộ route (không giới hạn phạm vi)
      // Bắt đầu từ lastTruncateIndex để tối ưu, nhưng tìm trong toàn bộ route nếu cần
      // CRITICAL: Null safety check cho osmRoute[0]
      if (!osmRoute[0] || !osmRoute[0].latitude || !osmRoute[0].longitude) {
        console.warn("⚠️ Invalid osmRoute[0]:", osmRoute[0]);
        return;
      }

      let nearestPoint = osmRoute[0];
      let nearestIndex = 0;
      let minDist = Math.sqrt(
        Math.pow(osmRoute[0].latitude - vehicleLocation.latitude, 2) +
          Math.pow(osmRoute[0].longitude - vehicleLocation.longitude, 2)
      );

      // Tìm trong phạm vi hợp lý trước (từ lastTruncateIndex đến cuối route)
      const startIdx = Math.max(0, lastTruncateIndex.current);
      const searchLimit = osmRoute.length;

      for (let i = startIdx; i < searchLimit; i++) {
        // CRITICAL: Null safety check cho osmRoute[i]
        const point = osmRoute[i];
        if (!point || !point.latitude || !point.longitude) {
          console.warn(`⚠️ Invalid point at index ${i} in sync logic:`, point);
          continue;
        }

        // CRITICAL: Double-check vehicleLocation vẫn hợp lệ trong vòng lặp
        if (
          !vehicleLocation ||
          !vehicleLocation.latitude ||
          !vehicleLocation.longitude
        ) {
          console.warn(
            `⚠️ vehicleLocation became invalid during loop at index ${i}`
          );
          return; // Exit early nếu vehicleLocation không hợp lệ
        }

        const dist = Math.sqrt(
          Math.pow(point.latitude - vehicleLocation.latitude, 2) +
            Math.pow(point.longitude - vehicleLocation.longitude, 2)
        );
        if (dist < minDist) {
          minDist = dist;
          nearestPoint = point;
          nearestIndex = i;
        }
      }

      // Nếu không tìm thấy trong phạm vi từ startIdx, tìm lại từ đầu
      if (startIdx > 0) {
        // CRITICAL: Double-check vehicleLocation vẫn hợp lệ trước khi vào vòng lặp thứ 2
        if (
          !vehicleLocation ||
          !vehicleLocation.latitude ||
          !vehicleLocation.longitude
        ) {
          console.warn(`⚠️ vehicleLocation became invalid before second loop`);
          return; // Exit early nếu vehicleLocation không hợp lệ
        }

        for (let i = 0; i < startIdx; i++) {
          // CRITICAL: Null safety check cho osmRoute[i]
          const point = osmRoute[i];
          if (!point || !point.latitude || !point.longitude) {
            console.warn(
              `⚠️ Invalid point at index ${i} in sync logic (second loop):`,
              point
            );
            continue;
          }

          // CRITICAL: Double-check vehicleLocation vẫn hợp lệ trong vòng lặp
          if (
            !vehicleLocation ||
            !vehicleLocation.latitude ||
            !vehicleLocation.longitude
          ) {
            console.warn(
              `⚠️ vehicleLocation became invalid during second loop at index ${i}`
            );
            return; // Exit early nếu vehicleLocation không hợp lệ
          }

          const dist = Math.sqrt(
            Math.pow(point.latitude - vehicleLocation.latitude, 2) +
              Math.pow(point.longitude - vehicleLocation.longitude, 2)
          );
          if (dist < minDist) {
            minDist = dist;
            nearestPoint = point;
            nearestIndex = i;
          }
        }
      }

      // CRITICAL: Luôn sync với điểm gần nhất trên route (không cần check khoảng cách)
      // Điều này đảm bảo driver luôn bám theo route, ngay cả khi có sai số nhỏ
      syncedLocation = nearestPoint;

      // Update lastTruncateIndex để tối ưu lần tìm tiếp theo
      lastTruncateIndex.current = nearestIndex;

      // Log nếu khoảng cách lớn (có thể có vấn đề)
      const distanceMeters = minDist * 111000;
      if (distanceMeters > 10) {
        console.warn("⚠️ Vehicle location far from route:", {
          distanceMeters: distanceMeters.toFixed(2),
          vehicleLocation,
          nearestPoint,
          nearestIndex,
        });
      }
    }

    // Log update
    // console.log("📍 New vehicle location update:", vehicleLocation);

    // Tính toán rotation (góc quay xe) dựa trên 2 điểm liên tiếp
    // CHỈ tính rotation khi có prevVehicleLocation (xe đã di chuyển ít nhất 1 lần)
    // CRITICAL: Kiểm tra null safety để tránh lỗi "Cannot read property 'latitude' of undefined"
    if (
      prevVehicleLocation.current &&
      syncedLocation &&
      syncedLocation.latitude != null &&
      syncedLocation.longitude != null
    ) {
      const prev = prevVehicleLocation.current;
      const curr = syncedLocation;

      // Kiểm tra prev có hợp lệ không
      if (
        prev &&
        prev.latitude != null &&
        prev.longitude != null &&
        curr &&
        curr.latitude != null &&
        curr.longitude != null
      ) {
        // Tính góc bearing (hướng di chuyển)
        const dLat = curr.latitude - prev.latitude;
        const dLng = curr.longitude - prev.longitude;

        if (Math.abs(dLat) > 0.00001 || Math.abs(dLng) > 0.00001) {
          // Tính bearing theo chuẩn navigation (0° = North, clockwise)
          // Công thức đúng cho map coordinates: atan2(dLng, dLat)
          // Nhưng MaterialIcons "two-wheeler" có hướng mặc định khác, cần điều chỉnh
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
    } else {
      // Khi chưa có prevVehicleLocation (lần đầu), reset rotation về 0
      // Để icon hiển thị đúng hướng mặc định (không xoay 180 độ)
      if (carRotation !== 0) {
        setCarRotation(0);
      }
    }

    // CRITICAL: Lưu giá trị cũ của prevVehicleLocation TRƯỚC KHI update
    // Để có thể so sánh đúng khi kiểm tra movement
    const previousLocation = prevVehicleLocation.current
      ? { ...prevVehicleLocation.current }
      : null;

    // Lưu vị trí hiện tại cho lần tính toán tiếp theo
    prevVehicleLocation.current = syncedLocation;

    // a. Animate Vehicle Marker - Khớp với interval 2s
    const DURATION = 1800; // 1.8s animation cho mỗi lần update 2s -> Mượt + còn buffer 0.2s

    // CRITICAL: Log để debug passenger update
    if (!isDriver) {
      console.log("👤 Passenger updating vehicle marker:", {
        syncedLocation,
        vehicleLocation,
        prevLocation: previousLocation,
        showVehicle,
      });
    }

    if (Platform.OS === "android") {
      if (driverMarkerRef.current) {
        driverMarkerRef.current.animateMarkerToCoordinate(
          syncedLocation,
          DURATION
        );
      }
    } else {
      // Sử dụng easing function để animation mượt mà như Grab
      carCoordinate
        .timing({
          latitude: syncedLocation.latitude,
          longitude: syncedLocation.longitude,
          duration: DURATION,
          easing: Easing.inOut(Easing.ease), // Smooth acceleration & deceleration
          useNativeDriver: false,
        })
        .start();
    }

    // CRITICAL: Truncate path từ từ khi driver bắt đầu di chuyển
    // Khi mới matched hoặc chưa di chuyển: cả driver và passenger đều hiển thị full route
    // Khi driver bắt đầu di chuyển: truncate path từ từ để hiển thị phần còn lại
    // CRITICAL: Chỉ truncate khi driver THỰC SỰ đang di chuyển (vehicleLocation thay đổi đáng kể)
    if (
      isDriver &&
      previousLocation &&
      syncedLocation &&
      syncedLocation.latitude != null &&
      syncedLocation.longitude != null
    ) {
      // Kiểm tra xem driver có thực sự di chuyển không (khoảng cách > threshold)
      // CRITICAL: Dùng previousLocation (giá trị cũ) để so sánh
      if (
        previousLocation.latitude != null &&
        previousLocation.longitude != null
      ) {
        const distance = Math.sqrt(
          Math.pow(syncedLocation.latitude - previousLocation.latitude, 2) +
            Math.pow(syncedLocation.longitude - previousLocation.longitude, 2)
        );
        const distanceMeters = distance * 111000; // Convert to meters
        const MOVEMENT_THRESHOLD = 5; // 5 meters - chỉ truncate khi di chuyển ít nhất 5m

        if (distanceMeters > MOVEMENT_THRESHOLD) {
          // Driver đang di chuyển: Truncate Path (Cắt path theo vị trí xe)
          // Điều này đảm bảo path được truncate từ từ khi driver di chuyển
          setIsDriverMoving(true);
          truncatePath(syncedLocation);
        } else {
          // Driver không di chuyển đáng kể: Giữ full route
          // CRITICAL: Reset remainingRoute về osmRoute để hiển thị full route
          setIsDriverMoving(false);
          // CRITICAL: Luôn reset remainingRoute về osmRoute khi không di chuyển
          // Đảm bảo route không bị truncate khi không nên truncate
          if (
            remainingRoute.length !== osmRoute.length ||
            remainingRoute.length === 0
          ) {
            console.log("🔄 Driver not moving, resetting to full route:", {
              remainingRouteLength: remainingRoute.length,
              osmRouteLength: osmRoute.length,
            });
            setRemainingRoute(osmRoute);
            lastTruncateIndex.current = 0; // Reset truncate index
          }
        }
      } else {
        // previousLocation không hợp lệ, reset về full route
        setIsDriverMoving(false);
        setRemainingRoute(osmRoute);
      }
    } else {
      // Chưa di chuyển hoặc passenger: Luôn hiển thị full route
      setIsDriverMoving(false);
      // CRITICAL: Đảm bảo remainingRoute luôn bằng osmRoute khi không di chuyển
      // Đảm bảo route không bị truncate khi không nên truncate
      if (
        remainingRoute.length !== osmRoute.length ||
        remainingRoute.length === 0
      ) {
        setRemainingRoute(osmRoute);
        lastTruncateIndex.current = 0; // Reset truncate index
      }
    }

    // d. Check arrival CHỈ KHI XE ĐANG DI CHUYỂN (có prevVehicleLocation)
    // CRITICAL: CHỈ driver mới check arrival, passenger không check (để tránh modal hiển thị trước driver)
    // Không check khi lần đầu set vị trí để tránh trigger modal ngay khi vào screen
    if (prevVehicleLocation.current && isDriver) {
      checkArrival(syncedLocation);
    }
  }, [vehicleLocation, showVehicle, osmRoute, isDriver]);

  // FIX: Khởi tạo vị trí xe ngay lập tức khi showVehicle bật lên hoặc driverLocation có data
  // CRITICAL: Đảm bảo marker hiển thị ngay khi matched
  useEffect(() => {
    if (showVehicle && (vehicleLocation || driverLocation)) {
      const startLoc = vehicleLocation || driverLocation;
      console.log("🚗 Initializing vehicle marker position:", {
        showVehicle,
        vehicleLocation,
        driverLocation,
        startLoc,
      });
      if (startLoc && startLoc.latitude) {
        console.log("🚗 Initializing vehicle at:", startLoc);

        // Use setValue for instant update (no animation)
        if (Platform.OS === "android") {
          if (driverMarkerRef.current) {
            // For Android, we might need a slight delay or just let the render handle it,
            // but setValue on the AnimatedRegion is still good practice for the initial state.
            // However, Marker.Animated on Android sometimes needs a verified coordinate prop.
            // We rely on carCoordinate being passed to the marker.
          }
        }

        carCoordinate.setValue({
          latitude: startLoc.latitude,
          longitude: startLoc.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });

        // KHÔNG truncate ngay khi showVehicle bật lên
        // Truncate chỉ bắt đầu khi xe thực sự di chuyển
        // if (osmRoute.length > 0) {
        //   console.log("📍 Truncating initial path from vehicle location");
        //   truncatePath(startLoc);
        // }
      }
    }
  }, [showVehicle, vehicleLocation, driverLocation]); // Added vehicleLocation/driverLocation to deps to ensure it runs when they become available

  // Hàm cắt path dựa trên vị trí xe gần nhất
  const lastTruncateIndex = useRef(0);

  const truncatePath = (currentLoc) => {
    // CRITICAL: Null safety check cho currentLoc
    if (!currentLoc || !currentLoc.latitude || !currentLoc.longitude) {
      console.warn("⚠️ truncatePath: Invalid currentLoc", currentLoc);
      return;
    }

    console.log("🔍 truncatePath called with:", {
      currentLoc,
      osmRouteLength: osmRoute?.length,
      hasOsmRoute: !!osmRoute && osmRoute.length > 0,
    });

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
      // CRITICAL: Null safety check cho point
      if (!point || !point.latitude || !point.longitude) {
        console.warn(`⚠️ truncatePath: Invalid point at index ${i}`, point);
        continue;
      }
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

        // CRITICAL: Sync route đã truncate lên Supabase để passenger nhận được
        // Chỉ sync khi là driver và có callback
        // CRITICAL: Sync ngay lập tức (không debounce) để passenger nhận được route đã truncate kịp thời
        if (isDriver && onRouteTruncated && newRoute.length > 0) {
          console.log(
            `🔄 Syncing truncated route to Supabase immediately: ${newRoute.length} points`
          );
          try {
            onRouteTruncated(newRoute);
          } catch (error) {
            console.error("❌ Error in onRouteTruncated callback:", error);
          }
        }
      }
    } else if (!hasNotifiedArrival.current) {
      // Chỉ log nếu chưa arrived
      console.log("⚠️ Could not find nearest point on route");
    }
  };

  const checkArrival = (currentLoc) => {
    const target = phase === "to_pickup" ? pickupLocation : destinationPoint;
    if (!target) return;

    // Tính khoảng cách chính xác bằng Haversine formula
    const R = 6371000; // Earth radius in meters
    const lat1 = (currentLoc.latitude * Math.PI) / 180;
    const lat2 = (target.latitude * Math.PI) / 180;
    const dLat = ((target.latitude - currentLoc.latitude) * Math.PI) / 180;
    const dLon = ((target.longitude - currentLoc.longitude) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dis = R * c; // Distance in meters

    // Tăng threshold lên 30m để chính xác hơn (tránh trigger sớm)
    if (dis < 30) {
      if (phase === "to_pickup") {
        // Đến điểm đón
        if (onDriverArrived && hasNotifiedArrival.current === false) {
          console.log(
            "🏁 Driver Arrived at Pickup - Distance:",
            dis.toFixed(1),
            "m"
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
            dis.toFixed(1),
            "m"
          );
          hasNotifiedArrival.current = true;
          // Clear BOTH routes để dừng hẳn
          setOsmRoute([]);
          setRemainingRoute([]);
          routeRef.current = [];
          // CRITICAL: Trigger callback để hiện modal "Đã đến đích"
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
      // Clear OLD route immediately to prevent snapping to stale path
      setOsmRoute([]);
      setRemainingRoute([]); // Clear remaining route để bắt đầu fresh
      hasNotifiedArrival.current = false; // Reset để có thể notify destination arrival
      lastTruncateIndex.current = 0; // Reset truncate index về 0
      prevVehicleLocation.current = null; // Reset prev location
      hasInitialRoute.current = false; // Reset để fetch route mới cho phase 2
    } else {
      console.log("🔄 Phase: to_pickup");
      setPhase("to_pickup");
    }
  }, [rideStatus]);

  // Viewport logic - Use default Ho Chi Minh City center if no coordinates
  const DEFAULT_CENTER = {
    latitude: 10.7730765,
    longitude: 106.6583347,
  };
  const defaultMapRegion = start || end || DEFAULT_CENTER;

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: defaultMapRegion.latitude,
          longitude: defaultMapRegion.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onRegionChangeComplete={(region) => {
          // Track map center để fetch nearby drivers khi user di chuyển map
          setMapRegion(region);
        }}
        showsUserLocation={!isDriver}
        followsUserLocation={!isDriver}
      >
        {/* Đường màu primary (Path) */}
        {/* Logic: 
            - Chỉ truncate khi driver ĐANG DI CHUYỂN (có prevVehicleLocation)
            - Khi mới matched hoặc chưa di chuyển: cả driver và passenger đều hiển thị full route (osmRoute)
            - Khi driver đang di chuyển: driver hiển thị remainingRoute, passenger vẫn full route
        */}
        {(() => {
          // CRITICAL: Chỉ truncate khi driver đang di chuyển VÀ là driver
          // Passenger LUÔN thấy full route (osmRoute)
          // Driver chỉ thấy remainingRoute khi đang di chuyển, còn không thì thấy full route
          // CRITICAL: Đảm bảo route không bị truncate khi không nên truncate
          const pathToShow =
            isDriver && isDriverMoving && remainingRoute.length > 0
              ? remainingRoute
              : osmRoute;
          console.log("🗺️ Path render:", {
            showVehicle,
            isDriver,
            isDriverMoving,
            osmRouteLength: osmRoute.length,
            remainingRouteLength: remainingRoute.length,
            pathToShowLength: pathToShow.length,
            hasPath: !!path,
            pathLength: Array.isArray(path)
              ? path.length
              : typeof path === "string"
              ? path.length
              : 0,
            willRender: pathToShow.length > 0,
            usingRemainingRoute:
              isDriver && isDriverMoving && remainingRoute.length > 0,
          });

          // CRITICAL: Đảm bảo cả driver và passenger luôn có route để hiển thị
          // Nếu không có pathToShow nhưng có path, có thể route chưa được sync
          if (pathToShow.length === 0 && path) {
            console.warn(
              `⚠️ ${
                isDriver ? "Driver" : "Passenger"
              } has path but no route to show, path length:`,
              Array.isArray(path) ? path.length : path.length
            );
          }

          // CRITICAL: Nếu driver không có route nhưng có path, có thể route bị clear
          if (
            isDriver &&
            pathToShow.length === 0 &&
            osmRoute.length === 0 &&
            path
          ) {
            console.warn(
              "⚠️ Driver has path but osmRoute is empty, route may have been cleared"
            );
          }

          return pathToShow.length > 0;
        })() && (
          <>
            {/* Border cho Polyline (Vẽ trước, nằm dưới) - Smooth animation */}
            <Polyline
              key={`route-border-${osmRoute.length}-${
                isDriver && isDriverMoving && remainingRoute.length > 0
                  ? remainingRoute.length
                  : osmRoute.length
              }`}
              coordinates={
                isDriver && isDriverMoving && remainingRoute.length > 0
                  ? remainingRoute
                  : osmRoute
              }
              strokeWidth={10} // Rộng hơn path chính
              strokeColor={COLORS.WHITE} // Màu viền (trắng để nổi bật)
              strokeLinecap="round"
              strokeLinejoin="round"
              zIndex={9}
              tappable={false}
            />
            {/* Path Chính (Vẽ sau, nằm trên) - Smooth animation khi route được cập nhật */}
            <Polyline
              key={`route-${osmRoute.length}-${
                isDriver && isDriverMoving && remainingRoute.length > 0
                  ? remainingRoute.length
                  : osmRoute.length
              }`} // Key để force re-render khi route thay đổi
              coordinates={
                isDriver && isDriverMoving && remainingRoute.length > 0
                  ? remainingRoute
                  : osmRoute
              }
              strokeWidth={6}
              strokeColor={COLORS.PRIMARY} // Màu chính của app
              strokeLinecap="round"
              strokeLinejoin="round"
              zIndex={10}
              tappable={false}
            />
          </>
        )}

        {/* --- LOGIC MARKER --- */}

        {/* PREVIEW MODE (!showVehicle): Hiển thị start (green) và end (red) */}
        {/* Green marker: CHỈ hiển thị ở PassengerRideScreen (chưa match) */}
        {/* Red marker: Hiển thị cả PassengerRideScreen và MatchedRideScreen khi !showVehicle */}
        {!showVehicle && (
          <>
            {/* Điểm Xuất Phát (Origin/Start) - Green Marker - CHỈ ở PassengerRideScreen */}
            {start && start.latitude && start.longitude && !driverLocation && (
              <Marker
                coordinate={start}
                title="Điểm xuất phát"
                pinColor="green"
              />
            )}
            {/* Điểm Đến (Destination) - Red Marker - Hiển thị cả 2 màn hình */}
            {end && end.latitude && end.longitude && (
              <Marker coordinate={end} title="Điểm đến" pinColor="red" />
            )}
          </>
        )}

        {/* DRIVER MODE (showVehicle = true): Hiển thị theo phase */}
        {showVehicle && (
          <>
            {/* Điểm Đón Khách (Pickup Point) - CHỈ hiển thị ở phase 1 (to_pickup) */}
            {pickupLocation &&
              pickupLocation.latitude &&
              pickupLocation.longitude &&
              phase === "to_pickup" && (
                <Marker
                  coordinate={pickupLocation}
                  title="Điểm đón khách"
                  pinColor={isDriver ? "red" : "green"} // Driver screen = đỏ, Passenger screen = xanh
                />
              )}

            {/* Điểm Đến (Destination) - Chỉ hiện ở phase 2 (to_destination) */}
            {end &&
              end.latitude &&
              end.longitude &&
              phase === "to_destination" && (
                <Marker coordinate={end} title="Điểm đến" pinColor="red" />
              )}

            {/* KHÔNG hiển thị marker xanh ở start/origin khi showVehicle = true */}
            {/* Vì đã có icon xe ở vị trí đó rồi - icon xe đã thay thế marker xanh */}
          </>
        )}

        {/* Xe Máy Di Chuyển - CHỈ hiển thị khi showVehicle = true */}
        {/* CRITICAL: Hiển thị cho cả driver và passenger khi matched/ongoing */}
        {/* CRITICAL: Đảm bảo hiển thị trong cả phase 1 (matched) và phase 2 (ongoing) */}
        {(() => {
          // CRITICAL: Luôn hiển thị nếu showVehicle = true, không phụ thuộc vào vehicleLocation/driverLocation
          // Vì vehicleLocation có thể chưa có ngay khi chuyển phase
          const shouldShow = showVehicle;
          // CRITICAL: Check both latitude AND longitude are valid (not 0, not null, not undefined)
          const carLat =
            carCoordinate?.latitude?._value ?? carCoordinate?.latitude;
          const carLng =
            carCoordinate?.longitude?._value ?? carCoordinate?.longitude;
          const hasCoordinate =
            carCoordinate &&
            carLat != null &&
            carLng != null &&
            carLat !== 0 &&
            carLng !== 0 &&
            !isNaN(carLat) &&
            !isNaN(carLng);

          if (showVehicle) {
            console.log("🚗 Vehicle marker check:", {
              showVehicle,
              hasVehicleLocation: !!vehicleLocation,
              hasDriverLocation: !!driverLocation,
              vehicleLocation,
              driverLocation,
              carLat,
              carLng,
              hasCoordinate,
              willRender: shouldShow && hasCoordinate,
              phase,
              rideStatus,
            });
          }

          // CRITICAL: Always render if showVehicle is true and we have coordinate
          // Đảm bảo icon driver luôn hiển thị cho passenger, không bị biến mất trong phase 2
          if (!shouldShow || !hasCoordinate) {
            console.warn("⚠️ Vehicle marker not showing:", {
              showVehicle,
              vehicleLocation,
              driverLocation,
              hasCoordinate,
              phase,
              rideStatus,
            });
            return null;
          }
          return (
            <Marker.Animated
              ref={driverMarkerRef}
              coordinate={carCoordinate}
              anchor={{ x: 0.5, y: 0.5 }}
              flat={true}
              rotation={carRotation}
              zIndex={9999} // High zIndex to ensure visibility on top
            >
              {/* Icon xe - Khác nhau cho driver và passenger */}
              <View style={styles.vehicleMarker}>
                <View style={styles.vehicleIcon}>
                  {isDriver ? (
                    // Driver view: Custom icon (giữ nguyên)
                    <View style={styles.vehicleBody} />
                  ) : (
                    // Passenger view: MaterialIcons two-wheeler (giống RiEBikeFill)
                    <MaterialIcons
                      name="two-wheeler"
                      size={20}
                      color={COLORS.PRIMARY}
                    />
                  )}
                </View>
              </View>
            </Marker.Animated>
          );
        })()}

        {/* Nearby Drivers - Chỉ hiển thị cho passenger, và KHÔNG hiển thị driver đã matched */}
        {!isDriver &&
          nearbyDrivers
            .filter((driver) => {
              // CRITICAL: Filter out driver đã matched bằng driverId
              // Ưu tiên dùng matchedDriverId prop nếu có
              if (matchedDriverId && driver.driver_id === matchedDriverId) {
                return false; // Không hiển thị driver đã matched
              }
              // Fallback: Filter bằng khoảng cách nếu không có matchedDriverId
              if (vehicleLocation && driverLocation) {
                const distance = calculateDistance(
                  vehicleLocation.latitude,
                  vehicleLocation.longitude,
                  driver.latitude,
                  driver.longitude
                );
                // Nếu driver gần vehicleLocation (< 50m) thì đó là driver đã matched, không hiển thị
                return distance > 0.05; // 50 meters
              }
              return true;
            })
            .map((driver, index) => (
              <Marker
                key={`driver-${driver.driver_id}-${index}`}
                coordinate={{
                  latitude: driver.latitude,
                  longitude: driver.longitude,
                }}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                {/* Nearby drivers marker - màu PRIMARY (xanh), không phải đỏ */}
                <View style={styles.vehicleMarker}>
                  <View style={styles.vehicleIcon}>
                    <MaterialIcons
                      name="two-wheeler"
                      size={20}
                      color={COLORS.PRIMARY}
                    />
                  </View>
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
  // Nearby Driver Marker - Icon xe máy cho passenger view
  nearbyDriverMarker: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  nearbyDriverIconContainer: {
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
  },
});

export default RouteMap;
