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
  const [region, setRegion] = useState(MAPS_CONFIG.DEFAULT_REGION);
  const [carPosition, setCarPosition] = useState(null);
  const rotation = useRef(new Animated.Value(0)).current; // để quay xe

  // Cập nhật region khi có origin & destination
  useEffect(() => {
    if (origin && destination) {
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
    }
  }, [origin, destination]);

  // Fit bản đồ theo tuyến đường khi có path
  useEffect(() => {
    if (mapRef.current && path.length > 1) {
      mapRef.current.fitToCoordinates(path, {
        edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
        animated: true,
      });
    }
  }, [path]);

  // Di chuyển xe dọc tuyến đường
  useEffect(() => {
    if (!path || path.length === 0 || rideStatus !== "ongoing") return; // chỉ chạy khi đang trong chuyến
    let index = 0;
    setCarPosition(path[0]);

    const interval = setInterval(() => {
      if (index < path.length - 1) {
        const current = path[index];
        const next = path[index + 1];

        // Tính góc quay xe theo hướng di chuyển
        const dx = next.longitude - current.longitude;
        const dy = next.latitude - current.latitude;
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

        // Animate rotation nhẹ
        Animated.timing(rotation, {
          toValue: angle,
          duration: 500,
          easing: Easing.linear,
          useNativeDriver: false,
        }).start();

        setCarPosition(next);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [path, rideStatus]);

  const renderMarkers = () => {
    const allMarkers = [...markers];

    if (origin) {
      allMarkers.push({
        ...origin,
        id: "origin",
        title: "Điểm xuất phát",
        description: origin.description || "Điểm xuất phát",
      });
    }

    if (destination) {
      allMarkers.push({
        ...destination,
        id: "destination",
        title: "Điểm đến",
        description: destination.description || "Điểm đến",
      });
    }

    return allMarkers.map((marker) => (
      <Marker
        key={marker.id}
        coordinate={{
          latitude: marker.latitude,
          longitude: marker.longitude,
        }}
        title={marker.title}
        description={marker.description}
        pinColor={
          marker.id === "origin"
            ? COLORS.GREEN
            : marker.id === "destination"
            ? COLORS.RED
            : COLORS.PURPLE
        }
      />
    ));
  };

  // 🧭 Render
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
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
      >
        {/* Vẽ đường đi */}
        {showRoute && path && path.length > 1 && (
          <Polyline
            coordinates={path}
            strokeWidth={MAPS_CONFIG.ROUTE_SETTINGS.strokeWidth}
            strokeColor={MAPS_CONFIG.ROUTE_SETTINGS.strokeColor}
          />
        )}

        {/* Xe di chuyển */}
        {carPosition && (
          <Marker coordinate={carPosition} anchor={{ x: 0.5, y: 0.5 }}>
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: rotation.interpolate({
                      inputRange: [-180, 180],
                      outputRange: ["-180deg", "180deg"],
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
    zIndex: 0,
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
