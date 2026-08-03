import React, { useState } from 'react';
import { X } from 'lucide-react';
import { authService } from '../services/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let response;
      if (isLogin) {
        response = await authService.login(email, password);
      } else {
        response = await authService.register(name, email, password);
      }
      onAuthSuccess?.(response.user || response);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl relative flex flex-col">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex border-b border-neutral-800">
          <button
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              isLogin ? 'text-white border-b-2 border-white' : 'text-neutral-500 hover:text-neutral-300'
            }`}
            onClick={() => { setIsLogin(true); setError(null); }}
          >
            Login
          </button>
          <button
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              !isLogin ? 'text-white border-b-2 border-white' : 'text-neutral-500 hover:text-neutral-300'
            }`}
            onClick={() => { setIsLogin(false); setError(null); }}
          >
            Register
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {!isLogin && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-neutral-400">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-neutral-600 text-neutral-200 transition-colors"
                />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-neutral-400">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-neutral-600 text-neutral-200 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-neutral-400">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-neutral-600 text-neutral-200 transition-colors"
              />
            </div>

            {error && (
              <div className="text-red-400 text-xs mt-1">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-white text-black font-medium text-sm rounded-lg py-2.5 hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
