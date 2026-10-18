import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { ParentMessage, Student, TeacherStudentMessage } from '../types';
import { PrintModal } from '../components/common/PrintModal';
import {
  UserCheck,
  CalendarCheck,
  GraduationCap,
  Award,
  Clock,
  Printer,
  FileText,
  PhoneCall,
  CheckCircle2,
  Send,
  MessageSquare,
  AlertCircle,
  Plus,
  Filter,
  Search,
  ExternalLink,
  Mail,
  User,
  ShieldCheck,
  ShieldAlert,
  HeartHandshake,
  Edit2,
  Trash2,
} from 'lucide-react';

interface ParentPortalViewProps {
  initialTab?: 'portal' | 'pesan';
}

export const ParentPortalView: React.FC<ParentPortalViewProps> = ({ initialTab = 'portal' }) => {
  const { currentUser, activeChildId, setActiveChildId } = useAuth();
  const students = DataService.getStudents();
  const classes = DataService.getClasses();
  const assignments = DataService.getAssignments();
  const profile = DataService.getSchoolProfile();

  const [parentMessages, setParentMessages] = useState<ParentMessage[]>(() =>
    DataService.getParentMessages()
  );
  const [teacherMessages, setTeacherMessages] = useState<TeacherStudentMessage[]>(() =>
    DataService.getTeacherStudentMessages()
  );

  // Tab switching: portal | pesan | guru_siswa
  const isParentOnly = currentUser.role === 'orang_tua';
  const defaultTab = isParentOnly ? 'portal' : initialTab === 'pesan' ? 'pesan' : 'pesan';
  const [activeSubTab, setActiveSubTab] = useState<'portal' | 'pesan' | 'guru_siswa'>(defaultTab);

  // Teacher message compose modal state
  const [isTeacherComposeOpen, setIsTeacherComposeOpen] = useState(false);
  const [teacherMsgTargetClassId, setTeacherMsgTargetClassId] = useState(classes[0]?.id || '');
  const [teacherMsgTargetStudentId, setTeacherMsgTargetStudentId] = useState('');
  const [teacherMsgIsBroadcast, setTeacherMsgIsBroadcast] = useState(true);
  const [teacherMsgCategory, setTeacherMsgCategory] = useState<TeacherStudentMessage['category']>('Pengumuman Mapel');
  const [teacherMsgTitle, setTeacherMsgTitle] = useState('');
  const [teacherMsgContent, setTeacherMsgContent] = useState('');
  const [teacherMsgSuccess, setTeacherMsgSuccess] = useState<string | null>(null);

  // Permissions: Super Admin, Guru BK, and Wali Kelas can compose parent messages
  const canSendMessages = ['super_admin', 'guru_bk', 'wali_kelas', 'wakasek_kurikulum'].includes(currentUser.role);
  const canSendTeacherStudentMsg = ['super_admin', 'guru', 'wakasek_kurikulum'].includes(currentUser.role);

  // Identified children strictly for the parent account
  const myChildren = students.filter((s) => {
    if (currentUser.id === s.parentId) return true;
    if (currentUser.childrenIds && currentUser.childrenIds.includes(s.id)) return true;
    if (currentUser.name && s.parentName && s.parentName.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) return true;
    // Demo fallback ONLY for default parent account 'usr-ortu-bambang'
    if (currentUser.id === 'usr-ortu-bambang' && ['std-ahmad', 'std-siti'].includes(s.id)) return true;
    return false;
  });

  const activeChild = myChildren.find((c) => c.id === activeChildId) || myChildren[0] || students[0];

  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Compose Message State
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const [selectedStudentIdForMessage, setSelectedStudentIdForMessage] = useState(students[0]?.id || '');
  const [messageCategory, setMessageCategory] = useState<ParentMessage['category']>('Kehadiran');
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [messageSuccess, setMessageSuccess] = useState<string | null>(null);

  // View message detail modal
  const [viewingMessage, setViewingMessage] = useState<ParentMessage | null>(null);

  // Filter messages
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [messageCategoryFilter, setMessageCategoryFilter] = useState('all');

  const selectedTargetStudent = students.find((s) => s.id === selectedStudentIdForMessage) || students[0];

  // Synthetic report card grades for active child
  const mockSubjectGrades = [
    { subject: 'Matematika Wajib', kkm: 75, tugas: 95, uts: 90, akhir: 92.5, predikat: 'A' },
    { subject: 'Fisika', kkm: 75, tugas: 88, uts: 85, akhir: 86.5, predikat: 'B' },
    { subject: 'Kimia', kkm: 75, tugas: 85, uts: 88, akhir: 86.5, predikat: 'B' },
    { subject: 'Bahasa Indonesia', kkm: 78, tugas: 90, uts: 92, akhir: 91.0, predikat: 'A' },
    { subject: 'Bahasa Inggris', kkm: 75, tugas: 88, uts: 86, akhir: 87.0, predikat: 'B' },
    { subject: 'Pendidikan Agama & Budi Pekerti', kkm: 80, tugas: 94, uts: 92, akhir: 93.0, predikat: 'A' },
  ];

  const childTasks = assignments.filter((a) => a.classId === activeChild.classId);

  // Filtered parent messages list
  const filteredMessages = parentMessages.filter((msg) => {
    // Requirement 4 & 18: Guru hanya bisa melihat pesan yang dikirim oleh guru yang bersangkutan
    if (currentUser.role === 'guru' && msg.senderId !== currentUser.id && msg.senderName !== currentUser.name) {
      return false;
    }

    // Requirement 17: Hanya boleh menampilkan Pesan Wali Kelas ybs. ke Orang Tua di portal komunikasi. Wali kelas tidak bisa melihat pesan wali kelas yang lain.
    if (currentUser.role === 'wali_kelas' && msg.senderId !== currentUser.id && msg.senderName !== currentUser.name) {
      return false;
    }

    // Requirement 2: Orang tua hanya bisa mengakses pesan yang ditujukan kepada dirinya, tidak bisa mengakses pesan ke orang tua yang lain.
    if (isParentOnly) {
      const childNames = myChildren.map((c) => c.name.toLowerCase());
      const childIds = myChildren.map((c) => c.id);
      const isDirectlyForParent =
        (msg.parentName && currentUser.name && msg.parentName.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) ||
        (msg.studentId && childIds.includes(msg.studentId)) ||
        (msg.studentName && childNames.includes(msg.studentName.toLowerCase()));
      if (!isDirectlyForParent) {
        return false;
      }
    }

    const matchesSearch =
      msg.studentName.toLowerCase().includes(messageSearchQuery.toLowerCase()) ||
      msg.parentName.toLowerCase().includes(messageSearchQuery.toLowerCase()) ||
      msg.subject.toLowerCase().includes(messageSearchQuery.toLowerCase()) ||
      msg.message.toLowerCase().includes(messageSearchQuery.toLowerCase());

    const matchesCategory =
      messageCategoryFilter === 'all' || msg.category === messageCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Requirement 4, 6 & 18: Teacher to Student Messages filtered strictly
  const filteredTeacherMessages = teacherMessages.filter((msg) => {
    // Requirement 6: Super Admin tidak bisa melihat pesan dari guru ke siswa
    if (currentUser.role === 'super_admin') {
      return false;
    }

    // Requirement 18: Hanya boleh menampilkan Pesan Guru ybs. ke Siswa di portal komunikasi. Guru mapel tidak bisa melihat pesan guru yang lain.
    if (currentUser.role === 'guru') {
      return msg.teacherId === currentUser.id || msg.teacherName === currentUser.name;
    }

    // Siswa hanya melihat pesan untuk kelasnya atau khusus dirinya
    if (currentUser.role === 'siswa') {
      return (
        (!msg.classId || msg.classId === currentUser.classId) &&
        (msg.isBroadcastToClass || msg.targetStudentId === currentUser.id)
      );
    }

    return true;
  });

  // Editing existing message state
  const [editingMessage, setEditingMessage] = useState<ParentMessage | null>(null);

  const canManageAnyMessage = ['super_admin', 'wali_kelas', 'wakasek_kurikulum'].includes(currentUser.role);

  const handleDeleteTeacherMessage = (id: string, title: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus pesan "${title}"?`)) {
      DataService.deleteTeacherStudentMessage(id, {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      });
      setTeacherMessages(DataService.getTeacherStudentMessages());
    }
  };

  const handleOpenCompose = (preselectedStudent?: Student) => {
    setEditingMessage(null);
    if (preselectedStudent) {
      setSelectedStudentIdForMessage(preselectedStudent.id);
    } else {
      setSelectedStudentIdForMessage(students[0]?.id || '');
    }
    setMessageCategory('Kehadiran');
    setMessageSubject('');
    setMessageBody('');
    setMessageSuccess(null);
    setIsComposeModalOpen(true);
  };

  const handleOpenEditMessage = (msg: ParentMessage) => {
    setEditingMessage(msg);
    setSelectedStudentIdForMessage(msg.studentId);
    setMessageCategory(msg.category);
    setMessageSubject(msg.subject);
    setMessageBody(msg.message);
    setMessageSuccess(null);
    setIsComposeModalOpen(true);
  };

  const handleDeleteMessage = (id: string, subject: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus pesan "${subject}"?`)) {
      DataService.deleteParentMessage(id, {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      });
      setParentMessages(DataService.getParentMessages());
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageSubject.trim() || !messageBody.trim() || !selectedTargetStudent) return;

    if (editingMessage) {
      const updated: ParentMessage = {
        ...editingMessage,
        studentId: selectedTargetStudent.id,
        studentName: selectedTargetStudent.name,
        studentClass: selectedTargetStudent.className,
        parentName: selectedTargetStudent.parentName || 'Orang Tua ' + selectedTargetStudent.name,
        parentPhone: selectedTargetStudent.parentPhone || '0812-0000-0000',
        category: messageCategory,
        subject: messageSubject.trim(),
        message: messageBody.trim(),
      };
      DataService.updateParentMessage(updated, {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      });
      setParentMessages(DataService.getParentMessages());
      setMessageSuccess(`Perubahan pesan berhasil disimpan.`);
    } else {
      const newMsg: ParentMessage = {
        id: 'pmsg-' + Date.now(),
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        studentId: selectedTargetStudent.id,
        studentName: selectedTargetStudent.name,
        studentClass: selectedTargetStudent.className,
        parentName: selectedTargetStudent.parentName || 'Orang Tua ' + selectedTargetStudent.name,
        parentPhone: selectedTargetStudent.parentPhone || '0812-0000-0000',
        category: messageCategory,
        subject: messageSubject.trim(),
        message: messageBody.trim(),
        sentAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'terkirim',
      };

      DataService.sendParentMessage(newMsg, {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      });

      setParentMessages(DataService.getParentMessages());
      setMessageSuccess(`Pesan resmi berhasil dikirim ke orang tua siswa ${selectedTargetStudent.name} (${newMsg.parentName}).`);
    }

    setTimeout(() => {
      setIsComposeModalOpen(false);
      setMessageSuccess(null);
      setEditingMessage(null);
    }, 1500);
  };

  const generateWhatsAppLink = (phone: string, text: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.substring(1) : cleanPhone;
    return `https://wa.me/${intlPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Portal Komunikasi & Hasil Belajar Orang Tua
          </h2>
          <p className="text-xs text-slate-500">
            Kirim pesan personal ke orang tua (Super Admin, Guru BK, Wali Kelas) dan pemantauan hasil belajar siswa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canSendMessages && (
            <button
              onClick={() => handleOpenCompose()}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim Pesan ke Orang Tua</span>
            </button>
          )}

          {activeSubTab === 'portal' && (
            <button
              onClick={() => setPrintModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Cetak Hasil Belajar</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 text-xs">
        <button
          onClick={() => setActiveSubTab('pesan')}
          className={`pb-3 px-4 font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'pesan'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>
            {isParentOnly ? 'Pesan Masuk dari Sekolah' : 'Pesan ke Orang Tua'}
          </span>
          <span className="ml-1 text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            {filteredMessages.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('guru_siswa')}
          className={`pb-3 px-4 font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'guru_siswa'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Pesan Guru ke Siswa</span>
          <span className="ml-1 text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            {filteredTeacherMessages.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('portal')}
          className={`pb-3 px-4 font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'portal'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Monitoring Kehadiran & Nilai Siswa</span>
        </button>
      </div>

      {/* TAB 1: KIRIM & KELOLA PESAN KE ORANG TUA */}
      {activeSubTab === 'pesan' && (
        <div className="space-y-4">
          {/* Quick Filter & Search Bar */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-3 text-xs">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama siswa, orang tua, subjek pesan..."
                value={messageSearchQuery}
                onChange={(e) => setMessageSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={messageCategoryFilter}
                onChange={(e) => setMessageCategoryFilter(e.target.value)}
                className="w-full sm:w-44 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="all">Semua Kategori</option>
                <option value="Kehadiran">Kehadiran</option>
                <option value="Akademik">Akademik</option>
                <option value="Konseling">Konseling</option>
                <option value="Administrasi">Administrasi</option>
                <option value="Apresiasi">Apresiasi</option>
              </select>
            </div>
          </div>

          {/* Messages Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                    <th className="py-3 px-4">Tanggal & Jam</th>
                    <th className="py-3 px-4">Pengirim</th>
                    <th className="py-3 px-4">Siswa & Kelas</th>
                    <th className="py-3 px-4">Orang Tua / Wali</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Subjek Pesan</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredMessages.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        Belum ada pesan komunikasi yang tercatat.
                      </td>
                    </tr>
                  ) : (
                    filteredMessages.map((msg) => {
                      const waFormatted = `*Pemberitahuan Sekolah - ${profile.name}*\nKepada Yth. Bapak/Ibu ${msg.parentName}\nOrang Tua dari: ${msg.studentName} (${msg.studentClass})\n\nKategori: [${msg.category}]\nHal: ${msg.subject}\n\n${msg.message}\n\nPengirim: ${msg.senderName} (${msg.senderRole.replace('_', ' ').toUpperCase()})`;

                      return (
                        <tr
                          key={msg.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                            {msg.sentAt}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 dark:text-white block truncate max-w-[140px]">
                              {msg.senderName}
                            </span>
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 capitalize">
                              {msg.senderRole.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">
                              {msg.studentName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {msg.studentClass}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-slate-800 dark:text-slate-200 block">
                              {msg.parentName}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {msg.parentPhone}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                msg.category === 'Kehadiran'
                                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                  : msg.category === 'Akademik'
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                  : msg.category === 'Konseling'
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                  : msg.category === 'Apresiasi'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {msg.category}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900 dark:text-white line-clamp-1">
                              {msg.subject}
                            </p>
                            <p className="text-[11px] text-slate-500 line-clamp-1">
                              {msg.message}
                            </p>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setViewingMessage(msg)}
                                className="px-2.5 py-1 text-[11px] font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                              >
                                Baca
                              </button>
                              <a
                                href={generateWhatsAppLink(msg.parentPhone, waFormatted)}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 text-[11px] font-semibold rounded bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 flex items-center gap-1 cursor-pointer"
                                title="Kirim via WhatsApp Web/App"
                              >
                                <ExternalLink className="w-3 h-3 text-emerald-600" />
                                <span>WA</span>
                              </a>

                              {canManageAnyMessage && (
                                <>
                                  <button
                                    onClick={() => handleOpenEditMessage(msg)}
                                    className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                    title="Ubah Pesan"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMessage(msg.id, msg.subject)}
                                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                    title="Hapus Pesan"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1.5: PESAN GURU KE SISWA */}
      {activeSubTab === 'guru_siswa' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-600" />
                Pesan & Pengumuman Guru Mata Pelajaran ke Siswa
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kirim instruksi tugas, bimbingan materi, atau apresiasi secara terarah ke satu kelas atau siswa personal.
              </p>
            </div>

            {canSendTeacherStudentMsg && (
              <button
                onClick={() => {
                  setTeacherMsgTitle('');
                  setTeacherMsgContent('');
                  setTeacherMsgSuccess(null);
                  setIsTeacherComposeOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Kirim Pesan ke Siswa</span>
              </button>
            )}
          </div>

          {currentUser.role === 'super_admin' ? (
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-2">
              <ShieldAlert className="w-8 h-8 text-indigo-500 mx-auto" />
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Pesan Guru ke Siswa Bersifat Privat
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Sesuai kebijakan privasi sistem, Super Admin tidak memiliki akses melihat pesan dari guru ke siswa. Komunikasi ini hanya dapat diakses oleh Guru pengampu dan Siswa penerima yang bersangkutan.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                      <th className="py-3 px-4">Waktu</th>
                      <th className="py-3 px-4">Guru & Mapel</th>
                      <th className="py-3 px-4">Rombel / Penerima</th>
                      <th className="py-3 px-4">Kategori</th>
                      <th className="py-3 px-4">Judul Pesan</th>
                      <th className="py-3 px-4">Isi Pesan</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredTeacherMessages.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                          Belum ada pesan yang dikirim atau diterima.
                        </td>
                      </tr>
                    ) : (
                      filteredTeacherMessages.map((msg) => (
                        <tr key={msg.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{msg.sentAt}</td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 dark:text-white block">{msg.teacherName}</span>
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">{msg.subjectName}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">{msg.className}</span>
                            <span className="text-[10px] text-slate-400">
                              {msg.isBroadcastToClass ? 'Seluruh Siswa Satu Kelas' : `Personal: ${msg.targetStudentName}`}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                              {msg.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{msg.title}</td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">{msg.content}</td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {(currentUser.role === 'guru' || currentUser.id === msg.teacherId) && (
                              <button
                                onClick={() => handleDeleteTeacherMessage(msg.id, msg.title)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="Hapus Pesan Ini"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal Compose Teacher-Student Message */}
          {isTeacherComposeOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Send className="w-4 h-4 text-indigo-600" />
                    Kirim Pesan ke Siswa
                  </h3>
                  <button onClick={() => setIsTeacherComposeOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>

                {teacherMsgSuccess && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-800 dark:text-emerald-200 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{teacherMsgSuccess}</span>
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!teacherMsgTitle || !teacherMsgContent) return;

                    const targetClass = classes.find((c) => c.id === teacherMsgTargetClassId) || classes[0];
                    const targetStudent = students.find((s) => s.id === teacherMsgTargetStudentId);

                    const newMsg: TeacherStudentMessage = {
                      id: 'tsm-' + Date.now(),
                      teacherId: currentUser.id,
                      teacherName: currentUser.name,
                      subjectName: 'Mata Pelajaran Pengampu',
                      classId: targetClass.id,
                      className: targetClass.name,
                      isBroadcastToClass: teacherMsgIsBroadcast,
                      targetStudentId: teacherMsgIsBroadcast ? undefined : targetStudent?.id,
                      targetStudentName: teacherMsgIsBroadcast ? undefined : targetStudent?.name,
                      category: teacherMsgCategory,
                      title: teacherMsgTitle,
                      content: teacherMsgContent,
                      sentAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
                    };

                    DataService.sendTeacherStudentMessage(newMsg, {
                      id: currentUser.id,
                      name: currentUser.name,
                      role: currentUser.role,
                    });

                    setTeacherMessages(DataService.getTeacherStudentMessages());
                    setTeacherMsgSuccess('Pesan berhasil terkirim ke siswa!');
                    setTimeout(() => {
                      setIsTeacherComposeOpen(false);
                      setTeacherMsgSuccess(null);
                    }, 1400);
                  }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Rombel Kelas</label>
                      <select
                        value={teacherMsgTargetClassId}
                        onChange={(e) => setTeacherMsgTargetClassId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                      >
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Kategori Pesan</label>
                      <select
                        value={teacherMsgCategory}
                        onChange={(e) => setTeacherMsgCategory(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                      >
                        <option value="Pengumuman Mapel">Pengumuman Mapel</option>
                        <option value="Tugas & Remedi">Tugas & Remedi</option>
                        <option value="Materi Tambahan">Materi Tambahan</option>
                        <option value="Apresiasi">Apresiasi Siswa</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 py-1">
                    <label className="flex items-center gap-2 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="broadcastType"
                        checked={teacherMsgIsBroadcast}
                        onChange={() => setTeacherMsgIsBroadcast(true)}
                        className="accent-indigo-600"
                      />
                      <span>Kirim ke Seluruh Siswa Rombel</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="broadcastType"
                        checked={!teacherMsgIsBroadcast}
                        onChange={() => setTeacherMsgIsBroadcast(false)}
                        className="accent-indigo-600"
                      />
                      <span>Pesan Personal ke Satu Siswa</span>
                    </label>
                  </div>

                  {!teacherMsgIsBroadcast && (
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Pilih Siswa Tertentu</label>
                      <select
                        value={teacherMsgTargetStudentId}
                        onChange={(e) => setTeacherMsgTargetStudentId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                      >
                        <option value="">-- Pilih Siswa --</option>
                        {students
                          .filter((s) => s.classId === teacherMsgTargetClassId)
                          .map((s) => (
                            <option key={s.id} value={s.id}>{s.name} ({s.nisn})</option>
                          ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Judul / Hal</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Pengingat Tugas Proyek & Remedi Bab 2"
                      value={teacherMsgTitle}
                      onChange={(e) => setTeacherMsgTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Isi Pesan</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Tuliskan pesan petunjuk atau materi..."
                      value={teacherMsgContent}
                      onChange={(e) => setTeacherMsgContent(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    ></textarea>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsTeacherComposeOpen(false)}
                      className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                    >
                      Kirim Pesan
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PORTAL MONITORING NILAI & KEHADIRAN ANAK */}
      {activeSubTab === 'portal' && (
        <div className="space-y-6">
          {/* Multi-Child Selector Tabs */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <span className="font-bold text-xs text-slate-900 dark:text-white block">
                  Pilih Profil Peserta Didik (Anak)
                </span>
                <span className="text-[11px] text-slate-500">
                  Relasi keluarga telah diverifikasi sekolah melalui data KK & Dapodik (Multi-Anak Didukung).
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {myChildren.map((c) => {
                const isSelected = c.id === activeChild.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveChildId(c.id)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {c.name} ({c.className})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Child Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Tingkat Kehadiran</span>
              <p className="text-2xl font-bold text-emerald-600 font-mono tabular-nums mt-1">
                98.1%
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {activeChild.attendance.hadir} Hadir · {activeChild.attendance.sakit} Sakit · {activeChild.attendance.izin} Izin · {activeChild.attendance.alpa} Alpa
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Rerata Nilai Kumulatif</span>
              <p className="text-2xl font-bold text-indigo-600 font-mono tabular-nums mt-1">
                {activeChild.gpa}
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                Predikat: A (Sangat Memuaskan)
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Wali Kelas</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-1">
                Budi Santoso, S.Si.
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                Ruang Guru Lt. 2
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Status Administrasi</span>
              <p className="text-sm font-bold text-emerald-600 mt-1">
                Terverifikasi Lengkap
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                NISN: {activeChild.nisn}
              </p>
            </div>
          </div>

          {/* Published Grades Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Transparansi Capaian Nilai Pembelajaran Semester Ganjil
                </h3>
                <p className="text-xs text-slate-500">
                  Hasil nilai tugas harian dan penilaian tengah semester yang telah diverifikasi guru.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-md font-bold">
                Status: Nilai Terbit
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Mata Pelajaran</th>
                    <th className="py-3 px-4 text-center">KKM</th>
                    <th className="py-3 px-4 text-center">Rerata Tugas</th>
                    <th className="py-3 px-4 text-center">PTS / UTS</th>
                    <th className="py-3 px-4 text-center">Nilai Akhir</th>
                    <th className="py-3 px-4 text-center">Predikat</th>
                    <th className="py-3 px-4 text-center">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {mockSubjectGrades.map((g, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono text-slate-400">{i + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {g.subject}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-500">{g.kkm}</td>
                      <td className="py-3 px-4 text-center font-mono font-semibold">{g.tugas}</td>
                      <td className="py-3 px-4 text-center font-mono font-semibold">{g.uts}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {g.akhir}
                      </td>
                      <td className="py-3 px-4 text-center font-bold">{g.predikat}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                          TUNTAS
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Upcoming Tasks for the Child */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Tugas Sekolah Yang Sedang Berjalan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {childTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-1.5"
                >
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    {t.subjectName}
                  </span>
                  <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">
                    {t.title}
                  </h4>
                  <p className="text-slate-500 text-[11px] flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Tenggat: {t.deadline}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: FORMULIR KIRIM PESAN PERSONAL KE ORANG TUA */}
      {isComposeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {editingMessage ? 'Ubah Pesan ke Orang Tua' : 'Kirim Pesan Resmi ke Orang Tua Siswa'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingMessage
                      ? `Memperbarui pesan untuk orang tua siswa ${editingMessage.studentName}`
                      : `Komunikasi langsung dari ${currentUser.name} (${currentUser.role.replace('_', ' ').toUpperCase()})`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsComposeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            {messageSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{messageSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="space-y-3.5 text-xs">
              {/* Target Student Selection */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Pilih Peserta Didik (Siswa)
                </label>
                <select
                  value={selectedStudentIdForMessage}
                  onChange={(e) => setSelectedStudentIdForMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer font-medium"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.className} (Ortu: {s.parentName || 'Belum diisi'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Identified Parent Bio Banner */}
              {selectedTargetStudent && (
                <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/50 rounded-xl border border-indigo-100 dark:border-indigo-900/60 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Nama Orang Tua / Wali:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {selectedTargetStudent.parentName || 'Orang Tua Siswa'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Nomor WhatsApp:</span>
                    <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">
                      {selectedTargetStudent.parentPhone || '0812-0000-0000'}
                    </span>
                  </div>
                </div>
              )}

              {/* Message Category */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Kategori Pesan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Kehadiran', 'Akademik', 'Konseling', 'Administrasi', 'Apresiasi'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setMessageCategory(cat)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border text-center transition-colors cursor-pointer ${
                        messageCategory === cat
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Subjek / Hal Pesan
                </label>
                <input
                  type="text"
                  required
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  placeholder="Contoh: Pemberitahuan Ketidakhadiran 2 Hari Berturut-turut"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Message Body */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Isi Pesan Lengkap
                </label>
                <textarea
                  rows={4}
                  required
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Tuliskan rincian pesan resmi atau saran tindak lanjut kepada orang tua..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-xs leading-relaxed"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsComposeModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Pesan ke Orang Tua</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BACA PESAN DETAIL */}
      {viewingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Detail Pesan Sekolah
              </span>
              <button
                onClick={() => setViewingMessage(null)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-500">
                  <span>Waktu Kirim:</span>
                  <span className="font-mono">{viewingMessage.sentAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pengirim:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {viewingMessage.senderName} ({viewingMessage.senderRole.replace('_', ' ').toUpperCase()})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Siswa & Kelas:</span>
                  <span className="font-bold">{viewingMessage.studentName} ({viewingMessage.studentClass})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tujuan Orang Tua:</span>
                  <span className="font-bold">{viewingMessage.parentName} ({viewingMessage.parentPhone})</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Subjek Pesan:
                </span>
                <p className="font-bold text-sm text-slate-900 dark:text-white">
                  {viewingMessage.subject}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Isi Pesan:
                </span>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                  {viewingMessage.message}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                onClick={() => setViewingMessage(null)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Modal: Rapor Sementara */}
      <PrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        title="Cetak Lembar Hasil Belajar Siswa"
        documentTitle="LEMBAR HASIL BELAJAR SISWA (RAPOR SEMENTARA)"
        documentNumber={`421.7 / RAPOR / ${activeChild.nis} / 2024`}
        rightSignerTitle="Wali Kelas X MIPA 1"
        rightSignerName="Budi Santoso, S.Si."
        rightSignerNip="19820311 200801 1 007"
      >
        <div className="space-y-4">
          <table className="w-full text-xs mb-3">
            <tbody>
              <tr>
                <td className="w-32 py-0.5 font-semibold">Nama Siswa</td>
                <td className="w-4 py-0.5">:</td>
                <td className="py-0.5 font-bold uppercase">{activeChild.name}</td>
                <td className="w-32 py-0.5 font-semibold">Kelas / Rombel</td>
                <td className="w-4 py-0.5">:</td>
                <td className="py-0.5 font-bold">{activeChild.className}</td>
              </tr>
              <tr>
                <td className="py-0.5 font-semibold">NISN / NIS</td>
                <td className="py-0.5">:</td>
                <td className="py-0.5 font-mono">{activeChild.nisn} / {activeChild.nis}</td>
                <td className="py-0.5 font-semibold">Semester / Tahun</td>
                <td className="py-0.5">:</td>
                <td className="py-0.5">Ganjil / 2024-2025</td>
              </tr>
            </tbody>
          </table>

          <table className="w-full border-collapse border border-black text-xs">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-black py-2 px-2 text-center w-8">No</th>
                <th className="border border-black py-2 px-3 text-left">Mata Pelajaran</th>
                <th className="border border-black py-2 px-2 text-center w-16">KKM</th>
                <th className="border border-black py-2 px-2 text-center w-16">Tugas</th>
                <th className="border border-black py-2 px-2 text-center w-16">PTS</th>
                <th className="border border-black py-2 px-2 text-center w-20">Nilai Akhir</th>
                <th className="border border-black py-2 px-2 text-center w-16">Predikat</th>
              </tr>
            </thead>
            <tbody>
              {mockSubjectGrades.map((g, i) => (
                <tr key={i}>
                  <td className="border border-black py-1 px-2 text-center font-mono">{i + 1}</td>
                  <td className="border border-black py-1 px-3 font-semibold">{g.subject}</td>
                  <td className="border border-black py-1 px-2 text-center font-mono">{g.kkm}</td>
                  <td className="border border-black py-1 px-2 text-center font-mono">{g.tugas}</td>
                  <td className="border border-black py-1 px-2 text-center font-mono">{g.uts}</td>
                  <td className="border border-black py-1 px-2 text-center font-mono font-bold">{g.akhir}</td>
                  <td className="border border-black py-1 px-2 text-center font-bold">{g.predikat}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="p-3 border border-black text-xs">
            <span className="font-bold">Rekapitulasi Kehadiran: </span>
            <span>Hadir: {activeChild.attendance.hadir} hari, </span>
            <span>Sakit: {activeChild.attendance.sakit} hari, </span>
            <span>Izin: {activeChild.attendance.izin} hari, </span>
            <span>Alpa: {activeChild.attendance.alpa} hari.</span>
          </div>
        </div>
      </PrintModal>
    </div>
  );
};
