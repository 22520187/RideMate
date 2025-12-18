import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constant/colors";

const initialMemberships = [
  {
    id: "MEM-1001",
    name: "RideMate Premium",
    description: "Ưu đãi đặc biệt mọi chuyến xe\nTích điểm nhanh gấp đôi",
    price: 199000,
    duration: 30, // days
    maxTripsPerDay: 5,
    pointMultiplier: 2.0,
    benefits: [
      "Giảm 10% mọi chuyến đi",
      "Tích điểm x2",
      "Ưu tiên đặt chỗ",
      "Hỗ trợ 24/7",
    ],
    status: "active",
    subscribers: 1250,
  },
  {
    id: "MEM-1002",
    name: "RideMate VIP",
    description: "Trải nghiệm dịch vụ cao cấp\nHỗ trợ ưu tiên 24/7",
    price: 499000,
    duration: 30,
    maxTripsPerDay: 10,
    pointMultiplier: 3.0,
    benefits: [
      "Giảm 20% mọi chuyến đi",
      "Tích điểm x3",
      "Ưu tiên tối đa",
      "Hỗ trợ VIP 24/7",
      "Quà tặng đặc biệt",
    ],
    status: "active",
    subscribers: 680,
  },
  {
    id: "MEM-1003",
    name: "RideMate Family",
    description: "Chia sẻ cho cả gia đình\nTối đa 5 thành viên",
    price: 299000,
    duration: 30,
    maxTripsPerDay: 8,
    pointMultiplier: 2.5,
    benefits: [
      "Chia sẻ cho 5 người",
      "Giảm 15% mọi chuyến đi",
      "Tích điểm x2.5",
      "Ưu tiên đặt chỗ",
    ],
    status: "active",
    subscribers: 420,
  },
  {
    id: "MEM-1004",
    name: "RideMate Student",
    description: "Gói đặc biệt cho sinh viên\nGiá ưu đãi",
    price: 99000,
    duration: 30,
    maxTripsPerDay: 3,
    pointMultiplier: 1.5,
    benefits: [
      "Giảm 15% mọi chuyến đi",
      "Tích điểm x1.5",
      "Chỉ dành cho sinh viên",
    ],
    status: "paused",
    subscribers: 0,
  },
];

