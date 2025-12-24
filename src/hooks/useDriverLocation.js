import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { supabase } from '../config/supabaseClient';
import axiosClient from '../api/axiosClient';
import endpoints from '../api/endpoints';
import { getUserData } from '../utils/storage';

/**
 * Hook for driver's real-time location broadcasting
 * Handles location permission, tracking, and syncing to Supabase + Backend
 * 
 * @param {boolean} isOnline - Whether driver is online
 * @returns {Object} Location tracking state and controls
 */
const useDriverLocation = (isOnline = false) => {
  // State
  const [isTracking, setIsTracking] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [error, setError] = useState(null);
  const [driverId, setDriverId] = useState(null);

  // Refs
  const locationSubscriptionRef = useRef(null);
  const simulationIntervalRef = useRef(null);
  const UPDATE_INTERVAL_MS = 5000; // Update every 5 seconds

  // Load driver ID on mount
  useEffect(() => {
    const loadDriverId = async () => {
      try {
        const userData = await getUserData();
        if (userData?.id) {
          setDriverId(userData.id);
        }
      } catch (err) {
        console.error('Error loading driver ID:', err);
      }
    };
    loadDriverId();
  }, []);

  // ============================================
  // LOCATION PERMISSION
  // ============================================
  const requestPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        return false;
      }
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  // ============================================
  // UPDATE LOCATION (Backend + Supabase)
  // ============================================
  const updateLocation = useCallback(async (latitude, longitude) => {
    if (!driverId) return;

    try {
      // 1. Update backend
      await axiosClient.post(endpoints.driver.location, { latitude, longitude });

      // 2. Update Supabase (upsert)
      const { error: supabaseError } = await supabase
        .from('driver_locations')
        .upsert({
          driver_id: driverId,
          latitude,
          longitude,
          driver_status: 'ONLINE',
          last_updated: new Date().toISOString(),
        }, {
          onConflict: 'driver_id',
        });

      if (supabaseError) {
        console.warn('Supabase update error:', supabaseError);
      } else {
        console.log(`📍 Location updated: (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
      }

      setCurrentLocation({ latitude, longitude });
    } catch (err) {
      console.error('Error updating location:', err);
    }
  }, [driverId]);

  // ============================================
  // START TRACKING
  // ============================================
  const startTracking = useCallback(async () => {
    if (isTracking || !driverId) return;

    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    try {
      setIsTracking(true);
      setError(null);

      // Get current location immediately
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      await updateLocation(location.coords.latitude, location.coords.longitude);

      // Start watching position
      locationSubscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: UPDATE_INTERVAL_MS,
          distanceInterval: 10, // Update when moved 10m
        },
        async (newLocation) => {
          await updateLocation(
            newLocation.coords.latitude,
            newLocation.coords.longitude
          );
        }
      );

      console.log('✅ Location tracking started');
    } catch (err) {
      console.error('Error starting tracking:', err);
      setError(err.message);
      setIsTracking(false);
    }
  }, [isTracking, driverId, requestPermission, updateLocation]);

  // ============================================
  // STOP TRACKING
  // ============================================
  const stopTracking = useCallback(async () => {
    if (!isTracking) return;

    try {
      setIsTracking(false);

      // Remove location watcher
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
        locationSubscriptionRef.current = null;
      }

      // Update status to OFFLINE in Supabase
      if (driverId && supabase) {
        await supabase
          .from('driver_locations')
          .update({ driver_status: 'OFFLINE' })
          .eq('driver_id', driverId);
      }

      // Update backend status
      await axiosClient.post(`${endpoints.driver.location}/status?status=OFFLINE`);

      console.log('✅ Location tracking stopped');
    } catch (err) {
      console.error('Error stopping tracking:', err);
    }

  }, [isTracking, driverId]);

  // ============================================
  // SIMULATION
  // ============================================
  const stopSimulation = useCallback(() => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
      setIsSimulating(false);
      console.log('🛑 Simulation stopped');
    }
  }, []);

  const simulateRoute = useCallback((points, duration = 30000) => {
    if (!driverId || !points || points.length === 0) {
      console.warn('Cannot start simulation: missing driverId or points');
      return;
    }

    stopSimulation(); // Stop any existing simulation

    // Fixed 5-second interval as requested
    const INTERVAL_MS = 5000;
    
    // Calculate how many points to skip per interval to complete in 'duration' ms
    const totalIntervals = Math.floor(duration / INTERVAL_MS);
    const pointsPerInterval = Math.max(1, Math.floor(points.length / totalIntervals));
    
    let currentIndex = 0;

    console.log(`🚗 Starting simulation:`, {
      totalPoints: points.length,
      duration: `${duration}ms`,
      interval: `${INTERVAL_MS}ms`,
      pointsPerInterval,
      firstPoint: points[0],
      lastPoint: points[points.length - 1],
    });

    setIsSimulating(true);

    // Update immediately with first point
    const firstPoint = points[0];
    updateLocation(firstPoint.latitude, firstPoint.longitude);

    simulationIntervalRef.current = setInterval(async () => {
      currentIndex += pointsPerInterval;

      if (currentIndex >= points.length) {
        // Move to last point and complete
        const lastPoint = points[points.length - 1];
        try {
          await updateLocation(lastPoint.latitude, lastPoint.longitude);
          console.log('✅ Simulation complete at:', lastPoint);
        } catch (err) {
          console.error('Final location update error:', err);
        }
        stopSimulation();
        return;
      }

      const point = points[currentIndex];
      try {
        await updateLocation(point.latitude, point.longitude);
        console.log(`📍 Simulation step ${currentIndex}/${points.length}:`, {
          lat: point.latitude.toFixed(5),
          lng: point.longitude.toFixed(5),
        });
      } catch (err) {
        console.error('Simulation update error:', err);
      }
    }, INTERVAL_MS);

  }, [driverId, updateLocation, stopSimulation]);

  // ============================================
  // AUTO START/STOP BASED ON ONLINE STATUS
  // ============================================
  useEffect(() => {
    if (isOnline && driverId) {
      startTracking();
    } else if (!isOnline && isTracking) {
      stopTracking();
    }
  }, [isOnline, driverId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
      }
    };
  }, []);

  // ============================================
  // GET CURRENT LOCATION (one-time)
  // ============================================
  const getCurrentLocation = useCallback(async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return null;

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      // Also update currentLocation state so it's available for map rendering
      setCurrentLocation(coords);
      
      return coords;
    } catch (err) {
      console.error('Error getting location:', err);
      return null;
    }
  }, [requestPermission]);

  // ============================================
  // RETURN
  // ============================================
  return {
    isTracking,
    isSimulating,
    currentLocation,
    error,
    driverId,
    startTracking,
    stopTracking,
    getCurrentLocation,
    updateLocation,
    simulateRoute,
    stopSimulation,
  };
};

export default useDriverLocation;
