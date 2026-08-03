import React, { useState, useEffect } from 'react';
import { ShieldAlert, Lock, Mail, Building2, Plus, Edit3, Trash2, Zap, Layers, RefreshCw, KeyRound, ArrowLeft, BarChart3, AlertCircle, CheckCircle } from 'lucide-react';
import { authService, parkingService, analyticsService } from '../services/api';
import AddParkingModal from './AddParkingModal';
import SlotDetailsModal from './SlotDetailsModal';

/**
 * SecretAdminPanel Component (/sec-admin-panel)
 * Dedicated administrative management portal reserved exclusively for hardcoded admin emails
 * (plumetestnet@gmail.com).
 */
export default function SecretAdminPanel({ user, onAuthSuccess, onReturnHome }) {
  const [email, setEmail] = useState('plumetestnet@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [parkings, setParkings] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingParking, setEditingParking] = useState(null);
  const [inspectorParkingId, setInspectorParkingId] = useState(null);

  const isAdminAuthenticated = user && (user.role === 'admin' || user.email === 'plumetestnet@gmail.com');

  const loadData = async () => {
    try {
      setLoading(true);
      const [parkingsRes, analyticsRes] = await Promise.all([
        parkingService.getAllParkings(),
        analyticsService.getSummary(),
      ]);
      if (parkingsRes.success) setParkings(parkingsRes.data);
      if (analyticsRes.success) setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error('Error loading admin portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      loadData();
    }
  }, [isAdminAuthenticated]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authService.login({ email, password });
      if (res.success && res.user) {
        if (res.user.role === 'admin' || res.user.email === 'plumetestnet@gmail.com') {
          onAuthSuccess(res.user);
          loadData();
        } else {
          setError('Access Denied: Only hardcoded admin accounts (plumetestnet@gmail.com) can access this secret portal.');
        }
      } else {
        setError(res.message || 'Login failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid administrator email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteParking = async (parkingId) => {
    try {
      const res = await parkingService.deleteParking(parkingId);
      if (res.success) {
        setParkings((prev) => prev.filter((p) => p.id !== parkingId));
        loadData();
      }
    } catch (err) {
      console.error('Failed to delete parking:', err);
    }
  };

  const handleSimulateESP32 = async (parkingId, slotNumber, isOccupied) => {
    try {
      await parkingService.updateParkingFromESP32({
        parking_id: parkingId,
        slot_number: slotNumber,
        is_occupied: isOccupied,
      });
      loadData();
    } catch (err) {
      console.error('ESP32 test update failed:', err);
    }
  };

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
          
          <div className="text-center">
            <div className="inline-flex p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-3">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-extrabold text-white">Secret Administrator Portal</h1>
            <p className="text-xs text-slate-400 mt-1">
              Restricted Area: Hardcoded Admin Authentication Required
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <span className="animate-spin border-2 border-slate-950 border-t-transparent rounded-full w-4 h-4" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" /> Authenticate Admin Portal
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 text-center">
            <button
              onClick={onReturnHome}
              className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1 mx-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Public Dashboard
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white">Secret Admin Control Center</h1>
              <p className="text-xs text-slate-400">Logged in as: <strong className="text-amber-400">{user.email}</strong></p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setEditingParking(null);
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Parking Location
            </button>

            <button
              onClick={onReturnHome}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
            >
              Exit to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        {/* Metrics Bar */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">Total Parking Lots</span>
              <span className="text-2xl font-extrabold text-white">{analytics.totalLocations}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">Total Capacity</span>
              <span className="text-2xl font-extrabold text-indigo-400">{analytics.totalCapacity}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">System Occupancy Rate</span>
              <span className="text-2xl font-extrabold text-amber-400">{analytics.occupancyRate}%</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">Active Bookings</span>
              <span className="text-2xl font-extrabold text-emerald-400">{analytics.activeReservations}</span>
            </div>
          </div>
        )}

        {/* Parking Management Table */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" /> Registered Parking Locations (Neon DB)
            </h3>
            <button
              onClick={loadData}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">ID</th>
                  <th className="p-3.5">Name</th>
                  <th className="p-3.5">City & Address</th>
                  <th className="p-3.5">Coordinates</th>
                  <th className="p-3.5">Slots (Free / Total)</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {parkings.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-3.5 font-bold text-indigo-400">#{p.id}</td>
                    <td className="p-3.5 font-semibold text-white">{p.name}</td>
                    <td className="p-3.5 text-slate-400">{p.address}, {p.city}</td>
                    <td className="p-3.5 text-slate-400 font-mono text-[11px]">{p.latitude}, {p.longitude}</td>
                    <td className="p-3.5 font-bold text-emerald-400">{p.available_slots} / {p.total_slots} Free</td>
                    <td className="p-3.5 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => setInspectorParkingId(p.id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[11px] font-semibold border border-slate-700"
                      >
                        Inspect Slots
                      </button>
                      <button
                        onClick={() => {
                          setEditingParking(p);
                          setIsAddModalOpen(true);
                        }}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete parking lot "${p.name}"?`)) handleDeleteParking(p.id);
                        }}
                        className="p-1.5 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ESP32 Hardware Integration Info Box */}
        <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" /> ESP32 Device Configuration
          </h3>
          <p className="text-xs text-slate-400">
            Configure your ESP32 hardware node with this HTTP POST endpoint:
          </p>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-cyan-300 select-all">
            POST https://iot-parking-system.onrender.com/updateParking
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
            <span className="text-slate-500 block">// Header:</span>
            <span>X-ESP32-API-KEY: default_esp32_secret_key_123</span>
            <span className="text-slate-500 block pt-1">// JSON Payload:</span>
            <span>{JSON.stringify({ parking_id: 1, slot_number: 1, is_occupied: true })}</span>
          </div>
        </div>

      </main>

      {/* Modals */}
      <AddParkingModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingParking(null);
        }}
        onSuccess={() => loadData()}
        initialData={editingParking}
      />

      <SlotDetailsModal
        parkingId={inspectorParkingId}
        isOpen={Boolean(inspectorParkingId)}
        onClose={() => setInspectorParkingId(null)}
        onSlotStateChanged={loadData}
      />

    </div>
  );
}
