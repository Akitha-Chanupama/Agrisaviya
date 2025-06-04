import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { colors, fontSizes, spacing } from '../theme';
import Button from '../components/Button';

type OnboardingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    id: '1',
    title: 'Welcome to AgriSaviya',
    description: 'Your complete farming companion that helps you grow better crops and increase your profits.',
    image: require('../assets/images/onBoarding.png'),
  },
  {
    id: '2',
    title: 'Shop for Quality Products',
    description: 'Find the best seeds, tools, and equipment for your farming needs at competitive prices.',
    image: require('../assets/images/onBoarding.png'),
  },
  {
    id: '3',
    title: 'Track Weather Conditions',
    description: 'Stay updated with real-time weather forecasts to plan your farming activities better.',
    image: require('../assets/images/onBoarding.png'),
  },
  {
    id: '4',
    title: 'Learn New Techniques',
    description: 'Access articles and resources about modern farming methods to increase your yield.',
    image: require('../assets/images/onBoarding.png'),
  },
];

const OnboardingScreen = () => {
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
      flatListRef?.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      navigation.replace('LanguageSelection');
    }
  };

  const handleSkip = () => {
    navigation.replace('LanguageSelection');
  };

  const flatListRef = React.useRef<FlatList>(null);

  const renderItem = ({ item }: { item: typeof onboardingData[0] }) => (
    <View style={styles.slide}>
      <Image source={item.image} style={styles.image} resizeMode="cover" />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );

  const renderDots = () => {
    return (
      <View style={styles.dotContainer}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              { backgroundColor: index === currentIndex ? colors.primary : colors.gray },
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      {renderDots()}

      <View style={styles.buttonContainer}>
        <Button
          title={currentIndex === onboardingData.length - 1 ? "Get Started" : "Next"}
          onPress={handleNext}
          type="primary"
          size="large"
          style={styles.button}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  skipText: {
    color: colors.primary,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  slide: {
    width,
    alignItems: 'center',
    paddingTop: 100,
  },
  image: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 20,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: fontSizes.md,
    color: colors.lightText,
    textAlign: 'center',
    lineHeight: spacing.lg + 2,
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    marginBottom: 20,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: width * 0.6,
  },
});

export default OnboardingScreen; 