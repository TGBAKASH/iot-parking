import React from 'react';
import ParkingCardSkeleton from './ParkingCardSkeleton';
import { Search, MapPin, SlidersHorizontal, RefreshCw, Compass } from 'lucide-react';

/**
 * DashboardSkeleton Component (Clean Public Driver Interface)
 * 100% Confidential - Zero Admin references in public UI.
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
  return (
    <div className="space-y-6">
      
      {/* Search Box & Action Controls */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* City Search Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearchCitySubmit && onSearchCitySubmit(searchCity);
          }}
          className="relative w-full md:w-96 flex items-center gap-2"
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

        {/* Location & Summary Controls */}
        <div className="flex items-center space-x-2.5 text-xs text-slate-400 w-full md:w-auto justify-between md:justify-end">
          <button
            onClick={onRequestUserLocation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500 text-indigo-400 font-medium transition-colors"
            title="Use My Live Location"
          >
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Use My Location</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-medium">
            <span>Showing: <strong className="text-white">{parkings.length}</strong> Locations</span>
          </div>
        </div>

      </div>

      {/* Parking Cards Grid */}
      {loading ? (
        <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800">
          <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading live parking data from Neon PostgreSQL database...</p>
        </div>
      ) : parkings.length === 0 ? (
        <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-400 text-sm">
          No parking locations found matching "{searchCity}". Try searching another city!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {parkings.map((parking) => (
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
