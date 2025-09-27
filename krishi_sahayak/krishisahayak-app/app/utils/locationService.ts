import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { geocodingService } from './geocodingService';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  accuracy?: number;
  timestamp: number;
}

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: Location.LocationPermissionResponse['status'];
}

class LocationService {
  private static instance: LocationService;
  private currentLocation: LocationData | null = null;
  private lastLocationUpdate: number = 0;
  private readonly LOCATION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  async requestLocationPermission(): Promise<LocationPermissionStatus> {
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to provide weather information and map features. Please enable location permissions in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
             { text: 'Open Settings', onPress: () => console.log('Open settings manually') }
          ]
        );
      }

      return {
        granted: status === 'granted',
        canAskAgain,
        status
      };
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied' as Location.LocationPermissionResponse['status']
      };
    }
  }

  async getCurrentLocationPermission(): Promise<LocationPermissionStatus> {
    try {
      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
      
      return {
        granted: status === 'granted',
        canAskAgain,
        status
      };
    } catch (error) {
      console.error('Error checking location permission:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied' as Location.LocationPermissionResponse['status']
      };
    }
  }

  async getCurrentLocation(forceRefresh: boolean = false): Promise<LocationData | null> {
    try {
      // Check if we have recent cached location
      if (!forceRefresh && this.currentLocation && 
          (Date.now() - this.lastLocationUpdate) < this.LOCATION_CACHE_DURATION) {
        console.log('Using cached location');
        return this.currentLocation;
      }

      // Check permissions first
      const permission = await this.getCurrentLocationPermission();
      if (!permission.granted) {
        console.log('Location permission not granted');
        return null;
      }

      console.log('Getting current location...');
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        timestamp: Date.now()
      };

      // Try to get address from coordinates using geocoding service
      try {
        const geocodingResult = await geocodingService.getLocationFromCoordinates(
          locationData.latitude, 
          locationData.longitude
        );

        if (geocodingResult.success && geocodingResult.data) {
          const geoData = geocodingResult.data;
          locationData.address = this.formatAddressFromGeocoding(geoData);
          locationData.city = geoData.locality || geoData.city;
          locationData.state = geoData.principalSubdivision;
          locationData.country = geoData.countryName;
        } else {
          // Fallback to expo-location if geocoding service fails
          const addresses = await Location.reverseGeocodeAsync({
            latitude: locationData.latitude,
            longitude: locationData.longitude
          });

          if (addresses.length > 0) {
            const address = addresses[0];
            locationData.address = this.formatAddress(address);
            locationData.city = address.city || address.district || address.subregion || undefined;
            locationData.state = address.region || undefined;
            locationData.country = address.country || undefined;
          }
        }
      } catch (error) {
        console.error('Error getting address from coordinates:', error);
      }

      // Cache the location
      this.currentLocation = locationData;
      this.lastLocationUpdate = Date.now();

      console.log('Location obtained:', locationData);
      return locationData;
    } catch (error) {
      console.error('Error getting current location:', error);
      return this.currentLocation; // Return cached location if available
    }
  }

  private formatAddress(address: Location.LocationGeocodedAddress): string {
    const parts = [];
    
    if (address.street) parts.push(address.street);
    if (address.city || address.district) parts.push(address.city || address.district);
    if (address.region) parts.push(address.region);
    if (address.country) parts.push(address.country);
    
    return parts.join(', ');
  }

  private formatAddressFromGeocoding(geoData: any): string {
    const parts = [];
    
    if (geoData.locality) parts.push(geoData.locality);
    if (geoData.principalSubdivision) parts.push(geoData.principalSubdivision);
    if (geoData.countryName) parts.push(geoData.countryName);
    
    return parts.join(', ');
  }

  async getLocationFromAddress(address: string): Promise<LocationData | null> {
    try {
      console.log('Geocoding address:', address);
      
      const locations = await Location.geocodeAsync(address);
      
      if (locations.length > 0) {
        const location = locations[0];
        return {
          latitude: location.latitude,
          longitude: location.longitude,
          address: address,
          timestamp: Date.now()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }

  // Method to watch location changes (for real-time updates)
  async watchLocation(callback: (location: LocationData) => void): Promise<Location.LocationSubscription | null> {
    try {
      const permission = await this.getCurrentLocationPermission();
      if (!permission.granted) {
        return null;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 30000, // Update every 30 seconds
          distanceInterval: 100, // Update when moved 100 meters
        },
        async (location) => {
          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || undefined,
            timestamp: Date.now()
          };

           // Try to get address using geocoding service
           try {
             const geocodingResult = await geocodingService.getLocationFromCoordinates(
               locationData.latitude, 
               locationData.longitude
             );

             if (geocodingResult.success && geocodingResult.data) {
               const geoData = geocodingResult.data;
               locationData.address = this.formatAddressFromGeocoding(geoData);
               locationData.city = geoData.locality || geoData.city;
               locationData.state = geoData.principalSubdivision;
               locationData.country = geoData.countryName;
             } else {
               // Fallback to expo-location
               const addresses = await Location.reverseGeocodeAsync({
                 latitude: locationData.latitude,
                 longitude: locationData.longitude
               });

               if (addresses.length > 0) {
                 const address = addresses[0];
                 locationData.address = this.formatAddress(address);
                 locationData.city = address.city || address.district || address.subregion || undefined;
                 locationData.state = address.region || undefined;
                 locationData.country = address.country || undefined;
               }
             }
           } catch (error) {
             console.error('Error getting address in watch:', error);
           }

          this.currentLocation = locationData;
          this.lastLocationUpdate = Date.now();
          callback(locationData);
        }
      );

      return subscription;
    } catch (error) {
      console.error('Error watching location:', error);
      return null;
    }
  }

  // Get cached location
  getCachedLocation(): LocationData | null {
    return this.currentLocation;
  }

  // Clear cached location
  clearLocationCache(): void {
    this.currentLocation = null;
    this.lastLocationUpdate = 0;
    console.log('Location cache cleared');
  }

  // Get location status for debugging
  getLocationStatus(): { hasLocation: boolean; isRecent: boolean; lastUpdate?: number } {
    const now = Date.now();
    return {
      hasLocation: !!this.currentLocation,
      isRecent: this.currentLocation ? (now - this.lastLocationUpdate) < this.LOCATION_CACHE_DURATION : false,
      lastUpdate: this.lastLocationUpdate
    };
  }

  // Method to refresh location with fresh geocoding
  async refreshLocationWithGeocoding(): Promise<LocationData | null> {
    try {
      console.log('Refreshing location with fresh geocoding...');
      
      const location = await this.getCurrentLocation(true); // Force refresh
      if (location) {
        // Re-geocode the address to ensure fresh data
        const geocodingResult = await geocodingService.getLocationFromCoordinates(
          location.latitude, 
          location.longitude
        );

        if (geocodingResult.success && geocodingResult.data) {
          const geoData = geocodingResult.data;
          location.address = this.formatAddressFromGeocoding(geoData);
          location.city = geoData.locality || geoData.city;
          location.state = geoData.principalSubdivision;
          location.country = geoData.countryName;
          location.timestamp = Date.now(); // Update timestamp
          
          // Update cache
          this.currentLocation = location;
          this.lastLocationUpdate = Date.now();
          
          console.log('Location refreshed with fresh geocoding:', location);
        }
      }
      
      return location;
    } catch (error) {
      console.error('Error refreshing location with geocoding:', error);
      return this.currentLocation;
    }
  }

  // Utility method to calculate distance between two points
  calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const locationService = LocationService.getInstance();
