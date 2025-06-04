import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { colors, fontSizes, spacing, borderRadius, shadows } from '../theme';
import Button from '../components/Button';
import { Ionicons } from '@expo/vector-icons';

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen = () => {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleResetPassword = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setResetSent(true);
    }, 1500);
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Image
            source={{ uri: 'https://gratisography.com/wp-content/uploads/2024/11/gratisography-augmented-reality-800x525.jpg' }}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            {resetSent 
              ? "Password reset link has been sent to your email" 
              : "Enter your email address to receive a password reset link"}
          </Text>
        </View>

        <View style={styles.formContainer}>
          {!resetSent ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <Button
                title="Reset Password"
                onPress={handleResetPassword}
                loading={loading}
                style={styles.resetButton}
              />
            </>
          ) : (
            <>
              <View style={styles.successMessage}>
                <Text style={styles.successText}>
                  We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
                </Text>
              </View>
              
              <Button
                title="Back to Login"
                onPress={handleBackToLogin}
                style={styles.resetButton}
              />
            </>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={styles.backButtonContainer}
        onPress={handleBackToLogin}
      >
        <View style={styles.backButtonContent}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
          <Text style={styles.backButtonText}>Back to Login</Text>
        </View>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingTop: 40,
    marginTop: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
    paddingHorizontal: spacing.xl,
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
  subtitle: {
    fontSize: fontSizes.md,
    color: colors.lightText,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSizes.sm,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSizes.md,
    color: colors.text,
    backgroundColor: colors.lightGray,
  },
  resetButton: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  successMessage: {
    padding: spacing.lg,
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
  },
  successText: {
    fontSize: fontSizes.md,
    color: colors.text,
    lineHeight: 22,
  },
  backButtonContainer: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.round,
    padding: spacing.sm,
    ...shadows.medium,
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  backButtonText: {
    fontSize: fontSizes.md,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
});

export default ForgotPasswordScreen; 