import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import COLORS from "../constant/colors";

const CustomAlert = ({
  visible,
  title,
  message,
  buttons = [{ text: "OK", onPress: () => {} }],
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttons}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  button.style === "cancel" && styles.buttonCancel,
                  index > 0 && styles.buttonMargin,
                ]}
                onPress={() => {
                  if (onClose) onClose();
                  if (button.onPress) button.onPress();
                }}
              >
                <Text
                  style={[
                    styles.buttonText,
                    button.style === "cancel" && styles.buttonTextCancel,
                  ]}
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.BLACK,
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: COLORS.GRAY,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: "center",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  button: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  buttonCancel: {
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  buttonMargin: {
    marginLeft: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.WHITE,
  },
  buttonTextCancel: {
    color: COLORS.BLACK,
  },
});

export default CustomAlert;
