import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import COLORS from '../../constant/colors'

const Message = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Message</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.BLACK,
    textAlign: 'center',
    marginTop: 20,
  }
})
export default Message