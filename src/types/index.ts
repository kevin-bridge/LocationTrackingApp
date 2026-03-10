export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at?: string;
}

export interface Coordinate {
  lng: number;
  lat: number;
  address?: string;
  country?: string;
  city?: string;
  province?: string;
  building?: string;
  location_time: number; // Unix timestamp in milliseconds
}

export interface TripPointDetail {
  id: string;
  user_id: number;
  trip_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  angle: number;
  speed: number;
  address: TripPointAddress;
  created_at: string;
}

export interface Trip {
  id: string;
  user_id: number;
  start_point: TripPointDetail;
  end_point: TripPointDetail;
  start_time: string;
  end_time: string;
  point_count?: number; // Included in list API response
  points?: TripPointDetail[]; // Only included in detail API response
  created_at: string;
  updated_at: string;
}

export interface Journey {
  id: number;
  user_id: string;
  origin: {
    id: number;
    address: string;
    coordinates: { lng: number; lat: number };
    timestamp: number;
  };
  destination: {
    id: number;
    address: string;
    coordinates: { lng: number; lat: number };
    timestamp: number;
  };
  distance_km: number;
  travel_time_hours: number;
  route_path?: Coordinate[];
  start_time: string;
  end_time: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface SigninResponse {
  access_token: string;
  id_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface SignupRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface ConfirmSignupRequest {
  email: string;
  confirmation_code: string;
}

export interface CoordinatesUploadRequest {
  coordinates: Coordinate[];
}

export interface JourneysResponse {
  journeys: Journey[];
  total: number;
}

export interface TripPointAddress {
  formatted?: string;
  country?: string;
  country_code?: string;
  state?: string;
  city?: string;
  suburb?: string;
  road?: string;
  house_number?: string;
  postcode?: string;
  building?: string;
  neighbourhood?: string;
}

export interface TripPoint {
  latitude: number;
  longitude: number;
  timestamp: string; // ISO 8601 format
  angle?: number;
  speed?: number;
  address?: TripPointAddress;
}

export interface TripPointsUploadRequest {
  points: TripPoint[];
}
