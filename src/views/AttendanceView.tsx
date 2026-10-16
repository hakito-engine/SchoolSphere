import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { DailyAttendance, AttendanceRecordItem } from '../types';
import { PrintModal } from '../components/common/PrintModal';
import {
  CalendarCheck,
  CheckCircle2,
  Calendar,
  Filter,
  Save,
  Printer,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

export const AttendanceView: React.FC = () => {
  const { currentUser } = useAuth();
  const classes = DataService.getClasses();
  const allSubjects = DataService.getSubjects();
  const students = DataService.getStudents();
  const existingAttendances = DataService.getAttendance();

  // Filter subjects accessible:
  // Guru can only select & manage subjects they teach
  const subjects = currentUser.role === 'guru'
    ? allSubjects.filter(
        (s) =>
          s.teacherId === currentUser.id ||
          currentUser.assignedSubjectIds?.includes(s.id)
      )
    : allSubjects;

  const [selectedDate, setSelectedDate] = useState('2024-10-09');
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || 'cls-xmipa1');
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    subjects[0]?.id || allSubjects[0]?.id || 'sub-mat-10'
  );

  // Permission verification:
  // 1. Wali kelas can only monitor, cannot edit teacher's attendance data
  // 2. Guru can only edit if this subject is taught by them
  const isSubjectTeacher =
    currentUser.role === 'guru' &&
    subjects.some((s) => s.id === selectedSubjectId);
  // Strict rule: Only Subject Teacher can edit attendance. Super Admin & Wali Kelas are in Mode Pantau.
  const canEditAttendance = isSubjectTeacher;
  const isObserverMode = !canEditAttendance;

  // Filter students belonging to selected class
  const classStudents = students.filter((s) => s.classId === selectedClassId);

  // Initialize or fetch records for selected date & class
  const existingRecord = existingAttendances.find(
    (a) => a.date === selectedDate && a.classId === selectedClassId
  );

  const [records, setRecords] = useState<AttendanceRecordItem[]>(() => {
    if (existingRecord) return existingRecord.records;
    return classStudents.map((s) => ({
      studentId: s.id,
      studentName: s.name,
      status: 'H',
      note: '',
    }));
  });

  // Re-sync when date/class changes
  const handleFilterChange = (date: string, classId: string) => {
    setSelectedDate(date);
    setSelectedClassId(classId);

    const found = existingAttendances.find(
      (a) => a.date === date && a.classId === classId
    );
    const targetStudents = students.filter((s) => s.classId === classId);

    if (found) {
      setRecords(found.records);
    } else {
      setRecords(
        targetStudents.map((s) => ({
          studentId: s.id,
          studentName: s.name,
          status: 'H',
          note: '',
        }))
      );
    }
  };

  const handleStatusChange = (studentId: string, status: 'H' | 'S' | 'I' | 'A' | 'T') => {
    if (!canEditAttendance) return;
    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status } : r))
    );
  };

  const handleNoteChange = (studentId: string, note: string) => {
    if (!canEditAttendance) return;
    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, note } : r))
    );
  };

  const handleMarkAllPresent = () => {
    if (!canEditAttendance) return;
    setRecords((prev) => prev.map((r) => ({ ...r, status: 'H' })));
  };

  const [savedSuccess, setSavedSuccess] = useState(false);
  const handleSaveAttendance = () => {
    if (!canEditAttendance) return;
    const targetClass = classes.find((c) => c.id === selectedClassId);
    const targetSubject = allSubjects.find((s) => s.id === selectedSubjectId);

    const payload: DailyAttendance = {
      id: `att-${selectedDate}-${selectedClassId}`,
      date: selectedDate,
      classId: selectedClassId,
      className: targetClass?.name || 'X MIPA 1',
      subjectId: selectedSubjectId,
      subjectName: targetSubject?.name || 'Matematika',
      teacherId: currentUser.id,
      records,
    };

    DataService.saveAttendance(payload, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Print modal state
  const [printOpen, setPrintOpen] = useState(false);

  // Statistics
  const hadirCount = records.filter((r) => r.status === 'H').length;
  const sakitCount = records.filter((r) => r.status === 'S').length;
  const izinCount = records.filter((r) => r.status === 'I').length;
  const alpaCount = records.filter((r) => r.status === 'A').length;
  const terlambatCount = records.filter((r) => r.status === 'T').length;
  const totalStudents = records.length;
  const percentage = totalStudents > 0 ? Math.round((hadirCount / totalStudents) * 100) : 0;

  const currentClassName = classes.find((c) => c.id === selectedClassId)?.name || 'X MIPA 1';

  if (currentUser.role === 'siswa') {
    const student = students.find(
      (s) =>
        s.id === currentUser.id ||
        (s.nisn && s.nisn === currentUser.nipOrNisn) ||
        s.name.toLowerCase().replace(/[^a-z0-9]/g, '') === currentUser.username
    ) || students[0];

    const myHistory: {
      date: string;
      subjectName: string;
      className: string;
      status: 'H' | 'S' | 'I' | 'A' | 'T';
      note?: string;
    }[] = [];

    existingAttendances.forEach((att) => {
      const rec = att.records.find((r) => r.studentId === student.id || r.studentName === student.name);
      if (rec) {
        myHistory.push({
          date: att.date,
          subjectName: att.subjectName || 'Presensi Harian',
          className: att.className,
          status: rec.status,
          note: rec.note,
        });
      }
    });

    const attSummary = student?.attendance || {
      hadir: myHistory.filter((h) => h.status === 'H').length || 52,
      sakit: myHistory.filter((h) => h.status === 'S').length || 1,
      izin: myHistory.filter((h) => h.status === 'I').length || 0,
      alpa: myHistory.filter((h) => h.status === 'A').length || 0,
      terlambat: myHistory.filter((h) => h.status === 'T').length || 0,
    };

    const totalDays = attSummary.hadir + attSummary.sakit + attSummary.izin + attSummary.alpa;
    const attPct = totalDays > 0 ? Math.round((attSummary.hadir / totalDays) * 100) : 98;

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-indigo-600" />
              <span>Rekapitulasi Kehadiran Presensi Saya</span>
            </h2>
            <p className="text-xs text-slate-500">
              Laporan kehadiran Anda di kelas {student.className} (NISN: {student.nisn}). Anda hanya dapat melihat data kehadiran Anda sendiri demi menjaga privasi siswa.
            </p>
          </div>
          <button
            onClick={() => setPrintOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer self-start sm:self-auto"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak Rekap Presensi Saya</span>
          </button>
        </div>

        {/* 6 Status Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500">Persentase</span>
            <p className="text-xl font-bold text-emerald-600 font-mono mt-0.5">{attPct}%</p>
            <span className="text-[10px] text-emerald-600 font-medium">Tingkat Kehadiran</span>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
            <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">Hadir (H)</span>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-200 font-mono mt-0.5">{attSummary.hadir}</p>
            <span className="text-[10px] text-emerald-600">Hari Masuk</span>
          </div>
          <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 shadow-2xs">
            <span className="text-[11px] font-semibold text-blue-800 dark:text-blue-300">Sakit (S)</span>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-200 font-mono mt-0.5">{attSummary.sakit}</p>
            <span className="text-[10px] text-blue-600">Surat Dokter</span>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 shadow-2xs">
            <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">Izin (I)</span>
            <p className="text-xl font-bold text-amber-700 dark:text-amber-200 font-mono mt-0.5">{attSummary.izin}</p>
            <span className="text-[10px] text-amber-600">Izin Resmi</span>
          </div>
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 shadow-2xs">
            <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-300">Alpa (A)</span>
            <p className="text-xl font-bold text-rose-700 dark:text-rose-200 font-mono mt-0.5">{attSummary.alpa}</p>
            <span className="text-[10px] text-rose-600">Tanpa Keterangan</span>
          </div>
          <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 shadow-2xs">
            <span className="text-[11px] font-semibold text-purple-800 dark:text-purple-300">Terlambat (T)</span>
            <p className="text-xl font-bold text-purple-700 dark:text-purple-200 font-mono mt-0.5">{attSummary.terlambat}</p>
            <span className="text-[10px] text-purple-600">Masuk Jam Ke-2+</span>
          </div>
        </div>

        {/* History Table */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Riwayat Presensi Pribadi Anda
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold">
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Mata Pelajaran</th>
                  <th className="py-2.5 px-3">Kelas</th>
                  <th className="py-2.5 px-3 text-center">Status Kehadiran</th>
                  <th className="py-2.5 px-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {myHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                      Belum ada catatan presensi detail untuk akun Anda.
                    </td>
                  </tr>
                ) : (
                  myHistory.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono text-slate-500">{item.date}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{item.subjectName}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{item.className}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-bold text-[11px] ${
                            item.status === 'H'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : item.status === 'S'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : item.status === 'I'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : item.status === 'T'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {item.status === 'H' ? 'HADIR' : item.status === 'S' ? 'SAKIT' : item.status === 'I' ? 'IZIN' : item.status === 'T' ? 'TERLAMBAT' : 'ALPA'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{item.note || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Print Modal for Student */}
        <PrintModal
          isOpen={printOpen}
          onClose={() => setPrintOpen(false)}
          title="Cetak Rekap Presensi Siswa"
          documentTitle="LEMBAR REKAPITULASI PRESENSI PESERTA DIDIK"
          documentNumber={`421.1 / ATT / ${student.nisn} / 2024`}
          rightSignerTitle="Wali Kelas"
          rightSignerName="Budi Santoso, S.Si."
          rightSignerNip="19820311 200801 1 007"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2 border-b border-black pb-2">
              <div>
                <p>Nama Siswa: <strong>{student.name}</strong></p>
                <p>NISN / NIS: <strong>{student.nisn} / {student.nis}</strong></p>
              </div>
              <div>
                <p>Kelas / Rombel: <strong>{student.className}</strong></p>
                <p>Semester / Tahun Ajaran: <strong>Ganjil 2024/2025</strong></p>
              </div>
            </div>
            <table className="w-full border-collapse border border-black text-xs">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-black py-2 px-3 text-center">Hadir (H)</th>
                  <th className="border border-black py-2 px-3 text-center">Sakit (S)</th>
                  <th className="border border-black py-2 px-3 text-center">Izin (I)</th>
                  <th className="border border-black py-2 px-3 text-center">Alpa (A)</th>
                  <th className="border border-black py-2 px-3 text-center">Terlambat (T)</th>
                  <th className="border border-black py-2 px-3 text-center">% Kehadiran</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black py-2 px-3 text-center font-bold">{attSummary.hadir} Hari</td>
                  <td className="border border-black py-2 px-3 text-center">{attSummary.sakit} Hari</td>
                  <td className="border border-black py-2 px-3 text-center">{attSummary.izin} Hari</td>
                  <td className="border border-black py-2 px-3 text-center">{attSummary.alpa} Hari</td>
                  <td className="border border-black py-2 px-3 text-center">{attSummary.terlambat} Hari</td>
                  <td className="border border-black py-2 px-3 text-center font-bold text-emerald-800">{attPct}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </PrintModal>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Presensi & Kehadiran Peserta Didik
          </h2>
          <p className="text-xs text-slate-500">
            Pencatatan status Hadir (H), Sakit (S), Izin (I), Alpa (A), dan Terlambat (T) per pertemuan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPrintOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak Rekap Presensi</span>
          </button>
          {canEditAttendance ? (
            <button
              onClick={handleSaveAttendance}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Presensi</span>
            </button>
          ) : (
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg">
              Mode Pantau (Hanya Baca)
            </span>
          )}
        </div>
      </div>

      {isObserverMode && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {currentUser.role === 'super_admin'
              ? 'Mode Pantau Super Admin (Read-Only): Anda memantau kehadiran di seluruh rombel & mata pelajaran. Pengisian presensi hanya dapat dilakukan dan disimpan oleh Guru Mata Pelajaran pengampu.'
              : currentUser.role === 'wali_kelas'
              ? 'Wali Kelas memantau kehadiran siswa di kelas binaan (Hanya Baca). Guru Mata Pelajaran pengampu yang bertugas mencatat dan mengubah data presensi.'
              : 'Mode Pantau: Hanya Guru Mata Pelajaran yang mengampu mata pelajaran ini yang dapat menginput presensi.'}
          </span>
        </div>
      )}

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs rounded-lg flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Presensi berhasil disimpan ke basis data dan dicatat ke audit log.</span>
        </div>
      )}

      {/* Control Filter & KPI Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Tanggal Presensi
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleFilterChange(e.target.value, selectedClassId)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Kelas / Rombel
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => handleFilterChange(selectedDate, e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Mata Pelajaran
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div className="self-end ml-auto">
            <button
              onClick={handleMarkAllPresent}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              Tandai Semua Hadir (H)
            </button>
          </div>
        </div>

        {/* Realtime Badges */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-around text-center text-xs">
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Hadir</p>
            <p className="text-xl font-bold text-emerald-600 font-mono">{hadirCount}</p>
          </div>
          <div className="border-l border-slate-100 dark:border-slate-800 pl-3">
            <p className="text-[11px] text-slate-500 font-medium">Sakit</p>
            <p className="text-xl font-bold text-blue-600 font-mono">{sakitCount}</p>
          </div>
          <div className="border-l border-slate-100 dark:border-slate-800 pl-3">
            <p className="text-[11px] text-slate-500 font-medium">Izin</p>
            <p className="text-xl font-bold text-amber-600 font-mono">{izinCount}</p>
          </div>
          <div className="border-l border-slate-100 dark:border-slate-800 pl-3">
            <p className="text-[11px] text-slate-500 font-medium">Alpa</p>
            <p className="text-xl font-bold text-rose-600 font-mono">{alpaCount}</p>
          </div>
          <div className="border-l border-slate-100 dark:border-slate-800 pl-3">
            <p className="text-[11px] text-slate-500 font-medium">Rasio</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">{percentage}%</p>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Peserta Didik</th>
                <th className="py-3 px-4 text-center">Status Kehadiran</th>
                <th className="py-3 px-4">Catatan / Alasan Ketidakhadiran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    Tidak ada siswa terdaftar pada kelas ini.
                  </td>
                </tr>
              ) : (
                records.map((r, index) => (
                  <tr
                    key={r.studentId}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 text-center font-mono text-slate-400">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {r.studentName}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex rounded-lg p-1 bg-slate-100 dark:bg-slate-800 gap-1">
                        {(['H', 'S', 'I', 'A', 'T'] as const).map((statusKey) => {
                          const isActive = r.status === statusKey;
                          let activeClass = 'bg-indigo-600 text-white font-bold';
                          if (statusKey === 'H') activeClass = 'bg-emerald-600 text-white font-bold';
                          if (statusKey === 'S') activeClass = 'bg-blue-600 text-white font-bold';
                          if (statusKey === 'I') activeClass = 'bg-amber-600 text-white font-bold';
                          if (statusKey === 'A') activeClass = 'bg-rose-600 text-white font-bold';
                          if (statusKey === 'T') activeClass = 'bg-orange-600 text-white font-bold';

                          return (
                            <button
                              key={statusKey}
                              type="button"
                              onClick={() => handleStatusChange(r.studentId, statusKey)}
                              className={`w-7 h-7 text-xs rounded-md transition-colors cursor-pointer ${
                                isActive
                                  ? activeClass
                                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                              }`}
                              title={
                                statusKey === 'H'
                                  ? 'Hadir'
                                  : statusKey === 'S'
                                  ? 'Sakit'
                                  : statusKey === 'I'
                                  ? 'Izin'
                                  : statusKey === 'A'
                                  ? 'Alpa'
                                  : 'Terlambat'
                              }
                            >
                              {statusKey}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        placeholder="Keterangan dispensasi / alasan jika tidak hadir..."
                        value={r.note || ''}
                        onChange={(e) => handleNoteChange(r.studentId, e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Modal Rekapitulasi Presensi */}
      <PrintModal
        isOpen={printOpen}
        onClose={() => setPrintOpen(false)}
        title="Cetak Rekapitulasi Presensi Kelas"
        documentTitle={`REKAPITULASI KEHADIRAN KELAS ${currentClassName}`}
        documentNumber={`421.5 / ATT / ${currentClassName.replace(/\s+/g, '')} / X / 2024`}
        leftSignerTitle={`Guru Mata Pelajaran / Wali Kelas`}
        leftSignerName={currentUser.name}
        leftSignerNip={currentUser.nipOrNisn || '19820311 200801 1 007'}
      >
        <div className="space-y-4">
          <div className="flex justify-between text-xs font-semibold mb-2">
            <span>Tanggal: {selectedDate}</span>
            <span>Kelas: {currentClassName}</span>
            <span>Tahun Ajaran: 2024/2025 (Ganjil)</span>
          </div>

          <table className="w-full border-collapse border border-black text-xs">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-black py-2 px-2 text-center w-10">No</th>
                <th className="border border-black py-2 px-3 text-left">Nama Peserta Didik</th>
                <th className="border border-black py-2 px-2 text-center w-24">Status</th>
                <th className="border border-black py-2 px-3 text-left">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={r.studentId}>
                  <td className="border border-black py-1 px-2 text-center font-mono">{i + 1}</td>
                  <td className="border border-black py-1 px-3 font-semibold">{r.studentName}</td>
                  <td className="border border-black py-1 px-2 text-center font-bold">
                    {r.status === 'H' ? 'HADIR' : r.status === 'S' ? 'SAKIT' : r.status === 'I' ? 'IZIN' : r.status === 'A' ? 'ALPA' : 'TERLAMBAT'}
                  </td>
                  <td className="border border-black py-1 px-3">{r.note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="p-3 border border-black text-xs font-semibold flex justify-around">
            <span>Hadir: {hadirCount}</span>
            <span>Sakit: {sakitCount}</span>
            <span>Izin: {izinCount}</span>
            <span>Alpa: {alpaCount}</span>
            <span>Persentase Kehadiran: {percentage}%</span>
          </div>
        </div>
      </PrintModal>
    </div>
  );
};
