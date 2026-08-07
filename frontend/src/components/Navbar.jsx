import React from 'react';
import { Car, RefreshCw, LogIn, LogOut } from 'lucide-react';

export default function Navbar({ isConnected, user, onOpenAuth, onLogout, onOpenAnalytics, onRefresh }) {
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Car className="text-emerald-500 w-6 h-6" />
          <span className="text-emerald-600 font-bold text-lg">Smart Parking</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5" title={isConnected ? 'Connected' : 'Disconnected'}>
            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-500 hidden sm:inline">{isConnected ? 'Live' : 'Offline'}</span>
          </div>
          {onRefresh && (
            <button onClick={onRefresh} className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <div className="h-6 w-px bg-gray-200 mx-1"></div>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700 hidden sm:inline">{user.email}</span>
              <button onClick={onLogout} className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button onClick={onOpenAuth} className="flex items-center gap-1.5 text-sm font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-lg transition-colors">
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
