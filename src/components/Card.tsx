import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, shadows } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevation?: 'none' | 'small' | 'medium' | 'large';
  backgroundColor?: string;
  borderRadius?: number;
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  elevation = 'small',
  backgroundColor = colors.white,
  borderRadius: customBorderRadius,
}) => {
  const getShadow = () => {
    switch (elevation) {
      case 'none':
        return {};
      case 'small':
        return shadows.small;
      case 'medium':
        return shadows.medium;
      case 'large':
        return shadows.large;
      default:
        return shadows.small;
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor,
          borderRadius: customBorderRadius || borderRadius.md,
        },
        getShadow(),
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 8,
    overflow: 'hidden',
  },
});

export default Card; 