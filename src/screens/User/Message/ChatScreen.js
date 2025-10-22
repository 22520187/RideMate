import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
} from "react-native";
import COLORS from "../../../constant/colors";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatScreen({ route }) {
  const { chatId } = route.params || {};
  const currentUser = route.params?.currentUser || { id: "me", name: "Tôi" };

  // Giả lập dữ liệu chat 2 chiều
  const [messages, setMessages] = useState([
    {
      id: "1",
      text: "Chào bạn! Dạo này khỏe không?",
      senderId: "anna",
      createdAt: new Date(Date.now() - 1000 * 60 * 10),
    },
    {
      id: "2",
      text: "Mình ổn, cảm ơn nha! Còn bạn thì sao?",
      senderId: "me",
      createdAt: new Date(Date.now() - 1000 * 60 * 8),
    },
    {
      id: "3",
      text: "Mình cũng ổn lắm. Tối nay có rảnh không?",
      senderId: "anna",
      createdAt: new Date(Date.now() - 1000 * 60 * 5),
    },
    {
      id: "4",
      text: "Có chứ! Cầu lông không ?",
      senderId: "me",
      createdAt: new Date(Date.now() - 1000 * 60 * 3),
    },
  ]);

  const [inputText, setInputText] = useState("");
  const flatListRef = useRef(null);

  // Gửi tin nhắn
  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      text: inputText,
      senderId: currentUser?.id || "me",
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, []);

  const renderMessage = ({ item }) => {
    const isMyMessage = item.senderId === currentUser?.id;

    return (
      <View
        style={[
          styles.messageRow,
          { justifyContent: isMyMessage ? "flex-end" : "flex-start" },
        ]}
      >
        {!isMyMessage && (
          <Image
            source={{ uri: "https://i.pravatar.cc/100?img=5" }}
            style={styles.avatarSmall}
          />
        )}
        <View
          style={[
            styles.messageContainer,
            isMyMessage ? styles.myMessage : styles.theirMessage,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMyMessage ? { color: COLORS.WHITE } : { color: COLORS.BLACK },
            ]}
          >
            {item.text}
          </Text>
          <Text style={styles.timeText}>
            {item.createdAt.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={{ uri: "https://i.pravatar.cc/100?img=5" }}
            style={styles.avatar}
          />
          <Text style={styles.headerName}>Anna Nguyen</Text>
        </View>

        {/* Danh sách tin nhắn */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 10 }}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

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
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: COLORS.PRIMARY,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#ddd",
    marginRight: 10,
  },
  headerName: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: "600",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginHorizontal: 10,
    marginVertical: 4,
  },
  messageContainer: {
    padding: 10,
    borderRadius: 14,
    maxWidth: "75%",
  },
  myMessage: {
    backgroundColor: COLORS.PRIMARY,
    borderBottomRightRadius: 0,
  },
  theirMessage: {
    backgroundColor: COLORS.GRAY_LIGHT,
    borderBottomLeftRadius: 0,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 6,
  },
  messageText: {
    fontSize: 16,
  },
  timeText: {
    color: COLORS.GRAY,
    fontSize: 10,
    marginTop: 3,
    textAlign: "right",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 10,
    borderTopWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
    backgroundColor: COLORS.WHITE,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  sendText: {
    color: COLORS.WHITE,
    fontWeight: "bold",
  },
});
