// ============================================================================
// FREE ROUTING & GEOCODING SERVICE (OSRM + NOMINATIM OPENSTREETMAP)
// ============================================================================
// 1. fetchDrivingDistanceAndDuration: Uses OSRM to calculate road driving distance, time & route geometry.
// 2. searchCityGeocode: Uses Nominatim to search any city and get lat/lng coordinates.
// 3. fetchIPLocation: Uses free IP geolocation to detect user's actual city automatically.
// 4. reverseGeocode: Converts lat/lng coordinates into real local city & street names.
// ============================================================================

import axios from 'axios';

/**
 * Calculate driving distance, travel time, and road polyline geometry using OSRM.
 */
export const fetchDrivingDistanceAndDuration = async (userLat, userLng, parkingLat, parkingLng) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${parkingLng},${parkingLat}?overview=full&geometries=geojson`;
    const response = await axios.get(url);

    if (response.data && response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const distanceMeters = route.distance;
      const durationSeconds = route.duration;

      const distanceKm = (distanceMeters / 1000).toFixed(1) + ' km';
      const durationMins = Math.max(1, Math.round(durationSeconds / 60)) + ' mins';
      
      // Convert OSRM GeoJSON [lng, lat] to Leaflet [lat, lng]
      const coordinates = (route.geometry?.coordinates || []).map((coord) => [coord[1], coord[0]]);

      return {
        distanceKm,
        durationMins,
        rawMeters: distanceMeters,
        coordinates: coordinates.length > 0 ? coordinates : [[userLat, userLng], [parkingLat, parkingLng]],
      };
    }
  } catch (error) {
    console.warn('OSRM routing fetch warning, fallback straight line distance:', error.message);
  }

  // Fallback Haversine straight-line distance calculation
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
    coordinates: [[userLat, userLng], [parkingLat, parkingLng]],
  };
};

/**
 * Search any city name and return geographic coordinates using Nominatim API.
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

/**
 * Detect user's location via free IP Geolocation when GPS is unavailable.
 */
export const fetchIPLocation = async () => {
  try {
    const res = await axios.get('https://ipapi.co/json/');
    if (res.data && res.data.latitude && res.data.longitude) {
      return {
        lat: res.data.latitude,
        lng: res.data.longitude,
        city: res.data.city || 'Local City',
      };
    }
  } catch (err) {
    console.warn('IP geocoding primary fallback warning:', err.message);
  }

  // Backup IP Geocoder
  try {
    const res = await axios.get('https://ipwho.is/');
    if (res.data && res.data.success && res.data.latitude && res.data.longitude) {
      return {
        lat: res.data.latitude,
        lng: res.data.longitude,
        city: res.data.city || 'Local City',
      };
    }
  } catch (err) {
    console.warn('IP geocoding secondary fallback warning:', err.message);
  }

  return null;
};

/**
 * Reverse geocode lat/lng into local city and road name using Nominatim API.
 */
export const reverseGeocode = async (lat, lng) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`;
    const response = await axios.get(url, {
      headers: { 'Accept-Language': 'en' },
    });

    if (response.data && response.data.address) {
      const addr = response.data.address;
      // Prefer most specific name: village > town > suburb > city > county > state_district
      const city = addr.village || addr.town || addr.suburb || addr.city || addr.county || addr.state_district || 'Local Area';
      const road = addr.road || addr.neighbourhood || addr.suburb || addr.village || 'Main Road';
      return { city, road };
    }
  } catch (err) {
    console.warn('Reverse geocoding error:', err.message);
  }
  return { city: 'Local Area', road: 'Main Street' };
};
