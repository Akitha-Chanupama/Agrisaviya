import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { colors, fontSizes, spacing, borderRadius, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';

type HelpScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Help'>;

interface FAQItem {
  question: string;
  answer: string;
  isExpanded: boolean;
}

const HelpScreen = () => {
  const navigation = useNavigation<HelpScreenNavigationProp>();
  const [supportMessage, setSupportMessage] = useState('');
  const [faqItems, setFaqItems] = useState<FAQItem[]>([
    {
      question: 'How do I create an account?',
      answer: 'To create an account, go to the Login screen and click on "Register". Fill in your details including name, email, and password, then click "Sign Up".',
      isExpanded: false,
    },
    {
      question: 'How do I list my products for sale?',
      answer: 'After logging in, go to your Profile page and select "My Products". Click on "Add New Product" and fill in the required details including product name, description, price, and images.',
      isExpanded: false,
    },
    {
      question: 'How does the weather forecast work?',
      answer: 'Our weather forecast uses data from multiple meteorological sources to provide accurate weather predictions for your location. The app automatically shows weather for your current location, but you can also select different regions.',
      isExpanded: false,
    },
    {
      question: 'What payment methods are supported?',
      answer: 'Currently, we support cash on delivery, mobile payment platforms like mCash and eZ Cash, and bank transfers. We are working on adding more payment options in future updates.',
      isExpanded: false,
    },
    {
      question: 'How do I track my orders?',
      answer: 'Go to your Profile and select "My Orders". Here you can see all your orders and their current status. Click on any order to see more details including delivery information.',
      isExpanded: false,
    },
    {
      question: 'How can I reset my password?',
      answer: 'On the login screen, click "Forgot Password". Enter your registered email, and we will send you a password reset link. Follow the instructions in the email to create a new password.',
      isExpanded: false,
    },
  ]);

  const toggleFAQ = (index: number) => {
    const updatedFaqItems = [...faqItems];
    updatedFaqItems[index].isExpanded = !updatedFaqItems[index].isExpanded;
    setFaqItems(updatedFaqItems);
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+94771234567').catch(err => console.error('Error opening phone app:', err));
  };

  const handleSendEmail = () => {
    Linking.openURL('mailto:support@agrisaviya.com').catch(err => console.error('Error opening mail client:', err));
  };

  const handleSubmitMessage = () => {
    if (supportMessage.trim().length === 0) {
      Alert.alert('Error', 'Please enter a message before submitting.');
      return;
    }
    
    Alert.alert(
      'Message Sent',
      'Thank you for your message. Our support team will get back to you within 24 hours.',
      [{ text: 'OK', onPress: () => setSupportMessage('') }]
    );
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/94771234567').catch(err => console.error('Error opening WhatsApp:', err));
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
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.placeholderView} />
      </View>

      {/* Get Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Need Help?</Text>
        <Text style={styles.paragraph}>
          Our support team is here to help you with any questions or issues you may have.
          Choose a support option below:
        </Text>

        <View style={styles.supportOptions}>
          <TouchableOpacity style={styles.supportOption} onPress={handleCallSupport}>
            <View style={styles.supportIconContainer}>
              <Ionicons name="call" size={24} color={colors.white} />
            </View>
            <Text style={styles.supportOptionText}>Call Support</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.supportOption} onPress={handleSendEmail}>
            <View style={styles.supportIconContainer}>
              <Ionicons name="mail" size={24} color={colors.white} />
            </View>
            <Text style={styles.supportOptionText}>Email Support</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.supportOption} onPress={handleWhatsApp}>
            <View style={styles.supportIconContainer}>
              <Ionicons name="logo-whatsapp" size={24} color={colors.white} />
            </View>
            <Text style={styles.supportOptionText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Support Message */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Send a Message</Text>
        <TextInput
          style={styles.messageInput}
          placeholder="Describe your issue or question..."
          value={supportMessage}
          onChangeText={setSupportMessage}
          multiline
          numberOfLines={4}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSubmitMessage}>
          <Text style={styles.sendButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>

      {/* FAQs Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        
        {faqItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.faqItem}
            onPress={() => toggleFAQ(index)}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{item.question}</Text>
              <Ionicons
                name={item.isExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.primary}
              />
            </View>
            
            {item.isExpanded && (
              <Text style={styles.faqAnswer}>{item.answer}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* User Guides */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Guides</Text>
        
        <TouchableOpacity style={styles.guideItem}>
          <Ionicons name="document-text" size={24} color={colors.primary} style={styles.guideIcon} />
          <View style={styles.guideContent}>
            <Text style={styles.guideTitle}>Getting Started Guide</Text>
            <Text style={styles.guideDescription}>Learn the basics of using AgriSaviya app</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.lightText} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.guideItem}>
          <Ionicons name="document-text" size={24} color={colors.primary} style={styles.guideIcon} />
          <View style={styles.guideContent}>
            <Text style={styles.guideTitle}>Selling Products Guide</Text>
            <Text style={styles.guideDescription}>Learn how to list and sell your produce</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.lightText} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.guideItem}>
          <Ionicons name="document-text" size={24} color={colors.primary} style={styles.guideIcon} />
          <View style={styles.guideContent}>
            <Text style={styles.guideTitle}>Weather Features Guide</Text>
            <Text style={styles.guideDescription}>How to use weather forecasts effectively</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.lightText} />
        </TouchableOpacity>
      </View>

      {/* Support Hours */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support Hours</Text>
        <View style={styles.supportHoursContainer}>
          <View style={styles.supportHoursItem}>
            <Text style={styles.supportHoursDay}>Monday - Friday:</Text>
            <Text style={styles.supportHoursTime}>8:00 AM - 8:00 PM</Text>
          </View>
          <View style={styles.supportHoursItem}>
            <Text style={styles.supportHoursDay}>Saturday:</Text>
            <Text style={styles.supportHoursTime}>9:00 AM - 5:00 PM</Text>
          </View>
          <View style={styles.supportHoursItem}>
            <Text style={styles.supportHoursDay}>Sunday:</Text>
            <Text style={styles.supportHoursTime}>10:00 AM - 3:00 PM</Text>
          </View>
        </View>
        <Text style={styles.supportNote}>
          * All times are in Sri Lanka Standard Time (GMT+5:30)
        </Text>
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
    width: 24,
  },
  section: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
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
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  supportOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  supportOption: {
    alignItems: 'center',
    flex: 1,
  },
  supportIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  supportOptionText: {
    fontSize: fontSizes.sm,
    color: colors.text,
    textAlign: 'center',
  },
  messageInput: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSizes.md,
    color: colors.text,
    backgroundColor: colors.white,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    alignSelf: 'center',
  },
  sendButtonText: {
    color: colors.white,
    fontSize: fontSizes.md,
    fontWeight: 'bold',
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    paddingVertical: spacing.md,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  faqAnswer: {
    fontSize: fontSizes.md,
    color: colors.lightText,
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  guideIcon: {
    marginRight: spacing.md,
  },
  guideContent: {
    flex: 1,
  },
  guideTitle: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  guideDescription: {
    fontSize: fontSizes.sm,
    color: colors.lightText,
  },
  supportHoursContainer: {
    marginVertical: spacing.md,
  },
  supportHoursItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  supportHoursDay: {
    fontSize: fontSizes.md,
    color: colors.text,
    fontWeight: '600',
  },
  supportHoursTime: {
    fontSize: fontSizes.md,
    color: colors.text,
  },
  supportNote: {
    fontSize: fontSizes.sm,
    color: colors.lightText,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
});

export default HelpScreen; 