import React, { useState, useRef, useMemo } from 'react';
import { useAuth, getTeacherHomeroomInfo } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { ParentNoticeLetter, Student } from '../types';
import { OfficialLetterhead } from '../components/common/OfficialLetterhead';
import { formatDateIndonesian } from '../utils/formatters';
import { exportElementToPdf } from '../utils/pdfExport';
import {
  Mail,
  Send,
  Printer,
  Download,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  UserCheck,
  Building,
  Calendar,
  Clock,
  MapPin,
  Upload,
  Image as ImageIcon,
  FileText,
  Phone,
  Eye,
  ArrowLeft,
  X,
  Sparkles,
  Loader2,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

export const ParentNoticeLetterView: React.FC = () => {
  const { currentUser } = useAuth();
  const profile = DataService.getSchoolProfile();
  const students = useMemo(() => DataService.getStudents(), []);
  const teachers = useMemo(() => DataService.getTeachers(), []);
  const classes = useMemo(() => DataService.getClasses(), []);
  const homeroomInfo = getTeacherHomeroomInfo(currentUser);

  const [letters, setLetters] = useState<ParentNoticeLetter[]>(() => DataService.getParentNoticeLetters());
  const [activeTab, setActiveTab] = useState<'arsip' | 'buat'>('arsip');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Preview / Print Modal State
  const [selectedLetterForView, setSelectedLetterForView] = useState<ParentNoticeLetter | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const letterPrintCanvasRef = useRef<HTMLDivElement>(null);

  // Form State
  const [editingLetterId, setEditingLetterId] = useState<string | null>(null);
  const [letterType, setLetterType] = useState<'pemanggilan' | 'pemberitahuan' | 'peringatan'>('pemanggilan');
  const [letterNumber, setLetterNumber] = useState('');
  const [letterDate, setLetterDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [city, setCity] = useState(profile.city || 'Makassar');

  // Siswa Terpilih
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');

  // Rincian Pemanggilan
  const [meetingDayDate, setMeetingDayDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return formatDateIndonesian(d.toISOString().substring(0, 10));
  });
  const [meetingTime, setMeetingTime] = useState('09:00 - 10:30 WITA');
  const [meetingPlace, setMeetingPlace] = useState('Ruang Bimbingan Konseling (BK)');
  const [agenda, setAgenda] = useState('Konsultasi perkembangan belajar dan tindak lanjut kedisiplinan siswa.');
  const [personToMeet, setPersonToMeet] = useState('');

  // Penandatangan
  const isGuruBk = currentUser.role === 'guru_bk';
  const isHomeroom = currentUser.role === 'wali_kelas' || homeroomInfo.isHomeroom;
  const defaultSignerRole: 'wali_kelas' | 'guru_bk' = isGuruBk ? 'guru_bk' : 'wali_kelas';

  const [signerRole, setSignerRole] = useState<'wali_kelas' | 'guru_bk'>(defaultSignerRole);
  const [signerTitle, setSignerTitle] = useState('');
  const [signerName, setSignerName] = useState(currentUser.name);
  const [signerNip, setSignerNip] = useState(currentUser.nipOrNisn || '');

  // Gambar Tanda Tangan Digital (.PNG Transparan)
  const [signerSignatureImage, setSignerSignatureImage] = useState<string | undefined>(undefined);
  const [headmasterSignatureImage, setHeadmasterSignatureImage] = useState<string | undefined>(undefined);
  const [useWetSignature, setUseWetSignature] = useState(false);

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync selected student details
  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId) || students[0];
  }, [students, selectedStudentId]);

  // Set default values when student selection changes
  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    const s = students.find((st) => st.id === studentId);
    if (s) {
      setParentName(s.parentName || `Orang Tua / Wali dari ${s.name}`);
      setParentPhone(s.parentPhone || '');
    }
  };

  // Generate Nomor Surat Otomatis Standar Kedinasan
  const generateAutoLetterNumber = (role: 'wali_kelas' | 'guru_bk', stdClass: string) => {
    const now = new Date();
    const year = now.getFullYear();
    const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const romanMonth = romanMonths[now.getMonth()];
    const cleanClass = stdClass.replace(/\s+/g, '');
    const randNum = String(Math.floor(Math.random() * 80) + 20).padStart(3, '0');

    if (role === 'guru_bk') {
      return `421.3 / ${randNum} / SMAN1-BK / ${romanMonth} / ${year}`;
    } else {
      return `421.2 / ${randNum} / WLK-${cleanClass} / ${romanMonth} / ${year}`;
    }
  };

  // Reset Form for New Letter
  const handleOpenCreateForm = () => {
    setEditingLetterId(null);
    const firstStudent = students[0];
    const initialClass = firstStudent?.className || 'X MIPA 1';

    const defaultRole: 'wali_kelas' | 'guru_bk' = isGuruBk ? 'guru_bk' : 'wali_kelas';
    setSignerRole(defaultRole);
    setLetterType('pemanggilan');
    setLetterNumber(generateAutoLetterNumber(defaultRole, initialClass));
    setLetterDate(new Date().toISOString().substring(0, 10));
    setCity(profile.city || 'Makassar');

    if (firstStudent) {
      setSelectedStudentId(firstStudent.id);
      setParentName(firstStudent.parentName || `Orang Tua / Wali dari ${firstStudent.name}`);
      setParentPhone(firstStudent.parentPhone || '');
    }

    const d = new Date();
    d.setDate(d.getDate() + 2);
    setMeetingDayDate(formatDateIndonesian(d.toISOString().substring(0, 10)));
    setMeetingTime('09:00 - 10:30 WITA');
    setMeetingPlace(defaultRole === 'guru_bk' ? 'Ruang Bimbingan Konseling (BK)' : `Ruang Wali Kelas ${initialClass}`);
    setAgenda('Konsultasi perkembangan belajar dan tindak lanjut kedisiplinan siswa.');
    setPersonToMeet(defaultRole === 'guru_bk' ? `Guru Bimbingan Konseling (${currentUser.name})` : `Wali Kelas (${currentUser.name})`);

    setSignerName(currentUser.name);
    setSignerNip(currentUser.nipOrNisn || '');
    setSignerTitle(defaultRole === 'guru_bk' ? 'Guru Bimbingan dan Konseling (BK)' : `Wali Kelas ${initialClass}`);
    setSignerSignatureImage(undefined);
    setHeadmasterSignatureImage(undefined);
    setUseWetSignature(false);

    setActiveTab('buat');
  };

  // Handle Upload Gambar Tanda Tangan
  const handleSignatureUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'signer' | 'headmaster'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('png') && !file.type.includes('image')) {
      alert('Mohon unggah file format gambar .PNG (disarankan PNG transparan).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target?.result as string;
      if (type === 'signer') {
        setSignerSignatureImage(base64);
      } else {
        setHeadmasterSignatureImage(base64);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Preset Agenda Options
  const agendaPresets = [
    'Konsultasi perkembangan belajar dan tindak lanjut ketidakhadiran (Alpa/Izin berulang).',
    'Pembinaan kedisiplinan, ketertiban sekolah, dan kepatuhan tata tertib peserta didik.',
    'Konseling peminatan akademik, evaluasi nilai tugas/CBT, dan motivasi belajar.',
    'Pemberitahuan khusus tindak lanjut insiden/pelanggaran di lingkungan sekolah.',
    'Koordinasi persiapan asesmen akhir semester dan kelulusan peserta didik.',
  ];

  // Simpan Surat
  const handleSaveLetter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      alert('Silakan pilih siswa terlebih dahulu.');
      return;
    }

    const targetClass = selectedStudent.className || 'X MIPA 1';
    const effectiveSignerTitle =
      signerTitle.trim() ||
      (signerRole === 'guru_bk' ? 'Guru Bimbingan dan Konseling (BK)' : `Wali Kelas ${targetClass}`);

    const newLetter: ParentNoticeLetter = {
      id: editingLetterId || `let-${Date.now()}`,
      letterNumber: letterNumber.trim() || generateAutoLetterNumber(signerRole, targetClass),
      letterType,
      letterDate,
      city: city.trim() || profile.city || 'Makassar',
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      studentNis: selectedStudent.nis,
      studentNisn: selectedStudent.nisn,
      className: targetClass,
      parentName: parentName.trim() || `Orang Tua / Wali dari ${selectedStudent.name}`,
      parentPhone: parentPhone.trim(),
      meetingDayDate,
      meetingTime,
      meetingPlace,
      agenda,
      personToMeet: personToMeet.trim() || `${effectiveSignerTitle} (${signerName})`,
      signerRole,
      signerTitle: effectiveSignerTitle,
      signerName: signerName.trim() || currentUser.name,
      signerNip: signerNip.trim() || currentUser.nipOrNisn,
      signerSignatureImage: useWetSignature ? undefined : signerSignatureImage,
      headmasterName: profile.principalName || 'Dr. Hendra Wijaya, M.Pd.',
      headmasterNip: profile.principalNip || '19740512 199903 1 004',
      headmasterSignatureImage: useWetSignature ? undefined : headmasterSignatureImage,
      useWetSignature,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name,
    };

    DataService.saveParentNoticeLetter(newLetter, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });

    setLetters(DataService.getParentNoticeLetters());
    setSelectedLetterForView(newLetter);
    setFeedback({
      type: 'success',
      message: `Surat ${newLetter.letterNumber} untuk orang tua ${newLetter.studentName} berhasil diterbitkan dan siap dikirim via WhatsApp!`,
    });
    setActiveTab('arsip');
  };

  // Hapus Surat
  const handleDeleteLetter = (letterId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus surat pemberitahuan/pemanggilan ini dari arsip?')) return;
    DataService.deleteParentNoticeLetter(letterId, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });
    setLetters(DataService.getParentNoticeLetters());
    if (selectedLetterForView?.id === letterId) {
      setSelectedLetterForView(null);
    }
  };

  // Buka WhatsApp Langsung
  const handleSendWhatsApp = (letter: ParentNoticeLetter) => {
    const rawPhone = letter.parentPhone.replace(/[^0-9]/g, '');
    if (!rawPhone) {
      alert(`Nomor WhatsApp orang tua untuk siswa ${letter.studentName} belum terisi.`);
      return;
    }

    // Normalisasi awalan nomor ke 62
    let phone = rawPhone;
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    } else if (!phone.startsWith('62')) {
      phone = '62' + phone;
    }

    const message = `Yth. Bapak/Ibu ${letter.parentName},\n(Orang Tua/Wali dari ananda *${letter.studentName}* - Kelas *${letter.className}*)\n\nAssalamu'alaikum Wr. Wb. / Salam Sejahtera,\n\nKami dari pihak *${profile.name}* bermaksud menyampaikan *Surat Resmi Pemanggilan / Pemberitahuan Orang Tua* dengan rincian sebagai berikut:\n\n📄 *No. Surat:* ${letter.letterNumber}\n📅 *Hari / Tanggal:* ${letter.meetingDayDate}\n⏰ *Waktu:* ${letter.meetingTime}\n📍 *Tempat:* ${letter.meetingPlace}\n🎯 *Keperluan:* ${letter.agenda}\n👤 *Menghadap:* ${letter.personToMeet}\n\nDokumen resmi versi PDF telah diterbitkan secara sah oleh sekolah. Mengingat pentingnya agenda ini demi masa depan dan perkembangan ananda, kehadiran Bapak/Ibu tepat pada waktunya sangat kami harapkan.\n\nAtas perhatian dan kerja sama Bapak/Ibu, kami sampaikan terima kasih.\n\nHormat kami,\n*${letter.signerName}*\n${letter.signerTitle}\n*${profile.name}*`;

    const encoded = encodeURIComponent(message);
    const waUrl = `https://wa.me/${phone}?text=${encoded}`;
    window.open(waUrl, '_blank');
  };

  // Filtered letters list
  const filteredLetters = letters.filter((l) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      l.studentName.toLowerCase().includes(q) ||
      l.letterNumber.toLowerCase().includes(q) ||
      l.parentName.toLowerCase().includes(q) ||
      l.className.toLowerCase().includes(q) ||
      l.agenda.toLowerCase().includes(q);

    const matchClass = filterClass === 'all' || l.className === filterClass;
    const matchType = filterType === 'all' || l.letterType === filterType;

    return matchSearch && matchClass && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Surat Panggilan Orang Tua</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Wali Kelas & Guru BK
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Penerbitan surat pemanggilan dan pemberitahuan resmi kedinasan yang dapat dikirim langsung ke WhatsApp Orang Tua dengan lampiran PDF.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === 'buat' ? (
            <button
              type="button"
              onClick={() => setActiveTab('arsip')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Arsip Surat</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenCreateForm}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Surat Panggilan Baru</span>
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: ARSIP & DAFTAR SURAT */}
      {activeTab === 'arsip' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama siswa, nomor surat, atau kelas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold text-[11px]">Kelas:</span>
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="all">Semua Rombel</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold text-[11px]">Jenis:</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="all">Semua Jenis</option>
                  <option value="pemanggilan">Pemanggilan Orang Tua</option>
                  <option value="pemberitahuan">Pemberitahuan Khusus</option>
                  <option value="peringatan">Peringatan Siswa</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table / List Surat */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            {filteredLetters.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mx-auto">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Belum Ada Surat yang Diterbitkan
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Klik tombol <strong>"Buat Surat Panggilan Baru"</strong> untuk menerbitkan surat pemanggilan orang tua siswa.
                </p>
                <button
                  type="button"
                  onClick={handleOpenCreateForm}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm cursor-pointer"
                >
                  Buat Surat Sekarang
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">No. Surat & Tanggal</th>
                      <th className="py-3 px-4">Identitas Peserta Didik</th>
                      <th className="py-3 px-4">Orang Tua / Kontak WA</th>
                      <th className="py-3 px-4">Jadwal Pertemuan</th>
                      <th className="py-3 px-4">Penandatangan</th>
                      <th className="py-3 px-4 text-center">Aksi Cepat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredLetters.map((letter) => (
                      <tr key={letter.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 align-top">
                          <span className="font-mono font-bold text-slate-900 dark:text-white block">
                            {letter.letterNumber}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {letter.city}, {formatDateIndonesian(letter.letterDate)}
                          </span>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 uppercase">
                            {letter.letterType}
                          </span>
                        </td>

                        <td className="py-3 px-4 align-top">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {letter.studentName}
                          </span>
                          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold block">
                            Kelas {letter.className}
                          </span>
                          {letter.studentNisn && (
                            <span className="text-[10px] font-mono text-slate-400 block">
                              NISN: {letter.studentNisn}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 align-top">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                            {letter.parentName}
                          </span>
                          {letter.parentPhone ? (
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" />
                              {letter.parentPhone}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No WA belum diisi</span>
                          )}
                        </td>

                        <td className="py-3 px-4 align-top">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">
                            {letter.meetingDayDate}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {letter.meetingTime}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-xs">
                            📍 {letter.meetingPlace}
                          </span>
                        </td>

                        <td className="py-3 px-4 align-top">
                          <span className="font-semibold text-slate-900 dark:text-white block">
                            {letter.signerName}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {letter.signerTitle}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 block">
                            {letter.useWetSignature ? 'Tanda Tangan Basah' : letter.signerSignatureImage ? 'TTD Digital .PNG' : 'Tanpa TTD Digital'}
                          </span>
                        </td>

                        <td className="py-3 px-4 align-top text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Tombol Kirim WhatsApp */}
                            <button
                              type="button"
                              onClick={() => handleSendWhatsApp(letter)}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 transition-colors cursor-pointer"
                              title="Kirim ke WhatsApp Orang Tua"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>

                            {/* Tombol Lihat / Cetak */}
                            <button
                              type="button"
                              onClick={() => setSelectedLetterForView(letter)}
                              className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 transition-colors cursor-pointer"
                              title="Lihat & Cetak Surat"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Tombol Hapus */}
                            <button
                              type="button"
                              onClick={() => handleDeleteLetter(letter.id)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200 dark:bg-rose-950 dark:text-rose-300 transition-colors cursor-pointer"
                              title="Hapus Surat"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: FORM PEMBUATAN SURAT BARU */}
      {activeTab === 'buat' && (
        <form onSubmit={handleSaveLetter} className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6 text-xs">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Format Pengaturan & Pembuatan Surat Panggilan Orang Tua</span>
              </h3>
              <p className="text-xs text-slate-500">
                Lengkapi rincian surat di bawah ini. Dokumen otomatis terintegrasi dengan Kop Surat Resmi Sekolah dan WhatsApp orang tua.
              </p>
            </div>

            {/* Bagian 1: Pengaturan Administrasi Surat */}
            <div className="space-y-3">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider block">
                1. Pengaturan Nomor & Penerbitan Surat (3.1 & 3.2)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Jenis Surat
                  </label>
                  <select
                    value={letterType}
                    onChange={(e) => setLetterType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="pemanggilan">Surat Pemanggilan Orang Tua (Konseling/Pelanggaran)</option>
                    <option value="pemberitahuan">Surat Pemberitahuan Khusus Kehadiran/Akademik</option>
                    <option value="peringatan">Surat Peringatan & Evaluasi Belajar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Kota Penerbitan Surat (3.2)
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Contoh: Makassar"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Menentukan lokasi penanggalan surat (misal: "Makassar, 03 November 2026")
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Tanggal Terbit Surat
                  </label>
                  <input
                    type="date"
                    required
                    value={letterDate}
                    onChange={(e) => setLetterDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Nomor Surat Custom */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold">
                    Nomor Surat Resmi (Custom - 3.1)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setLetterNumber(
                        generateAutoLetterNumber(signerRole, selectedStudent?.className || 'X MIPA 1')
                      )
                    }
                    className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Generate Nomor Otomatis Sesuai Dinas</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={letterNumber}
                  onChange={(e) => setLetterNumber(e.target.value)}
                  placeholder="Contoh: 421.3 / 089 / SMAN1-BK / 2026"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>
            </div>

            {/* Bagian 2: Data Peserta Didik & Orang Tua */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider block">
                2. Data Peserta Didik & Kontak Orang Tua
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Pilih Peserta Didik (Siswa)
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => handleStudentSelect(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold cursor-pointer"
                  >
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.className})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Nama Orang Tua / Wali Siswa
                  </label>
                  <input
                    type="text"
                    required
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="Nama bapak/ibu orang tua..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    No. WhatsApp Orang Tua
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      placeholder="0812-xxxx-xxxx"
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Digunakan untuk pengiriman surat secara otomatis ke WhatsApp
                  </span>
                </div>
              </div>
            </div>

            {/* Bagian 3: Rincian Pertemuan / Pemanggilan */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider block">
                3. Waktu, Tempat, & Agenda Pertemuan
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Hari & Tanggal Pertemuan
                  </label>
                  <input
                    type="text"
                    required
                    value={meetingDayDate}
                    onChange={(e) => setMeetingDayDate(e.target.value)}
                    placeholder="Contoh: Kamis, 06 November 2026"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Waktu / Pukul
                  </label>
                  <input
                    type="text"
                    required
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    placeholder="09:00 - 10:30 WITA"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Tempat Pertemuan
                  </label>
                  <input
                    type="text"
                    required
                    value={meetingPlace}
                    onChange={(e) => setMeetingPlace(e.target.value)}
                    placeholder="Ruang BK / Ruang Wali Kelas"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Menghadap Kepada
                  </label>
                  <input
                    type="text"
                    required
                    value={personToMeet}
                    onChange={(e) => setPersonToMeet(e.target.value)}
                    placeholder="Guru BK / Wali Kelas X MIPA 1"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Pilih Preset Keperluan Cepat
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) setAgenda(e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    <option value="">-- Pilih Rekomendasi Pokok Pembahasan --</option>
                    {agendaPresets.map((pr, idx) => (
                      <option key={idx} value={pr}>
                        {pr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Uraian Keperluan / Pokok Permasalahan
                </label>
                <textarea
                  required
                  rows={2}
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  placeholder="Jelaskan tujuan pemanggilan orang tua secara santun dan jelas..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Bagian 4: Identitas Penandatangan & Upload Tanda Tangan Digital (3.1 & 3.3) */}
            <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider block">
                    4. Identitas Penandatangan & Upload Tanda Tangan Digital (3.1 & 3.3)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Nama penandatangan terintegrasi otomatis dengan akun si pembuat. Anda dapat mengunggah tanda tangan .PNG transparan atau mengosongkannya untuk tanda tangan basah.
                  </p>
                </div>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 cursor-pointer text-amber-900 dark:text-amber-200 font-bold text-xs select-none">
                  <input
                    type="checkbox"
                    checked={useWetSignature}
                    onChange={(e) => setUseWetSignature(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Kosongkan Tanda Tangan Digital (Untuk TTD & Stempel Basah)</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Kolom Pembuat Surat (Wali Kelas / Guru BK) */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      Pihak Pertama: Pembuat Surat ({signerRole === 'guru_bk' ? 'Guru BK' : 'Wali Kelas'})
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          setSignerRole('wali_kelas');
                          setSignerTitle(`Wali Kelas ${selectedStudent?.className || 'X MIPA 1'}`);
                        }}
                        className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-all ${
                          signerRole === 'wali_kelas'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-600 border border-slate-200'
                        }`}
                      >
                        Wali Kelas
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSignerRole('guru_bk');
                          setSignerTitle('Guru Bimbingan dan Konseling (BK)');
                        }}
                        className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-all ${
                          signerRole === 'guru_bk'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-600 border border-slate-200'
                        }`}
                      >
                        Guru BK
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1 text-[11px]">
                      Nama Lengkap Pembuat (Terintegrasi Otomatis Akun - 3.3)
                    </label>
                    <input
                      type="text"
                      required
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1 text-[11px]">
                        Jabatan / Posisi
                      </label>
                      <input
                        type="text"
                        value={signerTitle}
                        onChange={(e) => setSignerTitle(e.target.value)}
                        placeholder={signerRole === 'guru_bk' ? 'Guru BK' : 'Wali Kelas'}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1 text-[11px]">
                        NIP / NUPTK
                      </label>
                      <input
                        type="text"
                        value={signerNip}
                        onChange={(e) => setSignerNip(e.target.value)}
                        placeholder="1982xxxx..."
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Upload TTD Pembuat Surat */}
                  {!useWetSignature && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1 text-[11px]">
                        Upload Gambar Tanda Tangan ({signerRole === 'guru_bk' ? 'Guru BK' : 'Wali Kelas'}) (.PNG - 3.1)
                      </label>
                      {signerSignatureImage ? (
                        <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                          <img
                            src={signerSignatureImage}
                            alt="Tanda Tangan Pembuat"
                            className="h-10 max-w-[120px] object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => setSignerSignatureImage(undefined)}
                            className="text-xs text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus Gambar</span>
                          </button>
                        </div>
                      ) : (
                        <input
                          type="file"
                          accept="image/png,image/*"
                          onChange={(e) => handleSignatureUpload(e, 'signer')}
                          className="w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Kolom Mengetahui: Kepala Sekolah */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
                    Pihak Kedua: Mengetahui, Kepala Sekolah
                  </span>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1 text-[11px]">
                      Nama Kepala Sekolah (Otomatis dari Profil)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={profile.principalName || 'Dr. Hendra Wijaya, M.Pd.'}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 font-bold text-slate-700 dark:text-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1 text-[11px]">
                      NIP Kepala Sekolah
                    </label>
                    <input
                      type="text"
                      disabled
                      value={profile.principalNip || '19740512 199903 1 004'}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 font-mono text-slate-700 dark:text-slate-300"
                    />
                  </div>

                  {/* Upload TTD Kepala Sekolah */}
                  {!useWetSignature && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1 text-[11px]">
                        Upload Gambar Tanda Tangan Kepala Sekolah (.PNG - 3.1)
                      </label>
                      {headmasterSignatureImage ? (
                        <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                          <img
                            src={headmasterSignatureImage}
                            alt="Tanda Tangan Kepala Sekolah"
                            className="h-10 max-w-[120px] object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => setHeadmasterSignatureImage(undefined)}
                            className="text-xs text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus Gambar</span>
                          </button>
                        </div>
                      ) : (
                        <input
                          type="file"
                          accept="image/png,image/*"
                          onChange={(e) => handleSignatureUpload(e, 'headmaster')}
                          className="w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tombol Terbitkan Surat */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('arsip')}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Terbitkan & Simpan Surat Resmi</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* MODAL PREVIEW SURAT & CETAK PDF RESMI */}
      {selectedLetterForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-2xl max-w-4xl w-full p-6 md:p-8 shadow-2xl my-auto space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Header Action Bar */}
            <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Pratinjau Surat Resmi Kedinasan
                </h3>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Tombol Kirim WhatsApp */}
                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(selectedLetterForView)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim ke WhatsApp Orang Tua</span>
                </button>

                {/* Tombol Download PDF */}
                <button
                  type="button"
                  disabled={isExportingPdf}
                  onClick={async () => {
                    if (!letterPrintCanvasRef.current) return;
                    setIsExportingPdf(true);
                    try {
                      await exportElementToPdf(
                        letterPrintCanvasRef.current,
                        `Surat_Panggilan_${selectedLetterForView.studentName.replace(/\s+/g, '_')}_${selectedLetterForView.letterNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
                      );
                    } catch (err) {
                      console.error('Gagal export PDF:', err);
                    } finally {
                      setIsExportingPdf(false);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 rounded-xl shadow-xs cursor-pointer border border-slate-300"
                >
                  {isExportingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-indigo-600" />
                  )}
                  <span>Download .Pdf</span>
                </button>

                {/* Tombol Cetak / Print */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak (Ctrl+P)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedLetterForView(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* AREA DOKUMEN CETAK RESMI FORMAT KEDINASAN A4 */}
            <div
              ref={letterPrintCanvasRef}
              className="print-area official-paper official-letter-content bg-white p-8 md:p-12 border border-slate-200 rounded-xl"
              style={{
                minHeight: '297mm',
                fontFamily: "'Times New Roman', Times, Georgia, serif",
                fontSize: '12pt',
                lineHeight: 1.5,
                color: '#000000',
                backgroundColor: '#ffffff',
              }}
            >
              {/* Kop Surat Resmi */}
              <OfficialLetterhead
                profile={profile}
                documentTitle=""
                showDocumentNumber={false}
              />

              {/* Format Surat Resmi: Mulai dari Nomor Surat sampai Penandatangan (Times New Roman, Ukuran 12) */}
              <div
                className="official-letter-content"
                style={{
                  fontFamily: "'Times New Roman', Times, Georgia, serif",
                  fontSize: '12pt',
                  lineHeight: 1.5,
                  color: '#000000',
                }}
              >
                {/* Baris Nomor, Lampiran, Perihal & Tanggal */}
                <div className="pb-4">
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontFamily: "'Times New Roman', Times, Georgia, serif",
                      fontSize: '12pt',
                      lineHeight: 1.5,
                      color: '#000000',
                    }}
                  >
                    <tbody>
                      <tr>
                        <td style={{ width: '90px', verticalAlign: 'top', padding: '2px 0' }}>Nomor</td>
                        <td style={{ width: '15px', verticalAlign: 'top', padding: '2px 0' }}>:</td>
                        <td style={{ verticalAlign: 'top', fontWeight: 'bold', padding: '2px 0' }}>
                          {selectedLetterForView.letterNumber}
                        </td>
                        <td style={{ textAlign: 'right', verticalAlign: 'top', padding: '2px 0' }}>
                          {selectedLetterForView.city}, {formatDateIndonesian(selectedLetterForView.letterDate)}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ verticalAlign: 'top', padding: '2px 0' }}>Lampiran</td>
                        <td style={{ verticalAlign: 'top', padding: '2px 0' }}>:</td>
                        <td colSpan={2} style={{ verticalAlign: 'top', padding: '2px 0' }}>-</td>
                      </tr>
                      <tr>
                        <td style={{ verticalAlign: 'top', padding: '2px 0' }}>Perihal</td>
                        <td style={{ verticalAlign: 'top', padding: '2px 0' }}>:</td>
                        <td
                          colSpan={2}
                          style={{
                            verticalAlign: 'top',
                            textDecoration: 'underline',
                            fontWeight: 'bold',
                            padding: '2px 0',
                          }}
                        >
                          {selectedLetterForView.letterType === 'pemanggilan'
                            ? 'Undangan Pemanggilan Orang Tua / Wali Peserta Didik'
                            : selectedLetterForView.letterType === 'peringatan'
                            ? 'Surat Peringatan & Evaluasi Hasil Belajar Peserta Didik'
                            : 'Pemberitahuan Khusus Perkembangan Peserta Didik'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Tujuan Surat */}
                <div style={{ marginTop: '16px', marginBottom: '16px', lineHeight: 1.5 }}>
                  <p>Kepada Yth.</p>
                  <p>Bapak / Ibu Orang Tua / Wali dari ananda:</p>
                  <p style={{ fontWeight: 'bold' }}>
                    {selectedLetterForView.studentName} (Kelas {selectedLetterForView.className})
                  </p>
                  <p>di Tempat</p>
                </div>

                {/* Isi Surat */}
                <div style={{ lineHeight: 1.6, textAlign: 'justify' }}>
                  <p style={{ marginBottom: '10px' }}>Dengan hormat,</p>
                  <p style={{ textIndent: '36px', marginBottom: '12px' }}>
                    Sehubungan dengan upaya pembinaan, pemantauan perkembangan proses belajar, serta penegakan tata tertib peserta didik di lingkungan <strong>{profile.name}</strong>, maka melalui surat ini kami mengharapkan kehadiran Bapak/Ibu Orang Tua/Wali pada:
                  </p>

                  {/* Rincian Agenda */}
                  <div style={{ paddingLeft: '36px', marginTop: '10px', marginBottom: '14px' }}>
                    <table
                      style={{
                        borderCollapse: 'collapse',
                        fontFamily: "'Times New Roman', Times, Georgia, serif",
                        fontSize: '12pt',
                        lineHeight: 1.6,
                        color: '#000000',
                      }}
                    >
                      <tbody>
                        <tr>
                          <td style={{ width: '150px', verticalAlign: 'top', padding: '3px 0' }}>Hari / Tanggal</td>
                          <td style={{ width: '15px', verticalAlign: 'top', padding: '3px 0' }}>:</td>
                          <td style={{ fontWeight: 'bold', verticalAlign: 'top', padding: '3px 0' }}>
                            {selectedLetterForView.meetingDayDate}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ verticalAlign: 'top', padding: '3px 0' }}>Waktu / Pukul</td>
                          <td style={{ verticalAlign: 'top', padding: '3px 0' }}>:</td>
                          <td style={{ verticalAlign: 'top', padding: '3px 0' }}>
                            {selectedLetterForView.meetingTime}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ verticalAlign: 'top', padding: '3px 0' }}>Tempat</td>
                          <td style={{ verticalAlign: 'top', padding: '3px 0' }}>:</td>
                          <td style={{ verticalAlign: 'top', padding: '3px 0' }}>
                            {selectedLetterForView.meetingPlace}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ verticalAlign: 'top', padding: '3px 0' }}>Menemui</td>
                          <td style={{ verticalAlign: 'top', padding: '3px 0' }}>:</td>
                          <td style={{ fontWeight: 'bold', verticalAlign: 'top', padding: '3px 0' }}>
                            {selectedLetterForView.personToMeet}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ verticalAlign: 'top', padding: '3px 0' }}>Keperluan / Agenda</td>
                          <td style={{ verticalAlign: 'top', padding: '3px 0' }}>:</td>
                          <td style={{ verticalAlign: 'top', padding: '3px 0' }}>
                            {selectedLetterForView.agenda}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p style={{ textIndent: '36px', marginBottom: '12px' }}>
                    Mengingat sangat pentingnya agenda pembahasan ini demi kelangsungan pendidikan ananda tercinta, kami sangat mengharapkan kehadiran Bapak/Ibu tepat pada waktu yang telah ditentukan. Apabila berhalangan hadir, mohon dapat mengonfirmasi kepada pihak sekolah melalui kontak tertera.
                  </p>

                  <p style={{ textIndent: '36px', marginBottom: '24px' }}>
                    Demikian surat pemberitahuan/pemanggilan ini kami sampaikan, atas perhatian, kerja sama, dan kehadiran Bapak/Ibu, kami ucapkan terima kasih.
                  </p>
                </div>

                {/* Tanda Tangan Berdampingan (Kiri: Kepala Sekolah, Kanan: Wali Kelas / Guru BK) */}
                <div style={{ marginTop: '32px', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                  <div
                    className="grid grid-cols-2 gap-8 text-center"
                    style={{
                      fontFamily: "'Times New Roman', Times, Georgia, serif",
                      fontSize: '12pt',
                      lineHeight: 1.4,
                      color: '#000000',
                    }}
                  >
                    {/* Kiri: Mengetahui, Kepala Sekolah */}
                    <div
                      className="flex flex-col items-center"
                      style={{
                        fontFamily: "'Times New Roman', Times, Georgia, serif",
                        fontSize: '12pt',
                      }}
                    >
                      <p>Mengetahui,</p>
                      <p style={{ fontWeight: 'bold' }}>Kepala Sekolah</p>

                      <div
                        style={{
                          height: '70px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '4px 0',
                        }}
                      >
                        {!selectedLetterForView.useWetSignature && selectedLetterForView.headmasterSignatureImage ? (
                          <img
                            src={selectedLetterForView.headmasterSignatureImage}
                            alt="TTD Kepala Sekolah"
                            style={{ maxHeight: '65px', maxWidth: '140px', objectFit: 'contain' }}
                          />
                        ) : (
                          <div style={{ height: '65px' }}></div>
                        )}
                      </div>

                      <p style={{ fontWeight: 'bold', textDecoration: 'underline', textTransform: 'uppercase' }}>
                        {selectedLetterForView.headmasterName}
                      </p>
                      <p>NIP. {selectedLetterForView.headmasterNip}</p>
                    </div>

                    {/* Kanan: Pembuat Surat (Wali Kelas / Guru BK) */}
                    <div
                      className="flex flex-col items-center"
                      style={{
                        fontFamily: "'Times New Roman', Times, Georgia, serif",
                        fontSize: '12pt',
                      }}
                    >
                      <p>
                        {selectedLetterForView.city}, {formatDateIndonesian(selectedLetterForView.letterDate)}
                      </p>
                      <p style={{ fontWeight: 'bold' }}>{selectedLetterForView.signerTitle}</p>

                      <div
                        style={{
                          height: '70px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '4px 0',
                        }}
                      >
                        {!selectedLetterForView.useWetSignature && selectedLetterForView.signerSignatureImage ? (
                          <img
                            src={selectedLetterForView.signerSignatureImage}
                            alt="TTD Pembuat Surat"
                            style={{ maxHeight: '65px', maxWidth: '140px', objectFit: 'contain' }}
                          />
                        ) : (
                          <div style={{ height: '65px' }}></div>
                        )}
                      </div>

                      <p style={{ fontWeight: 'bold', textDecoration: 'underline', textTransform: 'uppercase' }}>
                        {selectedLetterForView.signerName}
                      </p>
                      <p>NIP. {selectedLetterForView.signerNip || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
