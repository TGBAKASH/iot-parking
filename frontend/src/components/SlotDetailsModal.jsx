import React, { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { parkingService } from '../services/api';

export default function SlotDetailsModal({ parkingId, isOpen, onClose, onSlotStateChanged }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && parkingId) {
      fetchSlots();
    }
  }, [isOpen, parkingId]);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await parkingService.getParkingById(parkingId);
      const data = res.data || res;
      setSlots(data.slots || []);
    } catch (err) {
      setError('Failed to load slots');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl relative flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 shrink-0">
          <h2 className="text-sm font-medium text-neutral-200">Slot Inspector</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchSlots}
              disabled={loading}
              className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto">
          {error && <div className="text-red-400 text-sm mb-4">{error}</div>}
          
          {loading && !slots.length ? (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 border-2 border-neutral-600 border-t-neutral-300 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {slots.map((slot) => {
                const isFree = !slot.is_occupied;
                return (
                  <div
                    key={slot.id || slot.slot_number}
                    className={`flex flex-col p-3 rounded-lg border text-xs ${
                      isFree 
                        ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}
                  >
                    <div className="font-medium mb-1">Slot {slot.slot_number}</div>
                    <div className="opacity-80">{isFree ? 'Free' : 'Occupied'}</div>
                    {slot.last_updated && (
                      <div className="text-[10px] opacity-60 mt-2 truncate" title={slot.last_updated}>
                        {new Date(slot.last_updated).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {!loading && slots.length === 0 && !error && (
            <div className="text-center py-10 text-neutral-500 text-sm">
              No slots found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
