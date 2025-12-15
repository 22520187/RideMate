import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constant/colors";
import TripDetail from "./TripDetail";
import { getTrips, getTripById } from "../../services/adminService";

const tripStatuses = [
  { key: "all", label: "Tất cả" },
  { key: "open", label: "Mở" },
  { key: "matched", label: "Đã ghép" },
  { key: "in_progress", label: "Đang diễn ra" },
  { key: "completed", label: "Đã hoàn thành" },
  { key: "cancelled", label: "Đã hủy" },
];

const statusStyles = {
  open: {
    color: COLORS.BLUE,
    backgroundColor: COLORS.BLUE_LIGHT,
    label: "Mở",
  },
  matched: {
    color: COLORS.PURPLE,
    backgroundColor: COLORS.Light_Cyan,
    label: "Đã ghép",
  },
  in_progress: {
    color: COLORS.ORANGE_DARK,
    backgroundColor: COLORS.ORANGE_LIGHT,
    label: "Đang diễn ra",
  },
  completed: {
    color: COLORS.GREEN,
    backgroundColor: COLORS.GREEN_LIGHT,
    label: "Đã hoàn thành",
  },
  cancelled: {
    color: COLORS.RED,
    backgroundColor: COLORS.RED_LIGHT,
    label: "Đã hủy",
  },
};

