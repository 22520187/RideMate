import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../constant/colors';
import SCREENS from '../screens';
import Home from '../screens/User/Home';
import Ride from '../screens/User/Ride';
import Award from '../screens/User/Award';
import Profile from '../screens/User/Profile';
import { useIsKeyboardVisible } from '../hooks/useIsKeyboardVisible';
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const UserTabNavigator = () => {
    const {isKeyboardVisible} = useIsKeyboardVisible();
    return (
        <Tab.Navigator
            initialRouteName={SCREENS.HOME}
            screenOptions={({route}) => ({
                tabBarIcon: ({focused, color, size}) => {
                    let iconName;
                    if(route.name === SCREENS.HOME) {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if(route.name === SCREENS.RIDE) {
                        iconName = focused ? 'location' : 'location-outline';
                    } else if(route.name === SCREENS.AWARD) {
                        iconName = focused ? 'diamond' : 'diamond-outline';
                    } else if(route.name === SCREENS.PROFILE) {
                        iconName = focused ? 'person' : 'person-outline';
                    }
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: COLORS.BLUE,
                tabBarInactiveTintColor: COLORS.GRAY,
                tabBarStyle: {
                    display: isKeyboardVisible ? 'none' : 'flex',
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                headerShown: false,
            })}
            >
            <Tab.Screen name={SCREENS.HOME} component={Home} options={{tabBarLabel: 'Home'}} />
            <Tab.Screen name={SCREENS.RIDE} component={Ride} options={{tabBarLabel: 'Ride'}} />
            <Tab.Screen name={SCREENS.AWARD} component={Award} options={{tabBarLabel: 'Reward'}} />
            <Tab.Screen name={SCREENS.PROFILE} component={Profile} options={{tabBarLabel: 'Profile'}} />
        </Tab.Navigator>
    )
}

export { UserTabNavigator };