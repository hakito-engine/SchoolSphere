import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { CounselingRecord, Student } from '../types';
import { PrintModal } from '../components/common/PrintModal';
import {
  HeartHandshake,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Plus,
  Printer,
  CheckCircle2,
  Clock,
  UserCheck,
  Search,
} from 'lucide-react';

export const CounselingView: React.FC = () => {
  const { currentUser } = useAuth();
  const [records, setRecords] = useState<CounselingRecord[]>(() => DataService.getCounselingRecords());
  const [searchQuery, setSearchQuery] = useState('');
  const students = DataService.getStudents();

  // Early alert students: Alpa >= 3 or GPA < 75
  const atRiskStudents = students.filter(
    (s) => s.attendance.alpa >= 3 || s.gpa < 75
  );

  // Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<CounselingRecord>>({
    studentId: students[0]?.id || 'std-ahmad',
    studentName: students[0]?.name || 'Ahmad Fauzi',
    className: students[0]?.className || 'X MIPA 1',
    category: 'Akademik',
    issueSummary: '',
    followUpPlan: '',
    status: 'Penjadwalan',
    isConfidential: true,
  });

  // Print Modal
  const [printModalOpen, setPrintModalOpen] = useState(false);

  const handleOpenAdd = (student?: Student) => {
    const s = student || students[0];
    setFormData({
      id: 'cns-' + Date.now(),
      studentId: s.id,
      studentName: s.name,
      className: s.className,
      counselorId: currentUser.id,
      counselorName: currentUser.name,
      date: new Date().toISOString().substring(0, 10),
      category: student && student.attendance.alpa >= 3 ? 'Kedisiplinan' : 'Akademik',
      issueSummary: student
        ? `Tercatat akumulasi alpa ${student.attendance.alpa} hari dan nilai rata-rata ${student.gpa}.`
        : '',
      followUpPlan: 'Sesi konseling individual dan koordinasi wali kelas.',
      status: 'Penjadwalan',
      isConfidential: true,
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.issueSummary || !formData.followUpPlan) return;

    const selectedStd = students.find((s) => s.id === formData.studentId);

    const payload: CounselingRecord = {
      id: formData.id || 'cns-' + Date.now(),
      studentId: formData.studentId || 'std-01',
      studentName: selectedStd ? selectedStd.name : formData.studentName || 'Siswa',
      className: selectedStd ? selectedStd.className : formData.className || 'X MIPA 1',
      counselorId: currentUser.id,
      counselorName: currentUser.name,
      date: formData.date || new Date().toISOString().substring(0, 10),
      category: formData.category || 'Pribadi',
      issueSummary: formData.issueSummary,
      followUpPlan: formData.followUpPlan,
      status: formData.status || 'Berjalan',
      isConfidential: formData.isConfidential ?? true,
    };

    DataService.saveCounselingRecord(payload, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });

    setRecords(DataService.getCounselingRecords());
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Bimbingan & Konseling (BK)
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Rekam Rahasia & Terproteksi
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Layanan bimbingan pribadi, akademik, sosial, dan karir, serta tindak lanjut siswa dalam peringatan dini.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak Rekap Konseling</span>
          </button>
          <button
            onClick={() => handleOpenAdd()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Sesi Konseling</span>
          </button>
        </div>
      </div>

      {/* Early Support Alert Panel */}
      <div className="p-5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-3">
        <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200 font-bold text-xs uppercase tracking-wide">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>Early Support Alert: Indikator Peringatan Siswa Butuh Pendampingan</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Siswa di bawah terdeteksi melebihi ambang batas ketidakhadiran (Alpa &ge; 3 hari) atau nilai akademik di bawah standar kelulusan KKM 75.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {atRiskStudents.map((std) => (
            <div
              key={std.id}
              className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 flex items-center justify-between text-xs"
            >
              <div>
                <p className="font-bold text-slate-900 dark:text-white">
                  {std.name} ({std.className})
                </p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                  <span className="text-rose-600 font-bold">Alpa: {std.attendance.alpa} hari</span>
                  <span>·</span>
                  <span>Rata-rata: {std.gpa}</span>
                  <span>·</span>
                  <span>Ortu: {std.parentName}</span>
                </div>
              </div>
              <button
                onClick={() => handleOpenAdd(std)}
                className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold cursor-pointer shrink-0"
              >
                Jadwalkan Konseling
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Counseling Records List & Search */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Riwayat Bimbingan & Tindak Lanjut ({records.length})
          </h3>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 max-w-sm w-full text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Cari siswa, kelas, pokok masalah, atau konselor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-slate-900 dark:text-white focus:outline-hidden text-xs"
            />
          </div>
        </div>

        {records
          .filter(
            (rec) =>
              rec.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              rec.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
              rec.issueSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
              rec.followUpPlan.toLowerCase().includes(searchQuery.toLowerCase()) ||
              rec.counselorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              rec.category.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((rec) => (
          <div
            key={rec.id}
            className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white">
                  {rec.studentName} ({rec.className})
                </span>
                <span className="text-slate-300">·</span>
                <span className="font-semibold text-teal-700 dark:text-teal-300">
                  Kategori: {rec.category}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-400 font-mono">{rec.date}</span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    rec.status === 'Selesai'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {rec.status}
                </span>
                {rec.isConfidential && (
                  <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Rahasia
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  Ringkasan Pokok Masalah
                </p>
                <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                  {rec.issueSummary}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  Rencana Tindak Lanjut & Rekomendasi
                </p>
                <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                  {rec.followUpPlan}
                </p>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-400 flex justify-between">
              <span>Konselor: <strong>{rec.counselorName}</strong></span>
              <span>Hak Akses: Khusus Guru BK & Kepala Sekolah</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Counseling */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              Catat Sesi Bimbingan & Konseling
            </h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Peserta Didik
                  </label>
                  <select
                    value={formData.studentId || ''}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.className})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Kategori Layanan
                  </label>
                  <select
                    value={formData.category || 'Akademik'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="Akademik">Akademik</option>
                    <option value="Kedisiplinan">Kedisiplinan</option>
                    <option value="Pribadi">Pribadi</option>
                    <option value="Karir/Studi Lanjut">Karir/Studi Lanjut</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Deskripsi / Pokok Bahasan Masalah
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.issueSummary || ''}
                  onChange={(e) => setFormData({ ...formData, issueSummary: e.target.value })}
                  placeholder="Ringkasan hasil wawancara atau pengamatan..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                ></textarea>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Rencana Tindak Lanjut & Konsultasi
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.followUpPlan || ''}
                  onChange={(e) => setFormData({ ...formData, followUpPlan: e.target.value })}
                  placeholder="Langkah pendampingan, pemanggilan orang tua, atau kontrak belajar..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Status Kasus
                  </label>
                  <select
                    value={formData.status || 'Berjalan'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="Penjadwalan">Penjadwalan</option>
                    <option value="Berjalan">Berjalan</option>
                    <option value="Tindak Lanjut">Tindak Lanjut</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Tanggal Sesi
                  </label>
                  <input
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold cursor-pointer"
                >
                  Simpan Catatan BK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Modal */}
      <PrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        title="Cetak Laporan Rekapitulasi Bimbingan Konseling"
        documentTitle="LAPORAN REKAPITULASI BIMBINGAN DAN KONSELING (BK)"
        documentNumber="421.8 / BK / SMA-NU / X / 2024"
        leftSignerTitle="Guru Bimbingan dan Konseling"
        leftSignerName="Dewi Lestari, S.Psi., M.Pd."
        leftSignerNip="19891104 201402 2 003"
      >
        <div className="space-y-4">
          <table className="w-full border-collapse border border-black text-xs">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-black py-2 px-2 text-center w-8">No</th>
                <th className="border border-black py-2 px-2 text-center w-24">Tanggal</th>
                <th className="border border-black py-2 px-3 text-left">Nama Siswa & Kelas</th>
                <th className="border border-black py-2 px-2 text-center w-24">Kategori</th>
                <th className="border border-black py-2 px-3 text-left">Uraian Kasus & Tindak Lanjut</th>
                <th className="border border-black py-2 px-2 text-center w-20">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={r.id}>
                  <td className="border border-black py-1 px-2 text-center font-mono">{i + 1}</td>
                  <td className="border border-black py-1 px-2 text-center font-mono">{r.date}</td>
                  <td className="border border-black py-1 px-3">
                    <strong>{r.studentName}</strong> ({r.className})
                  </td>
                  <td className="border border-black py-1 px-2 text-center">{r.category}</td>
                  <td className="border border-black py-1 px-3 text-[11px]">
                    <div>{r.issueSummary}</div>
                    <div className="text-slate-600 italic mt-0.5">Rencana: {r.followUpPlan}</div>
                  </td>
                  <td className="border border-black py-1 px-2 text-center font-bold text-[10px] uppercase">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PrintModal>
    </div>
  );
};
