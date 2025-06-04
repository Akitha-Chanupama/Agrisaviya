import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { colors, fontSizes, spacing, borderRadius } from '../theme';
import Button from '../components/Button';

type LanguageSelectionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'LanguageSelection'>;

const LanguageSelectionScreen = () => {
  const navigation = useNavigation<LanguageSelectionScreenNavigationProp>();
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'si'>('en');
  
  const handleContinue = () => {
    // Here you would typically store the selected language in your app's state or context
    // For now, we just navigate to the login screen
    navigation.navigate('Login');
  };

  const LangOption = ({ code, label, flag }: { code: 'en' | 'si', label: string, flag: string }) => (
    <TouchableOpacity
      style={[
        styles.languageOption,
        selectedLanguage === code && styles.selectedLanguage,
      ]}
      onPress={() => setSelectedLanguage(code)}
    >
      <Text style={styles.flagEmoji}>{flag}</Text>
      <Text style={[
        styles.languageLabel,
        selectedLanguage === code && styles.selectedLanguageText,
      ]}>
        {label}
      </Text>
      {selectedLanguage === code && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      
      <View style={styles.header}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>AgriSaviya</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.heading}>Select your language</Text>
        <Text style={styles.subHeading}>ඔබේ භාෂාව තෝරන්න</Text>
        
        <View style={styles.languageContainer}>
          <LangOption code="en" label="English" flag="🇺🇸" />
          <LangOption code="si" label="සිංහල" flag="🇱🇰" />
        </View>
        
        <View style={styles.buttonContainer}>
          <Button
            title="Continue"
            onPress={handleContinue}
            style={styles.continueButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xxl + 20,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: spacing.md,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  heading: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  subHeading: {
    fontSize: fontSizes.lg,
    color: colors.lightText,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  languageContainer: {
    marginVertical: spacing.xl,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: borderRadius.md,
    backgroundColor: colors.lightGray,
  },
  selectedLanguage: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
    borderWidth: 2,
  },
  flagEmoji: {
    fontSize: fontSizes.xl,
    marginRight: spacing.md,
  },
  languageLabel: {
    fontSize: fontSizes.lg,
    fontWeight: '500',
    color: colors.text,
  },
  selectedLanguageText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  checkmark: {
    marginLeft: 'auto',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginTop: spacing.xl,
  },
  continueButton: {
    width: '100%',
  },
});

export default LanguageSelectionScreen; 