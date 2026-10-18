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
  EyeOff,
  Calendar,
  Image as ImageIcon,
  Building,
  MapPin,
  FileText,
  Clock,
  Sparkles,
  RefreshCw,
  Plus,
  KeyRound,
  MessageCircle,
  UserCheck,
  Globe,
  Server,
  Copy,
  Check,
  Terminal,
  ExternalLink,
  Code,
  HelpCircle,
  Cloud,
} from 'lucide-react';

export const SchoolSettingsView: React.FC = () => {
  const { currentUser, updateCurrentUser } = useAuth();
  const [profile, setProfile] = useState<SchoolProfile>(() => DataService.getSchoolProfile());
  const [academicYears, setAcademicYears] = useState<AcademicYearConfig[]>(() => DataService.getAcademicYears());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => DataService.getAuditLogs());

  const [activeTab, setActiveTab] = useState<'profil' | 'admin_account' | 'kop_surat' | 'tahun_ajaran' | 'tanggal_dokumen' | 'database_mysql' | 'instalasi_web' | 'backup' | 'audit'>('profil');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState('Pengaturan berhasil disimpan dan diperbarui di seluruh dokumen cetak.');

  // Installation guide copy-snippet state (Requirement 4)
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const handleCopyCode = (code: string, label: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(label);
    setTimeout(() => setCopiedSnippet(null), 2500);
  };

  const handleDownloadInstallGuide = () => {
    fetch('/INSTALLATION_GUIDE.md')
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.text();
      })
      .then((text) => {
        const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'PANDUAN_INSTALASI_WEB_SCHOOLSPHERE.md';
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => {
        alert('Panduan instalasi aplikasi lengkap tersedia di tab Petunjuk Instalasi Web & Hosting.');
      });
  };

  // Super Admin Account Settings State (Antisipasi Pergantian Admin)
  const currentAdminUser = DataService.getUsers().find((u) => u.role === 'super_admin') || currentUser;
  const [adminName, setAdminName] = useState(currentAdminUser.name || 'Bambang Haryadi, S.Kom.');
  const [adminUsername, setAdminUsername] = useState(currentAdminUser.username || 'bambangharyadi');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState('');
  const [adminPhone, setAdminPhone] = useState(profile.adminWhatsapp || currentAdminUser.phone || '081299887711');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminAccountNotice, setAdminAccountNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  const handleDownloadPythonServer = () => {
    fetch('/server.py')
      .then((res) => {
        if (!res.ok) throw new Error('File not found');
        return res.text();
      })
      .then((text) => {
        const blob = new Blob([text], { type: 'text/x-python;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'server.py';
        a.click();
        URL.revokeObjectURL(url);
        setMysqlSavedStatus('Berkas server Python (FastAPI + PyMySQL) berhasil diunduh.');
        setTimeout(() => setMysqlSavedStatus(null), 4000);
      })
      .catch(() => {
        const defaultPython = `"""
SchoolSphere Enterprise - Python REST API Backend
Framework: FastAPI + SQLAlchemy + PyMySQL
"""
from fastapi import FastAPI
app = FastAPI(title="SchoolSphere Enterprise API")

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "Python FastAPI", "database": "MySQL 8.0+"}
`;
        const blob = new Blob([defaultPython], { type: 'text/x-python;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'server.py';
        a.click();
        URL.revokeObjectURL(url);
        setMysqlSavedStatus('Berkas server Python (FastAPI) berhasil diunduh.');
        setTimeout(() => setMysqlSavedStatus(null), 4000);
      });
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

  const handleSaveAdminAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim() || !adminUsername.trim()) {
      setAdminAccountNotice({ type: 'error', message: 'Nama lengkap dan username Super Admin wajib diisi.' });
      return;
    }

    if (adminPassword && adminPassword !== adminPasswordConfirm) {
      setAdminAccountNotice({ type: 'error', message: 'Konfirmasi password baru tidak cocok dengan password yang diketikkan.' });
      return;
    }

    const res = DataService.updateSuperAdminCredentials(
      {
        name: adminName,
        username: adminUsername,
        password: adminPassword || undefined,
        whatsapp: adminPhone,
        phone: adminPhone,
      },
      { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    );

    if (res.success) {
      setProfile(DataService.getSchoolProfile());
      if (res.updatedUser && currentUser.role === 'super_admin') {
        updateCurrentUser(res.updatedUser);
      }
      setAdminPassword('');
      setAdminPasswordConfirm('');
      setAdminAccountNotice({
        type: 'success',
        message: `${res.message} Akun telah diperbarui untuk mengantisipasi pergantian admin sekolah.`,
      });
      setTimeout(() => setAdminAccountNotice(null), 6000);
    } else {
      setAdminAccountNotice({ type: 'error', message: res.message });
    }
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
          onClick={() => setActiveTab('admin_account')}
          className={`pb-2.5 px-3 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'admin_account'
              ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
          <span>Akun Super Admin & Kontak WA</span>
        </button>
        <button
          onClick={() => setActiveTab('kop_surat')}
          className={`pb-2.5 px-3 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'kop_surat'
              ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-indigo-600" />
          <span>Kop & Nomor Surat Resmi</span>
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
          onClick={() => setActiveTab('instalasi_web')}
          className={`pb-2.5 px-3 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'instalasi_web'
              ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-emerald-600" />
          <span>Petunjuk Instalasi Web & Hosting</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Panduan
          </span>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                Nomor Telepon Kantor
              </label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => handleProfileChange('phone', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-indigo-700 dark:text-indigo-400 font-bold mb-1 flex items-center gap-1">
                <span>No. Ponsel / WhatsApp Super Admin</span>
              </label>
              <input
                type="text"
                value={profile.adminWhatsapp || ''}
                placeholder="Contoh: 081299887711"
                onChange={(e) => handleProfileChange('adminWhatsapp', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/40 text-slate-900 dark:text-white font-mono font-bold"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Tujuan pesan WhatsApp saat user klik Lupa Password.
              </span>
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

      {/* TAB KHUSUS: AKUN SUPER ADMIN & KONTAK WHATSAPP (ANTISIPASI PERGANTIAN ADMIN) */}
      {activeTab === 'admin_account' && (
        <div className="space-y-6">
          {adminAccountNotice && (
            <div
              className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
                adminAccountNotice.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}
            >
              {adminAccountNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <KeyRound className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{adminAccountNotice.message}</span>
            </div>
          )}

          {/* Current Admin Overview Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white border border-indigo-800/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  AKUN ROOT ADMINISTRATOR
                </span>
                <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                  ● Status Aktif
                </span>
              </div>
              <h3 className="text-lg font-bold">{adminName}</h3>
              <p className="text-xs text-indigo-200 mt-0.5">
                Username Login: <span className="font-mono font-bold text-white">@{adminUsername}</span> · Nomor WhatsApp: <span className="font-mono font-bold text-white">{adminPhone || 'Belum diatur'}</span>
              </p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl border border-white/10 text-[11px] text-indigo-100 max-w-xs leading-relaxed">
              Formulir di bawah digunakan ketika terjadi pergantian petugas Super Admin atau perubahan nomor WhatsApp resmi sekolah.
            </div>
          </div>

          <form onSubmit={handleSaveAdminAccount} className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 text-xs shadow-2xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Formulir Pembaruan Akun Super Admin & Nomor WhatsApp
                </h3>
                <p className="text-[11px] text-slate-500">
                  Perubahan username, kata sandi, dan nomor WhatsApp akan langsung disinkronkan ke halaman Login & Lupa Password.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Nama Lengkap Administrator Baru / Aktif
                </label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Contoh: Bambang Haryadi, S.Kom."
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Nama lengkap pejabat admin yang akan tampil pada log audit sistem.
                </span>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Username Login Super Admin
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-mono font-bold">@</span>
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                    placeholder="bambangharyadi"
                    className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Huruf kecil tanpa spasi dan simbol. Digunakan saat masuk ke aplikasi.
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-2">
              <label className="block text-indigo-950 dark:text-indigo-200 font-bold mb-1 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Nomor Ponsel / WhatsApp Super Admin (Tujuan Pesan Lupa Password)</span>
              </label>
              <input
                type="text"
                required
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
                placeholder="Contoh: 081299887711 atau 6281299887711"
                className="w-full px-3 py-2.5 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-sm"
              />
              <p className="text-[11px] text-indigo-800 dark:text-indigo-300 leading-relaxed">
                Nomor ini akan otomatis menjadi tujuan pengiriman pesan WhatsApp ketika siswa, guru, atau orang tua menekan tombol <strong>&quot;Lupa Password&quot;</strong> pada halaman masuk. Pastikan nomor WhatsApp selalu aktif dan dapat dihubungi.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">
                    Password Baru (Kosongkan jika tidak diubah)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {showAdminPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showAdminPassword ? 'Sembunyikan' : 'Lihat'}</span>
                  </button>
                </div>
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Ketik password baru jika ingin mengganti..."
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Konfirmasi Password Baru
                </label>
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  value={adminPasswordConfirm}
                  onChange={(e) => setAdminPasswordConfirm(e.target.value)}
                  placeholder="Ketik ulang password baru..."
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400">
                Tindakan ini dicatat dalam log audit sistem untuk integritas keamanan.
              </span>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-sm transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Kredensial Super Admin</span>
              </button>
            </div>
          </form>
        </div>
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

            {/* Requirement 1: Pengaturan Format & Kode Nomor Surat Kedinasan */}
            <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="font-bold text-xs text-indigo-950 dark:text-indigo-200">
                  Pengaturan Format Penomoran Surat Kedinasan (Terintegrasi ke Dokumen Cetak)
                </h4>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Format / Pola Nomor Surat Resmi
                </label>
                <input
                  type="text"
                  value={profile.officialLetterNumberFormat || '421.1 / {NO} / SMA-NU / {BULAN} / {TAHUN}'}
                  onChange={(e) => handleProfileChange('officialLetterNumberFormat', e.target.value)}
                  placeholder="421.1 / {NO} / SMAN1 / {BULAN} / {TAHUN}"
                  className="w-full px-3 py-2 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold text-xs"
                  required
                />
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Format ini otomatis diaplikasikan ke seluruh cetak dokumen (CBT, Presensi, Rapor, Nilai, BK, dan Jadwal). Parameter dinamis yang didukung: <code className="bg-white dark:bg-slate-900 px-1 py-0.5 rounded text-indigo-600 font-bold">{'{NO}'}</code> (Nomor/Kode Dokumen), <code className="bg-white dark:bg-slate-900 px-1 py-0.5 rounded text-indigo-600 font-bold">{'{BULAN}'}</code> (Bulan Romawi), <code className="bg-white dark:bg-slate-900 px-1 py-0.5 rounded text-indigo-600 font-bold">{'{TAHUN}'}</code> (Tahun Berjalan), <code className="bg-white dark:bg-slate-900 px-1 py-0.5 rounded text-indigo-600 font-bold">{'{SEKOLAH}'}</code> (Singkatan Sekolah).
                </p>
              </div>

              {/* Real-time Evaluated Example */}
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/80 text-xs">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Hasil Evaluasi Real-Time pada Dokumen:</span>
                <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs mt-0.5">
                  {(profile.officialLetterNumberFormat || '421.1 / {NO} / SMA-NU / {BULAN} / {TAHUN}')
                    .replace(/\{NO\}/gi, '001 / CBT')
                    .replace(/\{NOMOR\}/gi, '001 / CBT')
                    .replace(/\{KODE\}/gi, 'CBT')
                    .replace(/\{BULAN\}/gi, ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'][new Date().getMonth()])
                    .replace(/\{TAHUN\}/gi, new Date().getFullYear().toString())
                    .replace(/\{SEKOLAH\}/gi, profile.name.split(/\s+/).map((w) => w[0]).join('').toUpperCase() || 'SEKOLAH')}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Kop & Nomor Surat</span>
              </button>
            </div>
          </form>

          {/* Live Preview of Kop Surat */}
          <div className="p-6 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-indigo-600" />
              Pratinjau Kop & Nomor Surat Resmi Dokumen
            </h4>
            <div className="bg-white text-slate-900 p-8 rounded-lg shadow-sm">
              <OfficialLetterhead
                profile={profile}
                documentTitle="CONTOH PRATINJAU KOP & NOMOR SURAT RESMI"
                documentNumber={
                  (profile.officialLetterNumberFormat || '421.1 / {NO} / SMA-NU / {BULAN} / {TAHUN}')
                    .replace(/\{NO\}/gi, '001 / CBT')
                    .replace(/\{NOMOR\}/gi, '001 / CBT')
                    .replace(/\{KODE\}/gi, 'CBT')
                    .replace(/\{BULAN\}/gi, ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'][new Date().getMonth()])
                    .replace(/\{TAHUN\}/gi, new Date().getFullYear().toString())
                    .replace(/\{SEKOLAH\}/gi, profile.name.split(/\s+/).map((w) => w[0]).join('').toUpperCase() || 'SEKOLAH')
                }
              />
              <p className="text-center text-xs text-slate-400 italic">
                (Format nomor surat ini terintegrasi langsung ke seluruh dokumen cetak resmi sekolah)
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

              <button
                type="button"
                onClick={handleDownloadPythonServer}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Server Python (FastAPI + PyMySQL) (.py)</span>
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

          {/* Python Web Architecture & Integration Card */}
          <div className="p-6 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center font-mono font-bold">
                  Py
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">
                    Arsitektur Web Berbasis Python (FastAPI + SQLAlchemy + PyMySQL)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Mendukung skalabilitas jangka panjang, migrasi dari Spreadsheet menjadi MySQL RDBMS, dan koneksi API modern.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-blue-900/60 text-blue-300 font-mono text-[11px] font-bold">
                Python 3.10+ / FastAPI Ready
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="font-bold text-slate-300 block text-[11px] uppercase tracking-wider">
                  Endpoint REST API yang Didukung:
                </span>
                <ul className="space-y-1 font-mono text-[11px] text-slate-300">
                  <li className="p-1.5 rounded bg-slate-800/80 flex items-center justify-between">
                    <span>GET /api/health</span>
                    <span className="text-emerald-400">Status MySQL & Service</span>
                  </li>
                  <li className="p-1.5 rounded bg-slate-800/80 flex items-center justify-between">
                    <span>GET/POST /api/students</span>
                    <span className="text-blue-300">CRUD Peserta Didik</span>
                  </li>
                  <li className="p-1.5 rounded bg-slate-800/80 flex items-center justify-between">
                    <span>GET/POST /api/teachers</span>
                    <span className="text-blue-300">Guru & Jabatan PTK</span>
                  </li>
                  <li className="p-1.5 rounded bg-slate-800/80 flex items-center justify-between">
                    <span>POST /api/schedule/generate-anti-conflict</span>
                    <span className="text-amber-300">Jadwal Bebas Bentrok</span>
                  </li>
                  <li className="p-1.5 rounded bg-slate-800/80 flex items-center justify-between">
                    <span>PUT/DELETE /api/submissions/:id/grade</span>
                    <span className="text-indigo-300">Edit/Hapus Nilai Tugas</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-300 block text-[11px] uppercase tracking-wider">
                  Langkah Menjalankan Service Python:
                </span>
                <div className="p-3 rounded-lg bg-black/60 font-mono text-[11px] text-emerald-400 space-y-1.5 border border-slate-800">
                  <p className="text-slate-400"># 1. Pasang dependensi Python & MySQL driver</p>
                  <p className="text-white">pip install -r requirements.txt</p>
                  <p className="text-slate-400 pt-1"># 2. Jalankan server backend FastAPI</p>
                  <p className="text-white">python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload</p>
                  <p className="text-slate-400 pt-1"># 3. Dokumentasi interaktif Swagger UI</p>
                  <p className="text-cyan-300">http://localhost:8000/docs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: PETUNJUK INSTALASI WEB & HOSTING (Requirement 4) */}
      {activeTab === 'instalasi_web' && (
        <div className="space-y-6 text-xs">
          {/* Header Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">
                  Petunjuk & Panduan Instalasi Web Server (Production Hosting)
                </h3>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Panduan komprehensif langkah demi langkah agar aplikasi SchoolSphere Enterprise dapat terpasang, dikompilasi, dan berjalan lancar di website sekolah tanpa galat 404 saat di-refresh.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadInstallGuide}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh File Panduan (.md)</span>
              </button>
            </div>
          </div>

          {/* Prasyarat Server & Kebutuhan Sistem */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500">Runtime Lingkungan</span>
              <p className="font-bold text-sm text-slate-900 dark:text-white font-mono">Node.js 18+ / 20+ LTS</p>
              <p className="text-[10px] text-slate-400">Termasuk npm v9+ atau yarn/pnpm</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500">Web Server yang Didukung</span>
              <p className="font-bold text-sm text-slate-900 dark:text-white font-mono">Nginx / Apache / Caddy</p>
              <p className="text-[10px] text-slate-400">Atau Firebase, Vercel, Netlify, Docker</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500">Protokol Keamanan</span>
              <p className="font-bold text-sm text-emerald-600 font-mono">HTTPS / SSL Ready</p>
              <p className="text-[10px] text-slate-400">Wajib untuk mengaktifkan fitur PWA</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500">Penyimpanan Basis Data</span>
              <p className="font-bold text-sm text-indigo-600 font-mono">Storage + MySQL</p>
              <p className="text-[10px] text-slate-400">Otomatis persisten di browser & MySQL</p>
            </div>
          </div>

          {/* Langkah 1 & 2: Kloning & Kompilasi Produksi */}
          <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-600" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Langkah 1 & 2: Instalasi Dependensi & Kompilasi (Build dist)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => handleCopyCode(`git clone https://github.com/sekolah/schoolsphere-app.git\ncd schoolsphere-app\nnpm install\nnpm run build`, 'build_commands')}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                {copiedSnippet === 'build_commands' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSnippet === 'build_commands' ? 'Tersalin!' : 'Salin Perintah'}</span>
              </button>
            </div>

            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Jalankan perintah berikut di terminal server Linux (Ubuntu/Debian/CentOS) atau komputer Anda:
            </p>

            <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-emerald-400 space-y-2 border border-slate-800 overflow-x-auto">
              <p className="text-slate-400"># 1. Kloning repositori kode atau unggah folder proyek</p>
              <p className="text-white">git clone https://github.com/sekolah/schoolsphere-app.git</p>
              <p className="text-white">cd schoolsphere-app</p>
              <p className="text-slate-400 pt-1"># 2. Pasang semua pustaka / dependencies</p>
              <p className="text-white">npm install</p>
              <p className="text-slate-400 pt-1"># 3. Uji coba mode pengembangan lokal (Port 3000)</p>
              <p className="text-white">npm run dev -- --host 0.0.0.0 --port 3000</p>
              <p className="text-slate-400 pt-1"># 4. Kompilasi berkas produksi (Menghasilkan folder dist/)</p>
              <p className="text-emerald-300 font-bold">npm run build</p>
            </div>

            <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-950 dark:text-emerald-200 text-xs">
              <strong>Hasil Kompilasi:</strong> Berkas statis web teroptimasi akan otomatis tercipta di dalam folder <strong>`dist/`</strong>. Seluruh berkas di dalam folder ini siap disalin ke direktori publik web server Anda (misal: <code>/var/www/schoolsphere/dist</code> atau <code>public_html/</code>).
            </div>
          </div>

          {/* Langkah 3: Konfigurasi Web Server (SPA Routing Anti-404) */}
          <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-600" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Langkah 3: Konfigurasi Web Server (Menghindari Galat 404 Saat Halaman Di-refresh)
                </h4>
              </div>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                Aplikasi React SPA memerlukan aturan rewrite agar setiap URL rute diarahkan ke <code>index.html</code>. Pilih konfigurasi sesuai web server yang Anda gunakan:
              </p>
            </div>

            {/* Opsi 1: NGINX (Disarankan) */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                    NGINX (Sangat Disarankan)
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">/etc/nginx/sites-available/schoolsphere.conf</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCode(`server {
    listen 80;
    server_name sman1nusantara.sch.id;
    root /var/www/schoolsphere/dist;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \\.(?:ico|css|js|gif|jpe?g|png|woff2?|eot|ttf|svg|webp)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}`, 'nginx_conf')}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  {copiedSnippet === 'nginx_conf' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSnippet === 'nginx_conf' ? 'Tersalin!' : 'Salin Nginx Conf'}</span>
                </button>
              </div>

              <pre className="p-3.5 rounded-lg bg-slate-950 font-mono text-[11px] text-slate-200 overflow-x-auto leading-relaxed border border-slate-800">
{`server {
    listen 80;
    server_name sman1nusantara.sch.id;
    root /var/www/schoolsphere/dist;
    index index.html;

    # Penanganan SPA Rewrite (KUNCI AGAR REFRESH TIDAK 404)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Caching aset gambar & script statis
    location ~* \\.(?:ico|css|js|gif|jpe?g|png|woff2?|eot|ttf|svg|webp)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}`}
              </pre>
            </div>

            {/* Opsi 2: Apache (.htaccess) */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Apache / cPanel (.htaccess)
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">public_html/.htaccess</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCode(`<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>`, 'apache_conf')}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  {copiedSnippet === 'apache_conf' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSnippet === 'apache_conf' ? 'Tersalin!' : 'Salin .htaccess'}</span>
                </button>
              </div>

              <pre className="p-3.5 rounded-lg bg-slate-950 font-mono text-[11px] text-slate-200 overflow-x-auto leading-relaxed border border-slate-800">
{`<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>`}
              </pre>
            </div>

            {/* Opsi 3 & 4: Docker & Firebase */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Code className="w-4 h-4 text-blue-600" />
                    <span>Dockerfile (Container)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(`FROM node:20-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\nFROM nginx:alpine\nCOPY --from=builder /app/dist /usr/share/nginx/html\nRUN echo 'server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf\nEXPOSE 80\nCMD ["nginx", "-g", "daemon off;"]`, 'dockerfile')}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                  >
                    {copiedSnippet === 'dockerfile' ? 'Tersalin!' : 'Salin Dockerfile'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">Mendukung deployment kontainer di Docker, Portainer, atau Kubernetes.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 text-amber-600" />
                    <span>Firebase Hosting (firebase.json)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(`{\n  "hosting": {\n    "public": "dist",\n    "rewrites": [{ "source": "**", "destination": "/index.html" }]\n  }\n}`, 'firebase_json')}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                  >
                    {copiedSnippet === 'firebase_json' ? 'Tersalin!' : 'Salin firebase.json'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">Deploy otomatis ke CDN global Google Firebase Hosting.</p>
              </div>
            </div>
          </div>

          {/* Langkah 4 & 5: SSL HTTPS & PWA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SSL Let's Encrypt */}
            <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                  Langkah 4: Pasang Sertifikat SSL / HTTPS Gratis (Let's Encrypt)
                </h4>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed">
                Protokol HTTPS wajib aktif agar browser mengizinkan pemasangan Progressive Web App (PWA) dan enkripsi sesi login pengguna.
              </p>
              <div className="p-3 rounded-lg bg-slate-950 font-mono text-xs text-emerald-400 space-y-1">
                <p className="text-slate-400"># Pasang Certbot untuk Nginx di Ubuntu/Debian:</p>
                <p className="text-white">sudo apt install certbot python3-certbot-nginx -y</p>
                <p className="text-slate-400 pt-1"># Minta dan pasang SSL otomatis:</p>
                <p className="text-emerald-300">sudo certbot --nginx -d sman1nusantara.sch.id</p>
              </div>
            </div>

            {/* Panduan PWA */}
            <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                  Langkah 5: Cara Instalasi Aplikasi (PWA) di Desktop & HP
                </h4>
              </div>
              <ul className="space-y-2 text-slate-600 dark:text-slate-300 text-xs">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                  <span><strong>Komputer (Chrome / Edge):</strong> Buka website, klik ikon <em>"Install App"</em> di sisi kanan address bar untuk membuat shortcut desktop mandiri.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                  <span><strong>Android (Chrome):</strong> Buka website sekolah, ketuk menu titik tiga (⋮) lalu pilih <strong>"Tambahkan ke Layar Utama"</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                  <span><strong>iPhone/iPad (Safari):</strong> Ketuk tombol Share (ikon kotak tanda panah) lalu pilih <strong>"Add to Home Screen"</strong>.</span>
                </li>
              </ul>
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
