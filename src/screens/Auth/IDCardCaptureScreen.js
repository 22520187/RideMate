import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../constant/colors';
import Toast from 'react-native-toast-message';

const IDCardCaptureScreen = ({ navigation, route }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (permission === null) {
      requestPermission();
    }
  }, []);

  const capturePhoto = async () => {
    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        setCapturedImage(photo);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể chụp ảnh. Vui lòng thử lại.',
      });
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const confirmPhoto = async () => {
    if (capturedImage) {
      setLoading(true);
      try {
        // Generate tempId for this verification session
        const tempId = `temp_${Date.now()}`;
        console.log('🆔 Created tempId for CCCD upload:', tempId);
        
        // Upload CCCD and extract face embedding
        const { uploadIdCardWithTempId } = require('../../services/verificationService');
        const response = await uploadIdCardWithTempId(tempId, capturedImage.uri);
        
        console.log('✅ CCCD uploaded successfully:', response);
        
        // Navigate to liveness check with tempId
        navigation.navigate('LivenessCheckScreen', {
          idCardUri: capturedImage.uri,
          tempId: tempId,  // Pass tempId to liveness screen
        });
      } catch (error) {
        console.error('❌ Error uploading CCCD:', error);
        Toast.show({
          type: 'error',
          text1: 'Lỗi',
          text2: error.response?.data?.message || 'Không thể tải ảnh căn cước. Vui lòng thử lại.',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.WHITE} />
          <Text style={styles.message}>Đang yêu cầu quyền camera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionDeniedContainer}>
          <Ionicons name="camera-off" size={80} color={COLORS.GRAY} />
          <Text style={styles.permissionTitle}>Cần quyền truy cập Camera</Text>
          <Text style={styles.permissionMessage}>
            Ứng dụng cần quyền truy cập camera để chụp ảnh căn cước công dân của bạn.
          </Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            }}
          >
            <Text style={styles.settingsButtonText}>Mở Cài đặt</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              requestPermission();
            }}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (capturedImage) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.previewContainer}>
          <Text style={styles.title}>Xem lại ảnh căn cước</Text>
          <Image
            source={{ uri: capturedImage.uri }}
            style={styles.previewImage}
            resizeMode="contain"
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.retakeButton]}
              onPress={retakePhoto}
            >
              <Text style={styles.buttonText}>Chụp lại</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={confirmPhoto}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.WHITE} />
              ) : (
                <Text style={styles.buttonText}>Xác nhận</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
      />
      
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.title}>Chụp ảnh căn cước công dân</Text>
          <Text style={styles.subtitle}>
            Đặt căn cước trong khung hình bên dưới
          </Text>
        </View>

        <View style={styles.guideContainer}>
          <View style={styles.cardGuide}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={capturePhoto}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          <Text style={styles.hint}>
            Đảm bảo ảnh rõ nét và đầy đủ thông tin
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BLACK,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    color: COLORS.WHITE,
    fontSize: 16,
    marginTop: 12,
  },
  permissionDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.WHITE,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.BLACK,
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: 16,
    color: COLORS.GRAY,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  settingsButton: {
    backgroundColor: '#004553',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  settingsButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: COLORS.WHITE,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#004553',
    width: '100%',
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#004553',
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.WHITE,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.WHITE,
    textAlign: 'center',
  },
  guideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardGuide: {
    width: '90%',
    aspectRatio: 1.586,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: COLORS.WHITE,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  footer: {
    padding: 30,
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.BLUE,
  },
  hint: {
    color: COLORS.WHITE,
    fontSize: 12,
    textAlign: 'center',
  },
  previewContainer: {
    flex: 1,
    padding: 20,
  },
  previewImage: {
    flex: 1,
    borderRadius: 12,
    marginVertical: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  retakeButton: {
    backgroundColor: COLORS.GRAY,
  },
  confirmButton: {
    backgroundColor: COLORS.BLUE,
  },
  buttonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default IDCardCaptureScreen;
