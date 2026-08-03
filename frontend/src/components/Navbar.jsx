import React from 'react';
import { Car, User, LogIn, LogOut, BarChart3, RefreshCw } from 'lucide-react';

export default function Navbar({ isConnected, user, onOpenAuth, onLogout, onOpenAnalytics, onRefresh }) {
  return (
    <nav className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur border-b border-neutral-800">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center gap-2.5">
          <Car className="w-5 h-5 text-white" />
          <span className="text-sm font-semibold text-white">Smart Parking</span>
          <span className={`ml-1 w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button onClick={onRefresh} className="p-2 text-neutral-400 hover:text-white transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={onOpenAnalytics} className="p-2 text-neutral-400 hover:text-white transition-colors" title="Analytics">
            <BarChart3 className="w-4 h-4" />
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400 hidden sm:block">{user.email}</span>
              <button onClick={onLogout} className="p-2 text-neutral-400 hover:text-white transition-colors" title="Sign out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={onOpenAuth} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-white/10 hover:bg-white/15 rounded-lg transition-colors">
              <LogIn className="w-3.5 h-3.5" /> Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
