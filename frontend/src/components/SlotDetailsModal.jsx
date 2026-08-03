import React, { useState, useEffect } from 'react';
import { X, Car, CheckCircle2, XCircle, Zap, RefreshCw, Layers } from 'lucide-react';
import { parkingService } from '../services/api';

/**
 * SlotDetailsModal Component
 * Displays live status of every individual slot (Slot 1, Slot 2, etc.) for a selected parking lot.
 * Allows interactive ESP32 sensor simulation toggling for testing real-time WebSockets.
 */
export default function SlotDetailsModal({ parkingId, isOpen, onClose, onSlotStateChanged }) {
  const [parkingDetails, setParkingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingSlot, setUpdatingSlot] = useState(null);

  const fetchDetails = async () => {
    if (!parkingId) return;
    try {
      setLoading(true);
      const res = await parkingService.getParkingById(parkingId);
      if (res.success && res.data) {
        setParkingDetails(res.data);
      }
    } catch (err) {
      console.error('Error fetching parking slot details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && parkingId) {
      fetchDetails();
    }
  }, [parkingId, isOpen]);

  if (!isOpen) return null;

  const handleToggleSlot = async (slotNumber, currentOccupied) => {
    try {
      setUpdatingSlot(slotNumber);
      const nextOccupiedState = !currentOccupied;
      
      // Send ESP32 sensor update HTTP POST request
      await parkingService.updateParkingFromESP32({
        parking_id: parkingId,
        slot_number: slotNumber,
        is_occupied: nextOccupiedState,
      });

      // Refetch latest state from Neon DB
      await fetchDetails();

      if (onSlotStateChanged) {
        onSlotStateChanged(parkingId, slotNumber, nextOccupiedState);
      }
    } catch (err) {
      console.error('Failed to toggle slot state:', err);
    } finally {
      setUpdatingSlot(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl p-6 glass-panel rounded-3xl border border-slate-700/80 shadow-2xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {parkingDetails ? parkingDetails.name : 'Loading Parking Slots...'}
              </h2>
              <p className="text-xs text-slate-400">
                {parkingDetails ? `${parkingDetails.address}, ${parkingDetails.city}` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-6 space-y-6">
          
          {loading ? (
            <div className="text-center py-12 text-slate-400">
              <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto mb-2" />
              <span>Fetching slot data from database...</span>
            </div>
          ) : !parkingDetails ? (
            <div className="text-center py-12 text-slate-400">
              Failed to load parking slots.
            </div>
          ) : (
            <>
              {/* Counter Summary */}
              <div className="grid grid-cols-3 gap-3 text-center p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Capacity</span>
                  <span className="text-base font-extrabold text-white">{parkingDetails.total_slots}</span>
                </div>
                <div>
                  <span className="text-emerald-400 block text-[10px] uppercase font-semibold">Free Slots</span>
                  <span className="text-base font-extrabold text-emerald-400">{parkingDetails.available_slots}</span>
                </div>
                <div>
                  <span className="text-rose-400 block text-[10px] uppercase font-semibold">Occupied</span>
                  <span className="text-base font-extrabold text-rose-400">{parkingDetails.occupied_slots}</span>
                </div>
              </div>

              {/* Interactive Sensor Slots Grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase text-slate-300 tracking-wider">
                    Individual Sensor Slot Grid
                  </h3>
                  <span className="text-[11px] text-amber-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Click any slot to toggle ESP32 IR Sensor state
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {parkingDetails.slots && parkingDetails.slots.length > 0 ? (
                    parkingDetails.slots.map((slot) => {
                      const isOccupied = slot.is_occupied;
                      const isBusy = updatingSlot === slot.slot_number;

                      return (
                        <button
                          key={slot.slot_number}
                          disabled={isBusy}
                          onClick={() => handleToggleSlot(slot.slot_number, isOccupied)}
                          className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between h-28 relative overflow-hidden group ${
                            isOccupied
                              ? 'bg-rose-950/30 border-rose-500/40 hover:border-rose-400'
                              : 'bg-emerald-950/30 border-emerald-500/40 hover:border-emerald-400'
                          }`}
                        >
                          {/* Slot Header */}
                          <div className="flex items-center justify-between w-full">
                            <span className="font-extrabold text-sm text-slate-200">
                              Slot #{slot.slot_number}
                            </span>
                            {isBusy ? (
                              <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                            ) : isOccupied ? (
                              <XCircle className="w-4 h-4 text-rose-400" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            )}
                          </div>

                          {/* Center Car Icon */}
                          <div className="my-auto flex items-center justify-center">
                            <Car
                              className={`w-8 h-8 transition-transform group-hover:scale-110 ${
                                isOccupied ? 'text-rose-400' : 'text-slate-700'
                              }`}
                            />
                          </div>

                          {/* Status Badge */}
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider text-center py-0.5 rounded-md ${
                              isOccupied
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {isOccupied ? 'Occupied' : 'Available'}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-8 text-center text-slate-400 text-xs">
                      No individual slot records created yet.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
}
