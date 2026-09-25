# Production Deployment Runbook

Dokumen ini berisi langkah deploy website LSP FIT ke server production, termasuk konfigurasi server, database, upload assets, dan checklist validasi.

## Scope Deploy

Deploy production mencakup:

- File website publik.
- Endpoint API di folder `api/`.
- Halaman admin.
- Struktur dan isi database MySQL.
- Folder upload kegiatan, anggota, mitra, profile, dan homepage.
- Konfigurasi koneksi database server.

## File Penting

- `DEPLOY.md` — langkah setup awal dan alur update sehari-hari (mulai dari sini).
- `deploy.sh` — script deployment di server (backup, update, migration, health check, rollback).
- `scripts/deploy-local.ps1` — peluncur dari Windows lewat SSH.
- `database/schema.sql` untuk struktur awal database (5 tabel, selalu jalankan untuk instalasi baru).
- `database/seed_lsp_fit_content.sql` untuk konten awal (sekali jalan, hanya database kosong).
- `database/migrations/` untuk perubahan bertahap pada database yang sudah ada.
- `config/config.example.php` sebagai template konfigurasi server.
- `docs/backend-setup.md` untuk alur instalasi lokal dan production.
- `docs/deploy-database.md` untuk detail export/import database.
- `assets/uploads/{kegiatan,anggota,mitra,profile,homepage}` untuk file upload.

## Persyaratan Server

| Komponen | Persyaratan |
| --- | --- |
| Web server | Apache 2.4 (aturan `.htaccess` memakai sintaks `Require`) |
| Modul Apache | `mod_rewrite` aktif; `mod_mime` aktif |
| `AllowOverride` | `All` (atau minimal `FileInfo AuthConfig Limit Options Indexes`) untuk document root |
| PHP | 7.3 atau lebih baru (array-form `session_set_cookie_params`) |
| Ekstensi PHP | `pdo_mysql`, `fileinfo`, `mbstring`, `json`, `session` |
| MySQL | 5.7+ atau MariaDB 10.3+, charset `utf8mb4` |
| Disk | Cadangan ruang untuk file video MP4 sampai 50 MB per upload |

Jika memakai Nginx, `.htaccess` **tidak berlaku**. Seluruh aturan di `.htaccess` harus diterjemahkan ke blok `server {}` secara manual.

### Konfigurasi PHP untuk upload video 50 MB

```ini
upload_max_filesize = 50M
post_max_size = 64M
max_input_time = 300
max_execution_time = 300
```

- `post_max_size` harus **lebih besar** dari `upload_max_filesize` karena overhead multipart.
- Batas body reverse proxy/Nginx/Apache (`client_max_body_size`, `LimitRequestBody`, `FcgidIOTimeout`) minimal 64M.
- Pastikan `upload_tmp_dir` (atau direktori `sys_get_temp_dir()`) punya ruang bebas dan boleh ditulis PHP.

## Blokade File Privat

Document root proyek adalah root repository, sehingga folder non-publik bisa terjangkau HTTP. `.htaccess` sudah memblokir:

```text
/scripts/      /database/     /docs/      /config/
/node_modules/ /.git/         *.sql *.md *.env *.log *.ini *.bak *.sh *.yml
```

