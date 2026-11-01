/**
 * Utility functions for formatting text, actions, and roles without underscores.
 */

export const formatActionText = (action: string): string => {
  if (!action) return '-';
  const actionMap: Record<string, string> = {
    UPDATE_PROFILE: 'Pembaruan Profil Sekolah',
    CLONE_ACADEMIC_YEAR: 'Duplikasi Tahun Ajaran',
    ADD_ACADEMIC_YEAR: 'Tambah Tahun Ajaran',
    UPDATE_ACADEMIC_YEAR: 'Perbarui Tahun Ajaran',
    IMPORT_DATA: 'Impor & Pulihkan Data',
    EXPORT_DATA: 'Ekspor Cadangan Data',
    ATTENDANCE_CORRECTION: 'Koreksi Presensi Kehadiran',
    SUBMIT_ATTENDANCE: 'Perekaman Presensi Mapel',
    CREATE_STUDENT: 'Pendaftaran Siswa Baru',
    UPDATE_STUDENT: 'Pembaruan Data Siswa',
    DELETE_STUDENT: 'Penghapusan Data Siswa',
    CREATE_TEACHER: 'Penambahan Tenaga Pendidik',
    UPDATE_TEACHER: 'Pembaruan Data Guru',
    DELETE_TEACHER: 'Penghapusan Data Guru',
    CREATE_ASSIGNMENT: 'Penerbitan Tugas Baru',
    GRADE_ASSIGNMENT: 'Penilaian Tugas Siswa',
    CREATE_EXAM: 'Pembuatan Ujian CBT',
    SUBMIT_EXAM: 'Penyelesaian Ujian CBT',
    CREATE_MODULE: 'Penerbitan Modul Ajar',
    UPDATE_MODULE: 'Pembaruan Modul Ajar',
    DELETE_MODULE: 'Penghapusan Modul Ajar',
    CREATE_JOURNAL: 'Pencatatan Jurnal Mengajar',
    APPROVE_JOURNAL: 'Persetujuan Jurnal Mengajar',
    LOGIN: 'Sesi Masuk Berhasil',
    LOGOUT: 'Sesi Keluar',
  };

  if (actionMap[action]) return actionMap[action];

  // Fallback: replace '_' with ' ' and Title Case each word
  return action
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const formatRoleText = (role: string): string => {
  if (!role) return '-';
  const roleMap: Record<string, string> = {
    super_admin: 'Super Admin',
    kepala_sekolah: 'Kepala Sekolah',
    wakasek_kurikulum: 'Wakasek Kurikulum',
    guru: 'Guru Mata Pelajaran',
    wali_kelas: 'Wali Kelas',
    guru_bk: 'Guru BK',
    operator: 'Operator Sekolah',
    siswa: 'Peserta Didik',
    orang_tua: 'Orang Tua / Wali',
    tendik: 'Tenaga Kependidikan (Tendik)',
  };

  if (roleMap[role]) return roleMap[role];

  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Standard Indonesian Date Formatter
 * Formats dates strictly as "dd MMMM yyyy" (e.g. 01 November 2026).
 * Supports YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY, ISO strings, and Date objects.
 */
export const formatDateIndonesian = (input?: string | Date | null): string => {
  if (!input) return '-';
  let d: Date;
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return '-';
    if (trimmed.includes('T')) {
      d = new Date(trimmed);
    } else if (trimmed.includes('-')) {
      const parts = trimmed.split('-');
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else {
        // DD-MM-YYYY
        d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      }
    } else if (trimmed.includes('/')) {
      const parts = trimmed.split('/');
      if (parts[2]?.length === 4) {
        // DD/MM/YYYY
        d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      } else {
        d = new Date(trimmed);
      }
    } else {
      d = new Date(trimmed);
    }
  } else {
    d = input;
  }

  if (isNaN(d.getTime())) return String(input);

  const day = String(d.getDate()).padStart(2, '0');
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

