import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { LearningModule, LearningMaterial, Subject } from '../types';
import {
  BookOpen,
  Plus,
  FileText,
  Video,
  ExternalLink,
  CheckCircle2,
  Clock,
  Layers,
  Filter,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Link as LinkIcon,
} from 'lucide-react';

export const LearningModulesView: React.FC = () => {
  const { currentUser } = useAuth();
  const [modules, setModules] = useState<LearningModule[]>(() => DataService.getModules());
  const classes = DataService.getClasses();
  const allSubjects = DataService.getSubjects();

  // Filter subjects accessible to teacher
  const teacherSubjects = currentUser.role === 'guru'
    ? allSubjects.filter(
        (s) =>
          s.teacherId === currentUser.id ||
          currentUser.assignedSubjectIds?.includes(s.id)
      )
    : allSubjects;

  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<LearningModule>>({
    title: '',
    description: '',
    classId: classes[0]?.id || 'cls-xmipa1',
    className: classes[0]?.name || 'X MIPA 1',
    subjectId: teacherSubjects[0]?.id || 'sub-mat-10',
    subjectName: teacherSubjects[0]?.name || 'Matematika Wajib',
    learningObjectives: ['Memahami konsep dasar materi.', 'Menerapkan rumus dalam pemecahan masalah.'],
    published: true,
  });

  // Strict RBAC filtering:
  // - Siswa: STRICTLY only see modules of their registered class!
  // - Wali kelas: only view modules of their homeroom class (read-only)
  // - Guru: can view & filter, but can only manage modules of subjects they teach
  const filteredModules = modules.filter((m) => {
    if (currentUser.role === 'siswa') {
      if (m.classId !== currentUser.classId) return false;
    }
    if (currentUser.role === 'wali_kelas') {
      if (currentUser.classId && m.classId !== currentUser.classId) return false;
    }
    const matchesClass = selectedClass === 'all' || m.classId === selectedClass;
    const matchesSubject = selectedSubject === 'all' || m.subjectId === selectedSubject;
    return matchesClass && matchesSubject;
  });

  const canManageModules = currentUser.role === 'guru';
  const [editingModule, setEditingModule] = useState<LearningModule | null>(null);

  const handleOpenAdd = () => {
    setEditingModule(null);
    setFormData({
      id: 'mod-' + Date.now(),
      title: '',
      description: '',
      classId: classes[0]?.id || 'cls-xmipa1',
      className: classes[0]?.name || 'X MIPA 1',
      subjectId: teacherSubjects[0]?.id || 'sub-mat-10',
      subjectName: teacherSubjects[0]?.name || 'Matematika Wajib',
      learningObjectives: ['Memahami konsep dasar materi.', 'Menerapkan penyelesaian soal kontekstual.'],
      materials: [
        {
          id: 'mat-' + Date.now(),
          title: 'Diktat Pembelajaran & Ringkasan Materi PDF',
          type: 'document',
          description: 'Materi ajar terstruktur kurikulum merdeka.',
          durationOrPages: '15 Halaman',
        },
      ],
      published: true,
      order: modules.length + 1,
      updatedAt: new Date().toISOString().substring(0, 10),
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (mod: LearningModule) => {
    setEditingModule(mod);
    setFormData({ ...mod });
    setIsModalOpen(true);
  };

  const handleAddMaterial = () => {
    const currentMaterials = formData.materials || [];
    const newMat: LearningMaterial = {
      id: 'mat-' + Date.now(),
      title: 'Bahan Ajar & Modul Kurikulum Merdeka',
      type: 'document',
      fileUrl: 'https://drive.google.com/',
      description: 'Dokumen modul ajar dan referensi materi.',
      durationOrPages: '10 Halaman',
    };
    setFormData({
      ...formData,
      materials: [...currentMaterials, newMat],
    });
  };

  const handleRemoveMaterial = (matId: string) => {
    const currentMaterials = formData.materials || [];
    setFormData({
      ...formData,
      materials: currentMaterials.filter((m) => m.id !== matId),
    });
  };

  const handleUpdateMaterial = (matId: string, field: keyof LearningMaterial, value: string) => {
    const currentMaterials = formData.materials || [];
    setFormData({
      ...formData,
      materials: currentMaterials.map((m) =>
        m.id === matId ? { ...m, [field]: value } : m
      ),
    });
  };

  const handleDeleteModule = (id: string, title: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus modul pembelajaran "${title}"?`)) {
      DataService.deleteModule(id, {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      });
      setModules(DataService.getModules());
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;

    const targetClass = classes.find((c) => c.id === formData.classId);
    const targetSubject = allSubjects.find((s) => s.id === formData.subjectId);

    const payload: LearningModule = {
      ...(formData as LearningModule),
      id: editingModule ? editingModule.id : formData.id || 'mod-' + Date.now(),
      className: targetClass?.name || 'X MIPA 1',
      subjectName: targetSubject?.name || 'Matematika Wajib',
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      materials: formData.materials || [],
      learningObjectives: formData.learningObjectives || ['Tercapainya kompetensi dasar'],
      order: formData.order || 1,
      updatedAt: new Date().toISOString().substring(0, 10),
    };

    DataService.saveModule(payload, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });

    setModules(DataService.getModules());
    setIsModalOpen(false);
  };

  const handleTogglePublish = (mod: LearningModule) => {
    if (!canManageModules) return;
    const updated = { ...mod, published: !mod.published };
    DataService.saveModule(updated, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });
    setModules(DataService.getModules());
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Modul Pembelajaran & Bahan Ajar
          </h2>
          <p className="text-xs text-slate-500">
            Kumpulan bahan ajar digital, tujuan capaian pembelajaran, diktat PDF, video referensi, dan aktivitas mandiri.
          </p>
        </div>

        {canManageModules && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Modul Ajar</span>
          </button>
        )}
      </div>

      {currentUser.role === 'super_admin' && (
        <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200 text-xs rounded-lg flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-600 shrink-0" />
          <span>
            Mode Pantau Super Admin (Read-Only): Anda dapat memantau seluruh modul pembelajaran di semua kelas. Pembuatan dan pengelolaan modul materi ajar dikelola secara mandiri oleh Guru Mata Pelajaran pengampu.
          </span>
        </div>
      )}

      {currentUser.role === 'wali_kelas' && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs rounded-lg flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Mode Pemantauan Wali Kelas (Hanya Baca): Anda memantau modul pembelajaran untuk kelas binaan Anda. Penambahan dan pengelolaan modul dikelola langsung oleh Guru Mata Pelajaran pengampu.
          </span>
        </div>
      )}

      {currentUser.role === 'siswa' && (
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200 text-xs rounded-lg flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            Menampilkan modul pembelajaran resmi khusus untuk kelas Anda. Akses materi teks, unduh rangkuman PDF, dan pelajari materi sesuai jadwal pembelajaran.
          </span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-600 dark:text-slate-400">Filter:</span>
        </div>

        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
        >
          <option value="all">Semua Kelas</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
        >
          <option value="all">Semua Mata Pelajaran</option>
          {allSubjects.map((sub: Subject) => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
            </option>
          ))}
        </select>
      </div>

      {/* Module List */}
      <div className="space-y-4">
        {filteredModules.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            Belum ada modul pembelajaran untuk kelas / mata pelajaran ini.
          </div>
        ) : (
          filteredModules.map((mod) => (
            <div
              key={mod.id}
              className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-xs">
                      {mod.subjectName}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                      {mod.className}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-400 text-[11px] font-mono">
                      Diperbarui: {mod.updatedAt}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {mod.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {currentUser.role === 'guru' && (
                    <>
                      <button
                        onClick={() => handleTogglePublish(mod)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                          mod.published
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {mod.published ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Diterbitkan</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Draf / Privat</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleOpenEdit(mod)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                        title="Edit Modul Pembelajaran"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeleteModule(mod.id, mod.title)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 cursor-pointer transition-colors"
                        title="Hapus Modul Pembelajaran"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Hapus</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {mod.description}
              </p>

              {/* Capaian Pembelajaran */}
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                  Tujuan & Capaian Pembelajaran:
                </p>
                <ul className="space-y-1 list-disc list-inside text-slate-600 dark:text-slate-300">
                  {mod.learningObjectives.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </div>

              {/* Materi dan Media */}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center justify-between">
                  <span>Bahan Ajar & Dokumen Referensi ({mod.materials.length})</span>
                  {canManageModules && (
                    <button
                      onClick={() => handleOpenEdit(mod)}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-semibold cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Tambah Bahan Ajar
                    </button>
                  )}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {mod.materials.map((mat) => (
                    <div
                      key={mat.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-500 bg-white dark:bg-slate-900 transition-colors flex items-start gap-2.5 text-xs group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 flex items-center justify-center text-indigo-600 shrink-0">
                        {mat.type === 'video' ? (
                          <Video className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 transition-colors">
                          {mat.title}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {mat.description}
                        </p>
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-mono">
                          <span>{mat.durationOrPages}</span>
                          {mat.fileUrl ? (
                            <a
                              href={mat.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 font-semibold hover:underline flex items-center gap-0.5"
                            >
                              Buka Link <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-400">Tersedia di Kelas</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800">
                <span>Penyusun: <strong>{mod.teacherName}</strong></span>
                <span className="font-mono">Status: {mod.published ? 'Dapat diakses peserta didik' : 'Hanya Guru'}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Tambah / Edit Modul & Bahan Ajar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              {editingModule ? 'Edit Modul & Bahan Ajar Pembelajaran' : 'Buat Modul & Bahan Ajar Baru'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Judul Modul / Bab
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bab 2: Kinematika Gerak Lurus"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Kelas
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
                    {teacherSubjects.map((sub: Subject) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Deskripsi / Pengantar Modul
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ringkasan konsep pokok yang akan dipelajari..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                ></textarea>
              </div>

              {/* Form Bahan Ajar & Dokumen Referensi (Upload Link Modul Ajar) */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Form Bahan Ajar & Dokumen Referensi (Upload Link Modul Ajar)</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Tautkan link Google Drive, Canva, PDF, atau dokumen bahan ajar untuk dipelajari peserta didik.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddMaterial}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-semibold text-xs border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Link Materi</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {(formData.materials || []).map((mat, idx) => (
                    <div
                      key={mat.id || idx}
                      className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wide">
                          Dokumen #{idx + 1}
                        </span>
                        {(formData.materials || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMaterial(mat.id)}
                            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                            title="Hapus Bahan Ajar Ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-slate-500 mb-0.5">Judul Bahan Ajar</label>
                          <input
                            type="text"
                            required
                            placeholder="Contoh: Modul Ajar Kurikulum Merdeka Pertemuan 1"
                            value={mat.title}
                            onChange={(e) => handleUpdateMaterial(mat.id, 'title', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-500 mb-0.5">Tipe Materi</label>
                          <select
                            value={mat.type}
                            onChange={(e) => handleUpdateMaterial(mat.id, 'type', e.target.value as any)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                          >
                            <option value="document">Dokumen PDF / Modul Ajar</option>
                            <option value="slide">Slide Presentasi (PPT/Canva)</option>
                            <option value="video">Video Pembelajaran</option>
                            <option value="article">Artikel / Laman Referensi</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] text-slate-500 mb-0.5 flex items-center justify-between">
                            <span>Upload / Tautan Link Berkas (Google Drive / Modul Ajar)</span>
                          </label>
                          <div className="relative">
                            <input
                              type="url"
                              placeholder="https://drive.google.com/file/d/... atau tautan file modul"
                              value={mat.fileUrl || ''}
                              onChange={(e) => handleUpdateMaterial(mat.id, 'fileUrl', e.target.value)}
                              className="w-full px-2.5 py-1.5 pl-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
                            />
                            <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-500 mb-0.5">Halaman / Durasi</label>
                          <input
                            type="text"
                            placeholder="Contoh: 15 Halaman"
                            value={mat.durationOrPages || ''}
                            onChange={(e) => handleUpdateMaterial(mat.id, 'durationOrPages', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-500 mb-0.5">Deskripsi Singkat Bahan Ajar</label>
                        <input
                          type="text"
                          placeholder="Catatan petunjuk isi materi untuk siswa..."
                          value={mat.description}
                          onChange={(e) => handleUpdateMaterial(mat.id, 'description', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-[11px]"
                        />
                      </div>
                    </div>
                  ))}
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
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer"
                >
                  Simpan & Terbitkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
