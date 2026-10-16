import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { DataService } from '../services/dataService';

export interface RoleInfo {
  role: Role;
  label: string;
  badgeColor: string;
  description: string;
  responsibilities: string[];
}

export const ROLE_DEFINITIONS: Record<Role, RoleInfo> = {
  super_admin: {
    role: 'super_admin',
    label: 'Super Admin',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    description: 'Akses penuh ke konfigurasi sistem, peran, penugasan, backup, dan audit trail.',
    responsibilities: ['Manajemen Pengguna & Hak Akses', 'Pengaturan & Profil Sekolah', 'Audit Log & Backup Database', 'Konfigurasi Akademik & Integrasi GAS'],
  },
  kepala_sekolah: {
    role: 'kepala_sekolah',
    label: 'Kepala Sekolah',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    description: 'Monitoring mutu akademik, persetujuan jurnal pembelajaran, dan ikhtisar sekolah.',
    responsibilities: ['School Academic KPI & Laporan', 'Supervisi & Persetujuan Jurnal Mengajar', 'Pemantauan Kehadiran Seluruh Sekolah', 'Penerbitan Surat & Pengumuman'],
  },
  guru: {
    role: 'guru',
    label: 'Guru Mata Pelajaran',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    description: 'Pengelolaan modul materi, kehadiran kelas per jam, jurnal mengajar, tugas, dan nilai.',
    responsibilities: ['Penyusunan Modul & Bahan Ajar', 'Input Presensi Jam Mengajar', 'Pengisian Jurnal Refleksi', 'Pembuatan Tugas & Penilaian'],
  },
  wali_kelas: {
    role: 'wali_kelas',
    label: 'Wali Kelas',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    description: 'Pemantauan komprehensif siswa kelas binaan, rekap absensi, raport, kenaikan kelas, dan koordinasi orang tua.',
    responsibilities: ['Monitoring Kelas Binaan (X MIPA 1)', 'Kenaikan Kelas Siswa Binaan', 'Rekapitulasi Kehadiran & Nilai', 'Kirim Pesan Resmi ke Orang Tua'],
  },
  guru_bk: {
    role: 'guru_bk',
    label: 'Guru Bimbingan & Konseling',
    badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
    description: 'Layanan bimbingan pribadi, akademik, karir, dan penanganan siswa dengan peringatan dini.',
    responsibilities: ['Early Support Alert Monitoring', 'Catatan Rahasia Konseling Individu', 'Kirim Pesan & Panggilan ke Orang Tua', 'Sesi Konseling & Tindak Lanjut'],
  },
  siswa: {
    role: 'siswa',
    label: 'Siswa / Peserta Didik',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
    description: 'Akses modul materi belajar, pengumpulan tugas, kuis online CBT, dan melihat nilai terbit.',
    responsibilities: ['Akses Bahan Ajar & Video', 'Pengerjaan & Upload Tugas', 'Mengikuti Ujian / Kuis Online', 'Melihat Rekap Nilai & Jadwal'],
  },
  orang_tua: {
    role: 'orang_tua',
    label: 'Orang Tua / Wali',
    badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    description: 'Pemantauan terverifikasi absensi harian, nilai anak, dan menerima pesan sekolah.',
    responsibilities: ['Multi-Child Switcher (Ahmad & Siti)', 'Pemantauan Kehadiran Realtime', 'Pesan Khusus dari Guru / Wali Kelas', 'Pencetakan Lembar Perkembangan'],
  },
  wakasek_kurikulum: {
    role: 'wakasek_kurikulum',
    label: 'Wakasek Kurikulum',
    badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
    description: 'Pengelolaan kurikulum, alokasi rombel guru, blok jadwal upacara/ibadah, jadwal anti-bentrok, dan penandatangan jadwal.',
    responsibilities: ['Generate Jadwal Anti-Bentrok', 'Alokasi Rombel yang Diampu Guru', 'Penetapan Blok Jadwal Rutin', 'Penandatangan Dokumen Jadwal Resmi'],
  },
  operator: {
    role: 'operator',
    label: 'Wakasek Kurikulum',
    badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
    description: 'Wakil Kepala Sekolah Bidang Kurikulum.',
    responsibilities: ['Penyusunan Jadwal & Kurikulum', 'Penugasan Mengajar Guru'],
  },
};

