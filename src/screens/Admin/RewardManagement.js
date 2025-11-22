import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import COLORS from "../../constant/colors";

const initialRewards = [
  {
    id: "REW-3001",
    title: "Voucher 20k chuyến đi",
    description: "Áp dụng cho chuyến đi từ 100k trở lên.",
    points: 120,
    stock: 45,
    status: "active",
    branch: "Family Mart",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=200&fit=crop",
  },
  {
    id: "REW-3002",
    title: "Tặng 50 điểm thưởng",
    description: "Dành cho người dùng mới hoàn thành 3 chuyến đầu tiên.",
    points: 0,
    stock: "Không giới hạn",
    status: "active",
    branch: "Circle K",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=200&fit=crop",
  },
  {
    id: "REW-3003",
    title: "Giảm 15% toàn bộ chuyến đi",
    description: "Giảm tối đa 40k cho mỗi lần đổi.",
    points: 220,
    stock: 12,
    status: "paused",
    branch: "7-Eleven",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=200&fit=crop",
  },
];

// Danh sách chi nhánh mẫu (sau này sẽ call API để lấy)
const branchList = [
  "Tất cả",
  "Circle K",
  "7-Eleven",
  "Family Mart",
  "Mini Stop",
  "VinMart",
];

const RewardManagement = () => {
  const [rewards, setRewards] = useState(initialRewards);
  const [selectedReward, setSelectedReward] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [branchDropdownVisible, setBranchDropdownVisible] = useState(false);
  const [formState, setFormState] = useState({ 
    title: "", 
    description: "",
    points: "", 
    stock: "",
    branch: "",
    image: "",
  });

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
    setIsCreating(false);
    setFormState({
      title: reward.title,
      description: reward.description || "",
      points: String(reward.points),
      stock: String(reward.stock),
      branch: reward.branch || "",
      image: reward.image || "",
    });
    setModalVisible(true);
  };

  const handleOpenCreate = () => {
    setSelectedReward(null);
    setIsCreating(true);
    setFormState({
      title: "",
      description: "",
      points: "",
      stock: "",
      branch: "",
      image: "",
    });
    setModalVisible(true);
  };

  const generateRewardId = () => {
    const maxId = rewards.reduce((max, reward) => {
      const num = parseInt(reward.id.split("-")[1]);
      return num > max ? num : max;
    }, 3000);
    return `REW-${maxId + 1}`;
  };

  const handleSaveReward = () => {
    if (!formState.title.trim()) {
      return;
    }

    if (isCreating) {
      const newReward = {
        id: generateRewardId(),
        title: formState.title.trim(),
        description: formState.description.trim(),
        points: Number(formState.points) || 0,
        stock: formState.stock === "Không giới hạn" ? formState.stock : Number(formState.stock) || 0,
        status: "active",
        branch: formState.branch.trim() || "Tất cả",
        image: formState.image.trim() || "",
      };
      setRewards((prev) => [...prev, newReward]);
    } else {
      setRewards((prev) =>
        prev.map((reward) =>
          reward.id === selectedReward.id
            ? {
                ...reward,
                title: formState.title.trim(),
                description: formState.description.trim(),
                points: Number(formState.points) || 0,
                stock: formState.stock === "Không giới hạn" ? formState.stock : Number(formState.stock) || 0,
                branch: formState.branch.trim() || "Tất cả",
                image: formState.image.trim() || "",
              }
            : reward
        )
      );
    }
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setIsCreating(false);
    setSelectedReward(null);
  };

  const handleSelectBranch = (branch) => {
    setFormState((prev) => ({ ...prev, branch }));
    setBranchDropdownVisible(false);
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert(
        "Quyền bị từ chối",
        "Cần quyền truy cập thư viện ảnh để chọn ảnh."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 2],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setFormState((prev) => ({ ...prev, image: result.assets[0].uri }));
    }
  };

  const renderRewardItem = ({ item }) => {
    return (
      <View style={styles.card}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.rewardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.rewardImagePlaceholder}>
            <Ionicons name="image-outline" size={40} color={COLORS.GRAY} />
            <Text style={styles.placeholderText}>Chưa có hình ảnh</Text>
          </View>
        )}
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
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={16} color={COLORS.GRAY} />
          <Text style={styles.metaText}>Chi nhánh: {item.branch || "Tất cả"}</Text>
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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Quản lý đổi thưởng</Text>
        </View>
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

      <View style={styles.addButtonContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleOpenCreate}
        >
          <Ionicons name="add-circle-outline" size={20} color={COLORS.WHITE} />
          <Text style={styles.addButtonText}>Thêm ưu đãi mới</Text>
        </TouchableOpacity>
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
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isCreating ? "Tạo ưu đãi mới" : "Chỉnh sửa ưu đãi"}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                style={styles.input}
                placeholder="Tên ưu đãi *"
                value={formState.title}
                onChangeText={(value) => setFormState((prev) => ({ ...prev, title: value }))}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Mô tả"
                value={formState.description}
                onChangeText={(value) => setFormState((prev) => ({ ...prev, description: value }))}
                multiline
                numberOfLines={3}
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
                placeholder="Số lượng (hoặc 'Không giới hạn')"
                value={formState.stock}
                onChangeText={(value) => setFormState((prev) => ({ ...prev, stock: value }))}
              />
              <View style={styles.formGroup}>
                <Text style={styles.label}>Hình ảnh voucher</Text>
                {formState.image ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: formState.image }}
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => setFormState((prev) => ({ ...prev, image: "" }))}
                    >
                      <Ionicons name="close-circle" size={24} color={COLORS.RED} />
                    </TouchableOpacity>
                  </View>
                ) : null}
                <View style={styles.imageInputRow}>
                  <TextInput
                    style={[styles.input, styles.imageUrlInput]}
                    placeholder="Nhập URL hình ảnh"
                    value={formState.image}
                    onChangeText={(value) => setFormState((prev) => ({ ...prev, image: value }))}
                  />
                  <TouchableOpacity
                    style={styles.pickImageButton}
                    onPress={pickImage}
                  >
                    <Ionicons name="image-outline" size={20} color={COLORS.PRIMARY} />
                    <Text style={styles.pickImageText}>Chọn ảnh</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Chi nhánh</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setBranchDropdownVisible(true)}
                >
                  <Text
                    style={[
                      styles.dropdownButtonText,
                      !formState.branch && styles.dropdownButtonTextPlaceholder,
                    ]}
                  >
                    {formState.branch || "Chọn chi nhánh"}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={COLORS.GRAY} />
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCloseModal}
              >
                <Text style={styles.modalButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveReward}
              >
                <Text style={styles.modalButtonText}>
                  {isCreating ? "Tạo mới" : "Lưu thay đổi"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Branch Dropdown Modal */}
      <Modal
        transparent
        visible={branchDropdownVisible}
        animationType="fade"
        onRequestClose={() => setBranchDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setBranchDropdownVisible(false)}
        >
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownTitle}>Chọn chi nhánh</Text>
            <FlatList
              data={branchList}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    formState.branch === item && styles.dropdownItemActive,
                  ]}
                  onPress={() => handleSelectBranch(item)}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      formState.branch === item && styles.dropdownItemTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                  {formState.branch === item && (
                    <Ionicons name="checkmark" size={20} color={COLORS.PRIMARY} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
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
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  addButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.WHITE,
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
  },
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 0,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  rewardImage: {
    width: "100%",
    height: 180,
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  rewardImagePlaceholder: {
    width: "100%",
    height: 180,
    backgroundColor: COLORS.GRAY_LIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.GRAY,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
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
    paddingHorizontal: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    paddingHorizontal: 16,
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
    paddingHorizontal: 16,
    paddingBottom: 16,
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
    maxHeight: "80%",
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
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.BLACK,
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.WHITE,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: COLORS.BLACK,
    flex: 1,
  },
  dropdownButtonTextPlaceholder: {
    color: COLORS.GRAY,
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  dropdownContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    width: "100%",
    maxWidth: 360,
    maxHeight: "70%",
    padding: 16,
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.BLACK,
    marginBottom: 12,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  dropdownItemActive: {
    backgroundColor: COLORS.BLUE_LIGHT,
  },
  dropdownItemText: {
    fontSize: 14,
    color: COLORS.BLACK,
    flex: 1,
  },
  dropdownItemTextActive: {
    color: COLORS.PRIMARY,
    fontWeight: "600",
  },
  imagePreviewContainer: {
    position: "relative",
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: 150,
    borderRadius: 12,
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
  },
  imageInputRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  imageUrlInput: {
    flex: 1,
    marginBottom: 0,
  },
  pickImageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    backgroundColor: COLORS.WHITE,
  },
  pickImageText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: "600",
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

