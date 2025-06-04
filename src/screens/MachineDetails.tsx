import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Machine } from '../types';
import { colors, fontSizes, spacing, borderRadius, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../utilities/firebaseConfig';
import { formatCurrency } from '../utils';
import ScreenHeader from '../components/ScreenHeader';

type MachineDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MachineDetails'>;
type MachineDetailsScreenRouteProp = RouteProp<RootStackParamList, 'MachineDetails'>;

// Add a placeholder image URL
const PLACEHOLDER_IMAGE = 'https://st4.depositphotos.com/14953852/24787/v/450/depositphotos_247872612-stock-illustration-no-image-available-icon-vector.jpg';

// Add a fallback image for most common use
const FALLBACK_IMAGE = 'https://media.istockphoto.com/id/1320356772/photo/tractor-and-agricultural-machinery-on-the-field.jpg';

const MachineDetails = () => {
  const navigation = useNavigation<MachineDetailsScreenNavigationProp>();
  const route = useRoute<MachineDetailsScreenRouteProp>();
  const { machineId } = route.params;
  
  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [loadAttempts, setLoadAttempts] = useState(0);
  
  useFocusEffect(
    React.useCallback(() => {
      console.log('MachineDetails screen focused, loading machine details');
      loadMachineDetails();
      return () => {
        // Cleanup function if needed
      };
    }, [machineId, loadAttempts])
  );
  
  const loadMachineDetails = async () => {
    try {
      setLoading(true);
      console.log(`Loading machine details for ID: ${machineId}, attempt: ${loadAttempts + 1}`);
      
      // Handle case when machineId is not a valid ID
      if (!machineId || machineId === 'undefined' || machineId === 'null') {
        console.error('Invalid machine ID:', machineId);
        setMachine(null);
        setLoading(false);
        return;
      }
      
      let machineDoc;
      
      // First try direct document fetch
      try {
        const machineDocRef = doc(db, 'machines', machineId);
        machineDoc = await getDoc(machineDocRef);
        
        if (machineDoc.exists()) {
          console.log('Successfully retrieved machine data from direct fetch');
        } else {
          console.log('Machine document not found with direct fetch. Will try query.');
          machineDoc = null;
        }
      } catch (directError) {
        console.error('Error in direct document fetch:', directError);
        machineDoc = null;
      }
      
      // If direct fetch failed, try query approach
      if (!machineDoc || !machineDoc.exists()) {
        try {
          console.log('Attempting to query machine by ID...');
          const machinesRef = collection(db, 'machines');
          const machineQuery = query(machinesRef, where('__name__', '==', machineId));
          const querySnapshot = await getDocs(machineQuery);
          
          if (!querySnapshot.empty) {
            machineDoc = querySnapshot.docs[0];
            console.log('Successfully retrieved machine data from query approach');
          } else {
            console.log('Machine document not found with query approach either.');
            
            // If it's "mock-machine-id", try to get the most recent machine
            if (machineId === 'mock-machine-id') {
              console.log('Mock ID detected, attempting to fetch most recent machine...');
              const recentQuery = query(
                collection(db, 'machines'),
                orderBy('createdAt', 'desc'),
                limit(1)
              );
              const recentSnapshot = await getDocs(recentQuery);
              
              if (!recentSnapshot.empty) {
                machineDoc = recentSnapshot.docs[0];
                console.log('Using most recent machine as fallback');
              }
            }
          }
        } catch (queryError) {
          console.error('Error in query approach:', queryError);
        }
      }
      
      // Process the machine document if found
      if (machineDoc && machineDoc.exists()) {
        const machineData = machineDoc.data();
        console.log('Machine data retrieved:', machineData.name);
        
        // Format dates correctly
        const createdAt = machineData.createdAt ? 
          (machineData.createdAt.toDate ? machineData.createdAt.toDate() : machineData.createdAt) : 
          new Date();
        
        const updatedAt = machineData.updatedAt ? 
          (machineData.updatedAt.toDate ? machineData.updatedAt.toDate() : machineData.updatedAt) : 
          new Date();
        
        // Handle different image formats
        let imageUrl = machineData.image || PLACEHOLDER_IMAGE;
        
        // Check if image is a local file URI or invalid format
        if (imageUrl.startsWith('file:///')) {
          console.log('Local file URI detected. Using fallback image.');
          imageUrl = FALLBACK_IMAGE;
        } else if (typeof imageUrl !== 'string' || (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:image'))) {
          console.log('Invalid image format. Using fallback.');
          imageUrl = FALLBACK_IMAGE;
        }
        
        const machine: Machine = {
          id: machineDoc.id,
          name: machineData.name || '',
          price: machineData.price || 0,
          description: machineData.description || '',
          category: machineData.category || '',
          status: machineData.status || 'unavailable',
          contact: machineData.contact || '',
          phone: machineData.phone || '',
          location: machineData.location || '',
          image: imageUrl,
          createdAt: createdAt,
          updatedAt: updatedAt
        };
        
        setMachine(machine);
      } else {
        console.log(`No machine document found with ID: ${machineId}`);
        setMachine(null);
        
        // If we didn't find the machine and this isn't our last attempt, retry
        if (loadAttempts < 2) {
          console.log(`Will retry loading machine (attempt ${loadAttempts + 1})`);
          setTimeout(() => {
            setLoadAttempts(prev => prev + 1);
          }, 2000); // Retry after 2 seconds
        }
      }
    } catch (error) {
      console.error('Error loading machine details:', error);
      Alert.alert('Error', 'Failed to load machine details. Please try again.');
      setMachine(null);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCallPress = () => {
    if (machine && machine.phone) {
      Linking.openURL(`tel:${machine.phone}`);
    }
  };
  
  const handleImageError = () => {
    console.log('Image loading error, using placeholder');
    setImageError(true);
  };
  
  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Machine Details" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading machine details...</Text>
        </View>
      </View>
    );
  }
  
  if (!machine) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Machine Details" showBackButton />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Machine not found</Text>
          <TouchableOpacity
            style={styles.backToHomeButton}
            onPress={() => navigation.navigate('MachineCategories')}
          >
            <Text style={styles.backToHomeText}>Back to Machines</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
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
  
  return (
    <View style={styles.container}>
      <ScreenHeader title="Machine Details" showBackButton />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Machine Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageError ? PLACEHOLDER_IMAGE : machine.image }}
            style={styles.machineImage}
            onError={handleImageError}
            resizeMode="cover"
            defaultSource={require('../assets/images/logo.png')}
            fadeDuration={300}
          />
          <View 
            style={[
              styles.statusBadge, 
              { backgroundColor: getStatusColor(machine.status) }
            ]}
          >
            <Text style={styles.statusText}>{getStatusText(machine.status)}</Text>
          </View>
        </View>
        
        {/* Machine Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.machineName}>{machine.name}</Text>
          <Text style={styles.machinePrice}>{formatCurrency(machine.price)}</Text>
          
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color={colors.lightText} />
            <Text style={styles.locationText}>{machine.location || 'Location not specified'}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{machine.description}</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.contactItem}>
            <Ionicons name="person-outline" size={16} color={colors.lightText} />
            <Text style={styles.contactText}>{machine.contact}</Text>
          </View>
          
          <TouchableOpacity style={styles.contactItem} onPress={handleCallPress}>
            <Ionicons name="call-outline" size={16} color={colors.primary} />
            <Text style={styles.phoneText}>{machine.phone}</Text>
          </TouchableOpacity>
        </View>
        
        {/* Contact Button */}
        <TouchableOpacity 
          style={styles.contactButton}
          onPress={handleCallPress}
        >
          <Ionicons name="call" size={20} color={colors.white} />
          <Text style={styles.contactButtonText}>Contact Seller</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
    marginTop: 30,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl * 2,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: fontSizes.lg,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  backToHomeButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  backToHomeText: {
    color: colors.white,
    fontWeight: '600',
  },
  imageContainer: {
    width: '100%',
    height: 320,
    position: 'relative',
    marginTop: 30,
  },
  machineImage: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: fontSizes.sm,
  },
  infoContainer: {
    backgroundColor: colors.white,
    margin: spacing.lg,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...shadows.small,
  },
  machineName: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  machinePrice: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  locationText: {
    fontSize: fontSizes.sm,
    color: colors.lightText,
    marginLeft: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  descriptionText: {
    fontSize: fontSizes.sm,
    color: colors.text,
    lineHeight: spacing.lg,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  contactText: {
    fontSize: fontSizes.md,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  phoneText: {
    fontSize: fontSizes.md,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  contactButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    ...shadows.medium,
  },
  contactButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: fontSizes.md,
    marginLeft: spacing.sm,
  },
});

export default MachineDetails; 