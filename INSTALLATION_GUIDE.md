# PANDUAN LENGKAP INSTALASI & DEPLOYMENT APLIKASI WEB
## SchoolSphere Enterprise - Sistem Informasi Manajemen Sekolah Modern

Dokumen ini berisi panduan resmi langkah demi langkah untuk menginstalasi, mengompilasi, dan menjalankan aplikasi web **SchoolSphere Enterprise** agar dapat berjalan optimal, cepat, aman, dan tanpa kendala pada berbagai lingkungan hosting dan server web.

---

### DAFTAR ISI
1. [Prasyarat Sistem (System Requirements)](#1-prasyarat-sistem)
2. [Langkah Instalasi & Kompilasi Produksi (Build)](#2-langkah-instalasi--kompilasi-produksi)
3. [Konfigurasi Web Server Nginx (Disarankan)](#3-konfigurasi-web-server-nginx)
4. [Konfigurasi Web Server Apache (.htaccess)](#4-konfigurasi-web-server-apache)
5. [Konfigurasi Firebase Hosting (Cloud Hosting)](#5-konfigurasi-firebase-hosting)
6. [Deployment Kontainer Docker](#6-deployment-kontainer-docker)
7. [Pemasangan Sertifikat Keamanan SSL/HTTPS Gratis (Let's Encrypt)](#7-pemasangan-sertifikat-sslhttps-gratis)
8. [Panduan PWA (Progressive Web App) di Web & Ponsel](#8-panduan-pwa-instalasi-aplikasi)
9. [Troubleshooting & Pemecahan Masalah](#9-troubleshooting--pemecahan-masalah)

---

### 1. PRASYARAT SISTEM

Untuk menjalankan dan mengompilasi aplikasi ini, pastikan server atau komputer Anda memenuhi kualifikasi minimum berikut:
- **Node.js**: Versi **18.x** atau **20.x LTS** (Node 20 disarankan).
- **NPM**: Versi **9.x** atau lebih tinggi (bawaan Node.js).
- **RAM Server**: Minimum **1 GB** (2 GB disarankan untuk proses kompilasi awal).
- **Sistem Operasi**: Linux (Ubuntu 20.04/22.04 LTS, Debian 11/12, CentOS, Rocky Linux), Windows Server, atau macOS.
- **Web Server**: Nginx, Apache 2.4+, Caddy, atau platform cloud hosting (Firebase, Vercel, Netlify, Cloud Run).
- **Peramban Klien (Client Browser)**: Google Chrome (v90+), Microsoft Edge (v90+), Mozilla Firefox (v90+), Safari (v15+).

---

### 2. LANGKAH INSTALASI & KOMPILASI PRODUKSI

Ikuti langkah-langkah di terminal server:

#### Langkah 2.1: Unduh / Kloning Repositori
```bash
# Kloning repositori kode sumber
git clone https://github.com/sekolah/schoolsphere-app.git

# Masuk ke direktori aplikasi
cd schoolsphere-app
```

#### Langkah 2.2: Instal Dependensi NPM
```bash
# Instal seluruh paket pustaka yang dibutuhkan
npm install
```

#### Langkah 2.3: Uji Coba di Mode Pengembangan (Development Server)
```bash
# Menjalankan server pengembang lokal pada port 3000
npm run dev -- --host 0.0.0.0 --port 3000
```
Buka peramban di `http://localhost:3000` atau `http://IP-SERVER:3000` untuk memverifikasi aplikasi berjalan.

#### Langkah 2.4: Kompilasi Berkas Produksi (Production Build)
```bash
# Mengompilasi aplikasi menjadi berkas statis teroptimasi (HTML, JS, CSS)
npm run build
```
Hasil kompilasi akan otomatis disimpan di dalam direktori **`dist/`**. Seluruh isi folder `dist/` ini siap dipindahkan ke direktori publik web server Anda (misal: `/var/www/schoolsphere/html`).

---

### 3. KONFIGURASI WEB SERVER NGINX (DISARANKAN)

Karena aplikasi ini dibangun dengan arsitektur **Single Page Application (SPA)** berbasis React dan Vite, web server harus mengarahkan seluruh rute URL (seperti `/attendance`, `/teachers`, `/settings`) kembali ke `index.html`. Jika tidak, pengguna akan mengalami galat **HTTP 404 Not Found** saat me-refresh halaman.

#### Contoh Berkas Konfigurasi Nginx:
Buat berkas konfigurasi di `/etc/nginx/sites-available/schoolsphere.conf`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name sman1nusantara.sch.id www.sman1nusantara.sch.id;

    # Lokasi berkas hasil build (folder dist)
    root /var/www/schoolsphere/dist;
    index index.html;

    # Kompresi Gzip untuk performa kecepatan tinggi
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    # Penanganan SPA Routing (WAJIB agar refresh tidak 404)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Caching aset statis (JavaScript, CSS, Gambar, Font)
    location ~* \.(?:ico|css|js|gif|jpe?g|png|woff2?|eot|ttf|svg|webp)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # Header Keamanan
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Halaman galat kustom
    error_page 404 /index.html;
}
```

#### Aktifkan dan Restart Nginx:
```bash
# Aktifkan symlink
sudo ln -s /etc/nginx/sites-available/schoolsphere.conf /etc/nginx/sites-enabled/

# Uji sintaks konfigurasi
sudo nginx -t

# Muat ulang konfigurasi Nginx
sudo systemctl reload nginx
```

---

### 4. KONFIGURASI WEB SERVER APACHE (.HTACCESS)

Jika menggunakan server Apache HTTP (misalnya cPanel, DirectAdmin, atau LAMP Stack):
1. Salin seluruh isi folder `dist/` ke direktori `public_html/`.
2. Pastikan modul `mod_rewrite` Apache telah aktif (`sudo a2enmod rewrite`).
3. Buat berkas bernama **`.htaccess`** di dalam folder `public_html/` dengan isi:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Jika berkas atau folder fisik tidak ditemukan, alihkan ke index.html
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Caching aset statis untuk menghemat kuota & mempercepat akses
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

---

### 5. KONFIGURASI FIREBASE HOSTING (CLOUD HOSTING)

Aplikasi dapat di-deploy ke Firebase Hosting secara gratis dengan integrasi CDN Google Cloud berkecepatan tinggi:

#### Berkas `firebase.json`:
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

#### Perintah Deploy Firebase:
```bash
# Login ke Firebase CLI
firebase login

# Inisialisasi dan Deploy
npm run build
firebase deploy --only hosting
```

---

### 6. DEPLOYMENT KONTAINER DOCKER

Untuk deployment berbasis Docker & Kubernetes:

#### Buat Berkas `Dockerfile`:
```dockerfile
# Tahap 1: Build aplikasi
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Tahap 2: Runtime Nginx ringan (Alpine)
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Konfigurasi SPA rewrite Nginx
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Jalankan Kontainer:
```bash
# Build Docker image
docker build -t schoolsphere:latest .

# Jalankan container pada port 80
docker run -d -p 80:80 --name schoolsphere-web schoolsphere:latest
```

---

### 7. PEMASANGAN SERTIFIKAT SSL/HTTPS GRATIS (LET'S ENCRYPT)

Sertifikat SSL/TLS wajib digunakan agar aplikasi dapat berjalan dengan aman (HTTPS) serta mengaktifkan fitur PWA & Service Worker.

```bash
# Instal Certbot dan Plugin Nginx
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Minta dan pasang sertifikat otomatis untuk domain sekolah
sudo certbot --nginx -d sman1nusantara.sch.id -d www.sman1nusantara.sch.id

# Verifikasi pembaruan otomatis (Auto-renewal)
sudo certbot renew --dry-run
```

---

### 8. PANDUAN PWA (PROGRESSIVE WEB APP) DI WEB & PONSEL

SchoolSphere telah dilengkapi dengan kapabilitas **Progressive Web App (PWA)**:
1. **Di Komputer (Chrome / Edge / Safari Desktop)**:
   - Akses website sekolah melalui HTTPS.
   - Perhatikan ikon **"Install App"** (tanda komputer dengan panah ke bawah) di ujung kanan bilah alamat (address bar).
   - Klik **Install**, aplikasi akan terpasang di desktop seperti aplikasi native tanpa bilah alamat browser.
2. **Di Ponsel Pintar (Android / iOS)**:
   - Buka website sekolah di peramban Chrome atau Safari ponsel.
   - Ketuk menu titik tiga (Android) atau tombol Share (iOS).
   - Pilih opsi **"Tambahkan ke Layar Utama" (Add to Home Screen)**.
   - Ikon aplikasi SchoolSphere akan muncul di menu ponsel dan siap dibuka kapan saja secara responsif.

---

### 9. PANDUAN DEPLOY KE GITHUB PAGES (SOLUSI LAYAR PUTIH / BLANK SCREEN)

Jika Anda mempublikasikan aplikasi ini ke **GitHub Pages**, ikuti langkah berikut agar tidak terjadi kendala layar putih kosong (*blank screen*):

#### Mengapa Terjadi Layar Putih?
Layar putih terjadi jika Anda memilih *"Deploy from a branch (root)"*. GitHub Pages menyajikan file `index.html` mentah yang mencoba memuat file TypeScript `src/main.tsx`. Browser standar tidak dapat mengeksekusi file TypeScript mentah tanpa proses build Vite terlebih dahulu.

#### Solusi Resmi Menggunakan GitHub Actions (3 Langkah):
1. **Atur Sumber Pages ke GitHub Actions:**
   - Masuk ke repositori GitHub Anda di browser.
   - Buka menu **Settings** > **Pages**.
   - Pada bagian **Build and deployment** > **Source**, pilih **"GitHub Actions"**.
   - *Catatan:* Jika muncul daftar *"Suggested workflows"* (seperti Static HTML / Next.js), **JANGAN dipilih / abaikan saja** karena workflow khusus Vite sudah tersedia di `.github/workflows/deploy.yml`.

2. **Jalankan Proses Build (Run Workflow):**
   - Klik tab **Actions** di bilah menu atas repositori GitHub Anda.
   - Di bilah samping kiri, klik nama workflow **"Deploy SchoolSphere to GitHub Pages"**.
   - Di pojok kanan atas, klik tombol dropdown **"Run workflow"** > pilih branch `main` (atau `master`) > klik tombol hijau **"Run workflow"**.

3. **Buka Aplikasi Setelah Selesai (Centang Hijau ✅):**
   - Proses build akan berjalan sekitar 1–2 menit hingga muncul ikon centang hijau ✅.
   - Buka tautan GitHub Pages Anda (misal `https://username.github.io/SchoolSphere/`).
   - Tekan `Ctrl + F5` (Windows) atau `Cmd + Shift + R` (Mac) untuk refresh browser tanpa cache. Aplikasi akan langsung tampil sempurna!

#### Tips Izin Alur Kerja (Workflow Permissions):
Jika workflow di tab Actions menampilkan status gagal (*Permission Denied*), aktifkan izin:
- Buka **Settings** > **Actions** > **General** > gulir ke bagian **Workflow permissions**.
- Pilih opsi **"Read and write permissions"** > klik tombol **Save**.

---

### 10. TROUBLESHOOTING & PEMECAHAN MASALAH

| Gejala Galat | Penyebab | Solusi |
|---|---|---|
| **Layar putih di GitHub Pages** | Belum menjalankan workflow build GitHub Actions. | Buka tab **Actions** di GitHub, klik *"Deploy SchoolSphere to GitHub Pages"*, lalu klik *"Run workflow"*. Tunggu centang hijau ✅. |
| **Halaman 404 saat di-refresh** | Web server belum dikonfigurasi untuk SPA Rewrite. | Tambahkan baris `try_files $uri $uri/ /index.html;` pada Nginx atau aturan Rewrite pada `.htaccess` Apache. |
| **Tampilan kosong / Blank putih** | Kesalahan base URL atau berkas JS terblokir. | Pastikan `base: './'` atau `base: '/'` sesuai dengan lokasi sub-direktori hosting Anda di `vite.config.ts`. |
| **Port 3000 sudah terpakai** | Port bentrok dengan layanan lain. | Jalankan `npx kill-port 3000` atau gunakan flag `--port 3001` saat menjalankan `npm run dev`. |
| **PWA tidak muncul opsi install** | Website belum menggunakan protokol HTTPS resmi. | Pasang sertifikat SSL (HTTPS) menggunakan Let's Encrypt / Cloudflare SSL. |
| **Logo atau Kop tidak tersimpan** | Izin localStorage peramban dinonaktifkan. | Periksa izin cookies dan Local Storage di browser klien atau gunakan fitur Ekspor Cadangan (.json) di menu Pengaturan. |

---

*Hak Cipta © 2024–2026 Tim Pengembang SchoolSphere Enterprise. Panduan ini dirancang untuk kelancaran operasional teknologi informasi sekolah.*
