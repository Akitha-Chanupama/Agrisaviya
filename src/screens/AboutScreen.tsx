import React from 'react';
import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { colors, fontSizes, spacing, borderRadius, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';

type AboutScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'About'>;

const AboutScreen = () => {
  const navigation = useNavigation<AboutScreenNavigationProp>();

  const handleSocialLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Error opening URL:', err));
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@agrisaviya.com').catch(err => console.error('Error opening mail client:', err));
  };

  const handlePhone = () => {
    Linking.openURL('tel:+94771234567').catch(err => console.error('Error opening phone app:', err));
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
        <Text style={styles.headerTitle}>About AgriSaviya</Text>
        <View style={styles.placeholderView} />
      </View>

      {/* App Logo and Description */}
      <View style={styles.logoContainer}>
        <Image
          // source={require('../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appVersion}>Version 1.0.0</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Mission</Text>
        <Text style={styles.paragraph}>
          AgriSaviya is dedicated to empowering Sri Lankan farmers with technology that helps them improve productivity, 
          connect with markets, and adapt to changing climate conditions.
        </Text>
        <Text style={styles.paragraph}>
          Our mission is to bridge the gap between traditional farming practices and modern agricultural technologies, 
          making sustainable farming accessible to everyone.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Features</Text>
        
        <View style={styles.featureItem}>
          <View style={styles.featureIconContainer}>
            <Ionicons name="cart" size={24} color={colors.primary} />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Marketplace</Text>
            <Text style={styles.featureDescription}>
              Buy and sell agricultural products directly, cutting out middlemen and ensuring fair prices.
            </Text>
          </View>
        </View>
        
        <View style={styles.featureItem}>
          <View style={styles.featureIconContainer}>
            <Ionicons name="cloud" size={24} color={colors.primary} />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Weather Forecasts</Text>
            <Text style={styles.featureDescription}>
              Access localized weather data to plan farming activities more effectively.
            </Text>
          </View>
        </View>
        
        <View style={styles.featureItem}>
          <View style={styles.featureIconContainer}>
            <Ionicons name="bar-chart" size={24} color={colors.primary} />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Market Prices</Text>
            <Text style={styles.featureDescription}>
              Get real-time updates on market prices for various agricultural products.
            </Text>
          </View>
        </View>
        
        <View style={styles.featureItem}>
          <View style={styles.featureIconContainer}>
            <Ionicons name="newspaper" size={24} color={colors.primary} />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Agricultural News</Text>
            <Text style={styles.featureDescription}>
              Stay informed with the latest news, tips, and best practices in agriculture.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Team</Text>
        <Text style={styles.paragraph}>
          AgriSaviya is developed by a passionate team of technology and agriculture enthusiasts 
          based in Colombo, Sri Lanka. Our diverse team brings together expertise in software development, 
          agriculture, economics, and climate science.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Us</Text>
        
        <TouchableOpacity style={styles.contactItem} onPress={handleEmail}>
          <Ionicons name="mail" size={24} color={colors.primary} style={styles.contactIcon} />
          <Text style={styles.contactText}>support@agrisaviya.com</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.contactItem} onPress={handlePhone}>
          <Ionicons name="call" size={24} color={colors.primary} style={styles.contactIcon} />
          <Text style={styles.contactText}>+94 77 123 4567</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.contactItem} onPress={() => Linking.openURL('https://maps.app.goo.gl/JGqKqnwQJYsSjP8Y6')}>
          <Ionicons name="location" size={24} color={colors.primary} style={styles.contactIcon} />
          <Text style={styles.contactText}>123 Temple Road, Colombo, Sri Lanka</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Follow Us</Text>
        <View style={styles.socialContainer}>
          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => handleSocialLink('https://facebook.com')}
          >
            <Ionicons name="logo-facebook" size={24} color={colors.white} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => handleSocialLink('https://twitter.com')}
          >
            <Ionicons name="logo-twitter" size={24} color={colors.white} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => handleSocialLink('https://instagram.com')}
          >
            <Ionicons name="logo-instagram" size={24} color={colors.white} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => handleSocialLink('https://youtube.com')}
          >
            <Ionicons name="logo-youtube" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.copyright}>© 2023 AgriSaviya. All rights reserved.</Text>
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
    width: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: spacing.sm,
  },
  appVersion: {
    fontSize: fontSizes.md,
    color: colors.lightText,
  },
  section: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    ...shadows.small,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  paragraph: {
    fontSize: fontSizes.md,
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  featureDescription: {
    fontSize: fontSizes.sm,
    color: colors.lightText,
    lineHeight: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  contactIcon: {
    marginRight: spacing.md,
  },
  contactText: {
    fontSize: fontSizes.md,
    color: colors.text,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.sm,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyright: {
    textAlign: 'center',
    fontSize: fontSizes.sm,
    color: colors.lightText,
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
});

export default AboutScreen; 
