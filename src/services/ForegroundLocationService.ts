import Geolocation from '@react-native-community/geolocation';
import {PermissionsAndroid, Platform} from 'react-native';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number;
  heading: number | null;
  speed: number | null;
}

export interface LocationData {
  coords: LocationCoords;
  timestamp: number;
}

type LocationCallback = (location: LocationData) => void;
type ErrorCallback = (error: any) => void;

class ForegroundLocationService {
  private watchId: number | null = null;
  private isTracking: boolean = false;

  /**
   * Request location permissions
   */
  async requestLocationPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Track Journey needs access to your location to track your journeys.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Error requesting location permission:', err);
        return false;
      }
    }
    return true; // iOS handles permissions differently
  }

  /**
   * Start tracking location in foreground
   */
  async startTracking(
    onLocationUpdate: LocationCallback,
    onError?: ErrorCallback,
  ): Promise<boolean> {
    if (this.isTracking) {
      console.log('[ForegroundLocationService] Already tracking');
      return true;
    }

    // Request permission first
    const hasPermission = await this.requestLocationPermission();
    if (!hasPermission) {
      console.log('[ForegroundLocationService] Location permission denied');
      return false;
    }

    console.log('[ForegroundLocationService] Starting location tracking');

    this.watchId = Geolocation.watchPosition(
      position => {
        const locationData: LocationData = {
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
          },
          timestamp: position.timestamp,
        };
        onLocationUpdate(locationData);
      },
      error => {
        console.error('[ForegroundLocationService] Location error:', error);
        if (onError) {
          onError(error);
        }
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // Update every 10 meters
        interval: 5000, // Update every 5 seconds
        fastestInterval: 3000, // Fastest update interval
      },
    );

    this.isTracking = true;
    return true;
  }

  /**
   * Stop tracking location
   */
  stopTracking(): void {
    if (this.watchId !== null) {
      console.log('[ForegroundLocationService] Stopping location tracking');
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isTracking = false;
    }
  }

  /**
   * Get current location once
   */
  getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          const locationData: LocationData = {
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              altitude: position.coords.altitude,
              accuracy: position.coords.accuracy,
              heading: position.coords.heading,
              speed: position.coords.speed,
            },
            timestamp: position.timestamp,
          };
          resolve(locationData);
        },
        error => {
          console.error('[ForegroundLocationService] Error getting location:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    });
  }

  /**
   * Check if currently tracking
   */
  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }
}

export default new ForegroundLocationService();
