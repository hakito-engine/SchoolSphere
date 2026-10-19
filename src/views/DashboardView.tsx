import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { Student, Teacher, ClassRoom, ScheduleItem } from '../types';
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
  Calendar,
  Plus,
  Trash2,
  Edit2,
  X,
  Sliders,
  Activity,
  RefreshCw,
  Laptop,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

const RecentActivitiesSection: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [filterCategory, setFilterCategory] = useState<'semua' | 'nilai_cbt' | 'pengumuman' | 'presensi_jurnal' | 'sistem'>('semua');
  const [isExpanded, setIsExpanded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const activities = useMemo(() => {
    const list: Array<{
      id: string;
      category: 'nilai_cbt' | 'pengumuman' | 'presensi_jurnal' | 'sistem';
      title: string;
      description: string;
      actor: string;
      roleBadge: string;
      timestamp: string;
      targetTab: string;
      badgeText: string;
      badgeColor: string;
    }> = [];

    // 1. CBT Exam submissions
    try {
      const examSubs = DataService.getExamSubmissions();
      examSubs.forEach((sub) => {
        list.push({
          id: 'act-cbt-' + sub.id,
          category: 'nilai_cbt',
          title: 'Hasil Ujian CBT Telah Selesai Dikerjakan',
          description: `Siswa ${sub.studentName} telah menyelesaikan paket ujian dengan skor ${sub.score}. Berkas jawaban tersimpan di sistem.`,
          actor: sub.studentName,
          roleBadge: 'Siswa',
          timestamp: sub.completedAt || 'Hari ini',
          targetTab: 'exams',
          badgeText: 'Ujian CBT',
          badgeColor: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        });
      });
    } catch {}

    // 2. Assignment submissions & grades
    try {
      const subs = DataService.getSubmissions();
      subs.slice(0, 8).forEach((sub) => {
        list.push({
          id: 'act-sub-' + sub.id,
          category: 'nilai_cbt',
          title: sub.score ? 'Nilai Tugas Telah Diberikan Guru' : 'Pengumpulan Tugas Mandiri Siswa',
          description: `${sub.studentName} mengumpulkan tugas ${sub.fileName || ''} ${sub.score ? `— Nilai: ${sub.score} (${sub.feedback || 'Tuntas'})` : '— Menunggu pemeriksaan guru'}.`,
          actor: sub.studentName,
          roleBadge: 'Penilaian',
          timestamp: sub.submittedAt || 'Hari ini',
          targetTab: 'assignments',
          badgeText: 'Tugas & Nilai',
          badgeColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
        });
      });
    } catch {}

    // 3. Announcements
    try {
      const ann = DataService.getAnnouncements();
      ann.forEach((a) => {
        list.push({
          id: 'act-ann-' + a.id,
          category: 'pengumuman',
          title: a.title,
          description: a.content.length > 110 ? a.content.substring(0, 110) + '...' : a.content,
          actor: a.authorName,
          roleBadge: 'Sekolah',
          timestamp: a.date,
          targetTab: 'announcements',
          badgeText: a.priority || 'Pengumuman',
          badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        });
      });
    } catch {}

    // 4. Teaching Journals & Attendance
    try {
      const journals = DataService.getJournals();
      journals.slice(0, 6).forEach((j) => {
        list.push({
          id: 'act-jrn-' + j.id,
          category: 'presensi_jurnal',
          title: `Jurnal Guru: ${j.subjectName} (${j.className})`,
          description: `Materi: "${j.topic}". Presensi: ${j.attendanceCount?.hadir ?? 0} Hadir, ${j.attendanceCount?.sakit ?? 0} Sakit, ${j.attendanceCount?.alpa ?? 0} Alfa.`,
          actor: j.teacherName,
          roleBadge: 'Guru',
          timestamp: j.date,
          targetTab: 'teaching_journals',
          badgeText: 'Jurnal Belajar',
          badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        });
      });
    } catch {}

    // 5. System Action Audit Logs
    try {
      const logs = DataService.getAuditLogs();
      logs.slice(0, 10).forEach((l) => {
        let tab = 'dashboard';
        const modLower = l.module.toLowerCase();
        if (modLower.includes('nilai') || modLower.includes('tugas')) tab = 'assignments';
        else if (modLower.includes('ujian') || modLower.includes('cbt')) tab = 'exams';
        else if (modLower.includes('presensi') || modLower.includes('kehadiran')) tab = 'attendance';
        else if (modLower.includes('siswa')) tab = 'students';
        else if (modLower.includes('guru')) tab = 'teachers';
        else if (modLower.includes('jadwal')) tab = 'schedule';
        else if (modLower.includes('profil') || modLower.includes('kop') || modLower.includes('pengaturan')) tab = 'settings';

        list.push({
          id: 'act-log-' + l.id,
          category: 'sistem',
          title: `Aktivitas Modul: ${l.module}`,
          description: l.details,
          actor: l.userName,
          roleBadge: l.role.replace('_', ' ').toUpperCase(),
          timestamp: l.timestamp,
          targetTab: tab,
          badgeText: l.action,
          badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        });
      });
    } catch {}

    return list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [refreshKey]);

  const filtered = filterCategory === 'semua'
    ? activities
    : activities.filter((a) => a.category === filterCategory);

  const displayed = isExpanded ? filtered : filtered.slice(0, 5);

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
      {/* Header Aktivitas Terbaru */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span>Aktivitas & Log Operasional Terbaru</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {activities.length} Tercatat
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Gambaran cepat mengenai nilai ujian baru, pengumuman sekolah, jurnal mengajar, dan aksi pengguna terkini.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Segarkan Log Aktivitas"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Kategori */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { key: 'semua', label: 'Semua Aktivitas' },
          { key: 'nilai_cbt', label: 'Nilai & CBT' },
          { key: 'pengumuman', label: 'Pengumuman' },
          { key: 'presensi_jurnal', label: 'Jurnal & Presensi' },
          { key: 'sistem', label: 'Aktivitas Sistem' },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilterCategory(f.key as any)}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer text-xs ${
              filterCategory === f.key
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Daftar Item Aktivitas */}
      {displayed.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
          Belum ada aktivitas pada kategori ini.
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayed.map((item) => (
            <div
              key={item.id}
              className="p-3 sm:p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/50 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${item.badgeColor}`}>
                    {item.badgeText}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    · {item.timestamp}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.description}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{item.actor}</span>
                  <span className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 font-medium">
                    {item.roleBadge}
                  </span>
                </div>
              </div>

              <div className="shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => onNavigate(item.targetTab)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer shadow-2xs"
                >
                  <span>Buka Modul</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toggle Selengkapnya */}
      {filtered.length > 5 && (
        <div className="pt-2 flex justify-center border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>{isExpanded ? 'Tampilkan Lebih Sedikit' : `Lihat Semua Aktivitas (${filtered.length})`}</span>
            <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? '-rotate-90' : 'rotate-90'}`} />
          </button>
        </div>
      )}
    </div>
  );
};

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { currentUser, roleInfo, activeChildId, setActiveChildId } = useAuth();
  const profile = DataService.getSchoolProfile();
  const [students, setStudents] = useState<Student[]>(() => DataService.getStudents());
  const [teachers, setTeachers] = useState<Teacher[]>(() => DataService.getTeachers());
  const [classes, setClasses] = useState<ClassRoom[]>(() => DataService.getClasses());

  // Teacher Schedule state for Requirement 6
  const [teacherSchedules, setTeacherSchedules] = useState<ScheduleItem[]>(() =>
    DataService.getTeacherSchedules(currentUser.id, currentUser.name)
  );
  const [isManageScheduleOpen, setIsManageScheduleOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [schedDay, setSchedDay] = useState<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat'>('Senin');
  const [schedTime, setSchedTime] = useState('07.30 - 09.00');
  const [schedSubject, setSchedSubject] = useState('Matematika Wajib');
  const [schedClass, setSchedClass] = useState('X MIPA 1');
  const [schedRoom, setSchedRoom] = useState('Ruang X MIPA 1');

  useEffect(() => {
    setStudents(DataService.getStudents());
    setTeachers(DataService.getTeachers());
    setClasses(DataService.getClasses());
    if (currentUser.role === 'guru') {
      setTeacherSchedules(DataService.getTeacherSchedules(currentUser.id, currentUser.name));
    }
  }, [currentUser.id, currentUser.name, currentUser.role]);

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

      {/* Komponen Aktivitas Terbaru (Requirement 5) */}
      <RecentActivitiesSection onNavigate={onNavigate} />

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
                {students.length}
              </p>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">100% Terdaftar di Sistem</p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Tenaga Pendidik</span>
                <GraduationCap className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                {teachers.length}
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
                  <span className="text-slate-600 dark:text-slate-400">Modul & Bahan Ajar Digital</span>
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
                  onClick={() => setIsManageScheduleOpen(true)}
                  className="w-full p-3 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/30 hover:border-indigo-500 flex items-center justify-between text-left text-xs transition-colors cursor-pointer"
                >
                  <div>
                    <span className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      Kelola Jadwal Mengajar Saya
                    </span>
                    <span className="text-slate-500 text-[11px] block mt-0.5">
                      Atur dan input jam pelajaran mengajar per kelas & rombel binaan.
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-indigo-600" />
                </button>

                <button
                  onClick={() => onNavigate('attendance')}
                  className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-500 flex items-center justify-between text-left text-xs transition-colors cursor-pointer"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Input Presensi Pertemuan Hari Ini
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Catat kehadiran peserta didik jam ke-1 s.d. 3 kelas binaan.
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
                      Catat materi yang diajarkan, kendala, dan refleksi kelas mandiri.
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
                      Periksa & Beri Nilai Tugas Peserta Didik
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Input nilai 0-100 dan umpan balik konstruktif bagi peserta didik.
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Requirement 6: Reminder Jadwal Mengajar Terdekat Lengkap Hari, Jam, Mata Pelajaran, Kelas */}
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Jadwal Mengajar Terdekat
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsManageScheduleOpen(true)}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Kelola Jadwal</span>
                  </button>
                </div>

                {teacherSchedules.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-center space-y-2">
                    <Clock className="w-6 h-6 text-amber-600 mx-auto" />
                    <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                      Belum Ada Jadwal Mengajar yang Diinput
                    </p>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300">
                      Anda belum menginput jam pelajaran. Silakan klik tombol di bawah untuk menambahkan hari, jam, mata pelajaran, dan kelas mengajar Anda agar pengingat aktif.
                    </p>
                    <button
                      onClick={() => setIsManageScheduleOpen(true)}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs cursor-pointer shadow-xs"
                    >
                      Input Jadwal Mengajar Sekarang
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5 text-xs">
                    {teacherSchedules.map((item, idx) => {
                      const isNext = idx === 0;
                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                            isNext
                              ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 shadow-2xs'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {item.subjectName}
                              </span>
                              <span className="font-semibold text-indigo-700 dark:text-indigo-300 px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900/60 text-[10px]">
                                Kelas {item.className}
                              </span>
                            </div>
                            <span className="text-slate-600 dark:text-slate-300 text-[11px]">
                              <strong>{item.day}</strong>, Jam <strong>{item.timeRange}</strong> {item.room ? `(${item.room})` : ''}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide shrink-0 ${
                              isNext
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {isNext ? 'Jadwal Terdekat' : 'Sesi Terjadwal'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Total: {teacherSchedules.length} Sesi Mengajar Terdaftar</span>
                <button
                  onClick={() => setIsManageScheduleOpen(true)}
                  className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                >
                  Tambah Jam Mengajar &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. WALI KELAS DASHBOARD */}
      {/* 4. WALI KELAS DASHBOARD */}
      {currentUser.role === 'wali_kelas' && (
        <div className="space-y-6">
          {(() => {
            const homeroomStudents = students.filter((s) => s.classId === currentUser.classId);
            const homeroomClass = classes.find((c) => c.id === currentUser.classId) || classes[0];
            const totalStudentsCount = homeroomStudents.length;
            const atRiskStudents = homeroomStudents.filter(
              (s) => (s.attendance?.alpa || 0) >= 3 || s.gpa < 75
            );
            const atRiskCount = atRiskStudents.length;
            const activePresentCount = Math.max(0, totalStudentsCount - atRiskCount);
            const avgGpa = totalStudentsCount > 0
              ? (homeroomStudents.reduce((acc, s) => acc + s.gpa, 0) / totalStudentsCount).toFixed(1)
              : '85.4';

            return (
              <>
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                      {homeroomClass?.name.replace(/[^0-9A-Z]/g, '').substring(0, 4) || 'X-1'}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-emerald-950 dark:text-emerald-100">
                        Kelas Binaan: {homeroomClass?.name || 'X MIPA 1'}
                      </h3>
                      <p className="text-xs text-emerald-800 dark:text-emerald-300">
                        Total {totalStudentsCount} Peserta Didik Terdaftar · Tahun Ajaran 2024/2025 Ganjil · Wali Kelas: {currentUser.name}
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
                      {totalStudentsCount > 0 ? Math.round((activePresentCount / totalStudentsCount) * 100) : 95.2}%
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {activePresentCount} dari {totalStudentsCount} peserta didik hadir aktif
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs text-slate-500">Rerata Nilai Raport</span>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
                      {avgGpa}
                    </p>
                    <p className="text-[11px] text-emerald-600 mt-0.5">Di atas KKM 75</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs text-slate-500">Peserta Didik Perlu Perhatian</span>
                    <p className="text-2xl font-bold text-amber-600 font-mono tabular-nums mt-1">
                      {atRiskCount} Peserta Didik
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {atRiskStudents[0]?.name ? `${atRiskStudents[0].name} (Alpa ${atRiskStudents[0].attendance?.alpa} hari)` : 'Semua peserta didik aman'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs text-slate-500">Komunikasi Wali Murid</span>
                    <p className="text-2xl font-bold text-indigo-600 font-mono tabular-nums mt-1">
                      100%
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Nomor ortu terverifikasi</p>
                  </div>
                </div>
              </>
            );
          })()}
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

      {/* Modal Kelola Jadwal Mengajar Guru Mata Pelajaran (Requirement 6) */}
      {isManageScheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Kelola Jadwal Mengajar Guru Mata Pelajaran
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Input jam pelajaran mengajar Anda untuk memunculkan reminder "Jadwal Mengajar Terdekat" di dashboard.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsManageScheduleOpen(false);
                  setEditingScheduleId(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Input Sesi Mengajar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const targetClass = classes.find((c) => c.name === schedClass || c.id === schedClass);
                const itemPayload = {
                  id: editingScheduleId || undefined,
                  day: schedDay,
                  period: 1,
                  timeRange: schedTime,
                  classId: targetClass?.id || 'cls-xmipa1',
                  className: targetClass?.name || schedClass,
                  subjectId: 'sub-custom',
                  subjectName: schedSubject,
                  teacherId: currentUser.id,
                  teacherName: currentUser.name,
                  room: schedRoom,
                };
                DataService.saveTeacherScheduleItem(itemPayload, {
                  id: currentUser.id,
                  name: currentUser.name,
                  role: currentUser.role,
                });
                setTeacherSchedules(DataService.getTeacherSchedules(currentUser.id, currentUser.name));
                setEditingScheduleId(null);
              }}
              className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3 text-xs"
            >
              <h4 className="font-bold text-indigo-950 dark:text-indigo-200">
                {editingScheduleId ? 'Ubah Jam Mengajar' : 'Tambah Jam Pelajaran Mengajar Baru'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Hari Mengajar
                  </label>
                  <select
                    value={schedDay}
                    onChange={(e) => setSchedDay(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Senin">Senin</option>
                    <option value="Selasa">Selasa</option>
                    <option value="Rabu">Rabu</option>
                    <option value="Kamis">Kamis</option>
                    <option value="Jumat">Jumat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Jam / Waktu Pertemuan
                  </label>
                  <input
                    type="text"
                    required
                    value={schedTime}
                    onChange={(e) => setSchedTime(e.target.value)}
                    placeholder="Contoh: 07.45 - 09.15"
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Mata Pelajaran
                  </label>
                  <input
                    type="text"
                    required
                    value={schedSubject}
                    onChange={(e) => setSchedSubject(e.target.value)}
                    placeholder="Contoh: Matematika Wajib"
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Kelas / Rombel
                  </label>
                  <select
                    value={schedClass}
                    onChange={(e) => setSchedClass(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.name}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Ruang Kelas / Lab
                  </label>
                  <input
                    type="text"
                    value={schedRoom}
                    onChange={(e) => setSchedRoom(e.target.value)}
                    placeholder="Contoh: Ruang X MIPA 1"
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                {editingScheduleId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingScheduleId(null);
                      setSchedTime('07.30 - 09.00');
                    }}
                    className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                  >
                    Batal Ubah
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{editingScheduleId ? 'Simpan Perubahan Sesi' : 'Tambahkan Sesi Mengajar'}</span>
                </button>
              </div>
            </form>

            {/* List Sesi Mengajar Terdaftar */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Daftar Jam Mengajar Anda ({teacherSchedules.length} Sesi Terdaftar):
              </span>

              {teacherSchedules.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs border border-dashed rounded-lg">
                  Belum ada jam mengajar yang terdaftar. Gunakan formulir di atas untuk menambahkan.
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-1.5 text-xs">
                  {teacherSchedules.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {item.day}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                            {item.timeRange}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                            {item.subjectName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Kelas: <strong>{item.className}</strong> {item.room ? `| ${item.room}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingScheduleId(item.id);
                            setSchedDay(item.day as any);
                            setSchedTime(item.timeRange);
                            setSchedSubject(item.subjectName);
                            setSchedClass(item.className);
                            setSchedRoom(item.room);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                          title="Ubah Sesi"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            DataService.deleteTeacherScheduleItem(item.id, {
                              id: currentUser.id,
                              name: currentUser.name,
                              role: currentUser.role,
                            });
                            setTeacherSchedules(DataService.getTeacherSchedules(currentUser.id, currentUser.name));
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Hapus Sesi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsManageScheduleOpen(false);
                  setEditingScheduleId(null);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
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
