import { useState, useEffect, useRef } from 'react';
import supabase from '../config/supabaseClient';

const useDriverLocations = (userLocation, radiusKm = 7) => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const subscriptionRef = useRef(null);

  useEffect(() => {
    if (!userLocation?.latitude || !userLocation?.longitude) {
      setLoading(false);
      return;
    }

    const fetchInitialDrivers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('driver_locations')
          .select('*')
          .eq('driver_status', 'ONLINE');

        if (error) throw error;

        const nearbyDrivers = filterDriversByRadius(data, userLocation, radiusKm);
        setDrivers(nearbyDrivers);
        setError(null);
      } catch (err) {
        console.error('Error fetching drivers:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const subscribeToDrivers = () => {
      subscriptionRef.current = supabase
        .channel('driver_locations_channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'driver_locations',
            filter: 'driver_status=eq.ONLINE',
          },
          (payload) => {
            handleRealtimeUpdate(payload);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Subscribed to driver locations');
          }
        });
    };

    const handleRealtimeUpdate = (payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      if (eventType === 'INSERT' || eventType === 'UPDATE') {
        const isNearby = isWithinRadius(
          userLocation,
          { latitude: newRecord.latitude, longitude: newRecord.longitude },
          radiusKm
        );

        if (isNearby) {
          setDrivers((prev) => {
            const existingIndex = prev.findIndex((d) => d.driver_id === newRecord.driver_id);
            if (existingIndex >= 0) {
              const updated = [...prev];
              updated[existingIndex] = newRecord;
              return updated;
            }
            return [...prev, newRecord];
          });
        } else {
          setDrivers((prev) => prev.filter((d) => d.driver_id !== newRecord.driver_id));
        }
      } else if (eventType === 'DELETE') {
        setDrivers((prev) => prev.filter((d) => d.driver_id !== oldRecord.driver_id));
      }
    };

    fetchInitialDrivers();
    subscribeToDrivers();

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [userLocation?.latitude, userLocation?.longitude, radiusKm]);

  return { drivers, loading, error };
};

const isWithinRadius = (point1, point2, radiusKm) => {
  const R = 6371;
  const dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const dLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;
  const lat1 = (point1.latitude * Math.PI) / 180;
  const lat2 = (point2.latitude * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance <= radiusKm;
};

const filterDriversByRadius = (drivers, userLocation, radiusKm) => {
  if (!drivers || !userLocation) return [];
  return drivers.filter((driver) =>
    isWithinRadius(userLocation, { latitude: driver.latitude, longitude: driver.longitude }, radiusKm)
  );
};

export default useDriverLocations;
