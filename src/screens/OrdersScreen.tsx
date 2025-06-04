import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Order } from '../types';
import { colors, fontSizes, spacing, borderRadius, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../utils';
import { auth, db } from '../utilities/firebaseConfig';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

type OrdersScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Orders'>;

const USER_EMAIL_KEY = 'user_email';

type FilterStatus = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const OrdersScreen = () => {
  const navigation = useNavigation<OrdersScreenNavigationProp>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    loadUserEmail();
  }, []);

  useEffect(() => {
    if (userEmail) {
      fetchOrders();
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

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Query Firestore to get user's orders
      const ordersQuery = query(
        collection(db, 'orders'),
        where('userEmail', '==', userEmail),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(ordersQuery);
      
      if (querySnapshot.empty) {
        // No orders found
        setOrders([]);
        setFilteredOrders([]);
      } else {
        const ordersData: Order[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Convert Firestore timestamps to Date objects
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
          const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date();
          
          ordersData.push({
            id: doc.id,
            userId: data.userId || '',
            userEmail: data.userEmail,
            products: data.products || [],
            totalAmount: data.totalAmount || 0,
            status: data.status || 'pending',
            createdAt: createdAt,
            updatedAt: updatedAt,
          });
        });
        
        setOrders(ordersData);
        setFilteredOrders(ordersData);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to fetch orders. Please try again.');
    }
  };

  const handleFilterChange = (status: FilterStatus) => {
    setActiveFilter(status);
    
    if (status === 'all') {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(order => order.status === status);
      setFilteredOrders(filtered);
    }
  };

  const getOrderStatusColor = (status: Order['status']) => {
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

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderDate}>
            {item.createdAt.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          <Text style={styles.orderId}>Order #{item.id.substring(0, 6)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getOrderStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.productsList}>
        {item.products.map(product => (
          <View key={product.id} style={styles.productItem}>
            <Image 
              source={{ uri: product.image }} 
              style={styles.productImage} 
              defaultSource={{ uri: 'https://placehold.co/150x150/png' }}
            />
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productQuantity}>Qty: {product.quantity}</Text>
            </View>
            <Text style={styles.productPrice}>{formatCurrency(product.price * (product.quantity || 1))}</Text>
          </View>
        ))}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.totalText}>Total Amount:</Text>
        <Text style={styles.totalAmount}>{formatCurrency(item.totalAmount)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cart-outline" size={60} color={colors.lightGray} />
      <Text style={styles.emptyText}>No orders found</Text>
      <TouchableOpacity 
        style={styles.shopButton}
        onPress={() => navigation.navigate('Main')}
      >
        <Text style={styles.shopButtonText}>Start Shopping</Text>
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
        <Text style={styles.headerTitle}>My Orders</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchOrders}
        >
          <Ionicons name="refresh" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'all' && styles.activeFilterTab]}
          onPress={() => handleFilterChange('all')}
        >
          <Text style={[styles.filterText, activeFilter === 'all' && styles.activeFilterText]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'pending' && styles.activeFilterTab]}
          onPress={() => handleFilterChange('pending')}
        >
          <Text style={[styles.filterText, activeFilter === 'pending' && styles.activeFilterText]}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'processing' && styles.activeFilterTab]}
          onPress={() => handleFilterChange('processing')}
        >
          <Text style={[styles.filterText, activeFilter === 'processing' && styles.activeFilterText]}>Processing</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'shipped' && styles.activeFilterTab]}
          onPress={() => handleFilterChange('shipped')}
        >
          <Text style={[styles.filterText, activeFilter === 'shipped' && styles.activeFilterText]}>Shipped</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'delivered' && styles.activeFilterTab]}
          onPress={() => handleFilterChange('delivered')}
        >
          <Text style={[styles.filterText, activeFilter === 'delivered' && styles.activeFilterText]}>Delivered</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'cancelled' && styles.activeFilterTab]}
          onPress={() => handleFilterChange('cancelled')}
        >
          <Text style={[styles.filterText, activeFilter === 'cancelled' && styles.activeFilterText]}>Cancelled</Text>
        </TouchableOpacity>
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.ordersList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyList}
        />
      )}
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
  filtersContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    ...shadows.small,
  },
  filterTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    marginRight: spacing.sm,
    backgroundColor: colors.lightGray,
  },
  activeFilterTab: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  activeFilterText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  ordersList: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.small,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  orderDate: {
    fontSize: fontSizes.sm,
    color: colors.lightText,
    marginBottom: spacing.xs,
  },
  orderId: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: fontSizes.xs,
    fontWeight: 'bold',
    color: colors.white,
    textTransform: 'capitalize',
  },
  productsList: {
    padding: spacing.md,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: fontSizes.md,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  productQuantity: {
    fontSize: fontSizes.sm,
    color: colors.lightText,
  },
  productPrice: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.primary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  totalText: {
    fontSize: fontSizes.md,
    color: colors.text,
  },
  totalAmount: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.primary,
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
    minHeight: 300,
  },
  emptyText: {
    fontSize: fontSizes.lg,
    color: colors.lightText,
    marginVertical: spacing.md,
    textAlign: 'center',
  },
  shopButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  shopButtonText: {
    color: colors.white,
    fontSize: fontSizes.md,
    fontWeight: 'bold',
  },
});

export default OrdersScreen; 