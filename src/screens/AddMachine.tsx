import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Category, Machine } from '../types';
import { colors, fontSizes, spacing, borderRadius, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../utilities/firebaseConfig';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import Button from '../components/Button';
import { Picker } from '@react-native-picker/picker';
import { getMachineCategories, addMachine } from '../utilities/firestoreUtils';

type AddMachineScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddMachine'>;
type AddMachineScreenRouteProp = RouteProp<RootStackParamList, 'AddMachine'>;

const MACHINE_STATUSES = [
  { label: 'Available', value: 'available' },
  { label: 'Unavailable', value: 'unavailable' },
  { label: 'For Sale', value: 'for_sale' },
  { label: 'For Rent', value: 'for_rent' },
];

const AddMachine = () => {
  const navigation = useNavigation<AddMachineScreenNavigationProp>();
  const route = useRoute<AddMachineScreenRouteProp>();
  
  // Form state
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(route.params?.preselectedCategoryId || '');
  const [status, setStatus] = useState(MACHINE_STATUSES[0].value);
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Load categories when component mounts
  useEffect(() => {
    loadCategories();
  }, []);
  
  const loadCategories = async () => {
    try {
      const categories = await getMachineCategories();
      
      setCategories(categories);
      
      // Set initial category if provided in route params
      if (route.params?.preselectedCategoryId) {
        setCategory(route.params.preselectedCategoryId);
      } else if (categories.length > 0) {
        setCategory(categories[0].id);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'Failed to load categories. Please try again.');
    }
  };
  
  const pickImage = async () => {
    try {
      // Request permission first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photos.');
        return;
      }
      
      // Launch image picker with base64 option enabled
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true, // Request base64 data
      });
      
      console.log('Image picker result:', result);
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        console.log('Selected asset:', selectedAsset);
        
        setUploading(true);
        
        try {
          // If base64 is already available in the result, use it
          if (selectedAsset.base64) {
            const base64Image = `data:image/jpeg;base64,${selectedAsset.base64}`;
            setImage(base64Image);
            console.log('Image converted to Base64 directly from picker');
          } else {
            // Otherwise read the file and convert to base64
            try {
              const base64 = await FileSystem.readAsStringAsync(selectedAsset.uri, {
                encoding: FileSystem.EncodingType.Base64,
              });
              
              const base64Image = `data:image/jpeg;base64,${base64}`;
              setImage(base64Image);
              console.log('Image converted to Base64 via FileSystem');
            } catch (fileError) {
              console.error('Error reading file as base64:', fileError);
              Alert.alert('Error', 'Failed to process image as base64. Using fallback approach.');
              
              // Fallback - use a placeholder image instead of local URI
              setImage('https://media.istockphoto.com/id/1320356772/photo/tractor-and-agricultural-machinery-on-the-field.jpg');
            }
          }
        } catch (error) {
          console.error('Error processing image:', error);
          Alert.alert('Error', 'Failed to process image. Please try again.');
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      setUploading(false);
    }
  };
  
  const handleSubmit = async () => {
    // Validate form
    if (!name || !price || !description || !category || !status || !contact || !phone) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    
    if (!image) {
      Alert.alert('Image Required', 'Please select an image for your machine.');
      return;
    }
    
    // Verify image format
    if (!image.startsWith('data:image')) {
      Alert.alert('Invalid Image', 'Please select an image again. The image format is not supported.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Get current user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      // Create machine data object
      const machineData = {
        name,
        price: parseFloat(price),
        description,
        category,
        status,
        contact,
        phone,
        location,
        image: image, // Base64 image
        createdBy: currentUser.uid
      };
      
      // Use the utility function to add machine
      const machineId = await addMachine(machineData);
      
      setLoading(false);
      
      // Show success message
      Alert.alert(
        'Success',
        'Your machine has been added successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('MachineDetails', { machineId }),
          },
        ]
      );
    } catch (error) {
      console.error('Error adding machine:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to add machine. Please try again.');
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Machine</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Image Picker */}
        <TouchableOpacity style={styles.imagePickerContainer} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.selectedImage} />
          ) : (
            <>
              <Ionicons name="camera-outline" size={40} color={colors.lightText} />
              <Text style={styles.imagePickerText}>Tap to select an image</Text>
            </>
          )}
        </TouchableOpacity>
        
        {/* Form Fields */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Machine Name*</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter machine name"
            placeholderTextColor={colors.lightText}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Price*</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="Enter price"
            placeholderTextColor={colors.lightText}
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Category*</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={category}
              onValueChange={(itemValue) => setCategory(itemValue)}
              style={styles.picker}
            >
              {categories.map((cat) => (
                <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
              ))}
            </Picker>
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Status*</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={status}
              onValueChange={(itemValue) => setStatus(itemValue)}
              style={styles.picker}
            >
              {MACHINE_STATUSES.map((statusOption) => (
                <Picker.Item 
                  key={statusOption.value} 
                  label={statusOption.label} 
                  value={statusOption.value} 
                />
              ))}
            </Picker>
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Contact Person*</Text>
          <TextInput
            style={styles.input}
            value={contact}
            onChangeText={setContact}
            placeholder="Enter contact person name"
            placeholderTextColor={colors.lightText}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone Number*</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter phone number"
            placeholderTextColor={colors.lightText}
            keyboardType="phone-pad"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Enter location"
            placeholderTextColor={colors.lightText}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Description*</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter machine description"
            placeholderTextColor={colors.lightText}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
        
        <Button
          title="Add Machine"
          onPress={handleSubmit}
          type="primary"
          size="large"
          disabled={uploading || loading}
          style={styles.submitButton}
        />
        
        {(uploading || loading) && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>
              {uploading ? 'Uploading image...' : 'Adding machine...'}
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
    marginTop: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 15,
    paddingHorizontal: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  imagePickerContainer: {
    width: '100%',
    height: 200,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.small,
  },
  imagePickerText: {
    color: colors.lightText,
    marginTop: spacing.sm,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSizes.md,
    color: colors.text,
    ...shadows.small,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    ...shadows.small,
  },
  picker: {
    height: 50,
  },
  submitButton: {
    marginTop: spacing.lg,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  loadingText: {
    marginLeft: spacing.sm,
    color: colors.text,
  },
});

export default AddMachine; 