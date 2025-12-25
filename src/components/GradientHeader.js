import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import COLORS from "../constant/colors";

/**
 * Reusable gradient header component with Christmas theme
 * @param {string} title - Header title (can include emoji/icon)
 * @param {function} onBackPress - Back button press handler
 * @param {function} onRightPress - Right button press handler (optional)
 * @param {string} rightIcon - Right button icon name (optional)
 * @param {boolean} showBackButton - Show/hide back button (default: true)
 */
const GradientHeader = ({
  title,
  onBackPress,
  onRightPress,
  rightIcon,
  showBackButton = true,
}) => {
  return (
    <LinearGradient
      colors={["#FF5370", "#FF6B9D", "#FF8FAB"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <View style={styles.headerDecor}>
        <Text style={styles.decorBulb}>💡</Text>
        <Text style={styles.decorStar}>⭐</Text>
        <Text style={styles.decorSnow}>❄️</Text>
        <Text style={styles.decorTree}>🎄</Text>
      </View>

      {showBackButton && onBackPress ? (
        <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}

      <Text style={styles.headerTitle}>{title}</Text>

      {onRightPress && rightIcon ? (
        <TouchableOpacity onPress={onRightPress} style={styles.rightButton}>
          <View style={styles.rightButtonCircle}>
            <MaterialIcons name={rightIcon} size={24} color="#FF5370" />
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 20,
    elevation: 8,
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    position: "relative",
    overflow: "hidden",
  },
  headerDecor: {
    position: "absolute",
    top: 10,
    right: 16,
    flexDirection: "row",
    gap: 8,
    opacity: 0.6,
  },
  decorBulb: {
    fontSize: 18,
    opacity: 0.8,
  },
  decorStar: {
    fontSize: 18,
    opacity: 0.8,
  },
  decorSnow: {
    fontSize: 18,
    opacity: 0.8,
  },
  decorTree: {
    fontSize: 18,
    opacity: 0.8,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  rightButton: {
    padding: 4,
  },
  rightButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  placeholder: {
    width: 40,
  },
});

export default GradientHeader;
