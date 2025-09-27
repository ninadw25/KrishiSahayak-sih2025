export interface LocationData {
  countryName: string;
  principalSubdivision: string; // State
  locality: string; // District/City
  city: string;
  postcode: string;
}

export interface GeocodingResult {
  success: boolean;
  data?: LocationData;
  error?: string;
}

class GeocodingService {
  private static instance: GeocodingService;
  private readonly GEOCODING_API_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

  static getInstance(): GeocodingService {
    if (!GeocodingService.instance) {
      GeocodingService.instance = new GeocodingService();
    }
    return GeocodingService.instance;
  }

  async getLocationFromCoordinates(latitude: number, longitude: number): Promise<GeocodingResult> {
    try {
      console.log('Getting location from coordinates:', { latitude, longitude });
      
      const url = `${this.GEOCODING_API_URL}?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data: LocationData = await response.json();
      console.log('Geocoding response:', data);

      return {
        success: true,
        data: {
          countryName: data.countryName || 'Unknown',
          principalSubdivision: data.principalSubdivision || 'Unknown State',
          locality: data.locality || 'Unknown District',
          city: data.city || data.locality || 'Unknown City',
          postcode: data.postcode || 'Unknown',
        }
      };
    } catch (error) {
      console.error('Error getting location from coordinates:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getLocationFromCurrentPosition(): Promise<GeocodingResult> {
    try {
      // Get current location using the permission manager
      const { permissionManager } = await import('./permissions');
      const location = await permissionManager.getCurrentLocation();
      
      if (!location) {
        return {
          success: false,
          error: 'Location not available'
        };
      }

      return await this.getLocationFromCoordinates(location.latitude, location.longitude);
    } catch (error) {
      console.error('Error getting current location:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get current location'
      };
    }
  }

  // Helper method to format location for display
  formatLocationForDisplay(locationData: LocationData): string {
    return `${locationData.locality}, ${locationData.principalSubdivision}`;
  }

  // Helper method to get state and district for API calls
  getStateAndDistrict(locationData: LocationData): { state: string; district: string } {
    return {
      state: locationData.principalSubdivision,
      district: locationData.locality
    };
  }

  // Convert location name to coordinates using OpenStreetMap Nominatim API
  async getCoordinatesFromLocation(locationName: string): Promise<{ latitude: number; longitude: number } | null> {
    try {
      console.log('Getting coordinates for location:', locationName);
      
      const encodedLocation = encodeURIComponent(locationName);
      const url = `https://nominatim.openstreetmap.org/search?q=${encodedLocation}&format=geojson&limit=1`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'KrishiSahayak/1.0', // Required by Nominatim
        },
      });

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Geocoding response:', data);

      if (data.features && data.features.length > 0) {
        const coordinates = data.features[0].geometry.coordinates;
        return {
          longitude: coordinates[0],
          latitude: coordinates[1]
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting coordinates from location:', error);
      return null;
    }
  }

  // Get location data from coordinates using OpenStreetMap Nominatim API
  async getLocationFromCoordinatesNominatim(latitude: number, longitude: number): Promise<LocationData | null> {
    try {
      console.log('Getting location from coordinates using Nominatim:', { latitude, longitude });
      
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'KrishiSahayak/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Nominatim response:', data);

      if (data.address) {
        return {
          countryName: data.address.country || 'Unknown',
          principalSubdivision: data.address.state || data.address.region || 'Unknown State',
          locality: data.address.city || data.address.town || data.address.village || 'Unknown District',
          city: data.address.city || data.address.town || data.address.village || 'Unknown City',
          postcode: data.address.postcode || 'Unknown',
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting location from coordinates using Nominatim:', error);
      return null;
    }
  }
}

export const geocodingService = GeocodingService.getInstance();
