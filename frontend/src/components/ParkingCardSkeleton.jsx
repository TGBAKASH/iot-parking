import React from 'react';
import { MapPin, Navigation, Clock, ExternalLink, Star } from 'lucide-react';

export default function ParkingCardSkeleton({ parking, onSelect, isSelected, onOpenSlotsInspector, onOpenReserve, onSimulateESP32, isNearest }) {
  const { id, name, address, city, latitude, longitude, total_slots, available_slots, distanceText, durationText } = parking;
  const total = parseInt(total_slots, 10) || 1;
  const available = parseInt(available_slots, 10) || 0;
  const pct = Math.round((available / total) * 100);

  const statusColor = pct > 40 ? 'text-green-400' : pct > 15 ? 'text-yellow-400' : 'text-red-400';
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  return (
    <div
      onClick={() => onSelect?.(parking)}
      className={`group p-4 rounded-xl cursor-pointer transition-all duration-150 border ${
        isSelected ? 'bg-neutral-800 border-neutral-600' : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
      }`}
    >
      {/* Nearest tag */}
      {isNearest && (
        <div className="flex items-center gap-1 text-[11px] font-medium text-yellow-400 mb-2">
          <Star className="w-3 h-3 fill-yellow-400" /> Nearest
        </div>
      )}

      {/* Name + availability */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-white truncate">{name}</h3>
          <p className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5 truncate">
            <MapPin className="w-3 h-3 shrink-0" /> {address}, {city}
          </p>
        </div>
        <span className={`text-sm font-semibold ${statusColor} shrink-0`}>{available}/{total}</span>
      </div>

      {/* Distance + time */}
      <div className="flex items-center gap-4 text-[11px] text-neutral-500 mb-3">
        <span className="flex items-center gap-1"><Navigation className="w-3 h-3" /> {distanceText || '—'}</span>
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {durationText || '—'}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button onClick={e => { e.stopPropagation(); onOpenSlotsInspector?.(id); }}
          className="flex-1 py-1.5 text-[11px] font-medium text-neutral-400 hover:text-neutral-200 bg-neutral-800 hover:bg-neutral-750 rounded-lg transition-colors">
          Slots
        </button>
        <button onClick={e => { e.stopPropagation(); onOpenReserve?.(parking); }}
          className="flex-1 py-1.5 text-[11px] font-medium text-green-400 hover:text-green-300 bg-neutral-800 hover:bg-neutral-750 rounded-lg transition-colors">
          Reserve
        </button>
        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
          className="py-1.5 px-3 text-[11px] font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-1">
          <ExternalLink className="w-3 h-3" /> Go
        </a>
      </div>
    </div>
  );
}
