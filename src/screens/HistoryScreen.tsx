import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Platform,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import ApiService from '../services/ApiService';
import {API_ENDPOINTS} from '../config/api';
import {Trip} from '../types';
import {Colors, Spacing, BorderRadius, Typography, Shadows} from '../theme';

const HistoryScreen = ({navigation}: any) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchTrips();
    }, []),
  );

  const fetchTrips = async () => {
    setIsLoading(true);
    try {
      const endTime = new Date();
      const startTime = new Date();
      startTime.setDate(startTime.getDate() - 30);

      const api = ApiService.getInstance();
      const response = await api.get(API_ENDPOINTS.TRIPS.LIST, {
        params: {
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
        },
      });

      const tripsData = response.data;
      console.log('[HistoryScreen] Loaded trips:', tripsData.length);

      const sortedTrips = tripsData.sort((a: Trip, b: Trip) =>
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
      );

      setTrips(sortedTrips);
    } catch (error) {
      console.error('[HistoryScreen] Error fetching trips:', error);
      console.error('[HistoryScreen] Error details:', ApiService.getErrorMessage(error));
      setTrips([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTrips();
    setRefreshing(false);
  };

  const formatDuration = (startTime: string, endTime: string): string => {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const durationMs = end - start;
    const hours = durationMs / (1000 * 60 * 60);

    if (hours < 1) {
      return `${Math.round(hours * 60)} min`;
    }
    return `${hours.toFixed(1)} hrs`;
  };

  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleTripPress = (trip: Trip) => {
    navigation.navigate('JourneyDetail', {trip: trip});
  };

  const renderTrip = ({item, index}: {item: Trip; index: number}) => (
    <TouchableOpacity
      style={styles.tripCard}
      onPress={() => handleTripPress(item)}
      activeOpacity={0.7}>
      {/* Date Badge */}
      <View style={styles.dateBadge}>
        <Text style={styles.dateBadgeText}>{formatDate(item.start_time)}</Text>
      </View>

      {/* Route Visualization */}
      <View style={styles.routeContainer}>
        {/* Origin */}
        <View style={styles.locationRow}>
          <View style={styles.timelineContainer}>
            <View style={styles.originDot} />
            <View style={styles.timelineLine} />
          </View>
          <View style={styles.locationContent}>
            <Text style={styles.locationTime}>{formatTime(item.start_time)}</Text>
            <Text style={styles.locationAddress} numberOfLines={2}>
              {item.start_point.address?.formatted || 'Unknown Location'}
            </Text>
          </View>
        </View>

        {/* Destination */}
        <View style={styles.locationRow}>
          <View style={styles.timelineContainer}>
            <View style={styles.destinationDot} />
          </View>
          <View style={styles.locationContent}>
            <Text style={styles.locationTime}>{formatTime(item.end_time)}</Text>
            <Text style={styles.locationAddress} numberOfLines={2}>
              {item.end_point.address?.formatted || 'Unknown Location'}
            </Text>
          </View>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>🕐</Text>
          <Text style={styles.statValue}>
            {formatDuration(item.start_time, item.end_time)}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>📍</Text>
          <Text style={styles.statValue}>
            {item.point_count ?? 0} points
          </Text>
        </View>
        <View style={styles.viewDetailsContainer}>
          <Text style={styles.viewDetailsText}>View Details →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Text style={styles.emptyIcon}>🗺️</Text>
      </View>
      <Text style={styles.emptyTitle}>No Journeys Yet</Text>
      <Text style={styles.emptyText}>
        Start tracking to record your trips.{'\n'}Your journey history will appear here.
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}>
        <Text style={styles.emptyButtonText}>Start Tracking</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerTop}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Journey History</Text>
          <Text style={styles.headerSubtitle}>Last 30 days</Text>
        </View>
      </View>
    </View>
  );

  if (isLoading && trips.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <View style={styles.loadingContent}>
          <View style={styles.loadingIconContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
          <Text style={styles.loadingTitle}>Loading Journeys</Text>
          <Text style={styles.loadingText}>Fetching your trip history...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <FlatList
        data={trips}
        renderItem={renderTrip}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  headerContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    marginTop: 2,
    ...Shadows.sm,
  },
  backButtonText: {
    fontSize: 20,
    color: Colors.textPrimary,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.h2,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
  },
  listContent: {
    paddingBottom: Spacing.xxl,
  },
  tripCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.md,
  },
  dateBadge: {
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    alignSelf: 'flex-start',
    borderBottomRightRadius: BorderRadius.sm,
  },
  dateBadgeText: {
    fontSize: Typography.caption,
    fontWeight: Typography.semibold,
    color: Colors.primary,
  },
  routeContainer: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  locationRow: {
    flexDirection: 'row',
  },
  timelineContainer: {
    width: 24,
    alignItems: 'center',
  },
  originDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
  },
  timelineLine: {
    width: 2,
    height: 40,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  destinationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.error,
  },
  locationContent: {
    flex: 1,
    marginLeft: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  locationTime: {
    fontSize: Typography.caption,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: Typography.bodySmall,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statIcon: {
    fontSize: 14,
  },
  statValue: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.medium,
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  viewDetailsContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  viewDetailsText: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semibold,
    color: Colors.primary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    marginTop: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xxl,
  },
  emptyButton: {
    height: 48,
    paddingHorizontal: Spacing.xxl,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  emptyButtonText: {
    color: Colors.white,
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
  },
});

export default HistoryScreen;
