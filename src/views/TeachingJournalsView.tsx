import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { TeachingJournal } from '../types';
import { PrintModal } from '../components/common/PrintModal';
import {
  FileSpreadsheet,
  Plus,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  Search,
  Filter,
  Check,
  X,
} from 'lucide-react';

export const TeachingJournalsView: React.FC = () => {
  const { currentUser } = useAuth();
  const [journals, setJournals] = useState<TeachingJournal[]>(() => DataService.getJournals());
  const classes = DataService.getClasses();
  const subjects = DataService.getSubjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<TeachingJournal>>({
    date: new Date().toISOString().substring(0, 10),
    timeSlot: 'Jam Ke-1 s.d. 3 (07.30 - 09.45)',
    classId: classes[0]?.id || 'cls-xmipa1',
    className: classes[0]?.name || 'X MIPA 1',
    subjectId: subjects[0]?.id || 'sub-mat-10',
    subjectName: subjects[0]?.name || 'Matematika Wajib',
    topic: '',
    activities: '',
    attendanceCount: { hadir: 31, sakit: 1, izin: 0, alpa: 0 },
    obstacles: '',
    reflection: '',
    status: 'dikirim',
  });

  // Approval Modal for Kepsek
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewJournalTarget, setReviewJournalTarget] = useState<TeachingJournal | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // Print Modal
  const [printModalOpen, setPrintModalOpen] = useState(false);

  const filteredJournals = journals.filter((j) => {
    const matchesSearch =
      j.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.subjectName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || j.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleOpenAdd = () => {
    setFormData({
      id: 'jrn-' + Date.now(),
      date: new Date().toISOString().substring(0, 10),
      timeSlot: 'Jam Ke-1 s.d. 3 (07.30 - 09.45)',
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      classId: classes[0]?.id || 'cls-xmipa1',
      className: classes[0]?.name || 'X MIPA 1',
      subjectId: subjects[0]?.id || 'sub-mat-10',
      subjectName: subjects[0]?.name || 'Matematika Wajib',
      topic: '',
      activities: '',
      attendanceCount: { hadir: 31, sakit: 1, izin: 0, alpa: 0 },
      obstacles: '',
      reflection: '',
      status: 'dikirim',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic || !formData.activities) return;

    const targetClass = classes.find((c) => c.id === formData.classId);
    const targetSubject = subjects.find((s) => s.id === formData.subjectId);

    const payload: TeachingJournal = {
      ...(formData as TeachingJournal),
      className: targetClass?.name || 'X MIPA 1',
      subjectName: targetSubject?.name || 'Matematika Wajib',
      teacherId: currentUser.id,
      teacherName: currentUser.name,
    };

    DataService.saveJournal(payload, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });

    setJournals(DataService.getJournals());
    setIsModalOpen(false);
  };

  const handleOpenReview = (journal: TeachingJournal) => {
    setReviewJournalTarget(journal);
    setReviewNotes(journal.principalNotes || 'Kegiatan pembelajaran terlaksana dengan baik sesuai capaian kompetensi.');
    setReviewModalOpen(true);
  };

  const handleConfirmReview = (status: 'disetujui' | 'revisi') => {
    if (!reviewJournalTarget) return;

    DataService.reviewJournal(reviewJournalTarget.id, status, reviewNotes, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });

    setJournals(DataService.getJournals());
    setReviewModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Jurnal Pembelajaran & Refleksi Mengajar
          </h2>
          <p className="text-xs text-slate-500">
            Pencatatan realisasi materi, keaktifan kelas, kendala, refleksi, serta supervisi Kepala Sekolah.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak Rekap Jurnal</span>
          </button>
          {currentUser.role === 'guru' && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Isi Jurnal Mengajar</span>
            </button>
          )}
        </div>
      </div>

      {currentUser.role === 'super_admin' && (
        <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200 text-xs rounded-lg flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-600 shrink-0" />
          <span>
            Mode Pantau Super Admin (Read-Only): Anda dapat memantau seluruh catatan jurnal mengajar guru dan supervisi Kepala Sekolah. Pengisian jurnal pembelajaran khusus dilakukan oleh Guru Mata Pelajaran yang bersangkutan.
          </span>
        </div>
      )}

      {currentUser.role === 'wali_kelas' && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs rounded-lg flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Mode Pemantauan Wali Kelas (Hanya Baca): Anda memantau realisasi materi dan refleksi jurnal mengajar di kelas binaan Anda. Pengisian jurnal dilakukan oleh Guru Mata Pelajaran pengampu.
          </span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari topik, guru, atau mata pelajaran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-44 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="disetujui">Disetujui</option>
            <option value="dikirim">Menunggu Review</option>
            <option value="draft">Draft</option>
            <option value="revisi">Perlu Revisi</option>
          </select>
        </div>
      </div>

      {/* Journal Cards List */}
      <div className="space-y-4">
        {filteredJournals.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            Belum ada jurnal pembelajaran yang cocok.
          </div>
        ) : (
          filteredJournals.map((j) => (
            <div
              key={j.id}
              className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {j.subjectName}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-xs">
                    {j.className}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-500 text-xs font-mono">{j.date}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      j.status === 'disetujui'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : j.status === 'dikirim'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : j.status === 'revisi'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {j.status}
                  </span>

                  {currentUser.role === 'kepala_sekolah' && (
                    <button
                      onClick={() => handleOpenReview(j)}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 transition-colors cursor-pointer"
                    >
                      Supervisi / Sahkan
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    Topik Pembelajaran
                  </p>
                  <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {j.topic}
                  </p>

                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mt-3">
                    Aktivitas & Metode
                  </p>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                    {j.activities}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    Kehadiran & Kendala
                  </p>
                  <div className="flex items-center gap-2 font-mono text-[11px] mt-0.5 text-slate-700 dark:text-slate-300">
                    <span className="text-emerald-600 font-bold">{j.attendanceCount.hadir} Hadir</span>
                    <span>·</span>
                    <span className="text-blue-600">{j.attendanceCount.sakit} Sakit</span>
                    <span>·</span>
                    <span className="text-amber-600">{j.attendanceCount.izin} Izin</span>
                    <span>·</span>
                    <span className="text-rose-600 font-bold">{j.attendanceCount.alpa} Alpa</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mt-1 italic">
                    Kendala: {j.obstacles || 'Tidak ada kendala berarti.'}
                  </p>

                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mt-3">
                    Refleksi Guru
                  </p>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                    {j.reflection || 'Pembelajaran telah sesuai modul ajar.'}
                  </p>
                </div>
              </div>

              {j.principalNotes && (
                <div className="p-3 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs">
                  <span className="font-bold text-indigo-950 dark:text-indigo-200">
                    Catatan Supervisi Kepala Sekolah:
                  </span>
                  <p className="text-indigo-900 dark:text-indigo-300 mt-0.5">
                    {j.principalNotes}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400">
                <span>Pengampu: <strong>{j.teacherName}</strong></span>
                <span>Alokasi: {j.timeSlot}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Input Jurnal Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl my-8">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              Isi Jurnal Pembelajaran Guru
            </h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Tanggal Mengajar
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Alokasi Jam Ke-
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.timeSlot || ''}
                    onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                    placeholder="Contoh: Jam Ke-1 s.d. 3 (07.30 - 09.45)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Kelas / Rombel
                  </label>
                  <select
                    value={formData.classId || ''}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Mata Pelajaran
                  </label>
                  <select
                    value={formData.subjectId || ''}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Materi Pokok / Topik Pembelajaran
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Persamaan Nilai Mutlak Satu Variabel"
                  value={formData.topic || ''}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Aktivitas & Langkah Pembelajaran
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ringkas kegiatan pendahuluan, inti (diskusi, eksperimen), dan penutup..."
                  value={formData.activities || ''}
                  onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Kendala / Hambatan Kelas
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Kendala pemahaman siswa atau sarana..."
                    value={formData.obstacles || ''}
                    onChange={(e) => setFormData({ ...formData, obstacles: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Refleksi & Rencana Tindak Lanjut
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Langkah perbaikan pertemuan depan..."
                    value={formData.reflection || ''}
                    onChange={(e) => setFormData({ ...formData, reflection: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  ></textarea>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer"
                >
                  Kirim Jurnal untuk Supervisi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Supervisi Kepsek */}
      {reviewModalOpen && reviewJournalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              Supervisi Jurnal Pembelajaran
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Jurnal {reviewJournalTarget.subjectName} ({reviewJournalTarget.className}) oleh {reviewJournalTarget.teacherName}.
            </p>

            <div className="space-y-3 text-xs mb-4">
              <label className="block text-slate-600 dark:text-slate-400 font-medium">
                Catatan Evaluasi & Pengesahan Kepala Sekolah:
              </label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder="Tuliskan umpan balik supervisi..."
              ></textarea>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setReviewModalOpen(false)}
                className="px-3.5 py-2 text-xs rounded-lg text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => handleConfirmReview('revisi')}
                className="px-3.5 py-2 text-xs rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold cursor-pointer"
              >
                Minta Revisi
              </button>
              <button
                onClick={() => handleConfirmReview('disetujui')}
                className="px-3.5 py-2 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
              >
                Setujui & Sahkan Jurnal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Modal Rekap Jurnal */}
      <PrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        title="Cetak Rekap Jurnal Mengajar Guru"
        documentTitle="BUKU REKAPITULASI JURNAL MENGAJAR GURU"
        documentNumber="421.4 / JRN / SMA-NU / X / 2024"
        leftSignerTitle="Guru Mata Pelajaran"
        leftSignerName={currentUser.name}
        leftSignerNip={currentUser.nipOrNisn || '19850620 200902 2 005'}
      >
        <div className="space-y-4">
          <table className="w-full border-collapse border border-black text-xs">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-black py-2 px-2 text-center w-8">No</th>
                <th className="border border-black py-2 px-2 text-center w-24">Tanggal</th>
                <th className="border border-black py-2 px-2 text-center w-16">Kelas</th>
                <th className="border border-black py-2 px-3 text-left">Mata Pelajaran & Topik</th>
                <th className="border border-black py-2 px-3 text-left">Aktivitas Pembelajaran</th>
                <th className="border border-black py-2 px-2 text-center w-20">Kehadiran</th>
                <th className="border border-black py-2 px-2 text-center w-20">Status</th>
              </tr>
            </thead>
            <tbody>
              {journals.map((j, i) => (
                <tr key={j.id}>
                  <td className="border border-black py-1 px-2 text-center font-mono">{i + 1}</td>
                  <td className="border border-black py-1 px-2 text-center font-mono">{j.date}</td>
                  <td className="border border-black py-1 px-2 text-center font-bold">{j.className}</td>
                  <td className="border border-black py-1 px-3">
                    <strong>{j.subjectName}</strong>
                    <div className="text-[11px] text-slate-600">{j.topic}</div>
                  </td>
                  <td className="border border-black py-1 px-3 text-[11px]">{j.activities}</td>
                  <td className="border border-black py-1 px-2 text-center font-mono text-[11px]">
                    H:{j.attendanceCount.hadir} S:{j.attendanceCount.sakit} A:{j.attendanceCount.alpa}
                  </td>
                  <td className="border border-black py-1 px-2 text-center uppercase font-bold text-[10px]">
                    {j.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PrintModal>
    </div>
  );
};
