import React from 'react';
import { SchoolProfile } from '../../types';

interface OfficialLetterheadProps {
  profile: SchoolProfile;
  documentTitle?: string;
  documentNumber?: string;
}

export const OfficialLetterhead: React.FC<OfficialLetterheadProps> = ({
  profile,
  documentTitle,
  documentNumber,
}) => {
  return (
    <div className="w-full text-slate-900 mb-6">
      <div className="flex items-center justify-between gap-4 pb-2">
        {/* Logo Kiri */}
        <div className="w-24 h-24 shrink-0 flex items-center justify-center">
          <img
            src={profile.logoUrl}
            alt={profile.name}
            className="w-20 h-20 object-contain rounded-full border border-slate-200"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Teks Kop Surat */}
        <div className="flex-1 text-center leading-tight">
          <p className="text-xs font-semibold tracking-wider text-slate-700 uppercase">
            {profile.letterheadProvince}
          </p>
          <p className="text-sm font-bold tracking-wide text-slate-800 uppercase">
            {profile.letterheadAgency}
          </p>
          {profile.letterheadFoundation && (
            <p className="text-xs font-medium text-slate-600 uppercase">
              {profile.letterheadFoundation}
            </p>
          )}
          <h1 className="text-xl font-extrabold tracking-tight text-slate-950 uppercase mt-0.5">
            {profile.name}
          </h1>
          <p className="text-xs font-semibold text-slate-700 mt-0.5">
            NPSN: <span className="font-mono">{profile.npsn}</span> · NSS: <span className="font-mono">{profile.nss}</span> · Akreditasi: {profile.accreditation}
          </p>
          <p className="text-[11px] text-slate-600 mt-0.5">
            {profile.address}, Kec. {profile.subdistrict}, {profile.city}, {profile.province} {profile.postalCode}
          </p>
          <p className="text-[11px] text-slate-600">
            Telepon: {profile.phone} · Pos-el: {profile.email} · Laman: {profile.website}
          </p>
        </div>

        {/* Logo Kanan (Logo 2 - Sekolah/Tut Wuri Handayani) */}
        <div className="w-24 h-24 shrink-0 flex items-center justify-center">
          {profile.logoRightUrl ? (
            <img
              src={profile.logoRightUrl}
              alt="Logo Kanan Sekolah"
              className="w-20 h-20 object-contain rounded-full border border-slate-200"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-20 h-20"></div>
          )}
        </div>
      </div>

      {/* Garis Ganda Kop Surat Resmi Dinas Pendidikan */}
      <div className="border-t-[3px] border-black my-0.5"></div>
      <div className="border-t-[1px] border-black mb-4"></div>

      {/* Judul & Nomor Dokumen jika ada */}
      {documentTitle && (
        <div className="text-center my-4">
          <h2 className="text-base font-bold underline uppercase tracking-wide">
            {documentTitle}
          </h2>
          {documentNumber && (
            <p className="text-xs font-mono text-slate-700 mt-1">
              Nomor: {documentNumber}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
