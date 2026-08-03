import React from 'react';
import { MapPin, Navigation, Compass, Layers } from 'lucide-react';

/**
 * MapSkeleton Component
 * Placeholder component for Google Maps in Milestone 1.
 * Will be upgraded to full Google Maps API with markers, custom info popups,
 * and Google Routes API distance calculator in Milestone 3.
 */
export default function MapSkeleton({ selectedParking, userLocation }) {
  return (
    <div className="relative w-full h-[450px] lg:h-full rounded-2xl overflow-hidden glass-card border border-slate-800 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-6 text-center shadow-2xl">
      
      {/* Background Decorative Grid */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{
          backgroundImage: `radial-gradient(#38bdf8 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }} 
      />

      {/* Map Icon Overlay */}
      <div className="relative z-10 p-5 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl mb-4 group hover:scale-105 transition-transform duration-300">
        <div className="relative">
          <MapPin className="w-12 h-12 text-cyan-400 animate-bounce" />
          <Navigation className="w-6 h-6 text-emerald-400 absolute -top-2 -right-2 transform rotate-45" />
        </div>
      </div>

      {/* Title & Info */}
      <h3 className="relative z-10 text-lg font-bold text-slate-200 mb-1">
        Google Maps Interactive Container
      </h3>
      <p className="relative z-10 text-xs text-slate-400 max-w-sm mb-4">
        Displays real-time parking markers, current location GPS, city search geocoding, and Google Routes API driving distance.
      </p>

      {/* Milestone Status Pill */}
      <div className="relative z-10 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-xs text-cyan-300 font-medium">
        <Layers className="w-3.5 h-3.5 text-cyan-400" />
        <span>Milestone 1 Map Container Ready & Configured</span>
      </div>

      {selectedParking && (
        <div className="relative z-10 mt-6 p-3 rounded-xl bg-slate-900/90 border border-slate-700 text-left text-xs max-w-xs w-full">
          <div className="text-slate-400 mb-1">Selected Location:</div>
          <div className="font-semibold text-white">{selectedParking.name}</div>
          <div className="text-slate-400 text-[11px] mt-0.5">{selectedParking.address}</div>
        </div>
      )}
    </div>
  );
}
