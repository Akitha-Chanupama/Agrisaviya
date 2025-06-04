import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { colors, fontSizes, spacing, borderRadius } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  type?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  type = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}) => {
  // Button styles based on type
  const getButtonTypeStyle = () => {
    switch (type) {
      case 'primary':
        return {
          backgroundColor: colors.primary,
          borderWidth: 0,
        };
      case 'secondary':
        return {
          backgroundColor: colors.secondary,
          borderWidth: 0,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.primary,
        };
      case 'text':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
        };
      default:
        return {
          backgroundColor: colors.primary,
          borderWidth: 0,
        };
    }
  };

  // Text styles based on type
  const getTextTypeStyle = () => {
    switch (type) {
      case 'primary':
      case 'secondary':
        return { color: colors.white };
      case 'outline':
        return { color: colors.primary };
      case 'text':
        return { color: colors.primary };
      default:
        return { color: colors.white };
    }
  };

  // Button styles based on size
  const getButtonSizeStyle = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.md,
          borderRadius: borderRadius.sm,
        };
      case 'medium':
        return {
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
          borderRadius: borderRadius.md,
        };
      case 'large':
        return {
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl,
          borderRadius: borderRadius.lg,
        };
      default:
        return {
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
          borderRadius: borderRadius.md,
        };
    }
  };

  // Text styles based on size
  const getTextSizeStyle = () => {
    switch (size) {
      case 'small':
        return { fontSize: fontSizes.sm };
      case 'medium':
        return { fontSize: fontSizes.md };
      case 'large':
        return { fontSize: fontSizes.lg };
      default:
        return { fontSize: fontSizes.md };
    }
  };

  const textStyles = [
    styles.text, 
    getTextTypeStyle(), 
    getTextSizeStyle(), 
    icon ? styles.textWithIcon : undefined,
    textStyle
  ];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonTypeStyle(),
        getButtonSizeStyle(),
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={type === 'outline' || type === 'text' ? colors.primary : colors.white} 
        />
      ) : (
        <>
          {icon}
          <Text style={textStyles}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  textWithIcon: {
    marginLeft: spacing.xs,
  },
  disabled: {
    opacity: 0.6,
  },
});

export default Button; 