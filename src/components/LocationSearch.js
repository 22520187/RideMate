import React, { useState } from 'react'
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  FlatList 
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import COLORS from '../constant/colors'

const LocationSearch = ({ 
  placeholder = "Tìm địa điểm", 
  value, 
  onChangeText, 
  onLocationSelect,
  suggestions = [], 
  showSuggestions = false,
  onRequestSuggestions = () => {},
  iconName = "place"
}) => {
  const [isFocused, setIsFocused] = useState(false)

  const handleTextChange = (text) => {
    onChangeText(text)
    if (text.length > 2 && onRequestSuggestions) {
      onRequestSuggestions(text)
    }
  }

  const renderSuggestion = ({ item }) => (
    <TouchableOpacity 
      style={styles.suggestionItem}
      onPress={() => {
        onChangeText(item.description)
        if (onLocationSelect) {
          onLocationSelect(item)
        }
      }}
    >
      <MaterialIcons name="place" size={20} color={COLORS.GRAY} />
      <View style={styles.suggestionContent}>
        <Text style={styles.suggestionTitle} numberOfLines={1}>
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused
      ]}>
        <MaterialIcons name={iconName} size={20} color={COLORS.PURPLE} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={value}
          onChangeText={handleTextChange}
          placeholderTextColor={COLORS.PLACEHOLDER_COLOR}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </View>
      
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item, index) => `suggestion-${index}`}
            showsVerticalScrollIndicator={false}
            style={styles.suggestionsList}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputContainerFocused: {
    borderColor: COLORS.PURPLE,
    borderWidth: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.BLACK,
    marginLeft: 10,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    marginTop: 5,
    elevation: 5,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 1001,
    maxHeight: 200,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  suggestionContent: {
    flex: 1,
    marginLeft: 10,
  },
  suggestionTitle: {
    fontSize: 14,
    color: COLORS.BLACK,
    fontWeight: '500',
  },
})

export default LocationSearch
