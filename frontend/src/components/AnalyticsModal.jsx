import React, { useState, useEffect } from 'react';
import { X, BarChart3 } from 'lucide-react';
import { analyticsService } from '../services/api';

export default function AnalyticsModal({ isOpen, onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchAnalytics();
    }
  }, [isOpen]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await analyticsService.getSummary();
      setStats(res.data || res || {});
    } catch (err) {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl relative flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-2 text-neutral-200">
            <BarChart3 className="w-4 h-4 text-neutral-400" />
            <h2 className="text-sm font-medium">System Analytics</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {error && <div className="text-red-400 text-sm mb-4">{error}</div>}

          {loading && !stats ? (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 border-2 border-neutral-600 border-t-neutral-300 rounded-full animate-spin" />
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 flex flex-col gap-1">
                <span className="text-xs text-neutral-400">Total Parkings</span>
                <span className="text-xl font-medium text-neutral-200">{stats.totalLocations || 0}</span>
              </div>
              <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 flex flex-col gap-1">
                <span className="text-xs text-neutral-400">Total Slots</span>
                <span className="text-xl font-medium text-neutral-200">{stats.totalCapacity || 0}</span>
              </div>
              <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 flex flex-col gap-1">
                <span className="text-xs text-neutral-400">Available Slots</span>
                <span className="text-xl font-medium text-green-400">{stats.totalAvailable || 0}</span>
              </div>
              <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 flex flex-col gap-1">
                <span className="text-xs text-neutral-400">Occupancy Rate</span>
                <span className="text-xl font-medium text-neutral-200">
                  {stats.occupancyRate !== undefined ? `${stats.occupancyRate}%` : '0%'}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
