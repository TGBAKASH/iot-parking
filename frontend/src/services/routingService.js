// ============================================================================
// FREE ROUTING & GEOCODING SERVICE (OSRM + NOMINATIM OPENSTREETMAP)
// ============================================================================
// Requires NO credit card, NO Google account, and NO API keys. 100% Free!
// 1. fetchDrivingDistance: Uses OSRM to calculate exact road driving distance & time.
// 2. searchCityGeocode: Uses Nominatim to search any city and get lat/lng coordinates.
// ============================================================================

import axios from 'axios';

/**
 * Calculate driving distance and travel time using Open Source Routing Machine (OSRM).
 * @param {number} userLat - User latitude
 * @param {number} userLng - User longitude
 * @param {number} parkingLat - Parking location latitude
 * @param {number} parkingLng - Parking location longitude
 * @returns {Promise<{distanceKm: string, durationMins: string, rawMeters: number}>}
 */
export const fetchDrivingDistanceAndDuration = async (userLat, userLng, parkingLat, parkingLng) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${parkingLng},${parkingLat}?overview=false`;
    const response = await axios.get(url);

    if (response.data && response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const distanceMeters = route.distance;
      const durationSeconds = route.duration;

      const distanceKm = (distanceMeters / 1000).toFixed(1) + ' km';
      const durationMins = Math.max(1, Math.round(durationSeconds / 60)) + ' mins';

      return {
        distanceKm,
        durationMins,
        rawMeters: distanceMeters,
      };
    }
  } catch (error) {
    console.warn('OSRM routing fetch warning, fallback straight line distance:', error.message);
  }

  // Fallback Haversine straight-line distance calculation if offline
  const R = 6371; // Earth radius in km
  const dLat = ((parkingLat - userLat) * Math.PI) / 180;
  const dLon = ((parkingLng - userLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((userLat * Math.PI) / 180) *
      Math.cos((parkingLat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const fallbackKm = (R * c).toFixed(1) + ' km';
  const fallbackMins = Math.max(1, Math.round(R * c * 2.5)) + ' mins';

  return {
    distanceKm: fallbackKm,
    durationMins: fallbackMins,
    rawMeters: R * c * 1000,
  };
};

/**
 * Search any city name and return geographic coordinates using Nominatim API.
 * @param {string} cityName - Name of city (e.g. "San Francisco", "New York")
 * @returns {Promise<{lat: number, lng: number, displayName: string} | null>}
 */
export const searchCityGeocode = async (cityName) => {
  try {
    if (!cityName || cityName.trim().length === 0) return null;

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName.trim())}&limit=1`;
    const response = await axios.get(url, {
      headers: {
        'Accept-Language': 'en',
      },
    });

    if (response.data && response.data.length > 0) {
      const location = response.data[0];
      return {
        lat: parseFloat(location.lat),
        lng: parseFloat(location.lon),
        displayName: location.display_name,
      };
    }
  } catch (error) {
    console.error('Nominatim geocoding error:', error);
  }
  return null;
};
