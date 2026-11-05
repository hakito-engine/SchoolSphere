<?php
/**
 * Konfigurasi Koneksi Database MySQL SISPAM
 * Lokasi: public_html/db_config.php (atau public_html/sispam/db_config.php)
 * 
 * Sesuaikan nilai di bawah ini dengan Database & User yang Anda buat di cPanel MySQL Databases:
 */
return [
    'host'          => 'localhost',
    'port'          => 3306,
    'database'      => 'nama_cpanel_sispam',  // Contoh: hakitomy_sispam
    'username'      => 'nama_cpanel_admin',   // Contoh: hakitomy_admin
    'password'      => 'PasswordDatabase123!',// Password user database Anda
    'configured_at' => date('Y-m-d H:i:s')
];
