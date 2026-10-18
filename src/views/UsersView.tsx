import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { User, Role } from '../types';
import { ROLE_DEFINITIONS } from '../context/AuthContext';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  KeyRound,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  UserCheck,
} from 'lucide-react';

export const UsersView: React.FC = () => {
  const { currentUser, updateCurrentUser } = useAuth();
  const [users, setUsers] = useState<User[]>(() => DataService.getUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Password visibility map by userId
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    username: '',
    password: '123456',
    role: 'guru',
    email: '',
    phone: '',
    nipOrNisn: '',
    status: 'aktif',
  });

  // Action status notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showNotification('success', `${label} berhasil disalin ke clipboard!`);
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      id: 'usr-' + Date.now(),
      name: '',
      username: '',
      password: '123456',
      role: 'guru',
      email: '',
      phone: '',
      nipOrNisn: '',
      status: 'aktif',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      ...user,
      password: user.password || '123456',
    });
    setIsModalOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    if (user.id === currentUser.id) {
      showNotification('error', 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.');
      return;
    }

    if (user.role === 'super_admin') {
      const superAdminCount = users.filter((u) => u.role === 'super_admin').length;
      if (superAdminCount <= 1) {
        showNotification('error', 'Tidak dapat menghapus Super Admin terakhir pada sistem.');
        return;
      }
    }

    if (confirm(`Apakah Anda yakin ingin menghapus akun pengguna "${user.name}" (@${user.username})? Tindakan ini tidak dapat dibatalkan.`)) {
      const success = DataService.deleteUser(user.id, {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      });

      if (success) {
        setUsers(DataService.getUsers());
        showNotification('success', `Pengguna ${user.name} berhasil dihapus.`);
      } else {
        showNotification('error', 'Gagal menghapus pengguna.');
      }
    }
  };

  const handleQuickResetPassword = (user: User) => {
    if (confirm(`Reset kata sandi akun ${user.name} ke password bawaan: "123456"?`)) {
      DataService.updateUserCredentials(user.id, user.username, '123456', {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      });
      setUsers(DataService.getUsers());
      showNotification('success', `Password akun ${user.name} berhasil direset ke "123456".`);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.username?.trim()) {
      showNotification('error', 'Nama lengkap dan username wajib diisi.');
      return;
    }

    const cleanU = formData.username.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Check username uniqueness if adding or changing
    const duplicate = users.find(
      (u) => u.username.toLowerCase() === cleanU && (!editingUser || u.id !== editingUser.id)
    );

    if (duplicate) {
      showNotification('error', `Username "${cleanU}" sudah digunakan oleh ${duplicate.name}. Silakan gunakan username lain.`);
      return;
    }

    const userPayload: User = {
      id: editingUser ? editingUser.id : formData.id || 'usr-' + Date.now(),
      name: formData.name.trim(),
      username: cleanU,
      password: formData.password?.trim() || '123456',
      role: (formData.role as Role) || 'guru',
      email: formData.email?.trim() || `${cleanU}@smanusantara.sch.id`,
      phone: formData.phone?.trim() || '',
      nipOrNisn: formData.nipOrNisn?.trim() || '',
      status: formData.status || 'aktif',
      classId: formData.classId,
    };

    DataService.saveUser(userPayload, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });

    if (userPayload.role === 'super_admin' && userPayload.phone) {
      const p = DataService.getSchoolProfile();
      p.adminWhatsapp = userPayload.phone;
      DataService.updateSchoolProfile(p, {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      });
    }

    if (userPayload.id === currentUser.id) {
      updateCurrentUser(userPayload);
    }

    setUsers(DataService.getUsers());
    setIsModalOpen(false);
    showNotification('success', `Akun pengguna ${userPayload.name} berhasil ${editingUser ? 'diperbarui' : 'ditambahkan'}.`);
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(query) ||
      u.username.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      (u.nipOrNisn && u.nipOrNisn.toLowerCase().includes(query));

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const countByRole = (role: Role) => users.filter((u) => u.role === role).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Khusus Super Admin
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Manajemen Pengguna & Kredensial Sistem
          </h2>
          <p className="text-xs text-slate-500">
            Kelola username, kata sandi, peran hak akses, dan status seluruh pengguna aplikasi secara terpusat.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2 animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Super Admin Quick Credentials & WhatsApp Contact Card */}
      {(() => {
        const superAdmin = users.find((u) => u.role === 'super_admin') || currentUser;
        const profile = DataService.getSchoolProfile();
        const adminWhatsapp = profile.adminWhatsapp || superAdmin.phone || '081299887711';
        return (
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-900/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/40 border border-indigo-400/40 flex items-center justify-center text-indigo-200 shrink-0">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{superAdmin.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    AKUN SUPER ADMIN
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] mt-0.5">
                  Username: <strong className="text-white font-mono">@{superAdmin.username}</strong> · Password: <strong className="text-white font-mono">{superAdmin.password || '123456'}</strong> · Kontak WhatsApp: <strong className="text-emerald-300 font-mono">{adminWhatsapp}</strong>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleOpenEdit(superAdmin)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-xs transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Ubah Kredensial & Kontak Admin</span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Pengguna</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{users.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Seluruh akun terdaftar</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Tenaga Pendidik</span>
            <GraduationCap className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-600 font-mono">
            {countByRole('guru') + countByRole('wali_kelas') + countByRole('guru_bk') + countByRole('wakasek_kurikulum') + countByRole('kepala_sekolah')}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Guru, Wali, BK & Kepsek</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Peserta Didik (Siswa)</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 font-mono">{countByRole('siswa')}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Akun siswa aktif</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Orang Tua / Wali</span>
            <UserCheck className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-orange-600 font-mono">{countByRole('orang_tua')}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Akun wali murid</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, username, email, NIP, atau NISN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
          >
            <option value="all">Semua Peran ({users.length})</option>
            <option value="super_admin">Super Admin</option>
            <option value="kepala_sekolah">Kepala Sekolah</option>
            <option value="wakasek_kurikulum">Wakasek Kurikulum</option>
            <option value="guru">Guru Mapel</option>
            <option value="wali_kelas">Wali Kelas</option>
            <option value="guru_bk">Guru BK</option>
            <option value="siswa">Peserta Didik</option>
            <option value="orang_tua">Orang Tua / Wali</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Lengkap & NIP/NISN</th>
                <th className="py-3 px-4">Peran (Role)</th>
                <th className="py-3 px-4">Username Login</th>
                <th className="py-3 px-4">Kata Sandi (Password)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi Super Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada data pengguna yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, index) => {
                  const roleDef = ROLE_DEFINITIONS[u.role] || {
                    label: u.role,
                    badgeColor: 'bg-slate-100 text-slate-800',
                  };
                  const isPassVisible = visiblePasswords[u.id];
                  const passwordDisplay = u.password || '123456';

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 text-center font-mono text-slate-400">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {u.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                          {u.nipOrNisn ? <span>NIP/NISN: {u.nipOrNisn}</span> : null}
                          <span className="text-slate-400">·</span>
                          <span>{u.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${roleDef.badgeColor}`}>
                          {roleDef.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded w-fit">
                          <span>{u.username}</span>
                          <button
                            onClick={() => handleCopy(u.username, 'Username')}
                            title="Salin Username"
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-1 rounded">
                            {isPassVisible ? passwordDisplay : '••••••••'}
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility(u.id)}
                            title={isPassVisible ? 'Sembunyikan Password' : 'Lihat Password'}
                            className="text-slate-400 hover:text-indigo-600 cursor-pointer"
                          >
                            {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleCopy(passwordDisplay, 'Password')}
                            title="Salin Password"
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.status === 'aktif'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleQuickResetPassword(u)}
                            title="Reset Password ke 123456"
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(u)}
                            title="Ubah Username / Password / Detail"
                            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            title="Hapus Pengguna"
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {editingUser ? 'Ubah Data & Kredensial Pengguna' : 'Tambah Pengguna Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Atur nama lengkap, username unik tanpa spasi, serta kata sandi akun.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Nama Lengkap Civitas
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dra. Nurul Hidayati, M.Pd. atau Ahmad Fauzi"
                  value={formData.name || ''}
                  onChange={(e) => {
                    const newName = e.target.value;
                    const autoU = newName.toLowerCase().replace(/[^a-z0-9]/g, '');
                    setFormData((prev) => ({
                      ...prev,
                      name: newName,
                      username: editingUser ? prev.username : autoU,
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Username Login (Tanpa Spasi)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="contoh: nurulhidayati"
                    value={formData.username || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Huruf kecil & angka saja tanpa spasi.
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Kata Sandi (Password)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Default: 123456"
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Standar awal: 123456
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Peran Hak Akses (Role)
                  </label>
                  <select
                    value={formData.role || 'guru'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer font-semibold"
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="kepala_sekolah">Kepala Sekolah</option>
                    <option value="wakasek_kurikulum">Wakasek Kurikulum</option>
                    <option value="guru">Guru Mata Pelajaran</option>
                    <option value="wali_kelas">Wali Kelas</option>
                    <option value="guru_bk">Guru Bimbingan Konseling (BK)</option>
                    <option value="siswa">Peserta Didik (Siswa)</option>
                    <option value="orang_tua">Orang Tua / Wali</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Status Akun
                  </label>
                  <select
                    value={formData.status || 'aktif'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'aktif' | 'nonaktif' })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    NIP / NUPTK / NISN
                  </label>
                  <input
                    type="text"
                    placeholder="Nomor identitas kedinasan/sekolah"
                    value={formData.nipOrNisn || ''}
                    onChange={(e) => setFormData({ ...formData, nipOrNisn: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    placeholder="0812-xxxx-xxxx"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Email Akun
                </label>
                <input
                  type="email"
                  placeholder="nama@smanusantara.sch.id"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Buat Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
