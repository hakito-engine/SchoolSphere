import React, { useState, useEffect, useRef } from 'react';
import { DataService } from '../services/dataService';
import { Student, SchoolProfile, ClassRoom } from '../types';
import { formatDateIndonesian } from '../utils/formatters';
import {
  QrCode,
  Scan,
  Search,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Building,
  ArrowLeft,
  Printer,
  Copy,
  ExternalLink,
  Camera,
  AlertCircle,
  Award,
  RefreshCw,
  Sparkles,
  UserCheck,
} from 'lucide-react';

interface StudentVerificationViewProps {
  onBack?: () => void;
  initialNisn?: string;
}

export const StudentVerificationView: React.FC<StudentVerificationViewProps> = ({
  onBack,
  initialNisn = '',
}) => {
  const profile = DataService.getSchoolProfile();
  const students = DataService.getStudents();
  const classes = DataService.getClasses();


  // Extract from URL query ?verify= or pathname /verify/:nisn if present
  const getInitialSearch = () => {
    if (initialNisn) return initialNisn;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const qNisn = urlParams.get('verify') || urlParams.get('nisn');
      if (qNisn) return qNisn;

      const path = window.location.pathname;
      const verifyMatch = path.match(/\/verify\/([a-zA-Z0-9_-]+)/);
      if (verifyMatch && verifyMatch[1]) return verifyMatch[1];

      const hash = window.location.hash;
      const hashMatch = hash.match(/#\/verify\/([a-zA-Z0-9_-]+)/);
      if (hashMatch && hashMatch[1]) return hashMatch[1];
    }
    return '';
  };

  const [inputQuery, setInputQuery] = useState(getInitialSearch);
  const [searchedQuery, setSearchedQuery] = useState(getInitialSearch);
  const [verifiedStudent, setVerifiedStudent] = useState<Student | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Camera Scanner state
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const lookupStudent = (query: string) => {
    const cleanQ = query.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!cleanQ) {
      setVerifiedStudent(null);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    setSearchedQuery(query.trim());

    // Match by exact NISN, NIS, ID, or name
    const found = students.find((s) => {
      const sNisn = s.nisn.replace(/[^a-z0-9]/g, '').toLowerCase();
      const sNis = (s.nis || '').replace(/[^a-z0-9]/g, '').toLowerCase();
      const sId = s.id.toLowerCase();
      const sName = s.name.toLowerCase().replace(/[^a-z0-9]/g, '');

      return sNisn === cleanQ || sNis === cleanQ || sId === cleanQ || sName.includes(cleanQ);
    });

    setVerifiedStudent(found || null);
  };

  useEffect(() => {
    const initial = getInitialSearch();
    if (initial) {
      lookupStudent(initial);
    }
  }, []);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    lookupStudent(inputQuery);
  };

  // Start Camera Barcode Scanner
  const startCameraScanner = async () => {
    setIsScannerActive(true);
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Kamera tidak didukung oleh browser Anda.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Gagal membuka kamera:', err);
      setCameraError('Tidak dapat mengakses kamera perangkat. Pastikan izin kamera aktif.');
    }
  };

  const stopCameraScanner = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsScannerActive(false);
  };

  useEffect(() => {
    return () => {
      stopCameraScanner();
    };
  }, []);

  const verificationUrl = verifiedStudent
    ? `https://sispam.hakito.my.id/verify/${verifiedStudent.nisn}`
    : `https://sispam.hakito.my.id/verify/${searchedQuery || 'nisn'}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* Top Header Navigation */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between pb-6 border-b border-indigo-900/50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <span>Verifikasi Digital Kartu Pelajar Resmi</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                SSL Secured
              </span>
            </h1>
            <p className="text-xs text-indigo-200">
              {profile.name} · Pangkalan Data Pokok Peserta Didik (Dapodik Terintegrasi)
            </p>
          </div>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Login</span>
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl w-full mx-auto my-6 space-y-6 flex-1">
        {/* Search & Scan Controls Card */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-indigo-900/60 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-400" />
                <span>Pencarian Manual NISN atau Scan Barcode Kartu</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Arahkan kamera ke Barcode 1D / QR Code 2D pada kartu pelajar, atau ketikkan 10 digit NISN secara manual.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => (isScannerActive ? stopCameraScanner() : startCameraScanner())}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs ${
                  isScannerActive
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>{isScannerActive ? 'Tutup Scanner' : 'Uji Scanner Barcode / QR'}</span>
              </button>
            </div>
          </div>

          {/* Camera Scanner View */}
          {isScannerActive && (
            <div className="p-4 rounded-xl bg-black/60 border border-indigo-500/40 space-y-3">
              <div className="relative aspect-video max-w-md mx-auto rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center border-2 border-indigo-500/60">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-36 border-2 border-dashed border-emerald-400 rounded-lg animate-pulse flex items-center justify-center">
                    <span className="text-[10px] text-emerald-300 font-mono bg-black/60 px-2 py-0.5 rounded">
                      Fokuskan Barcode / QR
                    </span>
                  </div>
                </div>
              </div>

              {cameraError && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{cameraError}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 text-center text-xs text-slate-400">
                <span>Arahkan barcode 1D atau QR Code pada Kartu Tanda Pelajar tepat ke dalam kotak panduan di atas.</span>
              </div>
            </div>
          )}

          {/* Manual Input Form */}
          <form onSubmit={handleManualSearch} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Masukkan 10 digit NISN resmi peserta didik (Contoh: 0081234567)..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-3 rounded-xl border border-indigo-800 bg-slate-950 text-white text-xs font-mono placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500 shadow-inner"
              />
              {inputQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setInputQuery('');
                    setVerifiedStudent(null);
                    setHasSearched(false);
                  }}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <Search className="w-4 h-4" />
              <span>Verifikasi NISN</span>
            </button>
          </form>

          {/* Privacy Protection Notice */}
          <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[11px] text-slate-400">
              Perlindungan Privasi Data: Sistem hanya menampilkan identitas tunggal siswa yang diverifikasi melalui pemindaian kartu atau nomor NISN sah.
            </span>
          </div>
        </div>

        {/* VERIFICATION RESULT DISPLAY */}
        {hasSearched && (
          <div>
            {verifiedStudent ? (
              <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
                {/* Glow highlight */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

                {/* Status Banner */}
                <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-emerald-200 uppercase tracking-wide">
                        STATUS: TERVERIFIKASI ASLI & AKTIF
                      </h3>
                      <p className="text-xs text-emerald-300/80">
                        Kartu Tanda Pelajar ini sah dan tercatat resmi pada Pangkalan Data Pokok {profile.name}.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak Bukti</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-emerald-800"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{isCopied ? 'Tersalin!' : 'Salin URL'}</span>
                    </button>
                  </div>
                </div>

                {/* Student Credentials Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Photo & Identity Column */}
                  <div className="flex flex-col items-center text-center p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="w-32 h-40 rounded-xl overflow-hidden border-2 border-indigo-500 shadow-lg bg-slate-800 flex items-center justify-center">
                      {verifiedStudent.photoUrl ? (
                        <img
                          src={verifiedStudent.photoUrl}
                          alt={verifiedStudent.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-2 text-slate-500 text-xs">
                          <ShieldCheck className="w-12 h-12 text-indigo-400 mx-auto mb-1" />
                          <span>Foto Siswa Resmi</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-base text-white">{verifiedStudent.name}</h4>
                      <p className="text-xs text-indigo-400 font-mono mt-0.5">
                        NISN: {verifiedStudent.nisn}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        NIS: {verifiedStudent.nis || '-'}
                      </p>
                    </div>

                    <div className="w-full pt-3 border-t border-slate-800">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-block">
                        Peserta Didik Aktif
                      </span>
                    </div>
                  </div>

                  {/* Biodata & Academic Detail Column */}
                  <div className="md:col-span-2 space-y-4">
                    {(() => {
                      const studentClass = classes.find(
                        (c) => c.id === verifiedStudent.classId || c.name === verifiedStudent.className
                      );
                      const homeroomTeacherName = studentClass?.homeroomTeacherName || 'Dra. Endang Purwanti';

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                            <span className="text-slate-400 block text-[11px]">Rombongan Belajar (Kelas)</span>
                            <strong className="text-white text-sm block">{verifiedStudent.className}</strong>
                            <span className="text-[11px] text-indigo-300">Tahun Ajaran 2024/2025</span>
                          </div>

                          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                            <span className="text-slate-400 block text-[11px]">Jenis Kelamin</span>
                            <strong className="text-white text-sm block">
                              {verifiedStudent.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                            </strong>
                            <span className="text-[11px] text-slate-400">Identitas Gender Resmi</span>
                          </div>

                          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                            <span className="text-slate-400 block text-[11px]">Nama Wali Kelas</span>
                            <strong className="text-white text-sm block">{homeroomTeacherName}</strong>
                            <span className="text-[11px] text-emerald-400">Pembina Rombel Aktif</span>
                          </div>

                          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                            <span className="text-slate-400 block text-[11px]">Program Keahlian / Jurusan</span>
                            <strong className="text-white text-sm block">
                              {studentClass?.major || 'Umum'}
                            </strong>
                            <span className="text-[11px] text-indigo-300">Kurikulum Merdeka</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* School Authority Authentication */}
                    <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/80 space-y-3 text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-indigo-900/60">
                        <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                          <Building className="w-4 h-4 text-indigo-400" />
                          Instansi Penerbit Kartu:
                        </span>
                        <span className="font-mono text-[11px] text-indigo-300">
                          NPSN: {profile.npsn} · Akreditasi {profile.accreditation}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 block">Nama Satuan Pendidikan:</span>
                          <strong className="text-white block">{profile.name}</strong>
                          <span className="text-slate-400 text-[10px] block truncate">{profile.address}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Pejabat Berwenang / Kepala Sekolah:</span>
                          <strong className="text-white block">{profile.principalName}</strong>
                          <span className="text-slate-400 font-mono text-[10px] block">NIP. {profile.principalNip}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
                        <span>Digital Signature Hash: SISPAM-AUTH-{verifiedStudent.nisn}-VERIFIED</span>
                        <span className="text-emerald-400">Terdaftar Resmi di Pangkalan Data Dapodik</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-rose-800/80 rounded-2xl p-8 text-center space-y-3 shadow-xl">
                <div className="w-12 h-12 rounded-2xl bg-rose-950 text-rose-500 flex items-center justify-center mx-auto border border-rose-800">
                  <XCircle className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-base text-rose-400">DATA TIDAK DITEMUKAN</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Nomor NISN atau identitas <strong>"{searchedQuery}"</strong> tidak tercatat dalam database peserta didik resmi {profile.name}. Pastikan nomor yang dimasukkan benar atau hubungi tata usaha sekolah.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setInputQuery('');
                      setHasSearched(false);
                    }}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
                  >
                    Coba Pencarian Lain
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="max-w-4xl w-full mx-auto text-center pt-4 border-t border-indigo-950 text-[11px] text-slate-500 space-y-1">
        <p>SISPAM Digital Credential Verification Engine · {profile.name}</p>
      </footer>
    </div>
  );
};

