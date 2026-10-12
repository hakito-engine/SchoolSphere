import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  CalendarCheck,
  FileSpreadsheet,
  GraduationCap,
  Laptop,
  Calendar,
  Users,
  UserSquare2,
  School,
  BookMarked,
  HeartHandshake,
  UserCheck,
  LineChart,
  Megaphone,
  Settings,
  Database,
  ShieldAlert,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onCloseMobile: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  module: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  activeTab,
  onSelectTab,
  onCloseMobile,
}) => {
  const { canAccess, roleInfo, currentUser } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  // Auto-expand on cursor hover, or when pinned/opened via toggle
  const isExpanded = isOpen || isHovered;

  const sections: NavSection[] = [
    {
      title: 'Utama',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard' },
      ],
    },
    {
      title: 'Pembelajaran (LMS)',
      items: [
        { id: 'modules', label: 'Modul Pembelajaran', icon: BookOpen, module: 'modules' },
        { id: 'attendance', label: 'Presensi & Kehadiran', icon: CalendarCheck, module: 'attendance' },
        { id: 'journals', label: 'Jurnal Mengajar', icon: FileSpreadsheet, module: 'journals' },
        { id: 'assignments', label: 'Tugas & Penilaian', icon: GraduationCap, module: 'assignments' },
        { id: 'exams', label: 'Ujian Online (CBT)', icon: Laptop, module: 'exams' },
        { id: 'schedule', label: 'Jadwal & Kalender', icon: Calendar, module: 'schedule' },
      ],
    },
    {
      title: 'Data Pokok Sekolah',
      items: [
        { id: 'students', label: 'Peserta Didik', icon: Users, module: 'students' },
        { id: 'teachers', label: 'Tenaga Pendidik', icon: UserSquare2, module: 'teachers' },
        { id: 'classes', label: 'Rombel & Kelas', icon: School, module: 'classes' },
        { id: 'subjects', label: 'Mata Pelajaran', icon: BookMarked, module: 'subjects' },
      ],
    },
    {
      title: 'Layanan & Bimbingan',
      items: [
        { id: 'counseling', label: 'Bimbingan Konseling (BK)', icon: HeartHandshake, module: 'counseling' },
        { id: 'parent_messages', label: 'Pesan ke Orang Tua', icon: MessageSquare, module: 'parent_messages' },
        { id: 'parent_portal', label: 'Portal Orang Tua', icon: UserCheck, module: 'parent_portal' },
        { id: 'analytics', label: 'Smart Analytics & Alert', icon: LineChart, module: 'analytics' },
        { id: 'announcements', label: 'Pengumuman Sekolah', icon: Megaphone, module: 'announcements' },
      ],
    },
    {
      title: 'Sistem & Administrasi',
      items: [
        { id: 'settings', label: 'Pengaturan & Kop Surat', icon: Settings, module: 'settings' },
        { id: 'backup_audit', label: 'Audit Trail & Backup', icon: Database, module: 'audit' },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onCloseMobile}
        ></div>
      )}

      {/* Sidebar Container with Auto-expand on Hover */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed md:sticky top-0 left-0 z-40 h-screen transition-all duration-200 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-sm ${
          isExpanded ? 'w-64 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20'
        }`}
      >
        {/* Top Header in Sidebar */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-extrabold text-base shrink-0 shadow-sm">
              SS
            </div>
            {isExpanded && (
              <div className="leading-tight truncate">
                <p className="text-xs font-bold text-slate-900 dark:text-white tracking-wide truncate">
                  SCHOOLSPHERE
                </p>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold tracking-widest uppercase">
                  LMS PRO
                </p>
              </div>
            )}
          </div>
        </div>

        {/* User Role Card */}
        {isExpanded ? (
          <div className="p-3 mx-3 my-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Akses Aktif
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${roleInfo.badgeColor}`}>
                {roleInfo.label}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
              {currentUser.name}
            </p>
            {currentUser.classId && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                Kelas: {currentUser.classId.replace('cls-', '').toUpperCase()}
              </p>
            )}
          </div>
        ) : (
          <div className="py-3 flex justify-center">
            <div
              className={`w-3 h-3 rounded-full ${roleInfo.badgeColor.split(' ')[0]}`}
              title={roleInfo.label}
            ></div>
          </div>
        )}

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {sections.map((sec) => {
            // Filter items based on RBAC access
            const permittedItems = sec.items.filter((item) => canAccess(item.module));
            if (permittedItems.length === 0) return null;

            return (
              <div key={sec.title}>
                {isExpanded && (
                  <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {sec.title}
                  </p>
                )}
                <div className="space-y-0.5">
                  {permittedItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelectTab(item.id);
                          onCloseMobile();
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        } ${!isExpanded ? 'justify-center' : ''}`}
                        title={item.label}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                        {isExpanded && <span className="truncate">{item.label}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer info */}
        {isExpanded && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 text-center">
            <p className="font-semibold text-slate-600 dark:text-slate-300">SchoolSphere LMS PRO</p>
            <p className="text-[10px]">Hakito Engine v2.4</p>
          </div>
        )}
      </aside>
    </>
  );
};