const initialTrips = [
  {
    id: "RM-2024-109",
    driver: {
      id: "USR-1001",
      name: "Nguyễn Văn A",
      phone: "0901 234 567",
      rating: 4.8,
      avatar: "https://i.pravatar.cc/150?img=1",
    },
    startLocation: "Quận 1, TP.HCM",
    endLocation: "Thành phố Thủ Đức, TP.HCM",
    startTime: "12/11/2024 • 08:00",
    endTime: "12/11/2024 • 09:30",
    status: "matched",
    createdAt: "11/11/2024 • 20:00",
    polyline: [
      { latitude: 10.7769, longitude: 106.7009 },
      { latitude: 10.8503, longitude: 106.7717 },
    ],
    origin: { latitude: 10.7769, longitude: 106.7009, description: "Quận 1" },
    destination: {
      latitude: 10.8503,
      longitude: 106.7717,
      description: "Thủ Đức",
    },
    riderRequests: [
      { id: "R1", name: "Trần Thị B", phone: "0908 765 432", rating: 4.6 },
      { id: "R2", name: "Lê Văn C", phone: "0912 345 678", rating: 4.2 },
      { id: "R3", name: "Phạm Thị D", phone: "0933 456 789", rating: 4.8 },
    ],
    matchedRiders: [
      { id: "R1", name: "Trần Thị B", phone: "0908 765 432", rating: 4.6 },
      { id: "R2", name: "Lê Văn C", phone: "0912 345 678", rating: 4.2 },
    ],
    sessions: [
      {
        id: "SES-001",
        rider: {
          id: "R1",
          name: "Trần Thị B",
          phone: "0908 765 432",
          rating: 4.6,
        },
        rating: {
          driverRating: 5,
          riderRating: 4.5,
          driverComment: "Rất tốt",
          riderComment: "Tài xế thân thiện",
        },
        chatMessages: [
          { sender: "driver", message: "Xin chào", timestamp: "08:00" },
          { sender: "rider", message: "Chào bạn", timestamp: "08:01" },
        ],
        feedback: "Chuyến đi rất tốt",
      },
      {
        id: "SES-002",
        rider: {
          id: "R2",
          name: "Lê Văn C",
          phone: "0912 345 678",
          rating: 4.2,
        },
        rating: {
          driverRating: 4,
          riderRating: 4.5,
          driverComment: "Ổn",
          riderComment: "OK",
        },
        chatMessages: [],
        feedback: "Bình thường",
      },
    ],
    tripRating: 4.7,
  },
  {
    id: "RM-2024-110",
    driver: {
      id: "USR-1002",
      name: "Trần Thị B",
      phone: "0908 765 432",
      rating: 4.6,
      avatar: "https://i.pravatar.cc/150?img=2",
    },
    startLocation: "Quận 7, TP.HCM",
    endLocation: "Bình Thạnh, TP.HCM",
    startTime: "Hôm nay • 10:30",
    endTime: "Hôm nay • 11:45",
    status: "in_progress",
    createdAt: "Hôm nay • 09:00",
    polyline: [
      { latitude: 10.7306, longitude: 106.7194 },
      { latitude: 10.8014, longitude: 106.7145 },
    ],
    origin: { latitude: 10.7306, longitude: 106.7194, description: "Quận 7" },
    destination: {
      latitude: 10.8014,
      longitude: 106.7145,
      description: "Bình Thạnh",
    },
    riderRequests: [
      { id: "R4", name: "Nguyễn Văn E", phone: "0911 222 333", rating: 4.5 },
    ],
    matchedRiders: [
      { id: "R4", name: "Nguyễn Văn E", phone: "0911 222 333", rating: 4.5 },
    ],
    sessions: [
      {
        id: "SES-003",
        rider: {
          id: "R4",
          name: "Nguyễn Văn E",
          phone: "0911 222 333",
          rating: 4.5,
        },
        rating: null,
        chatMessages: [
          { sender: "driver", message: "Đang đến", timestamp: "10:25" },
        ],
        feedback: null,
      },
    ],
    tripRating: null,
  },
  {
    id: "RM-2024-111",
    driver: {
      id: "USR-1003",
      name: "Phạm Văn C",
      phone: "0912 345 678",
      rating: 4.5,
      avatar: "https://i.pravatar.cc/150?img=3",
    },
    startLocation: "Tân Bình, TP.HCM",
    endLocation: "Gò Vấp, TP.HCM",
    startTime: "Hôm qua • 17:45",
    endTime: "Hôm qua • 18:30",
    status: "completed",
    createdAt: "Hôm qua • 16:00",
    polyline: null,
    origin: null,
    destination: null,
    riderRequests: [],
    matchedRiders: [
      { id: "R5", name: "Đỗ Thị F", phone: "0922 333 444", rating: 4.7 },
    ],
    sessions: [
      {
        id: "SES-004",
        rider: {
          id: "R5",
          name: "Đỗ Thị F",
          phone: "0922 333 444",
          rating: 4.7,
        },
        rating: {
          driverRating: 5,
          riderRating: 5,
          driverComment: "Tuyệt vời",
          riderComment: "Rất hài lòng",
        },
        chatMessages: [
          { sender: "driver", message: "Cảm ơn bạn", timestamp: "18:30" },
          { sender: "rider", message: "Cảm ơn tài xế", timestamp: "18:31" },
        ],
        feedback: "Chuyến đi xuất sắc",
      },
    ],
    tripRating: 5.0,
  },
  {
    id: "RM-2024-112",
    driver: {
      id: "USR-1004",
      name: "Lê Thị D",
      phone: "0933 456 789",
      rating: 4.9,
      avatar: "https://i.pravatar.cc/150?img=4",
    },
    startLocation: "Quận 4, TP.HCM",
    endLocation: "Quận 12, TP.HCM",
    startTime: "13/11/2024 • 19:15",
    endTime: "13/11/2024 • 20:30",
    status: "open",
    createdAt: "12/11/2024 • 18:00",
    polyline: null,
    origin: null,
    destination: null,
    riderRequests: [],
    matchedRiders: [],
    sessions: [],
    tripRating: null,
  },
  {
    id: "RM-2024-107",
    driver: {
      id: "USR-1005",
      name: "Đỗ Thị D",
      phone: "0944 567 890",
      rating: 4.3,
      avatar: "https://i.pravatar.cc/150?img=5",
    },
    startLocation: "Quận 4, TP.HCM",
    endLocation: "Quận 12, TP.HCM",
    startTime: "10/11/2024 • 19:15",
    endTime: "-",
    status: "cancelled",
    createdAt: "10/11/2024 • 18:00",
    polyline: null,
    origin: null,
    destination: null,
    riderRequests: [],
    matchedRiders: [],
    sessions: [],
    tripRating: null,
  },
];

