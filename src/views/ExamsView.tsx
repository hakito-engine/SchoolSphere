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
} from 'lucide-react';

export const ExamsView: React.FC = () => {
  const { currentUser } = useAuth();
  const rawExams = DataService.getExams();

  // Filter exams:
  // - Siswa: STRICTLY only exams for their registered class
  // - Guru: only exams for their assigned subjects
  const exams = rawExams.filter((ex) => {
    if (currentUser.role === 'siswa') {
      return ex.classId === currentUser.classId;
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

  // CBT Timer
  useEffect(() => {
    if (!isTakingExam || timeLeftSeconds <= 0) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isTakingExam, timeLeftSeconds]);

  const handleStartExam = (exam: OnlineExam) => {
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
        // Essay gets full points in simulation demo
        if (ans && ans.length > 5) {
          totalEarned += q.points;
        }
      }
    });

    setExamResult({ score: totalEarned, total: activeExam.totalPoints });
    setIsTakingExam(false);

    DataService.logAction(
      { id: currentUser.id, name: currentUser.name, role: currentUser.role },
      'FINISH_EXAM',
      'Ujian Online CBT',
      `Menyelesaikan ${activeExam.title} dengan skor ${totalEarned}/${activeExam.totalPoints}`
    );
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

        <button
          onClick={() => setPrintModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          <span>Cetak Lembar Nilai CBT</span>
        </button>
      </div>

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
        {exams.map((ex) => (
          <div
            key={ex.id}
            className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                {ex.type}
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                {ex.questions.length} Butir Soal
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {ex.title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {ex.subjectName} · {ex.className}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Durasi: <strong>{ex.durationMinutes} Menit</strong></span>
              <span>Bobot Nilai: <strong>{ex.totalPoints} Poin</strong></span>
              <span>Mulai: {ex.startDate}</span>
              <span>Selesai: {ex.endDate}</span>
            </div>

            <div className="pt-2">
              <button
                onClick={() => handleStartExam(ex)}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Simulasikan / Kerjakan Ujian CBT</span>
              </button>
            </div>
          </div>
        ))}
      </div>

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
