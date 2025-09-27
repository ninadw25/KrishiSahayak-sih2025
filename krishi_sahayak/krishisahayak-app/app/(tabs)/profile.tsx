import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import LocationMap from '../components/LocationMap';
import Text from '../components/Text';
import { LocationData, locationService } from '../utils/locationService';

export default function Profile() {
  const [user, setUser] = useState({
    name: 'Aakarsh Goyal',
    email: 'aakarshgoyal23@gmail.com',
    phone: '+91 9999999999',
    location: 'Kapriwas, Gurgaon',
    farmSize: '5.2 hectares',
    experience: '8 years',
    crops: ['Rice', 'Wheat', 'Sugarcane'],
    joinDate: 'September 2025'
  });

  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const [notifications, setNotifications] = useState({
    weather: true,
    market: true,
    diseases: true,
    recommendations: false
  });

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  useEffect(() => {
    loadUserLocation();
  }, []);

  const loadUserLocation = async () => {
    setLocationLoading(true);
    try {
      const location = await locationService.refreshLocationWithGeocoding();
      if (location) {
        setCurrentLocation(location);
        // Update user location if we have address info
        if (location.city && location.state) {
          setUser(prev => ({
            ...prev,
            location: `${location.city}, ${location.state}`
          }));
        } else if (location.address) {
          setUser(prev => ({
            ...prev,
            location: location.address!
          }));
        }
      }
    } catch (error) {
      console.error('Error loading location:', error);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleLocationSelect = (location: LocationData) => {
    setCurrentLocation(location);
    if (location.city && location.state) {
      setUser(prev => ({
        ...prev,
        location: `${location.city}, ${location.state}`
      }));
    } else if (location.address) {
      setUser(prev => ({
        ...prev,
        location: location.address!
      }));
    }
  };

  const menuItems = [
    {
      title: 'Location Settings',
      subtitle: 'Manage location permissions and accuracy',
      icon: 'location-outline',
      color: 'bg-indigo-500',
      onPress: () => {
        Alert.alert(
          'Location Settings',
          currentLocation 
            ? `Address: ${currentLocation.address || 'N/A'}\n\nCoordinates: ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}\n\nCity: ${currentLocation.city || 'N/A'}\nState: ${currentLocation.state || 'N/A'}\nCountry: ${currentLocation.country || 'N/A'}\n\nAccuracy: ±${Math.round(currentLocation.accuracy || 0)}m\nLast Updated: ${new Date(currentLocation.timestamp).toLocaleString()}`
            : 'No location data available',
          [
            { text: 'OK' },
            { text: 'Refresh Location', onPress: loadUserLocation },
            { text: 'Clear Cache', onPress: () => {
              locationService.clearLocationCache();
              setCurrentLocation(null);
            }}
          ]
        );
      }
    },
    {
      title: 'Farm Settings',
      subtitle: 'Manage farm details and preferences',
      icon: 'settings-outline',
      color: 'bg-blue-500',
      onPress: () => Alert.alert('Farm Settings', 'Farm settings feature coming soon!')
    },
    {
      title: 'Weather Alerts',
      subtitle: 'Configure weather notifications',
      icon: 'partly-sunny-outline',
      color: 'bg-yellow-500',
      onPress: () => Alert.alert('Weather Alerts', 'Weather alerts feature coming soon!')
    },
    {
      title: 'Market Watch',
      subtitle: 'Track crop prices and trends',
      icon: 'trending-up-outline',
      color: 'bg-purple-500',
      onPress: () => Alert.alert('Market Watch', 'Market watch feature coming soon!')
    },
    {
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      icon: 'help-circle-outline',
      color: 'bg-green-500',
      onPress: () => Alert.alert('Help & Support', 'Help & support feature coming soon!')
    },
    {
      title: 'About KrishiSahayak',
      subtitle: 'App version and information',
      icon: 'information-circle-outline',
      color: 'bg-gray-500',
      onPress: () => Alert.alert('About KrishiSahayak', 'KrishiSahayak v1.0.0\nAI-powered farming assistant')
    }
  ];

  const stats = [
    { label: 'Crops Scanned', value: '24', icon: 'camera' },
    { label: 'Diseases Detected', value: '3', icon: 'bug' },
    { label: 'Recommendations', value: '12', icon: 'bulb' },
    { label: 'Days Active', value: '45', icon: 'calendar' }
  ];

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View className="px-6 py-6">
          <View className="gradient-green rounded-2xl p-6 mb-6">
            <View className="flex-row items-center mb-4">
              <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mr-4">
                <Ionicons name="person" size={32} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-xl font-bold">{user.name}</Text>
                <View className="flex-row items-center">
                  <Ionicons name="location" size={12} color="#bbf7d0" />
                  <Text className="text-green-100 text-sm ml-1">
                    {currentLocation?.address || user.location}
                  </Text>
                  {locationLoading && (
                    <Ionicons name="refresh" size={12} color="#bbf7d0" className="ml-2 animate-spin" />
                  )}
                </View>
                <Text className="text-green-100 text-xs">Member since {user.joinDate}</Text>
                {currentLocation && (
                  <Text className="text-green-200 text-xs">
                    Last updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}
                  </Text>
                )}
              </View>
              <TouchableOpacity className="w-10 h-10 bg-white/20 rounded-full items-center justify-center">
                <Ionicons name="create-outline" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Farm Location Map */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Farm Location</Text>
            <LocationMap 
              onLocationSelect={handleLocationSelect}
              initialLocation={currentLocation || undefined}
              height={220}
              showMapControls={true}
            />
          </View>

          {/* Farm Details */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Farm Details</Text>
            <View className="card">
              <View className="space-y-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons name="location" size={20} color="#6b7280" />
                    <Text className="text-gray-700 ml-3">Location</Text>
                  </View>
                  <View className="flex-1 items-end">
                    <Text className="font-semibold text-gray-900 text-right">
                      {currentLocation?.address || user.location}
                    </Text>
                    {currentLocation && (
                      <View className="items-end">
                        <Text className="text-gray-500 text-xs">
                          {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                        </Text>
                        {currentLocation.city && currentLocation.state && (
                          <Text className="text-gray-400 text-xs">
                            {currentLocation.city}, {currentLocation.state}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                </View>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons name="resize" size={20} color="#6b7280" />
                    <Text className="text-gray-700 ml-3">Farm Size</Text>
                  </View>
                  <TouchableOpacity onPress={() => Alert.alert('Edit Farm Size', 'Farm size editing coming soon!')}>
                    <Text className="font-semibold text-gray-900">{user.farmSize}</Text>
                  </TouchableOpacity>
                </View>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons name="time" size={20} color="#6b7280" />
                    <Text className="text-gray-700 ml-3">Experience</Text>
                  </View>
                  <TouchableOpacity onPress={() => Alert.alert('Edit Experience', 'Experience editing coming soon!')}>
                    <Text className="font-semibold text-gray-900">{user.experience}</Text>
                  </TouchableOpacity>
                </View>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons name="leaf" size={20} color="#6b7280" />
                    <Text className="text-gray-700 ml-3">Main Crops</Text>
                  </View>
                  <TouchableOpacity onPress={() => Alert.alert('Edit Crops', 'Crop editing coming soon!')}>
                    <Text className="font-semibold text-gray-900">{user.crops.join(', ')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
        
        {/* Bottom padding for tab bar */}
        <View style={{ height: Platform.OS === 'ios' ? 88 : 64 }} />
      </ScrollView>
    </View>
  );
}