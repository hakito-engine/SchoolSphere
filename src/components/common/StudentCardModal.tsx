import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CreditCard, Printer, X, Scissors, Check, QrCode } from 'lucide-react';
import { Student, SchoolProfile } from '../../types';

interface StudentCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  profile: SchoolProfile;
}

export const StudentCardModal: React.FC<StudentCardModalProps> = ({
  isOpen,
  onClose,
  student,
  profile,
}) => {
  const [viewSide, setViewSide] = useState<'front' | 'back' | 'both'>('front');

  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('print-modal-open');
    return () => {
      document.body.classList.remove('print-modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const renderFrontCard = () => (
    <div
      className="student-id-card bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-900 text-white rounded-2xl p-4 sm:p-5 shadow-2xl border-2 border-indigo-400/50 text-xs relative overflow-hidden w-full max-w-[420px] mx-auto select-none"
      style={{
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      {/* Decorative background glow watermark */}
      <div className="absolute right-0 top-0 -mt-8 -mr-8 w-44 h-44 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

      {/* Kop Kartu Tanda Pelajar dengan Alamat Lengkap Sekolah */}
      <div className="flex items-center gap-3 pb-2.5 border-b border-indigo-400/40 relative z-10">
        <img
          src={profile.logoUrl}
          alt="Logo Sekolah"
          className="w-12 h-12 object-contain rounded-full bg-white p-0.5 shrink-0 border border-indigo-200"
          referrerPolicy="no-referrer"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[9px] uppercase tracking-wider text-indigo-300 font-extrabold leading-none">
            KARTU TANDA PELAJAR RESMI
          </p>
          <p className="font-black text-sm tracking-tight text-white uppercase truncate mt-0.5">
            {profile.name}
          </p>
          <p className="text-[8px] text-slate-300 leading-tight mt-0.5 line-clamp-1">
            {profile.address}, Kec. {profile.subdistrict}, {profile.city}, {profile.province} {profile.postalCode ? 'Kode Pos: ' + profile.postalCode : ''}
          </p>
          <p className="text-[8px] text-indigo-300 font-mono mt-0.5 font-semibold">
            NPSN: {profile.npsn} · NSS: {profile.nss} · Akreditasi: {profile.accreditation || 'A'}
          </p>
        </div>
      </div>

      {/* Body Kartu: Foto 3x4 & Biodata Siswa */}
      <div className="flex items-start gap-3.5 py-3 relative z-10">
        {/* Pas Foto 3x4 Siswa */}
        <div className="w-22 h-28 rounded-xl bg-slate-900 border-2 border-indigo-400/70 overflow-hidden flex flex-col items-center justify-center text-center p-0.5 shrink-0 shadow-md">
          {student.photoUrl ? (
            <img
              src={student.photoUrl}
              alt={student.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-1">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm text-white mb-1 shadow-xs">
                {student.name.charAt(0)}
              </div>
              <span className="text-[8px] text-slate-300 uppercase font-mono font-bold">FOTO 3x4</span>
            </div>
          )}
        </div>

        {/* Data Pokok Siswa: Kelas & TTL Terpisah Jelas */}
        <div className="space-y-1.5 text-[11px] leading-tight flex-1 min-w-0">
          <div>
            <span className="text-[8px] text-indigo-300 uppercase font-bold block tracking-wider">
              Nama Lengkap Siswa
            </span>
            <span className="font-extrabold text-white text-xs block truncate mt-0.5">
              {student.name}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <div>
              <span className="text-[8px] text-indigo-300 uppercase font-bold block tracking-wider">
                NISN
              </span>
              <span className="font-mono font-bold text-slate-100 text-xs">{student.nisn}</span>
            </div>
            <div>
              <span className="text-[8px] text-indigo-300 uppercase font-bold block tracking-wider">
                NIS
              </span>
              <span className="font-mono text-slate-200 text-xs">{student.nis}</span>
            </div>
          </div>

          {/* Field: Kelas / Rombel (Jelas Terpisah) */}
          <div className="pt-0.5">
            <span className="text-[8px] text-indigo-300 uppercase font-bold block tracking-wider">
              Kelas / Rombel
            </span>
            <span className="font-bold text-white bg-indigo-800/80 px-2 py-0.5 rounded inline-block text-[11px] border border-indigo-400/50 mt-0.5">
              {student.className}
            </span>
          </div>

          {/* Field: Tempat, Tanggal Lahir (Jelas Terpisah) */}
          <div className="pt-0.5">
            <span className="text-[8px] text-indigo-300 uppercase font-bold block tracking-wider">
              Tempat, Tanggal Lahir (TTL)
            </span>
            <span className="font-medium text-slate-200 block text-[11px] mt-0.5">
              {student.birthPlaceDate}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Kartu: Barcode & Pengesahan Kepala Sekolah */}
      <div className="pt-2 border-t border-indigo-400/40 flex items-center justify-between text-[8px] text-slate-300 relative z-10">
        <div>
          <p className="font-mono tracking-widest text-[11px] text-white font-bold leading-tight">
            ||||| | |||| || |||||| | |||||
          </p>
          <p className="font-mono text-[8px] text-indigo-300 mt-0.5">
            ID CARD: {student.nisn}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[8px] text-slate-300">Kepala Sekolah,</p>
          <p className="font-bold underline text-white mt-1 text-[9px] leading-tight">
            {profile.principalName}
          </p>
          <p className="font-mono text-[7px] text-slate-300">NIP. {profile.principalNip}</p>
        </div>
      </div>
    </div>
  );

  const renderBackCard = () => (
    <div
      className="student-id-card bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 shadow-2xl border-2 border-indigo-400/50 text-xs relative overflow-hidden w-full max-w-[420px] mx-auto select-none flex flex-col justify-between"
      style={{
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
        minHeight: '228px',
      }}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between pb-2 border-b border-indigo-400/40 mb-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">
            TATA TERTIB & KETENTUAN PEMEGANG KARTU
          </span>
          <span className="text-[9px] font-mono font-bold text-amber-300">
            BERLAKU AKTIF
          </span>
        </div>

        <ol className="text-[9px] text-slate-300 space-y-1.5 list-decimal pl-3.5 leading-relaxed">
          <li>Kartu Tanda Pelajar ini adalah identitas resmi peserta didik <strong>{profile.name}</strong>.</li>
          <li>Wajib dibawa saat berada di lingkungan sekolah dan ketika mengikuti seluruh kegiatan evaluasi/asesmen resmi.</li>
          <li>Kartu ini tidak boleh dipinjamkan, digandakan, atau dipindahtangankan kepada pihak manapun.</li>
          <li>Apabila kartu hilang atau rusak, siswa wajib segera melapor kepada Bagian Tata Usaha sekolah.</li>
          <li>Bagi yang menemukan kartu ini, mohon mengembalikan ke alamat sekolah: {profile.address}, {profile.city}.</li>
        </ol>
      </div>

      <div className="pt-2 border-t border-indigo-400/40 flex items-center justify-between text-[8px] text-slate-300 relative z-10 mt-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-white p-0.5 flex items-center justify-center shrink-0">
            <QrCode className="w-7 h-7 text-slate-900" />
          </div>
          <div>
            <p className="font-bold text-white text-[9px]">Verifikasi Digital</p>
            <p className="text-[8px] text-indigo-300">Scan QR untuk validasi status siswa aktif</p>
          </div>
        </div>
        <div className="text-right">
          <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
            {profile.name.replace('SMA ', '')} ID
          </span>
        </div>
      </div>
    </div>
  );

  const modalJSX = (
    <div className="print-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="print-modal-dialog bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-auto">
        {/* Modal Top Bar (Hidden when printing) */}
        <div className="no-print flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Cetak Kartu Tanda Pelajar (KTP Siswa)
              </h3>
              <p className="text-[11px] text-slate-500">
                Format resmi berstandar ID Card. Background grafis luar otomatis dihilangkan saat dicetak.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher: Tampak Depan / Tampak Belakang / Cetak Kedua Sisi */}
        <div className="no-print flex items-center justify-between gap-2 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewSide('front')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                viewSide === 'front'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Tampak Depan
            </button>
            <button
              onClick={() => setViewSide('back')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                viewSide === 'back'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Tampak Belakang
            </button>
            <button
              onClick={() => setViewSide('both')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                viewSide === 'both'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Cetak Kedua Sisi (Depan & Belakang)</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium px-2">
            <Check className="w-3.5 h-3.5" />
            <span>Warna Asli Otomatis Dipertahankan</span>
          </div>
        </div>

        {/* Printable Card Canvas Area */}
        <div className="print-card-canvas-wrap py-2">
          {viewSide === 'both' ? (
            <div className="student-card-print-container flex flex-col md:flex-row items-center justify-center gap-6">
              {/* Sisi Depan dengan Garis Potong */}
              <div className="student-card-cut-border p-1 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
                <div className="no-print text-center text-[10px] text-slate-400 mb-1 font-mono">
                  — SISI DEPAN KARTU —
                </div>
                {renderFrontCard()}
              </div>

              {/* Sisi Belakang dengan Garis Potong */}
              <div className="student-card-cut-border p-1 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
                <div className="no-print text-center text-[10px] text-slate-400 mb-1 font-mono">
                  — SISI BELAKANG KARTU —
                </div>
                {renderBackCard()}
              </div>
            </div>
          ) : viewSide === 'front' ? (
            <div className="student-card-cut-border p-1 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl max-w-fit mx-auto">
              {renderFrontCard()}
            </div>
          ) : (
            <div className="student-card-cut-border p-1 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl max-w-fit mx-auto">
              {renderBackCard()}
            </div>
          )}
        </div>

        {/* Print Instruction & Action Buttons (Hidden when printing) */}
        <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <p className="text-[11px] text-slate-500">
            Tip: Cetak pada kertas foto tebal / PVC card. Warna dokumen dan garis potong akan dicetak secara presisi tanpa latar belakang gelap.
          </p>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Kartu Pelajar (Ctrl+P)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalJSX, document.body);
};
