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

  // Place parkings relative to user's GPS and calculate distances
  useEffect(() => {
    if (!userLocation || parkings.length === 0) return;
    let isMounted = true;

    // Offsets to place parkings near user's actual GPS
    // Parking 1 (IoT): ~20km north-east
    // Parking 2 (Dummy): ~50km south-west
    const parkingOffsets = {
      1: { latOff: 0.12, lngOff: 0.10 },   // ~20km away
      2: { latOff: -0.30, lngOff: -0.25 },  // ~50km away
    };

    const calculate = async () => {
      let minMeters = Infinity;
      let closestId = null;

      const updated = await Promise.all(
        parkings.map(async (p) => {
          // Use offset from user's position for demo parkings
          const offset = parkingOffsets[p.id] || { latOff: 0, lngOff: 0 };
          const lat = userLocation.lat + offset.latOff;
          const lng = userLocation.lng + offset.lngOff;

          // Update address/city relative to user's location
          const city = userCityInfo.city || p.city;
          const address = p.id === 1
            ? `Smart Parking Zone, ${userCityInfo.road || 'Main Road'}`
            : `Highway Service Area, NH Road`;

          const route = await fetchDrivingDistanceAndDuration(userLocation.lat, userLocation.lng, lat, lng);
          if (route.rawMeters < minMeters) { minMeters = route.rawMeters; closestId = p.id; }

          return { ...p, latitude: lat, longitude: lng, city, address, distanceText: route.distanceKm, durationText: route.durationMins, rawDistanceMeters: route.rawMeters };
        })
      );

      if (isMounted) { setParkings(updated); setNearestParkingId(closestId); }
    };

    calculate();
    return () => { isMounted = false; };
  }, [userLocation?.lat, userLocation?.lng, parkings.length]);

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
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
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
        <div className="fixed top-16 right-4 z-50 animate-bounce">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-emerald-200 text-gray-800 text-xs font-medium shadow-lg">
            <Zap className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>{toast}</span>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-5">
        {/* Hero */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Nearby Parking</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {userCityInfo.city ? `${userCityInfo.city}` : 'Detecting location...'} · Real-time IoT monitoring
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={requestUserLocation} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow transition-all">
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
              loading={loading}
              nearestParkingId={nearestParkingId}
              userLocation={userLocation}
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
      <AnalyticsModal isOpen={isAnalyticsOpen} onClose={() => setIsAnalyticsOpen(false)} />

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-5 text-center text-xs text-gray-400">
        Smart Parking · IoT Smart Parking System · Powered by ESP32
      </footer>
    </div>
  );
}
