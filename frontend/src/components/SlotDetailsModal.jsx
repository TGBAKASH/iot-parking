import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { parkingService } from '../services/api';

export default function SlotDetailsModal({ parkingId, isOpen, onClose, onSlotStateChanged }) {
  const [parking, setParking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && parkingId) {
      setLoading(true);
      setError(null);
      parkingService.getParkingById(parkingId)
        .then(res => {
          setParking(res.data);
          setLoading(false);
        })
        .catch(err => {
          setError('Failed to load parking details');
          setLoading(false);
        });
    }
  }, [isOpen, parkingId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">
            {parking ? parking.name : 'Loading...'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto">
          {loading && <div className="text-center py-8 text-gray-500">Loading slots...</div>}
          
          {error && <div className="text-center py-8 text-red-500">{error}</div>}

          {parking && !loading && !error && (
            <>
              <div className="flex justify-between items-center mb-6 px-2">
                <div className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-900">{parking.available_slots}</span> / {parking.total_slots} Slots Available
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {parking.slots?.map(slot => {
                  const isFree = !slot.is_occupied;
                  return (
                    <div
                      key={slot.id}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-colors ${
                        isFree 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                          : 'bg-red-50 border-red-200 text-red-700'
                      }`}
                    >
                      <div className="font-bold text-lg mb-1">#{slot.slot_number}</div>
                      <div className="flex items-center text-xs font-medium uppercase tracking-wider">
                        {isFree ? (
                          <>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                            Free
                          </>
                        ) : (
                          <>
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5" />
                            Occupied
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {(!parking.slots || parking.slots.length === 0) && (
                <div className="text-center py-8 text-gray-500">No slots information available.</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
