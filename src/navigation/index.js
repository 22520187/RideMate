import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import COLORS from "../constant/colors";
import SCREENS from "../screens";
import Home from "../screens/User/Home/Home";
import HomeSearch from "../screens/User/Home/HomeSearch";
import Award from "../screens/User/Award";
import Profile from "../screens/User/Profile";
import DriverRideScreen from "../screens/User/Rider/DriverRideScreen";
import DriverRideRequestsScreen from "../screens/User/Driver/DriverRideRequestsScreen";
import DriverStatusScreen from "../screens/User/Driver/DriverStatusScreen";
import DriverMapScreen from "../screens/User/Driver/DriverMapScreen";
import DriverStatistics from "../screens/User/Driver/DriverStatistics";
import PassengerRideScreen from "../screens/User/Rider/PassengerRideScreen";
import MatchedRideScreen from "../screens/User/Rider/MatchedRideScreen";
import Report from "../screens/User/Report";
import Notification from "../screens/User/Notification";
import { useIsKeyboardVisible } from "../hooks/useIsKeyboardVisible";
import MemberDetail from "../screens/User/Member/MemberDetail";
import Member from "../screens/User/Member/Member";
import Voucher from "../screens/User/Voucher";
import Mission from "../screens/User/Mission";
import RideHistory from "../screens/User/RideHistory";
import RideDetail from "../screens/User/RideDetail";
import Login from "../screens/Auth/Login";
import Onboarding from "../screens/Auth/Onboarding";
import InitialScreen from "../screens/Auth/InitialScreen";
import PhoneVerification from "../screens/Auth/PhoneVerification";
import RegisterComplete from "../screens/Auth/RegisterComplete";
import MessageListScreen from "../screens/User/Message/MessageListScreen";
import ChatScreenCustom from "../screens/User/Message/ChatScreenCustom";
import AdminDashboard from "../screens/Admin/AdminDashboard";
import TripManagement from "../screens/Admin/TripManagement";
import UserManagement from "../screens/Admin/UserManagement";
import UserDetail from "../screens/Admin/UserDetail";
import ReportManagement from "../screens/Admin/ReportManagement";
import RewardManagement from "../screens/Admin/RewardManagement";
import AdminProfile from "../screens/Admin/AdminProfile";
import MembershipManagement from "../screens/Admin/MembershipManagement";
import { getUserType } from "../utils/storage";

// Fixed Routes screens
import CreateFixedRouteScreen from "../screens/User/Driver/CreateFixedRouteScreen";
import MyFixedRoutesScreen from "../screens/User/Driver/MyFixedRoutesScreen";
import RouteBookingsScreen from "../screens/User/Driver/RouteBookingsScreen";
import FixedRoutesScreen from "../screens/User/Rider/FixedRoutesScreen";
import RouteBookingScreen from "../screens/User/Rider/RouteBookingScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const MessageStack = createStackNavigator();
const AdminStack = createStackNavigator();
const AdminTab = createBottomTabNavigator();

const MessageStackNavigator = () => {
  return (
    <MessageStack.Navigator screenOptions={{ headerShown: false }}>
      <MessageStack.Screen name="MessageList" component={MessageListScreen} />
    </MessageStack.Navigator>
  );
};

