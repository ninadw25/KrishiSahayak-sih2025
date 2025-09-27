import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, TouchableOpacity, View } from 'react-native';
import { LocationData, locationService } from '../utils/locationService';
import Text from './Text';

interface LocationMapProps {
  onLocationSelect?: (location: LocationData) => void;
  initialLocation?: LocationData;
  showCurrentLocationButton?: boolean;
  height?: number;
}

export default function LocationMap({ 
  onLocationSelect, 
  initialLocation,
  showCurrentLocationButton = true,
  height = 200 
}: LocationMapProps) {
  const [location, setLocation] = useState<LocationData | null>(initialLocation || null);
  const [loading, setLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    checkPermissions();
    if (!initialLocation) {
      getCurrentLocation();
    }
  }, []);

  const checkPermissions = async () => {
    const permission = await locationService.getCurrentLocationPermission();
    setPermissionGranted(permission.granted);
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      if (!permissionGranted) {
        const permission = await locationService.requestLocationPermission();
        if (!permission.granted) {
          setLoading(false);
          return;
        }
        setPermissionGranted(true);
      }

      const currentLocation = await locationService.getCurrentLocation(true);
      if (currentLocation) {
        setLocation(currentLocation);
        onLocationSelect?.(currentLocation);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationPress = () => {
    if (location) {
      Alert.alert(
        'Location Details',
        `Latitude: ${location.latitude.toFixed(6)}\nLongitude: ${location.longitude.toFixed(6)}${location.address ? `\nAddress: ${location.address}` : ''}`,
        [
          { text: 'OK' },
          { text: 'Refresh', onPress: getCurrentLocation }
        ]
      );
    }
  };

  const openInMaps = () => {
    if (location) {
      const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
      // In a real app, you would use Linking.openURL(url)
      Alert.alert('Open in Maps', `Would open: ${url}`);
    }
  };

  return (
    <View className="relative">
      {/* Map Placeholder - In a real implementation, this would be a proper map component */}
      <TouchableOpacity 
        onPress={handleLocationPress}
        className="bg-gray-200 rounded-xl overflow-hidden"
        style={{ height }}
      >
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#059669" />
            <Text className="text-gray-600 mt-2">Getting location...</Text>
          </View>
        ) : location ? (
          <View className="flex-1 p-4">
            <View className="flex-1 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg items-center justify-center">
              <Ionicons name="location" size={48} color="#059669" />
              <Text className="text-gray-800 font-semibold mt-2 text-center">
                {location.city || 'Current Location'}
              </Text>
              <Text className="text-gray-600 text-sm text-center mt-1">
                {location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
              </Text>
              {location.accuracy && (
                <Text className="text-gray-500 text-xs mt-1">
                  Accuracy: ±{Math.round(location.accuracy)}m
                </Text>
              )}
            </View>
          </View>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="location-outline" size={48} color="#9ca3af" />
            <Text className="text-gray-500 mt-2">No location available</Text>
            <Text className="text-gray-400 text-sm">Tap to get location</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Action Buttons */}
      <View className="flex-row justify-between mt-3">
        {showCurrentLocationButton && (
          <TouchableOpacity
            onPress={getCurrentLocation}
            disabled={loading}
            className="flex-row items-center bg-green-500 px-4 py-2 rounded-lg flex-1 mr-2"
          >
            <Ionicons 
              name={loading ? "refresh" : "locate"} 
              size={16} 
              color="white" 
              style={{ transform: loading ? [{ rotate: '0deg' }] : [] }}
            />
            <Text className="text-white font-semibold ml-2">
              {loading ? 'Getting...' : 'Current Location'}
            </Text>
          </TouchableOpacity>
        )}

        {location && (
          <TouchableOpacity
            onPress={openInMaps}
            className="flex-row items-center bg-blue-500 px-4 py-2 rounded-lg flex-1 ml-2"
          >
            <Ionicons name="map" size={16} color="white" />
            <Text className="text-white font-semibold ml-2">Open in Maps</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Location Details */}
      {location && (
        <View className="mt-3 p-3 bg-gray-50 rounded-lg">
          <Text className="text-gray-700 font-semibold mb-2">Location Details</Text>
          <View className="space-y-1">
            <Text className="text-gray-600 text-sm">
              <Text className="font-semibold">Coordinates:</Text> {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </Text>
            {location.city && (
              <Text className="text-gray-600 text-sm">
                <Text className="font-semibold">City:</Text> {location.city}
              </Text>
            )}
            {location.state && (
              <Text className="text-gray-600 text-sm">
                <Text className="font-semibold">State:</Text> {location.state}
              </Text>
            )}
            {location.country && (
              <Text className="text-gray-600 text-sm">
                <Text className="font-semibold">Country:</Text> {location.country}
              </Text>
            )}
            <Text className="text-gray-500 text-xs mt-2">
              Last updated: {new Date(location.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
