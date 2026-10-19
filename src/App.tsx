import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';

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
import { LoginView } from './views/LoginView';

const AuthenticatedApp: React.FC = () => {
  const { currentUser, canAccess } = useAuth();

  const [activeTab, setActiveTab] = useState('dashboard');
  // Default to collapsed so that it auto-expands when hovered by cursor
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Dark Mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('schoolsphere_theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('schoolsphere_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
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
      classes: 'classes',
      subjects: 'subjects',
      counseling: 'counseling',
      parent_portal: 'parent_portal',
      parent_messages: 'parent_messages',
      analytics: 'analytics',
      announcements: 'announcements',
      settings: 'settings',
      backup_audit: 'audit',
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
      case 'students':
        return <StudentsView />;
      case 'teachers':
        return <TeachersView />;
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
      case 'backup_audit':
        return <SchoolSettingsView />;
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
          <span>
            SchoolSphere PRO by Hakito Engine · Terintegrasi Kurikulum Merdeka
          </span>
          <span className="font-mono text-slate-400">
            Arsitektur Modular Standar GAS-Ready · Autentikasi RBAC 8 Peran
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
