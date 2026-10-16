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

  // Completed exams state for student
  const [completedExamIds, setCompletedExamIds] = useState<string[]>(() => {
    return currentUser.role === 'siswa' ? DataService.getCompletedExamIds(currentUser.id) : [];
  });

  // Filter exams:
  // - Siswa: STRICTLY only exams for their registered class!
  // - If exam is remedial (isRemedial: true), ONLY visible if currentUser.id is in targetStudentIds!
  // - Guru: only exams for their assigned subjects
  const exams = examsList.filter((ex) => {
    if (currentUser.role === 'siswa') {
      const matchClass = !ex.classId || ex.classId === currentUser.classId;
      if (!matchClass) return false;
      if (ex.isRemedial) {
        return ex.targetStudentIds?.includes(currentUser.id);
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

  // Print modal
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Create Exam / Remedial Modal state for teachers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formClassId, setFormClassId] = useState(classes[0]?.id || 'cls-xmipa1');
  const [formSubjectId, setFormSubjectId] = useState(allSubjects[0]?.id || 'sub-mat-10');
  const [formDuration, setFormDuration] = useState(45);
  const [formType, setFormType] = useState<'Kuis Harian' | 'Penilaian Tengah Semester' | 'Penilaian Akhir Semester' | 'Remedial CBT'>('Kuis Harian');
  const [formIsRemedial, setFormIsRemedial] = useState(false);
  const [formTargetStudentIds, setFormTargetStudentIds] = useState<string[]>([]);

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

  const handleStartExam = (exam: OnlineExam) => {
    // If student has already completed this exam, prevent retake
    if (currentUser.role === 'siswa' && completedExamIds.includes(exam.id)) {
      alert('Ujian CBT ini telah selesai dikerjakan dan tidak dapat diulangi.');
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
        studentId: currentUser.id,
        studentName: currentUser.name,
        answers: userAnswers,
        score: totalEarned,
        completedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'selesai',
      },
      { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    );

    setCompletedExamIds(DataService.getCompletedExamIds(currentUser.id));
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

  const handleCreateExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const targetClass = classes.find((c) => c.id === formClassId) || classes[0];
    const targetSubject = allSubjects.find((s) => s.id === formSubjectId) || allSubjects[0];

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
      totalPoints: 100,
      published: true,
      isRemedial: formIsRemedial,
      targetStudentIds: formIsRemedial ? formTargetStudentIds : undefined,
      questions: [
        {
          id: 'q1-' + Date.now(),
          type: 'pilihan_ganda',
          prompt: `Soal 1 (${targetSubject.name}): Evaluasi konsep inti dan penerapan teorema dalam pemecahan masalah. Manakah pernyataan berikut yang paling tepat?`,
          points: 50,
          options: [
            'Pernyataan A: Nilai besaran selalu konstan dan berbanding lurus',
            'Pernyataan B: Nilai besaran dipengaruhi oleh variabel kontrol',
            'Pernyataan C: Nilai fungsi terdefinisi pada selang real tertutup',
            'Pernyataan D: Tidak ada relasi yang valid',
          ],
          correctOptionIndex: 2,
        },
        {
          id: 'q2-' + Date.now(),
          type: 'isian',
          prompt: 'Soal 2: Tuliskan istilah baku untuk nilai minimum yang harus dicapai peserta didik untuk dinyatakan tuntas dalam kurikulum!',
          points: 50,
          correctAnswerText: 'KKM',
        },
      ],
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
        ? `Paket soal Remedial CBT "${newExam.title}" berhasil diterbitkan khusus untuk ${formTargetStudentIds.length} siswa terpilih!`
        : `Paket soal CBT "${newExam.title}" berhasil dibuat dan dipublikasikan.`
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

          <button
            onClick={() => setPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak Lembar Nilai CBT</span>
          </button>
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
          const isCompleted = currentUser.role === 'siswa' && completedExamIds.includes(ex.id);
          const studentScore = isCompleted ? DataService.getStudentExamScore(currentUser.id, ex.id) : undefined;
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
                <span>Selesai: {ex.endDate}</span>
              </div>

              <div className="pt-2">
                {isCompleted ? (
                  <div className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Ujian Selesai Dikerjakan {studentScore !== undefined ? `(Skor: ${studentScore}/${ex.totalPoints})` : ''} · Tidak Dapat Diulangi
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleStartExam(ex)}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Simulasikan / Kerjakan Ujian CBT</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: BUAT SOAL / UJIAN REMEDIAL CBT */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 my-8">
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
                  <span>Jadikan Soal Remedial Khusus (Hanya Ditujukan ke Siswa Tertentu)</span>
                </label>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  Jika opsi ini dicentang, paket ujian ini HANYA akan muncul di dashboard siswa yang dipilih di bawah. Siswa lain yang sudah tuntas tidak akan melihat paket ini.
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

      {/* Print Modal CBT Results */}
      <PrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        title="Cetak Rekap Hasil Ujian CBT"
        documentTitle="LEMBAR REKAPITULASI HASIL COMPUTER BASED TEST (CBT)"
        documentNumber="421.7 / CBT / SMA-NU / X / 2024"
        leftSignerTitle="Koordinator CBT & Asesmen"
        leftSignerName="Ratna Safitri, M.Pd."
        leftSignerNip="19850620 200902 2 005"
      >
        <div className="space-y-4">
          <div className="flex justify-between text-xs font-semibold">
            <span>Ujian: Kuis Harian 1: Konsep Nilai Mutlak</span>
            <span>Mata Pelajaran: Matematika Wajib</span>
            <span>Kelas: X MIPA 1</span>
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
              <tr>
                <td className="border border-black py-1 px-2 text-center font-mono">1</td>
                <td className="border border-black py-1 px-3 font-semibold">Ahmad Fauzi</td>
                <td className="border border-black py-1 px-2 text-center font-mono">0078129481</td>
                <td className="border border-black py-1 px-2 text-center font-mono font-bold">100</td>
                <td className="border border-black py-1 px-2 text-center font-bold text-emerald-800">TUNTAS</td>
              </tr>
              <tr>
                <td className="border border-black py-1 px-2 text-center font-mono">2</td>
                <td className="border border-black py-1 px-3 font-semibold">Cantika Dewi Putri</td>
                <td className="border border-black py-1 px-2 text-center font-mono">0075512903</td>
                <td className="border border-black py-1 px-2 text-center font-mono font-bold">100</td>
                <td className="border border-black py-1 px-2 text-center font-bold text-emerald-800">TUNTAS</td>
              </tr>
              <tr>
                <td className="border border-black py-1 px-2 text-center font-mono">3</td>
                <td className="border border-black py-1 px-3 font-semibold">Dewa Bagus Pratama</td>
                <td className="border border-black py-1 px-2 text-center font-mono">0072314980</td>
                <td className="border border-black py-1 px-2 text-center font-mono font-bold">50</td>
                <td className="border border-black py-1 px-2 text-center font-bold text-rose-800">REMEDIAL</td>
              </tr>
            </tbody>
          </table>
        </div>
      </PrintModal>
    </div>
  );
};
