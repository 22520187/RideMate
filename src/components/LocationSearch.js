import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import COLORS from "../constant/colors";
import SuggestionsList from "./SuggestionsList";
import { useDebounce } from "../hooks/useDebounce";
import { searchPlaces } from "../utils/api";

const LocationSearch = ({
  placeholder = "Tìm địa điểm",
  value,
  onChangeText,
  onLocationSelect = () => {},
  iconName = "place",
  showSuggestions = true,
  containerWidth = "100%",
  forceHideSuggestions = false,
  onGetCurrentLocation = () => {},
  showCurrentLocationButton = false,
  showClearButton = true,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const debouncedValue = useDebounce(value, 1000);

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
        const results = await searchPlaces(debouncedValue);
        setSuggestions(results);
        setShowSuggestionsList(true);
      } catch (error) {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedValue, forceHideSuggestions]);

  useEffect(() => {
    if (forceHideSuggestions) {
      setSuggestions([]);
      setShowSuggestionsList(false);
      setIsLoading(false);
    }
  }, [forceHideSuggestions]);

  const handleTextChange = (text) => {
    onChangeText(text);
    if (text.length >= 2 && !forceHideSuggestions) {
      setIsLoading(true);
      setShowSuggestionsList(true);
    } else {
      setSuggestions([]);
      setShowSuggestionsList(false);
      setIsLoading(false);
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    const locationData = {
      description: suggestion.display_name,
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon),
      placeId: suggestion.place_id,
    };
    onChangeText(suggestion.display_name);
    onLocationSelect(locationData);
    setSuggestions([]);
    setShowSuggestionsList(false);
    setIsLoading(false);
    setIsFocused(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (value && value.length >= 2 && suggestions.length > 0) {
      setShowSuggestionsList(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    setTimeout(() => setShowSuggestionsList(false), 200);
  };

  const clearSearch = () => {
    onChangeText("");
    setSuggestions([]);
    setShowSuggestionsList(false);
    setIsLoading(false);
  };

  const handleGetCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Lỗi", "Vui lòng cấp quyền truy cập vị trí");
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
        maximumAge: 10000,
        timeout: 5000,
      });
      const { latitude, longitude } = location.coords;
      const description = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      const locationData = {
        description: description,
        latitude,
        longitude,
        placeId: `current-${Date.now()}`,
      };
      onChangeText(description);
      onLocationSelect(locationData);
      onGetCurrentLocation(locationData);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể lấy vị trí hiện tại");
    } finally {
      setIsGettingLocation(false);
    }
  };

  return (
    <View style={[styles.container, isFocused && styles.containerFocused]}>
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
        ]}
      >
        {iconName ? (
          <MaterialIcons name={iconName} size={18} color={COLORS.PRIMARY} />
        ) : null}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={value}
          onChangeText={handleTextChange}
          placeholderTextColor={COLORS.PLACEHOLDER_COLOR}
          onFocus={handleFocus}
          onBlur={handleBlur}
          ellipsizeMode="head"
          numberOfLines={1}
        />
        {value.length > 0 && showClearButton ? (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <MaterialIcons name="clear" size={18} color={COLORS.GRAY} />
          </TouchableOpacity>
        ) : (
          showCurrentLocationButton && (
            <TouchableOpacity
              onPress={handleGetCurrentLocation}
              disabled={isGettingLocation}
              style={styles.locationButton}
            >
              {isGettingLocation ? (
                <ActivityIndicator size="small" color={COLORS.PRIMARY} />
              ) : (
                <View style={styles.locationIconWrapper}>
                  <MaterialIcons
                    name="my-location"
                    size={18}
                    color={COLORS.PRIMARY}
                  />
                  <Text style={styles.locationButtonLabel}>
                    Vị trí hiện tại
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )
        )}
        {isLoading && !value.length && (
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
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 1000,
  },
  containerFocused: {
    zIndex: 99999,
    elevation: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginVertical: 2,
    borderWidth: 0,
  },
  inputContainerFocused: {
    backgroundColor: "#F8F9FA",
    borderWidth: 0,
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
  locationIconWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationButtonLabel: {
    fontSize: 11,
    color: COLORS.PRIMARY,
    fontWeight: "500",
    marginLeft: 4,
  },
  loadingIndicator: {
    padding: 4,
    marginLeft: 8,
  },
});

export default LocationSearch;
