// ============================================================================
// BACKEND REST API SERVICE MODULE (AXIOS)
// ============================================================================
// Configures Axios instance and helper methods for calling Node.js backend endpoints.
// Required API endpoints supported:
// - fetchParkings: GET /parkings
// - fetchParkingById: GET /parking/:id
// - createParking: POST /createParking
// - updateParking: PUT /parking/:id
// - deleteParking: DELETE /parking/:id
// - postESPSensorUpdate: POST /updateParking
// ============================================================================

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to attach authorization header token if user is logged in
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('parking_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// REST API Methods
export const parkingService = {
  // GET /parkings
  getAllParkings: async () => {
    const response = await api.get('/parkings');
    return response.data;
  },

  // GET /parking/:id
  getParkingById: async (id) => {
    const response = await api.get(`/parking/${id}`);
    return response.data;
  },

  // POST /createParking
  createParking: async (parkingData) => {
    const response = await api.post('/createParking', parkingData);
    return response.data;
  },

  // PUT /parking/:id
  updateParking: async (id, parkingData) => {
    const response = await api.put(`/parking/${id}`, parkingData);
    return response.data;
  },

  // DELETE /parking/:id
  deleteParking: async (id) => {
    const response = await api.delete(`/parking/${id}`);
    return response.data;
  },

  // POST /updateParking (Test trigger for ESP32 slot update)
  updateParkingFromESP32: async (slotData) => {
    const response = await api.post('/updateParking', slotData);
    return response.data;
  },
};

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    if (response.data?.token) {
      localStorage.setItem('parking_auth_token', response.data.token);
    }
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    if (response.data?.token) {
      localStorage.setItem('parking_auth_token', response.data.token);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('parking_auth_token');
  },
};

export const reservationService = {
  createReservation: async (reservationData) => {
    const response = await api.post('/api/reservations/create', reservationData);
    return response.data;
  },

  getReservations: async () => {
    const response = await api.get('/api/reservations');
    return response.data;
  },

  cancelReservation: async (id) => {
    const response = await api.post(`/api/reservations/cancel/${id}`);
    return response.data;
  },
};

export const analyticsService = {
  getSummary: async () => {
    const response = await api.get('/api/analytics/summary');
    return response.data;
  },
};

export default api;
