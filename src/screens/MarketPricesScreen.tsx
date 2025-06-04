/**
 * MarketPricesScreen Component with Bidding Feature
 * 
 * Dependencies required (install before running):
 * npm install expo-image-picker @react-native-async-storage/async-storage @react-native-community/datetimepicker
 * 
 * Note: If you encounter build errors, ensure these packages are correctly installed.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  ScrollView,
  Image,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, MarketPrice } from '../types';
import { colors, fontSizes, spacing, borderRadius } from '../theme';
import Card from '../components/Card';
import { getAllMarketPrices, getMarketPricesByMarket } from '../utilities/firestoreUtils';
import { formatCurrency } from '../utils';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addBid } from '../utilities/firestoreUtils';
import { auth, db, storage, uploadFile } from '../utilities/firebaseConfig';
import * as FileSystem from 'expo-file-system';

const USER_EMAIL_KEY = 'user_email';
const USER_NAME_KEY = 'user_name';

type MarketPricesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MarketPrices'>;

const cardShadow = {
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.1,
  shadowRadius: 3,
  elevation: 2,
};

const MarketPricesScreen = () => {
  const navigation = useNavigation<MarketPricesScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [allMarkets, setAllMarkets] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Bid modal state
  const [isBidModalVisible, setIsBidModalVisible] = useState(false);
  const [bidImage, setBidImage] = useState<string | null>(null);
  const [bidName, setBidName] = useState('');
  const [bidNumber, setBidNumber] = useState('');
  const [bidCategory, setBidCategory] = useState('');
  const [bidItem, setBidItem] = useState('');
  const [bidDescription, setBidDescription] = useState('');
  const [bidStartPrice, setBidStartPrice] = useState('');
  const [bidStartDate, setBidStartDate] = useState(new Date());
  const [bidDueDate, setBidDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 7 days from now
  const [bidEmail, setBidEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Load market prices data from Firebase
  useEffect(() => {
    const loadMarketPrices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let pricesData: MarketPrice[];
        
        if (selectedMarket) {
          // If a market is selected, fetch prices for that market
          pricesData = await getMarketPricesByMarket(selectedMarket);
        } else {
          // Otherwise fetch all prices
          pricesData = await getAllMarketPrices();
        }
        
        setMarketPrices(pricesData);
        
        // Extract unique markets
        const markets = Array.from(new Set(pricesData.map(item => item.market)));
        setAllMarkets(markets);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading market prices:', error);
        setError('Failed to load market prices. Please try again later.');
        setLoading(false);
      }
    };
    
    loadMarketPrices();
    
    // Load user email from AsyncStorage
    const loadUserEmail = async () => {
      try {
        const email = await AsyncStorage.getItem(USER_EMAIL_KEY);
        if (email) {
          setBidEmail(email);
        } else if (auth?.currentUser?.email) {
          // Use Firebase auth as fallback
          setBidEmail(auth.currentUser.email);
          // Save the email to AsyncStorage for future use
          await AsyncStorage.setItem(USER_EMAIL_KEY, auth.currentUser.email);
        }
      } catch (error) {
        console.error('Error loading user email:', error);
      }
    };
    
    loadUserEmail();
  }, [selectedMarket]);

  // Filter market prices based on search query
  const filteredMarketPrices = marketPrices.filter(item => {
    return searchQuery === '' || 
      item.productName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleMarketSelect = (market: string) => {
    setSelectedMarket(selectedMarket === market ? null : market);
  };

  const renderMarketItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.marketItem,
        selectedMarket === item && styles.selectedMarketItem,
      ]}
      onPress={() => handleMarketSelect(item)}
    >
      <Text
        style={[
          styles.marketItemText,
          selectedMarket === item && styles.selectedMarketItemText,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderMarketPriceItem = ({ item }: { item: MarketPrice }) => (
    <Card style={styles.priceCard} elevation="small">
      <View style={styles.priceCardContent}>
        <View style={styles.priceInfo}>
          <Text style={styles.productName}>{item.productName}</Text>
          <Text style={styles.marketName}>{item.market}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatCurrency(item.price)}</Text>
          <Text style={styles.priceUnit}>per kg</Text>
        </View>
      </View>
      <View style={styles.priceCardFooter}>
        <Text style={styles.updateText}>
          Updated: {item.date.toLocaleDateString()}
        </Text>
      </View>
    </Card>
  );

  // Group prices by product for trends
  const groupedByProduct = marketPrices.reduce((acc, item) => {
    if (!acc[item.productName]) {
      acc[item.productName] = [];
    }
    acc[item.productName].push(item);
    return acc;
  }, {} as Record<string, MarketPrice[]>);

  // Calculate average prices
  const averagePrices = Object.keys(groupedByProduct).map(productName => {
    const items = groupedByProduct[productName];
    const total = items.reduce((sum, item) => sum + item.price, 0);
    const average = total / items.length;
    return {
      productName,
      averagePrice: average,
      markets: items.length,
    };
  });
  
  // Image picker functionality
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant camera roll permissions to upload an image.');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      try {
        // Get the image uri and file info
        const uri = result.assets[0].uri;
        
        // Set image from local URI since storage is disabled
        setBidImage(uri);
        console.log('Using local image URI (storage is disabled)');

      } catch (error) {
        console.error('Error processing image:', error);
        // Fallback to local URI
        if (result.assets[0].uri) {
          setBidImage(result.assets[0].uri);
        }
        Alert.alert('Warning', 'Could not process image. Using local version instead.');
      }
    }
  };
  
  // Date picker handlers
  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setBidStartDate(selectedDate);
    }
  };
  
  const onDueDateChange = (event: any, selectedDate?: Date) => {
    setShowDueDatePicker(false);
    if (selectedDate) {
      setBidDueDate(selectedDate);
    }
  };
  
  // Check if user is logged in before showing bid modal
  const handleCreateBidPress = async () => {
    try {
      const email = await AsyncStorage.getItem(USER_EMAIL_KEY);
      
      if (!email) {
        Alert.alert(
          'Login Required',
          'Please log in to create a bid',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Go to Login', 
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
        return;
      }
      
      // User is logged in, show the modal
      setIsBidModalVisible(true);
    } catch (error) {
      console.error('Error checking login status:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };
  
  // Submit bid
  const handleSubmitBid = async () => {
    // Validate form fields
    if (!bidImage) {
      Alert.alert('Missing Image', 'Please upload an image for your bid.');
      return;
    }
    
    if (!bidName || !bidCategory || !bidItem || !bidDescription || !bidStartPrice) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }
    
    // Check email again in case it was cleared from storage
    if (!bidEmail) {
      try {
        const email = await AsyncStorage.getItem(USER_EMAIL_KEY);
        if (email) {
          setBidEmail(email);
        } else {
          Alert.alert('Login Required', 'Please log in to create a bid.');
          setIsBidModalVisible(false);
          navigation.navigate('Login');
          return;
        }
      } catch (error) {
        console.error('Error checking email:', error);
        Alert.alert('Error', 'Could not verify your login status. Please log in again.');
        return;
      }
    }
    
    try {
      setIsSubmitting(true);
      
      // Create bid object
      const newBid = {
        name: bidName,
        number: bidNumber,
        category: bidCategory,
        item: bidItem,
        description: bidDescription,
        startPrice: parseFloat(bidStartPrice),
        startDate: bidStartDate,
        dueDate: bidDueDate,
        email: bidEmail,
        imageUri: bidImage,
        status: 'active' as const,
        createdAt: new Date(),
        bids: [],
      };
      
      // Save to Firebase
      await addBid(newBid);
      
      // Reset form
      setBidImage(null);
      setBidName('');
      setBidNumber('');
      setBidCategory('');
      setBidItem('');
      setBidDescription('');
      setBidStartPrice('');
      setBidStartDate(new Date());
      setBidDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
      
      setIsBidModalVisible(false);
      setIsSubmitting(false);
      
      Alert.alert(
        'Success', 
        'Your bid has been created successfully!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error creating bid:', error);
      setIsSubmitting(false);
      Alert.alert('Error', 'Failed to create bid. Please try again later.');
    }
  };
  
  // Reset form
  const resetBidForm = () => {
    setBidImage(null);
    setBidName('');
    setBidNumber('');
    setBidCategory('');
    setBidItem('');
    setBidDescription('');
    setBidStartPrice('');
    setBidStartDate(new Date());
    setBidDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setIsBidModalVisible(false);
  };

  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading market prices...</Text>
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => setSelectedMarket(null)} // This will trigger a reload
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Market Prices</Text>
        <Text style={styles.headerSubtitle}>
          Current prices from markets across the country
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search product..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Markets Filter */}
      <View style={styles.marketsContainer}>
        <Text style={styles.marketsTitle}>Markets:</Text>
        <FlatList
          data={allMarkets}
          renderItem={renderMarketItem}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.marketsList}
        />
      </View>

      {/* Price List */}
      {filteredMarketPrices.length > 0 ? (
        <FlatList
          data={filteredMarketPrices}
          renderItem={renderMarketPriceItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.pricesList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>Price Overview</Text>
              <View style={styles.infoItems}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoValue}>{marketPrices.length}</Text>
                  <Text style={styles.infoLabel}>Total Listings</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoValue}>{allMarkets.length}</Text>
                  <Text style={styles.infoLabel}>Markets</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoValue}>
                    {new Date().toLocaleDateString()}
                  </Text>
                  <Text style={styles.infoLabel}>Last Updated</Text>
                </View>
              </View>
            </View>
          }
          ListFooterComponent={
            <Card style={styles.trendsCard} elevation="small">
              <Text style={styles.trendsTitle}>Average Prices</Text>
              <View style={styles.trendsList}>
                {averagePrices.map((item) => (
                  <View key={item.productName} style={styles.trendItem}>
                    <Text style={styles.trendProductName}>{item.productName}</Text>
                    <Text style={styles.trendAverage}>
                      {formatCurrency(item.averagePrice)}
                    </Text>
                    <Text style={styles.trendMarkets}>
                      ({item.markets} market{item.markets > 1 ? 's' : ''})
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          }
        />
      ) : (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No prices found</Text>
          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={() => {
              setSearchQuery('');
              setSelectedMarket(null);
            }}
          >
            <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Create Bid Button (Floating) */}
      <TouchableOpacity 
        style={styles.createBidButton}
        onPress={handleCreateBidPress}
      >
        <Ionicons name="add" size={24} color={colors.white} />
        <Text style={styles.createBidButtonText}>Create Bid</Text>
      </TouchableOpacity>
      
      {/* Create Bid Modal */}
      <Modal
        visible={isBidModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsBidModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Bid</Text>
              <TouchableOpacity onPress={resetBidForm}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {/* Image Upload */}
            <TouchableOpacity style={styles.imageUploadContainer} onPress={pickImage}>
              {bidImage ? (
                <Image source={{ uri: bidImage }} style={styles.bidImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera" size={40} color={colors.lightText} />
                  <Text style={styles.uploadText}>Upload Image</Text>
                </View>
              )}
            </TouchableOpacity>
            
            {/* Form Fields */}
            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>Product Name*</Text>
              <TextInput
                style={styles.input}
                value={bidName}
                onChangeText={setBidName}
                placeholder="Enter product name"
              />
              
              <Text style={styles.inputLabel}>Contact Number</Text>
              <TextInput
                style={styles.input}
                value={bidNumber}
                onChangeText={setBidNumber}
                placeholder="Enter your contact number"
                keyboardType="phone-pad"
              />
              
              <Text style={styles.inputLabel}>Category*</Text>
              <TextInput
                style={styles.input}
                value={bidCategory}
                onChangeText={setBidCategory}
                placeholder="Enter product category"
              />
              
              <Text style={styles.inputLabel}>Item/Quantity*</Text>
              <TextInput
                style={styles.input}
                value={bidItem}
                onChangeText={setBidItem}
                placeholder="e.g., 5kg, 10 pieces, etc."
              />
              
              <Text style={styles.inputLabel}>Description*</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bidDescription}
                onChangeText={setBidDescription}
                placeholder="Enter detailed description"
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
              />
              
              <Text style={styles.inputLabel}>Starting Price (Rs)*</Text>
              <TextInput
                style={styles.input}
                value={bidStartPrice}
                onChangeText={setBidStartPrice}
                placeholder="Enter starting price"
                keyboardType="numeric"
              />
              
              <Text style={styles.inputLabel}>Start Date</Text>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text>{bidStartDate.toLocaleDateString()}</Text>
                <Ionicons name="calendar-outline" size={20} color={colors.text} />
              </TouchableOpacity>
              
              {showStartDatePicker && (
                <DateTimePicker
                  value={bidStartDate}
                  mode="date"
                  display="default"
                  onChange={onStartDateChange}
                />
              )}
              
              <Text style={styles.inputLabel}>Due Date</Text>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => setShowDueDatePicker(true)}
              >
                <Text>{bidDueDate.toLocaleDateString()}</Text>
                <Ionicons name="calendar-outline" size={20} color={colors.text} />
              </TouchableOpacity>
              
              {showDueDatePicker && (
                <DateTimePicker
                  value={bidDueDate}
                  mode="date"
                  display="default"
                  onChange={onDueDateChange}
                  minimumDate={new Date()}
                />
              )}
              
              <Text style={styles.inputLabel}>Your Email</Text>
              {emailLoading ? (
                <View style={[styles.input, styles.emailLoadingContainer]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.emailLoadingText}>Loading your email...</Text>
                </View>
              ) : (
                <TextInput
                  style={styles.input}
                  value={bidEmail}
                  placeholder="Your email will be shown to bidders"
                  editable={false}
                />
              )}
              
              {!bidEmail && !emailLoading && (
                <Text style={styles.emailWarning}>
                  No email found. Please log in again.
                </Text>
              )}
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={resetBidForm}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmitBid}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.submitButtonText}>Create Bid</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.white,
    opacity: 0.9,
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  searchInput: {
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  marketsContainer: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  marketsTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  marketsList: {
    paddingVertical: spacing.xs,
  },
  marketItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.md,
  },
  selectedMarketItem: {
    backgroundColor: colors.primary,
  },
  marketItemText: {
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  selectedMarketItemText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  pricesList: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2, // Extra padding for the floating button
  },
  priceCard: {
    marginBottom: spacing.md,
  },
  priceCardContent: {
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceInfo: {
    flex: 1,
  },
  productName: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  marketName: {
    fontSize: fontSizes.sm,
    color: colors.lightText,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.primary,
  },
  priceUnit: {
    fontSize: fontSizes.xs,
    color: colors.lightText,
  },
  priceCardFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    padding: spacing.sm,
  },
  updateText: {
    fontSize: fontSizes.xs,
    color: colors.lightText,
    textAlign: 'right',
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...cardShadow,
  },
  infoCardTitle: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    alignItems: 'center',
  },
  infoValue: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  infoLabel: {
    fontSize: fontSizes.xs,
    color: colors.lightText,
  },
  trendsCard: {
    marginTop: spacing.md,
    padding: spacing.md,
  },
  trendsTitle: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  trendsList: {},
  trendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  trendProductName: {
    flex: 3,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  trendAverage: {
    flex: 2,
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'right',
  },
  trendMarkets: {
    flex: 2,
    fontSize: fontSizes.xs,
    color: colors.lightText,
    textAlign: 'right',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  noResultsText: {
    fontSize: fontSizes.lg,
    color: colors.lightText,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  clearFiltersButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  clearFiltersButtonText: {
    color: colors.white,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  createBidButton: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...cardShadow,
  },
  createBidButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    marginLeft: spacing.xs,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  imageUploadContainer: {
    width: '100%',
    height: 200,
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    color: colors.lightText,
    marginTop: spacing.sm,
  },
  bidImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  formContainer: {
    marginBottom: spacing.xl,
  },
  inputLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  textArea: {
    height: 100,
  },
  datePickerButton: {
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
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
  emailLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailLoadingText: {
    marginLeft: spacing.sm,
    color: colors.lightText,
    fontSize: fontSizes.sm,
  },
  emailWarning: {
    color: colors.error || colors.accent,
    fontSize: fontSizes.sm,
    marginTop: spacing.xs,
  },
});

export default MarketPricesScreen; 