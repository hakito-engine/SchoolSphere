import React from 'react';
import { Printer, X } from 'lucide-react';
import { OfficialLetterhead } from './OfficialLetterhead';
import { DataService } from '../../services/dataService';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  documentTitle: string;
  documentNumber?: string;
  children: React.ReactNode;
  rightSignerTitle?: string;
  rightSignerName?: string;
  rightSignerNip?: string;
  // Backward compatibility alias:
  leftSignerTitle?: string;
  leftSignerName?: string;
  leftSignerNip?: string;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  title,
  documentTitle,
  documentNumber,
  children,
  rightSignerTitle,
  rightSignerName,
  rightSignerNip,
  leftSignerTitle,
  leftSignerName,
  leftSignerNip,
}) => {
  if (!isOpen) return null;

  const profile = DataService.getSchoolProfile();

  // Determine effective document date based on super admin configuration
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
      // fallback to current date
    }
  }

  const isCurriculumSigner =
    (rightSignerTitle && (rightSignerTitle.toLowerCase().includes('kurikulum') || rightSignerTitle.toLowerCase().includes('wakil'))) ||
    (leftSignerTitle && (leftSignerTitle.toLowerCase().includes('kurikulum') || leftSignerTitle.toLowerCase().includes('wakil')));

  const finalRightTitle = rightSignerTitle || leftSignerTitle || 'Guru Pengampu / Wali Kelas';
  const finalRightName =
    (isCurriculumSigner && profile.vicePrincipalCurriculumName)
      ? profile.vicePrincipalCurriculumName
      : (rightSignerName || leftSignerName || 'Budi Santoso, S.Si.');
  const finalRightNip =
    (isCurriculumSigner && profile.vicePrincipalCurriculumNip)
      ? profile.vicePrincipalCurriculumNip
      : (rightSignerNip || leftSignerNip || '19820311 200801 1 007');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        {/* Modal Top Bar (Hidden when printing) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">{title}</span>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
              Standar F4 (Folio 215 × 330 mm)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Dokumen F4 (Ctrl+P)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Tutup Pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-100 dark:bg-slate-950 flex justify-center">
          <div className="print-page bg-white text-slate-900 p-8 md:p-12 shadow-md w-full max-w-[215mm] min-h-[330mm] text-xs leading-relaxed">
            {/* Kop Surat */}
            <OfficialLetterhead
              profile={profile}
              documentTitle={documentTitle}
              documentNumber={documentNumber}
            />

            {/* Document Content */}
            <div className="my-4">{children}</div>

            {/* Signature Block (Kepala Sekolah di KIRI, Guru/Wali/BK di KANAN) */}
            <div className="mt-12 pt-6 grid grid-cols-2 gap-8 text-center text-xs">
              {/* Kiri: Kepala Sekolah */}
              <div>
                <p className="invisible">Spacer</p>
                <p className="font-medium text-slate-700">Mengetahui,</p>
                <p className="font-medium text-slate-700">Kepala Sekolah</p>
                <div className="h-16"></div>
                <p className="font-bold underline text-slate-900">{profile.principalName}</p>
                <p className="text-[11px] font-mono text-slate-600">NIP. {profile.principalNip}</p>
              </div>

              {/* Kanan: Guru Mata Pelajaran / Wali Kelas / Guru BK */}
              <div>
                <p className="text-slate-700">
                  {profile.city}, {effectiveDate}
                </p>
                <p className="font-medium text-slate-700">{finalRightTitle}</p>
                <div className="h-20"></div>
                <p className="font-bold underline text-slate-900">{finalRightName}</p>
                <p className="text-[11px] font-mono text-slate-600">NIP. {finalRightNip}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
