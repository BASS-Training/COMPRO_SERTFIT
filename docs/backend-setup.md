# Backend Kegiatan AFIN

Backend ini disiapkan untuk live server PHP + MySQL.

## File yang perlu disiapkan di server

1. Buat database MySQL, user, dan password dari panel hosting.
2. Import `database/schema.sql` ke database tersebut.
3. Import `database/seed_kegiatan_awal.sql` agar kegiatan lama masuk database dan bisa diatur highlight-nya dari admin.
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
VALUES ('admin', 'Super Admin AFIN', 'PASTE_PASSWORD_HASH_DI_SINI', 'super_admin', 1)
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

## Migration

Kalau tabel `kegiatan` sudah pernah dibuat sebelum fitur highlight, jalankan:

```sql
database/migrations/20260619_add_kegiatan_highlight.sql
```

Setelah itu, jalankan juga:

```sql
database/seed_kegiatan_awal.sql
```

Seed ini memasukkan kegiatan yang sebelumnya hardcoded di halaman Kegiatan. Setelah data database tersedia, kartu hardcoded lama hanya menjadi fallback dan tampilan utama dikendalikan dari database/admin.
