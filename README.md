# MIRZA - Maintenance Integrated Reliability System and Automation
PT Solusi Bangun Indonesia Tbk — Plant Narogong

Sistem pelaporan & monitoring RCA (Root Cause Analysis) dan Hierarchical Action Plans terintegrasi dengan database **PostgreSQL**.

---

## 🚀 Panduan Menjalankan Sistem

### 1. Prasyarat
- **Node.js** (v18 atau lebih baru)
- **PostgreSQL** (Lokal di komputer Anda ATAU Cloud PostgreSQL gratis seperti [Neon.tech](https://neon.tech) / [Supabase](https://supabase.com))

---

### 2. Opsi Database PostgreSQL

#### Opsi A: Menggunakan PostgreSQL Lokal (Windows)
1. Jika belum memiliki PostgreSQL, unduh dan install dari [postgresql.org/download/windows](https://www.postgresql.org/download/windows/) atau via winget:
   ```powershell
   winget install PostgreSQL.PostgreSQL.16
   ```
2. Pastikan service PostgreSQL berjalan di port `5432`.
3. Buka file `.env` atau `server/.env`, lalu sesuaikan password PostgreSQL Anda:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=coba_mirza
   DB_USER=postgres
   DB_PASSWORD=password_postgres_anda
   ```

#### Opsi B: Menggunakan Cloud PostgreSQL (Cepat, Tanpa Install Lokal)
1. Buat database gratis di [Neon](https://neon.tech) atau [Supabase](https://supabase.com).
2. Salin connection string PostgreSQL yang diberikan.
3. Buka file `.env` atau `server/.env`, lalu tambahkan:
   ```env
   DATABASE_URL=postgresql://username:password@ep-host.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

---

### 3. Setup Database Otomatis
Jalankan wizard inisialisasi database (memeriksa database, membuat tabel `rcas`, dan mengisi data awal):
```bash
npm run setup-db
```

---

### 4. Menjalankan Website & Server
Jalankan perintah berikut:
```bash
npm start
```
Buka browser dan akses:
👉 **[http://localhost:5000](http://localhost:5000)**

---

## 📁 Struktur Proyek
- `index.html` : Halaman antarmuka utama MIRZA (React 18 + Tailwind CSS).
- `app.js` : Komponen frontend React (Dashboard, Form RCA, Grafik Progres, Ekspor Laporan).
- `style.css` : Tema industri PT Solusi Bangun Indonesia & styling cetak PDF.
- `server/server.js` : Express API backend + Static server yang terhubung ke PostgreSQL.
- `server/db.js` : Konfigurasi koneksi pool PostgreSQL & inisialisasi tabel `rcas`.
- `server/setup_db.js` : Skrip wizard mandiri untuk menguji dan menginisialisasi database PostgreSQL.
- `server/.env` : File konfigurasi kredensial database.

