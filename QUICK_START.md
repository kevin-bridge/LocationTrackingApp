# Quick Start Guide

Since your backend is already set up, here's the fastest way to get the mobile app running:

## Step-by-Step Setup

### 1. Create React Native Project

```bash
cd d:\Work\Bridgex\journey-log-v2
npx @react-native-community/cli@latest init LocationTrackingApp --skip-install
cd LocationTrackingApp
```

### 2. Copy All Source Files

```powershell
# Copy source files
xcopy /E /I ..\mobile\src .\src
copy ..\mobile\App.tsx .\App.tsx

# Or manually:
# Copy the entire 'mobile/src' folder into 'LocationTrackingApp/src'
# Copy 'mobile/App.tsx' to 'LocationTrackingApp/App.tsx'
```

### 3. Install Dependencies

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
```

### 4. Configure API URL

Edit `src/config/api.ts`:

```typescript
// Change this to your backend server IP
export const API_URL = 'http://192.168.1.100:3000'; // Use your actual IP
```

**Important**:
- Don't use `localhost` or `127.0.0.1` from mobile device
- Use your computer's local IP address (find with `ipconfig` on Windows)
- Make sure backend server is running

### 5. Android Setup

**5.1. Get Google Maps API Key**

1. Go to Google Cloud Console: https://console.cloud.google.com
2. Enable "Maps SDK for Android"
3. Create API Key
4. Restrict to Android apps

**5.2. Configure AndroidManifest.xml**

Edit `android/app/src/main/AndroidManifest.xml`:

Add before `<application>`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
```

Inside `<application>`, add:

```xml
<!-- Google Maps API Key -->
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

### 6. iOS Setup

**6.1. Install Pods**

```bash
cd ios
pod install
cd ..
```

**6.2. Configure Info.plist**

Edit `ios/LocationTrackingApp/Info.plist`, add:

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

**6.3. Xcode Configuration**

1. Open `ios/LocationTrackingApp.xcworkspace` in Xcode
2. Select project → Target → Signing & Capabilities
3. Click "+ Capability" → Background Modes
4. Enable: ✓ Location updates, ✓ Background fetch

### 7. Get Background Geolocation License

⚠️ **REQUIRED FOR PRODUCTION**

1. Visit: https://shop.transistorsoft.com/
2. Purchase "React Native Background Geolocation" (~$250 USD)
3. Follow their setup instructions to add license

**For Development/Testing**: The library will work for a limited time without license, but shows warnings.

### 8. Run the App

Make sure your backend is running, then:

```bash
# Start Metro bundler
npm start

# In another terminal:
# For Android
npm run android

# For iOS
npm run ios
```

## First Run Checklist

- [ ] Backend server is running (test with browser: http://YOUR_IP:3000/health)
- [ ] API_URL is configured with correct IP in `src/config/api.ts`
- [ ] Google Maps API key is added (Android)
- [ ] All permissions are in AndroidManifest.xml / Info.plist
- [ ] Device is on same WiFi network as backend server

## Testing

1. **Login**: Use credentials from your backend
2. **Grant Permissions**: Choose "Always Allow" for location
3. **Start Tracking**: Tap the green button
4. **Check Logs**:
   - Android: `npx react-native log-android`
   - iOS: `npx react-native log-ios`
5. **Test Background**: Close app, tracking should continue
6. **Check Backend**: Coordinates should appear in database

## Common Issues

### "Network request failed"
- Check API_URL has correct IP (not localhost)
- Verify backend is running
- Device and computer on same WiFi

### "Location permission denied"
- Go to device Settings → Apps → LocationTrackingApp → Permissions
- Enable Location → Always

### "Background tracking not working"
- Android: Check notification is showing
- iOS: Verify Background Modes are enabled in Xcode

### "App crashes on Android"
- Check Google Maps API key is added
- Run: `cd android && ./gradlew clean && cd ..`

## Need Help?

1. Check logs: `npx react-native log-android` or `npx react-native log-ios`
2. Review full documentation: [README.md](README.md)
3. Setup details: [SETUP.md](SETUP.md)

---

**Ready to start?** Run the commands above and you'll have the app running in ~15 minutes! 🚀
