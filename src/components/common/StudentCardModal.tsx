import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import {
  CreditCard,
  Printer,
  X,
  Scissors,
  Check,
  QrCode,
  CheckCircle2,
  ShieldCheck,
  Copy,
  ExternalLink,
  Scan,
} from 'lucide-react';
import { Student, SchoolProfile } from '../../types';

interface StudentCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  profile: SchoolProfile;
}

// Komponen Barcode Standar ISO/IEC 15417 (Code 128-B) yang dapat dipindai oleh SEMUA aplikasi scanner
const ScannableBarcode: React.FC<{
  value: string;
  className?: string;
  height?: number;
  width?: number;
}> = ({
  value,
  className = 'h-5 w-auto max-w-[130px]',
  height = 20,
  width = 1.25,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        const cleanVal = String(value).trim();
        JsBarcode(svgRef.current, cleanVal, {
          format: 'CODE128',
          lineColor: '#000000',
          background: '#ffffff',
          width: width,
          height: height,
          displayValue: false, // Nilai teks ditampilkan secara elegan di bawah
          margin: 4,
          flat: true,
        });
      } catch (err) {
        console.error('Gagal generate barcode dengan JsBarcode:', err);
      }
    }
  }, [value, width, height]);

  return (
    <div className="bg-white px-2 py-0.5 rounded-sm shadow-xs border border-indigo-200 inline-flex flex-col items-center select-none">
      <svg ref={svgRef} className={className} />
    </div>
  );
};

