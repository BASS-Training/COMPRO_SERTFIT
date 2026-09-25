# Panduan Deploy Database LSP FIT

Dokumen ini dipakai saat memindahkan data dari MySQL lokal ke MySQL live server.

## 1. Data yang Perlu Dibawa ke Server

Saat deploy, yang perlu dipindahkan bukan hanya file website, tetapi juga:

- Struktur database dari `database/schema.sql` (5 tabel: `kegiatan`, `admin_users`, `anggota`, `site_settings`, `partners`).
- Isi database lokal, terutama tabel `kegiatan`, `anggota`, `partners`, `site_settings`, dan `admin_users`.
- Folder upload:
  - `assets/uploads/kegiatan`
  - `assets/uploads/anggota`
  - `assets/uploads/mitra`
  - `assets/uploads/profile`
  - `assets/uploads/homepage`
- File konfigurasi server: `config/config.php` (dibuat di server, tidak ikut repo).

## 2. Buat Database di Server

Buat database dan user MySQL dari panel hosting atau terminal server. Jangan memakai user `root` di production.

Contoh nama database:

```text
lsp_compro
```

Contoh data yang perlu disiapkan:

```text
DB_HOST=localhost
DB_NAME=lsp_compro
DB_USER=nama_user_database
DB_PASS=password_database
```

## 3. Pilih Jalur: Instalasi Baru atau Upgrade Database Lama

### Jalur A — Instalasi baru (database kosong)

Ikuti urutan ini saja. **Jangan** menjalankan migration lama: seluruh struktur sudah ada di `schema.sql`.

1. `database/schema.sql`
2. `database/seed_lsp_fit_content.sql` (sekali jalan: 11 skema, anggota, mitra, pengaturan)
3. `database/migrations/20260925_dynamic_about_media.sql` (opsional, idempoten)
4. `database/migrations/20260925_restore_scheme_groups.sql` (opsional, idempoten)
5. Buat user admin dengan hash unik (lihat bagian 7).

Detail langkah ada di `docs/backend-setup.md`.

### Jalur B — Upgrade database yang sudah berisi data

Backup dulu (bagian 4), lalu jalankan **hanya** file yang prasyaratnya belum terpenuhi:

| File | Klasifikasi | Prasyarat |
| --- | --- | --- |
| `20260619_add_kegiatan_highlight.sql` | TIDAK idempoten | hanya bila kolom `is_highlight` belum ada |
| `20260622_create_admin_users.sql` | TIDAK idempoten | hanya bila tabel `admin_users` belum ada |
| `20260622_create_members_and_settings.sql` | TIDAK idempoten | hanya bila `anggota`/`site_settings` belum ada |
| `20260630_create_partners.sql` | idempoten | hanya bila tabel `partners` belum ada |
| `20260924_rebrand_lsp_fit.sql` | **DESTRUKTIF** | backup wajib, lihat peringatan di bawah |
| `20260924_lsp_fit_content.sql` | idempoten | aman dijalankan ulang |
| `20260925_dynamic_about_media.sql` | idempoten | aman dijalankan ulang |
| `20260925_restore_scheme_groups.sql` | idempoten | aman dijalankan ulang |

> **PERINGATAN — `20260924_rebrand_lsp_fit.sql`**
> File ini menjalankan `DELETE FROM kegiatan`, `DELETE FROM anggota`, dan `DELETE FROM partners`.
> Jalankan **hanya** bila database memang berasal dari konten lama dan boleh ditimpa.
> Wajib: backup penuh, verifikasi file backup terbaca, dan siapkan rencana restore.
> Pastikan migration pembuatan tabel (`anggota`, `partners`, `site_settings`) sudah dijalankan lebih dulu,
> karena statement pertama sudah menghapus data sebelum script gagal.

### Cara mengecek prasyarat

```sql
SHOW COLUMNS FROM kegiatan LIKE 'is_highlight';
SHOW TABLES LIKE 'admin_users';
SHOW TABLES LIKE 'anggota';
SHOW TABLES LIKE 'site_settings';
SHOW TABLES LIKE 'partners';
```

## 4. Backup Database Sebelum Apa Pun

