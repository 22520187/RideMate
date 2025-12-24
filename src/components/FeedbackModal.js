import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import COLORS from '../constant/colors';

const FeedbackModal = ({ visible, onClose, onSubmit, isLoading, driverName }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  const tags = [
    { id: 'safe', label: 'Lái xe an toàn' },
    { id: 'clean', label: 'Xe sạch sẽ' },
    { id: 'friendly', label: 'Thân thiện' },
    { id: 'fast', label: 'Nhanh chóng' },
    { id: 'music', label: 'Nhạc hay' },
    { id: 'route', label: 'Đúng lộ trình' },
  ];

  const handleTagPress = (tagId) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(prev => prev.filter(id => id !== tagId));
    } else {
      setSelectedTags(prev => [...prev, tagId]);
    }
  };

  const handleSubmit = () => {
    onSubmit({
      rating,
      comment,
      tags: selectedTags,
    });
    // Reset form after submit if needed, or let parent handle close
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name="close" size={24} color={COLORS.GRAY} />
          </TouchableOpacity>

          <Text style={styles.title}>Đánh giá chuyến đi</Text>
          <Text style={styles.subtitle}>
            Bạn cảm thấy chuyến đi với {driverName || 'tài xế'} thế nào?
          </Text>

          {/* Star Rating */}
          <View style={styles.starContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <MaterialIcons
                  name={star <= rating ? 'star' : 'star-border'}
                  size={40}
                  color={COLORS.ORANGE}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Tags */}
          <View style={styles.tagsContainer}>
            {tags.map((tag) => (
              <TouchableOpacity
                key={tag.id}
                style={[
                  styles.tag,
                  selectedTags.includes(tag.id) && styles.selectedTag,
                ]}
                onPress={() => handleTagPress(tag.id)}
              >
                <Text
                  style={[
                    styles.tagText,
                    selectedTags.includes(tag.id) && styles.selectedTagText,
                  ]}
                >
                  {tag.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Comment Input */}
          <TextInput
            style={styles.input}
            placeholder="Viết nhận xét của bạn..."
            multiline
            numberOfLines={3}
            value={comment}
            onChangeText={setComment}
            textAlignVertical="top"
          />

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, rating === 0 && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={rating === 0 || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.WHITE} />
            ) : (
              <Text style={styles.submitButtonText}>Gửi đánh giá</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.BLACK,
    textAlign: 'center',
    marginTop: -10,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.GRAY,
    textAlign: 'center',
    marginBottom: 24,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
    backgroundColor: COLORS.WHITE,
  },
  selectedTag: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY + '10', // 10% opacity
  },
  tagText: {
    fontSize: 13,
    color: COLORS.GRAY,
  },
  selectedTagText: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.GRAY_BG,
    borderRadius: 12,
    padding: 12,
    height: 100,
    marginBottom: 24,
    fontSize: 14,
    color: COLORS.BLACK,
  },
  submitButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  submitButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default FeedbackModal;
