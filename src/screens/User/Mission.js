import React, { useState } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Dimensions,
  FlatList
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

const { width } = Dimensions.get('window')

const Mission = ({ navigation }) => {
  const [userPoints, setUserPoints] = useState(1250)
  const [completedMissions, setCompletedMissions] = useState([1, 3]) // IDs of completed missions

  // Mock data for daily missions
  const dailyMissions = [
    {
      id: 1,
      title: 'Tham gia chuyến đi',
      description: 'Hoàn thành 1 chuyến đi trong ngày',
      points: 10,
      icon: Car,
      color: COLORS.BLUE,
      progress: 1,
      maxProgress: 1,
      completed: true,
      type: 'daily'
    },
    {
      id: 2,
      title: 'Đánh giá chuyến đi',
      description: 'Đánh giá 1 chuyến đi đã tham gia',
      points: 10,
      icon: Star,
      color: COLORS.YELLOW,
      progress: 0,
      maxProgress: 1,
      completed: false,
      type: 'daily'
    },
    {
      id: 3,
      title: 'Chia sẻ với bạn bè',
      description: 'Chia sẻ ứng dụng với 2 người bạn',
      points: 20,
      icon: Users,
      color: COLORS.GREEN,
      progress: 2,
      maxProgress: 2,
      completed: true,
      type: 'daily'
    },
    {
      id: 4,
      title: 'Sử dụng dịch vụ 3 lần',
      description: 'Hoàn thành 3 chuyến đi trong tuần',
      points: 50,
      icon: Target,
      color: COLORS.PURPLE,
      progress: 2,
      maxProgress: 3,
      completed: false,
      type: 'weekly'
    },
    {
      id: 5,
      title: 'Đánh giá 5 sao',
      description: 'Nhận đánh giá 5 sao từ hành khách',
      points: 30,
      icon: Award,
      color: COLORS.ORANGE,
      progress: 0,
      maxProgress: 1,
      completed: false,
      type: 'daily'
    },
    {
      id: 6,
      title: 'Tích điểm tuần',
      description: 'Tích được 100 điểm trong tuần',
      points: 25,
      icon: TrendingUp,
      color: COLORS.RED,
      progress: 75,
      maxProgress: 100,
      completed: false,
      type: 'weekly'
    }
  ]

  const handleCompleteMission = (missionId) => {
    if (!completedMissions.includes(missionId)) {
      const mission = dailyMissions.find(m => m.id === missionId)
      if (mission) {
        setCompletedMissions([...completedMissions, missionId])
        setUserPoints(userPoints + mission.points)
      }
    }
  }

  const renderMissionCard = ({ item }) => {
    const IconComponent = item.icon
    const isCompleted = completedMissions.includes(item.id)
    const progressPercentage = (item.progress / item.maxProgress) * 100

    return (
      <View style={styles.missionCard}>
        <View style={styles.missionHeader}>
          <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
            <IconComponent size={20} color={item.color} />
          </View>
          <View style={styles.missionInfo}>
            <Text style={styles.missionTitle}>{item.title}</Text>
            <Text style={styles.missionDescription}>{item.description}</Text>
          </View>
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsText}>+{item.points}</Text>
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
                  backgroundColor: isCompleted ? COLORS.GREEN : item.color
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {item.progress}/{item.maxProgress}
          </Text>
        </View>

        <View style={styles.missionFooter}>
          <View style={styles.typeBadge}>
            <Calendar size={12} color={COLORS.GRAY} />
            <Text style={styles.typeText}>
              {item.type === 'daily' ? 'Hằng ngày' : 'Hằng tuần'}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.completeButton,
              { 
                backgroundColor: isCompleted ? COLORS.GREEN : item.color,
                opacity: isCompleted ? 0.7 : 1
              }
            ]}
            onPress={() => handleCompleteMission(item.id)}
            disabled={isCompleted}
          >
            {isCompleted ? (
              <>
                <CheckCircle size={16} color={COLORS.WHITE} />
                <Text style={styles.completeButtonText}>Hoàn thành</Text>
              </>
            ) : (
              <>
                <Gift size={16} color={COLORS.WHITE} />
                <Text style={styles.completeButtonText}>Nhận điểm</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const completedCount = completedMissions.length
  const totalMissions = dailyMissions.length
  const completionRate = (completedCount / totalMissions) * 100

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

      <ScrollView showsVerticalScrollIndicator={false}>
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
            <Text style={styles.sectionTitle}>Nhiệm vụ hằng ngày</Text>
            <Text style={styles.sectionSubtitle}>
              Hoàn thành để tích điểm và nhận phần thưởng
            </Text>
          </View>
          
          <FlatList
            data={dailyMissions}
            renderItem={renderMissionCard}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            contentContainerStyle={styles.missionsList}
          />
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
})

export default Mission
