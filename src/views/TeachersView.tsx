import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { Teacher, TeacherEmploymentStatus } from '../types';
import {
  UserSquare2,
  Plus,
  Search,
  CheckCircle2,
  Phone,
  Mail,
  GraduationCap,
  Briefcase,
  Filter,
  Edit2,
  Trash2,
  Check,
  Building,
  UserCheck,
} from 'lucide-react';

export const TeachersView: React.FC = () => {
  const { currentUser } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>(() => DataService.getTeachers());
  const classes = DataService.getClasses();
  const allExistingSubjects = DataService.getSubjects();

  // List of subject options that can be assigned, with ability to add custom new ones
  const [subjectOptions, setSubjectOptions] = useState<string[]>(() => {
    const list = Array.from(
      new Set([
        ...allExistingSubjects.map((s) => s.name),
        'Matematika Wajib',
        'Matematika Peminatan',
        'Fisika',
        'Kimia',
        'Biologi',
        'Bahasa Indonesia',
        'Bahasa Inggris',
        'Informatika',
        'Sejarah Indonesia',
        'Pendidikan Agama & Budi Pekerti',
        'Pendidikan Pancasila (PPKn)',
        'Seni Budaya',
        'PJOK',
        'Ekonomi',
        'Geografi',
        'Sosiologi',
        'Bimbingan & Konseling (BK)',
      ])
    );
    return list;
  });
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [showAddCustomSubject, setShowAddCustomSubject] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState<Partial<Teacher>>({
    name: '',
    nip: '',
    email: '',
    phone: '',
    subjectNames: ['Matematika Wajib'],
    isHomeroom: false,
    employmentStatus: 'PNS',
    status: 'aktif',
    position: 'Guru Mata Pelajaran',
    assignedClassIds: [],
  });

  const canManageTeachers = ['super_admin', 'wakasek_kurikulum', 'operator'].includes(currentUser.role);

  const filteredTeachers = teachers.filter((t) => {
    // Requirement 13: Wali Kelas hanya bisa mengakses data Tenaga Pendidik yang mengajar di kelas binaannya.
    if (currentUser.role === 'wali_kelas') {
      const myClassId = currentUser.classId;
      if (myClassId) {
        const schedules = DataService.getSchedule();
        const scheduledTeacherIds = new Set(
          schedules.filter((s) => s.classId === myClassId).map((s) => s.teacherId)
        );
        const teachesInMyClass =
          (t.assignedClassIds && t.assignedClassIds.includes(myClassId)) ||
          scheduledTeacherIds.has(t.id) ||
          t.id === currentUser.id ||
          (t.isHomeroom && t.homeroomClassName?.includes('X MIPA 1') && myClassId === 'cls-xmipa1');

        if (!teachesInMyClass) return false;
      }
    }

    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.nip.includes(searchQuery) ||
      t.subjectNames.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.position && t.position.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilter === 'all' || (t.employmentStatus && t.employmentStatus === statusFilter);
    return matchesSearch && matchesStatus;
  });

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFormData({
      id: 'tch-' + Date.now(),
      name: '',
      nip: '',
      email: '',
      phone: '',
      subjectNames: ['Bahasa Indonesia'],
      isHomeroom: false,
      employmentStatus: 'PNS',
      status: 'aktif',
      position: 'Guru Mata Pelajaran',
      assignedClassIds: [],
    });
    setCustomSubjectInput('');
    setShowAddCustomSubject(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tch: Teacher) => {
    setEditingTeacher(tch);
    setFormData({
      ...tch,
      subjectNames: tch.subjectNames || ['Umum'],
      assignedClassIds: tch.assignedClassIds || [],
      position: tch.position || 'Guru Mata Pelajaran',
    });
    setCustomSubjectInput('');
    setShowAddCustomSubject(false);
    setIsModalOpen(true);
  };

  const handleDeleteTeacher = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data pendidik "${name}"?`)) {
      DataService.deleteTeacher(id, {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      });
      setTeachers(DataService.getTeachers());
    }
  };

  const handleToggleAssignedClass = (classId: string) => {
    const current = formData.assignedClassIds || [];
    if (current.includes(classId)) {
      setFormData({ ...formData, assignedClassIds: current.filter((c) => c !== classId) });
    } else {
      setFormData({ ...formData, assignedClassIds: [...current, classId] });
    }
  };

  const handleToggleSubject = (subjectName: string) => {
    const current = formData.subjectNames || [];
    if (current.includes(subjectName)) {
      setFormData({ ...formData, subjectNames: current.filter((s) => s !== subjectName) });
    } else {
      setFormData({ ...formData, subjectNames: [...current, subjectName] });
    }
  };

  const handleAddCustomSubject = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customSubjectInput.trim();
    if (!trimmed) return;

    if (!subjectOptions.includes(trimmed)) {
      setSubjectOptions((prev) => [...prev, trimmed]);
    }
    const current = formData.subjectNames || [];
    if (!current.includes(trimmed)) {
      setFormData({ ...formData, subjectNames: [...current, trimmed] });
    }
    setCustomSubjectInput('');
    setShowAddCustomSubject(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.nip) return;

    const payload: Teacher = {
      ...(formData as Teacher),
      id: editingTeacher ? editingTeacher.id : formData.id || 'tch-' + Date.now(),
      status: formData.status || 'aktif',
      employmentStatus: (formData.employmentStatus as TeacherEmploymentStatus) || 'PNS',
      subjectNames: formData.subjectNames && formData.subjectNames.length > 0 ? formData.subjectNames : ['Umum'],
      position: formData.position || 'Guru Mata Pelajaran',
      assignedClassIds: formData.assignedClassIds || [],
    };

    DataService.saveTeacher(payload, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });

    // Ensure user login account is created with clean full name username & default password 123456
    const users = DataService.getUsers();
    const cleanU = payload.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const userExists = users.some(
      (u) =>
        u.username.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanU ||
        (u.nipOrNisn && u.nipOrNisn.replace(/\s+/g, '') === payload.nip.replace(/\s+/g, ''))
    );
    if (!userExists) {
      DataService.saveUser(
        {
          id: `usr-${payload.id}`,
          name: payload.name,
          email: payload.email || `${cleanU}@smanusantara.sch.id`,
          username: cleanU,
          password: '123456',
          role: 'guru',
          nipOrNisn: payload.nip,
          phone: payload.phone,
          status: 'aktif',
          position: payload.position,
        },
        { id: currentUser.id, name: currentUser.name, role: currentUser.role }
      );
    }

    setTeachers(DataService.getTeachers());
    setIsModalOpen(false);
  };

  const getStatusBadgeColor = (status?: string) => {
    switch (status) {
      case 'PNS':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'PPPK':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Guru Tetap Yayasan (GTY)':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Honorer / Guru Tidak Tetap (GTT)':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'PPPK Paruh Waktu':
        return 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border-teal-200 dark:border-teal-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Tenaga Pendidik & Kependidikan (PTK)
          </h2>
          <p className="text-xs text-slate-500">
            Daftar guru pengampu mata pelajaran, jabatan, alokasi rombel binaan, dan status kepegawaian resmi.
          </p>
        </div>

        {canManageTeachers && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Data Guru</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari guru berdasarkan nama, NIP, jabatan, atau mata pelajaran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-transparent text-slate-900 dark:text-white focus:outline-hidden"
          />
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-500 whitespace-nowrap">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-transparent text-slate-900 dark:text-white font-medium cursor-pointer focus:outline-hidden"
          >
            <option value="all">Semua Status Kepegawaian</option>
            <option value="PNS">PNS (Pegawai Negeri Sipil)</option>
            <option value="PPPK">PPPK</option>
            <option value="Guru Tetap Yayasan (GTY)">GTY (Guru Tetap Yayasan)</option>
            <option value="Honorer / Guru Tidak Tetap (GTT)">Honorer / GTT</option>
            <option value="PPPK Paruh Waktu">PPPK Paruh Waktu</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeachers.map((tch) => {
          const assignedNames = (tch.assignedClassIds || [])
            .map((cid) => classes.find((c) => c.id === cid)?.name)
            .filter(Boolean);

          return (
            <div
              key={tch.id}
              className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-slate-500 truncate">
                  NIP: {tch.nip}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    {tch.status.toUpperCase()}
                  </span>
                  {canManageTeachers && (
                    <div className="flex items-center gap-1 ml-1 border-l border-slate-200 dark:border-slate-700 pl-2">
                      <button
                        onClick={() => handleOpenEdit(tch)}
                        className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Ubah Data Guru"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTeacher(tch.id, tch.name)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Hapus Data Guru"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {tch.name}
                </h3>
                {tch.position && (
                  <p className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                    Jabatan: {tch.position}
                  </p>
                )}
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                  Mapel: {tch.subjectNames.join(', ')}
                </p>
              </div>

              {/* Rombel yang Diampuh Badge List */}
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-[11px]">
                <span className="text-slate-500 block mb-1 font-semibold flex items-center gap-1">
                  <Building className="w-3 h-3 text-indigo-500" />
                  Rombel yang Diampu ({assignedNames.length || 'Semua'}):
                </span>
                {assignedNames.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {assignedNames.map((cName, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 rounded bg-indigo-100/70 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-semibold text-[10px]"
                      >
                        {cName}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400 italic text-[10px]">
                    Fleksibel / Mengampu seluruh rombel tingkat
                  </span>
                )}
              </div>

              {/* Status Kepegawaian Badge */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${getStatusBadgeColor(
                    tch.employmentStatus
                  )}`}
                >
                  <Briefcase className="w-3 h-3" />
                  {tch.employmentStatus || 'PNS'}
                </span>

                {tch.isHomeroom && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Wali {tch.homeroomClassName || 'Kelas'}
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{tch.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{tch.phone}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add/Edit Teacher with Full Scrolling (Requirement 3) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 py-4 sm:py-8 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] my-auto overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header - Fixed at Top */}
            <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {editingTeacher ? 'Ubah Data Tenaga Pendidik' : 'Tambah Tenaga Pendidik (Guru)'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Formulir lengkap dapat digulir dari atas ke bawah untuk mengisi semua data.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Tutup Form"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Scrollable Form Body - From Top to Bottom */}
              <div 
                className="flex-1 overflow-y-auto p-6 space-y-4 text-xs overscroll-contain"
                style={{ maxHeight: 'calc(90vh - 130px)' }}
              >
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 text-[11px]">
                  <span>📜 Gulir ke bawah untuk melengkapi data NIP, Mata Pelajaran, Rombel, Email, dan No. WA.</span>
                </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Nama Lengkap beserta Gelar
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dra. Siti Aminah, M.Pd."
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Jabatan Tenaga Pendidik
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Guru Mata Pelajaran / Wakasek Kurikulum / Kepala Lab"
                  value={formData.position || ''}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  NIP / NUPTK (18 Digit)
                </label>
                <input
                  type="text"
                  required
                  placeholder="19850620 200902 2 005"
                  value={formData.nip || ''}
                  onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Status Kepegawaian Guru
                </label>
                <select
                  required
                  value={formData.employmentStatus || 'PNS'}
                  onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer font-semibold"
                >
                  <option value="PNS">PNS (Pegawai Negeri Sipil)</option>
                  <option value="PPPK">PPPK (Pegawai Pemerintah dengan Perjanjian Kerja)</option>
                  <option value="Guru Tetap Yayasan (GTY)">Guru Tetap Yayasan (GTY)</option>
                  <option value="Honorer / Guru Tidak Tetap (GTT)">Honorer / Guru Tidak Tetap (GTT)</option>
                  <option value="PPPK Paruh Waktu">PPPK Paruh Waktu / Guru Bantu</option>
                </select>
              </div>

              {/* Pilihan Mata Pelajaran yang Diajar oleh Guru Ini (Bisa Ditambah Jika Belum Ada) */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold">
                    Mata Pelajaran yang Diajar Guru Ini:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomSubject(!showAddCustomSubject)}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showAddCustomSubject ? 'Tutup Form' : '+ Tambah Mapel Baru'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500">
                  Pilih satu atau lebih mata pelajaran yang diampu. Guru dapat mengampu lebih dari satu mapel atau mapel baru:
                </p>

                {/* Form Tambah Mapel Baru Jika Belum Ada */}
                {showAddCustomSubject && (
                  <div className="p-2.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Ketik nama mata pelajaran baru..."
                      value={customSubjectInput}
                      onChange={(e) => setCustomSubjectInput(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomSubject();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddCustomSubject()}
                      className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs cursor-pointer shadow-xs shrink-0"
                    >
                      Tambahkan
                    </button>
                  </div>
                )}

                {/* Grid Pilihan Mata Pelajaran */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 max-h-44 overflow-y-auto pr-1">
                  {subjectOptions.map((subj) => {
                    const isChecked = (formData.subjectNames || []).includes(subj);
                    return (
                      <button
                        type="button"
                        key={subj}
                        onClick={() => handleToggleSubject(subj)}
                        className={`px-2.5 py-1.5 rounded-lg border text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          isChecked
                            ? 'bg-indigo-50 border-indigo-400 text-indigo-900 dark:bg-indigo-950 dark:border-indigo-600 dark:text-indigo-200 font-bold'
                            : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span className="truncate">{subj}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rombel yang Diampu oleh Guru Ini (Membantu Jadwal Anti-Bentrok) */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block text-slate-700 dark:text-slate-300 font-bold">
                  Rombel yang Diampu oleh Guru Ini:
                </label>
                <p className="text-[11px] text-slate-500">
                  Pilih rombongan belajar yang secara spesifik diajar oleh guru ini agar generator jadwal anti-bentrok menempatkannya dengan presisi:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {classes.map((cls) => {
                    const isChecked = (formData.assignedClassIds || []).includes(cls.id);
                    return (
                      <button
                        type="button"
                        key={cls.id}
                        onClick={() => handleToggleAssignedClass(cls.id)}
                        className={`px-2.5 py-1.5 rounded-lg border text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          isChecked
                            ? 'bg-indigo-50 border-indigo-400 text-indigo-900 dark:bg-indigo-950 dark:border-indigo-600 dark:text-indigo-200 font-bold'
                            : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span>{cls.name}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Email Resmi
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    No. Handphone / WA
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer - Fixed at Bottom */}
            <div className="sticky bottom-0 z-20 flex items-center justify-between px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-xs shrink-0">
              <span className="text-[11px] text-slate-400">
                Semua isian bertanda wajib diisi
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 font-medium cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-xs transition-colors"
                >
                  {editingTeacher ? 'Simpan Perubahan' : 'Simpan Data Guru'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    )}
    </div>
  );
};
