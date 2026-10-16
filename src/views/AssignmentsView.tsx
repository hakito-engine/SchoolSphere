import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { Assignment, AssignmentSubmission } from '../types';
import { PrintModal } from '../components/common/PrintModal';
import {
  GraduationCap,
  Plus,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  UploadCloud,
  Send,
  Award,
  Filter,
  Edit2,
  Trash2,
  Table,
  Check,
  X,
  RotateCcw,
} from 'lucide-react';

export const AssignmentsView: React.FC = () => {
  const { currentUser } = useAuth();
  const [rawAssignments, setRawAssignments] = useState<Assignment[]>(() => DataService.getAssignments());
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>(() => DataService.getSubmissions());
  const classes = DataService.getClasses();
  const allSubjects = DataService.getSubjects();
  const profile = DataService.getSchoolProfile();

  // Filter accessible subjects for teacher
  const teacherSubjects = currentUser.role === 'guru'
    ? allSubjects.filter(
        (s) =>
          s.teacherId === currentUser.id ||
          currentUser.assignedSubjectIds?.includes(s.id)
      )
    : allSubjects;

  // Filter assignments based on role:
  // - Siswa: STRICTLY only their registered class!
  // - Guru: only their subjects/assignments
  // - Wali kelas: only their homeroom class (read-only)
  const assignments = rawAssignments.filter((a) => {
    if (currentUser.role === 'siswa') {
      return a.classId === currentUser.classId;
    }
    if (currentUser.role === 'guru') {
      return (
        a.teacherId === currentUser.id ||
        currentUser.assignedSubjectIds?.includes(a.subjectId)
      );
    }
    if (currentUser.role === 'wali_kelas') {
      return a.classId === currentUser.classId;
    }
    return true;
  });

  // Selected assignment for reviewing submissions
  const [activeAssignmentId, setActiveAssignmentId] = useState<string>(assignments[0]?.id || '');
  const activeAssignment = assignments.find((a) => a.id === activeAssignmentId) || assignments[0];

  // KKM for the active assignment
  const activeSubject = allSubjects.find((s) => s.id === activeAssignment?.subjectId);
  const currentKKM = activeSubject?.kkm || 75;

  const currentSubmissions = submissions.filter((s) => s.assignmentId === activeAssignment?.id);

  // Permissions:
  // Guru Mata Pelajaran pengampu can create & edit assignments. Kepala Sekolah & Guru can grade/supervise.
  // Super Admin is strictly Read-Only as per requirements!
  const canCreateAssignment = currentUser.role === 'guru';
  const canGrade = ['guru', 'kepala_sekolah'].includes(currentUser.role);

  // Modal: Add / Edit Assignment
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [newAsgData, setNewAsgData] = useState<Partial<Assignment>>({
    title: '',
    description: '',
    classId: classes[0]?.id || 'cls-xmipa1',
    subjectId: teacherSubjects[0]?.id || 'sub-mat-10',
    deadline: '2024-10-25 23:59',
    maxScore: 100,
    rubricNotes: 'Ketepatan konsep, kelengkapan aljabar, dan kerapian tulisan.',
  });

  const handleOpenAdd = () => {
    setEditingAssignment(null);
    setNewAsgData({
      title: '',
      description: '',
      classId: classes[0]?.id || 'cls-xmipa1',
      subjectId: teacherSubjects[0]?.id || 'sub-mat-10',
      deadline: '2024-10-30 23:59',
      maxScore: 100,
      rubricNotes: 'Ketepatan konsep, kelengkapan aljabar, dan kerapian tulisan.',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (asg: Assignment) => {
    setEditingAssignment(asg);
    setNewAsgData({ ...asg });
    setIsAddModalOpen(true);
  };

  const handleDeleteAssignment = (id: string, title: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus tugas pembelajaran "${title}"?`)) {
      DataService.deleteAssignment(id, {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      });
      const updated = DataService.getAssignments();
      setRawAssignments(updated);
      if (activeAssignmentId === id) {
        setActiveAssignmentId(updated[0]?.id || '');
      }
    }
  };

  // Modal: Grading
  const [gradingSubmission, setGradingSubmission] = useState<AssignmentSubmission | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(85);
  const [gradeFeedback, setGradeFeedback] = useState<string>('');

  // Modal: Student Submission form
  const [studentAnswerText, setStudentAnswerText] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Print Modals
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Rekap Penilaian Guru Mapel States
  const [recapModalOpen, setRecapModalOpen] = useState(false);
  const [recapClassId, setRecapClassId] = useState(classes[0]?.id || 'cls-xmipa1');
  const [recapSubjectId, setRecapSubjectId] = useState(teacherSubjects[0]?.id || allSubjects[0]?.id || 'sub-mat-10');
  const [recapPrintModalOpen, setRecapPrintModalOpen] = useState(false);

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsgData.title || !newAsgData.description) return;

    const targetClass = classes.find((c) => c.id === newAsgData.classId);
    const targetSubject = allSubjects.find((s) => s.id === newAsgData.subjectId);

    const payload: Assignment = {
      id: editingAssignment ? editingAssignment.id : 'asg-' + Date.now(),
      title: newAsgData.title,
      description: newAsgData.description,
      classId: newAsgData.classId || 'cls-xmipa1',
      className: targetClass?.name || 'X MIPA 1',
      subjectId: newAsgData.subjectId || 'sub-mat-10',
      subjectName: targetSubject?.name || 'Matematika Wajib',
      teacherId: editingAssignment ? editingAssignment.teacherId : currentUser.id,
      teacherName: editingAssignment ? editingAssignment.teacherName : currentUser.name,
      deadline: newAsgData.deadline || '2024-10-30 23:59',
      maxScore: 100,
      submissionCount: editingAssignment ? editingAssignment.submissionCount : 0,
      published: true,
      rubricNotes: newAsgData.rubricNotes,
    };

    DataService.saveAssignment(payload, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });

    setRawAssignments(DataService.getAssignments());
    setIsAddModalOpen(false);
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission || !canGrade) return;

    DataService.gradeSubmission(gradingSubmission.id, Number(gradeScore), gradeFeedback, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });

    setSubmissions(DataService.getSubmissions());
    setGradingSubmission(null);
  };

  const handleResetGrade = (subId: string, studentName: string) => {
    if (confirm(`Hapus nilai tugas siswa "${studentName}"? Status nilai akan kembali menjadi 'Belum Dinilai'.`)) {
      DataService.resetSubmissionGrade(subId, {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      });
      setSubmissions(DataService.getSubmissions());
      if (gradingSubmission && gradingSubmission.id === subId) {
        setGradingSubmission(null);
      }
    }
  };

  const handleDeleteSubmissionItem = (subId: string, studentName: string) => {
    if (confirm(`Hapus berkas pengumpulan tugas dari siswa "${studentName}"? Siswa dapat mengunggah ulang tugasnya.`)) {
      DataService.deleteSubmission(subId, {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      });
      setSubmissions(DataService.getSubmissions());
      if (gradingSubmission && gradingSubmission.id === subId) {
        setGradingSubmission(null);
      }
    }
  };

  const handleStudentSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentAnswerText) return;

    const payload: AssignmentSubmission = {
      id: 'subm-' + Date.now(),
      assignmentId: activeAssignmentId,
      studentId: currentUser.id,
      studentName: currentUser.name,
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      content: studentAnswerText,
      fileName: `Lembar_Jawaban_${currentUser.name.replace(/\s+/g, '_')}.pdf`,
      status: 'pending',
    };

    DataService.submitAssignmentAnswer(payload, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });

    setSubmissions(DataService.getSubmissions());
    setStudentAnswerText('');
    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 3000);
  };

  const isStudent = currentUser.role === 'siswa';
  const mySubmission = submissions.find(
    (s) => s.assignmentId === activeAssignmentId && s.studentId === currentUser.id
  );

  // Computation for the Full Rekap Penilaian Guru Mapel Table
  const recapData = useMemo(() => {
    const targetClass = classes.find((c) => c.id === recapClassId);
    const targetSubject = allSubjects.find((s) => s.id === recapSubjectId);
    const classStudents = DataService.getStudents().filter((s) => s.classId === recapClassId);
    const subjectAssignments = rawAssignments.filter(
      (a) => a.classId === recapClassId && a.subjectId === recapSubjectId
    );
    const kkm = targetSubject?.kkm || 75;

    const rows = classStudents.map((st, idx) => {
      let totalScore = 0;
      let gradedCount = 0;

      const asgScores = subjectAssignments.map((asg) => {
        const sub = submissions.find(
          (sb) => sb.assignmentId === asg.id && sb.studentId === st.id
        );
        const score = sub?.score;
        if (score !== undefined) {
          totalScore += score;
          gradedCount++;
        }
        return {
          asgId: asg.id,
          asgTitle: asg.title,
          score,
        };
      });

      const averageScore = gradedCount > 0 ? Math.round(totalScore / gradedCount) : 0;
      const isPassing = averageScore >= kkm;
      const predicate =
        averageScore >= 90
          ? 'A (Sangat Baik)'
          : averageScore >= 80
          ? 'B (Baik)'
          : isPassing
          ? 'C (Cukup)'
          : 'D (Perlu Bimbingan)';

      return {
        no: idx + 1,
        studentId: st.id,
        nisn: st.nisn,
        nis: st.nis,
        name: st.name,
        asgScores,
        averageScore,
        isPassing,
        predicate,
      };
    });

    const passedCount = rows.filter((r) => r.isPassing).length;
    const remedialCount = rows.length - passedCount;
    const classAvg = rows.length > 0 ? Math.round(rows.reduce((acc, r) => acc + r.averageScore, 0) / rows.length) : 0;

    return {
      targetClass,
      targetSubject,
      subjectAssignments,
      kkm,
      rows,
      passedCount,
      remedialCount,
      classAvg,
    };
  }, [recapClassId, recapSubjectId, rawAssignments, submissions, classes, allSubjects]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Tugas & Penilaian Pembelajaran
          </h2>
          <p className="text-xs text-slate-500">
            Pemberian tugas terstruktur, pengumpulan lembar kerja, penginputan nilai, edit & hapus penilaian, serta rekapitulasi penilaian siap cetak.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Fitur Rekap Penilaian Guru Mapel Siap Cetak (Hanya Guru, Kepala Sekolah & Wali Kelas - Siswa dilarang) */}
          {!isStudent && (
            <button
              onClick={() => setRecapModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors cursor-pointer"
              title="Buka Tabel Rekapitulasi Penilaian Guru Mata Pelajaran Format Resmi"
            >
              <Table className="w-4 h-4 text-indigo-600" />
              <span>Tabel Rekap Penilaian Guru Mapel (Siap Cetak)</span>
            </button>
          )}

          <button
            onClick={() => setPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak Tugas Ini</span>
          </button>

          {canCreateAssignment && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Tugas Baru</span>
            </button>
          )}
        </div>
      </div>

      {currentUser.role === 'super_admin' && (
        <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200 text-xs rounded-lg flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-600 shrink-0" />
          <span>
            Mode Pantau Super Admin (Hanya Baca): Pengelolaan pembuatan tugas, penilaian, dan rekap nilai menjadi kewenangan Guru Mata Pelajaran pengampu dan supervisi Kepala Sekolah.
          </span>
        </div>
      )}

      {currentUser.role === 'wali_kelas' && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs rounded-lg flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Mode Pemantauan Wali Kelas (Hanya Baca): Anda memantau progres tugas dan nilai siswa kelas binaan Anda. Penilaian dan pemberian tugas merupakan kewenangan Guru Mata Pelajaran pengampu.
          </span>
        </div>
      )}

      {currentUser.role === 'siswa' && (
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200 text-xs rounded-lg flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            Menampilkan tugas dan lembar kerja aktif khusus untuk kelas Anda. Kumpulkan lembar jawaban tepat waktu sebelum batas tenggat pengumpulan.
          </span>
        </div>
      )}

      {/* Main Grid: Assignment Selector & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List of Assignments */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Daftar Tugas Aktif ({assignments.length})
          </h3>
          <div className="space-y-2">
            {assignments.map((asg) => {
              const isSelected = asg.id === activeAssignmentId;
              return (
                <button
                  key={asg.id}
                  onClick={() => setActiveAssignmentId(asg.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {asg.subjectName} · {asg.className}
                    </span>
                    <span className="text-slate-400 font-mono">Max: {asg.maxScore}</span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                    {asg.title}
                  </h4>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Tenggat: {asg.deadline}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Assignment Detail & Submissions */}
        <div className="lg:col-span-2 space-y-4">
          {activeAssignment && (
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                      {activeAssignment.subjectName}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-mono">
                      KKM Mapel: {currentKKM}
                    </span>
                    <span className="text-xs text-slate-500">
                      Kelas: <strong>{activeAssignment.className}</strong>
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500">
                      Guru: <strong>{activeAssignment.teacherName}</strong>
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {activeAssignment.title}
                  </h3>
                </div>

                {canGrade && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(activeAssignment)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                      title="Ubah Penugasan"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Ubah</span>
                    </button>
                    <button
                      onClick={() => handleDeleteAssignment(activeAssignment.id, activeAssignment.title)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 cursor-pointer transition-colors"
                      title="Hapus Penugasan"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Hapus</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs">
                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Petunjuk Pengerjaan:
                </p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {activeAssignment.description}
                </p>
                {activeAssignment.rubricNotes && (
                  <p className="text-slate-500 text-[11px] mt-2 italic">
                    Rubrik Penilaian: {activeAssignment.rubricNotes} · Patokan Ketuntasan: Skor Minimal {currentKKM}
                  </p>
                )}
              </div>

              {/* View for Siswa */}
              {isStudent && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2">
                    Status Pengumpulan Tugas Saya
                  </h4>

                  {mySubmission ? (
                    <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Telah Dikumpulkan ({mySubmission.submittedAt})
                        </span>
                        {mySubmission.score !== undefined && (
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-300">
                              Skor: {mySubmission.score} / 100
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                mySubmission.score >= currentKKM
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                              }`}
                            >
                              {mySubmission.score >= currentKKM ? 'Tuntas KKM' : 'Remedial (< KKM)'}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">
                        {mySubmission.content}
                      </p>
                      {mySubmission.feedback && (
                        <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900">
                          <span className="font-bold text-emerald-950 dark:text-emerald-300 block mb-0.5">
                            Umpan Balik Guru:
                          </span>
                          <span className="text-slate-600 dark:text-slate-400">
                            {mySubmission.feedback}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleStudentSubmitAnswer} className="space-y-3 text-xs">
                      {submitSuccess && (
                        <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-200">
                          Jawaban berhasil dikumpulkan!
                        </div>
                      )}
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                          Ketikkan Ringkasan Jawaban atau Konfirmasi Berkas
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={studentAnswerText}
                          onChange={(e) => setStudentAnswerText(e.target.value)}
                          placeholder="Tuliskan jawaban Anda atau keterangan lampiran file tugas..."
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                        ></textarea>
                      </div>
                      <button
                        type="submit"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Kirim Jawaban Tugas</span>
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* View for Guru & Admin: List of Submissions */}
              {!isStudent && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Daftar Pengumpulan & Penilaian Siswa ({currentSubmissions.length} Terkumpul)
                    </h4>
                  </div>

                  <div className="space-y-2 text-xs">
                    {currentSubmissions.length === 0 ? (
                      <p className="text-slate-400 text-center py-4">
                        Belum ada siswa yang mengumpulkan tugas ini.
                      </p>
                    ) : (
                      currentSubmissions.map((sub) => {
                        const isGraded = sub.score !== undefined;
                        const scoreVal = sub.score ?? 0;
                        const isPassing = isGraded && scoreVal >= currentKKM;
                        const predicate = !isGraded
                          ? '-'
                          : scoreVal >= 90
                          ? 'A (Sangat Baik)'
                          : scoreVal >= 80
                          ? 'B (Baik)'
                          : isPassing
                          ? 'C (Tuntas)'
                          : 'D (Perlu Bimbingan)';

                        return (
                          <div
                            key={sub.id}
                            className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap"
                          >
                            <div className="min-w-[200px]">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {sub.studentName}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  ({sub.submittedAt})
                                </span>
                              </div>
                              <p className="text-slate-600 dark:text-slate-400 text-[11px] line-clamp-1 mt-0.5">
                                {sub.content}
                              </p>
                              {sub.feedback && (
                                <p className="text-indigo-600 text-[11px] italic mt-0.5">
                                  Catatan: {sub.feedback}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {isGraded ? (
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                    {scoreVal} / 100
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                      isPassing
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                    }`}
                                  >
                                    {isPassing ? 'Tuntas' : `Remedial (< ${currentKKM})`} · {predicate.split(' ')[0]}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                                  Belum Dinilai
                                </span>
                              )}

                              {canGrade && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setGradingSubmission(sub);
                                      setGradeScore(sub.score !== undefined ? sub.score : 85);
                                      setGradeFeedback(sub.feedback || '');
                                    }}
                                    className="px-2.5 py-1 text-xs rounded bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium cursor-pointer"
                                  >
                                    {isGraded ? 'Ubah Nilai' : 'Beri Nilai'}
                                  </button>

                                  {isGraded && (
                                    <button
                                      onClick={() => handleResetGrade(sub.id, sub.studentName)}
                                      className="px-2 py-1 text-xs rounded border border-amber-200 text-amber-700 hover:bg-amber-50 cursor-pointer"
                                      title="Hapus Nilai (Reset menjadi Belum Dinilai)"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleDeleteSubmissionItem(sub.id, sub.studentName)}
                                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                    title="Hapus Berkas Pengumpulan"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: TABEL REKAP PENILAIAN MASING-MASING GURU MAPEL (SIAP CETAK) */}
      {recapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-5xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
                  <Award className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Tabel Rekap Penilaian Guru Mata Pelajaran
                  </h3>
                  <p className="text-slate-500 text-[11px]">
                    Rekapitulasi seluruh nilai tugas per rombel, perhitungan rerata, patokan KKM, dan status ketuntasan siap cetak.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRecapModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Filter Bar Rombel & Mapel */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Pilih Rombel:</span>
                  <select
                    value={recapClassId}
                    onChange={(e) => setRecapClassId(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.major})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Mata Pelajaran:</span>
                  <select
                    value={recapSubjectId}
                    onChange={(e) => setRecapSubjectId(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    {teacherSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (KKM: {s.kkm})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded border border-amber-200 dark:border-amber-800 font-bold">
                  Standar KKM: {recapData.kkm}
                </span>

                <button
                  type="button"
                  onClick={() => setRecapPrintModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Rekap Nilai Resmi (F4)</span>
                </button>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-4 gap-3 text-center text-xs">
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <span className="text-[10px] text-slate-400 block">Total Siswa</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white font-mono">{recapData.rows.length}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40">
                <span className="text-[10px] text-emerald-600 block">Tuntas KKM (&ge; {recapData.kkm})</span>
                <span className="font-bold text-sm text-emerald-700 dark:text-emerald-300 font-mono">{recapData.passedCount} Siswa</span>
              </div>
              <div className="p-2.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50/60 dark:bg-rose-950/40">
                <span className="text-[10px] text-rose-600 block">Remedial (&lt; {recapData.kkm})</span>
                <span className="font-bold text-sm text-rose-700 dark:text-rose-300 font-mono">{recapData.remedialCount} Siswa</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <span className="text-[10px] text-slate-400 block">Rata-Rata Rombel</span>
                <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400 font-mono">{recapData.classAvg} / 100</span>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0">
                  <tr>
                    <th className="py-2 px-2 text-center w-10">No</th>
                    <th className="py-2 px-3">NISN</th>
                    <th className="py-2 px-3">Nama Peserta Didik</th>
                    {recapData.subjectAssignments.map((asg, i) => (
                      <th key={asg.id} className="py-2 px-2 text-center font-mono text-[11px]" title={asg.title}>
                        T{i + 1}
                      </th>
                    ))}
                    <th className="py-2 px-2 text-center font-bold">Rerata</th>
                    <th className="py-2 px-2 text-center">KKM</th>
                    <th className="py-2 px-3 text-center">Status</th>
                    <th className="py-2 px-3 text-center">Predikat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recapData.rows.length === 0 ? (
                    <tr>
                      <td colSpan={6 + recapData.subjectAssignments.length} className="py-6 text-center text-slate-400">
                        Tidak ada siswa terdaftar di rombel ini.
                      </td>
                    </tr>
                  ) : (
                    recapData.rows.map((row) => (
                      <tr key={row.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-1.5 px-2 text-center font-mono">{row.no}</td>
                        <td className="py-1.5 px-3 font-mono text-[11px] text-slate-500">{row.nisn}</td>
                        <td className="py-1.5 px-3 font-semibold text-slate-900 dark:text-white">{row.name}</td>
                        {row.asgScores.map((sc, i) => (
                          <td key={i} className="py-1.5 px-2 text-center font-mono font-medium">
                            {sc.score !== undefined ? sc.score : <span className="text-slate-300">-</span>}
                          </td>
                        ))}
                        <td className="py-1.5 px-2 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {row.averageScore}
                        </td>
                        <td className="py-1.5 px-2 text-center font-mono text-slate-500">{recapData.kkm}</td>
                        <td className="py-1.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.isPassing
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200'
                            }`}
                          >
                            {row.isPassing ? 'TUNTAS' : 'REMEDIAL'}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-center font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          {row.predicate.split(' ')[0]}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setRecapModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Modal: Rekap Lengkap Guru Mapel (Format F4) */}
      <PrintModal
        isOpen={recapPrintModalOpen}
        onClose={() => setRecapPrintModalOpen(false)}
        title="Cetak Rekapitulasi Nilai Guru Mapel"
        documentTitle={`DAFTAR REKAPITULASI PENILAIAN MATA PELAJARAN`}
        documentNumber={`421.6 / NILAI / ${recapData.targetClass?.name.replace(/\s+/g, '') || 'ROMBEL'} / 2024`}
        leftSignerTitle="Guru Mata Pelajaran"
        leftSignerName={recapData.targetSubject?.teacherName || currentUser.name}
        leftSignerNip="19850620 200902 2 005"
        rightSignerTitle="Wakil Kepala Sekolah Bidang Kurikulum"
        rightSignerName={profile.vicePrincipalCurriculumName || 'Dra. Hj. Nurul Hidayati, M.Pd.'}
        rightSignerNip={profile.vicePrincipalCurriculumNip || '19790815 200501 2 006'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 text-xs font-semibold gap-1 border-b border-black pb-2">
            <div>
              <span>Mata Pelajaran: <strong>{recapData.targetSubject?.name}</strong></span>
              <br />
              <span>Kelas / Rombel: <strong>{recapData.targetClass?.name} ({recapData.targetClass?.major})</strong></span>
            </div>
            <div className="text-right">
              <span>KKM Mata Pelajaran: <strong>{recapData.kkm}</strong></span>
              <br />
              <span>Guru Pengampu: <strong>{recapData.targetSubject?.teacherName || currentUser.name}</strong></span>
            </div>
          </div>

          <table className="w-full border-collapse border border-black text-xs">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-black py-2 px-1 text-center w-8">No</th>
                <th className="border border-black py-2 px-2 text-left w-24">NISN</th>
                <th className="border border-black py-2 px-3 text-left">Nama Peserta Didik</th>
                {recapData.subjectAssignments.map((asg, i) => (
                  <th key={asg.id} className="border border-black py-2 px-1 text-center w-12 font-mono">
                    T{i + 1}
                  </th>
                ))}
                <th className="border border-black py-2 px-2 text-center w-16 font-bold">Rerata</th>
                <th className="border border-black py-2 px-2 text-center w-14">KKM</th>
                <th className="border border-black py-2 px-2 text-center w-20">Ketuntasan</th>
                <th className="border border-black py-2 px-2 text-center w-12">Predikat</th>
              </tr>
            </thead>
            <tbody>
              {recapData.rows.map((row) => (
                <tr key={row.studentId}>
                  <td className="border border-black py-1 px-1 text-center font-mono">{row.no}</td>
                  <td className="border border-black py-1 px-2 font-mono text-[11px]">{row.nisn}</td>
                  <td className="border border-black py-1 px-3 font-semibold">{row.name}</td>
                  {row.asgScores.map((sc, i) => (
                    <td key={i} className="border border-black py-1 px-1 text-center font-mono">
                      {sc.score !== undefined ? sc.score : '-'}
                    </td>
                  ))}
                  <td className="border border-black py-1 px-2 text-center font-mono font-bold">
                    {row.averageScore}
                  </td>
                  <td className="border border-black py-1 px-2 text-center font-mono">{recapData.kkm}</td>
                  <td className="border border-black py-1 px-2 text-center font-bold">
                    {row.isPassing ? 'TUNTAS' : 'REMEDIAL'}
                  </td>
                  <td className="border border-black py-1 px-2 text-center font-mono">
                    {row.predicate.split(' ')[0]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between text-xs pt-1 border-t border-black font-semibold">
            <span>Rata-Rata Kelas: {recapData.classAvg}</span>
            <span>Tuntas: {recapData.passedCount} Siswa</span>
            <span>Remedial: {recapData.remedialCount} Siswa</span>
          </div>
        </div>
      </PrintModal>

      {/* Modal Buat / Ubah Tugas */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              {editingAssignment ? 'Ubah Tugas Pembelajaran' : 'Buat Penugasan Siswa Baru'}
            </h3>
            <form onSubmit={handleCreateAssignment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Judul Tugas
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Latihan 3: Pembuktian Induksi Matematika"
                  value={newAsgData.title || ''}
                  onChange={(e) => setNewAsgData({ ...newAsgData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Kelas Sasaran
                  </label>
                  <select
                    value={newAsgData.classId}
                    onChange={(e) => setNewAsgData({ ...newAsgData, classId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
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
                    value={newAsgData.subjectId}
                    onChange={(e) => setNewAsgData({ ...newAsgData, subjectId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {teacherSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (KKM: {s.kkm})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Batas Waktu Pengumpulan (Deadline)
                </label>
                <input
                  type="text"
                  required
                  placeholder="YYYY-MM-DD HH:mm (Contoh: 2024-10-30 23:59)"
                  value={newAsgData.deadline || ''}
                  onChange={(e) => setNewAsgData({ ...newAsgData, deadline: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Instruksi & Lembar Soal
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Jelaskan petunjuk teknis pengerjaan tugas bagi siswa..."
                  value={newAsgData.description || ''}
                  onChange={(e) => setNewAsgData({ ...newAsgData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                ></textarea>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Rubrik Penilaian & Standar Ketuntasan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Skor 100 untuk langkah aljabar lengkap dan benar."
                  value={newAsgData.rubricNotes || ''}
                  onChange={(e) => setNewAsgData({ ...newAsgData, rubricNotes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer"
                >
                  {editingAssignment ? 'Simpan Perubahan' : 'Terbitkan Tugas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Beri / Ubah Nilai */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Penilaian & Umpan Balik Guru
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Siswa: <strong>{gradingSubmission.studentName}</strong>
            </p>

            <form onSubmit={handleSaveGrade} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Nilai Angka (Skala 0 - 100)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={gradeScore}
                  onChange={(e) => setGradeScore(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-base"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Umpan Balik / Catatan Konstruktif
                </label>
                <textarea
                  rows={3}
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  placeholder="Apresiasi atau arahan perbaikan kompetensi siswa..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                ></textarea>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                {gradingSubmission.score !== undefined ? (
                  <button
                    type="button"
                    onClick={() => handleResetGrade(gradingSubmission.id, gradingSubmission.studentName)}
                    className="text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
                  >
                    Hapus Nilai Ini
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setGradingSubmission(null)}
                    className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer"
                  >
                    Simpan Nilai
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Modal Single Tugas */}
      <PrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        title="Cetak Rekap Nilai Tugas"
        documentTitle={`DAFTAR REKAPITULASI NILAI TUGAS`}
        documentNumber="421.6 / ASG / SMA-NU / X / 2024"
        leftSignerTitle="Guru Mata Pelajaran"
        leftSignerName={activeAssignment?.teacherName || currentUser.name}
        leftSignerNip="19850620 200902 2 005"
      >
        <div className="space-y-4">
          <div className="flex justify-between text-xs font-semibold">
            <span>Tugas: {activeAssignment?.title}</span>
            <span>Mata Pelajaran: {activeAssignment?.subjectName}</span>
            <span>Kelas: {activeAssignment?.className}</span>
          </div>

          <table className="w-full border-collapse border border-black text-xs">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-black py-2 px-2 text-center w-8">No</th>
                <th className="border border-black py-2 px-3 text-left">Nama Peserta Didik</th>
                <th className="border border-black py-2 px-2 text-center w-24">Tanggal Kirim</th>
                <th className="border border-black py-2 px-2 text-center w-20">Nilai (0-100)</th>
                <th className="border border-black py-2 px-3 text-left">Umpan Balik Guru</th>
              </tr>
            </thead>
            <tbody>
              {currentSubmissions.map((sub, i) => (
                <tr key={sub.id}>
                  <td className="border border-black py-1 px-2 text-center font-mono">{i + 1}</td>
                  <td className="border border-black py-1 px-3 font-semibold">{sub.studentName}</td>
                  <td className="border border-black py-1 px-2 text-center font-mono text-[11px]">{sub.submittedAt}</td>
                  <td className="border border-black py-1 px-2 text-center font-mono font-bold">{sub.score ?? '-'}</td>
                  <td className="border border-black py-1 px-3 text-[11px]">{sub.feedback || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PrintModal>
    </div>
  );
};
