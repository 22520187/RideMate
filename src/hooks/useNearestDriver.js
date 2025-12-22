import { useState, useEffect, useRef } from 'react';
import supabase from '../config/supabaseClient';

/**
 * Hook để tìm và lắng nghe driver gần nhất real-time
 * @param {Object} pickupLocation - {latitude, longitude} của điểm đón
 * @param {number} radiusKm - Bán kính tìm kiếm (km)
 * @returns {Object} - {nearestDriver, allDrivers, loading, error}
 */
const useNearestDriver = (pickupLocation, radiusKm = 7) => {
  const [nearestDriver, setNearestDriver] = useState(null);
  const [allDrivers, setAllDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const subscriptionRef = useRef(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setError("Supabase is not configured");
      return;
    }

    if (!pickupLocation?.latitude || !pickupLocation?.longitude) {
      setLoading(false);
      return;
    }

    // Fetch initial drivers
    const fetchInitialDrivers = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('driver_locations')
          .select('*')
          .eq('driver_status', 'ONLINE');

        if (fetchError) throw fetchError;

        const driversWithDistance = calculateDriverDistances(data, pickupLocation);
        const nearby = driversWithDistance.filter(d => d.distance <= radiusKm);
        
        setAllDrivers(nearby);
        
        // Tìm driver gần nhất
        if (nearby.length > 0) {
          const nearest = nearby.reduce((prev, current) => 
            prev.distance < current.distance ? prev : current
          );
          setNearestDriver(nearest);
        } else {
          setNearestDriver(null);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching drivers:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Subscribe to real-time updates
    const subscribeToDrivers = () => {
      subscriptionRef.current = supabase
        .channel('driver_locations_nearest')
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
            console.log('✅ Subscribed to nearest driver updates');
          }
        });
    };

    const handleRealtimeUpdate = (payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      if (eventType === 'INSERT' || eventType === 'UPDATE') {
        const driverWithDistance = calculateDriverDistance(newRecord, pickupLocation);
        
        if (driverWithDistance.distance <= radiusKm) {
          setAllDrivers((prev) => {
            const existingIndex = prev.findIndex((d) => d.driver_id === newRecord.driver_id);
            let updated;
            
            if (existingIndex >= 0) {
              updated = [...prev];
              updated[existingIndex] = driverWithDistance;
            } else {
              updated = [...prev, driverWithDistance];
            }
            
            // Cập nhật nearest driver
            const nearest = updated.reduce((prev, current) => 
              prev.distance < current.distance ? prev : current
            );
            setNearestDriver(nearest);
            
            return updated;
          });
        } else {
          // Driver ra khỏi bán kính
          setAllDrivers((prev) => {
            const filtered = prev.filter((d) => d.driver_id !== newRecord.driver_id);
            
            if (filtered.length > 0) {
              const nearest = filtered.reduce((prev, current) => 
                prev.distance < current.distance ? prev : current
              );
              setNearestDriver(nearest);
            } else {
              setNearestDriver(null);
            }
            
            return filtered;
          });
        }
      } else if (eventType === 'DELETE') {
        setAllDrivers((prev) => {
          const filtered = prev.filter((d) => d.driver_id !== oldRecord.driver_id);
          
          if (filtered.length > 0) {
            const nearest = filtered.reduce((prev, current) => 
              prev.distance < current.distance ? prev : current
            );
            setNearestDriver(nearest);
          } else {
            setNearestDriver(null);
          }
          
          return filtered;
        });
      }
    };

    fetchInitialDrivers();
    subscribeToDrivers();

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [pickupLocation?.latitude, pickupLocation?.longitude, radiusKm]);

  return { nearestDriver, allDrivers, loading, error };
};

/**
 * Tính khoảng cách giữa 2 điểm (Haversine formula)
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

/**
 * Tính khoảng cách cho 1 driver
 */
const calculateDriverDistance = (driver, userLocation) => {
  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    driver.latitude,
    driver.longitude
  );
  
  return {
    ...driver,
    distance: parseFloat(distance.toFixed(2)),
    eta: Math.ceil(distance * 3), // Ước tính 3 phút/km
  };
};

/**
 * Tính khoảng cách cho danh sách drivers
 */
const calculateDriverDistances = (drivers, userLocation) => {
  if (!drivers || !userLocation) return [];
  
  return drivers
    .map(driver => calculateDriverDistance(driver, userLocation))
    .sort((a, b) => a.distance - b.distance);
};

export default useNearestDriver;
