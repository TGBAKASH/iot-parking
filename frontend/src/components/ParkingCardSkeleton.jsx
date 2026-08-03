import React from 'react';
import { MapPin, Navigation, Clock, Layers, Zap, ExternalLink, Award, Calendar } from 'lucide-react';

/**
 * ParkingCardSkeleton Component (Overhauled Premium Design)
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

  let badgeClass = 'badge-available';
  let statusText = 'High Availability';
  if (availabilityPercent < 20) {
    badgeClass = 'badge-full';
    statusText = 'Nearly Full';
  } else if (availabilityPercent < 50) {
    badgeClass = 'badge-limited';
    statusText = 'Limited Space';
  }

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  return (
    <div
      onClick={() => onSelect && onSelect(parking)}
      className={`card-premium p-5 cursor-pointer relative overflow-hidden transition-all ${
        isSelected
          ? 'ring-2 ring-blue-500 border-blue-500 bg-slate-900 shadow-xl'
          : 'bg-slate-900/90 hover:border-slate-700'
      }`}
    >
      {/* Nearest Badge Header */}
      {isNearest && (
        <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
          <Award className="w-3.5 h-3.5 text-amber-400" /> Nearest Location (OSRM Driving Machine)
        </div>
      )}

      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-extrabold text-white text-base tracking-tight group-hover:text-blue-400 transition-colors">
            {name}
          </h3>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 font-medium">
            <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>{address}, {city}</span>
          </p>
        </div>

        {/* Availability Badge */}
        <div className="flex flex-col items-end shrink-0">
          <span className={`px-3 py-1 rounded-xl text-xs font-bold ${badgeClass}`}>
            {available} / {total} Free
          </span>
          <span className="text-[10px] text-slate-400 font-semibold mt-1">{statusText}</span>
        </div>
      </div>

      {/* Modern Segmented Progress Bar */}
      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mb-4 border border-slate-800 p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            availabilityPercent > 40 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-amber-500 to-rose-500'
          }`}
          style={{ width: `${availabilityPercent}%` }}
        />
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-3 gap-2 text-center py-2.5 px-3 rounded-xl bg-slate-950/80 border border-slate-800/80 mb-4 text-xs">
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Total</span>
          <span className="font-extrabold text-slate-200 text-sm">{total}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Available</span>
          <span className="font-extrabold text-emerald-400 text-sm">{available}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Occupied</span>
          <span className="font-extrabold text-rose-400 text-sm">{occupied}</span>
        </div>
      </div>

      {/* Driving Distance & Duration Display */}
      <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3 mb-4">
        <div className="flex items-center gap-1.5">
          <Navigation className="w-3.5 h-3.5 text-blue-400" />
          <span>Distance: <strong className="text-slate-200 font-bold">{distanceText || 'Calculating...'}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Est. Time: <strong className="text-slate-200 font-bold">{durationText || 'Calculating...'}</strong></span>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
        
        {/* View Slots Inspector */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenSlotsInspector && onOpenSlotsInspector(id);
          }}
          className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Layers className="w-3.5 h-3.5 text-blue-400" /> Slots
        </button>

        {/* Reserve Slot Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenReserve && onOpenReserve(parking);
          }}
          className="flex-1 py-2 px-3 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Reserve
        </button>

        {/* Navigate with Google Maps */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold transition-all flex items-center gap-1 shadow-md shadow-blue-500/20"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Navigate
        </a>

      </div>

      {/* Quick Test ESP32 Trigger */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/50 flex items-center justify-between">
        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" /> Test Sensor Post:
        </span>
        <div className="flex gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSimulateESP32 && onSimulateESP32(id, 1, true);
            }}
            className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-[10px] font-bold transition-all"
          >
            Occupy Slot 1
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSimulateESP32 && onSimulateESP32(id, 1, false);
            }}
            className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-[10px] font-bold transition-all"
          >
            Free Slot 1
          </button>
        </div>
      </div>

    </div>
  );
}
