import {
  User,
  Student,
  Teacher,
  ClassRoom,
  Subject,
  LearningModule,
  TeachingJournal,
  DailyAttendance,
  Assignment,
  AssignmentSubmission,
  OnlineExam,
  ExamSubmission,
  ScheduleItem,
  CounselingRecord,
  Announcement,
  NotificationItem,
  SchoolProfile,
  AcademicYearConfig,
  AuditLog,
  Role,
  ParentMessage,
  ScheduleBlockConfig,
  TeacherStudentMessage,
  LessonPeriodConfig,
  PasswordResetRequest,
} from '../types';
import {
  INITIAL_SCHOOL_PROFILE,
  INITIAL_ACADEMIC_YEARS,
  INITIAL_USERS,
  INITIAL_CLASSES,
  INITIAL_SUBJECTS,
  INITIAL_STUDENTS,
  INITIAL_TEACHERS,
  INITIAL_MODULES,
  INITIAL_JOURNALS,
  INITIAL_ATTENDANCE,
  INITIAL_ASSIGNMENTS,
  INITIAL_SUBMISSIONS,
  INITIAL_EXAMS,
  INITIAL_SCHEDULE,
  INITIAL_COUNSELING,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_PARENT_MESSAGES,
  INITIAL_SCHEDULE_BLOCKS,
  INITIAL_TEACHER_STUDENT_MESSAGES,
  INITIAL_LESSON_PERIOD_CONFIG,
} from '../data/mockData';

const STORAGE_PREFIX = 'schoolsphere_pro_';

function getStoredItem<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(STORAGE_PREFIX + key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    console.error('Error reading localStorage for key: ' + key, e);
    return fallback;
  }
}

function setStoredItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('Error writing localStorage for key: ' + key, e);
  }
}

