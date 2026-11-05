import React from 'react';
import {
  Code2,
  FolderGit2,
  Calendar,
  UserCheck,
  ShieldCheck,
  Award,
  Layers,
  Terminal,
  Cpu,
  Globe,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Building,
} from 'lucide-react';

export const DeveloperIdentityView: React.FC = () => {
  const [copied, setCopied] = React.useState(false);

  const developerInfo = {
    name: 'Yusuf Tonapa, S.Pd.',
    projectFolder: 'Hakito Tech',
    year: '2026',
    systemName: 'SISPAM (Sistem Integrasi Sekolah, Pembelajaran, & Administrasi)',
    release: 'v2.4 Enterprise Production',
    techStack: 'React 18, TypeScript, Vite, Tailwind CSS, MySQL (phpMyAdmin REST)',
  };

  const handleCopyInfo = () => {
    const text = `=== IDENTITAS PENGEMBANG SISPAM ===\nNama Pengembang : ${developerInfo.name}\nFolder Projek   : ${developerInfo.projectFolder}\nTahun           : ${developerInfo.year}\nAplikasi        : ${developerInfo.systemName}\nVersi           : ${developerInfo.release}\nLisensi         : Hak Cipta © 2026 Hakito Tech`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl p-6 md:p-8 text-white border border-indigo-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-0 right-1/4 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Profil Resmi Pengembang Sistem</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Identitas Pengembang
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Informasi resmi lisensi, kreator sistem, dan arsitektur pengembangan platform SISPAM (Sistem Integrasi Sekolah, Pembelajaran, & Administrasi) by Hakito Tech.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyInfo}
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Data Tersalin!' : 'Salin Identitas Pengembang'}</span>
          </button>
        </div>
      </div>

      {/* Main Developer Profile Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Creator Identity Profile */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600"></div>

          {/* Avatar / Emblem */}
          <div className="relative mt-4 mb-4">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-900 text-white flex items-center justify-center font-black text-3xl shadow-lg shadow-indigo-500/20 border-2 border-indigo-300/40">
              YT
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-full border-2 border-white dark:border-slate-900 shadow-sm" title="Pengembang Terverifikasi">
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>

          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {developerInfo.name}
          </h2>
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
            Lead Software Architect & Creator
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium mt-3 border border-slate-200 dark:border-slate-700">
            <Building className="w-3 h-3 text-slate-500" />
            <span>Folder Projek: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{developerInfo.projectFolder}</strong></span>
          </div>

          <div className="w-full border-t border-slate-100 dark:border-slate-800 my-5"></div>

          {/* Quick Credential Highlights */}
          <div className="w-full space-y-3 text-left">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400">Tahun Pengembangan</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                {developerInfo.year}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400">Lisensi & Hak Cipta</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Hakito Tech
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400">Status Rilis</span>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                Official Production
              </span>
            </div>
          </div>
        </div>

        {/* Right Columns: Detailed Technical Specs & Verification */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Identity & Folder Info */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <FolderGit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Metadata & Repositori Proyek
                </h3>
                <p className="text-xs text-slate-500">
                  Parameter struktur proyek terintegrasi SISPAM
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nama Pengembang</p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white">Yusuf Tonapa, S.Pd.</p>
                <p className="text-xs text-slate-500">Arsitek Sistem & Rekayasa Perangkat Lunak Pendidikan</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Folder Projek</p>
                <p className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">Hakito Tech</p>
                <p className="text-xs text-slate-500">Direktori inti & arsitektur rilis Hakito Tech</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tahun Produksi</p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">2026</p>
                <p className="text-xs text-slate-500">Edisi Standar Kurikulum Merdeka & Cloud Sync</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sistem & Platform</p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white">SISPAM by Hakito Tech</p>
                <p className="text-xs text-slate-500">Sistem Integrasi Sekolah, Pembelajaran, & Administrasi</p>
              </div>
            </div>
          </div>

          {/* Architecture & Engineering Highlights */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Spesifikasi Teknis & Lingkungan Eksekusi
                </h3>
                <p className="text-xs text-slate-500">
                  Dikelola dan dibangun secara profesional menggunakan standar arsitektur modern
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                <Cpu className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                <div className="space-y-0.5 text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">Frontend Engine</span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    React 18 SPA berbasis TypeScript & Vite Compiler yang menghasilkan aset statis modular berkinerja tinggi, zero-pill discipline, dan responsif di seluruh perangkat komputer maupun smartphone.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                <Globe className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <div className="space-y-0.5 text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">Sinkronisasi Database phpMyAdmin / MySQL</span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    Terintegrasi ke database server cPanel MySQL melalui endpoint RESTful API terisolasi dengan proteksi token dan auto-heartbeat yang menjaga persistensi data saat dibuka di peramban mode privat maupun berbagai perangkat berbeda.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                <div className="space-y-0.5 text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">Hak Akses Berjenjang (RBAC)</span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    Pengelolaan multi-peran (Super Admin, Kepala Sekolah, Wakasek Kurikulum, Guru Mapel, Wali Kelas, Guru BK, Siswa, Orang Tua, dan Tendik) dengan enkripsi sesi mandiri dan audit log komprehensif.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Official License & Copyright Footer */}
          <div className="p-5 rounded-2xl bg-slate-900 text-slate-300 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <p className="font-bold text-white">SISPAM by Hakito Tech · Edisi 2026</p>
                <p className="text-slate-400 text-[11px]">Dikembangkan oleh Yusuf Tonapa, S.Pd. · Folder Projek: Hakito Tech</p>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 font-mono bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              Hak Cipta Terdaftar © 2026
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
