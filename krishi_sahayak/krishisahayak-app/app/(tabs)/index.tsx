import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Dimensions, RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Text from '../components/Text';
import { permissionManager } from '../utils/permissions';
import { CurrentWeatherData, weatherService } from '../utils/weatherService';

const { width } = Dimensions.get('window');

export default function Dashboard() {
  console.log('Dashboard rendering...');
  
  const [weatherData, setWeatherData] = useState<CurrentWeatherData | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    const hasPermission = await checkLocationPermission();
    if (hasPermission) {
      await loadWeatherData();
    } else {
      setLoading(false);
    }
  };

  const checkLocationPermission = async (): Promise<boolean> => {
    const permission = await permissionManager.checkLocationPermission();
    setLocationPermission(permission.granted);
    
    if (!permission.granted && permission.canAskAgain) {
      const newPermission = await permissionManager.requestLocationPermission();
      setLocationPermission(newPermission.granted);
      if (!newPermission.granted) {
        permissionManager.showPermissionAlert('location');
        return false;
      }
      return true;
    } else if (!permission.granted && !permission.canAskAgain) {
      permissionManager.showPermissionAlert('location');
      return false;
    }
    
    return permission.granted;
  };

  const loadWeatherData = async () => {
    try {
      setLoading(true);
      console.log('Loading current weather data...');
      
      const currentWeather = await weatherService.getCurrentWeather();
      const currentLocation = await weatherService.getCurrentLocation();
      
      setWeatherData(currentWeather);
      setLocation(currentLocation);
      
    } catch (error) {
      console.error('Error loading weather data:', error);
      // Use mock data as fallback
      const mockData = weatherService.getMockCurrentWeatherData();
      setWeatherData(mockData);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWeatherData();
    setRefreshing(false);
  }, []);

  const getLocationName = () => {
    if (location) {
      return `Lat: ${location.latitude.toFixed(2)}, Lon: ${location.longitude.toFixed(2)}`;
    }
    return 'Location not available';
  };

  const getWeatherIcon = (iconName: string) => {
    const iconMap: { [key: string]: string } = {
      'sunny': 'sunny',
      'partly-sunny': 'partly-sunny',
      'cloudy': 'cloudy',
      'rainy': 'rainy',
      'thunderstorm': 'thunderstorm'
    };
    return iconMap[iconName] || 'partly-sunny';
  };

  const getWeatherColor = (condition: string) => {
    if (condition.includes('Rain') || condition.includes('Thunderstorm')) return 'bg-blue-500';
    if (condition.includes('Sunny')) return 'bg-yellow-500';
    if (condition.includes('Cloudy')) return 'bg-gray-500';
    return 'bg-blue-500';
  };

  const quickActions = [
    {
      title: 'Pest Detection',
      subtitle: 'Scan for pests in crops',
      icon: 'bug-outline',
      color: 'bg-red-500',
      href: '/pest-detection'
    },
    {
      title: 'Crop Recommendations',
      subtitle: 'Get crop suggestions',
      icon: 'bulb-outline',
      color: 'bg-green-500',
      href: '/(tabs)/crop-recommendations'
    },
    {
      title: 'Weather Forecast',
      subtitle: '5-day weather outlook',
      icon: 'partly-sunny-outline',
      color: 'bg-yellow-500',
      href: '/weather-forecast'
    },
    {
      title: 'Market Insights',
      subtitle: 'Price trends & demand',
      icon: 'trending-up-outline',
      color: 'bg-purple-500',
      href: '/(tabs)/market-insights'
    }
  ];

  const stats = [
    { label: 'Soil pH', value: '6.8', unit: '', status: 'good' },
    { label: 'Moisture', value: '65', unit: '%', status: 'optimal' },
    { label: 'Temperature', value: '24', unit: '°C', status: 'good' },
    { label: 'Humidity', value: '78', unit: '%', status: 'high' }
  ];

  if (!locationPermission) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="location-outline" size={80} color="#6b7280" />
          <Text variant="bold" className="text-2xl text-gray-900 text-center mb-4 mt-6">
            Location Permission Required
          </Text>
          <Text variant="regular" className="text-lg text-gray-600 text-center mb-8 leading-6">
            KrishiSahayak needs location access to provide accurate weather forecasts and location-specific farming advice.
          </Text>
          <TouchableOpacity 
            className="bg-green-600 py-4 px-8 rounded-2xl mb-4"
            onPress={checkLocationPermission}
          >
            <Text variant="medium" className="text-white text-lg text-center">
              Grant Permission
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="cloud-outline" size={80} color="#6b7280" />
          <Text variant="bold" className="text-2xl text-gray-900 text-center mb-4 mt-6">
            Loading Weather Data
          </Text>
          <Text variant="regular" className="text-lg text-gray-600 text-center mb-8 leading-6">
            Fetching real-time weather information for your location...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Weather Card */}
        <View className="px-6 py-6">
          <View className={`${getWeatherColor(weatherData?.condition || 'Partly Cloudy')} rounded-2xl p-6`}>
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text variant="medium" className="text-white text-lg">Today's Weather</Text>
                <Text variant="regular" className="text-white/80">{getLocationName()}</Text>
              </View>
              <Ionicons 
                name={getWeatherIcon(weatherData?.icon || 'partly-sunny') as any} 
                size={32} 
                color="white" 
              />
            </View>
            <View className="flex-row items-center justify-between">
              <View>
                <Text variant="bold" className="text-white text-3xl">
                  {weatherData?.temp || 28}°C
                </Text>
                <Text variant="regular" className="text-white/80 text-lg">
                  {weatherData?.condition || 'Partly Cloudy'}
                </Text>
                <Text variant="regular" className="text-white/70 text-sm">
                  Feels like {weatherData?.feelsLike || 30}°C
                </Text>
              </View>
              <View className="items-end">
                <Text variant="regular" className="text-white text-sm">
                  Humidity: {weatherData?.humidity || 65}%
                </Text>
                <Text variant="regular" className="text-white text-sm">
                  Wind: {weatherData?.wind || 12} km/h
                </Text>
                <Text variant="regular" className="text-white text-sm">
                  Rain: {weatherData?.rain || 0}mm
                </Text>
              </View>
            </View>
            <Text variant="regular" className="text-white/90 text-sm mt-3">
              {weatherData?.description || 'Good conditions for farming'}
            </Text>
          </View>
        </View>

        {/* AI Assistant Card */}
        <View className="px-6 mb-6">
          <Link href="/chat-interface" asChild>
            <TouchableOpacity className="gradient-green rounded-2xl p-6">
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-white/20 rounded-xl items-center justify-center mr-4">
                  <Ionicons name="chatbubble-outline" size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text variant="medium" className="text-white text-lg mb-1">AI Assistant</Text>
                  <Text variant="regular" className="text-green-100 text-sm">Get instant farming advice</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="white" />
              </View>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Quick Actions */}
        <View className="px-6 mb-6">
          <Text variant="bold" className="text-xl text-gray-900 mb-4">Quick Actions</Text>
          <View className="flex-row flex-wrap justify-between">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href as any} asChild>
                <TouchableOpacity className="card w-[48%] mb-3 items-center py-4">
                  <View className={`w-12 h-12 ${action.color} rounded-xl items-center justify-center mb-3`}>
                    <Ionicons name={action.icon as any} size={24} color="white" />
                  </View>
                  <Text variant="medium" className="text-gray-900 text-center mb-1">{action.title}</Text>
                  <Text variant="regular" className="text-gray-600 text-xs text-center">{action.subtitle}</Text>
                </TouchableOpacity>
              </Link>
            ))}
          </View>
        </View>

        {/* Soil Stats */}
        {/* <View className="px-6 mb-6">
          <Text variant="bold" className="text-xl text-gray-900 mb-4">Soil Conditions</Text>
          <View className="flex-row flex-wrap justify-between">
            {stats.map((stat, index) => (
              <View key={index} className="card w-[48%] mb-3">
                <Text variant="regular" className="text-gray-600 text-sm mb-1">{stat.label}</Text>
                <View className="flex-row items-baseline">
                  <Text variant="bold" className="text-2xl text-gray-900">{stat.value}</Text>
                  <Text variant="regular" className="text-gray-500 ml-1">{stat.unit}</Text>
                </View>
                <View className="flex-row items-center mt-2">
                  <View className={`w-2 h-2 rounded-full mr-2 ${
                    stat.status === 'good' ? 'bg-green-500' :
                    stat.status === 'optimal' ? 'bg-blue-500' : 'bg-yellow-500'
                  }`} />
                  <Text variant="regular" className="text-xs text-gray-600 capitalize">{stat.status}</Text>
                </View>
              </View>
            ))}
          </View>
        </View> */}
      </ScrollView>
    </SafeAreaView>
  );
}