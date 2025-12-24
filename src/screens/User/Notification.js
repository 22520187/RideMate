import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, SectionList, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import COLORS from '../../constant/colors'
import { MaterialIcons, Ionicons } from '@expo/vector-icons'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { getMyNotifications, markAsRead, markAllAsRead, deleteNotification } from '../../services/notificationService'
import { supabase } from '../../config/supabaseClient'
import AsyncStorageService from '../../services/AsyncStorageService'
import SCREENS from '../../screens'

const Notification = () => {
  const navigation = useNavigation()
  const [activeTab, setActiveTab] = useState('activity') // Default to activity
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)

  const formatTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return '';
    }
  }

  const getSectionTitle = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const isToday = date.getDate() === now.getDate() && 
                    date.getMonth() === now.getMonth() && 
                    date.getFullYear() === now.getFullYear();
                    
    const isYesterday = date.getDate() === yesterday.getDate() && 
                        date.getMonth() === yesterday.getMonth() && 
                        date.getFullYear() === yesterday.getFullYear();

    if (isToday) return 'TODAY';
    if (isYesterday) return 'YESTERDAY';
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
  }

  // MOCK DATA for demonstration
  const MOCK_NOTIFICATIONS = [
    {
      id: 'mock-1',
      type: 'MATCH_ACCEPTED',
      title: 'Ride Accepted!',
      body: 'Driver Nguyen Van A has accepted your request. Vehicle: Honda Vision (29A-123.45).',
      createdAt: new Date().toISOString(),
      isRead: false,
      referenceId: '123' // Mock ID
    },
    {
      id: 'mock-2',
      type: 'DRIVER_ARRIVED',
      title: 'Driver Arrived',
      body: 'Your driver is waiting at the pickup point.',
      createdAt: new Date(Date.now() - 10 * 60000).toISOString(), // 10 mins ago
      isRead: true,
      referenceId: '123'
    },
    {
      id: 'mock-3',
      type: 'TRIP_STARTED',
      title: 'Trip Started',
      body: 'Your trip to Landmark 81 has started.',
      createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
      isRead: true,
      referenceId: '123'
    },
    {
      id: 'mock-4',
      type: 'RIDE_COMPLETED',
      title: 'Ride Completed',
      body: 'You have arrived. Total fare: 50,000 coins.',
      createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
      isRead: true,
      referenceId: '123'
    },
    {
      id: 'mock-5',
      type: 'PROMOTION',
      title: 'Discount 20%',
      body: 'Use code WELCOME20 for your next ride!',
      createdAt: new Date(Date.now() - 24 * 60 * 60000).toISOString(), // 1 day ago
      isRead: false,
    },
    {
      id: 'mock-6',
      type: 'SYSTEM',
      title: 'System Maintenance',
      body: 'Our server will be down for maintenance from 2 AM to 4 AM.',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60000).toISOString(), // 2 days ago
      isRead: true,
    },
    {
      id: 'mock-7',
      type: 'MATCH_CANCELLED',
      title: 'Ride Cancelled',
      body: 'The driver cancelled the ride due to engine trouble.',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60000).toISOString(), // 3 days ago
      isRead: true,
      referenceId: '123'
    },
     {
      id: 'mock-9',
      type: 'NEW_MESSAGE',
      title: 'New Message',
      body: 'Driver: I am waiting at the lobby.',
      createdAt: new Date().toISOString(),
      isRead: false,
      referenceId: '123'
    },
  ];

  const fetchNotifications = async () => {
    try {
      const data = await getMyNotifications()
      // MERGE MOCK DATA FOR DEMO
      const allNotifications = [...MOCK_NOTIFICATIONS, ...data.data]; 
      
      const mappedData = allNotifications.map(n => ({
        id: n.id,
        type: n.type,
        category: getCategory(n.type),
        title: n.title,
        message: n.body,
        createdAt: n.createdAt,
        time: formatTime(n.createdAt),
        icon: getIconForType(n.type),
        iconColor: getColorForType(n.type),
        bgColor: getBgColorForType(n.type),
        isRead: n.isRead,
        referenceId: n.referenceId,
      }))
      // Sort by date desc
      mappedData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setNotifications(mappedData) 
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      // Fallback to mock if API fails
      const mappedMock = MOCK_NOTIFICATIONS.map(n => ({
        id: n.id,
        type: n.type,
        category: getCategory(n.type),
        title: n.title,
        message: n.body,
        createdAt: n.createdAt,
        time: formatTime(n.createdAt),
        icon: getIconForType(n.type),
        iconColor: getColorForType(n.type),
        bgColor: getBgColorForType(n.type),
        isRead: n.isRead,
        referenceId: n.referenceId,
      }));
      setNotifications(mappedMock);
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const getUser = async () => {
      const u = await AsyncStorageService.getUser()
      if (u) setUserId(u.id)
    }
    getUser()
  }, [])

  useFocusEffect(
    useCallback(() => {
      fetchNotifications()
    }, [])
  )

  useEffect(() => {
    if (!userId || !supabase) return

    const channel = supabase
      .channel(`public:notifications:user_id=eq.${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('New notification received:', payload)
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const getCategory = (type) => {
    if (type === 'PROMOTION') return 'promotion'
    if (type === 'SYSTEM') return 'system'
    // NEW_MESSAGE goes to activity
    return 'activity'
  }

  const getIconForType = (type) => {
    switch (type) {
      case 'MATCH_ACCEPTED': return 'check'
      case 'DRIVER_ARRIVED': return 'directions-car'
      case 'TRIP_STARTED': return 'play-arrow'
      case 'TRIP_ENDED': return 'flag'
      case 'MATCH_CANCELLED': return 'close'
      case 'PROMOTION': return 'local-offer'
      case 'SYSTEM': return 'info'
      case 'REFUND_PROCESSED': return 'attach-money'
      case 'NEW_MESSAGE': return 'chat'
      default: return 'notifications'
    }
  }

  const getColorForType = (type) => {
    switch (type) {
      case 'MATCH_ACCEPTED': return '#4CAF50'
      case 'MATCH_CANCELLED': return '#F44336'
      case 'PROMOTION': return '#FF9800'
      case 'REFUND_PROCESSED': return '#2196F3'
      case 'SYSTEM': return '#607D8B'
      case 'NEW_MESSAGE': return '#9C27B0' // Purple for chat
      default: return COLORS.PRIMARY
    }
  }

  const getBgColorForType = (type) => {
    switch (type) {
      case 'PROMOTION': return '#FFF3E0'
      case 'MATCH_CANCELLED': return '#FFEBEE'
      case 'SYSTEM': return '#ECEFF1'
      case 'NEW_MESSAGE': return '#F3E5F5' // Light Purple
      default: return '#E3F2FD'
    }
  }

  const handleMarkAsRead = async (id) => {
    try {
        // Optimistic update
        setNotifications(prev => 
            prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        )

        // Only call API if it's a real ID
        if (typeof id === 'string' && id.startsWith('mock')) return;
        await markAsRead(id)
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const handleNotificationPress = async (item) => {
    // 1. Mark as read
    handleMarkAsRead(item.id);

    console.log('Handling notification press:', item.type, item.referenceId);

    // 2. Navigate based on type
    switch (item.type) {
        case 'MATCH_ACCEPTED':
        case 'DRIVER_ARRIVED':
        case 'TRIP_STARTED':
        case 'TRIP_ENDED':
            if (item.referenceId) {
                // TODO: Depending on status, might want to go to different screens
                // For now, MatchedRideScreen handles active rides
                navigation.navigate(SCREENS.MATCHED_RIDE, { rideId: item.referenceId });
            }
            break;
        
        case 'NEW_MESSAGE':
            if (item.referenceId) {
                // Navigate to chat - phone not available from notification
                navigation.navigate('ChatScreen', { 
                    channelId: `match-${item.referenceId}`,
                    otherUserId: null,
                    otherUserName: 'User',
                    otherUserAvatar: null,
                    otherUserPhone: null,
                });
            }
            break;

        case 'RIDE_COMPLETED':
             navigation.navigate(SCREENS.RIDE_HISTORY);
             break;
        
        default:
            console.log('No specific navigation for this notification type');
    }
  }

  // Group notifications for SectionList
  const getGroupedNotifications = () => {
    const filtered = notifications.filter(n => n.category === activeTab)
    const grouped = filtered.reduce((acc, curr) => {
      const title = getSectionTitle(curr.createdAt);

      const existingSection = acc.find(s => s.title === title)
      if (existingSection) {
        existingSection.data.push(curr)
      } else {
        acc.push({ title, data: [curr] })
      }
      return acc
    }, [])

    return grouped
  }

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  )

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.itemContainer, !item.isRead && styles.unreadItem]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconCircle, { backgroundColor: item.bgColor }]}>
        <MaterialIcons name={item.icon} size={24} color={item.iconColor} />
      </View>
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
            <Text style={[styles.itemTitle, !item.isRead && styles.unreadTitle]} numberOfLines={1}>
                {item.title}
            </Text>
            {!item.isRead && <View style={styles.unreadDot} />}
        </View>
        <Text style={[styles.itemMessage, !item.isRead && styles.unreadMessage]} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.itemTime}>{item.time}</Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.BLACK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification</Text>
        <View style={{ width: 24 }} /> 
      </View>

      {/* Tabs */}
      <View style={styles.tabWrapper}>
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'activity' && styles.activeTab]}
            onPress={() => setActiveTab('activity')}
          >
            <Text style={[styles.tabText, activeTab === 'activity' && styles.activeTabText]}>Activity</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'promotion' && styles.activeTab]}
            onPress={() => setActiveTab('promotion')}
          >
            <Text style={[styles.tabText, activeTab === 'promotion' && styles.activeTabText]}>Promotion</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'system' && styles.activeTab]}
            onPress={() => setActiveTab('system')}
          >
            <Text style={[styles.tabText, activeTab === 'system' && styles.activeTabText]}>System</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      ) : (
        <SectionList
          sections={getGroupedNotifications()}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderNotificationItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false} // Disabled to prevent overlap issues
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="notifications-none" size={60} color={COLORS.GRAY_LIGHT} />
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Clean white background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.BLACK,
  },
  tabWrapper: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: COLORS.PRIMARY, // Primary Color Background
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.GRAY,
  },
  activeTabText: {
    fontWeight: '700',
    color: COLORS.WHITE, // White Text
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sectionHeader: {
    paddingVertical: 12,
    marginTop: 8,
    backgroundColor: '#FFFFFF', // Sticky header
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.GRAY,
    letterSpacing: 0.5,
  },
  itemContainer: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12, // Added padding inside item
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'flex-start',
    borderRadius: 8, // Rounded corners for potential active state
    marginHorizontal: -12, // Offset the padding to align with list
    marginBottom: 4,
  },
  unreadItem: {
    backgroundColor: '#E3F2FD', // Light Blue Highlight for unread items
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.BLACK,
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontWeight: '800', // Bolder title for unread
    color: '#000',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.PRIMARY,
  },
  itemMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  unreadMessage: {
    color: '#333', // Darker text for unread message
    fontWeight: '500',
  },
  itemTime: {
    fontSize: 12,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 12,
    color: COLORS.GRAY,
    fontSize: 14,
  },
})

export default Notification
