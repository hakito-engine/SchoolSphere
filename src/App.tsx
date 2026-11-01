import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { DataService } from './services/dataService';

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
import { TendikView } from './views/TendikView';
import { SystemManagementView } from './views/SystemManagementView';
import { LoginView } from './views/LoginView';

const AuthenticatedApp: React.FC = () => {
  const { currentUser, canAccess } = useAuth();

  const [activeTab, setActiveTabState] = useState(() => {
    return localStorage.getItem('schoolsphere_active_tab') || 'dashboard';
  });

  const setActiveTab = (tab: string) => {
    localStorage.setItem('schoolsphere_active_tab', tab);
    setActiveTabState(tab);
  };
  // Default to collapsed so that it auto-expands when hovered by cursor
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

  // Sinkronisasi otomatis data dengan Server Hosting sispam.hakito.my.id
  useEffect(() => {
    DataService.pullFromServer().catch(() => {});
    const interval = setInterval(() => {
      DataService.pullFromServer().catch(() => {});
    }, 60000); // Sinkronisasi berkala setiap 60 detik antar perangkat
    return () => clearInterval(interval);
  }, []);

  // Ensure active tab is accessible by current role
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
      parent_portal: 'parent_portal',
      parent_messages: 'parent_messages',
      piket: 'piket',
      analytics: 'analytics',
      announcements: 'announcements',
      settings: 'settings',
      backup_audit: 'audit',
      system_management: 'system_management',
    };

    const targetModule = moduleMap[activeTab] || 'dashboard';
    if (!canAccess(targetModule) && activeTab !== 'dashboard') {
      setActiveTab('dashboard');
    }
  }, [currentUser.role, activeTab, canAccess]);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigate={(tab) => setActiveTab(tab)} />;
      case 'piket':
        return <DutyPiketView />;
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
            SISPAM by Hakito Engine · Sistem Integrasi Sekolah, Pembelajaran, & Administrasi
          </span>
          <span className="text-slate-500">
            Terintegrasi Standar Kurikulum Merdeka
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

  if (!isAuthenticated) {
    return <LoginView key="login-view" />;
  }

  return <AuthenticatedApp key="auth-app" />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
