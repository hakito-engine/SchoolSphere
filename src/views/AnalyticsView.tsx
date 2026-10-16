import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { PrintModal } from '../components/common/PrintModal';
import {
  LineChart,
  TrendingUp,
  AlertTriangle,
  Award,
  Users,
  Printer,
  CheckCircle2,
  Filter,
  Layers,
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { currentUser } = useAuth();
  const students = DataService.getStudents();
  const classes = DataService.getClasses();
  const subjects = DataService.getSubjects();
  const profile = DataService.getSchoolProfile();

  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Calculate stats
  const totalStudents = students.length;
  const atRiskStudents = students.filter(
    (s) => s.attendance.alpa >= 3 || s.gpa < 75
  );

  const subjectAverages = [
    { name: 'Matematika Wajib', avg: 86.4, kkm: 75, passRate: 94 },
    { name: 'Fisika', avg: 82.8, kkm: 75, passRate: 88 },
    { name: 'Kimia', avg: 84.1, kkm: 75, passRate: 91 },
    { name: 'Bahasa Indonesia', avg: 89.5, kkm: 78, passRate: 98 },
    { name: 'Bahasa Inggris', avg: 85.0, kkm: 75, passRate: 92 },
    { name: 'Biologi', avg: 87.2, kkm: 75, passRate: 95 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Smart Academic Analytics & Early Warning System
          </h2>
          <p className="text-xs text-slate-500">
            Analitik capaian KKM sekolah, tren absensi prediktif, dan deteksi dini intervensi pendampingan siswa.
          </p>
        </div>

        <button
          onClick={() => setPrintModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          <span>Cetak Laporan Analitik</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">Rerata Ketuntasan KKM</span>
          <p className="text-2xl font-bold text-emerald-600 font-mono tabular-nums mt-1">
            93.0%
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Target Dinas: &ge; 85%</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">Rasio Kehadiran Sekolah</span>
          <p className="text-2xl font-bold text-indigo-600 font-mono tabular-nums mt-1">
            96.8%
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Sakit: 1.8% · Alpa: 0.5%</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">Siswa Early Alert</span>
          <p className="text-2xl font-bold text-rose-600 font-mono tabular-nums mt-1">
            {atRiskStudents.length} Siswa
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Perlu pendampingan BK</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">Ketercapaian Jurnal Guru</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
            92.5%
          </p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Tervalidasi Kepala Sekolah</p>
        </div>
      </div>

      {/* Analytics Bars: Subject Mastery */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Distribusi Capaian Rata-Rata Nilai per Mata Pelajaran
          </h3>
          <p className="text-xs text-slate-500">
            Perbandingan rerata perolehan nilai siswa terhadap ambang batas KKM minimum kurikulum.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {subjectAverages.map((sub) => (
            <div key={sub.name} className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {sub.name} (KKM: {sub.kkm})
                </span>
                <span className="font-mono text-slate-600 dark:text-slate-400">
                  Rata-rata: <strong>{sub.avg}</strong> · Ketuntasan: <strong>{sub.passRate}%</strong>
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(sub.avg / 100) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Early Support Alert List */}
      <div className="p-5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Daftar Deteksi Dini: Siswa Butuh Dukungan (Early Support Alert)
            </h3>
            <p className="text-xs text-slate-500">
              Sistem menandai secara objektif siswa yang memerlukan pendampingan akademik atau pemanggilan orang tua.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                <th className="py-2.5 px-3">Nama Siswa</th>
                <th className="py-2.5 px-3">Kelas</th>
                <th className="py-2.5 px-3">Indikator Masalah</th>
                <th className="py-2.5 px-3">Data Kontak Wali</th>
                <th className="py-2.5 px-3 text-center">Status Rekomendasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {atRiskStudents.map((std) => (
                <tr key={std.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                    {std.name}
                  </td>
                  <td className="py-2.5 px-3">{std.className}</td>
                  <td className="py-2.5 px-3 font-medium text-rose-600">
                    Alpa {std.attendance.alpa} hari · Nilai rata-rata {std.gpa} (di bawah KKM)
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                    {std.parentName} ({std.parentPhone})
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                      Rujuk Guru BK
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Modal */}
      <PrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        title="Cetak Laporan Analitik Akademik"
        documentTitle="LAPORAN ANALITIK KINERJA AKADEMIK DAN PREVENTIF"
        documentNumber="421.9 / ANL / SMA-NU / X / 2024"
        rightSignerTitle="Wakil Kepala Sekolah Bidang Kurikulum"
        rightSignerName={profile.vicePrincipalCurriculumName || 'Dra. Hj. Nurul Hidayati, M.Pd.'}
        rightSignerNip={profile.vicePrincipalCurriculumNip || '19790815 200501 2 006'}
      >
        <div className="space-y-4 text-xs">
          <p className="leading-relaxed">
            Berdasarkan kompilasi data presensi, jurnal mengajar, tugas, dan asesmen CBT semester ganjil, disampaikan ikhtisar analitik mutu akademik sebagai berikut:
          </p>

          <table className="w-full border-collapse border border-black text-xs">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-black py-2 px-2 text-center w-10">No</th>
                <th className="border border-black py-2 px-3 text-left">Mata Pelajaran</th>
                <th className="border border-black py-2 px-2 text-center w-20">KKM</th>
                <th className="border border-black py-2 px-2 text-center w-24">Rerata Sekolah</th>
                <th className="border border-black py-2 px-2 text-center w-24">Ketuntasan</th>
              </tr>
            </thead>
            <tbody>
              {subjectAverages.map((s, i) => (
                <tr key={s.name}>
                  <td className="border border-black py-1 px-2 text-center font-mono">{i + 1}</td>
                  <td className="border border-black py-1 px-3 font-semibold">{s.name}</td>
                  <td className="border border-black py-1 px-2 text-center font-mono">{s.kkm}</td>
                  <td className="border border-black py-1 px-2 text-center font-mono font-bold">{s.avg}</td>
                  <td className="border border-black py-1 px-2 text-center font-mono">{s.passRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="p-3 border border-black text-xs">
            <span className="font-bold">Catatan Evaluasi Mutu: </span>
            <span>Tingkat ketuntasan rata-rata seluruh mata pelajaran mencapai 93.0%. Siswa yang teridentifikasi dalam Early Support Alert telah ditindaklanjuti secara kolaboratif oleh Wali Kelas dan Guru BK melalui program remedial dan konseling.</span>
          </div>
        </div>
      </PrintModal>
    </div>
  );
};
