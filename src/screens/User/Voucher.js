import React from 'react'
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CalendarClock, ChevronLeft, TicketPercent } from 'lucide-react-native'
import COLORS from '../../constant/colors'

const Voucher = ({ route, navigation }) => {
  const { title, subtitle, image, badge, validFrom, validTo, terms, code } = route.params || {}

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color={COLORS.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết khuyến mãi</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.hero}>
          {!!image && <Image source={{ uri: image }} style={styles.heroImage} />}
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.badge}>
              <TicketPercent size={14} color={COLORS.WHITE} />
              <Text style={styles.badgeText}>{badge || 'Ưu đãi'}</Text>
            </View>
            <Text style={styles.title}>{title || 'Khuyến mãi RideMate'}</Text>
            {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thời gian hiệu lực</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <CalendarClock size={18} color={COLORS.PRIMARY} />
              <Text style={styles.rowText}>
                {validFrom ? `Từ: ${validFrom}` : 'Từ: Hôm nay'}
              </Text>
            </View>
            <View style={styles.row}>
              <CalendarClock size={18} color={COLORS.PRIMARY} />
              <Text style={styles.rowText}>
                {validTo ? `Đến: ${validTo}` : 'Đến: 31/12/2025'}
              </Text>
            </View>
          </View>
        </View>

        {!!code && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mã áp dụng</Text>
            <View style={styles.card}>
              <Text style={styles.code}>{code}</Text>
              <Text style={styles.note}>Sao chép và nhập mã khi thanh toán.</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Điều kiện & điều khoản</Text>
          <View style={styles.card}>
            <Text style={styles.bodyText}>
              {terms || 'Áp dụng cho người dùng RideMate. Không cộng dồn với ưu đãi khác. Mỗi người dùng sử dụng 1 lần.'}
            </Text>
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
    height: 200,
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
    backgroundColor: COLORS.ORANGE,
    marginBottom: 8,
  },
  badgeText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    color: COLORS.WHITE,
    fontSize: 20,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rowText: {
    marginLeft: 8,
    color: COLORS.BLACK,
  },
  code: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.PRIMARY,
  },
  note: {
    color: COLORS.GRAY,
    marginTop: 6,
  },
  bodyText: {
    color: COLORS.BLACK,
    lineHeight: 20,
  },
})

export default Voucher

