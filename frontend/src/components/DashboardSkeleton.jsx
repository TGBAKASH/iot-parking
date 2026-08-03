import React from 'react';
import ParkingCardSkeleton from './ParkingCardSkeleton';
import { Search, MapPin, SlidersHorizontal, RefreshCw, Plus, Compass } from 'lucide-react';

/**
 * DashboardSkeleton Component (Milestone 3 Version)
 * Controls:
 * - Search box allowing users to search any city worldwide
 * - Displays nearest parking lot based on OSRM driving distance
 * - Interactive parking cards grid with real-time slot states & map inspection
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
  onEditParking,
  onDeleteParking,
  onOpenAddParking,
  user,
  loading,
  nearestParkingId,
}) {
  return (
    <div className="space-y-6">
      
      {/* Search Box & Controls Header */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        
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
              placeholder="Search any city (e.g. San Francisco, San Jose, New York)..."
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-bold text-xs transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        {/* Quick Location & Counter Controls */}
        <div className="flex items-center space-x-3 text-xs text-slate-400 w-full md:w-auto justify-between md:justify-end">
          <button
            onClick={onRequestUserLocation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700 hover:border-cyan-400 text-cyan-300 font-semibold transition-colors"
            title="Use My Live Location"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Use My Location</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Showing: <strong className="text-white">{parkings.length}</strong> Lots</span>
          </div>

          {user && user.role === 'admin' && (
            <button
              onClick={onOpenAddParking}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold transition-all shadow-md"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          )}
        </div>

      </div>

      {/* Parking Cards Grid */}
      {loading ? (
        <div className="p-8 text-center glass-card rounded-2xl border border-slate-800">
          <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Calculating driving routes and fetching parking data...</p>
        </div>
      ) : parkings.length === 0 ? (
        <div className="p-8 text-center glass-card rounded-2xl border border-slate-800 text-slate-400 text-sm">
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
              onEdit={onEditParking}
              onDelete={onDeleteParking}
              onSimulateESP32={onSimulateESP32}
              user={user}
              isNearest={parking.id === nearestParkingId}
            />
          ))}
        </div>
      )}

    </div>
  );
}
