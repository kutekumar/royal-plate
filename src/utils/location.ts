/**
 * Location utilities for calculating distances and working with coordinates
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param coord1 First coordinate
 * @param coord2 Second coordinate
 * @returns Distance in miles
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.latitude)) *
    Math.cos(toRad(coord2.latitude)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get user's current location
 * @returns Promise with user coordinates or null if denied/unavailable
 */
export function getUserLocation(): Promise<Coordinates | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.warn('Error getting user location:', error.message);
        resolve(null);
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  });
}

/**
 * Default location for Yangon, Myanmar (city center)
 */
export const YANGON_CENTER: Coordinates = {
  latitude: 16.8661,
  longitude: 96.1951,
};

/**
 * Geocode an address to coordinates using Nominatim (OpenStreetMap)
 * @param address Address string
 * @returns Promise with coordinates or null if not found
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}, Yangon, Myanmar&limit=1`,
      {
        headers: {
          'User-Agent': 'RoyalPlateApp/1.0',
        },
      }
    );

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Format distance for display
 * @param distance Distance in miles
 * @returns Formatted string (e.g., "2.5 mi")
 */
export function formatDistance(distance: number): string {
  return `${distance.toFixed(1)} mi`;
}
