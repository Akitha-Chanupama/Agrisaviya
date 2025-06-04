import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Order, Product } from '../types';
import { colors, fontSizes, spacing, borderRadius, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../utils';
import { db } from '../utilities/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

type OrderDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OrderDetails'>;
type OrderDetailsScreenRouteProp = RouteProp<RootStackParamList, 'OrderDetails'>;

const OrderDetailsScreen = () => {
  const navigation = useNavigation<OrderDetailsScreenNavigationProp>();
  const route = useRoute<OrderDetailsScreenRouteProp>();
  const { orderId } = route.params;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      
      if (!orderId) {
        setError('Order ID is missing');
        setLoading(false);
        return;
      }
      
      // Get order details from Firestore
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);
      
      if (!orderDoc.exists()) {
        setError('Order not found');
        setLoading(false);
        return;
      }
      
      const data = orderDoc.data();
      
      // Convert Firestore timestamps to Date objects
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
      const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date();
      
      const orderData: Order = {
        id: orderDoc.id,
        userId: data.userId || '',
        userEmail: data.userEmail || '',
        products: data.products || [],
        totalAmount: data.totalAmount || 0,
        status: data.status || 'pending',
        createdAt: createdAt,
        updatedAt: updatedAt,
      };
      
      setOrder(orderData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError('Failed to load order details. Please try again.');
      setLoading(false);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'processing':
        return colors.info;
      case 'shipped':
        return colors.primary;
      case 'delivered':
        return colors.success;
      case 'cancelled':
        return colors.error;
      default:
        return colors.lightText;
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'time-outline';
      case 'processing':
        return 'construct-outline';
      case 'shipped':
        return 'car-outline';
      case 'delivered':
        return 'checkmark-circle-outline';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const getFormattedDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderProductItem = (product: Product) => (
    <View key={product.id} style={styles.productItem}>
      <Image 
        source={{ uri: product.image }} 
        style={styles.productImage}
        defaultSource={{ uri: 'https://placehold.co/100x100/png' }}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productQuantity}>Quantity: {product.quantity}</Text>
        <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
      </View>
      <Text style={styles.productTotal}>
        {formatCurrency(product.price * (product.quantity || 1))}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color={colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color={colors.error} />
        <Text style={styles.errorText}>Order not found</Text>
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.content}>
        {/* Order ID and Date */}
        <View style={styles.orderInfoCard}>
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.orderIdLabel}>Order ID</Text>
              <Text style={styles.orderId}>#{orderId.substring(0, 8)}</Text>
            </View>
            <View>
              <Text style={styles.orderDateLabel}>Order Date</Text>
              <Text style={styles.orderDate}>{getFormattedDate(order.createdAt)}</Text>
            </View>
          </View>
          
          {/* Order Status */}
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
              <Ionicons name={getStatusIcon(order.status) as any} size={16} color={colors.white} />
              <Text style={styles.statusText}>{order.status}</Text>
            </View>
          </View>
        </View>

        {/* Products List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Products</Text>
          <View style={styles.productsList}>
            {order.products.map(renderProductItem)}
          </View>
        </View>

        {/* Price Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatCurrency(order.totalAmount)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>Rs. 0.00</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>Rs. 0.00</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(order.totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* Shipping Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          <View style={styles.addressCard}>
            <Text style={styles.addressName}>{order.userEmail}</Text>
            <Text style={styles.addressText}>123 Temple Road, Colombo</Text>
            <Text style={styles.addressText}>Sri Lanka</Text>
            <Text style={styles.addressText}>+94 77 123 4567</Text>
          </View>
        </View>

        {/* Order Actions */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.supportButton]}
            onPress={() => navigation.navigate('Help')}
          >
            <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
          
          {order.status === 'pending' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => {
                Alert.alert(
                  'Cancel Order',
                  'Are you sure you want to cancel this order?',
                  [
                    { text: 'No', style: 'cancel' },
                    { 
                      text: 'Yes', 
                      style: 'destructive',
                      onPress: () => Alert.alert('Coming Soon', 'This feature will be available soon.') 
                    }
                  ]
                );
              }}
            >
              <Ionicons name="close-circle-outline" size={20} color={colors.error} />
              <Text style={styles.cancelButtonText}>Cancel Order</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
  headerBackButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  orderInfoCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  orderIdLabel: {
    fontSize: fontSizes.sm,
    color: colors.lightText,
    marginBottom: spacing.xs / 2,
  },
  orderId: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.text,
  },
  orderDateLabel: {
    fontSize: fontSizes.sm,
    color: colors.lightText,
    marginBottom: spacing.xs / 2,
    textAlign: 'right',
  },
  orderDate: {
    fontSize: fontSizes.md,
    color: colors.text,
    textAlign: 'right',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    color: colors.white,
    fontSize: fontSizes.sm,
    fontWeight: 'bold',
    marginLeft: spacing.xs,
    textTransform: 'capitalize',
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  productsList: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.small,
  },
  productItem: {
    flexDirection: 'row',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: fontSizes.md,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  productQuantity: {
    fontSize: fontSizes.sm,
    color: colors.lightText,
    marginBottom: spacing.xs,
  },
  productPrice: {
    fontSize: fontSizes.sm,
    color: colors.primary,
  },
  productTotal: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.text,
    alignSelf: 'center',
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.small,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  summaryLabel: {
    fontSize: fontSizes.md,
    color: colors.lightText,
  },
  summaryValue: {
    fontSize: fontSizes.md,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginVertical: spacing.sm,
  },
  totalLabel: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.text,
  },
  totalValue: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.primary,
  },
  addressCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.small,
  },
  addressName: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  addressText: {
    fontSize: fontSizes.md,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  actions: {
    marginVertical: spacing.md,
    marginBottom: spacing.xl,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  supportButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  supportButtonText: {
    color: colors.primary,
    fontSize: fontSizes.md,
    fontWeight: '500',
    marginLeft: spacing.sm,
  },
  cancelButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.error,
  },
  cancelButtonText: {
    color: colors.error,
    fontSize: fontSizes.md,
    fontWeight: '500',
    marginLeft: spacing.sm,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: fontSizes.lg,
    color: colors.text,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  backButtonText: {
    color: colors.white,
    fontSize: fontSizes.md,
    fontWeight: 'bold',
  },
});

export default OrderDetailsScreen; 