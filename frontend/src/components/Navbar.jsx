import React from 'react';
import { Car, Radio, User, LogIn, LogOut, Plus, BarChart3, RefreshCw } from 'lucide-react';

/**
 * Navbar Component (Clean, Simple Human Design)
 * Clean header with live status dot, email login button, and controls.
 */
export default function Navbar({
  isConnected,
  user,
  onOpenAuth,
  onLogout,
  onOpenAddParking,
  onOpenAnalytics,
  onRefresh,
}) {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-sm">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">
              Smart Parking Hub
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              IoT Real-Time Availability
            </p>
          </div>
        </div>

        {/* Action Controls & User Auth */}
        <div className="flex items-center space-x-2.5">
          
          {/* Live Socket Status Dot */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-slate-300 font-medium hidden sm:inline">
              {isConnected ? 'Live Connected' : 'Connecting...'}
            </span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Analytics Trigger */}
          <button
            onClick={onOpenAnalytics}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700/60 transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Analytics</span>
          </button>

          {/* Add Parking (Admin Only) */}
          {user && user.role === 'admin' && (
            <button
              onClick={onOpenAddParking}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Lot
            </button>
          )}

          {/* User Email Login / Profile Badge */}
          {user ? (
            <div className="flex items-center space-x-1.5">
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-semibold hidden sm:inline">{user.email || user.name}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-300 font-bold uppercase">
                  {user.role}
                </span>
              </div>

              <button
                onClick={onLogout}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700/60"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              <LogIn className="w-4 h-4" /> Sign In
            </button>
          )}

        </div>
      </div>
    </header>
  );
}
