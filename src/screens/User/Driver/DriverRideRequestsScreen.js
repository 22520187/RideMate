import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../../constant/colors';
import useDriverRideRequests from '../../../hooks/useDriverRideRequests';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import axiosClient from '../../../api/axiosClient';
import SCREENS from '../..';
import { geocodeAddress } from '../../../config/maps';

/**
 * Màn hình hiển thị ride requests cho driver
 * Driver sẽ thấy danh sách passengers đang tìm kiếm và có thể accept/decline
 */
const DriverRideRequestsScreen = () => {
  const navigation = useNavigation();
  const [debugAddress, setDebugAddress] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const {
    pendingRequests,
    loading,
    error,
    acceptRide,
    declineRide,
    refresh,
    simulateRequest,
  } = useDriverRideRequests();

  const [refreshing, setRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);

  useEffect(() => {
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error,
      });
    }
  }, [error]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleUpdateLocation = async () => {
    try {
      if (!debugAddress) {
        Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Vui lòng nhập địa chỉ' });
        return;
      }

      const { latitude, longitude } = await geocodeAddress(debugAddress);
      
      await axiosClient.post('/driver/location', {
        latitude,
        longitude,
      });
      
      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: `Đã cập nhật vị trí: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: err.message || 'Không tìm thấy địa chỉ',
      });
    }
  };

  const handleSimulate = () => {
    const fakeId = Math.floor(Math.random() * 1000) + 100;
    const fakeRequest = {
      id: fakeId,
      passengerName: 'Nguyễn Văn Test',
      passengerAvatar: null, // Test placeholder logic
      pickupAddress: '123 Đường Test, Quận 1, TP.HCM',
      destinationAddress: '456 Đường Mẫu, Quận 3, TP.HCM',
      pickupLatitude: 11.088246,
      pickupLongitude: 106.513808,
      destinationLatitude: 11.085556,
      destinationLongitude: 106.515353,
      coin: 50,
      createdAt: new Date().toISOString(),
      status: 'WAITING',
    };
    simulateRequest(fakeRequest);
    Toast.show({
      type: 'info',
      text1: 'Giả lập',
      text2: 'Đã thêm yêu cầu test',
    });
  };

  const handleAcceptRide = async (request) => {
    Alert.alert(
      'Xác nhận nhận chuyến',
      `Bạn có chắc muốn nhận chuyến từ ${request.pickupAddress} đến ${request.destinationAddress}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Nhận chuyến',
          onPress: async () => {
            setAcceptingId(request.id);
            
            const result = await acceptRide(request.id);
            
            if (result.success) {
              Toast.show({
                type: 'success',
                text1: 'Thành công',
                text2: 'Đã nhận chuyến!',
              });

              // Navigate to MatchedRideScreen (shared screen for both driver and passenger)
              navigation.navigate(SCREENS.MATCHED_RIDE, {
                rideSession: result.data,
                isDriver: true, // Important: indicates this is driver view
              });
            } else {
              Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: result.error || 'Không thể nhận chuyến',
              });
            }
            
            setAcceptingId(null);
          },
        },
      ]
    );
  };

  const handleDeclineRide = async (request) => {
    const result = await declineRide(request.id);
    
    if (result.success) {
      Toast.show({
        type: 'info',
        text1: 'Đã từ chối',
        text2: 'Bạn đã từ chối chuyến này',
      });
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const renderRideRequest = ({ item }) => {
    const distance = calculateDistance(
      item.pickupLatitude,
      item.pickupLongitude,
      item.destinationLatitude,
      item.destinationLongitude
    );

    const isAccepting = acceptingId === item.id;

    return (
      <View style={styles.requestCard}>
        {/* Header */}
        <View style={styles.requestHeader}>
          <View style={styles.passengerInfo}>
            {item.passengerAvatar ? (
              <Image source={{ uri: item.passengerAvatar }} style={styles.avatar} />
            ) : (
               <View style={styles.avatarPlaceholder}>
                 <Text style={styles.avatarText}>
                   {(item.passengerName || 'K').charAt(0).toUpperCase()}
                 </Text>
               </View>
            )}
            <View style={styles.passengerDetails}>
              <Text style={styles.passengerName}>
                {item.passengerName || 'Khách hàng'}
              </Text>
              <Text style={styles.requestTime}>
                {new Date(item.createdAt).toLocaleTimeString('vi-VN')}
              </Text>
              {/* Coin Display */}
              <View style={styles.coinContainer}>
                 <Ionicons name="wallet-outline" size={14} color={COLORS.WARNING} />
                 <Text style={styles.coinText}>{item.coin || 0} xu</Text>
              </View>
            </View>
          </View>
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>{distance.toFixed(1)} km</Text>
          </View>
        </View>

        {/* Route Info */}
        <View style={styles.routeContainer}>
          {/* Pickup */}
          <View style={styles.locationRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="location" size={20} color={COLORS.SUCCESS} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Điểm đón</Text>
              <Text style={styles.locationAddress} numberOfLines={2}>
                {item.pickupAddress || 'Đang cập nhật...'}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.routeDivider}>
            <View style={styles.dottedLine} />
          </View>

          {/* Destination */}
          <View style={styles.locationRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="flag" size={20} color={COLORS.ERROR} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Điểm đến</Text>
              <Text style={styles.locationAddress} numberOfLines={2}>
                {item.destinationAddress || 'Đang cập nhật...'}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.declineButton]}
            onPress={() => handleDeclineRide(item)}
            disabled={isAccepting}
          >
            <Ionicons name="close-circle" size={20} color={COLORS.ERROR} />
            <Text style={styles.declineButtonText}>Từ chối</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.acceptButton]}
            onPress={() => handleAcceptRide(item)}
            disabled={isAccepting}
          >
            {isAccepting ? (
              <ActivityIndicator size="small" color={COLORS.WHITE} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.WHITE} />
                <Text style={styles.acceptButtonText}>Nhận chuyến</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Yêu cầu chuyến đi</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity onPress={() => setShowDebug(!showDebug)}>
             <Ionicons name="bug-outline" size={24} color={COLORS.GRAY} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color={COLORS.PRIMARY} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Debug Panel */}
      {showDebug && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Debug Tools</Text>
          <View style={styles.debugRow}>
            <TextInput
              style={[styles.debugInput, { flex: 2 }]}
              value={debugAddress}
              onChangeText={setDebugAddress}
              placeholder="Nhập địa chỉ (VD: Chợ Bến Thành)"
            />
          </View>
          <View style={styles.debugRow}>
            <TouchableOpacity style={styles.debugButton} onPress={handleUpdateLocation}>
               <Text style={styles.debugButtonText}>Update Location</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.debugButton, { backgroundColor: COLORS.WARNING }]} onPress={handleSimulate}>
               <Text style={styles.debugButtonText}>Giả lập</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* List */}
      {pendingRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          {/* USER REQUESTED TO REMOVE CAR ICON */}
          <Ionicons name="notifications-off-outline" size={80} color={COLORS.GRAY_LIGHT} />
          <Text style={styles.emptyTitle}>Chưa có yêu cầu nào</Text>
          <Text style={styles.emptySubtitle}>
            Bạn sẽ nhận được thông báo khi có khách hàng tìm kiếm
          </Text>
        </View>
      ) : (
        <FlatList
          data={pendingRequests}
          renderItem={renderRideRequest}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.PRIMARY]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.BLACK,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.GRAY,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.BLACK,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.GRAY,
    textAlign: 'center',
    marginTop: 8,
  },
  listContent: {
    padding: 16,
  },
  requestCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  passengerDetails: {
    marginLeft: 12,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.BLACK,
  },
  requestTime: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginTop: 2,
  },
  distanceBadge: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.PRIMARY,
  },
  routeContainer: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: COLORS.BLACK,
    fontWeight: '500',
  },
  routeDivider: {
    marginLeft: 16,
    marginVertical: 8,
  },
  dottedLine: {
    width: 2,
    height: 20,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.GRAY_LIGHT,
    borderStyle: 'dotted',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  declineButton: {
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.ERROR,
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ERROR,
  },
  acceptButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  coinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  coinText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.WARNING,
    marginLeft: 4,
  },
  debugContainer: {
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: COLORS.GRAY,
  },
  debugRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  debugInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.WHITE,
  },
  debugButton: {
    flex: 1,
    height: 40,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  debugButtonText: {
    color: COLORS.WHITE,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default DriverRideRequestsScreen;
