import axios from 'axios';
import {API_URL} from '../config/api';

export const testApiConnection = async (): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  try {
    console.log('Testing API connection to:', API_URL);
    console.log('Full URL:', `${API_URL}/api/auth/signin`);

    // Create a simple axios instance without interceptors
    const testAxios = axios.create({
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // First, test basic connectivity with OPTIONS request
    console.log('Attempting OPTIONS request...');
    try {
      const optionsResponse = await testAxios.options(
        `${API_URL}/api/auth/signin`,
        {validateStatus: () => true},
      );
      console.log('OPTIONS response:', optionsResponse.status);
    } catch (optErr) {
      console.log('OPTIONS failed (this is often normal):', optErr.message);
    }

    // Now try GET request (should return 405 but proves connectivity)
    console.log('Attempting GET request...');
    const response = await testAxios.get(`${API_URL}/api/auth/signin`, {
      validateStatus: () => true, // Accept any status code
    });

    console.log('API Test Response Status:', response.status);
    console.log('API Test Response Headers:', JSON.stringify(response.headers));

    if (response.status === 405) {
      // Method not allowed - server is responding correctly!
      return {
        success: true,
        message: '✓ API is reachable!\nServer responded with 405 (expected for GET on signin endpoint)',
        details: {status: response.status},
      };
    }

    if (response.status === 404) {
      return {
        success: false,
        message: 'API endpoint not found (404). Check the URL configuration.',
        details: {status: response.status},
      };
    }

    if (response.status >= 200 && response.status < 500) {
      return {
        success: true,
        message: `✓ API is reachable! Status: ${response.status}`,
        details: response.data,
      };
    }

    return {
      success: false,
      message: `API returned status ${response.status}`,
      details: response.data,
    };
  } catch (error: any) {
    console.error('API Test Error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      config: error.config
        ? {
            url: error.config.url,
            method: error.config.method,
            headers: error.config.headers,
          }
        : 'No config',
    });

    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        message: '⚠ Connection timeout\n\nThe request took too long. Possible causes:\n• Slow internet connection\n• Server is slow to respond',
        details: error.message,
      };
    }

    if (error.message === 'Network Error') {
      return {
        success: false,
        message:
          '⚠ Network Error\n\nCannot connect to the API. Troubleshooting:\n\n1. Check if you have internet access\n2. Try opening a browser and visiting:\n   https://d23iu3orp3z9g3.cloudfront.net\n\n3. If using Android Emulator:\n   • Make sure emulator has internet\n   • Try restarting the emulator\n   • Check proxy settings\n\n4. If using physical device:\n   • Ensure device is connected to internet\n   • Try switching between WiFi/Mobile data',
        details: {
          errorCode: error.code,
          errorMessage: error.message,
        },
      };
    }

    return {
      success: false,
      message: `⚠ Connection failed\n\n${error.message}`,
      details: error,
    };
  }
};
