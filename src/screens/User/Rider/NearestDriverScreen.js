import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import COLORS from '../../../constant/colors';
import useNearestDriver from '../../../hooks/useNearestDriver';
import axiosClient from '../../../api/axiosClient';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

/**
 * Màn hình hiển thị driver gần nhất và cho phép approve
 */
const NearestDriverScreen = ({ navigation, route }) => {
  const { pickupLocation, destinationLocation, rideDetails } = route.params || {};
  
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Sử dụng hook để lấy driver gần nhất real-time
  const { nearestDriver, allDrivers, loading, error } = useNearestDriver(
    pickupLocation,
    7 // 7km radius
  );

  useEffect(() => {
    if (nearestDriver) {
      setSelectedDriver(nearestDriver);
    }
  }, [nearestDriver]);

  const handleApproveDriver = async () => {
    if (!selectedDriver) {
      Alert.alert('Lỗi', 'Vui lòng chọn tài xế');
      return;
    }

    try {
      setIsCreatingSession(true);

      // Tạo ride session với driver đã chọn
      const response = await axiosClient.post('/api/matches/book', {
        pickupAddress: rideDetails?.from || '',
        destinationAddress: rideDetails?.to || '',
        pickupLatitude: pickupLocation?.latitude,
        pickupLongitude: pickupLocation?.longitude,
        destinationLatitude: destinationLocation?.latitude,
        destinationLongitude: destinationLocation?.longitude,
        preferredDriverId: selectedDriver.driver_id, // Gợi ý driver cho backend
      });

      const matchData = response?.data?.data;

      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'Đã tạo chuyến đi!',
      });

      // Navigate to matched ride screen
      navigation.replace('MatchedRideScreen', {
        matchId: matchData.id,
        driverId: selectedDriver.driver_id,
        driverName: selectedDriver.driver_name || 'Tài xế',
        driverLocation: {
          latitude: selectedDriver.latitude,
          longitude: selectedDriver.longitude,
        },
        from: rideDetails?.from,
        to: rideDetails?.to,
        originCoordinate: pickupLocation,
        destinationCoordinate: destinationLocation,
        distance: selectedDriver.distance,
        eta: selectedDriver.eta,
      });
    } catch (error) {
      console.error('Error creating ride session:', error);
      Alert.alert(
        'Lỗi',
        error.response?.data?.message || 'Không thể tạo chuyến đi. Vui lòng thử lại.'
      );
    } finally {
      setIsCreatingSession(false);
    }
  };

  const renderDriverCard = (driver, isSelected) => (
    <TouchableOpacity
      key={driver.driver_id}
      style={[
        styles.driverCard,
        isSelected && styles.driverCardSelected,
      ]}
      onPress={() => setSelectedDriver(driver)}
      activeOpacity={0.7}
    >
      <View style={styles.driverCardContent}>
        <Image
          source={{
            uri: driver.profile_picture_url || `https://api.dicebear.com/7.x/avataaars/png?seed=${driver.driver_id}`,
          }}
          style={styles.driverAvatar}
        />
        
        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>
            {driver.driver_name || `Tài xế #${driver.driver_id}`}
          </Text>
          
          <View style={styles.driverStats}>
            <MaterialIcons name="star" size={16} color="#FFD700" />
            <Text style={styles.driverRating}>4.8</Text>
            <Text style={styles.driverReviews}>(120 đánh giá)</Text>
          </View>

          <View style={styles.driverDistance}>
            <MaterialIcons name="location-on" size={16} color={COLORS.PRIMARY} />
            <Text style={styles.distanceText}>
              {driver.distance} km • {driver.eta} phút
            </Text>
          </View>
        </View>

        {isSelected && (
          <View style={styles.selectedBadge}>
            <MaterialIcons name="check-circle" size={24} color={COLORS.GREEN} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Đang tìm tài xế gần bạn...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={COLORS.RED} />
          <Text style={styles.errorText}>Có lỗi xảy ra</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (allDrivers.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color={COLORS.BLACK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tìm tài xế</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.emptyContainer}>
          <MaterialIcons name="directions-car" size={64} color={COLORS.GRAY} />
          <Text style={styles.emptyText}>Không có tài xế nào gần bạn</Text>
          <Text style={styles.emptySubtext}>
            Vui lòng thử lại sau hoặc mở rộng phạm vi tìm kiếm
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.BLACK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chọn tài xế</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <MaterialIcons name="info" size={20} color={COLORS.PRIMARY} />
        <Text style={styles.infoBannerText}>
          Tìm thấy {allDrivers.length} tài xế gần bạn
        </Text>
      </View>

      {/* Drivers List */}
      <ScrollView
        style={styles.driversList}
        showsVerticalScrollIndicator={false}
      >
        {allDrivers.map((driver) =>
          renderDriverCard(driver, selectedDriver?.driver_id === driver.driver_id)
        )}
      </ScrollView>

      {/* Action Button */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[
            styles.approveButton,
            (!selectedDriver || isCreatingSession) && styles.approveButtonDisabled,
          ]}
          onPress={handleApproveDriver}
          disabled={!selectedDriver || isCreatingSession}
        >
          {isCreatingSession ? (
            <ActivityIndicator size="small" color={COLORS.WHITE} />
          ) : (
            <>
              <MaterialIcons name="check" size={24} color={COLORS.WHITE} />
              <Text style={styles.approveButtonText}>
                Xác nhận tài xế
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.BLACK,
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.GRAY,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.BLACK,
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.BLACK,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  infoBannerText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
  driversList: {
    flex: 1,
    padding: 16,
  },
  driverCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  driverCardSelected: {
    borderColor: COLORS.GREEN,
    backgroundColor: '#F0FFF4',
  },
  driverCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  driverInfo: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.BLACK,
    marginBottom: 4,
  },
  driverStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  driverRating: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.BLACK,
    marginLeft: 4,
  },
  driverReviews: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginLeft: 4,
  },
  driverDistance: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    marginLeft: 4,
    fontWeight: '500',
  },
  selectedBadge: {
    marginLeft: 8,
  },
  actionContainer: {
    padding: 16,
    backgroundColor: COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_LIGHT,
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.GREEN,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  approveButtonDisabled: {
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  approveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.WHITE,
  },
});

export default NearestDriverScreen;
