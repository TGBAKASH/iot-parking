import React from 'react';
import { Car, Radio, Shield, MapPin, UserCheck, RefreshCw } from 'lucide-react';

/**
 * Navbar Component
 * Displays system header, live WebSockets status badge, user auth status, and search trigger.
 */
export default function Navbar({ isConnected, user, onRefresh }) {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/20">
            <Car className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Smart Parking Hub
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              IoT Real-Time Parking Availability System
            </p>
          </div>
        </div>

        {/* Status Indicators & Action Buttons */}
        <div className="flex items-center space-x-4">
          
          {/* WebSockets Real-Time Status Badge */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs">
            <Radio className={`w-4 h-4 ${isConnected ? 'text-emerald-400 live-pulse' : 'text-amber-500'}`} />
            <span className="font-semibold text-slate-300">
              {isConnected ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
                  Live WebSockets
                </span>
              ) : (
                <span className="text-amber-400">Connecting...</span>
              )}
            </span>
          </div>

          {/* Refresh Data Button */}
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
            title="Refresh Parking Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* User Auth Info / Badge */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300">
            <UserCheck className="w-4 h-4 text-cyan-400" />
            <span className="font-medium hidden sm:inline">{user ? user.name : 'Guest User'}</span>
          </div>

        </div>
      </div>
    </header>
  );
}
