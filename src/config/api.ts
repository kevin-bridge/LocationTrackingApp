// Configure your backend API URL here
// For development: Use your local IP address (not localhost)
// For production: Use your production server URL

export const API_URL = 'https://d23iu3orp3z9g3.cloudfront.net'; // Backend API URL

export const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: `${API_URL}/api/auth/signup`,
    CONFIRM_SIGNUP: `${API_URL}/api/auth/confirm-signup`,
    RESEND_CONFIRMATION: `${API_URL}/api/auth/resend-confirmation`,
    SIGNIN: `${API_URL}/api/auth/signin`,
    REFRESH: `${API_URL}/api/auth/refresh`,
    FORGOT_PASSWORD: `${API_URL}/api/auth/forgot-password`,
    CONFIRM_FORGOT_PASSWORD: `${API_URL}/api/auth/confirm-forgot-password`,
    ME: `${API_URL}/api/auth/me`,
  },
  TRIPS: {
    POINTS: `${API_URL}/api/trips/points`,
    LIST: `${API_URL}/api/trips`,
    DETAIL: (tripId: string) => `${API_URL}/api/trips/${tripId}`,
  },
  COORDINATES: `${API_URL}/api/coordinates`,
  JOURNEYS: `${API_URL}/api/journeys`,
};
