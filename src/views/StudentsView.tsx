import React, { useState, useId } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { Student } from '../types';
import { PrintModal } from '../components/common/PrintModal';
import { StudentCardModal } from '../components/common/StudentCardModal';
import {
  Users,
  Search,
  Plus,
  Printer,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  ArrowUpRight,
  CreditCard,
  QrCode,
  Download,
  Check,
  Camera,
  Image as ImageIcon,
  UserCheck,
  UserPlus,
  Sparkles,
  Link2,
} from 'lucide-react';

export const StudentsView: React.FC = () => {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState<Student[]>(() => DataService.getStudents());
  const classes = DataService.getClasses();
  const profile = DataService.getSchoolProfile();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<Partial<Student>>({
    name: '',
    nisn: '',
    nis: '',
    classId: classes[0]?.id || 'cls-xmipa1',
    className: classes[0]?.name || 'X MIPA 1',
    gender: 'L',
    birthPlaceDate: 'Jakarta, 12 Januari 2008',
    photoUrl: '',
    parentId: 'prt-new',
    parentName: '',
    parentPhone: '',
    status: 'aktif',
  });

  // Photo Upload State in Add/Edit Student
  const [photoPreview, setPhotoPreview] = useState<string>('');

  // Parent Auto-Suggest & Multi-Anak Detection State
  const [showParentSuggestions, setShowParentSuggestions] = useState(false);
  const [parentMatchSelection, setParentMatchSelection] = useState<{
    parentName: string;
    parentPhone: string;
    parentId: string;
    childrenNames: string[];
  } | null>(null);
  const [isLinkedMultiChild, setIsLinkedMultiChild] = useState(false);

  // Bulk Import Excel (.xlsx) State
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [uploadedExcelFileName, setUploadedExcelFileName] = useState<string | null>(null);
  const [importPreviewList, setImportPreviewList] = useState<Student[]>([]);
  const [importResultMsg, setImportResultMsg] = useState<string | null>(null);
  const [importErrorMsg, setImportErrorMsg] = useState<string | null>(null);

  // Kenaikan Kelas (Mass & Individual Promotion) State
  // If user is Wali Kelas, default to their homeroom class!
  const defaultSourceClass = currentUser.role === 'wali_kelas' && currentUser.classId
    ? currentUser.classId
    : classes[0]?.id || 'cls-xmipa1';

  const [promotionModalOpen, setPromotionModalOpen] = useState(false);
  const [promotionSourceClassId, setPromotionSourceClassId] = useState(defaultSourceClass);
  const [promotionTargetClassId, setPromotionTargetClassId] = useState(classes[1]?.id || 'cls-ximipa1');
  const [promotionStatus, setPromotionStatus] = useState<'aktif' | 'lulus'>('aktif');
  const [selectedStudentIdsForPromotion, setSelectedStudentIdsForPromotion] = useState<string[]>([]);
  const [promotionSuccessMsg, setPromotionSuccessMsg] = useState<string | null>(null);

  // Print Modals
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedStudentForCert, setSelectedStudentForCert] = useState<Student | null>(null);

  // Kartu Pelajar (Student ID Card) Modal
  const [studentCardModalOpen, setStudentCardModalOpen] = useState(false);
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<Student | null>(null);

  // Requirement 19: Modal Cetak Profil & Rekap Nilai Peserta Didik Binaan untuk Wali Kelas
  const [homeroomRecapModalOpen, setHomeroomRecapModalOpen] = useState(false);

  // Permissions
  const canManage = ['super_admin', 'operator'].includes(currentUser.role);
  const canPromote = ['super_admin', 'operator', 'wali_kelas'].includes(currentUser.role);

  const filteredStudents = students.filter((s) => {
    // Requirement 12: Wali Kelas hanya boleh mengakses data peserta didik di kelas binaan. Peserta didik kelas lain tidak boleh diakses.
    if (currentUser.role === 'wali_kelas') {
      const myClassId = currentUser.classId;
      if (myClassId && s.classId !== myClassId) {
        return false;
      }
    }

    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nisn.includes(searchQuery) ||
      s.nis.includes(searchQuery);
    const matchesClass = selectedClass === 'all' || s.classId === selectedClass;
    return matchesSearch && matchesClass;
  });

  // Calculate unique existing parents and their enrolled children for smart suggest
  const existingParentsMap = React.useMemo(() => {
    const map = new Map<string, { parentId: string; parentName: string; parentPhone: string; children: { name: string; className: string }[] }>();
    students.forEach((s) => {
      if (s.parentName && s.parentName.trim()) {
        const key = s.parentName.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            parentId: s.parentId || `prt-${key.replace(/[^a-z0-9]/g, '')}`,
            parentName: s.parentName,
            parentPhone: s.parentPhone || '',
            children: [{ name: s.name, className: s.className }],
          });
        } else {
          const item = map.get(key)!;
          if (!item.children.some((c) => c.name === s.name)) {
            item.children.push({ name: s.name, className: s.className });
          }
        }
      }
    });
    return Array.from(map.values());
  }, [students]);

  // Filter parent suggestions as user types
  const parentSuggestions = React.useMemo(() => {
    const query = (formData.parentName || '').trim().toLowerCase();
    if (!query || query.length < 2) return [];
    return existingParentsMap.filter((p) => p.parentName.toLowerCase().includes(query));
  }, [formData.parentName, existingParentsMap]);

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setPhotoPreview('');
    setParentMatchSelection(null);
    setIsLinkedMultiChild(false);
    setFormData({
      id: 'std-' + Date.now(),
      name: '',
      nisn: '',
      nis: '',
      classId: classes[0]?.id || 'cls-xmipa1',
      className: classes[0]?.name || 'X MIPA 1',
      gender: 'L',
      birthPlaceDate: 'Jakarta, 12 Januari 2008',
      photoUrl: '',
      parentId: 'prt-' + Date.now(),
      parentName: '',
      parentPhone: '',
      status: 'aktif',
      attendance: { hadir: 50, sakit: 0, izin: 0, alpa: 0, terlambat: 0 },
      gpa: 85.0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setPhotoPreview(student.photoUrl || '');
    setParentMatchSelection(null);
    setIsLinkedMultiChild(false);
    setFormData({ ...student });
    setIsModalOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Silakan pilih berkas foto berupa gambar (PNG, JPG, JPEG, atau WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      if (dataUrl) {
        setPhotoPreview(dataUrl);
        setFormData((prev) => ({ ...prev, photoUrl: dataUrl }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectParentSuggestion = (parentItem: typeof existingParentsMap[0], isSameParent: boolean) => {
    if (isSameParent) {
      // Re-use same parentId and phone (Multi-Anak)
      setFormData((prev) => ({
        ...prev,
        parentName: parentItem.parentName,
        parentPhone: parentItem.parentPhone,
        parentId: parentItem.parentId,
      }));
      setIsLinkedMultiChild(true);
      setParentMatchSelection(null);
      setShowParentSuggestions(false);
    } else {
      // Same name but DIFFERENT parent: create unique parent ID
      setFormData((prev) => ({
        ...prev,
        parentName: parentItem.parentName,
        parentId: 'prt-distinct-' + Date.now(),
      }));
      setIsLinkedMultiChild(false);
      setParentMatchSelection(null);
      setShowParentSuggestions(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.nisn) return;

    const targetClass = classes.find((c) => c.id === formData.classId);
    const studentToSave: Student = {
      ...(formData as Student),
      className: targetClass ? targetClass.name : formData.className || 'X MIPA 1',
      photoUrl: photoPreview || formData.photoUrl || '',
    };

    DataService.saveStudent(studentToSave, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });

    setStudents(DataService.getStudents());
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data peserta didik ini?')) {
      DataService.deleteStudent(id, {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      });
      setStudents(DataService.getStudents());
    }
  };

  const handlePrintCertificate = (student: Student) => {
    setSelectedStudentForCert(student);
    setPrintModalOpen(true);
  };

  const handleOpenStudentCard = (student: Student) => {
    setSelectedStudentForCard(student);
    setStudentCardModalOpen(true);
  };

  // --- Excel Import (.xlsx) Logic ---
  const handleDownloadExcelTemplate = () => {
    const templateRows = [
      {
        'No': 1,
        'Nama Lengkap': 'Bima Sakti Pratama',
        'NISN': '0081234567',
        'NIS': '242510008',
        'Kelas': 'X MIPA 1',
        'Jenis Kelamin (L/P)': 'L',
        'Tempat Tanggal Lahir': 'Jakarta, 10 Maret 2008',
        'Nama Orang Tua': 'H. Wahyu Pratama',
        'No HP Orang Tua': '081211112222',
      },
      {
        'No': 2,
        'Nama Lengkap': 'Clarissa Aurelia',
        'NISN': '0087654321',
        'NIS': '242510009',
        'Kelas': 'X MIPA 1',
        'Jenis Kelamin (L/P)': 'P',
        'Tempat Tanggal Lahir': 'Surabaya, 15 Mei 2008',
        'Nama Orang Tua': 'Ibu Maya Lestari',
        'No HP Orang Tua': '081333334444',
      },
      {
        'No': 3,
        'Nama Lengkap': 'Dimas Aryasatya',
        'NISN': '0089998881',
        'NIS': '242510010',
        'Kelas': 'X MIPA 2',
        'Jenis Kelamin (L/P)': 'L',
        'Tempat Tanggal Lahir': 'Bandung, 20 Juli 2008',
        'Nama Orang Tua': 'Drs. Gunawan Santoso',
        'No HP Orang Tua': '081555556666',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateRows);
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 25 },
      { wch: 15 },
      { wch: 14 },
      { wch: 12 },
      { wch: 20 },
      { wch: 26 },
      { wch: 24 },
      { wch: 18 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data_Siswa');
    XLSX.writeFile(workbook, 'Template_Import_Siswa_SISPAM.xlsx');
  };

  const handleFileUploadExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedExcelFileName(file.name);
    setImportErrorMsg(null);
    setImportResultMsg(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (rawJson.length === 0) {
          setImportErrorMsg('Berkas Excel kosong atau tidak memiliki baris data.');
          return;
        }

        const parsed: Student[] = [];

        rawJson.forEach((row, i) => {
          // Flexible key lookup
          const name = row['Nama Lengkap'] || row['Nama'] || row['nama'] || row['name'];
          const nisn = String(row['NISN'] || row['nisn'] || '').trim();
          const nis = String(row['NIS'] || row['nis'] || '').trim();
          const className = String(row['Kelas'] || row['kelas'] || '').trim();
          const gender = String(row['Jenis Kelamin (L/P)'] || row['Gender'] || row['gender'] || 'L').trim().toUpperCase();
          const birth = String(row['Tempat Tanggal Lahir'] || row['TTL'] || row['ttl'] || 'Jakarta, 01 Januari 2008').trim();
          const parentName = String(row['Nama Orang Tua'] || row['NamaOrtu'] || row['Orang Tua'] || '').trim();
          const parentPhone = String(row['No HP Orang Tua'] || row['NoHpOrtu'] || row['Telepon'] || '').trim();

          if (name && nisn) {
            const targetClass = classes.find((c) => c.name.toLowerCase() === className.toLowerCase()) || classes[0];
            parsed.push({
              id: 'std-import-' + Date.now() + '-' + i,
              name: String(name).trim(),
              nisn: nisn || '00' + Math.floor(10000000 + Math.random() * 90000000),
              nis: nis || '2425' + (10000 + i),
              classId: targetClass.id,
              className: targetClass.name,
              gender: (gender === 'P' ? 'P' : 'L') as 'L' | 'P',
              birthPlaceDate: birth,
              parentId: 'prt-' + Date.now() + '-' + i,
              parentName: parentName || 'Orang Tua ' + name,
              parentPhone: parentPhone || '0812-0000-0000',
              status: 'aktif',
              attendance: { hadir: 50, sakit: 0, izin: 0, alpa: 0, terlambat: 0 },
              gpa: 82.5,
            });
          }
        });

        if (parsed.length === 0) {
          setImportErrorMsg('Tidak ada baris siswa yang valid. Pastikan kolom "Nama Lengkap" dan "NISN" terisi.');
        } else {
          setImportPreviewList(parsed);
        }
      } catch (err: any) {
        console.error('Error parsing Excel file:', err);
        setImportErrorMsg('Gagal membaca berkas Excel. Pastikan format berkas valid (.xlsx atau .xls).');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExecuteBulkImport = () => {
    if (importPreviewList.length === 0) return;

    const res = DataService.bulkImportStudents(importPreviewList, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });

    setImportResultMsg(`Berhasil mengimpor ${res.addedCount} siswa baru (${res.duplicateCount} duplikat NISN dilewati).`);
    setStudents(DataService.getStudents());
    setTimeout(() => {
      setBulkImportOpen(false);
      setImportPreviewList([]);
      setUploadedExcelFileName(null);
      setImportResultMsg(null);
    }, 2200);
  };

  // --- Kenaikan Kelas (Mass & Individual Promotion) Logic ---
  const sourceClassStudents = students.filter(
    (s) => s.classId === promotionSourceClassId && s.status === 'aktif'
  );

  const handleToggleSelectAllPromotion = () => {
    if (selectedStudentIdsForPromotion.length === sourceClassStudents.length) {
      setSelectedStudentIdsForPromotion([]);
    } else {
      setSelectedStudentIdsForPromotion(sourceClassStudents.map((s) => s.id));
    }
  };

  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIdsForPromotion((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExecutePromotion = () => {
    if (selectedStudentIdsForPromotion.length === 0) return;

    const targetClass = classes.find((c) => c.id === promotionTargetClassId);
    const targetClassName =
      promotionStatus === 'lulus'
        ? 'Alumni (Lulus)'
        : targetClass
        ? targetClass.name
        : 'Kelas Lanjutan';

    DataService.promoteStudents(
      selectedStudentIdsForPromotion,
      promotionTargetClassId,
      targetClassName,
      promotionStatus,
      {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      }
    );

    setPromotionSuccessMsg(
      `Berhasil memproses kenaikan kelas untuk ${selectedStudentIdsForPromotion.length} siswa ke ${targetClassName}.`
    );
    setStudents(DataService.getStudents());
    setSelectedStudentIdsForPromotion([]);
    setTimeout(() => {
      setPromotionModalOpen(false);
      setPromotionSuccessMsg(null);
    }, 2200);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Manajemen Data Peserta Didik
          </h2>
          <p className="text-xs text-slate-500">
            Data pokok siswa terverifikasi NISN, import massal format Excel (.xlsx), kenaikan kelas, dan cetak kartu pelajar resmi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadExcelTemplate}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Download Template Excel (.xlsx) Siap Isi"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Download Template (.xlsx)</span>
          </button>

          {canManage && (
            <button
              onClick={() => {
                setImportPreviewList([]);
                setImportResultMsg(null);
                setImportErrorMsg(null);
                setUploadedExcelFileName(null);
                setBulkImportOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Import Massal Excel (.xlsx)</span>
            </button>
          )}

          {canPromote && (
            <button
              onClick={() => {
                if (currentUser.role === 'wali_kelas' && currentUser.classId) {
                  setPromotionSourceClassId(currentUser.classId);
                }
                setPromotionModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kenaikan Kelas {currentUser.role === 'wali_kelas' ? '(Wali Kelas)' : ''}</span>
            </button>
          )}

          {/* Requirement 19: Tombol Cetak Profil & Rekapitulasi Nilai Binaan untuk Wali Kelas */}
          {currentUser.role === 'wali_kelas' && (
            <button
              onClick={() => setHomeroomRecapModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Profil & Rekap Nilai Binaan</span>
            </button>
          )}

          {canManage && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Peserta Didik</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama lengkap, NISN, atau NIS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={currentUser.role === 'wali_kelas' ? (currentUser.classId || 'all') : selectedClass}
            onChange={(e) => {
              if (currentUser.role !== 'wali_kelas') {
                setSelectedClass(e.target.value);
              }
            }}
            disabled={currentUser.role === 'wali_kelas'}
            className="w-full sm:w-48 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-80"
          >
            {currentUser.role !== 'wali_kelas' && <option value="all">Semua Kelas</option>}
            {classes
              .filter((cls) => currentUser.role !== 'wali_kelas' || cls.id === currentUser.classId)
              .map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {currentUser.role === 'wali_kelas' ? '(Kelas Binaan Anda)' : ''}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Foto</th>
                <th className="py-3 px-4">NISN / NIS</th>
                <th className="py-3 px-4">Nama Peserta Didik</th>
                <th className="py-3 px-4">L/P</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Orang Tua / Wali</th>
                <th className="py-3 px-4 text-center">Kehadiran (H/S/I/A)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Tidak ditemukan data siswa yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((std, idx) => (
                  <tr
                    key={std.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4">
                      {std.photoUrl ? (
                        <img
                          src={std.photoUrl}
                          alt={std.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs border border-indigo-200 dark:border-indigo-800">
                          {std.name.charAt(0)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-medium text-slate-900 dark:text-white block">
                        {std.nisn}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        NIS: {std.nis}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {std.name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {std.birthPlaceDate}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">
                      {std.gender}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                        {std.className}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800 dark:text-slate-200 block">
                        {std.parentName}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {std.parentPhone}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1 font-mono text-[11px]">
                        <span className="text-emerald-600 font-bold" title="Hadir">{std.attendance.hadir}H</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-blue-600" title="Sakit">{std.attendance.sakit}S</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-amber-600" title="Izin">{std.attendance.izin}I</span>
                        <span className="text-slate-300">/</span>
                        <span className={`font-bold ${std.attendance.alpa > 0 ? 'text-rose-600' : 'text-slate-400'}`} title="Alpa">
                          {std.attendance.alpa}A
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          std.status === 'aktif'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {std.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenStudentCard(std)}
                          className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          title="Cetak Kartu Siswa (Foto & Alamat Lengkap)"
                        >
                          <CreditCard className="w-4 h-4 text-indigo-600" />
                        </button>
                        <button
                          onClick={() => handlePrintCertificate(std)}
                          className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          title="Cetak Surat Keterangan Siswa Aktif"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {['super_admin', 'operator', 'wali_kelas'].includes(currentUser.role) && (
                          <button
                            onClick={() => handleOpenEdit(std)}
                            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                            title="Edit Data Siswa & Foto"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {['super_admin', 'operator'].includes(currentUser.role) && (
                          <button
                            onClick={() => handleDelete(std.id)}
                            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                            title="Hapus Siswa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: IMPORT DATA SISWA SECARA MASSAL (EXCEL .XLSX) */}
      {bulkImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Import Massal Data Siswa (Format Excel .xlsx)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unduh template Excel resmi, isi data peserta didik, lalu unggah kembali ke sistem.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadExcelTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer self-start sm:self-auto"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Template Excel (.xlsx)</span>
              </button>
            </div>

            {importResultMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{importResultMsg}</span>
              </div>
            )}

            {importErrorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{importErrorMsg}</span>
              </div>
            )}

            {/* Upload Area */}
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl p-6 text-center transition-colors">
              <input
                type="file"
                id="excel-file-upload"
                accept=".xlsx, .xls"
                onChange={handleFileUploadExcel}
                className="hidden"
              />
              <label
                htmlFor="excel-file-upload"
                className="flex flex-col items-center justify-center gap-2 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {uploadedExcelFileName ? uploadedExcelFileName : 'Klik untuk Pilih Berkas Excel (.xlsx)'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Mendukung berkas Microsoft Excel (.xlsx dan .xls)
                  </p>
                </div>
                <span className="inline-block mt-1 px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded text-[11px] font-semibold">
                  Pilih Berkas Excel
                </span>
              </label>
            </div>

            {/* Preview Parsed Rows */}
            {importPreviewList.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Pratinjau Data ({importPreviewList.length} siswa siap diimport):</span>
                  <span className="text-emerald-600 font-mono text-[11px]">Validasi Berhasil</span>
                </div>
                <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 font-semibold sticky top-0">
                      <tr>
                        <th className="p-2">Nama Siswa</th>
                        <th className="p-2">NISN</th>
                        <th className="p-2">Kelas</th>
                        <th className="p-2">L/P</th>
                        <th className="p-2">Orang Tua</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {importPreviewList.map((item, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-2 font-bold text-slate-900 dark:text-white">{item.name}</td>
                          <td className="p-2 font-mono">{item.nisn}</td>
                          <td className="p-2">{item.className}</td>
                          <td className="p-2">{item.gender}</td>
                          <td className="p-2 text-slate-500">{item.parentName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                onClick={() => setBulkImportOpen(false)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteBulkImport}
                disabled={importPreviewList.length === 0}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-40 cursor-pointer"
              >
                Simpan & Import ke Database ({importPreviewList.length} Siswa)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: KENAIKAN KELAS & KELULUSAN (SUPER ADMIN / OPERATOR / WALI KELAS) */}
      {promotionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  Kenaikan Kelas & Kelulusan Peserta Didik
                </h3>
                <p className="text-xs text-slate-500">
                  Dapat diproses secara massal atau pilih siswa secara individu.
                </p>
              </div>
              <button
                onClick={() => setPromotionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            {promotionSuccessMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{promotionSuccessMsg}</span>
              </div>
            )}

            {/* Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Kelas Asal
                </label>
                <select
                  value={promotionSourceClassId}
                  onChange={(e) => {
                    setPromotionSourceClassId(e.target.value);
                    setSelectedStudentIdsForPromotion([]);
                  }}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white cursor-pointer"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Jenis Keputusan
                </label>
                <select
                  value={promotionStatus}
                  onChange={(e) => setPromotionStatus(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="aktif">Naik ke Kelas Lanjutan</option>
                  <option value="lulus">Lulus (Tamat Belajar / Alumni)</option>
                </select>
              </div>

              {promotionStatus === 'aktif' && (
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Kelas Tujuan
                  </label>
                  <select
                    value={promotionTargetClassId}
                    onChange={(e) => setPromotionTargetClassId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white cursor-pointer"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Checklist Siswa */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                  Daftar Siswa ({sourceClassStudents.length} siswa ditemukan):
                </span>
                <button
                  type="button"
                  onClick={handleToggleSelectAllPromotion}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold text-xs cursor-pointer"
                >
                  {selectedStudentIdsForPromotion.length === sourceClassStudents.length
                    ? 'Batal Pilih Semua'
                    : 'Pilih Semua Siswa'}
                </button>
              </div>

              <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {sourceClassStudents.length === 0 ? (
                  <p className="p-4 text-center text-slate-400">
                    Tidak ada siswa aktif di kelas asal ini.
                  </p>
                ) : (
                  sourceClassStudents.map((s) => {
                    const isChecked = selectedStudentIdsForPromotion.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className={`flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer ${
                          isChecked ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectStudent(s.id)}
                            className="rounded text-indigo-600"
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {s.name}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              NISN: {s.nisn} · Rerata: {s.gpa}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            s.gpa >= 75
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {s.gpa >= 75 ? 'Tuntas' : 'Perlu Remedial'}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                onClick={() => setPromotionModalOpen(false)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleExecutePromotion}
                disabled={selectedStudentIdsForPromotion.length === 0}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-40 cursor-pointer"
              >
                Eksekusi Kenaikan ({selectedStudentIdsForPromotion.length} Siswa)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CETAK KARTU TANDA PELAJAR RESMI */}
      {studentCardModalOpen && selectedStudentForCard && (
        <StudentCardModal
          isOpen={studentCardModalOpen}
          onClose={() => setStudentCardModalOpen(false)}
          student={selectedStudentForCard}
          profile={profile}
        />
      )}

      {/* MODAL 4: TAMBAH / EDIT SISWA (DENGAN UPLOAD FOTO & SMART PARENT AUTO-SUGGESTION) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl my-8">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              {editingStudent ? 'Edit Data Peserta Didik' : 'Tambah Peserta Didik Baru'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              {/* Foto Siswa Upload */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                <div className="w-16 h-20 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden border border-slate-300 dark:border-slate-600 shrink-0">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview Foto" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Unggah Pasfoto Siswa (Untuk Kartu Pelajar)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Format gambar PNG/JPG/WEBP (Rekomendasi rasio 3:4).
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="student-photo-input"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="student-photo-input"
                      className="px-3 py-1 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 font-semibold cursor-pointer"
                    >
                      Pilih Foto
                    </label>
                    {photoPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoPreview('');
                          setFormData((prev) => ({ ...prev, photoUrl: '' }));
                        }}
                        className="px-2 py-1 text-slate-500 hover:text-rose-600 cursor-pointer"
                      >
                        Hapus Foto
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Nama Lengkap Siswa
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Muhammad Farhan"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    NISN (10 Digit)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={formData.nisn || ''}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    NIS
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nis || ''}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Kelas / Rombel
                  </label>
                  <select
                    value={formData.classId || ''}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={formData.gender || 'L'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'L' | 'P' })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Tempat, Tanggal Lahir (TTL)
                </label>
                <input
                  type="text"
                  value={formData.birthPlaceDate || ''}
                  onChange={(e) => setFormData({ ...formData, birthPlaceDate: e.target.value })}
                  placeholder="Contoh: Jakarta, 14 Mei 2008"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* FORM PENGISIAN NAMA ORANG TUA (AUTO-SUGGEST, MULTI-ANAK, & PILIHAN NAMA SAMA TAPI BEDA ORANG) */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-600 dark:text-slate-400 font-medium">
                      Nama Orang Tua / Wali
                    </label>
                    {isLinkedMultiChild && (
                      <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded flex items-center gap-1">
                        <Link2 className="w-3 h-3 text-emerald-600" />
                        Terhubung Multi-Anak
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.parentName || ''}
                    onFocus={() => setShowParentSuggestions(true)}
                    onChange={(e) => {
                      setFormData({ ...formData, parentName: e.target.value });
                      setShowParentSuggestions(true);
                      setIsLinkedMultiChild(false);
                    }}
                    placeholder="Tulis nama orang tua..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />

                  {/* Auto-Suggest Dropdown */}
                  {showParentSuggestions && parentSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 p-2 max-h-56 overflow-y-auto space-y-2">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Nama Orang Tua Pernah Diinput Sebelumnya (Pilih Opsi):
                      </div>
                      {parentSuggestions.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {item.parentName}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {item.parentPhone}
                            </span>
                          </div>

                          <p className="text-[10px] text-indigo-600 dark:text-indigo-400">
                            Orang tua dari: {item.children.map((c) => `${c.name} (${c.className})`).join(', ')}
                          </p>

                          {/* Dual Choices: Multi-anak vs Orang Berbeda */}
                          <div className="flex items-center gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => handleSelectParentSuggestion(item, true)}
                              className="flex-1 py-1 px-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Hubungkan (Satu Orang Tua / Multi-Anak)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectParentSuggestion(item, false)}
                              className="py-1 px-2 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-semibold text-[10px] cursor-pointer"
                              title="Nama sama persis namun adalah orang tua yang berbeda"
                            >
                              <span>Nama Sama tapi Beda Orang</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    No. Telepon / WhatsApp Orang Tua
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.parentPhone || ''}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-xs"
                >
                  Simpan Data Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Modal: Surat Keterangan Siswa Aktif */}
      {selectedStudentForCert && (
        <PrintModal
          isOpen={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          title="Cetak Surat Keterangan Siswa Aktif"
          documentTitle="SURAT KETERANGAN SISWA AKTIF"
          documentNumber={`421.3 / ${selectedStudentForCert.nis} / SMA-NU / X / 2024`}
          rightSignerTitle="Wali Kelas X MIPA 1"
          rightSignerName="Budi Santoso, S.Si."
          rightSignerNip="19820311 200801 1 007"
        >
          <div className="space-y-4 text-justify leading-relaxed text-xs">
            <p>
              Yang bertanda tangan di bawah ini, Kepala Sekolah Menengah Atas (SMA) Nusantara Unggul Jakarta Selatan, menerangkan bahwa:
            </p>

            <table className="w-full max-w-xl mx-auto my-3 text-xs">
              <tbody>
                <tr>
                  <td className="w-44 py-1 font-semibold">Nama Lengkap</td>
                  <td className="w-4 py-1">:</td>
                  <td className="py-1 font-bold uppercase">{selectedStudentForCert.name}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold">NISN</td>
                  <td className="py-1">:</td>
                  <td className="py-1 font-mono">{selectedStudentForCert.nisn}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold">Nomor Induk Siswa (NIS)</td>
                  <td className="py-1">:</td>
                  <td className="py-1 font-mono">{selectedStudentForCert.nis}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold">Tempat, Tanggal Lahir</td>
                  <td className="py-1">:</td>
                  <td className="py-1">{selectedStudentForCert.birthPlaceDate}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold">Jenis Kelamin</td>
                  <td className="py-1">:</td>
                  <td className="py-1">{selectedStudentForCert.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold">Kelas / Rombel</td>
                  <td className="py-1">:</td>
                  <td className="py-1 font-semibold">{selectedStudentForCert.className}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold">Nama Orang Tua / Wali</td>
                  <td className="py-1">:</td>
                  <td className="py-1">{selectedStudentForCert.parentName}</td>
                </tr>
              </tbody>
            </table>

            <p>
              Adalah benar yang bersangkutan merupakan peserta didik aktif pada Sekolah Menengah Atas (SMA) Nusantara Unggul Tahun Ajaran 2024/2025 Semester Ganjil dan berkelakuan baik dalam mengikuti seluruh program pembelajaran.
            </p>

            <p>
              Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.
            </p>
          </div>
        </PrintModal>
      )}

      {/* Requirement 19: Cetak Rekapitulasi Profil Peserta Didik Binaan, Presensi & Nilai Semua Mapel oleh Wali Kelas */}
      {(() => {
        const homeroomClass = classes.find((c) => c.id === currentUser.classId) || classes[0];
        const homeroomClassStudents = students.filter((s) => s.classId === (currentUser.classId || classes[0]?.id));

        return (
          <PrintModal
            isOpen={homeroomRecapModalOpen}
            onClose={() => setHomeroomRecapModalOpen(false)}
            title="Cetak Profil & Rekapitulasi Nilai Binaan"
            documentTitle="REKAPITULASI PROFIL PESERTA DIDIK, PRESENSI & NILAI MAPEL KELAS BINAAN"
            documentNumber={`421.4 / REKAP-WALI / ${homeroomClass?.name.replace(/\s+/g, '') || 'ROMBEL'} / 2024`}
            rightSignerTitle="Wali Kelas"
            rightSignerName={currentUser.name}
            rightSignerNip={currentUser.nipOrNisn || '19820311 200801 1 007'}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 text-xs font-semibold border-b border-black pb-2">
                <div>
                  <p>Kelas / Rombel: <strong>{homeroomClass?.name} ({homeroomClass?.major})</strong></p>
                  <p>Wali Kelas: <strong>{currentUser.name}</strong></p>
                </div>
                <div className="text-right">
                  <p>Semester / Tahun Ajaran: <strong>Ganjil / 2024-2025</strong></p>
                  <p>Total Peserta Didik: <strong>{homeroomClassStudents.length} Orang</strong></p>
                </div>
              </div>

              <table className="w-full border-collapse border border-black text-[10px]">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-black py-1.5 px-1 text-center w-6">No</th>
                    <th className="border border-black py-1.5 px-2 text-center w-20">NISN / NIS</th>
                    <th className="border border-black py-1.5 px-2 text-left">Nama Peserta Didik</th>
                    <th className="border border-black py-1.5 px-1 text-center w-6">L/P</th>
                    <th className="border border-black py-1.5 px-1 text-center w-8">H</th>
                    <th className="border border-black py-1.5 px-1 text-center w-6">S</th>
                    <th className="border border-black py-1.5 px-1 text-center w-6">I</th>
                    <th className="border border-black py-1.5 px-1 text-center w-6">A</th>
                    <th className="border border-black py-1.5 px-1 text-center w-10">% Kehadiran</th>
                    <th className="border border-black py-1.5 px-2 text-center w-12">Rerata Nilai</th>
                    <th className="border border-black py-1.5 px-2 text-center w-14">Status KKM</th>
                    <th className="border border-black py-1.5 px-2 text-left">Nama Orang Tua</th>
                  </tr>
                </thead>
                <tbody>
                  {homeroomClassStudents.map((st, i) => {
                    const hadir = st.attendance?.hadir || 52;
                    const sakit = st.attendance?.sakit || 0;
                    const izin = st.attendance?.izin || 0;
                    const alpa = st.attendance?.alpa || 0;
                    const totalAtt = hadir + sakit + izin + alpa;
                    const pctAtt = totalAtt > 0 ? Math.round((hadir / totalAtt) * 100) : 100;
                    const isPassing = st.gpa >= 75;

                    return (
                      <tr key={st.id}>
                        <td className="border border-black py-1 px-1 text-center font-mono">{i + 1}</td>
                        <td className="border border-black py-1 px-2 text-center font-mono">
                          {st.nisn}
                          <br />
                          <span className="text-[9px] text-slate-600">{st.nis}</span>
                        </td>
                        <td className="border border-black py-1 px-2 font-semibold">{st.name}</td>
                        <td className="border border-black py-1 px-1 text-center">{st.gender}</td>
                        <td className="border border-black py-1 px-1 text-center font-mono">{hadir}</td>
                        <td className="border border-black py-1 px-1 text-center font-mono">{sakit}</td>
                        <td className="border border-black py-1 px-1 text-center font-mono">{izin}</td>
                        <td className="border border-black py-1 px-1 text-center font-mono">{alpa}</td>
                        <td className="border border-black py-1 px-1 text-center font-mono font-bold">{pctAtt}%</td>
                        <td className="border border-black py-1 px-2 text-center font-mono font-bold">{st.gpa}</td>
                        <td className="border border-black py-1 px-2 text-center font-bold">
                          {isPassing ? 'TUNTAS' : 'REMEDIAL'}
                        </td>
                        <td className="border border-black py-1 px-2">{st.parentName || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </PrintModal>
        );
      })()}
    </div>
  );
};
