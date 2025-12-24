import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, View, TouchableOpacity, Text, Image, Linking, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Channel, MessageList, MessageInput, OverlayProvider } from 'stream-chat-react-native';
import { chatClient } from '../../../utils/StreamClient';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../../constant/colors';

export default function ChatScreen({ route, navigation }) {
  const { channelId, otherUserId, otherUserName, otherUserAvatar, otherUserPhone, rideInfo } = route.params || {};
  
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeChannel = async () => {
      try {
        const currentUserId = chatClient.userID || chatClient.user?.id;
        
        if (!currentUserId) {
          console.error('User not logged in to Stream Chat');
          return;
        }

        // Create members array
        const members = [currentUserId];
        if (otherUserId) {
          members.push(otherUserId.toString());
        }

        // Get or create channel
        const messageChannel = chatClient.channel('messaging', channelId, {
          name: otherUserName || 'Chat',
          members: members,
        });

        await messageChannel.create();
        await messageChannel.watch();
        
        setChannel(messageChannel);
        setLoading(false);
      } catch (error) {
        console.error('Error initializing channel:', error);
        setLoading(false);
      }
    };

    if (channelId) {
      initializeChannel();
    }
  }, [channelId, otherUserName, otherUserId]);

  const handleAudioCall = () => {
    if (otherUserPhone) {
      const phoneNumber = otherUserPhone.replace(/\s/g, '');
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert('Thông báo', 'Không có số điện thoại để gọi');
    }
  };

  const handleVideoCall = () => {
    if (otherUserPhone) {
      Alert.alert(
        'Video Call',
        'Bạn muốn gọi video cho ' + otherUserName + '?',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Gọi điện thoại',
            onPress: handleAudioCall,
          },
          {
            text: 'Mở Zalo/Messenger',
            onPress: () => {
              Alert.alert(
                'Chọn ứng dụng',
                'Vui lòng mở Zalo hoặc Messenger để gọi video',
                [{ text: 'OK' }]
              );
            },
          },
        ]
      );
    } else {
      Alert.alert('Thông báo', 'Không có thông tin liên hệ');
    }
  };

  if (loading || !channel) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          {otherUserAvatar ? (
            <Image
              source={{ uri: otherUserAvatar }}
              style={styles.headerAvatar}
            />
          ) : (
            <View style={[styles.headerAvatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={20} color="#8E8E93" />
            </View>
          )}
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {otherUserName || 'Tin nhắn'}
            </Text>
            {rideInfo && (
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {rideInfo.from} → {rideInfo.to}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleAudioCall}
            style={styles.actionButton}
          >
            <Ionicons name="call" size={20} color={COLORS.SUCCESS} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleVideoCall}
            style={styles.actionButton}
          >
            <Ionicons name="videocam" size={20} color={COLORS.PRIMARY} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stream Chat Components with keyboard handling */}
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <OverlayProvider>
          <Channel channel={channel}>
            <MessageList />
            <MessageInput />
          </Channel>
        </OverlayProvider>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContainer: {
    flex: 1,
    paddingBottom: 40,
  },
});
