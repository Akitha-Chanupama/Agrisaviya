import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Weather } from '../types';
import { colors, fontSizes, spacing, borderRadius } from '../theme';
import Card from '../components/Card';
import { getCurrentWeather, getAllWeather } from '../utilities/firestoreUtils';

type WeatherScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Weather'>;

// Helper function to get weather icon based on condition
const getWeatherIcon = (condition: string) => {
  switch (condition.toLowerCase()) {
    case 'sunny':
      return '☀️';
    case 'partly cloudy':
      return '⛅';
    case 'cloudy':
      return '☁️';
    case 'rainy':
    case 'light rain':
      return '🌧️';
    case 'stormy':
      return '⛈️';
    case 'snowy':
      return '❄️';
    default:
      return '🌤️';
  }
};

const WeatherScreen = () => {
  const navigation = useNavigation<WeatherScreenNavigationProp>();
  const [weatherData, setWeatherData] = useState<Weather[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const loadWeatherData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch weather data from Firestore
        const allWeatherData = await getAllWeather();
        
        if (allWeatherData.length === 0) {
          setError('No weather data available');
          setLoading(false);
          return;
        }
        
        setWeatherData(allWeatherData);
        
        // Set the first location as the default selected location
        setSelectedLocation(allWeatherData[0]);
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading weather data:', err);
        setError('Failed to load weather data. Please try again.');
        setLoading(false);
      }
    };
    
    loadWeatherData();
  }, []);

  const handleLocationSelect = (location: Weather) => {
    setSelectedLocation(location);
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const allWeatherData = await getAllWeather();
      setWeatherData(allWeatherData);
      
      if (allWeatherData.length > 0) {
        // If previously selected location exists in new data, keep it selected
        const previouslySelectedLocation = selectedLocation?.location;
        const updatedLocation = previouslySelectedLocation
          ? allWeatherData.find(w => w.location === previouslySelectedLocation) || allWeatherData[0]
          : allWeatherData[0];
          
        setSelectedLocation(updatedLocation);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error refreshing weather data:', err);
      setError('Failed to refresh weather data. Please try again.');
      setLoading(false);
    }
  };

  const renderLocationItem = ({ item }: { item: Weather }) => (
    <TouchableOpacity
      style={[
        styles.locationItem,
        selectedLocation?.location === item.location && styles.selectedLocationItem,
      ]}
      onPress={() => handleLocationSelect(item)}
    >
      <Text
        style={[
          styles.locationItemText,
          selectedLocation?.location === item.location && styles.selectedLocationItemText,
        ]}
      >
        {item.location}
      </Text>
    </TouchableOpacity>
  );

  // Get weather forecast for the next 5 days (simulated)
  const getForecast = () => {
    if (!selectedLocation) return [];
    
    const forecast = [];
    const today = new Date();

    for (let i = 1; i <= 5; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(today.getDate() + i);

      // Simulate different weather conditions and temperatures
      const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain'];
      const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
      const randomTemp = Math.floor(selectedLocation.temperature + (Math.random() * 6 - 3));
      const randomHumidity = Math.floor(selectedLocation.humidity + (Math.random() * 10 - 5));

      forecast.push({
        id: i.toString(),
        date: forecastDate,
        temperature: randomTemp,
        condition: randomCondition,
        humidity: randomHumidity,
      });
    }

    return forecast;
  };

  // Show loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading weather data...</Text>
      </View>
    );
  }

  // Show error state
  if (error || !selectedLocation) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'No weather data available'}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleRefresh}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const forecast = getForecast();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Location Selector */}
        <View style={styles.locationSelectorContainer}>
          <FlatList
            data={weatherData}
            renderItem={renderLocationItem}
            keyExtractor={(item) => item.location}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.locationsList}
          />
        </View>

        {/* Current Weather */}
        <Card style={styles.currentWeatherCard}>
          <View style={styles.currentWeatherHeader}>
            <Text style={styles.currentWeatherTitle}>Current Weather</Text>
            <Text style={styles.currentWeatherDate}>
              {selectedLocation.date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>

          <View style={styles.currentWeatherContent}>
            <View style={styles.weatherMainInfo}>
              <Text style={styles.weatherLocation}>{selectedLocation.location}</Text>
              <Text style={styles.weatherTemp}>{selectedLocation.temperature}°C</Text>
              <Text style={styles.weatherCondition}>{selectedLocation.condition}</Text>
            </View>
            <Text style={styles.weatherIcon}>
              {getWeatherIcon(selectedLocation.condition)}
            </Text>
          </View>

          <View style={styles.weatherDetailsContainer}>
            <View style={styles.weatherDetailItem}>
              <Text style={styles.weatherDetailTitle}>Humidity</Text>
              <Text style={styles.weatherDetailValue}>{selectedLocation.humidity}%</Text>
            </View>
            <View style={styles.weatherDetailDivider} />
            <View style={styles.weatherDetailItem}>
              <Text style={styles.weatherDetailTitle}>Wind</Text>
              <Text style={styles.weatherDetailValue}>10 km/h</Text>
            </View>
            <View style={styles.weatherDetailDivider} />
            <View style={styles.weatherDetailItem}>
              <Text style={styles.weatherDetailTitle}>Pressure</Text>
              <Text style={styles.weatherDetailValue}>1014 hPa</Text>
            </View>
          </View>
        </Card>

        {/* Forecast */}
        <Text style={styles.forecastTitle}>5-Day Forecast</Text>

        {forecast.map((day) => (
          <Card key={day.id} style={styles.forecastCard}>
            <View style={styles.forecastItem}>
              <View style={styles.forecastItemLeft}>
                <Text style={styles.forecastDay}>
                  {day.date.toLocaleDateString('en-US', { weekday: 'long' })}
                </Text>
                <Text style={styles.forecastDate}>
                  {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>

              <View style={styles.forecastItemCenter}>
                <Text style={styles.forecastCondition}>{day.condition}</Text>
                <Text style={styles.forecastHumidity}>Humidity: {day.humidity}%</Text>
              </View>

              <View style={styles.forecastItemRight}>
                <Text style={styles.forecastIcon}>{getWeatherIcon(day.condition)}</Text>
                <Text style={styles.forecastTemp}>{day.temperature}°C</Text>
              </View>
            </View>
          </Card>
        ))}

        {/* Weather Tips */}
        <Card style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Farming Tips</Text>
          <Text style={styles.tipItem}>
            • {selectedLocation.condition === 'Sunny' ? 'Provide adequate water to crops during this sunny period.' : 'Take advantage of cloudy conditions for transplanting.'}
          </Text>
          <Text style={styles.tipItem}>
            • Check soil moisture levels regularly during current weather conditions.
          </Text>
          <Text style={styles.tipItem}>
            • {selectedLocation.humidity > 70 ? 'High humidity may increase fungal disease risk. Monitor your crops.' : 'Lower humidity means increased evaporation. Consider mulching.'}
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
    padding: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
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
    backgroundColor: colors.white,
  },
  errorText: {
    fontSize: fontSizes.lg,
    color: colors.error,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  locationSelectorContainer: {
    marginVertical: spacing.md,
  },
  locationsList: {
    paddingVertical: spacing.xs,
  },
  locationItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
  },
  selectedLocationItem: {
    backgroundColor: colors.primary,
  },
  locationItemText: {
    fontSize: fontSizes.md,
    color: colors.text,
  },
  selectedLocationItemText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  currentWeatherCard: {
    marginBottom: spacing.lg,
  },
  currentWeatherHeader: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  currentWeatherTitle: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  currentWeatherDate: {
    fontSize: fontSizes.sm,
    color: colors.lightText,
  },
  currentWeatherContent: {
    flexDirection: 'row',
    padding: spacing.md,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherMainInfo: {
    flex: 1,
  },
  weatherLocation: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  weatherTemp: {
    fontSize: fontSizes.xxxl,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  weatherCondition: {
    fontSize: fontSizes.md,
    color: colors.lightText,
  },
  weatherIcon: {
    fontSize: 60,
  },
  weatherDetailsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    padding: spacing.md,
  },
  weatherDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  weatherDetailDivider: {
    width: 1,
    backgroundColor: colors.lightGray,
  },
  weatherDetailTitle: {
    fontSize: fontSizes.sm,
    color: colors.lightText,
    marginBottom: spacing.xs,
  },
  weatherDetailValue: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.text,
  },
  forecastTitle: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
    marginLeft: spacing.xs,
  },
  forecastCard: {
    marginBottom: spacing.md,
  },
  forecastItem: {
    flexDirection: 'row',
    padding: spacing.md,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forecastItemLeft: {
    flex: 2,
  },
  forecastDay: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  forecastDate: {
    fontSize: fontSizes.sm,
    color: colors.lightText,
  },
  forecastItemCenter: {
    flex: 2,
  },
  forecastCondition: {
    fontSize: fontSizes.md,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  forecastHumidity: {
    fontSize: fontSizes.sm,
    color: colors.lightText,
  },
  forecastItemRight: {
    flex: 1,
    alignItems: 'center',
  },
  forecastIcon: {
    fontSize: 30,
    marginBottom: spacing.xs,
  },
  forecastTemp: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.text,
  },
  tipsCard: {
    marginVertical: spacing.md,
    padding: spacing.md,
  },
  tipsTitle: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  tipItem: {
    fontSize: fontSizes.md,
    color: colors.text,
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
});

export default WeatherScreen; 