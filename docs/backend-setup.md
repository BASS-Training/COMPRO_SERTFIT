# Backend LSP FIT

Backend ini disiapkan untuk live server PHP + MySQL.

## Menjalankan website secara lokal

Jalankan server PHP dengan router lokal agar URL tanpa `.html`, termasuk `/admin`, dapat digunakan:

```bash
php -S 127.0.0.1:8000 router.php
```

Halaman login admin tersedia di `http://127.0.0.1:8000/admin`.

Catatan: `php -S` **mengabaikan `.htaccess`**. Blokade folder privat di `.htaccess` hanya aktif di Apache, jadi validasi blokade wajib dilakukan di server/Apache staging.

## Instalasi Database Baru

Untuk database kosong, ikuti urutan ini saja. Seluruh struktur tabel sudah termasuk dalam `schema.sql`, jadi **tidak perlu** menjalankan migration lama.

### 1. Buat database dan user

Buat database `lsp_compro` dan user khusus dari panel hosting atau terminal. Jangan memakai `root` di production.

### 2. Import struktur

```bash
mysql -u nama_user_database -p lsp_compro < database/schema.sql
```

`schema.sql` membuat 5 tabel: `kegiatan`, `admin_users`, `anggota`, `site_settings`, `partners`.

### 3. Import konten awal

```bash
mysql -u nama_user_database -p lsp_compro < database/seed_lsp_fit_content.sql
```

File ini **sekali jalan** (INSERT biasa, tanpa `ON DUPLICATE KEY`), jadi hanya untuk database kosong. Isinya: 11 skema sertifikasi, anggota, mitra, dan pengaturan website.

### 4. Migration pendukung (opsional, idempoten)

```sql
database/migrations/20260925_dynamic_about_media.sql
database/migrations/20260925_restore_scheme_groups.sql
```

Keduanya aman dijalankan berulang.

### 5. Copy dan isi config

```bash
cp config/config.example.php config/config.php
```

Isi `db_host`, `db_name`, `db_user`, dan `db_pass` sesuai hosting.

```php
<?php
return [
    'db_host' => 'localhost',
    'db_name' => 'lsp_compro',
    'db_user' => 'nama_user_database',
    'db_pass' => 'password_database',
];
```

`config.php` tidak lagi menyimpan `admin_username` maupun `admin_password_hash`.

### 6. Buat user admin

Login admin hanya dibaca dari tabel `admin_users`. Buat hash:

```bash
php -r "echo password_hash('password_baru', PASSWORD_DEFAULT), PHP_EOL;"
```

```sql
INSERT INTO admin_users (username, name, password_hash, role, is_active)
VALUES ('admin', 'Super Admin LSP FIT', 'PASTE_PASSWORD_HASH_DI_SINI', 'super_admin', 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  password_hash = VALUES(password_hash),
  role = 'super_admin',
  is_active = 1;
```

Jalur instalasi lokal otomatis: `scripts/setup-local-db.php` (hanya CLI).

### Akun lokal

- Username: `admin`
- Password lokal: `admin123`
- Role: `super_admin`

Password ini **hanya untuk development**. Di production wajib diganti (bagian berikut).

## Upgrade Database yang Sudah Ada

Jalankan **hanya** file yang prasyaratnya belum terpenuhi. Tabel klasifikasi lengkap ada di `docs/deploy-database.md` bagian 3.

```sql
-- hanya bila kolom belum ada
database/migrations/20260619_add_kegiatan_highlight.sql

-- hanya bila tabel belum ada
database/migrations/20260622_create_admin_users.sql
database/migrations/20260622_create_members_and_settings.sql
database/migrations/20260630_create_partners.sql

-- idempoten, aman dijalankan ulang
database/migrations/20260924_lsp_fit_content.sql
database/migrations/20260925_dynamic_about_media.sql
database/migrations/20260925_restore_scheme_groups.sql
```

### PERINGATAN: migration rebranding destruktif

```sql
database/migrations/20260924_rebrand_lsp_fit.sql
```

File ini menjalankan:

```sql
DELETE FROM kegiatan;
DELETE FROM anggota;
DELETE FROM partners;
```

