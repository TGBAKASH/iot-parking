import React from 'react';
import { Car, Radio, Shield, MapPin, UserCheck, RefreshCw, LogIn, LogOut, Plus, BarChart3 } from 'lucide-react';

/**
 * Navbar Component
 * Displays system header, live WebSockets status badge, user auth state, and admin actions.
 */
export default function Navbar({
  isConnected,
  user,
  onOpenAuth,
  onLogout,
  onOpenAddParking,
  onRefresh,
}) {
  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-800 px-4 lg:px-8 py-3">
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

        {/* Controls & User Account Actions */}
        <div className="flex items-center space-x-3">
          
          {/* WebSockets Status Badge */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs">
            <Radio className={`w-4 h-4 ${isConnected ? 'text-emerald-400 live-pulse' : 'text-amber-500'}`} />
            <span className="font-semibold text-slate-300 hidden sm:inline">
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

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
            title="Refresh Database Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Analytics Dashboard Trigger */}
          <button
            onClick={onOpenAnalytics}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors"
            title="Open Analytics Dashboard"
          >
            <BarChart3 className="w-4 h-4 text-cyan-400" /> <span className="hidden md:inline">Analytics</span>
          </button>

          {/* Add Parking Location Button (Admin Only) */}
          {user && user.role === 'admin' && (
            <button
              onClick={onOpenAddParking}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Parking
            </button>
          )}

          {/* User Account / Login State */}
          {user ? (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold hidden sm:inline">{user.name}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-900/60 uppercase font-bold text-cyan-200">
                  {user.role}
                </span>
              </div>

              <button
                onClick={onLogout}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors"
            >
              <LogIn className="w-4 h-4 text-cyan-400" /> Sign In
            </button>
          )}

        </div>
      </div>
    </header>
  );
}
