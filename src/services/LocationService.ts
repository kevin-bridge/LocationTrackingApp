import BackgroundGeolocation, {
  Location,
  State,
  ProviderChangeEvent,
  Subscription,
} from 'react-native-background-geolocation';
import {Platform} from 'react-native';
import {API_ENDPOINTS} from '../config/api';
import {BACKGROUND_GEOLOCATION_LICENSE_IOS, BACKGROUND_GEOLOCATION_LICENSE_ANDROID, BG_GEO_CONFIG} from '../config/backgroundGeolocation';
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

interface SimpleLocation {
  coords: LocationCoords;
  timestamp: number;
}

class LocationService {
  private isInitialized = false;
  private isTracking = false;
  private pointsBuffer: TripPoint[] = [];
  private uploadInterval: NodeJS.Timeout | null = null;
  private readonly UPLOAD_INTERVAL_MS = 30000; // Upload every 30 seconds
  private locationCallback: ((location: SimpleLocation) => void) | null = null;
  private locationSubscription: Subscription | null = null;
  private motionChangeSubscription: Subscription | null = null;
  private isPollingActive = false;
  private watchPositionSubscription: {remove: () => void} | null = null;
  private sessionPoints: SimpleLocation[] = [];

  // Authorization status constants
  public readonly AUTHORIZATION_STATUS_NOT_DETERMINED = 0;
  public readonly AUTHORIZATION_STATUS_RESTRICTED = 1;
  public readonly AUTHORIZATION_STATUS_DENIED = 2;
  public readonly AUTHORIZATION_STATUS_ALWAYS = 3;
  public readonly AUTHORIZATION_STATUS_WHEN_IN_USE = 4;

