import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { ScheduleItem, ScheduleBlockConfig, LessonPeriodConfig } from '../types';
import { PrintModal } from '../components/common/PrintModal';
import {
  Calendar,
  Clock,
  Printer,
  Filter,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Building,
  Zap,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Lock,
  Plus,
  Trash2,
  Sliders,
  Lightbulb,
  Check,
  HelpCircle,
  Users,
} from 'lucide-react';

export interface ConflictDetail {
  id: string;
  itemId: string;
  day: string;
  period: number;
  timeRange: string;
  subjectName: string;
  teacherName: string;
  className: string;
  classId: string;
  room: string;
  conflictType: 'teacher' | 'room' | 'both';
  otherClasses: string[];
  otherSubjects: string[];
  otherTeachers: string[];
  reasons: string[];
  solutions: string[];
}

export const ScheduleView: React.FC = () => {
  const { currentUser } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => DataService.getSchedule());
  const [blocks, setBlocks] = useState<ScheduleBlockConfig[]>(() => DataService.getScheduleBlocks());
  const classes = DataService.getClasses();
  const teachers = DataService.getTeachers();
  const subjects = DataService.getSubjects();
  const profile = DataService.getSchoolProfile();

  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || 'cls-xmipa1');
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Anti-Bentrok Generator Modal
  const [generatorModalOpen, setGeneratorModalOpen] = useState(false);
  const [generatorSuccessMsg, setGeneratorSuccessMsg] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // JP Duration & Lesson Period Config State (Super Admin & Wakasek Kurikulum)
  const [jpConfigModalOpen, setJpConfigModalOpen] = useState(false);
  const [jpConfig, setJpConfig] = useState<LessonPeriodConfig>(() => DataService.getLessonPeriodConfig());

  // Block Manager Modal State
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [newBlockDay, setNewBlockDay] = useState<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat'>('Senin');
  const [newBlockPeriod, setNewBlockPeriod] = useState<number>(1);
  const [newBlockTimeRange, setNewBlockTimeRange] = useState('07:30 - 08:00');
  const [newBlockTitle, setNewBlockTitle] = useState('Upacara Bendera');

  // Conflict Details Modal States
  const [selectedConflict, setSelectedConflict] = useState<ConflictDetail | null>(null);
  const [showAllConflictsModal, setShowAllConflictsModal] = useState(false);

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'] as const;

  const currentClassName = classes.find((c) => c.id === selectedClassId)?.name || 'X MIPA 1';
  const filteredSchedule = schedule.filter((s) => s.classId === selectedClassId);

  // Permission: Super Admin, Wakasek Kurikulum, and Operator
  const canManageSchedule = ['super_admin', 'wakasek_kurikulum', 'operator'].includes(currentUser.role);

  // Comprehensive Conflict Detection & Detailed Reason/Solution Generator
  const { conflictMap, allConflictsList, totalConflicts } = useMemo(() => {
    const map: Record<string, ConflictDetail> = {};
    const conflictList: ConflictDetail[] = [];

    // Map by slot
    schedule.forEach((item) => {
      if (item.isBlocked) return;

      const clashingItems = schedule.filter(
        (other) =>
          other.id !== item.id &&
          !other.isBlocked &&
          other.day === item.day &&
          other.period === item.period &&
          (other.teacherId === item.teacherId || other.room === item.room)
      );

      if (clashingItems.length > 0) {
        const teacherClash = clashingItems.some((o) => o.teacherId === item.teacherId);
        const roomClash = clashingItems.some((o) => o.room === item.room);
        const conflictType: 'teacher' | 'room' | 'both' =
          teacherClash && roomClash ? 'both' : teacherClash ? 'teacher' : 'room';

        const otherClasses = Array.from(new Set(clashingItems.map((o) => o.className)));
        const otherSubjects = Array.from(new Set(clashingItems.map((o) => o.subjectName)));
        const otherTeachers = Array.from(new Set(clashingItems.map((o) => o.teacherName)));

        const reasons: string[] = [];
        if (teacherClash) {
          reasons.push(
            `Guru ${item.teacherName} terjadwal mengajar di ${item.className} (${item.subjectName}) dan secara bersamaan di ${otherClasses.join(', ')} (${otherSubjects.join(', ')}) pada hari ${item.day} Jam ke-${item.period} (${item.timeRange}). Fisik guru tidak dapat berada di dua ruang kelas berbeda dalam jam yang sama.`
          );
        }
        if (roomClash) {
          reasons.push(
            `Ruang belajar "${item.room}" dialokasikan ganda untuk rombel ${item.className} dan ${otherClasses.join(', ')} pada waktu yang bersamaan. Ini mengakibatkan tumpang tindih sarana ruang kelas.`
          );
        }

        const solutions: string[] = [
          `Pembagian Rombel Paralel: Jika mata pelajaran diajar oleh 2 guru (misal Pak Rustan di X MIPA 1-2, dan Bu Rini di X IPS 1-2), pastikan penugasan rombel pada menu Tenaga Pendidik sudah sesuai sehingga jadwal tidak tumpang tindih.`,
          `Pertukaran Jam Mengajar (Slot Swap): Tukar jam ke-${item.period} kelas ${item.className} dengan jam kosong atau mapel guru lain di hari ${item.day}.`,
          `Relokasi Ruang Kelas: Pindahkan salah satu rombel ke laboratorium, perpustakaan, atau ruang multimedia cadangan.`,
          `Generate Anti-Bentrok Otomatis: Klik tombol "Eksekusi Generate Anti-Bentrok" agar sistem secara otomatis menata ulang jadwal bebas bentrok dengan memperhitungkan rombel yang diampu setiap guru.`
        ];

        const detail: ConflictDetail = {
          id: `conf-${item.id}`,
          itemId: item.id,
          day: item.day,
          period: item.period,
          timeRange: item.timeRange,
          subjectName: item.subjectName,
          teacherName: item.teacherName,
          className: item.className,
          classId: item.classId,
          room: item.room,
          conflictType,
          otherClasses,
          otherSubjects,
          otherTeachers,
          reasons,
          solutions,
        };

        map[item.id] = detail;
        conflictList.push(detail);
      }
    });

    return {
      conflictMap: map,
      allConflictsList: conflictList,
      totalConflicts: Math.ceil(conflictList.length / 2),
    };
  }, [schedule]);

  // Handle Simulate Conflict for Demo / Testing Purposes
  const handleSimulateConflict = () => {
    // Intentionally create a conflict between first 2 non-blocked items
    const nonBlocked = schedule.filter((s) => !s.isBlocked);
    if (nonBlocked.length >= 2) {
      const item1 = nonBlocked[0];
      const item2 = nonBlocked.find((s) => s.classId !== item1.classId && !s.isBlocked) || nonBlocked[1];
      const updated = schedule.map((s) => {
        if (s.id === item2.id) {
          return {
            ...s,
            day: item1.day,
            period: item1.period,
            timeRange: item1.timeRange,
            teacherId: item1.teacherId,
            teacherName: item1.teacherName,
          };
        }
        return s;
      });
      setSchedule(updated);
      setSelectedClassId(item1.classId);
    }
  };

  const handleAddBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockTitle.trim()) return;

    const newBlock: ScheduleBlockConfig = {
      id: `blk-${Date.now()}`,
      day: newBlockDay,
      period: Number(newBlockPeriod),
      timeRange: newBlockTimeRange,
      title: newBlockTitle,
      isActive: true,
    };

    DataService.saveScheduleBlock(newBlock, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });

    setBlocks(DataService.getScheduleBlocks());
    setNewBlockTitle('');
  };

  const handleToggleBlock = (block: ScheduleBlockConfig) => {
    const updated = { ...block, isActive: !block.isActive };
    DataService.saveScheduleBlock(updated, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });
    setBlocks(DataService.getScheduleBlocks());
  };

  const handleDeleteBlock = (id: string) => {
    DataService.deleteScheduleBlock(id, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });
    setBlocks(DataService.getScheduleBlocks());
  };

  const handleAutoResolveConflict = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const res = DataService.resolveScheduleConflicts({
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      });

      setSchedule(DataService.getSchedule());
      setIsGenerating(false);
      setSelectedConflict(null);
      setShowAllConflictsModal(false);
      setGeneratorModalOpen(false);
      setGeneratorSuccessMsg(res.message);
      setTimeout(() => {
        setGeneratorSuccessMsg(null);
      }, 4000);
    }, 400);
  };

  const handleExecuteGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const res = DataService.generateAntiConflictSchedule({
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      });

      setSchedule(DataService.getSchedule());
      setIsGenerating(false);
      setGeneratorSuccessMsg(res.message);
      setSelectedConflict(null);
      setShowAllConflictsModal(false);
      setTimeout(() => {
        setGeneratorModalOpen(false);
        setGeneratorSuccessMsg(null);
      }, 3000);
    }, 600);
  };

  const handleSaveJpConfig = (e: React.FormEvent) => {
    e.preventDefault();
    DataService.saveLessonPeriodConfig(jpConfig, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });
    setSchedule(DataService.getSchedule());
    setJpConfigModalOpen(false);
    setGeneratorSuccessMsg(
      `Pengaturan Jam Pelajaran berhasil disimpan! Durasi 1 JP = ${jpConfig.jpDurationMinutes} menit, KBM mulai ${jpConfig.startTime}, alokasi ${jpConfig.defaultJpPerMeeting} JP/pertemuan.`
    );
    setTimeout(() => setGeneratorSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Jadwal Pelajaran & Kalender Pembelajaran
          </h2>
          <p className="text-xs text-slate-500">
            Penyusunan jadwal otomatis bebas bentrok, penandaan khusus jadwal bermasalah dengan fitur Alasan & Solusi, blok kegiatan rutin, dan pengesahan resmi Wakasek Kurikulum.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManageSchedule && (
            <>
              {/* Tombol Atur JP & Durasi KBM */}
              <button
                onClick={() => setJpConfigModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors cursor-pointer"
                title="Kelola durasi tiap JP (misal: 1 JP = 45 menit, 2 JP/pertemuan) dan jam mulai KBM"
              >
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Atur JP & Durasi ({jpConfig.jpDurationMinutes}m/JP)</span>
              </button>

              <button
                onClick={() => setBlockModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                title="Atur blok waktu khusus seperti Upacara Bendera dan Ibadah sebelum generate jadwal"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>Atur Blok Jadwal ({blocks.filter((b) => b.isActive).length} Aktif)</span>
              </button>

              <button
                onClick={() => setGeneratorModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Generate Anti Bentrok Jadwal</span>
              </button>
            </>
          )}

          <button
            onClick={() => setPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak Jadwal Rombel (F4)</span>
          </button>
        </div>
      </div>

      {/* Global Success / Conflict Resolved Toast Banner */}
      {generatorSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs rounded-xl flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{generatorSuccessMsg}</span>
          </div>
          <button
            onClick={() => setGeneratorSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 font-bold text-xs cursor-pointer ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* Conflict Status Badge Banner */}
      <div
        className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
          totalConflicts === 0
            ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {totalConflicts === 0 ? (
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce shrink-0" />
          )}
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Validasi Jadwal Pembelajaran:
            </span>
            <span
              className={`ml-2 font-semibold ${
                totalConflicts === 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400 font-bold'
              }`}
            >
              {totalConflicts === 0
                ? '0 Bentrok Terdeteksi (Optimal & Sinkron Rombel-PTK)'
                : `${totalConflicts} Titik Bentrok Jadwal Terdeteksi!`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          {totalConflicts > 0 ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAllConflictsModal(true)}
                className="px-2.5 py-1 rounded-md bg-rose-600 text-white font-bold hover:bg-rose-700 cursor-pointer shadow-xs"
              >
                Lihat Ringkasan Bentrok ({allConflictsList.length})
              </button>
              {canManageSchedule && (
                <button
                  onClick={handleAutoResolveConflict}
                  className="px-2.5 py-1 rounded-md bg-emerald-600 text-white font-bold hover:bg-emerald-700 cursor-pointer shadow-xs flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Selesaikan Bentrok Otomatis</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-500">
              <span>{classes.length} Rombel</span>
              <span>·</span>
              <span>{teachers.length} Guru</span>
              <span>·</span>
              <span>{blocks.filter((b) => b.isActive).length} Blok Terkunci</span>
              {canManageSchedule && (
                <button
                  onClick={handleSimulateConflict}
                  className="ml-2 text-[10px] text-slate-500 underline hover:text-indigo-600 cursor-pointer"
                  title="Simulasikan bentrok untuk menguji indikator, alasan, dan solusi"
                >
                  [Simulasi Uji Bentrok]
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Class Selector Filter */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-600 dark:text-slate-400">Pilih Rombongan Belajar:</span>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer font-bold"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.major}) - Wali: {c.homeroomTeacherName}
              </option>
            ))}
          </select>
        </div>

        <div className="text-slate-500 text-[11px] hidden sm:block">
          Format Dokumen Cetak: Folio / F4 Resmi (Tanda Tangan Wakasek Kurikulum)
        </div>
      </div>

      {/* Days Grid Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {days.map((day) => {
          const dayItems = filteredSchedule
            .filter((s) => s.day === day)
            .sort((a, b) => a.period - b.period);

          return (
            <div
              key={day}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs flex flex-col"
            >
              <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/60 text-center">
                <span className="font-bold text-xs text-indigo-900 dark:text-indigo-200 uppercase tracking-wide">
                  {day}
                </span>
              </div>

              <div className="p-2 space-y-2 flex-1">
                {dayItems.length === 0 ? (
                  <p className="text-[11px] text-slate-400 text-center py-6">
                    Tidak ada jadwal
                  </p>
                ) : (
                  dayItems.map((item) => {
                    const conflict = conflictMap[item.id];

                    if (item.isBlocked) {
                      return (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-lg border border-amber-300 dark:border-amber-800/80 bg-amber-50/80 dark:bg-amber-950/40 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px] text-amber-700 dark:text-amber-300 font-mono">
                            <span className="font-bold">Jam Ke-{item.period}</span>
                            <span>{item.timeRange.split(' ')[0]}</span>
                          </div>
                          <p className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1">
                            <Lock className="w-3 h-3 text-amber-600 shrink-0" />
                            {item.blockTitle || item.subjectName}
                          </p>
                          <p className="text-[10px] text-amber-700/80 dark:text-amber-400 font-medium">
                            Blok Rutin Sekolah
                          </p>
                        </div>
                      );
                    }

                    // Conflicting Item: Tanda Khusus Bentrok & Tombol Alasan dan Solusi
                    if (conflict) {
                      return (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-lg border-2 border-rose-500 bg-rose-50/90 dark:bg-rose-950/50 text-xs space-y-1.5 shadow-xs relative"
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="font-bold text-rose-800 dark:text-rose-300">Jam Ke-{item.period}</span>
                            <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold text-[9px] uppercase tracking-wider animate-pulse flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" /> Bentrok
                            </span>
                          </div>

                          <p className="font-bold text-rose-950 dark:text-rose-100 line-clamp-1">
                            {item.subjectName}
                          </p>
                          <p className="text-[11px] text-rose-800 dark:text-rose-300 font-medium line-clamp-1">
                            {item.teacherName}
                          </p>
                          <p className="text-[10px] text-rose-700 dark:text-rose-400 font-mono flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {item.room} · Tabrakan dgn: {conflict.otherClasses.join(', ')}
                          </p>

                          <button
                            type="button"
                            onClick={() => setSelectedConflict(conflict)}
                            className="w-full mt-1.5 py-1 px-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer shadow-xs transition-colors"
                          >
                            <Lightbulb className="w-3 h-3 text-amber-300" />
                            <span>Lihat Alasan & Solusi</span>
                          </button>
                        </div>
                      );
                    }

                    // Normal Non-conflicting Item
                    return (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs space-y-1 hover:border-indigo-400 transition-colors"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>Jam Ke-{item.period}</span>
                          <span>{item.timeRange.split(' ')[0]}</span>
                        </div>
                        <p className="font-bold text-slate-900 dark:text-white line-clamp-1">
                          {item.subjectName}
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1">
                          {item.teacherName}
                        </p>
                        <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {item.room}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: DETAIL ALASAN & SOLUSI JADWAL BENTROK */}
      {selectedConflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 border-2 border-rose-500 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-rose-100 dark:border-rose-900/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    Detail Jadwal Bentrok & Solusi Pencegahan
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {selectedConflict.day} Jam Ke-{selectedConflict.period} ({selectedConflict.timeRange}) · Kelas {selectedConflict.className}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedConflict(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Sesi Bermasalah Card */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block">Mata Pelajaran:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedConflict.subjectName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Guru Pengampu:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedConflict.teacherName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Ruangan:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedConflict.room}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Rombel Bertabrakan:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{selectedConflict.otherClasses.join(', ')}</span>
              </div>
            </div>

            {/* Bagian 1: ALASAN BENTROK */}
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 space-y-1.5">
              <h4 className="font-bold text-rose-900 dark:text-rose-200 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                Alasan Terjadinya Bentrok (Root Cause Analysis):
              </h4>
              <ul className="space-y-1.5 text-[11px] text-rose-800 dark:text-rose-300 list-disc list-inside leading-relaxed">
                {selectedConflict.reasons.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>

            {/* Bagian 2: SOLUSI AGAR TIDAK BENTROK */}
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900 space-y-2">
              <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0" />
                Rekomendasi Solusi Agar Bebas Bentrok:
              </h4>
              <ul className="space-y-1.5 text-[11px] text-emerald-800 dark:text-emerald-300 list-decimal list-inside leading-relaxed">
                {selectedConflict.solutions.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedConflict(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
              >
                Tutup
              </button>

              {canManageSchedule && (
                <button
                  type="button"
                  onClick={handleAutoResolveConflict}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Selesaikan Bentrok Otomatis</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DAFTAR SEMUA BENTROK DI SELURUH SEKOLAH */}
      {showAllConflictsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Daftar Rekapitulasi Bentrok Jadwal Seluruh Rombel ({allConflictsList.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Sistem mendeteksi jadwal yang tumpang tindih antar guru dan ruangan.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAllConflictsModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {allConflictsList.map((c, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-rose-900 dark:text-rose-200">
                      {c.day} Jam Ke-{c.period} ({c.timeRange})
                    </span>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300">
                      Kelas <strong>{c.className}</strong> ({c.subjectName}) bertabrakan dengan <strong>{c.otherClasses.join(', ')}</strong>
                    </p>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400">
                      Guru: {c.teacherName} · Ruang: {c.room}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setShowAllConflictsModal(false);
                      setSelectedConflict(c);
                    }}
                    className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-rose-300 text-rose-700 dark:text-rose-300 font-bold text-[10px] hover:bg-rose-100 shrink-0 cursor-pointer"
                  >
                    Alasan & Solusi
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAllConflictsModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
              >
                Tutup
              </button>

              {canManageSchedule && (
                <button
                  type="button"
                  onClick={handleAutoResolveConflict}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Selesaikan Semua Bentrok Sekaligus</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PENGATURAN BLOK JADWAL RUTIN (SEBELUM GENERATE) */}
      {blockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Pengaturan Blok Jadwal Rutin Sebelum Generate
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Kunci sesi tertentu agar tidak dialokasikan untuk mata pelajaran reguler.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBlockModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* List Active Blocks */}
            <div className="space-y-2 max-h-56 overflow-y-auto">
              <span className="font-bold text-slate-700 dark:text-slate-300 block">
                Daftar Blok Kegiatan Rutin Saat Ini:
              </span>
              {blocks.length === 0 ? (
                <p className="text-slate-400 text-center py-4">Belum ada blok yang ditetapkan.</p>
              ) : (
                blocks.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={b.isActive}
                        onChange={() => handleToggleBlock(b)}
                        className="rounded text-indigo-600 cursor-pointer"
                        title="Aktifkan / Nonaktifkan blok"
                      />
                      <div>
                        <span className={`font-bold ${b.isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 line-through'}`}>
                          {b.day} Jam ke-{b.period} ({b.timeRange})
                        </span>
                        <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                          {b.title}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteBlock(b.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Hapus blok"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Form Tambah Blok Baru */}
            <form onSubmit={handleAddBlock} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px] uppercase tracking-wider">
                + Tambah Blok Jadwal Rutin Baru
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Hari</label>
                  <select
                    value={newBlockDay}
                    onChange={(e) => setNewBlockDay(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {days.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Jam Ke-</label>
                  <select
                    value={newBlockPeriod}
                    onChange={(e) => setNewBlockPeriod(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                      <option key={p} value={p}>Jam ke-{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Rentang Waktu</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 07:30 - 08:00"
                    value={newBlockTimeRange}
                    onChange={(e) => setNewBlockTimeRange(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Nama Kegiatan Rutin</label>
                  <input
                    type="text"
                    required
                    placeholder="Upacara / Ibadah / Kerja Bakti"
                    value={newBlockTitle}
                    onChange={(e) => setNewBlockTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Simpan Blok Rutin</span>
                </button>
              </div>
            </form>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setBlockModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
              >
                Tutup & Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GENERATE ANTI BENTROK JADWAL (KHUSUS ADMIN & WAKASEK KURIKULUM) */}
      {generatorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
                  <Zap className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Generator Jadwal Pelajaran Anti-Bentrok
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Otomasi penyusunan jadwal bebas bentrok guru, waktu, dan alokasi blok rutin.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setGeneratorModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            {generatorSuccessMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{generatorSuccessMsg}</span>
              </div>
            )}

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Aturan & Parameter Algoritma Anti-Bentrok:
                </h4>
                <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400 list-disc list-inside">
                  <li><strong>Blok Rutin Dilindungi:</strong> {blocks.filter((b) => b.isActive).map((b) => `${b.day} (${b.title})`).join(', ') || 'Tidak ada blok aktif'}. Sesi ini dikunci dari mapel reguler.</li>
                  <li><strong>Guru Tanpa Tumpang Tindih:</strong> Tidak ada guru yang mengajar di 2 rombel pada hari dan jam yang sama.</li>
                  <li><strong>Rombel yang Diampu Guru:</strong> Memprioritaskan alokasi rombel spesifik yang telah ditugaskan ke setiap guru mapel.</li>
                  <li><strong>Beban Jam Terdistribusi:</strong> Jam pembelajaran merata dari Senin sampai Jumat.</li>
                  <li><strong>Penandatangan Resmi:</strong> Jadwal disahkan oleh Wakil Kepala Sekolah Bidang Kurikulum ({profile.vicePrincipalCurriculumName || 'Dra. Hj. Nurul Hidayati, M.Pd.'}).</li>
                </ul>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[10px] text-slate-400 block">Rombel Kelas</span>
                  <span className="font-bold text-sm text-slate-800 dark:text-white font-mono">{classes.length}</span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[10px] text-slate-400 block">Mata Pelajaran</span>
                  <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400 font-mono">{subjects.length}</span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[10px] text-slate-400 block">Guru Pengampu</span>
                  <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 font-mono">{teachers.length}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setGeneratorModalOpen(false)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isGenerating}
                onClick={handleExecuteGenerate}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Memproses Jadwal Bebas Bentrok...' : 'Eksekusi Generate Anti-Bentrok'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PENGATURAN JAM PELAJARAN & DURASI JP (SUPER ADMIN & WAKASEK KURIKULUM) */}
      {jpConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
                  <Clock className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Pengaturan Jam Pelajaran (JP) & Durasi KBM
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Dikelola oleh Super Admin & Wakasek Kurikulum. Menentukan durasi menit per JP dan jam pertemuan.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setJpConfigModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveJpConfig} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Durasi 1 JP (Menit)
                  </label>
                  <input
                    type="number"
                    min={30}
                    max={60}
                    required
                    value={jpConfig.jpDurationMinutes}
                    onChange={(e) =>
                      setJpConfig({ ...jpConfig, jpDurationMinutes: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Standar SMA: 45 menit / JP
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Jam Mulai KBM (Pagi)
                  </label>
                  <input
                    type="time"
                    required
                    value={jpConfig.startTime}
                    onChange={(e) => setJpConfig({ ...jpConfig, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Waktu mulai sesi Jam Ke-1
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Alokasi JP per Pertemuan
                  </label>
                  <select
                    value={jpConfig.defaultJpPerMeeting}
                    onChange={(e) =>
                      setJpConfig({ ...jpConfig, defaultJpPerMeeting: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer font-bold"
                  >
                    <option value={1}>1 JP / Pertemuan ({jpConfig.jpDurationMinutes} Menit)</option>
                    <option value={2}>2 JP / Pertemuan ({jpConfig.jpDurationMinutes * 2} Menit)</option>
                    <option value={3}>3 JP / Pertemuan ({jpConfig.jpDurationMinutes * 3} Menit)</option>
                    <option value={4}>4 JP / Pertemuan (Praktikum Blok)</option>
                  </select>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Misal guru menghabiskan 2 JP/sesi
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Total Jam Ke- per Hari
                  </label>
                  <select
                    value={jpConfig.totalPeriodsPerDay}
                    onChange={(e) =>
                      setJpConfig({ ...jpConfig, totalPeriodsPerDay: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer font-bold"
                  >
                    <option value={6}>6 JP per Hari</option>
                    <option value={7}>7 JP per Hari</option>
                    <option value={8}>8 JP per Hari (Standar)</option>
                    <option value={9}>9 JP per Hari</option>
                    <option value={10}>10 JP per Hari</option>
                  </select>
                </div>
              </div>

              {/* Istirahat Settings */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">
                  Jadwal Waktu Istirahat:
                </span>
                <div className="space-y-2">
                  {jpConfig.breaks.map((brk, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                    >
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {brk.name}
                        </span>
                        <p className="text-[10px] text-slate-400">
                          Setelah Jam Ke-{brk.afterPeriod}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        <span>{brk.durationMinutes} Menit</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setJpConfigModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-xs"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Simpan & Terapkan Pengaturan JP</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Modal Jadwal - Format F4 & Ditandatangani Wakasek Kurikulum */}
      <PrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        title="Cetak Jadwal Pelajaran Resmi"
        documentTitle={`JADWAL PELAJARAN KELAS ${currentClassName}`}
        documentNumber={`421.2 / KUR / ${currentClassName.replace(/\s+/g, '')} / 2024`}
        rightSignerTitle="Wakil Kepala Sekolah Bidang Kurikulum"
        rightSignerName={profile.vicePrincipalCurriculumName || 'Dra. Hj. Nurul Hidayati, M.Pd.'}
        rightSignerNip={profile.vicePrincipalCurriculumNip || '19790815 200501 2 006'}
      >
        <div className="space-y-4">
          <table className="w-full border-collapse border border-black text-xs">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-black py-2 px-2 text-center w-24">Hari</th>
                <th className="border border-black py-2 px-2 text-center w-12">Jam</th>
                <th className="border border-black py-2 px-2 text-center w-28">Waktu</th>
                <th className="border border-black py-2 px-3 text-left">Mata Pelajaran / Kegiatan</th>
                <th className="border border-black py-2 px-3 text-left">Guru Pengampu</th>
                <th className="border border-black py-2 px-2 text-center w-24">Ruang</th>
              </tr>
            </thead>
            <tbody>
              {/* Nama hari di jadwal cukup 1 saja menggunakan rowSpan per hari */}
              {days.map((day) => {
                const dayItems = filteredSchedule
                  .filter((s) => s.day === day)
                  .sort((a, b) => a.period - b.period);

                if (dayItems.length === 0) return null;

                return dayItems.map((s, idx) => {
                  const conflict = conflictMap[s.id];
                  return (
                    <tr key={s.id} className={s.isBlocked ? 'bg-amber-50/50' : conflict ? 'bg-rose-50' : ''}>
                      {idx === 0 && (
                        <td
                          rowSpan={dayItems.length}
                          className="border border-black py-2 px-2 text-center font-bold align-middle bg-slate-50 text-slate-900"
                        >
                          {day}
                        </td>
                      )}
                      <td className="border border-black py-1 px-2 text-center font-mono">{s.period}</td>
                      <td className="border border-black py-1 px-2 text-center font-mono text-[11px]">{s.timeRange}</td>
                      <td className="border border-black py-1 px-3 font-semibold">
                        {s.isBlocked ? (
                          <span className="text-amber-900 font-bold uppercase tracking-wide">
                            [BLOK] {s.blockTitle || s.subjectName}
                          </span>
                        ) : conflict ? (
                          <span className="text-rose-700 font-bold">
                            ⚠️ [BENTROK] {s.subjectName}
                          </span>
                        ) : (
                          s.subjectName
                        )}
                      </td>
                      <td className="border border-black py-1 px-3">
                        {s.isBlocked ? (
                          <span className="text-slate-500 italic">Kegiatan Rutin Sekolah</span>
                        ) : (
                          s.teacherName
                        )}
                      </td>
                      <td className="border border-black py-1 px-2 text-center font-mono">{s.room}</td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      </PrintModal>
    </div>
  );
};
