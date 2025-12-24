import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import COLORS from '../constant/colors';

const ChatModal = ({
  visible,
  onClose,
  messages,
  inputText,
  onInputChange,
  onSend,
  onAudioCall,
  onVideoCall,
  loading,
  currentUserId,
  otherPersonName,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header - Messenger Style */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.BLACK} />
          </TouchableOpacity>
          
          {/* Center: Avatar + Name */}
          <View style={styles.headerCenter}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <MaterialIcons name="person" size={20} color={COLORS.WHITE} />
              </View>
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {otherPersonName || 'Đối tác'}
              </Text>
              <Text style={styles.headerSubtitle}>Active now</Text>
            </View>
          </View>

          {/* Right: Call Icons */}
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={onAudioCall} 
              style={styles.headerIconButton}
              disabled={loading}
            >
              <MaterialIcons name="phone" size={22} color={COLORS.PRIMARY} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={onVideoCall} 
              style={styles.headerIconButton}
              disabled={loading}
            >
              <MaterialIcons name="videocam" size={22} color={COLORS.PRIMARY} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.PRIMARY} />
              <Text style={styles.loadingText}>Đang tải chat...</Text>
            </View>
          ) : (messages?.length > 0) ? (
            <ScrollView
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((message) => {
                const isMyMessage = message.user?.id === currentUserId;
                return (
                  <View
                    key={message.id}
                    style={[
                      styles.messageRow,
                      isMyMessage && styles.messageRowMyMessage,
                    ]}
                  >
                    <View
                      style={[
                        styles.messageBubble,
                        isMyMessage && styles.messageBubbleOwn,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          isMyMessage && styles.messageTextOwn,
                        ]}
                      >
                        {message.text}
                      </Text>
                      <Text
                        style={[
                          styles.messageTime,
                          isMyMessage && styles.messageTimeOwn,
                        ]}
                      >
                        {message.created_at
                          ? new Date(message.created_at).toLocaleTimeString(
                              [],
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )
                          : ''}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.emptyMessagesContainer}>
              <MaterialIcons name="chat-bubble" size={60} color={COLORS.GRAY} />
              <Text style={styles.emptyMessagesText}>
                Bắt đầu cuộc trò chuyện
              </Text>
            </View>
          )}

          {/* Input Bar */}
          <View
            style={[
              styles.inputBar,
              { paddingBottom: Math.max(insets.bottom, 12) },
            ]}
          >
            <TextInput
              value={inputText}
              onChangeText={onInputChange}
              placeholder="Tin nhắn..."
              style={styles.inputField}
              multiline
              placeholderTextColor={COLORS.PLACEHOLDER_COLOR}
              editable={!loading}
            />
            <TouchableOpacity
              onPress={onSend}
              style={styles.sendButton}
              disabled={loading}
            >
              <MaterialIcons name="send" size={18} color={COLORS.WHITE} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
    backgroundColor: COLORS.WHITE,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.BLACK,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.GRAY,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyMessagesText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.GRAY,
  },
  messageRow: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  messageRowMyMessage: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    backgroundColor: '#e8f0fe',
    padding: 12,
    borderRadius: 14,
    maxWidth: '80%',
    borderBottomLeftRadius: 4,
  },
  messageBubbleOwn: {
    backgroundColor: COLORS.PRIMARY,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: COLORS.BLACK,
    lineHeight: 20,
  },
  messageTextOwn: {
    color: COLORS.WHITE,
  },
  messageTime: {
    fontSize: 11,
    color: COLORS.GRAY,
    marginTop: 4,
  },
  messageTimeOwn: {
    color: 'rgba(255,255,255,0.7)',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    minHeight: 60,
    borderTopColor: COLORS.GRAY_LIGHT,
    backgroundColor: COLORS.WHITE,
    gap: 8,
  },
  inputField: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    minHeight: 40,
    maxHeight: 100,
    lineHeight: 20,
    color: COLORS.BLACK,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default ChatModal;
