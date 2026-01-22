import Geolocation from '@react-native-community/geolocation';
import {API_ENDPOINTS} from '../config/api';
import {TripPoint, TripPointsUploadRequest} from '../types';
import ApiService from './ApiService';

interface LocationCoords {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
}

interface Location {
  coords: LocationCoords;
  timestamp: number;
}

class LocationService {
  private isInitialized = false;
  private isTracking = false;
  private pointsBuffer: TripPoint[] = [];
  private uploadInterval: NodeJS.Timeout | null = null;
  private watchId: number | null = null;
  private readonly UPLOAD_INTERVAL_MS = 30000; // Upload every 30 seconds

  // Authorization status constants
  public readonly AUTHORIZATION_STATUS_NOT_DETERMINED = 0;
  public readonly AUTHORIZATION_STATUS_RESTRICTED = 1;
  public readonly AUTHORIZATION_STATUS_DENIED = 2;
  public readonly AUTHORIZATION_STATUS_ALWAYS = 3;
  public readonly AUTHORIZATION_STATUS_WHEN_IN_USE = 4;

  /**
   * Initialize location service with configuration
   */
  async initialize(apiUrl: string, authToken: string): Promise<any> {
    if (this.isInitialized) {
      console.log('[LocationService] Already initialized');
      return {enabled: this.isTracking};
    }

    console.log('[LocationService] Initializing...');

    // Configure geolocation
    Geolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: 'always',
    });

    this.isInitialized = true;
    console.log('[LocationService] Initialized successfully');
    return {enabled: false};
  }

  /**
   * Request location permissions
   */
  async requestPermissions(): Promise<number> {
    // For React Native Community Geolocation, permissions are handled at the native level
    // Return AUTHORIZATION_STATUS_WHEN_IN_USE as default
    console.log('[LocationService] Permissions requested');
    return this.AUTHORIZATION_STATUS_WHEN_IN_USE;
  }

  /**
   * Start tracking location
   */
  async startTracking(): Promise<any> {
    if (this.isTracking) {
      console.log('[LocationService] Already tracking');
      return {enabled: true};
    }

    console.log('[LocationService] Starting location tracking...');

    // Start watching position
    this.watchId = Geolocation.watchPosition(
      (position) => {
        const location: Location = {
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude,
            accuracy: position.coords.accuracy,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
          },
          timestamp: position.timestamp,
        };

        // Call registered callback (MapScreen will handle adding to buffer with address)
        if (this.locationCallback) {
          this.locationCallback(location);
        }
      },
      (error) => {
        console.error('[LocationService] Location error:', error);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // Update every 10 meters
        interval: 10000, // Android: 10 seconds
        fastestInterval: 5000, // Android: 5 seconds
      }
    );

    this.isTracking = true;
    this.startUploadTimer();
    console.log('[LocationService] Tracking started');
    return {enabled: true};
  }

  /**
   * Stop tracking location
   */
  async stopTracking(): Promise<any> {
    console.log('[LocationService] Stopping tracking...');

    // Upload remaining points before stopping
    if (this.pointsBuffer.length > 0) {
      await this.uploadPoints();
    }

    this.stopUploadTimer();

    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    this.isTracking = false;
    console.log('[LocationService] Tracking stopped');
    return {enabled: false};
  }

  /**
   * Update auth token (placeholder for compatibility)
   */
  async updateAuthToken(token: string): Promise<void> {
    console.log('[LocationService] Auth token updated');
  }

  /**
   * Convert Location to TripPoint format
   */
  private locationToTripPoint(location: Location, address?: any): TripPoint {
    const point: TripPoint = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: new Date(location.timestamp).toISOString(),
      angle: location.coords.heading ?? undefined,
      speed: location.coords.speed ?? undefined,
    };

    // Add address if provided
    if (address) {
      point.address = address;
    }

    return point;
  }

  /**
   * Upload points to server
   */
  private async uploadPoints(): Promise<void> {
    if (this.pointsBuffer.length === 0) {
      return;
    }

    const pointsToUpload = [...this.pointsBuffer];
    this.pointsBuffer = []; // Clear buffer immediately

    try {
      console.log(`[LocationService] Uploading ${pointsToUpload.length} points to server...`);
      const api = ApiService.getInstance();
      const request: TripPointsUploadRequest = {
        points: pointsToUpload,
      };

      // Log the payload being sent
      const response = await api.post(API_ENDPOINTS.TRIPS.POINTS, request);
      console.log(`✓ upload ${pointsToUpload.length} points success.`);
    } catch (error: any) {
      console.error('[LocationService] Failed to upload points:', error);
      console.error('[LocationService] Error details:', ApiService.getErrorMessage(error));
      // Re-add points to buffer on failure
      this.pointsBuffer.unshift(...pointsToUpload);
    }
  }

  /**
   * Add point to buffer
   */
  addPoint(location: Location, address?: any): void {
    const point = this.locationToTripPoint(location, address);
    this.pointsBuffer.push(point);
    console.log(`[LocationService] Added point to buffer. Total points: ${this.pointsBuffer.length}`);
  }

  /**
   * Start periodic upload timer
   */
  private startUploadTimer(): void {
    if (this.uploadInterval) {
      console.log('[LocationService] Upload timer already running');
      return;
    }

    console.log(`[LocationService] Starting upload timer (${this.UPLOAD_INTERVAL_MS}ms)`);
    this.uploadInterval = setInterval(async () => {
      console.log(`[LocationService] Timer tick - buffer has ${this.pointsBuffer.length} points`);
      if (this.pointsBuffer.length > 0) {
        await this.uploadPoints();
      }
    }, this.UPLOAD_INTERVAL_MS);
  }

  /**
   * Stop periodic upload timer
   */
  private stopUploadTimer(): void {
    if (this.uploadInterval) {
      clearInterval(this.uploadInterval);
      this.uploadInterval = null;
      console.log('[LocationService] Upload timer stopped');
    }
  }

  private locationCallback: ((location: Location) => void) | null = null;

  /**
   * Listen to location updates
   */
  onLocation(callback: (location: Location) => void): () => void {
    this.locationCallback = callback;
    return () => {
      this.locationCallback = null;
    };
  }

  /**
   * Get current location immediately
   */
  async getCurrentLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              altitude: position.coords.altitude,
              accuracy: position.coords.accuracy,
              altitudeAccuracy: position.coords.altitudeAccuracy,
              heading: position.coords.heading,
              speed: position.coords.speed,
            },
            timestamp: position.timestamp,
          };
          resolve(location);
        },
        (error) => {
          console.error('[LocationService] Get current location error:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 5000,
        }
      );
    });
  }

  /**
   * Get current tracking state
   */
  async getState(): Promise<any> {
    return {enabled: this.isTracking};
  }
}

export default new LocationService();
