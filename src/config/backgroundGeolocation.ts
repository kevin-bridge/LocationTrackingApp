/**
 * Background Geolocation Configuration
 * Platform-specific license keys for react-native-background-geolocation
 */

export const BACKGROUND_GEOLOCATION_LICENSE_IOS = 'eyJhbGciOiJFZERTQSIsImtpZCI6ImVkMjU1MTktbWFpbi12MSJ9.eyJvcyI6ImlvcyIsImFwcF9pZCI6ImNvbS5icmlkZ2V4Lmx0YSIsIm9yZGVyX251bWJlciI6MTU0NjYsInJlbmV3YWxfdXJsIjoiaHR0cHM6Ly9zaG9wLnRyYW5zaXN0b3Jzb2Z0LmNvbS9jYXJ0LzE2NTA3ODYxNTA1OjE_bm90ZT0xMDI4NCIsImN1c3RvbWVyX2lkIjo5MzYwLCJwcm9kdWN0IjoicmVhY3QtbmF0aXZlLWJhY2tncm91bmQtZ2VvbG9jYXRpb24iLCJrZXlfdmVyc2lvbiI6MSwiYWxsb3dlZF9zdWZmaXhlcyI6WyIuZGV2IiwiLmRldmVsb3BtZW50IiwiLnN0YWdpbmciLCIuc3RhZ2UiLCIucWEiLCIudWF0IiwiLnRlc3QiLCIuZGVidWciXSwibWF4X2J1aWxkX3N0YW1wIjoyMDI3MDMxMiwiZ3JhY2VfYnVpbGRzIjowLCJlbnRpdGxlbWVudHMiOlsiY29yZSJdLCJpYXQiOjE3NzA4NjQ5NDJ9.FwkiZcRqY9h3tw_U_eCkhYRE5DsVKHEZUXy434s1zWvv420GQHrmpK4zwmwrX_cMcgMjlbz6dToSzGDIzPwpBQ';

export const BACKGROUND_GEOLOCATION_LICENSE_ANDROID = 'eyJhbGciOiJFZERTQSIsImtpZCI6ImVkMjU1MTktbWFpbi12MSJ9.eyJvcyI6ImFuZHJvaWQiLCJhcHBfaWQiOiJjb20uYnJpZGdleC5sdGEiLCJvcmRlcl9udW1iZXIiOjE1NDY2LCJyZW5ld2FsX3VybCI6Imh0dHBzOi8vc2hvcC50cmFuc2lzdG9yc29mdC5jb20vY2FydC8xNjUwNzg2MTUwNToxP25vdGU9MTAyODQiLCJjdXN0b21lcl9pZCI6OTM2MCwicHJvZHVjdCI6InJlYWN0LW5hdGl2ZS1iYWNrZ3JvdW5kLWdlb2xvY2F0aW9uIiwia2V5X3ZlcnNpb24iOjEsImFsbG93ZWRfc3VmZml4ZXMiOlsiLmRldiIsIi5kZXZlbG9wbWVudCIsIi5zdGFnaW5nIiwiLnN0YWdlIiwiLnFhIiwiLnVhdCIsIi50ZXN0IiwiLmRlYnVnIl0sIm1heF9idWlsZF9zdGFtcCI6MjAyNzAzMTIsImdyYWNlX2J1aWxkcyI6MCwiZW50aXRsZW1lbnRzIjpbImNvcmUiXSwiaWF0IjoxNzcyMDY3Mzk5fQ.cHhCirUN88CBJ8jqO7TzRqDrn6yWSmLdX08bKwVnKZJxoNHerc1mFKdJUOf7EyDTMbzftCS0KSev_jbZG0_fBA';

/**
 * Background Geolocation Configuration Settings
 */
export const BG_GEO_CONFIG = {
  // Geolocation Config
  desiredAccuracy: 0, // Highest accuracy (GPS)
  distanceFilter: 10, // Minimum distance in meters between location updates
  stationaryRadius: 25, // When device is stationary, don't count movement within this radius

  // Activity Recognition
  stopTimeout: 5, // Minutes to wait before entering stationary state

  // Application config
  debug: __DEV__, // Enable debug mode in development
  logLevel: __DEV__ ? 5 : 0, // Verbose logging in dev, none in production
  stopOnTerminate: false, // Continue tracking after app termination
  startOnBoot: false, // Don't auto-start on device reboot

  // iOS Config
  preventSuspend: true, // Prevent iOS from suspending the app
  heartbeatInterval: 60, // Heartbeat every 60 seconds to keep app alive

  // HTTP / SQLite config (for syncing with server)
  autoSync: false, // We'll handle syncing manually
  maxDaysToPersist: 3, // Keep location records for 3 days
};
