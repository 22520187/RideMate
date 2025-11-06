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
      name: "Minh Quang",
      lastMessage: "Tới chỗ cũ nhé!",
      photoURL: "https://i.pravatar.cc/150?img=28",
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 9),
      isRead: false,
    },
    {
      id: "2",
      name: "David Tran",
      lastMessage: "Oke mai mình call lại nha",
      photoURL: "https://i.pravatar.cc/150?img=2",
      updatedAt: new Date(Date.now() - 1000 * 60 * 60),
      isRead: true,
    },
    {
      id: "3",
      name: "Linh Pham",
      lastMessage: "Cậu gửi mình file bài tập với nha 📎",
      photoURL: "https://i.pravatar.cc/150?img=10",
      updatedAt: new Date(Date.now() - 1000 * 60 * 20),
      isRead: false,
    },
    {
      id: "4",
      name: "John Le",
      lastMessage: "Haha, đúng rồi đó 😂",
      photoURL: "https://i.pravatar.cc/150?img=12",
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      isRead: true,
    },
    {
      id: "5",
      name: "Mai Tran",
      lastMessage: "Cậu đã ăn trưa chưa 🍱",
      photoURL: "https://i.pravatar.cc/150?img=14",
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
      isRead: false,
    },
    {
      id: "6",
      name: "Alex Phan",
      lastMessage: "Ok để mình check lại.",
      photoURL: "https://i.pravatar.cc/150?img=18",
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
      isRead: true,
    },
    {
      id: "7",
      name: "Hà My",
      lastMessage: "Mai họp nhóm lúc 9h nha 📚",
      photoURL: "https://i.pravatar.cc/150?img=20",
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 7),
      isRead: false,
    },
    {
      id: "8",
      name: "Ngọc Anh",
      lastMessage: "Gửi ảnh chụp giúp mình nha 📸",
      photoURL: "https://i.pravatar.cc/150?img=25",
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
      isRead: true,
    },
    {
      id: "9",
      name: "Anna Nguyen",
      lastMessage: "Tối nay mình đi xem phim nhé 🎬",
      photoURL: "https://i.pravatar.cc/150?img=5",
      updatedAt: new Date(),
      isRead: false,
    },
    {
      id: "10",
      name: "Tracy Dang",
      lastMessage: "Mình gửi lại file update rồi nha 📂",
      photoURL: "https://i.pravatar.cc/150?img=30",
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 11),
      isRead: true,
    },
    {
      id: "11",
      name: "Tom Nguyen",
      lastMessage: "Cảm ơn cậu nhiều nhé 🙏",
      photoURL: "https://i.pravatar.cc/150?img=35",
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
      isRead: false,
    },
    {
      id: "12",
      name: "Jenny Vo",
      lastMessage: "Mình đang trên đường tới 🏃‍♀️",
      photoURL: "https://i.pravatar.cc/150?img=40",
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 13),
      isRead: true,
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

  const renderChatItem = ({ item }) => {
    const textStyle = item.isRead ? styles.textNormal : styles.textBold;

    return (
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
          <Text style={[styles.chatName, textStyle]}>{item.name}</Text>
          <Text style={[styles.lastMessage, textStyle]} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>

        <View style={styles.rightSection}>
          <Text style={[styles.time, textStyle]}>
            {item.updatedAt.toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
          <Icon name="chevron-right" size={22} color={COLORS.GRAY} />
        </View>
      </TouchableOpacity>
    );
  };

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
    backgroundColor: COLORS.BG,
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
    backgroundColor: COLORS.BG,
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
  textBold: {
    fontWeight: "700",
    color: COLORS.BLACK,
  },
  textNormal: {
    fontWeight: "400",
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
