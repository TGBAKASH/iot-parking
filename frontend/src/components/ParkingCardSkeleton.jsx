import React from 'react';
import { MapPin, Navigation, Clock, Layers, ExternalLink, Star, Calendar, Zap } from 'lucide-react';

export default function ParkingCardSkeleton({ parking, onSelect, isSelected, onOpenSlotsInspector, onOpenReserve, onSimulateESP32, isNearest }) {
  const { id, name, address, city, latitude, longitude, total_slots, available_slots, occupied_slots, distanceText, durationText } = parking;
  const total = parseInt(total_slots, 10) || 1;
  const available = parseInt(available_slots, 10) || 0;
  const occupied = occupied_slots !== undefined ? parseInt(occupied_slots, 10) : total - available;
  const pct = Math.round((available / total) * 100);

  const barColor = pct > 40 ? 'bg-green-500' : pct > 15 ? 'bg-yellow-500' : 'bg-red-500';
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  return (
    <div
      onClick={() => onSelect?.(parking)}
      className={`group relative bg-neutral-900 border rounded-xl p-4 cursor-pointer transition-all duration-200 ${
        isSelected ? 'border-white/30 bg-neutral-800/80' : 'border-neutral-800 hover:border-neutral-700'
      }`}
    >
      {/* Nearest tag */}
      {isNearest && (
        <div className="flex items-center gap-1 text-[11px] font-medium text-yellow-400 mb-2">
          <Star className="w-3 h-3 fill-yellow-400" /> Nearest to you
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-white truncate">{name}</h3>
          <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5 truncate">
            <MapPin className="w-3 h-3 shrink-0" /> {address}, {city}
          </p>
        </div>
        <div className={`shrink-0 px-2 py-0.5 rounded text-[11px] font-semibold ${
          pct > 40 ? 'bg-green-500/10 text-green-400' : pct > 15 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {available}/{total}
        </div>
      </div>

      {/* Progress */}
      <div className="h-1 bg-neutral-800 rounded-full overflow-hidden mb-3">
        <div className={`h-full ${barColor} transition-all duration-500 rounded-full`} style={{ width: `${pct}%` }} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-1 text-center mb-3">
        {[
          { label: 'Total', value: total, color: 'text-neutral-300' },
          { label: 'Free', value: available, color: 'text-green-400' },
          { label: 'Used', value: occupied, color: 'text-red-400' },
          { label: 'Rate', value: `${pct}%`, color: 'text-neutral-300' },
        ].map(s => (
          <div key={s.label}>
            <div className={`text-sm font-semibold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-neutral-600 uppercase">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Distance */}
      <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-3 pb-3 border-b border-neutral-800">
        <span className="flex items-center gap-1"><Navigation className="w-3 h-3" /> {distanceText || '...'}</span>
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {durationText || '...'}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button onClick={e => { e.stopPropagation(); onOpenSlotsInspector?.(id); }}
          className="flex-1 py-1.5 text-[11px] font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors flex items-center justify-center gap-1">
          <Layers className="w-3 h-3" /> Slots
        </button>
        <button onClick={e => { e.stopPropagation(); onOpenReserve?.(parking); }}
          className="flex-1 py-1.5 text-[11px] font-medium text-green-400 bg-green-500/10 hover:bg-green-500/20 rounded-lg transition-colors flex items-center justify-center gap-1">
          <Calendar className="w-3 h-3" /> Reserve
        </button>
        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
          className="py-1.5 px-2.5 text-[11px] font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-1">
          <ExternalLink className="w-3 h-3" /> Go
        </a>
      </div>

      {/* ESP32 test (small) */}
      <div className="mt-2.5 pt-2.5 border-t border-neutral-800/60 flex items-center justify-between">
        <span className="text-[10px] text-neutral-600 flex items-center gap-1"><Zap className="w-3 h-3" /> Test sensor:</span>
        <div className="flex gap-1">
          <button onClick={e => { e.stopPropagation(); onSimulateESP32?.(id, 1, true); }}
            className="px-2 py-0.5 text-[10px] font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded transition-colors">Occupy</button>
          <button onClick={e => { e.stopPropagation(); onSimulateESP32?.(id, 1, false); }}
            className="px-2 py-0.5 text-[10px] font-medium text-green-400 bg-green-500/10 hover:bg-green-500/20 rounded transition-colors">Free</button>
        </div>
      </div>
    </div>
  );
}
