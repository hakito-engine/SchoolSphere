import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { AuditLog, SchoolProfile } from '../types';
import { formatActionText, formatRoleText } from '../utils/formatters';
import {
  Database,
  ShieldCheck,
  Clock,
  Download,
  Upload,
  RotateCcw,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Server,
  Cloud,
  Globe,
  Terminal,
  Printer,
  Copy,
  KeyRound,
  Sparkles,
  ExternalLink,
  Code2,
} from 'lucide-react';
import { DeveloperIdentityView } from './DeveloperIdentityView';

export const SystemManagementView: React.FC = () => {
  const { currentUser } = useAuth();
  const profile = DataService.getSchoolProfile();

  const [activeTab, setActiveTab] = useState<'audit' | 'backup' | 'hosting' | 'admin_credentials' | 'developer_identity'>('audit');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => DataService.getAuditLogs());

  // Real-time audit log event listener (Request 14)
  useEffect(() => {
    const handleLogUpdate = () => {
      setAuditLogs(DataService.getAuditLogs());
    };
    window.addEventListener('schoolsphere_audit_log_updated', handleLogUpdate);
    window.addEventListener('storage', handleLogUpdate);
    return () => {
      window.removeEventListener('schoolsphere_audit_log_updated', handleLogUpdate);
      window.removeEventListener('storage', handleLogUpdate);
    };
  }, []);

  // Audit Log Filters
  const [auditSearch, setAuditSearch] = useState('');
  const [auditModuleFilter, setAuditModuleFilter] = useState('all');
  const [auditRoleFilter, setAuditRoleFilter] = useState('all');

  // Hosting sync state
  const [syncStatus, setSyncStatus] = useState<{
    online: boolean;
    server?: string;
    engine?: string;
    hasDatabase?: boolean;
    tableCounts?: Record<string, number>;
    lastSyncedAt?: string;
    message: string;
  } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // MySQL cPanel Database config state
  const [dbHost, setDbHost] = useState('localhost');
  const [dbName, setDbName] = useState('');
  const [dbUser, setDbUser] = useState('');
  const [dbPass, setDbPass] = useState('');
  const [isSavingDbConfig, setIsSavingDbConfig] = useState(false);
  const [dbConfigFeedback, setDbConfigFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    tables?: string[];
  } | null>(null);

  // Download dist.zip state
  const [isDownloadingBundle, setIsDownloadingBundle] = useState(false);

  // Super Admin Credentials state
  const [adminName, setAdminName] = useState(currentUser.name);
  const [adminUsername, setAdminUsername] = useState(currentUser.username);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminWa, setAdminWa] = useState(currentUser.phone || profile.adminWhatsapp || '');
  const [credSuccess, setCredSuccess] = useState<string | null>(null);

  useEffect(() => {
    DataService.checkServerStatus().then((st) => setSyncStatus(st)).catch(() => {});
  }, []);

  const filteredLogs = auditLogs.filter((log) => {
    const q = auditSearch.toLowerCase();
    const matchesSearch =
      log.userName.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.module.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q);

    const matchesModule = auditModuleFilter === 'all' || log.module === auditModuleFilter;
    const matchesRole = auditRoleFilter === 'all' || log.role === auditRoleFilter;

    return matchesSearch && matchesModule && matchesRole;
  });

  const uniqueModules = Array.from(new Set(auditLogs.map((l) => l.module).filter(Boolean)));

  // Export JSON Backup
  const handleExportJSON = () => {
    const jsonStr = DataService.exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SISPAM_FULL_BACKUP_${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Restore JSON Backup
  const handleRestoreJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('Apakah Anda yakin ingin memulihkan database dari berkas backup ini? Seluruh data yang ada akan diperbarui sesuai isi berkas cadangan.')) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const ok = DataService.importDatabaseJSON(text, {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
        });
        if (ok) {
          alert('Database berhasil dipulihkan secara menyeluruh!');
          window.location.reload();
        } else {
          alert('Format berkas backup tidak valid.');
        }
      } catch (err) {
        alert('Gagal memproses berkas backup JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Export MySQL SQL Script
  const handleExportSQL = () => {
    const sql = DataService.exportDatabaseMySQL();
    const blob = new Blob([sql], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SISPAM_MYSQL_DUMP_${new Date().toISOString().substring(0, 10)}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Push to Hosting Server Now
  const handlePushToHosting = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const ok = await DataService.pushToServer();
      if (ok) {
        setSyncFeedback({
          type: 'success',
          message: 'Berhasil mendorong dan menyinkronkan seluruh database ke server hosting sispam.hakito.my.id!',
        });
        const st = await DataService.checkServerStatus();
        setSyncStatus(st);
      } else {
        setSyncFeedback({
          type: 'error',
          message: 'Server hosting menolak permintaan atau file api.php belum terpasang di cPanel.',
        });
      }
    } catch (e) {
      setSyncFeedback({
        type: 'error',
        message: 'Gagal terhubung ke api.php server hosting.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Pull from Hosting Server Now
  const handlePullFromHosting = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const ok = await DataService.pullFromServer();
      if (ok) {
        setSyncFeedback({
          type: 'success',
          message: 'Berhasil menarik data terbaru dari server hosting sispam.hakito.my.id!',
        });
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setSyncFeedback({
          type: 'error',
          message: 'Data di server kosong atau koneksi ke api.php terputus.',
        });
      }
    } catch {
      setSyncFeedback({
        type: 'error',
        message: 'Gagal menarik data dari server hosting.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Test and save MySQL Database Config to cPanel
  const handleSaveDbConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbName.trim() || !dbUser.trim()) {
      setDbConfigFeedback({
        type: 'error',
        message: 'Nama Database dan Nama Pengguna Database cPanel wajib diisi.',
      });
      return;
    }

    setIsSavingDbConfig(true);
    setDbConfigFeedback(null);
    try {
      const res = await DataService.saveDatabaseConfig({
        host: dbHost.trim() || 'localhost',
        database: dbName.trim(),
        username: dbUser.trim(),
        password: dbPass,
      });

      if (res.success) {
        setDbConfigFeedback({
          type: 'success',
          message: res.message || 'Koneksi MySQL phpMyAdmin cPanel berhasil dihubungkan!',
          tables: res.tablesCreated,
        });

        // Automatically push current local state to populate newly connected MySQL relational tables
        await DataService.pushToServer();

        // Refresh status
        const st = await DataService.checkServerStatus();
        setSyncStatus(st);
      } else {
        setDbConfigFeedback({
          type: 'error',
          message: res.message || 'Koneksi gagal. Pastikan hak akses pengguna database di cPanel sudah "ALL PRIVILEGES".',
        });
      }
    } catch (err: any) {
      setDbConfigFeedback({
        type: 'error',
        message: err.message || 'Terjadi kesalahan jaringan saat menyimpan konfigurasi database.',
      });
    } finally {
      setIsSavingDbConfig(false);
    }
  };

  // Download dist.zip
  const handleDownloadHostingBundle = async () => {
    setIsDownloadingBundle(true);
    try {
      const res = await fetch('./dist.zip');
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sispam-dist.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        window.location.href = './dist.zip';
      }
    } catch {
      window.location.href = './dist.zip';
    } finally {
      setIsDownloadingBundle(false);
    }
  };

  // Save Super Admin Credentials
  const handleSaveAdminCreds = (e: React.FormEvent) => {
    e.preventDefault();
    const res = DataService.updateSuperAdminCredentials(
      {
        name: adminName,
        username: adminUsername,
        password: adminPassword || undefined,
        whatsapp: adminWa,
      },
      {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      }
    );

    if (res.success) {
      setCredSuccess(res.message);
      setTimeout(() => setCredSuccess(null), 3000);
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <span>Manajemen Sistem, Audit Trail & Sinkronisasi Hosting</span>
          </h2>
          <p className="text-xs text-slate-500">
            Pusat pemantauan audit trail keamanan, cadangan database otomatis, dan koneksi server hosting cPanel RumahWeb (sispam.hakito.my.id).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadHostingBundle}
            disabled={isDownloadingBundle}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloadingBundle ? 'Mengunduh...' : 'Unduh dist.zip (cPanel)'}</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-4 font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'audit'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Audit Trail Aktivitas ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`pb-3 px-4 font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'backup'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Backup & Pemulihan Database</span>
        </button>

        <button
          onClick={() => setActiveTab('hosting')}
          className={`pb-3 px-4 font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'hosting'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>Sinkronisasi Hosting (sispam.hakito.my.id)</span>
        </button>

        <button
          onClick={() => setActiveTab('admin_credentials')}
          className={`pb-3 px-4 font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'admin_credentials'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Kredensial Super Admin</span>
        </button>

        <button
          onClick={() => setActiveTab('developer_identity')}
          className={`pb-3 px-4 font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'developer_identity'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Identitas Pengembang</span>
        </button>
      </div>

      {/* TAB 1: AUDIT TRAIL AKTIVITAS (Request 14) */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Audit Trail Log Keamanan & Aktivitas Terintegrasi</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Setiap aktivitas (Login, Presensi, Jurnal, Piket, CBT, Perubahan Nilai, Penambahan Siswa/Guru/Tendik) otomatis tercatat tanpa henti.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAuditLogs(DataService.getAuditLogs())}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Segarkan Log</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Log</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari aksi, pengguna, atau rincian..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full bg-transparent text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div>
                <select
                  value={auditModuleFilter}
                  onChange={(e) => setAuditModuleFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="all">Semua Modul Aplikasi</option>
                  {uniqueModules.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={auditRoleFilter}
                  onChange={(e) => setAuditRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="all">Semua Peran Pengguna</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="kepala_sekolah">Kepala Sekolah</option>
                  <option value="wakasek_kurikulum">Wakasek Kurikulum</option>
                  <option value="guru">Guru Mata Pelajaran</option>
                  <option value="wali_kelas">Wali Kelas</option>
                  <option value="guru_bk">Guru BK</option>
                  <option value="tendik">Tendik</option>
                  <option value="siswa">Siswa</option>
                  <option value="orang_tua">Orang Tua</option>
                </select>
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                    <th className="py-3 px-4">Waktu (WIB)</th>
                    <th className="py-3 px-4">Pengguna & Peran</th>
                    <th className="py-3 px-4">Aksi</th>
                    <th className="py-3 px-4">Modul</th>
                    <th className="py-3 px-4">Rincian Aktivitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                        Tidak ada catatan aktivitas yang cocok dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                          {log.timestamp}
                        </td>

                        <td className="py-2.5 px-4 font-sans">
                          <strong className="text-slate-900 dark:text-white block">{log.userName}</strong>
                          <span className="text-[10px] text-slate-400 capitalize">{formatRoleText(log.role)}</span>
                        </td>

                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {formatActionText(log.action)}
                          </span>
                        </td>

                        <td className="py-2.5 px-4 font-sans text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {log.module}
                        </td>

                        <td className="py-2.5 px-4 font-sans text-slate-600 dark:text-slate-400 max-w-md">
                          {log.details}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BACKUP & PEMULIHAN */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Backup JSON */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Unduh Cadangan Database Lengkap (JSON)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ekspor seluruh entitas sekolah: Siswa, Guru, Tendik, Rombel, Mapel, Jurnal, Presensi, Piket, CBT, dan Nilai.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Format Berkas:</span>
                  <strong className="font-mono text-slate-800 dark:text-slate-200">JSON (UTF-8 Standar)</strong>
                </div>
                <div className="flex justify-between">
                  <span>Keamanan:</span>
                  <span className="text-emerald-600 font-semibold">Terenkripsi & Terstruktur</span>
                </div>
              </div>

              <button
                onClick={handleExportJSON}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Cadangan Database (.json)</span>
              </button>
            </div>

            {/* Restore JSON */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Pulihkan Database dari Cadangan (JSON)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Unggah berkas JSON hasil ekspor sebelumnya untuk memulihkan seluruh data aplikasi.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-xs border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                Peringatan: Pemulihan akan memperbarui dan menyelaraskan seluruh data aplikasi dengan isi berkas cadangan.
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold text-xs mb-1.5">
                  Pilih Berkas Backup (.json)
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreJSON}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:text-white file:text-xs file:font-semibold hover:file:bg-emerald-700 cursor-pointer text-xs"
                />
              </div>
            </div>
          </div>

          {/* MySQL Dump Section */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-indigo-600" />
                  <span>Ekspor Skrip Database Relasional MySQL (.sql)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hasilkan file skrip SQL DDL & DML lengkap yang siap di-import ke phpMyAdmin cPanel RumahWeb Anda.
                </p>
              </div>

              <button
                onClick={handleExportSQL}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-2 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Skrip SQL (.sql)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SINKRONISASI HOSTING RUMAHWEB & MYSQL PHPMYADMIN */}
      {activeTab === 'hosting' && (
        <div className="space-y-6">
          {/* Status Header Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Integrasi Server & Database MySQL cPanel (sispam.hakito.my.id)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Penyimpanan tersentralisasi langsung ke database phpMyAdmin di cPanel hosting Anda.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                  syncStatus?.online
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${syncStatus?.online ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                  <span>{syncStatus?.online ? 'api.php Aktif' : 'Menghubungkan api.php...'}</span>
                </span>

                <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                  syncStatus?.engine === 'mysql_relational'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  <Database className="w-3.5 h-3.5 text-indigo-600" />
                  <span>
                    {syncStatus?.engine === 'mysql_relational'
                      ? 'Database: MySQL phpMyAdmin'
                      : 'Database: JSON Standalone'}
                  </span>
                </span>
              </div>
            </div>

            {/* Live Table Counts Badge if MySQL is active */}
            {syncStatus?.tableCounts && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Status Baris Tabel di phpMyAdmin cPanel:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Tabel users</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-sm">{syncStatus.tableCounts.users ?? 0}</strong> baris
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Tabel students</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-sm">{syncStatus.tableCounts.students ?? 0}</strong> baris
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Tabel teachers</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-sm">{syncStatus.tableCounts.teachers ?? 0}</strong> baris
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Tabel duty_journals</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-sm">{syncStatus.tableCounts.duty_journals ?? 0}</strong> baris
                  </div>
                </div>
              </div>
            )}

            {syncFeedback && (
              <div className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
                syncFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950 dark:text-rose-200'
              }`}>
                {syncFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{syncFeedback.message}</span>
              </div>
            )}

            {/* Quick Sync Push & Pull Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <span>Kirim Seluruh Data Lokal ke Database MySQL (Push)</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Unggah seluruh data lokal saat ini ke tabel MySQL phpMyAdmin di sispam.hakito.my.id sehingga langsung tampil di phpMyAdmin dan dapat diakses perangkat lain.
                </p>
                <button
                  onClick={handlePushToHosting}
                  disabled={isSyncing}
                  className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isSyncing ? 'Menyinkronkan...' : 'Kirim / Push Data ke MySQL Sekarang'}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Tarik Data Terbaru dari Database MySQL (Pull)</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Ambil data mutakhir dari tabel database server hosting sispam.hakito.my.id ke browser ini tanpa menimpa perubahan lokal yang lebih baru.
                </p>
                <button
                  onClick={handlePullFromHosting}
                  disabled={isSyncing}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isSyncing ? 'Menyinkronkan...' : 'Tarik / Pull Data dari MySQL'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Form Konfigurasi Database MySQL cPanel */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Pengaturan Koneksi Database MySQL cPanel
                </h3>
                <p className="text-xs text-slate-500">
                  Masukkan nama database, username, dan password MySQL dari cPanel Anda untuk menghubungkan phpMyAdmin secara langsung.
                </p>
              </div>
            </div>

            {dbConfigFeedback && (
              <div className={`p-4 rounded-xl text-xs space-y-2 ${
                dbConfigFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950 dark:text-rose-200'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  {dbConfigFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{dbConfigFeedback.message}</span>
                </div>
                {dbConfigFeedback.tables && dbConfigFeedback.tables.length > 0 && (
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-mono">
                    Tabel relasional aktif: {dbConfigFeedback.tables.join(', ')}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSaveDbConfig} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Database Host
                </label>
                <input
                  type="text"
                  required
                  value={dbHost}
                  onChange={(e) => setDbHost(e.target.value)}
                  placeholder="localhost"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
                <span className="text-[10px] text-slate-400">Biasanya tetap "localhost" pada cPanel RumahWeb</span>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Nama Database cPanel (Database Name)
                </label>
                <input
                  type="text"
                  required
                  value={dbName}
                  onChange={(e) => setDbName(e.target.value)}
                  placeholder="contoh: u1234567_sispam"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
                <span className="text-[10px] text-slate-400">Sesuai nama database di menu MySQL Databases cPanel</span>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Nama Pengguna Database (Database User)
                </label>
                <input
                  type="text"
                  required
                  value={dbUser}
                  onChange={(e) => setDbUser(e.target.value)}
                  placeholder="contoh: u1234567_admin"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
                <span className="text-[10px] text-slate-400">User cPanel yang ditambahkan ke database</span>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Kata Sandi Database (Database Password)
                </label>
                <input
                  type="password"
                  value={dbPass}
                  onChange={(e) => setDbPass(e.target.value)}
                  placeholder="Ketik password pengguna database..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
                <span className="text-[10px] text-slate-400">Password user MySQL yang dibuat di cPanel</span>
              </div>

              <div className="sm:col-span-2 pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="submit"
                  disabled={isSavingDbConfig}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Database className="w-4 h-4" />
                  <span>{isSavingDbConfig ? 'Menghubungkan & Memverifikasi Tabel...' : 'Tes & Simpan Koneksi Database cPanel'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportSQL}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Script SQL (sispam_database.sql)</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: KREDENSIAL SUPER ADMIN */}
      {activeTab === 'admin_credentials' && (
        <div className="space-y-6 max-w-xl">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 text-xs">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-600" />
                <span>Pengaturan Akun Super Admin & Nomor Darurat</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nomor WhatsApp ini otomatis terhubung dengan tombol "Bantuan Lupa Password" di halaman login untuk pemulihan akun guru dan siswa.
              </p>
            </div>

            {credSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-800 dark:text-emerald-200 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{credSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveAdminCreds} className="space-y-3.5">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Nama Lengkap Super Admin
                </label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Username Super Admin (Huruf Kecil Tanpa Spasi)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 font-mono text-slate-400">@</span>
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                    className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Kata Sandi Baru (Kosongkan jika tidak ingin mengubah)
                </label>
                <input
                  type="password"
                  placeholder="Ketik password baru jika ingin mengubah..."
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  No. WhatsApp Admin (Penerima Permohonan Reset Password)
                </label>
                <input
                  type="text"
                  required
                  placeholder="0812-9988-7711"
                  value={adminWa}
                  onChange={(e) => setAdminWa(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Simpan Kredensial Super Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: IDENTITAS PENGEMBANG */}
      {activeTab === 'developer_identity' && (
        <DeveloperIdentityView />
      )}
    </div>
  );
};
