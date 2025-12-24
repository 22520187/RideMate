import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
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

// Default center (Ho Chi Minh City)
const DEFAULT_REGION = {
  latitude: 10.7769,
  longitude: 106.7009,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// ============================================
// HELPER FUNCTIONS
// ============================================
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const truncateRoute = (vehicleLoc, route) => {
  if (!vehicleLoc || !route || route.length === 0) return route;

  // Find nearest point index
  let nearestIndex = 0;
  let minDist = Infinity;

  for (let i = 0; i < route.length; i++) {
    const dist = calculateDistance(
      vehicleLoc.latitude,
      vehicleLoc.longitude,
      route[i].latitude,
      route[i].longitude
    );
    if (dist < minDist) {
      minDist = dist;
      nearestIndex = i;
    }
  }

  // Return route from nearest point onwards
  return route.slice(nearestIndex);
};

/**
 * RouteMap - Simplified map component for ride-hailing
 *
 * Focuses on:
 * - Rendering map with route polyline
 * - Displaying pickup and destination markers
 * - Displaying vehicle marker with smooth transitions
 * - Fetching nearby drivers (for passengers)
 */
const RouteMap = ({
  origin = null,
  destination = null,
  vehicleLocation = null,
  pickupLocation = null,
  driverLocation = null,
  height = 200,
  showRoute = true,
  fullScreen = false,
  rideStatus = null,
  showVehicle = false,
  isDriver = false,
  onDriverArrived = null,
  onDestinationArrived = null,
  onRouteFetched = null,
  onRouteTruncated = null,
  path = null,
  matchedDriverId = null,
  disableInternalFetch = false,
}) => {
  // Refs
  const mapRef = useRef(null);
  const hasNotifiedArrival = useRef(false);
  const hasNotifiedDestination = useRef(false);
  const prevVehicleLocation = useRef(null);
  const lastFetchTime = useRef(0);
  const lastFetchCoords = useRef(null);
  const fetchTimerRef = useRef(null);

  // State
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [phase, setPhase] = useState("to_pickup"); // to_pickup | to_destination

  // Animated coordinate for smooth vehicle movement
  const carCoordinate = useRef(
    new AnimatedRegion({
      latitude:
        vehicleLocation?.latitude ||
        driverLocation?.latitude ||
        DEFAULT_REGION.latitude,
      longitude:
        vehicleLocation?.longitude ||
        driverLocation?.longitude ||
        DEFAULT_REGION.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    })
  ).current;

  // ============================================
  // COORDINATE HELPERS
  // ============================================
  const pickupPoint = useMemo(
    () => pickupLocation || origin || DEFAULT_REGION,
    [pickupLocation, origin]
  );

  const destinationPoint = useMemo(
    () => destination || DEFAULT_REGION,
    [destination]
  );

  const currentVehicle = useMemo(
    () => vehicleLocation || driverLocation,
    [vehicleLocation, driverLocation]
  );

  // Map region based on current points
  const initialRegion = useMemo(() => {
    const centerPoint = vehicleLocation || driverLocation || pickupPoint;
    return {
      latitude: centerPoint?.latitude || DEFAULT_REGION.latitude,
      longitude: centerPoint?.longitude || DEFAULT_REGION.longitude,
      latitudeDelta: 0.03,
      longitudeDelta: 0.03,
    };
  }, [vehicleLocation, driverLocation, pickupPoint]);

  // ============================================
  // PHASE MANAGEMENT
  // ============================================
  useEffect(() => {
    if (rideStatus === "ongoing") {
      setPhase("to_destination");
      // DON'T reset hasNotifiedArrival - driver has already arrived at pickup
      // Only reset destination flag
      hasNotifiedDestination.current = false;
      console.log("🔄 Phase changed to: to_destination");
    } else {
      setPhase("to_pickup");
      hasNotifiedArrival.current = false; // Reset pickup arrival flag
      hasNotifiedDestination.current = false; // Reset destination arrival flag
      console.log("🔄 Phase: to_pickup");
    }

    // Clear old route when phase changes to ensure fresh fetch/sync
    setRouteCoordinates([]);
    lastFetchTime.current = 0; // Allow immediate re-fetch
  }, [rideStatus]);

  // ============================================
  // GET USER LOCATION
  // ============================================
  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

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

  // ============================================
  // SYNC ROUTE FROM PATH PROP (from parent)
  // ============================================
  useEffect(() => {
    if (!path || path.length === 0) return;

    let decodedPath = path;

    // Handle encoded polyline string
    if (typeof path === "string") {
      try {
        const decoded = polyline.decode(path);
        decodedPath = decoded.map((p) => ({ latitude: p[0], longitude: p[1] }));
      } catch (e) {
        console.warn("Failed to decode polyline:", e);
        return;
      }
    }

    if (Array.isArray(decodedPath) && decodedPath.length > 0) {
      console.log(
        "📍 Route synced from path prop:",
        decodedPath.length,
        "points"
      );
      setRouteCoordinates(decodedPath);
    }
  }, [path]);

  // ============================================
  // FETCH ROUTE FROM OSRM
  // ============================================
  const fetchRoute = useCallback(
    async (force = false) => {
      // Skip if disabled or we already have path from parent
      if (
        disableInternalFetch ||
        (path &&
          (Array.isArray(path) ? path.length > 0 : path.toString().length > 0))
      ) {
        return;
      }

      const now = Date.now();
      const MIN_FETCH_INTERVAL = 5000;

      // USE ORIGIN AND DESTINATION PROPS FROM PARENT
      // Parent (MatchedRideScreen) controls what route to show based on phase
      let startPoint = origin;
      let endPoint = destination;

      // Fallback if props not provided
      if (!startPoint?.latitude || !endPoint?.latitude) {
        console.warn('⚠️ RouteMap: origin or destination not provided, using fallback logic');
        if (phase === "to_pickup") {
          startPoint = currentVehicle || userLocation;
          endPoint = pickupPoint;
        } else {
          startPoint = currentVehicle || pickupPoint;
          endPoint = destinationPoint;
        }
      }

      if (!startPoint?.latitude || !endPoint?.latitude) {
        console.warn('⚠️ RouteMap: Cannot fetch route - missing coordinates');
        return;
      }

      // Check throttling unless forced
      if (!force && lastFetchTime.current > 0) {
        if (now - lastFetchTime.current < MIN_FETCH_INTERVAL) {
          const hasStartChanged = lastFetchCoords.current
            ? calculateDistance(
                startPoint.latitude,
                startPoint.longitude,
                lastFetchCoords.current.latitude,
                lastFetchCoords.current.longitude
              ) > 0.1 // 100 meters
            : true;

          const hasEndChanged = lastFetchCoords.current?.endPoint
            ? calculateDistance(
                endPoint.latitude,
                endPoint.longitude,
                lastFetchCoords.current.endPoint.latitude,
                lastFetchCoords.current.endPoint.longitude
              ) > 0.1 // 100 meters
            : true;

          if (!hasStartChanged && !hasEndChanged) {
            return;
          }
        }
      }

      lastFetchTime.current = now;
      lastFetchCoords.current = {
        latitude: startPoint.latitude,
        longitude: startPoint.longitude,
        endPoint: {
          latitude: endPoint.latitude,
          longitude: endPoint.longitude,
        },
      };

      console.log("📍 RouteMap Fetching:", {
        phase,
        rideStatus,
        startLat: startPoint.latitude?.toFixed(4),
        startLng: startPoint.longitude?.toFixed(4),
        endLat: endPoint.latitude?.toFixed(4),
        endLng: endPoint.longitude?.toFixed(4),
        usingPropsOrigin: !!origin,
        usingPropsDestination: !!destination,
      });

      try {
        const startStr = `${startPoint.longitude},${startPoint.latitude}`;
        const endStr = `${endPoint.longitude},${endPoint.latitude}`;
        const url = `https://router.project-osrm.org/route/v1/driving/${startStr};${endStr}?overview=full&geometries=polyline`;

        const response = await fetch(url);

        if (!response.ok) {
          const text = await response.text();
          if (response.status === 429) {
            console.warn("⚠️ OSRM Rate Limit hit (429)");
          } else {
            console.error(
              `❌ OSRM Error (${response.status}):`,
              text.substring(0, 100)
            );
          }
          return;
        }

        const text = await response.text();
        try {
          const json = JSON.parse(text);
          if (json.routes?.[0]) {
            const decoded = polyline.decode(json.routes[0].geometry);
            const points = decoded.map((p) => ({
              latitude: p[0],
              longitude: p[1],
            }));

            console.log(`✅ Route fetched: ${points.length} points (${phase})`);
            setRouteCoordinates(points);

            if (onRouteFetched) {
              onRouteFetched(points);
            }
          }
        } catch (e) {
          console.error("❌ JSON Parse Error:", e);
        }
      } catch (error) {
        console.error("❌ Route fetch network error:", error);
      }
    },
    [
      origin,
      destination,
      phase,
      currentVehicle,
      pickupPoint,
      destinationPoint,
      userLocation,
      path,
      onRouteFetched,
      rideStatus,
      disableInternalFetch,
    ]
  );

  // Fetch route with debouncing
  useEffect(() => {
    // Nếu đã có path từ parent, không fetch lại
    if (path) {
      const hasValidPath = Array.isArray(path)
        ? path.length > 0
        : typeof path === "string" && path.length > 0;

      if (hasValidPath) {
        if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
        return;
      }
    }

    // Clear existing timer
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);

    // Fetch ngay lập tức khi có origin và destination mới
    // Chỉ debounce nhẹ (300ms) để tránh fetch quá nhiều khi user đang nhập
    const delay = 300;

    fetchTimerRef.current = setTimeout(() => {
      fetchRoute();
    }, delay);

    return () => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    };
  }, [phase, fetchRoute, path, origin, destination]);

  // ============================================
  // ARRIVAL DETECTION
  // ============================================
  useEffect(() => {
    if (!currentVehicle) return;

    const targetPoint = phase === "to_pickup" ? pickupPoint : destinationPoint;
    if (!targetPoint?.latitude) return;

    // Calculate distance
    const distance = calculateDistance(
      currentVehicle.latitude,
      currentVehicle.longitude,
      targetPoint.latitude,
      targetPoint.longitude
    );

    const ARRIVAL_THRESHOLD = 0.05; // 50 meters

    // Log distance occasionally or if close
    if (distance < 1.0) {
      // Log if within 1km
      console.log(
        `📏 Distance to target:`, {
          phase,
          rideStatus,
          distance: `${distance.toFixed(4)} km`,
          targetLat: targetPoint.latitude.toFixed(5),
          targetLng: targetPoint.longitude.toFixed(5),
          vehicleLat: currentVehicle.latitude.toFixed(5),
          vehicleLng: currentVehicle.longitude.toFixed(5),
        }
      );
    }

    if (distance < ARRIVAL_THRESHOLD) {
      if (phase === "to_pickup" && !hasNotifiedArrival.current) {
        hasNotifiedArrival.current = true;
        console.log("🏁 Arrived at pickup!");
        onDriverArrived?.();
      } else if (
        phase === "to_destination" &&
        !hasNotifiedDestination.current
      ) {
        hasNotifiedDestination.current = true;
        console.log("🏁 Arrived at destination!");
        onDestinationArrived?.();
      }
    } else {
      // Reset flags if vehicle moves away from target
      // This prevents false positives when vehicle is close but then moves away
      // Only reset if we're far enough away (more than 2x threshold)
      if (distance > ARRIVAL_THRESHOLD * 2) {
        if (
          phase === "to_pickup" &&
          hasNotifiedArrival.current &&
          distance > 0.2
        ) {
          // Only reset if moved significantly away (200m)
          hasNotifiedArrival.current = false;
          console.log("🔄 Reset pickup arrival flag - vehicle moved away");
        } else if (
          phase === "to_destination" &&
          hasNotifiedDestination.current &&
          distance > 0.2
        ) {
          // Only reset if moved significantly away (200m)
          hasNotifiedDestination.current = false;
          console.log("🔄 Reset destination arrival flag - vehicle moved away");
        }
      }
    }

    // Track for route truncation (both driver and passenger)
    if (routeCoordinates.length > 0 && currentVehicle) {
      const truncated = truncateRoute(currentVehicle, routeCoordinates);
      if (truncated.length < routeCoordinates.length && truncated.length > 0) {
        setRouteCoordinates(truncated);
        // Only driver should trigger onRouteTruncated to update database
        if (isDriver) {
          onRouteTruncated?.(truncated);
        }
      }
    }

    // Animate car marker using AnimatedRegion
    if (currentVehicle?.latitude && currentVehicle?.longitude) {
      carCoordinate
        .timing({
          latitude: currentVehicle.latitude,
          longitude: currentVehicle.longitude,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false, // AnimatedRegion doesn't support native driver for lat/lng
        })
        .start();
    }

    prevVehicleLocation.current = currentVehicle;
  }, [
    currentVehicle,
    phase,
    pickupPoint,
    destinationPoint,
    isDriver,
    routeCoordinates,
    carCoordinate,
    onDriverArrived,
    onDestinationArrived,
    onRouteTruncated,
  ]);

  // ============================================
  // FETCH NEARBY DRIVERS (for passengers)
  // ============================================
  useEffect(() => {
    if (isDriver || rideStatus === "ongoing") {
      setNearbyDrivers([]);
      return;
    }

    const centerLocation = pickupPoint || userLocation || DEFAULT_REGION;

    const fetchNearbyDrivers = async () => {
      try {
        // Calculate timestamp 15 minutes ago
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        
        const { data, error } = await supabase
          .from("driver_locations")
          .select("driver_id, latitude, longitude, driver_status, last_updated")
          .eq("driver_status", "ONLINE")
          .gte("last_updated", fifteenMinutesAgo); // Only drivers updated in last 15 minutes

        if (error || !data) return;

        const nearby = data.filter((driver) => {
          // Filter out matched driver if any
          if (matchedDriverId && driver.driver_id === matchedDriverId)
            return false;

          const distance = calculateDistance(
            centerLocation.latitude,
            centerLocation.longitude,
            driver.latitude,
            driver.longitude
          );
          return distance <= 5; // 5km radius
        });

        setNearbyDrivers(nearby);
      } catch (err) {
        console.log("Error fetching drivers (silent):", err.message);
      }
    };

    fetchNearbyDrivers();
    const interval = setInterval(fetchNearbyDrivers, 15000); // Refresh every 15s

    return () => clearInterval(interval);
  }, [isDriver, rideStatus, pickupPoint, userLocation, matchedDriverId]);

  // ============================================
  // RENDER
  // ============================================
  return (
    <View
      style={[styles.container, { height: fullScreen ? windowHeight : height }]}
    >
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        showsUserLocation={!isDriver}
        showsMyLocationButton={false}
      >
        {/* Route Polyline */}
        {showRoute && routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={5}
            strokeColor={COLORS.PRIMARY}
            lineDashPattern={phase === "to_pickup" ? [1] : undefined}
          />
        )}

        {/* Pickup Marker */}
        {pickupPoint?.latitude && (
          <Marker
            coordinate={pickupPoint}
            title="Điểm đón"
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.markerContainer}>
              <MaterialIcons
                name="location-on"
                size={36}
                color={COLORS.GREEN}
              />
            </View>
          </Marker>
        )}

        {/* Destination Marker */}
        {destinationPoint?.latitude && destinationPoint !== DEFAULT_REGION && (
          <Marker
            coordinate={destinationPoint}
            title="Điểm đến"
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.markerContainer}>
              <MaterialIcons
                name="location-on"
                size={36}
                color={COLORS.PRIMARY}
              />
            </View>
          </Marker>
        )}

        {/* Vehicle Marker */}
        {showVehicle && currentVehicle?.latitude && (
          <Marker.Animated
            coordinate={carCoordinate}
            title={isDriver ? "Bạn" : "Tài xế"}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.vehicleMarker}>
              <MaterialIcons
                name="two-wheeler"
                size={24}
                color={COLORS.WHITE}
              />
            </View>
          </Marker.Animated>
        )}

        {/* Nearby Drivers (for passengers) */}
        {!isDriver &&
          nearbyDrivers.map((driver) => (
            <Marker
              key={driver.driver_id}
              coordinate={{
                latitude: driver.latitude,
                longitude: driver.longitude,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.driverMarker}>
                <MaterialIcons
                  name="two-wheeler"
                  size={18}
                  color={COLORS.WHITE}
                />
              </View>
            </Marker>
          ))}
      </MapView>
    </View>
  );
};

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    width: width,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: COLORS.WHITE,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  driverMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.GREEN,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.WHITE,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});

export default RouteMap;
