import React from 'react';
import { Car, Radio, User, LogIn, LogOut, BarChart3, RefreshCw, Zap } from 'lucide-react';

/**
 * Navbar Component (Ultra-Modern Premium Header)
 */
export default function Navbar({
  isConnected,
  user,
  onOpenAuth,
  onLogout,
  onOpenAnalytics,
  onRefresh,
}) {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3.5 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl text-white shadow-md shadow-blue-500/20">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white tracking-tight">
                Smart Parking Hub
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                v2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              IoT Real-Time Telemetry & Slot Reservations
            </p>
          </div>
        </div>

        {/* Action Controls & User Auth */}
        <div className="flex items-center space-x-3">
          
          {/* Live Socket Status Dot */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500' : 'bg-amber-500'}`} />
            <span className="text-slate-300 font-semibold hidden sm:inline">
              {isConnected ? 'Live Telemetry' : 'Connecting...'}
            </span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 transition-all border border-slate-800 hover:border-slate-700 shadow-sm"
            title="Refresh Live Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Analytics Trigger */}
          <button
            onClick={onOpenAnalytics}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs border border-slate-800 hover:border-blue-500/50 transition-all shadow-sm"
          >
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Analytics</span>
          </button>

          {/* User Email Profile / Sign In */}
          {user ? (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-xs">
                  {user.email ? user.email[0].toUpperCase() : 'U'}
                </div>
                <span className="font-semibold hidden sm:inline">{user.email || user.name}</span>
              </div>

              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all border border-slate-800"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20"
            >
              <LogIn className="w-4 h-4" /> Sign In
            </button>
          )}

        </div>
      </div>
    </header>
  );
}
