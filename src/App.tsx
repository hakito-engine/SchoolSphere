import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { DataService } from './services/dataService';
import { getTabFromPath, getPathFromTab, updateDocumentTitle } from './router/routes';

// Views
import { DashboardView } from './views/DashboardView';
import { StudentsView } from './views/StudentsView';
import { TeachersView } from './views/TeachersView';
import { ClassesView } from './views/ClassesView';
import { SubjectsView } from './views/SubjectsView';
import { LearningModulesView } from './views/LearningModulesView';
import { AttendanceView } from './views/AttendanceView';
import { TeachingJournalsView } from './views/TeachingJournalsView';
import { AssignmentsView } from './views/AssignmentsView';
import { ExamsView } from './views/ExamsView';
import { UsersView } from './views/UsersView';
import { CounselingView } from './views/CounselingView';
import { ParentPortalView } from './views/ParentPortalView';
import { AnalyticsView } from './views/AnalyticsView';
import { AnnouncementsView } from './views/AnnouncementsView';
import { SchoolSettingsView } from './views/SchoolSettingsView';
import { HomeroomReportView } from './views/HomeroomReportView';
import { DutyPiketView } from './views/DutyPiketView';
import { PtkAttendanceRecapView } from './views/PtkAttendanceRecapView';
import { TendikView } from './views/TendikView';
import { SystemManagementView } from './views/SystemManagementView';
import { ParentNoticeLetterView } from './views/ParentNoticeLetterView';
import { DeveloperIdentityView } from './views/DeveloperIdentityView';
import { LoginView } from './views/LoginView';

const AuthenticatedApp: React.FC = () => {
  const { currentUser, canAccess } = useAuth();

  // Inisialisasi tab aktif dari URL browser (contoh: /pesertadidik -> 'students')
  const [activeTab, setActiveTabState] = useState<string>(() => {
    const fromUrl = getTabFromPath(window.location.pathname);
    if (fromUrl && fromUrl !== 'login') {
      return fromUrl;
    }
    return localStorage.getItem('schoolsphere_active_tab') || 'dashboard';
  });

  // Navigasi modular: update tab, localStorage, URL browser, dan judul tab dokumen
  const setActiveTab = useCallback((tab: string, replaceUrl = false) => {
    localStorage.setItem('schoolsphere_active_tab', tab);
    setActiveTabState(tab);

    const targetPath = getPathFromTab(tab);
    if (window.location.pathname !== targetPath) {
      if (replaceUrl) {
        window.history.replaceState({ tab }, '', targetPath);
      } else {
        window.history.pushState({ tab }, '', targetPath);
      }
    }
    updateDocumentTitle(tab);
  }, []);

  // Sinkronisasi rute URL saat tombol Back / Forward browser ditekan (HTML5 History API)
  useEffect(() => {
    const handlePopState = () => {
      const tabFromPath = getTabFromPath(window.location.pathname);
      if (tabFromPath && tabFromPath !== 'login') {
        setActiveTabState(tabFromPath);
        localStorage.setItem('schoolsphere_active_tab', tabFromPath);
        updateDocumentTitle(tabFromPath);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Saat pertama kali masuk: pastikan URL browser sesuai dengan tab aktif
  useEffect(() => {
    const currentTarget = getPathFromTab(activeTab);
    if (window.location.pathname !== currentTarget) {
      window.history.replaceState({ tab: activeTab }, '', currentTarget);
    }
    updateDocumentTitle(activeTab);
  }, [activeTab]);

  // Sidebar & Search State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Dark Mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('schoolsphere_theme') === 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
      document.body.classList.add('dark');
      localStorage.setItem('schoolsphere_theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
      document.body.classList.remove('dark');
      localStorage.setItem('schoolsphere_theme', 'light');
    }
  }, [isDarkMode]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || (e.ctrlKey && e.key === 'k')) && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Pastikan peran pengguna memiliki hak akses ke modul tab aktif
  useEffect(() => {
    const moduleMap: Record<string, string> = {
      dashboard: 'dashboard',
      modules: 'modules',
      attendance: 'attendance',
      journals: 'journals',
      assignments: 'assignments',
      exams: 'exams',
      users: 'users',
      students: 'students',
      teachers: 'teachers',
      tendik: 'tendik',
      classes: 'classes',
      subjects: 'subjects',
      counseling: 'counseling',
      letters: 'letters',
      parent_portal: 'parent_portal',
      parent_messages: 'parent_messages',
      piket: 'piket',
      rekap_ptk: 'rekap_ptk',
      analytics: 'analytics',
      announcements: 'announcements',
      settings: 'settings',
      backup_audit: 'audit',
      system_management: 'system_management',
      developer_identity: 'developer_identity',
    };

    const targetModule = moduleMap[activeTab] || 'dashboard';
    if (!canAccess(targetModule) && activeTab !== 'dashboard') {
      setActiveTab('dashboard', true);
    }
  }, [currentUser.role, activeTab, canAccess, setActiveTab]);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigate={(tab) => setActiveTab(tab)} />;
      case 'piket':
        return <DutyPiketView />;
      case 'rekap_ptk':
        return <PtkAttendanceRecapView />;
      case 'students':
        return <StudentsView />;
      case 'teachers':
        return <TeachersView />;
      case 'tendik':
        return <TendikView />;
      case 'classes':
        return <ClassesView />;
      case 'subjects':
        return <SubjectsView />;
      case 'modules':
        return <LearningModulesView />;
      case 'attendance':
        return <AttendanceView />;
      case 'journals':
        return <TeachingJournalsView />;
      case 'assignments':
        return <AssignmentsView />;
      case 'homeroom_reports':
        return <HomeroomReportView />;
      case 'exams':
        return <ExamsView />;
      case 'users':
        return <UsersView />;
      case 'counseling':
        return <CounselingView />;
      case 'letters':
        return <ParentNoticeLetterView />;
      case 'parent_portal':
      case 'parent_messages':
        return <ParentPortalView initialTab={activeTab === 'parent_messages' ? 'pesan' : 'portal'} />;
      case 'analytics':
        return <AnalyticsView />;
      case 'announcements':
        return <AnnouncementsView />;
      case 'settings':
        return <SchoolSettingsView />;
      case 'system_management':
      case 'backup_audit':
        return <SystemManagementView />;
      case 'developer_identity':
        return <DeveloperIdentityView />;
      default:
        return <DashboardView onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors">
      {/* Collapsible Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onCloseMobile={() => setIsSidebarOpen(false)}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          onSearchClick={() => setIsSearchOpen(true)}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>

        {/* Quiet Footer */}
        <footer className="no-print border-t border-slate-200 dark:border-slate-800 py-4 px-6 text-center text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            SISPAM by Hakito Tech · Sistem Integrasi Sekolah, Pembelajaran, & Administrasi
          </span>
          <span className="text-slate-500">
            Terintegrasi Standar Kurikulum Merdeka & Cloud Database
          </span>
        </footer>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(tab) => setActiveTab(tab)}
      />
    </div>
  );
};

