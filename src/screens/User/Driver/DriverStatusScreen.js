import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import COLORS from '../../../constant/colors';
import DriverLocationService from '../../../services/driverLocationService';
import axiosClient from '../../../api/axiosClient';
import { getProfile } from '../../../services/userService';
import useDriverOnlineStatus from '../../../hooks/useDriverOnlineStatus';
import SCREENS from '../../index';

const DriverStatusScreen = ({ navigation }) => {
  const { isOnline, setOnlineStatus, loading } = useDriverOnlineStatus();
  const [currentLocation, setCurrentLocation] = useState(null);

  const handleToggleStatus = async (value) => {
    if (value) {
      // Going ONLINE
      Alert.alert(
        'Bật chế độ Online',
        'Bạn có muốn bật chế độ online và chuyển đến màn hình bản đồ để nhận chuyến không?',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Đồng ý',
            onPress: () => {
              setOnlineStatus(true);
              navigation.navigate(SCREENS.DRIVER_MAP);
            },
          },
        ]
      );
    } else {
      // Going OFFLINE
      setOnlineStatus(false);
      Alert.alert('Đã Offline', 'Bạn đã tắt chế độ nhận chuyến.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#004553" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trạng thái tài xế</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusIconContainer}>
              <MaterialIcons
                name={isOnline ? 'check-circle' : 'cancel'}
                size={60}
                color={isOnline ? COLORS.GREEN : COLORS.GRAY}
              />
            </View>
            <Text style={styles.statusTitle}>
              {isOnline ? 'Đang Online' : 'Offline'}
            </Text>
            <Text style={styles.statusSubtitle}>
              {isOnline
                ? 'Bạn đang sẵn sàng nhận chuyến'
                : 'Bật để bắt đầu nhận chuyến'}
            </Text>
          </View>

          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>
              {isOnline ? 'Tắt chế độ nhận chuyến' : 'Bật chế độ nhận chuyến'}
            </Text>
            <Switch
              value={isOnline}
              onValueChange={handleToggleStatus}
              disabled={loading}
              trackColor={{ false: '#D1D5DB', true: COLORS.PRIMARY }}
              thumbColor={isOnline ? '#fff' : '#f4f3f4'}
            />
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.PRIMARY} />
              <Text style={styles.loadingText}>Đang cập nhật...</Text>
            </View>
          )}

          {currentLocation && isOnline && (
            <View style={styles.locationInfo}>
              <MaterialIcons name="location-on" size={20} color={COLORS.PRIMARY} />
              <Text style={styles.locationText}>
                Vị trí: {currentLocation.latitude.toFixed(4)},{' '}
                {currentLocation.longitude.toFixed(4)}
              </Text>
            </View>
          )}
        </View>

        {/* View Map Button - Only show when online */}
        {isOnline && (
          <TouchableOpacity
            style={styles.viewRequestsButton}
            onPress={() => navigation.navigate(SCREENS.DRIVER_MAP)}
            activeOpacity={0.8}
          >
            <View style={styles.viewRequestsContent}>
              <MaterialIcons name="map" size={24} color="#fff" />
              <View style={styles.viewRequestsTextContainer}>
                <Text style={styles.viewRequestsTitle}>Mở Bản Đồ & Nhận Chuyến</Text>
                <Text style={styles.viewRequestsSubtitle}>
                  Xem vị trí và nhận yêu cầu trực tiếp trên bản đồ
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#fff" />
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Lưu ý khi Online:</Text>
          <View style={styles.infoItem}>
            <MaterialIcons name="info" size={20} color={COLORS.PRIMARY} />
            <Text style={styles.infoText}>
              Vị trí của bạn sẽ được cập nhật mỗi 5 giây
            </Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="battery-charging-full" size={20} color={COLORS.PRIMARY} />
            <Text style={styles.infoText}>
              Tối ưu hóa pin, không ảnh hưởng nhiều đến thiết bị
            </Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="visibility" size={20} color={COLORS.PRIMARY} />
            <Text style={styles.infoText}>
              Hành khách có thể thấy vị trí của bạn trên bản đồ
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#004553',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusIconContainer: {
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#004553',
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  viewRequestsButton: {
    backgroundColor: '#004553',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  viewRequestsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  viewRequestsTextContainer: {
    flex: 1,
  },
  viewRequestsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  viewRequestsSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#004553',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    lineHeight: 20,
  },
});

export default DriverStatusScreen;
