import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Text from './components/Text';
import { llmService, WeatherInsights } from './utils/llmService';
import { permissionManager } from './utils/permissions';
import { ProcessedWeatherData, weatherService } from './utils/weatherService';

export default function WeatherForecast() {
  const [selectedDay, setSelectedDay] = useState(0);
  const [locationPermission, setLocationPermission] = useState(false);
  const [weatherData, setWeatherData] = useState<ProcessedWeatherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [weatherInsights, setWeatherInsights] = useState<WeatherInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    initializeWeather();
  }, []);

  const initializeWeather = async () => {
    const hasPermission = await checkLocationPermission();
    if (hasPermission) {
      await fetchWeatherData();
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

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      console.log('Fetching weather data...');
      
      const data = await weatherService.getWeatherForecast();
      console.log('Weather data received:', data);
      
      setWeatherData(data);
      
      // Get current location for display
      const currentLocation = await weatherService.getCurrentLocation();
      setLocation(currentLocation);

      // Stop loading as soon as weather data is available
      setLoading(false);

      // Generate AI insights based on weather data (async, don't wait)
      generateWeatherInsights(data);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      // Only use mock data if there's a real error, not just for insights
      const mockData = weatherService.getMockWeatherData();
      setWeatherData(mockData);
      
      // Stop loading even with mock data
      setLoading(false);
      
      // Generate insights for mock data
      generateWeatherInsights(mockData);
      
      // Only show alert for network errors, not API errors
      if (error instanceof Error && error.message.includes('network')) {
        Alert.alert('Info', 'Using offline weather data. Check your internet connection.');
      }
    }
  };

  const generateWeatherInsights = async (weatherData: ProcessedWeatherData[]) => {
    try {
      setInsightsLoading(true);
      console.log('Generating weather insights...');
      
      // Test API connection first
      const isApiWorking = await llmService.testApiConnection();
      console.log('API connection test result:', isApiWorking);
      
      const insights = await llmService.generateWeatherInsights(weatherData);
      console.log('Weather insights generated:', insights);
      
      setWeatherInsights(insights);
    } catch (error) {
      console.error('Error generating weather insights:', error);
      // Use fallback insights
      const fallbackInsights = llmService.getFallbackInsights(weatherData);
      setWeatherInsights(fallbackInsights);
    } finally {
      setInsightsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWeatherData();
    setRefreshing(false);
  }, []);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return 'warning';
      case 'info':
        return 'information-circle';
      case 'success':
        return 'checkmark-circle';
      default:
        return 'information-circle';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning':
        return '#f59e0b';
      case 'info':
        return '#3b82f6';
      case 'success':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-400 bg-red-50';
      case 'medium':
        return 'border-yellow-400 bg-yellow-50';
      case 'low':
        return 'border-blue-400 bg-blue-50';
      default:
        return 'border-gray-400 bg-gray-50';
    }
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

  const getLocationName = () => {
    if (location) {
      return `Lat: ${location.latitude.toFixed(2)}, Lon: ${location.longitude.toFixed(2)}`;
    }
    return 'Location not available';
  };

  if (!locationPermission) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="location-outline" size={80} color="#6b7280" />
          <Text className="text-2xl font-bold text-gray-900 text-center mb-4 mt-6">
            Location Permission Required
          </Text>
          <Text className="text-lg text-gray-600 text-center mb-8 leading-6">
            KrishiSahayak needs location access to provide accurate weather forecasts and location-specific farming advice.
          </Text>
          <TouchableOpacity 
            className="bg-green-600 py-4 px-8 rounded-2xl mb-4"
            onPress={checkLocationPermission}
          >
            <Text className="text-white text-lg font-semibold text-center">
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
          <Text className="text-2xl font-bold text-gray-900 text-center mb-4 mt-6">
            Loading Weather Data
          </Text>
          <Text className="text-lg text-gray-600 text-center mb-8 leading-6">
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
        {/* Current Weather */}
        <View className="px-6 py-6">
          <View className={`${getWeatherColor(weatherData[0]?.condition || 'Partly Cloudy')} rounded-2xl p-6 mb-6`}>
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-white text-lg font-semibold">Current Weather</Text>
                <Text className="text-white/80">{getLocationName()}</Text>
              </View>
              <Ionicons 
                name={getWeatherIcon(weatherData[0]?.icon || 'partly-sunny') as any} 
                size={40} 
                color="white" 
              />
            </View>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white text-4xl font-bold">
                  {weatherData[0]?.temp.high || 28}°C
                </Text>
                <Text className="text-white/80 text-lg">
                  {weatherData[0]?.condition || 'Partly Cloudy'}
                </Text>
                <Text className="text-white/70 text-sm">
                  Feels like {weatherData[0]?.feelsLike || 30}°C
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-white text-sm">
                  Humidity: {weatherData[0]?.humidity || 65}%
                </Text>
                <Text className="text-white text-sm">
                  Wind: {weatherData[0]?.wind || 12} km/h
                </Text>
                <Text className="text-white text-sm">
                  UV Index: {weatherData[0]?.uv || 6}
                </Text>
                <Text className="text-white text-sm">
                  Visibility: {weatherData[0]?.visibility || 10}km
                </Text>
              </View>
            </View>
            <Text className="text-white/90 text-sm mt-3">
              {weatherData[0]?.description || 'Good conditions for crop growth'}
            </Text>
          </View>

          {/* 7-Day Forecast */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-900 mb-4">5-Day Forecast</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 pb-1">
              <View className="flex-row space-x-3">
                {weatherData.map((day, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setSelectedDay(index)}
                    className={`card items-center py-4 px-3 min-w-[80px] ${selectedDay === index ? 'bg-green-50 border-green-200' : ''
                      }`}
                  >
                    <Text className="text-gray-600 text-sm mb-1">{day.day}</Text>
                    <Text className="text-gray-500 text-xs mb-2">{day.date}</Text>
                    <Ionicons
                      name={getWeatherIcon(day.icon) as any}
                      size={24}
                      color={selectedDay === index ? '#059669' : '#6b7280'}
                    />
                    <Text className="font-bold text-gray-900 text-sm mt-1">{day.temp.high}°</Text>
                    <Text className="text-gray-500 text-xs">{day.temp.low}°</Text>
                    {/* <Text className="text-gray-600 text-xs mt-1 text-center">{day.rain}mm</Text> */}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Selected Day Details */}
            <View className="card">
              <Text className="text-lg font-bold text-gray-900 mb-3">
                {weatherData[selectedDay]?.day} - {weatherData[selectedDay]?.date}
              </Text>
              <Text className="text-gray-600 mb-4">
                {weatherData[selectedDay]?.description}
              </Text>

              <View className="grid grid-cols-2 gap-4">
                <View className="flex-row items-center">
                  <Ionicons name="thermometer" size={20} color="#6b7280" />
                  <View className="ml-3">
                    <Text className="text-gray-600 text-sm">Temperature</Text>
                    <Text className="font-semibold text-gray-900">
                      {weatherData[selectedDay]?.temp.high}° / {weatherData[selectedDay]?.temp.low}°
                    </Text>
                    <Text className="text-gray-500 text-xs">
                      Feels like {weatherData[selectedDay]?.feelsLike}°
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center">
                  <Ionicons name="water" size={20} color="#6b7280" />
                  <View className="ml-3">
                    <Text className="text-gray-600 text-sm">Humidity</Text>
                    <Text className="font-semibold text-gray-900">
                      {weatherData[selectedDay]?.humidity}%
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center">
                  <Ionicons name="leaf" size={20} color="#6b7280" />
                  <View className="ml-3">
                    <Text className="text-gray-600 text-sm">Wind Speed</Text>
                    <Text className="font-semibold text-gray-900">
                      {weatherData[selectedDay]?.wind} km/h
                    </Text>
                    <Text className="text-gray-500 text-xs">
                      Gusts up to {weatherData[selectedDay]?.gust} km/h
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center">
                  <Ionicons name="rainy" size={20} color="#6b7280" />
                  <View className="ml-3">
                    <Text className="text-gray-600 text-sm">Precipitation</Text>
                    <Text className="font-semibold text-gray-900">
                      {weatherData[selectedDay]?.rain}mm
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center">
                  <Ionicons name="sunny" size={20} color="#6b7280" />
                  <View className="ml-3">
                    <Text className="text-gray-600 text-sm">Sunshine</Text>
                    <Text className="font-semibold text-gray-900">
                      {weatherData[selectedDay]?.sunshine}h
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center">
                  <Ionicons name="speedometer" size={20} color="#6b7280" />
                  <View className="ml-3">
                    <Text className="text-gray-600 text-sm">Pressure</Text>
                    <Text className="font-semibold text-gray-900">
                      {weatherData[selectedDay]?.pressure}hPa
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center">
                  <Ionicons name="eye" size={20} color="#6b7280" />
                  <View className="ml-3">
                    <Text className="text-gray-600 text-sm">Visibility</Text>
                    <Text className="font-semibold text-gray-900">
                      {weatherData[selectedDay]?.visibility}km
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center">
                  <Ionicons name="cloud" size={20} color="#6b7280" />
                  <View className="ml-3">
                    <Text className="text-gray-600 text-sm">Cloud Cover</Text>
                    <Text className="font-semibold text-gray-900">
                      {weatherData[selectedDay]?.cloudCover}%
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Weather Alerts */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900">Weather Alerts</Text>
              {insightsLoading && (
                <View className="flex-row items-center">
                  <Ionicons name="refresh" size={16} color="#6b7280" className="animate-spin" />
                  <Text className="text-gray-500 text-sm ml-2">Generating insights...</Text>
                </View>
              )}
            </View>
            {insightsLoading && !weatherInsights ? (
              <View className="card items-center py-6">
                <Ionicons name="refresh" size={24} color="#6b7280" className="animate-spin" />
                <Text className="text-gray-600 mt-2">Generating weather insights...</Text>
              </View>
            ) : weatherInsights?.alerts && weatherInsights.alerts.length > 0 ? (
              <View className="space-y-3">
                {weatherInsights.alerts.map((alert, index) => (
                  <View key={index} className={`card border-l-4 ${getPriorityColor(alert.priority)}`}>
                    <View className="flex-row items-start">
                      <Ionicons
                        name={getAlertIcon(alert.type) as any}
                        size={20}
                        color={getAlertColor(alert.type)}
                      />
                      <View className="flex-1 ml-3">
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="font-semibold text-gray-900">{alert.title}</Text>
                          <View className={`px-2 py-1 rounded-full ${
                            alert.priority === 'high' ? 'bg-red-100' : 
                            alert.priority === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                          }`}>
                            <Text className={`text-xs font-medium ${
                              alert.priority === 'high' ? 'text-red-700' : 
                              alert.priority === 'medium' ? 'text-yellow-700' : 'text-blue-700'
                            }`}>
                              {alert.priority.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-gray-600 text-sm mb-2">{alert.message}</Text>
                        <Text className="text-gray-500 text-xs">{alert.time}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="card items-center py-6">
                <Ionicons name="checkmark-circle" size={32} color="#10b981" />
                <Text className="text-gray-600 mt-2 text-center">No weather alerts at this time</Text>
                <Text className="text-gray-500 text-sm text-center mt-1">All conditions are normal for farming</Text>
              </View>
            )}
          </View>

          {/* Farming Tips */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900">Farming Tips</Text>
              {insightsLoading && (
                <View className="flex-row items-center">
                  <Ionicons name="refresh" size={16} color="#6b7280" className="animate-spin" />
                  <Text className="text-gray-500 text-sm ml-2">Generating tips...</Text>
                </View>
              )}
            </View>
            {insightsLoading && !weatherInsights ? (
              <View className="card items-center py-6">
                <Ionicons name="refresh" size={24} color="#6b7280" className="animate-spin" />
                <Text className="text-gray-600 mt-2">Generating farming recommendations...</Text>
              </View>
            ) : weatherInsights?.farmingTips && weatherInsights.farmingTips.length > 0 ? (
              <View className="space-y-4">
                {weatherInsights.farmingTips.map((tip, index) => (
                  <View key={index} className="card">
                    <View className="flex-row items-center justify-between mb-3">
                      <Text className="font-bold text-gray-900 text-lg">{tip.condition}</Text>
                      <View className={`px-2 py-1 rounded-full ${
                        tip.priority === 'high' ? 'bg-red-100' : 
                        tip.priority === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                      }`}>
                        <Text className={`text-xs font-medium ${
                          tip.priority === 'high' ? 'text-red-700' : 
                          tip.priority === 'medium' ? 'text-yellow-700' : 'text-blue-700'
                        }`}>
                          {tip.priority.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View className="space-y-2">
                      {tip.tips.map((tipText, tipIndex) => (
                        <View key={tipIndex} className="flex-row items-start">
                          <Text className="text-green-600 mr-2">•</Text>
                          <Text className="text-gray-600 text-sm flex-1">{tipText}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="card items-center py-6">
                <Ionicons name="leaf" size={32} color="#10b981" />
                <Text className="text-gray-600 mt-2 text-center">No specific tips available</Text>
                <Text className="text-gray-500 text-sm text-center mt-1">Weather conditions are normal</Text>
              </View>
            )}
          </View>

          {/* General Advice */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900">General Advice</Text>
              {insightsLoading && !weatherInsights?.generalAdvice && (
                <View className="flex-row items-center">
                  <Ionicons name="refresh" size={16} color="#6b7280" className="animate-spin" />
                  <Text className="text-gray-500 text-sm ml-2">Generating advice...</Text>
                </View>
              )}
            </View>
            {weatherInsights?.generalAdvice ? (
              <View className="card">
                <View className="flex-row items-start">
                  <Ionicons name="bulb" size={20} color="#f59e0b" />
                  <View className="flex-1 ml-3">
                    <Text className="font-semibold text-gray-900 mb-2">AI Recommendation</Text>
                    <Text className="text-gray-600 text-sm leading-5">{weatherInsights.generalAdvice}</Text>
                  </View>
                </View>
              </View>
            ) : insightsLoading ? (
              <View className="card items-center py-6">
                <Ionicons name="refresh" size={24} color="#6b7280" className="animate-spin" />
                <Text className="text-gray-600 mt-2">Generating AI recommendations...</Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}