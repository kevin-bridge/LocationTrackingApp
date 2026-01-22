import axios from 'axios';

interface GeocodingResult {
  address?: string;
  country?: string;
  city?: string;
  province?: string;
  building?: string;
}

class GeocodingService {
  private readonly BASE_URL = 'https://nominatim.openstreetmap.org/reverse';
  private readonly USER_AGENT = 'LocationTrackingApp/1.0';
  private lastRequestTime = 0;
  private readonly MIN_DELAY = 1000; // 1 second between requests

  async reverseGeocode(
    lat: number,
    lng: number,
  ): Promise<GeocodingResult> {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.MIN_DELAY) {
      await new Promise(resolve =>
        setTimeout(resolve, this.MIN_DELAY - timeSinceLastRequest),
      );
    }

    try {
      const response = await axios.get(this.BASE_URL, {
        params: {
          format: 'json',
          lat,
          lon: lng,
          addressdetails: 1,
        },
        headers: {
          'User-Agent': this.USER_AGENT,
        },
      });

      this.lastRequestTime = Date.now();

      const data = response.data;
      const address = data.address || {};

      return {
        address: data.display_name,
        country: address.country,
        city: address.city || address.town || address.village,
        province: address.state || address.province,
        building: address.building || address.house_number,
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      return {};
    }
  }
}

export default new GeocodingService();
