import React from 'react';
import { MapPin, Navigation, Clock, Star, Wifi, LayoutGrid } from 'lucide-react';

export default function ParkingCardSkeleton({
  parking,
  onSelect,
  isSelected,
  onOpenSlotsInspector,
  onSimulateESP32,
  isNearest,
  userLocation
}) {
  const { id, name, address, city, latitude, longitude, total_slots, available_slots, distanceText, durationText } = parking;

  const availabilityRatio = total_slots > 0 ? available_slots / total_slots : 0;
  let availabilityColor = 'text-red-600 bg-red-50';
  if (availabilityRatio > 0.4) {
    availabilityColor = 'text-emerald-600 bg-emerald-50';
  } else if (availabilityRatio >= 0.15) {
    availabilityColor = 'text-yellow-600 bg-yellow-50';
  }

  // Build Google Maps URL with explicit origin + destination
  const originParam = userLocation ? `&origin=${userLocation.lat},${userLocation.lng}` : '';
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1${originParam}&destination=${latitude},${longitude}&travelmode=driving`;

  return (
    <div 
      onClick={() => onSelect && onSelect(parking)}
      className={`bg-white rounded-xl shadow-sm border p-4 transition-all cursor-pointer ${
        isSelected ? 'ring-2 ring-emerald-500 border-emerald-200' : 'border-gray-200 hover:border-emerald-300'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap gap-2">
            {isNearest && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                <Star className="w-3 h-3 fill-current" />
                Nearest
              </span>
            )}
            {id === 1 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                <Wifi className="w-3 h-3" />
                IoT Live
              </span>
            )}
          </div>
          <h3 className="text-gray-900 font-medium text-lg leading-tight">{name}</h3>
          <p className="flex items-start gap-1 text-gray-500 text-xs">
            <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span className="line-clamp-2">{address}, {city}</span>
          </p>
        </div>
        
        <div className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg ${availabilityColor}`}>
          <span className="text-xl font-bold leading-none">{available_slots}</span>
          <span className="text-[10px] font-medium uppercase tracking-wider opacity-80 mt-1">/ {total_slots} left</span>
        </div>
      </div>

      {(distanceText || durationText) && (
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-600 bg-gray-50 p-2.5 rounded-lg">
          {distanceText && (
            <div className="flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-gray-400" />
              <span>{distanceText}</span>
            </div>
          )}
          {durationText && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{durationText}</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenSlotsInspector && onOpenSlotsInspector(id);
          }}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
        >
          <LayoutGrid className="w-4 h-4" />
          Slots
        </button>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
        >
          <Navigation className="w-4 h-4" />
          Navigate
        </a>
      </div>
    </div>
  );
}
