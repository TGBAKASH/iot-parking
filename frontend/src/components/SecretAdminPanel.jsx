import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, LogIn, Lock } from 'lucide-react';
import { authService, parkingService } from '../services/api';
import AddParkingModal from './AddParkingModal';

const ALLOWED_EMAILS = ['plumetestnet@gmail.com'];

export default function SecretAdminPanel({ user, onAuthSuccess, onReturnHome }) {
  const [parkings, setParkings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParking, setEditingParking] = useState(null);

  const isAuthorized = user && ALLOWED_EMAILS.includes(user.email);

  useEffect(() => {
    if (isAuthorized) {
      fetchParkings();
    }
  }, [isAuthorized]);

  const fetchParkings = async () => {
    setLoading(true);
    try {
      const data = await parkingService.getAllParkings();
      setParkings(data || []);
    } catch (err) {
      console.error('Failed to fetch parkings:', err);
      setError('Failed to load parking locations.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setError(null);
    try {
      const response = await authService.login(email, password);
      const authUser = response.user || response;
      if (!ALLOWED_EMAILS.includes(authUser.email)) {
        setError('Access denied. This email is not authorized.');
        return;
      }
      onAuthSuccess(authUser);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this parking location?')) return;
    try {
      await parkingService.deleteParking(id);
      fetchParkings();
    } catch (err) {
      console.error('Failed to delete:', err);
      alert('Failed to delete parking location.');
    }
  };

  const openAddModal = () => {
    setEditingParking(null);
    setIsModalOpen(true);
  };

  const openEditModal = (parking) => {
    setEditingParking(parking);
    setIsModalOpen(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-xl bg-[#171717] border border-[#262626]">
          <div className="flex flex-col items-center mb-8">
            <div className="h-12 w-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4 text-neutral-400">
              <Lock size={24} />
            </div>
            <h1 className="text-xl font-medium text-neutral-200">Admin Login</h1>
            <p className="text-sm text-neutral-500 mt-1">Restricted access area</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-md text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-md bg-[#0a0a0a] border border-[#262626] px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-neutral-500 transition-colors"
                placeholder="admin@example.com"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-400">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-md bg-[#0a0a0a] border border-[#262626] px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-neutral-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-neutral-200 py-2.5 text-sm font-medium text-neutral-900 hover:bg-white transition-colors disabled:opacity-50"
            >
              {authLoading ? 'Authenticating...' : (
                <>
                  <LogIn size={18} />
                  Login
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onReturnHome}
              className="mt-2 text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Return Home
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center w-full max-w-md p-8 rounded-xl bg-[#171717] border border-[#262626]">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-950 border border-red-900 text-red-500 mb-4">
            <Lock size={24} />
          </div>
          <h1 className="text-xl font-medium text-neutral-200 mb-2">Access Denied</h1>
          <p className="text-sm text-neutral-500 mb-6">
            Your email ({user.email}) is not authorized for admin access.
          </p>
          <button
            onClick={onReturnHome}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-neutral-800 py-2.5 text-sm font-medium text-neutral-200 hover:bg-neutral-700 transition-colors"
          >
            <ArrowLeft size={18} />
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 font-sans">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 border-b border-[#262626] pb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <button
                onClick={onReturnHome}
                className="text-neutral-500 hover:text-neutral-300 p-1.5 -ml-1.5 rounded-md hover:bg-neutral-900 transition-colors"
                title="Back to Map"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-2xl font-medium tracking-tight">Admin Dashboard</h1>
            </div>
            <p className="text-sm text-neutral-500 ml-9">Manage parking locations across the network.</p>
          </div>
          
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-md bg-neutral-200 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white transition-colors"
          >
            <Plus size={16} />
            Add Location
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-950/30 border border-red-900/50 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-[#262626] bg-[#171717] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#262626] bg-neutral-900/50">
                  <th className="px-4 py-3 font-medium text-neutral-400">Name</th>
                  <th className="px-4 py-3 font-medium text-neutral-400">Address</th>
                  <th className="px-4 py-3 font-medium text-neutral-400">City</th>
                  <th className="px-4 py-3 font-medium text-neutral-400">Slots (Total)</th>
                  <th className="px-4 py-3 font-medium text-neutral-400">Coordinates</th>
                  <th className="px-4 py-3 font-medium text-neutral-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-neutral-500">
                      Loading locations...
                    </td>
                  </tr>
                ) : parkings.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-neutral-500">
                      No parking locations found. Add one to get started.
                    </td>
                  </tr>
                ) : (
                  parkings.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-900/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 text-neutral-400">{p.address}</td>
                      <td className="px-4 py-3 text-neutral-400">{p.city}</td>
                      <td className="px-4 py-3 text-neutral-400">{p.total_slots}</td>
                      <td className="px-4 py-3 text-neutral-400 font-mono text-xs">
                        {p.latitude}, {p.longitude}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-md transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AddParkingModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchParkings();
        }}
        initialData={editingParking}
      />
    </div>
  );
}