  /**
   * Initialize location service with configuration
   */
  async initialize(): Promise<any> {
    if (this.isInitialized) {
      console.log('[LocationService] Already initialized');
      return {enabled: this.isTracking};
    }

    console.log('[LocationService] Initializing Background Geolocation...');

    try {
      // Configure Background Geolocation using centralized config + license key.
      // reset: true (iOS only) forces BGGeo to always use this config instead of
      // the cached version from the first launch. Without it, ready() ignores all
      // config changes on subsequent launches, so disableStopDetection never applies.
      await BackgroundGeolocation.ready({
        ...BG_GEO_CONFIG,
        ...(Platform.OS === 'ios' ? {reset: true} : {}),
        license: Platform.OS === 'ios'
          ? BACKGROUND_GEOLOCATION_LICENSE_IOS
          : BACKGROUND_GEOLOCATION_LICENSE_ANDROID,
        // iOS specific
        pausesLocationUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: true,
        disableMotionActivityUpdates: Platform.OS === 'ios',
        disableStopDetection: Platform.OS === 'ios',
      } as any);

      console.log('[LocationService] Background Geolocation configured successfully');

      this.isInitialized = true;
      return {enabled: false};
    } catch (error) {
      console.error('[LocationService] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Request location permissions
   */
  async requestPermissions(): Promise<number> {
    try {
      const status = await BackgroundGeolocation.requestPermission();
      console.log('[LocationService] Permission status:', status);

      // Convert to our authorization status constants
      if (status === 3) return this.AUTHORIZATION_STATUS_ALWAYS;
      if (status === 4) return this.AUTHORIZATION_STATUS_WHEN_IN_USE;
      if (status === 2) return this.AUTHORIZATION_STATUS_DENIED;
      if (status === 1) return this.AUTHORIZATION_STATUS_RESTRICTED;
      return this.AUTHORIZATION_STATUS_NOT_DETERMINED;
    } catch (error) {
      console.error('[LocationService] Permission request error:', error);
      return this.AUTHORIZATION_STATUS_NOT_DETERMINED;
    }
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

    try {
      // Subscribe to location updates
      this.locationSubscription = BackgroundGeolocation.onLocation(
        (location: Location) => {
          console.log('[LocationService] Location update:', location.coords.latitude, location.coords.longitude);

          const simpleLocation: SimpleLocation = {
            coords: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              altitude: location.coords.altitude ?? null,
              accuracy: location.coords.accuracy,
              altitudeAccuracy: location.coords.altitude_accuracy ?? null,
              heading: location.coords.heading ?? null,
              speed: location.coords.speed ?? null,
            },
            timestamp: new Date(location.timestamp).getTime(),
          };

          // Add to buffer immediately — do NOT wait for MapScreen's async address fetch.
          // In background, iOS can suspend the address fetch network request, causing
          // points to be silently dropped if addPoint() is deferred to MapScreen.
          this.addPoint(simpleLocation);

          // Notify MapScreen for display (map polyline, current location marker)
          if (this.locationCallback) {
            this.locationCallback(simpleLocation);
          }
        },
        (error) => {
          console.error('[LocationService] Location error:', error);
        },
      );

      // iOS simulator fix: BGGeo always runs an initial [motionchange] sequence on
      // start() which determines the device is stationary (no real motion sensors).
      // disableStopDetection prevents RE-ENTRY into stationary but NOT this initial
      // startup sequence. We listen for isMoving: false and call changePace(true) to
      // force moving mode. On subsequent sessions BGGeo may start in moving mode
      // directly (skipping stationary), so watchPosition is always started below.
      if (Platform.OS === 'ios') {
        let forcedMovingMode = false;
        this.motionChangeSubscription = BackgroundGeolocation.onMotionChange(
          (event: any) => {
            if (!event.isMoving && !forcedMovingMode) {
              forcedMovingMode = true;
              console.log('[LocationService] iOS: Initial stationary state detected, forcing moving mode...');
              BackgroundGeolocation.changePace(true).catch((e: any) => {
                console.warn('[LocationService] changePace(true) after motionChange failed:', e);
              });
            }
          },
        );
      }

      // Start tracking
      await BackgroundGeolocation.start();

      this.isTracking = true;
      this.startUploadTimer();

      // iOS: Always start watchPosition immediately after start() so updates flow
      // on both first and subsequent sessions, regardless of BGGeo motion state.
      if (Platform.OS === 'ios') {
        this.startLocationPolling();
      }

      console.log('[LocationService] Tracking started with background geolocation');
      return {enabled: true};
    } catch (error) {
      console.error('[LocationService] Error starting tracking:', error);
      throw error;
    }
  }

  /**
   * Stop tracking location
   */
  async stopTracking(): Promise<any> {
    console.log('[LocationService] Stopping tracking...');

    try {
      // Upload remaining points before stopping
      if (this.pointsBuffer.length > 0) {
        await this.uploadPoints();
      }

      // Trigger trip generation so the trip appears in history immediately
      try {
        const api = ApiService.getInstance();
        await api.post(API_ENDPOINTS.TRIPS.GENERATE, {});
        console.log('[LocationService] Trip generation triggered successfully');
      } catch (generateError) {
        // Non-fatal: the backend batch job will process points within 2 minutes
        console.warn('[LocationService] Trip generation request failed (batch job will handle it):', generateError);
      }

      this.stopUploadTimer();

      // Stop movement mode — non-fatal if plugin is already stationary/disabled
      try {
        await BackgroundGeolocation.changePace(false);
      } catch (paceError) {
        console.warn('[LocationService] changePace(false) skipped:', paceError);
      }

      // Unsubscribe from location updates
      if (this.locationSubscription) {
        this.locationSubscription.remove();
        this.locationSubscription = null;
      }

      // Clean up iOS motionChange subscription and polling
      if (this.motionChangeSubscription) {
        this.motionChangeSubscription.remove();
        this.motionChangeSubscription = null;
      }
      this.stopLocationPolling();

      // Stop background geolocation — non-fatal if already stopped
      try {
        await BackgroundGeolocation.stop();
      } catch (stopError) {
        console.warn('[LocationService] BackgroundGeolocation.stop() skipped:', stopError);
      }

      this.isTracking = false;
      this.sessionPoints = [];
      console.log('[LocationService] Tracking stopped');
      return {enabled: false};
    } catch (error) {
      console.error('[LocationService] Error stopping tracking:', error);
      this.isTracking = false;
      throw error;
    }
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
  private locationToTripPoint(location: SimpleLocation, address?: any): TripPoint {
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

      await api.post(API_ENDPOINTS.TRIPS.POINTS, request);
      console.log(`✓ Uploaded ${pointsToUpload.length} points successfully`);
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
  addPoint(location: SimpleLocation, address?: any): void {
    const point = this.locationToTripPoint(location, address);
    this.pointsBuffer.push(point);
    this.sessionPoints.push(location); // Keep full in-memory log for route rebuild on foreground resume
    console.log(`[LocationService] Added point to buffer. Total points: ${this.pointsBuffer.length}`);
  }

  /**
   * Returns all location points collected since tracking started.
   * Used by MapScreen to rebuild the route polyline after returning from background.
   */
  getSessionPoints(): SimpleLocation[] {
    return [...this.sessionPoints];
  }

  /**
   * Enrich a buffered point with address data after async geocoding completes.
   * Points are added immediately (no address) for background reliability.
   * MapScreen calls this after getAddressFromCoords resolves to attach the address
   * before the 30s upload timer sends the batch to the server.
   */
  updatePointAddress(timestamp: number, address: any): void {
    const timestampStr = new Date(timestamp).toISOString();
    const point = this.pointsBuffer.find(p => p.timestamp === timestampStr);
    if (point && address) {
      point.address = address;
    }
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

  /**
   * iOS: Use watchPosition every 5s to get consistent location updates.
   * CLLocationManager's continuous distanceFilter-based updates are unreliable
   * in the iOS simulator — startUpdatingLocation never fires didUpdateLocations.
   * watchPosition uses its own one-shot CLLocationManager requests at a fixed
   * interval, bypassing the stale lastLocation cache that getCurrentPosition hits.
   * Started unconditionally on iOS so it works on both first and subsequent sessions.
   */
  private startLocationPolling(): void {
    if (this.isPollingActive) {
      return;
    }
    this.isPollingActive = true;
    console.log('[LocationService] iOS: Starting watchPosition (5s interval)...');
    // NOTE: BGGeo watchPosition argument order is (options, success, failure)
    (BackgroundGeolocation as any).watchPosition(
      // timeout: 300000 avoids the 60s default that terminates the watch when the
      // iOS simulator GPS route pauses (no location for >60s fires error + stop).
      // 5-minute timeout keeps watchPosition alive through any simulator GPS gaps.
      // On real devices GPS is continuous so this doesn't affect production behavior.
      {interval: 5000, desiredAccuracy: 0, persist: false, timeout: 300000},
      (location: Location) => {
        if (!this.isTracking) {
          return;
        }
        console.log('[LocationService] iOS watchPosition:', location.coords.latitude, location.coords.longitude);
        const simpleLocation: SimpleLocation = {
          coords: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude ?? null,
            accuracy: location.coords.accuracy,
            altitudeAccuracy: location.coords.altitude_accuracy ?? null,
            heading: location.coords.heading ?? null,
            speed: location.coords.speed ?? null,
          },
          timestamp: new Date(location.timestamp).getTime(),
        };
        // Add to buffer immediately (same reason as onLocation handler above)
        this.addPoint(simpleLocation);

        if (this.locationCallback) {
          this.locationCallback(simpleLocation);
        }
      },
      (error: any) => {
        console.warn('[LocationService] iOS watchPosition error:', error);
      },
    ).then((subscription: {remove: () => void}) => {
      if (!this.isPollingActive) {
        // stopLocationPolling() was called before the promise resolved
        subscription.remove();
        return;
      }
      this.watchPositionSubscription = subscription;
    }).catch((e: any) => {
      this.isPollingActive = false;
      console.warn('[LocationService] iOS watchPosition start failed:', e);
    });
  }

  private stopLocationPolling(): void {
    this.isPollingActive = false;
    if (this.watchPositionSubscription) {
      this.watchPositionSubscription.remove();
      this.watchPositionSubscription = null;
      console.log('[LocationService] iOS: watchPosition stopped');
    }
  }

  /**
   * Listen to location updates
   */
  onLocation(callback: (location: SimpleLocation) => void): () => void {
    this.locationCallback = callback;
    return () => {
      this.locationCallback = null;
    };
  }

  /**
   * Get current location immediately
   */
  async getCurrentLocation(): Promise<SimpleLocation> {
    try {
      const location = await BackgroundGeolocation.getCurrentPosition({
        timeout: 30,
        maximumAge: 5000,
        desiredAccuracy: 0,
        samples: 1,
      });

      return {
        coords: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude: location.coords.altitude ?? null,
          accuracy: location.coords.accuracy,
          altitudeAccuracy: location.coords.altitude_accuracy ?? null,
          heading: location.coords.heading ?? null,
          speed: location.coords.speed ?? null,
        },
        timestamp: new Date(location.timestamp).getTime(),
      };
    } catch (error) {
      console.error('[LocationService] Get current location error:', error);
      throw error;
    }
  }

  /**
   * Get current tracking state
   */
  async getState(): Promise<any> {
    try {
      const state: State = await BackgroundGeolocation.getState();
      return {enabled: state.enabled};
    } catch (error) {
      console.error('[LocationService] Get state error:', error);
      return {enabled: this.isTracking};
    }
  }
}

export default new LocationService();
