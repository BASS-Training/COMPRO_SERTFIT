# Backend LSP FIT

Backend ini disiapkan untuk live server PHP + MySQL.

## Menjalankan website secara lokal

Jalankan server PHP dengan router lokal agar URL tanpa `.html`, termasuk `/admin`, dapat digunakan:

```bash
php -S 127.0.0.1:8000 router.php
```

Halaman login admin tersedia di `http://127.0.0.1:8000/admin`.

## File yang perlu disiapkan di server

1. Buat database MySQL, user, dan password dari panel hosting.
2. Import `database/schema.sql` ke database tersebut.
3. Import `database/seed_kegiatan_awal.sql`. File ini sengaja tidak mengisi kegiatan lama.
4. Copy `config/config.example.php` menjadi `config/config.php`.
5. Isi `db_host`, `db_name`, `db_user`, dan `db_pass` sesuai hosting.
6. Ganti `admin_password_hash` untuk password admin live.

Hash password bisa dibuat dengan command:

```bash
php -r "echo password_hash('password_baru', PASSWORD_DEFAULT), PHP_EOL;"
```

Default contoh:

- Username: `admin`
- Password contoh: `admin123`
- Role: `super_admin`

Untuk server yang sudah punya tabel kegiatan sebelum fitur user admin, jalankan:

```sql
database/migrations/20260622_create_admin_users.sql
```

Lalu buat user super admin dengan password hash yang sudah dibuat:

```sql
INSERT INTO admin_users (username, name, password_hash, role, is_active)
VALUES ('admin', 'Super Admin LSP FIT', 'PASTE_PASSWORD_HASH_DI_SINI', 'super_admin', 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  password_hash = VALUES(password_hash),
  role = 'super_admin',
  is_active = 1;
```

## Endpoint

- `GET /api/kegiatan.php` untuk daftar kegiatan.
- `GET /api/kegiatan.php?id=slug-atau-id` untuk detail kegiatan.
- `POST /api/auth.php` dengan `action=login`, `username`, `password` untuk login.
- `POST /api/auth.php` dengan `action=logout` untuk logout.
- `POST /api/kegiatan.php` untuk tambah kegiatan. Wajib login admin.
- `DELETE /api/kegiatan.php?id=ID` untuk hapus kegiatan. Wajib login admin.

## Upload

Foto kegiatan disimpan ke:

```text
assets/uploads/kegiatan
```

Folder ini harus writable oleh PHP di live server.

Video perkenalan yang diupload dari admin disimpan ke:

```text
assets/uploads/profile
```

Folder tersebut juga harus writable oleh PHP. Format upload dibatasi ke MP4 dengan ukuran maksimal 50 MB. Pastikan `upload_max_filesize` minimal `50M` dan `post_max_size` lebih besar dari `50M` pada konfigurasi PHP server.

## Migration

Kalau tabel `kegiatan` sudah pernah dibuat sebelum fitur highlight, jalankan:

```sql
database/migrations/20260619_add_kegiatan_highlight.sql
```

Setelah itu, jalankan juga:

```sql
database/seed_kegiatan_awal.sql
```

Untuk database yang sebelumnya berisi data AFIN, jalankan migration rebranding:

```sql
database/migrations/20260924_rebrand_lsp_fit.sql
```

Migration ini menghapus kegiatan dan anggota lama, lalu mengisi pengaturan profil LSP FIT.

Untuk membuat Sambutan Pimpinan dan Video Perkenalan dapat dikelola melalui admin, jalankan:

```sql
database/migrations/20260925_dynamic_about_media.sql
```

Untuk mengembalikan pengelompokan Skema Sertifikasi sesuai `new-data.md`, jalankan:

```sql
database/migrations/20260925_restore_scheme_groups.sql
```
