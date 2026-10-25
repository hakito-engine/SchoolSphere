import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  CheckCircle2,
  Phone,
  HelpCircle,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const profile = DataService.getSchoolProfile();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotName, setForgotName] = useState('');
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotWaNumber, setForgotWaNumber] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotWaLink, setForgotWaLink] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim() || !password) {
      setErrorMsg('Silakan masukkan username dan kata sandi Anda.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const res = login(username, password);
      setLoading(false);
      if (!res.success) {
        setErrorMsg(res.message);
      }
    }, 300);
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotName || !forgotIdentifier || !forgotWaNumber) return;

    // Record request into DataService
    DataService.createPasswordResetRequest({
      name: forgotName,
      usernameOrNip: forgotIdentifier,
      whatsappNumber: forgotWaNumber,
    });

    setForgotSuccess(true);

    // Build prefilled WhatsApp message to configured Super Admin
    const rawAdminPhone = profile.adminWhatsapp || profile.phone || '081299887711';
    let cleanAdminPhone = rawAdminPhone.replace(/[^0-9]/g, '');
    if (cleanAdminPhone.startsWith('0')) {
      cleanAdminPhone = '62' + cleanAdminPhone.substring(1);
    }
    const textMsg = encodeURIComponent(
      `Halo Super Admin SISPAM (${profile.name}),\n\nSaya memohon bantuan reset kata sandi (password) akun portal sekolah:\n- Nama Lengkap: ${forgotName}\n- Username / NIP / NISN: ${forgotIdentifier}\n- No. WhatsApp Saya: ${forgotWaNumber}\n\nMohon bantuannya untuk mengirimkan kata sandi baru akun saya melalui pesan WhatsApp ini. Terima kasih.`
    );
    const waUrl = `https://api.whatsapp.com/send?phone=${cleanAdminPhone}&text=${textMsg}`;
    setForgotWaLink(waUrl);

    // Try opening WhatsApp link safely
    try {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    } catch {
      // Ignored if window.open is restricted in iframe
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-indigo-100 dark:border-slate-800 mb-2">
            <img
              src={profile.logoUrl}
              alt={profile.name}
              className="w-16 h-16 object-contain rounded-xl"
              referrerPolicy="no-referrer"
            />
          </div>

          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            SISPAM <span className="text-indigo-600 dark:text-indigo-400">PRO</span>
          </h1>
          <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 tracking-wide">
            Sistem Integrasi Sekolah, Pembelajaran, & Administrasi
          </p>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider pt-1">
            {profile.name}
          </p>
          <p className="text-[11px] text-slate-500 font-mono">
            NPSN: {profile.npsn} · NSS: {profile.nss} · Portal Akademik Resmi
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-5">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Masuk ke Akun Portal Sekolah
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Masukkan username (nama lengkap tanpa spasi) dan kata sandi resmi Anda.
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
                  placeholder="Ketikkan username Anda"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Format guru/pegawai: Nama lengkap huruf kecil tanpa spasi.
              </span>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">
                  Kata Sandi (Password)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotModalOpen(true);
                    setForgotSuccess(false);
                  }}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
                >
                  Lupa Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Masukkan kata sandi Anda"
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Memverifikasi Akun...' : 'Masuk ke Portal Sekolah'}</span>
            </button>
          </form>

          {/* Security & Access Info */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              Autentikasi Terenkripsi RBAC
            </span>
            <button
              type="button"
              onClick={() => {
                setIsForgotModalOpen(true);
                setForgotSuccess(false);
              }}
              className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Bantuan Akun</span>
            </button>
          </div>
        </div>

        {/* Quiet Footer */}
        <div className="mt-6 text-center text-[11px] text-slate-500">
          <p className="font-semibold text-slate-700 dark:text-slate-300">SISPAM · Sistem Integrasi Sekolah, Pembelajaran, & Administrasi</p>
          <p className="mt-0.5 text-[10px] font-mono">Keamanan data terverifikasi · Multi-User Session Protection</p>
        </div>
      </div>

      {/* MODAL: LUPA PASSWORD / HUBUNGI ADMIN VIA WHATSAPP */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Lupa Password? Hubungi Super Admin
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Kirim permohonan reset kata sandi langsung ke WhatsApp Admin Sekolah.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsForgotModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            {forgotSuccess ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2 text-xs text-emerald-900 dark:text-emerald-200">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Permintaan Reset Telah Dikirim!</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Permintaan reset password telah dicatat oleh sistem dan dialihkan ke WhatsApp Super Admin Sekolah.
                  Super Admin akan memverifikasi identitas Anda dan mengirimkan kata sandi baru melalui pesan WhatsApp.
                </p>
                <div className="pt-2 space-y-2">
                  {forgotWaLink && (
                    <a
                      href={forgotWaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-center"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Buka Aplikasi WhatsApp</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="w-full py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-lg cursor-pointer text-center"
                  >
                    Kembali ke Halaman Login
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Nama Lengkap Anda
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Dra. Ratna Safitri, M.Pd."
                    value={forgotName}
                    onChange={(e) => setForgotName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Username / NIP / NISN Akun
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: ratnasafitri atau 19850620..."
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Nomor WhatsApp Aktif Anda
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="0812-xxxx-xxxx"
                      value={forgotWaNumber}
                      onChange={(e) => setForgotWaNumber(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Password baru akan dikirimkan oleh Super Admin ke nomor WhatsApp ini.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Kirim via WhatsApp ke Admin</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
