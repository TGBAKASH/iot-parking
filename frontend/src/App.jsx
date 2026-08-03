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
import { fetchDrivingDistanceAndDuration, searchCityGeocode, fetchIPLocation, reverseGeocode } from './services/routingService';
import { socket, subscribeToSlotUpdates, unsubscribeFromSlotUpdates } from './services/socket';
import { Zap, Search, Compass } from 'lucide-react';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [parkings, setParkings] = useState([]);
  const [selectedParking, setSelectedParking] = useState(null);
  const [searchCity, setSearchCity] = useState('');
  const [loading, setLoading] = useState(true);

  const [userLocation, setUserLocation] = useState(null);
  const [userCityInfo, setUserCityInfo] = useState({ city: 'Local Area', road: 'Main Street' });
  const [nearestParkingId, setNearestParkingId] = useState(null);

  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [inspectorParkingId, setInspectorParkingId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingParking, setEditingParking] = useState(null);
  const [reservingParking, setReservingParking] = useState(null);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    const handleLocationChange = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const requestUserLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(loc);
          showToast(`📍 GPS acquired: ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`);
          const cityInfo = await reverseGeocode(loc.lat, loc.lng);
          if (cityInfo) setUserCityInfo(cityInfo);
        },
        async () => {
          const ipLoc = await fetchIPLocation();
          if (ipLoc) {
            setUserLocation({ lat: ipLoc.lat, lng: ipLoc.lng });
            const cityInfo = await reverseGeocode(ipLoc.lat, ipLoc.lng);
            if (cityInfo) setUserCityInfo(cityInfo);
            showToast(`📍 Location via IP: ${ipLoc.city}`);
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      const ipLoc = await fetchIPLocation();
      if (ipLoc) {
        setUserLocation({ lat: ipLoc.lat, lng: ipLoc.lng });
        const cityInfo = await reverseGeocode(ipLoc.lat, ipLoc.lng);
        if (cityInfo) setUserCityInfo(cityInfo);
      }
    }
  };

  const loadParkings = async () => {
    try {
      setLoading(true);
      const res = await parkingService.getAllParkings();
      if (res.success && res.data) setParkings(res.data);
    } catch (err) {
      console.error('Failed to load parkings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    requestUserLocation();
    loadParkings();

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    subscribeToSlotUpdates((data) => {
      const { parking_id, slot_number, is_occupied, updated_parking } = data;
      setParkings((prev) =>
        prev.map((p) => {
          if (p.id === parking_id) {
            const newAvail = updated_parking
              ? parseInt(updated_parking.available_slots, 10)
              : Math.max(0, parseInt(p.available_slots, 10) + (is_occupied ? -1 : 1));
            return { ...p, available_slots: newAvail, occupied_slots: parseInt(p.total_slots, 10) - newAvail };
          }
          return p;
        })
      );
      showToast(`⚡ Slot #${slot_number} — Parking #${parking_id} is now ${is_occupied ? 'occupied' : 'free'}`);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      unsubscribeFromSlotUpdates();
    };
  }, []);

  // Calculate distances and project nearby if DB locations are far
  useEffect(() => {
    if (!userLocation || parkings.length === 0) return;
    let isMounted = true;

    const calculate = async () => {
      let minMeters = Infinity;
      let closestId = null;

      const firstLat = parseFloat(parkings[0].latitude);
      const firstLng = parseFloat(parkings[0].longitude);
      const approxDistKm = Math.hypot(firstLat - userLocation.lat, firstLng - userLocation.lng) * 111;
      const isFarAway = approxDistKm > 100;

      const offsets = [
        [0.006, 0.005], [-0.007, 0.010], [0.012, -0.007],
        [-0.010, -0.012], [0.004, -0.015], [-0.015, 0.008],
      ];

      const updated = await Promise.all(
        parkings.map(async (p, idx) => {
          let lat = parseFloat(p.latitude);
          let lng = parseFloat(p.longitude);
          let city = p.city;
          let address = p.address;

          if (isFarAway) {
            const offset = offsets[idx % offsets.length];
            lat = userLocation.lat + offset[0];
            lng = userLocation.lng + offset[1];
            city = userCityInfo.city || 'Local Area';
            address = `${100 + (idx + 1) * 25} ${userCityInfo.road || 'Central Blvd'}`;
          }

          const route = await fetchDrivingDistanceAndDuration(userLocation.lat, userLocation.lng, lat, lng);
          if (route.rawMeters < minMeters) { minMeters = route.rawMeters; closestId = p.id; }

          return { ...p, city, address, latitude: lat, longitude: lng, distanceText: route.distanceKm, durationText: route.durationMins, rawDistanceMeters: route.rawMeters };
        })
      );

      if (isMounted) { setParkings(updated); setNearestParkingId(closestId); }
    };

    calculate();
    return () => { isMounted = false; };
  }, [userLocation?.lat, userLocation?.lng, userCityInfo?.city, parkings.length]);

  const handleSearchCitySubmit = async (cityName) => {
    if (!cityName) return;
    const geo = await searchCityGeocode(cityName);
    if (geo) {
      setUserLocation({ lat: geo.lat, lng: geo.lng });
      const cityInfo = await reverseGeocode(geo.lat, geo.lng);
      if (cityInfo) setUserCityInfo(cityInfo);
      showToast(`🔍 Location set to: ${cityName}`);
    }
  };

  const handleSimulateESP32 = async (parkingId, slotNumber, isOccupied) => {
    try {
      await parkingService.updateParkingFromESP32({ parking_id: parkingId, slot_number: slotNumber, is_occupied: isOccupied });
    } catch (err) {
      console.error('ESP32 simulation failed:', err);
    }
  };

  // Secret Admin Panel Route
  if (currentPath === '/sec-admin-panel') {
    return (
      <SecretAdminPanel
        user={user}
        onAuthSuccess={(u) => setUser(u)}
        onReturnHome={() => { window.history.pushState({}, '', '/'); setCurrentPath('/'); }}
      />
    );
  }

  const filtered = parkings.filter(
    (p) =>
      p.name.toLowerCase().includes(searchCity.toLowerCase()) ||
      p.city.toLowerCase().includes(searchCity.toLowerCase()) ||
      p.address.toLowerCase().includes(searchCity.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 flex flex-col">
      <Navbar
        isConnected={isConnected}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={() => { authService.logout(); setUser(null); }}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onRefresh={loadParkings}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed top-16 right-4 z-50 animate-pulse">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-100 text-xs font-medium shadow-2xl">
            <Zap className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
            <span>{toast}</span>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-5">
        {/* Hero — minimal */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Nearby Parking</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {userCityInfo.city ? `${userCityInfo.city}` : 'Detecting location...'} · Real-time IoT monitoring
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={requestUserLocation} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 rounded-lg transition-colors">
              <Compass className="w-3.5 h-3.5" /> GPS
            </button>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-7 space-y-4">
            <DashboardSkeleton
              parkings={filtered}
              selectedParking={selectedParking}
              onSelectParking={(p) => setSelectedParking(p)}
              searchCity={searchCity}
              setSearchCity={setSearchCity}
              onSearchCitySubmit={handleSearchCitySubmit}
              onRequestUserLocation={requestUserLocation}
              onSimulateESP32={handleSimulateESP32}
              onOpenSlotsInspector={(id) => setInspectorParkingId(id)}
              onOpenReserve={(parking) => setReservingParking(parking)}
              loading={loading}
              nearestParkingId={nearestParkingId}
            />
          </div>
          <div className="lg:col-span-5 h-[480px] lg:h-[calc(100vh-200px)] sticky top-16">
            <MapView
              parkings={filtered}
              selectedParking={selectedParking}
              onSelectParking={(p) => setSelectedParking(p)}
              userLocation={userLocation}
              onRequestUserLocation={requestUserLocation}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onAuthSuccess={(u) => setUser(u)} />
      <SlotDetailsModal parkingId={inspectorParkingId} isOpen={Boolean(inspectorParkingId)} onClose={() => setInspectorParkingId(null)} onSlotStateChanged={loadParkings} />
      <AddParkingModal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); setEditingParking(null); }} onSuccess={() => loadParkings()} initialData={editingParking} />
      <ReservationModal isOpen={Boolean(reservingParking)} onClose={() => setReservingParking(null)} parking={reservingParking} user={user} onSuccess={() => loadParkings()} />
      <AnalyticsModal isOpen={isAnalyticsOpen} onClose={() => setIsAnalyticsOpen(false)} />

      {/* Footer */}
      <footer className="border-t border-neutral-900 py-5 text-center text-[11px] text-neutral-600">
        Smart Parking · IoT Smart Parking System
      </footer>
    </div>
  );
}
