import React, { useState, useMemo } from 'react';
import { useAuth, getTeacherHomeroomInfo } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { StudentExtracurricular, SubjectLearningObjective, ExtracurricularPredicate } from '../types';
import { PrintModal } from '../components/common/PrintModal';
import * as XLSX from 'xlsx';
import {
  Award,
  Printer,
  FileSpreadsheet,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle,
  Lock,
  ChevronRight,
  BookOpen,
  Calendar,
  UserCheck,
  User,
  GraduationCap,
  Sparkles,
  Edit3,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
} from 'lucide-react';

export const HomeroomReportView: React.FC = () => {
  const { currentUser } = useAuth();
  const classes = DataService.getClasses();
  const allSubjects = DataService.getSubjects();
  const allStudents = DataService.getStudents();
  const allAssignments = DataService.getAssignments();
  const allSubmissions = DataService.getSubmissions();
  const allAttendances = DataService.getAttendance();
  const academicYears = DataService.getAcademicYears();
  const profile = DataService.getSchoolProfile();
  const [extracurriculars, setExtracurriculars] = useState<StudentExtracurricular[]>(() => DataService.getExtracurriculars());
  const allLearningObjectives = DataService.getLearningObjectives();

  // Active academic year configuration
  const activeYearConfig = academicYears.find((ay) => ay.isActive) || academicYears[0];
  const [selectedYear, setSelectedYear] = useState(activeYearConfig?.year || '2024/2025');
  const [selectedSemester, setSelectedSemester] = useState<'Ganjil' | 'Genap'>(activeYearConfig?.semester || 'Ganjil');

  // Wali kelas is strictly locked to their assigned homeroom class.
  // Guru Mapel who is also assigned as Wali Kelas gets full Wali Kelas capabilities for their class.
  // Guru Mapel without homeroom duty does not have access.
  const homeroomInfo = useMemo(() => getTeacherHomeroomInfo(currentUser), [currentUser]);
  const isHomeroomTeacher = currentUser.role === 'wali_kelas' || (currentUser.role === 'guru' && homeroomInfo.isHomeroom);
  const homeroomClassId = isHomeroomTeacher
    ? (homeroomInfo.classId || currentUser.classId || 'cls-xmipa1')
    : classes[0]?.id || 'cls-xmipa1';

  const [selectedClassId, setSelectedClassId] = useState<string>(homeroomClassId);

  // If role is homeroom teacher, strictly enforce their assigned class
  const effectiveClassId = isHomeroomTeacher ? homeroomClassId : selectedClassId;
  const currentClass = classes.find((c) => c.id === effectiveClassId) || classes[0];

  // Active Tab: Leger Nilai vs Cetak Rapor Akhir Siswa
  const [activeTab, setActiveTab] = useState<'leger' | 'rapor'>('rapor');

  // Selected Student for Rapor view
  const classStudents = useMemo(() => {
    return allStudents.filter((s) => s.classId === effectiveClassId);
  }, [allStudents, effectiveClassId]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>(classStudents[0]?.id || '');
  const activeStudent = classStudents.find((s) => s.id === selectedStudentId) || classStudents[0];

  // Modals for Printing
  const [printLegerOpen, setPrintLegerOpen] = useState(false);
  const [printRaporOpen, setPrintRaporOpen] = useState(false);

  // Editable homeroom notes per student (persisted in local state)
  const [homeroomNotes, setHomeroomNotes] = useState<Record<string, string>>({
    'std-ahmad': 'Ananda Ahmad Fauzi menunjukkan prestasi akademik yang sangat memuaskan, konsisten, dan memiliki kepemimpinan yang baik. Pertahankan disiplin dan tingkatkan kehadiran tepat waktu.',
    'std-siti': 'Ananda Siti Aisyah memiliki ketekunan belajar dan pemahaman konsep yang luar biasa. Sangat aktif dalam diskusi kelas dan kegiatan ekstrakurikuler.',
    'std-budi': 'Ananda Budi Pratama bersemangat dan tekun dalam praktik kejuruan. Terus tingkatkan fokus belajar mandiri serta ketelitian.',
  });

  // Modal State for Ekstrakurikuler (Add / Edit) - Khusus Wali Kelas sesuai kelas binaan
  const [isExtraModalOpen, setIsExtraModalOpen] = useState(false);
  const [editingExtraId, setEditingExtraId] = useState<string | null>(null);
  const [extraForm, setExtraForm] = useState<{
    id?: string;
    studentId: string;
    studentName: string;
    activityName: string;
    predicate: ExtracurricularPredicate;
    description: string;
  }>({
    studentId: '',
    studentName: '',
    activityName: 'Pramuka (Wajib)',
    predicate: 'Sangat Baik',
    description: '',
  });

  const handleOpenAddExtra = (targetStudentId?: string, targetStudentName?: string) => {
    setEditingExtraId(null);
    const sId = targetStudentId || activeStudent?.id || classStudents[0]?.id || '';
    const sName = targetStudentName || activeStudent?.name || classStudents[0]?.name || '';
    setExtraForm({
      studentId: sId,
      studentName: sName,
      activityName: 'Pramuka (Wajib)',
      predicate: 'Sangat Baik',
      description: 'Aktif, disiplin, dan bertanggung jawab dalam setiap kegiatan dan tugas kepramukaan.',
    });
    setIsExtraModalOpen(true);
  };

  const handleOpenEditExtra = (ext: StudentExtracurricular) => {
    setEditingExtraId(ext.id);
    setExtraForm({
      id: ext.id,
      studentId: ext.studentId,
      studentName: ext.studentName,
      activityName: ext.activityName,
      predicate: ext.predicate,
      description: ext.description,
    });
    setIsExtraModalOpen(true);
  };

  const handleSaveExtra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraForm.studentId || !extraForm.activityName.trim()) return;

    const std = allStudents.find((s) => s.id === extraForm.studentId);
    const itemToSave: StudentExtracurricular = {
      id: editingExtraId || extraForm.id || 'ext-' + Date.now(),
      studentId: extraForm.studentId,
      studentName: std?.name || extraForm.studentName || 'Peserta Didik',
      classId: effectiveClassId,
      academicYear: selectedYear,
      semester: selectedSemester,
      activityName: extraForm.activityName.trim(),
      predicate: extraForm.predicate,
      description: extraForm.description.trim() || 'Berpartisipasi aktif dalam kegiatan ekstrakurikuler.',
    };

    DataService.saveExtracurricular(itemToSave, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });

    setExtracurriculars(DataService.getExtracurriculars());
    setIsExtraModalOpen(false);
  };

  const handleDeleteExtra = (id: string, activityName: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data ekstrakurikuler "${activityName}"?`)) {
      DataService.deleteExtracurricular(id, {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      });
      setExtracurriculars(DataService.getExtracurriculars());
    }
  };

  // Effective weeks baseline set by Wakasek Kurikulum
  const effectiveWeeksConfig = DataService.getActiveEffectiveWeeks(selectedYear, selectedSemester);

  let effectiveDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  if (profile.useCustomDocumentDate && profile.documentDate) {
    try {
      const parsedDate = new Date(profile.documentDate);
      if (!isNaN(parsedDate.getTime())) {
        effectiveDate = parsedDate.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
    } catch {
      // fallback
    }
  }

  // Otorisasi: Hanya Wali Kelas resmi dari kelas bersangkutan yang berwenang mengedit
  const isAuthorizedHomeroomTeacher = Boolean(
    currentClass &&
    (
      (currentUser.role === 'wali_kelas' && (currentUser.classId === currentClass.id || homeroomInfo?.classId === currentClass.id)) ||
      (currentUser.role === 'guru' && homeroomInfo?.isHomeroom && (homeroomInfo.classId === currentClass.id || currentClass.homeroomTeacherId === currentUser.id))
    )
  );

  const getStudentHomeroomNote = (studentId: string, studentName: string) => {
    if (homeroomNotes[studentId]) return homeroomNotes[studentId];
    return `Ananda ${studentName} menunjukkan perkembangan belajar yang positif pada Semester ${selectedSemester}. Pertahankan motivasi dan terus kembangkan potensi diri.`;
  };

  const handleUpdateNote = (studentId: string, note: string) => {
    if (!isAuthorizedHomeroomTeacher) {
      alert(`Hanya Wali Kelas resmi (${currentClass?.homeroomTeacherName || currentClass?.name}) yang berwenang mengedit Catatan Perkembangan Karakter & Motivasi.`);
      return;
    }
    setHomeroomNotes((prev) => ({
      ...prev,
      [studentId]: note,
    }));
  };

  // Subjects applicable for this class
  // Hanya mapel yang terintegrasi dengan kelas bersangkutan (sesuai pengaturan Admin / Wakasek Kurikulum)
  const classSubjects = useMemo(() => {
    if (!currentClass) return [];
    const gradeLevel = currentClass.grade || 'X';
    const schedulesInClass = DataService.getSchedule().filter((sc) => sc.classId === currentClass.id);
    const scheduledSubjectIds = new Set(schedulesInClass.map((sc) => sc.subjectId));
    const scheduledSubjectNames = new Set(schedulesInClass.map((sc) => sc.subjectName.toLowerCase()));

    return allSubjects.filter((s) => {
      // 1. Jika mapel secara spesifik diatur memiliki daftar classIds oleh Admin/Wakasek:
      if (s.classIds && s.classIds.length > 0) {
        return s.classIds.includes(currentClass.id);
      }
      // 2. Jika mapel terjadwal dalam jadwal resmi rombel ini:
      if (scheduledSubjectIds.has(s.id) || scheduledSubjectNames.has(s.name.toLowerCase())) {
        return true;
      }
      // 3. Mapel umum se-tingkat kelas yang tidak dibatasi kelas lain dan sesuai jurusan
      if (!s.grade || s.grade === gradeLevel || s.grade === 'Semua') {
        const lowerName = s.name.toLowerCase();
        const code = s.code.toUpperCase();
        if (currentClass.major === 'MIPA') {
          if (code.includes('IPS') || lowerName.includes('geografi') || lowerName.includes('sosiologi') || lowerName.includes('ekonomi')) {
            return false;
          }
        } else if (currentClass.major === 'IPS') {
          if (code.includes('MIPA') || lowerName.includes('fisika') || lowerName.includes('kimia') || lowerName.includes('biologi')) {
            return false;
          }
        }
        return true;
      }
      return false;
    });
  }, [allSubjects, currentClass]);

  // Compute Full Grades & Competency per student & subject
  // Aggregated from subject teachers' assignments & submissions
  const gradeBookData = useMemo(() => {
    return classStudents.map((student, sIdx) => {
      let totalScore = 0;
      let subjectCount = 0;

      const subjectGrades = classSubjects.map((sub) => {
        // Find assignments in this class & subject
        const subAssignments = allAssignments.filter(
          (a) => a.classId === effectiveClassId && a.subjectId === sub.id
        );

        // Find student submissions
        const studentSubs = allSubmissions.filter(
          (sb) =>
            sb.studentId === student.id &&
            subAssignments.some((a) => a.id === sb.assignmentId) &&
            sb.score !== undefined
        );

        let finalScore: number;
        if (studentSubs.length > 0) {
          const sum = studentSubs.reduce((acc, curr) => acc + (curr.score || 0), 0);
          finalScore = Math.round(sum / studentSubs.length);
        } else {
          // Calibrated realistic baseline based on student GPA & subject KKM
          const baseFromGpa = Math.round((student.gpa / 4.0) * 100);
          const variation = ((sIdx + sub.name.length) % 7) - 3;
          finalScore = Math.max(sub.kkm, Math.min(98, baseFromGpa + variation));
        }

        totalScore += finalScore;
        subjectCount++;

        const isPassing = finalScore >= sub.kkm;

        // Capaian Pembelajaran & ATP terintegrasi dari Guru Mata Pelajaran (Kurikulum Merdeka)
        const subjectCPs = allLearningObjectives.filter(
          (lo) => lo.subjectId === sub.id || lo.subjectName.toLowerCase() === sub.name.toLowerCase()
        );

        let masteredTopic = '';
        let improvementTopic = '';

        if (subjectCPs.length >= 2) {
          if (finalScore >= 88) {
            masteredTopic = `${subjectCPs[0].title} dan ${subjectCPs[1].title}`;
            improvementTopic = subjectCPs[2]?.title || 'penerapan variasi materi pengayaan';
          } else if (finalScore >= 75) {
            masteredTopic = subjectCPs[0].title;
            improvementTopic = subjectCPs[1]?.title || 'analisis konsep lanjutan';
          } else {
            masteredTopic = `konsep awal ${subjectCPs[0].title}`;
            improvementTopic = `${subjectCPs[0].title} secara komprehensif dan ${subjectCPs[1]?.title || 'penerapan rumus dasar'}`;
          }
        } else if (subjectCPs.length === 1) {
          if (finalScore >= 75) {
            masteredTopic = subjectCPs[0].title;
            improvementTopic = 'pengembangan studi kasus analitis mandiri';
          } else {
            masteredTopic = `konsep dasar ${subjectCPs[0].title}`;
            improvementTopic = `pemahaman mendalam dan penerapan praktis ${subjectCPs[0].title}`;
          }
        } else {
          // Fallback representatif jika CP belum ditambahkan guru mapel
          if (finalScore >= 85) {
            masteredTopic = `konsep inti dan penerapan kontekstual ${sub.name}`;
            improvementTopic = 'pengayaan materi komparatif';
          } else if (finalScore >= 75) {
            masteredTopic = `prosedur kerja dan pemahaman dasar ${sub.name}`;
            improvementTopic = 'analisis kritis dan penalaran tingkat lanjut';
          } else {
            masteredTopic = `definisi awal materi ${sub.name}`;
            improvementTopic = `prosedur pemecahan masalah dan konsep fundamental ${sub.name}`;
          }
        }

        // Format resmi sesuai permintaan: Menunjukkan penguasaan dalam memahami ...., namun masih perlu penguasaan mengenai ...
        const competencyDescription = `Menunjukkan penguasaan dalam memahami ${masteredTopic}, namun masih perlu penguasaan mengenai ${improvementTopic}.`;

        return {
          subjectId: sub.id,
          subjectCode: sub.code,
          subjectName: sub.name,
          kkm: sub.kkm,
          score: finalScore,
          isPassing,
          competencyDescription,
        };
      });

      const averageScore = subjectCount > 0 ? Math.round(totalScore / subjectCount) : 0;

      // Attendance summary from subject teachers for this student
      let hadir = 0;
      let sakit = 0;
      let izin = 0;
      let alpa = 0;
      allAttendances
        .filter((att) => att.classId === effectiveClassId)
        .forEach((att) => {
          const rec = att.records?.find((r) => r.studentId === student.id || r.studentName === student.name);
          if (rec) {
            if (rec.status === 'H') hadir++;
            else if (rec.status === 'S') sakit++;
            else if (rec.status === 'I') izin++;
            else if (rec.status === 'A') alpa++;
          }
        });

      const finalHadir = hadir > 0 ? hadir : student.attendance?.hadir || 56;
      const finalSakit = sakit > 0 ? sakit : student.attendance?.sakit || 2;
      const finalIzin = izin > 0 ? izin : student.attendance?.izin || 1;
      const finalAlpa = alpa > 0 ? alpa : student.attendance?.alpa || 0;

      return {
        studentId: student.id,
        nisn: student.nisn,
        nis: student.nis,
        name: student.name,
        gender: student.gender,
        birthPlaceDate: student.birthPlaceDate,
        parentName: student.parentName,
        subjectGrades,
        totalScore,
        averageScore,
        attendance: {
          hadir: finalHadir,
          sakit: finalSakit,
          izin: finalIzin,
          alpa: finalAlpa,
        },
      };
    });
  }, [classStudents, classSubjects, allAssignments, allSubmissions, allAttendances, effectiveClassId]);

  // Sorted by average score to determine ranking
  const rankedGradeBook = useMemo(() => {
    const sorted = [...gradeBookData].sort((a, b) => b.averageScore - a.averageScore);
    return sorted.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  }, [gradeBookData]);

  // Active student detailed report
  const activeStudentReport = useMemo(() => {
    return rankedGradeBook.find((s) => s.studentId === activeStudent?.id) || rankedGradeBook[0];
  }, [rankedGradeBook, activeStudent]);

  // Export Leger to Excel
  const handleExportLegerExcel = () => {
    const headers: Record<string, any>[] = rankedGradeBook.map((row) => {
      const obj: Record<string, any> = {
        'Peringkat': row.rank,
        'NISN': row.nisn,
        'NIS': row.nis,
        'Nama Peserta Didik': row.name,
        'L/P': row.gender,
      };

      row.subjectGrades.forEach((sg) => {
        obj[sg.subjectName] = sg.score;
      });

      obj['Total Nilai'] = row.totalScore;
      obj['Rata-Rata'] = row.averageScore;
      obj['Sakit'] = row.attendance.sakit;
      obj['Izin'] = row.attendance.izin;
      obj['Alpa'] = row.attendance.alpa;

      return obj;
    });

    const worksheet = XLSX.utils.json_to_sheet(headers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Leger_${currentClass.name.replace(/\s+/g, '')}`);
    XLSX.writeFile(workbook, `SISPAM_LEGER_NILAI_${currentClass.name.replace(/\s+/g, '_')}_${selectedSemester}_${selectedYear.replace('/', '-')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Rapor Akhir & Leger Nilai Semester (Kurikulum Merdeka)
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
              Khusus Wali Kelas
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengelolaan cetak Rapor Hasil Belajar Kurikulum Merdeka dan Leger Nilai semester terpadu dari isian semua guru mata pelajaran.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'leger' ? (
            <>
              <button
                onClick={handleExportLegerExcel}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                title="Ekspor data leger lengkap ke spreadsheet Microsoft Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Ekspor Excel (.xlsx)</span>
              </button>
              <button
                onClick={() => setPrintLegerOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Leger Nilai (F4)</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setPrintRaporOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Rapor Siswa Ini (A4)</span>
            </button>
          )}
        </div>
      </div>

      {/* Class Lockdown Notice for Wali Kelas */}
      {isHomeroomTeacher && (
        <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-xs rounded-xl flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Kewenangan Akses Terkunci (RBAC Wali Kelas):</span> Anda bertugas sebagai Wali Kelas <strong>{currentClass.name}</strong>. Sesuai regulasi sistem, Anda hanya dapat mengakses, mengolah, dan mencetak Rapor Akhir serta Leger Nilai untuk peserta didik di kelas binaan Anda. Anda tidak memiliki akses ke kelas lain.
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Class Selector: Disabled if Wali Kelas */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Rombel / Kelas
            </label>
            {isHomeroomTeacher ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 font-bold text-xs">
                <Lock className="w-3.5 h-3.5 text-indigo-600" />
                <span>{currentClass.name} ({currentClass.major})</span>
              </div>
            ) : (
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedStudentId('');
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs cursor-pointer"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.major})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Academic Year */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Tahun Ajaran
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs cursor-pointer"
            >
              {academicYears.map((ay) => (
                <option key={ay.id} value={ay.year}>
                  {ay.year}
                </option>
              ))}
            </select>
          </div>

          {/* Semester */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Semester
            </label>
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setSelectedSemester('Ganjil')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  selectedSemester === 'Ganjil'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Ganjil
              </button>
              <button
                type="button"
                onClick={() => setSelectedSemester('Genap')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  selectedSemester === 'Genap'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Genap
              </button>
            </div>
          </div>
        </div>

        {/* Tab Switcher: Cetak Rapor Akhir vs Leger Nilai */}
        <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('rapor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-colors cursor-pointer ${
              activeTab === 'rapor'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Cetak Rapor Akhir Siswa</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('leger')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-colors cursor-pointer ${
              activeTab === 'leger'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Leger Nilai Semester (Semua Mapel)</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: CETAK RAPOR AKHIR SISWA (KURIKULUM MERDEKA) */}
      {activeTab === 'rapor' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: Student Selector */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Peserta Didik ({classStudents.length})</span>
              <span className="text-[10px] text-indigo-600 font-semibold font-mono">Kelas {currentClass.name}</span>
            </h3>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {rankedGradeBook.map((st) => {
                const isSelected = st.studentId === activeStudent?.id;
                return (
                  <button
                    key={st.studentId}
                    type="button"
                    onClick={() => setSelectedStudentId(st.studentId)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-1 ring-indigo-600'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {st.name}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          #{st.rank}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        NISN: {st.nisn}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {st.averageScore}
                      </span>
                      <p className="text-[10px] text-slate-400">Rerata</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Kurikulum Merdeka Report Card Preview */}
          <div className="lg:col-span-3">
            {activeStudentReport ? (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-6">
                {/* Header Information Card */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        RAPOR HASIL BELAJAR (KURIKULUM MERDEKA)
                      </h3>
                      <p className="text-xs text-slate-500 font-mono">
                        {profile.name} · NSS/NPSN: {profile.npsn}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
                        Fase {currentClass.grade === 'X' ? 'E' : 'F'} · Semester {selectedSemester}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Nama Peserta Didik:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{activeStudentReport.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">NISN / NIS:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{activeStudentReport.nisn} / {activeStudentReport.nis}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Kelas & Rombel:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{currentClass.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Tahun Ajaran:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedYear}</span>
                    </div>
                  </div>
                </div>

                {/* Section A: Laporan Hasil Belajar Mata Pelajaran */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span>A. Nilai Capaian Kompetensi Mata Pelajaran</span>
                  </h4>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                        <tr>
                          <th className="py-2.5 px-3 text-center w-10">No</th>
                          <th className="py-2.5 px-3 w-48">Mata Pelajaran</th>
                          <th className="py-2.5 px-3 text-center w-16">KKM</th>
                          <th className="py-2.5 px-3 text-center w-20">Nilai Akhir</th>
                          <th className="py-2.5 px-4">Capaian Kompetensi (Kurikulum Merdeka)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {activeStudentReport.subjectGrades.map((sg, idx) => (
                          <tr key={sg.subjectId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{sg.subjectName}</td>
                            <td className="py-2.5 px-3 text-center font-mono text-slate-400">{sg.kkm}</td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">
                              {sg.score}
                            </td>
                            <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                              {sg.competencyDescription}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section B: Ekstrakurikuler & Kehadiran */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Ekstrakurikuler Dinamis (Kelola oleh Wali Kelas) */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>B. Kegiatan Ekstrakurikuler</span>
                      </h4>
                      {isHomeroomTeacher && (
                        <button
                          type="button"
                          onClick={() => handleOpenAddExtra(activeStudentReport.studentId, activeStudentReport.name)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[11px] cursor-pointer shadow-xs transition-colors"
                          title="Tambah Catatan Ekstrakurikuler Siswa Ini"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Tambah Ekskul</span>
                        </button>
                      )}
                    </div>

                    {extracurriculars.filter((ex) => ex.studentId === activeStudentReport.studentId).length === 0 ? (
                      <p className="text-[11px] text-slate-400 py-4 text-center italic">
                        Belum ada kegiatan ekstrakurikuler yang dicatat untuk siswa ini.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-slate-400 text-[10px] border-b border-slate-100 dark:border-slate-800 text-left">
                              <th className="py-1">Kegiatan</th>
                              <th className="py-1 text-center w-20">Predikat</th>
                              <th className="py-1">Keterangan</th>
                              {isHomeroomTeacher && <th className="py-1 text-right w-14">Aksi</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {extracurriculars
                              .filter((ex) => ex.studentId === activeStudentReport.studentId)
                              .map((ex, idx) => (
                                <tr key={ex.id}>
                                  <td className="py-2 font-semibold text-slate-900 dark:text-white">
                                    {idx + 1}. {ex.activityName}
                                  </td>
                                  <td className="py-2 font-bold text-center">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                                        ex.predicate === 'Sangat Baik'
                                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                          : ex.predicate === 'Baik'
                                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                      }`}
                                    >
                                      {ex.predicate}
                                    </span>
                                  </td>
                                  <td className="py-2 text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                                    {ex.description}
                                  </td>
                                  {isHomeroomTeacher && (
                                    <td className="py-2 text-right space-x-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditExtra(ex)}
                                        className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                        title="Ubah Ekstrakurikuler"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteExtra(ex.id, ex.activityName)}
                                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                        title="Hapus Ekstrakurikuler"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Kehadiran Terpadu */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      <span>C. Ketidakhadiran (Rekap Guru Mapel)</span>
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                        <span className="text-[11px] text-blue-800 dark:text-blue-300 block font-semibold">Sakit</span>
                        <span className="text-lg font-bold font-mono text-blue-700 dark:text-blue-200">{activeStudentReport.attendance.sakit} Hari</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                        <span className="text-[11px] text-amber-800 dark:text-amber-300 block font-semibold">Izin</span>
                        <span className="text-lg font-bold font-mono text-amber-700 dark:text-amber-200">{activeStudentReport.attendance.izin} Hari</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                        <span className="text-[11px] text-rose-800 dark:text-rose-300 block font-semibold">Tanpa Keterangan</span>
                        <span className="text-lg font-bold font-mono text-rose-700 dark:text-rose-200">{activeStudentReport.attendance.alpa} Hari</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section D: Catatan Wali Kelas (Hanya Wali Kelas Bersangkutan yang Berwenang Mengedit) */}
                <div className="border border-indigo-100 dark:border-indigo-900/60 rounded-xl p-4 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>D. Catatan Perkembangan Karakter & Motivasi dari Wali Kelas</span>
                    </h4>
                    {isAuthorizedHomeroomTeacher ? (
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Wali Kelas Resmi (Akses Edit Aktif)</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1 bg-amber-50 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                        <Lock className="w-3 h-3 text-amber-600" />
                        <span>Khusus Wali Kelas {currentClass?.name} ({currentClass?.homeroomTeacherName}) — Akun Anda Hanya Dapat Melihat</span>
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    disabled={!isAuthorizedHomeroomTeacher}
                    readOnly={!isAuthorizedHomeroomTeacher}
                    value={getStudentHomeroomNote(activeStudentReport.studentId, activeStudentReport.name)}
                    onChange={(e) => handleUpdateNote(activeStudentReport.studentId, e.target.value)}
                    placeholder="Tuliskan catatan apresiasi, motivasi, dan arahan perkembangan belajar peserta didik..."
                    className={`w-full px-3 py-2 rounded-lg border text-xs leading-relaxed transition-all ${
                      isAuthorizedHomeroomTeacher
                        ? 'border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-indigo-500'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 cursor-not-allowed select-none'
                    }`}
                  ></textarea>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* VIEW 2: LEGER NILAI SEMESTER (SEMUA MAPEL) */}
      {activeTab === 'leger' && (
        <div className="space-y-4">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium">Peserta Didik Terdaftar</span>
              <p className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                {rankedGradeBook.length} Siswa
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium">Rata-Rata Kelas</span>
              <p className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
                {rankedGradeBook.length > 0
                  ? Math.round(rankedGradeBook.reduce((acc, r) => acc + r.averageScore, 0) / rankedGradeBook.length)
                  : 0}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium">Nilai Rerata Tertinggi</span>
              <p className="text-xl font-bold font-mono text-emerald-600 mt-1">
                {rankedGradeBook[0]?.averageScore || 0} ({rankedGradeBook[0]?.name.split(' ')[0]})
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium">Mata Pelajaran Diujikan</span>
              <p className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                {classSubjects.length} Mapel
              </p>
            </div>
          </div>

          {/* Leger Nilai Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  LEGER NILAI HASIL BELAJAR PESERTA DIDIK
                </h3>
                <p className="text-xs text-slate-500">
                  Rombel: <strong>{currentClass.name}</strong> · Semester: <strong>{selectedSemester}</strong> · Tahun Ajaran: <strong>{selectedYear}</strong>
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <tr>
                    <th className="py-2.5 px-2 text-center w-10">Peringkat</th>
                    <th className="py-2.5 px-3 text-center w-24">NISN</th>
                    <th className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">Nama Peserta Didik</th>
                    <th className="py-2.5 px-2 text-center w-10">L/P</th>
                    {classSubjects.map((sub) => (
                      <th key={sub.id} className="py-2.5 px-2 text-center font-mono text-[11px]" title={`${sub.name} (KKM: ${sub.kkm})`}>
                        {sub.code || sub.name.substring(0, 4)}
                      </th>
                    ))}
                    <th className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800">
                      Total
                    </th>
                    <th className="py-2.5 px-3 text-center font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30">
                      Rerata
                    </th>
                    <th className="py-2.5 px-2 text-center text-blue-600">S</th>
                    <th className="py-2.5 px-2 text-center text-amber-600">I</th>
                    <th className="py-2.5 px-2 text-center text-rose-600">A</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rankedGradeBook.map((row) => (
                    <tr key={row.studentId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-2 text-center font-mono font-bold text-indigo-600">
                        #{row.rank}
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-400">{row.nisn}</td>
                      <td className="py-2 px-4 font-semibold text-slate-900 dark:text-white">{row.name}</td>
                      <td className="py-2 px-2 text-center text-slate-500">{row.gender}</td>
                      {row.subjectGrades.map((sg) => (
                        <td
                          key={sg.subjectId}
                          className={`py-2 px-2 text-center font-mono font-medium ${
                            !sg.isPassing ? 'text-rose-600 font-bold bg-rose-50/40 dark:bg-rose-950/30' : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {sg.score}
                        </td>
                      ))}
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/50">
                        {row.totalScore}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20">
                        {row.averageScore}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-slate-500">{row.attendance.sakit}</td>
                      <td className="py-2 px-2 text-center font-mono text-slate-500">{row.attendance.izin}</td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-rose-600">{row.attendance.alpa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PRINT MODAL: RAPOR HASIL BELAJAR SISWA (FORMAT F4 FOLIO) */}
      <PrintModal
        isOpen={printRaporOpen}
        onClose={() => setPrintRaporOpen(false)}
        title="Cetak Rapor Akhir Hasil Belajar (Standar F4 Kurikulum Merdeka)"
        documentTitle="LAPORAN HASIL BELAJAR PESERTA DIDIK"
        hideDocumentNumber={true}
        hideDefaultSignatures={true}
        customSignatureBlock={
          <div
            className="signature-block avoid-page-break pt-8 text-xs text-slate-900"
            style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
          >
            {/* Row 1: Orang Tua/Wali (Kiri) & Tempat/Tanggal Sejajar Wali Kelas (Kanan) */}
            <div className="grid grid-cols-2 gap-8 text-center">
              {/* Kolom Kiri: Orang Tua / Wali (Nama Dikosongkan) */}
              <div>
                <p className="invisible">Spacer</p>
                <p className="font-medium text-slate-700">Mengetahui,</p>
                <p className="font-medium text-slate-700">Orang Tua / Wali Peserta Didik</p>
                <div className="h-20"></div>
                <p className="font-bold text-slate-900">( .................................................. )</p>
              </div>

              {/* Kolom Kanan: Tempat, Tanggal Dokumen Sejajar dengan Wali Kelas */}
              <div>
                <p className="text-slate-700">
                  {profile.city}, {effectiveDate}
                </p>
                <p className="font-medium text-slate-700">Wali Kelas,</p>
                <div className="h-20"></div>
                <p className="font-bold underline text-slate-900">
                  {currentUser.role === 'wali_kelas' ? currentUser.name : (currentClass.homeroomTeacherName || 'Budi Santoso, S.Si.')}
                </p>
                <p className="text-[11px] font-mono text-slate-600">
                  NIP. {currentUser.role === 'wali_kelas' ? (currentUser.nipOrNisn || '19820311 200801 1 007') : '19820311 200801 1 007'}
                </p>
              </div>
            </div>

            {/* Row 2: Mengetahui Kepala Sekolah di Tengah Bawah */}
            <div className="mt-8 text-center">
              <p className="font-medium text-slate-700">Mengetahui,</p>
              <p className="font-medium text-slate-700">Kepala Sekolah {profile.name}</p>
              <div className="h-20"></div>
              <p className="font-bold underline text-slate-900">{profile.principalName}</p>
              <p className="text-[11px] font-mono text-slate-600">NIP. {profile.principalNip}</p>
            </div>
          </div>
        }
      >
        {activeStudentReport && (
          <div className="space-y-4 text-xs">
            {/* Identity Table */}
            <div className="grid grid-cols-2 gap-2 border-b border-black pb-2">
              <div>
                <p>Nama Peserta Didik: <strong>{activeStudentReport.name}</strong></p>
                <p>NISN / NIS: <strong>{activeStudentReport.nisn} / {activeStudentReport.nis}</strong></p>
                <p>Nama Sekolah: <strong>{profile.name}</strong></p>
                <p>Alamat Sekolah: <strong>{profile.address}</strong></p>
              </div>
              <div className="text-right">
                <p>Kelas / Rombel: <strong>{currentClass.name}</strong></p>
                <p>Fase: <strong>{currentClass.grade === 'X' ? 'Fase E' : 'Fase F'}</strong></p>
                <p>Semester: <strong>{selectedSemester}</strong></p>
                <p>Tahun Pelajaran: <strong>{selectedYear}</strong></p>
              </div>
            </div>

            {/* Table A: Academic Grades */}
            <div>
              <p className="font-bold mb-1">A. Nilai Hasil Belajar & Capaian Kompetensi</p>
              <table className="w-full border-collapse border border-black text-xs">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-black py-1.5 px-1 text-center w-8">No</th>
                    <th className="border border-black py-1.5 px-2 text-left w-48">Mata Pelajaran</th>
                    <th className="border border-black py-1.5 px-2 text-center w-14">Nilai Akhir</th>
                    <th className="border border-black py-1.5 px-2 text-left">Capaian Kompetensi (Kurikulum Merdeka)</th>
                  </tr>
                </thead>
                <tbody>
                  {activeStudentReport.subjectGrades.map((sg, idx) => (
                    <tr key={sg.subjectId}>
                      <td className="border border-black py-1 px-1 text-center font-mono">{idx + 1}</td>
                      <td className="border border-black py-1 px-2 font-semibold">{sg.subjectName}</td>
                      <td className="border border-black py-1 px-2 text-center font-mono font-bold">{sg.score}</td>
                      <td className="border border-black py-1 px-2 text-[11px] leading-tight">{sg.competencyDescription}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table B: Ekstrakurikuler & Presensi */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-bold mb-1">B. Ekstrakurikuler</p>
                <table className="w-full border-collapse border border-black text-xs">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-black py-1 px-1 text-center w-8">No</th>
                      <th className="border border-black py-1 px-2 text-left">Kegiatan Ekstrakurikuler</th>
                      <th className="border border-black py-1 px-2 text-center w-20">Predikat</th>
                      <th className="border border-black py-1 px-2 text-left">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extracurriculars.filter((ex) => ex.studentId === activeStudentReport.studentId).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="border border-black py-2 px-2 text-center text-slate-500 italic">
                          Tidak ada kegiatan ekstrakurikuler yang diikuti pada semester ini.
                        </td>
                      </tr>
                    ) : (
                      extracurriculars
                        .filter((ex) => ex.studentId === activeStudentReport.studentId)
                        .map((ex, idx) => (
                          <tr key={ex.id}>
                            <td className="border border-black py-1 px-1 text-center font-mono">{idx + 1}</td>
                            <td className="border border-black py-1 px-2 font-medium">{ex.activityName}</td>
                            <td className="border border-black py-1 px-2 text-center font-bold">{ex.predicate}</td>
                            <td className="border border-black py-1 px-2 text-[11px] leading-tight">{ex.description}</td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>

              <div>
                <p className="font-bold mb-1">
                  C. Ketidakhadiran (Alokasi: {effectiveWeeksConfig.effectiveDays} Hari Efektif / {effectiveWeeksConfig.effectiveWeeks} Minggu KBM)
                </p>
                <table className="w-full border-collapse border border-black text-xs">
                  <tbody>
                    <tr>
                      <td className="border border-black py-1 px-2">Sakit</td>
                      <td className="border border-black py-1 px-2 text-center font-bold w-20">{activeStudentReport.attendance.sakit} Hari</td>
                    </tr>
                    <tr>
                      <td className="border border-black py-1 px-2">Izin</td>
                      <td className="border border-black py-1 px-2 text-center font-bold w-20">{activeStudentReport.attendance.izin} Hari</td>
                    </tr>
                    <tr>
                      <td className="border border-black py-1 px-2">Tanpa Keterangan (Alpa)</td>
                      <td className="border border-black py-1 px-2 text-center font-bold w-20">{activeStudentReport.attendance.alpa} Hari</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section D: Catatan Wali Kelas */}
            <div className="border border-black p-2.5">
              <p className="font-bold mb-1">D. Catatan Wali Kelas:</p>
              <p className="italic leading-relaxed">
                "{getStudentHomeroomNote(activeStudentReport.studentId, activeStudentReport.name)}"
              </p>
            </div>

            {/* Semester Decision */}
            <div className="border border-black p-2 bg-slate-50 text-center font-bold">
              {selectedSemester === 'Genap'
                ? `Keputusan: Berdasarkan pencapaian seluruh tujuan pembelajaran, peserta didik dinyatakan: NAIK KE KELAS ${currentClass.grade === 'X' ? 'XI (Sebelas)' : 'XII (Dua Belas)'}.`
                : `Keputusan: Peserta didik memenuhi target capaian kompetensi Semester Ganjil dan melanjutkan ke Semester Genap.`}
            </div>
          </div>
        )}
      </PrintModal>

      {/* PRINT MODAL: LEGER NILAI SEMESTER (F4 FORMAT) */}
      <PrintModal
        isOpen={printLegerOpen}
        onClose={() => setPrintLegerOpen(false)}
        title="Cetak Buku Leger Nilai Semester (Format F4 Folio)"
        documentTitle={`LEGER NILAI HASIL BELAJAR SEMESTER ${selectedSemester.toUpperCase()}`}
        documentNumber={`421.6 / LEGER / ${currentClass.name.replace(/\s+/g, '')} / 2024`}
        leftSignerTitle="Kepala Sekolah"
        leftSignerName={profile.principalName}
        leftSignerNip={profile.principalNip}
        rightSignerTitle="Wali Kelas"
        rightSignerName={currentUser.role === 'wali_kelas' ? currentUser.name : (currentClass.homeroomTeacherName || 'Budi Santoso, S.Si.')}
        rightSignerNip={currentUser.role === 'wali_kelas' ? (currentUser.nipOrNisn || '19820311 200801 1 007') : '19820311 200801 1 007'}
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 font-semibold border-b border-black pb-2">
            <div>
              <p>Rombel / Kelas: <strong>{currentClass.name} ({currentClass.major})</strong></p>
              <p>Wali Kelas: <strong>{currentClass.homeroomTeacherName || currentUser.name}</strong></p>
            </div>
            <div className="text-right">
              <p>Tahun Pelajaran: <strong>{selectedYear}</strong></p>
              <p>Semester: <strong>{selectedSemester}</strong></p>
            </div>
          </div>

          <table className="w-full border-collapse border border-black text-[10px]">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-black py-1 px-1 text-center w-6">No</th>
                <th className="border border-black py-1 px-1 text-center w-16">NISN</th>
                <th className="border border-black py-1 px-2 text-left">Nama Peserta Didik</th>
                <th className="border border-black py-1 px-1 text-center w-6">L/P</th>
                {classSubjects.map((sub) => (
                  <th key={sub.id} className="border border-black py-1 px-1 text-center font-mono w-8" title={sub.name}>
                    {sub.code || sub.name.substring(0, 3)}
                  </th>
                ))}
                <th className="border border-black py-1 px-1 text-center font-bold w-10">Total</th>
                <th className="border border-black py-1 px-1 text-center font-bold w-10">Rerata</th>
                <th className="border border-black py-1 px-1 text-center font-bold w-8">Rank</th>
                <th className="border border-black py-1 px-1 text-center w-5">S</th>
                <th className="border border-black py-1 px-1 text-center w-5">I</th>
                <th className="border border-black py-1 px-1 text-center w-5">A</th>
              </tr>
            </thead>
            <tbody>
              {rankedGradeBook.map((row) => (
                <tr key={row.studentId}>
                  <td className="border border-black py-0.5 px-1 text-center font-mono">{row.rank}</td>
                  <td className="border border-black py-0.5 px-1 text-center font-mono">{row.nisn}</td>
                  <td className="border border-black py-0.5 px-2 font-semibold">{row.name}</td>
                  <td className="border border-black py-0.5 px-1 text-center">{row.gender}</td>
                  {row.subjectGrades.map((sg) => (
                    <td key={sg.subjectId} className="border border-black py-0.5 px-1 text-center font-mono">
                      {sg.score}
                    </td>
                  ))}
                  <td className="border border-black py-0.5 px-1 text-center font-mono font-bold">{row.totalScore}</td>
                  <td className="border border-black py-0.5 px-1 text-center font-mono font-bold">{row.averageScore}</td>
                  <td className="border border-black py-0.5 px-1 text-center font-mono font-bold">#{row.rank}</td>
                  <td className="border border-black py-0.5 px-1 text-center font-mono">{row.attendance.sakit}</td>
                  <td className="border border-black py-0.5 px-1 text-center font-mono">{row.attendance.izin}</td>
                  <td className="border border-black py-0.5 px-1 text-center font-mono">{row.attendance.alpa}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between border-t border-black pt-1 font-semibold text-xs">
            <span>Jumlah Siswa: {rankedGradeBook.length}</span>
            <span>Rata-Rata Kelas: {rankedGradeBook.length > 0 ? Math.round(rankedGradeBook.reduce((acc, r) => acc + r.averageScore, 0) / rankedGradeBook.length) : 0}</span>
          </div>
        </div>
      </PrintModal>

      {/* MODAL: KELOLA EKSTRAKURIKULER (KHUSUS WALI KELAS) */}
      {isExtraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {editingExtraId ? 'Ubah Data Ekstrakurikuler' : 'Tambah Ekstrakurikuler Siswa Binaan'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Khusus Wali Kelas {currentClass.name} untuk Rapor Hasil Belajar Kurikulum Merdeka
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExtraModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExtra} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Pilih Peserta Didik (Kelas {currentClass.name})
                </label>
                <select
                  required
                  value={extraForm.studentId}
                  onChange={(e) => {
                    const found = classStudents.find((s) => s.id === e.target.value);
                    setExtraForm({
                      ...extraForm,
                      studentId: e.target.value,
                      studentName: found?.name || '',
                    });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                >
                  {classStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (NISN: {s.nisn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Nama Kegiatan Ekstrakurikuler
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pramuka (Wajib), Paskibra, PMR, Rohis, Basket, Futsal, Robotik, KIR"
                  value={extraForm.activityName}
                  onChange={(e) => setExtraForm({ ...extraForm, activityName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Predikat Capaian
                </label>
                <select
                  value={extraForm.predicate}
                  onChange={(e) => setExtraForm({ ...extraForm, predicate: e.target.value as ExtracurricularPredicate })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer font-semibold"
                >
                  <option value="Sangat Baik">Sangat Baik (A)</option>
                  <option value="Baik">Baik (B)</option>
                  <option value="Cukup">Cukup (C)</option>
                  <option value="Kurang">Kurang (D)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Deskripsi / Keterangan Capaian Kompetensi
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Contoh: Sangat aktif memimpin regu, berdisiplin tinggi dalam baris-berbaris dan kegiatan perkemahan."
                  value={extraForm.description}
                  onChange={(e) => setExtraForm({ ...extraForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white leading-relaxed"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsExtraModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Ekstrakurikuler</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
