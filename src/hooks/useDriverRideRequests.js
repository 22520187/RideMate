import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabaseClient';
import { getUserData } from '../utils/storage';
import axiosClient from '../api/axiosClient';
import endpoints from '../api/endpoints';

/**
 * Hook để lắng nghe ride requests real-time cho driver
 * Sử dụng Supabase Realtime để nhận thông báo khi có passenger tìm kiếm
 */
export const useDriverRideRequests = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [driverId, setDriverId] = useState(null);

  // Load driver ID
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

  // Fetch pending requests từ backend
  const fetchPendingRequests = useCallback(async () => {
    if (!driverId) return;

    try {
      setLoading(true);
      setError(null);

      // Gọi API để lấy danh sách matches đang WAITING
      const response = await axiosClient.get(endpoints.match.waiting);
      
      if (response?.data?.data) {
        setPendingRequests(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching pending requests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  // Subscribe to real-time updates từ Supabase
  useEffect(() => {
    if (!driverId) return;

    console.log('🔔 Setting up real-time subscription for driver:', driverId);

    // Subscribe to matches table
    const subscription = supabase
      .channel('driver_ride_requests')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'matches',
          // filter: `status=eq.WAITING`, // Removed filter to debug if events are being received at all
        },
        async (payload) => {
          console.log('🔔 New ride request detected:', payload);

          if (payload.eventType === 'INSERT') {
            // Match mới được tạo
            const newMatch = payload.new;
            console.log('📦 New match payload received:', JSON.stringify(newMatch));
            
            // ⚠️ IMPORTANT: Supabase realtime payload doesn't include joined user data
            // We MUST fetch full details from API to get passenger info
            
            // Kiểm tra xem driver có trong danh sách candidates không
            let candidates = [];
            if (newMatch.matched_driver_candidates) {
              if (Array.isArray(newMatch.matched_driver_candidates)) {
                candidates = newMatch.matched_driver_candidates;
              } else if (typeof newMatch.matched_driver_candidates === 'string') {
                try {
                  candidates = JSON.parse(newMatch.matched_driver_candidates);
                } catch (e) {
                  console.error('Error parsing matched_driver_candidates:', e);
                }
              }
            }
            
            console.log(`🔍 Checking driver ${driverId} against candidates:`, candidates);

            // Check using both camelCase (frontend convention) and snake_case (backend convention)
            const isCandidate = candidates.some(c => 
              (c.driverId && Number(c.driverId) === Number(driverId)) || 
              (c.driver_id && Number(c.driver_id) === Number(driverId))
            );
            
            if (isCandidate) {
              console.log('✅ Driver matched! Fetching full details from API...');
              
              // ALWAYS fetch full match details from backend to get passenger info
              try {
                const response = await axiosClient.get(
                  endpoints.match.getById(newMatch.id)
                );
                
                if (response?.data?.data) {
                  const fullMatchData = response.data.data;
                  
                  console.log('📋 Full match data fetched:', {
                    id: fullMatchData.id,
                    passengerName: fullMatchData.passengerName,
                    passengerPhone: fullMatchData.passengerPhone,
                    pickupAddress: fullMatchData.pickupAddress,
                    destinationAddress: fullMatchData.destinationAddress,
                    coin: fullMatchData.coin,
                  });
                  
                  setPendingRequests(prev => {
                    // Check duplicate
                    if (prev.some(req => req.id === newMatch.id)) {
                      console.log('⚠️ Match already in list, skipping');
                      return prev;
                    }
                    console.log('✅ Adding match to pending requests');
                    return [fullMatchData, ...prev];
                  });
                } else {
                  console.error('❌ API response missing data:', response);
                }
              } catch (err) {
                console.error('❌ Error fetching match details:', err.response?.data || err.message);
              }
            } else {
              console.log('⛔ Driver not in candidate list for this match.');
            }
          } else if (payload.eventType === 'UPDATE') {
            // Match được cập nhật
            const updatedMatch = payload.new;
            
            console.log(`🔄 Match ${updatedMatch.id} updated, status: ${updatedMatch.status}`);
            
            if (updatedMatch.status !== 'WAITING') {
              // Match không còn WAITING, remove khỏi list
              console.log(`🗑️ Removing match ${updatedMatch.id} from list (status changed to ${updatedMatch.status})`);
              setPendingRequests(prev => 
                prev.filter(req => req.id !== updatedMatch.id)
              );
            }
          } else if (payload.eventType === 'DELETE') {
            // Match bị xóa
            console.log(`🗑️ Match ${payload.old.id} deleted`);
            setPendingRequests(prev => 
              prev.filter(req => req.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    // Fetch initial data
    fetchPendingRequests();

    // Cleanup
    return () => {
      console.log('🔕 Unsubscribing from ride requests');
      subscription.unsubscribe();
    };
  }, [driverId, fetchPendingRequests]);

  // Accept ride request
  const acceptRide = useCallback(async (matchId) => {
    try {
      const response = await axiosClient.post(
        endpoints.match.accept(matchId)
      );

      if (response?.data?.data) {
        // Remove from pending list
        setPendingRequests(prev => prev.filter(req => req.id !== matchId));
        return { success: true, data: response.data.data };
      }
    } catch (err) {
      console.error('Error accepting ride:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Decline ride request
  const declineRide = useCallback(async (matchId) => {
    try {
      // Just remove from local list (backend will handle timeout)
      setPendingRequests(prev => prev.filter(req => req.id !== matchId));
      return { success: true };
    } catch (err) {
      console.error('Error declining ride:', err);
      return { success: false, error: err.message };
    }
  }, []);

  return {
    pendingRequests,
    loading,
    error,
    acceptRide,
    declineRide,
    refresh: fetchPendingRequests,
    simulateRequest: (fakeRequest) => {
      setPendingRequests(prev => [fakeRequest, ...prev]);
    },
  };
};

export default useDriverRideRequests;
