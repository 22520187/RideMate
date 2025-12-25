import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constant/colors";
import RouteMap from "../../components/RouteMap";

const TripDetail = ({ visible, trip, onClose, onViewSessions }) => {
  if (!trip) return null;

  const formatLocation = (locationData) => {
    if (!locationData) return "Chưa xác định";

    try {
      if (typeof locationData === "object") {
        return (
          locationData.address ||
          locationData.name ||
          locationData.pickupAddress ||
          locationData.dropoffAddress ||
          "Vị trí bản đồ"
        );
      }

      if (
        typeof locationData === "string" &&
        (locationData.trim().startsWith("{") || locationData.trim().startsWith("["))
      ) {
        const parsed = JSON.parse(locationData);
        return (
          parsed.address ||
          parsed.name ||
          parsed.pickupAddress ||
          parsed.dropoffAddress ||
          locationData
        );
      }

      return locationData;
    } catch (error) {
      return locationData;
    }
  };

  const startLocation = trip.startLocation ?? trip.pickupAddress;
  const endLocation = trip.endLocation ?? trip.dropoffAddress;

  const driverName = trip.driver?.fullName ?? trip.driver?.name ?? trip.driverName ?? "N/A";
  const driverPhone =
    trip.driver?.phoneNumber ?? trip.driver?.phone ?? trip.driverPhone ?? "N/A";
  const driverRating =
    trip.driver?.rating ?? trip.driverRating;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chi tiết chuyến đi</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.BLACK} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            {/* Trip Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thông tin chuyến đi</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mã chuyến:</Text>
                <Text style={styles.detailValue}>{trip.id}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tuyến đường:</Text>
                <Text style={styles.detailValue}>
                  {formatLocation(startLocation)} → {formatLocation(endLocation)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Thời gian:</Text>
                <Text style={styles.detailValue}>
                  {trip.startTime} - {trip.endTime}
                </Text>
              </View>
              {trip.tripRating && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Đánh giá chuyến:</Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color={COLORS.ORANGE_DARK} />
                    <Text style={styles.ratingText}>{trip.tripRating}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Driver Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thông tin tài xế</Text>
              <View style={styles.driverInfoCard}>
                <Text style={styles.driverName}>{driverName}</Text>
                <View style={styles.driverDetails}>
                  <Ionicons name="call-outline" size={14} color={COLORS.GRAY} />
                  <Text style={styles.driverDetailText}>{driverPhone}</Text>
                </View>
                <View style={styles.driverDetails}>
                  <Ionicons name="star" size={14} color={COLORS.ORANGE_DARK} />
                  <Text style={styles.driverDetailText}>
                    Đánh giá: {typeof driverRating === "number" ? driverRating.toFixed(1) : "N/A"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Matched Passengers */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Hành khách đã được ghép ({trip.matchedRiders?.length || 0})
              </Text>
              {trip.matchedRiders && trip.matchedRiders.length > 0 ? (
                trip.matchedRiders.map((rider) => (
                  <View key={rider.id} style={[styles.riderCard, styles.matchedRiderCard]}>
                    <View style={styles.selectedRiderHeader}>
                      <Ionicons name="checkmark-circle" size={18} color={COLORS.GREEN} />
                      <Text style={styles.riderName}>{rider.fullName || rider.name || "N/A"}</Text>
                    </View>
                    <View style={styles.riderDetails}>
                      <Ionicons name="call-outline" size={14} color={COLORS.GRAY} />
                      <Text style={styles.riderDetailText}>
                        {rider.phoneNumber || rider.phone || "N/A"}
                      </Text>
                    </View>
                    <View style={styles.riderDetails}>
                      <Ionicons name="star" size={14} color={COLORS.ORANGE_DARK} />
                      <Text style={styles.riderDetailText}>
                        Đánh giá: {typeof rider.rating === "number" ? rider.rating.toFixed(1) : "N/A"}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Chưa có hành khách được ghép</Text>
              )}
            </View>

            {/* Sessions */}
            {trip.sessions && trip.sessions.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Sessions ({trip.sessions.length})</Text>
                  <TouchableOpacity
                    style={styles.viewSessionsButton}
                    onPress={() => onViewSessions(trip)}
                  >
                    <Text style={styles.viewSessionsText}>Xem Sessions</Text>
                    <Ionicons name="arrow-forward" size={16} color={COLORS.BLUE} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.sectionSubtitle}>
                  Session ID: {trip.sessions.map((s) => s.id).join(", ")}
                </Text>
              </View>
            )}

            {/* Map Route */}
            {trip.polyline && trip.origin && trip.destination && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Bản đồ tuyến đường</Text>
                <View style={styles.mapContainer}>
                  <RouteMap
                    origin={trip.origin}
                    destination={trip.destination}
                    path={trip.polyline}
                    height={200}
                    showRoute={true}
                  />
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    width: "90%",
    maxHeight: "80%",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  modalBody: {
    maxHeight: Dimensions.get("window").height * 0.6,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.BLACK,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.GRAY,
    marginTop: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.GRAY,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.BLACK,
    flex: 2,
    textAlign: "right",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.BLACK,
  },
  driverInfoCard: {
    backgroundColor: COLORS.BG,
    borderRadius: 12,
    padding: 16,
  },
  driverName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.BLACK,
    marginBottom: 8,
  },
  driverDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  driverDetailText: {
    fontSize: 13,
    color: COLORS.GRAY,
  },
  riderCard: {
    backgroundColor: COLORS.BG,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  matchedRiderCard: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.GREEN,
  },
  riderName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.BLACK,
  },
  riderDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  riderDetailText: {
    fontSize: 13,
    color: COLORS.GRAY,
  },
  selectedRiderHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  viewSessionsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.BLUE_LIGHT,
    borderRadius: 8,
  },
  viewSessionsText: {
    fontSize: 13,
    color: COLORS.BLUE,
    fontWeight: "600",
  },
  mapContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.GRAY,
    fontStyle: "italic",
  },
});

export default TripDetail;

