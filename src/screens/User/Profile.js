import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
  LayoutAnimation,
  UIManager,
  Modal,
  FlatList,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import COLORS from "../../constant/colors";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";

const API_BASE = "https://localhost:5000/v1";

export default function Profile() {
  const [profile, setProfile] = useState({
    fullName: "",
    dob: null,
    address: "",
    licensePlate: "",
    phone: "",
    bankAccountNumber: "",
    bankName: "",
    verificationImage: null,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const update = (key, value) => {
    setProfile((p) => ({ ...p, [key]: value }));
    setErrors((e) => ({ ...e, [key]: null }));
  };

  const [refreshing, setRefreshing] = useState(false);

  const [registered, setRegistered] = useState(false);
  const [approved, setApproved] = useState(false);
  const [vehicleData, setVehicleData] = useState({
    licensePlate: "",
    images: [],
  });
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpenVisible, setConfirmOpenVisible] = useState(false);

  // useEffect(() => {
  //   fetchStatus();
  // }, []);

  // async function fetchStatus() {
  //   try {
  //     setLoading(true);
  //     const res = await fetch(`${API_BASE}/vehicle/status`, {
  //       headers: {
  //         Authorization: token ? `Bearer ${token}` : undefined,
  //         Accept: "application/json",
  //       },
  //     });
  //     if (!res.ok) {
  //       throw new Error("Không thể lấy trạng thái xe");
  //     }
  //     const data = await res.json();
  //     setRegistered(!!data.registered);
  //     setApproved(!!data.approved);
  //     if (data.registered) {
  //       setVehicleData({
  //         licensePlate: data.licensePlate || "",
  //         images: (data.images || []).map((it) => ({ uri: it.url, id: it.id })),
  //       });
  //     } else {
  //       setVehicleData({ licensePlate: "", images: [] });
  //     }
  //   } catch (err) {
  //     console.warn(err);
  //     Alert.alert("Lỗi", "Không thể tải trạng thái xe. Vui lòng thử lại.");
  //   } finally {
  //     setLoading(false);
  //     setRefreshing(false);
  //   }
  // }

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
      quality: 0.8,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      const name =
        asset.fileName ||
        asset.uri.split("/").pop() ||
        `photo_${Date.now()}.jpg`;
      const ext = (name && name.split(".").pop()) || "jpg";
      const type = asset.type || `image/${ext === "jpg" ? "jpeg" : ext}`;

      if (editing) {
        setVehicleData((prev) => ({
          ...prev,
          images: [...prev.images, { uri: asset.uri, name, type }],
        }));
      } else {
        update("verificationImage", {
          uri: asset.uri,
          fileName: name,
          type,
        });
      }
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Không có quyền", "Cần cấp quyền camera để chụp ảnh.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      const name =
        asset.fileName ||
        asset.uri.split("/").pop() ||
        `photo_${Date.now()}.jpg`;
      const ext = (name && name.split(".").pop()) || "jpg";
      const type = asset.type || `image/${ext === "jpg" ? "jpeg" : ext}`;

      if (editing) {
        setVehicleData((prev) => ({
          ...prev,
          images: [...prev.images, { uri: asset.uri, name, type }],
        }));
      } else {
        update("verificationImage", {
          uri: asset.uri,
          fileName: name,
          type,
        });
      }
    }
  };

  const appendImageFromUri = (uri) => {
    const name = uri.split("/").pop();
    const ext = (name && name.split(".").pop()) || "jpg";
    const type = `image/${ext === "jpg" ? "jpeg" : ext}`;

    setVehicleData((prev) => ({
      ...prev,
      images: [...prev.images, { uri, name, type }],
    }));
  };

  const removeImageAt = (index) => {
    setVehicleData((prev) => {
      const newArr = [...prev.images];
      newArr.splice(index, 1);
      return { ...prev, images: newArr };
    });
  };

  const onOpenRegisterConfirm = () => {
    setConfirmOpenVisible(true);
  };

  const confirmOpenRegister = async () => {
    setConfirmOpenVisible(false);
    setEditing(true);
  };

  const cancelEditing = () => {
    if (!registered) {
      setVehicleData({ licensePlate: "", images: [] });
    } else {
      fetchStatus();
    }
    setEditing(false);
  };

  const uriToBlob = async (uri) => {
    const resp = await fetch(uri);
    const blob = await resp.blob();
    return blob;
  };

  const submitRegistration = async () => {
    if (!vehicleData.licensePlate?.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập biển số xe.");
      return;
    }
    if (!vehicleData.images || vehicleData.images.length === 0) {
      Alert.alert("Thiếu ảnh", "Vui lòng thêm ít nhất 1 ảnh xác thực.");
      return;
    }

    try {
      setSubmitting(true);

      const form = new FormData();
      form.append("licensePlate", vehicleData.licensePlate.trim());
      // images
      for (let i = 0; i < vehicleData.images.length; i++) {
        const img = vehicleData.images[i];
        if (img.id && img.uri.startsWith("http")) {
          form.append("existingImageIds[]", String(img.id));
        } else {
          const blob = await uriToBlob(img.uri);
          form.append("images", {
            uri: img.uri,
            name: img.name || `photo_${i}.jpg`,
            type: img.type || "image/jpeg",
          });
        }
      }

      const isNew = !registered;
      const url = isNew
        ? `${API_BASE}/vehicle/register`
        : `${API_BASE}/vehicle/update`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          Accept: "application/json",
        },
        body: form,
      });

      if (!res.ok) {
        const text = await res.text();
        console.warn("Server error:", text);
        throw new Error("Lỗi từ máy chủ");
      }
      const resJson = await res.json();

      Alert.alert(
        "Thành công",
        resJson.message || "Đã gửi thông tin. Đang chờ duyệt."
      );

      setRegistered(true);
      setApproved(!!resJson.approved);
      setVehicleData({
        licensePlate: resJson.licensePlate || vehicleData.licensePlate,
        images: (resJson.images || []).map((it) => ({
          uri: it.url,
          id: it.id,
        })),
      });
      setEditing(false);
    } catch (err) {
      console.warn(err);
      Alert.alert("Lỗi", "Gửi thông tin thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  function renderImageItem({ item, index }) {
    const remote = item.uri && item.uri.startsWith("http");
    return (
      <View style={styles.thumbWrap}>
        <Image source={{ uri: item.uri }} style={styles.thumbnail} />
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() =>
            Alert.alert("Xóa ảnh", "Bạn có chắc muốn xóa ảnh này?", [
              { text: "Huỷ", style: "cancel" },
              {
                text: "Xóa",
                style: "destructive",
                onPress: () => removeImageAt(index),
              },
            ])
          }
        >
          <MaterialIcons name="close" size={18} color="#fff" />
        </TouchableOpacity>
        {remote && (
          <View style={styles.remoteBadge}>
            <Text style={styles.remoteBadgeText}>Đã lưu</Text>
          </View>
        )}
      </View>
    );
  }

  const validate = () => {
    const e = {};
    if (!profile.fullName || profile.fullName.trim().length < 2)
      e.fullName = "Vui lòng nhập họ tên đầy đủ";
    if (!profile.dob) e.dob = "Chọn ngày sinh";
    else if (getAge(profile.dob) < 16)
      e.dob = "Người dùng phải từ 16 tuổi trở lên";
    if (!profile.phone || !/^\+?\d{7,15}$/.test(profile.phone.trim()))
      e.phone = "Số điện thoại không đúng định dạng";
    if (
      profile.bankAccountNumber &&
      !/^\d{6,22}$/.test(profile.bankAccountNumber.trim())
    )
      e.bankAccountNumber = "Số tài khoản không hợp lệ";
    if (!profile.address) e.address = "Vui lòng nhập địa chỉ thường trú";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const getAge = (dob) => {
    const diff = Date.now() - dob.getTime();
    const ageDt = new Date(diff);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  const submitProfile = async () => {
    if (!validate()) {
      Alert.alert("Lỗi", "Vui lòng sửa các trường có lỗi trước khi gửi.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("fullName", profile.fullName.trim());
      formData.append("dob", profile.dob.toISOString());
      formData.append("phone", profile.phone.trim());
      formData.append("address", profile.address.trim());
      formData.append("licensePlate", profile.licensePlate.trim());
      formData.append("bankAccountNumber", profile.bankAccountNumber.trim());
      formData.append("bankName", profile.bankName.trim());

      if (profile.verificationImage) {
        formData.append("verificationImage", {
          uri: profile.verificationImage.uri,
          name: profile.verificationImage.fileName,
          type: profile.verificationImage.type,
        });
      }

      console.log("Gửi form:", formData);
      Alert.alert("Thành công", "Thông tin đã được gửi!");
      onSuccess(formData);
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Không thể gửi thông tin, thử lại sau!");
    } finally {
      setLoading(false);
    }
  };

  const FieldError = ({ field }) =>
    errors[field] ? (
      <Text style={styles.errorText}>{errors[field]}</Text>
    ) : null;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#fdfdfd" }}
      behavior="padding"
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>QUẢN LÝ TÀI KHOẢN</Text>

        {/* Thông tin cá nhân */}
        <View style={[styles.section, { marginTop: 80 }]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="person" size={20} color={COLORS.PRIMARY} />
            <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          </View>

          <Text style={styles.label}>Họ và tên</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Nguyễn Văn A"
            value={profile.fullName}
            onChangeText={(t) => update("fullName", t)}
          />
          <FieldError field="fullName" />

          <Text style={[styles.label, { marginTop: 12 }]}>Ngày sinh</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={styles.datePickerButton}
          >
            <Text style={{ color: profile.dob ? "#111" : "#777" }}>
              {profile.dob
                ? profile.dob.toLocaleDateString()
                : "Chọn ngày sinh"}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={profile.dob || new Date(1990, 0, 1)}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={(e, d) => {
                setShowDatePicker(false);
                if (d) update("dob", d);
              }}
            />
          )}
          <FieldError field="dob" />

          <Text style={[styles.label, { marginTop: 12 }]}>
            Địa chỉ thường trú
          </Text>
          <TextInput
            style={styles.input}
            placeholder="VD: KTX Khu B ĐHQG TP.HCM"
            value={profile.address}
            onChangeText={(t) => update("address", t)}
          />
          <FieldError field="address" />
        </View>

        {/* Xe & xác thực */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionHeader} activeOpacity={0.8}>
            <FontAwesome5 name="car" size={18} color={COLORS.PRIMARY} />
            <Text style={styles.sectionTitle}>Xe & Xác thực</Text>
          </TouchableOpacity>
          <View style={{ marginTop: 10 }}>
            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator />
              </View>
            ) : (
              <>
                {!registered ? (
                  // Not registered
                  <View style={styles.notRegisteredBox}>
                    <Text style={styles.infoText}>
                      Bạn chưa đăng ký thông tin xe.
                    </Text>
                    <TouchableOpacity
                      style={styles.openBtn}
                      onPress={onOpenRegisterConfirm}
                    >
                      <Text style={styles.openBtnText}>
                        Mở để đăng ký thông tin xe
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.registeredBox}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.label}>Trạng thái</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          approved
                            ? styles.statusApproved
                            : styles.statusPending,
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {approved ? "Đã duyệt" : "Đang chờ duyệt"}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.label, { marginTop: 10 }]}>
                      Biển số xe
                    </Text>
                    <Text style={styles.valueText}>
                      {vehicleData.licensePlate || "-"}
                    </Text>

                    <Text style={[styles.label, { marginTop: 10 }]}>
                      Ảnh xác thực
                    </Text>
                    {vehicleData.images && vehicleData.images.length > 0 ? (
                      <FlatList
                        horizontal
                        data={vehicleData.images}
                        keyExtractor={(it, idx) =>
                          it.id ? String(it.id) : it.uri + idx
                        }
                        renderItem={({ item }) => (
                          <Image
                            source={{ uri: item.uri }}
                            style={styles.thumbnail}
                          />
                        )}
                        contentContainerStyle={{ paddingVertical: 8 }}
                        showsHorizontalScrollIndicator={false}
                      />
                    ) : (
                      <Text style={{ color: "#888", marginTop: 8 }}>
                        Chưa có ảnh
                      </Text>
                    )}

                    <View style={{ marginTop: 12, flexDirection: "row" }}>
                      <TouchableOpacity
                        style={[
                          styles.actionBtn,
                          { backgroundColor: "#0d6efd" },
                        ]}
                        onPress={() => {
                          setEditing(true);
                        }}
                      >
                        <Text style={styles.actionBtnText}>Chỉnh sửa</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.actionBtn,
                          { marginLeft: 10, backgroundColor: "#6c757d" },
                        ]}
                        onPress={() => {
                          setRefreshing(true);
                          fetchStatus();
                        }}
                      >
                        <Text style={styles.actionBtnText}>Tải lại</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <Modal
                  visible={editing}
                  animationType="slide"
                  onRequestClose={cancelEditing}
                  transparent={true}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                      <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                          {registered
                            ? "Chỉnh sửa thông tin xe"
                            : "Đăng ký thông tin xe"}
                        </Text>
                        <TouchableOpacity onPress={cancelEditing}>
                          <MaterialIcons name="close" size={22} color="#333" />
                        </TouchableOpacity>
                      </View>

                      <View style={{ marginTop: 8 }}>
                        <Text style={styles.label}>Biển số xe</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="VD: 51A-123.45"
                          value={vehicleData.licensePlate}
                          onChangeText={(t) =>
                            setVehicleData((p) => ({ ...p, licensePlate: t }))
                          }
                        />

                        <Text style={[styles.label, { marginTop: 12 }]}>
                          Ảnh xác thực (CMND/CCCD/GPLX)
                        </Text>

                        <FlatList
                          data={vehicleData.images}
                          horizontal
                          keyExtractor={(it, idx) =>
                            it.id ? String(it.id) : it.uri + idx
                          }
                          renderItem={renderImageItem}
                          ItemSeparatorComponent={() => (
                            <View style={{ width: 8 }} />
                          )}
                          style={{ marginVertical: 8, maxHeight: 120 }}
                          showsHorizontalScrollIndicator={false}
                        />

                        <View style={{ flexDirection: "row", gap: 8 }}>
                          <TouchableOpacity
                            style={styles.photoButton}
                            onPress={pickImage}
                          >
                            <MaterialIcons
                              name="photo-library"
                              size={20}
                              color="#fff"
                            />
                            <Text style={styles.photoButtonText}>
                              + Thêm ảnh
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.photoButton,
                              { backgroundColor: "#17a2b8" },
                            ]}
                            onPress={takePhoto}
                          >
                            <MaterialIcons
                              name="camera"
                              size={20}
                              color="#fff"
                            />
                            <Text style={styles.photoButtonText}>Camera</Text>
                          </TouchableOpacity>
                        </View>

                        <View style={{ marginTop: 14 }}>
                          <TouchableOpacity
                            style={[
                              styles.submitBtn,
                              submitting && { opacity: 0.8 },
                            ]}
                            onPress={submitRegistration}
                            disabled={submitting}
                          >
                            {submitting ? (
                              <ActivityIndicator color="#fff" />
                            ) : (
                              <Text style={styles.submitBtnText}>
                                {registered ? "Lưu thay đổi" : "Đăng ký"}
                              </Text>
                            )}
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={cancelEditing}
                            disabled={submitting}
                          >
                            <Text style={styles.cancelBtnText}>Hủy</Text>
                          </TouchableOpacity>

                          <Text
                            style={{
                              color: "#666",
                              marginTop: 8,
                              fontSize: 12,
                            }}
                          >
                            Lưu ý: Thông tin sẽ được gửi cho Admin để duyệt. Sau
                            khi được duyệt, phần "Xe & Xác thực" sẽ luôn hiển
                            thị và không thể gỡ bỏ phần này; bạn chỉ có thể
                            chỉnh sửa thông tin.
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </Modal>

                {/* Confirm open register modal */}
                <Modal
                  visible={confirmOpenVisible}
                  animationType="fade"
                  transparent={true}
                  onRequestClose={() => setConfirmOpenVisible(false)}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.confirmBox}>
                      <Text style={styles.confirmTitle}>
                        Mở đăng ký thông tin xe?
                      </Text>
                      <Text style={{ color: "#444", marginTop: 8 }}>
                        Khi mở đăng ký, bạn sẽ nhập thông tin xe và gửi để Admin
                        duyệt. Sau khi được duyệt, bạn sẽ không thể gỡ phần
                        thông tin xe đã đăng ký này.
                      </Text>
                      <View style={{ flexDirection: "row", marginTop: 14 }}>
                        <TouchableOpacity
                          style={[
                            styles.confirmBtn,
                            { backgroundColor: COLORS.GRAY },
                          ]}
                          onPress={() => setConfirmOpenVisible(false)}
                        >
                          <Text style={styles.confirmBtnText}>Huỷ</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.confirmBtn,
                            {
                              marginLeft: 10,
                              backgroundColor: COLORS.PRIMARY,
                            },
                          ]}
                          onPress={confirmOpenRegister}
                        >
                          <Text style={styles.confirmBtnText}>Đồng ý</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>
              </>
            )}
          </View>
        </View>

        {/* Liên hệ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="phone" size={18} color={COLORS.PRIMARY} />
            <Text style={styles.sectionTitle}>Liên hệ</Text>
          </View>
          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: 0987654321"
            keyboardType="phone-pad"
            value={profile.phone}
            onChangeText={(t) => update("phone", t)}
          />
          <FieldError field="phone" />
        </View>

        {/* Ngân hàng */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="university" size={18} color={COLORS.PRIMARY} />
            <Text style={styles.sectionTitle}>Ngân hàng</Text>
          </View>

          <Text style={styles.label}>Số tài khoản</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="VD: 1025905976"
            value={profile.bankAccountNumber}
            onChangeText={(t) => update("bankAccountNumber", t)}
          />
          <FieldError field="bankAccountNumber" />

          <Text style={[styles.label, { marginTop: 12 }]}>Tên ngân hàng</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Vietcombank"
            value={profile.bankName}
            onChangeText={(t) => update("bankName", t)}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && { opacity: 0.7 }]}
          onPress={submitProfile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Lưu</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: COLORS.BG },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.WHITE,
    textAlign: "center",
    marginBottom: 16,
    backgroundColor: COLORS.PRIMARY,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 25,
    zIndex: 999,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    color: "#222",
  },
  label: { fontSize: 13, color: "#333", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    backgroundColor: "#fafafa",
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fafafa",
  },
  photoButton: {
    backgroundColor: COLORS.PRIMARY,
    marginTop: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  photoButtonText: { color: "#fff", fontWeight: "600" },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    resizeMode: "cover",
  },
  placeholderThumb: {
    width: 100,
    height: 100,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
  },
  submitText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  errorText: { color: "red", marginTop: 4 },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  photoButton: {
    marginTop: 10,
    backgroundColor: "#0d6efd",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  photoButtonText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "600",
  },
  notRegisteredBox: {
    alignItems: "center",
    paddingVertical: 14,
  },
  infoText: {
    color: "#555",
    marginBottom: 12,
  },
  openBtn: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  openBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  registeredBox: {
    paddingVertical: 6,
  },
  valueText: {
    fontSize: 15,
    color: "#111",
    marginTop: 6,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusApproved: {
    backgroundColor: "#d4edda",
  },
  statusPending: {
    backgroundColor: "#fff3cd",
  },
  statusText: {
    fontSize: 12,
    color: "#222",
    fontWeight: "700",
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "600",
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  submitBtn: {
    marginTop: 12,
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  submitBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  cancelBtn: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#444",
    fontWeight: "600",
  },
  confirmBox: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
  },
  confirmTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  // thumbs in form
  thumbWrap: {
    position: "relative",
    marginRight: 8,
  },
  removeBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  remoteBadge: {
    position: "absolute",
    left: 6,
    bottom: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  remoteBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
});
