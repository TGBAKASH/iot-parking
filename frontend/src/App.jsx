import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DashboardSkeleton from './components/DashboardSkeleton';
import MapView from './components/MapView';
import AuthModal from './components/AuthModal';
import SlotDetailsModal from './components/SlotDetailsModal';
import AddParkingModal from './components/AddParkingModal';
import ReservationModal from './components/ReservationModal';
import AnalyticsModal from './components/AnalyticsModal';
import SecretAdminPanel from './components/SecretAdminPanel';
import { parkingService, authService } from './services/api';
import { fetchDrivingDistanceAndDuration, searchCityGeocode } from './services/routingService';
import { socket, subscribeToSlotUpdates, unsubscribeFromSlotUpdates } from './services/socket';
import { Layers, ShieldCheck, MapPin, Zap, Info, Compass, BarChart3, Calendar, ShieldAlert } from 'lucide-react';

/**
 * Main App Component (Single Page App with Secret Admin Route /sec-admin-panel)
 */
export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  const [isConnected, setIsConnected] = useState(socket.connected);
  const [parkings, setParkings] = useState([]);
  const [selectedParking, setSelectedParking] = useState(null);
  const [searchCity, setSearchCity] = useState('');
  const [loading, setLoading] = useState(true);

  // User location state (GPS)
  const [userLocation, setUserLocation] = useState(null);
  const [nearestParkingId, setNearestParkingId] = useState(null);

  // User auth state (default guest or hardcoded admin)
  const [user, setUser] = useState({ name: 'Akash', email: 'plumetestnet@gmail.com', role: 'admin' });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Modals state
  const [inspectorParkingId, setInspectorParkingId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingParking, setEditingParking] = useState(null);
  const [reservingParking, setReservingParking] = useState(null);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  // Toast Notification
  const [statusNotification, setStatusNotification] = useState(null);

  // Track browser URL path changes
  useEffect(() => {
    const handleLocationChange = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Request Browser Geolocation
  const requestUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(loc);
          setStatusNotification(`📍 GPS Location: ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`);
          setTimeout(() => setStatusNotification(null), 4000);
        },
        (error) => {
          console.warn('Geolocation fallback:', error.message);
          setUserLocation({ lat: 37.774929, lng: -122.419416 });
        }
      );
    } else {
      setUserLocation({ lat: 37.774929, lng: -122.419416 });
    }
  };

  // 1. Fetch parking locations from backend
  const loadParkings = async () => {
    try {
      setLoading(true);
      const res = await parkingService.getAllParkings();
      if (res.success && res.data) {
        setParkings(res.data);
        if (res.data.length > 0 && !selectedParking) {
          setSelectedParking(res.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load parkings:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Initial Setup
  useEffect(() => {
    requestUserLocation();
    loadParkings();

    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Subscribe to live ESP32 updates
    subscribeToSlotUpdates((data) => {
      const { parking_id, slot_number, is_occupied, updated_parking } = data;

      setParkings((prevParkings) =>
        prevParkings.map((p) => {
          if (p.id === parking_id) {
            const newAvail = updated_parking
              ? parseInt(updated_parking.available_slots, 10)
              : Math.max(0, parseInt(p.available_slots, 10) + (is_occupied ? -1 : 1));

            const newTotal = parseInt(p.total_slots, 10);
            const newOccupied = newTotal - newAvail;

            return {
              ...p,
              available_slots: newAvail,
              occupied_slots: newOccupied,
            };
          }
          return p;
        })
      );

      setStatusNotification(
        `⚡ Real-time Slot #${slot_number} in Parking Lot #${parking_id} is now ${
          is_occupied ? 'OCCUPIED' : 'FREE'
        }!`
      );
      setTimeout(() => setStatusNotification(null), 4000);
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      unsubscribeFromSlotUpdates();
    };
  }, []);

  // 3. Calculate OSRM driving distance
  useEffect(() => {
    if (!userLocation || parkings.length === 0) return;

    let isMounted = true;

    const calculateDistances = async () => {
      let minMeters = Infinity;
      let closestId = null;

      const updatedList = await Promise.all(
        parkings.map(async (p) => {
          const lat = parseFloat(p.latitude);
          const lng = parseFloat(p.longitude);

          const route = await fetchDrivingDistanceAndDuration(
            userLocation.lat,
            userLocation.lng,
            lat,
            lng
          );

          if (route.rawMeters < minMeters) {
            minMeters = route.rawMeters;
            closestId = p.id;
          }

          return {
            ...p,
            distanceText: route.distanceKm,
            durationText: route.durationMins,
            rawDistanceMeters: route.rawMeters,
          };
        })
      );

      if (isMounted) {
        setParkings(updatedList);
        setNearestParkingId(closestId);
      }
    };

    calculateDistances();

    return () => {
      isMounted = false;
    };
  }, [userLocation, parkings.length]);

  const handleSearchCitySubmit = async (cityName) => {
    if (!cityName) return;
    const geo = await searchCityGeocode(cityName);
    if (geo) {
      setUserLocation({ lat: geo.lat, lng: geo.lng });
      setStatusNotification(`🔍 Location: ${cityName}`);
      setTimeout(() => setStatusNotification(null), 4000);
    }
  };

  const handleSimulateESP32 = async (parkingId, slotNumber, isOccupied) => {
    try {
      await parkingService.updateParkingFromESP32({
        parking_id: parkingId,
        slot_number: slotNumber,
        is_occupied: isOccupied,
      });
    } catch (err) {
      console.error('ESP32 simulation failed:', err);
    }
  };

  const handleDeleteParking = async (parkingId) => {
    try {
      const res = await parkingService.deleteParking(parkingId);
      if (res.success) {
        setParkings((prev) => prev.filter((p) => p.id !== parkingId));
        if (selectedParking?.id === parkingId) {
          setSelectedParking(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete parking:', err);
    }
  };

  // Check if viewing Secret Admin Panel route
  if (currentPath === '/sec-admin-panel') {
    return (
      <SecretAdminPanel
        user={user}
        onAuthSuccess={(u) => setUser(u)}
        onReturnHome={() => {
          window.history.pushState({}, '', '/');
          setCurrentPath('/');
        }}
      />
    );
  }

  const filteredParkings = parkings.filter(
    (p) =>
      p.name.toLowerCase().includes(searchCity.toLowerCase()) ||
      p.city.toLowerCase().includes(searchCity.toLowerCase()) ||
      p.address.toLowerCase().includes(searchCity.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      
      {/* Navbar Header */}
      <Navbar
        isConnected={isConnected}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={() => {
          authService.logout();
          setUser(null);
        }}
        onOpenAddParking={() => {
          setEditingParking(null);
          setIsAddModalOpen(true);
        }}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onRefresh={loadParkings}
      />

      {/* Real-Time WebSocket Toast Notification */}
      {statusNotification && (
        <div className="fixed top-16 right-4 z-50 animate-bounce">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-indigo-500 text-slate-100 text-xs font-semibold shadow-xl">
            <Zap className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{statusNotification}</span>
          </div>
        </div>
      )}

      {/* Main Content Dashboard Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        
        {/* Header Banner */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
                Live IoT Parking System
              </span>
              <span className="text-xs text-slate-400">Neon PostgreSQL DB • OpenStreetMap • OSRM Routes</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Smart IoT Parking System</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Monitor real-time parking slot availability, driving distances, and digital slot reservations.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-slate-300">
              Click <strong>"Reserve"</strong> on any card to generate a digital QR pass token!
            </span>
          </div>
        </div>

        {/* Main Grid: Left = Dashboard List, Right = Leaflet Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            <DashboardSkeleton
              parkings={filteredParkings}
              selectedParking={selectedParking}
              onSelectParking={(p) => setSelectedParking(p)}
              searchCity={searchCity}
              setSearchCity={setSearchCity}
              onSearchCitySubmit={handleSearchCitySubmit}
              onRequestUserLocation={requestUserLocation}
              onSimulateESP32={handleSimulateESP32}
              onOpenSlotsInspector={(id) => setInspectorParkingId(id)}
              onOpenReserve={(parking) => setReservingParking(parking)}
              onEditParking={(p) => {
                setEditingParking(p);
                setIsAddModalOpen(true);
              }}
              onDeleteParking={handleDeleteParking}
              onOpenAddParking={() => {
                setEditingParking(null);
                setIsAddModalOpen(true);
              }}
              user={user}
              loading={loading}
              nearestParkingId={nearestParkingId}
            />
          </div>

          {/* Right Column: Leaflet Map */}
          <div className="lg:col-span-5 h-[500px] lg:h-[calc(100vh-240px)] sticky top-24">
            <MapView
              parkings={filteredParkings}
              selectedParking={selectedParking}
              onSelectParking={(p) => setSelectedParking(p)}
              userLocation={userLocation}
              onRequestUserLocation={requestUserLocation}
            />
          </div>

        </div>

      </main>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(u) => setUser(u)}
      />

      <SlotDetailsModal
        parkingId={inspectorParkingId}
        isOpen={Boolean(inspectorParkingId)}
        onClose={() => setInspectorParkingId(null)}
        onSlotStateChanged={loadParkings}
      />

      <AddParkingModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingParking(null);
        }}
        onSuccess={() => loadParkings()}
        initialData={editingParking}
      />

      <ReservationModal
        isOpen={Boolean(reservingParking)}
        onClose={() => setReservingParking(null)}
        parking={reservingParking}
        user={user}
        onSuccess={() => loadParkings()}
      />

      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>Smart Parking System - ESP32 IoT & Full-Stack Solution</p>
      </footer>

    </div>
  );
}
