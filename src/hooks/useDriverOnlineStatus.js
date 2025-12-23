import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabaseClient';
import axiosClient from '../api/axiosClient';
import endpoints from '../api/endpoints';

const STORAGE_KEY = '@driver_online_status';

export const useDriverOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [lastLocation, setLastLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load status from storage on mount
  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonValue != null) {
        const data = JSON.parse(jsonValue);
        // Only restore if less than 24 hours old
        const timestamp = new Date(data.timestamp);
        const now = new Date();
        const diffHours = (now - timestamp) / 1000 / 60 / 60;
        
        if (diffHours < 24) {
          setIsOnline(data.online);
          setLastLocation(data.lastLocation);
        } else {
          // Reset if too old
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      console.error('Failed to load driver status', e);
    } finally {
      setLoading(false);
    }
  };

  const setOnlineStatus = async (status, location = null) => {
    try {
      setIsOnline(status);
      if (location) setLastLocation(location);

      const data = {
        online: status,
        timestamp: new Date().toISOString(),
        lastLocation: location || lastLocation,
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      
      // Update backend
      if (status) {
        await axiosClient.post(`${endpoints.driver.location}/status?status=ONLINE`);
      } else {
        await axiosClient.post(`${endpoints.driver.location}/status?status=OFFLINE`);
      }
      
    } catch (e) {
      console.error('Failed to save driver status', e);
    }
  };

  return {
    isOnline,
    lastLocation,
    loading,
    setOnlineStatus,
  };
};

export default useDriverOnlineStatus;
