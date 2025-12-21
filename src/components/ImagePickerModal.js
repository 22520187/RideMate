/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Camera } from "lucide-react-native";
import COLORS from '../constant/colors';

const ImagePickerModal = ({ 
  visible, 
  onClose, 
  onCameraPress, 
  onLibraryPress,
  title = "Chọn nguồn ảnh" 
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={onClose}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View style={styles.imagePickerModal}>
            <Text style={styles.modalTitle}>{title}</Text>
            
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                console.log('📸 Camera button pressed');
                onCameraPress && onCameraPress();
              }}
            >
              <Camera size={24} color={COLORS.PRIMARY} />
              <Text style={styles.modalOptionText}>Chụp ảnh</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                console.log('📚 Library button pressed');
                onLibraryPress && onLibraryPress();
              }}
            >
              <MaterialIcons
                name="photo-library"
                size={24}
                color={COLORS.PRIMARY}
              />
              <Text style={styles.modalOptionText}>Chọn từ thư viện</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalOption, styles.modalCancel]}
              onPress={onClose}
            >
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  imagePickerModal: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 20,
    textAlign: "center",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F8F9FA",
    marginBottom: 12,
    gap: 12,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  modalCancel: {
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8E8E93",
    flex: 1,
    textAlign: "center",
  },
});

export default ImagePickerModal;
