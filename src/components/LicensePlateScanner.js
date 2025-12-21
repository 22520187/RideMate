import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { processVehicleImage } from '../services/licensePlateService';
import COLORS from '../constant/colors';
import Toast from 'react-native-toast-message';

/**
 * License Plate Scanner Component
 * Allows users to capture/select vehicle image and extract plate number
 */
const LicensePlateScanner = ({ onPlateDetected, initialImage = null }) => {
  const [image, setImage] = useState(initialImage);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);

  /**
   * Request camera permissions
   */
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Quyền truy cập camera',
        'Ứng dụng cần quyền truy cập camera để chụp ảnh biển số xe.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  /**
   * Take photo with camera
   */
  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
        setResult(null);
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể chụp ảnh',
      });
    }
  };

  /**
   * Request media library permissions
   */
  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Quyền truy cập thư viện',
        'Ứng dụng cần quyền truy cập thư viện ảnh để chọn ảnh biển số xe.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  /**
   * Pick image from gallery
   */
  const pickImage = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
        setResult(null);
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể chọn ảnh',
      });
    }
  };

  /**
   * Process image and extract plate number
   */
  const processImage = async (imageUri) => {
    setIsProcessing(true);
    
    try {
      Toast.show({
        type: 'info',
        text1: 'Đang xử lý...',
        text2: 'Vui lòng chờ trong giây lát',
      });

      const result = await processVehicleImage(imageUri);
      
      setResult(result);

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Thành công!',
          text2: `Biển số: ${result.plateNumber}`,
        });
        
        // Callback to parent component
        if (onPlateDetected) {
          onPlateDetected({
            plateNumber: result.plateNumber,
            imageUri,
            confidence: result.confidence,
          });
        }
      } else {
        Toast.show({
          type: 'error',
          text1: 'Không thành công',
          text2: result.error,
        });
      }
    } catch (error) {
      console.error('Error processing image:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Có lỗi xảy ra khi xử lý ảnh',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Retry processing current image
   */
  const retryProcessing = () => {
    if (image) {
      processImage(image);
    }
  };

  return (
    <View style={styles.container}>
      {/* Image Preview */}
      {image ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.image} />
          
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color={COLORS.WHITE} />
              <Text style={styles.processingText}>Đang xử lý...</Text>
            </View>
          )}
          
          {result && (
            <View style={[
              styles.resultBadge,
              result.success ? styles.successBadge : styles.errorBadge
            ]}>
              <Ionicons 
                name={result.success ? 'checkmark-circle' : 'close-circle'} 
                size={20} 
                color={COLORS.WHITE} 
              />
              <Text style={styles.resultText}>
                {result.success ? result.plateNumber : 'Thất bại'}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.placeholderContainer}>
          <Ionicons name="camera-outline" size={64} color={COLORS.GRAY} />
          <Text style={styles.placeholderText}>
            Chụp hoặc chọn ảnh biển số xe
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cameraButton]}
          onPress={takePhoto}
          disabled={isProcessing}
        >
          <Ionicons name="camera" size={24} color={COLORS.WHITE} />
          <Text style={styles.buttonText}>Chụp ảnh</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.galleryButton]}
          onPress={pickImage}
          disabled={isProcessing}
        >
          <Ionicons name="images" size={24} color={COLORS.WHITE} />
          <Text style={styles.buttonText}>Thư viện</Text>
        </TouchableOpacity>
      </View>

      {/* Retry Button */}
      {image && result && !result.success && !isProcessing && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={retryProcessing}
        >
          <Ionicons name="refresh" size={20} color="#004553" />
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      )}

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>💡 Mẹo chụp ảnh tốt:</Text>
        <Text style={styles.tipText}>• Chụp trong điều kiện ánh sáng tốt</Text>
        <Text style={styles.tipText}>• Đảm bảo biển số rõ nét, không bị mờ</Text>
        <Text style={styles.tipText}>• Chụp thẳng góc, tránh nghiêng</Text>
        <Text style={styles.tipText}>• Biển số chiếm phần lớn khung hình</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  imageContainer: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.GRAY_LIGHT,
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: COLORS.WHITE,
    fontSize: 16,
    marginTop: 12,
    fontWeight: '600',
  },
  resultBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  successBadge: {
    backgroundColor: '#10B981',
  },
  errorBadge: {
    backgroundColor: '#EF4444',
  },
  resultText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: '600',
  },
  placeholderContainer: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.GRAY,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  placeholderText: {
    color: COLORS.GRAY,
    fontSize: 16,
    marginTop: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  cameraButton: {
    backgroundColor: '#004553',
  },
  galleryButton: {
    backgroundColor: '#0891B2',
  },
  buttonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#004553',
    gap: 6,
    marginBottom: 16,
  },
  retryText: {
    color: '#004553',
    fontSize: 14,
    fontWeight: '600',
  },
  tipsContainer: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0891B2',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#004553',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#0369A1',
    marginBottom: 4,
  },
});

export default LicensePlateScanner;
