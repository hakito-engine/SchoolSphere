export interface AppRoute {
  path: string;
  tabId: string;
  title: string;
  aliases?: string[];
  requiresAuth?: boolean;
}

export const APP_ROUTES: AppRoute[] = [
  { path: '/login', tabId: 'login', title: 'Masuk Sistem - SISPAM', requiresAuth: false },
  { path: '/dashboard', tabId: 'dashboard', title: 'Dashboard Utama - SISPAM', aliases: ['/'] },
  { path: '/pesertadidik', tabId: 'students', title: 'Data Peserta Didik - SISPAM', aliases: ['/siswa', '/students'] },
  { path: '/guru', tabId: 'teachers', title: 'Tenaga Pendidik (Guru) - SISPAM', aliases: ['/teachers'] },
  { path: '/tendik', tabId: 'tendik', title: 'Tenaga Kependidikan (Tendik) - SISPAM', aliases: ['/staff'] },
  { path: '/rombel', tabId: 'classes', title: 'Rombel & Kelas - SISPAM', aliases: ['/kelas', '/classes'] },
  { path: '/mapel', tabId: 'subjects', title: 'Mata Pelajaran - SISPAM', aliases: ['/subjects'] },
  { path: '/modul', tabId: 'modules', title: 'Modul Pembelajaran - SISPAM', aliases: ['/modules'] },
  { path: '/presensi', tabId: 'attendance', title: 'Presensi Siswa - SISPAM', aliases: ['/attendance'] },
  { path: '/piket', tabId: 'piket', title: 'Piket Sekolah - SISPAM', aliases: ['/duty'] },
  { path: '/rekap-ptk', tabId: 'rekap_ptk', title: 'Rekap Presensi PTK - SISPAM' },
  { path: '/jurnal', tabId: 'journals', title: 'Jurnal Mengajar Guru - SISPAM', aliases: ['/journals'] },
  { path: '/tugas', tabId: 'assignments', title: 'Tugas & Penilaian - SISPAM', aliases: ['/assignments'] },
  { path: '/rapor', tabId: 'homeroom_reports', title: 'Rapor & Leger Nilai - SISPAM', aliases: ['/reports'] },
  { path: '/ujian', tabId: 'exams', title: 'Ujian Online CBT - SISPAM', aliases: ['/cbt', '/exams'] },
  { path: '/pengguna', tabId: 'users', title: 'Manajemen Pengguna - SISPAM', aliases: ['/users'] },
  { path: '/bk', tabId: 'counseling', title: 'Bimbingan Konseling - SISPAM', aliases: ['/konseling', '/counseling'] },
  { path: '/surat-panggilan', tabId: 'letters', title: 'Surat Panggilan Orang Tua - SISPAM', aliases: ['/surat', '/letters'] },
  { path: '/portal-ortu', tabId: 'parent_portal', title: 'Portal Orang Tua - SISPAM', aliases: ['/parent-portal'] },
  { path: '/pesan-ortu', tabId: 'parent_messages', title: 'Pesan Orang Tua - SISPAM' },
  { path: '/analitik', tabId: 'analytics', title: 'Analitik & Statistik - SISPAM', aliases: ['/analytics'] },
  { path: '/pengumuman', tabId: 'announcements', title: 'Pengumuman Sekolah - SISPAM', aliases: ['/announcements'] },
  { path: '/pengaturan', tabId: 'settings', title: 'Pengaturan Sekolah - SISPAM', aliases: ['/settings'] },
  { path: '/manajemen-sistem', tabId: 'system_management', title: 'Manajemen Sistem & Database - SISPAM', aliases: ['/database', '/system-management'] },
  { path: '/identitas-pengembang', tabId: 'developer_identity', title: 'Identitas Pengembang - SISPAM', aliases: ['/developer', '/pengembang'] },
];

/**
 * Resolves current window.location.pathname to corresponding tabId
 */
export function getTabFromPath(pathname: string): string {
  const cleanPath = pathname.toLowerCase().replace(/\/$/, '') || '/';

  for (const route of APP_ROUTES) {
    if (route.path === cleanPath) return route.tabId;
    if (route.aliases && route.aliases.includes(cleanPath)) return route.tabId;
  }

  return 'dashboard';
}

/**
 * Resolves tabId to standard URL path
 */
export function getPathFromTab(tabId: string): string {
  const route = APP_ROUTES.find((r) => r.tabId === tabId);
  return route ? route.path : '/dashboard';
}

/**
 * Updates document title based on tabId
 */
export function updateDocumentTitle(tabId: string): void {
  const route = APP_ROUTES.find((r) => r.tabId === tabId);
  if (route && typeof document !== 'undefined') {
    document.title = route.title;
  }
}