const MembershipManagement = ({ navigation }) => {
  const [memberships, setMemberships] = useState(initialMemberships);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formState, setFormState] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    maxTripsPerDay: "",
    pointMultiplier: "",
    benefits: "",
    status: "active",
  });

  const activeCount = memberships.filter((m) => m.status === "active").length;

  const handleToggleStatus = (membershipId) => {
    setMemberships((prev) =>
      prev.map((membership) =>
        membership.id === membershipId
          ? {
              ...membership,
              status: membership.status === "active" ? "paused" : "active",
            }
          : membership
      )
    );
  };

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setSelectedMembership(null);
    setFormState({
      name: "",
      description: "",
      price: "",
      duration: "",
      maxTripsPerDay: "",
      pointMultiplier: "",
      benefits: "",
      status: "active",
    });
    setModalVisible(true);
  };

  const handleOpenEdit = (membership) => {
    setIsEditMode(true);
    setSelectedMembership(membership);
    setFormState({
      name: membership.name,
      description: membership.description,
      price: String(membership.price),
      duration: String(membership.duration),
      maxTripsPerDay: String(membership.maxTripsPerDay),
      pointMultiplier: String(membership.pointMultiplier),
      benefits: membership.benefits.join("\n"),
      status: membership.status,
    });
    setModalVisible(true);
  };

  const handleSaveMembership = () => {
    if (isEditMode && selectedMembership) {
      // Edit mode
      setMemberships((prev) =>
        prev.map((membership) =>
          membership.id === selectedMembership.id
            ? {
                ...membership,
                name: formState.name.trim(),
                description: formState.description.trim(),
                price: Number(formState.price) || 0,
                duration: Number(formState.duration) || 30,
                maxTripsPerDay: Number(formState.maxTripsPerDay) || 1,
                pointMultiplier: Number(formState.pointMultiplier) || 1.0,
                benefits: formState.benefits
                  .split("\n")
                  .filter((b) => b.trim()),
                status: formState.status,
              }
            : membership
        )
      );
    } else {
      // Add mode
      const newId = `MEM-${1000 + memberships.length + 1}`;
      const newMembership = {
        id: newId,
        name: formState.name.trim(),
        description: formState.description.trim(),
        price: Number(formState.price) || 0,
        duration: Number(formState.duration) || 30,
        maxTripsPerDay: Number(formState.maxTripsPerDay) || 1,
        pointMultiplier: Number(formState.pointMultiplier) || 1.0,
        benefits: formState.benefits.split("\n").filter((b) => b.trim()),
        status: formState.status,
        subscribers: 0,
      };
      setMemberships((prev) => [...prev, newMembership]);
    }
    setModalVisible(false);
  };

  const renderMembershipItem = ({ item }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.membershipName}>{item.name}</Text>
            <Text style={styles.membershipId}>{item.id}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  item.status === "active"
                    ? COLORS.GREEN_LIGHT
                    : COLORS.ORANGE_LIGHT,
              },
            ]}
          >
            <Text
              style={[
                styles.statusLabel,
                {
                  color:
                    item.status === "active"
                      ? COLORS.GREEN
                      : COLORS.ORANGE_DARK,
                },
              ]}
            >
              {item.status === "active" ? "Đang hoạt động" : "Tạm dừng"}
            </Text>
          </View>
        </View>

        <Text style={styles.membershipDescription}>{item.description}</Text>

        <View style={styles.membershipInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={16} color={COLORS.GRAY} />
            <Text style={styles.infoText}>
              {item.price.toLocaleString("vi-VN")}đ/tháng
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.GRAY} />
            <Text style={styles.infoText}>{item.duration} ngày</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="car-outline" size={16} color={COLORS.GRAY} />
            <Text style={styles.infoText}>
              Tối đa {item.maxTripsPerDay} chuyến/ngày
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="star-outline" size={16} color={COLORS.GRAY} />
            <Text style={styles.infoText}>
              Tích điểm x{item.pointMultiplier}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={16} color={COLORS.GRAY} />
            <Text style={styles.infoText}>
              {item.subscribers.toLocaleString()} người đăng ký
            </Text>
          </View>
        </View>

        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>Quyền lợi:</Text>
          {item.benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitItem}>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={COLORS.GREEN}
              />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
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
            style={[
              styles.actionButton,
              item.status === "active"
                ? styles.pauseButton
                : styles.activateButton,
            ]}
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
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.WHITE} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Quản lý gói nâng cấp</Text>
            <Text style={styles.subtitle}>
              Quản lý các gói thành viên và quyền lợi
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Ionicons name="star-outline" size={24} color={COLORS.BLUE} />
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Gói đang hoạt động</Text>
            <Text style={styles.summaryValue}>{activeCount}</Text>
          </View>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="people-outline" size={24} color={COLORS.PURPLE} />
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Tổng người đăng ký</Text>
            <Text style={styles.summaryValue}>
              {memberships
                .reduce((sum, m) => sum + m.subscribers, 0)
                .toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.addButtonContainer}>
        <TouchableOpacity style={styles.addButton} onPress={handleOpenAdd}>
          <Ionicons name="add-circle-outline" size={20} color={COLORS.WHITE} />
          <Text style={styles.addButtonText}>Thêm gói mới</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={memberships}
        keyExtractor={(item) => item.id}
        renderItem={renderMembershipItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        transparent
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditMode ? "Chỉnh sửa gói" : "Thêm gói mới"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.GRAY} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formGroup}>
                <Text style={styles.label}>Tên gói *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập tên gói"
                  value={formState.name}
                  onChangeText={(value) =>
                    setFormState((prev) => ({ ...prev, name: value }))
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Mô tả *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Nhập mô tả gói"
                  multiline
                  numberOfLines={3}
                  value={formState.description}
                  onChangeText={(value) =>
                    setFormState((prev) => ({ ...prev, description: value }))
                  }
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.label}>Giá (đồng) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    keyboardType="numeric"
                    value={formState.price}
                    onChangeText={(value) =>
                      setFormState((prev) => ({ ...prev, price: value }))
                    }
                  />
                </View>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.label}>Thời hạn (ngày) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="30"
                    keyboardType="numeric"
                    value={formState.duration}
                    onChangeText={(value) =>
                      setFormState((prev) => ({ ...prev, duration: value }))
                    }
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.label}>Số chuyến tối đa/ngày *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="5"
                    keyboardType="numeric"
                    value={formState.maxTripsPerDay}
                    onChangeText={(value) =>
                      setFormState((prev) => ({
                        ...prev,
                        maxTripsPerDay: value,
                      }))
                    }
                  />
                </View>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.label}>Tốc độ tích điểm (x) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="2.0"
                    keyboardType="decimal-pad"
                    value={formState.pointMultiplier}
                    onChangeText={(value) =>
                      setFormState((prev) => ({
                        ...prev,
                        pointMultiplier: value,
                      }))
                    }
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Quyền lợi (mỗi dòng một quyền lợi) *
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Giảm 10% mọi chuyến đi&#10;Tích điểm x2&#10;Ưu tiên đặt chỗ"
                  multiline
                  numberOfLines={5}
                  value={formState.benefits}
                  onChangeText={(value) =>
                    setFormState((prev) => ({ ...prev, benefits: value }))
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <View style={styles.switchRow}>
                  <Text style={styles.label}>Trạng thái</Text>
                  <Switch
                    value={formState.status === "active"}
                    onValueChange={(value) =>
                      setFormState((prev) => ({
                        ...prev,
                        status: value ? "active" : "paused",
                      }))
                    }
                    trackColor={{
                      false: COLORS.GRAY_LIGHT,
                      true: COLORS.GREEN,
                    }}
                    thumbColor={COLORS.WHITE}
                  />
                </View>
                <Text style={styles.switchLabel}>
                  {formState.status === "active"
                    ? "Đang hoạt động"
                    : "Tạm dừng"}
                </Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveMembership}
                >
                  <Text style={styles.modalButtonText}>
                    {isEditMode ? "Lưu thay đổi" : "Thêm gói"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    padding: 4,
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
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  membershipName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  membershipId: {
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
  membershipDescription: {
    fontSize: 14,
    color: COLORS.BLACK,
    lineHeight: 20,
    marginBottom: 12,
  },
  membershipInfo: {
    gap: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.GRAY,
  },
  benefitsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.GRAY_LIGHT,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.BLACK,
    marginBottom: 8,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  benefitText: {
    fontSize: 13,
    color: COLORS.BLACK,
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
  pauseButton: {
    backgroundColor: COLORS.ORANGE_DARK,
  },
  activateButton: {
    backgroundColor: COLORS.GREEN,
  },
  actionLabel: {
    fontSize: 13,
    color: COLORS.WHITE,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "90%",
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
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: "row",
    gap: 12,
  },
  formGroupHalf: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.BLACK,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.BLACK,
    backgroundColor: COLORS.WHITE,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 13,
    color: COLORS.GRAY,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
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
    backgroundColor: COLORS.PRIMARY,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.WHITE,
  },
});

export default MembershipManagement;