function MainContent() {
  const { isAuthenticated } = useAuth();

  // Sinkronisasi URL saat status otentikasi berubah
  useEffect(() => {
    if (!isAuthenticated) {
      const currentPath = window.location.pathname;
      // Jika pengguna belum login tetapi mencoba mengakses path tertentu (misal /pesertadidik),
      // simpan path tujuan agar dapat diarahkan kembali setelah login berhasil
      if (currentPath && currentPath !== '/login' && currentPath !== '/') {
        sessionStorage.setItem('sispam_redirect_target', currentPath);
      }
      if (window.location.pathname !== '/login') {
        window.history.replaceState(null, '', '/login');
      }
      updateDocumentTitle('login');
    } else {
      // Jika sudah login, cek apakah ada path tujuan redirect sebelumnya
      const redirectTarget = sessionStorage.getItem('sispam_redirect_target');
      if (redirectTarget) {
        sessionStorage.removeItem('sispam_redirect_target');
        const targetTab = getTabFromPath(redirectTarget);
        if (targetTab && targetTab !== 'login') {
          localStorage.setItem('schoolsphere_active_tab', targetTab);
          window.history.replaceState({ tab: targetTab }, '', redirectTarget);
          updateDocumentTitle(targetTab);
          return;
        }
      }

      // Jika URL saat ini masih /login, alihkan ke /dashboard
      if (window.location.pathname === '/login') {
        const savedTab = localStorage.getItem('schoolsphere_active_tab') || 'dashboard';
        const targetPath = getPathFromTab(savedTab);
        window.history.replaceState({ tab: savedTab }, '', targetPath);
        updateDocumentTitle(savedTab);
      }
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <LoginView key="login-view" />;
  }

  return <AuthenticatedApp key="auth-app" />;
}

export default function App() {
  // SINKRONISASI DATABASE REAL-TIME GLOBAL (Berjalan di level tertinggi aplikasi)
  // Menjaga sinkronisasi antar perangkat, mode privat, dan mendeteksi perubahan dari luar (phpMyAdmin / akun lain)
  useEffect(() => {
    const stopSync = DataService.startRealtimeSync(15000);
    return () => {
      stopSync();
    };
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
