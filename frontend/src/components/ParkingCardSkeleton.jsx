import React from 'react';
import { MapPin, Navigation, Clock, CheckCircle2, XCircle, Car, Zap } from 'lucide-react';

/**
 * ParkingCardSkeleton Component
 * Renders individual parking lot card showing:
 * - Parking Name & Address
 * - Total, Available, and Occupied slots
 * - Distance & Estimated travel time placeholder
 * - Individual slot visual status indicators (updated by ESP32 sensors)
 */
export default function ParkingCardSkeleton({ parking, onSelect, isSelected, onSimulateESP32 }) {
  const { id, name, address, city, total_slots, available_slots, occupied_slots, slots } = parking;
  
  // Calculate percentage of available space
  const availabilityPercent = Math.round((available_slots / total_slots) * 100) || 0;
  
  // Dynamic color depending on availability
  let statusColorClass = 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20';
  if (availabilityPercent < 20) {
    statusColorClass = 'text-rose-400 border-rose-500/30 bg-rose-950/20';
  } else if (availabilityPercent < 50) {
    statusColorClass = 'text-amber-400 border-amber-500/30 bg-amber-950/20';
  }

  return (
    <div 
      onClick={() => onSelect && onSelect(parking)}
      className={`glass-card p-5 rounded-2xl transition-all duration-200 cursor-pointer relative overflow-hidden border ${
        isSelected 
          ? 'border-cyan-400 ring-2 ring-cyan-400/20 bg-slate-800/80 shadow-xl' 
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
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
          {available_slots} / {total_slots} Free
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-4 border border-slate-700/50">
        <div 
          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500"
          style={{ width: `${availabilityPercent}%` }}
        />
      </div>

      {/* Statistics Row: Total, Available, Occupied */}
      <div className="grid grid-cols-3 gap-2 text-center py-2.5 px-3 rounded-xl bg-slate-900/60 border border-slate-800/80 mb-4 text-xs">
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total</span>
          <span className="font-bold text-slate-200 text-sm">{total_slots}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-semibold text-emerald-400">Available</span>
          <span className="font-bold text-emerald-400 text-sm">{available_slots}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-semibold text-rose-400">Occupied</span>
          <span className="font-bold text-rose-400 text-sm">{occupied_slots !== undefined ? occupied_slots : (total_slots - available_slots)}</span>
        </div>
      </div>

      {/* Distance & Driving Time Placeholders (Google Routes API in Milestone 3) */}
      <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3">
        <div className="flex items-center gap-1">
          <Navigation className="w-3.5 h-3.5 text-cyan-400" />
          <span>Distance: <strong className="text-slate-200">1.8 km</strong></span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Travel Time: <strong className="text-slate-200">5 mins</strong></span>
        </div>
      </div>

      {/* ESP32 Real-Time Sensor Test Simulation Trigger (Milestone 1/2 Helper) */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400 animate-pulse" />
          ESP32 Test Simulation:
        </span>
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSimulateESP32 && onSimulateESP32(id, 1, true);
            }}
            className="px-2 py-1 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-300 text-[10px] font-semibold transition-colors"
          >
            Occupy Slot 1
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSimulateESP32 && onSimulateESP32(id, 1, false);
            }}
            className="px-2 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-[10px] font-semibold transition-colors"
          >
            Free Slot 1
          </button>
        </div>
      </div>

    </div>
  );
}
