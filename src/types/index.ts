export type Role =
  | 'super_admin'
  | 'kepala_sekolah'
  | 'wakasek_kurikulum'
  | 'guru'
  | 'wali_kelas'
  | 'guru_bk'
  | 'siswa'
  | 'orang_tua'
  | 'operator'; // compatibility alias for wakasek_kurikulum

export interface User {
  id: string;
  name: string;
  email: string;
  username: string; // Nama lengkap tanpa spasi huruf kecil
  password: string; // Default '123'
  role: Role;
  avatarUrl?: string;
  nipOrNisn?: string;
  phone?: string;
  status: 'aktif' | 'nonaktif';
  classId?: string; // Untuk siswa & wali kelas
  childrenIds?: string[]; // Untuk orang tua (multi-anak)
  assignedSubjectIds?: string[]; // Untuk guru
  position?: string; // Jabatan PTK
}

export interface Student {
  id: string;
  nisn: string;
  nis: string;
  name: string;
  classId: string;
  className: string;
  gender: 'L' | 'P';
  birthPlaceDate: string;
  photoUrl?: string; // Foto Siswa untuk Kartu Pelajar
  parentId: string;
  parentName: string;
  parentPhone: string;
  status: 'aktif' | 'mutasi' | 'lulus';
  attendance: {
    hadir: number;
    sakit: number;
    izin: number;
    alpa: number;
    terlambat: number;
  };
  gpa: number;
}

export interface ParentMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  studentId: string;
  studentName: string;
  studentClass: string;
  parentName: string;
  parentPhone: string;
  category: 'Akademik' | 'Kehadiran' | 'Konseling' | 'Administrasi' | 'Apresiasi';
  subject: string;
  message: string;
  sentAt: string;
  status: 'terkirim' | 'dibaca';
}

export interface TeacherStudentMessage {
  id: string;
  teacherId: string;
  teacherName: string;
  subjectName: string;
  classId: string;
  className: string;
  targetStudentId?: string; // jika personal
  targetStudentName?: string;
  isBroadcastToClass: boolean; // jika dikirim ke seluruh siswa satu rombel
  category: 'Pengumuman Mapel' | 'Tugas & Remedi' | 'Materi Tambahan' | 'Apresiasi';
  title: string;
  content: string;
  sentAt: string;
}

export type TeacherEmploymentStatus =
  | 'PNS'
  | 'PPPK'
  | 'Guru Tetap Yayasan (GTY)'
  | 'Honorer / Guru Tidak Tetap (GTT)'
  | 'PPPK Paruh Waktu';

export interface Teacher {
  id: string;
  nip: string;
  name: string;
  email: string;
  phone: string;
  subjectNames: string[];
  isHomeroom: boolean;
  homeroomClassName?: string;
  employmentStatus: TeacherEmploymentStatus;
  status: 'aktif' | 'cuti';
  position?: string; // Jabatan Pendidik: Kepala Sekolah, Wakasek Kurikulum, Guru Mapel, dll.
  assignedClassIds?: string[]; // Rombel mana saja yang diampuh oleh guru ini
}

export interface ClassRoom {
  id: string;
  name: string;
  grade: 'X' | 'XI' | 'XII';
  major: string; // MIPA, IPS, Bahasa, TKJ, RPL, Akuntansi, Merdeka/Umum, dll.
  academicYear: string;
  homeroomTeacherId: string;
  homeroomTeacherName: string;
  studentCount: number;
  capacity: number;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  kkm: number;
  grade: string;
  teacherId: string;
  teacherName: string;
  hoursPerWeek: number;
}

export interface LearningMaterial {
  id: string;
  title: string;
  type: 'document' | 'video' | 'article' | 'slide';
  fileUrl?: string;
  description: string;
  durationOrPages?: string;
}

export interface LearningModule {
  id: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  title: string;
  description: string;
  learningObjectives: string[];
  materials: LearningMaterial[];
  published: boolean;
  order: number;
  updatedAt: string;
}

