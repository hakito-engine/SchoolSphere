import React, { useState } from 'react';
import { useAuth, ROLE_DEFINITIONS } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { Role } from '../types';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  CheckCircle2,
  School,
  KeyRound,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  Users,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, allUsers, switchUserById } = useAuth();
  const profile = DataService.getSchoolProfile();

  const [username, setUsername] = useState('bambangharyadi');
  const [password, setPassword] = useState('123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    setTimeout(() => {
      const res = login(username, password);
      setLoading(false);
      if (!res.success) {
        setErrorMsg(res.message);
      }
    }, 300);
  };

  const handleQuickLogin = (uId: string, uUsername: string) => {
    setUsername(uUsername);
    setPassword('123');
    switchUserById(uId);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-2 bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 mb-2">
            <img
              src={profile.logoUrl}
              alt={profile.name}
              className="w-16 h-16 object-contain rounded-xl"
              referrerPolicy="no-referrer"
            />
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            SchoolSphere <span className="text-indigo-600 dark:text-indigo-400">LMS PRO</span>
          </h1>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            {profile.name}
          </p>
          <p className="text-[11px] text-slate-500 font-mono">
            NPSN: {profile.npsn} · NSS: {profile.nss} · Terintegrasi Hakito Engine
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Masuk ke Akun Portal Sekolah
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Masukkan username (nama lengkap tanpa spasi) dan kata sandi Anda.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
            {/* Username Input */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Username Akun
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Contoh: bambangharyadi"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Format: Nama lengkap huruf kecil tanpa spasi.
              </span>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Kata sandi standar (123)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                <span>Default password awal: <strong>123</strong></span>
                <span>Dapat diubah setelah login</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Memverifikasi...' : 'Masuk ke Sistem LMS'}</span>
            </button>
          </form>

          {/* Quick Demo Helper Section */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                Kredensial Demo 8 Peran
              </span>
              <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded">
                Pass: 123
              </span>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800/60">
              {allUsers.map((u) => {
                const roleDef = ROLE_DEFINITIONS[u.role];
                return (
                  <div
                    key={u.id}
                    className="pt-1.5 first:pt-0 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 p-1.5 rounded-lg transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {u.name}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold shrink-0 ${roleDef.badgeColor}`}>
                          {roleDef.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono">
                        user: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{u.username || u.name.toLowerCase().replace(/[^a-z0-9]/g, '')}</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleQuickLogin(u.id, u.username || u.name.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                      className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-slate-100 hover:bg-indigo-600 hover:text-white dark:bg-slate-800 dark:hover:bg-indigo-600 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shrink-0"
                    >
                      Login Cepat
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quiet Footer */}
        <div className="mt-6 text-center text-[11px] text-slate-400">
          <p>SchoolSphere LMS PRO by Hakito Engine · Role-Based Access Control</p>
          <p className="mt-0.5 text-[10px] font-mono">Arsitektur Modular Standar Google Apps Script & Sheets</p>
        </div>
      </div>
    </div>
  );
};
