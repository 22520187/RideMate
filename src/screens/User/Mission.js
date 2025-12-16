import React, { useState, useEffect } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { 
  ArrowLeft, 
  Gift, 
  Star, 
  CheckCircle, 
  Clock, 
  Car, 
  MessageCircle, 
  Users,
  Award,
  Target,
  TrendingUp,
  Calendar
} from 'lucide-react-native'
import COLORS from '../../constant/colors'
import { getMyMissions, claimMissionReward, getMissionStats } from '../../services/missionService'
import { getProfile } from '../../services/userService'

const { width } = Dimensions.get('window')

const Mission = ({ navigation }) => {
  const [userPoints, setUserPoints] = useState(0)
  const [missions, setMissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState(null)

  // Load data from API
  const loadData = async () => {
    try {
      const [missionsResponse, profileResponse] = await Promise.all([
        getMyMissions(),
        getProfile()
      ])

      // Handle nested response structure: response.data.data
      if (missionsResponse?.data?.data && Array.isArray(missionsResponse.data.data)) {
        setMissions(missionsResponse.data.data)
      } else if (missionsResponse?.data && Array.isArray(missionsResponse.data)) {
        // Handle case where data is not nested
        setMissions(missionsResponse.data)
      } else {
        console.log('Missions response has no data array')
        setMissions([])
      }

      if (profileResponse?.data?.data) {
        setUserPoints(profileResponse.data.data.coins || 0)
      } else {
        console.log('Profile response has no data field')
        setUserPoints(0)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      console.error('Error details:', error.response?.data)
      Alert.alert('Lỗi', 'Không thể tải dữ liệu. Vui lòng thử lại.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Initial load
  useEffect(() => {
    loadData()
  }, [])

  // Refresh handler
  const handleRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  // Get icon for mission based on target type
  const getMissionIcon = (targetType) => {
    switch (targetType) {
      case 'COMPLETE_RIDES':
        return Car
      case 'RATE_RIDES':
        return Star
      case 'SHARE_APP':
        return Users
      case 'EARN_POINTS':
        return TrendingUp
      case 'GET_FIVE_STAR':
        return Award
      default:
        return Target
    }
  }

  // Get color for mission based on type
  const getMissionColor = (missionType) => {
    switch (missionType) {
      case 'DAILY':
        return COLORS.BLUE
      case 'WEEKLY':
        return COLORS.PURPLE
      case 'MONTHLY':
        return COLORS.ORANGE
      default:
        return COLORS.GREEN
    }
  }

  // Handle claim mission reward
  const handleClaimReward = async (userMissionId) => {
    try {
      setLoading(true)
      const response = await claimMissionReward(userMissionId)
      
      if (response?.data?.statusCode === 200 || response?.data) {
        Alert.alert('Thành công', 'Đã nhận thưởng thành công!')
        // Reload data to update points and missions
        await loadData()
      } else {
        Alert.alert('Lỗi', response?.data?.message || 'Không thể nhận thưởng.')
      }
    } catch (error) {
      console.error('Claim reward error:', error)
      Alert.alert(
        'Lỗi',
        error.response?.data?.message || error.message || 'Không thể nhận thưởng. Vui lòng thử lại.'
      )
    } finally {
      setLoading(false)
    }
  }

  const renderMissionCard = ({ item }) => {
    const mission = item.mission
    const IconComponent = getMissionIcon(mission.targetType)
    const color = getMissionColor(mission.missionType)
    const isCompleted = item.isCompleted
    const canClaim = item.canClaim
    const rewardClaimed = item.rewardClaimed
    const progressPercentage = item.progressPercentage || 0

    // Mission type label
    let typeLabel = 'Hằng ngày'
    if (mission.missionType === 'WEEKLY') typeLabel = 'Hằng tuần'
    if (mission.missionType === 'MONTHLY') typeLabel = 'Hằng tháng'

    return (
      <View style={styles.missionCard}>
        <View style={styles.missionHeader}>
          <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <IconComponent size={20} color={color} />
          </View>
          <View style={styles.missionInfo}>
            <Text style={styles.missionTitle}>{mission.title}</Text>
            <Text style={styles.missionDescription}>{mission.description}</Text>
          </View>
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsText}>+{mission.rewardPoints}</Text>
            <Star size={16} color={COLORS.YELLOW} />
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${progressPercentage}%`,
                  backgroundColor: rewardClaimed ? COLORS.GREEN : color
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {item.progress}/{mission.targetValue}
          </Text>
        </View>

        <View style={styles.missionFooter}>
          <View style={styles.typeBadge}>
            <Calendar size={12} color={COLORS.GRAY} />
            <Text style={styles.typeText}>{typeLabel}</Text>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.completeButton,
              { 
                backgroundColor: rewardClaimed ? COLORS.GREEN : canClaim ? color : COLORS.GRAY,
                opacity: rewardClaimed || !canClaim ? 0.7 : 1
              }
            ]}
            onPress={() => handleClaimReward(item.id)}
            disabled={rewardClaimed || !canClaim}
          >
            {rewardClaimed ? (
              <>
                <CheckCircle size={16} color={COLORS.WHITE} />
                <Text style={styles.completeButtonText}>Đã nhận</Text>
              </>
            ) : canClaim ? (
              <>
                <Gift size={16} color={COLORS.WHITE} />
                <Text style={styles.completeButtonText}>Nhận điểm</Text>
              </>
            ) : (
              <>
                <Clock size={16} color={COLORS.WHITE} />
                <Text style={styles.completeButtonText}>Chưa hoàn thành</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const completedCount = missions.filter(m => m.isCompleted).length
  const claimedCount = missions.filter(m => m.rewardClaimed).length
  const totalMissions = missions.length
  const completionRate = totalMissions > 0 ? (completedCount / totalMissions) * 100 : 0

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color={COLORS.WHITE} />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Nhiệm vụ</Text>
            <Text style={styles.headerSubtitle}>Tích điểm mỗi ngày</Text>
          </View>
          
          <View style={styles.pointsDisplay}>
            <Star size={20} color={COLORS.YELLOW} />
            <Text style={styles.pointsValue}>{userPoints}</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.PRIMARY]}
            tintColor={COLORS.PRIMARY}
          />
        }
      >
        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Target size={24} color={COLORS.BLUE} />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statNumber}>{completedCount}/{totalMissions}</Text>
              <Text style={styles.statLabel}>Nhiệm vụ hoàn thành</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <TrendingUp size={24} color={COLORS.GREEN} />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statNumber}>{Math.round(completionRate)}%</Text>
              <Text style={styles.statLabel}>Tỷ lệ hoàn thành</Text>
            </View>
          </View>
        </View>

        {/* Progress Overview */}
        <View style={styles.progressOverview}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Tiến độ hôm nay</Text>
            <Text style={styles.progressSubtitle}>
              {completedCount}/{totalMissions} nhiệm vụ hoàn thành
            </Text>
          </View>
          <View style={styles.overallProgressBar}>
            <View 
              style={[
                styles.overallProgressFill, 
                { width: `${completionRate}%` }
              ]} 
            />
          </View>
        </View>

        {/* Missions List */}
        <View style={styles.missionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nhiệm vụ</Text>
            <Text style={styles.sectionSubtitle}>
              Hoàn thành để tích điểm và nhận phần thưởng
            </Text>
          </View>
          
          {missions.length > 0 ? (
            <FlatList
              data={missions}
              renderItem={renderMissionCard}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              contentContainerStyle={styles.missionsList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Target size={64} color={COLORS.GRAY_LIGHT} />
              <Text style={styles.emptyText}>Chưa có nhiệm vụ nào</Text>
            </View>
          )}
        </View>

        {/* Rewards Section */}
        <View style={styles.rewardsSection}>
          <View style={styles.rewardsHeader}>
            <Gift size={24} color={COLORS.PRIMARY} />
            <Text style={styles.rewardsTitle}>Phần thưởng đặc biệt</Text>
          </View>
          <Text style={styles.rewardsSubtitle}>
            Hoàn thành tất cả nhiệm vụ để nhận phần thưởng bất ngờ!
          </Text>
          
          <View style={styles.rewardCard}>
            <View style={styles.rewardIconContainer}>
              <Award size={32} color={COLORS.YELLOW} />
            </View>
            <View style={styles.rewardInfo}>
              <Text style={styles.rewardTitle}>Voucher 50k</Text>
              <Text style={styles.rewardDescription}>
                Đổi ngay voucher tại các cửa hàng đối tác
              </Text>
            </View>
            <View style={styles.rewardPoints}>
              <Text style={styles.rewardPointsText}>500</Text>
              <Text style={styles.rewardPointsLabel}>điểm</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  header: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.WHITE + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.WHITE,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.WHITE,
    opacity: 0.8,
  },
  pointsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pointsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.WHITE,
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.BLUE,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.BLUE + '30',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.BLUE + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.BLACK,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.GRAY,
  },
  progressOverview: {
    backgroundColor: COLORS.WHITE,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: COLORS.BLUE,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.BLUE + '30',
  },
  progressHeader: {
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.BLACK,
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  overallProgressBar: {
    height: 8,
    backgroundColor: COLORS.GRAY_LIGHT,
    borderRadius: 4,
    overflow: 'hidden',
  },
  overallProgressFill: {
    height: '100%',
    backgroundColor: COLORS.GREEN,
    borderRadius: 4,
  },
  missionsSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.BLACK,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  missionsList: {
    gap: 12,
  },
  missionCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    shadowColor: COLORS.BLUE,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.BLUE + '30',
  },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  missionInfo: {
    flex: 1,
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.BLACK,
    marginBottom: 2,
  },
  missionDescription: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.YELLOW + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ORANGE_DARK,
    marginRight: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.GRAY_LIGHT,
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.GRAY,
  },
  missionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.GRAY_LIGHT,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginLeft: 4,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.WHITE,
    marginLeft: 6,
  },
  rewardsSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
    
  },
  rewardsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rewardsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.BLACK,
    marginLeft: 8,
  },
  rewardsSubtitle: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginBottom: 16,
  },
  rewardCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.BLUE,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.BLUE + '30',
  },
  rewardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.YELLOW + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.BLACK,
    marginBottom: 2,
  },
  rewardDescription: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  rewardPoints: {
    alignItems: 'center',
  },
  rewardPointsText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  rewardPointsLabel: {
    fontSize: 12,
    color: COLORS.GRAY,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.GRAY,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.GRAY,
    marginTop: 16,
  },
})

export default Mission
