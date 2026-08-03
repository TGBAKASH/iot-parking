import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { parkingService } from '../services/api';

export default function AddParkingModal({ isOpen, onClose, onSuccess, initialData }) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    latitude: '',
    longitude: '',
    total_slots: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        address: initialData.address || '',
        city: initialData.city || '',
        latitude: initialData.latitude || '',
        longitude: initialData.longitude || '',
        total_slots: initialData.total_slots || ''
      });
    } else {
      setFormData({
        name: '',
        address: '',
        city: '',
        latitude: '',
        longitude: '',
        total_slots: ''
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const dataToSubmit = {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        total_slots: parseInt(formData.total_slots, 10)
      };

      if (initialData && initialData.id) {
        await parkingService.updateParking(initialData.id, dataToSubmit);
      } else {
        await parkingService.createParking(dataToSubmit);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving parking:', err);
      setError(err.message || 'Failed to save parking location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl bg-[#171717] border border-[#262626] shadow-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between border-b border-[#262626] p-4">
          <h2 className="text-lg font-medium text-neutral-200">
            {initialData ? 'Edit Parking Location' : 'Add Parking Location'}
          </h2>
          <button 
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-300 transition-colors rounded-md p-1 hover:bg-neutral-800"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
          {error && (
            <div className="rounded-md bg-red-950/50 border border-red-900 p-3 text-sm text-red-400">
              {error}
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-400">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full rounded-md bg-[#0a0a0a] border border-[#262626] px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-neutral-500 transition-colors placeholder-neutral-600"
              placeholder="Downtown Garage"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-400">Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              className="w-full rounded-md bg-[#0a0a0a] border border-[#262626] px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-neutral-500 transition-colors placeholder-neutral-600"
              placeholder="123 Main St"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-400">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full rounded-md bg-[#0a0a0a] border border-[#262626] px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-neutral-500 transition-colors placeholder-neutral-600"
                placeholder="New York"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-400">Total Slots</label>
              <input
                type="number"
                name="total_slots"
                value={formData.total_slots}
                onChange={handleChange}
                required
                min="1"
                className="w-full rounded-md bg-[#0a0a0a] border border-[#262626] px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-neutral-500 transition-colors placeholder-neutral-600"
                placeholder="100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-400">Latitude</label>
              <input
                type="number"
                step="any"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                required
                className="w-full rounded-md bg-[#0a0a0a] border border-[#262626] px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-neutral-500 transition-colors placeholder-neutral-600"
                placeholder="40.7128"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-400">Longitude</label>
              <input
                type="number"
                step="any"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                required
                className="w-full rounded-md bg-[#0a0a0a] border border-[#262626] px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-neutral-500 transition-colors placeholder-neutral-600"
                placeholder="-74.0060"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-md px-4 py-2 text-sm font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-md bg-neutral-200 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white transition-colors disabled:opacity-50"
            >
              <Save size={16} />
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
