import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Bid, Category, Product, Article } from '../types';
import { colors, fontSizes, spacing, borderRadius, shadows } from '../theme';
import Card from '../components/Card';
import { formatCurrency, truncateText } from '../utils';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../utilities/firebaseConfig';
import { getSavedUserData } from '../utilities/authUtils';
import { getAllCategories, getCurrentWeather, getFeaturedProducts, getActiveBids, getAllArticles } from '../utilities/firestoreUtils';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

const { width } = Dimensions.get('window');
const cardWidth = (width - spacing.md * 3) / 2;

type WeatherData = {
  location: string;
  temperature: number;
  condition: string;
  icon: string;
};

// Add a placeholder image URL
const PLACEHOLDER_IMAGE = 'https://st4.depositphotos.com/14953852/24787/v/450/depositphotos_247872612-stock-illustration-no-image-available-icon-vector.jpg';

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [userName, setUserName] = useState('User');
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeBids, setActiveBids] = useState<Bid[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherData>({
    location: 'Loading...',
    temperature: 0,
    condition: 'Loading...',
    icon: '☀️'
  });
  const [loading, setLoading] = useState(true);
  const [failedImages, setFailedImages] = useState<{[key: string]: boolean}>({});
  const [featuredProductsLoading, setFeaturedProductsLoading] = useState(false);

  useEffect(() => {
    // Load user data, categories, and weather when component mounts
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          loadUserData(),
          loadCategories(),
          loadWeatherData(),
          loadActiveBids(),
          loadFeaturedProducts(),
          loadArticles()
        ]);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const loadUserData = async () => {
    try {
      // First try to get current auth user
      const currentUser = auth.currentUser;
      
      if (currentUser && currentUser.uid) {
        // Get user document from Firestore
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserName(userData.name || 'User');
        } else {
          // If no user document, try to get from AsyncStorage
          const savedUserData = await getSavedUserData();
          if (savedUserData) {
            setUserName(savedUserData.displayName || 'User');
          }
        }
      } else {
        // If not authenticated, try to get from AsyncStorage
        const savedUserData = await getSavedUserData();
        if (savedUserData) {
          setUserName(savedUserData.displayName || 'User');
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadCategories = async () => {
    try {
      // Use the new utility function
      const categoriesData = await getAllCategories();
      
      if (categoriesData.length > 0) {
        setCategories(categoriesData);
      } else {
        // Set fallback categories if empty
        setCategories(CATEGORIES);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Set fallback categories
      setCategories(CATEGORIES);
    }
  };

  const loadWeatherData = async () => {
    try {
      // Use the new utility function
      const weatherData = await getCurrentWeather();
      
      if (weatherData) {
        setWeather({
          location: weatherData.location,
          temperature: weatherData.temperature,
          condition: weatherData.condition,
          icon: weatherData.icon || '☀️'
        });
      } else {
        // Fallback to default mock weather
        setWeather(WEATHER[0]);
      }
    } catch (error) {
      console.error('Error loading weather:', error);
      // Fallback to default mock weather
      setWeather(WEATHER[0]);
    }
  };

  const loadActiveBids = async () => {
    try {
      // Get active bids from Firestore
      const bidsData = await getActiveBids(4); // Limit to 4 bids
      setActiveBids(bidsData);
    } catch (error) {
      console.error('Error loading active bids:', error);
      setActiveBids([]);
    }
  };

  const loadFeaturedProducts = async () => {
    try {
      // Set loading state specifically for featured products
      setFeaturedProductsLoading(true);
      
      // Now use the fixed getFeaturedProducts function with the limit parameter
      const productsData = await getFeaturedProducts(6);
      
      // Check if each product has a valid image URL
      const validatedProducts = productsData.map(product => {
        // If image is missing or invalid, use placeholder
        if (!product.image || product.image === '') {
          return { ...product, image: PLACEHOLDER_IMAGE };
        }
        return product;
      });
      
      console.log('Loaded featured products:', validatedProducts.length);
      setFeaturedProducts(validatedProducts);
    } catch (error) {
      console.error('Error loading featured products:', error);
      // If there's an error, set to empty array
      setFeaturedProducts([]);
    } finally {
      setFeaturedProductsLoading(false);
    }
  };

  const loadArticles = async () => {
    try {
      setArticlesLoading(true);
      
      // Get articles from Firestore
      const articlesData = await getAllArticles();
      
      // Sort by date (newest first) and take first 2
      const sortedArticles = articlesData
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 2);
      
      setArticles(sortedArticles);
    } catch (error) {
      console.error('Error loading articles:', error);
      setArticles([]);
    } finally {
      setArticlesLoading(false);
    }
  };

  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetails', { productId });
  };

  const handleArticlePress = (articleId: string) => {
    navigation.navigate('ArticleDetails', { articleId });
  };

  const handleCategoryPress = (category: string) => {
    // Navigate to Products screen filtered by category
    navigation.navigate('Products', { categoryId: category });
  };

  const handleViewAllCategories = () => {
    // Navigate to categories page
    navigation.navigate('ProductCategories');
  };

  const handleViewAllProducts = () => {
    // Navigate to all products page
    console.log('View all products');
  };

  const handleViewAllArticles = () => {
    navigation.navigate('Articles');
  };

  const handleWeatherPress = () => {
    navigation.navigate('Weather');
  };

  const handleMarketPricesPress = () => {
    navigation.navigate('MarketPrices');
  };

  const handleBidPress = (bidId: string) => {
    navigation.navigate('BidDetails', { bidId });
  };

  const handleViewAllBids = () => {
    navigation.navigate('MarketPrices');
  };

  // Handle image load error
  const handleImageError = (id: string) => {
    setFailedImages(prev => ({
      ...prev,
      [id]: true
    }));
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => handleCategoryPress(item.name)}
    >
      <View style={styles.categoryIconContainer}>
        {item.image && !failedImages[item.id] ? (
          <Image 
            source={{ uri: item.image }} 
            style={styles.categoryImage} 
            onError={() => handleImageError(item.id)}
          />
        ) : (
          <Text style={styles.categoryIcon}>{item.icon}</Text>
        )}
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleProductPress(item.id)}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: item.image || PLACEHOLDER_IMAGE }} 
          style={styles.productImage}
          onError={() => handleImageError(item.id)}
          resizeMode="cover"
        />
        {(item.rating && item.rating > 4.5) && (
          <View style={styles.topRatedBadge}>
            <Text style={styles.topRatedText}>Top Rated</Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{truncateText(item.name, 18)}</Text>
        <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
        <View style={styles.ratingContainer}>
          <Text style={styles.rating}>★ {item.rating ? item.rating.toFixed(1) : '0.0'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderBidItem = ({ item }: { item: Bid }) => (
    <TouchableOpacity
      style={styles.bidCard}
      onPress={() => handleBidPress(item.id!)}
    >
      <Image 
        source={{ uri: item.imageUri || PLACEHOLDER_IMAGE }} 
        style={styles.bidImage}
        onError={() => handleImageError(item.id || '')}
      />
      <View style={styles.bidInfo}>
        <Text style={styles.bidName}>{truncateText(item.name, 18)}</Text>
        <Text style={styles.bidStartPrice}>
          {formatCurrency(item.startPrice)} <Text style={styles.bidStartLabel}>starting bid</Text>
        </Text>
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.nameText}>{userName}</Text>
        </View>
        <TouchableOpacity 
          style={styles.cartButton}
          onPress={() => navigation.navigate('Cart')}
        >
          <Ionicons name="cart-outline" size={24} color={colors.white} />
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}></Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Weather Widget */}
      <TouchableOpacity onPress={handleWeatherPress}>
        <Card style={styles.weatherCard} elevation="small">
          <View style={styles.weatherContent}>
            <View>
              <Text style={styles.weatherLocation}>{weather.location}</Text>
              <Text style={styles.weatherTemp}>{weather.temperature}°C</Text>
              <Text style={styles.weatherCondition}>{weather.condition}</Text>
            </View>
            <Text style={styles.weatherIcon}>{weather.icon}</Text>
          </View>
        </Card>
      </TouchableOpacity>

      {/* Categories */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <TouchableOpacity onPress={handleViewAllCategories}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories.slice(0, 6)}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesList}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No categories available</Text>
        }
      />

      {/* Market Prices */}
      <TouchableOpacity
        style={styles.marketPricesCard}
        onPress={handleMarketPricesPress}
      >
        <Card elevation="small">
          <View style={styles.marketPricesContent}>
            <Text style={styles.marketPricesTitle}>Current Market Prices</Text>
            <Text style={styles.marketPricesSubtitle}>
              Check the latest prices from markets across the country
            </Text>
            <Text style={styles.marketPricesActionText}>View Prices →</Text>
          </View>
        </Card>
      </TouchableOpacity>

      {/* Featured Products */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured Products</Text>
        <View style={styles.sectionActions}>
          <TouchableOpacity onPress={() => loadFeaturedProducts()} style={styles.refreshButton}>
            <Ionicons name="refresh" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleViewAllProducts}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
      </View>

      {featuredProductsLoading ? (
        <View style={styles.loadingProductsContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : featuredProducts.length > 0 ? (
        <FlatList
          data={featuredProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productsList}
        />
      ) : (
        <View style={styles.emptyProductsContainer}>
          <Text style={styles.emptyText}>No featured products available</Text>
        </View>
      )}

      {/* Active Bids */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Bids</Text>
        <TouchableOpacity onPress={handleViewAllBids}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {activeBids.length > 0 ? (
        <FlatList
          data={activeBids}
          renderItem={renderBidItem}
          keyExtractor={(item) => item.id || ''}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bidsList}
        />
      ) : (
        <View style={styles.emptyBidsContainer}>
          <Text style={styles.emptyText}>No active bids at the moment</Text>
          <TouchableOpacity 
            style={styles.createBidButton}
            onPress={() => navigation.navigate('MarketPrices')}
          >
            <Text style={styles.createBidButtonText}>Create a Bid</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Product Management Section */}
      <TouchableOpacity
        style={styles.marketPricesCard}
        onPress={() => navigation.navigate('ProductCategories')}
      >
        <Card elevation="small">
          <View style={styles.marketPricesContent}>
            <Text style={styles.marketPricesTitle}>Product Management</Text>
            <Text style={styles.marketPricesSubtitle}>
              Browse product categories, shops, or add your own products
            </Text>
            <View style={styles.productManagementActions}>
              <TouchableOpacity 
                style={styles.productActionButton}
                onPress={() => navigation.navigate('ProductCategories')}
              >
                <Ionicons name="grid-outline" size={16} color={colors.white} />
                <Text style={styles.productActionText}>Categories</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.productActionButton}
                onPress={() => navigation.navigate('AddProduct')}
              >
                <Ionicons name="add-circle-outline" size={16} color={colors.white} />
                <Text style={styles.productActionText}>Add Product</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      </TouchableOpacity>

      {/* Machine Management Section */}
      <TouchableOpacity
        style={styles.marketPricesCard}
        onPress={() => navigation.navigate('MachineCategories')}
      >
        <Card elevation="small">
          <View style={styles.marketPricesContent}>
            <Text style={styles.marketPricesTitle}>Machine Management</Text>
            <Text style={styles.marketPricesSubtitle}>
              Browse machine categories, list machines, or add your own machines
            </Text>
            <View style={styles.productManagementActions}>
              <TouchableOpacity 
                style={styles.productActionButton}
                onPress={() => navigation.navigate('MachineCategories')}
              >
                <Ionicons name="grid-outline" size={16} color={colors.white} />
                <Text style={styles.productActionText}>Machines</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.productActionButton}
                onPress={() => navigation.navigate('AddMachine')}
              >
                <Ionicons name="add-circle-outline" size={16} color={colors.white} />
                <Text style={styles.productActionText}>Add Machine</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      </TouchableOpacity>

      {/* Pest & Disease Control Section */}
      <TouchableOpacity
        style={styles.marketPricesCard}
        onPress={() => navigation.navigate('PestAndDiseaseControl')}
      >
        <Card elevation="small">
          <View style={styles.marketPricesContent}>
            <Text style={styles.marketPricesTitle}>Pest & Disease Control</Text>
            <Text style={styles.marketPricesSubtitle}>
              Identify and manage crop pests and diseases effectively
            </Text>
            <View style={styles.productManagementActions}>
              <TouchableOpacity 
                style={[styles.productActionButton, { backgroundColor: colors.success }]}
                onPress={() => navigation.navigate('PestAndDiseaseControl')}
              >
                <Ionicons name="bug-outline" size={16} color={colors.white} />
                <Text style={styles.productActionText}>Pest Control</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.productActionButton, { backgroundColor: colors.error }]}
                onPress={() => navigation.navigate('PestAndDiseaseControl')}
              >
                <Ionicons name="medkit-outline" size={16} color={colors.white} />
                <Text style={styles.productActionText}>Disease Control</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      </TouchableOpacity>

      {/* Articles */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Latest Articles</Text>
        <TouchableOpacity onPress={handleViewAllArticles}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {articlesLoading ? (
        <View style={styles.loadingArticlesContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading articles...</Text>
        </View>
      ) : articles.length > 0 ? (
        articles.map((article) => (
          <TouchableOpacity
            key={article.id}
            style={styles.articleCard}
            onPress={() => handleArticlePress(article.id)}
          >
            <Card elevation="small">
              <View style={styles.articleCardContent}>
                <Image
                  source={{ uri: article.image }}
                  style={styles.articleImage}
                  onError={() => handleImageError(article.id)}
                />
                <View style={styles.articleInfo}>
                  <Text style={styles.articleTitle}>
                    {truncateText(article.title, 40)}
                  </Text>
                  <Text style={styles.articleSummary}>
                    {truncateText(article.summary, 80)}
                  </Text>
                  <View style={styles.articleMeta}>
                    <Text style={styles.articleAuthor}>{article.author}</Text>
                    <Text style={styles.articleDate}>
                      {article.date.toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyArticlesContainer}>
          <Text style={styles.emptyText}>No articles available</Text>
        </View>
      )}
    </ScrollView>
  );
};

// Mock data for fallback
const CATEGORIES = [
  { id: '1', name: 'Seeds', icon: '🌱', image: 'https://www.gardeningknowhow.com/wp-content/uploads/2020/11/seed-germination.jpg' },
  { id: '2', name: 'Tools', icon: '🔨', image: 'https://cdn.shopify.com/s/files/1/0279/6466/8560/products/WhatsAppImage2023-05-31at5.02.48PM_1400x.jpg' },
  { id: '3', name: 'Fertilizers', icon: '💧', image: 'https://images.pexels.com/photos/1301856/pexels-photo-1301856.jpeg' },
  { id: '4', name: 'Pesticides', icon: '🐛', image: 'https://images.pexels.com/photos/2219219/pexels-photo-2219219.jpeg' },
  { id: '5', name: 'Machinery', icon: '🚜', image: 'https://media.istockphoto.com/id/1320356772/photo/tractor-and-agricultural-machinery-on-the-field.jpg' },
  { id: '6', name: 'Irrigation', icon: '💦', image: 'https://images.pexels.com/photos/957024/forest-trees-perspective-bright-957024.jpeg' },
];

const WEATHER = [
  { 
    location: 'Colombo', 
    temperature: 30, 
    condition: 'Sunny', 
    icon: '☀️' 
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  welcomeText: {
    fontSize: fontSizes.md,
    color: colors.white,
    opacity: 0.9,
  },
  nameText: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: colors.white,
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.white,
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.accent,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.white,
  },
  cartBadgeText: {
    color: colors.white,
    fontSize: fontSizes.xs,
    fontWeight: 'bold',
  },
  weatherCard: {
    marginHorizontal: spacing.lg,
    marginTop: 20,
    borderRadius: borderRadius.lg,
  },
  weatherContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  weatherLocation: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.text,
  },
  weatherTemp: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  weatherCondition: {
    fontSize: fontSizes.sm,
    color: colors.lightText,
  },
  weatherIcon: {
    fontSize: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  viewAllText: {
    fontSize: fontSizes.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  categoriesList: {
    paddingHorizontal: spacing.lg,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: spacing.lg,
    width: 80,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
    ...shadows.small,
    overflow: 'hidden',
  },
  categoryIcon: {
    fontSize: fontSizes.xl,
    color: colors.primary,
  },
  categoryImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  categoryName: {
    fontSize: fontSizes.sm,
    color: colors.text,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: fontSizes.md,
    color: colors.lightText,
    textAlign: 'center',
    paddingVertical: spacing.md,
    width: width - (spacing.lg * 2),
  },
  marketPricesCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  marketPricesContent: {
    padding: spacing.md,
  },
  marketPricesTitle: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  marketPricesSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.lightText,
    marginBottom: spacing.md,
  },
  marketPricesActionText: {
    fontSize: fontSizes.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  productsList: {
    paddingHorizontal: spacing.lg,
  },
  productCard: {
    width: cardWidth,
    marginRight: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.small,
  },
  imageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: cardWidth,
  },
  productInfo: {
    padding: spacing.sm,
  },
  productName: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    marginBottom: spacing.xs,
    color: colors.text,
  },
  productPrice: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: fontSizes.sm,
    color: colors.accent,
  },
  topRatedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  topRatedText: {
    fontSize: fontSizes.xs,
    fontWeight: 'bold',
    color: colors.white,
  },
  articleCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  articleCardContent: {
    flexDirection: 'row',
    padding: spacing.sm,
  },
  articleImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.sm,
  },
  articleInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  articleTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  articleSummary: {
    fontSize: fontSizes.sm,
    color: colors.lightText,
    marginBottom: spacing.xs,
  },
  articleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  articleAuthor: {
    fontSize: fontSizes.xs,
    color: colors.primary,
  },
  articleDate: {
    fontSize: fontSizes.xs,
    color: colors.lightText,
  },
  bidsList: {
    paddingHorizontal: spacing.lg,
  },
  bidCard: {
    width: cardWidth,
    marginRight: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.small,
  },
  bidImage: {
    width: '100%',
    height: cardWidth,
  },
  bidInfo: {
    padding: spacing.sm,
  },
  bidName: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    marginBottom: spacing.xs,
    color: colors.text,
  },
  bidStartPrice: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  bidStartLabel: {
    fontSize: fontSizes.xs,
    fontWeight: 'normal',
    color: colors.lightText,
  },
  bidMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bidOffers: {
    fontSize: fontSizes.xs,
    color: colors.lightText,
  },
  bidTimeLeft: {
    fontSize: fontSizes.xs,
    color: colors.accent,
    fontWeight: '600',
  },
  emptyBidsContainer: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.small,
  },
  createBidButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  createBidButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  emptyProductsContainer: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.small,
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    padding: spacing.sm,
  },
  loadingProductsContainer: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.small,
  },
  loadingArticlesContainer: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.small,
    marginBottom: spacing.md,
  },
  emptyArticlesContainer: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.small,
    marginBottom: spacing.md,
  },
  productManagementActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  productActionText: {
    color: colors.white,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
});

export default HomeScreen; 