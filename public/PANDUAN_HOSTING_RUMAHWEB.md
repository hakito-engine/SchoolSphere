# Panduan Lengkap Hosting SISPAM ke Rumahweb
### Alamat Subdomain: `sispam.hakito.my.id`

Aplikasi **SISPAM** adalah aplikasi web berbasis **React + Vite (Single Page Application)**.
Aplikasi ini dapat di-hosting langsung di layanan **Shared Hosting Rumahweb (cPanel)** tanpa memerlukan VPS dan tanpa perlu menginstal Node.js di server hosting Anda.

---

### RINGKASAN CARA KERJA
1. Aplikasi di-build menjadi file statis (`index.html`, CSS, JavaScript, dan aset gambar).
2. Hasil build tersebut berada di dalam folder **`dist/`**.
3. Anda cukup meng-upload isi folder `dist/` ke **File Manager** cPanel Rumahweb pada folder subdomain `sispam.hakito.my.id`.

---

### LANGKAH DEMI LANGKAH DARI AWAL HINGGA MENGUDARA

#### 1. Persiapan Berkas Build (`dist.zip`)
Pastikan aplikasi sudah dikompilasi ke versi produksi:
```bash
npm run build
```
Hasil build akan berada di dalam folder `dist/`.
Di dalam folder `dist/` sudah otomatis terdapat:
- `index.html` (halaman utama aplikasi)
- `.htaccess` (konfigurasi Apache / LiteSpeed untuk SPA routing dan HTTPS)
- `assets/` (file bundle JavaScript dan CSS)
- Gambar, favicon, dan dokumen pendukung

Kompres seluruh isi folder `dist/` menjadi satu file **`dist.zip`**.

---

#### 2. Membuat Subdomain di cPanel Rumahweb
1. Login ke **ClientZone Rumahweb** atau langsung ke **cPanel** Anda (misalnya melalui `https://cpanel.hakito.my.id` atau URL cPanel yang diberikan Rumahweb di email pendaftaran).
2. Di halaman utama cPanel, pada kolom pencarian ketik **Domains** atau **Subdomains**.
3. Klik menu **Domains** (atau **Subdomains**).
4. Klik tombol **Create A New Domain** (atau isi form pembuatan subdomain):
   - **Domain / Subdomain**: Masukkan `sispam`
   - **Parent Domain**: Pilih `hakito.my.id`
   - **Document Root**: Hilangkan centang *"Share document root"* dan tentukan folder publiknya, biasanya otomatis terisi:
     `public_html/sispam` atau `public_html/sispam.hakito.my.id`.
     *(Catat nama folder ini, karena ini adalah lokasi file website Anda).*
5. Klik **Submit** atau **Create**.

---

#### 3. Upload Berkas ke File Manager
1. Kembali ke beranda cPanel, buka menu **File Manager**.
2. Di sebelah kiri, buka folder **`public_html`** lalu masuk ke folder subdomain yang dibuat tadi (misalnya `public_html/sispam`).
3. Jika di dalam folder tersebut ada file bawaan (seperti `default.html` atau `cgi-bin`), Anda boleh menghapusnya agar folder bersih.
4. Klik tombol **Upload** di bilah menu bagian atas.
5. Pilih atau drag file **`dist.zip`** yang sudah disiapkan. Tunggu bilah progres upload mencapai **100% (berwarna hijau)**.
6. Tutup tab upload, lalu kembali ke File Manager dan klik tombol **Reload**.
7. Klik kanan pada file `dist.zip` lalu pilih **Extract** (Ekstrak Here).
8. **PENTING**: Pastikan file `index.html`, `.htaccess`, dan folder `assets` berada langsung di dalam folder `public_html/sispam/` (bukan di dalam subfolder `public_html/sispam/dist/`). Jika masih di dalam subfolder `dist/`, pindahkan (Move) semua file tersebut keluar ke folder `public_html/sispam/`.

---

#### 4. Memastikan File `.htaccess` Terlihat & Aktif
File `.htaccess` berfungsi agar saat Anda me-refresh halaman (misal di halaman login, nilai, atau rapor) aplikasi tidak menampilkan pesan error *404 Not Found*, serta otomatis mengarahkan akses ke HTTPS yang aman.

1. Di cPanel File Manager, klik tombol **Settings** di pojok kanan atas.
2. Beri tanda centang pada opsi **Show Hidden Files (dotfiles)** lalu klik **Save**.
3. Pastikan file bernama **`.htaccess`** sudah ada di dalam folder tersebut.

---

#### 5. Memasang Sertifikat SSL Gratis (HTTPS)
Agar website memiliki gembok aman hijau (*https://*) dan fitur cetak/PWA berjalan optimal:
1. Di cPanel Rumahweb, cari menu **SSL/TLS Status** atau **Let's Encrypt SSL**.
2. Cari nama subdomain Anda: `sispam.hakito.my.id`.
3. Centang kotak di samping nama `sispam.hakito.my.id`.
4. Klik tombol **Run AutoSSL** (atau klik **Issue** pada Let's Encrypt).
5. Tunggu 1–3 menit hingga sistem selesai menerbitkan sertifikat SSL.

---

#### 6. Pengaturan DNS (Jika Domain di Kelola Terpisah)
- **Jika domain `hakito.my.id` dan hosting berada di akun Rumahweb yang sama**:
  DNS A Record untuk `sispam.hakito.my.id` biasanya sudah otomatis terhubung saat Anda membuat subdomain di cPanel.
- **Jika domain dikelola melalui Cloudflare atau penyedia DNS luar**:
  1. Buka dashboard DNS Anda (misal Cloudflare).
  2. Tambahkan DNS Record baru:
     - **Type**: `A`
     - **Name**: `sispam`
     - **IPv4 Address**: Masukkan IP Hosting Rumahweb Anda (dapat dilihat di sidebar kanan cPanel pada bagian *Shared IP Address*).
     - **Proxy status**: DNS Only (atau Proxied).
     - Simpan (Save).

---

#### 7. Selesai! Uji Coba Aplikasi
Buka peramban web (Google Chrome / Mozilla Firefox / Safari) dan akses:
**`https://sispam.hakito.my.id`**

Aplikasi **SISPAM** kini telah mengudara resmi dan dapat diakses dari perangkat manapun oleh Guru, Siswa, Orang Tua, dan Administrator Sekolah!
