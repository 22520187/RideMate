import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constant/colors";

const initialProfile = {
  fullName: "Quản trị viên RideMate",
  email: "admin@ridemate.vn",
  phone: "+84 901 234 567",
  role: "Super Admin",
  securityEmail: "security@ridemate.vn",
};

const AdminProfile = () => {
  const [profile, setProfile] = useState(initialProfile);
  const [editing, setEditing] = useState(false);

  const handleChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setEditing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Hồ sơ quản trị</Text>
            <Text style={styles.subtitle}>
              Cập nhật thông tin cá nhân và thiết lập bảo mật tài khoản admin
            </Text>
          </View>
          <Ionicons name="settings-outline" size={28} color={COLORS.BLUE} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Họ và tên</Text>
            <TextInput
              style={[styles.input, !editing && styles.inputDisabled]}
              value={profile.fullName}
              editable={editing}
              onChangeText={(value) => handleChange("fullName", value)}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Email đăng nhập</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={profile.email}
              editable={false}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput
              style={[styles.input, !editing && styles.inputDisabled]}
              value={profile.phone}
              editable={editing}
              onChangeText={(value) => handleChange("phone", value)}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Vai trò</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={profile.role}
              editable={false}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Liên hệ bảo mật</Text>
          <Text style={styles.sectionDescription}>
            Địa chỉ email nhận thông báo khi có hoạt động đăng nhập bất thường
          </Text>
          <View style={styles.field}>
            <Text style={styles.label}>Email bảo mật</Text>
            <TextInput
              style={[styles.input, !editing && styles.inputDisabled]}
              value={profile.securityEmail}
              editable={editing}
              onChangeText={(value) => handleChange("securityEmail", value)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tùy chọn nhanh</Text>
          <TouchableOpacity style={styles.quickAction}>
            <Ionicons name="key-outline" size={22} color={COLORS.BLUE} />
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>Đổi mật khẩu</Text>
              <Text style={styles.quickActionDescription}>
                Đặt lại mật khẩu mạnh để bảo vệ tài khoản
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.GRAY} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <Ionicons name="shield-checkmark-outline" size={22} color={COLORS.GREEN} />
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>Quản lý phiên đăng nhập</Text>
              <Text style={styles.quickActionDescription}>
                Xem và đăng xuất khỏi các thiết bị đang hoạt động
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.GRAY} />
          </TouchableOpacity>
        </View>

        <View style={styles.footerActions}>
          {editing ? (
            <>
              <TouchableOpacity
                style={[styles.footerButton, styles.cancelButton]}
                onPress={() => {
                  setProfile(initialProfile);
                  setEditing(false);
                }}
              >
                <Text style={styles.cancelLabel}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.footerButton, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.saveLabel}>Lưu thay đổi</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.footerButton, styles.primaryButton]}
              onPress={() => setEditing(true)}
            >
              <Text style={styles.primaryLabel}>Chỉnh sửa thông tin</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
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
  section: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.BLACK,
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 13,
    color: COLORS.GRAY,
    marginBottom: 16,
    lineHeight: 18,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: COLORS.GRAY,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.BLACK,
  },
  inputDisabled: {
    backgroundColor: COLORS.GRAY_BG,
    color: COLORS.GRAY,
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  quickActionContent: {
    flex: 1,
    marginLeft: 14,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.BLACK,
  },
  quickActionDescription: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.GRAY,
    lineHeight: 18,
  },
  footerActions: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  footerButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.BLUE,
  },
  primaryLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.WHITE,
  },
  cancelButton: {
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  cancelLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.GRAY,
  },
  saveButton: {
    backgroundColor: COLORS.BLUE,
  },
  saveLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.WHITE,
  },
});

export default AdminProfile;

