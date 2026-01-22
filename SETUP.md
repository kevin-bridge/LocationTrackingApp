# React Native Location Tracking App - Setup Guide

## Prerequisites

- Node.js 18+ installed
- React Native CLI installed: `npm install -g react-native-cli`
- Xcode (for iOS development)
- Android Studio (for Android development)
- CocoaPods installed: `sudo gem install cocoapods`

## Step 1: Initialize React Native Project

```bash
# Navigate to the journey-log-v2 directory
cd d:\Work\Bridgex\journey-log-v2

# Create React Native project (TypeScript is default now)
npx @react-native-community/cli@latest init LocationTrackingApp --skip-install

# Navigate into the project
cd LocationTrackingApp
```

## Step 2: Install Dependencies

```bash
# Core dependencies
npm install @react-navigation/native@^6.1.9 @react-navigation/stack@^6.3.20
npm install react-native-screens@^3.29.0 react-native-safe-area-context@^4.8.2
npm install react-native-gesture-handler@^2.14.1
npm install react-native-maps@^1.10.0

# Storage
npm install react-native-mmkv@^2.11.0
npm install react-native-keychain@^8.1.2

# HTTP & State
npm install axios@^1.6.5
npm install @reduxjs/toolkit@^2.0.1 react-redux@^9.1.0

# Background location (IMPORTANT: Requires license)
npm install react-native-background-geolocation@^4.15.0

# Install iOS dependencies
cd ios && pod install && cd ..
```

## Step 3: Get Background Geolocation License

**CRITICAL**: The app won't work in production without this license!

1. Visit: https://shop.transistorsoft.com/
2. Purchase "React Native Background Geolocation" (~$250 USD)
3. You'll receive a license key via email
4. Follow their instructions to add the license to your app

## Step 4: Configure Permissions

### Android Configuration

**android/app/src/main/AndroidManifest.xml:**

Add these permissions before `<application>`:

```xml
<!-- Location permissions -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />

<!-- Foreground service -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />

<!-- Boot permission -->
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
```

Add inside `<application>`:

```xml
<!-- Google Maps API Key (get from Google Cloud Console) -->
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="YOUR_GOOGLE_MAPS_API_KEY"/>

<!-- Background Geolocation Services -->
<service android:name="com.transistorsoft.locationmanager.service.TrackingService"
         android:foregroundServiceType="location"
         android:enabled="true" />

<service android:name="com.transistorsoft.locationmanager.service.ActivityRecognitionService"
         android:enabled="true" />
```

### iOS Configuration

**ios/LocationTrackingApp/Info.plist:**

Add these keys:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to track your journey in real-time</string>

<key>NSLocationAlwaysUsageDescription</key>
<string>We need continuous access to your location to track your journey even when the app is in the background</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>We need your location to track your journey continuously, even when the app is in background</string>

<key>NSMotionUsageDescription</key>
<string>Motion activity helps us determine when you're moving to save battery</string>

<key>UIBackgroundModes</key>
<array>
  <string>location</string>
  <string>fetch</string>
</array>
```

**In Xcode:**

1. Open `ios/LocationTrackingApp.xcworkspace` in Xcode
2. Select project → Target → Signing & Capabilities
3. Click "+ Capability" → Background Modes
4. Enable: ✓ Location updates, ✓ Background fetch

## Step 5: Copy Source Files

Copy all the files from the `mobile/src` directory into your `LocationTrackingApp/src` directory.

## Step 6: Configure API URL

Edit `src/config/api.ts` and update with your backend server URL:

```typescript
export const API_URL = 'http://YOUR_SERVER_IP:3000';
```

## Step 7: Run the App

```bash
# Start Metro bundler
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Troubleshooting

### iOS Issues

1. If pods fail to install: `cd ios && pod deintegrate && pod install`
2. Clean build: Product → Clean Build Folder in Xcode
3. Check that Background Modes are enabled in Xcode

### Android Issues

1. If Gradle sync fails: Open `android/` in Android Studio and sync
2. Check that all permissions are in AndroidManifest.xml
3. Make sure Google Maps API key is added

### Background Geolocation Issues

1. Check license is properly configured
2. Review logs: `adb logcat` (Android) or Xcode console (iOS)
3. Ensure all permissions are granted in device settings
4. Test on real device, not simulator

## Next Steps

1. Get your backend API URL ready
2. Test login functionality
3. Grant location permissions when prompted
4. Start tracking and test background functionality
5. Force close app and verify tracking continues

## Important Notes

- **Always test on real devices** - location simulation doesn't work well
- **Battery usage** - Monitor battery drain during initial testing
- **Permissions** - Both iOS and Android require "Always" location permission
- **License** - App won't work in production without background geolocation license
