import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { Subject } from '../types';
import {
  BookMarked,
  Plus,
  Clock,
  Award,
  Sliders,
  CheckCircle2,
  Calculator,
  Edit2,
  Trash2,
  Search,
} from 'lucide-react';

export const SubjectsView: React.FC = () => {
  const { currentUser } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>(() => DataService.getSubjects());
  const teachers = DataService.getTeachers();
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState<Partial<Subject>>({
    code: '',
    name: '',
    kkm: 75,
    grade: 'X',
    hoursPerWeek: 3,
  });

  // KKM Management Modal State
  const [kkmModalOpen, setKkmModalOpen] = useState(false);
  const [selectedSubjectForKkm, setSelectedSubjectForKkm] = useState<Subject | null>(null);
  const [kkmKompleksitas, setKkmKompleksitas] = useState(75);
  const [kkmDayaDukung, setKkmDayaDukung] = useState(80);
  const [kkmIntake, setKkmIntake] = useState(72);
  const [kkmFinalValue, setKkmFinalValue] = useState(75);
  const [kkmSuccessNotice, setKkmSuccessNotice] = useState<string | null>(null);

  const isAdminOrWakasek = ['super_admin', 'wakasek_kurikulum', 'operator'].includes(currentUser.role);

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.teacherName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingSubject(null);
    setFormData({
      id: 'sub-' + Date.now(),
      code: '',
      name: '',
      kkm: 75,
      grade: 'X',
      hoursPerWeek: 3,
      teacherId: teachers[0]?.id || '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sub: Subject) => {
    setEditingSubject(sub);
    setFormData({ ...sub });
    setIsModalOpen(true);
  };

  const handleDeleteSubject = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus mata pelajaran "${name}"?`)) {
      DataService.deleteSubject(id, {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      });
      setSubjects(DataService.getSubjects());
    }
  };

  const handleOpenKkmModal = (subject: Subject) => {
    setSelectedSubjectForKkm(subject);
    setKkmFinalValue(subject.kkm);
    setKkmKompleksitas(subject.kkm);
    setKkmDayaDukung(subject.kkm + 3);
    setKkmIntake(subject.kkm - 3);
    setKkmModalOpen(true);
  };

  const handleRecalculateKkm = (kompleksitas: number, daya: number, intake: number) => {
    const computed = Math.round((kompleksitas + daya + intake) / 3);
    setKkmFinalValue(computed);
  };

  const handleSaveKkm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectForKkm) return;

    DataService.updateSubjectKKM(selectedSubjectForKkm.id, kkmFinalValue, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });

    setSubjects(DataService.getSubjects());
    setKkmSuccessNotice(`KKM untuk ${selectedSubjectForKkm.name} berhasil diperbarui menjadi ${kkmFinalValue}.`);
    setTimeout(() => {
      setKkmModalOpen(false);
      setKkmSuccessNotice(null);
    }, 1500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;

    const teacher = teachers.find((t) => t.id === formData.teacherId);

    const payload: Subject = {
      id: editingSubject ? editingSubject.id : formData.id || 'sub-' + Date.now(),
      code: formData.code,
      name: formData.name,
      kkm: formData.kkm || 75,
      grade: formData.grade || 'X',
      teacherId: formData.teacherId || teachers[0]?.id,
      teacherName: teacher ? teacher.name : 'Belum Ditentukan',
      hoursPerWeek: formData.hoursPerWeek || 3,
    };

    DataService.saveSubject(payload, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });

    setSubjects(DataService.getSubjects());
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Mata Pelajaran & Kriteria Ketuntasan Minimal (KKM)
          </h2>
          <p className="text-xs text-slate-500">
            Daftar kurikulum mata pelajaran, ambang batas ketuntasan (KKM), dan beban jam belajar per minggu.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdminOrWakasek && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Mata Pelajaran</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cari mata pelajaran berdasarkan nama, kode, atau guru pengampu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs bg-transparent text-slate-900 dark:text-white focus:outline-hidden"
        />
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                <th className="py-3 px-4">Kode</th>
                <th className="py-3 px-4">Nama Mata Pelajaran</th>
                <th className="py-3 px-4 text-center">Tingkat</th>
                <th className="py-3 px-4 text-center">Beban / Minggu</th>
                <th className="py-3 px-4 text-center">Ambang KKM</th>
                <th className="py-3 px-4">Koordinator / Guru Pengampu</th>
                <th className="py-3 px-4 text-right">Aksi & Kelola KKM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredSubjects.map((sub) => {
                const isMySubject =
                  currentUser.role === 'guru' &&
                  (sub.teacherId === currentUser.id ||
                    currentUser.assignedSubjectIds?.includes(sub.id));
                const canManageKkm = isAdminOrWakasek || isMySubject;

                return (
                  <tr key={sub.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-600 dark:text-slate-300">
                      {sub.code}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {sub.name}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold">Kelas {sub.grade}</td>
                    <td className="py-3 px-4 text-center font-mono">{sub.hoursPerWeek} Jam Pelajaran</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      <span className="px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800">
                        {sub.kkm}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {sub.teacherName}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canManageKkm && (
                          <button
                            onClick={() => handleOpenKkmModal(sub)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                            title="Atur Bobot KKM"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Atur KKM</span>
                          </button>
                        )}

                        {isAdminOrWakasek && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(sub)}
                              className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Ubah Mata Pelajaran"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubject(sub.id, sub.name)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Hapus Mata Pelajaran"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL KELOLA KKM GURU MATA PELAJARAN */}
      {kkmModalOpen && selectedSubjectForKkm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-600" />
                Kelola Patokan KKM: {selectedSubjectForKkm.name}
              </h3>
              <p className="text-slate-500 mt-0.5">
                Hitung Kriteria Ketuntasan Minimal (KKM) berdasarkan Kompleksitas, Daya Dukung, dan Intake siswa.
              </p>
            </div>

            {kkmSuccessNotice && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{kkmSuccessNotice}</span>
              </div>
            )}

            <form onSubmit={handleSaveKkm} className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg space-y-3">
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <label className="text-slate-700 dark:text-slate-300">
                      1. Kompleksitas Materi Pokok (Tingkat Kesulitan)
                    </label>
                    <span className="font-mono text-indigo-600">{kkmKompleksitas}</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={kkmKompleksitas}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setKkmKompleksitas(val);
                      handleRecalculateKkm(val, kkmDayaDukung, kkmIntake);
                    }}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Sangat Sulit (50)</span>
                    <span>Sedang (75)</span>
                    <span>Mudah (100)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <label className="text-slate-700 dark:text-slate-300">
                      2. Daya Dukung (Sarana & Sumber Belajar)
                    </label>
                    <span className="font-mono text-indigo-600">{kkmDayaDukung}</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={kkmDayaDukung}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setKkmDayaDukung(val);
                      handleRecalculateKkm(kkmKompleksitas, val, kkmIntake);
                    }}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Terbatas (50)</span>
                    <span>Memadai (75)</span>
                    <span>Sangat Lengkap (100)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <label className="text-slate-700 dark:text-slate-300">
                      3. Intake Siswa (Kemampuan Awal Siswa)
                    </label>
                    <span className="font-mono text-indigo-600">{kkmIntake}</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={kkmIntake}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setKkmIntake(val);
                      handleRecalculateKkm(kkmKompleksitas, kkmDayaDukung, val);
                    }}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Rendah (50)</span>
                    <span>Sedang (75)</span>
                    <span>Tinggi (100)</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-600 dark:text-slate-400 block font-medium">
                    Hasil Rata-rata KKM:
                  </span>
                  <span className="text-xs text-slate-500">
                    (Kompleksitas + Daya Dukung + Intake) / 3
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                    {kkmFinalValue}
                  </span>
                  <span className="block text-[10px] text-slate-400">Poin Ketuntasan</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setKkmModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-xs"
                >
                  Simpan KKM Mapel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Subject */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              {editingSubject ? 'Ubah Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}
            </h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Kode Mapel
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: MAT-10"
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Nama Mata Pelajaran
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Matematika Peminatan"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Tingkat Kelas
                  </label>
                  <select
                    value={formData.grade || 'X'}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="X">Kelas X</option>
                    <option value="XI">Kelas XI</option>
                    <option value="XII">Kelas XII</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Jam / Minggu
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.hoursPerWeek || 3}
                    onChange={(e) => setFormData({ ...formData, hoursPerWeek: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Guru Pengampu
                </label>
                <select
                  value={formData.teacherId || ''}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
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
                  Ambang Standar KKM
                </label>
                <input
                  type="number"
                  min={50}
                  max={100}
                  value={formData.kkm || 75}
                  onChange={(e) => setFormData({ ...formData, kkm: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
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
                  {editingSubject ? 'Simpan Perubahan' : 'Simpan Mapel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
