import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { ClassRoom } from '../types';
import { School, Plus, Users, Award, Edit2, Trash2, Tag, Check } from 'lucide-react';

const DEFAULT_MAJORS = [
  'MIPA',
  'IPS',
  'Bahasa',
  'TKJ',
  'RPL',
  'Akuntansi',
  'Merdeka/Umum',
];

export const ClassesView: React.FC = () => {
  const { currentUser } = useAuth();
  const [classes, setClasses] = useState<ClassRoom[]>(() => DataService.getClasses());
  const teachers = DataService.getTeachers();

  // Persistent custom majors
  const [availableMajors, setAvailableMajors] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('schoolsphere_custom_majors');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.from(new Set([...DEFAULT_MAJORS, ...parsed]));
      }
    } catch (e) {
      // fallback
    }
    return DEFAULT_MAJORS;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [formData, setFormData] = useState<Partial<ClassRoom>>({
    name: '',
    grade: 'X',
    major: 'MIPA',
    academicYear: '2024/2025',
    capacity: 36,
  });

  // Custom major input in modal
  const [isCustomMajorMode, setIsCustomMajorMode] = useState(false);
  const [customMajorInput, setCustomMajorInput] = useState('');

  // Quick add major modal
  const [quickMajorModalOpen, setQuickMajorModalOpen] = useState(false);
  const [newQuickMajor, setNewQuickMajor] = useState('');

  const canManageClasses = ['super_admin', 'wakasek_kurikulum', 'operator'].includes(currentUser.role);

  const saveMajorsList = (newList: string[]) => {
    setAvailableMajors(newList);
    try {
      localStorage.setItem('schoolsphere_custom_majors', JSON.stringify(newList));
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAdd = () => {
    setEditingClass(null);
    setIsCustomMajorMode(false);
    setCustomMajorInput('');
    setFormData({
      id: 'cls-' + Date.now(),
      name: '',
      grade: 'X',
      major: availableMajors[0] || 'MIPA',
      academicYear: '2024/2025',
      homeroomTeacherId: teachers[0]?.id || '',
      capacity: 36,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cls: ClassRoom) => {
    setEditingClass(cls);
    const isCustom = !availableMajors.includes(cls.major);
    if (isCustom && cls.major) {
      saveMajorsList([...availableMajors, cls.major]);
    }
    setIsCustomMajorMode(false);
    setCustomMajorInput('');
    setFormData({ ...cls });
    setIsModalOpen(true);
  };

  const handleDeleteClass = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus rombongan belajar "${name}"?`)) {
      DataService.deleteClass(id, {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      });
      setClasses(DataService.getClasses());
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    let finalMajor = formData.major || 'MIPA';
    if (isCustomMajorMode && customMajorInput.trim()) {
      finalMajor = customMajorInput.trim();
      if (!availableMajors.includes(finalMajor)) {
        saveMajorsList([...availableMajors, finalMajor]);
      }
    }

    const teacher = teachers.find((t) => t.id === formData.homeroomTeacherId);

    const payload: ClassRoom = {
      id: editingClass ? editingClass.id : formData.id || 'cls-' + Date.now(),
      name: formData.name,
      grade: formData.grade || 'X',
      major: finalMajor,
      academicYear: formData.academicYear || '2024/2025',
      homeroomTeacherId: formData.homeroomTeacherId || teachers[0]?.id,
      homeroomTeacherName: teacher ? teacher.name : 'Belum Ditentukan',
      studentCount: editingClass ? editingClass.studentCount : 32,
      capacity: formData.capacity || 36,
    };

    DataService.saveClass(payload, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });

    setClasses(DataService.getClasses());
    setIsModalOpen(false);
  };

  const handleAddQuickMajor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuickMajor.trim()) return;
    const trimmed = newQuickMajor.trim();
    if (!availableMajors.includes(trimmed)) {
      saveMajorsList([...availableMajors, trimmed]);
    }
    setNewQuickMajor('');
    setQuickMajorModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Rombongan Belajar & Kelas
          </h2>
          <p className="text-xs text-slate-500">
            Daftar struktur kelas, kapasitas ruang, alokasi wali kelas, dan pembagian peminatan/jurusan kustom fleksibel.
          </p>
        </div>

        {canManageClasses && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuickMajorModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Kelola & Tambah Jurusan / Peminatan Kustom"
            >
              <Tag className="w-3.5 h-3.5 text-indigo-600" />
              <span>Kelola Jurusan ({availableMajors.length})</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Rombel</span>
            </button>
          </div>
        )}
      </div>

      {/* Available Majors Bar */}
      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="font-semibold text-slate-500 shrink-0 flex items-center gap-1">
          <Tag className="w-3.5 h-3.5 text-indigo-600" />
          Peminatan / Jurusan Terdaftar:
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {availableMajors.map((mj) => (
            <span
              key={mj}
              className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px] border border-slate-200 dark:border-slate-700"
            >
              {mj}
            </span>
          ))}
          {canManageClasses && (
            <button
              onClick={() => setQuickMajorModalOpen(true)}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline ml-1 cursor-pointer"
            >
              + Tambah Kustom
            </button>
          )}
        </div>
      </div>

      {/* Class Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((cls) => (
          <div
            key={cls.id}
            className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-4 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  Tingkat {cls.grade} · {cls.major}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {cls.academicYear}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                  <School className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {cls.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Jurusan: <strong className="text-indigo-600 dark:text-indigo-400">{cls.major}</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500 shrink-0" />
                  Wali Kelas:
                </span>
                <span className="font-bold text-slate-900 dark:text-white truncate max-w-[160px]">
                  {cls.homeroomTeacherName}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-500 shrink-0" />
                  Roster Peserta Didik:
                </span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {cls.studentCount} / {cls.capacity} Siswa
                </span>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (cls.studentCount / cls.capacity) * 100)}%` }}
                ></div>
              </div>

              {canManageClasses && (
                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <button
                    onClick={() => handleOpenEdit(cls)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Ubah</span>
                  </button>
                  <button
                    onClick={() => handleDeleteClass(cls.id, cls.name)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Hapus</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add / Edit Class */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              {editingClass ? 'Ubah Rombongan Belajar' : 'Tambah Rombongan Belajar Baru'}
            </h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Nama Rombel / Kelas
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: X MIPA 1, XI IPS 2, XII TKJ 1"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Tingkat
                  </label>
                  <select
                    value={formData.grade || 'X'}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="X">Kelas X</option>
                    <option value="XI">Kelas XI</option>
                    <option value="XII">Kelas XII</option>
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-600 dark:text-slate-400 font-medium">
                      Peminatan / Jurusan
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomMajorMode(!isCustomMajorMode)}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      {isCustomMajorMode ? 'Pilih dari List' : '+ Tulis Kustom'}
                    </button>
                  </div>

                  {!isCustomMajorMode ? (
                    <select
                      value={formData.major || availableMajors[0]}
                      onChange={(e) => {
                        if (e.target.value === '__add_custom__') {
                          setIsCustomMajorMode(true);
                        } else {
                          setFormData({ ...formData, major: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer font-semibold"
                    >
                      {availableMajors.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                      <option value="__add_custom__">+ Tulis Jurusan Kustom Baru...</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="Tulis Jurusan Baru (mis: DKV, Multimedia)"
                      value={customMajorInput}
                      onChange={(e) => setCustomMajorInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/40 text-slate-900 dark:text-white font-semibold"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Wali Kelas
                </label>
                <select
                  value={formData.homeroomTeacherId || ''}
                  onChange={(e) => setFormData({ ...formData, homeroomTeacherId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.position || 'Guru'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Kapasitas Siswa
                </label>
                <input
                  type="number"
                  min="10"
                  max="50"
                  value={formData.capacity || 36}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
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
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-xs"
                >
                  {editingClass ? 'Simpan Perubahan' : 'Buat Rombel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Quick Add Custom Major */}
      {quickMajorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-600" />
                Tambah Peminatan / Jurusan Kustom
              </h3>
              <button onClick={() => setQuickMajorModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-slate-500 text-[11px]">
              Tambahkan nama jurusan baru untuk keperluan kurikulum SMK / SMA / Madrasah jika tidak tersedia pada opsi standar (misalnya: DKV, Tata Boga, Multimedia, Teknik Mesin, Keagamaan, dsb).
            </p>

            <form onSubmit={handleAddQuickMajor} className="space-y-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Nama Jurusan / Peminatan Baru
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Desain Komunikasi Visual (DKV)"
                  value={newQuickMajor}
                  onChange={(e) => setNewQuickMajor(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setQuickMajorModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
                >
                  Simpan Jurusan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
