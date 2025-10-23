import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../constant/colors';
import SCREENS from '../screens';
import Home from '../screens/User/Home';
import Award from '../screens/User/Award';
import Profile from '../screens/User/Profile';
import DriverRideScreen from '../screens/User/Rider/DriverRideScreen';
import PassengerRideScreen from '../screens/User/Rider/PassengerRideScreen';
import Report from '../screens/User/Report';
import Notification from '../screens/User/Notification';
import { useIsKeyboardVisible } from '../hooks/useIsKeyboardVisible';
import MemberDetail from '../screens/User/Member/MemberDetail';
import Member from '../screens/User/Member/Member';
import Voucher from '../screens/User/Voucher';
import Mission from '../screens/User/Mission';
import Login from '../screens/Auth/Login';
import PhoneVerification from '../screens/Auth/PhoneVerification';
import MessageListScreen from "../screens/User/Message/MessageListScreen";
import ChatScreen from "../screens/User/Message/ChatScreen";
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const MessageStack = createStackNavigator();

const MessageStackNavigator = () => {
  return (
    <MessageStack.Navigator screenOptions={{ headerShown: false }}>
      <MessageStack.Screen name="MessageList" component={MessageListScreen} />
      <MessageStack.Screen name="ChatScreen" component={ChatScreen} />
    </MessageStack.Navigator>
  );
};

const UserTabNavigator = () => {
  const { isKeyboardVisible } = useIsKeyboardVisible();
  return (
    <Tab.Navigator
      initialRouteName={SCREENS.HOME}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === SCREENS.HOME) {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === SCREENS.AWARD) {
            iconName = focused ? "diamond" : "diamond-outline";
          } else if (route.name === SCREENS.PROFILE) {
            iconName = focused ? "person" : "person-outline";
          } else if (route.name === SCREENS.MESSAGE) {
            iconName = focused ? "chatbox" : "chatbox-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.BLUE,
        tabBarInactiveTintColor: COLORS.GRAY,
        tabBarStyle: {
          display: isKeyboardVisible ? "none" : "flex",
          height: 60,
          paddingBottom: 8,
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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={SCREENS.LOGIN} component={Login} />
      <Stack.Screen name={SCREENS.PHONE_VERIFICATION} component={PhoneVerification} />
      <Stack.Screen name="MainTabs" component={UserTabNavigator} />
      <Stack.Screen name={SCREENS.MEMBER} component={Member} />
      <Stack.Screen name={SCREENS.DRIVER_RIDE} component={DriverRideScreen} />
      <Stack.Screen name={SCREENS.PASSENGER_RIDE} component={PassengerRideScreen} />
      <Stack.Screen name={SCREENS.REPORT} component={Report} />
      <Stack.Screen name={SCREENS.NOTIFICATION} component={Notification} />
      <Stack.Screen name={SCREENS.MEMBER_DETAIL} component={MemberDetail} />
      <Stack.Screen name={SCREENS.VOUCHER} component={Voucher} />
      <Stack.Screen name={SCREENS.MISSION} component={Mission} />
    </Stack.Navigator>
  );
};

export { UserTabNavigator, MainStackNavigator };
