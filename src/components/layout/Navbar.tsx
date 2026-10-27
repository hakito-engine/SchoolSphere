import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';
import { QuickRoleSwitcher } from '../common/QuickRoleSwitcher';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  Search,
  CheckCheck,
  Building2,
  Calendar,
  X,
  LogOut,
  KeyRound,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onSearchClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  isDarkMode,
  onToggleDarkMode,
  onSearchClick,
}) => {
  const { currentUser, roleInfo, logout, updateUserPassword } = useAuth();
  const profile = DataService.getSchoolProfile();
  const academicYears = DataService.getAcademicYears();
  const activeAY = academicYears.find((ay) => ay.isActive) || academicYears[0];

  const [notifications, setNotifications] = useState(() => DataService.getNotifications());
  const [showNotifications, setShowNotifications] = useState(false);

  // Requirement 9: Notifikasi Koreksi Nilai dari guru mapel hanya muncul di akun siswa yang dinilai
  const visibleNotifications = notifications.filter((item) => {
    const isGradeNotif = item.type === 'nilai' || item.title.toLowerCase().includes('nilai');
    if (isGradeNotif || item.targetUserId || item.targetStudentId) {
      if (currentUser.role !== 'siswa') {
        // Guru, admin, kepsek, wali kelas, dll. tidak melihat notifikasi nilai privat siswa
        return false;
      }
      const cleanUserId = currentUser.id.replace('usr-std-', '').replace('usr-siswa-', '');
      const userNisn = currentUser.nipOrNisn?.replace(/\s+/g, '');
      const studentData = DataService.getStudents().find(
        (s) =>
          s.id === cleanUserId ||
          (userNisn && s.nisn === userNisn) ||
          s.name.toLowerCase().replace(/[^a-z0-9]/g, '') === currentUser.username.toLowerCase().replace(/[^a-z0-9]/g, '')
      );

      const targetUser = item.targetUserId?.toLowerCase().trim();
      const targetStudent = item.targetStudentId?.toLowerCase().trim();

      const matchesTargetUser =
        targetUser &&
        (currentUser.id.toLowerCase() === targetUser ||
          `usr-std-${cleanUserId}`.toLowerCase() === targetUser ||
          (studentData && `usr-std-${studentData.id}`.toLowerCase() === targetUser));

      const matchesTargetStudent =
        targetStudent &&
        (cleanUserId.toLowerCase() === targetStudent ||
          (studentData && studentData.id.toLowerCase() === targetStudent));

      return matchesTargetUser || matchesTargetStudent;
    }
    return true;
  });

  // User menu and change password state
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showChangePassModal, setShowChangePassModal] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [passNotice, setPassNotice] = useState<string | null>(null);

  const unreadCount = visibleNotifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    visibleNotifications.forEach((n) => DataService.markNotificationRead(n.id));
    setNotifications(DataService.getNotifications());
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Kiri: Toggle Sidebar & Identitas Sekolah */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title={isSidebarOpen ? 'Ciutkan Sidebar' : 'Buka Sidebar'}
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <img
            src={profile.logoUrl}
            alt="School Logo"
            className="w-8 h-8 rounded-full object-contain border border-slate-200 dark:border-slate-700 hidden sm:block"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                SISPAM <span className="text-indigo-600 dark:text-indigo-400">PRO</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden xl:inline">
                · Sistem Integrasi Sekolah, Pembelajaran, & Administrasi
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px] sm:max-w-xs">
              {profile.name}
            </p>
          </div>
        </div>
      </div>

      {/* Tengah: Quick Search & Tahun Ajaran */}
      <div className="hidden md:flex items-center gap-3">
        <button
          onClick={onSearchClick}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 rounded-lg border border-slate-200/80 dark:border-slate-700/80 transition-colors cursor-pointer w-48 lg:w-64"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="truncate">Cari siswa, mapel, modul...</span>
          <kbd className="hidden lg:inline ml-auto text-[10px] font-mono px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-400">
            /
          </kbd>
        </button>

        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-800">
          <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="font-semibold">{activeAY.year}</span>
          <span className="text-slate-400">({activeAY.semester})</span>
        </div>
      </div>

      {/* Kanan: Notifikasi, Dark Mode, Avatar & Profil */}
      <div className="flex items-center gap-2 sm:gap-3">

        {/* Notifikasi Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Pemberitahuan"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 text-[10px] font-bold text-white bg-rose-600 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 p-3 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Notifikasi
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950 px-1.5 py-0.2 rounded">
                        {unreadCount} baru
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Tandai dibaca
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2">
                  {visibleNotifications.length === 0 ? (
                    <p className="text-xs text-center text-slate-400 py-4">
                      Belum ada notifikasi baru.
                    </p>
                  ) : (
                    visibleNotifications.map((item) => (
                      <div
                        key={item.id}
                        className={`p-2.5 rounded-lg text-xs transition-colors ${
                          item.read
                            ? 'bg-transparent text-slate-600 dark:text-slate-400'
                            : 'bg-indigo-50/60 dark:bg-indigo-950/40 text-slate-800 dark:text-slate-200 font-medium'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.time}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed line-clamp-2">
                          {item.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Profil Singkat Pengguna & Menu Akun */}
        <div className="relative flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
            title="Menu Akun & Kata Sandi"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[130px]">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {roleInfo.label}
              </p>
            </div>
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
              <div className="absolute right-0 top-12 mt-1 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 p-2 animate-in fade-in text-xs space-y-1">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="font-bold text-slate-900 dark:text-white truncate">{currentUser.name}</p>
                  <p className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                    user: {currentUser.username || currentUser.name.toLowerCase().replace(/[^a-z0-9]/g, '')}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowChangePassModal(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-slate-400" />
                  <span>Ubah Kata Sandi</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar dari Akun</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal Ubah Kata Sandi */}
      {showChangePassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-600" />
                Ubah Kata Sandi Akun
              </h3>
              <button
                onClick={() => {
                  setShowChangePassModal(false);
                  setPassNotice(null);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {passNotice && (
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-medium border border-emerald-200">
                {passNotice}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newPasswordInput) return;
                updateUserPassword(newPasswordInput);
                setPassNotice('Kata sandi berhasil diperbarui!');
                setTimeout(() => {
                  setShowChangePassModal(false);
                  setNewPasswordInput('');
                  setPassNotice(null);
                }, 1500);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Username Anda
                </label>
                <input
                  type="text"
                  disabled
                  value={currentUser.username || currentUser.name.toLowerCase().replace(/[^a-z0-9]/g, '')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Kata Sandi Baru
                </label>
                <input
                  type="password"
                  required
                  placeholder="Masukkan kata sandi baru..."
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowChangePassModal(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-xs"
                >
                  Simpan Sandi Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
