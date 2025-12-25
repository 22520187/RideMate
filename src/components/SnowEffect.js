import React, { useEffect, useRef, useMemo, memo } from "react";
import { View, StyleSheet, Animated, Dimensions, Easing } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SNOWFLAKE_COUNT = 30; // Giảm từ 50 xuống 30 để giảm tải

const SnowEffect = memo(() => {
  const animationsRef = useRef([]);
  const isMountedRef = useRef(true);

  // Memoize snowflakes để tránh recreate mỗi lần render
  const snowflakes = useMemo(
    () =>
      Array.from({ length: SNOWFLAKE_COUNT }, (_, i) => {
        const size = 3 + Math.random() * 5;
        const duration = 8000 + Math.random() * 7000;
        const delay = Math.random() * 5000;
        const driftAmount = 30 + Math.random() * 50;
        const opacity = 0.4 + Math.random() * 0.6;

        return {
          id: i,
          startX: Math.random() * SCREEN_WIDTH,
          endY: SCREEN_HEIGHT + 100,
          size,
          duration,
          delay,
          driftAmount,
          maxOpacity: opacity,
          translateY: new Animated.Value(-50),
          translateX: new Animated.Value(0),
          opacity: new Animated.Value(0),
          scale: new Animated.Value(0),
          rotate: new Animated.Value(0),
        };
      }),
    [] // Chỉ tạo một lần khi component mount
  );

  useEffect(() => {
    isMountedRef.current = true;

    const animations = snowflakes.map((flake) => {
      const fall = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(flake.translateY, {
              toValue: -50,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(flake.translateX, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(flake.opacity, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(flake.scale, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(flake.rotate, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
          Animated.delay(flake.delay),
          Animated.parallel([
            Animated.timing(flake.scale, {
              toValue: 1,
              duration: 500,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(flake.opacity, {
              toValue: flake.maxOpacity,
              duration: 500,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(flake.translateY, {
              toValue: flake.endY,
              duration: flake.duration,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(flake.translateX, {
                toValue: flake.driftAmount,
                duration: flake.duration * 0.3,
                easing: Easing.bezier(0.45, 0, 0.55, 1),
                useNativeDriver: true,
              }),
              Animated.timing(flake.translateX, {
                toValue: -flake.driftAmount,
                duration: flake.duration * 0.4,
                easing: Easing.bezier(0.45, 0, 0.55, 1),
                useNativeDriver: true,
              }),
              Animated.timing(flake.translateX, {
                toValue: 0,
                duration: flake.duration * 0.3,
                easing: Easing.bezier(0.45, 0, 0.55, 1),
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(flake.rotate, {
              toValue: 1,
              duration: flake.duration,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(flake.scale, {
              toValue: 0,
              duration: 300,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(flake.opacity, {
              toValue: 0,
              duration: 300,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      fall.start();
      return fall;
    });

    animationsRef.current = animations;

    return () => {
      isMountedRef.current = false;
      // Stop tất cả animations
      animations.forEach((anim) => {
        if (anim) {
          anim.stop();
        }
      });
      // Reset tất cả Animated.Value về giá trị ban đầu để giải phóng memory
      snowflakes.forEach((flake) => {
        try {
          flake.translateY.setValue(-50);
          flake.translateX.setValue(0);
          flake.opacity.setValue(0);
          flake.scale.setValue(0);
          flake.rotate.setValue(0);
        } catch (e) {
          // Ignore errors if value is already disposed
          console.log("SnowEffect cleanup:", e.message);
        }
      });
      animationsRef.current = [];
    };
  }, [snowflakes]);

  return (
    <View style={styles.container} pointerEvents="none">
      {snowflakes.map((flake) => {
        const rotate = flake.rotate.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "360deg"],
        });

        return (
          <Animated.View
            key={flake.id}
            style={[
              styles.snowflake,
              {
                width: flake.size,
                height: flake.size,
                borderRadius: flake.size / 2,
                left: flake.startX,
                opacity: flake.opacity,
                transform: [
                  { translateY: flake.translateY },
                  { translateX: flake.translateX },
                  { rotate },
                  { scale: flake.scale },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
});

SnowEffect.displayName = "SnowEffect";

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  snowflake: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    // Giảm shadow effects để tối ưu performance
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default SnowEffect;
