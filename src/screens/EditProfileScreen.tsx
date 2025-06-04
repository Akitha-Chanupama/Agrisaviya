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
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, User } from '../types';
import { colors, fontSizes, spacing, borderRadius, shadows } from '../theme';
import Button from '../components/Button';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { auth, db, storage, uploadFile } from '../utilities/firebaseConfig';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import * as FileSystem from 'expo-file-system';

type EditProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditProfile'>;

const USER_KEY = 'user_data';

// Default user data as fallback
const defaultUser: User = {
  id: 'user1',
  name: 'Kasun Perera',
  email: 'kasun.perera@example.com',
  phone: '+94 77 123 4567',
  address: '123 Temple Road, Colombo',
  avatar: 'https://placehold.co/200x200/png',
};

const EditProfileScreen = () => {
  const navigation = useNavigation<EditProfileScreenNavigationProp>();
  const [user, setUser] = useState<User>(defaultUser);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [avatar, setAvatar] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);

      // Check if user is logged in through Firebase
      const currentUser = auth.currentUser;
      
      if (currentUser && currentUser.uid) {
        // Try to get user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userObj: User = {
              id: currentUser.uid,
              name: userData.name || currentUser.displayName || 'User',
              email: currentUser.email || '',
              phone: userData.phone || '',
              address: userData.address || '',
              avatar: userData.avatar || currentUser.photoURL || 'https://placehold.co/200x200/png',
            };
            
            setUser(userObj);
            
            // Set form states
            setName(userObj.name);
            setEmail(userObj.email);
            setPhone(userObj.phone);
            setAddress(userObj.address || '');
            setAvatar(userObj.avatar || '');

            // Also save to AsyncStorage for offline access
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(userObj));
          } else {
            // No Firestore document, try to use auth data
            const userObj: User = {
              id: currentUser.uid,
              name: currentUser.displayName || 'User',
              email: currentUser.email || '',
              phone: '',
              address: '',
              avatar: currentUser.photoURL || 'https://placehold.co/200x200/png',
            };
            
            setUser(userObj);
            setName(userObj.name);
            setEmail(userObj.email || '');
            setPhone('');
            setAddress('');
            setAvatar(userObj.avatar || '');
          }
        } catch (error) {
          console.error('Error getting user data from Firestore:', error);
          // Fall back to AsyncStorage
          await loadFromAsyncStorage();
        }
      } else {
        // Not authenticated in Firebase, try to load from AsyncStorage
        await loadFromAsyncStorage();
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load user data. Please try again.');
    }
  };

  const loadFromAsyncStorage = async () => {
    const userData = await AsyncStorage.getItem(USER_KEY);
    
    if (userData) {
      const parsedUser = JSON.parse(userData) as User;
      setUser(parsedUser);
      
      // Set form states
      setName(parsedUser.name);
      setEmail(parsedUser.email);
      setPhone(parsedUser.phone);
      setAddress(parsedUser.address || '');
      setAvatar(parsedUser.avatar || '');
    } else {
      // If no user data in storage, use default user
      setName(defaultUser.name);
      setEmail(defaultUser.email);
      setPhone(defaultUser.phone);
      setAddress(defaultUser.address || '');
      setAvatar(defaultUser.avatar || '');
    }
  };

  const saveUserData = async () => {
    try {
      setSaving(true);
      
      // Validate inputs
      if (!name.trim() || !email.trim() || !phone.trim()) {
        Alert.alert('Error', 'Name, email, and phone number are required fields.');
        setSaving(false);
        return;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        Alert.alert('Error', 'Please enter a valid email address.');
        setSaving(false);
        return;
      }
      
      const updatedUser: User = {
        ...user,
        name,
        email,
        phone,
        address,
        avatar,
      };

      // Check if user is logged in through Firebase
      const currentUser = auth.currentUser;
      
      if (currentUser && currentUser.uid) {
        // Update Firebase Auth profile
        try {
          await updateProfile(currentUser, {
            displayName: name,
            photoURL: avatar
          });
          
          // Update or create user document in Firestore
          const userRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            // Update existing document
            await updateDoc(userRef, {
              name: name,
              phone: phone,
              address: address,
              avatar: avatar,
              updatedAt: new Date()
            });
          } else {
            // Create new document
            await setDoc(userRef, {
              name: name,
              email: email,
              phone: phone,
              address: address,
              avatar: avatar,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        } catch (error) {
          console.error('Error updating Firebase profile:', error);
          Alert.alert('Warning', 'Profile updated locally but failed to update on the server. Some changes may not persist after logout.');
        }
      }
      
      // Also save to AsyncStorage for offline access
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      
      setSaving(false);
      Alert.alert(
        'Success',
        'Profile updated successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error saving user data:', error);
      setSaving(false);
      Alert.alert('Error', 'Failed to save user data. Please try again.');
    }
  };

  const handleSelectImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'You need to grant permission to access your photos.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        setImageLoading(true);
        
        try {
          // Get the image uri
          const uri = result.assets[0].uri;
          
          // Set avatar directly from local URI since storage is disabled
          setAvatar(uri);
          console.log('Using local image URI (storage is disabled)');
        } catch (error) {
          console.error('Error processing image:', error);
          // Fallback to local URI
          setAvatar(result.assets[0].uri);
          Alert.alert('Warning', 'Could not process image properly. Using local version.');
        }
        
        setImageLoading(false);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      setImageLoading(false);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'You need to grant permission to access your camera.');
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        setImageLoading(true);
        
        try {
          // Get the image uri
          const uri = result.assets[0].uri;
          
          // Set avatar directly from local URI since storage is disabled
          setAvatar(uri);
          console.log('Using local image URI (storage is disabled)');
        } catch (error) {
          console.error('Error processing image:', error);
          // Fallback to local URI
          setAvatar(result.assets[0].uri);
          Alert.alert('Warning', 'Could not process image properly. Using local version.');
        }
        
        setImageLoading(false);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      setImageLoading(false);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileImageContainer}>
          {imageLoading ? (
            <View style={styles.profileImage}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <Image
              source={{ uri: avatar || 'https://placehold.co/200x200/png' }}
              style={styles.profileImage}
              defaultSource={{ uri: 'https://placehold.co/200x200/png' }}
            />
          )}
          <View style={styles.imageButtons}>
            <TouchableOpacity
              style={styles.imageButton}
              onPress={handleSelectImage}
            >
              <Ionicons name="images" size={16} color={colors.white} />
              <Text style={styles.imageButtonText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.imageButton}
              onPress={handleTakePhoto}
            >
              <Ionicons name="camera" size={16} color={colors.white} />
              <Text style={styles.imageButtonText}>Camera</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor={colors.lightText}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email address"
              placeholderTextColor={colors.lightText}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!auth.currentUser} // Disable email editing if logged in with Firebase
            />
            {auth.currentUser && (
              <Text style={styles.helperText}>Email cannot be changed when using Firebase authentication</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              placeholderTextColor={colors.lightText}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter your address"
              placeholderTextColor={colors.lightText}
              multiline
              numberOfLines={3}
            />
          </View>

          <Button
            title={saving ? 'Saving...' : 'Save Changes'}
            onPress={saveUserData}
            loading={saving}
            disabled={saving}
            style={styles.saveButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    marginTop: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.white,
    ...shadows.small,
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: spacing.md,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    marginHorizontal: spacing.sm,
  },
  imageButtonText: {
    color: colors.white,
    marginLeft: spacing.xs,
    fontSize: fontSizes.sm,
  },
  formContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.small,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.md,
    color: colors.text,
    backgroundColor: colors.white,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: spacing.md,
  },
  helperText: {
    fontSize: fontSizes.xs,
    color: colors.lightText,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
});

export default EditProfileScreen; 