const TripManagement = () => {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [showSessionDetailModal, setShowSessionDetailModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Fetch trips from API
  const fetchTrips = useCallback(
    async (pageNum = 0, filterStatus = selectedFilter) => {
      try {
        if (pageNum === 0) {
          setLoading(true);
        }

        const params = {
          page: pageNum,
          size: 20,
          sortBy: "createdAt",
          sortDirection: "DESC",
        };

        // Add status filter if not 'all'
        if (filterStatus !== "all") {
          params.status = filterStatus.toUpperCase();
        }

        const response = await getTrips(params);

        if (response?.data) {
          const newTrips = response.data.content || [];

          if (pageNum === 0) {
            setTrips(newTrips);
          } else {
            setTrips((prev) => [...prev, ...newTrips]);
          }

          setHasMore(!response.data.last);
          setPage(pageNum);
        }
      } catch (error) {
        console.error("Error fetching trips:", error);
        Alert.alert(
          "Lỗi",
          "Không thể tải danh sách chuyến đi. Vui lòng thử lại."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedFilter]
  );

  // Initial load
  useEffect(() => {
    fetchTrips(0, selectedFilter);
  }, [selectedFilter]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(0);
    setHasMore(true);
    fetchTrips(0, selectedFilter);
  }, [selectedFilter, fetchTrips]);

  // Load more
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchTrips(page + 1, selectedFilter);
    }
  }, [loading, hasMore, page, selectedFilter, fetchTrips]);

  const filteredTrips = useMemo(() => {
    return trips;
  }, [trips]);

  const handleViewDetail = (trip) => {
    setSelectedTrip(trip);
    setShowDetailModal(true);
  };

  const handleViewSessions = (trip) => {
    setSelectedTrip(trip);
    setShowSessionsModal(true);
  };

  const handleViewSessionDetail = (session) => {
    setSelectedSession(session);
    setShowSessionDetailModal(true);
  };

  const renderTripCard = ({ item }) => {
    const statusKey = item.status?.toLowerCase() || "open";
    const status = statusStyles[statusKey] || statusStyles.open;

    // Format dates
    const formatDate = (dateStr) => {
      if (!dateStr) return "-";
      const date = new Date(dateStr);
      return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    return (
      <TouchableOpacity
        style={styles.tripCard}
        onPress={() => handleViewDetail(item)}
        activeOpacity={0.7}
      >
        <View style={styles.tripHeader}>
          <View style={styles.tripHeaderLeft}>
            <Text style={styles.tripId}>#{item.id}</Text>
            <Text style={styles.routeText}>
              {item.startLocation} → {item.endLocation}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: status.backgroundColor },
            ]}
          >
            <Text style={[styles.statusLabel, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        <View style={styles.tripInfoRow}>
          <View style={styles.tripInfoItem}>
            <Ionicons name="person-outline" size={14} color={COLORS.GRAY} />
            <Text style={styles.tripInfoText}>
              {item.driver?.fullName || "N/A"}
            </Text>
          </View>
          <View style={styles.tripInfoItem}>
            <Ionicons name="time-outline" size={14} color={COLORS.GRAY} />
            <Text style={styles.tripInfoText}>
              {formatDate(item.startTime)}
            </Text>
          </View>
        </View>

        {item.totalPassengers > 0 && (
          <View style={styles.matchedInfo}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.GREEN} />
            <Text style={styles.matchedText}>
              {item.totalPassengers} hành khách
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Quản lý chuyến đi</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterBar}
          contentContainerStyle={styles.filterContent}
        >
          {tripStatuses.map((status) => {
            const isActive = selectedFilter === status.key;
            return (
              <TouchableOpacity
                key={status.key}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setSelectedFilter(status.key)}
              >
                <Text
                  style={[
                    styles.filterLabel,
                    isActive && styles.filterLabelActive,
                  ]}
                >
                  {status.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading && page === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Đang tải chuyến đi...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTrips}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTripCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.PRIMARY]}
              tintColor={COLORS.PRIMARY}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => {
            if (loading && page > 0) {
              return (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                </View>
              );
            }
            return null;
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={48} color={COLORS.GRAY} />
              <Text style={styles.emptyTitle}>Không có chuyến đi nào</Text>
              <Text style={styles.emptyDescription}>
                Thử đổi bộ lọc hoặc kiểm tra lại sau.
              </Text>
            </View>
          }
        />
      )}

      {/* Trip Detail Modal */}
      <TripDetail
        visible={showDetailModal}
        trip={selectedTrip}
        onClose={() => setShowDetailModal(false)}
        onViewSessions={handleViewSessions}
      />

      {/* Modal: Sessions Management */}
      <Modal
        visible={showSessionsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSessionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sessions Management</Text>
              <TouchableOpacity onPress={() => setShowSessionsModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.BLACK} />
              </TouchableOpacity>
            </View>
            {selectedTrip && (
              <ScrollView style={styles.modalBody}>
                {selectedTrip.sessions && selectedTrip.sessions.length > 0 ? (
                  selectedTrip.sessions.map((session) => (
                    <TouchableOpacity
                      key={session.id}
                      style={styles.sessionCard}
                      onPress={() => handleViewSessionDetail(session)}
                    >
                      <View style={styles.sessionHeader}>
                        <Text style={styles.sessionId}>{session.id}</Text>
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={COLORS.GRAY}
                        />
                      </View>
                      <View style={styles.sessionInfo}>
                        <Text style={styles.sessionRiderName}>
                          Rider: {session.rider.name}
                        </Text>
                        {session.rating && (
                          <View style={styles.sessionRating}>
                            <Ionicons
                              name="star"
                              size={14}
                              color={COLORS.ORANGE_DARK}
                            />
                            <Text style={styles.sessionRatingText}>
                              Driver: {session.rating.driverRating} | Rider:{" "}
                              {session.rating.riderRating}
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons
                      name="people-outline"
                      size={48}
                      color={COLORS.GRAY}
                    />
                    <Text style={styles.emptyTitle}>Không có session nào</Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal: Session Detail */}
      <Modal
        visible={showSessionDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSessionDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết Session</Text>
              <TouchableOpacity
                onPress={() => setShowSessionDetailModal(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.BLACK} />
              </TouchableOpacity>
            </View>
            {selectedSession && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Session ID: {selectedSession.id}
                  </Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Rider:</Text>
                    <Text style={styles.detailValue}>
                      {selectedSession.rider.name}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Số điện thoại:</Text>
                    <Text style={styles.detailValue}>
                      {selectedSession.rider.phone}
                    </Text>
                  </View>
                </View>

                {/* Chat Messages */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Nội dung chat</Text>
                  {selectedSession.chatMessages &&
                  selectedSession.chatMessages.length > 0 ? (
                    selectedSession.chatMessages.map((msg, index) => (
                      <View
                        key={index}
                        style={[
                          styles.chatMessage,
                          msg.sender === "driver"
                            ? styles.driverMessage
                            : styles.riderMessage,
                        ]}
                      >
                        <Text style={styles.chatSender}>
                          {msg.sender === "driver" ? "Tài xế" : "Rider"}
                        </Text>
                        <Text style={styles.chatText}>{msg.message}</Text>
                        <Text style={styles.chatTime}>{msg.timestamp}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>Không có tin nhắn</Text>
                  )}
                </View>

                {/* Rating */}
                {selectedSession.rating && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Đánh giá</Text>
                    <View style={styles.ratingCard}>
                      <View style={styles.ratingItem}>
                        <Text style={styles.ratingLabel}>
                          Tài xế đánh giá rider:
                        </Text>
                        <View style={styles.ratingValue}>
                          <Ionicons
                            name="star"
                            size={16}
                            color={COLORS.ORANGE_DARK}
                          />
                          <Text style={styles.ratingText}>
                            {selectedSession.rating.driverRating}
                          </Text>
                        </View>
                      </View>
                      {selectedSession.rating.driverComment && (
                        <Text style={styles.ratingComment}>
                          "{selectedSession.rating.driverComment}"
                        </Text>
                      )}
                      <View style={styles.ratingItem}>
                        <Text style={styles.ratingLabel}>
                          Rider đánh giá tài xế:
                        </Text>
                        <View style={styles.ratingValue}>
                          <Ionicons
                            name="star"
                            size={16}
                            color={COLORS.ORANGE_DARK}
                          />
                          <Text style={styles.ratingText}>
                            {selectedSession.rating.riderRating}
                          </Text>
                        </View>
                      </View>
                      {selectedSession.rating.riderComment && (
                        <Text style={styles.ratingComment}>
                          "{selectedSession.rating.riderComment}"
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {/* Feedback */}
                {selectedSession.feedback && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Feedback</Text>
                    <View style={styles.feedbackCard}>
                      <Text style={styles.feedbackText}>
                        {selectedSession.feedback}
                      </Text>
                    </View>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  header: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    width: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.WHITE,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: COLORS.WHITE,
    opacity: 0.9,
    lineHeight: 20,
  },
  filterContainer: {
    height: 50,
    marginTop: 8,
  },
  filterBar: {
    flex: 1,
  },
  filterContent: {
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  filterChipActive: {
    backgroundColor: COLORS.BLUE,
    borderColor: COLORS.BLUE,
  },
  filterLabel: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  filterLabelActive: {
    color: COLORS.WHITE,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  tripCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  tripHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  tripHeaderLeft: {
    flex: 1,
  },
  tripId: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.GRAY,
    marginBottom: 4,
  },
  routeText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.BLACK,
  },
  tripInfoRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  tripInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  tripInfoText: {
    fontSize: 13,
    color: COLORS.GRAY,
  },
  matchedInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    padding: 8,
    backgroundColor: COLORS.GREEN_LIGHT,
    borderRadius: 8,
  },
  matchedText: {
    fontSize: 13,
    color: COLORS.GREEN,
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  tripDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  tripDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  locationInfo: {
    flex: 1,
    marginLeft: 4,
  },
  locationLabel: {
    fontSize: 12,
    color: COLORS.GRAY,
    fontWeight: "500",
  },
  locationText: {
    fontSize: 14,
    color: COLORS.BLACK,
    fontWeight: "500",
  },
  tripDetailText: {
    fontSize: 13,
    color: COLORS.GRAY,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.BLACK,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.GRAY,
    fontStyle: "italic",
  },
  sessionCard: {
    backgroundColor: COLORS.BG,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sessionId: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  sessionInfo: {
    gap: 6,
  },
  sessionRiderName: {
    fontSize: 14,
    color: COLORS.BLACK,
    fontWeight: "500",
  },
  sessionRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sessionRatingText: {
    fontSize: 12,
    color: COLORS.GRAY,
  },
  chatMessage: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  driverMessage: {
    backgroundColor: COLORS.BLUE_LIGHT,
    alignSelf: "flex-start",
    maxWidth: "80%",
  },
  riderMessage: {
    backgroundColor: COLORS.GREEN_LIGHT,
    alignSelf: "flex-end",
    maxWidth: "80%",
  },
  chatSender: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.GRAY,
    marginBottom: 4,
  },
  chatText: {
    fontSize: 14,
    color: COLORS.BLACK,
    marginBottom: 4,
  },
  chatTime: {
    fontSize: 11,
    color: COLORS.GRAY,
  },
  ratingCard: {
    backgroundColor: COLORS.BG,
    borderRadius: 12,
    padding: 16,
  },
  ratingItem: {
    marginBottom: 12,
  },
  ratingLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.GRAY,
    marginBottom: 6,
  },
  ratingValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.BLACK,
  },
  ratingComment: {
    fontSize: 13,
    color: COLORS.BLACK,
    fontStyle: "italic",
    marginTop: 6,
    paddingLeft: 8,
  },
  feedbackCard: {
    backgroundColor: COLORS.BG,
    borderRadius: 12,
    padding: 16,
  },
  feedbackText: {
    fontSize: 14,
    color: COLORS.BLACK,
    lineHeight: 20,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12,
    width: Dimensions.get("window").width - 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.BLACK,
  },
  emptyDescription: {
    fontSize: 13,
    color: COLORS.GRAY,
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 18,
  },
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
  mapModalBody: {
    height: Dimensions.get("window").height * 0.6,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
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
  riderCard: {
    backgroundColor: COLORS.BG,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  riderInfo: {
    gap: 8,
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
  },
  riderDetailText: {
    fontSize: 13,
    color: COLORS.GRAY,
  },
  selectedRiderHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.GRAY,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});

export default TripManagement;
