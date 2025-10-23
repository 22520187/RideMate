import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Modal from "react-native-modal";
import COLORS from "../../../constant/colors";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MessageListScreen({ navigation }) {
  const [chats, setChats] = useState([
    {
      id: "1",
      name: "Anna Nguyen",
      lastMessage: "Tối nay mình đi xem phim nhé 🎬",
      photoURL: "https://i.pravatar.cc/150?img=5",
      updatedAt: new Date(),
    },
    {
      id: "2",
      name: "David Tran",
      lastMessage: "Oke mai mình call lại nha",
      photoURL: "https://i.pravatar.cc/150?img=2",
      updatedAt: new Date(Date.now() - 1000 * 60 * 60),
    },
  ]);

  const [selectedChat, setSelectedChat] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);

  const openChatOptions = (chat) => {
    setSelectedChat(chat);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedChat(null);
  };

  const handleOpenChat = (chat) => {
    navigation.navigate("ChatScreen", { chatId: chat.id });
  };

  const renderChatItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => handleOpenChat(item)}
      onLongPress={() => openChatOptions(item)}
      delayLongPress={250}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        <Image
          source={{ uri: item.photoURL || "https://i.pravatar.cc/100" }}
          style={styles.avatar}
        />
      </View>

      <View style={styles.centerSection}>
        <Text style={styles.chatName}>{item.name}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>

      <View style={styles.rightSection}>
        <Text style={styles.time}>
          {item.updatedAt.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
        <Icon name="chevron-right" size={22} color={COLORS.GRAY} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<Text style={styles.title}>Tin nhắn</Text>}
      />

      {/* Modal hiển thị tùy chọn */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={closeModal}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.modalItem}>
            <Text style={styles.modalText}>📌 Ghim cuộc trò chuyện</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalItem}>
            <Text style={styles.modalText}>🙈 Ẩn cuộc trò chuyện</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalItem}>
            <Text style={[styles.modalText, { color: "red" }]}>
              🗑 Xóa cuộc trò chuyện
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fdfdfd",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.WHITE,
    textAlign: "center",
    marginBottom: 16,
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.LIGHT_GRAY || "#f9f9f9",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  leftSection: {
    marginRight: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#ddd",
  },
  centerSection: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.BLACK,
  },
  lastMessage: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginTop: 2,
  },
  rightSection: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  time: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginBottom: 2,
  },
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 15,
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
  },
  modalText: {
    fontSize: 16,
    color: COLORS.BLACK,
    textAlign: "center",
  },
});
