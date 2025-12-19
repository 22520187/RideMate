import React from 'react';
import { Marker } from 'react-native-maps';
import { View, Text, StyleSheet } from 'react-native';

const DriverMapMarker = ({ driver, onPress }) => {
  if (!driver || !driver.latitude || !driver.longitude) {
    return null;
  }

  const coordinate = {
    latitude: driver.latitude,
    longitude: driver.longitude,
  };

  return (
    <Marker
      coordinate={coordinate}
      onPress={() => onPress && onPress(driver)}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={false}
    >
      <View style={styles.markerContainer}>
        <View style={styles.markerInner}>
          <Text style={styles.markerIcon}>🏍️</Text>
        </View>
        <View style={styles.markerPulse} />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#004553',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerIcon: {
    fontSize: 20,
  },
  markerPulse: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 69, 83, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(0, 69, 83, 0.4)',
  },
});

export default DriverMapMarker;
