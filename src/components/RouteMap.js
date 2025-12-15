import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Image, Animated, Easing } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { MAPS_CONFIG } from "../config/maps";
import COLORS from "../constant/colors";

const RouteMap = ({
  origin = null,
  destination = null,
  height = 200,
  showRoute = true,
  markers = [],
  path = [],
  fullScreen = false,
  rideStatus = "matched",
}) => {
  const mapRef = useRef(null);

  const rotation = useRef(new Animated.Value(0)).current;

  const [region, setRegion] = useState(MAPS_CONFIG.DEFAULT_REGION);
  const [carPosition, setCarPosition] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  /* ---------------------- UTILS ---------------------- */

  const normalizeAngle = (angle) => ((angle % 360) + 360) % 360;

  const animateRotation = (newAngle) => {
    rotation.stopAnimation((current) => {
      const currentAngle = normalizeAngle(current);
      let delta = newAngle - currentAngle;

      // quay theo hướng ngắn nhất
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      Animated.timing(rotation, {
        toValue: currentAngle + delta,
        duration: 200,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    });
  };

  /* ------------------ REGION SETUP ------------------ */

  useEffect(() => {
    if (!origin || !destination) return;

    const centerLat = (origin.latitude + destination.latitude) / 2;
    const centerLng = (origin.longitude + destination.longitude) / 2;

    const latDelta = Math.abs(origin.latitude - destination.latitude) * 2;
    const lngDelta = Math.abs(origin.longitude - destination.longitude) * 2;

    setRegion({
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(latDelta, 0.01),
      longitudeDelta: Math.max(lngDelta, 0.01),
    });
  }, [origin, destination]);

  /* ------------------ FIT PATH ------------------ */

  useEffect(() => {
    if (mapRef.current && path.length > 1) {
      mapRef.current.fitToCoordinates(path, {
        edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
        animated: true,
      });
    }
  }, [path]);

  /* ------------------ MOVE CAR ------------------ */

  useEffect(() => {
    if (!path || path.length < 2 || rideStatus !== "ongoing") return;

    let index = 0;
    setCarPosition(path[0]);
    setCurrentIndex(0);

    const interval = setInterval(() => {
      if (index >= path.length - 1) {
        clearInterval(interval);
        return;
      }

      const current = path[index];
      const next = path[index + 1];

      const dx = next.longitude - current.longitude;
      const dy = next.latitude - current.latitude;

      let angle = (Math.atan2(dx, dy) * 180) / Math.PI - 90;
      if (angle < 0) angle += 360;

      animateRotation(angle);

      index++;
      setCarPosition(next);
      setCurrentIndex(index);
    }, 1000);

    return () => clearInterval(interval);
  }, [path, rideStatus]);

  /* ------------------ MARKERS ------------------ */

  const renderMarkers = () => {
    const allMarkers = [...markers];

    if (origin) {
      allMarkers.push({
        ...origin,
        id: "origin",
        title: "Điểm xuất phát",
      });
    }

    if (destination) {
      allMarkers.push({
        ...destination,
        id: "destination",
        title: "Điểm đến",
      });
    }

    return allMarkers.map((m) => (
      <Marker
        key={m.id}
        coordinate={{ latitude: m.latitude, longitude: m.longitude }}
        title={m.title}
        pinColor={
          m.id === "origin"
            ? COLORS.GREEN
            : m.id === "destination"
            ? COLORS.RED
            : COLORS.PURPLE
        }
      />
    ));
  };

  /* ---------------------- RENDER ---------------------- */

  return (
    <View
      style={[
        styles.mapContainer,
        { height },
        fullScreen && styles.fullScreenMap,
      ]}
    >
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton
        showsCompass
      >
        {/* Đường đã đi */}
        {showRoute && currentIndex > 0 && (
          <Polyline
            coordinates={path.slice(0, currentIndex + 1)}
            strokeWidth={4}
            strokeColor="#B0B0B0"
          />
        )}

        {/* Đường còn lại */}
        {showRoute && currentIndex < path.length - 1 && (
          <Polyline
            coordinates={path.slice(currentIndex)}
            strokeWidth={6}
            strokeColor={MAPS_CONFIG.ROUTE_SETTINGS.strokeColor}
          />
        )}

        {/* Xe */}
        {carPosition && (
          <Marker coordinate={carPosition} anchor={{ x: 0.5, y: 0.5 }}>
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: rotation.interpolate({
                      inputRange: [-360, 360],
                      outputRange: ["-360deg", "360deg"],
                    }),
                  },
                ],
              }}
            >
              <Image
                source={require("../../assets/motorbike-icon.png")}
                style={{ width: 40, height: 40 }}
                resizeMode="contain"
              />
            </Animated.View>
          </Marker>
        )}

        {renderMarkers()}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    borderRadius: 15,
    overflow: "hidden",
    elevation: 1,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fullScreenMap: {
    borderRadius: 0,
    elevation: 0,
    shadowOpacity: 0,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  map: {
    flex: 1,
  },
});

export default RouteMap;