Backup selalu ke lokasi **di luar web root**:

```bash
mkdir -p /home/user/private-backups
mysqldump -u nama_user_database -p --default-character-set=utf8mb4 \
  --single-transaction --routines --triggers \
  --result-file="/home/user/private-backups/lsp-compro-$(date +%Y%m%d-%H%M%S).sql" lsp_compro
```

```bash
ls -lh /home/user/private-backups/
```

Catatan:

- Simpan timestamp nama file untuk rollback.
- Simpan upload folder pada waktu yang sama: `tar -czf uploads-$(date +%Y%m%d).tgz assets/uploads`.
- Uji restore ke database sementara sebelum mengandalkan backup tersebut.
- Jangan simpan backup di `public_html`, `htdocs`, atau folder mana pun yang bisa diakses HTTP.

## 5. Export Database Lokal

Jalankan dari komputer lokal yang memiliki database `lsp_compro`.

### PowerShell (disarankan untuk Windows)

`--result-file` menghindari kerusakan encoding akibat operator `>`:

```powershell
mysqldump -u root -p --default-character-set=utf8mb4 --single-transaction --routines --triggers --result-file="database\backup-local-lsp-fit.sql" lsp_compro
```

Jika user MySQL lokal tidak memakai password:

```powershell
mysqldump -u root --default-character-set=utf8mb4 --single-transaction --routines --triggers --result-file="database\backup-local-lsp-fit.sql" lsp_compro
```

### Bash

```bash
mysqldump -u root -p --default-character-set=utf8mb4 --single-transaction --routines --triggers lsp_compro > backup-local-lsp-fit.sql
```

Catatan:

- File ini berisi data lokal dan hash password admin.
- Jangan commit file backup SQL ke GitHub.
- Jangan unggah file ini ke document root.

## 6. Upload File ke Server

Upload berikut:

```text
backup-local-lsp-fit.sql   -> folder privat di luar web root
assets/uploads/kegiatan     -> public_html/assets/uploads/kegiatan
assets/uploads/anggota      -> public_html/assets/uploads/anggota
assets/uploads/mitra        -> public_html/assets/uploads/mitra
assets/uploads/profile      -> public_html/assets/uploads/profile
assets/uploads/homepage     -> public_html/assets/uploads/homepage
```

Folder upload harus tetap berada di:

```text
public_html/assets/uploads/<nama-folder>
```

atau mengikuti document root hosting yang dipakai.

Verifikasi setelah upload:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://domain-anda/database/backup-local-lsp-fit.sql
```

Harus membalas `404` atau `403`, bukan `200`.

## 7. Import Database ke Server

### Opsi A: Lewat terminal server

```bash
mysql -u nama_user_database -p lsp_compro < /home/user/private-backups/backup-local-lsp-fit.sql
```

Contoh di PowerShell:

```powershell
cmd /c "mysql -u nama_user_database -p lsp_compro < backup-local-lsp-fit.sql"
```

### Opsi B: Lewat phpMyAdmin

1. Buka phpMyAdmin dari panel hosting.
2. Pilih database live.
3. Klik tab `Import`.
4. Upload file `backup-local-lsp-fit.sql`.
5. Pastikan charset memakai `utf8mb4`.
6. Klik `Import`.
7. Hapus file dump dari server setelah import sukses.

Jangan import database lokal ke production sebelum backup database production disimpan.

## 8. Buat Config Server

Copy file contoh config:

```bash
cp config/config.example.php config/config.php
```

Lalu edit `config/config.php` di server:

```php
<?php
return [
    'db_host' => 'localhost',
    'db_name' => 'lsp_compro',
    'db_user' => 'nama_user_database',
    'db_pass' => 'password_database',
];
```

Login admin hanya dibaca dari tabel `admin_users`. Kunci `admin_username` dan `admin_password_hash` sudah tidak dipakai dan tidak boleh disimpan di `config.php`.

## 9. Ganti Password Admin Live

Login selalu memverifikasi terhadap tabel `admin_users`. Buat hash password baru:

```bash
php -r "echo password_hash('password_admin_baru', PASSWORD_DEFAULT), PHP_EOL;"
```

Masukkan hash ke database server:

```sql
UPDATE admin_users
SET password_hash = 'PASTE_HASH_BARU_DI_SINI',
    role = 'super_admin',
    is_active = 1
