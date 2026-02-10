import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
  ScrollView,
} from 'react-native';
import MapView, {Polyline, Marker, Callout} from 'react-native-maps';
import ApiService from '../services/ApiService';
import {API_ENDPOINTS} from '../config/api';
import {Trip} from '../types';
import {Colors, Spacing, BorderRadius, Typography, Shadows} from '../theme';

const JourneyDetailScreen = ({navigation, route}: any) => {
  const mapRef = useRef<MapView>(null);
  const trip = route?.params?.trip;
  const [tripDetail, setTripDetail] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (trip?.id) {
      fetchTripDetail();
    }
  }, [trip?.id]);

  useEffect(() => {
    const displayTrip = tripDetail || trip;
    if (mapRef.current && displayTrip) {
      // Collect all coordinates: route points + start/end points
      const coordinates: {latitude: number; longitude: number}[] = [];

      // Add start point
      if (displayTrip.start_point) {
        coordinates.push({
          latitude: displayTrip.start_point.latitude,
          longitude: displayTrip.start_point.longitude,
        });
      }

      // Add route points
      if (displayTrip.points && displayTrip.points.length > 0) {
        displayTrip.points.forEach((point: any) => {
          coordinates.push({
            latitude: point.latitude,
            longitude: point.longitude,
          });
        });
      }

      // Add end point
      if (displayTrip.end_point) {
        coordinates.push({
          latitude: displayTrip.end_point.latitude,
          longitude: displayTrip.end_point.longitude,
        });
      }

      if (coordinates.length > 0) {
        // Calculate bounds for smooth animation
        const lats = coordinates.map(c => c.latitude);
        const lngs = coordinates.map(c => c.longitude);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);

        const midLat = (minLat + maxLat) / 2;
        const midLng = (minLng + maxLng) / 2;
        const deltaLat = (maxLat - minLat) * 1.4; // Add padding
        const deltaLng = (maxLng - minLng) * 1.4;

        setTimeout(() => {
          mapRef.current?.animateToRegion(
            {
              latitude: midLat - deltaLat * 0.25, // Offset up to account for bottom panel
              longitude: midLng,
              latitudeDelta: Math.max(deltaLat, 0.01),
              longitudeDelta: Math.max(deltaLng, 0.01),
            },
            1500, // Smooth 1.5 second animation
          );
        }, 300);
      }
    }
  }, [tripDetail, trip]);

  const fetchTripDetail = async () => {
    setIsLoading(true);
    try {
      const api = ApiService.getInstance();
      const response = await api.get(API_ENDPOINTS.TRIPS.DETAIL(trip.id));
      const tripData = response.data;
      console.log('[JourneyDetailScreen] Loaded trip detail with', tripData.points?.length || 0, 'points');
      setTripDetail(tripData);
    } catch (error) {
      console.error('[JourneyDetailScreen] Error fetching trip detail:', error);
      console.error('[JourneyDetailScreen] Error details:', ApiService.getErrorMessage(error));
      setTripDetail(trip);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (startTime: string, endTime: string): string => {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const durationMs = end - start;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.round((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} min`;
  };

  const calculateDistance = (points?: any[]): number => {
    if (!points || points.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const lat1 = points[i].latitude;
      const lon1 = points[i].longitude;
      const lat2 = points[i + 1].latitude;
      const lon2 = points[i + 1].longitude;

      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalDistance += R * c;
    }

    return totalDistance;
  };

  if (!trip) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <View style={styles.errorContent}>
          <View style={styles.errorIconContainer}>
            <Text style={styles.errorIcon}>❌</Text>
          </View>
          <Text style={styles.errorTitle}>No Trip Data</Text>
          <Text style={styles.errorText}>Unable to load journey details</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <View style={styles.loadingContent}>
          <View style={styles.loadingIconContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
          <Text style={styles.loadingTitle}>Loading Journey</Text>
          <Text style={styles.loadingText}>Fetching trip details...</Text>
        </View>
      </View>
    );
  }

  const displayTrip = tripDetail || trip;
  const distance = calculateDistance(displayTrip.points);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: displayTrip.start_point.latitude,
          longitude: displayTrip.start_point.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}>
        {displayTrip.points && displayTrip.points.length > 0 && (
          <Polyline
            coordinates={displayTrip.points.map((point: any) => ({
              latitude: point.latitude,
              longitude: point.longitude,
            }))}
            strokeColor={Colors.routeColor}
            strokeWidth={5}
          />
        )}

        <Marker
          coordinate={{
            latitude: displayTrip.start_point.latitude,
            longitude: displayTrip.start_point.longitude,
          }}
          pinColor={Colors.startMarker}
          title="Start Location">
          <Callout>
            <View style={styles.calloutContainer}>
              <Text style={styles.calloutTitle}>Start Location</Text>
              <Text style={styles.calloutText}>
                {displayTrip.start_point.address?.formatted || 'Unknown Location'}
              </Text>
              <Text style={styles.calloutTime}>
                {formatTime(displayTrip.start_time)}
              </Text>
            </View>
          </Callout>
        </Marker>

        <Marker
          coordinate={{
            latitude: displayTrip.end_point.latitude,
            longitude: displayTrip.end_point.longitude,
          }}
          pinColor={Colors.endMarker}
          title="End Location">
          <Callout>
            <View style={styles.calloutContainer}>
              <Text style={styles.calloutTitle}>End Location</Text>
              <Text style={styles.calloutText}>
                {displayTrip.end_point.address?.formatted || 'Unknown Location'}
              </Text>
              <Text style={styles.calloutTime}>
                {formatTime(displayTrip.end_time)}
              </Text>
            </View>
          </Callout>
        </Marker>
      </MapView>

      {/* Info Panel */}
      <View style={styles.infoPanel}>
        {/* Date Header */}
        <View style={styles.dateHeader}>
          <Text style={styles.dateText}>{formatDate(displayTrip.start_time)}</Text>
        </View>

        {/* Route Summary */}
        <View style={styles.routeSummary}>
          <View style={styles.locationItem}>
            <View style={styles.locationDotContainer}>
              <View style={styles.startDot} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>From</Text>
              <Text style={styles.locationAddress} numberOfLines={2}>
                {displayTrip.start_point.address?.formatted || 'Unknown Location'}
              </Text>
              <Text style={styles.locationTime}>{formatTime(displayTrip.start_time)}</Text>
            </View>
          </View>

          <View style={styles.routeArrow}>
            <Text style={styles.routeArrowText}>↓</Text>
          </View>

          <View style={styles.locationItem}>
            <View style={styles.locationDotContainer}>
              <View style={styles.endDot} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>To</Text>
              <Text style={styles.locationAddress} numberOfLines={2}>
                {displayTrip.end_point.address?.formatted || 'Unknown Location'}
              </Text>
              <Text style={styles.locationTime}>{formatTime(displayTrip.end_time)}</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📏</Text>
            <Text style={styles.statValue}>{distance.toFixed(2)} km</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⏱️</Text>
            <Text style={styles.statValue}>
              {formatDuration(displayTrip.start_time, displayTrip.end_time)}
            </Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📍</Text>
            <Text style={styles.statValue}>{displayTrip.points?.length || 0}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
        </View>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}>
          <Text style={styles.backButtonText}>Back to History</Text>
        </TouchableOpacity>
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
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContent: {
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.errorSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  errorIcon: {
    fontSize: 36,
  },
  errorTitle: {
    fontSize: Typography.h4,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  errorButton: {
    height: 48,
    paddingHorizontal: Spacing.xxl,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorButtonText: {
    color: Colors.white,
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
  },
  calloutContainer: {
    width: 200,
    padding: Spacing.sm,
  },
  calloutTitle: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  calloutText: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  calloutTime: {
    fontSize: Typography.caption,
    color: Colors.primary,
    fontWeight: Typography.medium,
  },
  infoPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
    paddingHorizontal: Spacing.xl,
    ...Shadows.xl,
  },
  dateHeader: {
    marginBottom: Spacing.lg,
  },
  dateText: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  routeSummary: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationDotContainer: {
    width: 24,
    alignItems: 'center',
    paddingTop: 4,
  },
  startDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
  },
  endDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.error,
  },
  locationInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  locationLabel: {
    fontSize: Typography.caption,
    color: Colors.textTertiary,
    fontWeight: Typography.medium,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: Typography.bodySmall,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  locationTime: {
    fontSize: Typography.caption,
    color: Colors.primary,
    fontWeight: Typography.medium,
    marginTop: 2,
  },
  routeArrow: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    marginLeft: 6,
  },
  routeArrowText: {
    fontSize: 16,
    color: Colors.textTertiary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 20,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  backButton: {
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  backButtonText: {
    color: Colors.white,
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
  },
});

export default JourneyDetailScreen;
