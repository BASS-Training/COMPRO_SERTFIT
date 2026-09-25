# Panduan Deployment LSP FIT

Panduan langkah demi langkah: dari server kosong sampai situs live, lalu cara update setiap hari.

Dua cara memakai panduan ini:

- **Manual** — ikuti Bagian A/B/C di bawah.
- **Script** — setelah Bagian A selesai, jalankan `./deploy.sh` (lihat bagian *Script Otomatis*).

Asumsi: **Ubuntu/Debian + Apache 2.4 + PHP 8 + MySQL**, repo di-clone ke `/var/www/sertifikasifit.com`.

---

## Bagian A — Sekali saja (setup awal)

### A1. Pasang paket

```bash
sudo apt update
sudo apt install -y apache2 php libapache2-mod-php php-mysql php-xml php-mbstring \
  php-fileinfo git mysql-server curl tar gzip
sudo a2enmod rewrite
```

### A2. Clone ke document root

Document root **harus** root repo (di situ ada `index.html` dan `.htaccess`).

```bash
sudo mkdir -p /var/www/sertifikasifit.com
sudo chown -R $USER:www-data /var/www/sertifikasifit.com
git clone -b lspfit https://github.com/BASS-Training/COMPRO_SERTFIT.git /var/www/sertifikasifit.com
```

Catatan penting:

- Branch yang dipakai: **`lspfit`**. Jangan `main` (masih commit lama) dan jangan `LSPFIT`.
- Jika repo private, pakai Personal Access Token:
  `git clone https://<TOKEN>@github.com/BASS-Training/COMPRO_SERTFIT.git`
- Pastikan 12+ file perubahan lokal sudah di-commit dan di-push dulu, kalau tidak server akan menarik kode lama.

### A3. Buat database dan user

```bash
sudo mysql
```

```sql
CREATE DATABASE lsp_compro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lspfit_user'@'localhost' IDENTIFIED BY 'password_kuat_acak';
GRANT ALL PRIVILEGES ON lsp_compro.* TO 'lspfit_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### A4. Buat konfigurasi

```bash
cd /var/www/sertifikasifit.com
cp config/config.example.php config/config.php
nano config/config.php
```

```php
<?php
return [
    'db_host' => 'localhost',
    'db_name' => 'lsp_compro',
    'db_user' => 'lspfit_user',
    'db_pass' => 'password_kuat_acak',
];
```

```bash
chmod 640 config/config.php
sudo chown root:www-data config/config.php
```

`config/config.php` tidak menyimpan password admin. Login hanya dibaca dari tabel `admin_users`.

### A5. Import database (database masih kosong → jalur instalasi baru)

```bash
cd /var/www/sertifikasifit.com
mysql -u lspfit_user -p lsp_compro < database/schema.sql
mysql -u lspfit_user -p lsp_compro < database/seed_lsp_fit_content.sql
mysql -u lspfit_user -p lsp_compro < database/migrations/20260925_dynamic_about_media.sql
mysql -u lspfit_user -p lsp_compro < database/migrations/20260925_restore_scheme_groups.sql
```

**Jangan** jalankan `20260924_rebrand_lsp_fit.sql` — file itu menghapus data.

Verifikasi:

```bash
mysql -u lspfit_user -p lsp_compro -e "SHOW TABLES; SELECT COUNT(*) AS skema FROM kegiatan;"
```

Harus 5 tabel dan 11 skema.

### A6. Buat admin login

```bash
php -r "echo password_hash('PASSWORD_BARU_ANDA', PASSWORD_DEFAULT), PHP_EOL;"
```

```bash
mysql -u lspfit_user -p lsp_compro
```

```sql
INSERT INTO admin_users (username, name, password_hash, role, is_active)
VALUES ('admin', 'Super Admin LSP FIT', 'PASTE_HASH_DI_SINI', 'super_admin', 1);
```

Ganti `PASSWORD_BARU_ANDA`. Password `admin123` hanya untuk development lokal.

### A7. Folder upload dan permission

```bash
mkdir -p assets/uploads/{kegiatan,anggota,mitra,profile,homepage}
sudo chown -R $USER:www-data assets/uploads
sudo chmod -R 2775 assets/uploads
find assets/uploads -type f -exec chmod 664 {} \;
```

Folder ini berisi data produksi (gambar dan video yang di-upload admin). Saat update kode, folder ini **tidak boleh ditimpa**.

### A8. Virtual host Apache dan SSL

```bash
nano /etc/apache2/sites-available/lspfit.conf
```

```apache
<VirtualHost *:80>
    ServerName sertifikasifit.com
    ServerAlias www.sertifikasifit.com
    DocumentRoot /var/www/sertifikasifit.com

    <Directory /var/www/sertifikasifit.com>
        Options FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/lspfit-error.log
    CustomLog ${APACHE_LOG_DIR}/lspfit-access.log combined
