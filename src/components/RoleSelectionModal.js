import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import COLORS from '../constant/colors'

const { width } = Dimensions.get('window')

const RoleSelectionModal = ({
  visible,
  onClose,
  onRoleSelect,
  selectedLocation,
}) => {
  const handleRoleSelect = (role) => {
    onRoleSelect(role)
    onClose()
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Chọn vai trò của bạn</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={COLORS.GRAY} />
            </TouchableOpacity>
          </View>

          {/* Location Info */}
          {selectedLocation && (
            <View style={styles.locationInfo}>
              <MaterialIcons name="place" size={20} color={COLORS.PRIMARY} />
              <Text style={styles.locationText} numberOfLines={2}>
                {selectedLocation.description}
              </Text>
            </View>
          )}

          {/* Role Options */}
          <View style={styles.roleOptions}>
            {/* Driver Option */}
            <TouchableOpacity
              style={[styles.roleCard, styles.driverCard]}
              onPress={() => handleRoleSelect('driver')}
              activeOpacity={0.8}
            >
              <View style={styles.roleIconContainer}>
                <MaterialIcons name="directions-car" size={32} color={COLORS.WHITE} />
              </View>
              <View style={styles.roleContent}>
                <Text style={styles.roleTitle}>Tôi có xe</Text>
                <Text style={styles.roleSubtitle}>
                  Tạo chuyến đi và chia sẻ với người khác
                </Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.badgeText}>Người lái xe</Text>
                </View>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={20} color={COLORS.WHITE} />
            </TouchableOpacity>

            {/* Passenger Option */}
            <TouchableOpacity
              style={[styles.roleCard, styles.passengerCard]}
              onPress={() => handleRoleSelect('passenger')}
              activeOpacity={0.8}
            >
              <View style={styles.roleIconContainer}>
                <MaterialIcons name="person" size={32} color={COLORS.WHITE} />
              </View>
              <View style={styles.roleContent}>
                <Text style={styles.roleTitle}>Tôi đi nhờ</Text>
                <Text style={styles.roleSubtitle}>
                  Tìm người có xe đi cùng đến địa điểm này
                </Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.badgeText}>Hành khách</Text>
                </View>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={20} color={COLORS.WHITE} />
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Bạn có thể thay đổi vai trò bất cứ lúc nào
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    width: width * 0.9,
    maxWidth: 400,
    elevation: 10,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.BLACK,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.BG,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.BLACK,
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  roleOptions: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  driverCard: {
    backgroundColor: COLORS.GREEN,
  },
  passengerCard: {
    backgroundColor: COLORS.BLUE,
  },
  roleIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.WHITE,
    marginBottom: 4,
  },
  roleSubtitle: {
    fontSize: 13,
    color: COLORS.WHITE,
    opacity: 0.9,
    marginBottom: 8,
    lineHeight: 18,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.GRAY,
    textAlign: 'center',
    fontStyle: 'italic',
  },
})

export default RoleSelectionModal
