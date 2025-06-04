import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { colors, fontSizes, spacing, borderRadius, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

const SETTINGS_KEYS = {
  LANGUAGE: 'settings_language',
  NOTIFICATIONS: 'settings_notifications',
  MARKET_ALERTS: 'settings_market_alerts',
  WEATHER_ALERTS: 'settings_weather_alerts',
  DARK_MODE: 'settings_dark_mode',
  LOCATION_SERVICES: 'settings_location_services',
  DATA_SAVER: 'settings_data_saver',
};

const SettingsScreen = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  
  // Language settings
  const [language, setLanguage] = useState('English');
  
  // Notification settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [marketAlertsEnabled, setMarketAlertsEnabled] = useState(true);
  const [weatherAlertsEnabled, setWeatherAlertsEnabled] = useState(true);
  
  // App preferences
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [locationServicesEnabled, setLocationServicesEnabled] = useState(true);
  const [dataSaverEnabled, setDataSaverEnabled] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load language setting
      const savedLanguage = await AsyncStorage.getItem(SETTINGS_KEYS.LANGUAGE);
      if (savedLanguage) setLanguage(savedLanguage);
      
      // Load notification settings
      const notificationsValue = await AsyncStorage.getItem(SETTINGS_KEYS.NOTIFICATIONS);
      setNotificationsEnabled(notificationsValue === 'true');
      
      const marketAlertsValue = await AsyncStorage.getItem(SETTINGS_KEYS.MARKET_ALERTS);
      setMarketAlertsEnabled(marketAlertsValue === 'true');
      
      const weatherAlertsValue = await AsyncStorage.getItem(SETTINGS_KEYS.WEATHER_ALERTS);
      setWeatherAlertsEnabled(weatherAlertsValue === 'true');
      
      // Load app preferences
      const darkModeValue = await AsyncStorage.getItem(SETTINGS_KEYS.DARK_MODE);
      setDarkModeEnabled(darkModeValue === 'true');
      
      const locationServicesValue = await AsyncStorage.getItem(SETTINGS_KEYS.LOCATION_SERVICES);
      setLocationServicesEnabled(locationServicesValue === 'true');
      
      const dataSaverValue = await AsyncStorage.getItem(SETTINGS_KEYS.DATA_SAVER);
      setDataSaverEnabled(dataSaverValue === 'true');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  };

  const handleLanguageSelect = (value: string) => {
    setLanguage(value);
    saveSettings(SETTINGS_KEYS.LANGUAGE, value);
    Alert.alert('Language Changed', `Language has been changed to ${value}`);
  };
  
  const toggleNotifications = (value: boolean) => {
    setNotificationsEnabled(value);
    saveSettings(SETTINGS_KEYS.NOTIFICATIONS, value.toString());
    
    // If turning off notifications, also turn off specific notification types
    if (!value) {
      setMarketAlertsEnabled(false);
      setWeatherAlertsEnabled(false);
      saveSettings(SETTINGS_KEYS.MARKET_ALERTS, 'false');
      saveSettings(SETTINGS_KEYS.WEATHER_ALERTS, 'false');
    }
  };
  
  const toggleMarketAlerts = (value: boolean) => {
    setMarketAlertsEnabled(value);
    saveSettings(SETTINGS_KEYS.MARKET_ALERTS, value.toString());
  };
  
  const toggleWeatherAlerts = (value: boolean) => {
    setWeatherAlertsEnabled(value);
    saveSettings(SETTINGS_KEYS.WEATHER_ALERTS, value.toString());
  };
  
  const toggleDarkMode = (value: boolean) => {
    setDarkModeEnabled(value);
    saveSettings(SETTINGS_KEYS.DARK_MODE, value.toString());
    Alert.alert('Coming Soon', 'Dark mode will be available in the next update!');
  };
  
  const toggleLocationServices = (value: boolean) => {
    setLocationServicesEnabled(value);
    saveSettings(SETTINGS_KEYS.LOCATION_SERVICES, value.toString());
  };
  
  const toggleDataSaver = (value: boolean) => {
    setDataSaverEnabled(value);
    saveSettings(SETTINGS_KEYS.DATA_SAVER, value.toString());
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear the app cache? This will not affect your personal data.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          onPress: () => {
            // Add cache clearing logic here
            Alert.alert('Cache Cleared', 'App cache has been successfully cleared.');
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholderView} />
      </View>
      
      {/* Language Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Language</Text>
        <View style={styles.optionsContainer}>
          {['English', 'සිංහල', 'தமிழ்'].map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.languageOption,
                language === lang && styles.selectedLanguageOption,
              ]}
              onPress={() => handleLanguageSelect(lang)}
            >
              <Text
                style={[
                  styles.languageText,
                  language === lang && styles.selectedLanguageText,
                ]}
              >
                {lang}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Notification Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Enable Notifications</Text>
          <Switch
            trackColor={{ false: colors.lightGray, true: colors.lightGray }}
            thumbColor={notificationsEnabled ? colors.primary : colors.gray}
            onValueChange={toggleNotifications}
            value={notificationsEnabled}
          />
        </View>
        
        <View style={[styles.settingItem, !notificationsEnabled && styles.disabledSetting]}>
          <Text style={styles.settingText}>Market Price Alerts</Text>
          <Switch
            trackColor={{ false: colors.lightGray, true: colors.lightGray }}
            thumbColor={marketAlertsEnabled ? colors.primary : colors.gray}
            onValueChange={toggleMarketAlerts}
            value={marketAlertsEnabled}
            disabled={!notificationsEnabled}
          />
        </View>
        
        <View style={[styles.settingItem, !notificationsEnabled && styles.disabledSetting]}>
          <Text style={styles.settingText}>Weather Alerts</Text>
          <Switch
            trackColor={{ false: colors.lightGray, true: colors.lightGray }}
            thumbColor={weatherAlertsEnabled ? colors.primary : colors.gray}
            onValueChange={toggleWeatherAlerts}
            value={weatherAlertsEnabled}
            disabled={!notificationsEnabled}
          />
        </View>
      </View>
      
      {/* App Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Preferences</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Dark Mode</Text>
          <Switch
            trackColor={{ false: colors.lightGray, true: colors.lightGray }}
            thumbColor={darkModeEnabled ? colors.primary : colors.gray}
            onValueChange={toggleDarkMode}
            value={darkModeEnabled}
          />
        </View>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Location Services</Text>
          <Switch
            trackColor={{ false: colors.lightGray, true: colors.lightGray }}
            thumbColor={locationServicesEnabled ? colors.primary : colors.gray}
            onValueChange={toggleLocationServices}
            value={locationServicesEnabled}
          />
        </View>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Data Saver Mode</Text>
          <Switch
            trackColor={{ false: colors.lightGray, true: colors.lightGray }}
            thumbColor={dataSaverEnabled ? colors.primary : colors.gray}
            onValueChange={toggleDataSaver}
            value={dataSaverEnabled}
          />
        </View>
      </View>
      
      {/* Storage and Data */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage and Data</Text>
        <TouchableOpacity style={styles.actionButton} onPress={handleClearCache}>
          <Text style={styles.actionButtonText}>Clear Cache</Text>
        </TouchableOpacity>
      </View>
      
      {/* App Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>App Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Build Number</Text>
          <Text style={styles.infoValue}>100</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.white,
    ...shadows.small,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  placeholderView: {
    width: 24, // Same as the back button icon
  },
  section: {
    marginTop: spacing.lg,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.md,
    ...shadows.small,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  languageOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
  },
  selectedLanguageOption: {
    backgroundColor: colors.primary,
  },
  languageText: {
    fontSize: fontSizes.md,
    color: colors.text,
  },
  selectedLanguageText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  disabledSetting: {
    opacity: 0.5,
  },
  settingText: {
    fontSize: fontSizes.md,
    color: colors.text,
  },
  actionButton: {
    backgroundColor: colors.lightGray,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: fontSizes.md,
    color: colors.text,
    fontWeight: '500',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  infoLabel: {
    fontSize: fontSizes.md,
    color: colors.lightText,
  },
  infoValue: {
    fontSize: fontSizes.md,
    color: colors.text,
    fontWeight: '500',
  },
});

export default SettingsScreen; 