import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { colors, fontSizes, spacing, borderRadius, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/ScreenHeader';

type PestDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PestDetails'>;
type PestDetailsScreenRouteProp = RouteProp<RootStackParamList, 'PestDetails'>;

interface PestDetail {
  id: string;
  name: string;
  image: string;
  crops: string[];
  description: string;
  symptoms: string[];
  controlMethods: string[];
  preventionMethods: string[];
}

// Sample detailed data for pests
const pestsDetails: { [key: string]: PestDetail } = {
  '1': {
    id: '1',
    name: 'Thrips',
    image: 'https://images.unsplash.com/photo-1715521565306-839484f887a6?q=80&w=1075&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    crops: ['Rice'],
    description: 'Thrips are tiny, slender insects with fringed wings. They feed by puncturing the outer layer of plant tissue and sucking out the cell contents, causing discolored flecking on leaves and flowers.',
    symptoms: [
      'Silvery or bronze scarring on leaves',
      'Distorted or stunted growth',
      'Black fecal spots on leaves',
      'Damaged flowers and buds',
    ],
    controlMethods: [
      'Apply neem oil or insecticidal soap',
      'Use blue sticky traps to monitor and catch thrips',
      'Release predatory mites or bugs that feed on thrips',
      'Apply appropriate chemical insecticides when infestation is severe',
    ],
    preventionMethods: [
      'Maintain proper field sanitation',
      'Remove weeds that can host thrips',
      'Use reflective mulches to repel thrips',
      'Implement crop rotation',
    ],
  },
  '2': {
    id: '2',
    name: 'Yellow Stem Borer',
    image: 'https://images.unsplash.com/photo-1677095202636-dfb9cd359c14?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8eWVsbG93JTIwc3RlbSUyMGJvcmVyJTIwaW5zZWN0fGVufDB8fDB8fHww',
    crops: ['Rice'],
    description: 'The Yellow Stem Borer is a serious pest of rice. The larvae bore into the stem and feed inside, causing the central shoot to die, resulting in "deadhearts" during the vegetative stage and "whiteheads" during the reproductive stage.',
    symptoms: [
      'Deadhearts (dead central shoot)',
      'Whiteheads (empty panicles)',
      'Presence of moth in field',
      'Entry and exit holes on stems',
    ],
    controlMethods: [
      'Use pheromone traps to catch adult moths',
      'Release natural enemies like Trichogramma parasitoids',
      'Apply appropriate insecticides when infestation is severe',
      'Cut stems at ground level after harvest to kill larvae',
    ],
    preventionMethods: [
      'Plant resistant rice varieties',
      'Synchronous planting in the area',
      'Proper water management',
      'Remove stubble after harvest',
    ],
  },
  '3': {
    id: '3',
    name: 'Coconut Red Weevil',
    image: 'https://media.istockphoto.com/id/2153689444/photo/coconut-rhinoceros-beetle-larvae.jpg?s=612x612&w=is&k=20&c=VvpUhKk8SUOEW6tEen5SP9QOWYnZ9Byt9LR5jbyoOBg=',
    crops: ['Coconut'],
    description: 'The Coconut Red Weevil (Rhynchophorus ferrugineus) is a major pest of coconut palms. The larvae tunnel through the soft tissues of the crown, trunk, and root causing extensive damage that often results in the death of the palm.',
    symptoms: [
      'Yellowing and wilting of leaves',
      'Presence of holes on trunk with brown fluid oozing out',
      'Gnawing sound from the trunk due to larval feeding',
      'Broken or toppled crown',
    ],
    controlMethods: [
      'Set up pheromone traps around plantations',
      'Inject insecticides into infested palms',
      'Remove and destroy severely infested palms',
      'Biological control using fungi or nematodes',
    ],
    preventionMethods: [
      'Regular inspection of palms',
      'Avoid wounds on palms during cultivation',
      'Proper disposal of dead palms',
      'Quarantine measures for transported planting materials',
    ],
  },
};

// Sample detailed data for diseases
const diseasesDetails: { [key: string]: PestDetail } = {
  '1': {
    id: '1',
    name: 'Rice Blast',
    image: 'https://media.istockphoto.com/id/1214406147/photo/rice-blast-disease-rice-diseases-and-damage-rice-grains-and-paddy-in-farms.jpg?s=612x612&w=is&k=20&c=6qDsoRCNPZc55p4d72EEBI78jQkf7OmX6cJPin5eqYk=',
    crops: ['Rice'],
    description: 'Rice blast, caused by the fungus Magnaporthe oryzae, is one of the most serious diseases of rice worldwide. It can affect all above-ground parts of the rice plant.',
    symptoms: [
      'Diamond-shaped lesions with gray centers on leaves',
      'Brown to black spots on stems and leaf collars',
      'Infected panicles break at the base',
      'Partial or unfilled grains',
    ],
    controlMethods: [
      'Apply appropriate fungicides',
      'Plant resistant varieties',
      'Balanced use of fertilizers, especially nitrogen',
      'Adjust planting density to reduce humidity',
    ],
    preventionMethods: [
      'Use disease-free seeds',
      'Proper field drainage',
      'Balanced fertilization',
      'Crop rotation',
    ],
  },
  '2': {
    id: '2',
    name: 'Bacterial Leaf Blight',
    image: 'https://media.istockphoto.com/id/1286441510/photo/septoria-leaf-spot-on-tomato-damaged-by-disease-and-pests-of-tomato-leaves.jpg?s=612x612&w=is&k=20&c=4WcM2mw3Sf0w0Kp-3xYXUmsRdLPEyJtoBaOKWkO1OnI=',
    crops: ['Rice'],
    description: 'Bacterial Leaf Blight (BLB) is caused by Xanthomonas oryzae pv. oryzae. It is a serious bacterial disease of rice in tropical and temperate regions that can reduce yields by up to 50%.',
    symptoms: [
      'Water-soaked lesions at leaf margins',
      'Lesions turn yellow to white as they develop',
      'Affected leaves dry up and die',
      'Discoloration of emerging panicles',
    ],
    controlMethods: [
      'Apply copper-based bactericides',
      'Drain fields to reduce humidity',
      'Balanced use of fertilizers',
      'Remove infected plant debris',
    ],
    preventionMethods: [
      'Plant resistant varieties',
      'Use clean seeds and tools',
      'Proper spacing between plants',
      'Avoid excessive nitrogen application',
    ],
  },
};

const PestDetails = () => {
  const navigation = useNavigation<PestDetailsScreenNavigationProp>();
  const route = useRoute<PestDetailsScreenRouteProp>();
  const { pestId, type } = route.params;
  
  // Get the appropriate data based on pest or disease type
  const detailsData = type === 'pest' ? pestsDetails[pestId] : diseasesDetails[pestId];
  
  if (!detailsData) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Details" showBackButton />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Details not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <ScreenHeader title={detailsData.name} showBackButton />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: detailsData.image }} 
            style={styles.image}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay} />
          <Text style={styles.imageTitle}>{detailsData.name}</Text>
        </View>
        
        {/* Basic Info */}
        <View style={styles.infoContainer}>
          <View style={styles.cropsContainer}>
            <Text style={styles.cropsLabel}>Affects:</Text>
            <View style={styles.cropTags}>
              {detailsData.crops.map((crop, index) => (
                <View key={index} style={styles.cropTag}>
                  <Ionicons name="leaf-outline" size={14} color={colors.success} />
                  <Text style={styles.cropText}>{crop}</Text>
                </View>
              ))}
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{detailsData.description}</Text>
        </View>
        
        {/* Symptoms */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Symptoms</Text>
          {detailsData.symptoms.map((symptom, index) => (
            <View key={index} style={styles.listItem}>
              <Ionicons name="alert-circle-outline" size={20} color={colors.error} style={styles.listIcon} />
              <Text style={styles.listText}>{symptom}</Text>
            </View>
          ))}
        </View>
        
        {/* Control Methods */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Control Methods</Text>
          {detailsData.controlMethods.map((method, index) => (
            <View key={index} style={styles.listItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} style={styles.listIcon} />
              <Text style={styles.listText}>{method}</Text>
            </View>
          ))}
        </View>
        
        {/* Prevention */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Prevention</Text>
          {detailsData.preventionMethods.map((method, index) => (
            <View key={index} style={styles.listItem}>
              <Ionicons name="shield-outline" size={20} color={colors.success} style={styles.listIcon} />
              <Text style={styles.listText}>{method}</Text>
            </View>
          ))}
        </View>
        
        {/* Find Products Button */}
        <TouchableOpacity 
          style={styles.findProductsButton}
          onPress={() => navigation.navigate('ShopsList', { categoryId: 'pesticides' })}
        >
          <Ionicons name="basket-outline" size={20} color={colors.white} />
          <Text style={styles.findProductsText}>Find Control Products</Text>
        </TouchableOpacity>
        
        {/* Expert Help */}
        <View style={styles.expertContainer}>
          <Text style={styles.expertTitle}>Need Expert Help?</Text>
          <Text style={styles.expertDescription}>
            Contact an agricultural expert for personalized advice on managing this {type}.
          </Text>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => Linking.openURL('tel:+9471234567')}
          >
            <Ionicons name="call-outline" size={20} color={colors.white} />
            <Text style={styles.contactButtonText}>Call Expert</Text>
          </TouchableOpacity>
        </View>
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
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  imageContainer: {
    position: 'relative',
    height: 200,
    width: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  imageTitle: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
    color: colors.white,
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  infoContainer: {
    backgroundColor: colors.white,
    margin: spacing.md,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...shadows.small,
  },
  name: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  cropsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cropsLabel: {
    fontSize: fontSizes.md,
    color: colors.text,
    marginRight: spacing.sm,
  },
  cropTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cropTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
  },
  cropText: {
    fontSize: fontSizes.sm,
    color: colors.text,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSizes.md,
    color: colors.text,
    lineHeight: spacing.lg + 2,
  },
  sectionContainer: {
    backgroundColor: colors.white,
    margin: spacing.md,
    marginTop: 0,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...shadows.small,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  listIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  listText: {
    flex: 1,
    fontSize: fontSizes.md,
    color: colors.text,
    lineHeight: spacing.lg + 2,
  },
  findProductsButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.medium,
  },
  findProductsText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: fontSizes.md,
    marginLeft: spacing.sm,
  },
  expertContainer: {
    backgroundColor: colors.white,
    margin: spacing.md,
    marginTop: spacing.lg,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...shadows.small,
  },
  expertTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  expertDescription: {
    fontSize: fontSizes.md,
    color: colors.text,
    marginBottom: spacing.md,
  },
  contactButton: {
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  contactButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: fontSizes.md,
    marginLeft: spacing.sm,
  },
});

export default PestDetails; 