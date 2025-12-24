import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../config/supabaseClient';
import axiosClient from '../api/axiosClient';
import endpoints from '../api/endpoints';
import polyline from '@mapbox/polyline';

/**
 * Unified hook for managing ride session state
 * Single source of truth for ride status, driver location, and route
 * 
 * @param {number|null} matchId - The ID of the match/ride
 * @param {Object} options - Configuration options
 * @param {boolean} options.isDriver - Whether current user is the driver
 * @param {number} options.driverId - Driver's user ID (for passenger to track)
 * @returns {Object} Ride session state and actions
 */
const useRideSession = (matchId, { isDriver = false, driverId = null } = {}) => {
  // ============================================
  // STATE
  // ============================================
  const [rideStatus, setRideStatus] = useState(null); // WAITING | ACCEPTED | IN_PROGRESS | COMPLETED | CANCELLED
  const [driverLocation, setDriverLocation] = useState(null);
  const [routePolyline, setRoutePolyline] = useState(null);
  const [routePoints, setRoutePoints] = useState([]);
  const [driverArrived, setDriverArrived] = useState(false);
  const [destinationArrived, setDestinationArrived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Match data
  const [matchData, setMatchData] = useState(null);

  // Refs to prevent duplicate notifications
  const hasNotifiedArrival = useRef(false);
  const hasNotifiedDestination = useRef(false);
  const matchSubscriptionRef = useRef(null);
  const driverLocationSubscriptionRef = useRef(null);

  // ============================================
  // FETCH INITIAL DATA
  // ============================================
  const fetchMatchData = useCallback(async () => {
    if (!matchId) return;

    try {
      setLoading(true);
      const response = await axiosClient.get(endpoints.match.getById(matchId));
      
      if (response?.data?.data) {
        const data = response.data.data;
        setMatchData(data);
        setRideStatus(data.status);
        setDriverArrived(data.driverArrived || false);
        
        // Decode route polyline if available
        if (data.routePolyline) {
          setRoutePolyline(data.routePolyline);
          try {
            const decoded = polyline.decode(data.routePolyline);
            setRoutePoints(decoded.map(p => ({ latitude: p[0], longitude: p[1] })));
          } catch (e) {
            console.warn('Failed to decode polyline:', e);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching match data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  // Fetch on mount
  useEffect(() => {
    fetchMatchData();
  }, [fetchMatchData]);

  // ============================================
  // SUPABASE REALTIME SUBSCRIPTIONS
  // ============================================

  // Subscribe to match changes
  useEffect(() => {
    if (!matchId) return;

    console.log('🔔 Subscribing to match updates:', matchId);

    matchSubscriptionRef.current = supabase
      .channel(`match-${matchId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'matches',
        filter: `id=eq.${matchId}`,
      }, (payload) => {
        console.log('📦 Match update received:', payload.new);
        const updated = payload.new;
        
        // Prevent status rollback: Don't update if going backwards
        // Status progression: PENDING → WAITING → ACCEPTED → IN_PROGRESS → COMPLETED/CANCELLED
        const statusPriority = {
          'PENDING': 0,
          'WAITING': 1,
          'ACCEPTED': 2,
          'IN_PROGRESS': 3,
          'COMPLETED': 4,
          'CANCELLED': 4,
        };
        
        const currentPriority = statusPriority[rideStatus] || 0;
        const newPriority = statusPriority[updated.status] || 0;
        
        // Only update if new status has higher or equal priority (no rollback)
        if (newPriority >= currentPriority) {
          if (updated.status !== rideStatus) {
            console.log(`✅ Status update: ${rideStatus} → ${updated.status}`);
            setRideStatus(updated.status);
          }
        } else {
          console.warn(`⚠️ Ignoring status rollback: ${updated.status} (priority ${newPriority}) < ${rideStatus} (priority ${currentPriority})`);
        }
        
        if (updated.driver_arrived && !hasNotifiedArrival.current) {
          setDriverArrived(true);
        }
        
        // Sync route polyline from driver
        if (updated.route_polyline && (!isDriver || !routePolyline)) {
          setRoutePolyline(updated.route_polyline);
          try {
            const decoded = polyline.decode(updated.route_polyline);
            setRoutePoints(decoded.map(p => ({ latitude: p[0], longitude: p[1] })));
            console.log('✅ Route synced from Supabase:', decoded.length, 'points');
          } catch (e) {
            console.warn('Failed to decode polyline:', e);
          }
        }
      })
      .subscribe((status) => {
        console.log('📡 Match subscription status:', status);
      });

    return () => {
      if (matchSubscriptionRef.current) {
        console.log('🔕 Unsubscribing from match updates');
        supabase.removeChannel(matchSubscriptionRef.current);
      }
    };
  }, [matchId, isDriver, rideStatus]);

  // Subscribe to driver location updates (for passenger)
  useEffect(() => {
    const targetDriverId = driverId || matchData?.driverId;
    
    // Log để debug
    console.log('🔍 useRideSession driver location setup:', {
      isDriver,
      driverId,
      matchDataDriverId: matchData?.driverId,
      targetDriverId,
    });
    
    if (isDriver || !targetDriverId) {
      console.log('⏭️ Skipping driver location subscription:', isDriver ? 'is driver' : 'no targetDriverId');
      return;
    }

    console.log('🔔 Subscribing to driver location for driverId:', targetDriverId);

    // Fetch initial driver location
    const fetchDriverLocation = async () => {
      try {
        const { data, error } = await supabase
          .from('driver_locations')
          .select('driver_id, latitude, longitude, last_updated, driver_status')
          .eq('driver_id', targetDriverId)
          .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no data

        if (error) {
          console.error('❌ Error fetching driver location:', error);
          return;
        }

        if (data) {
          console.log('📍 Initial driver location fetched:', {
            driverId: data.driver_id,
            lat: data.latitude,
            lng: data.longitude,
            status: data.driver_status,
          });
          setDriverLocation({
            latitude: data.latitude,
            longitude: data.longitude,
          });
        } else {
          console.warn('⚠️ No driver location found for driverId:', targetDriverId);
        }
      } catch (err) {
        console.error('❌ Exception fetching driver location:', err);
      }
    };

    fetchDriverLocation();

    // Subscribe to realtime updates (both UPDATE and INSERT in case driver just came online)
    const channel = supabase
      .channel(`driver-location-${targetDriverId}-${Date.now()}`)
      .on('postgres_changes', {
        event: '*', // Listen for all events (INSERT, UPDATE)
        schema: 'public',
        table: 'driver_locations',
        filter: `driver_id=eq.${targetDriverId}`,
      }, (payload) => {
        const newData = payload.new;
        console.log('📍 Driver location realtime event:', {
          eventType: payload.eventType,
          driverId: newData?.driver_id,
          lat: newData?.latitude?.toFixed(5),
          lng: newData?.longitude?.toFixed(5),
        });
        
        if (newData?.latitude && newData?.longitude) {
          setDriverLocation({
            latitude: newData.latitude,
            longitude: newData.longitude,
          });
        }
      })
      .subscribe((status) => {
        console.log('📡 Driver location subscription status:', status);
      });

    driverLocationSubscriptionRef.current = channel;

    return () => {
      if (driverLocationSubscriptionRef.current) {
        console.log('🔕 Unsubscribing from driver location');
        supabase.removeChannel(driverLocationSubscriptionRef.current);
        driverLocationSubscriptionRef.current = null;
      }
    };
  }, [isDriver, driverId, matchData?.driverId]);

  // ============================================
  // ACTIONS
  // ============================================

  // Accept ride (Driver only)
  const acceptRide = useCallback(async () => {
    if (!matchId || !isDriver) return { success: false, error: 'Invalid operation' };

    try {
      const response = await axiosClient.post(endpoints.match.accept(matchId));
      if (response?.data?.data) {
        setRideStatus('ACCEPTED');
        setMatchData(prev => ({ ...prev, ...response.data.data }));
        return { success: true, data: response.data.data };
      }
    } catch (err) {
      console.error('Error accepting ride:', err);
      return { success: false, error: err.message };
    }
  }, [matchId, isDriver]);

  // Start ride (Driver only - after arriving at pickup)
  const startRide = useCallback(async () => {
    if (!matchId || !isDriver) return { success: false, error: 'Invalid operation' };

    try {
      // Use endpoints.match.status instead of updateStatus which doesn't exist
      const response = await axiosClient.put(endpoints.match.status(matchId), {
        status: 'IN_PROGRESS',
      });
      if (response?.data?.data) {
        setRideStatus('IN_PROGRESS');
        setMatchData(prev => ({ ...prev, ...response.data.data }));
        setRoutePolyline(null); // Clear old approach route
        setRoutePoints([]);
        hasNotifiedArrival.current = true;
        
        // ✅ Update Supabase to trigger realtime for passenger
        try {
          await supabase
            .from('matches')
            .update({ status: 'IN_PROGRESS' })
            .eq('id', matchId);
          console.log('✅ Match status updated in Supabase: IN_PROGRESS');
        } catch (supabaseErr) {
          console.warn('⚠️ Failed to update Supabase, but API succeeded:', supabaseErr);
        }
        
        return { success: true, data: response.data.data };
      }
    } catch (err) {
      console.error('Error starting ride:', err);
      return { success: false, error: err.message };
    }
  }, [matchId, isDriver]);

  // Complete ride (Driver only)
  const completeRide = useCallback(async () => {
    if (!matchId || !isDriver) return { success: false, error: 'Invalid operation' };

    try {
      const response = await axiosClient.put(endpoints.match.status(matchId), {
        status: 'COMPLETED',
      });
      if (response?.data?.data) {
        setRideStatus('COMPLETED');
        setMatchData(prev => ({ ...prev, ...response.data.data }));
        hasNotifiedDestination.current = true;
        
        // ✅ Update Supabase to trigger realtime
        try {
          await supabase
            .from('matches')
            .update({ status: 'COMPLETED' })
            .eq('id', matchId);
          console.log('✅ Match status updated in Supabase: COMPLETED');
        } catch (supabaseErr) {
          console.warn('⚠️ Failed to update Supabase:', supabaseErr);
        }
        
        return { success: true, data: response.data.data };
      }
    } catch (err) {
      console.error('Error completing ride:', err);
      return { success: false, error: err.message };
    }
  }, [matchId, isDriver]);

  // Cancel ride
  const cancelRide = useCallback(async () => {
    if (!matchId) return { success: false, error: 'Invalid operation' };

    try {
      const response = await axiosClient.post(endpoints.match.cancel(matchId));
      if (response?.data) {
        setRideStatus('CANCELLED');
        
        // ✅ Update Supabase to trigger realtime
        try {
          await supabase
            .from('matches')
            .update({ status: 'CANCELLED' })
            .eq('id', matchId);
          console.log('✅ Match status updated in Supabase: CANCELLED');
        } catch (supabaseErr) {
          console.warn('⚠️ Failed to update Supabase:', supabaseErr);
        }
        
        return { success: true };
      }
    } catch (err) {
      console.error('Error cancelling ride:', err);
      return { success: false, error: err.message };
    }
  }, [matchId]);

  // Update route (Driver only - for syncing truncated route)
  const updateRoute = useCallback(async (points) => {
    if (!matchId || !isDriver || !points || points.length === 0) return;

    try {
      const encoded = polyline.encode(points.map(p => [p.latitude, p.longitude]));
      
      await supabase
        .from('matches')
        .update({ route_polyline: encoded })
        .eq('id', matchId);

      setRoutePolyline(encoded);
      setRoutePoints(points);
      console.log('✅ Route updated to Supabase:', points.length, 'points');
    } catch (err) {
      console.error('Error updating route:', err);
    }
  }, [matchId, isDriver]);

  // Mark driver arrived at pickup (Driver only)
  const markDriverArrived = useCallback(async () => {
    if (!matchId || !isDriver || hasNotifiedArrival.current) return;

    try {
      hasNotifiedArrival.current = true;
      setDriverArrived(true);

      await supabase
        .from('matches')
        .update({ driver_arrived: true })
        .eq('id', matchId);

      console.log('✅ Driver arrived status updated');
    } catch (err) {
      console.error('Error marking driver arrived:', err);
    }
  }, [matchId, isDriver]);

  // Mark destination arrived
  const markDestinationArrived = useCallback(() => {
    if (hasNotifiedDestination.current) return;
    hasNotifiedDestination.current = true;
    setDestinationArrived(true);
    console.log('🏁 Destination arrived marked');
  }, []);

  // ============================================
  // RETURN
  // ============================================
  return {
    // State
    rideStatus,
    driverLocation,
    routePolyline,
    routePoints,
    driverArrived,
    destinationArrived,
    matchData,
    loading,
    error,

    // Actions
    acceptRide,
    startRide,
    completeRide,
    cancelRide,
    updateRoute,
    markDriverArrived,
    markDestinationArrived,
    refresh: fetchMatchData,
  };
};

export default useRideSession;
