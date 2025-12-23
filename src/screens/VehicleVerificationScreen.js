import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import LicensePlateScanner from "../../components/LicensePlateScanner";
import COLORS from "../../constant/colors";
import Toast from "react-native-toast-message";
import GradientHeader from "../../components/GradientHeader";

/**
 * Vehicle Verification Screen
 * Allows drivers to upload and verify their vehicle license plate
 */
const VehicleVerificationScreen = ({ navigation }) => {
  const [plateData, setPlateData] = useState(null);

  /**
   * Handle when plate is successfully detected
   */
  const handlePlateDetected = (data) => {
    console.log("Plate detected:", data);
    setPlateData(data);
  };

  /**
   * Submit vehicle verification
   */
  const handleSubmit = async () => {
    if (!plateData) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Vui lòng chụp ảnh biển số xe",
      });
      return;
    }

    try {
      // TODO: Call API to submit vehicle verification
      // const response = await axiosClient.post(endpoints.vehicle.verify, {
      //   plateNumber: plateData.plateNumber,
      //   imageUri: plateData.imageUri,
      // });

      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Đã gửi yêu cầu xác minh xe",
      });

      // Navigate back or to next screen
      navigation.goBack();
    } catch (error) {
      console.error("Error submitting verification:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể gửi yêu cầu xác minh",
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <GradientHeader
        title="Thông tin xe"
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#0891B2" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Xác minh biển số xe</Text>
            <Text style={styles.infoText}>
              Chụp ảnh biển số xe của bạn để xác minh. Ảnh cần rõ nét và đầy đủ
              thông tin.
            </Text>
          </View>
        </View>

        {/* License Plate Scanner */}
        <LicensePlateScanner onPlateDetected={handlePlateDetected} />

        {/* Detected Plate Info */}
        {plateData && (
          <View style={styles.detectedCard}>
            <View style={styles.detectedHeader}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={styles.detectedTitle}>Đã phát hiện biển số</Text>
            </View>

            <View style={styles.plateNumberContainer}>
              <Text style={styles.plateNumber}>{plateData.plateNumber}</Text>
            </View>

            <View style={styles.confidenceContainer}>
              <Text style={styles.confidenceLabel}>Độ tin cậy:</Text>
              <View
                style={[
                  styles.confidenceBadge,
                  plateData.confidence === "high" && styles.highConfidence,
                  plateData.confidence === "medium" && styles.mediumConfidence,
                  plateData.confidence === "low" && styles.lowConfidence,
                ]}
              >
                <Text style={styles.confidenceText}>
                  {plateData.confidence === "high"
                    ? "Cao"
                    : plateData.confidence === "medium"
                    ? "Trung bình"
                    : "Thấp"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            !plateData && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!plateData}
        >
          <Text style={styles.submitButtonText}>Xác nhận</Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.WHITE} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#F0F9FF",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#0891B2",
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#004553",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: "#0369A1",
    lineHeight: 20,
  },
  detectedCard: {
    backgroundColor: "#F0FDF4",
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#10B981",
  },
  detectedHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detectedTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#065F46",
    marginLeft: 8,
  },
  plateNumberContainer: {
    backgroundColor: COLORS.WHITE,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#10B981",
  },
  plateNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#004553",
    letterSpacing: 2,
  },
  confidenceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  confidenceLabel: {
    fontSize: 14,
    color: "#065F46",
    marginRight: 8,
  },
  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  highConfidence: {
    backgroundColor: "#10B981",
  },
  mediumConfidence: {
    backgroundColor: "#F59E0B",
  },
  lowConfidence: {
    backgroundColor: "#EF4444",
  },
  confidenceText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: "600",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#004553",
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  submitButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default VehicleVerificationScreen;
