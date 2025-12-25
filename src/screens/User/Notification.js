import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SectionList,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import COLORS from "../../constant/colors";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../../services/notificationService";
import { supabase } from "../../config/supabaseClient";
import AsyncStorageService from "../../services/AsyncStorageService";
import SCREENS from "../../screens";
import GradientHeader from "../../components/GradientHeader";
import SnowEffect from "../../components/SnowEffect";

const Notification = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("activity"); // Default to activity
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  const formatTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
      return "";
    }
  };

  const getSectionTitle = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isToday) return "TODAY";
    if (isYesterday) return "YESTERDAY";
    return date
      .toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
      .toUpperCase();
  };

  const fetchNotifications = async () => {
    try {
      const response = await getMyNotifications();
      // Backend returns ApiResponse<List<NotificationResponse>>
      // Structure: { success: true, message: "...", data: [...] }
      // notificationService returns response.data (from axios)
      // So response.data is the ApiResponse, and response.data.data is the array
      const apiResponse = response?.data || response;
      const notificationsList = Array.isArray(apiResponse?.data)
        ? apiResponse.data
        : Array.isArray(apiResponse)
        ? apiResponse
        : [];

      const mappedData = notificationsList.map((n) => ({
        id: n.id,
        type: n.type,
        category: getCategory(n.type),
        title: n.title || "Notification", // Ensure title exists
        message: n.body || n.message || "", // Support both 'body' and 'message'
        createdAt: n.createdAt,
        time: formatTime(n.createdAt),
        icon: getIconForType(n.type),
        iconColor: getColorForType(n.type),
        bgColor: getBgColorForType(n.type),
        isRead: n.isRead || false,
        referenceId: n.referenceId,
      }));
      // Sort by date desc
      mappedData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setNotifications(mappedData);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      // Set empty array on error instead of mock data
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const getUser = async () => {
      const u = await AsyncStorageService.getUser();
      if (u) setUserId(u.id);
    };
    getUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  useEffect(() => {
    if (!userId || !supabase) return;

    const channel = supabase
      .channel(`public:notifications:user_id=eq.${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("New notification received:", payload);
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const getCategory = (type) => {
    if (type === "PROMOTION") return "promotion";
    if (type === "SYSTEM") return "system";
    // NEW_MESSAGE goes to activity
    return "activity";
  };

  const getIconForType = (type) => {
    switch (type) {
      case "MATCH_ACCEPTED":
        return "check";
      case "DRIVER_ARRIVED":
        return "directions-car";
      case "TRIP_STARTED":
        return "play-arrow";
      case "TRIP_ENDED":
        return "flag";
      case "MATCH_CANCELLED":
        return "close";
      case "PROMOTION":
        return "local-offer";
      case "SYSTEM":
        return "info";
      case "REFUND_PROCESSED":
        return "attach-money";
      case "NEW_MESSAGE":
        return "chat";
      default:
        return "notifications";
    }
  };

  const getColorForType = (type) => {
    // Tất cả icon đều dùng màu hồng theme
    return "#FF5370";
  };

  const getBgColorForType = (type) => {
    // Tất cả background đều dùng màu hồng nhạt theme
    return "#FFE5EC";
  };

  const handleMarkAsRead = async (id) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );

      await markAsRead(id);
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleNotificationPress = async (item) => {
    // 1. Mark as read
    handleMarkAsRead(item.id);

    console.log("Handling notification press:", item.type, item.referenceId);

    // 2. Navigate based on type
    switch (item.type) {
      case "MATCH_ACCEPTED":
      case "DRIVER_ARRIVED":
      case "TRIP_STARTED":
      case "TRIP_ENDED":
        if (item.referenceId) {
          // TODO: Depending on status, might want to go to different screens
          // For now, MatchedRideScreen handles active rides
          navigation.navigate(SCREENS.MATCHED_RIDE, {
            rideId: item.referenceId,
          });
        }
        break;

      case "NEW_MESSAGE":
        if (item.referenceId) {
          // Navigate to chat - phone not available from notification
          navigation.navigate("ChatScreen", {
            channelId: `match-${item.referenceId}`,
            otherUserId: null,
            otherUserName: "User",
            otherUserAvatar: null,
            otherUserPhone: null,
          });
        }
        break;

      case "RIDE_COMPLETED":
        navigation.navigate(SCREENS.RIDE_HISTORY);
        break;

      case "PAYMENT_SUCCESS":
      case "MEMBERSHIP_ACTIVATED":
        navigation.navigate(SCREENS.PAYMENT_HISTORY);
        break;

      default:
        console.log("No specific navigation for this notification type");
    }
  };

  // Group notifications for SectionList
  const getGroupedNotifications = () => {
    const filtered = notifications.filter((n) => n.category === activeTab);
    const grouped = filtered.reduce((acc, curr) => {
      const title = getSectionTitle(curr.createdAt);

      const existingSection = acc.find((s) => s.title === title);
      if (existingSection) {
        existingSection.data.push(curr);
      } else {
        acc.push({ title, data: [curr] });
      }
      return acc;
    }, []);

    return grouped;
  };

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.itemContainer, !item.isRead && styles.unreadItem]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconCircle, { backgroundColor: "#FFE5EC" }]}>
        <MaterialIcons name={item.icon} size={24} color="#FF5370" />
      </View>
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.itemTitle, !item.isRead && styles.unreadTitle]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
        <Text
          style={[styles.itemMessage, !item.isRead && styles.unreadMessage]}
          numberOfLines={2}
        >
          {item.message}
        </Text>
        <Text style={styles.itemTime}>{item.time}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderTabButton = (tabKey, label) => {
    const isActive = activeTab === tabKey;
    return (
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => setActiveTab(tabKey)}
      >
        {isActive ? (
          <LinearGradient
            colors={["#FF5370", "#FF6B9D", "#FF8FAB"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.tabGradient}
          >
            <Text style={styles.tabTextActive}>{label}</Text>
          </LinearGradient>
        ) : (
          <View style={styles.tabTextContainer}>
            <Text style={styles.tabText}>{label}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <SnowEffect />
      <GradientHeader
        title="🔔 Thông báo"
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
      />

      {/* Tabs */}
      <View style={styles.tabWrapper}>
        <View style={styles.tabContainer}>
          {renderTabButton("activity", "Hoạt động")}
          {renderTabButton("promotion", "Khuyến mãi")}
          {renderTabButton("system", "Hệ thống")}
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5370" />
        </View>
      ) : (
        <SectionList
          sections={getGroupedNotifications()}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderNotificationItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false} // Disabled to prevent overlap issues
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🔔</Text>
              <Text style={styles.emptyText}>Chưa có thông báo</Text>
              <Text style={styles.emptySubtext}>
                Thông báo mới sẽ hiển thị tại đây
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF5F7",
  },
  tabWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 20,
    backgroundColor: "#FFE5EC",
    borderBottomWidth: 2,
    borderBottomColor: "#FF6B9D",
  },
  tabContainer: {
    flexDirection: "row",
    gap: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 90,
  },
  tabTextContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255, 83, 112, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 90,
  },
  tabText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
  tabTextActive: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sectionHeader: {
    paddingVertical: 12,
    marginTop: 8,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FF5370",
    letterSpacing: 0.5,
  },
  itemContainer: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#FFE5EC",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: "flex-start",
  },
  unreadItem: {
    borderColor: "#FF6B9D",
    backgroundColor: "#FFF5F7",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    borderWidth: 2,
    borderColor: "#FF6B9D",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontWeight: "800",
    color: "#FF5370",
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF5370",
  },
  itemMessage: {
    fontSize: 14,
    color: "#8E8E93",
    lineHeight: 20,
    marginBottom: 6,
  },
  unreadMessage: {
    color: "#1A1A1A",
    fontWeight: "500",
  },
  itemTime: {
    fontSize: 12,
    color: "#8E8E93",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF5370",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
  },
});

export default Notification;
