import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";
import COLORS from "../constant/colors";

const RadarScanning = ({ size = 200, center }) => {
  const pulseAnim1 = useRef(new Animated.Value(0)).current;
  const pulseAnim2 = useRef(new Animated.Value(0)).current;
  const pulseAnim3 = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animations (3 waves with delays)
    const createPulse = (animValue, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    // Rotation animation (radar sweep)
    const rotation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Start all animations
    Animated.parallel([
      createPulse(pulseAnim1, 0),
      createPulse(pulseAnim2, 666),
      createPulse(pulseAnim3, 1333),
      rotation,
    ]).start();

    return () => {
      pulseAnim1.stopAnimation();
      pulseAnim2.stopAnimation();
      pulseAnim3.stopAnimation();
      rotateAnim.stopAnimation();
    };
  }, []);

  const createPulseStyle = (animValue) => ({
    opacity: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.6, 0],
    }),
    transform: [
      {
        scale: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.3, 1.2],
        }),
      },
    ],
  });

  const rotateStyle = {
    transform: [
      {
        rotate: rotateAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "360deg"],
        }),
      },
    ],
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Pulse waves */}
      <Animated.View
        style={[
          styles.pulse,
          { width: size, height: size, borderRadius: size / 2 },
          createPulseStyle(pulseAnim1),
        ]}
      />
      <Animated.View
        style={[
          styles.pulse,
          { width: size, height: size, borderRadius: size / 2 },
          createPulseStyle(pulseAnim2),
        ]}
      />
      <Animated.View
        style={[
          styles.pulse,
          { width: size, height: size, borderRadius: size / 2 },
          createPulseStyle(pulseAnim3),
        ]}
      />

      {/* Center point */}
      <View style={styles.center}>
        <View style={styles.centerDot} />
      </View>

      {/* Radar sweep line */}
      <Animated.View style={[styles.radarSweep, rotateStyle]}>
        <View style={styles.sweepLine} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  pulse: {
    position: "absolute",
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    backgroundColor: "transparent",
  },
  center: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    elevation: 10,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  centerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.WHITE,
  },
  radarSweep: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  sweepLine: {
    position: "absolute",
    width: 2,
    height: "50%",
    backgroundColor: COLORS.PRIMARY,
    opacity: 0.6,
    top: "50%",
  },
});

export default RadarScanning;
