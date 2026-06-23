# Panduan Deploy Database AFIN

Dokumen ini dipakai saat memindahkan data dari MySQL lokal ke MySQL live server.

## 1. Data yang Perlu Dibawa ke Server

Saat deploy, yang perlu dipindahkan bukan hanya file website, tetapi juga:

- Struktur database dari `database/schema.sql`
- Isi database lokal, terutama tabel `kegiatan`, `anggota`, `site_settings`, dan `admin_users`
- Folder upload:
  - `assets/uploads/kegiatan`
  - `assets/uploads/anggota`
- File konfigurasi server:
  - `config/config.php`

## 2. Buat Database di Server

Buat database dan user MySQL dari panel hosting atau terminal server.

Contoh nama database:

```text
afin_compro
```

Contoh data yang perlu disiapkan:

```text
DB_HOST=localhost
DB_NAME=afin_compro
DB_USER=nama_user_database
DB_PASS=password_database
```

## 3. Export Database Lokal

Jalankan dari komputer lokal yang memiliki database `afin_compro`.

Jika memakai PowerShell:

```powershell
mysqldump -u root -p --default-character-set=utf8mb4 --single-transaction --routines --triggers afin_compro > database\backup-local-afin.sql
```

Jika user MySQL lokal tidak memakai password:

```powershell
mysqldump -u root --default-character-set=utf8mb4 --single-transaction --routines --triggers afin_compro > database\backup-local-afin.sql
```

File hasil export:

```text
database/backup-local-afin.sql
```

Catatan:

- File backup ini berisi data lokal.
- Jangan commit file backup SQL ke GitHub jika berisi data asli atau password admin.
- Simpan file ini hanya untuk proses migrasi/deploy.

## 4. Upload File ke Server

Upload file berikut ke server:

```text
database/backup-local-afin.sql
assets/uploads/kegiatan
assets/uploads/anggota
```

Folder upload harus tetap berada di:

```text
public_html/assets/uploads/kegiatan
public_html/assets/uploads/anggota
```

atau mengikuti document root hosting yang dipakai.

## 5. Import Database ke Server

### Opsi A: Import Lewat Terminal Server

Masuk ke server, lalu jalankan:

```bash
mysql -u nama_user_database -p nama_database < database/backup-local-afin.sql
```

Contoh:

```bash
mysql -u afin_user -p afin_compro < database/backup-local-afin.sql
```

### Opsi B: Import Lewat phpMyAdmin

1. Buka phpMyAdmin dari panel hosting.
2. Pilih database live.
3. Klik tab `Import`.
4. Upload file `backup-local-afin.sql`.
5. Pastikan charset memakai `utf8mb4`.
6. Klik `Import`.

## 6. Buat Config Server

Copy file contoh config:

```bash
cp config/config.example.php config/config.php
```

Lalu edit `config/config.php` di server:

```php
<?php
return [
    'db_host' => 'localhost',
    'db_name' => 'afin_compro',
    'db_user' => 'nama_user_database',
    'db_pass' => 'password_database',
    'admin_username' => 'admin',
    'admin_password_hash' => 'HASH_PASSWORD_ADMIN',
];
```

Jika tabel `admin_users` sudah dipakai, login admin utama dibaca dari tabel tersebut. Nilai `admin_username` dan `admin_password_hash` tetap boleh disimpan untuk fallback.

## 7. Ganti Password Admin Live

Buat hash password baru:

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
VALUES ('admin', 'Super Admin AFIN', 'PASTE_HASH_BARU_DI_SINI', 'super_admin', 1);
```

## 8. Pastikan Folder Upload Writable

Folder ini harus bisa ditulis oleh PHP:

```text
assets/uploads/kegiatan
assets/uploads/anggota
```

Permission umum di shared hosting:

```bash
chmod 755 assets/uploads
chmod 755 assets/uploads/kegiatan
chmod 755 assets/uploads/anggota
```

Jika upload masih gagal, hosting tertentu mungkin perlu permission `775`.

## 9. Checklist Setelah Import

Cek halaman berikut:

```text
/admin.html
/admin-kegiatan.html
/admin-anggota.html
/admin-profil.html
/kegiatan.html
/anggota.html
/aboutus.html
```

Cek juga endpoint API:

```text
/api/kegiatan.php
/api/anggota.php
/api/profile.php
/api/auth.php
```

Target hasil:

- Admin bisa login.
- Kegiatan dari database tampil.
- Anggota dari database tampil.
- Profil website membaca data dari database.
- Gambar upload lama tetap tampil.
- Admin bisa upload gambar baru.

## 10. Kalau Server Sudah Punya Database Lama

Jika server sudah memiliki database dan hanya perlu update struktur tabel, jalankan migration yang belum ada:

```sql
SOURCE database/migrations/20260619_add_kegiatan_highlight.sql;
SOURCE database/migrations/20260622_create_admin_users.sql;
SOURCE database/migrations/20260622_create_members_and_settings.sql;
```

Di phpMyAdmin, buka file migration tersebut lalu jalankan isi SQL-nya satu per satu.

## 11. Alur Deploy yang Direkomendasikan

1. Pull code terbaru di server.
2. Backup database server lama jika sudah ada.
3. Import `backup-local-afin.sql` ke database server.
4. Upload folder `assets/uploads`.
5. Isi `config/config.php` sesuai credential server.
6. Ganti password admin live.
7. Test login admin dan halaman publik.

## 12. Catatan Operasional Server

Tim yang menjalankan deploy di server perlu menyiapkan:

- Path project di server.
- Nama database server.
- Username dan password database server.
- Apakah server memakai `public_html`, `htdocs`, atau document root lain.
- Apakah akses database lewat terminal tersedia, atau harus lewat phpMyAdmin.
- Apakah data live server boleh ditimpa oleh data lokal.

Jangan import database lokal ke server produksi sebelum ada backup database server.
