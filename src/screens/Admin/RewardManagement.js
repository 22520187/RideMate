import React, { useMemo, useState, useEffect, useCallback } from "react";
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
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import COLORS from "../../constant/colors";
import {
  getVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher,
} from "../../services/adminService";
import { unwrapApiData } from "../../utils/unwrapApiData";

const initialRewards = [
  {
    id: "REW-3001",
    title: "Voucher 20k chuyến đi",
    description: "Áp dụng cho chuyến đi từ 100k trở lên.",
    points: 120,
    stock: 45,
    status: "active",
    branch: "Family Mart",
    image:
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=200&fit=crop",
  },
  {
    id: "REW-3002",
    title: "Tặng 50 điểm thưởng",
    description: "Dành cho người dùng mới hoàn thành 3 chuyến đầu tiên.",
    points: 0,
    stock: "Không giới hạn",
    status: "active",
    branch: "Circle K",
    image:
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=200&fit=crop",
  },
  {
    id: "REW-3003",
    title: "Giảm 15% toàn bộ chuyến đi",
    description: "Giảm tối đa 40k cho mỗi lần đổi.",
    points: 220,
    stock: 12,
    status: "paused",
    branch: "7-Eleven",
    image:
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=200&fit=crop",
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
  const [rewards, setRewards] = useState([]); // Initialize as empty array
  const [selectedReward, setSelectedReward] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [branchDropdownVisible, setBranchDropdownVisible] = useState(false);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formState, setFormState] = useState({
    voucherCode: "",
    description: "",
    // Keep in sync with backend/user app voucher types
    voucherType: "FOOD_AND_BEVERAGE",
    cost: "",
    expiryDate: "",
    isActive: true,
  });

  // Parse YYYY-MM-DD to ISO string safely.
  // - returns null if empty
  // - returns undefined if invalid format/value
  const parseExpiryDateToISO = (ymd) => {
    const raw = String(ymd || "").trim();
    if (!raw) return null;

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (!match) return undefined;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (
      !Number.isFinite(year) ||
      !Number.isFinite(month) ||
      !Number.isFinite(day)
    )
      return undefined;

    // Construct in UTC to avoid timezone shifting.
    const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return undefined;
    }

    return date.toISOString();
  };

  // Fetch vouchers from API
  const fetchVouchers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getVouchers();

      const payload = unwrapApiData(response);

      if (payload) {
        // payload can be either an array or a pageable object with `content`
        const vouchersData = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.content)
          ? payload.content
          : [];
        setRewards(vouchersData);
      } else {
        setRewards([]);
      }
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      setRewards([]); // Set empty array on error
      Alert.alert("Lỗi", "Không thể tải danh sách voucher. Vui lòng thử lại.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVouchers();
  }, [fetchVouchers]);

  const activeCount = useMemo(
    () =>
      Array.isArray(rewards)
        ? rewards.filter((reward) => reward.isActive).length
        : 0,
    [rewards]
  );

  // Build a safe payload that matches backend voucher DTO
  // (avoid sending extra fields like `id` and avoid `expiryDate: null`).
  const buildVoucherPayloadForUpdate = (reward, nextIsActive) => {
    const payload = {
      voucherCode: String(reward?.voucherCode || "").trim(),
      description: String(reward?.description || "").trim(),
      voucherType: reward?.voucherType || "FOOD_AND_BEVERAGE",
      cost: Number(reward?.cost || 0),
      expiryDate: reward?.expiryDate || undefined,
      isActive: Boolean(nextIsActive),
    };

    if (!payload.expiryDate) delete payload.expiryDate;
    return payload;
  };

  const handleToggleStatus = async (reward) => {
    try {
      if (!reward?.id) {
        Alert.alert("Lỗi", "Không tìm thấy ID voucher để cập nhật.");
        return;
      }

      const nextIsActive = !reward.isActive;
      const payload = buildVoucherPayloadForUpdate(reward, nextIsActive);

      await updateVoucher(reward.id, payload);

      // Refresh list to ensure UI reflects server truth
      await fetchVouchers();

      Alert.alert(
        "Thành công",
        `Đã ${nextIsActive ? "kích hoạt" : "tạm dừng"} voucher`
      );
    } catch (error) {
      console.error("Error toggling voucher status:", error);
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái voucher.");
    }
  };

  const handleOpenEdit = (reward) => {
    setSelectedReward(reward);
    setIsCreating(false);

    let expiryDateText = "";
    if (reward?.expiryDate) {
      const d = new Date(reward.expiryDate);
      expiryDateText = Number.isNaN(d.getTime())
        ? ""
        : d.toISOString().split("T")[0];
    }

    setFormState({
      voucherCode: reward.voucherCode,
      description: reward.description || "",
      voucherType: reward.voucherType || "FOOD_AND_BEVERAGE",
      cost: String(reward.cost || 0),
      expiryDate: expiryDateText,
      isActive: reward.isActive !== undefined ? reward.isActive : true,
    });
    setModalVisible(true);
  };

  const handleOpenCreate = () => {
    setSelectedReward(null);
    setIsCreating(true);
    setFormState({
      voucherCode: "",
      description: "",
      voucherType: "FOOD_AND_BEVERAGE",
      cost: "",
      expiryDate: "",
      isActive: true,
    });
    setModalVisible(true);
  };

  const handleSaveReward = async () => {
    if (!formState.voucherCode.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập mã voucher");
      return;
    }

    if (!formState.cost || Number(formState.cost) < 0) {
      Alert.alert("Lỗi", "Vui lòng nhập giá trị hợp lệ");
      return;
    }

    try {
      setSubmitting(true);

      const expiryDateIso = parseExpiryDateToISO(formState.expiryDate);
      if (expiryDateIso === undefined) {
        Alert.alert("Lỗi", "Ngày hết hạn không hợp lệ. Định dạng đúng: YYYY-MM-DD");
        return;
      }

      const voucherData = {
        voucherCode: formState.voucherCode.trim(),
        description: formState.description.trim(),
        voucherType: formState.voucherType,
        cost: Number(formState.cost),
        expiryDate: expiryDateIso,
        isActive: formState.isActive,
      };

      // If user left expiry date empty, omit it instead of sending null
      // (some backends 500 on null date fields).
      if (!voucherData.expiryDate) {
        delete voucherData.expiryDate;
      }

      console.log(
        `💾 Saving voucher (${isCreating ? "CREATE" : "UPDATE"}) payload:`,
        voucherData
      );

      if (isCreating) {
        await createVoucher(voucherData);
        Alert.alert("Thành công", "Đã tạo voucher mới");
      } else {
        await updateVoucher(selectedReward.id, voucherData);
        Alert.alert("Thành công", "Đã cập nhật voucher");
      }

      // Refresh list
      await fetchVouchers();
      handleCloseModal();
    } catch (error) {
      const serverData = error?.response?.data;
      console.error("Error saving voucher:", {
        message: error?.message,
        status: error?.response?.status,
        url: error?.config?.url,
        method: error?.config?.method,
        data: serverData,
      });
      const serverMessage =
        (serverData && (serverData.message || serverData.error)) || null;
      Alert.alert(
        "Lỗi",
        serverMessage ||
          `Không thể ${isCreating ? "tạo" : "cập nhật"} voucher. Vui lòng thử lại.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReward = async (reward) => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc muốn xóa voucher "${reward.voucherCode}"?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteVoucher(reward.id);
              Alert.alert("Thành công", "Đã xóa voucher");
              await fetchVouchers();
            } catch (error) {
              console.error("Error deleting voucher:", error);
              Alert.alert("Lỗi", "Không thể xóa voucher. Vui lòng thử lại.");
            }
          },
        },
      ]
    );
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
    // Format date
    const formatDate = (dateStr) => {
      if (!dateStr) return "Không giới hạn";
      const date = new Date(dateStr);
      if (Number.isNaN(date.getTime())) return "Không hợp lệ";
      return date.toLocaleDateString("vi-VN");
    };

    // Map voucher type to Vietnamese
    const getVoucherTypeLabel = (type) => {
      const typeMap = {
        FOOD_AND_BEVERAGE: "Đồ ăn & Uống",
        SHOPPING: "Mua sắm",
        VEHICLE_SERVICE: "Dịch vụ xe",
      };
      return typeMap[type] || type;
    };

    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rewardTitle}>{item.voucherCode}</Text>
            <Text style={styles.rewardId}>#{item.id}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: item.isActive
                  ? COLORS.GREEN_LIGHT
                  : COLORS.ORANGE_LIGHT,
              },
            ]}
          >
            <Text
              style={[
                styles.statusLabel,
                { color: item.isActive ? COLORS.GREEN : COLORS.ORANGE_DARK },
              ]}
            >
              {item.isActive ? "Đang áp dụng" : "Tạm dừng"}
            </Text>
          </View>
        </View>

        {item.description && (
          <Text style={styles.description}>{item.description}</Text>
        )}

        <View style={styles.metaRow}>
          <Ionicons name="pricetag-outline" size={16} color={COLORS.GRAY} />
          <Text style={styles.metaText}>
            Loại: {getVoucherTypeLabel(item.voucherType)}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="cash-outline" size={16} color={COLORS.GRAY} />
          <Text style={styles.metaText}>Giá trị: {item.cost}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.GRAY} />
          <Text style={styles.metaText}>
            Hạn sử dụng: {formatDate(item.expiryDate)}
          </Text>
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
            onPress={() => handleToggleStatus(item)}
          >
            <Ionicons
              name={item.isActive ? "pause-outline" : "play-outline"}
              size={18}
              color={COLORS.WHITE}
            />
            <Text style={styles.actionLabel}>
              {item.isActive ? "Tạm dừng" : "Kích hoạt"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteReward(item)}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.WHITE} />
            <Text style={styles.actionLabel}>Xóa</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
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
        <TouchableOpacity style={styles.addButton} onPress={handleOpenCreate}>
          <Ionicons name="add-circle-outline" size={20} color={COLORS.WHITE} />
          <Text style={styles.addButtonText}>Thêm ưu đãi mới</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Đang tải voucher...</Text>
        </View>
      ) : (
        <FlatList
          data={rewards}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderRewardItem}
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
              <Ionicons name="gift-outline" size={48} color={COLORS.GRAY} />
              <Text style={styles.emptyTitle}>Chưa có voucher nào</Text>
              <Text style={styles.emptyDescription}>
                Nhấn "Thêm ưu đãi mới" để tạo voucher.
              </Text>
            </View>
          }
        />
      )}

      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isCreating ? "Tạo voucher mới" : "Chỉnh sửa voucher"}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                style={styles.input}
                placeholder="Mã voucher *"
                value={formState.voucherCode}
                onChangeText={(value) =>
                  setFormState((prev) => ({ ...prev, voucherCode: value }))
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

              <Text style={styles.label}>Loại voucher *</Text>
              <View style={styles.typeSelector}>
                {["FOOD_AND_BEVERAGE", "SHOPPING", "VEHICLE_SERVICE"].map(
                  (type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        formState.voucherType === type &&
                          styles.typeButtonActive,
                      ]}
                      onPress={() =>
                        setFormState((prev) => ({ ...prev, voucherType: type }))
                      }
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          formState.voucherType === type &&
                            styles.typeButtonTextActive,
                        ]}
                      >
                        {type === "FOOD_AND_BEVERAGE"
                          ? "Đồ ăn & Uống"
                          : type === "SHOPPING"
                          ? "Mua sắm"
                          : "Dịch vụ xe"}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Giá trị *"
                keyboardType="numeric"
                value={formState.cost}
                onChangeText={(value) =>
                  setFormState((prev) => ({ ...prev, cost: value }))
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Ngày hết hạn (YYYY-MM-DD)"
                value={formState.expiryDate}
                onChangeText={(value) =>
                  setFormState((prev) => ({ ...prev, expiryDate: value }))
                }
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCloseModal}
                disabled={submitting}
              >
                <Text style={styles.modalButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.saveButton,
                  submitting && styles.saveButtonDisabled,
                ]}
                onPress={handleSaveReward}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={COLORS.WHITE} />
                ) : (
                  <Text style={styles.modalButtonText}>
                    {isCreating ? "Tạo mới" : "Lưu thay đổi"}
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
  saveButtonDisabled: {
    backgroundColor: COLORS.GRAY,
    opacity: 0.6,
  },
  deleteButton: {
    backgroundColor: COLORS.RED,
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
  emptyState: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12,
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
  typeSelector: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.GRAY_LIGHT,
    alignItems: "center",
  },
  typeButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  typeButtonText: {
    fontSize: 14,
    color: COLORS.GRAY,
    fontWeight: "600",
  },
  typeButtonTextActive: {
    color: COLORS.WHITE,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.WHITE,
  },
});

export default RewardManagement;
