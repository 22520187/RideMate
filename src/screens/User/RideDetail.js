import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import COLORS from "../../constant/colors";

const RideDetail = ({ route, navigation }) => {
  const { rideId } = route.params;
  const [loading, setLoading] = useState(true);
  const [ride, setRide] = useState(null);

  useEffect(() => {
    // Mock data for now
    setTimeout(() => {
      setRide({
        id: rideId,
        status: "COMPLETED",
        pickupAddress: "456 Elm Street, Springfield",
        destinationAddress: "739 Main Street, Springfield",
        price: 120000,
        distance: 12000,
        duration: 25,
        createdAt: new Date().toISOString(),
        driver: {
          name: "Nguyễn Văn A",
          phone: "0912345678",
          avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=driver1",
          rating: 4.8,
          vehicle: {
            brand: "Toyota",
            model: "Vios",
            color: "Trắng",
            licensePlate: "29A-12345",
          },
        },
        messages: [
          {
            id: 1,
            sender: "driver",
            text: "Xin chào, tôi đang trên đường đến điểm đón",
            time: "10:30",
          },
          {
            id: 2,
            sender: "passenger",
            text: "Vâng, cảm ơn anh!",
            time: "10:31",
          },
        ],
      });
      setLoading(false);
    }, 500);
  }, [rideId]);

  const getStatusColor = (status) => {
    switch (status) {
      case "COMPLETED":
        return COLORS.GREEN;
      case "CANCELLED":
        return COLORS.RED;
      case "IN_PROGRESS":
        return "#2196F3";
      default:
        return COLORS.GRAY;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "COMPLETED":
        return "Hoàn thành";
      case "CANCELLED":
        return "Đã hủy";
      case "IN_PROGRESS":
        return "Đang diễn ra";
      default:
        return status;
    }
  };

  const handleCall = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleMessage = () => {
    navigation.navigate("ChatScreen", {
      rideId: ride.id,
      driver: {
        id: ride.driver.id || 1,
        name: ride.driver.name,
        avatar: ride.driver.avatar,
      },
      previousMessages: ride.messages || [],
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = getStatusColor(ride.status);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết chuyến đi</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <LinearGradient
            colors={[statusColor, statusColor + "CC"]}
            style={styles.statusGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons
              name={
                ride.status === "COMPLETED"
                  ? "checkmark-circle"
                  : "alert-circle"
              }
              size={48}
              color="#fff"
            />
            <Text style={styles.statusText}>{getStatusText(ride.status)}</Text>
            <Text style={styles.statusSubtext}>
              {new Date(ride.createdAt).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </LinearGradient>
        </View>

        {/* Driver Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin tài xế</Text>
          <View style={styles.driverCard}>
            <Image
              source={{ uri: ride.driver.avatar }}
              style={styles.driverAvatar}
            />
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{ride.driver.name}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={16} color="#FFB800" />
                <Text style={styles.ratingText}>{ride.driver.rating}</Text>
              </View>
              <Text style={styles.vehicleText}>
                {ride.driver.vehicle.brand} {ride.driver.vehicle.model} •{" "}
                {ride.driver.vehicle.color}
              </Text>
              <Text style={styles.licensePlate}>
                {ride.driver.vehicle.licensePlate}
              </Text>
            </View>
            <View style={styles.driverActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleCall(ride.driver.phone)}
              >
                <Ionicons name="call" size={20} color={COLORS.PRIMARY} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleMessage}
              >
                <Ionicons
                  name="chatbubble"
                  size={20}
                  color={COLORS.PRIMARY}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Route Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lộ trình</Text>
          <View style={styles.routeCard}>
            <View style={styles.routeRow}>
              <View style={styles.routeIconContainer}>
                <View style={[styles.routeDot, { backgroundColor: COLORS.PRIMARY }]} />
                <View style={styles.routeLine} />
              </View>
              <View style={styles.routeContent}>
                <Text style={styles.routeLabel}>Điểm đón</Text>
                <Text style={styles.routeAddress}>{ride.pickupAddress}</Text>
              </View>
            </View>

            <View style={styles.routeRow}>
              <View style={styles.routeIconContainer}>
                <View style={[styles.routeDot, { backgroundColor: COLORS.RED }]} />
              </View>
              <View style={styles.routeContent}>
                <Text style={styles.routeLabel}>Điểm đến</Text>
                <Text style={styles.routeAddress}>{ride.destinationAddress}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Trip Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin chuyến đi</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="cash-outline" size={24} color={COLORS.PRIMARY} />
                <Text style={styles.detailLabel}>Tổng tiền</Text>
                <Text style={styles.detailValue}>
                  {ride.price.toLocaleString()}đ
                </Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailItem}>
                <Ionicons name="navigate-outline" size={24} color={COLORS.PRIMARY} />
                <Text style={styles.detailLabel}>Quãng đường</Text>
                <Text style={styles.detailValue}>
                  {(ride.distance / 1000).toFixed(1)} km
                </Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={24} color={COLORS.PRIMARY} />
                <Text style={styles.detailLabel}>Thời gian</Text>
                <Text style={styles.detailValue}>{ride.duration} phút</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Messages */}
        {ride.messages && ride.messages.length > 0 && (
          <View style={styles.section}>
            <View style={styles.messagesHeader}>
              <Text style={styles.sectionTitle}>Tin nhắn</Text>
              <TouchableOpacity onPress={handleMessage}>
                <Text style={styles.viewAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.messagesCard}>
              <ScrollView 
                style={styles.messagesScroll}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                {ride.messages.map((message) => (
                  <View
                    key={message.id}
                    style={[
                      styles.messageRow,
                      message.sender === "passenger" && styles.messageRowRight,
                    ]}
                  >
                    <View
                      style={[
                        styles.messageBubble,
                        message.sender === "passenger" && styles.messageBubbleRight,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          message.sender === "passenger" && styles.messageTextRight,
                        ]}
                      >
                        {message.text}
                      </Text>
                      <Text
                        style={[
                          styles.messageTime,
                          message.sender === "passenger" && styles.messageTimeRight,
                        ]}
                      >
                        {message.time}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {ride.status === "COMPLETED" && (
            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Đặt lại chuyến này</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Báo cáo vấn đề</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
  },

  // Status Card
  statusCard: {
    margin: 20,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  statusGradient: {
    padding: 32,
    alignItems: "center",
  },
  statusText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginTop: 12,
  },
  statusSubtext: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },

  // Section
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 12,
  },

  // Driver Card
  driverCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  driverAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F0F0F0",
  },
  driverInfo: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  vehicleText: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 4,
  },
  licensePlate: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.PRIMARY,
    marginTop: 2,
  },
  driverActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },

  // Route Card
  routeCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  routeRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  routeIconContainer: {
    alignItems: "center",
    marginRight: 16,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  routeLine: {
    width: 2,
    height: 40,
    backgroundColor: "#E0E0E0",
    marginVertical: 4,
  },
  routeContent: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    color: "#8E8E93",
    marginBottom: 4,
  },
  routeAddress: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1C1E",
    lineHeight: 20,
  },

  // Details Card
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  detailItem: {
    alignItems: "center",
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 8,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    marginTop: 4,
  },
  detailDivider: {
    width: 1,
    height: 60,
    backgroundColor: "#F0F0F0",
  },

  // Messages
  messagesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.PRIMARY,
  },
  messagesCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  messagesScroll: {
    maxHeight: 200,
  },
  messageRow: {
    marginBottom: 12,
    alignItems: "flex-start",
  },
  messageRowRight: {
    alignItems: "flex-end",
  },
  messageBubble: {
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 12,
    maxWidth: "80%",
  },
  messageBubbleRight: {
    backgroundColor: COLORS.PRIMARY,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    color: "#1C1C1E",
    lineHeight: 20,
  },
  messageTextRight: {
    color: "#fff",
  },
  messageTime: {
    fontSize: 11,
    color: "#8E8E93",
    marginTop: 4,
  },
  messageTimeRight: {
    color: "rgba(255,255,255,0.8)",
  },

  // Action Buttons
  actionSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
  },
});

export default RideDetail;
