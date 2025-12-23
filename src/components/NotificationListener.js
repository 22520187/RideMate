import { useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';
import { supabase } from '../config/supabaseClient';
import AsyncStorageService from '../services/AsyncStorageService';

/**
 * Global notification listener that shows toast notifications
 */
const NotificationListener = () => {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const user = await AsyncStorageService.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!userId || !supabase) return;

    console.log('🔔 NotificationListener: Setting up real-time listener for user', userId);

    const channel = supabase
      .channel(`notifications_listener_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('🔔 New notification received:', payload);
          const notification = payload.new;
          
          // Show toast for important notification types
          if (shouldShowNotification(notification.type)) {
            Toast.show({
              type: getToastType(notification.type),
              text1: notification.title || 'Thông báo',
              text2: notification.body || 'Bạn có thông báo mới',
              position: 'top',
              visibilityTime: 4000,
              autoHide: true,
              topOffset: 50,
              props: {
                style: {
                  width: '95%',
                  alignSelf: 'center',
                }
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔔 NotificationListener: Cleaning up');
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return null; // This is a non-visual component
};

/**
 * Determine if a notification type should trigger a toast
 */
const shouldShowNotification = (type) => {
  const notificationTypes = [
    'MATCH_ACCEPTED',      // Driver accepted your booking
    'MATCH_CANCELLED',     // Driver cancelled
    'TRIP_STARTED',        // Trip has started
    'RIDE_COMPLETED',      // Ride completed
    'DRIVER_ARRIVED',      // Driver arrived at pickup
    'MATCH_REQUEST',       // New booking request (for driver)
  ];
  
  return notificationTypes.includes(type);
};

/**
 * Get toast type based on notification type
 */
const getToastType = (type) => {
  switch (type) {
    case 'MATCH_ACCEPTED':
    case 'RIDE_COMPLETED':
      return 'success';
    case 'MATCH_CANCELLED':
      return 'error';
    case 'MATCH_REQUEST':
    case 'DRIVER_ARRIVED':
    case 'TRIP_STARTED':
    default:
      return 'info';
  }
};

export default NotificationListener;
