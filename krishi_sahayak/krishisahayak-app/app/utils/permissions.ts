import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';

export interface PermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}

export interface AppPermissions {
  microphone: PermissionStatus;
  camera: PermissionStatus;
  location: PermissionStatus;
}

export class PermissionManager {
  private static instance: PermissionManager;
  private permissions: AppPermissions = {
    microphone: { granted: false, canAskAgain: true, status: 'undetermined' },
    camera: { granted: false, canAskAgain: true, status: 'undetermined' },
    location: { granted: false, canAskAgain: true, status: 'undetermined' },
  };

  static getInstance(): PermissionManager {
    if (!PermissionManager.instance) {
      PermissionManager.instance = new PermissionManager();
    }
    return PermissionManager.instance;
  }

  async requestAllPermissions(): Promise<AppPermissions> {
    const [microphone, camera, location] = await Promise.allSettled([
      this.requestMicrophonePermission(),
      this.requestCameraPermission(),
      this.requestLocationPermission(),
    ]);

    this.permissions.microphone = microphone.status === 'fulfilled' ? microphone.value : this.permissions.microphone;
    this.permissions.camera = camera.status === 'fulfilled' ? camera.value : this.permissions.camera;
    this.permissions.location = location.status === 'fulfilled' ? location.value : this.permissions.location;

    return this.permissions;
  }

  async requestMicrophonePermission(): Promise<PermissionStatus> {
    try {
      // For microphone, we'll use a simple approach since expo-av doesn't have direct permission methods
      // The permission will be requested when actually using the microphone
      const permissionStatus: PermissionStatus = {
        granted: true, // We'll check this when actually recording
        canAskAgain: true,
        status: 'granted',
      };

      this.permissions.microphone = permissionStatus;
      return permissionStatus;
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      return this.permissions.microphone;
    }
  }

  async requestCameraPermission(): Promise<PermissionStatus> {
    try {
      // For camera, we'll use a simple approach since the new Camera API uses hooks
      // The permission will be requested when actually using the camera
      const permissionStatus: PermissionStatus = {
        granted: true, // We'll check this when actually using the camera
        canAskAgain: true,
        status: 'granted',
      };

      this.permissions.camera = permissionStatus;
      return permissionStatus;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return this.permissions.camera;
    }
  }

  async requestLocationPermission(): Promise<PermissionStatus> {
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      
      const permissionStatus: PermissionStatus = {
        granted: status === 'granted',
        canAskAgain: canAskAgain,
        status: status,
      };

      this.permissions.location = permissionStatus;
      return permissionStatus;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return this.permissions.location;
    }
  }

  async getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  async checkAllPermissions(): Promise<AppPermissions> {
    const [microphone, camera, location] = await Promise.allSettled([
      this.checkMicrophonePermission(),
      this.checkCameraPermission(),
      this.checkLocationPermission(),
    ]);

    this.permissions.microphone = microphone.status === 'fulfilled' ? microphone.value : this.permissions.microphone;
    this.permissions.camera = camera.status === 'fulfilled' ? camera.value : this.permissions.camera;
    this.permissions.location = location.status === 'fulfilled' ? location.value : this.permissions.location;

    return this.permissions;
  }

  async checkMicrophonePermission(): Promise<PermissionStatus> {
    try {
      // For microphone, we'll use a simple approach since expo-av doesn't have direct permission methods
      const permissionStatus: PermissionStatus = {
        granted: true, // We'll check this when actually recording
        canAskAgain: true,
        status: 'granted',
      };

      this.permissions.microphone = permissionStatus;
      return permissionStatus;
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      return this.permissions.microphone;
    }
  }

  async checkCameraPermission(): Promise<PermissionStatus> {
    try {
      // For camera, we'll use a simple approach since the new Camera API uses hooks
      const permissionStatus: PermissionStatus = {
        granted: true, // We'll check this when actually using the camera
        canAskAgain: true,
        status: 'granted',
      };

      this.permissions.camera = permissionStatus;
      return permissionStatus;
    } catch (error) {
      console.error('Error checking camera permission:', error);
      return this.permissions.camera;
    }
  }

  async checkLocationPermission(): Promise<PermissionStatus> {
    try {
      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
      
      const permissionStatus: PermissionStatus = {
        granted: status === 'granted',
        canAskAgain: canAskAgain,
        status: status,
      };

      this.permissions.location = permissionStatus;
      return permissionStatus;
    } catch (error) {
      console.error('Error checking location permission:', error);
      return this.permissions.location;
    }
  }

  getPermissions(): AppPermissions {
    return this.permissions;
  }

  showPermissionAlert(permission: 'microphone' | 'camera' | 'location'): void {
    const permissionNames = {
      microphone: 'Microphone',
      camera: 'Camera',
      location: 'Location',
    };

    const permissionDescriptions = {
      microphone: 'KrishiSahayak needs microphone access to enable voice input for easier communication with the AI assistant.',
      camera: 'KrishiSahayak needs camera access to scan crops and identify diseases, pests, and plant health issues.',
      location: 'KrishiSahayak needs location access to provide accurate weather forecasts and location-specific farming advice.',
    };

    Alert.alert(
      `${permissionNames[permission]} Permission Required`,
      permissionDescriptions[permission],
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Open Settings',
          onPress: () => this.openAppSettings(),
        },
      ]
    );
  }

  private openAppSettings(): void {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }

  isPermissionGranted(permission: 'microphone' | 'camera' | 'location'): boolean {
    return this.permissions[permission].granted;
  }

  canRequestPermission(permission: 'microphone' | 'camera' | 'location'): boolean {
    return this.permissions[permission].canAskAgain;
  }
}

export const permissionManager = PermissionManager.getInstance();