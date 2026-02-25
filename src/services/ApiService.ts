import axios, {AxiosInstance, AxiosError} from 'axios';
import {API_URL} from '../config/api';
import StorageService from './StorageService';
import {store} from '../store';
import {clearUser} from '../store/slices/authSlice';
import Toast from 'react-native-toast-message';

class ApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      async config => {
        // Only add token from storage if Authorization header is not already set
        if (!config.headers.Authorization) {
          const tokens = await StorageService.getAuthTokens();
          if (tokens?.idToken) {
            // Use ID token by default (required for most API endpoints)
            config.headers.Authorization = `Bearer ${tokens.idToken}`;
          }
        }
        console.log('API Request:', config.method?.toUpperCase(), config.url);
        return config;
      },
      error => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      },
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      response => {
        console.log('API Response:', response.config.url, response.status);
        return response;
      },
      async error => {
        console.error('API Error:', error.config?.url, error.message);

        if (error.response) {
          // Server responded with error status
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);

          // Handle token expiry - clear session and redirect to login
          if (error.response.status === 401) {
            console.log('[ApiService] Token expired or unauthorized. Clearing session...');
            await StorageService.clearAuthTokens();
            store.dispatch(clearUser());
            Toast.show({
              type: 'error',
              text1: 'Session Expired',
              text2: 'Please login again to continue.',
              visibilityTime: 4000,
            });
          }
        } else if (error.request) {
          // Request was made but no response received
          console.error('No response received:', error.request);
        } else {
          // Error in setting up the request
          console.error('Request setup error:', error.message);
        }

        return Promise.reject(error);
      },
    );
  }

  getInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  getErrorMessage(error: any): string {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;

      if (axiosError.response) {
        // Server responded with error - check for 'detail' field first (common in FastAPI)
        return (
          axiosError.response.data?.detail ||
          axiosError.response.data?.message ||
          axiosError.response.data?.error ||
          `Server error: ${axiosError.response.status}`
        );
      } else if (axiosError.request) {
        // Request made but no response
        return 'Network error: Unable to connect to server. Please check your internet connection.';
      } else {
        // Error in request setup
        return `Request error: ${axiosError.message}`;
      }
    }

    return error?.message || 'An unexpected error occurred';
  }
}

export default new ApiService();
