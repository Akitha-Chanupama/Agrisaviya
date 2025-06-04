import React, { useState, useEffect } from 'react';
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
import { colors, fontSizes, spacing, borderRadius } from '../theme';
import Button from '../components/Button';
import AuthStatus from '../components/AuthStatus';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../utilities/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveUserData, saveAuthToken } from '../utilities/authUtils';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

// Keys for AsyncStorage
const EMAIL_KEY = 'auth_email';
const PASSWORD_KEY = 'auth_password';
const REMEMBER_ME_KEY = 'auth_remember_me';

const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load saved credentials on component mount
  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const savedRememberMe = await AsyncStorage.getItem(REMEMBER_ME_KEY);
      
      if (savedRememberMe === 'true') {
        const savedEmail = await AsyncStorage.getItem(EMAIL_KEY);
        const savedPassword = await AsyncStorage.getItem(PASSWORD_KEY);
        
        if (savedEmail) setEmail(savedEmail);
        if (savedPassword) setPassword(savedPassword);
        setRememberMe(true);
      }
    } catch (error) {
      console.log('Error loading saved credentials:', error);
    }
  };

  const saveCredentials = async () => {
    try {
      if (rememberMe) {
        await AsyncStorage.setItem(EMAIL_KEY, email);
        await AsyncStorage.setItem(PASSWORD_KEY, password);
        await AsyncStorage.setItem(REMEMBER_ME_KEY, 'true');
      } else {
        // Clear saved credentials if remember me is unchecked
        await AsyncStorage.removeItem(EMAIL_KEY);
        await AsyncStorage.removeItem(PASSWORD_KEY);
        await AsyncStorage.setItem(REMEMBER_ME_KEY, 'false');
      }
    } catch (error) {
      console.log('Error saving credentials:', error);
    }
  };

  const handleLogin = async () => {
    // Basic validation
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    
    setLoading(true);
    
    try {
      // Save credentials if remember me is checked
      await saveCredentials();
      
      // Sign in with email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Save user data to AsyncStorage
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      };
      
      await saveUserData(userData);
      
      // Get ID token and save it
      const token = await user.getIdToken();
      await saveAuthToken(token);
      
      setLoading(false);
      navigation.replace('Main');
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Login Failed', error.message || 'Invalid email or password');
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  const handleForgotPassword = () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    
    setLoading(true);
    
    sendPasswordResetEmail(auth, email)
      .then(() => {
        setLoading(false);
        Alert.alert('Password Reset', 'Password reset email has been sent to your email address');
      })
      .catch(error => {
        setLoading(false);
        Alert.alert('Error', error.message || 'Failed to send password reset email');
      });
  };

  const toggleRememberMe = () => {
    setRememberMe(!rememberMe);
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
        <AuthStatus />
        
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>AgriSaviya</Text>
          <Text style={styles.subtitle}>Login to your account</Text>
        </View>

        <View style={styles.formContainer}>
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.rememberMeContainer}>
            <TouchableOpacity 
              style={styles.checkboxContainer} 
              onPress={toggleRememberMe}
            >
              <View style={[
                styles.checkbox, 
                rememberMe ? styles.checkboxChecked : {}
              ]}>
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.rememberMeText}>Remember Me</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Login"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginButton}
          />

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
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
  rememberMeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  rememberMeText: {
    color: colors.text,
    fontSize: fontSizes.sm,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: fontSizes.sm,
  },
  loginButton: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  registerText: {
    color: colors.lightText,
    fontSize: fontSizes.sm,
  },
  registerLink: {
    color: colors.primary,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
});

export default LoginScreen; 