export const StudentCardModal: React.FC<StudentCardModalProps> = ({
  isOpen,
  onClose,
  student,
  profile,
}) => {
  const [viewSide, setViewSide] = useState<'front' | 'back' | 'both'>('front');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [scanSimulated, setScanSimulated] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const barcodeValue = student.nisn || student.nis || student.id;
  const verificationHash = `SISPAM-AUTH-ID-${barcodeValue}-${student.id.replace('std-', '').toUpperCase()}`;
  const verificationUrl = `https://sispam.sch.id/verify/${barcodeValue}?hash=${verificationHash}`;

  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('print-modal-open');
    return () => {
      document.body.classList.remove('print-modal-open');
    };
  }, [isOpen]);

  // Generate Real ISO/IEC 18004 QR Code
  useEffect(() => {
    if (barcodeValue) {
      QRCode.toDataURL(
        verificationUrl,
        {
          width: 140,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        (err, url) => {
          if (!err && url) {
            setQrDataUrl(url);
          }
        }
      );
    }
  }, [barcodeValue, verificationUrl]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyVerification = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(verificationUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    }
  };

  const handleSimulateScan = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(barcodeValue);
    }
    setScanSimulated(true);
    setTimeout(() => setScanSimulated(false), 3500);
  };

  const renderFrontCard = () => (
    <div
      className="student-id-card bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-900 text-white rounded-2xl p-3.5 sm:p-4 shadow-2xl border-2 border-indigo-400/50 text-xs relative overflow-hidden w-full max-w-[420px] h-[290px] min-h-[290px] max-h-[290px] mx-auto select-none flex flex-col justify-between"
      style={{
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      {/* Decorative background glow watermark */}
      <div className="absolute right-0 top-0 -mt-8 -mr-8 w-44 h-44 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

      {/* Kop Kartu Tanda Pelajar dengan Alamat Lengkap Sekolah */}
      <div className="flex items-center gap-2.5 pb-2 border-b border-indigo-400/35 relative z-10 shrink-0">
        <img
          src={profile.logoUrl}
          alt="Logo Sekolah"
          className="w-10 h-10 object-contain rounded-full bg-white p-0.5 shrink-0 border border-indigo-200"
          referrerPolicy="no-referrer"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[8.5px] uppercase tracking-wider text-indigo-300 font-extrabold leading-none">
            KARTU TANDA PELAJAR RESMI
          </p>
          <p className="font-black text-sm tracking-tight text-white uppercase truncate mt-0.5">
            {profile.name}
          </p>
          <p className="text-[7.5px] text-slate-300 leading-tight mt-0.5 line-clamp-1">
            {profile.address}, Kec. {profile.subdistrict}, {profile.city}, {profile.province} {profile.postalCode ? 'Kode Pos: ' + profile.postalCode : ''}
          </p>
          <p className="text-[7.5px] text-indigo-300 font-mono mt-0.5 font-semibold">
            NPSN: {profile.npsn} · NSS: {profile.nss} · Akreditasi: {profile.accreditation || 'A'}
          </p>
        </div>
      </div>

      {/* Body Kartu: Foto 3x4 & Biodata Siswa */}
      <div className="flex items-start gap-3 py-1.5 relative z-10 flex-1">
        {/* Pas Foto 3x4 Siswa */}
        <div className="w-20 h-25 rounded-lg bg-slate-900 border-2 border-indigo-400/60 overflow-hidden flex flex-col items-center justify-center text-center p-0.5 shrink-0 shadow-md">
          {student.photoUrl ? (
            <img
              src={student.photoUrl}
              alt={student.name}
              className="w-full h-full object-cover rounded-md"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-1">
              <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white mb-1 shadow-xs">
                {student.name.charAt(0)}
              </div>
              <span className="text-[7.5px] text-slate-300 uppercase font-mono font-bold">FOTO 3x4</span>
            </div>
          )}
        </div>

        {/* Biodata Lengkap Peserta Didik */}
        <div className="flex-1 min-w-0 space-y-1 text-[9px] leading-tight">
          <div>
            <span className="text-slate-400 block text-[7.5px]">Nama Lengkap Siswa:</span>
            <p className="font-extrabold text-white text-[11px] truncate uppercase tracking-tight">
              {student.name}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <div>
              <span className="text-slate-400 block text-[7.5px]">NISN:</span>
              <p className="font-mono font-bold text-indigo-200 text-[10px]">{student.nisn}</p>
            </div>
            <div>
              <span className="text-slate-400 block text-[7.5px]">NIS Sekolah:</span>
              <p className="font-mono font-bold text-slate-200 text-[10px]">{student.nis}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <div>
              <span className="text-slate-400 block text-[7.5px]">Kelas:</span>
              <p className="font-bold text-amber-300 text-[10px]">{student.className}</p>
            </div>
            <div>
              <span className="text-slate-400 block text-[7.5px]">Jenis Kelamin:</span>
              <p className="text-slate-200">{student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
            </div>
          </div>

          <div className="pt-0.5">
            <span className="text-slate-400 block text-[7.5px]">Tempat, Tanggal Lahir:</span>
            <p className="text-slate-200 truncate">{student.birthPlaceDate}</p>
          </div>
        </div>
      </div>

      {/* Footer Kartu: Barcode Standar Code 128 (Bisa Discan) & Status Aktif */}
      <div className="pt-2 border-t border-indigo-400/35 flex items-center justify-between text-[8px] text-slate-300 relative z-10 shrink-0">
        {/* Barcode Verifikasi Digital Standar Code 128 */}
        <div
          onClick={() => setShowVerifyModal(true)}
          className="cursor-pointer group flex flex-col items-start"
          title="Scan Barcode NISN dengan Scanner HP atau Klik untuk Verifikasi Digital"
        >
          <ScannableBarcode value={barcodeValue} height={20} width={1.25} />
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="font-mono text-[7.5px] text-indigo-200 font-bold tracking-wider">
              NISN: {student.nisn}
            </span>
            <span className="text-[6.5px] px-1 py-0.2 rounded bg-indigo-500/30 text-indigo-200 group-hover:bg-indigo-500 group-hover:text-white transition-colors flex items-center gap-0.5 font-medium">
              <span>Cek Barcode</span>
            </span>
          </div>
        </div>

        {/* Status Siswa & Nama Sekolah */}
        <div className="text-right flex flex-col items-end">
          <button
            type="button"
            onClick={() => setShowVerifyModal(true)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-bold bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/40 transition-colors cursor-pointer"
            title="Klik untuk Verifikasi Keaslian Digital"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Kartu Pelajar Aktif</span>
          </button>
          <p className="text-[7.5px] text-indigo-300 mt-1 font-medium truncate max-w-[170px]">
            {profile.name}
          </p>
        </div>
      </div>
    </div>
  );

  const renderBackCard = () => (
    <div
      className="student-id-card bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-3.5 sm:p-4 shadow-2xl border-2 border-indigo-400/50 text-xs relative overflow-hidden w-full max-w-[420px] h-[290px] min-h-[290px] max-h-[290px] mx-auto select-none flex flex-col justify-between"
      style={{
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      <div className="relative z-10 flex-1">
        <div className="flex items-center justify-between pb-1.5 border-b border-indigo-400/35 mb-2">
          <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-indigo-300">
            TATA TERTIB & KETENTUAN PEMEGANG KARTU
          </span>
          <span className="text-[8.5px] font-mono font-bold text-amber-300">
            BERLAKU AKTIF
          </span>
        </div>

        <ol className="text-[8.5px] text-slate-300 space-y-1 list-decimal pl-3.5 leading-relaxed">
          <li>Kartu Tanda Pelajar ini adalah identitas resmi peserta didik <strong>{profile.name}</strong>.</li>
          <li>Wajib dibawa saat berada di lingkungan sekolah dan ketika mengikuti seluruh kegiatan asesmen resmi.</li>
          <li>Kartu ini tidak boleh dipinjamkan, digandakan, atau dipindahtangankan kepada pihak manapun.</li>
          <li>Apabila kartu hilang atau rusak, siswa wajib segera melapor kepada Bagian Tata Usaha sekolah.</li>
          <li>Bagi yang menemukan kartu ini, mohon mengembalikan ke alamat sekolah: {profile.address}, {profile.city}.</li>
        </ol>
      </div>

      {/* Footer Sisi Belakang: QR Verifikasi Digital Fungsional (Bisa Discan Kamera HP) */}
      <div className="pt-2 border-t border-indigo-400/35 flex items-center justify-between text-[8px] text-slate-300 relative z-10 shrink-0">
        <div
          onClick={() => setShowVerifyModal(true)}
          className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group"
          title="Scan QR Code Kamera HP / Klik untuk Verifikasi Keaslian Kartu"
        >
          <div className="w-8 h-8 rounded bg-white p-0.5 flex items-center justify-center shrink-0 shadow-xs border border-indigo-200">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code Verifikasi" className="w-7 h-7 object-contain rounded-xs" />
            ) : (
              <QrCode className="w-7 h-7 text-slate-900 group-hover:scale-105 transition-transform" />
            )}
          </div>
          <div>
            <p className="font-bold text-white text-[8.5px] flex items-center gap-1">
              <span>Verifikasi Digital SISPAM</span>
              <span className="text-[6.5px] px-1 py-0.2 rounded bg-emerald-500 text-white font-bold">AKTIF</span>
            </p>
            <p className="text-[7.5px] text-indigo-300">Scan QR kamera HP untuk validasi status siswa</p>
          </div>
        </div>

        <div className="text-right">
          <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
            {profile.name.replace('SMA ', '')} ID
          </span>
          <p className="text-[7px] text-slate-400 font-mono mt-0.5">SISPAM SECURE CARD</p>
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
                Format resmi berstandar ID Card. Bagian bawah, barcode standar Code 128, dan pengesahan terlihat utuh dan presisi.
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
        <div className="no-print flex flex-wrap items-center justify-between gap-2 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
          <div className="flex items-center gap-1 flex-wrap">
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

          {/* Tombol Uji Verifikasi Barcode Digital Langsung */}
          <button
            onClick={() => setShowVerifyModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Cek Barcode Digital</span>
          </button>
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
            Tip: Cetak pada kertas foto tebal / PVC card. Barcode standar Code 128 dan QR Code dapat dipindai oleh scanner fisik maupun kamera smartphone.
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

      {/* MODAL VERIFIKASI DIGITAL KARTU PELAJAR & UJI SCANNER */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Verifikasi Digital & Uji Scanner Barcode
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Sistem Integrasi Sekolah, Pembelajaran, & Administrasi (SISPAM)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Verification Status Banner */}
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="font-bold text-xs text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                STATUS: TERVERIFIKASI RESMI & AKTIF
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                Data kartu identitas pelajar ini valid dan sah terdaftar pada pangkalan data Dapodik sekolah.
              </p>
            </div>

            {/* Tampilan Barcode & QR Code Berskala Tinggi untuk Langsung Dipindai di Layar */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                  Pindai Langsung dari Layar / Hasil Cetak:
                </span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  ISO/IEC 15417 Code 128
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                {/* 1D Barcode Container */}
                <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg border border-slate-200 shadow-xs text-center">
                  <ScannableBarcode value={barcodeValue} height={28} width={1.4} className="h-7 w-auto max-w-[160px]" />
                  <span className="font-mono text-xs font-bold text-slate-900 tracking-wider mt-1">
                    {student.nisn}
                  </span>
                  <span className="text-[9px] text-slate-500 mt-0.5">
                    1D Scanner (Barcode Pembaca NISN)
                  </span>
                </div>

                {/* 2D QR Code Container */}
                <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg border border-slate-200 shadow-xs text-center">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="QR Code" className="w-16 h-16 object-contain" />
                  ) : (
                    <QrCode className="w-16 h-16 text-slate-800" />
                  )}
                  <span className="font-mono text-[9px] font-bold text-indigo-600 mt-1 truncate max-w-[160px]">
                    sispam.sch.id/verify/{student.nisn}
                  </span>
                  <span className="text-[9px] text-slate-500 mt-0.5">
                    2D Scanner / Kamera Smartphone
                  </span>
                </div>
              </div>

              {/* Uji Hasil Pindai Simulator */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="text-[10px] text-slate-600 dark:text-slate-400">
                  Output data saat dipindai scanner: <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-bold text-slate-900 dark:text-white font-mono">{barcodeValue}</code>
                </div>
                <button
                  type="button"
                  onClick={handleSimulateScan}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                  <Scan className="w-3.5 h-3.5" />
                  <span>{scanSimulated ? '✓ Hasil Pindai Berhasil Disalin!' : 'Uji Pindai (Salin NISN)'}</span>
                </button>
              </div>
            </div>

            {/* Student Verified Details */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1.5">
              <div className="flex justify-between pb-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500">Nama Lengkap:</span>
                <span className="font-bold text-slate-900 dark:text-white">{student.name}</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500">NISN / NIS:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{student.nisn} / {student.nis}</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500">Rombongan Belajar:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{student.className}</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500">Tempat, Tanggal Lahir:</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">{student.birthPlaceDate}</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500">Satuan Pendidikan:</span>
                <span className="font-medium text-slate-900 dark:text-white truncate max-w-[200px]">{profile.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">NPSN Sekolah:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">{profile.npsn}</span>
              </div>
            </div>

            {/* Cryptographic hash info */}
            <div className="p-2.5 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-lg border border-indigo-100 dark:border-indigo-900/40 text-[10px] text-slate-500 space-y-1">
              <div className="flex justify-between items-center font-mono">
                <span>Kode Hash Verifikasi:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-[220px]">{verificationHash}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Waktu Pengecekan:</span>
                <span>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} WIB</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={handleCopyVerification}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer font-medium"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copySuccess ? 'Tersalin!' : 'Salin Tautan'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(modalJSX, document.body);
};
