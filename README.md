# Location Tracking App - React Native

A professional location tracking application built with React Native that continuously monitors user location, displays real-time position on a map, and maintains journey history with intelligent origin-destination detection.

## ✨ Features

- **True Background Tracking**: Continues tracking even when app is closed or device reboots
- **Real-time Map Display**: Shows current location with smooth camera following
- **Journey Detection**: Automatically detects origins and destinations based on 5-minute dwell time
- **Journey History**: View all past journeys with distance and duration
- **Battery Optimized**: Uses motion detection to pause tracking when stationary
- **Automatic Sync**: Coordinates automatically uploaded to backend server

## 📁 Project Structure

```
mobile/
├── src/
│   ├── config/
│   │   └── api.ts              # API configuration
│   ├── navigation/
│   │   └── AppNavigator.tsx    # Navigation setup
│   ├── screens/
│   │   ├── LoginScreen.tsx     # Login screen
│   │   ├── MapScreen.tsx       # Main map with tracking
│   │   └── HistoryScreen.tsx   # Journey history
│   ├── services/
│   │   ├── LocationService.ts          # Background geolocation
│   │   ├── StorageService.ts           # MMKV storage
│   │   ├── GeocodingService.ts         # OpenStreetMap geocoding
│   │   └── JourneyDetectionService.ts  # Dwell detection
│   ├── store/
│   │   ├── index.ts            # Redux store
│   │   └── slices/
│   │       ├── authSlice.ts
│   │       ├── locationSlice.ts
│   │       └── journeySlice.ts
│   └── types/
│       └── index.ts            # TypeScript types
├── App.tsx
├── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- React Native CLI
- Xcode (for iOS)
- Android Studio (for Android)
- CocoaPods: `sudo gem install cocoapods`

### Installation

1. **Initialize React Native Project**

```bash
# Create new project with TypeScript template
npx @react-native-community/cli@latest init LocationTrackingApp --skip-install

cd LocationTrackingApp
```

2. **Install Dependencies**

```bash
npm install @react-navigation/native@^6.1.9 @react-navigation/stack@^6.3.20
npm install react-native-screens@^3.29.0 react-native-safe-area-context@^4.8.2
npm install react-native-gesture-handler@^2.14.1
npm install react-native-maps@^1.10.0
npm install react-native-mmkv@^2.11.0
npm install react-native-keychain@^8.1.2
npm install axios@^1.6.5
npm install @reduxjs/toolkit@^2.0.1 react-redux@^9.1.0
npm install react-native-background-geolocation@^4.15.0

# iOS only
cd ios && pod install && cd ..
```

3. **Get Background Geolocation License** ⚠️ **REQUIRED**

- Visit: https://shop.transistorsoft.com/
- Purchase "React Native Background Geolocation" (~$250 USD)
- Follow their setup instructions

4. **Copy Source Files**

Copy all files from the `mobile/src` directory to your `LocationTrackingApp/src` directory.

Copy `App.tsx` to your `LocationTrackingApp/` directory.

5. **Configure API URL**

Edit `src/config/api.ts`:

```typescript
export const API_URL = 'http://YOUR_BACKEND_IP:3000';
```

6. **Configure Permissions**

See [SETUP.md](SETUP.md) for detailed permission configuration for iOS and Android.

7. **Run the App**

```bash
# Start Metro bundler
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## 🔑 Configuration

### Android Permissions

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
```

### iOS Permissions

Add to `ios/LocationTrackingApp/Info.plist`:

```xml
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>We need your location to track your journey continuously</string>

<key>UIBackgroundModes</key>
<array>
  <string>location</string>
  <string>fetch</string>
</array>
```

### Google Maps API Key (Android)

1. Get API key from Google Cloud Console
2. Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="YOUR_GOOGLE_MAPS_API_KEY"/>
```

## 📱 Usage

### Login

1. Open the app
2. Enter your email and password
3. Tap "Login"

### Start Tracking

1. After login, you'll see the map screen
2. Grant location permissions when prompted (choose "Always Allow")
3. Tap "Start Tracking" button
4. A persistent notification will appear (Android)

### View History

1. Tap "View History" button on map screen
2. See list of all journeys with:
   - Origin and destination addresses
   - Distance traveled
   - Duration
3. Pull down to refresh

## 🔧 How It Works

### Location Tracking

- Uses `react-native-background-geolocation` for continuous tracking
- Updates every 10-30 seconds while moving
- Automatically pauses when stationary (battery optimization)
- Coordinates automatically uploaded to backend every 1-2 minutes

### Journey Detection

- **Motion Detection**: Detects when device stops moving
- **Geofencing**: Creates 50m radius geofence at stop location
- **Dwell Time**: After 5 minutes in same area, marks as destination
- **Auto Journey**: Automatically creates journey from last movement to dwell location

### Data Flow

```
GPS → Background Geolocation → Location Service
                                      ↓
                              Coordinate Buffering
                                      ↓
                              HTTP Auto-Sync → Backend API
                                      ↓
                              Journey Detection
                                      ↓
                              Save Journey → Backend
```

## 🔋 Battery Optimization

- **Motion Detection**: Stops location updates when stationary
- **Distance Filter**: Only updates after moving 10+ meters
- **Intelligent Timing**: Uses device sensors to minimize GPS usage
- **Configurable**: Adjust `distanceFilter` and `locationUpdateInterval` in LocationService.ts

## 🐛 Troubleshooting

### Location Not Tracking

1. Check permissions in device settings (must be "Always")
2. Verify background geolocation license is configured
3. Check logs: `adb logcat` (Android) or Xcode console (iOS)
4. Ensure API URL is correct in `src/config/api.ts`

### App Crashes on Start

1. Clean and rebuild: `cd android && ./gradlew clean` or Xcode → Clean Build Folder
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. iOS: `cd ios && pod deintegrate && pod install`

### Coordinates Not Uploading

1. Check backend server is running
2. Verify API_URL is correct
3. Check network connectivity
4. Look for HTTP errors in logs

### Battery Draining Fast

1. Increase `distanceFilter` to 50-100m
2. Increase `stopTimeout` to 10 minutes
3. Test on real device (simulators don't reflect real battery usage)

## 📊 Testing Checklist

- [ ] Login with valid credentials
- [ ] Location permissions granted (Always)
- [ ] Start tracking - see green status indicator
- [ ] Map follows current location
- [ ] Force close app - tracking continues (check notification on Android)
- [ ] Reboot device - tracking auto-resumes
- [ ] Stop at location for 5+ minutes - journey created
- [ ] View history - see recorded journey
- [ ] Check backend - coordinates uploaded

## 🚢 Building for Production

### iOS

```bash
cd ios
xcodebuild -workspace LocationTrackingApp.xcworkspace \
           -scheme LocationTrackingApp \
           -configuration Release \
           archive
```

### Android

```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

## 📄 License

This project requires:
- react-native-background-geolocation license (~$250) for production use
- Google Maps API key for Android
- Backend API server

## 🆘 Support

- Background Geolocation: support@transistorsoft.com
- Issues: Create an issue in this repository

## 🔗 Links

- [Background Geolocation Docs](https://transistorsoft.github.io/react-native-background-geolocation/)
- [React Native Docs](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)

---

**Note**: Always test on real devices. Location tracking behavior differs significantly from simulators.
