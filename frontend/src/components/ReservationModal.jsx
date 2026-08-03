import React, { useState } from 'react';
import { X, Calendar, Clock, User, Car, QrCode, CheckCircle, AlertCircle } from 'lucide-react';
import { reservationService } from '../services/api';

/**
 * ReservationModal Component
 * Allows users to reserve a slot and generates a Digital QR Pass Code token.
 */
export default function ReservationModal({ isOpen, onClose, parking, user, onSuccess }) {
  const [slotNumber, setSlotNumber] = useState('1');
  const [userName, setUserName] = useState(user ? user.name : '');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [durationHours, setDurationHours] = useState('2');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdPass, setCreatedPass] = useState(null);

  if (!isOpen || !parking) return null;

  const handleBooking = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await reservationService.createReservation({
        parking_id: parking.id,
        slot_number: parseInt(slotNumber, 10),
        user_name: userName,
        vehicle_number: vehicleNumber,
        duration_hours: parseInt(durationHours, 10),
      });

      if (res.success && res.data) {
        setCreatedPass(res.data);
        if (onSuccess) onSuccess(res.data);
      } else {
        setError(res.message || 'Failed to create slot reservation.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error creating reservation.');
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setCreatedPass(null);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md p-6 glass-panel rounded-3xl border border-slate-700/80 shadow-2xl">
        
        <button
          onClick={resetAndClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {!createdPass ? (
          <>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-3">
                <Calendar className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-extrabold text-white">Reserve Parking Slot</h2>
              <p className="text-xs text-slate-400 mt-1">
                {parking.name} — {parking.city}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Slot Number</label>
                <select
                  value={slotNumber}
                  onChange={(e) => setSlotNumber(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
                >
                  {Array.from({ length: parking.total_slots || 10 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      Slot #{num}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Driver Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Vehicle License Plate</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CA-7XYZ89"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reservation Duration</label>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
                >
                  <option value="1">1 Hour</option>
                  <option value="2">2 Hours</option>
                  <option value="4">4 Hours</option>
                  <option value="8">8 Hours</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
                ) : (
                  <>Confirm & Generate Digital Pass</>
                )}
              </button>
            </form>
          </>
        ) : (
          /* Digital QR Pass Result */
          <div className="text-center py-4 space-y-4">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <CheckCircle className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-extrabold text-white">Slot Reserved Successfully!</h3>

            {/* QR Pass Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/40 text-center space-y-3 shadow-xl">
              <div className="inline-block p-3 rounded-xl bg-white text-slate-950 shadow-md">
                <QrCode className="w-24 h-24 mx-auto" />
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Pass Code Token</span>
                <strong className="text-lg font-mono text-cyan-400 font-extrabold">{createdPass.reservation_token}</strong>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left text-xs bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400 text-[10px] block">Location</span>
                  <strong className="text-white">{createdPass.parking_name || parking.name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Reserved Slot</span>
                  <strong className="text-emerald-400">Slot #{createdPass.slot_number}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Vehicle</span>
                  <strong className="text-white">{createdPass.vehicle_number}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Expires</span>
                  <strong className="text-amber-400">{new Date(createdPass.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                </div>
              </div>
            </div>

            <button
              onClick={resetAndClose}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
            >
              Done & Close
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