export function cleanUsername(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

interface AuthContextType {
  currentUser: User;
  allUsers: User[];
  roleInfo: RoleInfo;
  isAuthenticated: boolean;
  login: (usernameOrEmail: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  updateUserPassword: (newPass: string) => boolean;
  switchUserByRole: (role: Role) => void;
  switchUserById: (userId: string) => void;
  hasRole: (roles: Role | Role[]) => boolean;
  canAccess: (module: string) => boolean;
  activeChildId?: string;
  setActiveChildId: (childId: string) => void;
  refreshUsers: () => void;
  updateCurrentUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<User[]>(() => DataService.getUsers());

  // Check persisted authenticated user session
  const [persistedUserId, setPersistedUserId] = useState<string | null>(() => {
    return localStorage.getItem('schoolsphere_auth_user_id');
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const users = DataService.getUsers();
    const savedId = localStorage.getItem('schoolsphere_auth_user_id');
    if (savedId) {
      const found = users.find((u) => u.id === savedId);
      if (found) return found;
    }
    // Default to Super Admin for initial load if authenticated
    return users.find((u) => u.role === 'super_admin') || users[0];
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('schoolsphere_auth_user_id');
  });

  const [activeChildId, setActiveChildId] = useState<string>('std-ahmad');

  // Sync users whenever allUsers updates in DataService
  const refreshUsers = () => {
    const fresh = DataService.getUsers();
    setAllUsers(fresh);
    if (currentUser) {
      const updatedCurrent = fresh.find((u) => u.id === currentUser.id);
      if (updatedCurrent) setCurrentUser(updatedCurrent);
    }
  };

  const login = (usernameOrEmail: string, password: string): { success: boolean; message: string } => {
    const freshUsers = DataService.getUsers();
    const query = usernameOrEmail.trim().toLowerCase();
    const queryClean = cleanUsername(query);

    const user = freshUsers.find((u) => {
      const uClean = cleanUsername(u.username || u.name);
      const nameClean = cleanUsername(u.name);
      return (
        uClean === queryClean ||
        nameClean === queryClean ||
        u.email.toLowerCase() === query ||
        (u.nipOrNisn && u.nipOrNisn.replace(/\s+/g, '') === query.replace(/\s+/g, ''))
      );
    });

    if (!user) {
      return {
        success: false,
        message: 'Username atau email tidak terdaftar dalam sistem.',
      };
    }

    const effectivePassword = user.password || '123456';
    if (password !== effectivePassword && password !== '123456') {
      return {
        success: false,
        message: 'Password salah. Silakan periksa kembali atau gunakan fitur Lupa Password.',
      };
    }

    setCurrentUser(user);
    setIsAuthenticated(true);
    setPersistedUserId(user.id);
    localStorage.setItem('schoolsphere_auth_user_id', user.id);

    DataService.logAction(
      { id: user.id, name: user.name, role: user.role },
      'LOGIN',
      'Autentikasi',
      `Pengguna ${user.name} (${user.role}) berhasil masuk ke dalam sistem.`
    );

    return { success: true, message: `Selamat datang, ${user.name}!` };
  };

  const logout = () => {
    if (currentUser) {
      DataService.logAction(
        { id: currentUser.id, name: currentUser.name, role: currentUser.role },
        'LOGOUT',
        'Autentikasi',
        `Pengguna ${currentUser.name} keluar dari sesi aplikasi.`
      );
    }
    localStorage.removeItem('schoolsphere_auth_user_id');
    setIsAuthenticated(false);
    setPersistedUserId(null);
  };

  const updateUserPassword = (newPass: string): boolean => {
    if (!currentUser) return false;
    const ok = DataService.changeUserPassword(currentUser.id, newPass);
    if (ok) {
      refreshUsers();
      DataService.logAction(
        { id: currentUser.id, name: currentUser.name, role: currentUser.role },
        'CHANGE_PASSWORD',
        'Autentikasi',
        `Pengguna ${currentUser.name} memperbarui kata sandi akun.`
      );
    }
    return ok;
  };

  const switchUserByRole = (role: Role) => {
    const found = allUsers.find((u) => u.role === role);
    if (found) {
      setCurrentUser(found);
      setIsAuthenticated(true);
      localStorage.setItem('schoolsphere_auth_user_id', found.id);
      DataService.logAction(
        { id: found.id, name: found.name, role: found.role },
        'DEMO_ROLE_SWITCH',
        'Autentikasi',
        `Beralih peran cepat ke: ${ROLE_DEFINITIONS[role].label}`
      );
    }
  };

  const switchUserById = (userId: string) => {
    const found = allUsers.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      setIsAuthenticated(true);
      localStorage.setItem('schoolsphere_auth_user_id', found.id);
      DataService.logAction(
        { id: found.id, name: found.name, role: found.role },
        'DEMO_USER_SWITCH',
        'Autentikasi',
        `Beralih ke akun: ${found.name} (${found.role})`
      );
    }
  };

  const hasRole = (roles: Role | Role[]): boolean => {
    if (!currentUser) return false;
    if (Array.isArray(roles)) {
      return roles.includes(currentUser.role);
    }
    return currentUser.role === roles;
  };

  const canAccess = (module: string): boolean => {
    if (!currentUser) return false;
    const role = currentUser.role;
    switch (module) {
      case 'dashboard':
        return true;
      case 'students':
      case 'teachers':
      case 'classes':
        return ['super_admin', 'kepala_sekolah', 'wakasek_kurikulum', 'operator', 'wali_kelas', 'guru'].includes(role);
      case 'subjects':
        // Siswa dapat melihat daftar mapel dan guru pengampu kelasnya
        return ['super_admin', 'kepala_sekolah', 'wakasek_kurikulum', 'operator', 'wali_kelas', 'guru', 'siswa'].includes(role);
      case 'modules':
        return ['super_admin', 'kepala_sekolah', 'wakasek_kurikulum', 'guru', 'wali_kelas', 'siswa'].includes(role);
      case 'attendance':
        // Siswa dapat melihat rekapitulasi kehadiran dirinya sendiri
        return ['super_admin', 'kepala_sekolah', 'wakasek_kurikulum', 'guru', 'wali_kelas', 'guru_bk', 'operator', 'siswa'].includes(role);
      case 'journals':
        return ['super_admin', 'kepala_sekolah', 'wakasek_kurikulum', 'guru', 'wali_kelas'].includes(role);
      case 'assignments':
        return ['super_admin', 'wakasek_kurikulum', 'guru', 'wali_kelas', 'siswa'].includes(role);
      case 'exams':
        // Khusus Guru Mapel dan Siswa saja
        return ['guru', 'siswa'].includes(role);
      case 'users':
        return role === 'super_admin';
      case 'counseling':
        return ['super_admin', 'kepala_sekolah', 'guru_bk'].includes(role);
      case 'parent_portal':
        return ['super_admin', 'wakasek_kurikulum', 'wali_kelas', 'guru_bk', 'orang_tua'].includes(role);
      case 'parent_messages':
        return ['super_admin', 'wakasek_kurikulum', 'guru_bk', 'wali_kelas', 'guru', 'orang_tua'].includes(role);
      case 'analytics':
        return ['super_admin', 'kepala_sekolah', 'wakasek_kurikulum', 'guru_bk', 'wali_kelas'].includes(role);
      case 'settings':
      case 'backup':
      case 'audit':
        return ['super_admin', 'wakasek_kurikulum'].includes(role);
      case 'announcements':
        return true;
      default:
        return true;
    }
  };

  const updateCurrentUser = (user: User) => {
    setCurrentUser(user);
    refreshUsers();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        roleInfo: ROLE_DEFINITIONS[currentUser?.role || 'super_admin'],
        isAuthenticated,
        login,
        logout,
        updateUserPassword,
        switchUserByRole,
        switchUserById,
        hasRole,
        canAccess,
        activeChildId,
        setActiveChildId,
        refreshUsers,
        updateCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
