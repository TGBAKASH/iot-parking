import React, { useState, useMemo } from 'react';
import { Search, Compass, Loader2 } from 'lucide-react';
import ParkingCardSkeleton from './ParkingCardSkeleton';

export default function DashboardSkeleton({
  parkings,
  selectedParking,
  onSelectParking,
  searchCity,
  setSearchCity,
  onSearchCitySubmit,
  onRequestUserLocation,
  onSimulateESP32,
  onOpenSlotsInspector,
  loading,
  nearestParkingId,
  userLocation
}) {
  const [sortBy, setSortBy] = useState('Nearest');

  const sortedParkings = useMemo(() => {
    if (!parkings) return [];
    const sorted = [...parkings];
    
    sorted.sort((a, b) => {
      if (sortBy === 'Nearest') {
        const distA = a.rawDistanceMeters || Infinity;
        const distB = b.rawDistanceMeters || Infinity;
        return distA - distB;
      } else if (sortBy === 'Most Available') {
        return (b.available_slots || 0) - (a.available_slots || 0);
      } else if (sortBy === 'Lowest Occupancy') {
        const ratioA = a.total_slots > 0 ? (a.total_slots - a.available_slots) / a.total_slots : 1;
        const ratioB = b.total_slots > 0 ? (b.total_slots - b.available_slots) / b.total_slots : 1;
        return ratioA - ratioB;
      } else if (sortBy === 'Name A-Z') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return 0;
    });
    
    return sorted;
  }, [parkings, sortBy]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <form onSubmit={onSearchCitySubmit} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search parking or city..."
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
          />
        </form>
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRequestUserLocation}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors shadow-sm flex-shrink-0"
            title="Use my location"
          >
            <Compass className="w-5 h-5" />
          </button>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="py-2.5 pl-3 pr-8 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-700 text-sm font-medium"
          >
            <option value="Nearest">Nearest</option>
            <option value="Most Available">Most Available</option>
            <option value="Lowest Occupancy">Lowest Occupancy</option>
            <option value="Name A-Z">Name A-Z</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-emerald-600">
          <Loader2 className="w-10 h-10 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Finding parking locations...</p>
        </div>
      ) : sortedParkings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
          <p className="text-gray-500 text-lg">No parking locations found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedParkings.map((parking) => (
            <ParkingCardSkeleton
              key={parking.id}
              parking={parking}
              onSelect={onSelectParking}
              isSelected={selectedParking?.id === parking.id}
              onOpenSlotsInspector={onOpenSlotsInspector}
              onSimulateESP32={onSimulateESP32}
              isNearest={nearestParkingId === parking.id}
              userLocation={userLocation}
            />
          ))}
        </div>
      )}
    </div>
  );
}
