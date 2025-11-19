import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constant/colors";

const initialRewards = [
  {
    id: "REW-3001",
    title: "Voucher 20k chuyến đi",
    description: "Áp dụng cho chuyến đi từ 100k trở lên.",
    points: 120,
    stock: 45,
    status: "active",
  },
  {
    id: "REW-3002",
    title: "Tặng 50 điểm thưởng",
    description: "Dành cho người dùng mới hoàn thành 3 chuyến đầu tiên.",
    points: 0,
    stock: "Không giới hạn",
    status: "active",
  },
  {
    id: "REW-3003",
    title: "Giảm 15% toàn bộ chuyến đi",
    description: "Giảm tối đa 40k cho mỗi lần đổi.",
    points: 220,
    stock: 12,
    status: "paused",
  },
];

const RewardManagement = () => {
  const [rewards, setRewards] = useState(initialRewards);
  const [selectedReward, setSelectedReward] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [formState, setFormState] = useState({ title: "", points: "", stock: "" });

  const activeCount = useMemo(
    () => rewards.filter((reward) => reward.status === "active").length,
    [rewards]
  );

  const handleToggleStatus = (rewardId) => {
    setRewards((prev) =>
      prev.map((reward) =>
        reward.id === rewardId
          ? {
              ...reward,
              status: reward.status === "active" ? "paused" : "active",
            }
          : reward
      )
    );
  };

  const handleOpenEdit = (reward) => {
    setSelectedReward(reward);
    setFormState({
      title: reward.title,
      points: String(reward.points),
      stock: String(reward.stock),
    });
    setModalVisible(true);
  };

  const handleSaveReward = () => {
    setRewards((prev) =>
      prev.map((reward) =>
        reward.id === selectedReward.id
          ? {
              ...reward,
              title: formState.title.trim(),
              points: Number(formState.points) || 0,
              stock: formState.stock === "Không giới hạn" ? formState.stock : Number(formState.stock) || 0,
            }
          : reward
      )
    );
    setModalVisible(false);
  };

  const renderRewardItem = ({ item }) => {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.rewardTitle}>{item.title}</Text>
            <Text style={styles.rewardId}>{item.id}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  item.status === "active" ? COLORS.GREEN_LIGHT : COLORS.ORANGE_LIGHT,
              },
            ]}
          >
            <Text
              style={[
                styles.statusLabel,
                { color: item.status === "active" ? COLORS.GREEN : COLORS.ORANGE_DARK },
              ]}
            >
              {item.status === "active" ? "Đang áp dụng" : "Tạm dừng"}
            </Text>
          </View>
        </View>

        <Text style={styles.description}>{item.description}</Text>

        <View style={styles.metaRow}>
          <Ionicons name="star-outline" size={16} color={COLORS.GRAY} />
          <Text style={styles.metaText}>Điểm yêu cầu: {item.points}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="cube-outline" size={16} color={COLORS.GRAY} />
          <Text style={styles.metaText}>Số lượng: {item.stock}</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleOpenEdit(item)}
          >
            <Ionicons name="create-outline" size={18} color={COLORS.WHITE} />
            <Text style={styles.actionLabel}>Chỉnh sửa</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.toggleButton]}
            onPress={() => handleToggleStatus(item.id)}
          >
            <Ionicons
              name={item.status === "active" ? "pause-outline" : "play-outline"}
              size={18}
              color={COLORS.WHITE}
            />
            <Text style={styles.actionLabel}>
              {item.status === "active" ? "Tạm dừng" : "Kích hoạt"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Quản lý đổi thưởng</Text>
        <Text style={styles.subtitle}>
          Thiết lập ưu đãi và chương trình tích điểm cho người dùng trung thành
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Ionicons name="gift-outline" size={24} color={COLORS.BLUE} />
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Ưu đãi đang hoạt động</Text>
            <Text style={styles.summaryValue}>{activeCount}</Text>
          </View>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="sparkles-outline" size={24} color={COLORS.PURPLE} />
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Ưu đãi tạm dừng</Text>
            <Text style={styles.summaryValue}>
              {rewards.length - activeCount}
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={rewards}
        keyExtractor={(item) => item.id}
        renderItem={renderRewardItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chỉnh sửa ưu đãi</Text>
            <TextInput
              style={styles.input}
              placeholder="Tên ưu đãi"
              value={formState.title}
              onChangeText={(value) => setFormState((prev) => ({ ...prev, title: value }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Điểm yêu cầu"
              keyboardType="numeric"
              value={formState.points}
              onChangeText={(value) => setFormState((prev) => ({ ...prev, points: value }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Số lượng"
              value={formState.stock}
              onChangeText={(value) => setFormState((prev) => ({ ...prev, stock: value }))}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveReward}
              >
                <Text style={styles.modalButtonText}>Lưu thay đổi</Text>
              </TouchableOpacity>
            </View>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: COLORS.GRAY,
    lineHeight: 20,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.GRAY,
  },
  summaryValue: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 16,
  },
  card: {
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  rewardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  rewardId: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.GRAY,
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
  description: {
    fontSize: 14,
    color: COLORS.BLACK,
    lineHeight: 20,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.GRAY,
    flex: 1,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  editButton: {
    backgroundColor: COLORS.BLUE,
  },
  toggleButton: {
    backgroundColor: COLORS.SECONDARY,
  },
  actionLabel: {
    fontSize: 13,
    color: COLORS.WHITE,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.BLACK,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.BLACK,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  cancelButton: {
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  saveButton: {
    backgroundColor: COLORS.BLUE,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.WHITE,
  },
});

export default RewardManagement;

