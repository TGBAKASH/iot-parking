import React from 'react';
import { MapPin, Navigation, Clock, Layers, Zap, ExternalLink, Award, Calendar } from 'lucide-react';

/**
 * ParkingCardSkeleton Component (Clean Public View)
 * 100% Confidential - Zero Admin references in public UI.
 */
export default function ParkingCardSkeleton({
  parking,
  onSelect,
  isSelected,
  onOpenSlotsInspector,
  onOpenReserve,
  onSimulateESP32,
  isNearest,
}) {
  const { id, name, address, city, latitude, longitude, total_slots, available_slots, occupied_slots, distanceText, durationText } = parking;

  const total = parseInt(total_slots, 10) || 1;
  const available = parseInt(available_slots, 10) || 0;
  const occupied = occupied_slots !== undefined ? parseInt(occupied_slots, 10) : total - available;

  const availabilityPercent = Math.round((available / total) * 100) || 0;

  let statusBadgeClass = 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80';
  if (availabilityPercent < 20) {
    statusBadgeClass = 'bg-rose-950/60 text-rose-400 border-rose-800/80';
  } else if (availabilityPercent < 50) {
    statusBadgeClass = 'bg-amber-950/60 text-amber-400 border-amber-800/80';
  }

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  return (
    <div
      onClick={() => onSelect && onSelect(parking)}
      className={`card-clean p-5 cursor-pointer relative overflow-hidden transition-all ${
        isSelected
          ? 'border-indigo-500 ring-1 ring-indigo-500/30 bg-slate-900 shadow-md'
          : 'bg-slate-900/90 hover:border-slate-700'
      }`}
    >
      {/* Nearest Badge Header */}
      {isNearest && (
        <div className="mb-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-semibold">
          <Award className="w-3.5 h-3.5 text-amber-400" /> Nearest Location (by Driving Distance)
        </div>
      )}

      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-bold text-white text-base tracking-tight">
            {name}
          </h3>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>{address}, {city}</span>
          </p>
        </div>

        {/* Availability Badge */}
        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border shrink-0 ${statusBadgeClass}`}>
          {available} / {total} Free
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mb-4 border border-slate-800">
        <div
          className="h-full bg-indigo-500 transition-all duration-500"
          style={{ width: `${availabilityPercent}%` }}
        />
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-3 gap-2 text-center py-2.5 px-3 rounded-lg bg-slate-950 border border-slate-800 mb-4 text-xs">
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-semibold">Total</span>
          <span className="font-bold text-slate-200 text-sm">{total}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-semibold">Available</span>
          <span className="font-bold text-emerald-400 text-sm">{available}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-semibold">Occupied</span>
          <span className="font-bold text-rose-400 text-sm">{occupied}</span>
        </div>
      </div>

      {/* Driving Distance & Duration Display */}
      <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-3 mb-4">
        <div className="flex items-center gap-1.5">
          <Navigation className="w-3.5 h-3.5 text-indigo-400" />
          <span>Distance: <strong className="text-slate-200 font-semibold">{distanceText || 'Calculating...'}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Est. Time: <strong className="text-slate-200 font-semibold">{durationText || 'Calculating...'}</strong></span>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
        
        {/* View Slots Inspector */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenSlotsInspector && onOpenSlotsInspector(id);
          }}
          className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
        >
          <Layers className="w-3.5 h-3.5 text-indigo-400" /> View Slots
        </button>

        {/* Reserve Slot Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenReserve && onOpenReserve(parking);
          }}
          className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
        >
          <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Reserve Slot
        </button>

        {/* Navigate with Google Maps */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Navigate
        </a>

      </div>

      {/* Quick Test ESP32 Trigger */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/50 flex items-center justify-between">
        <span className="text-[10px] text-slate-400 flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" /> Test Sensor Post:
        </span>
        <div className="flex gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSimulateESP32 && onSimulateESP32(id, 1, true);
            }}
            className="px-2 py-0.5 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-[10px] font-semibold transition-colors"
          >
            Occupy Slot 1
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSimulateESP32 && onSimulateESP32(id, 1, false);
            }}
            className="px-2 py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-[10px] font-semibold transition-colors"
          >
            Free Slot 1
          </button>
        </div>
      </div>

    </div>
  );
}
