import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DashboardSkeleton from './components/DashboardSkeleton';
import MapSkeleton from './components/MapSkeleton';
import { parkingService } from './services/api';
import { socket, subscribeToSlotUpdates, unsubscribeFromSlotUpdates } from './services/socket';
import { Layers, ShieldCheck, MapPin, Zap, Info } from 'lucide-react';

/**
 * Main App Component (Milestone 1 Core Skeleton)
 * Connects state management for parking list, real-time WebSockets update handler,
 * city search filter, and Google Maps placeholder.
 */
export default function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [parkings, setParkings] = useState([]);
  const [selectedParking, setSelectedParking] = useState(null);
  const [searchCity, setSearchCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({ name: 'Admin User', role: 'admin' });
  const [statusNotification, setStatusNotification] = useState(null);

  // 1. Fetch initial parkings list from Node.js backend
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

  // 2. Setup Socket.IO real-time event listeners
  useEffect(() => {
    loadParkings();

    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Listen for live ESP32 updates
    subscribeToSlotUpdates((data) => {
      const { parking_id, slot_number, is_occupied, updated_parking } = data;
      
      // Update local state in real-time
      setParkings((prevParkings) =>
        prevParkings.map((p) => {
          if (p.id === parking_id) {
            const updatedAvailable = updated_parking 
              ? updated_parking.available_slots 
              : Math.max(0, p.available_slots + (is_occupied ? -1 : 1));
            
            const updatedOccupied = p.total_slots - updatedAvailable;

            return {
              ...p,
              available_slots: updatedAvailable,
              occupied_slots: updatedOccupied,
            };
          }
          return p;
        })
      );

      // Trigger temporary toast alert
      setStatusNotification(
        `⚡ Real-time Slot #${slot_number} in Parking Lot #${parking_id} is now ${is_occupied ? 'OCCUPIED' : 'FREE'}!`
      );
      setTimeout(() => setStatusNotification(null), 4000);
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      unsubscribeFromSlotUpdates();
    };
  }, []);

  // 3. Test ESP32 Simulation Trigger
  const handleSimulateESP32 = async (parkingId, slotNumber, isOccupied) => {
    try {
      await parkingService.updateParkingFromESP32({
        parking_id: parkingId,
        slot_number: slotNumber,
        is_occupied: isOccupied,
      });
    } catch (err) {
      console.error('ESP32 simulation trigger failed:', err);
    }
  };

  // Filter parkings by search query
  const filteredParkings = parkings.filter(
    (p) =>
      p.name.toLowerCase().includes(searchCity.toLowerCase()) ||
      p.city.toLowerCase().includes(searchCity.toLowerCase()) ||
      p.address.toLowerCase().includes(searchCity.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      
      {/* Header Navbar */}
      <Navbar isConnected={isConnected} user={user} onRefresh={loadParkings} />

      {/* Real-time Notification Toast */}
      {statusNotification && (
        <div className="fixed top-20 right-4 z-50 animate-bounce">
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-cyan-950 border border-cyan-400 text-cyan-200 text-xs font-semibold shadow-2xl">
            <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{statusNotification}</span>
          </div>
        </div>
      )}

      {/* Main Content Dashboard Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        
        {/* Banner / Milestone 1 Header */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
                Milestone 1 Active
              </span>
              <span className="text-xs text-slate-400">Node.js Express + Socket.IO + React + Vite</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Smart IoT Parking System</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Monitor live parking slot availability powered by ESP32 IR sensors, WebSocket instant updates, and Google Maps routing.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-slate-300">
              Click <strong>"Occupy Slot 1"</strong> or <strong>"Free Slot 1"</strong> on any card to test HTTP POST & WebSocket real-time sync!
            </span>
          </div>
        </div>

        {/* Grid Layout: Left Column = Dashboard List, Right Column = Google Maps Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Dashboard List */}
          <div className="lg:col-span-7 space-y-6">
            <DashboardSkeleton
              parkings={filteredParkings}
              selectedParking={selectedParking}
              onSelectParking={(p) => setSelectedParking(p)}
              searchCity={searchCity}
              setSearchCity={setSearchCity}
              onSimulateESP32={handleSimulateESP32}
              loading={loading}
            />
          </div>

          {/* Right Column: Google Maps Container */}
          <div className="lg:col-span-5 h-[500px] lg:h-[calc(100vh-240px)] sticky top-24">
            <MapSkeleton selectedParking={selectedParking} />
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>Smart Parking System - ESP32 IoT & Full-Stack Node/React Solution</p>
      </footer>

    </div>
  );
}
