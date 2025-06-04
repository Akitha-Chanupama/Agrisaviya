import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { colors, fontSizes, spacing, borderRadius, shadows } from '../theme';
import { formatCurrency } from '../utils';
import Button from '../components/Button';
import { db, auth } from '../utilities/firebaseConfig';
import { collection, doc, getDoc, setDoc, updateDoc, deleteField, serverTimestamp, onSnapshot } from 'firebase/firestore';

type CartItem = {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
};

type CartNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Cart'>;

// Placeholder image for missing product images
const PLACEHOLDER_IMAGE = 'https://st4.depositphotos.com/14953852/24787/v/450/depositphotos_247872612-stock-illustration-no-image-available-icon-vector.jpg';

const CartScreen = () => {
  const navigation = useNavigation<CartNavigationProp>();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUserId(currentUser.uid);
    } else {
      setError('User not signed in');
      setLoading(false);
    }
  }, []);

  // Listen for cart updates in real-time
  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    const userCartRef = doc(db, 'carts', userId);
    
    const unsubscribe = onSnapshot(
      userCartRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const cartData = docSnap.data();
          const items: CartItem[] = [];
          
          // Convert cart document data to CartItem array
          for (const [itemId, itemData] of Object.entries(cartData.items || {})) {
            const item = itemData as any;
            items.push({
              id: itemId,
              productId: item.productId,
              name: item.name,
              image: item.image || PLACEHOLDER_IMAGE,
              price: item.price,
              quantity: item.quantity
            });
          }
          
          setCartItems(items);
        } else {
          setCartItems([]);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error getting cart:', err);
        setError('Failed to load cart data. Please try again.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Calculate subtotal
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Calculate discount (10% if promo applied)
  const discount = promoApplied ? subtotal * 0.1 : 0;

  // Delivery fee
  const deliveryFee = subtotal > 5000 ? 0 : 350;

  // Calculate total
  const total = subtotal - discount + deliveryFee;

  const handleQuantityChange = async (id: string, change: number) => {
    if (!userId) {
      Alert.alert('Error', 'You must be signed in to update your cart.');
      return;
    }

    try {
      const userCartRef = doc(db, 'carts', userId);
      const cartDoc = await getDoc(userCartRef);
      
      if (cartDoc.exists()) {
        const cartData = cartDoc.data();
        const items = cartData.items || {};
        const item = items[id];
        
        if (item) {
          const newQuantity = item.quantity + change;
          
          if (newQuantity <= 0) {
            // Remove item if quantity becomes zero
            await updateDoc(userCartRef, {
              [`items.${id}`]: deleteField(),
              updatedAt: serverTimestamp()
            });
          } else {
            // Update quantity
            await updateDoc(userCartRef, {
              [`items.${id}.quantity`]: newQuantity,
              updatedAt: serverTimestamp()
            });
          }
        }
      }
    } catch (err) {
      console.error('Error updating cart:', err);
      Alert.alert('Error', 'Failed to update cart. Please try again.');
    }
  };

  const handleRemoveItem = async (id: string) => {
    if (!userId) {
      Alert.alert('Error', 'You must be signed in to update your cart.');
      return;
    }

    try {
      const userCartRef = doc(db, 'carts', userId);
      
      await updateDoc(userCartRef, {
        [`items.${id}`]: deleteField(),
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error removing item from cart:', err);
      Alert.alert('Error', 'Failed to remove item. Please try again.');
    }
  };

  const handleApplyPromo = () => {
    // Simple promo code logic - in real app this would validate against a backend
    if (promoCode.toUpperCase() === 'AGRI10') {
      setPromoApplied(true);
      Alert.alert('Success', 'Promo code applied successfully!');
    } else {
      Alert.alert('Invalid Promo', 'The promo code you entered is invalid.');
    }
    setPromoCode('');
  };

  const handleCheckout = async () => {
    if (!userId) {
      Alert.alert('Error', 'You must be signed in to checkout.');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty.');
      return;
    }

    setCheckoutLoading(true);
    
    try {
      // Create order document
      const ordersRef = collection(db, 'orders');
      const orderData = {
        userId: userId,
        products: cartItems.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        subtotal: subtotal,
        discount: discount,
        deliveryFee: deliveryFee,
        totalAmount: total,
        status: 'processing',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Add order to Firestore
      await setDoc(doc(ordersRef), orderData);
      
      // Clear user's cart
      await setDoc(doc(db, 'carts', userId), {
        items: {},
        updatedAt: serverTimestamp()
      });
      
      setCheckoutLoading(false);
      
      Alert.alert(
        'Order Placed',
        'Your order has been placed successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('Main');
            },
          },
        ]
      );
    } catch (err) {
      console.error('Error creating order:', err);
      setCheckoutLoading(false);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    }
  };

  // Handle image loading errors
  const handleImageError = (id: string) => {
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, image: PLACEHOLDER_IMAGE } : item
      )
    );
  };

  // Render each cart item
  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <Image 
        source={{ uri: item.image }} 
        style={styles.itemImage} 
        onError={() => handleImageError(item.id)}
      />
      
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
        
        <View style={styles.quantityControl}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item.id, -1)}
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
          
          <Text style={styles.quantity}>{item.quantity}</Text>
          
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item.id, 1)}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.itemActions}>
        <Text style={styles.itemTotal}>
          {formatCurrency(item.price * item.quantity)}
        </Text>
        
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => handleRemoveItem(item.id)}
        >
          <Text style={styles.removeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Empty cart view
  const renderEmptyCart = () => (
    <View style={styles.emptyCartContainer}>
      <Text style={styles.emptyCartText}>Your cart is empty</Text>
      <Button
        title="Start Shopping"
        onPress={() => navigation.navigate('Main')}
        style={styles.emptyCartButton}
      />
    </View>
  );

  // Show loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading cart...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          style={styles.errorButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart</Text>
        <View style={styles.placeholder} />
      </View>

      {cartItems.length > 0 ? (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />

          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
            </View>
            
            {promoApplied && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={[styles.summaryValue, styles.discountValue]}>
                  -{formatCurrency(discount)}
                </Text>
              </View>
            )}
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery</Text>
              <Text style={styles.summaryValue}>
                {deliveryFee > 0 ? formatCurrency(deliveryFee) : 'Free'}
              </Text>
            </View>
            
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
            </View>

            <Button
              title={checkoutLoading ? "Processing..." : "Checkout"}
              onPress={handleCheckout}
              disabled={checkoutLoading}
              style={styles.checkoutButton}
            />
          </View>
        </>
      ) : (
        renderEmptyCart()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingTop: 20,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.white,
  },
  errorText: {
    fontSize: fontSizes.lg,
    color: colors.error,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  errorButton: {
    minWidth: 150,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  backButton: {
    padding: spacing.sm,
  },
  backButtonText: {
    fontSize: fontSizes.xl,
    color: colors.text,
  },
  placeholder: {
    width: 24, // To balance the header
  },
  listContent: {
    padding: spacing.md,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.small,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  itemPrice: {
    fontSize: fontSizes.sm,
    color: colors.lightText,
    marginBottom: spacing.xs,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.text,
  },
  quantity: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.text,
    marginHorizontal: spacing.sm,
    minWidth: 20,
    textAlign: 'center',
  },
  itemActions: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  itemTotal: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.primary,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: fontSizes.sm,
    color: colors.error,
    fontWeight: 'bold',
  },
  summaryContainer: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    ...shadows.top,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: fontSizes.md,
    color: colors.lightText,
  },
  summaryValue: {
    fontSize: fontSizes.md,
    color: colors.text,
    fontWeight: '500',
  },
  discountValue: {
    color: colors.success,
  },
  totalRow: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    marginBottom: spacing.lg,
  },
  totalLabel: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  totalValue: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.primary,
  },
  checkoutButton: {
    marginTop: spacing.sm,
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyCartText: {
    fontSize: fontSizes.lg,
    color: colors.lightText,
    marginBottom: spacing.xl,
  },
  emptyCartButton: {
    minWidth: 200,
  },
});

export default CartScreen; 