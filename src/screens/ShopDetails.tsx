import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Shop, Product } from '../types';
import { colors, fontSizes, spacing, borderRadius, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { getShopById, getShopProducts } from '../utilities/firestoreUtils';
import { formatCurrency, truncateText } from '../utils';

type ShopDetailsRouteProp = RouteProp<RootStackParamList, 'ShopDetails'>;
type ShopDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PLACEHOLDER_IMAGE = 'https://st4.depositphotos.com/14953852/24787/v/450/depositphotos_247872612-stock-illustration-no-image-available-icon-vector.jpg';

const ShopDetails = () => {
  const navigation = useNavigation<ShopDetailsNavigationProp>();
  const route = useRoute<ShopDetailsRouteProp>();
  const { shopId } = route.params;
  
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [failedImages, setFailedImages] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    loadShopData();
  }, [shopId]);

  const loadShopData = async () => {
    try {
      setLoading(true);
      // Load shop data
      const shopData = await getShopById(shopId);
      setShop(shopData);
      
      // Load shop products
      const productsData = await getShopProducts(shopId);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading shop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetails', { productId });
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = (phone: string) => {
    Linking.openURL(`whatsapp://send?phone=${phone.replace(/\s+/g, '')}`);
  };

  const handleMapPress = () => {
    if (shop?.location) {
      const { latitude, longitude } = shop.location;
      const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      Linking.openURL(url);
    }
  };

  const handleImageError = (id: string) => {
    setFailedImages(prev => ({
      ...prev,
      [id]: true
    }));
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleProductPress(item.id)}
    >
      <View style={styles.productImageContainer}>
        <Image 
          source={{ uri: item.image || PLACEHOLDER_IMAGE }} 
          style={styles.productImage}
          onError={() => handleImageError(item.id)}
        />
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{truncateText(item.name, 20)}</Text>
        <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading shop details...</Text>
      </View>
    );
  }

  if (!shop) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Shop not found</Text>
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButtonCircle}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <Image 
        source={{ uri: shop.image || PLACEHOLDER_IMAGE }} 
        style={styles.headerImage}
        onError={() => handleImageError('shop')}
      />

      <View style={styles.detailsContainer}>
        <Text style={styles.shopName}>{shop.name}</Text>
        <Text style={styles.shopDescription}>{shop.description}</Text>

        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <View style={styles.contactItem}>
            <Ionicons name="person" size={18} color={colors.primary} />
            <Text style={styles.contactText}>{shop.owner}</Text>
          </View>
          
          <View style={styles.contactItem}>
            <Ionicons name="location" size={18} color={colors.primary} />
            <Text style={styles.contactText}>{shop.address}</Text>
            {shop.location && (
              <TouchableOpacity onPress={handleMapPress}>
                <Text style={styles.viewMapText}>View on Map</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.contactButtons}>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={() => handleCall(shop.phone)}
            >
              <Ionicons name="call" size={18} color={colors.white} />
              <Text style={styles.contactButtonText}>Call</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.contactButton, styles.whatsappButton]}
              onPress={() => handleWhatsApp(shop.whatsapp || shop.phone)}
            >
              <Ionicons name="logo-whatsapp" size={18} color={colors.white} />
              <Text style={styles.contactButtonText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>Shop Products</Text>
          
          {products.length > 0 ? (
            <FlatList
              data={products}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsList}
            />
          ) : (
            <View style={styles.emptyProductsContainer}>
              <Text style={styles.emptyText}>No products available</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    marginTop: 30,
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
    backgroundColor: colors.white,
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
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  backButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  header: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.lg,
    zIndex: 10,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium,
  },
  headerImage: {
    width: '100%',
    height: 250,
    marginTop: 90,
  },
  detailsContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    padding: spacing.lg,
  },
  shopName: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  shopDescription: {
    fontSize: fontSizes.md,
    color: colors.lightText,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  contactSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  contactText: {
    fontSize: fontSizes.md,
    color: colors.text,
    marginLeft: spacing.sm,
    flex: 1,
  },
  viewMapText: {
    fontSize: fontSizes.sm,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  contactButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    flex: 1,
    marginRight: spacing.sm,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    marginRight: 0,
    marginLeft: spacing.sm,
  },
  contactButtonText: {
    color: colors.white,
    fontSize: fontSizes.md,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  productsSection: {
    marginBottom: spacing.lg,
  },
  productsList: {
    paddingRight: spacing.sm,
  },
  productCard: {
    width: 150,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
    overflow: 'hidden',
    ...shadows.small,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  productImageContainer: {
    width: '100%',
    height: 120,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productInfo: {
    padding: spacing.sm,
  },
  productName: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  productPrice: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.primary,
  },
  emptyProductsContainer: {
    padding: spacing.lg,
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSizes.md,
    color: colors.lightText,
    textAlign: 'center',
  },
});

export default ShopDetails; 