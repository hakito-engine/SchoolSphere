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
  };

  if (roleMap[role]) return roleMap[role];

  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