export interface TeachingJournal {
  id: string;
  date: string;
  timeSlot: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  topic: string;
  activities: string;
  attendanceCount: {
    hadir: number;
    sakit: number;
    izin: number;
    alpa: number;
  };
  obstacles: string;
  reflection: string;
  status: 'draft' | 'dikirim' | 'disetujui' | 'revisi';
  principalNotes?: string;
  createdAt: string;
}

export interface AttendanceRecordItem {
  studentId: string;
  studentName: string;
  status: 'H' | 'S' | 'I' | 'A' | 'T'; // Hadir, Sakit, Izin, Alpa, Terlambat
  note?: string;
}

export interface DailyAttendance {
  id: string;
  date: string;
  classId: string;
  className: string;
  subjectId?: string;
  subjectName?: string;
  teacherId?: string;
  records: AttendanceRecordItem[];
}

export interface Assignment {
  id: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  title: string;
  description: string;
  deadline: string;
  maxScore: number;
  submissionCount: number;
  published: boolean;
  rubricNotes?: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  content: string;
  fileName?: string;
  score?: number;
  feedback?: string;
  status: 'pending' | 'graded' | 'late';
}

export interface ExamQuestion {
  id: string;
  type: 'pilihan_ganda' | 'benar_salah' | 'isian' | 'esai';
  prompt: string;
  options?: string[];
  correctOptionIndex?: number;
  correctAnswerText?: string;
  points: number;
}

export interface OnlineExam {
  id: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  teacherId: string;
  title: string;
  type: 'Kuis Harian' | 'Penilaian Tengah Semester' | 'Penilaian Akhir Semester';
  durationMinutes: number;
  startDate: string;
  endDate: string;
  totalPoints: number;
  questions: ExamQuestion[];
  published: boolean;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  answers: Record<string, any>;
  score: number;
  completedAt: string;
  status: 'selesai' | 'sedang_mengerjakan';
}

export interface ScheduleBlockConfig {
  id: string;
  day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat';
  period: number;
  timeRange: string;
  title: string; // misal "Upacara Bendera", "Ibadah / Literasi Pagi"
  isActive: boolean;
}

export interface ScheduleItem {
  id: string;
  day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat';
  period: number; // 1 - 8
  timeRange: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  room: string;
  isBlocked?: boolean;
  blockTitle?: string;
}

export interface CounselingRecord {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  counselorId: string;
  counselorName: string;
  date: string;
  category: 'Akademik' | 'Kedisiplinan' | 'Pribadi' | 'Karir/Studi Lanjut';
  issueSummary: string;
  followUpPlan: string;
  status: 'Penjadwalan' | 'Berjalan' | 'Selesai' | 'Tindak Lanjut';
  isConfidential: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorRole: string;
  date: string;
  targetRoles: Role[];
  priority: 'Biasa' | 'Penting' | 'Mendesak';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'tugas' | 'kehadiran' | 'nilai' | 'pengumuman' | 'jurnal';
  linkTarget?: string;
}

export interface SchoolProfile {
  name: string;
  npsn: string;
  nss: string;
  accreditation: 'A (Unggul)' | 'B (Baik)' | 'C';
  curriculum: string;
  address: string;
  subdistrict: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
  website: string;
  principalName: string;
  principalNip: string;
  vicePrincipalCurriculumName: string; // Nama Wakasek Kurikulum
  vicePrincipalCurriculumNip: string;  // NIP Wakasek Kurikulum
  logoUrl: string; // Logo 1 (Kiri - Dinas/Pemerintah/Yayasan)
  logoRightUrl?: string; // Logo 2 (Kanan - Sekolah)
  letterheadProvince: string;
  letterheadAgency: string;
  letterheadFoundation?: string;
  documentDate?: string;
  useCustomDocumentDate?: boolean;
  officialLetterNumberFormat?: string; // Form Pengaturan Format Nomor Surat
}

export interface AcademicYearConfig {
  id: string;
  year: string;
  semester: 'Ganjil' | 'Genap';
  isActive: boolean;
  startDate: string;
  endDate: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: Role;
  action: string;
  module: string;
  details: string;
}