</VirtualHost>
```

`AllowOverride All` wajib. Tanpa itu `.htaccess` mati: route `/admin` dan blokade folder privat tidak berlaku.

```bash
sudo a2ensite lspfit.conf
sudo a2dissite 000-default.conf
sudo apache2ctl -t
sudo systemctl reload apache2
```

DNS: buat record A `sertifikasifit.com` dan `www` menunjuk ke IP server. Lalu SSL:

```bash
sudo apt install -y certbot python3-certbot-apache
sudo certbot --apache -d sertifikasifit.com -d www.sertifikasifit.com
```

### A9. Batas upload PHP (video 50 MB)

```bash
nano /etc/php/8.x/apache2/php.ini
```

```ini
upload_max_filesize = 50M
post_max_size      = 64M
max_input_time     = 300
max_execution_time = 300
```

```bash
sudo systemctl reload apache2
```

`post_max_size` harus lebih besar dari `upload_max_filesize` karena overhead multipart.

### A10. Verifikasi

```bash
B=https://sertifikasifit.com
for u in / /kegiatan /admin /aboutus /api/kegiatan.php /api/homepage.php \
  /api/partners.php /api/profile.php /api/anggota.php /api/auth.php; do
  echo "$(curl -s -o /dev/null -w '%{http_code}' $B$u)  $u"
done

echo "--- berikut harus 403 atau 404 ---"
for u in /database/schema.sql /scripts/setup-local-db.php /docs/deploy-database.md \
  /config/config.php /.git/config; do
  echo "$(curl -s -o /dev/null -w '%{http_code}' $B$u)  $u"
done
```

Target: semua endpoint `200`, semua path privat `403`/`404`.

Tes terakhir:

- Login di `/admin` memakai password produksi.
- Tambah satu kegiatan (upload gambar) dari `/admin-kegiatan`.
- Upload video MP4 sekitar 50 MB dari `/admin-profil`, lalu buka `/aboutus`.
- Tes juga file sedikit di atas 50 MB, harus ditolak.

---

## Bagian B — Tiap kali ada update kode

### B1. Di komputer lokal

```bash
git add -A
git commit -m "pesan perubahan"
git push origin lspfit
```

### B2. Di server

```bash
cd /var/www/sertifikasifit.com

# 1. backup ke lokasi di luar web root
sudo mkdir -p /var/backups/lspfit
sudo mysqldump -u lspfit_user -p lsp_compro | gzip \
  | sudo tee /var/backups/lspfit/db-$(date +%Y%m%d-%H%M%S).sql.gz > /dev/null
sudo tar czf /var/backups/lspfit/uploads-$(date +%Y%m%d-%H%M%S).tgz assets/uploads

# 2. update kode; gagal otomatis bila ada perubahan lokal
git status --porcelain                       # harus kosong
git pull --rebase origin lspfit

# 3. jalankan migration yang belum ada
#    lihat docs/deploy-database.md bagian 3
#    - database sudah berisi data: jangan jalankan seed, jangan jalankan rebrand

# 4. permission folder upload
sudo chown -R $USER:www-data assets/uploads && sudo chmod -R 2775 assets/uploads

# 5. cek sintaks lalu reload
find api -name '*.php' -print0 | xargs -0 -n1 php -l
sudo apache2ctl -t && sudo systemctl reload apache2

