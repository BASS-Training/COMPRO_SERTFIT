# Production Deployment Runbook

Dokumen ini berisi langkah deploy website AFIN ke server production, termasuk setup database, konfigurasi server, upload assets, dan checklist validasi.

## Scope Deploy

Deploy production mencakup:

- File website publik.
- Endpoint API di folder `api/`.
- Halaman admin.
- Struktur dan isi database MySQL.
- Folder upload kegiatan dan anggota.
- Konfigurasi koneksi database server.

## File Penting

- `database/schema.sql` untuk struktur awal database.
- `database/seed_kegiatan_awal.sql` untuk data kegiatan awal.
- `database/migrations/` untuk perubahan struktur bertahap.
- `config/config.example.php` sebagai template konfigurasi server.
- `docs/deploy-database.md` untuk detail export/import database.
- `assets/uploads/kegiatan` untuk gambar kegiatan.
- `assets/uploads/anggota` untuk gambar anggota.

## Persiapan Server

1. Pastikan server mendukung PHP dan MySQL.
2. Buat database MySQL production.
3. Buat user database dengan akses ke database production.
4. Pastikan document root mengarah ke folder project yang benar.
5. Pastikan folder upload bisa ditulis oleh PHP.

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
    'db_name' => 'afin_compro',
    'db_user' => 'production_database_user',
    'db_pass' => 'production_database_password',
    'admin_username' => 'admin',
    'admin_password_hash' => 'PASSWORD_HASH',
];
```

Jangan commit `config/config.php` ke repository.

## Export Database Lokal

Jalankan dari environment lokal:

```bash
mysqldump -u root -p --default-character-set=utf8mb4 --single-transaction --routines --triggers afin_compro > database/backup-local-afin.sql
```

Jika MySQL lokal tidak memakai password:

```bash
mysqldump -u root --default-character-set=utf8mb4 --single-transaction --routines --triggers afin_compro > database/backup-local-afin.sql
```

File backup database tidak boleh dicommit ke repository.

## Import Database Production

Backup database production lebih dulu jika sudah berisi data.

Import lewat terminal:

```bash
mysql -u production_database_user -p afin_compro < database/backup-local-afin.sql
```

Import juga bisa dilakukan melalui phpMyAdmin dengan memilih database production, membuka tab `Import`, lalu mengunggah file SQL.

## Upload Assets

Pastikan folder berikut ikut tersedia di server:

```text
assets/uploads/kegiatan
assets/uploads/anggota
```

Permission umum:

```bash
chmod 755 assets/uploads
chmod 755 assets/uploads/kegiatan
chmod 755 assets/uploads/anggota
```

Jika proses upload dari admin gagal karena permission server, gunakan permission yang direkomendasikan penyedia hosting.

## Password Admin Production

Buat hash password:

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
VALUES ('admin', 'Super Admin AFIN', 'PASTE_HASH_BARU_DI_SINI', 'super_admin', 1);
```

## Urutan Deploy

1. Pull code terbaru dari repository.
2. Backup database production jika sudah ada.
3. Import database lokal ke database production.
4. Upload folder `assets/uploads`.
5. Buat dan isi `config/config.php`.
6. Pastikan folder upload writable.
7. Ganti password admin production.
8. Test API.
9. Test halaman admin.
10. Test halaman publik.

## Validasi API

Cek endpoint berikut:

```text
/api/kegiatan.php
/api/anggota.php
/api/profile.php
/api/auth.php
```

Target validasi:

- `/api/kegiatan.php` mengembalikan data kegiatan.
- `/api/anggota.php` mengembalikan data anggota.
- `/api/profile.php` mengembalikan data profil website.
- Login admin berjalan melalui `/api/auth.php`.

## Validasi Halaman

Cek halaman berikut:

```text
/admin.html
/admin-kegiatan.html
/admin-anggota.html
/admin-profil.html
/kegiatan.html
/kegiatan-detail.html
/anggota.html
/aboutus.html
/index.html
```

Target validasi:

- Admin bisa login.
- Admin bisa tambah, edit, highlight, dan hapus kegiatan.
- Admin bisa tambah, edit, hide, tampilkan, dan hapus anggota.
- Admin bisa mengubah profil website.
- Data kegiatan yang tampil berasal dari database.
- Gambar kegiatan dan anggota tampil dari path upload yang benar.

## Rollback

Jika deploy gagal:

1. Restore database dari backup production terakhir.
2. Kembalikan code ke commit production terakhir yang stabil.
3. Pastikan `config/config.php` tidak berubah ke credential yang salah.
4. Cek ulang permission folder upload.

## Catatan Keamanan

- Jangan commit `config/config.php`.
- Jangan commit file backup SQL.
- Jangan commit file upload runtime kecuali `.gitkeep` dan `.htaccess`.
- Gunakan password admin production yang berbeda dari password lokal.
- Backup database production sebelum import data baru.
