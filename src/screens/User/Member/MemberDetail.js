import React from 'react'
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CheckCircle2, ChevronLeft, Crown } from 'lucide-react-native'
import COLORS from '../../../constant/colors'

const MemberDetail = ({ route, navigation }) => {
  const { title, image, benefits = [], price, badge, badgeColor, description } = route.params || {}

  const handleSubscribe = () => {
    // TODO: integrate payment/subscribe flow
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color={COLORS.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết gói</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.hero}>
          {!!image && <Image source={{ uri: image }} style={styles.heroImage} />}
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            {!!badge && (
              <View style={[styles.badge, { backgroundColor: badgeColor || COLORS.PRIMARY }]}>
                <Crown size={14} color={COLORS.WHITE} />
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            )}
            <Text style={styles.title}>{title || 'Gói Hội Viên'}</Text>
            {!!description && <Text style={styles.subtitle}>{description}</Text>}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quyền lợi</Text>
          <View style={styles.card}>
            {(benefits.length ? benefits : [
              'Ưu đãi giá mỗi chuyến đi',
              'Tích điểm nhanh gấp đôi',
              'Hỗ trợ ưu tiên 24/7'
            ]).map((b, idx) => (
              <View key={idx} style={styles.benefitRow}>
                <CheckCircle2 size={18} color={COLORS.GREEN} />
                <Text style={styles.benefitText}>{b}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Giá tiền</Text>
          <View style={styles.card}>
            <Text style={styles.priceText}>{price || '49.000đ / tháng'}</Text>
            <Text style={styles.noteText}>Hủy bất cứ lúc nào. Không ràng buộc.</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.ctaButton} onPress={handleSubscribe} activeOpacity={0.9}>
          <Text style={styles.ctaText}>Đăng ký ngay</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  header: {
    height: 56,
    backgroundColor: COLORS.PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
  hero: {
    height: 220,
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)'
  },
  heroContent: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  badgeText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    color: COLORS.WHITE,
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.WHITE,
    opacity: 0.95,
    marginTop: 6,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.BLACK,
    marginBottom: 10,
  },
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  benefitText: {
    marginLeft: 8,
    color: COLORS.BLACK,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.PRIMARY,
    marginBottom: 4,
  },
  noteText: {
    color: COLORS.GRAY,
    fontSize: 12,
  },
  footer: {
    padding: 16,
    backgroundColor: COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  ctaButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
})

export default MemberDetail
