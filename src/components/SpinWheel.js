import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  Easing,
} from "react-native";
import { Gift, Sparkles, X } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, {
  Path,
  G,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from "react-native-svg";

const { width } = Dimensions.get("window");
const WHEEL_SIZE = width * 0.85;
const RADIUS = WHEEL_SIZE / 2;
const SEGMENTS = 5;
const ANGLE_PER_SEGMENT = 360 / SEGMENTS;

const REWARDS = [
  { points: 100, emoji: "⭐", label: "Vừa", color: ["#FF6B9D", "#FF8FAB"] },
  { points: 200, emoji: "🎄", label: "Tốt", color: ["#FF8FAB", "#FFB6C1"] },
  { points: 300, emoji: "🎅", label: "Tuyệt", color: ["#FF5370", "#FF6B9D"] },
  {
    points: 400,
    emoji: "❄️",
    label: "Xuất sắc",
    color: ["#FFB6C1", "#FFE5EC"],
  },
  {
    points: 500,
    emoji: "💎",
    label: "Cực đỉnh",
    color: ["#FFE5EC", "#FF5370"],
  },
];

const SpinWheel = ({ visible, onClose, onSpinComplete, canSpin, spinInfo }) => {
  const [spinning, setSpinning] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const lastRotation = useRef(0);

  useEffect(() => {
    if (!visible) {
      setSelectedReward(null);
      return;
    }

    // Don't update selectedReward if currently spinning
    if (spinning) {
      return;
    }

    if (canSpin) {
      setSelectedReward(null);
    } else if (spinInfo?.rewardPoints) {
      const validReward = REWARDS.find(
        (r) => r.points === spinInfo.rewardPoints
      );
      if (validReward) setSelectedReward(spinInfo.rewardPoints);
    }
  }, [visible, spinInfo, canSpin, spinning]);

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible]);

  const getCoordinates = (angle) => {
    const rad = (angle - 90) * (Math.PI / 180);
    return {
      x: RADIUS + RADIUS * Math.cos(rad),
      y: RADIUS + RADIUS * Math.sin(rad),
    };
  };

  const spin = async () => {
    // Double check: prevent spin if already spinning or cannot spin
    if (spinning || !canSpin) {
      console.log("🚫 Cannot spin:", { spinning, canSpin });
      return;
    }

    setSpinning(true);
    setSelectedReward(null);

    // Reset rotation to 0 for each new spin to avoid accumulation errors
    rotateAnim.setValue(0);
    lastRotation.current = 0;

    try {
      const rewardPoints = await onSpinComplete?.();

      if (!rewardPoints) {
        console.log("❌ No reward received");
        setSpinning(false);
        return;
      }

      const rewardIndex = REWARDS.findIndex((r) => r.points === rewardPoints);
      if (rewardIndex === -1) {
        console.log("❌ Invalid reward index");
        setSpinning(false);
        return;
      }

      // Pointer is at top (pointing to 0 degrees / 12 o'clock)
      // getCoordinates uses (angle - 90), so:
      // - angle 0 in our system = -90 in getCoordinates = top (12 o'clock)
      // - angle 90 in our system = 0 in getCoordinates = right (3 o'clock)
      // - angle 180 in our system = 90 in getCoordinates = bottom (6 o'clock)

      // Segments are rendered starting from 0 degrees (top)
      // Segment 0 (100): 0-72 degrees, center at 36 degrees
      // Segment 1 (200): 72-144 degrees, center at 108 degrees
      // Segment 2 (300): 144-216 degrees, center at 180 degrees
      // Segment 3 (400): 216-288 degrees, center at 252 degrees
      // Segment 4 (500): 288-360 degrees, center at 324 degrees

      // Calculate the center angle of the target segment
      const segmentCenterAngle =
        rewardIndex * ANGLE_PER_SEGMENT + ANGLE_PER_SEGMENT / 2;

      // Add small randomness for visual effect (keep it small to stay within segment)
      const randomOffset = (Math.random() - 0.5) * (ANGLE_PER_SEGMENT * 0.15);

      // The target angle is where we want the segment center to end up
      // Pointer is at top (0 degrees in our coordinate system)
      // We want segment center to align with pointer, so we rotate:
      // 360 * rotations - (segmentCenterAngle + randomOffset)
      const targetFinalAngle = segmentCenterAngle + randomOffset;

      const rotations = 5;
      // Rotate clockwise: multiple full rotations minus the target angle
      // This ensures the segment center ends up at the pointer (top = 0 degrees)
      // Since we reset lastRotation to 0, we just use finalRotation
      const finalRotation = 360 * rotations - targetFinalAngle;

      console.log("🎯 Spin calculation:", {
        rewardPoints,
        rewardIndex,
        segmentCenterAngle,
        randomOffset,
        targetFinalAngle,
        finalRotation,
        expectedSegment: REWARDS[rewardIndex]?.points,
      });

      Animated.parallel([
        Animated.timing(rotateAnim, {
          toValue: finalRotation,
          duration: 4000,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        lastRotation.current = finalRotation;
        setSelectedReward(rewardPoints);
        setSpinning(false);
        // After spin completes, user cannot spin again until next day
        // This is handled by backend, but we ensure UI reflects the state
      });
    } catch (error) {
      console.error(error);
      setSpinning(false);
    }
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
    extrapolate: "clamp",
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const renderWheelPath = (index) => {
    const startAngle = index * ANGLE_PER_SEGMENT;
    const endAngle = (index + 1) * ANGLE_PER_SEGMENT;
    const start = getCoordinates(startAngle);
    const end = getCoordinates(endAngle);
    const largeArcFlag = ANGLE_PER_SEGMENT > 180 ? 1 : 0;

    return `M ${RADIUS} ${RADIUS} L ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.christmasDecor}>
            <Text style={styles.decorEmoji}>🎄</Text>
            <Text style={styles.decorEmoji}>⭐</Text>
            <Text style={styles.decorEmoji}>🎅</Text>
          </View>

          <TouchableOpacity style={styles.closeIconButton} onPress={onClose}>
            <View style={styles.closeButtonCircle}>
              <X size={20} color="#FFF" />
            </View>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.christmasTitle}>🎰 Vòng quay Giáng sinh</Text>
            <Text style={styles.subtitle}>
              {canSpin
                ? "Quay ngay để nhận quà! 🎁"
                : "Hẹn gặp lại vào ngày mai! ⏰"}
            </Text>
          </View>

          <View style={styles.wheelContainer}>
            <Animated.View
              style={[styles.wheelGlow, { opacity: glowOpacity }]}
            />
            <View style={styles.pointer}>
              <LinearGradient
                colors={["#FFD700", "#FFA500"]}
                style={styles.pointerGradient}
              >
                <View style={styles.pointerInner} />
              </LinearGradient>
            </View>

            <Animated.View
              style={[
                styles.wheel,
                {
                  transform: [
                    { rotate: rotateInterpolate },
                    { scale: scaleAnim },
                  ],
                },
              ]}
            >
              <Svg
                width={WHEEL_SIZE}
                height={WHEEL_SIZE}
                viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
              >
                <Defs>
                  {REWARDS.map((reward, index) => (
                    <SvgGradient
                      key={`grad-${index}`}
                      id={`grad-${index}`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <Stop
                        offset="0"
                        stopColor={reward.color[0]}
                        stopOpacity="1"
                      />
                      <Stop
                        offset="1"
                        stopColor={reward.color[1]}
                        stopOpacity="1"
                      />
                    </SvgGradient>
                  ))}
                </Defs>
                <G>
                  {REWARDS.map((_, index) => (
                    <Path
                      key={index}
                      d={renderWheelPath(index)}
                      fill={`url(#grad-${index})`}
                      stroke="#FFF"
                      strokeWidth="2"
                    />
                  ))}
                </G>
              </Svg>

              {REWARDS.map((reward, index) => {
                const angle = index * ANGLE_PER_SEGMENT + ANGLE_PER_SEGMENT / 2;
                return (
                  <View
                    key={index}
                    style={[
                      styles.labelContainer,
                      {
                        transform: [
                          { rotate: `${angle}deg` },
                          { translateY: -WHEEL_SIZE / 4 },
                        ],
                      },
                    ]}
                  >
                    <View style={styles.labelContent}>
                      <Text style={styles.rewardEmoji}>{reward.emoji}</Text>
                      <Text style={styles.rewardText}>{reward.points}</Text>
                      <Text style={styles.pointText}>điểm</Text>
                    </View>
                  </View>
                );
              })}
            </Animated.View>

            <View style={styles.centerCircle}>
              <LinearGradient
                colors={["#FF5370", "#FF6B9D"]}
                style={styles.centerCircleGradient}
              >
                <Text style={styles.centerEmoji}>🎁</Text>
                <Text style={styles.centerText}>SPIN</Text>
              </LinearGradient>
            </View>
          </View>

          {selectedReward && !spinning && (
            <View style={styles.resultContainer}>
              <LinearGradient
                colors={["#FF5370", "#FF6B9D", "#FF8FAB"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.resultGradient}
              >
                <Sparkles
                  size={28}
                  color="#FFF"
                  fill="#FFF"
                  style={styles.resultSparkle}
                />
                <Text style={styles.resultText}>
                  {canSpin ? "🎉 Chúc mừng bạn!" : "✨ Phần thưởng hôm nay"}
                </Text>
                <View style={styles.rewardAmountContainer}>
                  <Text style={styles.rewardAmount}>{selectedReward}</Text>
                  <Text style={styles.rewardUnit}>điểm</Text>
                </View>
              </LinearGradient>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.spinButton,
              (!canSpin || spinning) && styles.spinButtonDisabled,
            ]}
            onPress={spin}
            disabled={!canSpin || spinning}
          >
            <LinearGradient
              colors={
                canSpin && !spinning ? ["#FF5370", "#FF6B9D"] : ["#CCC", "#999"]
              }
              style={styles.spinButtonGradient}
            >
              <Text style={styles.spinButtonText}>
                {spinning
                  ? "🎄 Đang quay..."
                  : canSpin
                  ? "🎁 Quay ngay"
                  : "❄️ Đã quay"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#FFF",
    borderRadius: 32,
    padding: 24,
    width: width * 0.92,
    alignItems: "center",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  christmasDecor: {
    flexDirection: "row",
    justifyContent: "space-between",
    position: "absolute",
    top: -15,
    left: 20,
    right: 20,
  },
  decorEmoji: { fontSize: 28 },
  closeIconButton: { position: "absolute", top: 16, right: 16, zIndex: 10 },
  closeButtonCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FF5370",
    justifyContent: "center",
    alignItems: "center",
  },
  header: { alignItems: "center", marginBottom: 24, marginTop: 12 },
  christmasTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FF5370",
    marginBottom: 8,
  },
  subtitle: { fontSize: 14, color: "#666", fontWeight: "600" },
  wheelContainer: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  wheelGlow: {
    position: "absolute",
    width: WHEEL_SIZE + 30,
    height: WHEEL_SIZE + 30,
    borderRadius: (WHEEL_SIZE + 30) / 2,
    backgroundColor: "#FF5370",
  },
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    position: "relative",
  },
  labelContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  labelContent: { alignItems: "center", justifyContent: "center" },
  rewardEmoji: { fontSize: 24, marginBottom: 2 },
  rewardText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFF",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  pointText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFF",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 2,
  },
  centerCircle: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    zIndex: 10,
    borderWidth: 3,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  centerCircleGradient: {
    flex: 1,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  centerEmoji: { fontSize: 24 },
  centerText: { fontSize: 10, fontWeight: "800", color: "#FFF" },
  pointer: {
    position: "absolute",
    top: -15,
    zIndex: 20,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  pointerGradient: {
    width: 30,
    height: 35,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    alignItems: "center",
  },
  pointerInner: {
    width: 0,
    height: 0,
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderTopWidth: 35,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "transparent",
  },
  resultContainer: {
    width: "100%",
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  resultGradient: { padding: 16, alignItems: "center" },
  resultSparkle: { marginBottom: 8 },
  resultText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 8,
  },
  rewardAmountContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  rewardAmount: { fontSize: 40, fontWeight: "800", color: "#FFF" },
  rewardUnit: { fontSize: 16, fontWeight: "700", color: "#FFF", opacity: 0.9 },
  spinButton: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#FF5370",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  spinButtonDisabled: { opacity: 0.7 },
  spinButtonGradient: { paddingVertical: 16, alignItems: "center" },
  spinButtonText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
});

export default SpinWheel;
