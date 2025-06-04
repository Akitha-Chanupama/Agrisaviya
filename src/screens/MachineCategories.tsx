import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Category } from '../types';
import { colors, fontSizes, spacing, borderRadius, shadows } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../utilities/firebaseConfig';
import { getMachineCategories } from '../utilities/firestoreUtils';

type MachinesCategoriesNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MachineCategories'>;

// Add a placeholder image URL
const PLACEHOLDER_IMAGE = 'https://st4.depositphotos.com/14953852/24787/v/450/depositphotos_247872612-stock-illustration-no-image-available-icon-vector.jpg';

const MachineCategories = () => {
  const navigation = useNavigation<MachinesCategoriesNavigationProp>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [failedImages, setFailedImages] = useState<{[key: string]: boolean}>({});
  const [retryCount, setRetryCount] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      console.log('MachineCategories screen focused, loading categories');
      loadCategories();
      return () => {
        // Cleanup function if needed
      };
    }, [retryCount])
  );

  const loadCategories = async () => {
    try {
      setLoading(true);
      
      // Default mock categories as backup
      const mockCategories = [
        { id: '1', name: 'Tractors', icon: '🚜', image: 'https://cdn.pixabay.com/photo/2021/09/04/13/46/tractor-6597859_1280.jpg' },
        { id: '2', name: 'Harvesters', icon: '🌾', image: 'https://www.shutterstock.com/image-photo/combine-harvester-on-the-field-600w-2303655055.jpg' },
        { id: '3', name: 'Irrigation', icon: '💧', image: 'https://www.shutterstock.com/image-photo/irrigation-system-watering-corn-field-600w-1402678828.jpg' },
        { id: '4', name: 'Seeders', icon: '🌱', image: 'https://www.shutterstock.com/image-photo/tractor-seeding-crops-field-600w-1123239710.jpg' },
        { id: '5', name: 'Storage', icon: '🏢', image: 'https://www.shutterstock.com/image-photo/grain-silos-storage-tanks-600w-1432692355.jpg' },
        { id: '6', name: 'Other', icon: '🔧', image: 'https://www.shutterstock.com/image-photo/agricultural-machinery-600w-1045842635.jpg' },
      ];
      
      // Try to get machine categories from Firebase
      let categoriesData: Category[] = [];
      
      try {
        console.log('Fetching machine categories from Firebase...');
        categoriesData = await getMachineCategories();
        console.log(`Received ${categoriesData.length} categories from Firebase`);
      } catch (error) {
        console.error('Error fetching from Firebase:', error);
        // Will use mock data
      }
      
      if (categoriesData && categoriesData.length > 0) {
        console.log('Using Firebase data for categories');
        setCategories(categoriesData);
      } else {
        console.log('Using mock data for categories');
        setCategories(mockCategories);
        
        // If we're using mock data but this isn't the first try, retry after a delay
        if (retryCount < 2) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 3000); // Retry after 3 seconds
        }
      }
    } catch (error) {
      console.error('Error in loadCategories:', error);
      // Ensure we at least show mock data
      const mockCategories = [
        { id: '1', name: 'Tractors', icon: '🚜', image: 'https://media.istockphoto.com/id/1320356772/photo/tractor-and-agricultural-machinery-on-the-field.jpg' },
        { id: '2', name: 'Harvesters', icon: '🌾', image: 'https://www.shutterstock.com/image-photo/combine-harvester-on-the-field-600w-2303655055.jpg' },
        { id: '3', name: 'Irrigation', icon: '💧', image: 'https://www.shutterstock.com/image-photo/irrigation-system-watering-corn-field-600w-1402678828.jpg' },
        { id: '4', name: 'Seeders', icon: '🌱', image: 'https://www.shutterstock.com/image-photo/tractor-seeding-crops-field-600w-1123239710.jpg' },
        { id: '5', name: 'Storage', icon: '🏢', image: 'https://www.shutterstock.com/image-photo/grain-silos-storage-tanks-600w-1432692355.jpg' },
        { id: '6', name: 'Other', icon: '🔧', image: 'https://www.shutterstock.com/image-photo/agricultural-machinery-600w-1045842635.jpg' },
      ];
      setCategories(mockCategories);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = (categoryId: string, categoryName: string) => {
    // Navigate to MachineList filtered by the selected category
    console.log(`Navigating to MachineList with categoryId: ${categoryId}, categoryName: ${categoryName}`);
    navigation.navigate('MachineList', { 
      categoryId, 
      categoryName 
    });
  };

  const handleAddMachine = () => {
    navigation.navigate('AddMachine');
  };

  const handleImageError = (id: string) => {
    setFailedImages(prev => ({
      ...prev,
      [id]: true
    }));
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => handleCategoryPress(item.id, item.name)}
    >
      <View style={styles.imageContainer}>
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

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Machine Categories" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Machine Categories" showBackButton />

      <View style={styles.content}>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.headerContainer}>
              <Text style={styles.headerText}>Select a Category</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No machine categories available</Text>
            </View>
          }
          refreshing={loading}
          onRefresh={loadCategories}
        />
      </View>

      <TouchableOpacity style={styles.addButton} onPress={handleAddMachine}>
        <Ionicons name="add" size={24} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
    marginTop: 30,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  headerContainer: {
    marginBottom: spacing.md,
  },
  headerText: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  list: {
    paddingBottom: spacing.xl,
  },
  categoryCard: {
    flex: 1,
    margin: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.small,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  categoryImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  categoryIcon: {
    fontSize: fontSizes.xxl,
  },
  categoryName: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
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
  },
  emptyText: {
    fontSize: fontSizes.md,
    color: colors.lightText,
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium,
  },
});

export default MachineCategories; 