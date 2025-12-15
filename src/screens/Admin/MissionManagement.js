import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constant/colors";
import {
  getMissions,
  createMission,
  updateMission,
  deleteMission,
  getMissionStats,
} from "../../services/adminService";

const MISSION_TYPES = [
  { key: "DAILY", label: "Hàng ngày" },
  { key: "WEEKLY", label: "Hàng tuần" },
  { key: "MONTHLY", label: "Hàng tháng" },
  { key: "SPECIAL", label: "Đặc biệt" },
  { key: "EVENT", label: "Sự kiện" },
];

const TARGET_TYPES = [
  { key: "COMPLETE_TRIPS", label: "Hoàn thành chuyến đi" },
  { key: "EARN_POINTS", label: "Kiếm điểm" },
  { key: "SHARE_TRIPS", label: "Chia sẻ chuyến đi" },
  { key: "INVITE_FRIENDS", label: "Mời bạn bè" },
  { key: "RATE_TRIPS", label: "Đánh giá chuyến đi" },
  { key: "USE_VOUCHERS", label: "Sử dụng voucher" },
  { key: "COMPLETE_PROFILE", label: "Hoàn thiện hồ sơ" },
];

const MissionManagement = () => {
  const [missions, setMissions] = useState([]);
  const [selectedMission, setSelectedMission] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({ activeMissions: 0 });
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    missionType: "DAILY",
    targetType: "COMPLETE_TRIPS",
    targetValue: "",
    rewardPoints: "",
    startDate: "",
    endDate: "",
    priority: "0",
    isActive: true,
  });

  const fetchMissions = useCallback(async () => {
    try {
      setLoading(true);
      const [missionsResponse, statsResponse] = await Promise.all([
        getMissions({ page: 0, size: 100, sortBy: "priority", sortDirection: "DESC" }),
        getMissionStats(),
      ]);

      if (missionsResponse?.data) {
        setMissions(missionsResponse.data.content || []);
      }
      if (statsResponse?.data) {
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error("Error fetching missions:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách nhiệm vụ.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMissions();
  }, [fetchMissions]);

  const handleOpenCreate = () => {
    setSelectedMission(null);
    setIsCreating(true);
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 7);
    
    setFormState({
      title: "",
      description: "",
      missionType: "DAILY",
      targetType: "COMPLETE_TRIPS",
      targetValue: "",
      rewardPoints: "",
      startDate: now.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      priority: "0",
      isActive: true,
    });
    setModalVisible(true);
  };

  const handleOpenEdit = (mission) => {
    setSelectedMission(mission);
    setIsCreating(false);
    setFormState({
      title: mission.title,
      description: mission.description || "",
      missionType: mission.missionType,
      targetType: mission.targetType,
      targetValue: String(mission.targetValue),
      rewardPoints: String(mission.rewardPoints),
      startDate: mission.startDate?.split("T")[0] || "",
      endDate: mission.endDate?.split("T")[0] || "",
      priority: String(mission.priority || 0),
      isActive: mission.isActive,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formState.title.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tiêu đề nhiệm vụ");
      return;
    }

    if (!formState.targetValue || Number(formState.targetValue) < 1) {
      Alert.alert("Lỗi", "Giá trị mục tiêu phải lớn hơn 0");
      return;
    }

    try {
      setSubmitting(true);

      const missionData = {
        title: formState.title.trim(),
        description: formState.description.trim(),
        missionType: formState.missionType,
        targetType: formState.targetType,
        targetValue: Number(formState.targetValue),
        rewardPoints: Number(formState.rewardPoints) || 0,
        startDate: new Date(formState.startDate + "T00:00:00").toISOString(),
        endDate: new Date(formState.endDate + "T23:59:59").toISOString(),
        priority: Number(formState.priority) || 0,
        isActive: formState.isActive,
      };

      if (isCreating) {
        await createMission(missionData);
        Alert.alert("Thành công", "Đã tạo nhiệm vụ mới");
      } else {
        await updateMission(selectedMission.id, missionData);
        Alert.alert("Thành công", "Đã cập nhật nhiệm vụ");
      }

      await fetchMissions();
      setModalVisible(false);
    } catch (error) {
      console.error("Error saving mission:", error);
      Alert.alert("Lỗi", "Không thể lưu nhiệm vụ. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (mission) => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc muốn xóa nhiệm vụ "${mission.title}"?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMission(mission.id);
              Alert.alert("Thành công", "Đã xóa nhiệm vụ");
              await fetchMissions();
            } catch (error) {
              console.error("Error deleting mission:", error);
              Alert.alert("Lỗi", "Không thể xóa nhiệm vụ.");
            }
          },
        },
      ]
    );
  };

  const renderMissionCard = ({ item }) => {
    const formatDate = (dateStr) => {
      if (!dateStr) return "-";
      return new Date(dateStr).toLocaleDateString("vi-VN");
    };

    const getMissionTypeLabel = (type) => {
      return MISSION_TYPES.find((t) => t.key === type)?.label || type;
    };

    const getTargetTypeLabel = (type) => {
      return TARGET_TYPES.find((t) => t.key === type)?.label || type;
    };

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.missionId}>#{item.id}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: item.isActive
                  ? COLORS.GREEN_LIGHT
                  : COLORS.GRAY_LIGHT,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: item.isActive ? COLORS.GREEN : COLORS.GRAY },
              ]}
            >
              {item.isActive ? "Hoạt động" : "Tạm dừng"}
            </Text>
          </View>
        </View>

        {item.description && (
          <Text style={styles.description}>{item.description}</Text>
        )}

        <View style={styles.infoRow}>
          <Ionicons name="flag-outline" size={16} color={COLORS.GRAY} />
          <Text style={styles.infoText}>
            {getMissionTypeLabel(item.missionType)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="target-outline" size={16} color={COLORS.GRAY} />
          <Text style={styles.infoText}>
            {getTargetTypeLabel(item.targetType)}: {item.targetValue}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="trophy-outline" size={16} color={COLORS.GRAY} />
          <Text style={styles.infoText}>Thưởng: {item.rewardPoints} điểm</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.GRAY} />
          <Text style={styles.infoText}>
            {formatDate(item.startDate)} - {formatDate(item.endDate)}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleOpenEdit(item)}
          >
            <Ionicons name="create-outline" size={18} color={COLORS.WHITE} />
            <Text style={styles.actionLabel}>Sửa</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item)}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.WHITE} />
            <Text style={styles.actionLabel}>Xóa</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản lý nhiệm vụ</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleOpenCreate}
        >
          <Ionicons name="add-circle" size={24} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsCard}>
        <Ionicons name="briefcase-outline" size={24} color={COLORS.BLUE} />
        <View style={styles.statsContent}>
          <Text style={styles.statsLabel}>Nhiệm vụ đang hoạt động</Text>
          <Text style={styles.statsValue}>{stats.activeMissions}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={missions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMissionCard}
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
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="rocket-outline" size={48} color={COLORS.GRAY} />
              <Text style={styles.emptyTitle}>Chưa có nhiệm vụ nào</Text>
              <Text style={styles.emptyDescription}>
                Nhấn + để tạo nhiệm vụ mới
              </Text>
            </View>
          }
        />
      )}

      {/* Create/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isCreating ? "Tạo nhiệm vụ mới" : "Chỉnh sửa nhiệm vụ"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.BLACK} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                style={styles.input}
                placeholder="Tiêu đề *"
                value={formState.title}
                onChangeText={(value) =>
                  setFormState((prev) => ({ ...prev, title: value }))
                }
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Mô tả"
                value={formState.description}
                onChangeText={(value) =>
                  setFormState((prev) => ({ ...prev, description: value }))
                }
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Loại nhiệm vụ</Text>
              <View style={styles.typeGrid}>
                {MISSION_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeButton,
                      formState.missionType === type.key && styles.typeButtonActive,
                    ]}
                    onPress={() =>
                      setFormState((prev) => ({
                        ...prev,
                        missionType: type.key,
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        formState.missionType === type.key &&
                          styles.typeButtonTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Mục tiêu</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.targetScroll}
              >
                {TARGET_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.targetButton,
                      formState.targetType === type.key && styles.targetButtonActive,
                    ]}
                    onPress={() =>
                      setFormState((prev) => ({
                        ...prev,
                        targetType: type.key,
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.targetButtonText,
                        formState.targetType === type.key &&
                          styles.targetButtonTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                style={styles.input}
                placeholder="Giá trị mục tiêu *"
                keyboardType="numeric"
                value={formState.targetValue}
                onChangeText={(value) =>
                  setFormState((prev) => ({ ...prev, targetValue: value }))
                }
              />

              <TextInput
                style={styles.input}
                placeholder="Điểm thưởng *"
                keyboardType="numeric"
                value={formState.rewardPoints}
                onChangeText={(value) =>
                  setFormState((prev) => ({ ...prev, rewardPoints: value }))
                }
              />

              <TextInput
                style={styles.input}
                placeholder="Ngày bắt đầu (YYYY-MM-DD)"
                value={formState.startDate}
                onChangeText={(value) =>
                  setFormState((prev) => ({ ...prev, startDate: value }))
                }
              />

              <TextInput
                style={styles.input}
                placeholder="Ngày kết thúc (YYYY-MM-DD)"
                value={formState.endDate}
                onChangeText={(value) =>
                  setFormState((prev) => ({ ...prev, endDate: value }))
                }
              />

              <TextInput
                style={styles.input}
                placeholder="Độ ưu tiên (0-10)"
                keyboardType="numeric"
                value={formState.priority}
                onChangeText={(value) =>
                  setFormState((prev) => ({ ...prev, priority: value }))
                }
              />

              <TouchableOpacity
                style={styles.switchRow}
                onPress={() =>
                  setFormState((prev) => ({ ...prev, isActive: !prev.isActive }))
                }
              >
                <Text style={styles.switchLabel}>Hoạt động</Text>
                <Ionicons
                  name={formState.isActive ? "checkbox" : "square-outline"}
                  size={24}
                  color={formState.isActive ? COLORS.PRIMARY : COLORS.GRAY}
                />
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.saveButton,
                  submitting && styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={COLORS.WHITE} />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {isCreating ? "Tạo mới" : "Lưu"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  addButton: {
    padding: 4,
  },
  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  statsContent: {
    flex: 1,
  },
  statsLabel: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.GRAY,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.BLACK,
  },
  missionId: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  description: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.BLACK,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  editButton: {
    backgroundColor: COLORS.BLUE,
  },
  deleteButton: {
    backgroundColor: COLORS.RED,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.WHITE,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.BLACK,
    marginTop: 12,
  },
  emptyDescription: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  input: {
    backgroundColor: COLORS.BG,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.BLACK,
    marginBottom: 8,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.BG,
  },
  typeButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  typeButtonText: {
    fontSize: 13,
    color: COLORS.GRAY,
    fontWeight: "600",
  },
  typeButtonTextActive: {
    color: COLORS.WHITE,
  },
  targetScroll: {
    marginBottom: 16,
  },
  targetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.BG,
    marginRight: 8,
  },
  targetButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  targetButtonText: {
    fontSize: 13,
    color: COLORS.GRAY,
    fontWeight: "600",
  },
  targetButtonTextActive: {
    color: COLORS.WHITE,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.BLACK,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.BLACK,
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.WHITE,
  },
});

export default MissionManagement;
