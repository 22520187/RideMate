import AsyncStorage from '@react-native-async-storage/async-storage';
class AsyncStorageService {
    static getUserId = async () => {
        try {
            const userDataString = await AsyncStorage.getItem("userData");
            if (userDataString) {
                const userData = JSON.parse(userDataString);
                const userId = userData.id;
                console.log("User ID:", userId);
                return userId;
            }
        } catch (error) {
            console.error("Error getting user ID from storage", error);
        }
    };
    static saveConnectionId = async (connectionId) => {
        try {
            await AsyncStorage.setItem("connectionId", connectionId);
        } catch (error) {
            console.error("Error saving connection ID to storage", error);
        }
    }
    static getConnectionId = async () => {
        try {
            const connectionId = await AsyncStorage.getItem("connectionId");
            return connectionId;
        } catch (error) {
            console.error("Error getting connection ID from storage", error);
        }
    };
    static clearConnectionId = async () => {
        try {
            await AsyncStorage.removeItem("connectionId");
        } catch (error) {
            console.error("Error clearing connection ID from storage", error);
        }
    };
    static saveRecentSearch = async (search) => {
        try {
            if (!search || typeof search !== 'string' || search.trim() === '') {
                console.warn("Invalid search term");
                return;
            }

            const userId = await AsyncStorageService.getUserId();
            if (!userId) {
                console.warn("No user ID found, cannot save recent search");
                return;
            }

            const searchKey = `recentSearches_${userId}`;
            let searches = [];
            
            try {
                const recentSearches = await AsyncStorage.getItem(searchKey);
                searches = recentSearches ? JSON.parse(recentSearches) : [];
                
                // Validate parsed data is an array
                if (!Array.isArray(searches)) {
                    console.warn("Invalid format in storage, resetting searches");
                    searches = [];
                }
            } catch (parseError) {
                console.warn("Error parsing stored searches, resetting", parseError);
                searches = [];
            }

            // Remove duplicates (case insensitive)
            const searchTerm = search.trim();
            searches = searches.filter(item => 
                item.toLowerCase() !== searchTerm.toLowerCase()
            );

            // Add new search at the beginning
            searches.unshift(searchTerm);

            // Keep only the 5 most recent unique searches
            searches = searches.slice(0, 5);

            await AsyncStorage.setItem(searchKey, JSON.stringify(searches));
            console.log(`Saved recent searches for user ${userId}:`, searches);
            return searches;
        } catch (error) {
            console.error("Error saving recent search to storage", error);
            throw error;
        }
    }

    static get5RecentSearches = async () => {
        try {
            const userId = await AsyncStorageService.getUserId();
            if (!userId) {
                console.warn("No user ID found, cannot get recent searches");
                return [];
            }

            const searchKey = `recentSearches_${userId}`;
            const recentSearches = await AsyncStorage.getItem(searchKey);
            if (recentSearches) {
                return JSON.parse(recentSearches);
            }
            return [];
        } catch (error) {
            console.error("Error getting recent searches from storage", error);
            return [];
        }
    }
    static getUserData = async () => {
        try {
            const userDataString = await AsyncStorage.getItem("userData");
            if (userDataString) {
                console.log("userDataString", JSON.parse(userDataString));
                return JSON.parse(userDataString);
            }
            return null;
        } catch (error) {
            console.error("Error getting user data from storage", error);
            return null;
        }
    }
}

export default AsyncStorageService;