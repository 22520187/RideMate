import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareFlatList } from "react-native-keyboard-aware-scroll-view";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../../constant/colors";

export default function ChatScreen({ route, navigation }) {
  const [messages, setMessages] = useState([
    {
      id: "1",
      text: "Chào bạn! Dạo này khỏe không?",
      senderId: "anna",
      createdAt: "23:01",
    },
    {
      id: "2",
      text: "Mình ổn, cảm ơn nha! Còn bạn thì sao?",
      senderId: "me",
      createdAt: "23:03",
    },
    {
      id: "3",
      text: "Mình cũng ổn lắm. Tối nay có rảnh không?",
      senderId: "anna",
      createdAt: "23:06",
    },
    {
      id: "4",
      text: "Có chứ! Cầu lông không?",
      senderId: "me",
      createdAt: "23:08",
    },
    {
      id: "5",
      text: "Ok",
      senderId: "anna",
      createdAt: "23:11",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef(null);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMsg = {
      id: Date.now().toString(),
      text: inputText,
      senderId: "me",
      createdAt: new Date().toLocaleTimeString().slice(0, 5),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
  };

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === "me";
    return (
      <View
        style={[
          styles.messageContainer,
          { justifyContent: isMe ? "flex-end" : "flex-start" },
        ]}
      >
        {!isMe && (
          <Image
            source={{ uri: "https://i.pravatar.cc/100?img=5" }}
            style={styles.avatar}
          />
        )}
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isMe ? COLORS.PRIMARY : COLORS.GRAY_LIGHT,
              borderBottomRightRadius: isMe ? 0 : 15,
              borderBottomLeftRadius: isMe ? 15 : 0,
            },
          ]}
        >
          <Text
            style={{
              color: isMe ? COLORS.WHITE : COLORS.BLACK,
              fontSize: 15,
            }}
          >
            {item.text}
          </Text>
          <Text
            style={{
              color: isMe ? COLORS.WHITE : COLORS.BLACK,
              fontSize: 11,
              alignSelf: "flex-end",
              marginTop: 4,
            }}
          >
            {item.createdAt}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
        <Image
          source={{ uri: "https://i.pravatar.cc/100?img=5" }}
          style={styles.avatarLarge}
        />
        <Text style={styles.headerName}>Anna Nguyen</Text>
      </View>

      {/* Nội dung chat */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAwareFlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 10 }}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          keyboardShouldPersistTaps="handled"
        />
      </TouchableWithoutFeedback>

      {/* Ô nhập tin nhắn */}
      <View style={styles.inputContainer}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Nhập tin nhắn..."
          style={styles.input}
          multiline
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
          <Text style={styles.sendText}>Gửi</Text>
          <Icon
            name="send"
            size={18}
            color="#fff"
            style={{ marginLeft: 4, marginTop: 1 }}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  backBtn: {
    marginRight: 10,
  },
  avatarLarge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  headerName: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: "bold",
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    marginVertical: 5,
  },
  messageBubble: {
    maxWidth: "70%",
    padding: 10,
    borderRadius: 15,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: COLORS.WHITE,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 6,
    marginRight: 8,
    fontSize: 15,
    maxHeight: 120,
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  sendText: {
    color: COLORS.WHITE,
    fontWeight: "bold",
  },
});
