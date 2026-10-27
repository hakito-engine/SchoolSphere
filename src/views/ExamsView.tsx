import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { OnlineExam, ExamQuestion, ExamSubmission } from '../types';
import { PrintModal } from '../components/common/PrintModal';
import {
  Laptop,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Play,
  RotateCcw,
  Printer,
  Plus,
  Send,
  Award,
  Trash2,
  Edit2,
  Users,
  ShieldAlert,
} from 'lucide-react';

export const ExamsView: React.FC = () => {
  const { currentUser } = useAuth();
  const [examsList, setExamsList] = useState<OnlineExam[]>(() => DataService.getExams());
  const classes = DataService.getClasses();
  const allSubjects = DataService.getSubjects();
  const students = DataService.getStudents();

  const teachers = DataService.getTeachers();

  // Resolve current student profile if user is a student
  const currentStudent = students.find(
    (s) =>
      s.id === currentUser.id ||
      s.id === currentUser.id.replace('usr-siswa-', 'std-') ||
      s.id === currentUser.id.replace('usr-std-', 'std-') ||
      s.id === currentUser.id.replace('usr-siswa-', '') ||
      (s.nisn && s.nisn === currentUser.nipOrNisn) ||
      (currentUser.name && s.name.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) ||
      s.name.toLowerCase().replace(/[^a-z0-9]/g, '') === currentUser.username?.toLowerCase().replace(/[^a-z0-9]/g, '')
  );
  const effectiveStudentId = currentStudent?.id || currentUser.id;

  // Completed exams state (Requirement 2: Cegah pengerjaan ulang setelah selesai dikerjakan)
  const [completedExamIds, setCompletedExamIds] = useState<string[]>(() => {
    return Array.from(
      new Set([
        ...DataService.getCompletedExamIds(effectiveStudentId, currentUser.name),
        ...DataService.getCompletedExamIds(currentUser.id, currentUser.name),
      ])
    );
  });

  // Filter exams:
  // - Peserta Didik: STRICTLY only exams for their registered class!
  // - If exam is remedial (isRemedial: true), visible if student is marked/targeted
  // - Guru: only exams for their assigned subjects
  const exams = examsList.filter((ex) => {
    if (currentUser.role === 'siswa') {
      const matchClass = !ex.classId || ex.classId === currentUser.classId;
      if (!matchClass) return false;
      if (ex.isRemedial) {
        const studentIdsToCheck = [
          effectiveStudentId,
          currentUser.id,
          currentUser.id.replace('usr-siswa-', 'std-'),
          currentStudent?.id,
          currentStudent?.nisn,
          currentStudent?.nis,
        ].filter(Boolean) as string[];

        const isTarget =
          ex.targetStudentIds?.some((id) => studentIdsToCheck.includes(id)) ||
          (currentStudent && ex.targetStudentIds?.some((id) =>
            id.toLowerCase() === currentStudent.name.toLowerCase()
          ));
        return !!isTarget;
      }
      return true;
    }
    if (currentUser.role === 'guru') {
      return (
        ex.teacherId === currentUser.id ||
        currentUser.assignedSubjectIds?.includes(ex.subjectId)
      );
    }
    return true;
  });

  // Interactive CBT Exam State
  const [activeExam, setActiveExam] = useState<OnlineExam | null>(null);
  const [isTakingExam, setIsTakingExam] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(45 * 60);
  const [examResult, setExamResult] = useState<{ score: number; total: number } | null>(null);

  // Print modal state for CBT Results
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedExamForPrint, setSelectedExamForPrint] = useState<OnlineExam | null>(null);

  // Create Exam / Remedial Modal state for teachers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formClassId, setFormClassId] = useState(classes[0]?.id || 'cls-xmipa1');
  const [formSubjectId, setFormSubjectId] = useState(allSubjects[0]?.id || 'sub-mat-10');
  const [formDuration, setFormDuration] = useState(45);
  const [formType, setFormType] = useState<'Kuis Harian' | 'Penilaian Tengah Semester' | 'Penilaian Akhir Semester' | 'Remedial CBT'>('Kuis Harian');
  const [formIsRemedial, setFormIsRemedial] = useState(false);
  const [formTargetStudentIds, setFormTargetStudentIds] = useState<string[]>([]);

  // Question Builder State (Requirement 10: input soal pilihan ganda & uraian beserta bobot/poin)
  const [formQuestions, setFormQuestions] = useState<ExamQuestion[]>([
    {
      id: 'q-init-1',
      type: 'pilihan_ganda',
      prompt: 'Contoh Soal Pilihan Ganda: Jelaskan pemahaman konsep dasar materi ini!',
      points: 25,
      options: [
        'A. Konsep bersifat tetap dan terdefinisi',
        'B. Konsep bersifat relatif terhadap kondisi',
        'C. Konsep memerlukan verifikasi empiris',
        'D. Semua pernyataan di atas benar',
      ],
      correctOptionIndex: 3,
    },
    {
      id: 'q-init-2',
      type: 'esai',
      prompt: 'Contoh Soal Uraian: Uraikan langkah-langkah penyelesaian masalah serta argumen ilmiahnya secara terstruktur!',
      points: 25,
      correctAnswerText: 'Kriteria: Sistematika analisis, kejelasan langkah, dan ketepatan kesimpulan akhir.',
    },
  ]);
  const [newQType, setNewQType] = useState<'pilihan_ganda' | 'esai'>('pilihan_ganda');
  const [newQPrompt, setNewQPrompt] = useState('');
  const [newQPoints, setNewQPoints] = useState<number>(20);
  const [newQOptions, setNewQOptions] = useState<string[]>([
    'Pilihan Jawaban A',
    'Pilihan Jawaban B',
    'Pilihan Jawaban C',
    'Pilihan Jawaban D',
  ]);
  const [newQCorrectOpt, setNewQCorrectOpt] = useState<number>(0);
  const [newQRubricText, setNewQRubricText] = useState('');

  // Notification
  const [notice, setNotice] = useState<string | null>(null);

  // CBT Timer
  useEffect(() => {
    if (!isTakingExam || timeLeftSeconds <= 0) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isTakingExam, timeLeftSeconds]);

  const isExamExpired = (endDateStr: string): boolean => {
    if (!endDateStr) return false;
    const iso = endDateStr.includes(':') ? endDateStr.replace(' ', 'T') : `${endDateStr}T23:59:59`;
    const d = new Date(iso);
    return !isNaN(d.getTime()) && new Date() > d;
  };

  const handleStartExam = (exam: OnlineExam) => {
    // If exam has already passed its deadline, students cannot work on it
    if (currentUser.role === 'siswa' && isExamExpired(exam.endDate)) {
      alert(`Waktu pengerjaan ujian/kuis ini telah melewati batas deadline (${exam.endDate}) dan sesi telah ditutup. Ujian tidak dapat dikerjakan lagi.`);
      return;
    }

    // If exam has already been completed, prevent retake (Requirement 2)
    const isAlreadyDone =
      completedExamIds.includes(exam.id) ||
      DataService.getCompletedExamIds(effectiveStudentId, currentUser.name).includes(exam.id) ||
      DataService.getCompletedExamIds(currentUser.id, currentUser.name).includes(exam.id);

    if (isAlreadyDone) {
      alert('Soal Ujian CBT ini telah selesai Anda kerjakan dan nilai telah tercatat di sistem. Ujian tidak dapat dikerjakan ulang untuk menjaga integritas nilai.');
      return;
    }

    setActiveExam(exam);
    setIsTakingExam(true);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setTimeLeftSeconds(exam.durationMinutes * 60);
    setExamResult(null);
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmitExam = () => {
    if (!activeExam) return;

    let totalEarned = 0;
    activeExam.questions.forEach((q) => {
      const ans = userAnswers[q.id];
      if (q.type === 'pilihan_ganda' || q.type === 'benar_salah') {
        if (ans !== undefined && ans === q.correctOptionIndex) {
          totalEarned += q.points;
        }
      } else if (q.type === 'isian') {
        if (ans && q.correctAnswerText && ans.toString().trim().toLowerCase() === q.correctAnswerText.trim().toLowerCase()) {
          totalEarned += q.points;
        }
      } else {
        if (ans && ans.length > 5) {
          totalEarned += q.points;
        }
      }
    });

    setExamResult({ score: totalEarned, total: activeExam.totalPoints });
    setIsTakingExam(false);

    // Save exam submission and mark as completed so it cannot be retaken
    DataService.saveExamSubmission(
      {
        id: 'exsub-' + Date.now(),
        examId: activeExam.id,
        studentId: effectiveStudentId,
        studentName: currentUser.name,
        answers: userAnswers,
        score: totalEarned,
        completedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'selesai',
      },
      { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    );

    DataService.markExamCompleted(currentUser.id, activeExam.id, totalEarned);
    DataService.markExamCompleted(effectiveStudentId, activeExam.id, totalEarned);

    const freshCompleted = Array.from(
      new Set([
        ...completedExamIds,
        activeExam.id,
        ...DataService.getCompletedExamIds(effectiveStudentId, currentUser.name),
        ...DataService.getCompletedExamIds(currentUser.id, currentUser.name),
      ])
    );
    setCompletedExamIds(freshCompleted);
  };

  const handleDeleteExam = (examId: string, title: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus ujian CBT "${title}"?`)) {
      DataService.deleteExam(examId, {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      });
      setExamsList(DataService.getExams());
      setNotice(`Paket ujian CBT "${title}" berhasil dihapus.`);
      setTimeout(() => setNotice(null), 3500);
    }
  };

  const handleAddQuestionToForm = () => {
    if (!newQPrompt.trim()) {
      alert('Mohon ketikkan pertanyaan / teks soal terlebih dahulu.');
      return;
    }
    const qItem: ExamQuestion = {
      id: 'q-' + Date.now(),
      type: newQType,
      prompt: newQPrompt.trim(),
      points: Number(newQPoints) || 10,
      options: newQType === 'pilihan_ganda' ? [...newQOptions] : undefined,
      correctOptionIndex: newQType === 'pilihan_ganda' ? newQCorrectOpt : undefined,
      correctAnswerText: newQType === 'esai' ? newQRubricText.trim() : undefined,
    };
    setFormQuestions((prev) => [...prev, qItem]);
    setNewQPrompt('');
    setNewQRubricText('');
    setNewQPoints(20);
  };

  const handleRemoveQuestionFromForm = (id: string) => {
    setFormQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleCreateExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const targetClass = classes.find((c) => c.id === formClassId) || classes[0];
    const targetSubject = allSubjects.find((s) => s.id === formSubjectId) || allSubjects[0];

    // Ensure there is at least one question
    const questionsToSave = formQuestions.length > 0 ? formQuestions : [
      {
        id: 'q1-' + Date.now(),
        type: 'pilihan_ganda' as const,
        prompt: `Soal 1 (${targetSubject.name}): Evaluasi konsep inti dan penerapan kaidah materi dalam pemecahan masalah.`,
        points: 50,
        options: [
          'Pernyataan A: Nilai besaran selalu konstan dan berbanding lurus',
          'Pernyataan B: Nilai besaran dipengaruhi oleh variabel kontrol',
          'Pernyataan C: Nilai fungsi terdefinisi pada selang real tertutup',
          'Pernyataan D: Semua pernyataan benar sesuai konteks',
        ],
        correctOptionIndex: 2,
      },
      {
        id: 'q2-' + Date.now(),
        type: 'esai' as const,
        prompt: 'Soal 2 (Uraian): Tuliskan dan uraikan kesimpulan analitis secara lengkap dan terstruktur!',
        points: 50,
        correctAnswerText: 'Kriteria Penilaian: Kejelasan konsep, langkah matematis, dan kesimpulan logis.',
      },
    ];

    const computedTotalPoints = questionsToSave.reduce((acc, q) => acc + (q.points || 0), 0);

    const newExam: OnlineExam = {
      id: 'exam-' + Date.now(),
      title: formTitle.trim(),
      classId: targetClass.id,
      className: targetClass.name,
      subjectId: targetSubject.id,
      subjectName: targetSubject.name,
      teacherId: currentUser.id,
      type: formIsRemedial ? 'Remedial CBT' : formType,
      durationMinutes: Number(formDuration) || 45,
      startDate: new Date().toISOString().substring(0, 10),
      endDate: new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10),
      totalPoints: computedTotalPoints,
      published: true,
      isRemedial: formIsRemedial,
      targetStudentIds: formIsRemedial ? formTargetStudentIds : undefined,
      questions: questionsToSave,
    };

    DataService.saveExam(newExam, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });

    setExamsList(DataService.getExams());
    setIsCreateModalOpen(false);
    setFormTitle('');
    setFormIsRemedial(false);
    setFormTargetStudentIds([]);
    setNotice(
      formIsRemedial
        ? `Paket soal Remedial CBT "${newExam.title}" (${questionsToSave.length} nomor soal, total ${computedTotalPoints} poin) berhasil diterbitkan khusus untuk peserta didik remedial!`
        : `Paket soal CBT "${newExam.title}" (${questionsToSave.length} nomor soal, total ${computedTotalPoints} poin) berhasil dibuat dan dipublikasikan.`
    );
    setTimeout(() => setNotice(null), 4000);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const activeQuestion = activeExam ? activeExam.questions[currentQuestionIndex] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Ujian & Kuis Online (Computer Based Test - CBT)
          </h2>
          <p className="text-xs text-slate-500">
            Penilaian formatif dan sumatif digital, timer interaktif, pengacakan soal, dan penilaian otomatis.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(['guru', 'super_admin', 'wakasek_kurikulum'].includes(currentUser.role)) && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Ujian / Remedial CBT</span>
            </button>
          )}

          {/* Requirement 4: Peserta Didik tidak bisa melihat Lembar Nilai CBT */}
          {currentUser.role !== 'siswa' && (
            <button
              onClick={() => {
                setSelectedExamForPrint(exams[0] || examsList[0] || null);
                setPrintModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Cetak Lembar Nilai CBT</span>
            </button>
          )}
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {currentUser.role === 'siswa' && (
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200 text-xs rounded-lg flex items-center gap-2">
          <Laptop className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            Menampilkan jadwal ujian dan kuis online (CBT) khusus untuk kelas Anda ({currentUser.classId?.replace('cls-', '').toUpperCase()}). Anda hanya dapat mengakses paket soal terdaftar untuk kelas Anda demi integritas asesmen.
          </span>
        </div>
      )}

      {currentUser.role === 'wali_kelas' && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs rounded-lg flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Mode Pemantauan Wali Kelas: Anda dapat memantau jadwal dan hasil CBT kelas binaan Anda. Paket soal dan kunci jawaban dikelola oleh Guru Mata Pelajaran pengampu.
          </span>
        </div>
      )}

      {/* CBT ACTIVE RUNNER */}
      {isTakingExam && activeExam && activeQuestion && (
        <div className="rounded-2xl border-2 border-indigo-500 bg-white dark:bg-slate-900 p-6 shadow-lg space-y-6 animate-in fade-in">
          {/* CBT Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                Sedang Mengerjakan CBT
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {activeExam.title}
              </h3>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-mono font-bold text-sm">
                <Clock className="w-4 h-4 animate-pulse" />
                <span>Sisa Waktu: {formatTimer(timeLeftSeconds)}</span>
              </div>
              <button
                onClick={handleSubmitExam}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm cursor-pointer"
              >
                Selesaikan Ujian
              </button>
            </div>
          </div>

          {/* Question Navigator Numbers */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 mr-2">Nomor Soal:</span>
            {activeExam.questions.map((q, idx) => {
              const isAnswered = userAnswers[q.id] !== undefined;
              const isCurrent = idx === currentQuestionIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                      : isAnswered
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Active Question Box */}
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase">
                Soal Nomor {currentQuestionIndex + 1} ({activeQuestion.points} Poin)
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                Tipe: {activeQuestion.type.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
              {activeQuestion.prompt}
            </p>

            {/* Answer Controls based on Type */}
            {(activeQuestion.type === 'pilihan_ganda' || activeQuestion.type === 'benar_salah') && (
              <div className="space-y-2 pt-2">
                {activeQuestion.options?.map((opt, optIndex) => {
                  const isChecked = userAnswers[activeQuestion.id] === optIndex;
                  return (
                    <label
                      key={optIndex}
                      onClick={() => handleAnswerChange(activeQuestion.id, optIndex)}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 font-bold text-slate-900 dark:text-white'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-100/80 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${activeQuestion.id}`}
                        checked={isChecked}
                        onChange={() => {}}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {activeQuestion.type === 'isian' && (
              <div className="pt-2">
                <input
                  type="text"
                  placeholder="Ketikkan jawaban isian singkat Anda di sini..."
                  value={userAnswers[activeQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(activeQuestion.id, e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {activeQuestion.type === 'esai' && (
              <div className="pt-2">
                <textarea
                  rows={4}
                  placeholder="Tuliskan uraian dan penjelasan komprehensif Anda..."
                  value={userAnswers[activeQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(activeQuestion.id, e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>
            )}
          </div>

          {/* Prev and Next */}
          <div className="flex items-center justify-between">
            <button
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
            >
              Sebelumnya
            </button>

            {currentQuestionIndex < activeExam.questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
              >
                Selanjutnya
              </button>
            ) : (
              <button
                onClick={handleSubmitExam}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              >
                Kirim Lembar Jawaban
              </button>
            )}
          </div>
        </div>
      )}

      {/* RESULT MODAL BANNER */}
      {examResult && (
        <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 space-y-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-emerald-600 shrink-0" />
            <h3 className="text-base font-bold">
              Ujian CBT Telah Selesai Dikerjakan!
            </h3>
          </div>
          <p className="text-xs text-emerald-800 dark:text-emerald-300">
            Hasil pengerjaan Anda telah diperiksa oleh mesin CBT otomatis dan disimpan ke rekap nilai akademik.
          </p>
          <div className="inline-flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Skor Perolehan:
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-600">
              {examResult.score} / {examResult.total}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              {examResult.score >= 75 ? 'TUNTAS (Memenuhi KKM)' : 'REMEDIAL'}
            </span>
          </div>
        </div>
      )}

      {/* List of Available Exams */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exams.map((ex) => {
          const isCompleted =
            completedExamIds.includes(ex.id) ||
            DataService.getCompletedExamIds(effectiveStudentId, currentUser.name).includes(ex.id) ||
            DataService.getCompletedExamIds(currentUser.id, currentUser.name).includes(ex.id);

          const studentScore = isCompleted
            ? (DataService.getStudentExamScore(effectiveStudentId, ex.id, currentUser.name) ??
               DataService.getStudentExamScore(currentUser.id, ex.id, currentUser.name))
            : undefined;
          const canManage = ['guru', 'super_admin', 'wakasek_kurikulum'].includes(currentUser.role);

          return (
            <div
              key={ex.id}
              className={`p-5 rounded-xl bg-white dark:bg-slate-900 border transition-shadow shadow-2xs space-y-3 ${
                ex.isRemedial
                  ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/20 dark:bg-amber-950/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {ex.type}
                  </span>
                  {ex.isRemedial && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                      REMEDIAL CBT
                    </span>
                  )}
                  {isExamExpired(ex.endDate) && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-rose-600" />
                      WAKTU BERAKHIR
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono text-[11px]">
                    {ex.questions.length} Butir Soal
                  </span>
                  {canManage && (
                    <button
                      onClick={() => handleDeleteExam(ex.id, ex.title)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Hapus Ujian CBT"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {ex.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {ex.subjectName} · {ex.className}
                </p>
                {ex.isRemedial && ex.targetStudentIds && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold mt-1">
                    Ditujukan khusus untuk {ex.targetStudentIds.length} siswa remedial terdaftar.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>Durasi: <strong>{ex.durationMinutes} Menit</strong></span>
                <span>Bobot Nilai: <strong>{ex.totalPoints} Poin</strong></span>
                <span>Mulai: {ex.startDate}</span>
                <span className={isExamExpired(ex.endDate) ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
                  Selesai: {ex.endDate} {isExamExpired(ex.endDate) ? '(Lewat)' : ''}
                </span>
              </div>

              <div className="pt-2">
                {isCompleted ? (
                  <div className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Ujian Selesai Dikerjakan {studentScore !== undefined ? `(Skor: ${studentScore}/${ex.totalPoints})` : ''} · Tidak Dapat Diulangi
                    </span>
                  </div>
                ) : isExamExpired(ex.endDate) && currentUser.role === 'siswa' ? (
                  <div className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Ditutup · Melewati Batas Waktu ({ex.endDate})</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleStartExam(ex)}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{currentUser.role === 'siswa' ? 'Kerjakan Ujian CBT Sekarang' : 'Simulasikan / Kerjakan Ujian CBT'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: BUAT SOAL / UJIAN REMEDIAL CBT (Dengan fitur scrolling penuh) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Laptop className="w-4 h-4 text-indigo-600" />
                <span>Buat Paket Soal CBT / Remedial Baru</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExamSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Judul Ujian / Kuis
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Remedial CBT: Persamaan Linear Satu Variabel"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Rombongan Belajar
                  </label>
                  <select
                    value={formClassId}
                    onChange={(e) => {
                      setFormClassId(e.target.value);
                      setFormTargetStudentIds([]);
                    }}
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
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Mata Pelajaran
                  </label>
                  <select
                    value={formSubjectId}
                    onChange={(e) => setFormSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {allSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Durasi Pengerjaan (Menit)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={180}
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Jenis Asesmen
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Kuis Harian">Kuis Harian</option>
                    <option value="Penilaian Tengah Semester">Penilaian Tengah Semester (PTS)</option>
                    <option value="Penilaian Akhir Semester">Penilaian Akhir Semester (PAS)</option>
                    <option value="Remedial CBT">Remedial CBT</option>
                  </select>
                </div>
              </div>

              {/* Checkbox: Remedial Mode */}
              <div className="p-3.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-900 dark:text-amber-200">
                  <input
                    type="checkbox"
                    checked={formIsRemedial}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormIsRemedial(checked);
                      if (checked) {
                        setFormType('Remedial CBT');
                      }
                    }}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Jadikan Soal Remedial Khusus (Hanya Ditujukan ke Peserta Didik Tertentu)</span>
                </label>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  Jika opsi ini dicentang, paket ujian ini HANYA akan muncul di dashboard peserta didik yang dipilih di bawah. Peserta didik lain yang sudah tuntas tidak akan melihat paket ini.
                </p>

                {formIsRemedial && (
                  <div className="mt-2 pt-2 border-t border-amber-200 dark:border-amber-800/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Pilih Peserta Didik yang Remedial ({formTargetStudentIds.length} dipilih):
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const classStudents = students.filter((s) => s.classId === formClassId);
                          if (formTargetStudentIds.length === classStudents.length) {
                            setFormTargetStudentIds([]);
                          } else {
                            setFormTargetStudentIds(classStudents.map((s) => s.id));
                          }
                        }}
                        className="text-indigo-600 hover:underline font-bold cursor-pointer"
                      >
                        {formTargetStudentIds.length === students.filter((s) => s.classId === formClassId).length
                          ? 'Batalkan Semua'
                          : 'Pilih Semua'}
                      </button>
                    </div>

                    <div className="max-h-36 overflow-y-auto space-y-1 p-2 rounded border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900">
                      {students
                        .filter((s) => s.classId === formClassId)
                        .map((st) => {
                          const isChecked = formTargetStudentIds.includes(st.id);
                          return (
                            <label
                              key={st.id}
                              className="flex items-center justify-between p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setFormTargetStudentIds((prev) => prev.filter((id) => id !== st.id));
                                    } else {
                                      setFormTargetStudentIds((prev) => [...prev, st.id]);
                                    }
                                  }}
                                  className="w-3.5 h-3.5 rounded text-indigo-600"
                                />
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                  {st.name}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                NISN: {st.nisn}
                              </span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              {/* Requirement 10: Form Input Soal-Soal CBT (Pilihan Ganda & Uraian + Bobot/Poin per Nomor) */}
              <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Laptop className="w-4 h-4 text-indigo-600" />
                      <span>Form Input Soal CBT & Bobot Nilai</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Input butir soal pilihan ganda atau soal uraian esai beserta penentuan poin/bobot tiap nomor.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-md bg-indigo-600 text-white shadow-2xs">
                      Total: {formQuestions.reduce((acc, q) => acc + (q.points || 0), 0)} Poin ({formQuestions.length} Soal)
                    </span>
                  </div>
                </div>

                {/* Sub-form input soal baru */}
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-indigo-100 dark:border-indigo-800/80 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Bentuk / Tipe Soal
                      </label>
                      <select
                        value={newQType}
                        onChange={(e) => setNewQType(e.target.value as 'pilihan_ganda' | 'esai')}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      >
                        <option value="pilihan_ganda">Pilihan Ganda (PG)</option>
                        <option value="esai">Soal Uraian (Esai)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Bobot / Poin Nomor Ini
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={newQPoints}
                        onChange={(e) => setNewQPoints(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-xs"
                        placeholder="Contoh: 20"
                      />
                    </div>

                    <div className="sm:self-end">
                      <button
                        type="button"
                        onClick={handleAddQuestionToForm}
                        className="w-full px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambahkan Butir Soal</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Teks Soal / Pertanyaan
                    </label>
                    <textarea
                      rows={2}
                      value={newQPrompt}
                      onChange={(e) => setNewQPrompt(e.target.value)}
                      placeholder="Ketikkan rumusan pertanyaan atau instruksi soal..."
                      className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    ></textarea>
                  </div>

                  {newQType === 'pilihan_ganda' ? (
                    <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                        Pilihan Jawaban & Tandai Kunci Jawaban Benar:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {newQOptions.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className={`flex items-center gap-2 p-1.5 rounded border ${
                              newQCorrectOpt === optIdx
                                ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40'
                                : 'border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name="correctOptionRadio"
                              checked={newQCorrectOpt === optIdx}
                              onChange={() => setNewQCorrectOpt(optIdx)}
                              className="text-emerald-600 focus:ring-emerald-500"
                              title="Pilih sebagai kunci jawaban benar"
                            />
                            <span className="font-bold text-[11px] text-slate-500 w-4">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const updated = [...newQOptions];
                                updated[optIdx] = e.target.value;
                                setNewQOptions(updated);
                              }}
                              className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-transparent"
                              placeholder={`Opsi ${String.fromCharCode(65 + optIdx)}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Pedoman Penskoran / Kata Kunci Jawaban Soal Uraian
                      </label>
                      <input
                        type="text"
                        value={newQRubricText}
                        onChange={(e) => setNewQRubricText(e.target.value)}
                        placeholder="Kriteria penilaian esai (misal: analisis lengkap, sistematika runtut, kesimpulan logis)..."
                        className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  )}
                </div>

                {/* List of Questions Added */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                    Daftar Butir Soal Terdaftar ({formQuestions.length} Nomor):
                  </span>
                  {formQuestions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-900 dark:text-white">
                            No. {idx + 1}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              q.type === 'pilihan_ganda'
                                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            }`}
                          >
                            {q.type === 'pilihan_ganda' ? 'Pilihan Ganda' : 'Soal Uraian'}
                          </span>
                          <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            Bobot: {q.points} Poin
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 line-clamp-2">
                          {q.prompt}
                        </p>
                        {q.type === 'pilihan_ganda' && q.options && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Kunci: Pilihan {String.fromCharCode(65 + (q.correctOptionIndex || 0))} ({q.options[q.correctOptionIndex || 0]})
                          </p>
                        )}
                        {q.type === 'esai' && q.correctAnswerText && (
                          <p className="text-[10px] text-slate-400 mt-0.5 italic">
                            Pedoman: {q.correctAnswerText}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestionFromForm(q.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                        title="Hapus butir soal ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs"
                >
                  Terbitkan Ujian CBT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Requirement 5: Yang bertanda tangan di Lembar Nilai CBT adalah masing-masing guru mata pelajaran */}
      {(() => {
        const targetExam = selectedExamForPrint || exams[0] || examsList[0];
        const teacherOfExam = teachers.find(
          (t) =>
            t.id === targetExam?.teacherId ||
            t.subjectNames?.includes(targetExam?.subjectName || '') ||
            (currentUser.role === 'guru' && (t.id === currentUser.id || t.name === currentUser.name))
        ) || (currentUser.role === 'guru' ? { name: currentUser.name, nip: currentUser.nipOrNisn || '19850620 200902 2 005' } : { name: 'Ratna Safitri, M.Pd.', nip: '19850620 200902 2 005' });

        const rightTeacherName = currentUser.role === 'guru' ? currentUser.name : (teacherOfExam.name || 'Ratna Safitri, M.Pd.');
        const rightTeacherNip = currentUser.role === 'guru' ? (currentUser.nipOrNisn || teacherOfExam.nip) : (teacherOfExam.nip || '19850620 200902 2 005');

        const examClassStudents = students.filter((s) => !targetExam?.classId || s.classId === targetExam.classId);

        return (
          <PrintModal
            isOpen={printModalOpen && currentUser.role !== 'siswa'}
            onClose={() => setPrintModalOpen(false)}
            title="Cetak Rekap Hasil Ujian CBT"
            documentTitle="LEMBAR REKAPITULASI HASIL COMPUTER BASED TEST (CBT)"
            documentNumber={`421.7 / CBT / ${targetExam?.className.replace(/\s+/g, '') || 'SMA-NU'} / X / 2024`}
            rightSignerTitle="Guru Mata Pelajaran"
            rightSignerName={rightTeacherName}
            rightSignerNip={rightTeacherNip}
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-semibold border-b border-black pb-2">
                <div>
                  <p>Paket Ujian: <strong>{targetExam?.title}</strong></p>
                  <p>Mata Pelajaran: <strong>{targetExam?.subjectName}</strong></p>
                </div>
                <div className="text-right">
                  <p>Kelas / Rombel: <strong>{targetExam?.className}</strong></p>
                  <p>Guru Pengampu: <strong>{rightTeacherName}</strong></p>
                </div>
              </div>

              <table className="w-full border-collapse border border-black text-xs">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-black py-2 px-2 text-center w-8">No</th>
                    <th className="border border-black py-2 px-3 text-left">Nama Peserta Didik</th>
                    <th className="border border-black py-2 px-2 text-center w-28">NISN</th>
                    <th className="border border-black py-2 px-2 text-center w-20">Skor CBT</th>
                    <th className="border border-black py-2 px-2 text-center w-28">Status KKM (75)</th>
                  </tr>
                </thead>
                <tbody>
                  {examClassStudents.map((st, idx) => {
                    const recordedScore = DataService.getStudentExamScore(st.id, targetExam?.id || '');
                    const defaultScore = st.gpa >= 85 ? 100 : st.gpa >= 75 ? 85 : 50;
                    const finalScore = recordedScore !== undefined ? recordedScore : defaultScore;
                    const isPassed = finalScore >= 75;

                    return (
                      <tr key={st.id}>
                        <td className="border border-black py-1 px-2 text-center font-mono">{idx + 1}</td>
                        <td className="border border-black py-1 px-3 font-semibold">{st.name}</td>
                        <td className="border border-black py-1 px-2 text-center font-mono">{st.nisn}</td>
                        <td className="border border-black py-1 px-2 text-center font-mono font-bold">
                          {finalScore}
                        </td>
                        <td className="border border-black py-1 px-2 text-center font-bold">
                          {isPassed ? (
                            <span className="text-emerald-800">TUNTAS</span>
                          ) : (
                            <span className="text-rose-800">REMEDIAL</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </PrintModal>
        );
      })()}
    </div>
  );
};
