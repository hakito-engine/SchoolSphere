import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { CounselingRecord, Student } from '../types';
import { PrintModal } from '../components/common/PrintModal';
import {
  HeartHandshake,
  AlertTriangle,
  Lock,
  Plus,
  Printer,
  CheckCircle2,
  Clock,
  UserCheck,
  Search,
  Edit2,
  CalendarCheck,
  Send,
  Calendar,
  Check,
  X,
} from 'lucide-react';

export const CounselingView: React.FC = () => {
  const { currentUser } = useAuth();
  const [records, setRecords] = useState<CounselingRecord[]>(() => DataService.getCounselingRecords());
  const [searchQuery, setSearchQuery] = useState('');
  const students = DataService.getStudents();
  const teachers = DataService.getTeachers();

  // Identified current student if logged in as student
  const currentStudent = students.find(
    (s) =>
      s.id === currentUser.id ||
      s.id === currentUser.id.replace('usr-siswa-', 'std-') ||
      s.id === currentUser.id.replace('usr-std-', 'std-') ||
      s.id === currentUser.id.replace('usr-siswa-', '') ||
      (s.nisn && s.nisn === currentUser.nipOrNisn) ||
      (currentUser.name && s.name.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
  );

  // Early alert students: Alpa >= 3 or GPA < 75
  const atRiskStudents = students.filter(
    (s) => s.attendance.alpa >= 3 || s.gpa < 75
  );

  // List of available BK teachers for consultation booking
  const bkTeachers = [
    { id: 'usr-guru-bk', name: 'Dewi Lestari, S.Psi., M.Pd.', role: 'Guru Bimbingan dan Konseling' },
    { id: 'tch-bk-02', name: 'Drs. H. Suryanto, M.Psi.', role: 'Koordinator BK & Karir' },
  ];

  // Permission: Hanya Guru BK yang bisa mengedit riwayat & tindak lanjut
  const isGuruBk = currentUser.role === 'guru_bk';

  // Form Modal State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CounselingRecord>>({
    studentId: students[0]?.id || 'std-ahmad',
    studentName: students[0]?.name || 'Ahmad Fauzi',
    className: students[0]?.className || 'X MIPA 1',
    category: 'Akademik',
    issueSummary: '',
    followUpPlan: '',
    status: 'Penjadwalan',
    scheduledTime: '09.30 - 10.15 WIB (Ruang BK)',
    isConfidential: true,
  });

  // Student Self-Request Modal State (Requirement 22)
  const [isStudentRequestModalOpen, setIsStudentRequestModalOpen] = useState(false);
  const [reqDate, setReqDate] = useState(new Date(Date.now() + 86400000).toISOString().substring(0, 10));
  const [reqCounselorName, setReqCounselorName] = useState(bkTeachers[0].name);
  const [reqCategory, setReqCategory] = useState<CounselingRecord['category']>('Karir/Studi Lanjut');
  const [reqIssue, setReqIssue] = useState('');
  const [requestSuccessNotice, setRequestSuccessNotice] = useState<string | null>(null);

  // Guru BK Approval Modal State (Requirement 22)
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<CounselingRecord | null>(null);
  const [approveTimeRange, setApproveTimeRange] = useState('09.30 - 10.15 WIB');
  const [approveRoom, setApproveRoom] = useState('Ruang BK Lantai 2');
  const [approveNotes, setApproveNotes] = useState('Sesi konseling disetujui, harap hadir tepat waktu.');

  // Print Modal
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Open Add new counseling (Only BK or Staff)
  const handleOpenAdd = (student?: Student) => {
    const s = student || students[0];
    setEditingRecordId(null);
    setFormData({
      id: 'cns-' + Date.now(),
      studentId: s.id,
      studentName: s.name,
      className: s.className,
      counselorId: currentUser.id,
      counselorName: currentUser.name || 'Dewi Lestari, S.Psi., M.Pd.',
      date: new Date().toISOString().substring(0, 10),
      category: student && student.attendance.alpa >= 3 ? 'Kedisiplinan' : 'Akademik',
      issueSummary: student
        ? `Tercatat akumulasi alpa ${student.attendance.alpa} hari dan nilai rata-rata ${student.gpa}.`
        : '',
      followUpPlan: 'Sesi konseling individual dan koordinasi wali kelas.',
      status: 'Penjadwalan',
      scheduledTime: '09.30 - 10.15 WIB (Ruang BK)',
      isConfidential: true,
    });
    setIsModalOpen(true);
  };

  // Requirement 21: Hanya Guru BK yang bisa mengedit Riwayat Bimbingan dan Tindak Lanjut Konseling
  const handleOpenEdit = (rec: CounselingRecord) => {
    if (!isGuruBk) {
      alert('Akses Dibatasi: Hanya Guru BK yang berwenang mengubah riwayat dan tindak lanjut konseling.');
      return;
    }
    setEditingRecordId(rec.id);
    setFormData({ ...rec });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.issueSummary || !formData.followUpPlan) return;

    const selectedStd = students.find((s) => s.id === formData.studentId);

    const payload: CounselingRecord = {
      id: editingRecordId || formData.id || 'cns-' + Date.now(),
      studentId: formData.studentId || 'std-01',
      studentName: selectedStd ? selectedStd.name : formData.studentName || 'Peserta Didik',
      className: selectedStd ? selectedStd.className : formData.className || 'X MIPA 1',
      counselorId: formData.counselorId || currentUser.id,
      counselorName: formData.counselorName || currentUser.name || 'Dewi Lestari, S.Psi., M.Pd.',
      date: formData.date || new Date().toISOString().substring(0, 10),
      scheduledTime: formData.scheduledTime || '09.30 - 10.15 WIB (Ruang BK)',
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

  // Requirement 22: Submit Pengajuan Jadwal Konseling Mandiri oleh Siswa
  const handleStudentSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqIssue.trim()) return;

    const stdName = currentStudent?.name || currentUser.name;
    const stdClass = currentStudent?.className || 'X MIPA 1';
    const stdId = currentStudent?.id || currentUser.id;

    const newRequest: CounselingRecord = {
      id: 'cns-req-' + Date.now(),
      studentId: stdId,
      studentName: stdName,
      className: stdClass,
      counselorId: bkTeachers.find((t) => t.name === reqCounselorName)?.id || 'usr-guru-bk',
      counselorName: reqCounselorName,
      date: reqDate,
      category: reqCategory,
      issueSummary: reqIssue.trim(),
      followUpPlan: 'Menunggu persetujuan dan pengaturan jadwal sesi oleh Guru BK.',
      status: 'Menunggu Persetujuan',
      isConfidential: true,
      requestedByStudent: true,
    };

    DataService.saveCounselingRecord(newRequest, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });

    setRecords(DataService.getCounselingRecords());
    setIsStudentRequestModalOpen(false);
    setReqIssue('');
    setRequestSuccessNotice(
      `Pengajuan jadwal konseling kategori "${reqCategory}" berhasil dikirimkan ke ${reqCounselorName}. Guru BK akan meninjau dan mengatur waktu sesi Anda.`
    );
    setTimeout(() => setRequestSuccessNotice(null), 5000);
  };

  // Requirement 22: Guru BK Approve & Atur Waktu Penjadwalan
  const handleApproveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingRecord) return;

    const updated: CounselingRecord = {
      ...approvingRecord,
      status: 'Penjadwalan',
      scheduledTime: `${approveTimeRange} (${approveRoom})`,
      followUpPlan: approveNotes.trim() || 'Sesi konseling telah disetujui dan dijadwalkan.',
      counselorName: currentUser.name || approvingRecord.counselorName,
    };

    DataService.saveCounselingRecord(updated, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });

    setRecords(DataService.getCounselingRecords());
    setApproveModalOpen(false);
    setApprovingRecord(null);
  };

  // Filter records
  const pendingRequests = records.filter((r) => r.status === 'Menunggu Persetujuan');

  const filteredRecords = records.filter((rec) => {
    if (currentUser.role === 'siswa') {
      const isMine =
        rec.studentId === currentUser.id ||
        (currentStudent && rec.studentId === currentStudent.id) ||
        (currentUser.name && rec.studentName.toLowerCase() === currentUser.name.toLowerCase());
      if (!isMine) return false;
    }

    const matchesSearch =
      rec.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.issueSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.followUpPlan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.counselorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

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
            Layanan bimbingan pribadi, akademik, sosial, dan karir, serta tindak lanjut peserta didik dalam pendampingan menyeluruh.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak Rekap Konseling</span>
          </button>

          {/* Requirement 22: Button Ajukan Jadwal Konseling bagi Siswa */}
          {currentUser.role === 'siswa' && (
            <button
              onClick={() => setIsStudentRequestModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-2xs transition-colors cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Ajukan Jadwal Konseling Mandiri</span>
            </button>
          )}

          {isGuruBk && (
            <button
              onClick={() => handleOpenAdd()}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Sesi Konseling Baru</span>
            </button>
          )}
        </div>
      </div>

      {requestSuccessNotice && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs rounded-xl flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{requestSuccessNotice}</span>
        </div>
      )}

      {/* Requirement 22: Panel Pengajuan Konseling Siswa (Untuk Guru BK Approve & Atur Waktu) */}
      {isGuruBk && pendingRequests.length > 0 && (
        <div className="p-4 rounded-xl border border-teal-200 dark:border-teal-900 bg-teal-50/50 dark:bg-teal-950/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-teal-600" />
              <h3 className="text-xs font-bold text-teal-950 dark:text-teal-200 uppercase tracking-wide">
                Pengajuan Jadwal Konseling Mandiri Peserta Didik ({pendingRequests.length} Menunggu Persetujuan)
              </h3>
            </div>
            <span className="text-[11px] text-teal-700 dark:text-teal-300 font-medium">
              Harap verifikasi dan tentukan jadwal sesi jika disetujui
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 flex flex-col justify-between text-xs space-y-2 shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {req.studentName} ({req.className})
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Menunggu Persetujuan
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-teal-700 dark:text-teal-300 font-medium mt-1">
                    <span>Layanan: <strong>{req.category}</strong></span>
                    <span>·</span>
                    <span>Tgl Pengajuan: <strong>{req.date}</strong></span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mt-1.5 text-[11px] leading-relaxed">
                    <strong>Pokok Bahasan:</strong> {req.issueSummary}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Ditujukan ke: {req.counselorName}</span>
                  <button
                    onClick={() => {
                      setApprovingRecord(req);
                      setApproveTimeRange('09.30 - 10.15 WIB');
                      setApproveRoom('Ruang BK Lantai 2');
                      setApproveNotes('Sesi konseling disetujui, harap hadir tepat waktu.');
                      setApproveModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-md bg-teal-600 hover:bg-teal-700 text-white font-semibold text-[11px] cursor-pointer shadow-2xs flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Setujui & Atur Waktu Sesi</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Early Support Alert Panel for BK */}
      {!currentUser.role.includes('siswa') && (
        <div className="p-5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-3">
          <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200 font-bold text-xs uppercase tracking-wide">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Early Support Alert: Indikator Peringatan Peserta Didik Butuh Pendampingan</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Peserta didik di bawah terdeteksi melebihi ambang batas ketidakhadiran (Alpa &ge; 3 hari) atau nilai akademik di bawah standar kelulusan KKM 75. Satu peserta didik dapat menerima lebih dari satu layanan bimbingan (misal Kedisiplinan & Karir).
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
                {isGuruBk && (
                  <button
                    onClick={() => handleOpenAdd(std)}
                    className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold cursor-pointer shrink-0"
                  >
                    Jadwalkan Konseling
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Counseling Records List & Search */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Riwayat Bimbingan & Tindak Lanjut Konseling ({filteredRecords.length})
          </h3>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 max-w-sm w-full text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Cari peserta didik, kelas, pokok masalah, atau konselor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-slate-900 dark:text-white focus:outline-hidden text-xs"
            />
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            Tidak ada rekam bimbingan konseling yang sesuai dengan kriteria pencarian.
          </div>
        ) : (
          filteredRecords.map((rec) => (
            <div
              key={rec.id}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {rec.studentName} ({rec.className})
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="font-semibold text-teal-700 dark:text-teal-300">
                    Kategori: {rec.category}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-400 font-mono">{rec.date}</span>
                  {rec.scheduledTime && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="w-3 h-3" /> {rec.scheduledTime}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      rec.status === 'Selesai'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : rec.status === 'Menunggu Persetujuan'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
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

                  {/* Requirement 21: Hanya Guru BK yang bisa mengedit Riwayat Bimbingan dan Tindak Lanjut Konseling */}
                  {isGuruBk && (
                    <button
                      onClick={() => handleOpenEdit(rec)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded bg-teal-50 hover:bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200 border border-teal-200 dark:border-teal-800 transition-colors cursor-pointer"
                      title="Edit Riwayat & Tindak Lanjut (Khusus Guru BK)"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Ubah Riwayat & Tindak Lanjut</span>
                    </button>
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
                <span>Wewenang Pengelolaan: Khusus Guru BK & Kepala Sekolah</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Requirement 22: Modal Ajukan Jadwal Konseling Mandiri oleh Siswa */}
      {isStudentRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Ajukan Jadwal Konseling Mandiri ke Guru BK
                </h3>
              </div>
              <button
                onClick={() => setIsStudentRequestModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStudentSubmitRequest} className="mt-4 space-y-3.5 text-xs">
              <div className="p-3 bg-teal-50/60 dark:bg-teal-950/40 rounded-lg border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200 leading-relaxed">
                Anda dapat mengajukan bimbingan secara mandiri. Guru BK akan menelaah dan mengatur waktu penjadwalan yang tepat. Privasi data dan kerahasiaan Anda dijamin aman.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Tanggal Sesi yang Diinginkan
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().substring(0, 10)}
                    value={reqDate}
                    onChange={(e) => setReqDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Guru BK yang Dituju
                  </label>
                  <select
                    value={reqCounselorName}
                    onChange={(e) => setReqCounselorName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                  >
                    {bkTeachers.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name} ({t.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Kategori Layanan Konseling
                </label>
                <select
                  value={reqCategory}
                  onChange={(e) => setReqCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="Karir/Studi Lanjut">Karir / Studi Lanjut (Kuliah & Jalur Masuk PTN/PTS)</option>
                  <option value="Akademik">Akademik (Metode Belajar, Kesulitan Belajar)</option>
                  <option value="Pribadi">Pribadi (Kesehatan Mental, Motivasi, Keluarga)</option>
                  <option value="Kedisiplinan">Kedisiplinan & Penyesuaian Diri di Sekolah</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Pokok Bahasan Masalah / Hal yang Ingin Dikonsultasikan
                </label>
                <textarea
                  rows={3}
                  required
                  value={reqIssue}
                  onChange={(e) => setReqIssue(e.target.value)}
                  placeholder="Ceritakan secara singkat hal yang ingin Anda konsultasikan atau diskusikan bersama Guru BK..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsStudentRequestModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirimkan Pengajuan ke Guru BK</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Requirement 22: Modal Guru BK Approve & Atur Waktu Sesi Konseling */}
      {approveModalOpen && approvingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              Persetujuan & Pengaturan Waktu Sesi Konseling
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Konfirmasi sesi bimbingan untuk <strong>{approvingRecord.studentName}</strong> ({approvingRecord.className})
            </p>

            <form onSubmit={handleApproveSchedule} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Alokasi Jam / Waktu Pelaksanaan Sesi
                </label>
                <input
                  type="text"
                  required
                  value={approveTimeRange}
                  onChange={(e) => setApproveTimeRange(e.target.value)}
                  placeholder="Contoh: 09.30 - 10.15 WIB"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Lokasi / Ruang Konseling
                </label>
                <input
                  type="text"
                  required
                  value={approveRoom}
                  onChange={(e) => setApproveRoom(e.target.value)}
                  placeholder="Contoh: Ruang BK Lantai 2"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Catatan Tindak Lanjut Awal untuk Peserta Didik
                </label>
                <textarea
                  rows={2}
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setApproveModalOpen(false);
                    setApprovingRecord(null);
                  }}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Setujui & Terbitkan Jadwal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Counseling Record (Hanya Guru BK) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              {editingRecordId ? 'Ubah Riwayat Bimbingan & Tindak Lanjut' : 'Catat Sesi Bimbingan & Konseling Baru'}
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
                  placeholder="Ringkasan hasil wawancara, observasi, atau pokok bahasan bimbingan..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                ></textarea>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Rencana Tindak Lanjut & Rekomendasi Konseling
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.followUpPlan || ''}
                  onChange={(e) => setFormData({ ...formData, followUpPlan: e.target.value })}
                  placeholder="Langkah pendampingan, kontrak belajar, atau koordinasi wali kelas..."
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
                    <option value="Menunggu Persetujuan">Menunggu Persetujuan</option>
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

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Waktu & Tempat Pelaksanaan
                </label>
                <input
                  type="text"
                  value={formData.scheduledTime || ''}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  placeholder="Contoh: 09.30 - 10.15 WIB (Ruang BK Lantai 2)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
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
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold cursor-pointer shadow-xs"
                >
                  {editingRecordId ? 'Simpan Perubahan Riwayat BK' : 'Simpan Catatan BK'}
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
        rightSignerTitle="Guru Bimbingan dan Konseling"
        rightSignerName="Dewi Lestari, S.Psi., M.Pd."
        rightSignerNip="19891104 201402 2 003"
      >
        <div className="space-y-4">
          <table className="w-full border-collapse border border-black text-xs">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-black py-2 px-2 text-center w-8">No</th>
                <th className="border border-black py-2 px-2 text-center w-24">Tanggal</th>
                <th className="border border-black py-2 px-3 text-left">Nama Peserta Didik & Kelas</th>
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
                    {r.scheduledTime && (
                      <div className="text-indigo-800 font-semibold mt-0.5">Jadwal: {r.scheduledTime}</div>
                    )}
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
