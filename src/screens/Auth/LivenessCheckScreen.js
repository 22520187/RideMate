import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, Defs, Mask } from "react-native-svg";
import {
  uploadIdCard,
  verifyLivenessPhase,
} from "../../services/verificationService";

const { width, height } = Dimensions.get("window");
const CIRCLE_SIZE = width * 0.7;

const PHASES = [
  {
    id: "LOOK_STRAIGHT",
    title: "Nhìn thẳng",
    instruction: "Nhìn thẳng vào camera",
    description: "Giữ mặt trong khung tròn",
    duration: 3000,
  },
  {
    id: "BLINK",
    title: "Nháy mắt",
    instruction: "Nháy mắt chậm rãi",
    description: "Nhắm mắt rồi mở ra",
    duration: 3000,
  },
  {
    id: "TURN_LEFT",
    title: "Quay trái",
    instruction: "Quay mặt sang trái",
    description: "Quay đầu từ từ sang trái",
    duration: 3000,
  },
];

export default function LivenessCheckScreen({ route, navigation }) {
  const { idCardUri, tempId } = route.params || {}; // Get tempId from previous screen

  const [permission, requestPermission] = useCameraPermissions();
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [phaseStatus, setPhaseStatus] = useState({});
  const [lastPhaseImageUri, setLastPhaseImageUri] = useState(null); // Store last phase image

  const cameraRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Use tempId from route.params (from IDCardCaptureScreen)
  // If not provided, create a new one (fallback for edge cases)
  const tempIdRef = useRef(tempId || `temp_${Date.now()}`);

  useEffect(() => {
    if (!tempId) {
      console.warn(
        "⚠️ No tempId provided from previous screen, using fallback:",
        tempIdRef.current
      );
    } else {
      console.log("🆔 Liveness session tempId:", tempIdRef.current);
    }
  }, [tempId]);

  useEffect(() => {
    if (permission === null) {
      requestPermission();
    }
  }, []);

  useEffect(() => {
    if (
      currentPhaseIndex < PHASES.length &&
      countdown === null &&
      !isCapturing
    ) {
      startPhase();
    }
  }, [currentPhaseIndex]);

  const startPhase = () => {
    const phase = PHASES[currentPhaseIndex];
    let count = 3;
    setCountdown(count);

    Animated.sequence([
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: false,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: phase.duration,
        useNativeDriver: false,
      }),
    ]).start();

    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        clearInterval(interval);
        setCountdown(null);
        capturePhase();
      }
    }, 1000);
  };

  const capturePhase = async () => {
    if (!cameraRef.current) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      await verifyPhase(photo.uri);
    } catch (error) {
      console.error("Capture error:", error);
      Alert.alert("Lỗi", "Không thể chụp ảnh. Vui lòng thử lại.");
      setIsCapturing(false);
    }
  };

  const verifyPhase = async (imageUri) => {
    setIsVerifying(true);
    const phase = PHASES[currentPhaseIndex];

    try {
      // Use the tempId from IDCardCaptureScreen (via route.params)
      const identifier = tempIdRef.current;
      console.log(
        "🔍 Verifying phase:",
        phase.id,
        "with identifier:",
        identifier
      );
      const response = await verifyLivenessPhase(
        identifier,
        phase.id,
        imageUri
      );

      console.log("📥 Verification response:", {
        phase: phase.id,
        verified: response.verified,
        confidence: response.confidence,
        reason: response.reason,
        fullResponse: response,
      });

      if (response.verified) {
        console.log("✅ Phase verification SUCCESS:", phase.id);
        setPhaseStatus((prev) => ({ ...prev, [phase.id]: "success" }));

        // Store image from last phase for final verification
        if (currentPhaseIndex === PHASES.length - 1) {
          setLastPhaseImageUri(imageUri);
        }

        if (currentPhaseIndex < PHASES.length - 1) {
          setTimeout(() => {
            setCurrentPhaseIndex((prev) => prev + 1);
            setIsCapturing(false);
            setIsVerifying(false);
          }, 1000);
        } else {
          // All 3 phases complete - NOW verify with CCCD!
          console.log("🔐 All phases complete! Verifying face with CCCD...");

          try {
            const {
              verifyLivenessWithTempId,
            } = require("../../services/verificationService");
            const identifier = tempIdRef.current;
            console.log(
              "🔐 Verifying final liveness with identifier:",
              identifier
            );
            const finalVerification = await verifyLivenessWithTempId(
              identifier,
              imageUri
            );

            console.log("📊 Final verification result:", finalVerification);

            if (finalVerification.data?.verified) {
              const similarityScore = finalVerification.data.similarityScore;
              console.log(
                `✅ Face matching SUCCESS! Similarity: ${(
                  similarityScore * 100
                ).toFixed(1)}%`
              );

              // Navigate to phone number input with the same tempId
              navigation.navigate("PhoneNumberInput", {
                tempId: identifier,
                livenessVerified: true,
                similarityScore: similarityScore,
              });
            } else {
              // Face doesn't match CCCD
              const similarityScore =
                finalVerification.data?.similarityScore || 0;
              console.log(
                `❌ Face matching FAILED! Similarity: ${(
                  similarityScore * 100
                ).toFixed(1)}%`
              );

              Alert.alert(
                "Xác thực thất bại",
                finalVerification.data?.message ||
                  `Khuôn mặt không khớp với ảnh căn cước (độ tương đồng: ${(
                    similarityScore * 100
                  ).toFixed(1)}%). Vui lòng thử lại.`,
                [
                  {
                    text: "Thử lại từ đầu",
                    onPress: () => {
                      // Reset and go back to CCCD capture
                      navigation.goBack();
                    },
                  },
                ]
              );
              setIsVerifying(false);
            }
          } catch (error) {
            console.error("❌ Error in final verification:", error);
            Alert.alert(
              "Lỗi xác thực",
              "Không thể xác thực khuôn mặt với căn cước. Vui lòng thử lại.",
              [
                {
                  text: "Thử lại từ đầu",
                  onPress: () => navigation.goBack(),
                },
              ]
            );
            setIsVerifying(false);
          }
        }
      } else {
        setPhaseStatus((prev) => ({ ...prev, [phase.id]: "failed" }));
        console.log("❌ Phase verification failed:", {
          phase: phase.id,
          verified: response.verified,
          confidence: response.confidence,
          reason: response.reason,
          fullResponse: response,
        });
        Alert.alert("Thất bại", response.reason || "Vui lòng thử lại từ đầu", [
          {
            text: "Thử lại từ đầu",
            onPress: () => {
              // Reset to first phase - keep same tempId if available
              console.log("🔄 Resetting to phase 1 (LOOK_STRAIGHT)");
              if (!tempId) {
                // Only create new tempId if we don't have one from previous screen
                tempIdRef.current = `temp_${Date.now()}`;
                console.log(
                  "🆔 New liveness session tempId:",
                  tempIdRef.current
                );
              } else {
                console.log("🔄 Keeping existing tempId:", tempIdRef.current);
              }
              setCurrentPhaseIndex(0);
              setPhaseStatus({});
              setIsCapturing(false);
              setIsVerifying(false);
            },
          },
        ]);
      }
    } catch (error) {
      console.error("Verification error:", error);
      Alert.alert("Lỗi", "Không thể xác thực. Vui lòng thử lại.");
      setIsCapturing(false);
      setIsVerifying(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Đang yêu cầu quyền camera...</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-off" size={80} color="#999" />
        <Text style={styles.permissionTitle}>Cần quyền truy cập Camera</Text>
        <Text style={styles.permissionMessage}>
          Ứng dụng cần quyền truy cập camera để xác thực khuôn mặt của bạn.
        </Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => {
            if (Platform.OS === "ios") {
              Linking.openURL("app-settings:");
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
    );
  }

  const currentPhase = PHASES[currentPhaseIndex];
  const progress = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="front">
        <View style={styles.overlay}>
          <View style={styles.header}>
            <Text style={styles.phaseIndicator}>
              {currentPhaseIndex + 1}/{PHASES.length}
            </Text>
            <Text style={styles.phaseTitle}>{currentPhase.title}</Text>
          </View>

          <View style={styles.circleContainer}>
            <Svg height={CIRCLE_SIZE} width={CIRCLE_SIZE}>
              <Defs>
                <Mask id="mask">
                  <Circle
                    cx={CIRCLE_SIZE / 2}
                    cy={CIRCLE_SIZE / 2}
                    r={CIRCLE_SIZE / 2 - 10}
                    fill="white"
                  />
                </Mask>
              </Defs>
              <Circle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={CIRCLE_SIZE / 2 - 5}
                stroke="#4CAF50"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${progress}, 100%`}
              />
            </Svg>

            {countdown !== null && (
              <Animated.View
                style={[
                  styles.countdownContainer,
                  { transform: [{ scale: scaleAnim }] },
                ]}
              >
                <Text style={styles.countdownText}>{countdown}</Text>
              </Animated.View>
            )}

            {isVerifying && (
              <View style={styles.verifyingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.verifyingText}>Đang xác thực...</Text>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.instruction}>{currentPhase.instruction}</Text>
            <Text style={styles.description}>{currentPhase.description}</Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    marginTop: 20,
    marginBottom: 12,
    textAlign: "center",
  },
  permissionMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  settingsButton: {
    backgroundColor: "#004553",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 12,
    width: "100%",
    alignItems: "center",
  },
  settingsButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  retryButton: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#004553",
    width: "100%",
    alignItems: "center",
  },
  retryButtonText: {
    color: "#004553",
    fontSize: 16,
    fontWeight: "600",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  phaseIndicator: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 8,
  },
  phaseTitle: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
  },
  circleContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  countdownContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  countdownText: {
    fontSize: 72,
    color: "#fff",
    fontWeight: "bold",
  },
  verifyingContainer: {
    position: "absolute",
    alignSelf: "center",
    top: "50%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  verifyingText: {
    fontSize: 18,
    color: "#fff",
    marginTop: 16,
    fontWeight: "600",
  },
  footer: {
    paddingBottom: 60,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  instruction: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#ccc",
    textAlign: "center",
  },
});
