import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import COLORS from "../../../constant/colors";
import { searchPlaces } from "../../../utils/api";
import {
  getSearchHistory,
  saveSearchHistory,
  removeFromSearchHistory,
} from "../../../utils/searchHistory";
import RoleSelectionModal from "../../../components/RoleSelectionModal";
import { useDebounce } from "../../../hooks/useDebounce";

export const HomeSearch = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHistory, setSearchHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Debounce search query
  const debouncedQuery = useDebounce(searchQuery, 1000);

  // Load search history on mount
  useEffect(() => {
    loadSearchHistory();
  }, []);

  // Search places when debounced query changes
  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length >= 2) {
      performSearch(debouncedQuery);
    } else {
      setSuggestions([]);
      setIsLoading(false);
    }
  }, [debouncedQuery]);

  const loadSearchHistory = async () => {
    try {
      const history = await getSearchHistory();
      setSearchHistory(history);
    } catch (error) {
      console.error("Error loading search history:", error);
    }
  };

  const performSearch = async (query) => {
    setIsLoading(true);
    try {
      const results = await searchPlaces(query);
      setSuggestions(results);
    } catch (error) {
      console.error(" Search error:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSelect = async (locationData) => {
    setSelectedLocation(locationData);
    await saveSearchHistory(locationData);
    await loadSearchHistory();
    setShowRoleModal(true);
  };

  const handleHistorySelect = async (historyItem) => {
    setSearchQuery(historyItem.description);
    await saveSearchHistory(historyItem);
    await loadSearchHistory();
    setShowRoleModal(true);
  };

  const handleRemoveHistoryItem = async (placeId) => {
    await removeFromSearchHistory(placeId);
    await loadSearchHistory();
  };

  const handleRoleSelect = (role) => {
    if (role === "driver") {
      navigation.navigate("DriverRide", {
        destination: selectedLocation,
      });
    } else if (role === "passenger") {
      navigation.navigate("PassengerRide", {
        destination: selectedLocation,
      });
    }
    setShowRoleModal(false);
    setSelectedLocation(null);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSuggestions([]);
    setIsLoading(false);
  };

  const getCurrentLocation = async () => {
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

        setSelectedLocation(locationData);
        setSearchQuery(description);
        await saveSearchHistory(locationData);
        await loadSearchHistory();
        setShowRoleModal(true);
      }
    } catch (error) {
      console.error("Error getting current location:", error);
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

  const renderSuggestionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() =>
        handleLocationSelect({
          description: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          placeId: item.place_id,
        })
      }
      activeOpacity={0.7}
    >
      <MaterialIcons
        name="place"
        size={20}
        color={COLORS.PRIMARY}
        style={styles.placeIcon}
      />
      <View style={styles.suggestionContent}>
        <Text style={styles.suggestionText} numberOfLines={2}>
          {item.display_name}
        </Text>
        <Text style={styles.coordsText}>
          {parseFloat(item.lat).toFixed(4)}, {parseFloat(item.lon).toFixed(4)}
        </Text>
      </View>
      <MaterialIcons name="arrow-forward-ios" size={16} color={COLORS.GRAY} />
    </TouchableOpacity>
  );

  const renderLoadingItem = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="small" color={COLORS.PRIMARY} />
      <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.WHITE} />
          </TouchableOpacity>

          <View style={styles.searchInputContainer}>
            <MaterialIcons name="search" size={20} color={COLORS.GRAY} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm địa điểm"
              placeholderTextColor={COLORS.PLACEHOLDER_COLOR}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={clearSearch}>
                <MaterialIcons name="clear" size={20} color={COLORS.GRAY} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={getCurrentLocation}
                disabled={isGettingLocation}
              >
                {isGettingLocation ? (
                  <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                ) : (
                  <MaterialIcons
                    name="my-location"
                    size={20}
                    color={COLORS.PRIMARY}
                  />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {searchQuery.length === 0 ? (
          // Show search history when no query
          <View style={styles.historySection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Lịch sử tìm kiếm</Text>
            </View>
            {searchHistory.length > 0 ? (
              <FlatList
                data={searchHistory}
                renderItem={renderHistoryItem}
                keyExtractor={(item) => item.placeId}
                showsVerticalScrollIndicator={false}
                style={styles.historyList}
              />
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons
                  name="history"
                  size={48}
                  color={COLORS.GRAY_LIGHT}
                />
                <Text style={styles.emptyText}>Chưa có lịch sử tìm kiếm</Text>
                <Text style={styles.emptySubtext}>
                  Nhập địa điểm để bắt đầu tìm kiếm
                </Text>
              </View>
            )}
          </View>
        ) : (
          // Show search results
          <View style={styles.resultsSection}>
            {isLoading ? (
              renderLoadingItem()
            ) : suggestions.length > 0 ? (
              <ScrollView style={styles.suggestionsList}>
                {suggestions.map((item, index) => (
                  <TouchableOpacity
                    key={item.place_id || index}
                    style={styles.suggestionItem}
                    onPress={() =>
                      handleLocationSelect({
                        description: item.display_name,
                        latitude: parseFloat(item.lat),
                        longitude: parseFloat(item.lon),
                        placeId: item.place_id,
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <MaterialIcons
                      name="place"
                      size={20}
                      color={COLORS.PRIMARY}
                      style={styles.placeIcon}
                    />
                    <View style={styles.suggestionContent}>
                      <Text style={styles.suggestionText} numberOfLines={2}>
                        {item.display_name}
                      </Text>
                      <Text style={styles.coordsText}>
                        {parseFloat(item.lat).toFixed(4)},{" "}
                        {parseFloat(item.lon).toFixed(4)}
                      </Text>
                    </View>
                    <MaterialIcons
                      name="arrow-forward-ios"
                      size={16}
                      color={COLORS.GRAY}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons
                  name="search-off"
                  size={48}
                  color={COLORS.GRAY_LIGHT}
                />
                <Text style={styles.emptyText}>Không tìm thấy địa điểm</Text>
                <Text style={styles.emptySubtext}>
                  Thử tìm kiếm với từ khóa khác
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Role Selection Modal */}
      <RoleSelectionModal
        visible={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          setSelectedLocation(null);
        }}
        onRoleSelect={handleRoleSelect}
        selectedLocation={selectedLocation}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  header: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.BLACK,
    marginLeft: 8,
    paddingVertical: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  historySection: {
    paddingTop: 20,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.BLACK,
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  resultsSection: {
    paddingTop: 20,
    zIndex: 1000,
  },
  suggestionsList: {
    maxHeight: 300,
    zIndex: 1001,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 1002,
  },
  placeIcon: {
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
    marginRight: 8,
  },
  suggestionText: {
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
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.GRAY,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.BLACK,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.GRAY,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});

export default HomeSearch;
