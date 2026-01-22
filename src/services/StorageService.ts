import { MMKV } from 'react-native-mmkv';
import * as Keychain from 'react-native-keychain';
import { Coordinate, User } from '../types';

// Initialize MMKV storage
const storage = new MMKV();

const KEYS = {
  COORDINATES_BUFFER: 'coordinates_buffer',
  USER_DATA: 'user_data',
  TRACKING_STATE: 'tracking_state',
  JOURNEYS: 'journeys',
};

class StorageService {
  /**
   * Save coordinates to buffer (fast MMKV storage)
   * Note: If using built-in HTTP sync, this may not be needed
   */
  async saveCoordinates(coordinates: Coordinate[]): Promise<void> {
    try {
      const existing = this.getCoordinates();
      const updated = [...existing, ...coordinates];
      storage.set(KEYS.COORDINATES_BUFFER, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving coordinates:', error);
    }
  }

  /**
   * Get buffered coordinates
   */
  getCoordinates(): Coordinate[] {
    try {
      const data = storage.getString(KEYS.COORDINATES_BUFFER);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting coordinates:', error);
      return [];
    }
  }

  /**
   * Clear coordinate buffer
   */
  clearCoordinates(): void {
    try {
      storage.delete(KEYS.COORDINATES_BUFFER);
    } catch (error) {
      console.error('Error clearing coordinates:', error);
    }
  }

  /**
   * Save auth tokens securely using Keychain
   */
  async saveAuthTokens(
    accessToken: string,
    idToken: string,
    refreshToken: string,
  ): Promise<void> {
    try {
      const tokens = JSON.stringify({accessToken, idToken, refreshToken});
      await Keychain.setGenericPassword('auth_tokens', tokens, {
        service: 'com.locationtrackingapp',
      });
    } catch (error) {
      console.error('Error saving auth tokens:', error);
    }
  }

  /**
   * Get auth tokens from secure storage
   */
  async getAuthTokens(): Promise<{
    accessToken: string;
    idToken: string;
    refreshToken: string;
  } | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: 'com.locationtrackingapp',
      });
      if (credentials) {
        return JSON.parse(credentials.password);
      }
      return null;
    } catch (error) {
      console.error('Error getting auth tokens:', error);
      return null;
    }
  }

  /**
   * Clear auth tokens from secure storage
   */
  async clearAuthTokens(): Promise<void> {
    try {
      await Keychain.resetGenericPassword({
        service: 'com.locationtrackingapp',
      });
    } catch (error) {
      console.error('Error clearing auth tokens:', error);
    }
  }

  /**
   * Legacy method - Save single auth token (backward compatibility)
   * @deprecated Use saveAuthTokens instead
   */
  async saveAuthToken(token: string): Promise<void> {
    try {
      await this.saveAuthTokens(token, token, token);
    } catch (error) {
      console.error('Error saving auth token:', error);
    }
  }

  /**
   * Legacy method - Get single auth token (backward compatibility)
   * @deprecated Use getAuthTokens instead
   */
  async getAuthToken(): Promise<string | null> {
    try {
      const tokens = await this.getAuthTokens();
      return tokens?.accessToken || null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Legacy method - Clear auth token (backward compatibility)
   * @deprecated Use clearAuthTokens instead
   */
  async clearAuthToken(): Promise<void> {
    await this.clearAuthTokens();
  }

  /**
   * Save user data
   */
  saveUserData(user: User): void {
    storage.set(KEYS.USER_DATA, JSON.stringify(user));
  }

  /**
   * Get user data
   */
  getUserData(): User | null {
    try {
      const data = storage.getString(KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  /**
   * Clear user data
   */
  clearUserData(): void {
    storage.delete(KEYS.USER_DATA);
  }

  /**
   * Save tracking state
   */
  saveTrackingState(isTracking: boolean): void {
    storage.set(KEYS.TRACKING_STATE, isTracking);
  }

  /**
   * Get tracking state
   */
  getTrackingState(): boolean {
    return storage.getBoolean(KEYS.TRACKING_STATE) || false;
  }

  /**
   * Save journeys
   */
  saveJourneys(journeys: any[]): void {
    try {
      storage.set(KEYS.JOURNEYS, JSON.stringify(journeys));
    } catch (error) {
      console.error('Error saving journeys:', error);
    }
  }

  /**
   * Get journeys
   */
  getJourneys(): any[] {
    try {
      const data = storage.getString(KEYS.JOURNEYS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting journeys:', error);
      return [];
    }
  }

  /**
   * Clear all data
   */
  clearAll(): void {
    storage.clearAll();
  }
}

export default new StorageService();
