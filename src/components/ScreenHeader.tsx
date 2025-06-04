import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fontSizes, spacing } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface ScreenHeaderProps {
  title: string;
  showBackButton?: boolean;
  rightComponent?: React.ReactNode;
  onBackPress?: () => void;
  backgroundColor?: string;
  titleColor?: string;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  showBackButton = false,
  rightComponent,
  onBackPress,
  backgroundColor = colors.primary,
  titleColor = colors.white,
}) => {
  const navigation = useNavigation();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View 
      style={[
        styles.container, 
        { backgroundColor }
      ]}
    >
      <View style={styles.leftContainer}>
        {showBackButton && (
          <TouchableOpacity 
            onPress={handleBackPress} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={titleColor} />
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
      
      <View style={styles.rightContainer}>
        {rightComponent}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 15,
    paddingHorizontal: spacing.md,
  },
  leftContainer: {
    width: 40,
  },
  rightContainer: {
    width: 40,
    alignItems: 'flex-end',
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
  },
});

export default ScreenHeader; 