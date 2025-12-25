import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";
import {
  ArrowLeft,
  Gift,
  Star,
  Calendar,
} from "lucide-react-native";
import COLORS from "../../constant/colors";
import {
  getAvailableMissions,
  getMyMissions,
  acceptMission,
  claimMissionReward,
  getMissionStats,
} from "../../services/missionService";
import { getProfile } from "../../services/userService";
import SnowEffect from "../../components/SnowEffect";
import GradientHeader from "../../components/GradientHeader";

const Mission = ({ navigation, route }) => {
  const { mockMissions } = route?.params || {};

  // LIST MODE (Home service button passes mockMissions) -> do NOT call APIs
  if (Array.isArray(mockMissions)) {
    const [tab, setTab] = useState("available"); // 'available' | 'my'

    const formatDate = (dateString) => {
      if (!dateString) return "";
      const d = new Date(dateString);
      return d.toLocaleDateString("vi-VN");
    };

    const available = mockMissions.filter(
      (m) => m?.status === "AVAILABLE" || m?.status === "IN_PROGRESS"
    );
    const mine = mockMissions.filter(
      (m) => m?.status === "IN_PROGRESS" || m?.status === "COMPLETED"
    );

    const getStatusLabel = (status) => {
      switch (status) {
        case "AVAILABLE":
          return "Sẵn có";
        case "IN_PROGRESS":
          return "Đang làm";
        case "COMPLETED":
          return "Hoàn thành";
        case "EXPIRED":
          return "Hết hạn";
        default:
          return "Nhiệm vụ";
      }
    };

    const getStatusColor = (status) => {
      switch (status) {
        case "COMPLETED":
          return COLORS.GREEN;
        case "IN_PROGRESS":
          return COLORS.PRIMARY;
        case "EXPIRED":
          return COLORS.GRAY;
        default:
          return COLORS.ORANGE_DARK || COLORS.ORANGE || COLORS.PRIMARY;
      }
    };

    const renderMockItem = ({ item }) => {
      const progress = Number(item?.progress ?? 0);
      const target = Number(item?.target ?? 1);
      const percent = Math.min(100, Math.round((progress / target) * 100));
      const status = item?.status;
      const statusColor = getStatusColor(status);

      return (
        <View style={styles.missionCard}>
          <View style={styles.missionHeader}>
            <View style={[styles.iconContainer, { backgroundColor: "#00000010" }]}>
              <Gift size={20} color={COLORS.PRIMARY} />
            </View>
            <View style={styles.missionInfo}>
              <Text style={styles.missionTitle}>{item?.title || "Nhiệm vụ"}</Text>
              {!!item?.expiresAt && (
                <Text style={styles.missionDescription}>
                  Hết hạn: {formatDate(item.expiresAt)}
                </Text>
              )}
            </View>
            <View style={styles.pointsContainer}>
              <Text style={styles.pointsText}>+{item?.rewardCoins ?? 0}</Text>
              <Star size={16} color={COLORS.YELLOW} />
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${percent}%`,
                    backgroundColor: percent === 100 ? COLORS.GREEN : COLORS.PRIMARY,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {progress}/{target}
            </Text>
          </View>

          <View style={styles.missionFooter}>
            <View style={[styles.typeBadge, { backgroundColor: statusColor + "20" }]}>
              <Calendar size={12} color={statusColor} />
              <Text style={[styles.typeText, { color: statusColor }]}>
                {getStatusLabel(status)}
              </Text>
            </View>

            {status === "AVAILABLE" ? (
              <TouchableOpacity
                style={[styles.button, styles.acceptButton]}
                onPress={() =>
                  Alert.alert("Mock", "Đây là mockdata nên không nhận nhiệm vụ thật.")
                }
              >
                <Text style={styles.buttonText}>Nhận</Text>
              </TouchableOpacity>
            ) : status === "COMPLETED" ? (
              <TouchableOpacity
                style={[styles.button, styles.claimButton]}
                onPress={() =>
                  Alert.alert("Mock", "Đây là mockdata nên không nhận thưởng thật.")
                }
              >
                <Text style={styles.buttonText}>Nhận thưởng</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.button, styles.disabledButton]} disabled>
                <Text style={styles.buttonText}>
                  {status === "IN_PROGRESS" ? "Đang tiến trình" : "Không khả dụng"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    };

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={20} color={COLORS.WHITE} />
          </TouchableOpacity>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.headerTitle}>Nhiệm vụ</Text>
            <Text style={styles.headerSubtitle}>Mockdata (không gọi API)</Text>
          </View>
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabButton, tab === "available" && styles.tabActive]}
            onPress={() => setTab("available")}
          >
            <Text
              style={[
                styles.tabText,
                tab === "available" && styles.tabTextActive,
              ]}
            >
              Sẵn có
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, tab === "my" && styles.tabActive]}
            onPress={() => setTab("my")}
          >
            <Text style={[styles.tabText, tab === "my" && styles.tabTextActive]}>
              Của tôi
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={tab === "available" ? available : mine}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderMockItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Không có nhiệm vụ</Text>
              <Text style={styles.emptySubtitle}>Mockdata trống</Text>
            </View>
          )}
        />
      </SafeAreaView>
    );
  }

  const [userPoints, setUserPoints] = useState(0);
  const [availableMissions, setAvailableMissions] = useState([]);
  const [myMissions, setMyMissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState("available"); // 'available' | 'my'
  const [stats, setStats] = useState({ completed: 0, unclaimedRewards: 0 });

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [availRes, myRes, statsRes, profileRes] = await Promise.all([
        getAvailableMissions(),
        getMyMissions(),
        getMissionStats(),
        getProfile(),
      ]);

      // Backend returns ResponseEntity<List<MissionDto>> directly (no ApiResponse wrapper)
      // Axios wraps in response.data, so availRes.data is the array
      const availableMissionsData = Array.isArray(availRes?.data)
        ? availRes.data
        : [];
      setAvailableMissions(availableMissionsData);

      // Backend returns ResponseEntity<List<UserMissionDto>> directly
      const myMissionsData = Array.isArray(myRes?.data) ? myRes.data : [];
      setMyMissions(myMissionsData);

      // Stats returns Map<String, Long> directly
      if (statsRes?.data) {
        setStats(statsRes.data);
        // Some APIs may include points in mission stats
        const statsPoints =
          statsRes?.data?.userPoints ??
          statsRes?.data?.coins ??
          statsRes?.data?.currentPoints ??
          statsRes?.data?.points;
        if (typeof statsPoints === "number") setUserPoints(statsPoints);
      }

      // Prefer the canonical user profile points (used across the app as `coins`)
      const profilePayload =
        profileRes?.data?.data ?? profileRes?.data ?? profileRes;
      const profilePoints =
        profilePayload?.coins ??
        profilePayload?.userPoints ??
        profilePayload?.currentPoints ??
        profilePayload?.points;
      if (typeof profilePoints === "number") setUserPoints(profilePoints);
    } catch (err) {
      console.error("Failed to load missions", err);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tải nhiệm vụ. Vui lòng thử lại.",
        position: "top",
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAll();
  };

  const handleAccept = async (missionId) => {
    try {
      setLoading(true);
      await acceptMission(missionId);
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Bạn đã nhận nhiệm vụ",
        position: "top",
        visibilityTime: 3000,
      });
      await loadAll();
    } catch (err) {
      console.error("Accept error", err);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: err?.response?.data?.message || "Không thể nhận nhiệm vụ",
        position: "top",
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (missionId) => {
    try {
      setLoading(true);
      await claimMissionReward(missionId);
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Phần thưởng đã được gửi vào tài khoản của bạn",
        position: "top",
        visibilityTime: 3000,
      });
      await loadAll();
    } catch (err) {
      console.error("Claim error", err);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: err?.response?.data?.message || "Không thể nhận phần thưởng",
        position: "top",
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const renderAvailable = ({ item }) => {
    // item is MissionDto
    return (
      <View style={styles.missionCard}>
        <View style={styles.missionHeader}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconEmoji}>🎯</Text>
          </View>
          <View style={styles.missionInfo}>
            <Text style={styles.missionTitle}>{item.title}</Text>
            {item.description ? (
              <Text style={styles.missionDescription}>{item.description}</Text>
            ) : null}
          </View>
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsText}>+{item.rewardPoints || 0}</Text>
            <Text style={styles.starEmoji}>⭐</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `0%`, backgroundColor: "#FF5370" },
              ]}
            />
          </View>
          <Text style={styles.progressText}>Mục tiêu: {item.targetValue}</Text>
        </View>

        <View style={styles.missionFooter}>
          <View style={styles.typeBadge}>
            <Calendar size={12} color={COLORS.GRAY} />
            <Text style={styles.typeText}>{item.missionType}</Text>
          </View>

          <TouchableOpacity
            onPress={() => handleAccept(item.id)}
            style={styles.acceptButton}
          >
            <LinearGradient
              colors={["#FF5370", "#FF6B9D", "#FF8FAB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Nhận ✨</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderMy = ({ item }) => {
    // item is UserMissionDto, contains mission and progress fields
    const mission = item.mission || {};
    const progress = item.progress || 0;
    const target = mission.targetValue || 1;
    const percent = Math.min(100, Math.round((progress / target) * 100));
    const canClaim = item.isCompleted === true && item.rewardClaimed !== true;

    return (
      <View style={styles.missionCard}>
        <View style={styles.missionHeader}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconEmoji}>🎯</Text>
          </View>
          <View style={styles.missionInfo}>
            <Text style={styles.missionTitle}>{mission.title}</Text>
            {mission.description ? (
              <Text style={styles.missionDescription}>
                {mission.description}
              </Text>
            ) : null}
          </View>
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsText}>+{mission.rewardPoints || 0}</Text>
            <Text style={styles.starEmoji}>⭐</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${percent}%`,
                  backgroundColor: percent === 100 ? COLORS.GREEN : "#FF5370",
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {progress}/{target}
          </Text>
        </View>

        <View style={styles.missionFooter}>
          <View style={styles.typeBadge}>
            <Calendar size={12} color={COLORS.GRAY} />
            <Text style={styles.typeText}>{mission.missionType}</Text>
          </View>

          {canClaim ? (
            <TouchableOpacity
              onPress={() => handleClaim(mission.id)}
              style={styles.claimButton}
            >
              <LinearGradient
                colors={["#4ECDC4", "#44A08D"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Nhận phần thưởng 🎁</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.disabledButton]}
              disabled
            >
              <Text style={styles.buttonTextDisabled}>
                {item.isCompleted ? "Đã nhận ✓" : "Đang tiến trình..."}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <SnowEffect />
      <GradientHeader
        title="🎯 Nhiệm vụ"
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
      />

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setTab("available")}
        >
          {tab === "available" ? (
            <LinearGradient
              colors={["#FF5370", "#FF6B9D", "#FF8FAB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.tabGradient}
            >
              <Text style={styles.tabTextActive}>Sẵn có</Text>
            </LinearGradient>
          ) : (
            <View style={styles.tabTextContainer}>
              <Text style={styles.tabText}>Sẵn có</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabButton} onPress={() => setTab("my")}>
          {tab === "my" ? (
            <LinearGradient
              colors={["#FF5370", "#FF6B9D", "#FF8FAB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.tabGradient}
            >
              <Text style={styles.tabTextActive}>Của tôi</Text>
            </LinearGradient>
          ) : (
            <View style={styles.tabTextContainer}>
              <Text style={styles.tabText}>Của tôi</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5370" />
        </View>
      ) : (
        <FlatList
          data={tab === "available" ? availableMissions : myMissions}
          keyExtractor={(item) =>
            item.id ? String(item.id) : String(item.mission?.id)
          }
          renderItem={tab === "available" ? renderAvailable : renderMy}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#FF5370", "#FF6B9D"]}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🎯</Text>
              <Text style={styles.emptyTitle}>Không có nhiệm vụ</Text>
              <Text style={styles.emptySubtitle}>Vui lòng thử lại sau</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF5F7" },
  tabRow: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#FFE5EC",
    paddingVertical: 16,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#FF6B9D",
    gap: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tabTextContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255, 83, 112, 0.15)",
    alignItems: "center",
    justifyContent: "center",
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
  missionCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    borderWidth: 2,
    borderColor: "#FFE5EC",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  missionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: "#FFE5EC",
    borderWidth: 2,
    borderColor: "#FF6B9D",
  },
  iconEmoji: {
    fontSize: 24,
  },
  missionInfo: { flex: 1 },
  missionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  missionDescription: {
    color: "#8E8E93",
    fontSize: 13,
    lineHeight: 18,
  },
  pointsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFE5EC",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FF6B9D",
  },
  pointsText: {
    fontWeight: "800",
    color: "#FF5370",
    fontSize: 14,
  },
  starEmoji: {
    fontSize: 14,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 10,
    backgroundColor: "#FFE5EC",
    borderRadius: 10,
    overflow: "hidden",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#FF6B9D",
  },
  progressFill: {
    height: "100%",
    borderRadius: 10,
  },
  progressText: {
    fontSize: 12,
    color: "#FF5370",
    fontWeight: "600",
  },
  missionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE5EC",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FF6B9D",
  },
  typeText: {
    marginLeft: 6,
    color: "#FF5370",
    fontSize: 12,
    fontWeight: "600",
  },
  acceptButton: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#FF5370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  claimButton: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#4ECDC4",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  disabledButton: {
    backgroundColor: "#FFE5EC",
    borderWidth: 1,
    borderColor: "#FF6B9D",
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 13,
  },
  buttonTextDisabled: {
    color: "#8E8E93",
    fontWeight: "600",
    fontSize: 13,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    paddingTop: 80,
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF5370",
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "#8E8E93",
    fontSize: 14,
    textAlign: "center",
  },
});

export default Mission;
