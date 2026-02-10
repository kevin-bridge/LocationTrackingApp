import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import MapView, {Polyline} from 'react-native-maps';
import StorageService from '../services/StorageService';
import {LocationData} from '../services/ForegroundLocationService';
import LocationService from '../services/LocationService';
import {API_URL} from '../config/api';
import {Colors, Spacing, BorderRadius, Typography, Shadows} from '../theme';

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

interface AddressComponents {
  formatted: string;
  country?: string;
  country_code?: string;
  state?: string;
  city?: string;
  suburb?: string;
  road?: string;
  house_number?: string;
  postcode?: string;
  building?: string;
  neighbourhood?: string;
}

interface RoutePoint {
  latitude: number;
  longitude: number;
  address?: AddressComponents;
  timestamp: string;
  speed?: number;
  heading?: number;
  accuracy?: number;
  altitude?: number;
}

const MapScreen = ({navigation}: any) => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [routePath, setRoutePath] = useState<RoutePoint[]>([]);
  const [startLocation, setStartLocation] = useState<LocationData | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const mapRef = useRef<MapView>(null);
  const locationUnsubscribe = useRef<(() => void) | null>(null);

  useEffect(() => {
    initializeTracking();

    return () => {
      if (locationUnsubscribe.current) {
        locationUnsubscribe.current();
      }
      LocationService.stopTracking();
    };
  }, []);

  const initializeTracking = async () => {
    try {
      const tokens = await StorageService.getAuthTokens();
      if (!tokens?.accessToken) {
        Alert.alert('Error', 'Please login again');
        navigation.replace('Login');
        return;
      }

      console.log('[MapScreen] Initializing LocationService...');
      await LocationService.initialize(API_URL, tokens.accessToken);

      try {
        const location = await LocationService.getCurrentLocation();
        const locationData: LocationData = {
          coords: location.coords,
          timestamp: location.timestamp,
        };
        setCurrentLocation(locationData);

        if (mapRef.current) {
          mapRef.current.animateToRegion(
            {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            },
            1500, // Smooth 1.5 second animation
          );
        }
      } catch (error) {
        console.log('[MapScreen] Could not get initial location:', error);
      }

      setIsInitializing(false);
      console.log('[MapScreen] Map screen ready');
    } catch (error) {
      console.error('[MapScreen] Initialization error:', error);
      setIsInitializing(false);
    }
  };

  const handleLocationUpdate = async (location: LocationData) => {
    console.log('[MapScreen] Location updated');
    setCurrentLocation(location);

    const address = await getAddressFromCoords(
      location.coords.latitude,
      location.coords.longitude,
    );

    LocationService.addPoint(location as any, address);

    const routePoint: RoutePoint = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      address: address,
      timestamp: new Date(location.timestamp).toISOString(),
      speed: location.coords.speed || undefined,
      heading: location.coords.heading || undefined,
      accuracy: location.coords.accuracy,
      altitude: location.coords.altitude || undefined,
    };

    setRoutePath(prev => [...prev, routePoint]);

    if (mapRef.current) {
      mapRef.current.animateCamera(
        {
          center: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
          zoom: 17,
          heading: location.coords.heading || 0,
          pitch: 45,
        },
        {duration: 2000},
      );
    }
  };

  const startTracking = async () => {
    if (isTracking) {
      Alert.alert('Info', 'Already tracking location');
      return;
    }

    try {
      const permissionStatus = await LocationService.requestPermissions();
      if (permissionStatus !== LocationService.AUTHORIZATION_STATUS_ALWAYS &&
          permissionStatus !== LocationService.AUTHORIZATION_STATUS_WHEN_IN_USE) {
        Alert.alert('Error', 'Please enable location permissions in settings');
        return;
      }

      locationUnsubscribe.current = LocationService.onLocation((location: Location) => {
        const locationData: LocationData = {
          coords: location.coords,
          timestamp: location.timestamp,
        };
        handleLocationUpdate(locationData);
      });

      await LocationService.startTracking();

      setIsTracking(true);
      setRoutePath([]);
      setStartLocation(currentLocation);
      setStartTime(Date.now());
      console.log('[MapScreen] Tracking started');
    } catch (error) {
      console.error('[MapScreen] Error starting tracking:', error);
      Alert.alert('Error', 'Failed to start location tracking');
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getAddressFromCoords = async (lat: number, lng: number): Promise<AddressComponents> => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TrackJourneyApp/1.0',
        },
      });

      if (!response.ok) {
        console.warn('[MapScreen] Geocoding API returned error:', response.status);
        return {formatted: 'Unknown Location'};
      }

      const data = await response.json();

      if (data.display_name && data.address) {
        const addressComponents: AddressComponents = {
          formatted: data.display_name,
          country: data.address.country,
          country_code: data.address.country_code,
          state: data.address.state || data.address.province,
          city: data.address.city || data.address.town || data.address.village,
          suburb: data.address.suburb,
          road: data.address.road,
          house_number: data.address.house_number,
          postcode: data.address.postcode,
          building: data.address.building,
          neighbourhood: data.address.neighbourhood,
        };
        return addressComponents;
      }

      return {formatted: data.display_name || 'Unknown Location'};
    } catch (error) {
      console.error('[MapScreen] Geocoding error:', error);
      return {formatted: 'Unknown Location'};
    }
  };

  const stopTracking = async () => {
    if (locationUnsubscribe.current) {
      locationUnsubscribe.current();
      locationUnsubscribe.current = null;
    }

    await LocationService.stopTracking();
    setIsTracking(false);

    if (startLocation && currentLocation && startTime && routePath.length > 0) {
      const endTime = Date.now();
      const distance = calculateDistance(
        startLocation.coords.latitude,
        startLocation.coords.longitude,
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
      );
      const durationHours = (endTime - startTime) / (1000 * 60 * 60);

      const originAddress = routePath[0]?.address || {formatted: 'Unknown Location'};
      const destinationAddress = routePath[routePath.length - 1]?.address || {formatted: 'Unknown Location'};

      console.log('[MapScreen] Tracking stopped');
      console.log('[MapScreen] Route points:', routePath.length);
      console.log('[MapScreen] Origin:', originAddress.formatted);
      console.log('[MapScreen] Destination:', destinationAddress.formatted);

      Alert.alert('Journey Complete', `From: ${originAddress.formatted}\nTo: ${destinationAddress.formatted}\nDistance: ${distance.toFixed(2)} km\nDuration: ${(durationHours * 60).toFixed(0)} min\nPoints recorded: ${routePath.length}`);
    } else {
      Alert.alert('Info', 'Location tracking stopped');
    }

    setStartLocation(null);
    setStartTime(null);
  };

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <View style={styles.loadingContent}>
          <View style={styles.loadingIconContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
          <Text style={styles.loadingTitle}>Getting Ready</Text>
          <Text style={styles.loadingText}>Initializing location services...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
        followsUserLocation={false}>
        {routePath.length > 1 && (
          <Polyline
            coordinates={routePath}
            strokeColor={Colors.routeColor}
            strokeWidth={5}
          />
        )}
      </MapView>

      {/* Tracking Status Badge */}
      {isTracking && (
        <View style={styles.trackingBadge}>
          <View style={styles.trackingDot} />
          <Text style={styles.trackingBadgeText}>Recording Journey</Text>
        </View>
      )}

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        <View style={styles.controlPanelHeader}>
          <Text style={styles.controlPanelTitle}>
            {isTracking ? 'Journey in Progress' : 'Ready to Track'}
          </Text>
          {isTracking && routePath.length > 0 && (
            <Text style={styles.pointsCounter}>{routePath.length} points</Text>
          )}
        </View>

        <View style={styles.buttonContainer}>
          {!isTracking ? (
            <TouchableOpacity
              style={styles.startButton}
              onPress={startTracking}
              activeOpacity={0.8}>
              <View style={styles.buttonContent}>
                <Text style={styles.buttonIcon}>▶</Text>
                <Text style={styles.startButtonText}>Start Tracking</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.stopButton}
              onPress={stopTracking}
              activeOpacity={0.8}>
              <View style={styles.buttonContent}>
                <Text style={styles.buttonIcon}>■</Text>
                <Text style={styles.stopButtonText}>Stop Tracking</Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => navigation.navigate('History')}
            activeOpacity={0.7}>
            <Text style={styles.historyButtonText}>View History</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  loadingTitle: {
    fontSize: Typography.h4,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  loadingText: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
  },
  trackingBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    ...Shadows.md,
  },
  trackingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
    marginRight: Spacing.sm,
  },
  trackingBadgeText: {
    color: Colors.white,
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semibold,
  },
  controlPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
    paddingHorizontal: Spacing.xl,
    ...Shadows.xl,
  },
  controlPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  controlPanelTitle: {
    fontSize: Typography.h4,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  pointsCounter: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  buttonContainer: {
    gap: Spacing.md,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  buttonIcon: {
    fontSize: 14,
    color: Colors.white,
  },
  startButton: {
    height: 56,
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  startButtonText: {
    color: Colors.white,
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
  },
  stopButton: {
    height: 56,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  stopButtonText: {
    color: Colors.white,
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
  },
  historyButton: {
    height: 48,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyButtonText: {
    color: Colors.primary,
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
  },
});

export default MapScreen;
