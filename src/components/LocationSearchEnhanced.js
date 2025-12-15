import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import COLORS from "../constant/colors";
import SuggestionsList from "./SuggestionsList";
import { useDebounce } from "../hooks/useDebounce";
import { searchPlaces } from "../utils/api";
import {
  getSearchHistory,
  saveSearchHistory,
  searchInHistory,
  removeFromSearchHistory,
} from "../utils/searchHistory";

const LocationSearchEnhanced = ({
  placeholder = "Tìm địa điểm",
  value,
  onChangeText,
  onLocationSelect = () => {},
  iconName = "place",
  showSuggestions = true,
  containerWidth = "100%",
  forceHideSuggestions = false,
  showHistory = true, // Thêm prop để hiển thị lịch sử
  onGetCurrentLocation = () => {}, // Thêm callback cho current location
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);
  const [showHistoryList, setShowHistoryList] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Debounce giá trị input với delay 1 giây (giảm từ 2 giây để phản hồi nhanh hơn)
  const debouncedValue = useDebounce(value, 1000);

  // Load lịch sử tìm kiếm khi component mount
  useEffect(() => {
    loadSearchHistory();
  }, []);

  // Load lịch sử tìm kiếm
  const loadSearchHistory = async () => {
    try {
      const history = await getSearchHistory();
      setSearchHistory(history);
    } catch (error) {
      console.error("❌ Error loading search history:", error);
    }
  };

  // Effect để gọi API khi debounced value thay đổi
  useEffect(() => {
    const performSearch = async () => {
      if (
        !debouncedValue ||
        debouncedValue.length < 2 ||
        forceHideSuggestions
      ) {
        setSuggestions([]);
        setIsLoading(false);
        setShowSuggestionsList(false);
        return;
      }

      setIsLoading(true);
      try {
        console.log("🔍 Searching for:", debouncedValue);
        const results = await searchPlaces(debouncedValue);
        console.log("📦 Search results:", results.length, "places found");

        setSuggestions(results);
        setShowSuggestionsList(true);
      } catch (error) {
        console.error("❌ Search error:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedValue, forceHideSuggestions]);

  // Effect để ẩn suggestions khi forceHideSuggestions = true
  useEffect(() => {
    if (forceHideSuggestions) {
      setSuggestions([]);
      setShowSuggestionsList(false);
      setIsLoading(false);
    }
  }, [forceHideSuggestions]);

  const handleTextChange = (text) => {
    onChangeText(text);

    // Hiển thị loading ngay khi người dùng nhập (chỉ khi không force hide)
    if (text.length >= 2 && !forceHideSuggestions) {
      setIsLoading(true);
      setShowSuggestionsList(true);
      setShowHistoryList(false);
    } else if (text.length === 0 && showHistory) {
      // Hiển thị lịch sử khi input trống
      setShowHistoryList(true);
      setShowSuggestionsList(false);
    } else {
      setSuggestions([]);
      setShowSuggestionsList(false);
      setShowHistoryList(false);
      setIsLoading(false);
    }
  };

  const handleSuggestionSelect = async (suggestion) => {
    const locationData = {
      description: suggestion.display_name,
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon),
      placeId: suggestion.place_id,
    };

    onChangeText(suggestion.display_name);
    onLocationSelect(locationData);

    // Lưu vào lịch sử
    await saveSearchHistory(locationData);

    // Cập nhật lịch sử local
    await loadSearchHistory();

    // Tự động ẩn suggestions sau khi chọn
    setSuggestions([]);
    setShowSuggestionsList(false);
    setIsLoading(false);
  };

  const handleHistorySelect = async (historyItem) => {
    onChangeText(historyItem.description);
    onLocationSelect(historyItem);

    // Cập nhật lại lịch sử (đưa item được chọn lên đầu)
    await saveSearchHistory(historyItem);
    await loadSearchHistory();

    setShowHistoryList(false);
  };

  const handleRemoveHistoryItem = async (placeId) => {
    await removeFromSearchHistory(placeId);
    await loadSearchHistory();
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (value && value.length >= 2 && suggestions.length > 0) {
      setShowSuggestionsList(true);
    } else if (value.length === 0 && showHistory && searchHistory.length > 0) {
      setShowHistoryList(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay để cho phép người dùng click vào suggestion
    setTimeout(() => {
      setShowSuggestionsList(false);
      setShowHistoryList(false);
    }, 200);
  };

  const clearSearch = () => {
    onChangeText("");
    setSuggestions([]);
    setShowSuggestionsList(false);
    setShowHistoryList(false);
    setIsLoading(false);
  };

  const handleGetCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);

      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Lỗi", "Vui lòng cấp quyền truy cập vị trí");
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // Reverse geocode to get address
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const description = [
          address.street,
          address.district,
          address.city,
          address.country,
        ]
          .filter(Boolean)
          .join(", ");

        const locationData = {
          description: description || "Vị trí hiện tại",
          latitude,
          longitude,
          placeId: `current-${Date.now()}`,
        };

        onChangeText(description);
        onLocationSelect(locationData);

        // Save to history
        await saveSearchHistory(locationData);
        await loadSearchHistory();

        // Call external callback if provided
        onGetCurrentLocation(locationData);
      }
    } catch (error) {
      console.error("❌ Error getting current location:", error);
      Alert.alert("Lỗi", "Không thể lấy vị trí hiện tại");
    } finally {
      setIsGettingLocation(false);
    }
  };

  const renderHistoryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => handleHistorySelect(item)}
      activeOpacity={0.7}
    >
      <MaterialIcons
        name="history"
        size={20}
        color={COLORS.GRAY}
        style={styles.historyIcon}
      />
      <View style={styles.historyContent}>
        <Text style={styles.historyText} numberOfLines={1}>
          {item.description}
        </Text>
        <Text style={styles.historyCoords}>
          {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => handleRemoveHistoryItem(item.placeId)}
        style={styles.removeButton}
      >
        <MaterialIcons name="close" size={16} color={COLORS.GRAY} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
        ]}
      >
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
        {value.length > 0 ? (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <MaterialIcons name="clear" size={18} color={COLORS.GRAY} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleGetCurrentLocation}
            disabled={isGettingLocation}
            style={styles.locationButton}
          >
            {isGettingLocation ? (
              <ActivityIndicator size="small" color={COLORS.PRIMARY} />
            ) : (
              <MaterialIcons
                name="my-location"
                size={18}
                color={COLORS.PRIMARY}
              />
            )}
          </TouchableOpacity>
        )}
        {isLoading && !value.length && (
          <View style={styles.loadingIndicator}>
            <MaterialIcons name="search" size={18} color={COLORS.PRIMARY} />
          </View>
        )}
      </View>

      {/* Hiển thị lịch sử tìm kiếm */}
      {showHistory && showHistoryList && searchHistory.length > 0 && (
        <View
          style={[
            styles.historyContainer,
            {
              width:
                typeof containerWidth === "number"
                  ? containerWidth
                  : containerWidth,
            },
          ]}
        >
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Lịch sử tìm kiếm</Text>
          </View>
          <FlatList
            data={searchHistory.slice(0, 5)} // Chỉ hiển thị 5 item gần nhất
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.placeId}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={styles.historyList}
          />
        </View>
      )}

      {/* Hiển thị suggestions từ API */}
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
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
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
  locationButton: {
    padding: 4,
    marginLeft: 8,
  },
  loadingIndicator: {
    padding: 4,
    marginLeft: 8,
  },
  // History styles
  historyContainer: {
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
    maxHeight: 200,
  },
  historyHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  historyTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.GRAY,
    textTransform: "uppercase",
  },
  historyList: {
    maxHeight: 150,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  historyIcon: {
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
    marginRight: 8,
  },
  historyText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.BLACK,
    marginBottom: 2,
  },
  historyCoords: {
    fontSize: 11,
    color: COLORS.GRAY,
    fontStyle: "italic",
  },
  removeButton: {
    padding: 4,
  },
});

export default LocationSearchEnhanced;
