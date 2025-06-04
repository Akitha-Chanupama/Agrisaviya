import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Machine } from '../types';
import { colors, fontSizes, spacing, borderRadius, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/ScreenHeader';
import { getMachinesByCategoryId } from '../utilities/firestoreUtils';
import { formatCurrency } from '../utils';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../utilities/firebaseConfig';

type MachineListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MachineList'>;
type MachineListScreenRouteProp = RouteProp<RootStackParamList, 'MachineList'>;

// Add a placeholder image URL
const PLACEHOLDER_IMAGE = 'https://st4.depositphotos.com/14953852/24787/v/450/depositphotos_247872612-stock-illustration-no-image-available-icon-vector.jpg';
const FALLBACK_IMAGE = 'https://media.istockphoto.com/id/1320356772/photo/tractor-and-agricultural-machinery-on-the-field.jpg';

const MachineList = () => {
  const navigation = useNavigation<MachineListScreenNavigationProp>();
  const route = useRoute<MachineListScreenRouteProp>();
  const { categoryId, categoryName } = route.params;
  
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [failedImages, setFailedImages] = useState<{[key: string]: boolean}>({});
  
  useFocusEffect(
    React.useCallback(() => {
      console.log(`MachineList screen focused, loading machines for category: ${categoryName}`);
      loadMachines();
      return () => {
        // Cleanup function if needed
      };
    }, [categoryId])
  );
  
  const loadMachines = async () => {
    try {
      setLoading(true);
      console.log(`Loading machines for category ID: ${categoryId}`);
      
      // Validate category ID
      if (!categoryId) {
        console.error('Invalid category ID');
        setMachines([]);
        setLoading(false);
        return;
      }
      
      // Try to get machines using the utility function
      let machinesData: Machine[] = [];
      
      try {
        console.log('Fetching machines using utility function...');
        machinesData = await getMachinesByCategoryId(categoryId);
        console.log(`Utility function returned ${machinesData.length} machines`);
      } catch (utilityError) {
        console.error('Error using utility function:', utilityError);
      }
      
      // If utility function failed or returned no results, try direct query
      if (machinesData.length === 0) {
        try {
          console.log('Attempting direct Firestore query...');
          const machinesRef = collection(db, 'machines');
          const machinesQuery = query(
            machinesRef,
            where('category', '==', categoryId),
            orderBy('createdAt', 'desc')
          );
          
          const querySnapshot = await getDocs(machinesQuery);
          
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Format dates properly
            const createdAt = data.createdAt ? 
              (data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt) : 
              new Date();
            
            const updatedAt = data.updatedAt ? 
              (data.updatedAt.toDate ? data.updatedAt.toDate() : data.updatedAt) : 
              new Date();
            
            machinesData.push({
              id: doc.id,
              name: data.name || '',
              price: data.price || 0,
              description: data.description || '',
              category: data.category || '',
              status: data.status || 'unavailable',
              contact: data.contact || '',
              phone: data.phone || '',
              location: data.location || '',
              image: data.image || '',
              createdAt: createdAt,
              updatedAt: updatedAt
            });
          });
          
          console.log(`Direct query returned ${machinesData.length} machines`);
        } catch (queryError) {
          console.error('Error with direct query:', queryError);
        }
      }
      
      // Process machine images to handle potential file:/// URIs
      const processedMachines = machinesData.map(machine => {
        let imageUrl = machine.image;
        
        // Replace local file URIs and invalid images with fallback
        if (!imageUrl || imageUrl === '') {
          console.log(`Machine ${machine.id}: No image found. Using fallback.`);
          imageUrl = FALLBACK_IMAGE;
        } else if (imageUrl.startsWith('file:///')) {
          console.log(`Machine ${machine.id}: Local file URI detected. Using fallback image.`);
          imageUrl = FALLBACK_IMAGE;
        } else if (typeof imageUrl !== 'string' || (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:image'))) {
          console.log(`Machine ${machine.id}: Invalid image format. Using fallback.`);
          imageUrl = FALLBACK_IMAGE;
        }
        
        return {
          ...machine,
          image: imageUrl
        };
      });
      
      setMachines(processedMachines);
      console.log(`Loaded ${processedMachines.length} machines for category ${categoryName}`);
    } catch (error) {
      console.error('Error loading machines:', error);
      Alert.alert('Error', 'Failed to load machines. Please try again.');
      setMachines([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleMachinePress = (machineId: string) => {
    console.log(`Navigating to MachineDetails with machineId: ${machineId}`);
    
    // Make sure we have a valid ID before navigating
    if (!machineId) {
      console.error('Invalid machine ID, cannot navigate to details');
      Alert.alert('Error', 'Cannot view this machine. Please try again.');
      return;
    }
    
    // Navigate to machine details with the selected machine ID
    navigation.navigate('MachineDetails', { machineId });
  };
  
  const handleAddMachine = () => {
    navigation.navigate('AddMachine', { preselectedCategoryId: categoryId, categoryName });
  };
  
  const handleImageError = (id: string) => {
    setFailedImages(prev => ({
      ...prev,
      [id]: true
    }));
  };
  
  const renderMachineItem = ({ item }: { item: Machine }) => (
    <TouchableOpacity
      style={styles.machineCard}
      onPress={() => handleMachinePress(item.id)}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={{ 
            uri: failedImages[item.id] ? PLACEHOLDER_IMAGE : item.image 
          }} 
          style={styles.machineImage} 
          onError={() => handleImageError(item.id)}
        />
        <View 
          style={[
            styles.statusBadge, 
            { backgroundColor: getStatusColor(item.status) }
          ]}
        >
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      <View style={styles.machineInfo}>
        <Text style={styles.machineName}>{item.name}</Text>
        <Text style={styles.machinePrice}>{formatCurrency(item.price)}</Text>
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={14} color={colors.lightText} />
          <Text style={styles.locationText}>
            {item.location || 'Location not specified'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'unavailable':
        return 'Unavailable';
      case 'for_sale':
        return 'For Sale';
      case 'for_rent':
        return 'For Rent';
      default:
        return status;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return colors.success;
      case 'unavailable':
        return colors.error;
      case 'for_sale':
        return colors.primary;
      case 'for_rent':
        return colors.accent;
      default:
        return colors.lightText;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title={`${categoryName} Machines`} showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading machines...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title={`${categoryName} Machines`} showBackButton />

      <View style={styles.content}>
        <FlatList
          data={machines}
          renderItem={renderMachineItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.headerContainer}>
              <Text style={styles.headerText}>{categoryName} Machines</Text>
              <Text style={styles.subHeaderText}>{machines.length} items found</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No machines available in this category</Text>
              <TouchableOpacity 
                style={styles.addFirstButton}
                onPress={handleAddMachine}
              >
                <Text style={styles.addFirstButtonText}>Add First Machine</Text>
              </TouchableOpacity>
            </View>
          }
          refreshing={loading}
          onRefresh={loadMachines}
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
  subHeaderText: {
    fontSize: fontSizes.sm,
    color: colors.lightText,
    marginTop: spacing.xs,
  },
  list: {
    paddingBottom: spacing.xl,
  },
  machineCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.small,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  machineImage: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: fontSizes.xs,
  },
  machineInfo: {
    padding: spacing.md,
  },
  machineName: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  machinePrice: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: fontSizes.sm,
    color: colors.lightText,
    marginLeft: spacing.xs,
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
    marginBottom: spacing.lg,
  },
  addFirstButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  addFirstButtonText: {
    color: colors.white,
    fontWeight: '600',
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

export default MachineList; 