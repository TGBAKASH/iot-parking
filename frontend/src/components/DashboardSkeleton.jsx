import React, { useState, useMemo } from 'react';
import { Search, Compass } from 'lucide-react';
import ParkingCardSkeleton from './ParkingCardSkeleton';

export default function DashboardSkeleton({
  parkings = [],
  selectedParking,
  onSelectParking,
  searchCity,
  setSearchCity,
  onSearchCitySubmit,
  onRequestUserLocation,
  onSimulateESP32,
  onOpenSlotsInspector,
  onOpenReserve,
  loading,
  nearestParkingId
}) {
  const [sortBy, setSortBy] = useState('Nearest');

  const sortedParkings = useMemo(() => {
    let sorted = [...parkings];
    if (sortBy === 'Nearest') {
      sorted.sort((a, b) => (a.rawDistanceMeters || 0) - (b.rawDistanceMeters || 0));
    } else if (sortBy === 'Most Available') {
      sorted.sort((a, b) => (b.available_slots || 0) - (a.available_slots || 0));
    } else if (sortBy === 'Lowest Occupancy') {
      sorted.sort((a, b) => {
        const occA = a.total_slots ? ((a.total_slots - a.available_slots) / a.total_slots) : 0;
        const occB = b.total_slots ? ((b.total_slots - b.available_slots) / b.total_slots) : 0;
        return occA - occB;
      });
    } else if (sortBy === 'Name A-Z') {
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    return sorted;
  }, [parkings, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearchCitySubmit?.(searchCity);
  };

  return (
    <div className="flex flex-col gap-6 w-full text-neutral-200">
      <div className="flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            placeholder="Search parking or city..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-neutral-700 transition-colors placeholder-neutral-600"
          />
        </form>
        <div className="flex gap-2">
          <button
            onClick={onRequestUserLocation}
            className="flex items-center justify-center p-2 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800 transition-colors"
            title="Use my location"
          >
            <Compass className="w-4 h-4 text-neutral-400" />
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-neutral-700 transition-colors appearance-none"
          >
            <option value="Nearest">Nearest</option>
            <option value="Most Available">Most Available</option>
            <option value="Lowest Occupancy">Lowest Occupancy</option>
            <option value="Name A-Z">Name A-Z</option>
          </select>
        </div>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-6 h-6 border-2 border-neutral-600 border-t-neutral-300 rounded-full animate-spin" />
          </div>
        ) : sortedParkings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sortedParkings.map((parking) => (
              <ParkingCardSkeleton
                key={parking.id}
                parking={parking}
                isSelected={selectedParking?.id === parking.id}
                isNearest={nearestParkingId === parking.id}
                onSelect={onSelectParking}
                onSimulateESP32={onSimulateESP32}
                onOpenSlotsInspector={onOpenSlotsInspector}
                onOpenReserve={onOpenReserve}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-neutral-500 text-sm">
            No parkings found.
          </div>
        )}
      </div>
    </div>
  );
}
