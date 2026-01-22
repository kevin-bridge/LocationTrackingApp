import {API_URL} from '../config/api';

/**
 * Alternative API service using native fetch instead of axios
 * This bypasses axios-specific network issues
 */
class FetchApiService {
  private baseURL: string;
  private defaultTimeout: number;

  constructor() {
    this.baseURL = API_URL;
    this.defaultTimeout = 30000;
  }

  /**
   * Create fetch request with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeout: number = this.defaultTimeout,
  ): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get(endpoint: string, headers: Record<string, string> = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;

    console.log('Fetch GET:', url);

    const response = await this.fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...headers,
      },
    });

    console.log('Fetch Response:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fetch Error Response:', errorText);

      // Try to parse error as JSON
      try {
        const errorData = JSON.parse(errorText);
        // Check for 'detail' field first (common in FastAPI), then other common error fields
        throw new Error(
          errorData.detail ||
          errorData.message ||
          errorData.error ||
          `HTTP ${response.status}`
        );
      } catch (parseError: any) {
        // If JSON parsing fails, check if it's already an Error we threw
        if (parseError.message && parseError.message !== 'Unexpected end of JSON input') {
          throw parseError;
        }
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }
    }

    return response.json();
  }

  /**
   * POST request
   */
  async post(
    endpoint: string,
    data: any,
    headers: Record<string, string> = {},
  ) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;

    console.log('Fetch POST:', url);
    console.log('Fetch POST Data:', JSON.stringify(data));

    const response = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...headers,
      },
      body: JSON.stringify(data),
    });

    console.log('Fetch Response:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fetch Error Response:', errorText);

      // Try to parse error as JSON
      try {
        const errorData = JSON.parse(errorText);
        // Check for 'detail' field first (common in FastAPI), then other common error fields
        throw new Error(
          errorData.detail ||
          errorData.message ||
          errorData.error ||
          `HTTP ${response.status}`
        );
      } catch (parseError: any) {
        // If JSON parsing fails, check if it's already an Error we threw
        if (parseError.message && parseError.message !== 'Unexpected end of JSON input') {
          throw parseError;
        }
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }
    }

    const responseText = await response.text();
    return responseText ? JSON.parse(responseText) : {};
  }

  /**
   * Test basic connectivity
   */
  async testConnection(): Promise<{success: boolean; message: string; details?: any}> {
    try {
      console.log('Testing connection with fetch to:', this.baseURL);

      // Try a simple GET request
      const response = await this.fetchWithTimeout(
        `${this.baseURL}/api/auth/signin`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
        10000,
      );

      console.log('Test response status:', response.status);

      if (response.status === 405) {
        return {
          success: true,
          message: '✓ API is reachable using fetch!\n(405 Method Not Allowed is expected)',
          details: {status: response.status},
        };
      }

      if (response.status >= 200 && response.status < 500) {
        return {
          success: true,
          message: `✓ API is reachable! Status: ${response.status}`,
          details: {status: response.status},
        };
      }

      return {
        success: false,
        message: `Server returned status ${response.status}`,
        details: {status: response.status},
      };
    } catch (error: any) {
      console.error('Fetch test error:', error);

      if (error.name === 'AbortError') {
        return {
          success: false,
          message: '⚠ Connection timeout\n\nThe request took too long.',
          details: error.message,
        };
      }

      return {
        success: false,
        message: `⚠ Connection failed\n\n${error.message}`,
        details: error,
      };
    }
  }

  /**
   * Get error message from error object
   */
  getErrorMessage(error: any): string {
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }
}

export default new FetchApiService();
