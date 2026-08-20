import React from 'react';
import { MapPin, Navigation, Clock, Star, Wifi, LayoutGrid, ExternalLink } from 'lucide-react';

export default function ParkingCardSkeleton({
  parking,
  onSelect,
  onStartNavigation,
  isSelected,
  isNavigating,
  onOpenSlotsInspector,
  onSimulateESP32,
  isNearest,
  userLocation
}) {
  const { id, name, address, city, latitude, longitude, total_slots, available_slots, distanceText, durationText } = parking;

  const total = parseInt(total_slots, 10) || 1;
  const available = parseInt(available_slots, 10) || 0;
  const availabilityRatio = total > 0 ? available / total : 0;
  
  let availabilityColor = 'text-red-700 bg-red-50 border-red-200';
  let badgeColor = 'bg-red-500';
  if (availabilityRatio > 0.4) {
    availabilityColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    badgeColor = 'bg-emerald-500';
  } else if (availabilityRatio >= 0.15) {
    availabilityColor = 'text-amber-700 bg-amber-50 border-amber-200';
    badgeColor = 'bg-amber-500';
  }

  // Build Google Maps URL with origin and destination
  const originParam = userLocation ? `&origin=${userLocation.lat},${userLocation.lng}` : '';
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1${originParam}&destination=${latitude},${longitude}&travelmode=driving`;

  return (
    <div 
      onClick={() => onSelect && onSelect(parking)}
      className={`bg-white rounded-xl shadow-sm border p-4 transition-all cursor-pointer relative ${
        isNavigating
          ? 'ring-2 ring-emerald-600 border-emerald-400 bg-emerald-50/20 shadow-md'
          : isSelected
          ? 'ring-2 ring-emerald-500 border-emerald-300'
          : 'border-gray-200 hover:border-emerald-300 hover:shadow'
      }`}
    >
      {isNavigating && (
        <div className="absolute -top-2.5 right-4 bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
          <Navigation className="w-2.5 h-2.5 animate-pulse" /> Active Navigation
        </div>
      )}

      <div className="flex justify-between items-start mb-2.5">
        <div className="flex flex-col gap-1.5 flex-1 pr-2">
          <div className="flex flex-wrap gap-1.5">
            {isNearest && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                Nearest
              </span>
            )}
            {id === 1 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Wifi className="w-3 h-3 text-emerald-600" />
                IoT Live
              </span>
            )}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
              {city}
            </span>
          </div>

          <h3 className="text-gray-900 font-bold text-base leading-snug mt-0.5">{name}</h3>
          <p className="flex items-start gap-1 text-gray-500 text-xs">
            <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" />
            <span className="line-clamp-1">{address}</span>
          </p>
        </div>
        
        {/* Live Slot Counter Card */}
        <div className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg border ${availabilityColor} shadow-sm shrink-0 min-w-[70px]`}>
          <span className="text-xl font-black leading-none">{available}</span>
          <span className="text-[10px] font-extrabold uppercase tracking-wider mt-1 opacity-90">/ {total} left</span>
        </div>
      </div>

      {(distanceText || durationText) && (
        <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50/80 border border-gray-100 px-3 py-2 rounded-lg my-3">
          <div className="flex items-center gap-1.5 font-medium">
            <Navigation className="w-3.5 h-3.5 text-emerald-600" />
            <span>{distanceText || 'Calculating...'}</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span>{durationText || 'Calculating...'}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenSlotsInspector && onOpenSlotsInspector(id);
          }}
          className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-semibold text-xs transition-colors"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          Slots ({available})
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onStartNavigation) onStartNavigation(parking);
          }}
          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg font-semibold text-xs transition-colors shadow-sm"
        >
          <Navigation className="w-3.5 h-3.5" />
          {isNavigating ? 'Navigating...' : 'Navigate'}
        </button>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-emerald-700 rounded-lg transition-colors"
          title="Open in Google Maps App"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