Halaman ini wajib diverifikasi setelah deploy:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://domain-anda/database/schema.sql
curl -s -o /dev/null -w "%{http_code}\n" https://domain-anda/scripts/setup-local-db.php
curl -s -o /dev/null -w "%{http_code}\n" https://domain-anda/docs/deploy-database.md
curl -s -o /dev/null -w "%{http_code}\n" https://domain-anda/config/config.php
```

Semua harus membalas `404` atau `403` — bukan `200` (folder diblokir `RewriteRule` membalas 404, file yang ditolak `FilesMatch` membalas 403).

Catatan:

- Jangan deploy folder `scripts/`, `database/`, `docs/`, dan `node_modules/` ke document root bila hosting memungkinkan struktur lain.
- `scripts/setup-local-db.php` juga menolak eksekusi di luar CLI, tetapi blokade HTTP tetap wajib.
- `php -S 127.0.0.1:8000 router.php` (development) **mengabaikan `.htaccess`**. Validasi blokade hanya bisa dilakukan di Apache.

## Konfigurasi Database

Copy file contoh konfigurasi:

```bash
cp config/config.example.php config/config.php
```

Isi `config/config.php` sesuai credential production:

```php
<?php
return [
    'db_host' => 'localhost',
    'db_name' => 'lsp_compro',
    'db_user' => 'production_database_user',
    'db_pass' => 'production_database_password',
];
```

Catatan:

- Login admin **hanya dibaca dari tabel `admin_users`**. Tidak ada fallback password di `config.php`, jadi `admin_username` dan `admin_password_hash` tidak lagi dipakai.
- Jangan commit `config/config.php` ke repository.
- Jangan memakai user MySQL `root` di production.

## Export Database Lokal

Jalankan dari environment lokal. Di PowerShell, pakai `--result-file` agar encoding tidak rusak:

```powershell
mysqldump -u root -p --default-character-set=utf8mb4 --single-transaction --routines --triggers --result-file="database\backup-local-lsp-fit.sql" lsp_compro
```

Jika MySQL lokal tidak memakai password:

```powershell
mysqldump -u root --default-character-set=utf8mb4 --single-transaction --routines --triggers --result-file="database\backup-local-lsp-fit.sql" lsp_compro
```

Di Bash:

```bash
mysqldump -u root -p --default-character-set=utf8mb4 --single-transaction --routines --triggers lsp_compro > backup-local-lsp-fit.sql
```

File backup berisi data lokal dan hash password admin:

- Jangan commit file backup SQL ke repository.
- Simpan file hanya untuk proses migrasi/deploy.
- **Hindari `>` di PowerShell lama** karena dapat merusak encoding dump.

## Import Database Production

1. Backup database production terlebih dahulu ke lokasi **di luar web root**:

   ```bash
   mysqldump -u production_database_user -p --single-transaction --routines --triggers \
     lsp_compro > /home/user/private-backups/lsp-compro-$(date +%Y%m%d-%H%M%S).sql
   ```

2. Verifikasi file backup ada dan berisi data:

   ```bash
   ls -lh /home/user/private-backups/
   ```

3. Upload `backup-local-lsp-fit.sql` ke lokasi privat tersebut (bukan `public_html`), lalu import:

   ```bash
   mysql -u production_database_user -p lsp_compro < /home/user/private-backups/backup-local-lsp-fit.sql
   ```

   Di PowerShell:

   ```powershell
   cmd /c "mysql -u production_database_user -p lsp_compro < backup-local-lsp-fit.sql"
   ```

4. Setelah import sukses, hapus dump dari server dan pastikan URL-nya membalas 404.

Import juga bisa dilakukan lewat phpMyAdmin: pilih database production → tab `Import` → upload file → charset `utf8mb4`. Kalau file pernah diunggah ke server, hapus setelah selesai.

Detail penanganan instalasi baru vs upgrade database lama ada di `docs/deploy-database.md`.

## Upload Assets

Folder berikut wajib ikut tersedia di server:

```text
assets/uploads/kegiatan    gambar kegiatan
assets/uploads/anggota     foto anggota
assets/uploads/mitra       logo mitra
assets/uploads/profile     video perkenalan MP4
assets/uploads/homepage    gambar hero beranda
```

File upload runtime tidak ikut repository (hanya `.gitkeep` dan `.htaccess`), jadi **harus di-backup dan di-transfer secara terpisah**.

### Permission dan ownership

PHP production umumnya berjalan sebagai user berbeda dari user SSH (misalnya `www-data`). Permission harus ditinjau dari sisi user PHP:

```bash
chown -R deploy-user:www-data assets/uploads
chmod -R 2775 assets/uploads
find assets/uploads -type f -exec chmod 664 {} \;
```

- `2775` = group write + setgid (file baru otomatis mewarisi group).
- Bila penyedia hosting memakai suatu user khusus, sesuaikan owner/group-nya.
- Jangan memakai `777`.
- Verifikasi dengan user yang sama dengan proses PHP, misalnya `sudo -u www-data touch assets/uploads/homepage/.write-test`.

## Password Admin Production

Login admin selalu dibaca dari tabel `admin_users`. Buat hash password yang unik:

```bash
php -r "echo password_hash('password_admin_baru', PASSWORD_DEFAULT), PHP_EOL;"
```

Update user admin di database:

```sql
UPDATE admin_users
SET password_hash = 'PASTE_HASH_BARU_DI_SINI',
    role = 'super_admin',
    is_active = 1
