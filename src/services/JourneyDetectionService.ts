import LocationService from './LocationService';
import {
  Location,
  MotionChangeEvent,
  GeofenceEvent,
} from 'react-native-background-geolocation';

const DWELL_RADIUS_METERS = 50; // 50 meters
const DWELL_TIME_MS = 5 * 60 * 1000; // 5 minutes

interface Journey {
  origin: Location;
  destination: Location;
  startTime: string;
  endTime: string;
}

class JourneyDetectionService {
  private lastMovingLocation: Location | null = null;
  private currentGeofenceId: string | null = null;
  private onJourneyCreated: ((journey: Journey) => void) | null = null;

  /**
   * Initialize journey detection
   * Sets up listeners for motion changes and geofence events
   */
  initialize(onJourneyCallback: (journey: Journey) => void): () => void {
    this.onJourneyCreated = onJourneyCallback;

    // Approach 1: Using Motion Change Events
    const motionUnsubscribe = LocationService.onMotionChange(
      this.handleMotionChange.bind(this),
    );

    // Approach 2: Using Geofencing (recommended)
    const geofenceUnsubscribe = LocationService.onGeofence(
      this.handleGeofenceEvent.bind(this),
    );

    console.log('[JourneyDetection] Initialized');

    // Return cleanup function
    return () => {
      motionUnsubscribe();
      geofenceUnsubscribe();
      this.cleanup();
    };
  }

  /**
   * Handle motion change events (moving/stationary)
   * This is called automatically by background geolocation
   */
  private async handleMotionChange(event: MotionChangeEvent) {
    console.log(
      '[JourneyDetection] Motion changed:',
      event.isMoving ? 'MOVING' : 'STATIONARY',
    );

    if (!event.isMoving) {
      // Device stopped moving - add geofence for dwell detection
      const geofenceId = `dwell_${Date.now()}`;
      this.currentGeofenceId = geofenceId;

      await LocationService.addGeofence(
        geofenceId,
        event.location.coords.latitude,
        event.location.coords.longitude,
        DWELL_RADIUS_METERS,
      );

      console.log('[JourneyDetection] Added geofence for dwell detection');
    } else {
      // Device started moving
      this.lastMovingLocation = event.location;

      // Remove previous geofence if exists
      if (this.currentGeofenceId) {
        await LocationService.removeGeofence(this.currentGeofenceId);
        this.currentGeofenceId = null;
      }
    }
  }

  /**
   * Handle geofence events (ENTER, EXIT, DWELL)
   * DWELL event triggers after loiteringDelay (5 minutes)
   */
  private async handleGeofenceEvent(event: GeofenceEvent) {
    console.log(
      '[JourneyDetection] Geofence event:',
      event.action,
      event.identifier,
    );

    if (event.action === 'DWELL') {
      // User has been in same location for 5+ minutes - this is a destination
      if (this.lastMovingLocation) {
        const journey: Journey = {
          origin: this.lastMovingLocation,
          destination: event.location,
          startTime: this.lastMovingLocation.timestamp,
          endTime: event.location.timestamp,
        };

        console.log('[JourneyDetection] Journey created:', {
          origin: {
            lat: journey.origin.coords.latitude,
            lng: journey.origin.coords.longitude,
          },
          destination: {
            lat: journey.destination.coords.latitude,
            lng: journey.destination.coords.longitude,
          },
        });

        // Notify callback
        if (this.onJourneyCreated) {
          this.onJourneyCreated(journey);
        }
      }

      // Update last location for next journey
      this.lastMovingLocation = event.location;
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Cleanup geofences and reset state
   */
  async cleanup(): Promise<void> {
    if (this.currentGeofenceId) {
      await LocationService.removeGeofence(this.currentGeofenceId);
      this.currentGeofenceId = null;
    }
    this.lastMovingLocation = null;
    this.onJourneyCreated = null;
  }

  /**
   * Manually reset tracking state
   */
  reset(): void {
    this.lastMovingLocation = null;
    this.currentGeofenceId = null;
  }
}

export default new JourneyDetectionService();
