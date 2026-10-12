import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { ClassRoom } from '../types';
import { School, Plus, Users, Award, Edit2, Trash2 } from 'lucide-react';

export const ClassesView: React.FC = () => {
  const { currentUser } = useAuth();
  const [classes, setClasses] = useState<ClassRoom[]>(() => DataService.getClasses());
  const teachers = DataService.getTeachers();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [formData, setFormData] = useState<Partial<ClassRoom>>({
    name: '',
    grade: 'X',
    major: 'MIPA',
    academicYear: '2024/2025',
    capacity: 36,
  });

  const canManageClasses = ['super_admin', 'wakasek_kurikulum', 'operator'].includes(currentUser.role);

  const handleOpenAdd = () => {
    setEditingClass(null);
    setFormData({
      id: 'cls-' + Date.now(),
      name: '',
      grade: 'X',
      major: 'MIPA',
      academicYear: '2024/2025',
      homeroomTeacherId: teachers[0]?.id || '',
      capacity: 36,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cls: ClassRoom) => {
    setEditingClass(cls);
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

    const teacher = teachers.find((t) => t.id === formData.homeroomTeacherId);

    const payload: ClassRoom = {
      id: editingClass ? editingClass.id : formData.id || 'cls-' + Date.now(),
      name: formData.name,
      grade: formData.grade || 'X',
      major: formData.major || 'MIPA',
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Rombongan Belajar & Kelas
          </h2>
          <p className="text-xs text-slate-500">
            Daftar struktur kelas, kapasitas ruang, alokasi wali kelas, dan pembagian jurusan (MIPA, IPS, Bahasa, TKJ, RPL, Akuntansi, Merdeka/Umum).
          </p>
        </div>

        {canManageClasses && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Rombel Baru</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((cls) => (
          <div
            key={cls.id}
            className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                Jenjang {cls.grade} · Jurusan {cls.major}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-slate-400">
                  {cls.academicYear}
                </span>
                {canManageClasses && (
                  <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-2">
                    <button
                      onClick={() => handleOpenEdit(cls)}
                      className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Ubah Rombel"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClass(cls.id, cls.name)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Hapus Rombel"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {cls.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Wali Kelas: <strong>{cls.homeroomTeacherName}</strong>
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Terisi: <strong>{cls.studentCount}</strong> / {cls.capacity} Siswa
              </span>
              <span className="font-semibold text-emerald-600 text-[11px]">
                Aktif
              </span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              {editingClass ? 'Ubah Rombongan Belajar (Rombel)' : 'Tambah Rombongan Belajar (Rombel)'}
            </h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Nama Kelas
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: XI MIPA 2 / X TKJ 1"
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
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Peminatan / Jurusan
                  </label>
                  <select
                    value={formData.major || 'MIPA'}
                    onChange={(e) => setFormData({ ...formData, major: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="MIPA">MIPA (Matematika & IPA)</option>
                    <option value="IPS">IPS (Ilmu Pengetahuan Sosial)</option>
                    <option value="Bahasa">Bahasa & Budaya</option>
                    <option value="TKJ">Teknik Komputer & Jaringan (TKJ)</option>
                    <option value="RPL">Rekayasa Perangkat Lunak (RPL)</option>
                    <option value="Akuntansi">Akuntansi & Keuangan</option>
                    <option value="Merdeka/Umum">Kurikulum Merdeka / Umum</option>
                  </select>
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
                      {t.name}
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
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer"
                >
                  {editingClass ? 'Simpan Perubahan' : 'Simpan Rombel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
