import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { StaffMember } from '../types';
import {
  Briefcase,
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  Clock,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  X,
  Filter,
} from 'lucide-react';

const STAFF_POSITIONS = [
  'Kepala Tata Usaha (KTU)',
  'Staf Administrasi & Kepegawaian',
  'Staf Keuangan / Bendahara BOS',
  'Laboran & Teknisi Komputer/IT',
  'Pengelola Perpustakaan',
  'Petugas Keamanan / Satpam',
  'Petugas Kebersihan / Caraka',
  'Operator Dapodik',
  'Tenaga Kebersihan Lingkungan',
];

export const TendikView: React.FC = () => {
  const { currentUser } = useAuth();
  const [staffList, setStaffList] = useState<StaffMember[]>(() => DataService.getStaff());

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [positionFilter, setPositionFilter] = useState<string>('all');

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [formData, setFormData] = useState<Partial<StaffMember>>({
    name: '',
    nip: '',
    position: STAFF_POSITIONS[0],
    roleCategory: 'tendik',
    phone: '',
    email: '',
    employmentStatus: 'PNS',
    status: 'aktif',
    workHours: '07.00 - 15.30 WIB',
  });

  // Bulk Excel Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const canManageStaff = ['super_admin', 'wakasek_kurikulum', 'operator'].includes(currentUser.role);

  const filteredStaff = staffList.filter((st) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      st.name.toLowerCase().includes(q) ||
      (st.nip && st.nip.toLowerCase().includes(q)) ||
      st.position.toLowerCase().includes(q) ||
      (st.phone && st.phone.includes(q));

    const matchesStatus = statusFilter === 'all' || st.status === statusFilter;
    const matchesPosition = positionFilter === 'all' || st.position === positionFilter;

    return matchesSearch && matchesStatus && matchesPosition;
  });

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setFormData({
      id: 'stf-' + Date.now(),
      name: '',
      nip: '',
      position: STAFF_POSITIONS[0],
      roleCategory: 'tendik',
      phone: '',
      email: '',
      employmentStatus: 'PNS',
      status: 'aktif',
      workHours: '07.00 - 15.30 WIB',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (st: StaffMember) => {
    setEditingStaff(st);
    setFormData({ ...st });
    setIsModalOpen(true);
  };

  const handleDeleteStaff = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data tenaga kependidikan "${name}"? Akses login akun pengguna juga akan otomatis dihapus.`)) {
      DataService.deleteStaff(id, {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      });
      setStaffList(DataService.getStaff());
    }
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.position) return;

    const payload: StaffMember = {
      id: editingStaff ? editingStaff.id : formData.id || 'stf-' + Date.now(),
      name: formData.name.trim(),
      nip: formData.nip?.trim() || '',
      position: formData.position,
      roleCategory: 'tendik',
      phone: formData.phone?.trim() || '',
      email: formData.email?.trim() || '',
      employmentStatus: (formData.employmentStatus as any) || 'PNS',
      status: (formData.status as any) || 'aktif',
      workHours: formData.workHours || '07.00 - 15.30 WIB',
    };

    DataService.saveStaff(payload, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });

    setStaffList(DataService.getStaff());
    setIsModalOpen(false);
  };

  // Download Excel Template for Tendik (Request 7)
  const handleDownloadTemplate = () => {
    const templateData = [
      ['No', 'Nama Lengkap', 'NIP / NUPTK / No Pegawai', 'Jabatan / Tugas', 'Status Kepegawaian', 'No WhatsApp / HP', 'Email', 'Jam Kerja'],
      [1, 'Slamet Raharjo, S.A.P.', '19820314 200801 1 003', 'Kepala Tata Usaha (KTU)', 'PNS', '0812-4455-6677', 'slamet@smanusantara.sch.id', '07.00 - 15.30 WIB'],
      [2, 'Yuliana Santoso, A.Md.', '19900512 201402 2 001', 'Staf Keuangan / Bendahara BOS', 'PPPK', '0813-9988-7711', '', '07.00 - 15.30 WIB'],
      [3, 'Agus Setiawan', '19920815 201903 1 005', 'Laboran & Teknisi Komputer/IT', 'Honorer', '0813-7766-5544', '', '07.00 - 16.00 WIB'],
      [4, 'Joko Purwanto', '', 'Petugas Keamanan / Satpam', 'Honorer', '0812-3344-5566', '', '06.30 - 17.00 WIB'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 28 },
      { wch: 25 },
      { wch: 32 },
      { wch: 18 },
      { wch: 18 },
      { wch: 28 },
      { wch: 20 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Tendik');
    XLSX.writeFile(wb, 'Template_Data_Tendik_Pegawai.xlsx');
  };

  // Import Excel with anti-duplication logic (Request 22)
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportNotice(null);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rawJson.length <= 1) {
          setImportError('Berkas kosong atau format header tidak sesuai template.');
          return;
        }

        const currentStaff = DataService.getStaff();
        const existingNips = new Set(currentStaff.map((s) => s.nip?.trim().replace(/\s+/g, '')).filter(Boolean));
        const existingNames = new Set(currentStaff.map((s) => s.name.toLowerCase().replace(/[^a-z0-9]/g, '')));

        let addedCount = 0;
        let skippedDuplicateCount = 0;

        for (let i = 1; i < rawJson.length; i++) {
          const row = rawJson[i];
          if (!row || row.length === 0) continue;

          const name = String(row[1] || '').trim();
          if (!name) continue;

          const nip = String(row[2] || '').trim();
          const position = String(row[3] || STAFF_POSITIONS[1]).trim();
          const employmentStatus = String(row[4] || 'PNS').trim();
          const phone = String(row[5] || '').trim();
          const email = String(row[6] || '').trim();
          const workHours = String(row[7] || '07.00 - 15.30 WIB').trim();

          const cleanNip = nip.replace(/\s+/g, '');
          const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');

          // Check if already exists (anti-duplicate)
          if ((cleanNip && existingNips.has(cleanNip)) || existingNames.has(cleanName)) {
            skippedDuplicateCount++;
            continue;
          }

          const newStaff: StaffMember = {
            id: 'stf-' + Date.now() + '-' + i,
            name,
            nip,
            position,
            roleCategory: 'tendik',
            phone,
            email,
            employmentStatus: (employmentStatus as any) || 'Honorer',
            status: 'aktif',
            workHours,
          };

          DataService.saveStaff(newStaff, {
            id: currentUser.id,
            name: currentUser.name,
            role: currentUser.role,
          });

          if (cleanNip) existingNips.add(cleanNip);
          existingNames.add(cleanName);
          addedCount++;
        }

        setStaffList(DataService.getStaff());
        setImportNotice(`Berhasil mengimpor ${addedCount} data tendik baru. ${skippedDuplicateCount > 0 ? `${skippedDuplicateCount} data dilewati karena sudah terdaftar sebelumnya (anti-duplikasi aktif).` : ''}`);
      } catch (err) {
        console.error('Gagal import excel tendik:', err);
        setImportError('Gagal membaca berkas Excel. Pastikan format kolom sesuai dengan template.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            <span>Data Tenaga Kependidikan (Tendik & Pegawai)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Pengelolaan data staf Tata Usaha, laboran, pustakawan, satpam, dan kebersihan. Tendik yang ditambahkan otomatis memiliki akun login sistem.
          </p>
        </div>

        {canManageStaff && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer shadow-2xs"
              title="Unduh Template Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Download Template (.xlsx)</span>
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span>Import Data (.xlsx)</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Tendik</span>
            </button>
          </div>
        )}
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs text-slate-500">Total Tenaga Kependidikan</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
            {staffList.length} Orang
          </p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Memiliki akun login aktif</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs text-slate-500">Status PNS & PPPK</span>
          <p className="text-2xl font-bold text-indigo-600 font-mono tabular-nums mt-1">
            {staffList.filter((s) => ['PNS', 'PPPK'].includes(s.employmentStatus || '')).length} Orang
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Aparatur Sipil Negara</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs text-slate-500">Honorer & Kontrak</span>
          <p className="text-2xl font-bold text-amber-600 font-mono tabular-nums mt-1">
            {staffList.filter((s) => !['PNS', 'PPPK'].includes(s.employmentStatus || '')).length} Orang
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Staf Penunjang Operasional</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs text-slate-500">Kesiapan Piket & Hadir</span>
          <p className="text-2xl font-bold text-emerald-600 font-mono tabular-nums mt-1">
            100%
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Terintegrasi Modul Piket</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, NIP, jabatan, atau nomor HP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-900 dark:text-white focus:outline-hidden"
            />
          </div>

          <div>
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="all">Semua Bidang Jabatan</option>
              {STAFF_POSITIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="all">Semua Status Keaktifan</option>
              <option value="aktif">Aktif Bertugas</option>
              <option value="nonaktif">Cuti / Nonaktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                <th className="py-3 px-4">Nama Lengkap & NIP</th>
                <th className="py-3 px-4">Jabatan & Tugas</th>
                <th className="py-3 px-4">Status Kerja</th>
                <th className="py-3 px-4">Jam Kerja</th>
                <th className="py-3 px-4">Kontak</th>
                <th className="py-3 px-4">Akses Akun Login</th>
                {canManageStaff && <th className="py-3 px-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={canManageStaff ? 7 : 6} className="py-8 text-center text-slate-400">
                    Tidak ada data tenaga kependidikan yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((st) => {
                  const cleanU = st.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{st.name}</div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {st.nip ? `NIP. ${st.nip}` : 'Non-NIP (Honorer/Kontrak)'}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {st.position}
                        </span>
                        <span className="text-[10px] text-slate-500">Tenaga Kependidikan</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          st.employmentStatus === 'PNS'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                            : st.employmentStatus === 'PPPK'
                            ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {st.employmentStatus || 'Honorer'}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {st.workHours || '07.00 - 15.30 WIB'}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                          {st.phone || '-'}
                        </div>
                        {st.email && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                            {st.email}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            @{cleanU}
                          </span>
                          <span className="text-slate-400">· Sandi: 123456</span>
                        </div>
                      </td>

                      {canManageStaff && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(st)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Ubah Data Tendik"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStaff(st.id, st.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Hapus Data & Akun Login Tendik"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORM TAMBAH / UBAH TENDIK DENGAN SCROLLING AGAR SEMUA FORM TERLIHAT (Request 2) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-auto max-h-[85vh] overflow-y-auto pr-2">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingStaff ? 'Ubah Data Tenaga Kependidikan' : 'Tambah Tenaga Kependidikan Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Slamet Raharjo, S.A.P."
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    NIP / NUPTK / No. Pegawai
                  </label>
                  <input
                    type="text"
                    placeholder="19820314 200801 1 003"
                    value={formData.nip || ''}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400">Kosongkan jika honorer non-NIP</span>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Status Kepegawaian
                  </label>
                  <select
                    value={formData.employmentStatus || 'PNS'}
                    onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="PNS">PNS (Pegawai Negeri Sipil)</option>
                    <option value="PPPK">PPPK</option>
                    <option value="Honorer">Honorer / PTT</option>
                    <option value="Tetap Yayasan">Tetap Yayasan (GTY/PTY)</option>
                    <option value="Outsourcing">Outsourcing / Kontrak</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Jabatan & Penugasan Pokok <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.position || STAFF_POSITIONS[0]}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer font-semibold"
                >
                  {STAFF_POSITIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    No. Handphone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="0812-3456-7890"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Email Pegawai (Opsional)
                  </label>
                  <input
                    type="email"
                    placeholder="nama@email.com"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400">Dapat diedit sendiri oleh pegawai nanti</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Jadwal Jam Kerja
                  </label>
                  <input
                    type="text"
                    placeholder="07.00 - 15.30 WIB"
                    value={formData.workHours || '07.00 - 15.30 WIB'}
                    onChange={(e) => setFormData({ ...formData, workHours: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Status Keaktifan
                  </label>
                  <select
                    value={formData.status || 'aktif'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="aktif">Aktif Bekerja</option>
                    <option value="nonaktif">Cuti / Nonaktif</option>
                  </select>
                </div>
              </div>

              {/* Akun Login Auto-Generated Notice */}
              <div className="p-3 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-1">
                <span className="font-bold text-indigo-900 dark:text-indigo-200 block text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Kredensial Login Akun Otomatis
                </span>
                <p className="text-[11px] text-indigo-800 dark:text-indigo-300">
                  Setelah disimpan, pegawai langsung memiliki akun login di Manajemen Pengguna dengan peran <strong>Tendik</strong>.
                </p>
                <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300 pt-1">
                  Username: <strong>@{formData.name ? formData.name.toLowerCase().replace(/[^a-z0-9]/g, '') : 'namapegawai'}</strong> · Password awal: <strong>123456</strong>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-xs"
                >
                  {editingStaff ? 'Simpan Perubahan' : 'Simpan Data Tendik'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL IMPORT EXCEL (.XLSX) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Import Data Tenaga Kependidikan (.xlsx)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-500 text-[11px] leading-relaxed">
              Unggah berkas spreadsheet Excel (.xlsx). Sistem dilengkapi proteksi <strong>anti-duplikasi</strong> sehingga data yang sudah terdaftar tidak akan digandakan.
            </p>

            {importNotice && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-800 dark:text-emerald-200 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{importNotice}</span>
              </div>
            )}

            {importError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-rose-800 dark:text-rose-200 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-slate-700 dark:text-slate-300 font-semibold">
                Pilih Berkas Excel (.xlsx / .xls / .csv)
              </label>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileImport}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:text-xs file:font-semibold hover:file:bg-indigo-700 cursor-pointer"
              />
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Format Template</span>
              </button>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