# 6. health check (sama seperti A10)
```

### B3. Yang tidak dijalankan lewat git

| Data | Lokasi | Cara berubah |
| --- | --- | --- |
| `config/config.php` | server | dibuat sekali di A4 |
| `assets/uploads/*` | server | di-upload admin lewat browser |
| Isi database | MySQL server | di-edit lewat `/admin` atau phpMyAdmin |
| Backup | `/var/backups/lspfit` | dibuat di B2 |

Keempatnya **tidak ikut repo**, jadi tidak akan tertimpa `git pull`.

---

## Bagian C — Kalau deploy gagal (rollback)

```bash
cd /var/www/sertifikasifit.com

# 1. kembalikan kode ke commit sebelum deploy
git checkout <SHA_SEBELUMNYA>

# 2. kembalikan database
sudo gunzip -c /var/backups/lspfit/db-<TS>.sql.gz | mysql -u lspfit_user -p lsp_compro

# 3. kembalikan file upload
sudo tar xzf /var/backups/lspfit/uploads-<TS>.tgz -C /var/www/sertifikasifit.com

# 4. reload dan uji ulang
sudo systemctl reload apache2
```

`<SHA_SEBELUMNYA>` dan `<TS>` tercatat di `/var/backups/lspfit/`.

---

## Script Otomatis

Dua file:

| File | Dijalankan di | Fungsi |
| --- | --- | --- |
| `deploy.sh` | server | backup, update kode, migration, permission, reload, health check, rollback, doctor |
| `scripts/deploy-local.ps1` | Windows | preflight lokal lalu memanggil `deploy.sh` lewat SSH |

### Perintah di server

```bash
cd /var/www/sertifikasifit.com

./deploy.sh doctor            # cek pra-syarat server (jalankan sekali setelah Bagian A)
./deploy.sh deploy --dry-run  # lihat rencana aksi tanpa mengubah apa pun
./deploy.sh deploy            # deploy penuh: backup → pull → migration → reload → health check
./deploy.sh rollback --yes    # restore backup terakhir
./deploy.sh status            # info commit, backup terakhir, hasil health check
```

### Konfigurasi lewat environment

| Variabel | Default |
| --- | --- |
| `REPO_DIR` | `/var/www/sertifikasifit.com` |
| `BRANCH` | `lspfit` |
| `BACKUP_DIR` | `/var/backups/lspfit` |
| `KEEP_BACKUPS` | `5` |
| `HEALTH_BASE_URL` | `http://127.0.0.1` |
| `REQUIRE_HTACCESS` | `1` (set `0` untuk lewati cek blokade) |

Contoh:

```bash
REPO_DIR=/var/www/baru ./deploy.sh deploy
```

### Dari Windows

```powershell
.\scripts\deploy-local.ps1 -Target root@123.45.67.89 -RemoteDir /var/www/sertifikasifit.com
.\scripts\deploy-local.ps1 -Target root@123.45.67.89 -RemoteDir /var/www/sertifikasifit.com -Doctor
.\scripts\deploy-local.ps1 -Target root@123.45.67.89 -RemoteDir /var/www/sertifikasifit.com -Rollback
```

Script lokal menolak berjalan bila branch bukan `lspfit` atau ada perubahan yang belum di-commit/push.

### Yang dijaga script

- Backup database dan folder upload sebelum mengubah apa pun, disimpan di `/var/backups/lspfit` (di luar web root), disimpan 5 versi terakhir.
- `git pull --ff-only` tanpa `--autostash`, gagal bila working tree kotor.
- Seed hanya dijalankan saat database kosong, sehingga tidak pernah menimpa data live.
- `20260924_rebrand_lsp_fit.sql` tidak pernah dijalankan otomatis tanpa `--allow-destructive`.
- Migration tercatat di tabel `_schema_migrations` agar tidak dijalankan dua kali.
- Health check gagal → kode otomatis dikembalikan ke commit sebelumnya.

---

## Checklist singkat

**Setup awal (sekali):** A1 → A2 → A3 → A4 → A5 → A6 → A7 → A8 → A9 → A10 → `./deploy.sh doctor`

**Update rutin:** lokal `git push origin lspfit` → `./scripts/deploy-local.ps1 -Target ...` → baca laporan

**Ada masalah:** `./deploy.sh rollback --yes`
