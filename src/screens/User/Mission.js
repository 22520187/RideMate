import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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

      if (availRes?.data) setAvailableMissions(availRes.data);
      if (myRes?.data) {
        // myRes.data expected to be array of UserMissionDto
        setMyMissions(myRes.data);
      }

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
      Alert.alert("Lỗi", "Không thể tải nhiệm vụ. Vui lòng thử lại.");
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
      Alert.alert("Thành công", "Bạn đã nhận nhiệm vụ");
      await loadAll();
    } catch (err) {
      console.error("Accept error", err);
      Alert.alert(
        "Lỗi",
        err?.response?.data?.message || "Không thể nhận nhiệm vụ"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (missionId) => {
    try {
      setLoading(true);
      await claimMissionReward(missionId);
      Alert.alert(
        "Thành công",
        "Phần thưởng đã được gửi vào tài khoản của bạn"
      );
      await loadAll();
    } catch (err) {
      console.error("Claim error", err);
      Alert.alert(
        "Lỗi",
        err?.response?.data?.message || "Không thể nhận phần thưởng"
      );
    } finally {
      setLoading(false);
    }
  };

  const renderAvailable = ({ item }) => {
    // item is MissionDto
    return (
      <View style={styles.missionCard}>
        <View style={styles.missionHeader}>
          <View
            style={[styles.iconContainer, { backgroundColor: "#00000010" }]}
          >
            <Gift size={20} color={COLORS.PRIMARY} />
          </View>
          <View style={styles.missionInfo}>
            <Text style={styles.missionTitle}>{item.title}</Text>
            {item.description ? (
              <Text style={styles.missionDescription}>{item.description}</Text>
            ) : null}
          </View>
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsText}>+{item.rewardPoints || 0}</Text>
            <Star size={16} color={COLORS.YELLOW} />
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `0%`, backgroundColor: COLORS.PRIMARY },
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
            style={[styles.button, styles.acceptButton]}
            onPress={() => handleAccept(item.id)}
          >
            <Text style={styles.buttonText}>Nhận</Text>
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
          <View
            style={[styles.iconContainer, { backgroundColor: "#00000010" }]}
          >
            <Gift size={20} color={COLORS.PRIMARY} />
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
                  backgroundColor:
                    percent === 100 ? COLORS.GREEN : COLORS.PRIMARY,
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
              style={[styles.button, styles.claimButton]}
              onPress={() => handleClaim(mission.id)}
            >
              <Text style={styles.buttonText}>Nhận phần thưởng</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.disabledButton]}
              disabled
            >
              <Text style={styles.buttonText}>
                {item.isCompleted ? "Đã nhận" : "Đang tiến trình"}
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
          <Text style={styles.headerSubtitle}>
            Hoàn thành nhiệm vụ để nhận điểm
          </Text>
        </View>

        <View style={styles.pointsDisplay}>
          <Star size={18} color={COLORS.YELLOW} />
          <Text style={styles.pointsValue}>{userPoints}</Text>
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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
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
              colors={[COLORS.PRIMARY]}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
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
  container: { flex: 1, backgroundColor: COLORS.BG },
  header: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.WHITE + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { color: COLORS.WHITE, fontSize: 18, fontWeight: "700" },
  headerSubtitle: { color: COLORS.WHITE + "CC", fontSize: 12 },
  pointsDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.WHITE + "20",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pointsValue: { color: COLORS.WHITE, fontWeight: "700", marginLeft: 8 },
  tabRow: { flexDirection: "row", padding: 12, backgroundColor: COLORS.BG },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: COLORS.WHITE,
  },
  tabActive: { backgroundColor: COLORS.PRIMARY },
  tabText: { fontWeight: "700", color: COLORS.GRAY },
  tabTextActive: { color: COLORS.WHITE },
  missionCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: COLORS.BLACK,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  missionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  missionInfo: { flex: 1 },
  missionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.BLACK },
  missionDescription: { color: COLORS.GRAY, marginTop: 2 },
  pointsContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
  pointsText: { fontWeight: "700", color: COLORS.PRIMARY, marginRight: 6 },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.GRAY_LIGHT,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 8,
  },
  progressFill: { height: "100%" },
  progressText: { fontSize: 12, color: COLORS.GRAY },
  missionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.GRAY_LIGHT,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: { marginLeft: 6, color: COLORS.GRAY },
  button: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  acceptButton: { backgroundColor: COLORS.PRIMARY },
  claimButton: { backgroundColor: COLORS.GREEN },
  disabledButton: { backgroundColor: COLORS.GRAY_LIGHT },
  buttonText: { color: COLORS.WHITE, fontWeight: "700" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyState: { paddingTop: 60, alignItems: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: COLORS.GRAY },
  emptySubtitle: { color: COLORS.GRAY, marginTop: 8 },
});

export default Mission;
