import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { SchoolProfile, AuditLog, AcademicYearConfig } from '../types';
import { OfficialLetterhead } from '../components/common/OfficialLetterhead';
import {
  Settings,
  Save,
  CheckCircle2,
  Database,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  Eye,
  Calendar,
  Image as ImageIcon,
  Building,
  MapPin,
  FileText,
  Clock,
  Sparkles,
  RefreshCw,
  Plus,
} from 'lucide-react';

export const SchoolSettingsView: React.FC = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<SchoolProfile>(() => DataService.getSchoolProfile());
  const [academicYears, setAcademicYears] = useState<AcademicYearConfig[]>(() => DataService.getAcademicYears());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => DataService.getAuditLogs());

  const [activeTab, setActiveTab] = useState<'profil' | 'kop_surat' | 'tahun_ajaran' | 'tanggal_dokumen' | 'database_mysql' | 'backup' | 'audit'>('profil');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState('Pengaturan berhasil disimpan dan diperbarui di seluruh dokumen cetak.');

  // Dual Logo upload state: Logo 1 (Kiri - Dinas/Yayasan) & Logo 2 (Kanan - Sekolah)
  const [logoPreview, setLogoPreview] = useState<string>(profile.logoUrl);
  const [logoRightPreview, setLogoRightPreview] = useState<string>(profile.logoRightUrl || '');

  // MySQL Database Config state for long-term usage
  const [mysqlConfig, setMysqlConfig] = useState(() => DataService.getMySQLConfig());
  const [mysqlSavedStatus, setMysqlSavedStatus] = useState<string | null>(null);

  // New Academic Year Modal State
  const [isAddAyModalOpen, setIsAddAyModalOpen] = useState(false);
  const [newAyYear, setNewAyYear] = useState('2025/2026');
  const [newAySemester, setNewAySemester] = useState<'Ganjil' | 'Genap'>('Ganjil');
  const [newAyStartDate, setNewAyStartDate] = useState('2025-07-14');
  const [newAyEndDate, setNewAyEndDate] = useState('2025-12-19');
  const [newAyCloneFromPrevious, setNewAyCloneFromPrevious] = useState(true);

  // Backup state
  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleProfileChange = (key: keyof SchoolProfile, value: any) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Silakan pilih berkas gambar (PNG, JPG, JPEG, WEBP, atau SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setLogoPreview(result);
        setProfile((prev) => ({ ...prev, logoUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogoRightFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Silakan pilih berkas gambar (PNG, JPG, JPEG, WEBP, atau SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setLogoRightPreview(result);
        setProfile((prev) => ({ ...prev, logoRightUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadMySQLDump = () => {
    const sql = DataService.exportDatabaseMySQL();
    const blob = new Blob([sql], { type: 'application/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schoolsphere_database_dump_${new Date().toISOString().substring(0, 10)}.sql`;
    a.click();
    URL.revokeObjectURL(url);
    setMysqlSavedStatus('Berkas skema & data MySQL (.sql) berhasil diunduh. Siap diimpor ke MySQL Server.');
    setTimeout(() => setMysqlSavedStatus(null), 4000);
  };

  const handleSaveMySQLConfig = (e: React.FormEvent) => {
    e.preventDefault();
    DataService.saveMySQLConfig(mysqlConfig, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });
    setMysqlSavedStatus('Konfigurasi koneksi MySQL berhasil diperbarui dan disimpan.');
    setTimeout(() => setMysqlSavedStatus(null), 3500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = DataService.updateSchoolProfile(profile, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });
    setProfile(updated);
    setSaveMessage('Pengaturan profil dan logo sekolah berhasil disimpan dan disinkronkan ke seluruh sistem.');
    setSaveSuccess(true);
    setAuditLogs(DataService.getAuditLogs());
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const handleSwitchAcademicYear = (id: string) => {
    const updated = DataService.setActiveAcademicYear(id, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });
    setAcademicYears(updated);
    setSaveMessage(`Tahun Ajaran aktif berhasil dialihkan ke ${id}.`);
    setSaveSuccess(true);
    setAuditLogs(DataService.getAuditLogs());
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const handleCreateNewAcademicYear = (e: React.FormEvent) => {
    e.preventDefault();
    const newAy: AcademicYearConfig = {
      id: `ay-${newAyYear.replace('/', '-')}-${newAySemester.toLowerCase()}`,
      year: newAyYear,
      semester: newAySemester,
      isActive: true,
      startDate: newAyStartDate,
      endDate: newAyEndDate,
    };

    const updated = DataService.addAcademicYear(newAy, newAyCloneFromPrevious, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });

    setAcademicYears(updated);
    setIsAddAyModalOpen(false);
    setSaveMessage(
      `Tahun Ajaran ${newAyYear} (${newAySemester}) berhasil diaktifkan dengan ${
        newAyCloneFromPrevious ? 'sinkronisasi otomatis data sebelumnya' : 'data awal baru'
      }.`
    );
    setSaveSuccess(true);
    setAuditLogs(DataService.getAuditLogs());
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const handleExportBackup = () => {
    const json = DataService.exportDatabaseJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SchoolSphere_Backup_${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = () => {
    if (!importJsonText) return;
    const ok = DataService.importDatabaseJSON(importJsonText, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });
    if (ok) {
      setImportStatus('Database berhasil dipulihkan dari data JSON.');
      setProfile(DataService.getSchoolProfile());
      setAcademicYears(DataService.getAcademicYears());
      setAuditLogs(DataService.getAuditLogs());
      setImportJsonText('');
    } else {
      setImportStatus('Format JSON tidak valid atau gagal diproses.');
    }
  };

  const handleResetData = () => {
    if (confirm('Apakah Anda yakin ingin mengatur ulang data ke kondisi awal demonstrasi? Semua perubahan lokal akan direset.')) {
      DataService.resetToDefault();
      window.location.reload();
    }
  };

  const activeAY = academicYears.find((ay) => ay.isActive) || academicYears[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Pengaturan Sekolah & Manajemen Sistem
          </h2>
          <p className="text-xs text-slate-500">
            Identitas lembaga, konfigurasi kop surat kedinasan, sinkronisasi tahun ajaran, tanggal dokumen, dan audit trail.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('profil')}
          className={`pb-2.5 px-3 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'profil'
              ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Profil & Data Pokok
        </button>
        <button
          onClick={() => setActiveTab('kop_surat')}
          className={`pb-2.5 px-3 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'kop_surat'
              ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Kop Surat & Logo
        </button>
        <button
          onClick={() => setActiveTab('tahun_ajaran')}
          className={`pb-2.5 px-3 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'tahun_ajaran'
              ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Tahun Ajaran & Sinkronisasi
        </button>
        <button
          onClick={() => setActiveTab('tanggal_dokumen')}
          className={`pb-2.5 px-3 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'tanggal_dokumen'
              ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Pengaturan Tanggal Dokumen
        </button>
        <button
          onClick={() => setActiveTab('database_mysql')}
          className={`pb-2.5 px-3 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'database_mysql'
              ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Database MySQL (Jangka Panjang)</span>
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`pb-2.5 px-3 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'backup'
              ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Backup & Restore
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-2.5 px-3 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'audit'
              ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Audit Trail Log
        </button>
      </div>

      {/* TAB 1: PROFIL & DATA POKOK (Dengan form NSS setelah NPSN, Kecamatan, Kabupaten, Provinsi, Nomor POS) */}
      {activeTab === 'profil' && (
        <form onSubmit={handleSaveProfile} className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Building className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Identitas Pokok Lembaga Pendidikan</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                Nama Resmi Sekolah
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => handleProfileChange('name', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* NPSN */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  NPSN (8 Digit)
                </label>
                <input
                  type="text"
                  value={profile.npsn}
                  onChange={(e) => handleProfileChange('npsn', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  required
                />
              </div>

              {/* Form NSS persis setelah NPSN */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  NSS (Nomor Statistik Sekolah)
                </label>
                <input
                  type="text"
                  value={profile.nss}
                  onChange={(e) => handleProfileChange('nss', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  placeholder="301026001004"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                Akreditasi
              </label>
              <select
                value={profile.accreditation}
                onChange={(e) => handleProfileChange('accreditation', e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="A (Unggul)">A (Unggul)</option>
                <option value="B (Baik)">B (Baik)</option>
                <option value="C">C</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                Implementasi Kurikulum
              </label>
              <input
                type="text"
                value={profile.curriculum}
                onChange={(e) => handleProfileChange('curriculum', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                Nama Kepala Sekolah
              </label>
              <input
                type="text"
                value={profile.principalName}
                onChange={(e) => handleProfileChange('principalName', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                NIP Kepala Sekolah
              </label>
              <input
                type="text"
                value={profile.principalNip}
                onChange={(e) => handleProfileChange('principalNip', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                required
              />
            </div>
          </div>

          {/* Form Nama & NIP Wakil Kepala Sekolah Bidang Kurikulum */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50">
            <div>
              <label className="block text-indigo-900 dark:text-indigo-300 font-semibold mb-1">
                Nama Wakil Kepala Sekolah Bidang Kurikulum
              </label>
              <input
                type="text"
                value={profile.vicePrincipalCurriculumName || ''}
                onChange={(e) => handleProfileChange('vicePrincipalCurriculumName', e.target.value)}
                placeholder="Contoh: Dra. Hj. Nurul Hidayati, M.Pd."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                required
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Pejabat penandatangan resmi Dokumen Jadwal Pelajaran Sekolah.
              </span>
            </div>
            <div>
              <label className="block text-indigo-900 dark:text-indigo-300 font-semibold mb-1">
                NIP Wakasek Kurikulum
              </label>
              <input
                type="text"
                value={profile.vicePrincipalCurriculumNip || ''}
                onChange={(e) => handleProfileChange('vicePrincipalCurriculumNip', e.target.value)}
                placeholder="19790815 200501 2 006"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                required
              />
            </div>
          </div>

          {/* Form Pengaturan Nomor Surat Resmi */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                Pengaturan Format Kode & Nomor Surat Kedinasan
              </h4>
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                Format Penomoran Surat Resmi
              </label>
              <input
                type="text"
                value={profile.officialLetterNumberFormat || '421.1 / {NO} / SMAN1 / {BULAN} / {TAHUN}'}
                onChange={(e) => handleProfileChange('officialLetterNumberFormat', e.target.value)}
                placeholder="Contoh: 421.1 / {NO} / SMA-NU / {BULAN} / {TAHUN}"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Dapat menggunakan parameter otomatis: <code className="text-indigo-600">{'{NO}'}</code> (Nomor Urut), <code className="text-indigo-600">{'{BULAN}'}</code> (Angka Romawi), dan <code className="text-indigo-600">{'{TAHUN}'}</code>.
              </p>
            </div>
          </div>

          {/* Form Alamat, Kecamatan, Kabupaten, Provinsi, Nomor POS */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">Alamat & Lokasi Geografis Sekolah</h4>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                Alamat Jalan / Kompleks
              </label>
              <input
                type="text"
                value={profile.address}
                onChange={(e) => handleProfileChange('address', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder="Jl. Pendidikan Merdeka No. 45"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Kecamatan
                </label>
                <input
                  type="text"
                  value={profile.subdistrict}
                  onChange={(e) => handleProfileChange('subdistrict', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="Kebayoran Baru"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Kabupaten / Kota
                </label>
                <input
                  type="text"
                  value={profile.city}
                  onChange={(e) => handleProfileChange('city', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="Jakarta Selatan"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Provinsi
                </label>
                <input
                  type="text"
                  value={profile.province}
                  onChange={(e) => handleProfileChange('province', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="DKI Jakarta"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Nomor POS (Kode Pos)
                </label>
                <input
                  type="text"
                  value={profile.postalCode}
                  onChange={(e) => handleProfileChange('postalCode', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  placeholder="12160"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                Nomor Telepon
              </label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => handleProfileChange('phone', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                Email Lembaga
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => handleProfileChange('email', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                Website Resmi
              </label>
              <input
                type="text"
                value={profile.website}
                onChange={(e) => handleProfileChange('website', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Profil & Data Pokok</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: KOP SURAT & UPLOAD LOGO SEKOLAH */}
      {activeTab === 'kop_surat' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveProfile} className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 text-xs">
            {/* Upload Logo Sekolah Section */}
            {/* Dual Logo Upload Section: Logo 1 (Kiri) & Logo 2 (Kanan) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Logo 1: Kiri (Dinas Pendidikan / Pemprov / Yayasan) */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-indigo-600" />
                      Logo 1: Sebelah Kiri Kop Surat (Dinas/Pemprov/Yayasan)
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Ditampilkan di sisi kiri kop surat kedinasan dan ikon sekolah.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <div className="w-20 h-20 rounded-full border-2 border-indigo-200 dark:border-indigo-900 p-1 bg-white flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                    <img
                      src={logoPreview || profile.logoUrl}
                      alt="Logo Kiri Preview"
                      className="w-full h-full object-contain rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="space-y-2 flex-1 text-xs">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-[11px]">
                        Upload Berkas Logo Kiri
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileUpload}
                        className="block w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-[11px]">
                        Atau URL Tautan Logo Kiri
                      </label>
                      <input
                        type="text"
                        value={profile.logoUrl}
                        onChange={(e) => {
                          handleProfileChange('logoUrl', e.target.value);
                          setLogoPreview(e.target.value);
                        }}
                        placeholder="https://example.com/logo-dinas.png"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[10px]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Logo 2: Kanan (Sekolah / Tut Wuri Handayani) */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-emerald-600" />
                      Logo 2: Sebelah Kanan Kop Surat (Sekolah)
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Ditampilkan di sisi kanan kop surat kedinasan (simetris).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <div className="w-20 h-20 rounded-full border-2 border-emerald-200 dark:border-emerald-900 p-1 bg-white flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                    {logoRightPreview ? (
                      <img
                        src={logoRightPreview}
                        alt="Logo Kanan Preview"
                        className="w-full h-full object-contain rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400 text-center font-medium">Belum Ada Logo 2</span>
                    )}
                  </div>

                  <div className="space-y-2 flex-1 text-xs">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-[11px]">
                        Upload Berkas Logo Kanan
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoRightFileUpload}
                        className="block w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-[11px]">
                        Atau URL Tautan Logo Kanan
                      </label>
                      <input
                        type="text"
                        value={profile.logoRightUrl || ''}
                        onChange={(e) => {
                          handleProfileChange('logoRightUrl', e.target.value);
                          setLogoRightPreview(e.target.value);
                        }}
                        placeholder="https://example.com/logo-sekolah.png"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[10px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
              Konfigurasi Header Kop Surat Kedinasan
            </h3>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                Baris 1: Pemerintah Provinsi / Kabupaten / Yayasan
              </label>
              <input
                type="text"
                value={profile.letterheadProvince}
                onChange={(e) => handleProfileChange('letterheadProvince', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                Baris 2: Dinas Pendidikan dan Kebudayaan
              </label>
              <input
                type="text"
                value={profile.letterheadAgency}
                onChange={(e) => handleProfileChange('letterheadAgency', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                Baris 3: Cabang Dinas / Yayasan Penyelenggara (Opsional)
              </label>
              <input
                type="text"
                value={profile.letterheadFoundation || ''}
                onChange={(e) => handleProfileChange('letterheadFoundation', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white uppercase"
              />
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Kop Surat & Logo</span>
              </button>
            </div>
          </form>

          {/* Live Preview of Kop Surat */}
          <div className="p-6 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-indigo-600" />
              Pratinjau Kop Surat Resmi Dokumen
            </h4>
            <div className="bg-white text-slate-900 p-8 rounded-lg shadow-sm">
              <OfficialLetterhead
                profile={profile}
                documentTitle="CONTOH PRATINJAU KOP SURAT RESMI"
                documentNumber="421.1 / 001 / SMA-NU / X / 2024"
              />
              <p className="text-center text-xs text-slate-400 italic">
                (Isi dokumen cetak akan tampil di bawah garis ganda kop surat ini)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TAHUN AJARAN & SINKRONISASI DATA (Super Admin) */}
      {activeTab === 'tahun_ajaran' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  Daftar & Konfigurasi Tahun Ajaran
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Tahun ajaran aktif saat ini:{' '}
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {activeAY.year} ({activeAY.semester})
                  </span>
                </p>
              </div>

              {currentUser.role === 'super_admin' && (
                <button
                  onClick={() => setIsAddAyModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buka Tahun Ajaran Baru</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                    <th className="py-2.5 px-3">Tahun Ajaran</th>
                    <th className="py-2.5 px-3">Semester</th>
                    <th className="py-2.5 px-3">Periode Belajar</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {academicYears.map((ay) => (
                    <tr key={ay.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        {ay.year}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                        Semester {ay.semester}
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono">
                        {ay.startDate} s.d. {ay.endDate}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {ay.isActive ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            AKTIF BERJALAN
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800">
                            Arsip
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {!ay.isActive && currentUser.role === 'super_admin' ? (
                          <button
                            onClick={() => handleSwitchAcademicYear(ay.id)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer transition-colors"
                          >
                            Aktifkan
                          </button>
                        ) : (
                          <span className="text-slate-400 font-medium">Sedang Digunakan</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 text-slate-700 dark:text-slate-300 space-y-1">
              <p className="font-bold text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Fitur Sinkronisasi Data Tanpa Input Ulang
              </p>
              <p className="text-[11px] leading-relaxed">
                Saat membuka tahun ajaran baru, Super Admin dapat mengaktifkan opsi <strong>"Sinkronkan dari Tahun Ajaran Sebelumnya"</strong>. Seluruh data rombel kelas, kurikulum mata pelajaran, penugasan guru, dan roster siswa akan otomatis diduplikasi dan disesuaikan sehingga staf tata usaha tidak perlu menginput ulang data dari nol.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PENGATURAN TANGGAL DOKUMEN RESMI (Super Admin) */}
      {activeTab === 'tanggal_dokumen' && (
        <form onSubmit={handleSaveProfile} className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Clock className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Pengaturan Tanggal Dokumen Resmi Kedinasan
            </h3>
          </div>

          <p className="text-slate-500">
            Atur bagaimana tanggal penandatanganan dicetak pada Rapor Siswa, Rekap Presensi, Surat Keterangan, dan Berita Acara Ujian.
          </p>

          <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <input
                type="radio"
                id="doc_date_auto"
                name="doc_date_mode"
                checked={!profile.useCustomDocumentDate}
                onChange={() => handleProfileChange('useCustomDocumentDate', false)}
                className="w-4 h-4 text-indigo-600 cursor-pointer"
              />
              <label htmlFor="doc_date_auto" className="cursor-pointer font-semibold text-slate-800 dark:text-slate-200">
                Gunakan Tanggal Real-time Hari Ini Secara Otomatis
                <span className="block text-[11px] font-normal text-slate-500">
                  Tanggal dokumen akan selalu mengikuti tanggal saat dokumen dicetak oleh user.
                </span>
              </label>
            </div>

            <div className="flex items-start gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
              <input
                type="radio"
                id="doc_date_custom"
                name="doc_date_mode"
                checked={!!profile.useCustomDocumentDate}
                onChange={() => handleProfileChange('useCustomDocumentDate', true)}
                className="w-4 h-4 text-indigo-600 cursor-pointer mt-0.5"
              />
              <div className="flex-1 space-y-2">
                <label htmlFor="doc_date_custom" className="cursor-pointer font-semibold text-slate-800 dark:text-slate-200">
                  Tetapkan Tanggal Dokumen Kustom (Baku)
                  <span className="block text-[11px] font-normal text-slate-500">
                    Sangat berguna untuk pencetakan Rapor Semester serentak (misal: 20 Desember 2024) atau Ijazah/Kelulusan.
                  </span>
                </label>

                {profile.useCustomDocumentDate && (
                  <div className="pt-1">
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                      Pilih Tanggal Dokumen Resmi
                    </label>
                    <input
                      type="date"
                      value={profile.documentDate || '2024-10-11'}
                      onChange={(e) => handleProfileChange('documentDate', e.target.value)}
                      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pratinjau format tanda tangan */}
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
            <span className="font-bold text-xs">Format Tampilan pada Kanan Dokumen:</span>
            <p className="font-mono text-xs text-indigo-600 dark:text-indigo-400 mt-1">
              {profile.city},{' '}
              {profile.useCustomDocumentDate && profile.documentDate
                ? new Date(profile.documentDate).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : new Date().toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
            </p>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan Tanggal Dokumen</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4.5: DATABASE MYSQL & ARSITEKTUR SERVER WEB (KEBUTUHAN JANGKA PANJANG) */}
      {activeTab === 'database_mysql' && (
        <div className="space-y-6">
          {mysqlSavedStatus && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{mysqlSavedStatus}</span>
            </div>
          )}

          {/* MySQL Architecture Banner */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Database className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    Penyimpanan Relasional Database MySQL / MariaDB (Arsitektur Jangka Panjang)
                  </h3>
                  <p className="text-xs text-blue-200">
                    Migrasi dari Spreadsheet menjadi database relasional ACID untuk skalabilitas, keamanan multi-user, dan performa tinggi.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  MySQL 8.0+ Ready
                </span>
              </div>
            </div>

            <p className="text-[11px] text-blue-100/90 leading-relaxed pt-1 border-t border-white/10">
              Aplikasi telah dirancang dengan arsitektur Web Enterprise. Struktur tabel menampung seluruh entitas: Peserta Didik, Tenaga Pendidik, Jurusan & Rombel, Jadwal Anti-Bentrok dengan Blok Upacara/Ibadah, Modul Pembelajaran, Tugas & KKM, Bimbingan Konseling, serta Komunikasi Orang Tua.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadMySQLDump}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Skrip Skema & Data Lengkap MySQL (.sql)</span>
              </button>
            </div>
          </div>

          {/* MySQL Connection Configuration Form */}
          <form onSubmit={handleSaveMySQLConfig} className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-600" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Konfigurasi Koneksi Database Server MySQL
                </h4>
              </div>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                Koneksi: Aktif & Terverifikasi
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Host / Server IP
                </label>
                <input
                  type="text"
                  required
                  value={mysqlConfig.host}
                  onChange={(e) => setMysqlConfig({ ...mysqlConfig, host: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  placeholder="localhost atau 127.0.0.1"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Port MySQL
                </label>
                <input
                  type="number"
                  required
                  value={mysqlConfig.port}
                  onChange={(e) => setMysqlConfig({ ...mysqlConfig, port: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  placeholder="3306"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Nama Database (Schema)
                </label>
                <input
                  type="text"
                  required
                  value={mysqlConfig.database}
                  onChange={(e) => setMysqlConfig({ ...mysqlConfig, database: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  placeholder="schoolsphere_db"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Username Database
                </label>
                <input
                  type="text"
                  required
                  value={mysqlConfig.username}
                  onChange={(e) => setMysqlConfig({ ...mysqlConfig, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  placeholder="root atau school_user"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Password Database
                </label>
                <input
                  type="password"
                  value="••••••••••••"
                  readOnly
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-slate-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Interval Sinkronisasi (Menit)
                </label>
                <input
                  type="number"
                  value={mysqlConfig.syncIntervalMinutes}
                  onChange={(e) => setMysqlConfig({ ...mysqlConfig, syncIntervalMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-500">
                Terakhir disinkronkan: <strong className="font-mono text-slate-700 dark:text-slate-300">{mysqlConfig.lastSyncedAt}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Konfigurasi MySQL</span>
                </button>
              </div>
            </div>
          </form>

          {/* Database Entities Summary Card */}
          <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-600" />
              Struktur Relasional Tabel MySQL yang Dikelola
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
                <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">students</span>
                <p className="text-[11px] text-slate-500">Data NISN, kelas, presensi, orang tua multi-anak, foto kartu pelajar.</p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
                <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">teachers & positions</span>
                <p className="text-[11px] text-slate-500">NIP, status PNS/PPPK/GTY, jabatan PTK, dan rombel yang diampu.</p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
                <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">classes & majors</span>
                <p className="text-[11px] text-slate-500">Rombongan belajar, jenjang X-XII, dan jurusan (MIPA, IPS, TKJ, dsb).</p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
                <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">schedule & blocks</span>
                <p className="text-[11px] text-slate-500">Jadwal anti-bentrok, blok upacara bendera / ibadah, dan tanda tangan Wakasek.</p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
                <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">modules & assignments</span>
                <p className="text-[11px] text-slate-500">Modul ajar kurikulum, tugas, rubrik, KKM per mapel, penilaian guru.</p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
                <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">parent & teacher messages</span>
                <p className="text-[11px] text-slate-500">Komunikasi resmi personal / broadcast ke orang tua dan siswa.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: BACKUP & RESTORE */}
      {activeTab === 'backup' && (
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Cadangan Data & Pemulihan (JSON Dump)
              </h3>
              <p className="text-slate-500 text-xs">
                Ekspor seluruh data sekolah, siswa, guru, presensi, modul, dan audit log ke file cadangan.
              </p>
            </div>
            <button
              onClick={handleExportBackup}
              className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Berkas Backup (.json)</span>
            </button>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-slate-700 dark:text-slate-300 font-semibold">
              Pulihkan Data dari JSON
            </label>
            <textarea
              rows={4}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="Tempelkan isi berkas JSON cadangan di sini..."
              className="w-full p-3 font-mono text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            {importStatus && (
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{importStatus}</p>
            )}
            <div className="flex justify-end">
              <button
                onClick={handleImportBackup}
                disabled={!importJsonText.trim()}
                className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Proses Pemulihan Data</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-rose-100 dark:border-rose-950/60 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-rose-600 dark:text-rose-400">Atur Ulang ke Data Awal Demo</h4>
              <p className="text-slate-500 text-[11px]">
                Menghapus semua perubahan lokal dan mengembalikan data bawaan aplikasi.
              </p>
            </div>
            <button
              onClick={handleResetData}
              className="flex items-center gap-1.5 px-3 py-1.5 text-rose-600 border border-rose-200 dark:border-rose-900 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Database</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT TRAIL LOG */}
      {activeTab === 'audit' && (
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Audit Trail Log (Catatan Aktivitas Sistem)
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">100 Log Terbaru</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                  <th className="py-2 px-3">Waktu</th>
                  <th className="py-2 px-3">Pengguna</th>
                  <th className="py-2 px-3">Peran</th>
                  <th className="py-2 px-3">Modul</th>
                  <th className="py-2 px-3">Aksi</th>
                  <th className="py-2 px-3">Rincian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-mono text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">{log.userName}</td>
                    <td className="py-2 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 font-mono">
                        {log.role}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{log.module}</td>
                    <td className="py-2 px-3 font-mono text-indigo-600 dark:text-indigo-400 font-bold whitespace-nowrap">{log.action}</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Tambah Tahun Ajaran Baru dengan Sinkronisasi */}
      {isAddAyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Buka Tahun Ajaran Baru
              </h3>
              <button
                onClick={() => setIsAddAyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewAcademicYear} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Format Tahun Ajaran
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 2025/2026"
                  value={newAyYear}
                  onChange={(e) => setNewAyYear(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Semester
                </label>
                <select
                  value={newAySemester}
                  onChange={(e) => setNewAySemester(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="Ganjil">Semester Ganjil</option>
                  <option value="Genap">Semester Genap</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    required
                    value={newAyStartDate}
                    onChange={(e) => setNewAyStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    required
                    value={newAyEndDate}
                    onChange={(e) => setNewAyEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Opsi Sinkronisasi Otomatis */}
              <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 space-y-1">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newAyCloneFromPrevious}
                    onChange={(e) => setNewAyCloneFromPrevious(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-indigo-900 dark:text-indigo-200">
                      Sinkronkan data dari tahun ajaran sebelumnya
                    </span>
                    <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                      Menyalin rombongan belajar, kurikulum, dan penugasan guru yang sudah ada ke tahun ajaran baru secara otomatis tanpa perlu input manual.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddAyModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer"
                >
                  Aktifkan Tahun Ajaran Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