WHERE username = 'admin';
```

Jika user admin belum ada:

```sql
INSERT INTO admin_users (username, name, password_hash, role, is_active)
VALUES ('admin', 'Super Admin LSP FIT', 'PASTE_HASH_BARU_DI_SINI', 'super_admin', 1);
```

Catatan:

- Password production harus berbeda dari `admin123` yang dipakai lokal.
- Tidak ada fallback password di file konfigurasi, jadi tabel `admin_users` adalah satu-satunya sumber login.

## 10. Pastikan Folder Upload Writable

Folder ini harus bisa ditulis oleh proses PHP production:

```text
assets/uploads/kegiatan
assets/uploads/anggota
assets/uploads/mitra
assets/uploads/profile
assets/uploads/homepage
```

Owner harus menyesuaikan user PHP (bukan sekadar user SSH):

```bash
chown -R deploy-user:www-data assets/uploads
chmod -R 2775 assets/uploads
find assets/uploads -type f -exec chmod 664 {} \;
```

Verifikasi dengan user yang sama dengan proses PHP:

```bash
sudo -u www-data touch assets/uploads/homepage/.write-test && \
sudo -u www-data rm assets/uploads/homepage/.write-test && echo writable
```

Jangan memakai `777`. Bila hosting memakai user khusus, sesuaikan owner/group-nya.

## 11. Checklist Setelah Import

Cek halaman berikut:

```text
/admin
/admin-dashboard
/admin-kegiatan
/admin-anggota
/admin-mitra
/admin-profil
/admin-homepage
/kegiatan
/anggota
/aboutus
/index
```

Cek juga endpoint API:

```text
/api/kegiatan.php
/api/anggota.php
/api/profile.php
/api/auth.php
/api/homepage.php
/api/partners.php
```

Target hasil:

- Admin bisa login dengan password production.
- Kegiatan dari database tampil, tersusun 3 + 4 + 4 kartu.
- Anggota dari database tampil.
- Profil website membaca data dari database.
- Logo mitra dan hero homepage tampil.
- Gambar upload lama tetap tampil.
- Admin bisa upload gambar baru.
- Upload video MP4 sampai 50 MB berhasil, di atas 50 MB ditolak.

## 12. Alur Deploy yang Direkomendasikan

Untuk update rutin, jalankan satu perintah di server:

```bash
./deploy.sh deploy
```

Script tersebut melakukan, berurutan: preflight → backup database + upload → `git fetch`/`merge --ff-only` → deteksi database dan migration → permission folder upload → `php -l` → reload web server → health check. Bila health check gagal, kode otomatis dikembalikan ke commit sebelumnya.

Dari Windows:

```powershell
.\scripts\deploy-local.ps1 -Target user@ip -RemoteDir /var/www/sertifikasifit.com
```

Bila lebih suka manual:

1. Backup database production ke lokasi privat.
2. Pull code terbaru di server (`git pull --rebase origin lspfit`).
3. Jalankan migration yang belum diterapkan (bagian 3 Jalur B).
4. Pastikan folder `assets/uploads/*` punya permission benar (isi file tidak perlu ditransfer ulang).
5. Isi `config/config.php` sesuai credential server.
6. Ganti password admin live.
7. Health check API, lalu test login admin dan halaman publik.

Rincian langkah setup awal dan rollback ada di `DEPLOY.md`.

## 13. Catatan Operasional Server

Tim yang menjalankan deploy perlu menyiapkan:

- Path project di server.
- Nama database server.
- Username dan password database server.
- Apakah server memakai `public_html`, `htdocs`, atau document root lain.
- Apakah akses database lewat terminal tersedia, atau harus lewat phpMyAdmin.
- Apakah data live server boleh ditimpa oleh data lokal.
- Lokasi penyimpanan backup privat (di luar web root).
- Izin `AllowOverride` pada document root; tanpa itu `.htaccess` tidak berlaku.

Jangan import database lokal ke server produksi sebelum ada backup database server.