Sebelum menjalankannya:

1. Backup penuh database ke lokasi di luar web root.
2. Verifikasi file backup terbaca dan bisa di-restore.
3. Pastikan tabel `anggota`, `partners`, dan `site_settings` sudah ada lebih dulu,
   karena statement pertama sudah menghapus data sebelum script gagal.
4. Hanya jalankan bila database memang berisi konten lama yang boleh ditimpa.

Migration ini menghapus kegiatan, anggota, dan mitra lama, lalu mengisi pengaturan serta konten LSP FIT.

### Verifikasi idempotensi

Jalankan ulang migration idempoten untuk memastikan tidak ada error:

```sql
SOURCE database/migrations/20260925_restore_scheme_groups.sql;
```

## Endpoint

Metode dan aksi utama:

| Endpoint | Metode | Keterangan |
| --- | --- | --- |
| `/api/kegiatan.php` | GET | daftar kegiatan; `?id=slug-atau-id` untuk detail |
| `/api/kegiatan.php` | POST | create / `action=update` / `action=toggle_highlight` / hapus; wajib login |
| `/api/anggota.php` | GET | daftar anggota |
| `/api/anggota.php` | POST | create / `action=update` / `action=toggle_active` / hapus; wajib login |
| `/api/partners.php` | GET | daftar mitra |
| `/api/partners.php` | POST | create / `action=update` / `action=toggle_active` / hapus; wajib login |
| `/api/profile.php` | GET | pengaturan profil website |
| `/api/profile.php` | POST | simpan pengaturan + upload video MP4; wajib login |
| `/api/homepage.php` | GET | pengaturan halaman beranda |
| `/api/homepage.php` | POST | simpan pengaturan + upload hero; wajib login |
| `/api/auth.php` | GET | status sesi admin |
| `/api/auth.php` | POST | `action=login` atau `action=logout` |

Endpoint yang tidak membutuhkan akses tulis wajib membalas 401 bila belum login.

## Upload

Seluruh upload disimpan di bawah `assets/uploads/`:

```text
assets/uploads/kegiatan    gambar kegiatan
assets/uploads/anggota     foto anggota
assets/uploads/mitra       logo mitra
assets/uploads/profile     video perkenalan (MP4, maksimal 50 MB)
assets/uploads/homepage    gambar hero beranda
```

Semua folder harus writable oleh PHP di live server.

Folder induk `assets/uploads/.htaccess` menonaktifkan eksekusi script di seluruh subtree upload.

### Konfigurasi PHP untuk video 50 MB

```ini
upload_max_filesize = 50M
post_max_size = 64M
max_input_time = 300
max_execution_time = 300
```

- `post_max_size` harus lebih besar dari `upload_max_filesize` karena overhead multipart.
- Batas body reverse proxy/Nginx minimal 64M.
- Pastikan `upload_tmp_dir` punya ruang dan boleh ditulis PHP.
- Ukuran di atas 50 MB harus ditolak oleh aplikasi.

## Blokade Folder Privat

`.htaccess` di root menolak akses HTTP ke:

```text
/scripts/   /database/   /docs/   /config/   /node_modules/   /.git/
*.sql  *.md  *.env  *.log  *.ini  *.bak  *.sh  *.yml
```

Verifikasi di Apache:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://domain/scripts/setup-local-db.php   # 404 atau 403
curl -s -o /dev/null -w "%{http_code}\n" https://domain/database/schema.sql          # 404 atau 403
```

Harus membalas `404`/`403`, tidak boleh `200`.

Bukti pengujian lokal (Apache, `AllowOverride All`):

```text
/database/schema.sql            403
/scripts/setup-local-db.php     404
/docs/backend-setup.md          403
/config/config.php              404
/.git/config                    404
/assets/uploads/probe.php       403   (tidak dieksekusi)
/                               200
/api/kegiatan.php               200
```

`scripts/setup-local-db.php` juga menolak eksekusi di luar CLI.

Document root harus mengizinkan directive `.htaccess`:

```apache
<Directory /path/ke/project>
    AllowOverride All
    Require all granted
</Directory>
```
