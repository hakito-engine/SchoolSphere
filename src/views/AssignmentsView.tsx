import React, { useState } from 'react';
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
} from 'lucide-react';

export const AssignmentsView: React.FC = () => {
  const { currentUser } = useAuth();
  const [rawAssignments, setRawAssignments] = useState<Assignment[]>(() => DataService.getAssignments());
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>(() => DataService.getSubmissions());
  const classes = DataService.getClasses();
  const allSubjects = DataService.getSubjects();

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
  // Strict rule: Only Guru Mata Pelajaran pengampu can create & grade assignments. Super Admin & Wali Kelas are in Mode Pantau.
  const canCreateAssignment = currentUser.role === 'guru';
  const canGrade =
    currentUser.role === 'guru' &&
    activeAssignment &&
    (activeAssignment.teacherId === currentUser.id ||
      currentUser.assignedSubjectIds?.includes(activeAssignment.subjectId));

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

  // Print Modal
  const [printModalOpen, setPrintModalOpen] = useState(false);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Tugas & Penilaian Pembelajaran
          </h2>
          <p className="text-xs text-slate-500">
            Pemberian tugas terstruktur, pengumpulan lembar kerja, penilaian rubrik, dan rekapitulasi nilai rapor.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak Rekap Nilai</span>
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
            Mode Pantau Super Admin (Read-Only): Anda dapat memantau seluruh penugasan dan capaian nilai di semua kelas. Pembuatan tugas dan penginputan nilai secara mandiri dilakukan oleh Guru Mata Pelajaran pengampu.
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
                      Daftar Pengumpulan Siswa ({currentSubmissions.length} Terkumpul)
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
                                <button
                                  onClick={() => {
                                    setGradingSubmission(sub);
                                    setGradeScore(sub.score || 85);
                                    setGradeFeedback(sub.feedback || '');
                                  }}
                                  className="px-3 py-1.5 rounded bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium cursor-pointer"
                                >
                                  {sub.score !== undefined ? 'Ubah Nilai' : 'Beri Nilai'}
                                </button>
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

      {/* Modal Buat Tugas */}
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
                  placeholder="Contoh: Tugas Mandiri 2: Dinamika Gerak Hukum Newton"
                  value={newAsgData.title || ''}
                  onChange={(e) => setNewAsgData({ ...newAsgData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Kelas
                  </label>
                  <select
                    value={newAsgData.classId || ''}
                    onChange={(e) => setNewAsgData({ ...newAsgData, classId: e.target.value })}
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
                    value={newAsgData.subjectId || ''}
                    onChange={(e) => setNewAsgData({ ...newAsgData, subjectId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                  >
                    {teacherSubjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Petunjuk & Soal Tugas
                </label>
                <textarea
                  rows={3}
                  required
                  value={newAsgData.description || ''}
                  onChange={(e) => setNewAsgData({ ...newAsgData, description: e.target.value })}
                  placeholder="Jelaskan instruksi tugas dan kriteria pengumpulan..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Tenggat Pengumpulan
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="2024-10-30 23:59"
                    value={newAsgData.deadline || ''}
                    onChange={(e) => setNewAsgData({ ...newAsgData, deadline: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Catatan Rubrik
                  </label>
                  <input
                    type="text"
                    value={newAsgData.rubricNotes || ''}
                    onChange={(e) => setNewAsgData({ ...newAsgData, rubricNotes: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
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
                  {editingAssignment ? 'Simpan Perubahan Tugas' : 'Publikasikan Tugas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Penilaian / Grading */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
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

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
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
            </form>
          </div>
        </div>
      )}

      {/* Print Modal Rekap Nilai */}
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