const AdminTabNavigator = () => {
  const insets = useSafeAreaInsets();
  const [isAuthorized, setIsAuthorized] = useState(null); // null = checking, true = authorized, false = not authorized

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const userType = await getUserType();
        console.log("🔐 AdminTabNavigator - User type:", userType);
        setIsAuthorized(userType === "ADMIN");
      } catch (error) {
        console.error("❌ Error checking admin access:", error);
        setIsAuthorized(false);
      }
    };
    checkAdminAccess();
  }, []);

  // Loading state
  if (isAuthorized === null) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.BLUE} />
        <Text style={styles.loadingText}>Đang kiểm tra quyền truy cập...</Text>
      </View>
    );
  }

  // Unauthorized
  if (isAuthorized === false) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="lock-closed-outline" size={64} color={COLORS.RED} />
        <Text style={styles.unauthorizedTitle}>Truy cập bị từ chối</Text>
        <Text style={styles.unauthorizedText}>
          Bạn không có quyền truy cập vào trang quản trị.
        </Text>
      </View>
    );
  }

  // Authorized - render admin tabs
  return (
    <AdminTab.Navigator
      initialRouteName={SCREENS.ADMIN_DASHBOARD}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = "ellipse";
          if (route.name === SCREENS.ADMIN_DASHBOARD) {
            iconName = focused ? "speedometer" : "speedometer-outline";
          } else if (route.name === SCREENS.ADMIN_TRIP_MANAGEMENT) {
            iconName = focused ? "navigate" : "navigate-outline";
          } else if (route.name === SCREENS.ADMIN_USER_MANAGEMENT) {
            iconName = focused ? "people" : "people-outline";
          } else if (route.name === SCREENS.ADMIN_REPORT_MANAGEMENT) {
            iconName = focused ? "alert-circle" : "alert-circle-outline";
          } else if (route.name === SCREENS.ADMIN_REWARD_MANAGEMENT) {
            iconName = focused ? "gift" : "gift-outline";
          } else if (route.name === SCREENS.ADMIN_PROFILE) {
            iconName = focused ? "settings" : "settings-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.BLUE,
        tabBarInactiveTintColor: COLORS.GRAY,
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
        },
        headerShown: false,
      })}
    >
      <AdminTab.Screen
        name={SCREENS.ADMIN_DASHBOARD}
        component={AdminDashboard}
        options={{ tabBarLabel: "Dashboard" }}
      />
      <AdminTab.Screen
        name={SCREENS.ADMIN_TRIP_MANAGEMENT}
        component={TripManagement}
        options={{ tabBarLabel: "Trips" }}
      />
      <AdminTab.Screen
        name={SCREENS.ADMIN_USER_MANAGEMENT}
        component={UserManagement}
        options={{ tabBarLabel: "Users" }}
      />
      <AdminTab.Screen
        name={SCREENS.ADMIN_REPORT_MANAGEMENT}
        component={ReportManagement}
        options={{ tabBarLabel: "Reports" }}
      />
      <AdminTab.Screen
        name={SCREENS.ADMIN_REWARD_MANAGEMENT}
        component={RewardManagement}
        options={{ tabBarLabel: "Rewards" }}
      />
      <AdminTab.Screen
        name={SCREENS.ADMIN_PROFILE}
        component={AdminProfile}
        options={{ tabBarLabel: "Profile" }}
      />
    </AdminTab.Navigator>
  );
};

const UserTabNavigator = () => {
  const { isKeyboardVisible } = useIsKeyboardVisible();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName={SCREENS.HOME}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === SCREENS.HOME) {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === SCREENS.RIDE_HISTORY) {
            iconName = focused ? "time" : "time-outline";
          } else if (route.name === SCREENS.AWARD) {
            iconName = focused ? "diamond" : "diamond-outline";
          } else if (route.name === SCREENS.PROFILE) {
            iconName = focused ? "person" : "person-outline";
          } else if (route.name === SCREENS.MESSAGE) {
            iconName = focused ? "chatbox" : "chatbox-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.PRIMARY,
        tabBarInactiveTintColor: COLORS.GRAY,
        tabBarStyle: {
          display: isKeyboardVisible ? "none" : "flex",
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name={SCREENS.HOME}
        component={Home}
        options={{ tabBarLabel: "Home" }}
      />
      <Tab.Screen
        name={SCREENS.RIDE_HISTORY}
        component={RideHistory}
        options={{ tabBarLabel: "Lịch sử" }}
      />
      <Tab.Screen
        name={SCREENS.MESSAGE}
        component={MessageStackNavigator}
        options={{ tabBarLabel: "Message" }}
      />
      <Tab.Screen
        name={SCREENS.AWARD}
        component={Award}
        options={{ tabBarLabel: "Reward" }}
      />
      <Tab.Screen
        name={SCREENS.PROFILE}
        component={Profile}
        options={{ tabBarLabel: "Profile" }}
      />
    </Tab.Navigator>
  );
};

const MainStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="InitialScreen"
    >
      <Stack.Screen name="InitialScreen" component={InitialScreen} />
      <Stack.Screen name={SCREENS.ONBOARDING} component={Onboarding} />
      <Stack.Screen name={SCREENS.LOGIN} component={Login} />
      <Stack.Screen
        name={SCREENS.PHONE_VERIFICATION}
        component={PhoneVerification}
      />
      <Stack.Screen
        name={SCREENS.REGISTER_COMPLETE}
        component={RegisterComplete}
      />
      <Stack.Screen name="MainTabs" component={UserTabNavigator} />
      <Stack.Screen name={SCREENS.ADMIN_STACK} component={AdminTabNavigator} />
      <Stack.Screen name={SCREENS.HOME_SEARCH} component={HomeSearch} />
      <Stack.Screen name={SCREENS.MEMBER} component={Member} />
      <Stack.Screen name={SCREENS.DRIVER_RIDE} component={DriverRideScreen} />
      <Stack.Screen
        name={SCREENS.DRIVER_RIDE_REQUESTS}
        component={DriverRideRequestsScreen}
      />
      <Stack.Screen
        name={SCREENS.DRIVER_STATUS}
        component={DriverStatusScreen}
      />
      <Stack.Screen name={SCREENS.DRIVER_MAP} component={DriverMapScreen} />
      <Stack.Screen name="DriverStatistics" component={DriverStatistics} />
      <Stack.Screen
        name={SCREENS.PASSENGER_RIDE}
        component={PassengerRideScreen}
      />
      <Stack.Screen name={SCREENS.MATCHED_RIDE} component={MatchedRideScreen} />
      <Stack.Screen name={SCREENS.REPORT} component={Report} />
      <Stack.Screen name={SCREENS.NOTIFICATION} component={Notification} />
      <Stack.Screen name={SCREENS.MEMBER_DETAIL} component={MemberDetail} />
      <Stack.Screen name={SCREENS.VOUCHER} component={Voucher} />
      <Stack.Screen name={SCREENS.MISSION} component={Mission} />
      <Stack.Screen name={SCREENS.RIDE_HISTORY} component={RideHistory} />
      <Stack.Screen name="RideDetail" component={RideDetail} />

      {/* Chat Screen - Full screen without bottom tabs */}
      <Stack.Screen
        name="ChatScreen"
        component={ChatScreenCustom}
        options={{
          presentation: "card",
          headerShown: false,
        }}
      />

      {/* Fixed Routes screens */}
      <Stack.Screen
        name="CreateFixedRouteScreen"
        component={CreateFixedRouteScreen}
      />
      <Stack.Screen
        name="MyFixedRoutesScreen"
        component={MyFixedRoutesScreen}
      />
      <Stack.Screen
        name="RouteBookingsScreen"
        component={RouteBookingsScreen}
      />
      <Stack.Screen name="FixedRoutesScreen" component={FixedRoutesScreen} />
      <Stack.Screen name="RouteBookingScreen" component={RouteBookingScreen} />
      <Stack.Screen
        name={SCREENS.ADMIN_MEMBERSHIP_MANAGEMENT}
        component={MembershipManagement}
      />
      <Stack.Screen name={SCREENS.ADMIN_USER_DETAIL} component={UserDetail} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.GRAY,
  },
  unauthorizedTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.RED,
  },
  unauthorizedText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.GRAY,
    textAlign: "center",
  },
});

export { UserTabNavigator, MainStackNavigator };
