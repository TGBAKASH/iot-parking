import React, { useState, useEffect } from 'react';
import { X, Plus, MapPin, Hash, Building2, AlertCircle } from 'lucide-react';
import { parkingService } from '../services/api';

/**
 * AddParkingModal Component
 * Form modal for creating a new parking lot or editing an existing one in Neon DB.
 */
export default function AddParkingModal({ isOpen, onClose, onSuccess, initialData }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [totalSlots, setTotalSlots] = useState('10');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setAddress(initialData.address || '');
      setCity(initialData.city || '');
      setLatitude(initialData.latitude !== undefined ? String(initialData.latitude) : '');
      setLongitude(initialData.longitude !== undefined ? String(initialData.longitude) : '');
      setTotalSlots(initialData.total_slots ? String(initialData.total_slots) : '10');
    } else {
      setName('');
      setAddress('');
      setCity('San Francisco');
      setLatitude('37.774929');
      setLongitude('-122.419416');
      setTotalSlots('10');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        name,
        address,
        city,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        total_slots: parseInt(totalSlots, 10),
      };

      let res;
      if (initialData && initialData.id) {
        res = await parkingService.updateParking(initialData.id, payload);
      } else {
        res = await parkingService.createParking(payload);
      }

      if (res.success) {
        onSuccess(res.data);
        onClose();
      } else {
        setError(res.message || 'Operation failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save parking details to backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg p-6 glass-panel rounded-3xl border border-slate-700/80 shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-white">
            {initialData ? 'Edit Parking Location' : 'Add New Parking Location'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {initialData
              ? 'Update location coordinates and slot capacity in Neon PostgreSQL DB.'
              : 'Add a new smart parking lot with GPS coordinates and total slot count.'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Parking Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Central Plaza Garage"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Address</label>
              <input
                type="text"
                required
                placeholder="123 Main Street"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
              <input
                type="text"
                required
                placeholder="San Francisco"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                required
                placeholder="37.7749"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                required
                placeholder="-122.4194"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Total Slots</label>
              <input
                type="number"
                min="1"
                max="100"
                required
                value={totalSlots}
                onChange={(e) => setTotalSlots(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
            ) : initialData ? (
              'Update Parking Lot'
            ) : (
              <>
                <Plus className="w-4 h-4" /> Save Parking Location
              </>
            )}
          </button>

        </form>

      </div>
    </div>
  );
}
