import AsyncStorage from '@react-native-async-storage/async-storage'

const SEARCH_HISTORY_KEY = 'search_history'
const MAX_HISTORY_ITEMS = 10

/**
 * Lưu địa điểm vào lịch sử tìm kiếm
 * @param {Object} locationData - Dữ liệu địa điểm
 * @param {string} locationData.description - Tên địa điểm
 * @param {number} locationData.latitude - Vĩ độ
 * @param {number} locationData.longitude - Kinh độ
 * @param {string} locationData.placeId - ID địa điểm
 */
export const saveSearchHistory = async (locationData) => {
  try {
    const existingHistory = await getSearchHistory()
    
    // Loại bỏ địa điểm trùng lặp nếu có
    const filteredHistory = existingHistory.filter(
      item => item.placeId !== locationData.placeId
    )
    
    // Thêm địa điểm mới vào đầu danh sách
    const newHistory = [locationData, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS)
    
    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory))
    console.log('✅ Search history saved:', locationData.description)
  } catch (error) {
    console.error('❌ Error saving search history:', error)
  }
}

/**
 * Lấy lịch sử tìm kiếm
 * @returns {Array} Danh sách lịch sử tìm kiếm
 */
export const getSearchHistory = async () => {
  try {
    const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY)
    return history ? JSON.parse(history) : []
  } catch (error) {
    console.error('❌ Error getting search history:', error)
    return []
  }
}

/**
 * Xóa một địa điểm khỏi lịch sử
 * @param {string} placeId - ID địa điểm cần xóa
 */
export const removeFromSearchHistory = async (placeId) => {
  try {
    const existingHistory = await getSearchHistory()
    const filteredHistory = existingHistory.filter(item => item.placeId !== placeId)
    
    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filteredHistory))
    console.log('✅ Removed from search history:', placeId)
  } catch (error) {
    console.error('❌ Error removing from search history:', error)
  }
}

/**
 * Xóa toàn bộ lịch sử tìm kiếm
 */
export const clearSearchHistory = async () => {
  try {
    await AsyncStorage.removeItem(SEARCH_HISTORY_KEY)
    console.log('✅ Search history cleared')
  } catch (error) {
    console.error('❌ Error clearing search history:', error)
  }
}

/**
 * Tìm kiếm trong lịch sử
 * @param {string} query - Từ khóa tìm kiếm
 * @returns {Array} Danh sách kết quả tìm kiếm
 */
export const searchInHistory = async (query) => {
  try {
    const history = await getSearchHistory()
    const searchQuery = query.toLowerCase().trim()
    
    return history.filter(item => 
      item.description.toLowerCase().includes(searchQuery)
    )
  } catch (error) {
    console.error('❌ Error searching in history:', error)
    return []
  }
}
