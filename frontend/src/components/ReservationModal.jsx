import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { reservationService } from '../services/api';

export default function ReservationModal({ isOpen, onClose, parking, user, onSuccess }) {
  const [slotNumber, setSlotNumber] = useState('');
  const [duration, setDuration] = useState('60'); // minutes
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successId, setSuccessId] = useState(null);

  if (!isOpen || !parking) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Please sign in to make a reservation.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await reservationService.createReservation({
        parking_id: parking.id,
        slot_number: parseInt(slotNumber, 10),
        duration: parseInt(duration, 10),
        vehicle_number: vehicleNumber,
      });
      setSuccessId(response.data?.reservation_id || response.data?.id || response.reservation_id || 'Confirmed');
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reserve slot');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccessId(null);
    setSlotNumber('');
    setVehicleNumber('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl relative flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 shrink-0">
          <h2 className="text-sm font-medium text-neutral-200">Reserve Slot</h2>
          <button
            onClick={handleClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {successId ? (
            <div className="flex flex-col items-center py-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
              <h3 className="text-neutral-200 font-medium mb-1">Reservation Confirmed</h3>
              <p className="text-neutral-400 text-sm mb-6">ID: {successId}</p>
              <button
                onClick={handleClose}
                className="w-full bg-neutral-800 text-neutral-200 font-medium text-sm rounded-lg py-2.5 hover:bg-neutral-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="mb-2">
                <div className="text-sm font-medium text-neutral-200">{parking.name}</div>
                <div className="text-xs text-neutral-500 mt-0.5">{parking.available_slots || 0} slots available</div>
              </div>

              {!user && (
                <div className="p-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-sm text-neutral-400">
                  Please sign in first to make a reservation.
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-neutral-400">Slot Number</label>
                <input
                  type="number"
                  required
                  value={slotNumber}
                  onChange={(e) => setSlotNumber(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-neutral-600 text-neutral-200 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-neutral-400">Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-neutral-600 text-neutral-200 transition-colors appearance-none"
                >
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                  <option value="240">4 hours</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-neutral-400">Vehicle Number</label>
                <input
                  type="text"
                  required
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="e.g. ABC-1234"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-neutral-600 text-neutral-200 transition-colors uppercase"
                />
              </div>

              {error && (
                <div className="text-red-400 text-xs mt-1">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading || !user}
                className="mt-2 w-full bg-green-600 text-white font-medium text-sm rounded-lg py-2.5 hover:bg-green-500 transition-colors disabled:opacity-50 disabled:hover:bg-green-600"
              >
                {loading ? 'Reserving...' : 'Reserve Now'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
