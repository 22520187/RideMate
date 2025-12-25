import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import COLORS from "../../../constant/colors";
import useDriverLocation from "../../../hooks/useDriverLocation";
import { getProfile } from "../../../services/userService";
import useDriverOnlineStatus from "../../../hooks/useDriverOnlineStatus";
import SCREENS from "../../index";

const { width } = Dimensions.get("window");

const DriverStatusScreen = ({ navigation }) => {
  const { isOnline, setOnlineStatus, loading } = useDriverOnlineStatus();
  const { currentLocation, isTracking } = useDriverLocation(isOnline);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await getProfile();
      setUserProfile(response?.data?.data);
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const handleToggleStatus = async (value) => {
    if (value) {
      Alert.alert(
        "Bật chế độ Online",
        "Bạn có muốn bật chế độ online và chuyển đến màn hình bản đồ để nhận chuyến không?",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Đồng ý",
            onPress: () => {
              setOnlineStatus(true);
              navigation.navigate(SCREENS.DRIVER_MAP);
            },
          },
        ]
      );
    } else {
      setOnlineStatus(false);
      Alert.alert("Đã Offline", "Bạn đã tắt chế độ nhận chuyến.");
    }
  };

  const quickStats = [
    {
      icon: "🏍️",
      label: "Chuyến đi",
      value: userProfile?.totalRides?.toString() || "0",
      color: "#FFB6C1",
    },
    {
      icon: "⭐",
      label: "Đánh giá",
      value: userProfile?.rating ? userProfile.rating.toFixed(1) : "0.0",
      color: "#FFD700",
    },
    {
      icon: "🎁",
      label: "Xu",
      value: userProfile?.coins?.toString() || "0",
      color: "#FF69B4",
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Gradient Header */}
      <LinearGradient
        colors={["#004553", "#006D84", "#008FA5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trạng thái tài xế</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <View style={styles.content}>
        {/* Status Card with Gradient */}
        <LinearGradient
          colors={
            isOnline
              ? ["#10B981", "#059669", "#047857"]
              : ["#6B7280", "#4B5563", "#374151"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statusCard}
        >
          <View style={styles.statusHeader}>
            <View style={styles.statusIconContainer}>
              <View style={styles.iconGlow}>
                <MaterialIcons
                  name={isOnline ? "check-circle" : "cancel"}
                  size={70}
                  color="#fff"
                />
              </View>
            </View>
            <Text style={styles.statusTitle}>
              {isOnline ? "🟢 Đang Online" : "⚫ Offline"}
            </Text>
            <Text style={styles.statusSubtitle}>
              {isOnline
                ? "Bạn đang sẵn sàng nhận chuyến"
                : "Bật để bắt đầu nhận chuyến"}
            </Text>
          </View>

          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>
              {isOnline ? "Tắt chế độ nhận chuyến" : "Bật chế độ nhận chuyến"}
            </Text>
            <Switch
              value={isOnline}
              onValueChange={handleToggleStatus}
              disabled={loading}
              trackColor={{ false: "#D1D5DB", true: "#34D399" }}
              thumbColor={isOnline ? "#fff" : "#f4f3f4"}
              ios_backgroundColor="#D1D5DB"
            />
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.loadingText}>Đang cập nhật...</Text>
            </View>
          )}

          {currentLocation && isOnline && (
            <View style={styles.locationInfo}>
              <MaterialIcons name="location-on" size={20} color="#fff" />
              <Text style={styles.locationText}>
                📍 Vị trí: {currentLocation.latitude.toFixed(4)},{" "}
                {currentLocation.longitude.toFixed(4)}
              </Text>
            </View>
          )}
        </LinearGradient>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {quickStats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Map Button */}
        {isOnline && (
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => navigation.navigate(SCREENS.DRIVER_MAP)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#004553", "#006D84", "#008FA5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mapButtonGradient}
            >
              <MaterialIcons name="map" size={28} color="#fff" />
              <View style={styles.mapButtonTextContainer}>
                <Text style={styles.mapButtonTitle}>
                  Mở Bản Đồ & Nhận Chuyến
                </Text>
                <Text style={styles.mapButtonSubtitle}>
                  Xem vị trí và nhận yêu cầu trực tiếp
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={28} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Lưu ý khi Online</Text>
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <MaterialIcons name="update" size={20} color="#004553" />
            </View>
            <Text style={styles.infoText}>
              Vị trí cập nhật mỗi 5 giây
            </Text>
          </View>
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <MaterialIcons
                name="battery-charging-full"
                size={20}
                color="#004553"
              />
            </View>
            <Text style={styles.infoText}>
              Tối ưu pin, không ảnh hưởng thiết bị
            </Text>
          </View>
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <MaterialIcons name="visibility" size={20} color="#004553" />
            </View>
            <Text style={styles.infoText}>
              Hành khách thấy vị trí của bạn
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
    backgroundColor: "#F0F4F8",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  statusHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  statusIconContainer: {
    marginBottom: 16,
  },
  iconGlow: {
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  statusTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  statusSubtitle: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    fontWeight: "500",
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    marginBottom: 12,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    gap: 8,
  },
  locationText: {
    fontSize: 13,
    color: "#fff",
    flex: 1,
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#004553",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  mapButton: {
    borderRadius: 20,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#004553",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  mapButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  mapButtonTextContainer: {
    flex: 1,
  },
  mapButtonTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  mapButtonSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: "500",
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#004553",
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 12,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E0F2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: {
    fontSize: 14,
    color: "#4B5563",
    flex: 1,
    lineHeight: 20,
    fontWeight: "500",
  },
});

export default DriverStatusScreen;
