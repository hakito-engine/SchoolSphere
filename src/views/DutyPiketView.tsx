import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import {
  DutyJournal,
  DutySchedule,
  StaffMember,
  DutyTeacherRecord,
  DutyStaffRecord,
  DutyGuestRecord,
  DutyIncidentRecord,
  DutyStudentClassSummary,
} from '../types';
import { OfficialLetterhead } from '../components/common/OfficialLetterhead';
import { formatDateIndonesian } from '../utils/formatters';
import {
  ClipboardCheck,
  Calendar,
  Clock,
  Users,
  UserCheck,
  UserX,
  Building,
  AlertTriangle,
  FileText,
  Printer,
  Plus,
  Trash2,
  Edit,
  Save,
  CheckCircle2,
  Search,
  Download,
  Filter,
  Check,
  X,
  Phone,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Send,
  Eye,
  RefreshCw,
  Sparkles,
  Ban,
  Lock,
} from 'lucide-react';

export const DutyPiketView: React.FC = () => {
  const { currentUser } = useAuth();

  // Request 20.8: Orang tua tidak punya akses ke Piket
  if (currentUser.role === 'orang_tua') {
    return (
      <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-base text-slate-900 dark:text-white">Akses Dibatasi</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Akun orang tua tidak memiliki izin akses ke modul Piket Sekolah. Silakan gunakan menu Portal Orang Tua untuk memantau kehadiran dan nilai siswa.
        </p>
      </div>
    );
  }
  const profile = DataService.getSchoolProfile();
  const academicYears = DataService.getAcademicYears();
  const activeAY = academicYears.find((ay) => ay.isActive) || academicYears[0];

  const teachers = useMemo(() => DataService.getTeachers(), []);
  const classes = useMemo(() => DataService.getClasses(), []);
  const students = useMemo(() => DataService.getStudents(), []);
  const schedules = useMemo(() => DataService.getSchedule(), []);

  // Tabs: 'jurnal_input' | 'jadwal_mingguan' | 'riwayat_jurnal' (Tab Data Pegawai dipindahkan ke Menu Khusus Tendik)
  const [activeTab, setActiveTab] = useState<'jurnal_input' | 'jadwal_mingguan' | 'riwayat_jurnal'>('jurnal_input');

  // Master Data State
  const [dutySchedules, setDutySchedules] = useState<DutySchedule[]>(() => DataService.getDutySchedules());
  const [dutyJournals, setDutyJournals] = useState<DutyJournal[]>(() => DataService.getDutyJournals());
  const [staffList, setStaffList] = useState<StaffMember[]>(() => DataService.getStaff());

  // Fitur Blok Bagi: Blokir Hari Piket Guru / Tendik (Item 9)
  const [teacherBlockedDays, setTeacherBlockedDays] = useState<Record<string, string[]>>(() =>
    DataService.getDutyBlockedDays()
  );
  const [selectedPersonToBlock, setSelectedPersonToBlock] = useState<string>('');

  // Mode Tampilan Jadwal Piket (Item 8: Tampilkan rentang waktu yang telah diatur)
  const [scheduleViewMode, setScheduleViewMode] = useState<'mingguan' | 'rentang_tanggal'>('mingguan');

  // Real-time synchronization state (Item 4)
  const [lastSyncTime, setLastSyncTime] = useState<string>(() =>
    new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Form State untuk Jurnal Piket Aktif
  const [journalDate, setJournalDate] = useState<string>(() => new Date().toISOString().substring(0, 10));
  const [journalDay, setJournalDay] = useState<string>('Senin');

  // Petugas Piket (Piket 1, 2, 3)
  const [officer1Id, setOfficer1Id] = useState<string>(teachers[0]?.id || '');
  const [officer2Id, setOfficer2Id] = useState<string>(teachers[1]?.id || '');
  const [officer3Id, setOfficer3Id] = useState<string>(teachers[2]?.id || '');

  // Guru Hadir & Guru Tidak Hadir
  const [teachersPresent, setTeachersPresent] = useState<DutyTeacherRecord[]>([]);
  const [teachersAbsent, setTeachersAbsent] = useState<DutyTeacherRecord[]>([]);

  // Pegawai Hadir & Pegawai Tidak Hadir
  const [staffPresent, setStaffPresent] = useState<DutyStaffRecord[]>([]);
  const [staffAbsent, setStaffAbsent] = useState<DutyStaffRecord[]>([]);

  // Tamu
  const [guests, setGuests] = useState<DutyGuestRecord[]>([]);
  const [newGuest, setNewGuest] = useState<{
    fullName: string;
    address: string;
    officeAddress: string;
    phone: string;
    time: string;
    purpose: string;
    personToMeet: string;
    followUp: string;
  }>({
    fullName: '',
    address: '',
    officeAddress: '',
    phone: '',
    time: new Date().toTimeString().substring(0, 5),
    purpose: '',
    personToMeet: 'Kepala Sekolah',
    followUp: 'Diterima di Ruang Kepala Sekolah (Selesai)',
  });

  // Rekapitulasi Presensi Siswa per Kelas
  const [studentAttendanceSummaries, setStudentAttendanceSummaries] = useState<DutyStudentClassSummary[]>([]);

  // Kejadian Penting
  const [incidents, setIncidents] = useState<DutyIncidentRecord[]>([]);
  const [newIncident, setNewIncident] = useState<{
    time: string;
    description: string;
    partiesInvolved: string;
    involvesStudents: boolean;
    filterClassId: string;
    selectedStudentIds: string[];
    followUp: string;
    referredToBK: boolean;
  }>({
    time: new Date().toTimeString().substring(0, 5),
    description: '',
    partiesInvolved: '',
    involvesStudents: false,
    filterClassId: classes[0]?.id || '',
    selectedStudentIds: [],
    followUp: '',
    referredToBK: false,
  });

  const [generalNotes, setGeneralNotes] = useState<string>('Kegiatan belajar mengajar berjalan aman, tertib, dan kondusif.');
  const [submitNotice, setSubmitNotice] = useState<string | null>(null);

  // Modal Print State
  const [printModalJournal, setPrintModalJournal] = useState<DutyJournal | null>(null);

  // Edit Jadwal Piket Modal
  const [editingSchedule, setEditingSchedule] = useState<DutySchedule | null>(null);

  // Hitung Hari Otomatis saat Tanggal berubah
  useEffect(() => {
    const d = new Date(journalDate + 'T00:00:00');
    const dayIndex = d.getDay();
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const currentDayName = dayNames[dayIndex] || 'Senin';
    setJournalDay(currentDayName);

    // Cari jadwal piket hari ini dan set petugas piket otomatis
    const scheduleToday = dutySchedules.find((s) => s.day === currentDayName);
    if (scheduleToday && scheduleToday.dutyOfficers.length >= 3) {
      setOfficer1Id(scheduleToday.dutyOfficers[0].teacherId);
      setOfficer2Id(scheduleToday.dutyOfficers[1].teacherId);
      setOfficer3Id(scheduleToday.dutyOfficers[2].teacherId);
    }
  }, [journalDate, dutySchedules]);

  // Inisialisasi Otomatis Data Presensi Guru, Pegawai, & Siswa berdasarkan hari dan tanggal
  useEffect(() => {
    initDayData(journalDay, journalDate);
  }, [journalDay, journalDate]);

  // Real-time synchronization event listener (Item 4)
  useEffect(() => {
    const handleAutoSync = () => {
      initDayData(journalDay, journalDate);
    };
    window.addEventListener('storage', handleAutoSync);
    window.addEventListener('schoolsphere_cloud_synced', handleAutoSync);
    return () => {
      window.removeEventListener('storage', handleAutoSync);
      window.removeEventListener('schoolsphere_cloud_synced', handleAutoSync);
    };
  }, [journalDay, journalDate]);

  // Realtime Integration: Synchronizes subject teachers' presence and classroom attendance (Item 4)
  const initDayData = (day: string, targetDate?: string) => {
    const activeDate = targetDate || journalDate;
    setIsSyncing(true);

    // 1. Ambil jurnal mengajar real-time hari ini dari semua guru mapel
    const realTimeJournals = DataService.getJournals().filter((j) => j.date === activeDate);
    const realTimeAttendance = DataService.getAttendance().filter((a) => a.date === activeDate);

    // 2. Inisialisasi Guru yang Mengajar Hari Ini dari Jadwal KBM
    const daySchedules = schedules.filter((s) => s.day.toLowerCase() === day.toLowerCase());
    const teacherMap = new Map<string, DutyTeacherRecord>();

    daySchedules.forEach((item) => {
      const teacher = teachers.find((t) => t.id === item.teacherId || t.name === item.teacherName);
      const teacherId = teacher?.id || item.teacherId;
      const teacherName = teacher?.name || item.teacherName;

      // Cek apakah guru mapel telah merekam jurnal mengajar pada jam dan tanggal ini secara realtime
      const loggedJournal = realTimeJournals.find(
        (j) =>
          (j.teacherId === teacherId || j.teacherName.toLowerCase() === teacherName.toLowerCase()) &&
          (j.classId === item.classId || j.subjectId === item.subjectId)
      );

      if (!teacherMap.has(teacherId)) {
        teacherMap.set(teacherId, {
          id: 'tp-' + teacherId,
          teacherId,
          teacherName,
          status: 'hadir',
          slots: [],
        });
      }

      teacherMap.get(teacherId)!.slots.push({
        classId: item.classId,
        className: item.className,
        subjectName: item.subjectName,
        period: `Jam ke-${item.period} (${item.timeRange || '07:30 - 08:50'})`,
        room: item.room,
        isVerified: true,
        notes: loggedJournal
          ? `✓ KBM Terlaksana: ${loggedJournal.topic} (${loggedJournal.status === 'disetujui' ? 'Disetujui' : 'Terekam'})`
          : 'Terjadwal KBM (Terverifikasi aktif)',
      });
    });

    // Jika belum ada jadwal spesifik hari ini, ambil guru terdaftar
    if (teacherMap.size === 0) {
      teachers.slice(0, 5).forEach((t, idx) => {
        const loggedJournal = realTimeJournals.find((j) => j.teacherId === t.id);
        teacherMap.set(t.id, {
          id: 'tp-' + t.id,
          teacherId: t.id,
          teacherName: t.name,
          status: 'hadir',
          slots: [
            {
              classId: classes[idx % classes.length]?.id || 'cls-1',
              className: classes[idx % classes.length]?.name || 'X MIPA 1',
              subjectName: t.subjectNames[0] || 'Mata Pelajaran',
              period: `Jam ke-${idx + 1} s.d ${idx + 2} (07.15 - 08.45)`,
              isVerified: true,
              notes: loggedJournal ? `✓ Jurnal Guru: ${loggedJournal.topic}` : 'Hadir dan mengajar di kelas',
            },
          ],
        });
      });
    }

    const presentList: DutyTeacherRecord[] = Array.from(teacherMap.values());
    setTeachersPresent(presentList);
    setTeachersAbsent([]);

    // 3. Inisialisasi Pegawai Hadir (Default: Semua Hadir Tepat Waktu)
    const initialStaffPresent: DutyStaffRecord[] = staffList.map((s) => ({
      id: 'sp-' + s.id,
      staffId: s.id,
      staffName: s.name,
      position: s.position,
      status: 'hadir',
      checkInTime: '06:45',
      checkOutTime: '15:30',
    }));
    setStaffPresent(initialStaffPresent);
    setStaffAbsent([]);

    // 4. Inisialisasi Rekap Siswa per Kelas: Terintegrasi Realtime dengan Presensi Guru Mapel
    const summaries: DutyStudentClassSummary[] = classes.map((cls) => {
      const classStudents = students.filter((s) => s.classId === cls.id);
      const totalStudents = classStudents.length || 36;

      // Cek apakah ada data presensi harian yang disubmit oleh guru mapel untuk kelas ini pada tanggal ini
      const classAttendanceRecords = realTimeAttendance.filter((a) => a.classId === cls.id);
      let recordedAbsentList: DutyStudentClassSummary['absentStudents'] = [];

      if (classAttendanceRecords.length > 0) {
        // Ambil data siswa tidak hadir dari catatan guru mapel
        classAttendanceRecords.forEach((att) => {
          att.records.forEach((rec) => {
            const rawStatus = String(rec.status).toLowerCase();
            if (rawStatus !== 'h' && rawStatus !== 'hadir') {
              if (!recordedAbsentList.some((ex) => ex.studentId === rec.studentId)) {
                let mappedStatus: 'izin' | 'sakit' | 'alpa' | 'terlambat' | 'cepat_pulang' = 'alpa';
                if (rawStatus === 's' || rawStatus === 'sakit') mappedStatus = 'sakit';
                else if (rawStatus === 'i' || rawStatus === 'izin') mappedStatus = 'izin';
                else if (rawStatus === 't' || rawStatus === 'terlambat') mappedStatus = 'terlambat';
                else if (rawStatus === 'cepat_pulang') mappedStatus = 'cepat_pulang';
                else mappedStatus = 'alpa';

                recordedAbsentList.push({
                  studentId: rec.studentId,
                  studentName: rec.studentName,
                  status: mappedStatus,
                  notes: rec.note || `Presensi Mapel: ${att.subjectName || 'Pelajaran'}`,
                });
              }
            }
          });
        });
      } else {
        // Fallback dinamis jika guru mapel belum menginput presensi
        recordedAbsentList = classStudents
          .filter((_, idx) => idx === 1)
          .slice(0, 1)
          .map((std) => ({
            studentId: std.id,
            studentName: std.name,
            status: 'sakit' as const,
            notes: 'Pemberitahuan surat izin orang tua',
          }));
      }

      return {
        classId: cls.id,
        className: cls.name,
        totalPresent: Math.max(0, totalStudents - recordedAbsentList.length),
        absentStudents: recordedAbsentList,
      };
    });
    setStudentAttendanceSummaries(summaries);

    setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setTimeout(() => setIsSyncing(false), 300);
  };


  // Muat Petugas dari Jadwal
  const handleLoadOfficersFromSchedule = () => {
    const schedule = dutySchedules.find((s) => s.day === journalDay);
    if (schedule && schedule.dutyOfficers.length >= 3) {
      setOfficer1Id(schedule.dutyOfficers[0].teacherId);
      setOfficer2Id(schedule.dutyOfficers[1].teacherId);
      setOfficer3Id(schedule.dutyOfficers[2].teacherId);
      setSubmitNotice(`Petugas piket berhasil disesuaikan dengan Jadwal Piket Hari ${journalDay}!`);
      setTimeout(() => setSubmitNotice(null), 3000);
    } else {
      setSubmitNotice(`Jadwal piket untuk hari ${journalDay} belum diatur.`);
      setTimeout(() => setSubmitNotice(null), 3000);
    }
  };

  // Handler Pindah Guru dari Hadir ke Tidak Hadir
  const handleMoveTeacherToAbsent = (teacherId: string) => {
    const target = teachersPresent.find((t) => t.teacherId === teacherId);
    if (!target) return;

    setTeachersPresent(teachersPresent.filter((t) => t.teacherId !== teacherId));
    setTeachersAbsent([
      ...teachersAbsent,
      {
        ...target,
        status: 'tidak_hadir',
        absenceReason: 'Izin',
        absenceNotes: 'Izin dinas/keperluan keluarga',
        slots: target.slots.map((s) => ({
          ...s,
          isVerified: false,
          substituteTeacherId: officer1Id,
          substituteTeacherName: teachers.find((t) => t.id === officer1Id)?.name || 'Guru Piket',
          notes: 'Diberikan tugas mandiri oleh guru piket',
        })),
      },
    ]);
  };

  // Handler Pindah Guru dari Tidak Hadir ke Hadir
  const handleMoveTeacherToPresent = (teacherId: string) => {
    const target = teachersAbsent.find((t) => t.teacherId === teacherId);
    if (!target) return;

    setTeachersAbsent(teachersAbsent.filter((t) => t.teacherId !== teacherId));
    setTeachersPresent([
      ...teachersPresent,
      {
        ...target,
        status: 'hadir',
        absenceReason: undefined,
        absenceNotes: undefined,
        slots: target.slots.map((s) => ({
          ...s,
          isVerified: true,
          substituteTeacherId: undefined,
          substituteTeacherName: undefined,
        })),
      },
    ]);
  };

  // Tambah Guru Tidak Hadir Manual
  const handleAddAbsentTeacherManual = (teacherId: string) => {
    if (teachersAbsent.some((t) => t.teacherId === teacherId)) return;
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) return;

    // Hapus dari daftar hadir jika ada
    setTeachersPresent(teachersPresent.filter((t) => t.teacherId !== teacherId));

    setTeachersAbsent([
      ...teachersAbsent,
      {
        id: 'ta-' + teacher.id,
        teacherId: teacher.id,
        teacherName: teacher.name,
        status: 'tidak_hadir',
        absenceReason: 'Sakit',
        absenceNotes: 'Surat dokter terlampir di pos piket',
        slots: [
          {
            classId: classes[0]?.id || 'cls-1',
            className: classes[0]?.name || 'X MIPA 1',
            subjectName: teacher.subjectNames[0] || 'Mata Pelajaran',
            period: 'Jam ke-1 s.d 2',
            isVerified: false,
            substituteTeacherId: officer1Id,
            substituteTeacherName: teachers.find((t) => t.id === officer1Id)?.name || 'Guru Piket',
            notes: 'Materi tugas baca modul',
          },
        ],
      },
    ]);
  };

  // Handler Pegawai Pindah Hadir / Tidak Hadir
  const handleToggleStaffStatus = (staffId: string, toStatus: 'hadir' | 'tidak_hadir') => {
    const staff = staffList.find((s) => s.id === staffId);
    if (!staff) return;

    if (toStatus === 'tidak_hadir') {
      setStaffPresent(staffPresent.filter((s) => s.staffId !== staffId));
      if (!staffAbsent.some((s) => s.staffId === staffId)) {
        setStaffAbsent([
          ...staffAbsent,
          {
            id: 'sa-' + staff.id,
            staffId: staff.id,
            staffName: staff.name,
            position: staff.position,
            status: 'tidak_hadir',
            absenceReason: 'Izin',
            absenceNotes: 'Keperluan dinas luar / mendadak',
          },
        ]);
      }
    } else {
      setStaffAbsent(staffAbsent.filter((s) => s.staffId !== staffId));
      if (!staffPresent.some((s) => s.staffId === staffId)) {
        setStaffPresent([
          ...staffPresent,
          {
            id: 'sp-' + staff.id,
            staffId: staff.id,
            staffName: staff.name,
            position: staff.position,
            status: 'hadir',
            checkInTime: '06:45',
            checkOutTime: '15:30',
          },
        ]);
      }
    }
  };

  // Tambah Tamu
  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuest.fullName.trim() || !newGuest.purpose.trim()) {
      alert('Nama tamu dan tujuan kunjungan wajib diisi.');
      return;
    }

    const guestItem: DutyGuestRecord = {
      id: 'gst-' + Date.now(),
      fullName: newGuest.fullName.trim(),
      address: newGuest.address.trim(),
      officeAddress: newGuest.officeAddress.trim() || undefined,
      phone: newGuest.phone.trim() || undefined,
      time: newGuest.time,
      purpose: newGuest.purpose.trim(),
      personToMeet: newGuest.personToMeet.trim(),
      followUp: newGuest.followUp.trim(),
    };

    setGuests([...guests, guestItem]);
    setNewGuest({
      fullName: '',
      address: '',
      officeAddress: '',
      phone: '',
      time: new Date().toTimeString().substring(0, 5),
      purpose: '',
      personToMeet: 'Kepala Sekolah',
      followUp: 'Diterima di Ruang Kepala Sekolah (Selesai)',
    });
  };

  const handleDeleteGuest = (id: string) => {
    setGuests(guests.filter((g) => g.id !== id));
  };

  // Tambah Kejadian Penting
  const handleAddIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncident.description.trim() || !newIncident.followUp.trim()) {
      alert('Uraian kejadian dan tindak lanjut penyelesaian wajib diisi.');
      return;
    }

    const selectedNames = students
      .filter((s) => newIncident.selectedStudentIds.includes(s.id))
      .map((s) => `${s.name} (${s.className})`);

    const item: DutyIncidentRecord = {
      id: 'inc-' + Date.now(),
      time: newIncident.time,
      description: newIncident.description.trim(),
      partiesInvolved: newIncident.partiesInvolved.trim() || 'Siswa & Guru Piket',
      involvesStudents: newIncident.involvesStudents,
      involvedStudentIds: newIncident.involvesStudents ? newIncident.selectedStudentIds : [],
      involvedStudentNames: newIncident.involvesStudents ? selectedNames : [],
      followUp: newIncident.followUp.trim(),
      referredToBK: newIncident.referredToBK,
    };

    setIncidents([...incidents, item]);
    setNewIncident({
      time: new Date().toTimeString().substring(0, 5),
      description: '',
      partiesInvolved: '',
      involvesStudents: false,
      filterClassId: classes[0]?.id || '',
      selectedStudentIds: [],
      followUp: '',
      referredToBK: false,
    });
  };

  const handleDeleteIncident = (id: string) => {
    setIncidents(incidents.filter((inc) => inc.id !== id));
  };

  // Tambah Siswa Tidak Hadir di Rekap Kelas
  const handleAddAbsentStudentToClass = (classId: string, studentId: string, status: any, notes: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    setStudentAttendanceSummaries((prev) =>
      prev.map((c) => {
        if (c.classId !== classId) return c;
        if (c.absentStudents.some((a) => a.studentId === studentId)) return c;
        const newAbsents = [...c.absentStudents, { studentId: student.id, studentName: student.name, status, notes }];
        return {
          ...c,
          totalPresent: Math.max(0, c.totalPresent - 1),
          absentStudents: newAbsents,
        };
      })
    );
  };

  const handleRemoveAbsentStudentFromClass = (classId: string, studentId: string) => {
    setStudentAttendanceSummaries((prev) =>
      prev.map((c) => {
        if (c.classId !== classId) return c;
        const newAbsents = c.absentStudents.filter((a) => a.studentId !== studentId);
        return {
          ...c,
          totalPresent: c.totalPresent + 1,
          absentStudents: newAbsents,
        };
      })
    );
  };

  // Permission check untuk Wakasek Kurikulum (Request 20)
  const canManageSchedule = ['wakasek_kurikulum', 'super_admin'].includes(currentUser.role);

  // State untuk Generator Jadwal Piket Wakasek Kurikulum (Request 20.1 - 20.4)
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
  const [genDays, setGenDays] = useState<string[]>(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']);
  const [genStartDate, setGenStartDate] = useState(new Date().toISOString().substring(0, 10));
  const [genEndDate, setGenEndDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().substring(0, 10));
  const [genOfficersPerDay, setGenOfficersPerDay] = useState<number>(3);
  const [genIncludeTendik, setGenIncludeTendik] = useState<boolean>(false);

  // Cek apakah user saat ini adalah Petugas Piket Hari Ini (Request 20.5)
  const isAssignedOfficerToday = useMemo(() => {
    if (['super_admin', 'wakasek_kurikulum'].includes(currentUser.role)) return true;
    const currentOfficerIds = [officer1Id, officer2Id, officer3Id];
    if (currentOfficerIds.includes(currentUser.id)) return true;
    return currentOfficerIds.some((id) => {
      const tch = teachers.find((t) => t.id === id);
      const stf = staffList.find((s) => s.id === id);
      const candidateName = tch?.name || stf?.name;
      const candidateNip = tch?.nip || stf?.nip;
      return (
        (candidateName && candidateName.toLowerCase() === currentUser.name.toLowerCase()) ||
        (currentUser.nipOrNisn && candidateNip === currentUser.nipOrNisn)
      );
    });
  }, [currentUser, officer1Id, officer2Id, officer3Id, teachers, staffList]);

  // Request 19: Simpan Sementara (Draft Jurnal Piket)
  const handleSaveDraftJournal = () => {
    const off1 = teachers.find((t) => t.id === officer1Id) || teachers[0];
    const off2 = teachers.find((t) => t.id === officer2Id) || teachers[1];
    const off3 = teachers.find((t) => t.id === officer3Id) || teachers[2];

    const draftJournal: DutyJournal = {
      id: 'jrn-draft-' + journalDate,
      date: journalDate,
      day: journalDay,
      academicYear: activeAY.year,
      semester: activeAY.semester,
      officer1Id: off1.id,
      officer1Name: off1.name,
      officer1Nip: off1.nip,
      officer2Id: off2.id,
      officer2Name: off2.name,
      officer2Nip: off2.nip,
      officer3Id: off3.id,
      officer3Name: off3.name,
      officer3Nip: off3.nip,
      headmasterName: profile.principalName || 'Drs. H. Suryadi, M.M.',
      headmasterNip: profile.principalNip || '19680512 199303 1 004',
      teachersPresent,
      teachersAbsent,
      staffPresent,
      staffAbsent,
      guests,
      studentAttendance: studentAttendanceSummaries,
      incidents,
      generalNotes,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name,
      status: 'draft',
    };

    DataService.saveDutyJournal(draftJournal, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });

    setDutyJournals(DataService.getDutyJournals());
    setSubmitNotice('💾 Isian jurnal sementara (Draft) berhasil disimpan. Guru piket lain yang bertugas dapat melihat dan mengedit isian ini.');
    setTimeout(() => setSubmitNotice(null), 5000);
  };

  // Request 19 & 20.5: Kirim & Terbitkan Jurnal (Hanya Guru Piket Bertugas)
  const handleSubmitJournal = () => {
    if (!isAssignedOfficerToday) {
      alert('Akses Dibatasi: Penerbitan dan pengesahan jurnal piket hanya dapat dilakukan oleh Petugas Guru Piket yang bertugas hari ini.');
      return;
    }

    const off1 = teachers.find((t) => t.id === officer1Id) || teachers[0];
    const off2 = teachers.find((t) => t.id === officer2Id) || teachers[1];
    const off3 = teachers.find((t) => t.id === officer3Id) || teachers[2];

    const newJournal: DutyJournal = {
      id: 'jrn-' + journalDate + '-' + Date.now(),
      date: journalDate,
      day: journalDay,
      academicYear: activeAY.year,
      semester: activeAY.semester,
      officer1Id: off1.id,
      officer1Name: off1.name,
      officer1Nip: off1.nip,
      officer2Id: off2.id,
      officer2Name: off2.name,
      officer2Nip: off2.nip,
      officer3Id: off3.id,
      officer3Name: off3.name,
      officer3Nip: off3.nip,
      headmasterName: profile.principalName || 'Drs. H. Suryadi, M.M.',
      headmasterNip: profile.principalNip || '19680512 199303 1 004',
      teachersPresent,
      teachersAbsent,
      staffPresent,
      staffAbsent,
      guests,
      studentAttendance: studentAttendanceSummaries,
      incidents,
      generalNotes,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name,
      status: 'published',
    };

    DataService.saveDutyJournal(newJournal, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });

    setDutyJournals(DataService.getDutyJournals());
    setSubmitNotice('✅ Jurnal Piket Harian resmi diterbitkan dan disahkan! Siap dicetak.');
    setTimeout(() => setSubmitNotice(null), 4000);

    // Buka preview cetak langsung
    setPrintModalJournal(newJournal);
  };

  // Fitur Blok Bagi: Helper toggle dan hapus blokir hari personil (Item 9)
  const handleToggleBlockedDay = (personId: string, day: string) => {
    const current = teacherBlockedDays[personId] || [];
    const updatedDays = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    const updatedMap = { ...teacherBlockedDays };
    if (updatedDays.length === 0) {
      delete updatedMap[personId];
    } else {
      updatedMap[personId] = updatedDays;
    }
    setTeacherBlockedDays(updatedMap);
    DataService.saveDutyBlockedDays(updatedMap, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });
  };

  const handleClearBlockedDays = (personId: string) => {
    const updatedMap = { ...teacherBlockedDays };
    delete updatedMap[personId];
    setTeacherBlockedDays(updatedMap);
    DataService.saveDutyBlockedDays(updatedMap, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });
  };

  // Request 20.1 - 20.4, Item 9 & Item 10: Generator Jadwal Piket oleh Wakasek Kurikulum dengan Fitur Blok Bagi
  const handleGenerateDutySchedule = () => {
    if (!canManageSchedule) return;

    // Filter semua guru kecuali Kepala Sekolah
    const eligibleTeachers = teachers.filter(
      (t) =>
        !/kepala sekolah/i.test(t.position || '') &&
        !/kepala sekolah/i.test(t.name || '')
    );

    // Personil kandidat piket (Guru + Tendik jika dicentang)
    const baseCandidates = genIncludeTendik
      ? [
          ...eligibleTeachers.map((t) => ({ id: t.id, name: t.name, phone: t.phone, category: 'guru' as const })),
          ...staffList.map((s) => ({ id: s.id, name: s.name, phone: s.phone, category: 'tendik' as const })),
        ]
      : eligibleTeachers.map((t) => ({ id: t.id, name: t.name, phone: t.phone, category: 'guru' as const }));

    if (baseCandidates.length < genOfficersPerDay) {
      alert(`Jumlah personil yang tersedia (${baseCandidates.length}) kurang dari target petugas per hari (${genOfficersPerDay}).`);
      return;
    }

    let rotationIndex = 0;
    const generatedSchedules: DutySchedule[] = genDays.map((day, dIdx) => {
      // Fitur Blok Bagi (Item 9): Filter kandidat yang TIDAK diblokir pada hari ini
      const availablePool = baseCandidates.filter(
        (cand) => !(teacherBlockedDays[cand.id] || []).includes(day)
      );

      if (availablePool.length < genOfficersPerDay) {
        console.warn(`Peringatan: Personil yang tidak diblokir pada hari ${day} (${availablePool.length}) kurang dari ${genOfficersPerDay}.`);
      }

      // Gunakan availablePool jika cukup, fallback ke pool umum jika seluruh personil diblokir
      const effectivePool = availablePool.length >= genOfficersPerDay ? availablePool : (availablePool.length > 0 ? availablePool : baseCandidates);
      const officers = [];
      for (let i = 0; i < genOfficersPerDay; i++) {
        const candidate = effectivePool[rotationIndex % effectivePool.length];
        rotationIndex++;
        officers.push({
          teacherId: candidate.id,
          teacherName: candidate.name,
          role: i === 0 ? 'Guru Piket 1 (Koordinator)' : `Guru Piket ${i + 1}`,
          phone: candidate.phone || '0812-3344-5566',
          category: candidate.category,
        });
      }

      return {
        id: `sch-duty-${day.toLowerCase()}-${Date.now()}-${dIdx}`,
        academicYear: activeAY.year,
        semester: activeAY.semester,
        day: day as DutySchedule['day'],
        startDate: genStartDate,
        endDate: genEndDate,
        dateRangeText: `${formatDateIndonesian(genStartDate)} s.d ${formatDateIndonesian(genEndDate)}`,
        standbyLocation: 'Pos Piket Utama (Lobi Gedung A)',
        dutyOfficers: officers,
        notes: `Berlaku periode ${formatDateIndonesian(genStartDate)} s.d ${formatDateIndonesian(genEndDate)}. Sesuai aturan blokir hari mengajar.`,
      };
    });

    generatedSchedules.forEach((sch) => {
      DataService.saveDutySchedule(sch, {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      });
    });

    setDutySchedules(DataService.getDutySchedules());
    setIsGeneratorModalOpen(false);
    setSubmitNotice(
      `✨ Berhasil menggenerate ulang jadwal piket untuk rentang ${formatDateIndonesian(genStartDate)} s.d ${formatDateIndonesian(genEndDate)} (${genDays.join(', ')}) dengan ${genOfficersPerDay} petugas/hari sesuai aturan blokir hari personil!`
    );
    setTimeout(() => setSubmitNotice(null), 6000);
  };


  // Simpan Edit Jadwal Piket Mingguan
  const handleSaveDutySchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;

    DataService.saveDutySchedule(editingSchedule, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });

    setDutySchedules(DataService.getDutySchedules());
    setEditingSchedule(null);
    setSubmitNotice(`Jadwal piket hari ${editingSchedule.day} berhasil disimpan.`);
    setTimeout(() => setSubmitNotice(null), 3000);
  };

  // Petugas Piket terpilih
  const currentOfficer1 = teachers.find((t) => t.id === officer1Id) || teachers[0];
  const currentOfficer2 = teachers.find((t) => t.id === officer2Id) || teachers[1];
  const currentOfficer3 = teachers.find((t) => t.id === officer3Id) || teachers[2];

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
            <ClipboardCheck className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight">Piket & Jurnal Harian Sekolah</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                Terintegrasi Presensi & Jadwal
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-0.5">
              Pengelolaan Jadwal Piket, Jurnal Piket Harian (Guru, Pegawai, Tamu, Siswa, & Kejadian), serta Cetak Laporan Berita Acara Resmi 4 Pihak.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              const dummyForPrint: DutyJournal = {
                id: 'jrn-draft-preview',
                date: journalDate,
                day: journalDay,
                academicYear: activeAY.year,
                semester: activeAY.semester,
                officer1Id: currentOfficer1.id,
                officer1Name: currentOfficer1.name,
                officer1Nip: currentOfficer1.nip,
                officer2Id: currentOfficer2.id,
                officer2Name: currentOfficer2.name,
                officer2Nip: currentOfficer2.nip,
                officer3Id: currentOfficer3.id,
                officer3Name: currentOfficer3.name,
                officer3Nip: currentOfficer3.nip,
                headmasterName: profile.principalName || 'Drs. H. Suryadi, M.M.',
                headmasterNip: profile.principalNip || '19680512 199303 1 004',
                teachersPresent,
                teachersAbsent,
                staffPresent,
                staffAbsent,
                guests,
                studentAttendance: studentAttendanceSummaries,
                incidents,
                generalNotes,
                createdAt: new Date().toISOString(),
                createdBy: currentUser.name,
                status: 'draft',
              };
              setPrintModalJournal(dummyForPrint);
            }}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-indigo-200" />
            <span>Pratinjau / Cetak Laporan Piket</span>
          </button>
        </div>
      </div>

      {submitNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-medium text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{submitNotice}</span>
        </div>
      )}

      {/* Main Tab Navigation (Tab 4 Data Pegawai dipindahkan ke Menu Khusus Tendik) */}
      <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('jurnal_input')}
          className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'jurnal_input'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>1. Form Jurnal Piket Hari Ini</span>
        </button>

        <button
          onClick={() => setActiveTab('jadwal_mingguan')}
          className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'jadwal_mingguan'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>2. Jadwal Piket Petugas ({dutySchedules.length} Hari)</span>
        </button>

        <button
          onClick={() => setActiveTab('riwayat_jurnal')}
          className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'riwayat_jurnal'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>3. Riwayat Laporan Piket ({dutyJournals.length})</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: FORM PENGISIAN JURNAL PIKET HARIAN (LENGKAP 2.2.1 - 2.2.9) */}
      {/* ============================================================== */}
      {activeTab === 'jurnal_input' && (
        <div className="space-y-6">
          {/* 2.2.1 & 2.2.2 IDENTITAS HARI, TANGGAL & PETUGAS PIKET */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Identitas Tanggal & Petugas Piket Sekolah
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Presensi Guru & Siswa Terintegrasi Realtime (Sinkron: {lastSyncTime})</span>
                    <button
                      type="button"
                      onClick={() => initDayData(journalDay, journalDate)}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 font-semibold cursor-pointer"
                    >
                      <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>Sinkron Ulang</span>
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLoadOfficersFromSchedule}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Muat Petugas Sesuai Jadwal Hari {journalDay}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Hari & Tanggal Tugas
                </label>
                <input
                  type="date"
                  value={journalDate}
                  onChange={(e) => setJournalDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold mt-1 block">
                  {journalDay}, {formatDateIndonesian(journalDate)} · TA {activeAY.year} ({activeAY.semester})
                </span>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Petugas Piket 1 (Koordinator)
                </label>
                <select
                  value={officer1Id}
                  onChange={(e) => setOfficer1Id(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
                  NIP: {currentOfficer1.nip || '-'}
                </span>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Petugas Piket 2
                </label>
                <select
                  value={officer2Id}
                  onChange={(e) => setOfficer2Id(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
                  NIP: {currentOfficer2.nip || '-'}
                </span>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Petugas Piket 3
                </label>
                <select
                  value={officer3Id}
                  onChange={(e) => setOfficer3Id(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
                  NIP: {currentOfficer3.nip || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* 2.2.3 GURU HADIR & 2.2.4 GURU TIDAK HADIR */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 2.2.3 GURU HADIR (CEK SETIAP JAM PEMBELAJARAN) */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Guru Hadir ({teachersPresent.length} Guru)
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      Sesuai database jadwal. Dicek ketepatan mengajar setiap jam pembelajaran.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {teachersPresent.map((teacherRec) => (
                  <div
                    key={teacherRec.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {teacherRec.teacherName}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleMoveTeacherToAbsent(teacherRec.teacherId)}
                        className="text-[10px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 cursor-pointer"
                        title="Tandai tidak hadir jika berhalangan"
                      >
                        Tandai Tidak Hadir ➔
                      </button>
                    </div>

                    {/* Rincian Jam & Kelas Mengajar */}
                    <div className="space-y-1.5 pl-2 border-l-2 border-emerald-400">
                      {teacherRec.slots.map((slot, sIdx) => (
                        <div key={sIdx} className="flex items-center justify-between gap-2 text-[11px]">
                          <div>
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                              {slot.className}
                            </span>
                            <span className="text-slate-500"> · {slot.subjectName} · {slot.period}</span>
                          </div>
                          <label className="flex items-center gap-1 cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              checked={slot.isVerified}
                              onChange={(e) => {
                                const newPresent = [...teachersPresent];
                                slot.isVerified = e.target.checked;
                                setTeachersPresent(newPresent);
                              }}
                              className="rounded text-emerald-600 focus:ring-0"
                            />
                            <span className="text-[10px] text-slate-600 dark:text-slate-300">Terverifikasi</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {teachersPresent.length === 0 && (
                  <p className="text-center text-xs text-slate-400 py-6">
                    Belum ada guru yang ditandai hadir.
                  </p>
                )}
              </div>
            </div>

            {/* 2.2.4 GURU TIDAK HADIR (DICEK SEBELUM JURNAL DISUBMIT) */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <UserX className="w-5 h-5 text-rose-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Guru Tidak Hadir ({teachersAbsent.length} Guru)
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      Dicek & ditunjuk guru inval/penugasan sebelum jurnal dikirim.
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddAbsentTeacherManual(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="text-[11px] px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold cursor-pointer"
                  >
                    <option value="">+ Tambah Guru Tidak Hadir</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {teachersAbsent.map((absentTeacher) => (
                  <div
                    key={absentTeacher.id}
                    className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-950 dark:text-rose-200">
                        {absentTeacher.teacherName}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleMoveTeacherToPresent(absentTeacher.teacherId)}
                        className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 cursor-pointer"
                        title="Kembalikan ke daftar hadir"
                      >
                        Kembalikan Hadir ➔
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <label className="block text-slate-500 font-semibold mb-0.5">Keterangan Tidak Hadir:</label>
                        <select
                          value={absentTeacher.absenceReason || 'Izin'}
                          onChange={(e) => {
                            const updated = [...teachersAbsent];
                            absentTeacher.absenceReason = e.target.value as any;
                            setTeachersAbsent(updated);
                          }}
                          className="w-full px-2 py-1 rounded border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 font-bold"
                        >
                          <option value="Sakit">Sakit</option>
                          <option value="Izin">Izin</option>
                          <option value="Tanpa Keterangan">Tanpa Keterangan (Alpa)</option>
                          <option value="Terlambat">Terlambat</option>
                          <option value="Dinas Luar">Dinas Luar</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-500 font-semibold mb-0.5">Guru Inval / Pengganti:</label>
                        <select
                          value={absentTeacher.slots[0]?.substituteTeacherId || 'none'}
                          onChange={(e) => {
                            const val = e.target.value;
                            const sub = teachers.find((t) => t.id === val);
                            const updated = [...teachersAbsent];
                            absentTeacher.slots.forEach((s) => {
                              s.substituteTeacherId = val;
                              s.substituteTeacherName = val === 'none' ? 'Tidak ada pengganti' : (sub?.name || 'Guru Piket');
                            });
                            setTeachersAbsent(updated);
                          }}
                          className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                        >
                          <option value="none">-- Tidak ada pengganti --</option>
                          <option value={officer1Id}>Guru Piket 1: {currentOfficer1.name}</option>
                          <option value={officer2Id}>Guru Piket 2: {currentOfficer2.name}</option>
                          <option value={officer3Id}>Guru Piket 3: {currentOfficer3.name}</option>
                          {teachers.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Alasan tidak hadir / rincian tugas mandiri untuk kelas..."
                        value={absentTeacher.absenceNotes || ''}
                        onChange={(e) => {
                          const updated = [...teachersAbsent];
                          absentTeacher.absenceNotes = e.target.value;
                          setTeachersAbsent(updated);
                        }}
                        className="w-full px-2.5 py-1.5 rounded border border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-900 text-[11px]"
                      />
                    </div>
                  </div>
                ))}

                {teachersAbsent.length === 0 && (
                  <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-dashed border-emerald-300 dark:border-emerald-800 text-center text-xs text-emerald-700 dark:text-emerald-300">
                    Nihil: Seluruh guru terjadwal dilaporkan hadir bertugas.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2.2.5 & 2.2.6 KEHADIRAN PEGAWAI (TENDIK/TU/SATPAM/KEBERSIHAN) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Presensi Pegawai & Tenaga Kependidikan (Tendik)
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Mencatat jam datang, jam pulang pegawai hadir, dan keterangan pegawai tidak hadir.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                  Hadir: {staffPresent.length}
                </span>
                <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded">
                  Tidak Hadir: {staffAbsent.length}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold bg-slate-50 dark:bg-slate-800/50">
                    <th className="py-2 px-3">Nama Pegawai & Jabatan</th>
                    <th className="py-2 px-3">Status Kehadiran</th>
                    <th className="py-2 px-3">Jam Datang & Pulang</th>
                    <th className="py-2 px-3">Keterangan / Alasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {staffList.map((staff) => {
                    const isPresent = staffPresent.some((s) => s.staffId === staff.id);
                    const presentData = staffPresent.find((s) => s.staffId === staff.id);
                    const absentData = staffAbsent.find((s) => s.staffId === staff.id);

                    return (
                      <tr key={staff.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2 px-3">
                          <p className="font-bold text-slate-900 dark:text-white">{staff.name}</p>
                          <p className="text-[10px] text-slate-400">{staff.position}</p>
                        </td>

                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleStaffStatus(staff.id, 'hadir')}
                              className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                                isPresent
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              Hadir
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStaffStatus(staff.id, 'tidak_hadir')}
                              className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                                !isPresent
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              Tidak Hadir
                            </button>
                          </div>
                        </td>

                        <td className="py-2 px-3">
                          {isPresent && presentData ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="time"
                                value={presentData.checkInTime || '06:45'}
                                onChange={(e) => {
                                  const updated = [...staffPresent];
                                  presentData.checkInTime = e.target.value;
                                  setStaffPresent(updated);
                                }}
                                className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[11px]"
                              />
                              <span className="text-slate-400">s/d</span>
                              <input
                                type="time"
                                value={presentData.checkOutTime || '15:30'}
                                onChange={(e) => {
                                  const updated = [...staffPresent];
                                  presentData.checkOutTime = e.target.value;
                                  setStaffPresent(updated);
                                }}
                                className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[11px]"
                              />
                            </div>
                          ) : (
                            <span className="text-rose-500 font-medium text-[11px]">-</span>
                          )}
                        </td>

                        <td className="py-2 px-3">
                          {!isPresent && absentData ? (
                            <div className="flex items-center gap-2">
                              <select
                                value={absentData.absenceReason || 'Izin'}
                                onChange={(e) => {
                                  const updated = [...staffAbsent];
                                  absentData.absenceReason = e.target.value as any;
                                  setStaffAbsent(updated);
                                }}
                                className="px-1.5 py-1 rounded border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 font-bold text-[11px]"
                              >
                                <option value="Izin">Izin</option>
                                <option value="Sakit">Sakit</option>
                                <option value="Tanpa Keterangan">Tanpa Keterangan</option>
                                <option value="Cuti">Cuti</option>
                                <option value="Dinas Luar">Dinas Luar</option>
                              </select>
                              <input
                                type="text"
                                placeholder="Alasan tidak hadir..."
                                value={absentData.absenceNotes || ''}
                                onChange={(e) => {
                                  const updated = [...staffAbsent];
                                  absentData.absenceNotes = e.target.value;
                                  setStaffAbsent(updated);
                                }}
                                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] w-48"
                              />
                            </div>
                          ) : (
                            <span className="text-emerald-600 text-[11px] font-medium">Bertugas aktif di sekolah</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2.2.8 REKAPITULASI KEHADIRAN SISWA TERINTEGRASI */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Rekapitulasi Kehadiran Siswa per Rombel (1 Hari Pembelajaran)
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Siswa hadir dicantumkan jumlahnya. Siswa yang tidak hadir (sakit, izin, alpa, terlambat, cepat pulang) dicantumkan nama lengkapnya.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => initDayData(journalDay)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Muat Ulang Presensi Kelas</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {studentAttendanceSummaries.map((classSummary) => {
                const classStudents = students.filter((s) => s.classId === classSummary.classId);

                return (
                  <div
                    key={classSummary.classId}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        Kelas {classSummary.className}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        {classSummary.totalPresent} Siswa Hadir
                      </span>
                    </div>

                    {/* Daftar Nama Siswa Tidak Hadir */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Siswa Tidak Hadir / Keterangan:
                      </span>
                      {classSummary.absentStudents.length > 0 ? (
                        <div className="space-y-1">
                          {classSummary.absentStudents.map((absentStd, aIdx) => (
                            <div
                              key={aIdx}
                              className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1 text-[11px]"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-slate-900 dark:text-white truncate">
                                  {absentStd.studentName}
                                </p>
                                <span className="text-[10px] text-slate-400 truncate block">
                                  {absentStd.notes || '-'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold uppercase ${
                                    absentStd.status === 'sakit'
                                      ? 'bg-amber-100 text-amber-800'
                                      : absentStd.status === 'izin'
                                      ? 'bg-blue-100 text-blue-800'
                                      : absentStd.status === 'alpa'
                                      ? 'bg-rose-100 text-rose-800'
                                      : absentStd.status === 'terlambat'
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-orange-100 text-orange-800'
                                  }`}
                                >
                                  {absentStd.status.replace('_', ' ')}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAbsentStudentFromClass(classSummary.classId, absentStd.studentId)}
                                  className="text-slate-400 hover:text-rose-500 cursor-pointer"
                                  title="Hapus dari daftar tidak hadir"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          ✓ Nihil: Semua siswa hadir lengkap.
                        </p>
                      )}
                    </div>

                    {/* Quick Add Siswa Melapor di Piket */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            const [stdId, status] = e.target.value.split('|');
                            handleAddAbsentStudentToClass(classSummary.classId, stdId, status, 'Melapor di pos piket');
                            e.target.value = '';
                          }
                        }}
                        className="w-full text-[10px] px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 cursor-pointer"
                      >
                        <option value="">+ Tambah Siswa Melapor di Meja Piket</option>
                        {classStudents.map((std) => (
                          <optgroup key={std.id} label={std.name}>
                            <option value={`${std.id}|terlambat`}>Terlambat Masuk</option>
                            <option value={`${std.id}|cepat_pulang`}>Izin Cepat Pulang</option>
                            <option value={`${std.id}|sakit`}>Sakit (Masuk UKS)</option>
                            <option value={`${std.id}|izin`}>Izin Dispensasi</option>
                            <option value={`${std.id}|alpa`}>Alpa / Tanpa Keterangan</option>
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2.2.7 BUKU TAMU & 2.2.9 KEJADIAN-KEJADIAN PENTING */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 2.2.7 BUKU TAMU RESMI */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Buku Tamu Sekolah ({guests.length} Tamu)
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      Mencatat tamu resmi, instansi, tujuan kunjungan, & tindak lanjut.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Tambah Tamu */}
              <form onSubmit={handleAddGuest} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-0.5">Nama Lengkap Tamu *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bpk. Ir. Gunawan Wibowo"
                      value={newGuest.fullName}
                      onChange={(e) => setNewGuest({ ...newGuest, fullName: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-0.5">Alamat Asal / Tempat Tinggal *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jl. Pemuda No. 45"
                      value={newGuest.address}
                      onChange={(e) => setNewGuest({ ...newGuest, address: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-0.5">Alamat Kantor / Instansi (Opsional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Cabang Dinas Pend. Wil. I"
                      value={newGuest.officeAddress}
                      onChange={(e) => setNewGuest({ ...newGuest, officeAddress: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-0.5">No. Telp / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="0812-xxxx-xxxx"
                      value={newGuest.phone}
                      onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-0.5">Waktu / Jam Kedatangan</label>
                    <input
                      type="time"
                      value={newGuest.time}
                      onChange={(e) => setNewGuest({ ...newGuest, time: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-0.5">Tujuan Kunjungan *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Monitoring Asesmen dan Supervisi Guru"
                      value={newGuest.purpose}
                      onChange={(e) => setNewGuest({ ...newGuest, purpose: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-0.5">Menemui Siapa</label>
                    <input
                      type="text"
                      placeholder="e.g. Kepala Sekolah / Wakasek"
                      value={newGuest.personToMeet}
                      onChange={(e) => setNewGuest({ ...newGuest, personToMeet: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-0.5">Tindak Lanjut Penyelesaian *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Diterima langsung di Ruang Kepala Sekolah (Selesai)"
                    value={newGuest.followUp}
                    onChange={(e) => setNewGuest({ ...newGuest, followUp: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-3.5 py-1.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Catat Tamu</span>
                  </button>
                </div>
              </form>

              {/* Daftar Tamu Tercatat */}
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {guests.map((g) => (
                  <div
                    key={g.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {g.fullName}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px] ml-2">
                          [{g.time} WIB]
                        </span>
                        {g.officeAddress && (
                          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                            Instansi: {g.officeAddress}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-500">
                          Alamat: {g.address} {g.phone ? `· HP: ${g.phone}` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteGuest(g.id)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer p-1"
                        title="Hapus tamu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] space-y-0.5">
                      <p className="text-slate-700 dark:text-slate-300">
                        <strong className="text-slate-500">Tujuan:</strong> {g.purpose} (Menemui: {g.personToMeet})
                      </p>
                      <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                        <strong>Tindak Lanjut:</strong> {g.followUp}
                      </p>
                    </div>
                  </div>
                ))}

                {guests.length === 0 && (
                  <p className="text-center text-xs text-slate-400 py-4">
                    Belum ada tamu yang dicatat hari ini.
                  </p>
                )}
              </div>
            </div>

            {/* 2.2.9 KEJADIAN-KEJADIAN PENTING */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Kejadian-Kejadian Penting & Kasus Khusus ({incidents.length})
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      Uraian kejadian, waktu, pihak terlibat, & integrasi siswa bermasalah.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Tambah Kejadian */}
              <form onSubmit={handleAddIncident} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-0.5">Waktu / Pukul *</label>
                    <input
                      type="time"
                      value={newIncident.time}
                      onChange={(e) => setNewIncident({ ...newIncident, time: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-500 font-semibold mb-0.5">Pihak yang Terlibat *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Siswa Terlambat & Petugas Gerbang"
                      value={newIncident.partiesInvolved}
                      onChange={(e) => setNewIncident({ ...newIncident, partiesInvolved: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-0.5">Uraian Kejadian Penting *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Uraikan secara jelas kronologi atau peristiwa yang terjadi..."
                    value={newIncident.description}
                    onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                {/* Checkbox Melibatkan Siswa */}
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-900 dark:text-amber-200">
                    <input
                      type="checkbox"
                      checked={newIncident.involvesStudents}
                      onChange={(e) => setNewIncident({ ...newIncident, involvesStudents: e.target.checked })}
                      className="rounded text-amber-600 focus:ring-0"
                    />
                    <span>Melibatkan Siswa (Integrasi Basis Data Siswa)</span>
                  </label>

                  {newIncident.involvesStudents && (
                    <div className="space-y-2 pt-1 border-t border-amber-200/60 dark:border-amber-900/60">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Filter Kelas:</span>
                        <select
                          value={newIncident.filterClassId}
                          onChange={(e) => setNewIncident({ ...newIncident, filterClassId: e.target.value })}
                          className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px]"
                        >
                          {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                              Kelas {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Multiselect Siswa pada kelas tersebut */}
                      <div className="max-h-24 overflow-y-auto p-1.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                        {students
                          .filter((s) => s.classId === newIncident.filterClassId)
                          .map((std) => (
                            <label key={std.id} className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={newIncident.selectedStudentIds.includes(std.id)}
                                onChange={(e) => {
                                  const updated = e.target.checked
                                    ? [...newIncident.selectedStudentIds, std.id]
                                    : newIncident.selectedStudentIds.filter((id) => id !== std.id);
                                  setNewIncident({ ...newIncident, selectedStudentIds: updated });
                                }}
                                className="rounded text-indigo-600"
                              />
                              <span className="truncate">{std.name}</span>
                            </label>
                          ))}
                      </div>

                      <div className="flex items-center gap-4 text-[11px] pt-1">
                        <label className="flex items-center gap-1.5 cursor-pointer text-indigo-700 dark:text-indigo-300 font-semibold">
                          <input
                            type="checkbox"
                            checked={newIncident.referredToBK}
                            onChange={(e) => setNewIncident({ ...newIncident, referredToBK: e.target.checked })}
                            className="rounded text-indigo-600"
                          />
                          <span>Rekomendasikan Rujuk ke Guru BK</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-0.5">Tindak Lanjut Penyelesaian *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pembinaan disiplin di pos piket, diizinkan masuk jam ke-2..."
                    value={newIncident.followUp}
                    onChange={(e) => setNewIncident({ ...newIncident, followUp: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-3.5 py-1.5 font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Catat Kejadian</span>
                  </button>
                </div>
              </form>

              {/* Daftar Kejadian Tercatat */}
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {incidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-1.5 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-amber-950 dark:text-amber-200 font-mono text-[11px] px-1.5 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/60">
                          {inc.time} WIB
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 ml-2">
                          Pihak: {inc.partiesInvolved}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteIncident(inc.id)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer p-1"
                        title="Hapus kejadian"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-slate-800 dark:text-slate-200 text-[11px] leading-relaxed">
                      {inc.description}
                    </p>

                    {inc.involvesStudents && inc.involvedStudentNames.length > 0 && (
                      <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 text-[10.5px]">
                        <span className="font-bold text-amber-800 dark:text-amber-300">Siswa Terlibat: </span>
                        <span>{inc.involvedStudentNames.join(', ')}</span>
                      </div>
                    )}

                    <div className="pt-1 border-t border-amber-200/60 dark:border-amber-900/60 text-[11px]">
                      <span className="font-bold text-emerald-700 dark:text-emerald-300">Tindak Lanjut: </span>
                      <span>{inc.followUp}</span>
                      {inc.referredToBK && (
                        <span className="ml-2 px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-bold text-[9px]">
                          DIRUJUK KE BK
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {incidents.length === 0 && (
                  <p className="text-center text-xs text-slate-400 py-4">
                    Nihil: Tidak ada kejadian menonjol yang dilaporkan hari ini.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Catatan Umum & Submit Tombol */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold text-xs mb-1">
                Catatan Umum / Kesimpulan Piket Harian:
              </label>
              <textarea
                rows={2}
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                placeholder="Catatan umum situasi sekolah..."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  Jurnal akan disahkan oleh 3 Guru Piket & Diketahui Kepala Sekolah ({profile.principalName}).
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleSaveDraftJournal}
                  className="flex items-center gap-1.5 px-4 py-2.5 font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl shadow-2xs transition-all cursor-pointer"
                  title="Simpan draft sementara agar guru piket lain dapat melihat dan melanjutkan isian"
                >
                  <Save className="w-4 h-4 text-amber-500" />
                  <span>Simpan Sementara (Draft Jurnal)</span>
                </button>

                {isAssignedOfficerToday ? (
                  <button
                    type="button"
                    onClick={handleSubmitJournal}
                    className="flex items-center gap-2 px-5 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Kirim & Terbitkan Jurnal</span>
                  </button>
                ) : (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 italic px-3 py-2 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                    Tombol Terbitkan hanya aktif bagi Guru Piket yang bertugas hari ini
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: JADWAL PIKET MINGGUAN & RENTANG WAKTU (2.1 & Item 8)     */}
      {/* ============================================================== */}
      {activeTab === 'jadwal_mingguan' && (
        <div className="space-y-4">
          {/* Header & Date Range Indicator (Item 8) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Jadwal Piket Petugas Sekolah
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                  {dutySchedules.length} Hari Aktif Terjadwal
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1.5 flex-wrap">
                <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>
                  Rentang Waktu Berlaku:{' '}
                  <strong className="text-indigo-700 dark:text-indigo-300">
                    {formatDateIndonesian(dutySchedules[0]?.startDate || genStartDate)} s.d{' '}
                    {formatDateIndonesian(dutySchedules[0]?.endDate || genEndDate)}
                  </strong>
                </span>
                <span className="text-slate-400">· TA {activeAY.year} ({activeAY.semester})</span>
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Toggle Tampilan Jadwal (Item 8) */}
              <div className="flex items-center p-0.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setScheduleViewMode('mingguan')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    scheduleViewMode === 'mingguan'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Pola Mingguan
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleViewMode('rentang_tanggal')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    scheduleViewMode === 'rentang_tanggal'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Kalender Rentang Tanggal
                </button>
              </div>

              {canManageSchedule && (
                <button
                  type="button"
                  onClick={() => setIsGeneratorModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Atur & Generate Jadwal (Wakasek)</span>
                </button>
              )}
            </div>
          </div>

          {/* MODE 1: Pola Mingguan (Senin - Sabtu) */}
          {scheduleViewMode === 'mingguan' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dutySchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-black flex items-center justify-center text-xs">
                          {schedule.day.substring(0, 3)}
                        </span>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                            Hari {schedule.day}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Lokasi: {schedule.standbyLocation}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setEditingSchedule(schedule)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="Edit jadwal"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 pt-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Daftar Petugas Piket:
                        </span>
                        {schedule.dateRangeText && (
                          <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                            {schedule.dateRangeText}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        {schedule.dutyOfficers.map((off, oIdx) => (
                          <div
                            key={oIdx}
                            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 mr-1.5">
                                {off.role}
                              </span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                {off.teacherName}
                              </span>
                            </div>
                            {off.phone && (
                              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5 shrink-0">
                                <Phone className="w-2.5 h-2.5" />
                                {off.phone}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {schedule.notes && (
                      <p className="text-[11px] text-slate-500 italic mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        Catatan: {schedule.notes}
                      </p>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setJournalDay(schedule.day);
                        setOfficer1Id(schedule.dutyOfficers[0]?.teacherId || officer1Id);
                        setOfficer2Id(schedule.dutyOfficers[1]?.teacherId || officer2Id);
                        setOfficer3Id(schedule.dutyOfficers[2]?.teacherId || officer3Id);
                        setActiveTab('jurnal_input');
                      }}
                      className="w-full py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer text-center block"
                    >
                      Buka Jurnal Hari {schedule.day} ➔
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MODE 2: Kalender Rentang Tanggal Harian (Item 8) */}
          {scheduleViewMode === 'rentang_tanggal' &&
            (() => {
              const activeStart = dutySchedules[0]?.startDate || genStartDate;
              const activeEnd = dutySchedules[0]?.endDate || genEndDate;
              const sDate = new Date(activeStart + 'T00:00:00');
              const eDate = new Date(activeEnd + 'T00:00:00');
              const dateList: { dateStr: string; dayName: string; schedule?: DutySchedule }[] = [];

              const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
              const cur = new Date(sDate);
              let limit = 0;
              while (cur <= eDate && limit < 90) {
                limit++;
                const dName = dayNames[cur.getDay()];
                const matchedSchedule = dutySchedules.find((s) => s.day === dName);
                if (matchedSchedule) {
                  dateList.push({
                    dateStr: cur.toISOString().substring(0, 10),
                    dayName: dName,
                    schedule: matchedSchedule,
                  });
                }
                cur.setDate(cur.getDate() + 1);
              }

              return (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
                    <span>
                      Menampilkan jadwal harian petugas piket ({dateList.length} tanggal aktif) selama rentang{' '}
                      <strong>{formatDateIndonesian(activeStart)}</strong> s.d{' '}
                      <strong>{formatDateIndonesian(activeEnd)}</strong>.
                    </span>
                    <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                      {dateList.length} Sesi Terjadwal
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {dateList.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {item.dayName}, {formatDateIndonesian(item.dateStr)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {item.schedule?.standbyLocation}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setJournalDate(item.dateStr);
                              setJournalDay(item.dayName);
                              if (item.schedule && item.schedule.dutyOfficers.length >= 3) {
                                setOfficer1Id(item.schedule.dutyOfficers[0].teacherId);
                                setOfficer2Id(item.schedule.dutyOfficers[1].teacherId);
                                setOfficer3Id(item.schedule.dutyOfficers[2].teacherId);
                              }
                              setActiveTab('jurnal_input');
                            }}
                            className="px-2.5 py-1 text-[10.5px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 rounded-lg cursor-pointer transition-colors"
                          >
                            Buka Jurnal ➔
                          </button>
                        </div>

                        <div className="space-y-1">
                          {item.schedule?.dutyOfficers.map((off, oIdx) => (
                            <div
                              key={oIdx}
                              className="flex items-center justify-between text-[11px] p-1.5 rounded bg-slate-50 dark:bg-slate-800/60"
                            >
                              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {off.teacherName}
                              </span>
                              <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 shrink-0">
                                {off.role.includes('1') ? 'Piket 1' : off.role.includes('2') ? 'Piket 2' : 'Piket 3'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: RIWAYAT & ARSIP LAPORAN PIKET (2.3)                     */}
      {/* ============================================================== */}
      {activeTab === 'riwayat_jurnal' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Arsip Laporan & Berita Acara Jurnal Piket
              </h3>
              <p className="text-xs text-slate-500">
                Seluruh laporan piket yang pernah disubmit dan siap dicetak ulang sewaktu-waktu.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Hari / Tanggal</th>
                  <th className="py-3 px-4">Petugas Piket</th>
                  <th className="py-3 px-4">Guru Tidak Hadir</th>
                  <th className="py-3 px-4">Tamu</th>
                  <th className="py-3 px-4">Kejadian</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {dutyJournals
                  .filter((jrn) => {
                    // Request 20.7: Riwayat Laporan Piket hanya bisa dilihat User lain setelah diterbitkan
                    if (canManageSchedule) return true;
                    if (jrn.status === 'published' || jrn.status === 'submitted') return true;
                    return (
                      [jrn.officer1Id, jrn.officer2Id, jrn.officer3Id].includes(currentUser.id) ||
                      [jrn.officer1Name, jrn.officer2Name, jrn.officer3Name].includes(currentUser.name)
                    );
                  })
                  .map((jrn) => (
                    <tr key={jrn.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        <p>{jrn.day}, {formatDateIndonesian(jrn.date)}</p>
                        <span className="text-[10px] text-slate-400 font-normal">TA {jrn.academicYear} ({jrn.semester})</span>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{jrn.officer1Name}</p>
                        <p className="text-[10px] text-slate-500">{jrn.officer2Name}, {jrn.officer3Name}</p>
                      </td>

                      <td className="py-3 px-4">
                        {jrn.teachersAbsent.length > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300">
                            {jrn.teachersAbsent.length} Guru Berhalangan
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Lengkap Hadir</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-medium">
                        {jrn.guests.length} Orang Tamu
                      </td>

                      <td className="py-3 px-4 font-medium">
                        {jrn.incidents.length} Catatan
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            jrn.status === 'published' || jrn.status === 'submitted'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {jrn.status === 'published' || jrn.status === 'submitted' ? 'Resmi Diterbitkan' : 'Draft Sementara'}
                        </span>
                      </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPrintModalJournal(jrn)}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded-lg transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Cetak Laporan</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Hapus arsip laporan piket ini?')) {
                              DataService.deleteDutyJournal(jrn.id, {
                                id: currentUser.id,
                                name: currentUser.name,
                                role: currentUser.role,
                              });
                              setDutyJournals(DataService.getDutyJournals());
                            }
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Hapus arsip"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* ============================================================== */}
      {/* MODAL CETAK LAPORAN PIKET RESMI (4 PIHAK TANDATANGAN) (2.3)   */}
      {/* ============================================================== */}
      {printModalJournal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-2xl max-w-4xl w-full p-6 md:p-8 shadow-2xl my-auto space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Action Bar (Hidden on print) */}
            <div className="no-print flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Format Cetak Laporan Berita Acara Jurnal Piket Harian Resmi
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Dokumen (Ctrl+P)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintModalJournal(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* AREA DOKUMEN CETAK RESMI DINAS PENDIDIKAN */}
            <div className="print-area font-serif text-slate-950 space-y-4">
              <OfficialLetterhead
                profile={profile}
                documentTitle="LAPORAN BERITA ACARA JURNAL PIKET HARIAN"
                documentNumber={`421.3 / PIKET / ${printModalJournal.date.replace(/-/g, '')} / ${new Date().getFullYear()}`}
              />

              {/* Rincian Hari / Tanggal */}
              <div className="text-center pb-2">
                <p className="text-xs text-slate-700 font-sans">
                  Hari: <strong>{printModalJournal.day}</strong>, Tanggal: <strong>{formatDateIndonesian(printModalJournal.date)}</strong> · Semester: <strong>{printModalJournal.semester}</strong> · Tahun Ajaran: <strong>{printModalJournal.academicYear}</strong>
                </p>
              </div>

              {/* I. PETUGAS PIKET */}
              <div className="space-y-1 text-xs">
                <p className="font-bold uppercase text-[11px] border-b border-slate-300 pb-0.5">
                  I. PETUGAS PIKET YANG BERTUGAS
                </p>
                <div className="grid grid-cols-3 gap-2 font-sans text-[11px] pt-1">
                  <div>
                    <span className="text-slate-500 block">Guru Piket 1 (Koordinator):</span>
                    <strong className="block">{printModalJournal.officer1Name}</strong>
                    <span className="text-slate-500 font-mono text-[10px]">NIP. {printModalJournal.officer1Nip || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Guru Piket 2:</span>
                    <strong className="block">{printModalJournal.officer2Name}</strong>
                    <span className="text-slate-500 font-mono text-[10px]">NIP. {printModalJournal.officer2Nip || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Guru Piket 3:</span>
                    <strong className="block">{printModalJournal.officer3Name}</strong>
                    <span className="text-slate-500 font-mono text-[10px]">NIP. {printModalJournal.officer3Nip || '-'}</span>
                  </div>
                </div>
              </div>

              {/* II. REKAPITULASI KEHADIRAN GURU */}
              <div className="space-y-1.5 text-xs pt-2">
                <p className="font-bold uppercase text-[11px] border-b border-slate-300 pb-0.5">
                  II. REKAPITULASI KEHADIRAN TENAGA PENDIDIK (GURU)
                </p>
                <div className="font-sans text-[11px] space-y-1.5">
                  <p>
                    Jumlah Guru Hadir Bertugas: <strong>{printModalJournal.teachersPresent.length} orang</strong> · Guru Tidak Hadir: <strong>{printModalJournal.teachersAbsent.length} orang</strong>
                  </p>

                  {printModalJournal.teachersAbsent.length > 0 && (
                    <table className="w-full text-left border border-slate-300 text-[10px]">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 font-bold">
                          <th className="p-1.5 border-r border-slate-300">Nama Guru Tidak Hadir</th>
                          <th className="p-1.5 border-r border-slate-300">Keterangan</th>
                          <th className="p-1.5 border-r border-slate-300">Kelas & Jam Mengajar</th>
                          <th className="p-1.5 border-r border-slate-300">Guru Inval / Pengganti</th>
                          <th className="p-1.5">Alasan / Penugasan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {printModalJournal.teachersAbsent.map((ab, aIdx) => {
                          const subName = ab.slots[0]?.substituteTeacherName;
                          const subId = ab.slots[0]?.substituteTeacherId;
                          const isNoSub = !subName || subName === 'Tidak ada pengganti' || subId === 'none';

                          return (
                            <tr key={aIdx} className="border-b border-slate-200">
                              <td className="p-1.5 font-bold border-r border-slate-300">{ab.teacherName}</td>
                              <td className="p-1.5 font-semibold text-rose-700 border-r border-slate-300">{ab.absenceReason}</td>
                              <td className="p-1.5 border-r border-slate-300">
                                {ab.slots.map((s) => `${s.className} (${s.period})`).join(', ')}
                              </td>
                              <td className="p-1.5 border-r border-slate-300">
                                {isNoSub ? (
                                  <span className="italic text-slate-500">Tidak ada pengganti</span>
                                ) : (
                                  <span className="font-semibold">{subName}</span>
                                )}
                              </td>
                              <td className="p-1.5">{ab.absenceNotes || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* III. REKAPITULASI KEHADIRAN PEGAWAI */}
              <div className="space-y-1.5 text-xs pt-2">
                <p className="font-bold uppercase text-[11px] border-b border-slate-300 pb-0.5">
                  III. REKAPITULASI KEHADIRAN TENAGA KEPENDIDIKAN (PEGAWAI/TENDIK)
                </p>
                <div className="font-sans text-[10.5px]">
                  <p>
                    Pegawai Hadir: <strong>{printModalJournal.staffPresent.length} orang</strong> (Hadir tepat waktu sesuai tugas pokok).
                    {printModalJournal.staffAbsent.length > 0
                      ? ` Pegawai Berhalangan: ${printModalJournal.staffAbsent.map((s) => `${s.staffName} (${s.absenceReason})`).join(', ')}.`
                      : ' (Semua pegawai hadir lengkap)'}
                  </p>
                </div>
              </div>

              {/* IV. REKAPITULASI KEHADIRAN SISWA PER KELAS */}
              <div className="space-y-1.5 text-xs pt-2">
                <p className="font-bold uppercase text-[11px] border-b border-slate-300 pb-0.5">
                  IV. REKAPITULASI PRESENSI KEHADIRAN SISWA PER KELAS
                </p>
                <table className="w-full text-left border border-slate-300 text-[10px] font-sans">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 font-bold">
                      <th className="p-1.5 border-r border-slate-300">Rombongan Belajar (Kelas)</th>
                      <th className="p-1.5 border-r border-slate-300 text-center">Jumlah Siswa Hadir</th>
                      <th className="p-1.5">Daftar Nama Siswa Tidak Hadir / Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printModalJournal.studentAttendance.map((sum, sIdx) => (
                      <tr key={sIdx} className="border-b border-slate-200">
                        <td className="p-1.5 font-bold border-r border-slate-300">{sum.className}</td>
                        <td className="p-1.5 text-center font-bold text-emerald-800 border-r border-slate-300">{sum.totalPresent} Orang</td>
                        <td className="p-1.5">
                          {sum.absentStudents.length > 0
                            ? sum.absentStudents.map((std) => `${std.studentName} (${std.status.toUpperCase()})`).join('; ')
                            : 'Nihil (Hadir Lengkap 100%)'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* V. BUKU TAMU */}
              <div className="space-y-1.5 text-xs pt-2">
                <p className="font-bold uppercase text-[11px] border-b border-slate-300 pb-0.5">
                  V. CATATAN BUKU TAMU SEKOLAH
                </p>
                {printModalJournal.guests.length > 0 ? (
                  <table className="w-full text-left border border-slate-300 text-[10px] font-sans">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 font-bold">
                        <th className="p-1 border-r border-slate-300">Waktu</th>
                        <th className="p-1 border-r border-slate-300">Nama Tamu & Asal/Instansi</th>
                        <th className="p-1 border-r border-slate-300">Tujuan Kunjungan</th>
                        <th className="p-1">Tindak Lanjut Penyelesaian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printModalJournal.guests.map((g, gIdx) => (
                        <tr key={gIdx} className="border-b border-slate-200">
                          <td className="p-1 font-mono border-r border-slate-300">{g.time}</td>
                          <td className="p-1 border-r border-slate-300">
                            <strong>{g.fullName}</strong> - {g.officeAddress || g.address}
                          </td>
                          <td className="p-1 border-r border-slate-300">{g.purpose} (Menemui: {g.personToMeet})</td>
                          <td className="p-1">{g.followUp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-[10px] font-sans text-slate-500 italic">Tidak ada kunjungan tamu pada hari ini.</p>
                )}
              </div>

              {/* VI. KEJADIAN PENTING */}
              <div className="space-y-1.5 text-xs pt-2">
                <p className="font-bold uppercase text-[11px] border-b border-slate-300 pb-0.5">
                  VI. KEJADIAN PENTING / CATATAN KHUSUS
                </p>
                {printModalJournal.incidents.length > 0 ? (
                  <div className="space-y-1 font-sans text-[10px]">
                    {printModalJournal.incidents.map((inc, iIdx) => (
                      <p key={iIdx}>
                        <strong>[{inc.time} WIB]</strong> {inc.description} (Pihak terlibat: {inc.partiesInvolved})
                        {inc.involvesStudents && inc.involvedStudentNames.length > 0 && ` — Siswa: ${inc.involvedStudentNames.join(', ')}`}.
                        <span className="font-semibold text-emerald-800"> Solusi/Tindak lanjut: {inc.followUp}</span>
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] font-sans text-slate-500 italic">Nihil. Situasi sekolah aman dan kondusif.</p>
                )}
              </div>

              {/* VII. TANDA TANGAN 4 PIHAK RESMI */}
              <div className="pt-6 font-sans">
                <div className="text-right text-xs mb-3">
                  {profile.city}, {formatDateIndonesian(printModalJournal.date)}
                </div>

                {(() => {
                  const isOff1Absent = printModalJournal.teachersAbsent.some(
                    (ta) => ta.teacherId === printModalJournal.officer1Id || ta.teacherName === printModalJournal.officer1Name
                  );
                  const isOff2Absent = printModalJournal.teachersAbsent.some(
                    (ta) => ta.teacherId === printModalJournal.officer2Id || ta.teacherName === printModalJournal.officer2Name
                  );
                  const isOff3Absent = printModalJournal.teachersAbsent.some(
                    (ta) => ta.teacherId === printModalJournal.officer3Id || ta.teacherName === printModalJournal.officer3Name
                  );

                  const presentOfficers = [
                    { title: 'Guru Piket 1 (Koordinator)', name: printModalJournal.officer1Name, nip: printModalJournal.officer1Nip, absent: isOff1Absent },
                    { title: 'Guru Piket 2', name: printModalJournal.officer2Name, nip: printModalJournal.officer2Nip, absent: isOff2Absent },
                    { title: 'Guru Piket 3', name: printModalJournal.officer3Name, nip: printModalJournal.officer3Nip, absent: isOff3Absent },
                  ].filter((o) => !o.absent);

                  const colCount = Math.max(1, presentOfficers.length);

                  return (
                    <div
                      className={`grid gap-4 text-center text-xs pb-10 ${
                        colCount === 1 ? 'grid-cols-1 max-w-xs mx-auto' : colCount === 2 ? 'grid-cols-2 max-w-md mx-auto' : 'grid-cols-3'
                      }`}
                    >
                      {presentOfficers.map((po, pIdx) => (
                        <div key={pIdx}>
                          <p className="text-slate-600 mb-16">{po.title},</p>
                          <p className="font-bold underline uppercase">{po.name}</p>
                          <p className="text-[10px] font-mono text-slate-500">NIP. {po.nip || '-'}</p>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                <div className="text-center text-xs pt-4 border-t border-slate-200 w-64 mx-auto">
                  <p className="text-slate-600 mb-16">
                    Mengetahui,<br />Kepala Sekolah
                  </p>
                  <p className="font-bold underline uppercase">{printModalJournal.headmasterName}</p>
                  <p className="text-[10px] font-mono text-slate-500">NIP. {printModalJournal.headmasterNip || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT JADWAL PIKET */}
      {editingSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveDutySchedule}
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-auto text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Edit Jadwal Piket Hari {editingSchedule.day}
              </h3>
              <button
                type="button"
                onClick={() => setEditingSchedule(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Pos / Lokasi Piket</label>
              <input
                type="text"
                value={editingSchedule.standbyLocation}
                onChange={(e) => setEditingSchedule({ ...editingSchedule, standbyLocation: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div className="space-y-3 pt-1">
              <span className="font-bold text-slate-700 dark:text-slate-300 block">Petugas Piket:</span>
              {editingSchedule.dutyOfficers.map((off, idx) => (
                <div key={idx} className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400">{off.role}</label>
                    <select
                      value={off.teacherId}
                      onChange={(e) => {
                        const tch = teachers.find((t) => t.id === e.target.value);
                        const updated = { ...editingSchedule };
                        updated.dutyOfficers[idx].teacherId = e.target.value;
                        updated.dutyOfficers[idx].teacherName = tch?.name || '';
                        updated.dutyOfficers[idx].phone = tch?.phone;
                        setEditingSchedule(updated);
                      }}
                      className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                    >
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400">No. WhatsApp</label>
                    <input
                      type="text"
                      value={off.phone || ''}
                      onChange={(e) => {
                        const updated = { ...editingSchedule };
                        updated.dutyOfficers[idx].phone = e.target.value;
                        setEditingSchedule(updated);
                      }}
                      placeholder="0812-xxxx"
                      className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Catatan Khusus</label>
              <input
                type="text"
                value={editingSchedule.notes || ''}
                onChange={(e) => setEditingSchedule({ ...editingSchedule, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingSchedule(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer"
              >
                Simpan Jadwal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL GENERATOR JADWAL PIKET OLEH WAKASEK KURIKULUM (Request 20.1 - 20.4) */}
      {isGeneratorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Generator Jadwal Piket Sekolah
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Konfigurasi penugasan otomatis khusus Wakasek Bidang Kurikulum
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGeneratorModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 20.1: Hari Sekolah Aktif */}
            <div className="space-y-1.5">
              <label className="block text-slate-700 dark:text-slate-300 font-bold">
                1. Atur Hari Sekolah Aktif (Piket):
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((day) => {
                  const isChecked = genDays.includes(day);
                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => {
                        if (isChecked) {
                          if (genDays.length <= 1) {
                            alert('Minimal 1 hari sekolah aktif harus dipilih.');
                            return;
                          }
                          setGenDays(genDays.filter((d) => d !== day));
                        } else {
                          setGenDays([...genDays, day]);
                        }
                      }}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 20.2: Rentang Tanggal Jadwal */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  2. Tanggal Mulai Berlaku:
                </label>
                <input
                  type="date"
                  value={genStartDate}
                  onChange={(e) => setGenStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Sampai Tanggal (Selesai):
                </label>
                <input
                  type="date"
                  value={genEndDate}
                  onChange={(e) => setGenEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                />
              </div>
            </div>

            {/* 20.3: Jumlah Petugas Piket per Hari */}
            <div className="pt-1">
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                3. Atur Jumlah Petugas Piket per Hari:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[2, 3, 4].map((num) => (
                  <button
                    type="button"
                    key={num}
                    onClick={() => setGenOfficersPerDay(num)}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      genOfficersPerDay === num
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {num} Petugas / Hari
                  </button>
                ))}
              </div>
            </div>

            {/* 20.4: Checkbox Libatkan Tendik & Keterangan Kepala Sekolah */}
            <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl space-y-2">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={genIncludeTendik}
                  onChange={(e) => setGenIncludeTendik(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded accent-indigo-600"
                />
                <span>Libatkan Tenaga Kependidikan (Tendik / Pegawai)</span>
              </label>
              <p className="text-[11px] text-slate-500 pl-6 leading-relaxed">
                Jika diaktifkan, sistem otomatis mengambil personil TU, Pustakawan, dan Laboran untuk ikut digenerate bergantian bersama Guru.
                <br />
                <strong className="text-indigo-700 dark:text-indigo-300 font-semibold">Catatan:</strong> Kepala Sekolah otomatis <strong>dikecualikan</strong> dari daftar petugas piket dan bertindak sebagai pihak yang Mengetahui laporan.
              </p>
            </div>

            {/* 5. Atur Blokir Hari Personil (Fitur Blok Bagi - Item 9) */}
            <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-slate-800 dark:text-slate-200 font-bold">
                    5. Pengaturan Blokir Hari Personil (Fitur Blok Bagi):
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Misalnya guru A diblokir pada hari Rabu dan Jumat, sistem otomatis tidak akan menjadwalkan guru A di hari tersebut saat generate.
                  </p>
                </div>
              </div>

              {/* Pilih Guru / Tendik yang ingin diatur blokirnya */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Pilih Guru atau Tenaga Kependidikan:
                </label>
                <select
                  value={selectedPersonToBlock}
                  onChange={(e) => setSelectedPersonToBlock(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                >
                  <option value="">-- Pilih Personil untuk Diatur Hari Blokirnya --</option>
                  <optgroup label="Tenaga Pendidik (Guru)">
                    {teachers
                      .filter((t) => !/kepala sekolah/i.test(t.position || '') && !/kepala sekolah/i.test(t.name || ''))
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.subjectNames?.join(', ') || t.position || 'Guru'})
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Tenaga Kependidikan (Tendik / Pegawai)">
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.position})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Jika personil dipilih, tampilkan tombol toggle hari yang diblokir */}
              {selectedPersonToBlock && (
                <div className="pt-1.5 space-y-1 bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-lg border border-amber-200/80 dark:border-amber-800/50">
                  <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Klik hari di bawah untuk memblokir personil ini:
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((day) => {
                      const isBlocked = (teacherBlockedDays[selectedPersonToBlock] || []).includes(day);
                      return (
                        <button
                          type="button"
                          key={day}
                          onClick={() => handleToggleBlockedDay(selectedPersonToBlock, day)}
                          className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-all border ${
                            isBlocked
                              ? 'bg-rose-600 text-white border-rose-600 shadow-2xs ring-1 ring-rose-400'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {isBlocked ? `✕ ${day}` : day}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-500 italic pt-0.5">
                    * Tombol merah bertanda silang (✕) menandakan personil DIBLOKIR dan tidak akan dijadwalkan pada hari tersebut.
                  </p>
                </div>
              )}

              {/* Daftar Personil yang Saat Ini Memiliki Blokir Hari */}
              {Object.keys(teacherBlockedDays).length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-amber-200/60 dark:border-amber-800/40">
                  <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Daftar Guru / Pegawai yang Diblokir Hari Piketnya:
                  </span>
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {Object.entries(teacherBlockedDays).map(([personId, days]) => {
                      const tch = teachers.find((t) => t.id === personId);
                      const stf = staffList.find((s) => s.id === personId);
                      const name = tch?.name || stf?.name || personId;
                      const role = tch ? 'Guru' : stf ? 'Tendik' : 'Staff';

                      return (
                        <div
                          key={personId}
                          className="flex items-center justify-between bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px]"
                        >
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-900 dark:text-white">{name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                              {role}
                            </span>
                            <span className="text-slate-400 text-[10px]">diblokir hari:</span>
                            {days.map((d) => (
                              <span
                                key={d}
                                className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-[10px]"
                              >
                                {d}
                              </span>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleClearBlockedDays(personId)}
                            className="text-xs text-rose-500 hover:text-rose-700 hover:underline cursor-pointer ml-2 whitespace-nowrap"
                            title="Hapus semua blokir untuk personil ini"
                          >
                            Hapus
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsGeneratorModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleGenerateDutySchedule}
                className="inline-flex items-center gap-1.5 px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md cursor-pointer transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Jadwal Otomatis</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
