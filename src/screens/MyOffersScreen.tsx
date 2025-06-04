import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Bid } from '../types';
import { colors, fontSizes, spacing, borderRadius, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../utils';
import { auth, db } from '../utilities/firebaseConfig';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBidsByEmail } from '../utilities/firestoreUtils';

type MyOffersScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MyOffers'>;

const USER_EMAIL_KEY = 'user_email';

const MyOffersScreen = () => {
  const navigation = useNavigation<MyOffersScreenNavigationProp>();
  const [userBids, setUserBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'myBids' | 'myOffers'>('myBids');

  useEffect(() => {
    loadUserEmail();
  }, []);

  useEffect(() => {
    if (userEmail) {
      loadBids();
    }
  }, [userEmail]);

  const loadUserEmail = async () => {
    try {
      // Try to get from Firebase Auth first
      const currentUser = auth.currentUser;
      
      if (currentUser && currentUser.email) {
        setUserEmail(currentUser.email);
      } else {
        // Fall back to AsyncStorage
        const email = await AsyncStorage.getItem(USER_EMAIL_KEY);
        if (email) {
          setUserEmail(email);
        } else {
          setLoading(false);
          Alert.alert('Error', 'User email not found. Please log in again.');
          navigation.navigate('Login');
        }
      }
    } catch (error) {
      console.error('Error loading user email:', error);
      setLoading(false);
    }
  };

  const loadBids = async () => {
    try {
      setLoading(true);
      
      // Load user's bids
      const userBidsData = await getBidsByEmail(userEmail);
      setUserBids(userBidsData);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading bids:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load bids. Please try again.');
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
          <Text 
            style={[
              styles.bidStatus,
              { color: item.status === 'active' ? colors.success : 
                     item.status === 'closed' ? colors.warning : colors.error }
            ]}
          >
            {item.status}
          </Text>
        </View>
        <View style={styles.bidFooter}>
          <Text style={styles.bidDate}>
            Created: {item.createdAt?.toLocaleDateString?.() || 'Unknown date'}
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

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="briefcase-outline" size={60} color={colors.lightGray} />
      <Text style={styles.emptyText}>
        {activeTab === 'myBids' 
          ? "You haven't created any bids yet" 
          : "You haven't made any offers on bids yet"}
      </Text>
      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => navigation.navigate('Main')}
      >
        <Text style={styles.createButtonText}>
          {activeTab === 'myBids' ? 'Create New Bid' : 'Explore Bids'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Offers</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadBids}
        >
          <Ionicons name="refresh" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'myBids' && styles.activeTab]}
          onPress={() => setActiveTab('myBids')}
        >
          <Text style={[styles.tabText, activeTab === 'myBids' && styles.activeTabText]}>
            My Bids
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'myOffers' && styles.activeTab]}
          onPress={() => setActiveTab('myOffers')}
        >
          <Text style={[styles.tabText, activeTab === 'myOffers' && styles.activeTabText]}>
            My Offers
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your offers...</Text>
        </View>
      ) : (
        <FlatList
          data={activeTab === 'myBids' 
            ? userBids.filter(bid => bid.email === userEmail)
            : userBids.filter(bid => bid.bids.some(offer => offer.email === userEmail))
          }
          renderItem={renderBidItem}
          keyExtractor={item => item.id || ''}
          contentContainerStyle={styles.bidsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyList}
        />
      )}

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.navigate('Main')}
      >
        <Ionicons name="add" size={24} color={colors.white} />
      </TouchableOpacity>
    </View>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
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
  refreshButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    ...shadows.small,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: fontSizes.md,
    color: colors.lightText,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  bidsList: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  bidCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.small,
  },
  bidImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  bidInfo: {
    padding: spacing.md,
  },
  bidName: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  bidPrice: {
    fontSize: fontSizes.md,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  bidMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  bidOffers: {
    fontSize: fontSizes.sm,
    color: colors.lightText,
  },
  bidStatus: {
    fontSize: fontSizes.sm,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  bidFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: spacing.sm,
  },
  bidDate: {
    fontSize: fontSizes.sm,
    color: colors.lightText,
  },
  bidTimeLeft: {
    fontSize: fontSizes.sm,
    color: colors.accent,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    minHeight: 400,
  },
  emptyText: {
    fontSize: fontSizes.lg,
    color: colors.lightText,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  createButtonText: {
    color: colors.white,
    fontSize: fontSizes.md,
    fontWeight: 'bold',
  },
  floatingButton: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium,
  },
});

export default MyOffersScreen; 