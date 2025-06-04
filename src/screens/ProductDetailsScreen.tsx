import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Product, Review } from '../types';
import { colors, fontSizes, spacing, borderRadius, shadows } from '../theme';
import { formatCurrency } from '../utils';
import Button from '../components/Button';
import { getProductById, getProductReviews } from '../utilities/firestoreUtils';
import { db, auth } from '../utilities/firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

type ProductDetailsRouteProp = RouteProp<RootStackParamList, 'ProductDetails'>;
type ProductDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProductDetails'>;

// Add a placeholder image URL
const PLACEHOLDER_IMAGE = 'https://st4.depositphotos.com/14953852/24787/v/450/depositphotos_247872612-stock-illustration-no-image-available-icon-vector.jpg';

const ProductDetailsScreen = () => {
  const route = useRoute<ProductDetailsRouteProp>();
  const navigation = useNavigation<ProductDetailsNavigationProp>();
  const { productId } = route.params;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [productReviews, setProductReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  // Calculate average rating
  const averageRating = productReviews.length > 0
    ? productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length
    : product?.rating || 0;

  useEffect(() => {
    const loadProductData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Get product data from Firestore
        const productData = await getProductById(productId);
        
        if (!productData) {
          setError('Product not found');
          setLoading(false);
          return;
        }
        
        setProduct(productData);
        
        // Get reviews for this product
        const reviews = await getProductReviews(productId);
        setProductReviews(reviews);
        
      } catch (err) {
        console.error('Error loading product data:', err);
        setError('Failed to load product data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadProductData();
  }, [productId]);

  const handleQuantityDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleQuantityIncrease = () => {
    setQuantity(quantity + 1);
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    // Check if user is signed in
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert(
        'Sign In Required', 
        'Please sign in to add items to your cart',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Sign In', 
            onPress: () => navigation.navigate('Login' as any)
          }
        ]
      );
      return;
    }
    
    try {
      setAddingToCart(true);
      
      const userId = currentUser.uid;
      const userCartRef = doc(db, 'carts', userId);
      
      // Check if cart document exists
      const cartDoc = await getDoc(userCartRef);
      
      if (cartDoc.exists()) {
        // Cart exists, update it
        const cartData = cartDoc.data();
        const items = cartData.items || {};
        const itemId = productId; // Use product ID as item ID
        
        // Check if product already in cart
        if (items[itemId]) {
          // Update quantity
          await updateDoc(userCartRef, {
            [`items.${itemId}.quantity`]: items[itemId].quantity + quantity,
            updatedAt: serverTimestamp()
          });
        } else {
          // Add new product to cart
          await updateDoc(userCartRef, {
            [`items.${itemId}`]: {
              productId: productId,
              name: product.name,
              price: product.price,
              image: product.image || PLACEHOLDER_IMAGE,
              quantity: quantity
            },
            updatedAt: serverTimestamp()
          });
        }
      } else {
        // Create new cart
        await setDoc(userCartRef, {
          userId: userId,
          items: {
            [productId]: {
              productId: productId,
              name: product.name,
              price: product.price,
              image: product.image || PLACEHOLDER_IMAGE,
              quantity: quantity
            }
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      setAddingToCart(false);
      Alert.alert('Success', `Added ${quantity} ${product.name} to cart`);
      
    } catch (err) {
      console.error('Error adding to cart:', err);
      setAddingToCart(false);
      Alert.alert('Error', 'Failed to add item to cart. Please try again.');
    }
  };

  const handleBuyNow = () => {
    // First add to cart, then navigate to cart page
    handleAddToCart().then(() => {
      navigation.navigate('Cart');
    });
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Generate star rating display
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
      <View style={styles.starsContainer}>
        {[...Array(fullStars)].map((_, i) => (
          <Text key={`full-${i}`} style={styles.starIcon}>★</Text>
        ))}
        {halfStar && <Text style={styles.starIcon}>★</Text>}
        {[...Array(emptyStars)].map((_, i) => (
          <Text key={`empty-${i}`} style={[styles.starIcon, styles.emptyStar]}>★</Text>
        ))}
        <Text style={styles.ratingText}>({productReviews.length} reviews)</Text>
      </View>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  // Show error state
  if (error || !product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Product not found'}</Text>
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
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: imageError ? PLACEHOLDER_IMAGE : (product.image || PLACEHOLDER_IMAGE) }} 
            style={styles.image} 
            onError={handleImageError}
          />
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.category}>{product.category}</Text>
          <Text style={styles.name}>{product.name}</Text>
          
          {/* Rating Stars */}
          {renderStars(averageRating)}

          <Text style={styles.price}>{formatCurrency(product.price)}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>

          <View style={styles.divider} />

          {/* Quantity Selector */}
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Quantity:</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={handleQuantityDecrease}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={handleQuantityIncrease}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Subtotal */}
          <View style={styles.subtotalContainer}>
            <Text style={styles.subtotalLabel}>Subtotal:</Text>
            <Text style={styles.subtotalValue}>
              {formatCurrency(product.price * quantity)}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              title={addingToCart ? "Adding..." : "Add to Cart"}
              onPress={handleAddToCart}
              type="outline"
              style={styles.addToCartButton}
              disabled={addingToCart}
            />
            <Button
              title="Buy Now"
              onPress={handleBuyNow}
              style={styles.buyNowButton}
              disabled={addingToCart}
            />
          </View>

          {/* Reviews Section */}
          {productReviews.length > 0 && (
            <View style={styles.reviewsContainer}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              {productReviews.map((review) => (
                <View key={review.id} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewUser}>{review.userName}</Text>
                    <Text style={styles.reviewDate}>
                      {review.date.toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.reviewRating}>
                    {[...Array(5)].map((_, i) => (
                      <Text
                        key={i}
                        style={[
                          styles.reviewStar,
                          i < review.rating ? {} : styles.emptyStar,
                        ]}
                      >
                        ★
                      </Text>
                    ))}
                  </View>
                  <Text style={styles.reviewText}>{review.text}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButtonContainer}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonIcon}>←</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  imageContainer: {
    backgroundColor: colors.lightGray,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  contentContainer: {
    padding: spacing.lg,
  },
  category: {
    fontSize: fontSizes.sm,
    color: colors.lightText,
    marginBottom: spacing.xs,
  },
  name: {
    fontSize: fontSizes.xxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  starIcon: {
    fontSize: fontSizes.md,
    color: colors.accent,
    marginRight: 2,
  },
  emptyStar: {
    color: colors.gray,
  },
  ratingText: {
    fontSize: fontSizes.sm,
    color: colors.lightText,
    marginLeft: spacing.xs,
  },
  price: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSizes.md,
    color: colors.text,
    lineHeight: 22,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  quantityLabel: {
    fontSize: fontSizes.md,
    color: colors.text,
    fontWeight: '600',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 36,
    height: 36,
    backgroundColor: colors.lightGray,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: fontSizes.lg,
    color: colors.text,
    fontWeight: 'bold',
  },
  quantityValue: {
    fontSize: fontSizes.md,
    color: colors.text,
    fontWeight: 'bold',
    marginHorizontal: spacing.md,
    minWidth: 20,
    textAlign: 'center',
  },
  subtotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  subtotalLabel: {
    fontSize: fontSizes.md,
    color: colors.text,
    fontWeight: '600',
  },
  subtotalValue: {
    fontSize: fontSizes.md,
    color: colors.primary,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  addToCartButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
  buyNowButton: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  reviewsContainer: {
    marginTop: spacing.md,
  },
  reviewItem: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  reviewUser: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.text,
  },
  reviewDate: {
    fontSize: fontSizes.sm,
    color: colors.lightText,
  },
  reviewRating: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  reviewStar: {
    fontSize: fontSizes.md,
    color: colors.accent,
    marginRight: 2,
  },
  reviewText: {
    fontSize: fontSizes.md,
    color: colors.text,
    lineHeight: 20,
  },
  backButtonContainer: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.round,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium,
    marginTop: 20,
  },
  backButtonIcon: {
    fontSize: fontSizes.xl,
    color: colors.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: fontSizes.lg,
    color: colors.error,
    marginBottom: spacing.lg,
    textAlign: 'center',
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
});

export default ProductDetailsScreen; 