WHERE username = 'admin';
```

Jika user belum ada:

```sql
INSERT INTO admin_users (username, name, password_hash, role, is_active)
VALUES ('admin', 'Super Admin LSP FIT', 'PASTE_HASH_BARU_DI_SINI', 'super_admin', 1);
```

Wajib:

- Hash production berbeda dari password lokal (`admin123`).
- Tidak ada file konfigurasi yang menyimpan hash contoh.

## Urutan Deploy

Langkah setup awal (repository, database, vhost, SSL, admin) dijelaskan di `DEPLOY.md`. Untuk update rutin, seluruh langkah berikut dijalankan oleh `deploy.sh`:

1. **Preflight** — `config/config.php` valid, tool tersedia, working tree bersih, branch sesuai.
2. **Backup** — dump database (`db-<ts>.sql.gz`) dan `assets/uploads` (`uploads-<ts>.tgz`) ke `/var/backups/lspfit` (di luar web root), simpan 5 versi terakhir, catat SHA sebelum deploy.
3. **Update kode** — `git fetch` + `merge --ff-only`. Gagal otomatis bila working tree kotor atau branch salah.
4. **Database** — deteksi isi tabel; seed hanya dijalankan saat database kosong, migration dicatat di `_schema_migrations` agar tidak dijalankan dua kali. `20260924_rebrand_lsp_fit.sql` tidak pernah jalan otomatis tanpa `--allow-destructive`.
5. **Permission** — buat 5 folder `assets/uploads/*`, set owner/group ke user PHP, mode `2775`. File upload yang sudah ada tidak disentuh.
6. **Validasi kode** — `php -l` seluruh file `api/` dan `scripts/`.
7. **Reload** — `apache2ctl -t` lalu reload (auto-detect `httpd`/`nginx`, reload PHP-FPM bila ada).
8. **Health check** — 10 endpoint harus `200`; 5 path privat harus `403`/`404`. Gagal → kode otomatis dikembalikan ke SHA sebelumnya.

```bash
./deploy.sh doctor            # sekali, setelah setup awal
./deploy.sh deploy --dry-run  # lihat rencana
./deploy.sh deploy            # deploy penuh
./deploy.sh rollback --yes    # restore backup terakhir
```

Dari Windows:

```powershell
.\scripts\deploy-local.ps1 -Target user@ip -RemoteDir /var/www/sertifikasifit.com
```

Masih manual (sekali saja): membuat database/user, `config/config.php`, import awal, vhost + SSL, dan membuat user admin. Rinciannya di `DEPLOY.md`.

Hal yang tetap di luar deploy script: isi upload (di-upload admin lewat browser), credential `config/config.php`, dan password admin.

## Validasi API

```text
GET /api/kegiatan.php
GET /api/anggota.php
GET /api/profile.php
GET /api/auth.php
GET /api/homepage.php
GET /api/partners.php
```

Target validasi:

- Semua endpoint membalas 200 dan mengembalikan JSON.
- `/api/kegiatan.php` mengembalikan 11 skema sertifikasi dalam tiga kelompok.
- `/api/auth.php` (GET) membalas `authenticated:false` sebelum login.
- Login admin melalui `POST /api/auth.php` (`action=login`) membalas 200.
- Password production yang lama ditolak (401), yang baru diterima.

## Validasi Halaman

```text
/admin
/admin-dashboard
/admin-kegiatan
/admin-anggota
/admin-mitra
/admin-profil
/admin-homepage
/index
/kegiatan
/kegiatan-detail
/anggota
/aboutus
/kontak
```

Target validasi:

- `/admin` membalas 200 dan mengarah ke form login.
- Admin bisa login, lalu tambah, edit, highlight, dan hapus kegiatan.
- Admin bisa tambah, edit, hide, tampilkan, dan hapus anggota.
- Admin bisa kelola logo mitra dan gambar hero homepage.
- Admin bisa mengubah profil website serta mengganti video perkenalan.
- Data kegiatan tampil dari database, tersusun 3 + 4 + 4 kartu.
- Gambar dan video tampil dari path upload yang benar.

### Validasi upload video 50 MB

1. Upload MP4 berukuran mendekati 50 MB dari `/admin-profil`.
2. Pastikan upload diterima dan file muncul di `assets/uploads/profile/`.
3. Buka `/aboutus` dan pastikan video autoplay (muted) tampil.
4. Uji juga file sedikit di atas 50 MB, harus **ditolak** dengan pesan jelas.

## Rollback

Bila health check gagal saat `deploy.sh deploy`, **kode otomatis dikembalikan** ke commit sebelum deploy. Database tidak di-restore otomatis.

Untuk mengembalikan semuanya (database, `assets/uploads`, dan kode) ke kondisi sebelum deploy terakhir:

```bash
./deploy.sh rollback --yes
```

Backup tersimpan di `/var/backups/lspfit` (`db-<ts>.sql.gz`, `uploads-<ts>.tgz`, `prev-sha-<ts>`), tersimpan 5 versi terakhir. Pilih versi lain dengan `--backup=<ts>`.

Cara manual bila diperlukan:

1. Restore database dari `db-<ts>.sql.gz` production terakhir.
2. Kembalikan folder `assets/uploads/*` dari `uploads-<ts>.tgz`.
3. Kembalikan code: `git reset --hard <SHA_SEBELUMNYA>`.
4. Pastikan `config/config.php` tidak berubah ke credential yang salah.
5. Cek ulang permission folder upload.
6. Ulangi health check API dan halaman.

## Catatan Keamanan

- Jangan commit `config/config.php`.
- Jangan commit file backup SQL.
- Jangan commit file upload runtime kecuali `.gitkeep` dan `.htaccess`.
- Jangan deploy `scripts/`, `database/`, `docs/`, dan `node_modules/` ke document root bila memungkinkan.
- Gunakan password admin production yang berbeda dari password lokal.
- Backup database dan upload sebelum import data baru.
- Selalu uji di staging dengan Apache yang sama sebelum mengganti production.

## Rekomendasi Lanjutan

Belum diterapkan, tetapi disarankan untuk production:

- HTTPS wajib, cookie sesi dengan `Secure`, dan token CSRF untuk endpoint mutasi.
- Migration ledger otomatis agar urutan migration tidak bergantung pada catatan operator.
- Document root terpisah (`public/`) agar folder privat tidak berada di bawah web root.
