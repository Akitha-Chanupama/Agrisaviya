import { signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for AsyncStorage
const USER_KEY = 'auth_user_data';
const AUTH_TOKEN_KEY = 'auth_token';

/**
 * Sign out the currently authenticated user
 * @returns Promise that resolves when sign out is complete
 */
export const logoutUser = async (): Promise<void> => {
  try {
    // Clear stored user data and token
    await AsyncStorage.removeItem(USER_KEY);
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    
    await signOut(auth);
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
};

/**
 * Get the current authenticated user
 * @returns The current user or null if not authenticated
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Save user data to AsyncStorage after login
 * @param userData User data to save
 */
export const saveUserData = async (userData: any) => {
  try {
    const jsonValue = JSON.stringify(userData);
    await AsyncStorage.setItem(USER_KEY, jsonValue);
  } catch (error) {
    console.error('Error saving user data:', error);
  }
};

/**
 * Save authentication token
 * @param token Authentication token
 */
export const saveAuthToken = async (token: string) => {
  try {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving auth token:', error);
  }
};

/**
 * Get saved user data from AsyncStorage
 * @returns User data object or null if not found
 */
export const getSavedUserData = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(USER_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

/**
 * Get saved authentication token
 * @returns Auth token or null if not found
 */
export const getSavedAuthToken = async () => {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Check if user is logged in based on stored data
 * @returns Promise that resolves to boolean indicating login status
 */
export const isLoggedIn = async (): Promise<boolean> => {
  try {
    const userData = await getSavedUserData();
    const authToken = await getSavedAuthToken();
    return !!(userData && authToken);
  } catch (error) {
    return false;
  }
}; 