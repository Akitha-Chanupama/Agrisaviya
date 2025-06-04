import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Bid, BidOffer } from '../types';
import { colors, fontSizes, spacing, borderRadius } from '../theme';
import { formatCurrency } from '../utils';
import { Ionicons } from '@expo/vector-icons';
import { getBidById, placeBidOffer } from '../utilities/firestoreUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EMAIL_KEY = 'user_email';

type BidDetailsScreenRouteProp = RouteProp<RootStackParamList, 'BidDetails'>;
type BidDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BidDetails'>;

const BidDetailsScreen = () => {
  const route = useRoute<BidDetailsScreenRouteProp>();
  const navigation = useNavigation<BidDetailsScreenNavigationProp>();
  const { bidId } = route.params;
  
  const [bid, setBid] = useState<Bid | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>('');
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showBidModal, setShowBidModal] = useState(false);
  
  useEffect(() => {
    const loadBidDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load bid details
        const bidData = await getBidById(bidId);
        if (bidData) {
          setBid(bidData);
        } else {
          setError('Bid not found');
        }
        
        // Load user email
        const email = await AsyncStorage.getItem(EMAIL_KEY);
        if (email) {
          setUserEmail(email);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading bid details:', error);
        setError('Failed to load bid details. Please try again later.');
        setLoading(false);
      }
    };
    
    loadBidDetails();
  }, [bidId]);
  
  const handlePlaceBid = async () => {
    // Validate inputs
    if (!bidAmount) {
      Alert.alert('Missing Amount', 'Please enter a bid amount.');
      return;
    }
    
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid bid amount.');
      return;
    }
    
    if (!userEmail) {
      Alert.alert('Not Logged In', 'Please log in to place a bid.');
      return;
    }
    
    if (!bid) return;
    
    // Check if amount is higher than starting price
    if (amount <= bid.startPrice) {
      Alert.alert('Too Low', 'Your bid must be higher than the starting price.');
      return;
    }
    
    // Check if amount is higher than highest bid
    const highestBid = bid.bids.reduce((max, current) => 
      current.amount > max ? current.amount : max, 
      0
    );
    
    if (amount <= highestBid) {
      Alert.alert('Too Low', 'Your bid must be higher than the current highest bid.');
      return;
    }
    
    try {
      setIsPlacingBid(true);
      
      // Place the bid
      await placeBidOffer(bidId, {
        amount: amount,
        email: userEmail
      });
      
      // Refresh bid data
      const updatedBid = await getBidById(bidId);
      if (updatedBid) {
        setBid(updatedBid);
      }
      
      setShowBidModal(false);
      setBidAmount('');
      setIsPlacingBid(false);
      
      Alert.alert('Success', 'Your bid has been placed successfully!');
    } catch (error: any) {
      console.error('Error placing bid:', error);
      setIsPlacingBid(false);
      Alert.alert('Error', error.message || 'Failed to place bid. Please try again later.');
    }
  };
  
  // Get the highest bid
  const getHighestBid = () => {
    if (!bid || bid.bids.length === 0) return bid?.startPrice || 0;
    
    return bid.bids.reduce((max, current) => 
      current.amount > max ? current.amount : max, 
      0
    );
  };
  
  // Get time left
  const getTimeLeft = () => {
    if (!bid) return 'Unknown';
    
    const now = new Date();
    const dueDate = new Date(bid.dueDate);
    
    if (now > dueDate) {
      return 'Bidding ended';
    }
    
    const diffTime = Math.abs(dueDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60)) % 24;
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    } else {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    }
  };
  
  const isBidActive = () => {
    if (!bid) return false;
    const now = new Date();
    return bid.status === 'active' && now < bid.dueDate;
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading bid details...</Text>
      </View>
    );
  }
  
  if (error || !bid) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Bid not found'}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Bid Image */}
        <Image 
          source={{ uri: bid.imageUri }} 
          style={styles.bidImage}
          resizeMode="cover"
        />
        
        {/* Bid Info */}
        <View style={styles.bidInfoContainer}>
          <Text style={styles.bidName}>{bid.name}</Text>
          <View style={styles.bidStatus}>
            <Text style={[
              styles.statusText, 
              {color: bid.status === 'active' ? colors.success : colors.accent}
            ]}>
              {bid.status.toUpperCase()}
            </Text>
          </View>
          
          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Starting Price:</Text>
              <Text style={styles.priceValue}>{formatCurrency(bid.startPrice)}</Text>
            </View>
            
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Current Highest Bid:</Text>
              <Text style={styles.highestBid}>{formatCurrency(getHighestBid())}</Text>
            </View>
            
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Time Left:</Text>
              <Text style={styles.timeLeft}>{getTimeLeft()}</Text>
            </View>
          </View>
          
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Details</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category:</Text>
              <Text style={styles.detailValue}>{bid.category}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Item/Quantity:</Text>
              <Text style={styles.detailValue}>{bid.item}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Seller Contact:</Text>
              <Text style={styles.detailValue}>{bid.number}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Seller Email:</Text>
              <Text style={styles.detailValue}>{bid.email}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Start Date:</Text>
              <Text style={styles.detailValue}>{bid.startDate.toLocaleDateString()}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>End Date:</Text>
              <Text style={styles.detailValue}>{bid.dueDate.toLocaleDateString()}</Text>
            </View>
          </View>
          
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{bid.description}</Text>
          </View>
          
          {/* Bids Section */}
          <View style={styles.bidsSection}>
            <Text style={styles.sectionTitle}>Bids ({bid.bids.length})</Text>
            
            {bid.bids.length > 0 ? (
              bid.bids
                .sort((a, b) => b.amount - a.amount)
                .map((bidOffer) => (
                  <View key={bidOffer.id} style={styles.bidItem}>
                    <View style={styles.bidderInfo}>
                      <Ionicons name="person-circle" size={24} color={colors.lightText} />
                      <Text style={styles.bidderEmail}>{bidOffer.email}</Text>
                    </View>
                    <Text style={styles.bidAmount}>{formatCurrency(bidOffer.amount)}</Text>
                  </View>
                ))
            ) : (
              <Text style={styles.noBidsText}>No bids placed yet. Be the first!</Text>
            )}
          </View>
        </View>
      </ScrollView>
      
      {/* Place Bid Button */}
      {isBidActive() && (
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={styles.placeBidButton}
            onPress={() => setShowBidModal(true)}
          >
            <Text style={styles.placeBidButtonText}>Place a Bid</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Bid Modal */}
      <Modal
        visible={showBidModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBidModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Place a Bid</Text>
              <TouchableOpacity onPress={() => setShowBidModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Current highest bid: {formatCurrency(getHighestBid())}
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Your Bid Amount (Rs)</Text>
              <TextInput
                style={styles.input}
                value={bidAmount}
                onChangeText={setBidAmount}
                keyboardType="numeric"
                placeholder="Enter amount higher than current bid"
                placeholderTextColor={colors.lightText}
              />
            </View>
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowBidModal(false)}
                disabled={isPlacingBid}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handlePlaceBid}
                disabled={isPlacingBid}
              >
                {isPlacingBid ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Bid</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    padding: spacing.xl,
  },
  errorText: {
    fontSize: fontSizes.md,
    color: colors.error || colors.accent,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  backButtonText: {
    color: colors.white,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  bidImage: {
    width: '100%',
    height: 250,
  },
  bidInfoContainer: {
    padding: spacing.lg,
  },
  bidName: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  bidStatus: {
    backgroundColor: colors.lightGray,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  statusText: {
    fontSize: fontSizes.sm,
    fontWeight: 'bold',
  },
  priceSection: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  priceLabel: {
    fontSize: fontSizes.md,
    color: colors.text,
  },
  priceValue: {
    fontSize: fontSizes.md,
    color: colors.text,
    fontWeight: '600',
  },
  highestBid: {
    fontSize: fontSizes.md,
    color: colors.primary,
    fontWeight: 'bold',
  },
  timeLeft: {
    fontSize: fontSizes.md,
    color: colors.accent,
    fontWeight: '600',
  },
  detailsSection: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    width: '40%',
    fontSize: fontSizes.md,
    color: colors.lightText,
  },
  detailValue: {
    flex: 1,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  descriptionSection: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: fontSizes.md,
    color: colors.text,
    lineHeight: 22,
  },
  bidsSection: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  bidItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  bidderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bidderEmail: {
    marginLeft: spacing.sm,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  bidAmount: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.primary,
  },
  noBidsText: {
    fontSize: fontSizes.md,
    color: colors.lightText,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  placeBidButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  placeBidButtonText: {
    color: colors.white,
    fontSize: fontSizes.md,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: fontSizes.md,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.lightGray,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.text,
    fontWeight: 'bold',
  },
  submitButton: {
    flex: 2,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  submitButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default BidDetailsScreen; 