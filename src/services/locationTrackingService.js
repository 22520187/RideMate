import * as Location from 'expo-location';
import supabase from '../config/supabaseClient';
import axiosClient from '../api/axiosClient';

/**
 * Service để quản lý real-time location tracking cho driver
 */
class LocationTrackingService {
  constructor() {
    this.locationSubscription = null;
    this.isTracking = false;
    this.UPDATE_INTERVAL_MS = 5000; // Cập nhật mỗi 5 giây
    this.currentUserId = null;
  }

  /**
   * Yêu cầu quyền truy cập location
   */
  async requestLocationPermission() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        return {
          success: false,
          error: 'Location permission denied'
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Bắt đầu tracking location và cập nhật lên backend + Supabase
   */
  async startTracking(userId) {
    try {
      // Kiểm tra permission
      const permissionResult = await this.requestLocationPermission();
      if (!permissionResult.success) {
        throw new Error(permissionResult.error);
      }

      this.currentUserId = userId;
      this.isTracking = true;

      // Lấy location hiện tại ngay lập tức
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Cập nhật location đầu tiên
      await this.updateLocation(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      );

      // Bắt đầu watch location changes
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: this.UPDATE_INTERVAL_MS,
          distanceInterval: 10, // Cập nhật khi di chuyển 10m
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

      console.log('✅ Location tracking started for user:', userId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error starting location tracking:', error);
      this.isTracking = false;
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Dừng tracking location
   */
  async stopTracking() {
    try {
      this.isTracking = false;

      if (this.locationSubscription) {
        this.locationSubscription.remove();
        this.locationSubscription = null;
      }

      // Xóa location khỏi Supabase khi offline
      if (this.currentUserId && supabase) {
        await this.removeFromSupabase(this.currentUserId);
      }

      console.log('✅ Location tracking stopped');
      return { success: true };
    } catch (error) {
      console.error('❌ Error stopping location tracking:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cập nhật location lên backend và Supabase
   */
  async updateLocation(latitude, longitude) {
    try {
      // 1. Cập nhật lên backend (Spring Boot)
      await axiosClient.post('/api/driver/location', {
        latitude,
        longitude,
      });

      // 2. Cập nhật lên Supabase real-time database
      if (supabase && this.currentUserId) {
        await this.updateSupabase(this.currentUserId, latitude, longitude);
      }

      console.log(`📍 Location updated: (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
    } catch (error) {
      console.error('❌ Error updating location:', error);
      // Không throw error để không làm gián đoạn tracking
    }
  }

  /**
   * Cập nhật location lên Supabase
   */
  async updateSupabase(driverId, latitude, longitude) {
    try {
      if (!supabase) {
        console.warn('⚠️ Supabase not configured');
        return;
      }

      // Kiểm tra xem driver đã có record chưa
      const { data: existing } = await supabase
        .from('driver_locations')
        .select('driver_id')
        .eq('driver_id', driverId)
        .single();

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('driver_locations')
          .update({
            latitude,
            longitude,
            driver_status: 'ONLINE',
            updated_at: new Date().toISOString(),
          })
          .eq('driver_id', driverId);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('driver_locations')
          .insert({
            driver_id: driverId,
            latitude,
            longitude,
            driver_status: 'ONLINE',
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('❌ Error updating Supabase:', error);
    }
  }

  /**
   * Xóa location khỏi Supabase khi driver offline
   */
  async removeFromSupabase(driverId) {
    try {
      if (!supabase) return;

      const { error } = await supabase
        .from('driver_locations')
        .delete()
        .eq('driver_id', driverId);

      if (error) throw error;
      console.log('✅ Driver location removed from Supabase');
    } catch (error) {
      console.error('❌ Error removing from Supabase:', error);
    }
  }

  /**
   * Lấy location hiện tại một lần
   */
  async getCurrentLocation() {
    try {
      const permissionResult = await this.requestLocationPermission();
      if (!permissionResult.success) {
        throw new Error(permissionResult.error);
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        success: true,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('❌ Error getting current location:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Export singleton instance
const locationTrackingService = new LocationTrackingService();
export default locationTrackingService;
