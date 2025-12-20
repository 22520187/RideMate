import * as Location from 'expo-location';
import axiosClient from '../api/axiosClient';

class DriverLocationServiceClass {
  constructor() {
    this.locationSubscription = null;
    this.updateInterval = null;
    this.isTracking = false;
    this.UPDATE_INTERVAL_MS = 5000;
  }

  async startLocationTracking() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      this.isTracking = true;

      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: this.UPDATE_INTERVAL_MS,
          distanceInterval: 10,
        },
        async (location) => {
          if (this.isTracking) {
            await this.updateLocation(
              location.coords.latitude,
              location.coords.longitude
            );
          }
        }
      );

      console.log('Location tracking started');
    } catch (error) {
      console.error('Error starting location tracking:', error);
      throw error;
    }
  }

  async stopLocationTracking() {
    this.isTracking = false;

    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    console.log('Location tracking stopped');
  }

  async updateLocation(latitude, longitude) {
    try {
      await axiosClient.post('/api/driver/location', {
        latitude,
        longitude,
      });
      console.log('Location updated:', latitude, longitude);
    } catch (error) {
      console.error('Error updating location:', error);
    }
  }

  async getCurrentLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      throw error;
    }
  }
}

const DriverLocationService = new DriverLocationServiceClass();
export default DriverLocationService;
