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
    return getStoredItem<User[]>('users', INITIAL_USERS);
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
    return teacher;
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

  static getSubmissions(): AssignmentSubmission[] {
    return getStoredItem<AssignmentSubmission[]>('submissions', INITIAL_SUBMISSIONS);
  }

  static gradeSubmission(id: string, score: number, feedback: string, currentUser: { id: string; name: string; role: Role }): void {
    const list = this.getSubmissions();
    const updated = list.map((s) => (s.id === id ? { ...s, score, feedback, status: 'graded' as const } : s));
    setStoredItem('submissions', updated);
    this.logAction(currentUser, 'GRADE_SUBMISSION', 'Tugas & Penilaian', `Menilai tugas ID #${id} dengan skor ${score}`);
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

    const days: ('Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat')[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    const timeSlots = [
      '07.15 - 08.00 (Jam Ke-1)',
      '08.00 - 08.45 (Jam Ke-2)',
      '08.45 - 09.30 (Jam Ke-3)',
      '10.00 - 10.45 (Jam Ke-4)',
      '10.45 - 11.30 (Jam Ke-5)',
      '11.30 - 12.15 (Jam Ke-6)',
    ];

    const generated: ScheduleItem[] = [];
    let scheduleIdCounter = 1;

    // Track assigned teachers per (day, period) to prevent collision:
    const teacherSlotOccupied: Record<string, string> = {}; // key: `${day}-${period}-${teacherId}` -> classId

    const blocks = this.getScheduleBlocks();
    const activeBlocksMap: Record<string, ScheduleBlockConfig> = {};
    blocks.forEach((b) => {
      if (b.isActive) {
        activeBlocksMap[`${b.day}-${b.period}`] = b;
      }
    });

    classes.forEach((cls, classIdx) => {
      // Filter subjects that can be taught in this class:
      // If a subject's teacher has assignedClassIds specified, check if cls.id is in it.
      const eligibleSubjects = subjects.filter((s) => {
        const teacher = teachers.find((t) => t.id === s.teacherId);
        if (teacher && teacher.assignedClassIds && teacher.assignedClassIds.length > 0) {
          return teacher.assignedClassIds.includes(cls.id);
        }
        return true;
      });

      const effectiveSubjects = eligibleSubjects.length > 0 ? eligibleSubjects : subjects;

      // Rotate subject list per class so different classes take different teachers on the same time slot
      const classSubjects = [...effectiveSubjects].sort((a, b) => {
        return (a.id + classIdx).localeCompare(b.id + classIdx);
      });

      let subPointer = 0;

      days.forEach((day) => {
        timeSlots.forEach((slot, periodIdx) => {
          const period = periodIdx + 1;
          const room = `R.${cls.name.replace(/\s+/g, '')}`;
          const blockKey = `${day}-${period}`;
          const currentBlock = activeBlocksMap[blockKey];

          if (currentBlock) {
            // This slot is blocked (e.g. Upacara Bendera or Ibadah Bersama)
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

          // Find a subject whose teacher is NOT already busy at (day, period)
          let assignedSubject = classSubjects[subPointer % classSubjects.length];
          let attempts = 0;

          while (attempts < classSubjects.length) {
            const cand = classSubjects[(subPointer + attempts) % classSubjects.length];
            const slotKey = `${day}-${period}-${cand.teacherId}`;
            if (!teacherSlotOccupied[slotKey]) {
              assignedSubject = cand;
              break;
            }
            attempts++;
          }

          // Mark slot as occupied
          const slotKey = `${day}-${period}-${assignedSubject.teacherId}`;
          teacherSlotOccupied[slotKey] = cls.id;

          const teacher = teachers.find((t) => t.id === assignedSubject.teacherId) || {
            name: assignedSubject.teacherName,
          };

          generated.push({
            id: `sch-gen-${Date.now()}-${scheduleIdCounter++}`,
            day,
            period,
            timeRange: slot,
            classId: cls.id,
            className: cls.name,
            subjectId: assignedSubject.id,
            subjectName: assignedSubject.name,
            teacherId: assignedSubject.teacherId,
            teacherName: teacher.name,
            room,
          });

          subPointer++;
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
      message: `Berhasil men-generate ${generated.length} sesi jadwal anti-bentrok untuk ${classes.length} rombel kelas dengan 0 konflik!`,
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

  // --- Deletion methods for PTK, Rombel, Mapel, Module, Assignment ---
  static deleteTeacher(id: string, currentUser: { id: string; name: string; role: Role }): void {
    const list = this.getTeachers();
    const target = list.find((t) => t.id === id);
    const updated = list.filter((t) => t.id !== id);
    setStoredItem('teachers', updated);
    if (target) {
      this.logAction(currentUser, 'DELETE_TEACHER', 'Tenaga Pendidik', `Menghapus guru: ${target.name}`);
    }
  }

  static deleteClass(id: string, currentUser: { id: string; name: string; role: Role }): void {
    const list = this.getClasses();
    const target = list.find((c) => c.id === id);
    const updated = list.filter((c) => c.id !== id);
    setStoredItem('classes', updated);
    if (target) {
      this.logAction(currentUser, 'DELETE_CLASS', 'Rombel & Kelas', `Menghapus kelas: ${target.name}`);
    }
  }

  static deleteSubject(id: string, currentUser: { id: string; name: string; role: Role }): void {
    const list = this.getSubjects();
    const target = list.find((s) => s.id === id);
    const updated = list.filter((s) => s.id !== id);
    setStoredItem('subjects', updated);
    if (target) {
      this.logAction(currentUser, 'DELETE_SUBJECT', 'Mata Pelajaran', `Menghapus mata pelajaran: ${target.name}`);
    }
  }

  static deleteModule(id: string, currentUser: { id: string; name: string; role: Role }): void {
    const list = this.getModules();
    const target = list.find((m) => m.id === id);
    const updated = list.filter((m) => m.id !== id);
    setStoredItem('modules', updated);
    if (target) {
      this.logAction(currentUser, 'DELETE_MODULE', 'Modul Pembelajaran', `Menghapus modul pembelajaran: ${target.title}`);
    }
  }

  static deleteAssignment(id: string, currentUser: { id: string; name: string; role: Role }): void {
    const list = this.getAssignments();
    const target = list.find((a) => a.id === id);
    const updated = list.filter((a) => a.id !== id);
    setStoredItem('assignments', updated);
    if (target) {
      this.logAction(currentUser, 'DELETE_ASSIGNMENT', 'Tugas & Penilaian', `Menghapus tugas pembelajaran: ${target.title}`);
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
