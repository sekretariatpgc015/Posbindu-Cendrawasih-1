import React, { useState } from 'react';
import { Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

interface LoginViewProps {
  onLogin: (role: 'ptm' | 'finance') => void;
  onCancel: () => void;
}

export default function LoginView({ onLogin, onCancel }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'Input PTM' && password === 'Tersenyum') {
      onLogin('ptm');
    } else if (username === 'Finance' && password === 'Tersenyum') {
      onLogin('finance');
    } else {
      setError('Username atau password salah');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-slate-100 p-6">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-3">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-800">Login Petugas</h2>
          <p className="text-slate-500 text-xs mt-1 text-center">Silakan masuk untuk mengakses fitur input data.</p>
          <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-700 font-medium text-center w-full">
            <p>Hint Login Simulasi:</p>
            <p className="mt-1">Username: <strong>Input PTM</strong> | Pass: <strong>Tersenyum</strong></p>
            <p className="mt-1">Username: <strong>Finance</strong> | Pass: <strong>Tersenyum</strong></p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 text-rose-600 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none"
                placeholder="Masukkan username"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none"
                placeholder="Masukkan password"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 mt-2">
            <button
              type="button"
              onClick={onCancel}
              className="text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors cursor-pointer px-2"
            >
              Kembali
            </button>
            <button
              type="submit"
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              Masuk
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
