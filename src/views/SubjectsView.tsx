import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { Subject, SubjectLearningObjective } from '../types';
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
  Target,
  FileText,
  ListPlus,
  Sparkles,
  Check,
  X,
  Layers,
} from 'lucide-react';

export const SubjectsView: React.FC = () => {
  const { currentUser } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>(() => DataService.getSubjects());
  const teachers = DataService.getTeachers();
  const classes = DataService.getClasses();
  const [searchQuery, setSearchQuery] = useState('');

  // Tab State: 'subjects' (Mata Pelajaran & KKM) or 'cp_atp' (Capaian Pembelajaran & ATP Kurikulum Merdeka)
  const [activeTab, setActiveTab] = useState<'subjects' | 'cp_atp'>('subjects');

  // CP & ATP State
  const [learningObjectives, setLearningObjectives] = useState<SubjectLearningObjective[]>(() =>
    DataService.getLearningObjectives()
  );
  const [cpSubjectFilter, setCpSubjectFilter] = useState<string>('ALL');
  const [cpGradeFilter, setCpGradeFilter] = useState<string>('ALL');
  const [cpSemesterFilter, setCpSemesterFilter] = useState<string>('ALL');

  // CP & ATP Modal State
  const [isCpModalOpen, setIsCpModalOpen] = useState(false);
  const [editingCp, setEditingCp] = useState<SubjectLearningObjective | null>(null);
  const [cpFormData, setCpFormData] = useState<Partial<SubjectLearningObjective>>({
    tpCode: 'TP 10.1',
    subjectId: '',
    subjectName: '',
    grade: 'X',
    semester: 'Ganjil',
    academicYear: '2024/2025',
    phase: 'Fase E',
    title: '',
    description: '',
    topic: '',
  });

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

  const filteredSubjects = subjects.filter((s) => {
    // Requirement 15: Wali Kelas hanya boleh menampilkan data Nama Mata Pelajaran yang dipelajari kelas binaan.
    if (currentUser.role === 'wali_kelas') {
      const myClassId = currentUser.classId;
      if (myClassId) {
        const schedules = DataService.getSchedule().filter((sc) => sc.classId === myClassId);
        const subjectNamesInClass = new Set(schedules.map((sc) => sc.subjectName.toLowerCase()));
        const subjectIdsInClass = new Set(schedules.map((sc) => sc.subjectId));

        const isLearnedInClass =
          (s.classIds && s.classIds.includes(myClassId)) ||
          subjectIdsInClass.has(s.id) ||
          subjectNamesInClass.has(s.name.toLowerCase()) ||
          (s.grade === 'X' && (!s.classIds || s.classIds.length === 0));

        if (!isLearnedInClass) return false;
      }
    }

    return (
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.teacherName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

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
      classIds: [],
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

    const selectedClassNames = (formData.classIds || [])
      .map((cid) => classes.find((c) => c.id === cid)?.name)
      .filter(Boolean) as string[];

    const payload: Subject = {
      id: editingSubject ? editingSubject.id : formData.id || 'sub-' + Date.now(),
      code: formData.code,
      name: formData.name,
      kkm: formData.kkm || 75,
      grade: formData.grade || 'X',
      teacherId: formData.teacherId || teachers[0]?.id,
      teacherName: teacher ? teacher.name : 'Belum Ditentukan',
      hoursPerWeek: formData.hoursPerWeek || 3,
      classIds: formData.classIds || [],
      classNames: selectedClassNames.length > 0 ? selectedClassNames : undefined,
    };

    DataService.saveSubject(payload, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });

    setSubjects(DataService.getSubjects());
    setIsModalOpen(false);
  };

  // CP & ATP Handlers (Kurikulum Merdeka)
  const handleOpenAddCp = () => {
    setEditingCp(null);
    const teacherMapel = currentUser.role === 'guru'
      ? subjects.find((s) => s.teacherId === currentUser.id || currentUser.assignedSubjectIds?.includes(s.id))
      : null;
    const defaultSub = teacherMapel || subjects[0];

    setCpFormData({
      id: 'lo-' + Date.now(),
      tpCode: 'TP 10.1',
      subjectId: defaultSub?.id || '',
      subjectName: defaultSub?.name || '',
      grade: (defaultSub?.grade as 'X' | 'XI' | 'XII') || 'X',
      semester: 'Ganjil',
      academicYear: '2024/2025',
      phase: defaultSub?.grade === 'X' ? 'Fase E' : 'Fase F',
      title: '',
      description: '',
      topic: 'Pemahaman Konsep & Analisis',
      teacherId: currentUser.id,
      teacherName: currentUser.name,
    });
    setIsCpModalOpen(true);
  };

  const handleOpenEditCp = (item: SubjectLearningObjective) => {
    setEditingCp(item);
    setCpFormData({ ...item });
    setIsCpModalOpen(true);
  };

  const handleDeleteCp = (id: string, code: string, subjectName: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus Capaian Pembelajaran / ATP "${code} - ${subjectName}"?`)) {
      DataService.deleteLearningObjective(id, {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      });
      setLearningObjectives(DataService.getLearningObjectives());
    }
  };

  const handleSaveCp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpFormData.tpCode || !cpFormData.subjectName || !cpFormData.title || !cpFormData.description) {
      alert('Mohon lengkapi semua kolom wajib CP & ATP.');
      return;
    }

    const selectedSub = subjects.find(
      (s) => s.id === cpFormData.subjectId || s.name.toLowerCase() === cpFormData.subjectName?.toLowerCase()
    );

    const toSave: SubjectLearningObjective = {
      id: editingCp ? editingCp.id : 'lo-' + Date.now(),
      subjectId: selectedSub?.id || cpFormData.subjectId || 'sub-gen',
      subjectName: selectedSub?.name || cpFormData.subjectName || 'Mata Pelajaran',
      grade: (cpFormData.grade as 'X' | 'XI' | 'XII') || 'X',
      semester: (cpFormData.semester as 'Ganjil' | 'Genap') || 'Ganjil',
      academicYear: cpFormData.academicYear || '2024/2025',
      phase: cpFormData.grade === 'X' ? 'Fase E' : 'Fase F',
      tpCode: cpFormData.tpCode.trim(),
      title: cpFormData.title.trim(),
      description: cpFormData.description.trim(),
      topic: cpFormData.topic?.trim() || 'Elemen Capaian',
      teacherId: currentUser.id,
      teacherName: currentUser.name,
    };

    DataService.saveLearningObjective(toSave, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });
    setLearningObjectives(DataService.getLearningObjectives());
    setIsCpModalOpen(false);
  };

  if (currentUser.role === 'siswa') {
    const studentClass = DataService.getClasses().find((c) => c.id === currentUser.classId) || DataService.getClasses()[0];
    const gradeNumber = studentClass.grade || 'X';
    const classSchedules = DataService.getSchedule().filter((sc) => sc.classId === studentClass.id);
    const scheduleSubjectIds = new Set(classSchedules.map((sc) => sc.subjectId));
    const scheduleSubjectNames = new Set(classSchedules.map((sc) => sc.subjectName.toLowerCase()));

    // Strict filter: Hanya tampilkan mata pelajaran yang diatur untuk kelas dan jurusan siswa
    const classSubjects = subjects.filter((s) => {
      // 1. Terdaftar langsung pada rombel kelas binaan siswa
      if (s.classIds && s.classIds.length > 0) {
        return s.classIds.includes(studentClass.id);
      }
      // 2. Terdaftar dalam jadwal pelajaran resmi kelas ini
      if (scheduleSubjectIds.has(s.id) || scheduleSubjectNames.has(s.name.toLowerCase())) {
        return true;
      }
      // 3. Mapel umum se-tingkat kelas, dengan eliminasi mapel peminatan jurusan lain (misal: IPS vs MIPA)
      if (s.grade === gradeNumber) {
        const lowerName = s.name.toLowerCase();
        const code = s.code.toUpperCase();
        if (studentClass.major === 'MIPA') {
          if (code.includes('IPS') || lowerName.includes('geografi') || lowerName.includes('sosiologi') || lowerName.includes('ekonomi')) {
            return false;
          }
        } else if (studentClass.major === 'IPS') {
          if (code.includes('MIPA') || lowerName.includes('fisika') || lowerName.includes('kimia') || lowerName.includes('biologi')) {
            return false;
          }
        }
        return true;
      }
      return false;
    });

    const studentFiltered = classSubjects.filter((s) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.teacherName.toLowerCase().includes(q);
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Rombel: {studentClass.name} (Tingkat {studentClass.grade} {studentClass.major})
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-indigo-600" />
              <span>Mata Pelajaran & Guru Pengampu Kelas Saya</span>
            </h2>
            <p className="text-xs text-slate-500">
              Daftar mata pelajaran yang Anda tempuh pada kelas {studentClass.name} beserta guru pengampu dan patokan KKM.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3 text-xs shadow-2xs">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari mata pelajaran atau nama guru pengampu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-slate-900 dark:text-white focus:outline-hidden"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {studentFiltered.map((sub) => {
            const scheduleItem = classSchedules.find(
              (sc) => sc.subjectId === sub.id || sc.subjectName.toLowerCase() === sub.name.toLowerCase()
            );
            const assignedTeacher =
              (scheduleItem?.teacherId ? teachers.find((t) => t.id === scheduleItem.teacherId) : null) ||
              teachers.find(
                (t) =>
                  t.assignedClassIds?.includes(studentClass.id) &&
                  t.subjectNames?.some((n) => n.toLowerCase() === sub.name.toLowerCase())
              ) ||
              teachers.find((t) => t.id === sub.teacherId || t.name === sub.teacherName) ||
              teachers[0];

            const subCPs = learningObjectives.filter(
              (lo) => lo.subjectId === sub.id || lo.subjectName.toLowerCase() === sub.name.toLowerCase()
            );

            return (
              <div
                key={sub.id}
                className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {sub.code}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 font-bold">
                      {sub.hoursPerWeek} JP / Minggu
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-2">
                    {sub.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tingkat Kelas {sub.grade}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 block">
                      Guru Pengampu Kelas {studentClass.name}:
                    </span>
                    <p className="font-bold text-slate-900 dark:text-white text-xs">
                      {assignedTeacher ? assignedTeacher.name : sub.teacherName}
                    </p>
                    {assignedTeacher?.nip && (
                      <p className="text-[10px] font-mono text-slate-500">
                        NIP. {assignedTeacher.nip}
                      </p>
                    )}
                    {assignedTeacher?.phone && (
                      <p className="text-[10px] text-slate-500">
                        Kontak: {assignedTeacher.phone}
                      </p>
                    )}
                  </div>

                  {subCPs.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-[11px] space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-300">
                        <Target className="w-3.5 h-3.5" />
                        <span>Capaian Pembelajaran (CP & ATP):</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 line-clamp-2 text-[10px]">
                        {subCPs.map((cp) => cp.tpCode + ': ' + cp.title).join(' · ')}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400 font-medium text-[11px]">
                      Ambang KKM:
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md font-mono font-bold text-xs bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      KKM {sub.kkm}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Filtered CP & ATP
  const filteredLearningObjectives = learningObjectives.filter((lo) => {
    if (cpSubjectFilter !== 'ALL' && lo.subjectId !== cpSubjectFilter) return false;
    if (cpGradeFilter !== 'ALL' && lo.grade !== cpGradeFilter) return false;
    if (cpSemesterFilter !== 'ALL' && lo.semester !== cpSemesterFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        lo.tpCode.toLowerCase().includes(q) ||
        lo.title.toLowerCase().includes(q) ||
        lo.description.toLowerCase().includes(q) ||
        lo.subjectName.toLowerCase().includes(q) ||
        lo.topic.toLowerCase().includes(q) ||
        lo.teacherName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('subjects')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'subjects'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/30'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BookMarked className="w-4 h-4" />
          <span>Mata Pelajaran & KKM</span>
        </button>
        <button
          onClick={() => setActiveTab('cp_atp')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'cp_atp'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/30'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Capaian Pembelajaran (CP) & ATP (Kurikulum Merdeka)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-mono font-bold">
            {learningObjectives.length}
          </span>
        </button>
      </div>

      {activeTab === 'subjects' ? (
        <>
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
                // Requirement 16: Wali Kelas bisa mengelola KKM masing-masing mata pelajaran
                const canManageKkm = isAdminOrWakasek || isMySubject || currentUser.role === 'wali_kelas';

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

        </>
      ) : (
        /* Tab: Capaian Pembelajaran & ATP Kurikulum Merdeka */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Standar BSKAP Kurikulum Merdeka
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Terintegrasi Rapor Akhir
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                <span>Pengelolaan Capaian Pembelajaran (CP) & ATP</span>
              </h2>
              <p className="text-xs text-slate-500">
                Dikelola oleh masing-masing Guru Mata Pelajaran. Rumusan CP dan ATP otomatis menjadi dasar deskripsi Capaian Kompetensi (Dikuasai & Perlu Ditingkatkan) pada Rapor Hasil Belajar.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenAddCp}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah CP & ATP Baru</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2 flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari kode TP, judul materi, elemen atau nama guru..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div>
                <select
                  value={cpSubjectFilter}
                  onChange={(e) => setCpSubjectFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="ALL">Semua Mata Pelajaran</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={cpGradeFilter}
                  onChange={(e) => setCpGradeFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="ALL">Semua Tingkat / Fase</option>
                  <option value="X">Kelas X (Fase E)</option>
                  <option value="XI">Kelas XI (Fase F)</option>
                  <option value="XII">Kelas XII (Fase F)</option>
                </select>
              </div>
            </div>
          </div>

          {/* List of CP & ATP Cards */}
          {filteredLearningObjectives.length === 0 ? (
            <div className="p-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <Target className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Belum ada Capaian Pembelajaran (CP) / ATP yang cocok dengan filter.
              </p>
              <p className="text-xs text-slate-500">
                Klik tombol "Tambah CP & ATP Baru" di atas untuk menambahkan tujuan pembelajaran.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLearningObjectives.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3.5 flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-800 transition-all"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {item.tpCode}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          {item.phase} · Kelas {item.grade}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          Sem. {item.semester} ({item.academicYear})
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEditCp(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Ubah CP/ATP"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCp(item.id, item.tpCode, item.subjectName)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Hapus CP/ATP"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {item.subjectName} · Elemen: {item.topic}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                        {item.title}
                      </h4>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 block">
                        Alur Tujuan Pembelajaran (ATP):
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 font-medium">
                      <span>Guru:</span>
                      <strong className="text-slate-700 dark:text-slate-300">{item.teacherName}</strong>
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      ID: {item.id}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Add/Edit CP & ATP Kurikulum Merdeka */}
      {isCpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {editingCp ? 'Ubah Capaian Pembelajaran & ATP' : 'Tambah CP & ATP Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Standar BSKAP Kurikulum Merdeka Terintegrasi Rapor
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCpModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCp} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Mata Pelajaran <span className="text-rose-500">*</span>
                </label>
                <select
                  value={cpFormData.subjectId || ''}
                  onChange={(e) => {
                    const sub = subjects.find((s) => s.id === e.target.value);
                    setCpFormData({
                      ...cpFormData,
                      subjectId: e.target.value,
                      subjectName: sub ? sub.name : '',
                      grade: (sub?.grade as 'X' | 'XI' | 'XII') || cpFormData.grade || 'X',
                      phase: sub?.grade === 'X' ? 'Fase E' : 'Fase F',
                    });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer font-medium"
                  required
                >
                  <option value="">Pilih Mata Pelajaran...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code} - Tingkat {s.grade})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Kode TP <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: TP 10.1"
                    value={cpFormData.tpCode || ''}
                    onChange={(e) => setCpFormData({ ...cpFormData, tpCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Tingkat & Fase
                  </label>
                  <select
                    value={cpFormData.grade || 'X'}
                    onChange={(e) => {
                      const gr = e.target.value as 'X' | 'XI' | 'XII';
                      setCpFormData({
                        ...cpFormData,
                        grade: gr,
                        phase: gr === 'X' ? 'Fase E' : 'Fase F',
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="X">Kelas X (Fase E)</option>
                    <option value="XI">Kelas XI (Fase F)</option>
                    <option value="XII">Kelas XII (Fase F)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Semester
                  </label>
                  <select
                    value={cpFormData.semester || 'Ganjil'}
                    onChange={(e) => setCpFormData({ ...cpFormData, semester: e.target.value as 'Ganjil' | 'Genap' })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="Ganjil">Semester Ganjil</option>
                    <option value="Genap">Semester Genap</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Elemen Kompetensi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Bilangan & Aljabar, Menyimak, Mekanika"
                    value={cpFormData.topic || ''}
                    onChange={(e) => setCpFormData({ ...cpFormData, topic: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Lingkup Materi / Topik CP <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Eksponen dan Logaritma"
                    value={cpFormData.title || ''}
                    onChange={(e) => setCpFormData({ ...cpFormData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Rumusan Alur Tujuan Pembelajaran (ATP) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Deskripsikan tujuan pembelajaran yang harus dicapai siswa pada materi ini..."
                  value={cpFormData.description || ''}
                  onChange={(e) => setCpFormData({ ...cpFormData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Materi ini akan digunakan secara otomatis dalam menyusun deskripsi rapor: <em>"Menunjukkan penguasaan dalam memahami [materi dikuasai], namun masih perlu penguasaan mengenai [materi belum dikuasai]."</em>
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCpModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-2xs"
                >
                  {editingCp ? 'Simpan Perubahan' : 'Simpan CP & ATP'}
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

              {/* Pemetaan Kelas / Rombel yang Mempelajari Mapel Ini */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <label className="block text-slate-700 dark:text-slate-300 font-bold text-xs">
                  Rombel / Kelas yang Mempelajari Mata Pelajaran Ini:
                </label>
                <p className="text-[10px] text-slate-500">
                  Pilih kelas tertentu (misal: X MIPA 1 untuk Bahasa Inggris, X MIPA 2 untuk Bahasa Jerman) atau kosongkan/centang semua jika berlaku umum:
                </p>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {classes.map((cls) => {
                    const isSelected = (formData.classIds || []).includes(cls.id);
                    return (
                      <button
                        type="button"
                        key={cls.id}
                        onClick={() => {
                          const current = formData.classIds || [];
                          const next = isSelected
                            ? current.filter((id) => id !== cls.id)
                            : [...current, cls.id];
                          setFormData({ ...formData, classIds: next });
                        }}
                        className={`px-2 py-1.5 rounded-md border text-left text-[11px] flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-400 text-indigo-900 dark:bg-indigo-950 dark:border-indigo-600 dark:text-indigo-200 font-bold'
                            : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span className="truncate">{cls.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
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
