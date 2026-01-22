# Network Error Troubleshooting Guide

## Problem
Getting "Network Error" when trying to connect to the API at `https://d23iu3orp3z9g3.cloudfront.net`

## Verified
✅ API server is online and responding (tested with 405 Method Not Allowed)
✅ INTERNET permission is in AndroidManifest.xml
✅ Network security config is properly set up
✅ usesCleartextTraffic is enabled

## Common Causes & Solutions

### 1. Android Emulator Internet Connectivity

**Problem:** Android emulator doesn't have internet access

**Solutions:**
```bash
# Check if emulator has internet by opening Chrome in the emulator
# Try browsing to: https://www.google.com

# If no internet, restart emulator with:
adb -e emu kill
# Then start emulator fresh from Android Studio or:
emulator -avd YOUR_AVD_NAME -dns-server 8.8.8.8
```

**Or try these ADB commands:**
```bash
# Reset network settings
adb shell svc wifi enable
adb shell svc data enable

# Check DNS resolution
adb shell ping -c 4 8.8.8.8
adb shell ping -c 4 google.com
```

### 2. Proxy/VPN Issues

**Problem:** Corporate proxy or VPN blocking the connection

**Solutions:**
- Temporarily disable VPN
- Configure Android emulator to use system proxy
- In Android emulator settings: Settings → Network & internet → Wi-Fi → Modify network → Advanced → Proxy

### 3. Firewall Blocking

**Problem:** Windows Firewall or antivirus blocking React Native packager

**Solutions:**
- Check Windows Firewall settings
- Temporarily disable antivirus to test
- Add exception for Metro bundler (port 8081)

### 4. Rebuild Required

**Problem:** Network security config changes not applied

**Solution:**
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### 5. Metro Bundler Cache

**Problem:** Stale JavaScript bundle

**Solution:**
```bash
# Clear Metro cache
npm start -- --reset-cache

# Or
npx react-native start --reset-cache
```

### 6. Use Physical Device Instead

If emulator continues to have issues, test on a real device:

```bash
# Connect device via USB
# Enable USB debugging on device
# Run:
npm run android
```

### 7. Test with Simple HTTP (Debug Only)

If HTTPS is the issue, you can temporarily test with HTTP:

1. Modify `src/config/api.ts`:
   ```typescript
   export const API_URL = 'http://YOUR_LOCAL_BACKEND_IP:PORT';
   ```

2. Ensure the backend allows HTTP (for testing only)

### 8. Check React Native Debugger/Flipper

**Problem:** Debug tools interfering with network requests

**Solution:**
- Disable Remote JS Debugging
- Close Flipper if running
- Test again

### 9. DNS Resolution

**Problem:** Can't resolve d23iu3orp3z9g3.cloudfront.net

**Test:**
```bash
# From computer
ping d23iu3orp3z9g3.cloudfront.net

# From emulator
adb shell ping d23iu3orp3z9g3.cloudfront.net
```

### 10. Check Logs

```bash
# View detailed Android logs
adb logcat | grep -i "network\|axios\|http"

# View React Native logs
npm start
# Then check the terminal output
```

## Testing Steps

1. **Click "Test API Connection" button** in the app
2. **Check Metro bundler logs** - look for detailed error info
3. **Check Android logcat** - may show SSL/network errors
4. **Test in Chrome** - Open Chrome in emulator, try visiting the CloudFront URL
5. **Test on physical device** - Rule out emulator-specific issues

## Quick Test Command

Run this in your terminal to test connectivity from your development machine:

```bash
curl -v https://d23iu3orp3z9g3.cloudfront.net/api/auth/signin
```

Expected: 405 Method Not Allowed (proves server is accessible)

## Still Not Working?

If all else fails:
1. Ensure your development machine can access the URL
2. Try running on a physical device with mobile data (bypass WiFi issues)
3. Check if there are any corporate network restrictions
4. Consider using a different API endpoint for testing (like https://httpbin.org/get)
