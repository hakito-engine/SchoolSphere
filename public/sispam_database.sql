-- ========================================================
-- SISPAM (Sistem Integrasi Sekolah, Pembelajaran, & Administrasi)
-- Skema Database Relasional MySQL & phpMyAdmin untuk cPanel
-- Domain: sispam.hakito.my.id
-- ========================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+07:00";

-- --------------------------------------------------------
-- Tabel 1: Pengguna Sistem (Users)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(50) NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `role` VARCHAR(50) NOT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `nip_or_nisn` VARCHAR(50) DEFAULT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `avatar` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Data Awal Pengguna (Users)
-- --------------------------------------------------------
INSERT INTO `users` (`id`, `username`, `password`, `name`, `role`, `email`, `phone`, `nip_or_nisn`, `status`) VALUES
('usr-1', 'admin', 'admin123', 'Drs. H. Suryadi, M.M.', 'super_admin', 'admin@sekolah.sch.id', '081234567890', '19680512 199303 1 004', 'active'),
('usr-2', 'kurikulum', 'kurikulum123', 'Drs. Akhmad Fauzi, M.Pd.', 'wakasek_kurikulum', 'kurikulum@sekolah.sch.id', '081298765432', '19740815 200003 1 002', 'active'),
('usr-3', 'guru', 'guru123', 'Budi Santoso, S.Si.', 'guru', 'budi.santoso@sekolah.sch.id', '081345678901', '19820311 200801 1 007', 'active'),
('usr-4', 'wali', 'wali123', 'Siti Rahmawati, M.Pd.', 'wali_kelas', 'siti.rahmawati@sekolah.sch.id', '081398765432', '19850722 201001 2 015', 'active'),
('usr-5', 'bk', 'bk123', 'Dewi Lestari, S.Pd.', 'guru_bk', 'dewi.lestari@sekolah.sch.id', '081277889900', '19890414 201402 2 003', 'active'),
('usr-6', 'tendik', 'tendik123', 'Ahmad Subagyo, S.AP.', 'tendik', 'ahmad.subagyo@sekolah.sch.id', '081311223344', '19860615 201101 1 009', 'active'),
('usr-7', 'siswa', 'siswa123', 'Ahmad Fadillah', 'siswa', 'ahmad.fadillah@siswa.sch.id', '085712345678', '0061234567', 'active'),
('usr-8', 'ortu', 'ortu123', 'Bapak Bambang Fadillah', 'orang_tua', 'bambang.f@gmail.com', '081299887766', '0061234567', 'active')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- --------------------------------------------------------
-- Tabel 2: Tenaga Pendidik / Guru (Teachers)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `teachers` (
  `id` VARCHAR(50) NOT NULL,
  `nip` VARCHAR(50) DEFAULT NULL,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `gender` VARCHAR(20) DEFAULT 'Laki-laki',
  `position` VARCHAR(100) DEFAULT 'Guru Mata Pelajaran',
  `status` VARCHAR(50) DEFAULT 'PNS',
  `subjects_json` TEXT DEFAULT NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabel 3: Tenaga Kependidikan / Tendik (Staff)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `staff` (
  `id` VARCHAR(50) NOT NULL,
  `nip` VARCHAR(50) DEFAULT NULL,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `gender` VARCHAR(20) DEFAULT 'Laki-laki',
  `position` VARCHAR(100) NOT NULL,
  `status` VARCHAR(50) DEFAULT 'PNS',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabel 4: Rombongan Belajar / Kelas (Classes)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `classes` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `grade` VARCHAR(20) NOT NULL,
  `major` VARCHAR(100) DEFAULT NULL,
  `academic_year` VARCHAR(50) NOT NULL,
  `homeroom_teacher_name` VARCHAR(150) DEFAULT NULL,
  `homeroom_teacher_id` VARCHAR(50) DEFAULT NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabel 5: Mata Pelajaran (Subjects)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `subjects` (
  `id` VARCHAR(50) NOT NULL,
  `code` VARCHAR(50) DEFAULT NULL,
  `name` VARCHAR(150) NOT NULL,
  `grade` VARCHAR(20) DEFAULT NULL,
  `credits` INT DEFAULT 2,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabel 6: Peserta Didik / Siswa (Students)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `students` (
  `id` VARCHAR(50) NOT NULL,
  `nisn` VARCHAR(50) NOT NULL,
  `nis` VARCHAR(50) DEFAULT NULL,
  `name` VARCHAR(150) NOT NULL,
  `gender` VARCHAR(20) DEFAULT 'L',
  `class_id` VARCHAR(50) DEFAULT NULL,
  `class_name` VARCHAR(50) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `parent_name` VARCHAR(150) DEFAULT NULL,
  `parent_phone` VARCHAR(50) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'Aktif',
  `academic_year` VARCHAR(50) DEFAULT NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_nisn` (`nisn`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabel 7: Jadwal Piket Petugas (Duty Schedules)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `duty_schedules` (
  `id` VARCHAR(100) NOT NULL,
  `day` VARCHAR(20) NOT NULL,
  `academic_year` VARCHAR(50) NOT NULL,
  `semester` VARCHAR(20) NOT NULL,
  `start_date` DATE DEFAULT NULL,
  `end_date` DATE DEFAULT NULL,
  `standby_location` VARCHAR(150) DEFAULT NULL,
  `officers_json` LONGTEXT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabel 8: Berita Acara Jurnal Piket Harian (Duty Journals)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `duty_journals` (
  `id` VARCHAR(100) NOT NULL,
  `journal_date` DATE NOT NULL,
  `journal_day` VARCHAR(20) NOT NULL,
  `academic_year` VARCHAR(50) NOT NULL,
  `semester` VARCHAR(20) NOT NULL,
  `officer1_id` VARCHAR(50) DEFAULT NULL,
  `officer2_id` VARCHAR(50) DEFAULT NULL,
  `officer3_id` VARCHAR(50) DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'published',
  `payload_json` LONGTEXT DEFAULT NULL,
  `published_at` DATETIME DEFAULT NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_date_unique` (`journal_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabel 9: Profil Sekolah (School Profile)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `school_profile` (
  `id` VARCHAR(50) NOT NULL DEFAULT 'main_profile',
  `name` VARCHAR(200) NOT NULL,
  `npsn` VARCHAR(50) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `principal_name` VARCHAR(150) DEFAULT NULL,
  `principal_nip` VARCHAR(50) DEFAULT NULL,
  `payload_json` LONGTEXT DEFAULT NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabel 10: Sinkronisasi Dokumen JSON & Cadangan Cloud
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sispam_cloud_data` (
  `id` VARCHAR(50) NOT NULL,
  `payload` LONGTEXT NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
