import React, { useState, useEffect } from 'react';
import { X, BarChart3, Activity, Layers, Zap, RefreshCw, CheckCircle2 } from 'lucide-react';
import { analyticsService } from '../services/api';

/**
 * AnalyticsModal Component
 * Displays system-wide metrics, peak occupancy rate, and live sensor telemetry logs.
 */
export default function AnalyticsModal({ isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await analyticsService.getSummary();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAnalytics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl p-6 glass-panel rounded-3xl border border-slate-700/80 shadow-2xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">System Analytics & Sensor Telemetry</h2>
              <p className="text-xs text-slate-400">Real-time Neon PostgreSQL occupancy metrics & sensor activity log</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchAnalytics}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-6 space-y-6">
          {loading && !data ? (
            <div className="text-center py-12 text-slate-400">
              <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto mb-2" />
              <span>Querying Neon PostgreSQL analytics...</span>
            </div>
          ) : data ? (
            <>
              {/* Top Stats Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Locations</span>
                  <span className="text-2xl font-extrabold text-white">{data.totalLocations}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Slots</span>
                  <span className="text-2xl font-extrabold text-cyan-400">{data.totalCapacity}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Occupancy Rate</span>
                  <span className="text-2xl font-extrabold text-amber-400">{data.occupancyRate}%</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Active Bookings</span>
                  <span className="text-2xl font-extrabold text-emerald-400">{data.activeReservations}</span>
                </div>
              </div>

              {/* Occupancy Progress Visual */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Total System Occupancy</span>
                  <span className="text-cyan-400">{data.totalOccupied} / {data.totalCapacity} Occupied</span>
                </div>
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700/50">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 transition-all duration-500"
                    style={{ width: `${data.occupancyRate}%` }}
                  />
                </div>
              </div>

              {/* Sensor Telemetry Logs Table */}
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-300 tracking-wider mb-3 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-cyan-400" /> Recent ESP32 Sensor Telemetry Activity Log
                </h3>

                {data.recentTelemetryLogs && data.recentTelemetryLogs.length > 0 ? (
                  <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/80">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                        <tr>
                          <th className="p-3">Time</th>
                          <th className="p-3">Parking Location</th>
                          <th className="p-3">Slot Number</th>
                          <th className="p-3">State Event</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {data.recentTelemetryLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-3 text-slate-400 text-[11px]">
                              {new Date(log.created_at).toLocaleTimeString()}
                            </td>
                            <td className="p-3 font-semibold text-slate-200">{log.parking_name}</td>
                            <td className="p-3 font-mono font-bold text-cyan-400">Slot #{log.slot_number}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  log.is_occupied
                                    ? 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
                                    : 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                                }`}
                              >
                                {log.is_occupied ? 'Occupied' : 'Freed'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs glass-card rounded-2xl">
                    No sensor telemetry events recorded yet. Click "Occupy Slot 1" on any parking card to generate real-time events!
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
          >
            Close Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}
