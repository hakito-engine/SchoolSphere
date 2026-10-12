import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Award,
  BellRing,
  HelpCircle,
  FileText,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { currentUser, roleInfo, activeChildId, setActiveChildId } = useAuth();
  const profile = DataService.getSchoolProfile();
  const students = DataService.getStudents();
  const teachers = DataService.getTeachers();
  const classes = DataService.getClasses();
  const journals = DataService.getJournals();
  const assignments = DataService.getAssignments();
  const exams = DataService.getExams();
  const counseling = DataService.getCounselingRecords();
  const announcements = DataService.getAnnouncements();

  // Child data for parent portal
  const activeChild = students.find((s) => s.id === activeChildId) || students[0];

  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-md bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                {roleInfo.label}
              </span>
              <span className="text-xs text-slate-300 font-mono">
                {todayFormatted}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Selamat Datang, {currentUser.name}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {profile.name} · {profile.curriculum}. Kelola pembelajaran, presensi, jurnal, dan capaian akademik dalam satu platform terintegrasi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('announcements')}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <BellRing className="w-4 h-4 text-indigo-300" />
              <span>Pengumuman Sekolah</span>
            </button>
          </div>
        </div>

        {/* Subtle background glow */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Role-Specific Content */}

      {/* 1. SUPER ADMIN DASHBOARD */}
      {currentUser.role === 'super_admin' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Total Peserta Didik</span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                {students.length * 48}
              </p>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">100% Terverifikasi NISN</p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Tenaga Pendidik</span>
                <GraduationCap className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                {teachers.length + 23}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">100% Memiliki NIP/NUPTK</p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Rombongan Belajar</span>
                <BookOpen className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                {classes.length} Rombel
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Jenjang X, XI, XII MIPA & IPS</p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Integritas Data</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-emerald-600 font-mono tabular-nums">
                Optimal
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Audit Trail & Backup Siap</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Pusat Kendali Administrasi & Sistem
                </h3>
                <span className="text-xs text-slate-500">Super Admin Mode</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => onNavigate('settings')}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-left transition-colors cursor-pointer group"
                >
                  <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600">
                    Pengaturan Kop Surat & Identitas
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Konfigurasi logo, NPSN, akreditasi, dan format dokumen resmi sekolah.
                  </p>
                </button>

                <button
                  onClick={() => onNavigate('backup_audit')}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-left transition-colors cursor-pointer group"
                >
                  <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600">
                    Audit Trail & Backup Manager
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Pantau log perubahan data, ekspor cadangan database JSON, atau pulihkan data.
                  </p>
                </button>

                <button
                  onClick={() => onNavigate('students')}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-left transition-colors cursor-pointer group"
                >
                  <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600">
                    Manajemen Data Pokok Siswa
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Data NISN, relasi orang tua, rombel, cetak surat keterangan aktif.
                  </p>
                </button>

                <button
                  onClick={() => onNavigate('analytics')}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-left transition-colors cursor-pointer group"
                >
                  <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600">
                    Early Support Alert & Analytics
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Deteksi dini siswa dengan ketidakhadiran berulang atau penurunan KKM.
                  </p>
                </button>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Status Modul Terpasang
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Modul Pembelajaran & LMS</span>
                  <span className="font-semibold text-emerald-600">Aktif</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Presensi & Kehadiran Harian</span>
                  <span className="font-semibold text-emerald-600">Aktif</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Supervisi Jurnal Mengajar</span>
                  <span className="font-semibold text-emerald-600">Aktif</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">CBT Ujian & Kuis Online</span>
                  <span className="font-semibold text-emerald-600">Aktif</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Bimbingan Konseling (BK)</span>
                  <span className="font-semibold text-emerald-600">Terenkripsi</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Portal Orang Tua Multi-Anak</span>
                  <span className="font-semibold text-emerald-600">Aktif</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. KEPALA SEKOLAH DASHBOARD */}
      {currentUser.role === 'kepala_sekolah' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Rerata Presensi Siswa</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
                96.8%
              </p>
              <p className="text-[11px] text-emerald-600 mt-0.5">Memenuhi standar dinas</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Keterisian Jurnal Guru</span>
              <p className="text-2xl font-bold text-indigo-600 font-mono tabular-nums mt-1">
                91.4%
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">1 jurnal menunggu supervisi</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Ketuntasan KKM Sekolah</span>
              <p className="text-2xl font-bold text-emerald-600 font-mono tabular-nums mt-1">
                89.2%
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">KKM rata-rata: 75.0</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Siswa Butuh Pendampingan</span>
              <p className="text-2xl font-bold text-amber-600 font-mono tabular-nums mt-1">
                2 Siswa
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Ditangani Tim BK</p>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Supervisi Jurnal Mengajar Guru (Persetujuan)
                </h3>
                <p className="text-xs text-slate-500">
                  Tinjau dan sahkan jurnal kegiatan pembelajaran dewan guru.
                </p>
              </div>
              <button
                onClick={() => onNavigate('journals')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Lihat Semua Jurnal <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {journals.map((j) => (
                <div
                  key={j.id}
                  className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {j.teacherName}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {j.subjectName} ({j.className})
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500 font-mono">{j.date}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 font-medium">
                      Topik: {j.topic}
                    </p>
                    <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-1">
                      Aktivitas: {j.activities}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        j.status === 'disetujui'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : j.status === 'dikirim'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {j.status}
                    </span>
                    <button
                      onClick={() => onNavigate('journals')}
                      className="px-3 py-1.5 rounded-md bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-medium cursor-pointer"
                    >
                      Buka Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. GURU MATA PELAJARAN DASHBOARD */}
      {currentUser.role === 'guru' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Mata Pelajaran Diampu</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
                2 Mapel
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Matematika Wajib X & XI</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Modul Pembelajaran</span>
              <p className="text-2xl font-bold text-indigo-600 font-mono tabular-nums mt-1">
                {assignments.length + 2} Bab
              </p>
              <p className="text-[11px] text-emerald-600 mt-0.5">Semua diterbitkan</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Tugas Perlu Dinilai</span>
              <p className="text-2xl font-bold text-amber-600 font-mono tabular-nums mt-1">
                4 Kiriman
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Tugas Mandiri 1</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Jurnal Hari Ini</span>
              <p className="text-2xl font-bold text-emerald-600 font-mono tabular-nums mt-1">
                Draft Siap
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Tinggal kirim pengesahan</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Aksi Cepat Guru
                </h3>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => onNavigate('attendance')}
                  className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-500 flex items-center justify-between text-left text-xs transition-colors cursor-pointer"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Input Presensi Pertemuan Hari Ini
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Catat kehadiran siswa jam ke-1 s.d. 3 kelas X MIPA 1.
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => onNavigate('journals')}
                  className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-500 flex items-center justify-between text-left text-xs transition-colors cursor-pointer"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Tulis Jurnal Mengajar & Refleksi
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Catat materi yang diajarkan, kendala, dan refleksi kelas.
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => onNavigate('assignments')}
                  className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-500 flex items-center justify-between text-left text-xs transition-colors cursor-pointer"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Periksa & Beri Nilai Tugas Siswa
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Input nilai 0-100 dan umpan balik konstruktif bagi siswa.
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Jadwal Mengajar Terdekat
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Matematika Wajib - X MIPA 1
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Senin, Jam 07.45 - 09.15 (Ruang X MIPA 1)
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                    Sesi Pagi
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Matematika Wajib - X MIPA 2
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Rabu, Jam 09.30 - 11.45 (Ruang X MIPA 2)
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Sesi Siang
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. WALI KELAS DASHBOARD */}
      {currentUser.role === 'wali_kelas' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                X-1
              </div>
              <div>
                <h3 className="font-bold text-sm text-emerald-950 dark:text-emerald-100">
                  Kelas Binaan: X MIPA 1
                </h3>
                <p className="text-xs text-emerald-800 dark:text-emerald-300">
                  Total 32 Siswa · Tahun Ajaran 2024/2025 Ganjil · Wali Kelas: Budi Santoso, S.Si.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('attendance')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
            >
              Cek Presensi Kelas
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Tingkat Kehadiran Kelas</span>
              <p className="text-2xl font-bold text-emerald-600 font-mono tabular-nums mt-1">
                95.2%
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">31 dari 32 hadir aktif</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Rerata Nilai Raport</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
                85.4
              </p>
              <p className="text-[11px] text-emerald-600 mt-0.5">Di atas KKM 75</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Siswa Perlu Perhatian</span>
              <p className="text-2xl font-bold text-amber-600 font-mono tabular-nums mt-1">
                1 Siswa
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Dewa (Alpa 4 hari)</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Komunikasi Wali Murid</span>
              <p className="text-2xl font-bold text-indigo-600 font-mono tabular-nums mt-1">
                100%
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Nomor ortu terverifikasi</p>
            </div>
          </div>
        </div>
      )}

      {/* 5. GURU BK DASHBOARD */}
      {currentUser.role === 'guru_bk' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Siswa Early Alert</span>
              <p className="text-2xl font-bold text-rose-600 font-mono tabular-nums mt-1">
                2 Kasus
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Alpa &gt; 3 hari / nilai drop</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Sesi Konseling Berjalan</span>
              <p className="text-2xl font-bold text-amber-600 font-mono tabular-nums mt-1">
                1 Kasus
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Dewa Bagus Pratama</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Konseling Selesai</span>
              <p className="text-2xl font-bold text-emerald-600 font-mono tabular-nums mt-1">
                12 Kasus
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Semester Ganjil 2024</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Kerahasiaan Rekam</span>
              <p className="text-2xl font-bold text-teal-600 font-mono tabular-nums mt-1">
                Privat
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Akses khusus Guru BK & Kepsek</p>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Monitoring Siswa Early Support Alert
                </h3>
                <p className="text-xs text-slate-500">
                  Daftar siswa yang memerlukan intervensi bimbingan konseling dan dukungan keluarga.
                </p>
              </div>
              <button
                onClick={() => onNavigate('counseling')}
                className="text-xs font-semibold text-teal-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Buka Modul BK <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-rose-950 dark:text-rose-100">
                      Dewa Bagus Pratama (X MIPA 1)
                    </span>
                    <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-rose-200 text-rose-900">
                      Prioritas Tinggi
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    Indikator: Alpa 4 hari, penurunan nilai tugas fisika (skor 68). Status: Pemanggilan orang tua kolaboratif.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('counseling')}
                  className="px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-medium cursor-pointer shrink-0"
                >
                  Catatan Tindak Lanjut
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. SISWA DASHBOARD */}
      {currentUser.role === 'siswa' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Kehadiran Saya</span>
              <p className="text-2xl font-bold text-emerald-600 font-mono tabular-nums mt-1">
                98.1%
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">52 Hadir · 0 Alpa</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Tugas Menunggu</span>
              <p className="text-2xl font-bold text-amber-600 font-mono tabular-nums mt-1">
                1 Tugas
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Teks Observasi LHO</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Nilai Kuis Terakhir</span>
              <p className="text-2xl font-bold text-indigo-600 font-mono tabular-nums mt-1">
                95 / 100
              </p>
              <p className="text-[11px] text-emerald-600 mt-0.5">Matematika Wajib</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Status Akun Siswa</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
                Aktif
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">NISN: {currentUser.nipOrNisn}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Tugas Belajar & Tenggat
              </h3>
              <div className="space-y-3 text-xs">
                {assignments.map((asg) => (
                  <div
                    key={asg.id}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {asg.title}
                      </span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-[11px]">
                        {asg.subjectName}
                      </span>
                      <span className="text-slate-400 text-[11px]"> · Tenggat: {asg.deadline}</span>
                    </div>
                    <button
                      onClick={() => onNavigate('assignments')}
                      className="px-3 py-1.5 rounded bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold cursor-pointer"
                    >
                      Buka
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Ujian & Kuis CBT Tersedia
              </h3>
              <div className="space-y-3 text-xs">
                {exams.map((ex) => (
                  <div
                    key={ex.id}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {ex.title}
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        Durasi: {ex.durationMinutes} Menit · {ex.questions.length} Soal
                      </span>
                    </div>
                    <button
                      onClick={() => onNavigate('exams')}
                      className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                    >
                      Mulai Kuis
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. ORANG TUA / WALI DASHBOARD */}
      {currentUser.role === 'orang_tua' && (
        <div className="space-y-6">
          {/* Multi-Child Selector */}
          <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-orange-900 dark:text-orange-200 uppercase tracking-wide">
                Portal Orang Tua Terverifikasi (Multi-Anak)
              </span>
              <p className="text-xs text-orange-800 dark:text-orange-300 mt-0.5">
                Pilih profil anak yang ingin Anda pantau perkembangannya hari ini:
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveChildId('std-ahmad')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeChild.id === 'std-ahmad'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-orange-200'
                }`}
              >
                Ahmad Fauzi (X MIPA 1)
              </button>
              <button
                onClick={() => setActiveChildId('std-siti')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeChild.id === 'std-siti'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-orange-200'
                }`}
              >
                Siti Fauziah (X MIPA 2)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Presensi {activeChild.name}</span>
              <p className="text-2xl font-bold text-emerald-600 font-mono tabular-nums mt-1">
                98.2%
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">{activeChild.attendance.hadir} Hadir, 0 Alpa</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Nilai Rata-rata</span>
              <p className="text-2xl font-bold text-indigo-600 font-mono tabular-nums mt-1">
                {activeChild.gpa}
              </p>
              <p className="text-[11px] text-emerald-600 mt-0.5">Predikat Sangat Baik</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Kelas & Rombel</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
                {activeChild.className}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Wali: Budi Santoso, S.Si.</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Status Pembelajaran</span>
              <p className="text-2xl font-bold text-emerald-600 font-mono tabular-nums mt-1">
                Tuntas
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Tidak ada tunggakan tugas</p>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Rapor Sementara & Lembar Perkembangan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cetak laporan hasil belajar {activeChild.name} dengan kop resmi sekolah dan tanda tangan pengesahan.
              </p>
            </div>
            <button
              onClick={() => onNavigate('parent_portal')}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
            >
              Buka Lembar Hasil Belajar
            </button>
          </div>
        </div>
      )}

      {/* 8. OPERATOR SEKOLAH DASHBOARD */}
      {currentUser.role === 'operator' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Validitas Data Siswa</span>
              <p className="text-2xl font-bold text-emerald-600 font-mono tabular-nums mt-1">
                100%
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Semua NISN valid</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Data PTK / Guru</span>
              <p className="text-2xl font-bold text-indigo-600 font-mono tabular-nums mt-1">
                100%
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">NIP & NUPTK lengkap</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Rombongan Belajar</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
                {classes.length} Kelas
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Wali kelas terhubung</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Tahun Ajaran Aktif</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
                2024/2025
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Semester Ganjil</p>
            </div>
          </div>
        </div>
      )}

      {/* Pengumuman Terbaru Sekolah (Semua Peran) */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MegaphoneIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Warta & Pengumuman Sekolah
            </h3>
          </div>
          <button
            onClick={() => onNavigate('announcements')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            Lihat Semua
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {announcements.slice(0, 2).map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  {item.priority}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {item.date}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 mb-1">
                {item.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {item.content}
              </p>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">
                Oleh: {item.authorName} ({item.authorRole})
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function MegaphoneIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 11 18-5v12L3 14v-3z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  );
}
