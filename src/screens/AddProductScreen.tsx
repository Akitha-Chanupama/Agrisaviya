import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Category, Shop } from '../types';
import { colors, fontSizes, spacing, borderRadius, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Picker } from '@react-native-picker/picker';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../utilities/firebaseConfig';
import { getAllCategories } from '../utilities/firestoreUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants for AsyncStorage keys
const USER_EMAIL_KEY = 'user_email';
const USER_NAME_KEY = 'user_name';

const PLACEHOLDER_IMAGE = 'https://st4.depositphotos.com/14953852/24787/v/450/depositphotos_247872612-stock-illustration-no-image-available-icon-vector.jpg';

type AddProductScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddProduct'>;
type AddProductScreenRouteProp = RouteProp<RootStackParamList, 'AddProduct'>;

const AddProductScreen = () => {
  const navigation = useNavigation<AddProductScreenNavigationProp>();
  const route = useRoute<AddProductScreenRouteProp>();
  const preselectedCategoryId = route.params?.preselectedCategoryId;
  const preselectedCategoryName = route.params?.categoryName;
  
  // Form state
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(preselectedCategoryId || '');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('kg');
  const [location, setLocation] = useState('');
  const [shopName, setShopName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  
  // Image state
  const [images, setImages] = useState<string[]>([]);
  const [imageLoading, setImageLoading] = useState(false);
  
  // App state
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [failedImages, setFailedImages] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    loadCategories();
    loadUserData();
  }, []);
  
  // Load preselected category data
  useEffect(() => {
    if (preselectedCategoryId) {
      setCategory(preselectedCategoryId);
    }
  }, [preselectedCategoryId]);

  const loadUserData = async () => {
    try {
      // First try to get from Firebase Auth
      const currentUser = auth.currentUser;
      
      if (currentUser && currentUser.email) {
        setUserEmail(currentUser.email);
      } else {
        // If not available in Firebase Auth, try AsyncStorage
        const storedEmail = await AsyncStorage.getItem(USER_EMAIL_KEY);
        if (storedEmail) {
          setUserEmail(storedEmail);
        }
      }
      
      // Try to get user name from AsyncStorage for shop name suggestion
      const userName = await AsyncStorage.getItem(USER_NAME_KEY);
      if (userName) {
        setShopName(`${userName}'s Shop`); // Set a default shop name based on user name
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const categoriesData = await getAllCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'Failed to load categories. Please try again.');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleImageError = (id: string) => {
    setFailedImages(prev => ({
      ...prev,
      [id]: true
    }));
  };

  const pickImage = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'You need to grant permission to access your photos.');
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true, // Request base64 data
      });
      
      if (!result.canceled) {
        setImageLoading(true);
        
        try {
          // Get the image uri
          const uri = result.assets[0].uri;
          
          // If base64 is already available in the result, use it
          if (result.assets[0].base64) {
            const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
            setImages(prev => [...prev, base64Image]);
          } else {
            // Otherwise read the file and convert to base64
            const base64 = await FileSystem.readAsStringAsync(uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            
            const base64Image = `data:image/jpeg;base64,${base64}`;
            setImages(prev => [...prev, base64Image]);
          }
          
          console.log('Image converted to Base64 successfully');
        } catch (error) {
          console.error('Error processing image:', error);
          Alert.alert('Error', 'Failed to process image. Please try again.');
        } finally {
          setImageLoading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      setImageLoading(false);
    }
  };

  const takePhoto = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'You need to grant permission to access your camera.');
        return;
      }
      
      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true, // Request base64 data
      });
      
      if (!result.canceled) {
        setImageLoading(true);
        
        try {
          // Get the image uri
          const uri = result.assets[0].uri;
          
          // If base64 is already available in the result, use it
          if (result.assets[0].base64) {
            const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
            setImages(prev => [...prev, base64Image]);
          } else {
            // Otherwise read the file and convert to base64
            const base64 = await FileSystem.readAsStringAsync(uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            
            const base64Image = `data:image/jpeg;base64,${base64}`;
            setImages(prev => [...prev, base64Image]);
          }
          
          console.log('Photo converted to Base64 successfully');
        } catch (error) {
          console.error('Error processing photo:', error);
          Alert.alert('Error', 'Failed to process photo. Please try again.');
        } finally {
          setImageLoading(false);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      setImageLoading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Missing Information', 'Please enter a product name');
      return false;
    }
    
    if (!price.trim() || isNaN(parseFloat(price))) {
      Alert.alert('Invalid Price', 'Please enter a valid price');
      return false;
    }
    
    if (!category) {
      Alert.alert('Missing Information', 'Please select a category');
      return false;
    }
    
    if (!description.trim()) {
      Alert.alert('Missing Information', 'Please enter a product description');
      return false;
    }
    
    if (!shopName.trim()) {
      Alert.alert('Missing Information', 'Please enter your shop name');
      return false;
    }
    
    if (images.length === 0) {
      Alert.alert('Missing Image', 'Please add at least one product image');
      return false;
    }
    
    if (!userEmail) {
      Alert.alert('Error', 'Unable to determine user email. Please log in again.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      
      // Get current user
      const currentUser = auth.currentUser;
      
      // First check if a shop with this name already exists in this category
      let shopId = null;
      try {
        const shopsRef = collection(db, 'shops');
        const q = query(
          shopsRef, 
          where('categoryId', '==', category),
          where('name', '==', shopName)
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          // Shop exists, use its ID
          shopId = querySnapshot.docs[0].id;
          console.log('Found existing shop:', shopId);
        } else {
          // Create a new shop
          const shopData = {
            name: shopName,
            categoryId: category,
            owner: userEmail,
            phone: 'Not provided',
            address: location || 'Not provided',
            description: `Shop for ${shopName}`,
            image: images[0], // Use the first product image as the shop image
            products: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          
          const shopRef = await addDoc(collection(db, 'shops'), shopData);
          shopId = shopRef.id;
          console.log('Created new shop:', shopId);
        }
      } catch (error) {
        console.error('Error checking/creating shop:', error);
        // Continue with product creation even if shop creation fails
      }
      
      // Create product object
      const productData = {
        name,
        price: parseFloat(price),
        description,
        category,
        quantity: parseInt(quantity),
        unit,
        location,
        shopName,
        shopId, // Now we have a shop ID
        image: images[0], // Primary image
        additionalImages: images.slice(1), // Additional images if any
        sellerId: currentUser ? currentUser.uid : 'anonymous',
        sellerName: currentUser?.displayName || shopName || 'Anonymous',
        sellerEmail: userEmail,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      // Save to Firestore
      const productRef = await addDoc(collection(db, 'productsC'), productData);
      
      // If we have a shop ID, add this product to the shop's products array
      if (shopId) {
        try {
          const shopsRef = collection(db, 'shops');
          const q = query(shopsRef, where('__name__', '==', shopId));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const shopDoc = querySnapshot.docs[0];
            const shopData = shopDoc.data();
            const products = shopData.products || [];
            
            // Add the new product to the shop's products array
            await addDoc(collection(db, `shops/${shopId}/products`), {
              productId: productRef.id,
              addedAt: serverTimestamp()
            });
            
            console.log('Added product to shop');
          }
        } catch (error) {
          console.error('Error updating shop with product:', error);
          // Continue even if this fails
        }
      }
      
      setIsSubmitting(false);
      
      Alert.alert(
        'Success',
        'Product added successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      
      // Reset form
      setName('');
      setPrice('');
      setDescription('');
      setCategory('');
      setQuantity('1');
      setUnit('kg');
      setLocation('');
      setImages([]);
      setShopName('');
      
    } catch (error) {
      console.error('Error adding product:', error);
      setIsSubmitting(false);
      Alert.alert('Error', 'Failed to add product. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Product</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Information</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Product Name*</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter product name"
              placeholderTextColor={colors.lightText}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Category*</Text>
            {categoriesLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Loading categories...</Text>
              </View>
            ) : (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={category}
                  onValueChange={(itemValue) => setCategory(itemValue)}
                  style={styles.picker}
                  mode="dropdown"
                  enabled={!preselectedCategoryId}
                >
                  <Picker.Item label={preselectedCategoryId ? (preselectedCategoryName || "Selected Category") : "Select a category"} value="" color={colors.lightText} />
                  {categories.map((cat) => (
                    <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
                  ))}
                </Picker>
              </View>
            )}
            {preselectedCategoryId && preselectedCategoryName && (
              <Text style={styles.preselectedText}>Using category: {preselectedCategoryName}</Text>
            )}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Shop Name*</Text>
            <TextInput
              style={styles.input}
              value={shopName}
              onChangeText={setShopName}
              placeholder="Enter your shop name"
              placeholderTextColor={colors.lightText}
            />
            <Text style={styles.helperText}>
              Enter the name of your shop or business
            </Text>
          </View>
          
          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 2, marginRight: spacing.md }]}>
              <Text style={styles.label}>Price (Rs)*</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="0.00"
                placeholderTextColor={colors.lightText}
                keyboardType="numeric"
              />
            </View>
            
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="1"
                placeholderTextColor={colors.lightText}
                keyboardType="numeric"
              />
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Unit</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={unit}
                onValueChange={(itemValue) => setUnit(itemValue)}
                style={styles.picker}
                mode="dropdown"
              >
                <Picker.Item label="kg" value="kg" />
                <Picker.Item label="g" value="g" />
                <Picker.Item label="liter" value="liter" />
                <Picker.Item label="piece" value="piece" />
                <Picker.Item label="pack" value="pack" />
                <Picker.Item label="box" value="box" />
              </Picker>
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Enter your location"
              placeholderTextColor={colors.lightText}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Description*</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter product description"
              placeholderTextColor={colors.lightText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          
          {userEmail ? (
            <View style={styles.userInfoContainer}>
              <Ionicons name="mail-outline" size={16} color={colors.lightText} />
              <Text style={styles.userInfoText}>Product will be listed with: {userEmail}</Text>
            </View>
          ) : (
            <View style={styles.userInfoContainer}>
              <Ionicons name="warning-outline" size={16} color={colors.error} />
              <Text style={styles.userInfoTextError}>No user email found. Please log in again.</Text>
            </View>
          )}
        </View>
        
        {/* Product Images Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Images</Text>
          <Text style={styles.sectionSubtitle}>Add up to 5 images of your product</Text>
          
          <View style={styles.imagesContainer}>
            {images.map((image, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri: image }} style={styles.productImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            
            {images.length < 5 && (
              <View style={styles.imageButtons}>
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={pickImage}
                  disabled={imageLoading}
                >
                  {imageLoading ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <Ionicons name="images" size={24} color={colors.white} />
                      <Text style={styles.addImageText}>Gallery</Text>
                    </>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={takePhoto}
                  disabled={imageLoading}
                >
                  {imageLoading ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <Ionicons name="camera" size={24} color={colors.white} />
                      <Text style={styles.addImageText}>Camera</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {images.length === 0 && !imageLoading && (
            <View style={styles.noImagesContainer}>
              <Ionicons name="images-outline" size={48} color={colors.lightText} />
              <Text style={styles.noImagesText}>No images added yet</Text>
              <Text style={styles.noImagesSubtext}>
                Add at least one image of your product
              </Text>
            </View>
          )}
        </View>
        
        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (isSubmitting || imageLoading) && styles.disabledButton
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting || imageLoading}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={colors.white} />
              <Text style={styles.submitButtonText}>Add Product</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
    marginTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.lightText,
    marginBottom: spacing.md,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 50,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  imageWrapper: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  imageButtons: {
    flexDirection: 'row',
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    minWidth: 100,
  },
  addImageText: {
    color: colors.white,
    marginLeft: spacing.xs,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  noImagesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  noImagesText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.lightText,
    marginTop: spacing.sm,
  },
  noImagesSubtext: {
    fontSize: fontSizes.sm,
    color: colors.lightText,
    marginTop: spacing.xs,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    ...shadows.small,
  },
  submitButtonText: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.white,
    marginLeft: spacing.xs,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
  },
  loadingText: {
    marginLeft: spacing.sm,
    fontSize: fontSizes.sm,
    color: colors.lightText,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  userInfoText: {
    fontSize: fontSizes.sm,
    color: colors.lightText,
    marginLeft: spacing.xs,
    fontStyle: 'italic',
  },
  userInfoTextError: {
    fontSize: fontSizes.sm,
    color: colors.error,
    marginLeft: spacing.xs,
    fontStyle: 'italic',
  },
  preselectedText: {
    fontSize: fontSizes.sm,
    color: colors.primary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  helperText: {
    fontSize: fontSizes.xs,
    color: colors.lightText,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
});

export default AddProductScreen; 