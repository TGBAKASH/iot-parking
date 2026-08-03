// ============================================================================
// SOCKET.IO REAL-TIME CLIENT CONNECTOR
// ============================================================================
// Manages WebSocket connection state with backend for real-time slot updates.
// ============================================================================

import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
});

// Event listeners helper setup
export const subscribeToSlotUpdates = (callback) => {
  socket.on('parkingSlotUpdated', (data) => {
    console.log('⚡ Real-time Socket.IO update received:', data);
    if (callback) callback(data);
  });
};

export const unsubscribeFromSlotUpdates = () => {
  socket.off('parkingSlotUpdated');
};
