import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { colors, fontSizes, spacing, borderRadius, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/ScreenHeader';

type PestAndDiseaseControlScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PestAndDiseaseControl'>;

interface Pest {
  id: string;
  name: string;
  image: string;
  crops: string[];
}

const PestAndDiseaseControl = () => {
  const navigation = useNavigation<PestAndDiseaseControlScreenNavigationProp>();
  const [activeTab, setActiveTab] = useState('pest');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sample pest data
  const pestData: Pest[] = [
    {
      id: '1',
      name: 'Thrips',
      image: 'https://images.unsplash.com/photo-1715521565306-839484f887a6?q=80&w=1075&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      crops: ['Rice'],
    },
    {
      id: '2',
      name: 'Yellow Stem Borer',
      image: 'https://images.unsplash.com/photo-1677095202636-dfb9cd359c14?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8eWVsbG93JTIwc3RlbSUyMGJvcmVyJTIwaW5zZWN0fGVufDB8fDB8fHww',
      crops: ['Rice'],
    },
    {
      id: '3',
      name: 'Coconut Red Weevil',
      image: 'https://media.istockphoto.com/id/2153689444/photo/coconut-rhinoceros-beetle-larvae.jpg?s=612x612&w=is&k=20&c=VvpUhKk8SUOEW6tEen5SP9QOWYnZ9Byt9LR5jbyoOBg=',
      crops: ['Coconut'],
    },
    {
      id: '4',
      name: 'Paddy Bug',
      image: 'https://images.unsplash.com/photo-1653230431179-cfd717279073?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8cGFkZHklMjBidWd8ZW58MHx8MHx8fDA%3D',
      crops: ['Rice'],
    },
    {
      id: '5',
      name: 'White Black Plant Hopper',
      image: 'https://media.istockphoto.com/id/2148960388/photo/a-moth-is-laying-on-the-ground-with-its-head-down.jpg?s=612x612&w=is&k=20&c=nQ1LCm8j0NDeGj3Mo19FlZ5z3IA0yYNTcdwmBWcwPxY=',
      crops: ['Rice', 'Paddy'],
    },
    {
      id: '6',
      name: 'Fall Armyworm',
      image: 'https://media.istockphoto.com/id/2174357017/photo/fall-armyworm-in-stripped-bermudagrass.jpg?s=612x612&w=is&k=20&c=xDay87EPmo1dzFLnAFyqV9SuxU9PyTmu9upI8CO6wqg=',
      crops: ['Corn', 'Sugarcane'],
    },
  ];
  
  // Sample disease data
  const diseaseData: Pest[] = [
    {
      id: '1',
      name: 'Rice Blast',
      image: 'https://media.istockphoto.com/id/1214406147/photo/rice-blast-disease-rice-diseases-and-damage-rice-grains-and-paddy-in-farms.jpg?s=612x612&w=is&k=20&c=6qDsoRCNPZc55p4d72EEBI78jQkf7OmX6cJPin5eqYk=',
      crops: ['Rice'],
    },
    {
      id: '2',
      name: 'Bacterial Leaf Blight',
      image: 'https://media.istockphoto.com/id/1286441510/photo/septoria-leaf-spot-on-tomato-damaged-by-disease-and-pests-of-tomato-leaves.jpg?s=612x612&w=is&k=20&c=4WcM2mw3Sf0w0Kp-3xYXUmsRdLPEyJtoBaOKWkO1OnI=',
      crops: ['Rice'],
    },
    {
      id: '3',
      name: 'Sheath Blight',
      image: 'https://images.unsplash.com/photo-1589955234391-ce41e90b5c69?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      crops: ['Rice'],
    },
    {
      id: '4',
      name: 'Lethal Yellowing',
      image: 'https://media.istockphoto.com/id/2213832385/photo/leaves-affected.jpg?s=612x612&w=is&k=20&c=HtydN2HIJjb1p3e9iKxU9HFIPnsP2zqS4JGwckePfH4=',
      crops: ['Coconut'],
    },
  ];
  
  const filteredData = activeTab === 'pest' 
    ? pestData.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : diseaseData.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  
  const handlePestPress = (pest: Pest) => {
    navigation.navigate('PestDetails', { pestId: pest.id, type: activeTab });
  };
  
  const renderPestItem = ({ item }: { item: Pest }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => handlePestPress(item)}
    >
      <Image 
        source={{ uri: item.image }} 
        style={styles.itemImage}
        resizeMode="cover"
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <View style={styles.cropsContainer}>
          {item.crops.map((crop, index) => (
            <View key={index} style={styles.cropTag}>
              <Ionicons name="leaf-outline" size={12} color={colors.success} />
              <Text style={styles.cropText}>{crop}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={[
        styles.arrowContainer, 
        { backgroundColor: activeTab === 'pest' ? colors.success : colors.error }
      ]}>
        <Ionicons name="chevron-forward" size={24} color={colors.white} />
      </View>
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <ScreenHeader title="Pest & Disease Control" showBackButton />
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.lightText} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for pests & diseases"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.lightText}
        />
      </View>
      
      {/* Banner */}
      <View style={styles.bannerContainer}>
        <View style={styles.bannerContent}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>ARE YOU LOOKING FOR PEST CONTROL?</Text>
            <Text style={styles.bannerSubtitle}>Call us now</Text>
            <Text style={styles.bannerPhone}>+94 71 55 88 155</Text>
          </View>
          <View style={styles.bannerImageContainer}>
            <Ionicons name="bug" size={60} color={colors.white} style={styles.bannerIcon} />
          </View>
        </View>
      </View>
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'pest' && styles.activeTab]}
          onPress={() => setActiveTab('pest')}
        >
          <Text style={[styles.tabText, activeTab === 'pest' && styles.activeTabText]}>
            Pest Control
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'disease' && styles.activeTab]}
          onPress={() => setActiveTab('disease')}
        >
          <Text style={[styles.tabText, activeTab === 'disease' && styles.activeTabText]}>
            Disease Control
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Pest/Disease List */}
      <FlatList
        data={filteredData}
        renderItem={renderPestItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
    marginTop: 30,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.small,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  bannerContainer: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    height: 120,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.success,
    ...shadows.small,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    height: '100%',
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  bannerSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.white,
    opacity: 0.9,
  },
  bannerPhone: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: spacing.xs,
  },
  bannerImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerIcon: {
    marginTop: 0,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.small,
  },
  tabButton: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.text,
  },
  activeTabText: {
    color: colors.white,
  },
  listContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.small,
  },
  itemImage: {
    width: 90,
    height: 90,
  },
  itemInfo: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cropsContainer: {
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
    marginTop: spacing.xs,
  },
  cropText: {
    fontSize: fontSizes.sm,
    color: colors.text,
    marginLeft: 2,
  },
  arrowContainer: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSizes.md,
    color: colors.lightText,
  },
});

export default PestAndDiseaseControl; 