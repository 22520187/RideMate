import React, { useState } from 'react'
import { 
  View, 
  TextInput, 
  StyleSheet
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import COLORS from '../constant/colors'

const LocationSearch = ({ 
  placeholder = "Tìm địa điểm", 
  value, 
  onChangeText, 
  onRequestSuggestions = () => {},
  iconName = "place",
  renderSuggestions = false
}) => {
  const [isFocused, setIsFocused] = useState(false)

  const handleTextChange = (text) => {
    onChangeText(text)
    if (text.length > 2 && onRequestSuggestions) {
      onRequestSuggestions(text)
    }
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
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
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
})

export default LocationSearch
