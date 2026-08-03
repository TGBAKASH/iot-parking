import React from 'react';
import { MapPin, Navigation, Clock, Layers, Edit3, Trash2, Zap, ExternalLink, Award, Calendar } from 'lucide-react';

/**
 * ParkingCardSkeleton Component (Milestone 3 Production Version)
 * Displays:
 * - Parking Name, Address & City
 * - Distance & Estimated Travel Time calculated via OSRM Routes API
 * - "Nearest Parking" badge based on actual driving distance
 * - Total, Available, and Occupied slots
 * - View Slots inspector button & "Navigate with Google Maps" deep-link button
 */
export default function ParkingCardSkeleton({
  parking,
  onSelect,
  isSelected,
  onOpenSlotsInspector,
  onEdit,
  onDelete,
  onSimulateESP32,
  user,
  isNearest,
}) {
  const { id, name, address, city, latitude, longitude, total_slots, available_slots, occupied_slots, distanceText, durationText } = parking;

  const total = parseInt(total_slots, 10) || 1;
  const available = parseInt(available_slots, 10) || 0;
  const occupied = occupied_slots !== undefined ? parseInt(occupied_slots, 10) : total - available;

  const availabilityPercent = Math.round((available / total) * 100) || 0;

  let statusColorClass = 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20';
  if (availabilityPercent < 20) {
    statusColorClass = 'text-rose-400 border-rose-500/30 bg-rose-950/20';
  } else if (availabilityPercent < 50) {
    statusColorClass = 'text-amber-400 border-amber-500/30 bg-amber-950/20';
  }

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  return (
    <div
      onClick={() => onSelect && onSelect(parking)}
      className={`glass-card p-5 rounded-2xl transition-all duration-200 cursor-pointer relative overflow-hidden border ${
        isSelected
          ? 'border-cyan-400 ring-2 ring-cyan-400/20 bg-slate-800/80 shadow-xl'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Nearest Parking Badge Header */}
      {isNearest && (
        <div className="mb-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider">
          <Award className="w-3 h-3 text-amber-400" /> Nearest Parking (by Driving Distance)
        </div>
      )}

      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-bold text-slate-100 text-base group-hover:text-cyan-400 transition-colors">
            {name}
          </h3>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>{address}, {city}</span>
          </p>
        </div>

        {/* Availability Badge */}
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${statusColorClass}`}>
          {available} / {total} Free
        </span>
      </div>

      {/* Availability Progress Bar */}
      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-4 border border-slate-700/50">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500"
          style={{ width: `${availabilityPercent}%` }}
        />
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-3 gap-2 text-center py-2.5 px-3 rounded-xl bg-slate-900/60 border border-slate-800/80 mb-4 text-xs">
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total</span>
          <span className="font-bold text-slate-200 text-sm">{total}</span>
        </div>
        <div>
          <span className="text-emerald-400 block text-[10px] uppercase font-semibold">Available</span>
          <span className="font-bold text-emerald-400 text-sm">{available}</span>
        </div>
        <div>
          <span className="text-rose-400 block text-[10px] uppercase font-semibold">Occupied</span>
          <span className="font-bold text-rose-400 text-sm">{occupied}</span>
        </div>
      </div>

      {/* OSRM Driving Distance & Travel Time Calculator Display */}
      <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3 mb-4">
        <div className="flex items-center gap-1">
          <Navigation className="w-3.5 h-3.5 text-cyan-400" />
          <span>Driving Distance: <strong className="text-cyan-300 font-bold">{distanceText || 'Calculating...'}</strong></span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Est. Time: <strong className="text-amber-300 font-bold">{durationText || 'Calculating...'}</strong></span>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
        
        {/* View Individual Slots Inspector */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenSlotsInspector && onOpenSlotsInspector(id);
          }}
          className="py-1.5 px-2.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all flex items-center justify-center gap-1"
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" /> Slots
        </button>

        {/* Reserve Slot Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenReserve && onOpenReserve(parking);
          }}
          className="py-1.5 px-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all flex items-center justify-center gap-1"
        >
          <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Reserve
        </button>

        {/* Navigate with Google Maps */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-md shadow-blue-500/20"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Navigate
        </a>

        {/* Admin Edit / Delete Actions */}
        {user && user.role === 'admin' && (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit && onEdit(parking);
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Edit Parking Lot"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete parking lot "${name}"?`)) {
                  onDelete && onDelete(id);
                }
              }}
              className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 transition-colors"
              title="Delete Parking Lot"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>

      {/* Quick Test ESP32 Simulation Trigger */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/50 flex items-center justify-between">
        <span className="text-[10px] text-slate-400 flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" /> Quick ESP32 Trigger:
        </span>
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSimulateESP32 && onSimulateESP32(id, 1, true);
            }}
            className="px-2 py-0.5 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-300 text-[10px] font-semibold transition-colors"
          >
            Occupy Slot 1
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSimulateESP32 && onSimulateESP32(id, 1, false);
            }}
            className="px-2 py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-[10px] font-semibold transition-colors"
          >
            Free Slot 1
          </button>
        </div>
      </div>

    </div>
  );
}
