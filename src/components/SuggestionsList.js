import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import COLORS from "../constant/colors";

const SuggestionsList = ({
  suggestions = [],
  onSelectSuggestion,
  isLoading = false,
  visible = false,
  maxHeight = 200,
  containerWidth = "100%", // Thêm prop để điều chỉnh chiều rộng
}) => {
  if (!visible || (!isLoading && suggestions.length === 0)) {
    return null;
  }

  const renderSuggestion = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.suggestionItem,
        index === suggestions.length - 1 && styles.lastSuggestionItem,
      ]}
      onPress={() => {
        onSelectSuggestion(item);
        // Tự động ẩn suggestions sau khi chọn
      }}
      activeOpacity={0.7}
    >
      <MaterialIcons
        name="place"
        size={20}
        color={COLORS.PRIMARY}
        style={styles.placeIcon}
      />
      <View style={styles.suggestionContent}>
        <Text style={styles.mainText} numberOfLines={2}>
          {item.display_name}
        </Text>
        <Text style={styles.coordsText}>
          {parseFloat(item.lat).toFixed(4)}, {parseFloat(item.lon).toFixed(4)}
        </Text>
      </View>
      <MaterialIcons name="arrow-forward-ios" size={16} color={COLORS.GRAY} />
    </TouchableOpacity>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="small" color={COLORS.PRIMARY} />
      <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        {
          maxHeight,
          width:
            typeof containerWidth === "number"
              ? containerWidth
              : containerWidth,
        },
      ]}
    >
      <View style={styles.suggestionsContainer}>
        {isLoading ? (
          renderLoading()
        ) : (
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item) => item.place_id}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: "100%",
    left: 0,
    backgroundColor: COLORS.WHITE,
    borderRadius: 0,
    marginTop: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    elevation: 10,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 9999,
  },
  suggestionsContainer: {
    borderRadius: 10,
    overflow: "hidden",
  },
  list: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  lastSuggestionItem: {
    borderBottomWidth: 0,
  },
  placeIcon: {
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
    marginRight: 8,
  },
  mainText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.BLACK,
    marginBottom: 2,
    lineHeight: 18,
  },
  coordsText: {
    fontSize: 11,
    color: COLORS.GRAY,
    fontStyle: "italic",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.GRAY,
  },
});

export default SuggestionsList;
