import React, { useState } from 'react';
import ParkingCardSkeleton from './ParkingCardSkeleton';
import { Search, MapPin, SlidersHorizontal, RefreshCw, Compass, ArrowUpDown } from 'lucide-react';

/**
 * DashboardSkeleton Component (Clean Modern Design + Sort Options)
 * Features:
 * - Sort options dropdown (Nearest, Most Available, Lowest Occupancy, Alphabetical)
 * - City search input
 * - GPS location detection button
 */
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
  onOpenReserve,
  loading,
  nearestParkingId,
}) {
  const [sortBy, setSortBy] = useState('nearest');

  // Sort parking locations based on selected option
  const sortedParkings = [...parkings].sort((a, b) => {
    if (sortBy === 'nearest') {
      const distA = a.rawDistanceMeters !== undefined ? a.rawDistanceMeters : Infinity;
      const distB = b.rawDistanceMeters !== undefined ? b.rawDistanceMeters : Infinity;
      return distA - distB;
    }
    if (sortBy === 'available') {
      return (parseInt(b.available_slots, 10) || 0) - (parseInt(a.available_slots, 10) || 0);
    }
    if (sortBy === 'occupancy') {
      const rateA = (parseInt(a.occupied_slots || (a.total_slots - a.available_slots), 10) / a.total_slots) || 0;
      const rateB = (parseInt(b.occupied_slots || (b.total_slots - b.available_slots), 10) / b.total_slots) || 0;
      return rateA - rateB;
    }
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  return (
    <div className="space-y-5">
      
      {/* Search Box & Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
        
        {/* City Search Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearchCitySubmit && onSearchCitySubmit(searchCity);
          }}
          className="relative w-full md:w-80 flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search city (e.g. San Francisco, San Jose)..."
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        {/* Controls: Sort Dropdown & GPS Detect Button */}
        <div className="flex items-center space-x-2 text-xs text-slate-300 w-full md:w-auto justify-between md:justify-end">
          
          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400 hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer text-xs"
            >
              <option value="nearest" className="bg-slate-900 text-white">Nearest (Driving)</option>
              <option value="available" className="bg-slate-900 text-white">Most Free Slots</option>
              <option value="occupancy" className="bg-slate-900 text-white">Lowest Occupancy</option>
              <option value="name" className="bg-slate-900 text-white">Name (A-Z)</option>
            </select>
          </div>

          {/* Detect GPS Location Button */}
          <button
            onClick={onRequestUserLocation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 text-indigo-400 font-medium transition-colors"
            title="Use My GPS Location"
          >
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Use GPS</span>
          </button>

        </div>

      </div>

      {/* Parking Cards Grid */}
      {loading ? (
        <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800">
          <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading live parking locations...</p>
        </div>
      ) : sortedParkings.length === 0 ? (
        <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-400 text-sm">
          No parking locations found matching "{searchCity}". Try searching another city!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedParkings.map((parking) => (
            <ParkingCardSkeleton
              key={parking.id}
              parking={parking}
              isSelected={selectedParking?.id === parking.id}
              onSelect={onSelectParking}
              onOpenSlotsInspector={onOpenSlotsInspector}
              onOpenReserve={onOpenReserve}
              onSimulateESP32={onSimulateESP32}
              isNearest={parking.id === nearestParkingId}
            />
          ))}
        </div>
      )}

    </div>
  );
}
