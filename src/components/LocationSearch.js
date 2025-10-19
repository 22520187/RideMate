import React, { useState, useEffect } from 'react'
import { 
  View, 
  TextInput, 
  StyleSheet,
  TouchableOpacity
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import COLORS from '../constant/colors'
import SuggestionsList from './SuggestionsList'
import { useDebounce } from '../hooks/useDebounce'
import { searchPlaces } from '../utils/api'

const LocationSearch = ({ 
  placeholder = "Tìm địa điểm", 
  value, 
  onChangeText, 
  onLocationSelect = () => {},
  iconName = "place",
  showSuggestions = true,
  containerWidth = '100%', // Thêm prop để truyền chiều rộng
  forceHideSuggestions = false // Thêm prop để force ẩn suggestions
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestionsList, setShowSuggestionsList] = useState(false)

  // Debounce giá trị input với delay 2 giây
  const debouncedValue = useDebounce(value, 2000)

  // Effect để gọi API khi debounced value thay đổi
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedValue || debouncedValue.length < 2 || forceHideSuggestions) {
        setSuggestions([])
        setIsLoading(false)
        setShowSuggestionsList(false)
        return
      }

      setIsLoading(true)
      try {
        console.log('🔍 Searching for:', debouncedValue)
        const results = await searchPlaces(debouncedValue)
        console.log('📦 Search results:', results.length, 'places found')
        
        setSuggestions(results)
        setShowSuggestionsList(true)
      } catch (error) {
        console.error('❌ Search error:', error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }

    performSearch()
  }, [debouncedValue, forceHideSuggestions])

  // Effect để ẩn suggestions khi forceHideSuggestions = true
  useEffect(() => {
    if (forceHideSuggestions) {
      setSuggestions([])
      setShowSuggestionsList(false)
      setIsLoading(false)
    }
  }, [forceHideSuggestions])

  const handleTextChange = (text) => {
    onChangeText(text)
    
    // Hiển thị loading ngay khi người dùng nhập (chỉ khi không force hide)
    if (text.length >= 2 && !forceHideSuggestions) {
      setIsLoading(true)
      setShowSuggestionsList(true)
    } else {
      setSuggestions([])
      setShowSuggestionsList(false)
      setIsLoading(false)
    }
  }

  const handleSuggestionSelect = (suggestion) => {
    const locationData = {
      description: suggestion.display_name,
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon),
      placeId: suggestion.place_id,
    }
    
    onChangeText(suggestion.display_name)
    onLocationSelect(locationData)
    
    // Tự động ẩn suggestions sau khi chọn
    setSuggestions([])
    setShowSuggestionsList(false)
    setIsLoading(false)
  }

  const handleFocus = () => {
    setIsFocused(true)
    if (value && value.length >= 2 && suggestions.length > 0) {
      setShowSuggestionsList(true)
    }
  }

  const handleBlur = () => {
    setIsFocused(false)
    // Delay để cho phép người dùng click vào suggestion
    setTimeout(() => {
      setShowSuggestionsList(false)
    }, 200)
  }

  const clearSearch = () => {
    onChangeText('')
    setSuggestions([])
    setShowSuggestionsList(false)
    setIsLoading(false)
  }

  return (
    <View style={styles.container}>
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused
      ]}>
        <MaterialIcons name={iconName} size={18} color={COLORS.PRIMARY} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={value}
          onChangeText={handleTextChange}
          placeholderTextColor={COLORS.PLACEHOLDER_COLOR}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <MaterialIcons name="clear" size={18} color={COLORS.GRAY} />
          </TouchableOpacity>
        )}
        {isLoading && (
          <View style={styles.loadingIndicator}>
            <MaterialIcons name="search" size={18} color={COLORS.PRIMARY} />
          </View>
        )}
      </View>
      
      {showSuggestions && !forceHideSuggestions && (
        <SuggestionsList
          suggestions={suggestions}
          onSelectSuggestion={handleSuggestionSelect}
          isLoading={isLoading}
          visible={showSuggestionsList && isFocused}
          containerWidth={containerWidth}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputContainerFocused: {
    borderColor: COLORS.PRIMARY,
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.BLACK,
    marginLeft: 8,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  loadingIndicator: {
    padding: 4,
    marginLeft: 8,
  },
})

export default LocationSearch
