import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamList } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

// Import actual screens
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import LanguageSelectionScreen from '../screens/LanguageSelectionScreen';
import HomeScreen from '../screens/HomeScreen';
import WeatherScreen from '../screens/WeatherScreen';
import ArticlesScreen from '../screens/ArticlesScreen';
import ArticleDetailsScreen from '../screens/ArticleDetailsScreen';
import MarketPricesScreen from '../screens/MarketPricesScreen';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import AboutScreen from '../screens/AboutScreen';
import BidDetailsScreen from '../screens/BidDetailsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import HelpScreen from '../screens/HelpScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import MyOffersScreen from '../screens/MyOffersScreen';
import ProductCategories from '../screens/ProductCategories';
import ShopsList from '../screens/ShopsList';
import ShopDetails from '../screens/ShopDetails';
import AddProductScreen from '../screens/AddProductScreen';
import MachineCategories from '../screens/MachineCategories';
import MachineList from '../screens/MachineList';
import MachineDetails from '../screens/MachineDetails';
import AddMachine from '../screens/AddMachine';
import PestAndDiseaseControl from '../screens/PestAndDiseaseControl';
import PestDetails from '../screens/PestDetails';

// For screens not yet implemented, use placeholders
const PlaceholderScreen = ({ name }: { name: string }) => null;

const CheckoutScreen = () => <PlaceholderScreen name="Checkout" />;
const OrderConfirmationScreen = () => <PlaceholderScreen name="OrderConfirmation" />;
const ProductsScreen = () => <PlaceholderScreen name="Products" />;

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Main Tab Navigator
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Weather') {
            iconName = focused ? 'cloudy' : 'cloudy-outline';
          } else if (route.name === 'Articles') {
            iconName = focused ? 'newspaper' : 'newspaper-outline';
          } else if (route.name === 'MarketPrices') {
            iconName = focused ? 'trending-up' : 'trending-up-outline';
          } else {
            iconName = focused ? 'person' : 'person-outline';
          }

          // You can return any component here
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.lightText,
        headerShown: route.name !== 'Home',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          paddingBottom: 5,
        },
        tabBarStyle: {
          height: 60,
          paddingTop: 5,
        },
        headerTitleStyle: {
          color: colors.text,
          fontWeight: 'bold',
        },
        headerTitleAlign: 'center',
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          title: 'Home'
        }}
      />
      <Tab.Screen 
        name="Weather" 
        component={WeatherScreen} 
        options={{
          title: 'Weather'
        }}
      />
      <Tab.Screen 
        name="MarketPrices" 
        component={MarketPricesScreen} 
        options={{
          title: 'Market'
        }}
      />
      <Tab.Screen 
        name="Articles" 
        component={ArticlesScreen} 
        options={{
          title: 'Articles'
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          title: 'Profile'
        }}
      />
    </Tab.Navigator>
  );
};

// Main Navigator
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Orders" component={OrdersScreen} />
        <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="Help" component={HelpScreen} />
        <Stack.Screen name="ArticleDetails" component={ArticleDetailsScreen} />
        <Stack.Screen name="BidDetails" component={BidDetailsScreen} />
        <Stack.Screen name="MyOffers" component={MyOffersScreen} />
        <Stack.Screen name="ProductCategories" component={ProductCategories} />
        <Stack.Screen name="ShopsList" component={ShopsList} />
        <Stack.Screen name="ShopDetails" component={ShopDetails} />
        <Stack.Screen name="Products" component={ProductsScreen} />
        <Stack.Screen name="AddProduct" component={AddProductScreen} />
        <Stack.Screen name="MachineCategories" component={MachineCategories} options={{ headerShown: false }} />
        <Stack.Screen name="MachineList" component={MachineList} options={{ headerShown: false }} />
        <Stack.Screen name="MachineDetails" component={MachineDetails} options={{ headerShown: false }} />
        <Stack.Screen name="AddMachine" component={AddMachine} options={{ headerShown: false }} />
        <Stack.Screen name="PestAndDiseaseControl" component={PestAndDiseaseControl} options={{ headerShown: false }} />
        <Stack.Screen name="PestDetails" component={PestDetails} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 
