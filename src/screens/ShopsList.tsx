import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SectionList,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Shop, Product } from '../types';
import { colors, fontSizes, spacing, borderRadius, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { getShopsByCategory, getCategoryById } from '../utilities/firestoreUtils';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../utilities/firebaseConfig';

type ShopsListRouteProp = RouteProp<RootStackParamList, 'ShopsList'>;
type ShopsListNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PLACEHOLDER_IMAGE = 'https://st4.depositphotos.com/14953852/24787/v/450/depositphotos_247872612-stock-illustration-no-image-available-icon-vector.jpg';

// Define section data type for the SectionList
type Section = {
  shopId: string;
  shopName: string;
  shopImage: string;
  shopDescription: string;
  shopAddress: string;
  shopPhone: string;
  data: Product[];
};

const ShopsList = () => {
  const navigation = useNavigation<ShopsListNavigationProp>();
  const route = useRoute<ShopsListRouteProp>();
  const { categoryId } = route.params;
  
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failedImages, setFailedImages] = useState<{[key: string]: boolean}>({});
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [loadAttempts, setLoadAttempts] = useState(0);

  // Add a reference to track if component is mounted
  const isMountedRef = React.useRef(true);
  const dataLoadedRef = React.useRef(false);
  
  // Function to force immediate data loading
  const forceLoadData = React.useCallback(() => {
    if (!dataLoadedRef.current && categoryId) {
      console.log("ShopsList - FORCE LOADING DATA for category:", categoryId);
      setLoading(true);
      loadData();
      dataLoadedRef.current = true;
    }
  }, [categoryId]);

  // Immediate execution - like componentDidMount
  React.useLayoutEffect(() => {
    console.log("ShopsList - Component MOUNTED, attempting immediate data load");
    // This is called synchronously right after render
    forceLoadData();
    
    // Try again in 100ms as a backup
    const immediateTimer = setTimeout(() => {
      if (isMountedRef.current && !dataLoadedRef.current) {
        console.log("ShopsList - Immediate timer fired, loading data");
        forceLoadData();
      }
    }, 100);
    
    return () => {
      clearTimeout(immediateTimer);
    };
  }, []);

  // Retry mechanism - if data doesn't load, retry up to 3 times
  useEffect(() => {
    if (loadAttempts > 0 && loadAttempts < 4 && sections.length === 0 && !loading) {
      console.log(`ShopsList - Retry attempt ${loadAttempts} for category: ${categoryId}`);
      const retryTimer = setTimeout(() => {
        if (isMountedRef.current) {
          setLoading(true);
          loadData();
        }
      }, 1000 * loadAttempts); // Increasing backoff
      
      return () => clearTimeout(retryTimer);
    }
  }, [loadAttempts, sections.length, loading]);

  useEffect(() => {
    // Clear any previous state when categoryId changes
    setShops([]);
    setProducts([]);
    setSections([]);
    setDebugInfo('Starting fresh data load...');
    
    // Set a small timeout to ensure state is reset before loading
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        loadData();
      }
    }, 100);
    
    return () => {
      clearTimeout(timer);
      isMountedRef.current = false;
    };
  }, [categoryId]);
  
  // Add component mount effect
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Use focus effect to load data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log("ShopsList - Screen is focused");
      if (categoryId) {
        // If data never loaded successfully or has been a while since last load
        if (!dataLoadedRef.current || sections.length === 0) {
          console.log("ShopsList - Screen focused but no data loaded yet - loading now");
          // Clear previous data
          setShops([]);
          setProducts([]);
          setSections([]);
          // Reset load attempts
          setLoadAttempts(0);
          // Show loading indicator
          setLoading(true);
          // Load fresh data
          loadData();
        } else {
          console.log("ShopsList - Screen focused, data already loaded:", sections.length, "sections");
        }
      }
      return () => {
        // Cleanup function when screen loses focus
      };
    }, [categoryId, sections.length, dataLoadedRef.current])
  );

  // Direct function to load shops for more reliable results
  const directLoadShops = async (catId: string) => {
    try {
      console.log("Loading shops for category:", catId);
      
      if (!catId || catId.trim() === '') {
        console.error("Invalid category ID for shop query:", catId);
        return [];
      }
      
      const shopsRef = collection(db, 'shops');
      console.log(`Preparing Firestore query for shops collection with categoryId='${catId}'`);
      
      const shopsQuery = query(
        shopsRef, 
        where('categoryId', '==', catId)
      );
      
      console.log("Executing shops query...");
      const querySnapshot = await getDocs(shopsQuery);
      console.log(`Shops query completed. Size: ${querySnapshot.size}, Empty: ${querySnapshot.empty}`);
      
      const shopsData: Shop[] = [];
      
      if (querySnapshot.empty) {
        console.log("No shops found for category:", catId);
      }
      
      try {
        querySnapshot.forEach((doc) => {
          try {
            const data = doc.data();
            shopsData.push({
              id: doc.id,
              name: data.name || 'Unnamed Shop',
              description: data.description || '',
              address: data.address || 'No address',
              phone: data.phone || 'No phone',
              image: data.image || PLACEHOLDER_IMAGE,
              categoryId: data.categoryId || catId,
              owner: data.owner || '',
              whatsapp: data.whatsapp || '',
              // Map other Shop fields as needed
            } as Shop);
          } catch (docError) {
            console.error(`Error processing shop document ${doc.id}:`, docError);
          }
        });
      } catch (loopError) {
        console.error('Error iterating through shops query results:', loopError);
      }
      
      console.log(`Found ${shopsData.length} shops for category ${catId}`);
      return shopsData;
    } catch (error) {
      console.error('Error in directLoadShops:', error);
      
      // Show alert in development mode for debugging
      if (__DEV__) {
        Alert.alert(
          "Shops Query Error",
          `Failed to query shops: ${error}`,
          [{ text: "OK" }]
        );
      }
      
      return [];
    }
  };

  const loadData = async () => {
    try {
      // Increment load attempts for retry mechanism
      setLoadAttempts(prev => prev + 1);
      
      setLoading(true);
      setDebugInfo('Loading category data...');
      
      // Ensure we have a valid categoryId
      if (!categoryId) {
        console.error("Missing categoryId in route params");
        setDebugInfo('Error: No categoryId provided');
        
        if (__DEV__) {
          Alert.alert(
            "Navigation Error",
            "No category ID was provided in the navigation parameters.",
            [{ text: "OK" }]
          );
        }
        
        setLoading(false);
        return;
      }
      
      console.log("ShopsList - Loading data for category ID:", categoryId, typeof categoryId);
      
      // Load category name
      const category = await getCategoryById(categoryId);
      if (category) {
        console.log("Found category:", category.name);
        setCategoryName(category.name);
        setDebugInfo(prev => prev + `\nCategory: ${category.name}`);
      } else {
        console.warn("Category not found for ID:", categoryId);
        setDebugInfo(prev => prev + '\nCategory not found');
        
        if (__DEV__) {
          Alert.alert(
            "Data Error",
            `Category with ID "${categoryId}" was not found in the database.`,
            [{ text: "OK" }]
          );
        }
      }
      
      // Try the direct shop loading method
      setDebugInfo(prev => prev + '\nLoading shops directly...');
      const directShopsData = await directLoadShops(categoryId);
      
      // As a fallback, also try the utility function
      setDebugInfo(prev => prev + '\nLoading shops from utility...');
      const utilityShopsData = await getShopsByCategory(categoryId);
      
      // Combine and deduplicate the results
      const combinedShops = [...directShopsData];
      utilityShopsData.forEach(shop => {
        if (!combinedShops.some(s => s.id === shop.id)) {
          combinedShops.push(shop);
        }
      });
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setShops(combinedShops);
        setDebugInfo(prev => prev + `\nFound ${combinedShops.length} unique shops`);
        
        // Load products from productsC collection
        const productsData = await loadProductsByCategory(categoryId);
        
        // Organize data into sections by shop
        if (isMountedRef.current) {
          organizeDataBySections(combinedShops);
          
          // We'll check sections length in the effect that watches loadAttempts
          // This ensures we retry if needed
        }
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      setDebugInfo(prev => prev + `\nError: ${error}`);
      if (isMountedRef.current) {
        setShops([]);
        setProducts([]);
        setSections([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };
  
  const loadProductsByCategory = async (categoryId: string) => {
    try {
      setDebugInfo(prev => prev + '\nLoading products...');
      console.log("ShopsList - Loading products for category:", categoryId);
      
      // First try with exact categoryId match
      const productsRef = collection(db, 'productsC');
      let querySnapshot: any = { empty: true, size: 0, forEach: () => {} };
      
      try {
        // Log info about the query we're about to make
        console.log(`Preparing Firestore query for productsC collection with category='${categoryId}'`);
        
        // Try with direct equality first
        const q = query(
          productsRef,
          where('category', '==', categoryId),
          limit(50)
        );
        
        console.log("Executing Firestore query...");
        querySnapshot = await getDocs(q);
        
        console.log(`Query completed. Size: ${querySnapshot.size}, Empty: ${querySnapshot.empty}`);
        setDebugInfo(prev => prev + `\nDirect query found ${querySnapshot.size} products`);
      } catch (error) {
        console.error('Error in primary product query:', error);
        setDebugInfo(prev => prev + `\nError in primary query: ${error}`);
        
        // Show alert in development mode for debugging
        if (__DEV__) {
          Alert.alert(
            "Query Error",
            `Failed to query products: ${error}`,
            [{ text: "OK" }]
          );
        }
        // Keep the default empty querySnapshot
      }
      
      const productsData: Product[] = [];
      
      try {
        querySnapshot.forEach((doc: any) => {
          try {
            const data = doc.data();
            productsData.push({
              id: doc.id,
              name: data.name || 'Unnamed Product',
              price: data.price || 0,
              image: data.image || PLACEHOLDER_IMAGE,
              description: data.description || '',
              category: data.category || categoryId,
              shopName: data.shopName || 'No Shop',
              shopId: data.shopId || null,
              quantity: data.quantity || 1,
              unit: data.unit || 'unit',
              location: data.location || '',
              // Map other fields as needed
            } as Product);
          } catch (itemError) {
            console.error(`Error processing product document ${doc.id}:`, itemError);
          }
        });
      } catch (loopError) {
        console.error('Error iterating through query results:', loopError);
      }
      
      console.log(`Processed ${productsData.length} products from query`);
      setDebugInfo(prev => prev + `\nTotal products found: ${productsData.length}`);
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setProducts(productsData);
        
        // If we got no products, add a test product for debugging
        if (productsData.length === 0 && __DEV__) {
          const testProduct: Product = {
            id: 'test-product',
            name: 'Test Product (Debug Only)',
            price: 100,
            image: PLACEHOLDER_IMAGE,
            description: 'This is a test product for debugging',
            category: categoryId,
            shopName: 'Test Shop',
            quantity: 1,
            unit: 'unit',
          };
          setProducts([testProduct]);
          setDebugInfo(prev => prev + '\nAdded test product for debugging');
        }
      }
      
      return productsData;
      
    } catch (error) {
      console.error('Error loading products:', error);
      setDebugInfo(prev => prev + `\nError loading products: ${error}`);
      return [];
    }
  };
  
  const organizeDataBySections = (shopsData: Shop[]) => {
    if (!isMountedRef.current) return;
    
    setDebugInfo(prev => prev + '\nOrganizing data into sections...');
    console.log("ShopsList - Organizing data into sections");
    
    try {
      // First check if we have any data at all
      if (products.length === 0 && shopsData.length === 0) {
        setSections([]);
        setDebugInfo(prev => prev + '\nNo data to organize');
        return;
      }
      
      // Take a snapshot of current products to avoid race conditions
      const currentProducts = [...products];
      
      // Create a map to store products by shop
      const shopProductsMap = new Map<string, Product[]>();
      
      // Group products by shopName
      currentProducts.forEach(product => {
        const shopName = product.shopName || 'Other';
        if (!shopProductsMap.has(shopName)) {
          shopProductsMap.set(shopName, []);
        }
        shopProductsMap.get(shopName)?.push(product);
      });
      
      setDebugInfo(prev => prev + `\nGrouped products by ${shopProductsMap.size} shop names`);
      
      // Create sections using shops where possible
      const sectionsData: Section[] = [];
      
      // Add shops that exist in the database
      let shopsWithProducts = 0;
      shopsData.forEach(shop => {
        // Find products for this shop by id or name match
        const shopProducts = currentProducts.filter(p => 
          p.shopId === shop.id || 
          (!p.shopId && p.shopName === shop.name)
        );
        
        if (shopProducts.length > 0) {
          shopsWithProducts++;
          sectionsData.push({
            shopId: shop.id,
            shopName: shop.name,
            shopImage: shop.image || PLACEHOLDER_IMAGE,
            shopDescription: shop.description || '',
            shopAddress: shop.address || '',
            shopPhone: shop.phone || '',
            data: shopProducts
          });
          
          // Remove these products from the map
          shopProducts.forEach(p => {
            const shopProds = shopProductsMap.get(p.shopName || '');
            if (shopProds) {
              const index = shopProds.findIndex(sp => sp.id === p.id);
              if (index >= 0) {
                shopProds.splice(index, 1);
              }
            }
          });
        }
      });
      
      setDebugInfo(prev => prev + `\n${shopsWithProducts} shops with products`);
      
      // Add remaining products grouped by shop name
      shopProductsMap.forEach((prods, shopName) => {
        if (prods.length > 0) {
          // Get first product for image
          const firstProduct = prods[0];
          
          sectionsData.push({
            shopId: firstProduct.shopId || 'virtual-shop-' + shopName,
            shopName: shopName,
            shopImage: firstProduct.image || PLACEHOLDER_IMAGE,
            shopDescription: `Products by ${shopName}`,
            shopAddress: firstProduct.location || 'Location not specified',
            shopPhone: 'Contact via app',
            data: prods
          });
        }
      });
      
      setDebugInfo(prev => prev + `\nTotal sections created: ${sectionsData.length}`);
      console.log(`ShopsList - Created ${sectionsData.length} sections`);
      
      // If we have no sections but do have products, create a default section
      if (sectionsData.length === 0 && currentProducts.length > 0) {
        sectionsData.push({
          shopId: 'default-shop',
          shopName: 'All Products',
          shopImage: PLACEHOLDER_IMAGE,
          shopDescription: 'All products in this category',
          shopAddress: 'Various locations',
          shopPhone: '',
          data: currentProducts
        });
        setDebugInfo(prev => prev + '\nCreated default section for all products');
      }
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setSections(sectionsData);
        
        // Mark data as successfully loaded if we have sections
        if (sectionsData.length > 0) {
          console.log("ShopsList - Data successfully loaded with sections:", sectionsData.length);
          dataLoadedRef.current = true;
        }
      }
    } catch (error) {
      console.error('Error organizing sections:', error);
      setDebugInfo(prev => prev + `\nError organizing sections: ${error}`);
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        // Create a fallback section with all products
        if (products.length > 0) {
          const fallbackSection = [{
            shopId: 'fallback-shop',
            shopName: 'All Products',
            shopImage: PLACEHOLDER_IMAGE,
            shopDescription: 'Fallback section due to error',
            shopAddress: '',
            shopPhone: '',
            data: products
          }];
          
          setSections(fallbackSection);
          
          // We have a fallback, so mark as loaded
          console.log("ShopsList - Data loaded with fallback section");
          dataLoadedRef.current = true;
        } else {
          setSections([]);
        }
      }
    }
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    setDebugInfo('Refreshing data...');
    console.log("ShopsList - Manual refresh triggered");
    
    // Reset all data states
    setShops([]);
    setProducts([]);
    setSections([]);
    
    await loadData();
    
    if (isMountedRef.current) {
      setRefreshing(false);
    }
  };

  const handleShopPress = (shopId: string) => {
    if (shopId.startsWith('virtual-shop-') || shopId === 'default-shop' || shopId === 'fallback-shop') {
      // For virtual shops, just do nothing or show an info message
      return;
    }
    navigation.navigate('ShopDetails', { shopId });
  };
  
  const handleProductPress = (productId: string) => {
    if (productId === 'test-product') {
      // Don't navigate for test product
      return;
    }
    navigation.navigate('ProductDetails', { productId });
  };
  
  const handleAddProduct = () => {
    navigation.navigate('AddProduct', { 
      preselectedCategoryId: categoryId,
      categoryName: categoryName
    });
  };

  const handleImageError = (id: string) => {
    setFailedImages(prev => ({
      ...prev,
      [id]: true
    }));
  };

  const renderShopHeader = ({ section }: { section: Section }) => (
    <TouchableOpacity
      style={styles.shopHeader}
      onPress={() => handleShopPress(section.shopId)}
    >
      <View style={styles.shopHeaderContent}>
        <Image
          source={{ uri: section.shopImage }}
          style={styles.shopHeaderImage}
          onError={() => handleImageError(section.shopId)}
        />
        <View style={styles.shopHeaderInfo}>
          <Text style={styles.shopHeaderName}>{section.shopName}</Text>
          <Text style={styles.shopHeaderDescription} numberOfLines={1}>
            {section.shopDescription}
          </Text>
          <View style={styles.shopHeaderMeta}>
            <Ionicons name="location-outline" size={12} color={colors.lightText} />
            <Text style={styles.shopHeaderMetaText}>{section.shopAddress}</Text>
          </View>
        </View>
        {!section.shopId.startsWith('virtual-shop-') && 
         section.shopId !== 'default-shop' && 
         section.shopId !== 'fallback-shop' && (
          <Ionicons name="chevron-forward" size={24} color={colors.primary} />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleProductPress(item.id)}
    >
      <Image
        source={{ uri: item.image || PLACEHOLDER_IMAGE }}
        style={styles.productImage}
        onError={() => handleImageError(item.id)}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productPrice}>Rs. {item.price}</Text>
        <Text style={styles.productQuantity}>
          {item.quantity || 1} {item.unit || 'unit'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading {categoryName} data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryName || 'Loading...'}</Text>
        <TouchableOpacity onPress={handleAddProduct}>
          <Ionicons name="add-circle-outline" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {sections.length > 0 ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          renderSectionHeader={renderShopHeader}
          stickySectionHeadersEnabled={true}
          contentContainerStyle={styles.contentContainer}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="basket-outline" size={64} color={colors.lightText} />
          <Text style={styles.emptyText}>No products or shops available</Text>
          <Text style={styles.emptySubtext}>
            Be the first to add products in this category!
          </Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddProduct}
          >
            <Ionicons name="add-circle-outline" size={16} color={colors.white} />
            <Text style={styles.buttonText}>Add Product</Text>
          </TouchableOpacity>
          
          {__DEV__ && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugTitle}>Debug Info:</Text>
              <Text style={styles.debugText}>{debugInfo}</Text>
              <View style={styles.debugActions}>
                <TouchableOpacity 
                  style={styles.debugButton}
                  onPress={handleRefresh}
                >
                  <Text style={styles.debugButtonText}>Manual Reload</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.debugButton}
                  onPress={() => {
                    Alert.alert('Category ID', 
                     `Current category ID: "${categoryId}"\nType: ${typeof categoryId}`);
                  }}
                >
                  <Text style={styles.debugButtonText}>Check ID</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity 
                style={[styles.debugButton, { marginTop: 10, backgroundColor: colors.error }]}
                onPress={() => {
                  Alert.alert(
                    'Force Reload',
                    'Really force reload all data?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'RELOAD', 
                        onPress: () => {
                          console.log("FORCE RELOAD TRIGGERED BY USER");
                          // Reset everything
                          dataLoadedRef.current = false;
                          setLoadAttempts(0);
                          setShops([]);
                          setProducts([]);
                          setSections([]);
                          setLoading(true);
                          // Load with slight delay
                          setTimeout(() => loadData(), 300);
                        }
                      }
                    ]
                  );
                }}
              >
                <Text style={styles.debugButtonText}>FORCE RELOAD</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
    marginTop: 20,
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
    paddingBottom: spacing.lg,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.white,
  },
  contentContainer: {
    paddingBottom: spacing.xl,
  },
  shopHeader: {
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    ...shadows.small,
  },
  shopHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopHeaderImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.md,
  },
  shopHeaderInfo: {
    flex: 1,
  },
  shopHeaderName: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.text,
  },
  shopHeaderDescription: {
    fontSize: fontSizes.sm,
    color: colors.lightText,
    marginBottom: spacing.xs / 2,
  },
  shopHeaderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopHeaderMetaText: {
    fontSize: fontSizes.xs,
    color: colors.lightText,
    marginLeft: spacing.xs / 2,
  },
  productCard: {
    backgroundColor: colors.white,
    margin: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    width: 150,
    ...shadows.small,
  },
  productImage: {
    width: '100%',
    height: 120,
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
    height: 40,
  },
  productPrice: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.primary,
  },
  productQuantity: {
    fontSize: fontSizes.xs,
    color: colors.lightText,
    marginTop: spacing.xs / 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.lightText,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: fontSizes.md,
    color: colors.lightText,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.small,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: fontSizes.md,
    marginLeft: spacing.xs,
  },
  debugContainer: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: borderRadius.md,
    width: '100%',
  },
  debugTitle: {
    fontSize: fontSizes.sm,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    color: colors.error,
  },
  debugText: {
    fontSize: fontSizes.xs,
    color: colors.text,
    fontFamily: 'monospace',
  },
  debugActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    width: '100%',
  },
  debugButton: {
    backgroundColor: colors.primary,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    flex: 1,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
  },
  debugButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: fontSizes.xs,
  },
});

export default ShopsList; 