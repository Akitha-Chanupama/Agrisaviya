import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Bid, User } from '../types';
import { colors, fontSizes, spacing, borderRadius, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { getAllBids, getBidsByEmail, seedProductsCollection } from '../utilities/firestoreUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatCurrency } from '../utils';
import { PRODUCTS } from '../data';
import { auth } from '../utilities/firebaseConfig';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../utilities/firebaseConfig';
import { logoutUser, getSavedUserData } from '../utilities/authUtils';
import { seedAllData } from '../utilities/seedAllData';

type ProfileNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

const USER_EMAIL_KEY = 'user_email';
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

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileNavigationProp>();
  const [userEmail, setUserEmail] = useState<string>('');
  const [userBids, setUserBids] = useState<Bid[]>([]);
  const [allBids, setAllBids] = useState<Bid[]>([]);
  const [loadingBids, setLoadingBids] = useState(true);
  const [user, setUser] = useState<User>(defaultUser);
  const [loadingUser, setLoadingUser] = useState(true);

  // Menu items to display
  const menuItems = [
    {
      id: 'personal',
      title: 'Personal Information',
      icon: 'person-outline',
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      id: 'orders',
      title: 'My Orders',
      icon: 'cart-outline',
      onPress: () => navigation.navigate('Orders'),
    },
    {
      id: 'offers',
      title: 'My Offers',
      icon: 'briefcase-outline',
      onPress: () => navigation.navigate('MyOffers'),
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'settings-outline',
      onPress: () => navigation.navigate('Settings'),
    },
    {
      id: 'about',
      title: 'About AgriSaviya',
      icon: 'information-circle-outline',
      onPress: () => navigation.navigate('About'),
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: 'help-circle-outline',
      onPress: () => navigation.navigate('Help'),
    },
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (userEmail) {
      loadBids();
    }
  }, [userEmail]);

  const loadUserData = async () => {
    try {
      setLoadingUser(true);
      
      // Try to get current authenticated user
      const currentUser = auth.currentUser;
      
      if (currentUser && currentUser.uid) {
        // Get stored email or use auth email
        let email = currentUser.email || '';
        setUserEmail(email);
        
        // Save email to AsyncStorage for other components
        await AsyncStorage.setItem(USER_EMAIL_KEY, email);
        
        // Try to get user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userObj: User = {
              id: currentUser.uid,
              name: userData.name || currentUser.displayName || 'User',
              email: email,
              phone: userData.phone || '',
              address: userData.address || '',
              avatar: userData.avatar || 'https://placehold.co/200x200/png',
            };
            
            setUser(userObj);
            
            // Also save to AsyncStorage
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(userObj));
          } else {
            // No Firestore document, try to use auth data
            const userObj: User = {
              id: currentUser.uid,
              name: currentUser.displayName || 'User',
              email: email,
              phone: '',
              address: '',
              avatar: currentUser.photoURL || 'https://placehold.co/200x200/png',
            };
            
            setUser(userObj);
          }
        } catch (error) {
          console.error('Error getting user data from Firestore:', error);
        }
      } else {
        // Not authenticated in Firebase, try to load from AsyncStorage
        const email = await AsyncStorage.getItem(USER_EMAIL_KEY);
        if (email) {
          setUserEmail(email);
        }
        
        const savedUserData = await getSavedUserData();
        if (savedUserData) {
          const userObj: User = {
            id: savedUserData.uid || 'user1',
            name: savedUserData.displayName || 'User',
            email: savedUserData.email || email || '',
            phone: savedUserData.phone || '',
            address: '',
            avatar: savedUserData.photoURL || 'https://placehold.co/200x200/png',
          };
          
          setUser(userObj);
        }
      }
      
      setLoadingUser(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      setLoadingUser(false);
    }
  };

  const loadBids = async () => {
    try {
      setLoadingBids(true);
      
      // Load all bids
      const allBidsData = await getAllBids();
      setAllBids(allBidsData);
      
      // Load user's bids
      const userBidsData = await getBidsByEmail(userEmail);
      setUserBids(userBidsData);
      
      setLoadingBids(false);
    } catch (error) {
      console.error('Error loading bids:', error);
      setLoadingBids(false);
    }
  };

  const handleBidPress = (bidId: string) => {
    navigation.navigate('BidDetails', { bidId });
  };

  const renderBidItem = ({ item }: { item: Bid }) => (
    <TouchableOpacity
      style={styles.bidCard}
      onPress={() => handleBidPress(item.id!)}
    >
      <Image 
        source={{ uri: item.imageUri }} 
        style={styles.bidImage}
        defaultSource={{ uri: 'https://placehold.co/200x120/png' }}
      />
      <View style={styles.bidInfo}>
        <Text style={styles.bidName}>{item.name}</Text>
        <Text style={styles.bidPrice}>{formatCurrency(item.startPrice)}</Text>
        <View style={styles.bidMeta}>
          <Text style={styles.bidOffers}>
            <Ionicons name="people" size={12} color={colors.lightText} /> {item.bids.length} offers
          </Text>
          <Text style={styles.bidTimeLeft}>
            {new Date() > item.dueDate 
              ? 'Ended' 
              : `${Math.ceil((item.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderMenuItem = (item: typeof menuItems[0]) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={item.onPress}
    >
      <Ionicons 
        name={item.icon as any} 
        size={24} 
        color={colors.primary}
        style={styles.menuIcon} 
      />
      <Text style={styles.menuText}>{item.title}</Text>
      <Ionicons 
        name="chevron-forward" 
        size={20} 
        color={colors.lightText} 
      />
    </TouchableOpacity>
  );

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  const handleRefreshBids = () => {
    loadBids();
  };

  const handleSeedProducts = async () => {
    try {
      Alert.alert("Seeding Data", "Starting to seed all data to Firebase...");
      
      // Call the seedAllData function with proper error handling
      const result = await seedAllData();
      
      if (result) {
        Alert.alert("Success", "All data has been successfully added to Firebase!");
      } else {
        Alert.alert("Error", "Failed to seed data to Firebase. Check console for details.");
      }
    } catch (error) {
      console.error('Error seeding data:', error);
      Alert.alert("Error", "Failed to seed data to Firebase. Check console for details.");
    }
  };

  if (loadingUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* User Info Section */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: user.avatar }} 
              style={styles.avatar} 
              defaultSource={require('../assets/images/logo.png')}
            />
            <TouchableOpacity style={styles.editAvatarButton} onPress={() => navigation.navigate('EditProfile')}>
              <Ionicons name="camera" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userDetails}>{user.email}</Text>
          <Text style={styles.userDetails}>{user.phone}</Text>
          {user.address && <Text style={styles.userDetails}>{user.address}</Text>}
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Wishlist</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{new Date().getFullYear()}</Text>
            <Text style={styles.statLabel}>Joined</Text>
          </View>
        </View>

        {/* Your Bids Section */}
        <View style={styles.bidsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Bids</Text>
            <TouchableOpacity onPress={handleRefreshBids}>
              <Ionicons name="refresh" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {loadingBids ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : userBids.length > 0 ? (
            <FlatList
              data={userBids}
              renderItem={renderBidItem}
              keyExtractor={(item) => item.id || ''}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bidsList}
            />
          ) : (
            <Text style={styles.emptyText}>You haven't created any bids yet</Text>
          )}
        </View>

        {/* All Bids Section */}
        <View style={styles.bidsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Active Bids</Text>
            <TouchableOpacity onPress={handleRefreshBids}>
              <Ionicons name="refresh" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {loadingBids ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : allBids.length > 0 ? (
            <FlatList
              data={allBids.filter(bid => bid.status === 'active')}
              renderItem={renderBidItem}
              keyExtractor={(item) => item.id || ''}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bidsList}
            />
          ) : (
            <Text style={styles.emptyText}>No active bids available</Text>
          )}
        </View>

        {/* Menu Section */}
        <View style={styles.menuContainer}>
          {menuItems.map(renderMenuItem)}
        </View>

        {/* Admin Functions */}
        <View style={styles.adminSection}>
          <Text style={styles.sectionTitle}>Admin Functions</Text>
          <TouchableOpacity style={styles.adminButton} onPress={handleSeedProducts}>
            <Ionicons name="cloud-upload" size={20} color={colors.white} />
            <Text style={styles.adminButtonText}>Seed All Data to Firebase</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons 
            name="log-out-outline" 
            size={24} 
            color={colors.error} 
            style={styles.logoutIcon}
          />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    backgroundColor: colors.white,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.small,
  },
  avatarContainer: {
    marginBottom: spacing.md,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.white,
  },
  editAvatarButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  userName: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userDetails: {
    fontSize: fontSizes.md,
    color: colors.lightText,
    marginBottom: spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginTop: spacing.md,
    padding: spacing.md,
    justifyContent: 'space-around',
    ...shadows.small,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: fontSizes.sm,
    color: colors.lightText,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.gray,
    marginHorizontal: spacing.md,
  },
  menuContainer: {
    backgroundColor: colors.white,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.small,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  menuIcon: {
    marginRight: spacing.md,
  },
  menuText: {
    flex: 1,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    marginHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    ...shadows.small,
  },
  logoutIcon: {
    marginRight: spacing.sm,
  },
  logoutText: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.error,
  },
  bidsSection: {
    marginTop: spacing.md,
    backgroundColor: colors.white,
    padding: spacing.md,
    ...shadows.small,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  bidsList: {
    paddingVertical: spacing.sm,
  },
  emptyText: {
    fontSize: fontSizes.md,
    color: colors.lightText,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  bidCard: {
    width: 200,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    marginRight: spacing.md,
    overflow: 'hidden',
    ...shadows.small,
  },
  bidImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  bidInfo: {
    padding: spacing.sm,
  },
  bidName: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  bidPrice: {
    fontSize: fontSizes.md,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  bidMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bidOffers: {
    fontSize: fontSizes.xs,
    color: colors.lightText,
  },
  bidTimeLeft: {
    fontSize: fontSizes.xs,
    color: colors.accent,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  adminSection: {
    marginTop: spacing.md,
    backgroundColor: colors.white,
    padding: spacing.md,
    ...shadows.small,
  },
  adminButton: {
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  adminButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    marginLeft: spacing.sm,
  },
});

export default ProfileScreen; 