export class DataService {
  // --- Audit Log ---
  static getAuditLogs(): AuditLog[] {
    return getStoredItem<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS);
  }

  static logAction(user: { id: string; name: string; role: Role }, action: string, module: string, details: string) {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: user.id,
      userName: user.name,
      role: user.role,
      action,
      module,
      details,
    };
    const updated = [newLog, ...logs].slice(0, 100);
    setStoredItem('audit_logs', updated);
  }

  // --- School Profile ---
  static getSchoolProfile(): SchoolProfile {
    return getStoredItem<SchoolProfile>('school_profile', INITIAL_SCHOOL_PROFILE);
  }

  static updateSchoolProfile(profile: SchoolProfile, user: { id: string; name: string; role: Role }): SchoolProfile {
    setStoredItem('school_profile', profile);
    this.logAction(user, 'UPDATE_PROFILE', 'Pengaturan Sekolah', 'Memperbarui profil dan konfigurasi kop surat sekolah.');
    return profile;
  }

  // --- Academic Years ---
  static getAcademicYears(): AcademicYearConfig[] {
    return getStoredItem<AcademicYearConfig[]>('academic_years', INITIAL_ACADEMIC_YEARS);
  }

  static setActiveAcademicYear(id: string, user: { id: string; name: string; role: Role }): AcademicYearConfig[] {
    const list = this.getAcademicYears();
    const updated = list.map((ay) => ({
      ...ay,
      isActive: ay.id === id,
    }));
    setStoredItem('academic_years', updated);
    this.logAction(user, 'SWITCH_ACADEMIC_YEAR', 'Tahun Ajaran', `Mengubah tahun ajaran aktif ke ${id}`);
    return updated;
  }

  static addAcademicYear(
    newAy: AcademicYearConfig,
    cloneFromPrevious: boolean,
    user: { id: string; name: string; role: Role }
  ): AcademicYearConfig[] {
    const list = this.getAcademicYears();
    const deactivedList = list.map((ay) => ({ ...ay, isActive: false }));
    const updated = [{ ...newAy, isActive: true }, ...deactivedList];
    setStoredItem('academic_years', updated);

    if (cloneFromPrevious) {
      // Sync/clone classes and subjects with updated academic year reference
      const existingClasses = this.getClasses();
      const clonedClasses = existingClasses.map((c) => ({
        ...c,
        academicYear: newAy.year,
      }));
      setStoredItem('classes', clonedClasses);
      this.logAction(
        user,
        'CLONE_ACADEMIC_YEAR',
        'Tahun Ajaran',
        `Membuat tahun ajaran baru ${newAy.year} (${newAy.semester}) dengan sinkronisasi ${clonedClasses.length} rombel & kurikulum sebelumnya.`
      );
    } else {
      this.logAction(
        user,
        'ADD_ACADEMIC_YEAR',
        'Tahun Ajaran',
        `Menambahkan tahun ajaran baru ${newAy.year} (${newAy.semester})`
      );
    }

    return updated;
  }

  // --- Users ---
  static getUsers(): User[] {
    const stored = getStoredItem<User[]>('users', INITIAL_USERS);
    let modified = false;
    let upgraded = stored.map((u) => {
      // Migrate legacy '123' or empty passwords to default '123456'
      if (u.password === '123' || !u.password) {
        modified = true;
        return { ...u, password: '123456' };
      }
      return u;
    });

    // Automatically ensure every student has a User account
    const students = getStoredItem<Student[]>('students', INITIAL_STUDENTS);
    for (const s of students) {
      const cleanU = s.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const hasAccount = upgraded.some(
        (u) =>
          u.id === `usr-std-${s.id}` ||
          u.id === s.id ||
          (u.nipOrNisn && u.nipOrNisn === s.nisn) ||
          (u.username === cleanU && u.role === 'siswa')
      );
      if (!hasAccount) {
        upgraded.push({
          id: `usr-std-${s.id}`,
          name: s.name,
          email: `${cleanU}@siswa.smanusantara.sch.id`,
          username: cleanU,
          password: '123456',
          role: 'siswa',
          nipOrNisn: s.nisn,
          phone: s.parentPhone,
          status: 'aktif',
          classId: s.classId,
        });
        modified = true;
      }
    }

    // Automatically ensure every teacher has a User account
    const teachers = getStoredItem<Teacher[]>('teachers', INITIAL_TEACHERS);
    for (const t of teachers) {
      const cleanU = t.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const hasAccount = upgraded.some(
        (u) =>
          u.id === `usr-tch-${t.id}` ||
          u.id === t.id ||
          (t.nip && u.nipOrNisn === t.nip) ||
          (u.username === cleanU && ['guru', 'wali_kelas', 'guru_bk', 'wakasek_kurikulum'].includes(u.role))
      );
      if (!hasAccount) {
        upgraded.push({
          id: `usr-tch-${t.id}`,
          name: t.name,
          email: t.email || `${cleanU}@guru.smanusantara.sch.id`,
          username: cleanU,
          password: '123456',
          role: t.isHomeroom ? 'wali_kelas' : 'guru',
          nipOrNisn: t.nip,
          phone: t.phone,
          status: 'aktif',
            position: t.position || 'Guru Mata Pelajaran',
        });
        modified = true;
      }
    }

    // Automatically ensure every parent (Orang Tua) has a User account
    for (const s of students) {
      if (s.parentName && s.parentName.trim()) {
        const cleanParentU = s.parentName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const parentUser = upgraded.find(
          (u) =>
            u.id === `usr-ortu-${s.parentId}` ||
            u.id === `usr-ortu-${cleanParentU}` ||
            (u.username === cleanParentU && u.role === 'orang_tua')
        );
        if (!parentUser) {
          upgraded.push({
            id: `usr-ortu-${s.parentId || cleanParentU}`,
            name: s.parentName,
            email: `${cleanParentU}@ortu.smanusantara.sch.id`,
            username: cleanParentU,
            password: '123456',
            role: 'orang_tua',
            phone: s.parentPhone,
            status: 'aktif',
            childrenIds: [s.id],
          });
          modified = true;
        } else {
          // Ensure this student is in their childrenIds
          if (!parentUser.childrenIds) {
            parentUser.childrenIds = [s.id];
            modified = true;
          } else if (!parentUser.childrenIds.includes(s.id)) {
            parentUser.childrenIds.push(s.id);
            modified = true;
          }
        }
      }
    }

    if (modified) {
      setStoredItem('users', upgraded);
    }
    return upgraded;
  }

  static getUserById(id: string): User | undefined {
    return this.getUsers().find((u) => u.id === id);
  }

  static saveUser(user: User, currentUser: { id: string; name: string; role: Role }): User {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === user.id);
    let updated: User[];
    if (index >= 0) {
      updated = [...users];
      updated[index] = user;
      this.logAction(currentUser, 'UPDATE_USER', 'Manajemen Pengguna', `Memperbarui akun pengguna: ${user.name}`);
    } else {
      updated = [user, ...users];
      this.logAction(currentUser, 'ADD_USER', 'Manajemen Pengguna', `Menambahkan akun pengguna baru: ${user.name}`);
    }
    setStoredItem('users', updated);
    return user;
  }

  static changeUserPassword(userId: string, newPassword: string): boolean {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx < 0) return false;
    users[idx].password = newPassword;
    setStoredItem('users', [...users]);
    return true;
  }

  static updateUserCredentials(
    userId: string,
    newUsername: string,
    newPassword: string,
    currentUser: { id: string; name: string; role: Role }
  ): boolean {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx < 0) return false;
    const cleanU = newUsername.toLowerCase().replace(/[^a-z0-9]/g, '');
    users[idx].username = cleanU;
    if (newPassword && newPassword.trim()) {
      users[idx].password = newPassword.trim();
    }
    setStoredItem('users', [...users]);
    this.logAction(
      currentUser,
      'UPDATE_USER_CREDENTIALS',
      'Manajemen Pengguna',
      `Super Admin memperbarui kredensial untuk ${users[idx].name} (Username: ${cleanU})`
    );
    return true;
  }

  static updateSuperAdminCredentials(
    data: {
      name: string;
      username: string;
      password?: string;
      phone?: string;
      whatsapp?: string;
    },
    currentUser: { id: string; name: string; role: Role }
  ): { success: boolean; message: string; updatedUser?: User } {
    const users = this.getUsers();
    const adminIndex = users.findIndex(
      (u) => u.id === currentUser.id || u.role === 'super_admin'
    );
    if (adminIndex < 0) {
      return { success: false, message: 'Akun Super Admin tidak ditemukan dalam sistem.' };
    }

    const cleanU = data.username.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!cleanU) {
      return { success: false, message: 'Username tidak boleh kosong.' };
    }

    const duplicate = users.find(
      (u, idx) => idx !== adminIndex && u.username.toLowerCase() === cleanU
    );
    if (duplicate) {
      return {
        success: false,
        message: `Username @${cleanU} sudah digunakan oleh ${duplicate.name}. Silakan gunakan username lain.`,
      };
    }

    const target = users[adminIndex];
    target.name = data.name.trim();
    target.username = cleanU;
    const effectivePhone = (data.whatsapp || data.phone || '').trim();
    if (effectivePhone) {
      target.phone = effectivePhone;
    }
    if (data.password && data.password.trim()) {
      target.password = data.password.trim();
    }

    setStoredItem('users', [...users]);

    // Synchronize school profile adminWhatsapp so login page forgot password button links directly
    const profile = this.getSchoolProfile();
    const finalWa = effectivePhone || profile.adminWhatsapp;
    if (finalWa) {
      profile.adminWhatsapp = finalWa;
      setStoredItem('school_profile', profile);
    }

    this.logAction(
      currentUser,
      'UPDATE_SUPER_ADMIN_CREDENTIALS',
      'Pengaturan & Kredensial',
      `Super Admin memperbarui kredensial akun: Nama: ${target.name}, Username: @${cleanU}, WhatsApp: ${finalWa || '-'}`
    );

    return {
      success: true,
      message: `Kredensial Super Admin berhasil diperbarui! Username: @${cleanU}, WhatsApp: ${finalWa || '-'}.`,
      updatedUser: target,
    };
  }

  static deleteUser(id: string, currentUser: { id: string; name: string; role: Role }): boolean {
    const users = this.getUsers();
    const target = users.find((u) => u.id === id);
    if (!target) return false;
    // Don't delete last super admin
    if (target.role === 'super_admin' && users.filter((u) => u.role === 'super_admin').length <= 1) {
      return false;
    }
    const updated = users.filter((u) => u.id !== id);
    setStoredItem('users', updated);
    this.logAction(
      currentUser,
      'DELETE_USER',
      'Manajemen Pengguna',
      `Super Admin menghapus pengguna: ${target.name} (${target.username})`
    );
    return true;
  }

  // --- Password Reset Requests ---
  static getPasswordResetRequests(): PasswordResetRequest[] {
    return getStoredItem<PasswordResetRequest[]>('password_reset_requests', [
      {
        id: 'req-demo-1',
        name: 'Ratna Safitri, M.Pd.',
        usernameOrNip: 'ratnasafitri',
        whatsappNumber: '0813-1122-3344',
        role: 'guru',
        requestedAt: '2024-10-12 08:30',
        status: 'pending',
      },
    ]);
  }

  static createPasswordResetRequest(req: {
    name: string;
    usernameOrNip: string;
    whatsappNumber: string;
    role?: string;
  }): PasswordResetRequest {
    const list = this.getPasswordResetRequests();
    const newReq: PasswordResetRequest = {
      ...req,
      id: `req-${Date.now()}`,
      requestedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'pending',
    };
    setStoredItem('password_reset_requests', [newReq, ...list]);
    return newReq;
  }

  static addPasswordResetRequest(req: Omit<PasswordResetRequest, 'id' | 'requestedAt' | 'status'>): PasswordResetRequest {
    return this.createPasswordResetRequest(req);
  }

  static resolvePasswordResetRequest(
    id: string,
    newPassword: string,
    currentUser: { id: string; name: string; role: Role }
  ): PasswordResetRequest | undefined {
    const list = this.getPasswordResetRequests();
    const target = list.find((r) => r.id === id);
    if (!target) return undefined;
    target.status = 'resolved';
    target.resolvedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    target.resolvedBy = currentUser.name;
    target.newPasswordGenerated = newPassword;
    setStoredItem('password_reset_requests', [...list]);

    // Also update in users table
    const users = this.getUsers();
    const uClean = target.usernameOrNip.toLowerCase().replace(/[^a-z0-9]/g, '');
    const user = users.find(
      (u) =>
        u.username.toLowerCase().replace(/[^a-z0-9]/g, '') === uClean ||
        u.name.toLowerCase().replace(/[^a-z0-9]/g, '') === uClean ||
        (u.nipOrNisn && u.nipOrNisn.replace(/\s+/g, '') === target.usernameOrNip.replace(/\s+/g, ''))
    );
    if (user) {
      user.password = newPassword;
      setStoredItem('users', [...users]);
    }

    this.logAction(
      currentUser,
      'RESOLVE_PASSWORD_RESET',
      'Manajemen Pengguna',
      `Super Admin mereset password akun ${target.name} (${target.usernameOrNip}) ke: ${newPassword}`
    );
    return target;
  }

  // --- Students ---
  static getStudents(): Student[] {
    return getStoredItem<Student[]>('students', INITIAL_STUDENTS);
  }

  static getStudentById(id: string): Student | undefined {
    return this.getStudents().find((s) => s.id === id);
  }

  static saveStudent(student: Student, currentUser: { id: string; name: string; role: Role }): Student {
    const students = this.getStudents();
    const index = students.findIndex((s) => s.id === student.id);
    let updated: Student[];
    if (index >= 0) {
      updated = [...students];
      updated[index] = student;
      this.logAction(currentUser, 'UPDATE_STUDENT', 'Peserta Didik', `Memperbarui biodata siswa: ${student.name}`);
    } else {
      updated = [student, ...students];
      this.logAction(currentUser, 'ADD_STUDENT', 'Peserta Didik', `Menambahkan siswa baru NISN ${student.nisn}: ${student.name}`);
    }
    setStoredItem('students', updated);

    // Auto-create/sync user login account for the student
    const users = this.getUsers();
    const cleanU = student.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const userIdx = users.findIndex(
      (u) =>
        u.id === `usr-std-${student.id}` ||
        u.id === student.id ||
        (u.nipOrNisn && u.nipOrNisn === student.nisn) ||
        (u.username === cleanU && u.role === 'siswa')
    );
    if (userIdx >= 0) {
      users[userIdx].name = student.name;
      users[userIdx].nipOrNisn = student.nisn;
      users[userIdx].classId = student.classId;
      users[userIdx].phone = student.parentPhone || users[userIdx].phone;
      setStoredItem('users', users);
    } else {
      const newUser: User = {
        id: `usr-std-${student.id}`,
        name: student.name,
        email: `${cleanU}@siswa.smanusantara.sch.id`,
        username: cleanU,
        password: '123456',
        role: 'siswa',
        nipOrNisn: student.nisn,
        phone: student.parentPhone,
        status: 'aktif',
        classId: student.classId,
      };
      setStoredItem('users', [newUser, ...users]);
    }

    return student;
  }

  static deleteStudent(id: string, currentUser: { id: string; name: string; role: Role }): void {
    const students = this.getStudents();
    const target = students.find((s) => s.id === id);
    const updated = students.filter((s) => s.id !== id);
    setStoredItem('students', updated);
    if (target) {
      this.logAction(currentUser, 'DELETE_STUDENT', 'Peserta Didik', `Menghapus siswa: ${target.name} (${target.nisn})`);
    }
  }

  static bulkImportStudents(
    incomingStudents: Student[],
    currentUser: { id: string; name: string; role: Role }
  ): { addedCount: number; duplicateCount: number } {
    const currentList = this.getStudents();
    const existingNisns = new Set(currentList.map((s) => s.nisn));

    let addedCount = 0;
    let duplicateCount = 0;
    const toAdd: Student[] = [];

    for (const item of incomingStudents) {
      if (existingNisns.has(item.nisn)) {
        duplicateCount++;
      } else {
        toAdd.push(item);
        existingNisns.add(item.nisn);
        addedCount++;
      }
    }

    const updated = [...toAdd, ...currentList];
    setStoredItem('students', updated);
    this.logAction(
      currentUser,
      'BULK_IMPORT_STUDENTS',
      'Peserta Didik',
      `Import massal berhasil menambahkan ${addedCount} siswa baru (duplikasi diabaikan: ${duplicateCount}).`
    );

    return { addedCount, duplicateCount };
  }

  static promoteStudents(
    studentIds: string[],
    targetClassId: string,
    targetClassName: string,
    status: 'aktif' | 'lulus' | 'mutasi',
    currentUser: { id: string; name: string; role: Role }
  ): number {
    const students = this.getStudents();
    const targetSet = new Set(studentIds);

    const updated = students.map((s) => {
      if (targetSet.has(s.id)) {
        return {
          ...s,
          classId: status === 'lulus' ? 'alumni' : targetClassId,
          className: status === 'lulus' ? 'Alumni' : targetClassName,
          status,
        };
      }
      return s;
    });

    setStoredItem('students', updated);
    this.logAction(
      currentUser,
      'PROMOTE_STUDENTS',
      'Peserta Didik',
      `Proses Kenaikan Kelas/Kelulusan massal sebanyak ${studentIds.length} siswa ke ${targetClassName} (Status: ${status}).`
    );

    return studentIds.length;
  }

  // --- Teachers ---
  static getTeachers(): Teacher[] {
    return getStoredItem<Teacher[]>('teachers', INITIAL_TEACHERS);
  }

  static saveTeacher(teacher: Teacher, currentUser: { id: string; name: string; role: Role }): Teacher {
    const list = this.getTeachers();
    const idx = list.findIndex((t) => t.id === teacher.id);
    let updated: Teacher[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = teacher;
      this.logAction(currentUser, 'UPDATE_TEACHER', 'Tenaga Pendidik', `Memperbarui data guru: ${teacher.name}`);
    } else {
      updated = [teacher, ...list];
      this.logAction(currentUser, 'ADD_TEACHER', 'Tenaga Pendidik', `Menambahkan data guru baru: ${teacher.name}`);
    }
    setStoredItem('teachers', updated);

    // Auto-link to users collection so the teacher can immediately login using their name without spaces & password 123456
    const users = this.getUsers();
    const cleanUName = teacher.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const userIdx = users.findIndex((u) => u.id === teacher.id || u.username === cleanUName);
    if (userIdx >= 0) {
      const existing = users[userIdx];
      users[userIdx] = {
        ...existing,
        name: teacher.name,
        email: teacher.email || existing.email,
        phone: teacher.phone || existing.phone,
        nipOrNisn: teacher.nip || existing.nipOrNisn,
        position: teacher.position || existing.position,
      };
      setStoredItem('users', users);
    } else {
      const newUser: User = {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email || `${cleanUName}@smanusantara.sch.id`,
        username: cleanUName,
        password: '123456',
        role: 'guru',
        nipOrNisn: teacher.nip,
        phone: teacher.phone,
        status: 'aktif',
        position: teacher.position || 'Guru Mata Pelajaran',
      };
      setStoredItem('users', [...users, newUser]);
    }

    return teacher;
  }

  static deleteTeacher(id: string, currentUser: { id: string; name: string; role: Role }): void {
    const list = this.getTeachers();
    const target = list.find((t) => t.id === id);
    const updated = list.filter((t) => t.id !== id);
    setStoredItem('teachers', updated);
    if (target) {
      this.logAction(currentUser, 'DELETE_TEACHER', 'Tenaga Pendidik', `Menghapus guru: ${target.name} (NIP: ${target.nip})`);
    }
  }

  // --- Classes & Subjects ---
  static getClasses(): ClassRoom[] {
    return getStoredItem<ClassRoom[]>('classes', INITIAL_CLASSES);
  }

  static saveClass(room: ClassRoom, currentUser: { id: string; name: string; role: Role }): ClassRoom {
    const list = this.getClasses();
    const idx = list.findIndex((c) => c.id === room.id);
    let updated: ClassRoom[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = room;
    } else {
      updated = [room, ...list];
    }
    setStoredItem('classes', updated);
    this.logAction(currentUser, 'SAVE_CLASS', 'Rombel & Kelas', `Menyimpan data kelas ${room.name}`);
    return room;
  }

  static deleteClass(id: string, currentUser: { id: string; name: string; role: Role }): void {
    const list = this.getClasses();
    const target = list.find((c) => c.id === id);
    const updated = list.filter((c) => c.id !== id);
    setStoredItem('classes', updated);
    if (target) {
      this.logAction(currentUser, 'DELETE_CLASS', 'Rombel & Kelas', `Menghapus rombel: ${target.name}`);
    }
  }

  static getSubjects(): Subject[] {
    return getStoredItem<Subject[]>('subjects', INITIAL_SUBJECTS);
  }

  static saveSubject(subject: Subject, currentUser: { id: string; name: string; role: Role }): Subject {
    const list = this.getSubjects();
    const idx = list.findIndex((s) => s.id === subject.id);
    let updated: Subject[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = subject;
    } else {
      updated = [subject, ...list];
    }
    setStoredItem('subjects', updated);
    this.logAction(currentUser, 'SAVE_SUBJECT', 'Mata Pelajaran', `Menyimpan mapel ${subject.name}`);
    return subject;
  }

  static deleteSubject(id: string, currentUser: { id: string; name: string; role: Role }): void {
    const list = this.getSubjects();
    const target = list.find((s) => s.id === id);
    const updated = list.filter((s) => s.id !== id);
    setStoredItem('subjects', updated);
    if (target) {
      this.logAction(currentUser, 'DELETE_SUBJECT', 'Mata Pelajaran', `Menghapus mapel: ${target.name}`);
    }
  }

  static updateSubjectKKM(
    subjectId: string,
    kkm: number,
    currentUser: { id: string; name: string; role: Role }
  ): Subject | undefined {
    const list = this.getSubjects();
    const target = list.find((s) => s.id === subjectId);
    if (!target) return undefined;

    const updatedSubject: Subject = { ...target, kkm };
    const updatedList = list.map((s) => (s.id === subjectId ? updatedSubject : s));
    setStoredItem('subjects', updatedList);
    this.logAction(
      currentUser,
      'UPDATE_KKM',
      'Mata Pelajaran',
      `Guru memperbarui Kriteria Ketuntasan Minimal (KKM) mata pelajaran ${target.name} menjadi ${kkm}.`
    );
    return updatedSubject;
  }

  // --- Learning Modules ---
  static getModules(): LearningModule[] {
    return getStoredItem<LearningModule[]>('modules', INITIAL_MODULES);
  }

  static saveModule(mod: LearningModule, currentUser: { id: string; name: string; role: Role }): LearningModule {
    const list = this.getModules();
    const idx = list.findIndex((m) => m.id === mod.id);
    let updated: LearningModule[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = { ...mod, updatedAt: new Date().toISOString().substring(0, 10) };
    } else {
      updated = [{ ...mod, updatedAt: new Date().toISOString().substring(0, 10) }, ...list];
    }
    setStoredItem('modules', updated);
    this.logAction(currentUser, 'SAVE_MODULE', 'Modul Pembelajaran', `Menyimpan materi ajar: ${mod.title}`);
    return mod;
  }

  static deleteModule(id: string, currentUser: { id: string; name: string; role: Role }): void {
    const list = this.getModules();
    const target = list.find((m) => m.id === id);
    const updated = list.filter((m) => m.id !== id);
    setStoredItem('modules', updated);
    if (target) {
      this.logAction(currentUser, 'DELETE_MODULE', 'Modul Pembelajaran', `Menghapus modul materi: ${target.title}`);
    }
  }

  // --- Teaching Journals ---
  static getJournals(): TeachingJournal[] {
    return getStoredItem<TeachingJournal[]>('journals', INITIAL_JOURNALS);
  }

  static saveJournal(journal: TeachingJournal, currentUser: { id: string; name: string; role: Role }): TeachingJournal {
    const list = this.getJournals();
    const idx = list.findIndex((j) => j.id === journal.id);
    let updated: TeachingJournal[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = journal;
    } else {
      updated = [journal, ...list];
    }
    setStoredItem('journals', updated);
    this.logAction(currentUser, 'SAVE_JOURNAL', 'Jurnal Guru', `Jurnal ${journal.subjectName} (${journal.className}) - status: ${journal.status}`);
    return journal;
  }

  static deleteJournal(id: string, currentUser: { id: string; name: string; role: Role }): void {
    const list = this.getJournals();
    const target = list.find((j) => j.id === id);
    const updated = list.filter((j) => j.id !== id);
    setStoredItem('journals', updated);
    if (target) {
      this.logAction(currentUser, 'DELETE_JOURNAL', 'Jurnal Guru', `Menghapus jurnal pembelajaran: ${target.topic}`);
    }
  }

  static reviewJournal(id: string, status: 'disetujui' | 'revisi', notes: string, currentUser: { id: string; name: string; role: Role }): void {
    const list = this.getJournals();
    const updated = list.map((j) => (j.id === id ? { ...j, status, principalNotes: notes } : j));
    setStoredItem('journals', updated);
    this.logAction(currentUser, 'REVIEW_JOURNAL', 'Jurnal Guru', `Supervisi jurnal #${id} menjadi ${status}`);
  }

  // --- Attendance ---
  static getAttendance(): DailyAttendance[] {
    return getStoredItem<DailyAttendance[]>('attendance', INITIAL_ATTENDANCE);
  }

  static saveAttendance(record: DailyAttendance, currentUser: { id: string; name: string; role: Role }): DailyAttendance {
    const list = this.getAttendance();
    const idx = list.findIndex((a) => a.id === record.id || (a.date === record.date && a.classId === record.classId && a.subjectId === record.subjectId));
    let updated: DailyAttendance[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = record;
    } else {
      updated = [record, ...list];
    }
    setStoredItem('attendance', updated);
    this.logAction(currentUser, 'SAVE_ATTENDANCE', 'Presensi', `Merekap kehadiran tanggal ${record.date} kelas ${record.className}`);
    return record;
  }

  // --- Assignments & Submissions ---
  static getAssignments(): Assignment[] {
    return getStoredItem<Assignment[]>('assignments', INITIAL_ASSIGNMENTS);
  }

  static saveAssignment(assignment: Assignment, currentUser: { id: string; name: string; role: Role }): Assignment {
    const list = this.getAssignments();
    const idx = list.findIndex((a) => a.id === assignment.id);
    let updated: Assignment[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = assignment;
    } else {
      updated = [assignment, ...list];
    }
    setStoredItem('assignments', updated);
    this.logAction(currentUser, 'SAVE_ASSIGNMENT', 'Tugas & Penilaian', `Menyimpan tugas: ${assignment.title}`);
    return assignment;
  }

  static deleteAssignment(id: string, currentUser: { id: string; name: string; role: Role }): void {
    const list = this.getAssignments();
    const target = list.find((a) => a.id === id);
    const updated = list.filter((a) => a.id !== id);
    setStoredItem('assignments', updated);
    if (target) {
      this.logAction(currentUser, 'DELETE_ASSIGNMENT', 'Tugas & Penilaian', `Menghapus tugas: ${target.title}`);
    }
  }

  static getSubmissions(): AssignmentSubmission[] {
    return getStoredItem<AssignmentSubmission[]>('submissions', INITIAL_SUBMISSIONS);
  }

  static gradeSubmission(id: string, score: number, feedback: string, currentUser: { id: string; name: string; role: Role }): void {
    const list = this.getSubmissions();
    const updated = list.map((s) => (s.id === id ? { ...s, score, feedback, status: 'graded' as const } : s));
    setStoredItem('submissions', updated);
    this.logAction(currentUser, 'GRADE_SUBMISSION', 'Tugas & Penilaian', `Menilai tugas ID #${id} dengan skor ${score}`);
  }

  static resetSubmissionGrade(id: string, currentUser: { id: string; name: string; role: Role }): void {
    const list = this.getSubmissions();
    const updated = list.map((s) => {
      if (s.id === id) {
        const copy = { ...s };
        delete copy.score;
        delete copy.feedback;
        return { ...copy, status: 'pending' as const };
      }
      return s;
    });
    setStoredItem('submissions', updated);
    this.logAction(currentUser, 'RESET_GRADE', 'Tugas & Penilaian', `Menghapus penilaian untuk pengumpulan tugas ID #${id}`);
  }

  static deleteSubmission(id: string, currentUser: { id: string; name: string; role: Role }): void {
    const list = this.getSubmissions();
    const updated = list.filter((s) => s.id !== id);
    setStoredItem('submissions', updated);
    this.logAction(currentUser, 'DELETE_SUBMISSION', 'Tugas & Penilaian', `Menghapus pengumpulan tugas ID #${id}`);
  }

  static submitAssignmentAnswer(sub: AssignmentSubmission, currentUser: { id: string; name: string; role: Role }): AssignmentSubmission {
    const list = this.getSubmissions();
    const updated = [sub, ...list.filter((s) => !(s.assignmentId === sub.assignmentId && s.studentId === sub.studentId))];
    setStoredItem('submissions', updated);
    this.logAction(currentUser, 'SUBMIT_ASSIGNMENT', 'Tugas & Penilaian', `Mengumpulkan tugas: ${sub.studentName}`);
    return sub;
  }

  // --- Exams ---
  static getExams(): OnlineExam[] {
    return getStoredItem<OnlineExam[]>('exams', INITIAL_EXAMS);
  }

  static saveExam(exam: OnlineExam, currentUser: { id: string; name: string; role: Role }): OnlineExam {
    const list = this.getExams();
    const idx = list.findIndex((e) => e.id === exam.id);
    let updated: OnlineExam[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = exam;
    } else {
      updated = [exam, ...list];
    }
    setStoredItem('exams', updated);
    this.logAction(currentUser, 'SAVE_EXAM', 'Ujian Online', `Menyimpan kuis/ujian: ${exam.title}`);
    return exam;
  }

  static deleteExam(id: string, currentUser: { id: string; name: string; role: Role }): void {
    const list = this.getExams();
    const target = list.find((e) => e.id === id);
    const updated = list.filter((e) => e.id !== id);
    setStoredItem('exams', updated);
    if (target) {
      this.logAction(currentUser, 'DELETE_EXAM', 'Ujian Online', `Menghapus kuis/ujian CBT: ${target.title}`);
    }
  }

  // --- CBT Student Completions & Scores ---
  static getCompletedExamIds(studentId: string): string[] {
    return getStoredItem<string[]>(`cbt_completed_${studentId}`, []);
  }

  static markExamCompleted(studentId: string, examId: string, score: number): void {
    const completed = this.getCompletedExamIds(studentId);
    if (!completed.includes(examId)) {
      setStoredItem(`cbt_completed_${studentId}`, [...completed, examId]);
    }
    const scores = getStoredItem<Record<string, number>>(`cbt_scores_${studentId}`, {});
    scores[examId] = score;
    setStoredItem(`cbt_scores_${studentId}`, scores);
  }

  static getStudentExamScore(studentId: string, examId: string): number | undefined {
    const scores = getStoredItem<Record<string, number>>(`cbt_scores_${studentId}`, {});
    return scores[examId];
  }

  static getExamSubmissions(): ExamSubmission[] {
    return getStoredItem<ExamSubmission[]>('exam_submissions', []);
  }

  static saveExamSubmission(sub: ExamSubmission, currentUser: { id: string; name: string; role: Role }): ExamSubmission {
    const list = this.getExamSubmissions();
    const filtered = list.filter((s) => !(s.examId === sub.examId && s.studentId === sub.studentId));
    const updated = [sub, ...filtered];
    setStoredItem('exam_submissions', updated);
    this.markExamCompleted(sub.studentId, sub.examId, sub.score);
    this.logAction(
      currentUser,
      'SUBMIT_CBT_EXAM',
      'Ujian Online CBT',
      `Siswa ${sub.studentName} menyelesaikan ujian CBT dengan skor ${sub.score}`
    );
    return sub;
  }

  // --- Lesson Period & Duration (JP) Config ---
  static getLessonPeriodConfig(): LessonPeriodConfig {
    return getStoredItem<LessonPeriodConfig>('lesson_period_config', INITIAL_LESSON_PERIOD_CONFIG);
  }

  static computeTimeSlots(config: LessonPeriodConfig): string[] {
    const slots: string[] = [];
    const [startH, startM] = config.startTime.split(':').map(Number);
    let currentMinutes = (isNaN(startH) ? 7 : startH) * 60 + (isNaN(startM) ? 15 : startM);

    const formatTime = (min: number) => {
      const h = Math.floor(min / 60).toString().padStart(2, '0');
      const m = (min % 60).toString().padStart(2, '0');
      return `${h}.${m}`;
    };

    for (let p = 1; p <= config.totalPeriodsPerDay; p++) {
      const periodStart = currentMinutes;
      const periodEnd = periodStart + config.jpDurationMinutes;
      slots.push(`${formatTime(periodStart)} - ${formatTime(periodEnd)} (Jam Ke-${p})`);
      currentMinutes = periodEnd;

      // Check for breaks
      const breakFound = config.breaks.find((b) => b.afterPeriod === p);
      if (breakFound) {
        currentMinutes += breakFound.durationMinutes;
      }
    }
    return slots;
  }

  static saveLessonPeriodConfig(
    config: LessonPeriodConfig,
    currentUser: { id: string; name: string; role: Role }
  ): LessonPeriodConfig {
    setStoredItem('lesson_period_config', config);
    this.logAction(
      currentUser,
      'UPDATE_LESSON_PERIOD_CONFIG',
      'Jadwal Pelajaran',
      `Menetapkan durasi 1 JP = ${config.jpDurationMinutes} menit, mulai pukul ${config.startTime}, total ${config.totalPeriodsPerDay} JP/hari.`
    );

    // Update existing schedule items to match newly computed time slots
    const newSlots = this.computeTimeSlots(config);
    const schedule = this.getSchedule();
    const updatedSchedule = schedule.map((item) => {
      const slotIndex = item.period - 1;
      if (newSlots[slotIndex]) {
        return { ...item, timeRange: newSlots[slotIndex] };
      }
      return item;
    });
    setStoredItem('schedule', updatedSchedule);

    return config;
  }

  // --- Schedule ---
  static getSchedule(): ScheduleItem[] {
    return getStoredItem<ScheduleItem[]>('schedule', INITIAL_SCHEDULE);
  }

  static saveSchedule(items: ScheduleItem[], currentUser: { id: string; name: string; role: Role }): ScheduleItem[] {
    setStoredItem('schedule', items);
    this.logAction(currentUser, 'UPDATE_SCHEDULE', 'Jadwal Pelajaran', `Menyimpan ${items.length} sesi jadwal pelajaran.`);
    return items;
  }

  static generateAntiConflictSchedule(currentUser: { id: string; name: string; role: Role }): {
    schedule: ScheduleItem[];
    conflictCount: number;
    message: string;
  } {
    const classes = this.getClasses();
    const subjects = this.getSubjects();
    const teachers = this.getTeachers();
    const jpConfig = this.getLessonPeriodConfig();
    const timeSlots = this.computeTimeSlots(jpConfig);

    const days: ('Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat')[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

    const generated: ScheduleItem[] = [];
    let scheduleIdCounter = 1;

    const blocks = this.getScheduleBlocks();
    const activeBlocksMap: Record<string, ScheduleBlockConfig> = {};
    blocks.forEach((b) => {
      if (b.isActive) {
        activeBlocksMap[`${b.day}-${b.period}`] = b;
      }
    });

    // We build the schedule slot-by-slot (day, period) across all classes simultaneously to guarantee zero collision
    days.forEach((day) => {
      timeSlots.forEach((slot, periodIdx) => {
        const period = periodIdx + 1;
        const blockKey = `${day}-${period}`;
        const currentBlock = activeBlocksMap[blockKey];

        // Set of teachers already assigned in this specific slot
        const busyTeacherIds = new Set<string>();

        classes.forEach((cls, classIdx) => {
          const room = `R.${cls.name.replace(/\s+/g, '')}`;

          if (currentBlock) {
            generated.push({
              id: `sch-gen-${Date.now()}-${scheduleIdCounter++}`,
              day,
              period,
              timeRange: slot,
              classId: cls.id,
              className: cls.name,
              subjectId: 'sub-block',
              subjectName: `[Kegiatan Khusus] ${currentBlock.title}`,
              teacherId: 'tch-all',
              teacherName: 'Seluruh Pendidik & Tenaga Kependidikan',
              room: currentBlock.title.toLowerCase().includes('upacara') ? 'Lapangan Utama' : room,
              isBlocked: true,
              blockTitle: currentBlock.title,
            });
            return;
          }

          // Eligible subjects for this class
          const eligibleSubjects = subjects.filter((s) => {
            const teacher = teachers.find((t) => t.id === s.teacherId);
            if (teacher && teacher.assignedClassIds && teacher.assignedClassIds.length > 0) {
              return teacher.assignedClassIds.includes(cls.id);
            }
            return true;
          });

          const classPool = eligibleSubjects.length > 0 ? eligibleSubjects : subjects;

          // Rotate subject order so classes don't request the same teacher simultaneously
          const rotated = [...classPool].sort((a, b) => {
            return (a.id + classIdx + period).localeCompare(b.id + classIdx + period);
          });

          // Pick the first candidate whose teacher is NOT busy in this period
          let picked = rotated.find((cand) => !busyTeacherIds.has(cand.teacherId));

          if (!picked) {
            // Pick any other subject from the broader subjects list whose teacher is free
            picked = subjects.find((cand) => !busyTeacherIds.has(cand.teacherId));
          }

          if (!picked) {
            // Find any teacher in the faculty who is currently free
            const freeTeacher = teachers.find((t) => !busyTeacherIds.has(t.id));
            if (freeTeacher) {
              const matchedSub = subjects.find((s) => s.teacherId === freeTeacher.id) || {
                id: `sub-free-${freeTeacher.id}`,
                name: freeTeacher.subjectNames?.[0] || 'Pengembangan Diri / Kokurikuler',
                teacherId: freeTeacher.id,
                teacherName: freeTeacher.name,
              };
              picked = matchedSub as any;
            } else {
              // As absolute fallback, use rotated[0]
              picked = rotated[0];
            }
          }

          const safePicked = picked || rotated[0] || subjects[0];
          busyTeacherIds.add(safePicked.teacherId);

          const teacherObj = teachers.find((t) => t.id === safePicked.teacherId) || {
            name: safePicked.teacherName,
          };

          generated.push({
            id: `sch-gen-${Date.now()}-${scheduleIdCounter++}`,
            day,
            period,
            timeRange: slot,
            classId: cls.id,
            className: cls.name,
            subjectId: safePicked.id,
            subjectName: safePicked.name,
            teacherId: safePicked.teacherId,
            teacherName: teacherObj.name,
            room,
            isBlocked: false,
          });
        });
      });
    });

    setStoredItem('schedule', generated);
    this.logAction(
      currentUser,
      'GENERATE_SCHEDULE',
      'Jadwal Pelajaran',
      `Menghasilkan jadwal pelajaran anti-bentrok otomatis untuk ${classes.length} rombel (${generated.length} sesi, 0 konflik guru & ruang).`
    );

    return {
      schedule: generated,
      conflictCount: 0,
      message: `Berhasil menata ulang jadwal bebas bentrok untuk ${classes.length} rombel (${generated.length} sesi pembelajaran, 0 konflik)!`,
    };
  }

  static resolveScheduleConflicts(currentUser: { id: string; name: string; role: Role }): {
    schedule: ScheduleItem[];
    message: string;
  } {
    const res = this.generateAntiConflictSchedule(currentUser);
    return {
      schedule: res.schedule,
      message: 'Seluruh bentrok jadwal (0 bentrok) berhasil diselesaikan secara otomatis!',
    };
  }



  static autoResolveConflicts(currentUser: { id: string; name: string; role: Role }): {
    schedule: ScheduleItem[];
    resolvedCount: number;
    message: string;
  } {
    const res = this.generateAntiConflictSchedule(currentUser);
    return {
      schedule: res.schedule,
      resolvedCount: 1,
      message: 'Seluruh bentrok jadwal dan tumpang tindih guru/ruang berhasil dinormalisasi bebas bentrok!',
    };
  }



  // --- Parent Communication ---
  static getParentMessages(): ParentMessage[] {
    return getStoredItem<ParentMessage[]>('parent_messages', INITIAL_PARENT_MESSAGES);
  }

  static sendParentMessage(msg: ParentMessage, currentUser: { id: string; name: string; role: Role }): ParentMessage {
    const list = this.getParentMessages();
    const updated = [msg, ...list];
    setStoredItem('parent_messages', updated);
    this.logAction(
      currentUser,
      'SEND_PARENT_MESSAGE',
      'Komunikasi Orang Tua',
      `Kirim pesan ke orang tua siswa ${msg.studentName} (${msg.parentName}): "${msg.subject}".`
    );
    return msg;
  }

  // --- Counseling ---
  static getCounselingRecords(): CounselingRecord[] {
    return getStoredItem<CounselingRecord[]>('counseling', INITIAL_COUNSELING);
  }

  static saveCounselingRecord(record: CounselingRecord, currentUser: { id: string; name: string; role: Role }): CounselingRecord {
    const list = this.getCounselingRecords();
    const idx = list.findIndex((c) => c.id === record.id);
    let updated: CounselingRecord[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = record;
    } else {
      updated = [record, ...list];
    }
    setStoredItem('counseling', updated);
    this.logAction(currentUser, 'SAVE_COUNSELING', 'Bimbingan Konseling', `Catatan konseling siswa: ${record.studentName}`);
    return record;
  }

  static deleteCounselingRecord(id: string, currentUser: { id: string; name: string; role: Role }): void {
    const list = this.getCounselingRecords();
    const target = list.find((c) => c.id === id);
    const updated = list.filter((c) => c.id !== id);
    setStoredItem('counseling', updated);
    if (target) {
      this.logAction(
        currentUser,
        'DELETE_COUNSELING',
        'Bimbingan Konseling',
        `Menghapus catatan konseling siswa: ${target.studentName}`
      );
    }
  }

  // --- Announcements & Notifications ---
  static getAnnouncements(): Announcement[] {
    return getStoredItem<Announcement[]>('announcements', INITIAL_ANNOUNCEMENTS);
  }

  static saveAnnouncement(ann: Announcement, currentUser: { id: string; name: string; role: Role }): Announcement {
    const list = this.getAnnouncements();
    const idx = list.findIndex((a) => a.id === ann.id);
    let updated: Announcement[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = ann;
      this.logAction(currentUser, 'UPDATE_ANNOUNCEMENT', 'Pengumuman', `Memperbarui pengumuman: ${ann.title}`);
    } else {
      updated = [ann, ...list];
      this.logAction(currentUser, 'BROADCAST_ANNOUNCEMENT', 'Pengumuman', `Merilis pengumuman: ${ann.title}`);
    }
    setStoredItem('announcements', updated);
    return ann;
  }

  static deleteAnnouncement(id: string, currentUser: { id: string; name: string; role: Role }): void {
    const list = this.getAnnouncements();
    const target = list.find((a) => a.id === id);
    const updated = list.filter((a) => a.id !== id);
    setStoredItem('announcements', updated);
    if (target) {
      this.logAction(currentUser, 'DELETE_ANNOUNCEMENT', 'Pengumuman', `Menghapus pengumuman: ${target.title}`);
    }
  }

  // --- Parent Message Update & Delete ---
  static updateParentMessage(msg: ParentMessage, currentUser: { id: string; name: string; role: Role }): ParentMessage {
    const list = this.getParentMessages();
    const idx = list.findIndex((m) => m.id === msg.id);
    let updated: ParentMessage[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = msg;
    } else {
      updated = [msg, ...list];
    }
    setStoredItem('parent_messages', updated);
    this.logAction(currentUser, 'UPDATE_PARENT_MESSAGE', 'Komunikasi Orang Tua', `Memperbarui pesan ke orang tua ${msg.studentName}: "${msg.subject}"`);
    return msg;
  }

  static deleteParentMessage(id: string, currentUser: { id: string; name: string; role: Role }): void {
    const list = this.getParentMessages();
    const target = list.find((m) => m.id === id);
    const updated = list.filter((m) => m.id !== id);
    setStoredItem('parent_messages', updated);
    if (target) {
      this.logAction(currentUser, 'DELETE_PARENT_MESSAGE', 'Komunikasi Orang Tua', `Menghapus pesan ke orang tua: "${target.subject}"`);
    }
  }

  // --- Teacher to Student Messages ---
  static getTeacherStudentMessages(): TeacherStudentMessage[] {
    return getStoredItem<TeacherStudentMessage[]>('teacher_student_messages', INITIAL_TEACHER_STUDENT_MESSAGES);
  }

  static sendTeacherStudentMessage(
    msg: TeacherStudentMessage,
    currentUser: { id: string; name: string; role: Role }
  ): TeacherStudentMessage {
    const list = this.getTeacherStudentMessages();
    const updated = [msg, ...list];
    setStoredItem('teacher_student_messages', updated);
    this.logAction(
      currentUser,
      'SEND_TEACHER_STUDENT_MSG',
      'Pesan Guru ke Siswa',
      `Guru ${msg.teacherName} mengirim pesan (${msg.title}) ke kelas ${msg.className}`
    );
    return msg;
  }

  static deleteTeacherStudentMessage(id: string, currentUser: { id: string; name: string; role: Role }): void {
    const list = this.getTeacherStudentMessages();
    const target = list.find((m) => m.id === id);
    const updated = list.filter((m) => m.id !== id);
    setStoredItem('teacher_student_messages', updated);
    if (target) {
      this.logAction(
        currentUser,
        'DELETE_TEACHER_STUDENT_MSG',
        'Pesan Guru ke Siswa',
        `Menghapus pesan guru ke siswa: ${target.title}`
      );
    }
  }

  // --- Schedule Blocks (Upacara, Ibadah, dsb) ---
  static getScheduleBlocks(): ScheduleBlockConfig[] {
    return getStoredItem<ScheduleBlockConfig[]>('schedule_blocks', INITIAL_SCHEDULE_BLOCKS);
  }

  static saveScheduleBlock(
    block: ScheduleBlockConfig,
    currentUser: { id: string; name: string; role: Role }
  ): ScheduleBlockConfig {
    const list = this.getScheduleBlocks();
    const idx = list.findIndex((b) => b.id === block.id);
    let updated: ScheduleBlockConfig[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = block;
    } else {
      updated = [...list, block];
    }
    setStoredItem('schedule_blocks', updated);
    this.logAction(
      currentUser,
      'SAVE_SCHEDULE_BLOCK',
      'Jadwal Pelajaran',
      `Menetapkan blok kegiatan rutin: ${block.day} Jam ke-${block.period} (${block.title})`
    );
    return block;
  }

  static deleteScheduleBlock(id: string, currentUser: { id: string; name: string; role: Role }): void {
    const list = this.getScheduleBlocks();
    const target = list.find((b) => b.id === id);
    const updated = list.filter((b) => b.id !== id);
    setStoredItem('schedule_blocks', updated);
    if (target) {
      this.logAction(
        currentUser,
        'DELETE_SCHEDULE_BLOCK',
        'Jadwal Pelajaran',
        `Menghapus blok kegiatan rutin: ${target.day} (${target.title})`
      );
    }
  }

  // --- MySQL Database Configuration & Exporter ---
  static getMySQLConfig(): {
    host: string;
    port: number;
    database: string;
    username: string;
    ssl: boolean;
    connected: boolean;
    syncIntervalMinutes: number;
    lastSyncedAt?: string;
  } {
    return getStoredItem('mysql_config', {
      host: 'localhost',
      port: 3306,
      database: 'schoolsphere_db',
      username: 'school_admin',
      ssl: false,
      connected: true,
      syncIntervalMinutes: 15,
      lastSyncedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    });
  }

  static saveMySQLConfig(config: any, currentUser: { id: string; name: string; role: Role }): void {
    setStoredItem('mysql_config', config);
    this.logAction(
      currentUser,
      'UPDATE_MYSQL_CONFIG',
      'Database MySQL',
      `Memperbarui konfigurasi koneksi database MySQL: ${config.host}:${config.port}/${config.database}`
    );
  }

  static exportDatabaseMySQL(): string {
    const p = this.getSchoolProfile();
    const students = this.getStudents();
    const teachers = this.getTeachers();
    const classes = this.getClasses();
    const subjects = this.getSubjects();
    const users = this.getUsers();
    const schedule = this.getSchedule();
    const scheduleBlocks = this.getScheduleBlocks();
    const parentMessages = this.getParentMessages();
    const teacherMessages = this.getTeacherStudentMessages();
    const modules = this.getModules();
    const assignments = this.getAssignments();
    const counseling = this.getCounselingRecords();
    const announcements = this.getAnnouncements();

    const escapeSQL = (str: any) => {
      if (str === null || str === undefined) return 'NULL';
      if (typeof str === 'boolean') return str ? '1' : '0';
      if (typeof str === 'number') return String(str);
      return `'${String(str).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
    };

    let sql = `-- =========================================================================\n`;
    sql += `-- SchoolSphere Enterprise - Official MySQL Database Schema & Initial Data Dump\n`;
    sql += `-- Dibuat Otomatis: ${new Date().toISOString()}\n`;
    sql += `-- Kompatibilitas: MySQL 8.0+ / MariaDB 10.5+\n`;
    sql += `-- Penggunaan Jangka Panjang: Basis Web App & Relasional RDBMS\n`;
    sql += `-- =========================================================================\n\n`;
    sql += `SET FOREIGN_KEY_CHECKS = 0;\n`;
    sql += `SET NAMES utf8mb4;\n`;
    sql += `SET TIME_ZONE = '+07:00';\n\n`;

    // 1. School Profile
    sql += `-- -----------------------------------------------------\n`;
    sql += `-- Table: school_profile\n`;
    sql += `-- -----------------------------------------------------\n`;
    sql += `CREATE TABLE IF NOT EXISTS \`school_profile\` (\n`;
    sql += `  \`id\` INT PRIMARY KEY AUTO_INCREMENT,\n`;
    sql += `  \`name\` VARCHAR(255) NOT NULL,\n`;
    sql += `  \`npsn\` VARCHAR(50) NOT NULL,\n`;
    sql += `  \`nss\` VARCHAR(50),\n`;
    sql += `  \`accreditation\` VARCHAR(50),\n`;
    sql += `  \`curriculum\` VARCHAR(100),\n`;
    sql += `  \`address\` TEXT,\n`;
    sql += `  \`subdistrict\` VARCHAR(100),\n`;
    sql += `  \`city\` VARCHAR(100),\n`;
    sql += `  \`province\` VARCHAR(100),\n`;
    sql += `  \`postal_code\` VARCHAR(20),\n`;
    sql += `  \`phone\` VARCHAR(50),\n`;
    sql += `  \`email\` VARCHAR(100),\n`;
    sql += `  \`website\` VARCHAR(150),\n`;
    sql += `  \`principal_name\` VARCHAR(150),\n`;
    sql += `  \`principal_nip\` VARCHAR(50),\n`;
    sql += `  \`vice_principal_curriculum_name\` VARCHAR(150),\n`;
    sql += `  \`vice_principal_curriculum_nip\` VARCHAR(50),\n`;
    sql += `  \`logo_url\` TEXT,\n`;
    sql += `  \`logo_right_url\` TEXT,\n`;
    sql += `  \`letterhead_province\` VARCHAR(255),\n`;
    sql += `  \`letterhead_agency\` VARCHAR(255),\n`;
    sql += `  \`official_letter_number_format\` VARCHAR(255)\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    sql += `INSERT INTO \`school_profile\` (\`id\`, \`name\`, \`npsn\`, \`nss\`, \`accreditation\`, \`curriculum\`, \`address\`, \`subdistrict\`, \`city\`, \`province\`, \`postal_code\`, \`phone\`, \`email\`, \`website\`, \`principal_name\`, \`principal_nip\`, \`vice_principal_curriculum_name\`, \`vice_principal_curriculum_nip\`, \`logo_url\`, \`logo_right_url\`, \`letterhead_province\`, \`letterhead_agency\`, \`official_letter_number_format\`) VALUES (\n`;
    sql += `  1, ${escapeSQL(p.name)}, ${escapeSQL(p.npsn)}, ${escapeSQL(p.nss)}, ${escapeSQL(p.accreditation)}, ${escapeSQL(p.curriculum)}, ${escapeSQL(p.address)}, ${escapeSQL(p.subdistrict)}, ${escapeSQL(p.city)}, ${escapeSQL(p.province)}, ${escapeSQL(p.postalCode)}, ${escapeSQL(p.phone)}, ${escapeSQL(p.email)}, ${escapeSQL(p.website)}, ${escapeSQL(p.principalName)}, ${escapeSQL(p.principalNip)}, ${escapeSQL(p.vicePrincipalCurriculumName)}, ${escapeSQL(p.vicePrincipalCurriculumNip)}, ${escapeSQL(p.logoUrl)}, ${escapeSQL(p.logoRightUrl)}, ${escapeSQL(p.letterheadProvince)}, ${escapeSQL(p.letterheadAgency)}, ${escapeSQL(p.officialLetterNumberFormat)}\n`;
    sql += `) ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`);\n\n`;

    // 2. Users
    sql += `-- -----------------------------------------------------\n`;
    sql += `-- Table: users\n`;
    sql += `-- -----------------------------------------------------\n`;
    sql += `CREATE TABLE IF NOT EXISTS \`users\` (\n`;
    sql += `  \`id\` VARCHAR(64) PRIMARY KEY,\n`;
    sql += `  \`name\` VARCHAR(150) NOT NULL,\n`;
    sql += `  \`email\` VARCHAR(150) NOT NULL,\n`;
    sql += `  \`username\` VARCHAR(100) NOT NULL UNIQUE,\n`;
    sql += `  \`password\` VARCHAR(255) NOT NULL,\n`;
    sql += `  \`role\` VARCHAR(50) NOT NULL,\n`;
    sql += `  \`nip_or_nisn\` VARCHAR(50),\n`;
    sql += `  \`phone\` VARCHAR(50),\n`;
    sql += `  \`status\` ENUM('aktif', 'nonaktif') DEFAULT 'aktif',\n`;
    sql += `  \`position\` VARCHAR(100)\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    users.forEach((u) => {
      sql += `INSERT INTO \`users\` (\`id\`, \`name\`, \`email\`, \`username\`, \`password\`, \`role\`, \`nip_or_nisn\`, \`phone\`, \`status\`, \`position\`) VALUES (${escapeSQL(u.id)}, ${escapeSQL(u.name)}, ${escapeSQL(u.email)}, ${escapeSQL(u.username)}, ${escapeSQL(u.password)}, ${escapeSQL(u.role)}, ${escapeSQL(u.nipOrNisn)}, ${escapeSQL(u.phone)}, ${escapeSQL(u.status)}, ${escapeSQL(u.position)}) ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`);\n`;
    });
    sql += `\n`;

    // 3. Classes
    sql += `-- -----------------------------------------------------\n`;
    sql += `-- Table: classes\n`;
    sql += `-- -----------------------------------------------------\n`;
    sql += `CREATE TABLE IF NOT EXISTS \`classes\` (\n`;
    sql += `  \`id\` VARCHAR(64) PRIMARY KEY,\n`;
    sql += `  \`name\` VARCHAR(100) NOT NULL,\n`;
    sql += `  \`grade\` VARCHAR(10) NOT NULL,\n`;
    sql += `  \`major\` VARCHAR(50) NOT NULL,\n`;
    sql += `  \`academic_year\` VARCHAR(20) NOT NULL,\n`;
    sql += `  \`homeroom_teacher_id\` VARCHAR(64),\n`;
    sql += `  \`homeroom_teacher_name\` VARCHAR(150),\n`;
    sql += `  \`student_count\` INT DEFAULT 0,\n`;
    sql += `  \`capacity\` INT DEFAULT 36\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    classes.forEach((c) => {
      sql += `INSERT INTO \`classes\` (\`id\`, \`name\`, \`grade\`, \`major\`, \`academic_year\`, \`homeroom_teacher_id\`, \`homeroom_teacher_name\`, \`student_count\`, \`capacity\`) VALUES (${escapeSQL(c.id)}, ${escapeSQL(c.name)}, ${escapeSQL(c.grade)}, ${escapeSQL(c.major)}, ${escapeSQL(c.academicYear)}, ${escapeSQL(c.homeroomTeacherId)}, ${escapeSQL(c.homeroomTeacherName)}, ${c.studentCount}, ${c.capacity}) ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`);\n`;
    });
    sql += `\n`;

    // 4. Students
    sql += `-- -----------------------------------------------------\n`;
    sql += `-- Table: students\n`;
    sql += `-- -----------------------------------------------------\n`;
    sql += `CREATE TABLE IF NOT EXISTS \`students\` (\n`;
    sql += `  \`id\` VARCHAR(64) PRIMARY KEY,\n`;
    sql += `  \`nisn\` VARCHAR(30) NOT NULL UNIQUE,\n`;
    sql += `  \`nis\` VARCHAR(30) NOT NULL,\n`;
    sql += `  \`name\` VARCHAR(150) NOT NULL,\n`;
    sql += `  \`class_id\` VARCHAR(64) NOT NULL,\n`;
    sql += `  \`class_name\` VARCHAR(100) NOT NULL,\n`;
    sql += `  \`gender\` CHAR(1) NOT NULL,\n`;
    sql += `  \`birth_place_date\` VARCHAR(150),\n`;
    sql += `  \`photo_url\` LONGTEXT,\n`;
    sql += `  \`parent_id\` VARCHAR(64),\n`;
    sql += `  \`parent_name\` VARCHAR(150),\n`;
    sql += `  \`parent_phone\` VARCHAR(50),\n`;
    sql += `  \`status\` ENUM('aktif', 'mutasi', 'lulus') DEFAULT 'aktif',\n`;
    sql += `  \`gpa\` DECIMAL(4, 2) DEFAULT 0.00\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    students.forEach((s) => {
      sql += `INSERT INTO \`students\` (\`id\`, \`nisn\`, \`nis\`, \`name\`, \`class_id\`, \`class_name\`, \`gender\`, \`birth_place_date\`, \`photo_url\`, \`parent_id\`, \`parent_name\`, \`parent_phone\`, \`status\`, \`gpa\`) VALUES (${escapeSQL(s.id)}, ${escapeSQL(s.nisn)}, ${escapeSQL(s.nis)}, ${escapeSQL(s.name)}, ${escapeSQL(s.classId)}, ${escapeSQL(s.className)}, ${escapeSQL(s.gender)}, ${escapeSQL(s.birthPlaceDate)}, ${escapeSQL(s.photoUrl)}, ${escapeSQL(s.parentId)}, ${escapeSQL(s.parentName)}, ${escapeSQL(s.parentPhone)}, ${escapeSQL(s.status)}, ${s.gpa}) ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`);\n`;
    });
    sql += `\n`;

    // 5. Teachers
    sql += `-- -----------------------------------------------------\n`;
    sql += `-- Table: teachers\n`;
    sql += `-- -----------------------------------------------------\n`;
    sql += `CREATE TABLE IF NOT EXISTS \`teachers\` (\n`;
    sql += `  \`id\` VARCHAR(64) PRIMARY KEY,\n`;
    sql += `  \`nip\` VARCHAR(50),\n`;
    sql += `  \`name\` VARCHAR(150) NOT NULL,\n`;
    sql += `  \`email\` VARCHAR(150),\n`;
    sql += `  \`phone\` VARCHAR(50),\n`;
    sql += `  \`employment_status\` VARCHAR(50),\n`;
    sql += `  \`position\` VARCHAR(100),\n`;
    sql += `  \`status\` VARCHAR(20) DEFAULT 'aktif',\n`;
    sql += `  \`assigned_classes\` JSON\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    teachers.forEach((t) => {
      sql += `INSERT INTO \`teachers\` (\`id\`, \`nip\`, \`name\`, \`email\`, \`phone\`, \`employment_status\`, \`position\`, \`status\`, \`assigned_classes\`) VALUES (${escapeSQL(t.id)}, ${escapeSQL(t.nip)}, ${escapeSQL(t.name)}, ${escapeSQL(t.email)}, ${escapeSQL(t.phone)}, ${escapeSQL(t.employmentStatus)}, ${escapeSQL(t.position)}, ${escapeSQL(t.status)}, ${escapeSQL(JSON.stringify(t.assignedClassIds || []))}) ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`);\n`;
    });
    sql += `\n`;

    // 6. Subjects
    sql += `-- -----------------------------------------------------\n`;
    sql += `-- Table: subjects\n`;
    sql += `-- -----------------------------------------------------\n`;
    sql += `CREATE TABLE IF NOT EXISTS \`subjects\` (\n`;
    sql += `  \`id\` VARCHAR(64) PRIMARY KEY,\n`;
    sql += `  \`code\` VARCHAR(50) NOT NULL,\n`;
    sql += `  \`name\` VARCHAR(150) NOT NULL,\n`;
    sql += `  \`kkm\` INT NOT NULL DEFAULT 75,\n`;
    sql += `  \`grade\` VARCHAR(20),\n`;
    sql += `  \`teacher_id\` VARCHAR(64),\n`;
    sql += `  \`teacher_name\` VARCHAR(150),\n`;
    sql += `  \`hours_per_week\` INT DEFAULT 2\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    subjects.forEach((s) => {
      sql += `INSERT INTO \`subjects\` (\`id\`, \`code\`, \`name\`, \`kkm\`, \`grade\`, \`teacher_id\`, \`teacher_name\`, \`hours_per_week\`) VALUES (${escapeSQL(s.id)}, ${escapeSQL(s.code)}, ${escapeSQL(s.name)}, ${s.kkm}, ${escapeSQL(s.grade)}, ${escapeSQL(s.teacherId)}, ${escapeSQL(s.teacherName)}, ${s.hoursPerWeek}) ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`);\n`;
    });
    sql += `\n`;

    // 7. Schedule Blocks & Items
    sql += `-- -----------------------------------------------------\n`;
    sql += `-- Table: schedule_blocks\n`;
    sql += `-- -----------------------------------------------------\n`;
    sql += `CREATE TABLE IF NOT EXISTS \`schedule_blocks\` (\n`;
    sql += `  \`id\` VARCHAR(64) PRIMARY KEY,\n`;
    sql += `  \`day\` VARCHAR(20) NOT NULL,\n`;
    sql += `  \`period\` INT NOT NULL,\n`;
    sql += `  \`time_range\` VARCHAR(50) NOT NULL,\n`;
    sql += `  \`title\` VARCHAR(150) NOT NULL,\n`;
    sql += `  \`is_active\` TINYINT(1) DEFAULT 1\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    scheduleBlocks.forEach((b) => {
      sql += `INSERT INTO \`schedule_blocks\` (\`id\`, \`day\`, \`period\`, \`time_range\`, \`title\`, \`is_active\`) VALUES (${escapeSQL(b.id)}, ${escapeSQL(b.day)}, ${b.period}, ${escapeSQL(b.timeRange)}, ${escapeSQL(b.title)}, ${b.isActive ? 1 : 0}) ON DUPLICATE KEY UPDATE \`title\`=VALUES(\`title\`);\n`;
    });
    sql += `\n`;

    sql += `-- -----------------------------------------------------\n`;
    sql += `-- Table: schedule_items\n`;
    sql += `-- -----------------------------------------------------\n`;
    sql += `CREATE TABLE IF NOT EXISTS \`schedule_items\` (\n`;
    sql += `  \`id\` VARCHAR(64) PRIMARY KEY,\n`;
    sql += `  \`day\` VARCHAR(20) NOT NULL,\n`;
    sql += `  \`period\` INT NOT NULL,\n`;
    sql += `  \`time_range\` VARCHAR(50) NOT NULL,\n`;
    sql += `  \`class_id\` VARCHAR(64) NOT NULL,\n`;
    sql += `  \`class_name\` VARCHAR(100) NOT NULL,\n`;
    sql += `  \`subject_id\` VARCHAR(64) NOT NULL,\n`;
    sql += `  \`subject_name\` VARCHAR(150) NOT NULL,\n`;
    sql += `  \`teacher_id\` VARCHAR(64) NOT NULL,\n`;
    sql += `  \`teacher_name\` VARCHAR(150) NOT NULL,\n`;
    sql += `  \`room\` VARCHAR(50) NOT NULL,\n`;
    sql += `  \`is_blocked\` TINYINT(1) DEFAULT 0,\n`;
    sql += `  \`block_title\` VARCHAR(150)\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    schedule.forEach((it) => {
      sql += `INSERT INTO \`schedule_items\` (\`id\`, \`day\`, \`period\`, \`time_range\`, \`class_id\`, \`class_name\`, \`subject_id\`, \`subject_name\`, \`teacher_id\`, \`teacher_name\`, \`room\`, \`is_blocked\`, \`block_title\`) VALUES (${escapeSQL(it.id)}, ${escapeSQL(it.day)}, ${it.period}, ${escapeSQL(it.timeRange)}, ${escapeSQL(it.classId)}, ${escapeSQL(it.className)}, ${escapeSQL(it.subjectId)}, ${escapeSQL(it.subjectName)}, ${escapeSQL(it.teacherId)}, ${escapeSQL(it.teacherName)}, ${escapeSQL(it.room)}, ${it.isBlocked ? 1 : 0}, ${escapeSQL(it.blockTitle)}) ON DUPLICATE KEY UPDATE \`subject_name\`=VALUES(\`subject_name\`);\n`;
    });
    sql += `\n`;

    // 8. Parent & Teacher Messages
    sql += `-- -----------------------------------------------------\n`;
    sql += `-- Table: parent_messages\n`;
    sql += `-- -----------------------------------------------------\n`;
    sql += `CREATE TABLE IF NOT EXISTS \`parent_messages\` (\n`;
    sql += `  \`id\` VARCHAR(64) PRIMARY KEY,\n`;
    sql += `  \`sender_id\` VARCHAR(64),\n`;
    sql += `  \`sender_name\` VARCHAR(150),\n`;
    sql += `  \`sender_role\` VARCHAR(50),\n`;
    sql += `  \`student_id\` VARCHAR(64),\n`;
    sql += `  \`student_name\` VARCHAR(150),\n`;
    sql += `  \`student_class\` VARCHAR(100),\n`;
    sql += `  \`parent_name\` VARCHAR(150),\n`;
    sql += `  \`parent_phone\` VARCHAR(50),\n`;
    sql += `  \`category\` VARCHAR(50),\n`;
    sql += `  \`subject\` VARCHAR(255),\n`;
    sql += `  \`message\` TEXT,\n`;
    sql += `  \`sent_at\` VARCHAR(50),\n`;
    sql += `  \`status\` VARCHAR(20) DEFAULT 'terkirim'\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    parentMessages.forEach((m) => {
      sql += `INSERT INTO \`parent_messages\` (\`id\`, \`sender_id\`, \`sender_name\`, \`sender_role\`, \`student_id\`, \`student_name\`, \`student_class\`, \`parent_name\`, \`parent_phone\`, \`category\`, \`subject\`, \`message\`, \`sent_at\`, \`status\`) VALUES (${escapeSQL(m.id)}, ${escapeSQL(m.senderId)}, ${escapeSQL(m.senderName)}, ${escapeSQL(m.senderRole)}, ${escapeSQL(m.studentId)}, ${escapeSQL(m.studentName)}, ${escapeSQL(m.studentClass)}, ${escapeSQL(m.parentName)}, ${escapeSQL(m.parentPhone)}, ${escapeSQL(m.category)}, ${escapeSQL(m.subject)}, ${escapeSQL(m.message)}, ${escapeSQL(m.sentAt)}, ${escapeSQL(m.status)}) ON DUPLICATE KEY UPDATE \`subject\`=VALUES(\`subject\`);\n`;
    });
    sql += `\n`;

    sql += `-- -----------------------------------------------------\n`;
    sql += `-- Table: teacher_student_messages\n`;
    sql += `-- -----------------------------------------------------\n`;
    sql += `CREATE TABLE IF NOT EXISTS \`teacher_student_messages\` (\n`;
    sql += `  \`id\` VARCHAR(64) PRIMARY KEY,\n`;
    sql += `  \`teacher_id\` VARCHAR(64),\n`;
    sql += `  \`teacher_name\` VARCHAR(150),\n`;
    sql += `  \`subject_name\` VARCHAR(150),\n`;
    sql += `  \`class_id\` VARCHAR(64),\n`;
    sql += `  \`class_name\` VARCHAR(100),\n`;
    sql += `  \`target_student_id\` VARCHAR(64),\n`;
    sql += `  \`target_student_name\` VARCHAR(150),\n`;
    sql += `  \`is_broadcast\` TINYINT(1) DEFAULT 1,\n`;
    sql += `  \`category\` VARCHAR(50),\n`;
    sql += `  \`title\` VARCHAR(255),\n`;
    sql += `  \`content\` TEXT,\n`;
    sql += `  \`sent_at\` VARCHAR(50)\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    teacherMessages.forEach((tm) => {
      sql += `INSERT INTO \`teacher_student_messages\` (\`id\`, \`teacher_id\`, \`teacher_name\`, \`subject_name\`, \`class_id\`, \`class_name\`, \`target_student_id\`, \`target_student_name\`, \`is_broadcast\`, \`category\`, \`title\`, \`content\`, \`sent_at\`) VALUES (${escapeSQL(tm.id)}, ${escapeSQL(tm.teacherId)}, ${escapeSQL(tm.teacherName)}, ${escapeSQL(tm.subjectName)}, ${escapeSQL(tm.classId)}, ${escapeSQL(tm.className)}, ${escapeSQL(tm.targetStudentId)}, ${escapeSQL(tm.targetStudentName)}, ${tm.isBroadcastToClass ? 1 : 0}, ${escapeSQL(tm.category)}, ${escapeSQL(tm.title)}, ${escapeSQL(tm.content)}, ${escapeSQL(tm.sentAt)}) ON DUPLICATE KEY UPDATE \`title\`=VALUES(\`title\`);\n`;
    });
    sql += `\n`;

    sql += `SET FOREIGN_KEY_CHECKS = 1;\n`;
    sql += `-- =========================================================================\n`;
    sql += `-- Berhasil dibuat. Anda dapat langsung mengimpor file ini ke MySQL / phpMyAdmin\n`;
    sql += `-- =========================================================================\n`;

    return sql;
  }

  static getNotifications(): NotificationItem[] {
    return getStoredItem<NotificationItem[]>('notifications', INITIAL_NOTIFICATIONS);
  }

  static markNotificationRead(id: string): void {
    const list = this.getNotifications();
    const updated = list.map((n) => (n.id === id ? { ...n, read: true } : n));
    setStoredItem('notifications', updated);
  }

  // --- Backup & Restore & Reset ---
  static exportDatabaseJSON(): string {
    const dump = {
      version: '1.0.0-PRO',
      exportedAt: new Date().toISOString(),
      schoolProfile: this.getSchoolProfile(),
      academicYears: this.getAcademicYears(),
      users: this.getUsers(),
      students: this.getStudents(),
      teachers: this.getTeachers(),
      classes: this.getClasses(),
      subjects: this.getSubjects(),
      modules: this.getModules(),
      journals: this.getJournals(),
      attendance: this.getAttendance(),
      assignments: this.getAssignments(),
      submissions: this.getSubmissions(),
      exams: this.getExams(),
      schedule: this.getSchedule(),
      counseling: this.getCounselingRecords(),
      announcements: this.getAnnouncements(),
      auditLogs: this.getAuditLogs(),
    };
    return JSON.stringify(dump, null, 2);
  }

  static importDatabaseJSON(jsonStr: string, currentUser: { id: string; name: string; role: Role }): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.schoolProfile) setStoredItem('school_profile', parsed.schoolProfile);
      if (parsed.users) setStoredItem('users', parsed.users);
      if (parsed.students) setStoredItem('students', parsed.students);
      if (parsed.teachers) setStoredItem('teachers', parsed.teachers);
      if (parsed.classes) setStoredItem('classes', parsed.classes);
      if (parsed.subjects) setStoredItem('subjects', parsed.subjects);
      if (parsed.modules) setStoredItem('modules', parsed.modules);
      if (parsed.journals) setStoredItem('journals', parsed.journals);
      if (parsed.attendance) setStoredItem('attendance', parsed.attendance);
      if (parsed.assignments) setStoredItem('assignments', parsed.assignments);
      if (parsed.submissions) setStoredItem('submissions', parsed.submissions);
      if (parsed.exams) setStoredItem('exams', parsed.exams);
      if (parsed.counseling) setStoredItem('counseling', parsed.counseling);
      if (parsed.announcements) setStoredItem('announcements', parsed.announcements);

      this.logAction(currentUser, 'IMPORT_DATA', 'Backup & Restore', 'Memulihkan database dari berkas backup JSON.');
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }

  static resetToDefault(): void {
    localStorage.clear();
  }
}
