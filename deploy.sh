#!/usr/bin/env bash
#
# deploy.sh — deployment script untuk website LSP FIT di VPS.
#
# Perintah:
#   ./deploy.sh doctor            cek pra-syarat server
#   ./deploy.sh deploy            backup -> update kode -> migration -> permission -> reload -> health check
#   ./deploy.sh rollback --yes    restore backup terakhir
#   ./deploy.sh status            info commit, backup, health check
#
# Flag:
#   --dry-run             tampilkan rencana aksi tanpa mengubah apa pun
#   --yes                 konfirmasi operasi merusak (rollback)
#   --allow-destructive   izinkan migration destruktif (20260924_rebrand_lsp_fit.sql)
#   --no-auto-rollback    jangan kembalikan kode otomatis bila health check gagal
#   --backup=<ts>         pilih backup untuk rollback
#   -h, --help            bantuan
#
# Dokumen langkah lengkap: DEPLOY.md
#
set -euo pipefail

# --------------------------------------------------------------------------
# Konfigurasi (bisa ditimpa lewat environment)
# --------------------------------------------------------------------------
REPO_DIR="${REPO_DIR:-/var/www/sertifikasifit.com}"
BRANCH="${BRANCH:-lspfit}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/lspfit}"
KEEP_BACKUPS="${KEEP_BACKUPS:-5}"
HEALTH_BASE_URL="${HEALTH_BASE_URL:-http://127.0.0.1}"
REQUIRE_HTACCESS="${REQUIRE_HTACCESS:-1}"
WEB_USER="${WEB_USER:-}"
MYSQL_BIN="${MYSQL_BIN:-mysql}"
MYSQLDUMP_BIN="${MYSQLDUMP_BIN:-mysqldump}"
PHP_BIN="${PHP_BIN:-php}"
CURL_BIN="${CURL_BIN:-curl}"

DRY_RUN=0
YES=0
ALLOW_DESTRUCTIVE=0
AUTO_ROLLBACK=1
CMD="deploy"
BACKUP_TS=""
BACKUP_TS_OVERRIDE=""
PREV_SHA=""
MYSQL_DEFAULTS=""

MIGRATIONS_ALWAYS=(
    "20260925_dynamic_about_media.sql"
    "20260925_restore_scheme_groups.sql"
)

HEALTH_OK=(
    "/"
    "/admin"
    "/kegiatan"
    "/aboutus"
    "/api/kegiatan.php"
    "/api/anggota.php"
    "/api/profile.php"
    "/api/auth.php"
    "/api/homepage.php"
    "/api/partners.php"
)

HEALTH_BLOCKED=(
    "/database/schema.sql"
    "/scripts/setup-local-db.php"
    "/docs/deploy-database.md"
    "/config/config.php"
    "/.git/config"
)

# --------------------------------------------------------------------------
# Utilitas
# --------------------------------------------------------------------------
if [ -t 1 ]; then
    C_GREEN=$'\033[32m'; C_RED=$'\033[31m'; C_YELLOW=$'\033[33m'; C_DIM=$'\033[2m'; C_OFF=$'\033[0m'
else
    C_GREEN=""; C_RED=""; C_YELLOW=""; C_DIM=""; C_OFF=""
fi

log()  { printf '%s\n' "${C_DIM}[deploy]${C_OFF} $*"; }
ok()   { printf '%s\n' "${C_GREEN}[deploy]${C_OFF} $*"; }
warn() { printf '%s\n' "${C_YELLOW}[deploy] WARN:${C_OFF} $*" >&2; }
die()  { printf '%s\n' "${C_RED}[deploy] ERROR:${C_OFF} $*" >&2; exit 1; }

has() { command -v "$1" >/dev/null 2>&1; }

run() {
    if [ "$DRY_RUN" = 1 ]; then
        log "[dry-run] $*"
        return 0
    fi
    log "+ $*"
    "$@"
}

priv() {
    if [ "$(id -u)" = 0 ]; then
        run "$@"
    elif has sudo; then
        run sudo "$@"
    else
        warn "Perlu root/sudo, dilewati: $*"
        return 1
    fi
}

usage() {
    awk 'NR == 1 { next } /^set -euo pipefail/ { exit } { sub(/^# ?/, ""); print }' "$0"
}

cleanup() {
    if [ -n "$MYSQL_DEFAULTS" ] && [ -f "$MYSQL_DEFAULTS" ]; then
        rm -f "$MYSQL_DEFAULTS"
    fi
}
trap cleanup EXIT

# --------------------------------------------------------------------------
# Database
# --------------------------------------------------------------------------
read_db_config() {
    local cfg="$REPO_DIR/config/config.php" out
    if [ ! -f "$cfg" ]; then
        warn "config/config.php tidak ada (DEPLOY.md bagian A4)."
        return 1
    fi
    out=$("$PHP_BIN" -r '
        $c = require $argv[1];
        if (!is_array($c)) { exit(2); }
        foreach (["db_name", "db_user"] as $k) {
            if (!isset($c[$k]) || (string) $c[$k] === "") { fwrite(STDERR, "kunci kosong: {$k}\n"); exit(3); }
        }
        $host = isset($c["db_host"]) && (string) $c["db_host"] !== "" ? (string) $c["db_host"] : "127.0.0.1";
        $pass = isset($c["db_pass"]) ? (string) $c["db_pass"] : "";
        echo implode("\x1f", [$host, (string) $c["db_name"], (string) $c["db_user"], $pass]);
    ' "$cfg" 2>/dev/null) || { warn "config/config.php tidak valid (DEPLOY.md bagian A4)."; return 1; }
    IFS=$'\x1f' read -r DB_HOST DB_NAME DB_USER DB_PASS <<<"$out"
    if [ -z "${DB_NAME:-}" ]; then
        warn "db_name kosong di config/config.php."
        return 1
    fi

    if ! "$PHP_BIN" -r '$c = require $argv[1]; exit(isset($c["admin_password_hash"]) ? 1 : 0);' "$cfg"; then
        warn "config/config.php masih berisi admin_password_hash; hapus kunci tersebut (DEPLOY.md bagian A4)."
        return 1
    fi
    return 0
}

make_defaults_file() {
    MYSQL_DEFAULTS=$(mktemp)
    chmod 600 "$MYSQL_DEFAULTS"
    "$PHP_BIN" -r '
        $host = str_replace(["\r", "\n"], "", $argv[1]);
        $user = str_replace(["\r", "\n"], "", $argv[2]);
        $pass = str_replace(["\r", "\n"], "", $argv[3]);
        $lines = ["[client]", "host={$host}", "user={$user}"];
        if ($pass !== "") { $lines[] = "password={$pass}"; }
        file_put_contents($argv[4], implode("\n", $lines) . "\n");
    ' "$DB_HOST" "$DB_USER" "$DB_PASS" "$MYSQL_DEFAULTS" >/dev/null \
        || { warn "Gagal menulis file kredensial MySQL sementara."; return 1; }
    return 0
}

bootstrap_db() {
    read_db_config || return 1
    make_defaults_file || return 1
    return 0
}

mysql_c() { "$MYSQL_BIN" --defaults-extra-file="$MYSQL_DEFAULTS" "$@"; }
mysql_db() { "$MYSQL_BIN" --defaults-extra-file="$MYSQL_DEFAULTS" -D "$DB_NAME" "$@"; }

check_database_exists() {
    local found
    found=$(mysql_c -N -e "SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = '$DB_NAME'" 2>/dev/null) || found=""
    case "$found" in
        *"$DB_NAME"*) : ;;
        *) die "Database '$DB_NAME' belum ada. Buat dulu (DEPLOY.md bagian A3)." ;;
    esac
}

db_install_state() {
    local tables rows
    tables=$(mysql_db -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME' AND table_name = 'kegiatan'" 2>/dev/null) || tables=0
    if [ "${tables:-0}" = "0" ]; then echo "empty"; return 0; fi
    rows=$(mysql_db -N -e "SELECT COUNT(*) FROM kegiatan" 2>/dev/null) || rows=0
    if [ "${rows:-0}" = "0" ]; then echo "empty"; else echo "installed"; fi
}

ensure_ledger() {
    mysql_db -e "CREATE TABLE IF NOT EXISTS _schema_migrations (
        file_name VARCHAR(191) NOT NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (file_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;"
}

migration_applied() {
    local n
    n=$(mysql_db -N -e "SELECT COUNT(*) FROM _schema_migrations WHERE file_name = '$1'" 2>/dev/null) || n=0
    [ "${n:-0}" -ge 1 ]
}

record_migration() {
    [ "$DRY_RUN" = 1 ] && return 0
    mysql_db -e "INSERT IGNORE INTO _schema_migrations (file_name) VALUES ('$1');" >/dev/null
}

apply_migration() {
    local file="$1" path="$REPO_DIR/database/migrations/$1"
    [ -f "$path" ] || { warn "File migration tidak ada: $file (dilewati)"; return 0; }
    if migration_applied "$file"; then
        log "  = $file (sudah pernah dijalankan)"
        return 0
    fi
    case "$file" in
        *rebrand_lsp_fit.sql)
            if [ "$ALLOW_DESTRUCTIVE" != 1 ]; then
                warn "  ! $file bersifat DESTRUKTIF dan dilewati. Pakai --allow-destructive bila memang diperlukan."
                return 0
            fi
            warn "  ! $file DESTRUKTIF — data kegiatan/anggota/mitra akan dihapus."
            ;;
    esac
    if [ "$DRY_RUN" = 1 ]; then
        log "[dry-run] mysql < database/migrations/$file"
        return 0
    fi
    log "  + $file"
    mysql_db < "$path"
    record_migration "$file"
}

import_sql() {
    local path="$1"
    [ -f "$path" ] || die "File SQL tidak ada: $path"
    if [ "$DRY_RUN" = 1 ]; then
        log "[dry-run] mysql < ${path#"$REPO_DIR"/}"
        return 0
    fi
    log "+ mysql < ${path#"$REPO_DIR"/}"
    mysql_db < "$path"
}

setup_database() {
    local state
    ensure_ledger
    state=$(db_install_state)
    log "Status database: $state"

    if [ "$state" = "empty" ]; then
        log "Jalur instalasi baru (seed dijalankan karena database masih kosong)"
        import_sql "$REPO_DIR/database/schema.sql"
        if [ -f "$REPO_DIR/database/seed_lsp_fit_content.sql" ]; then
            import_sql "$REPO_DIR/database/seed_lsp_fit_content.sql"
        fi
    else
        log "Database sudah berisi — seed DILEWATI agar data live tidak tertimpa"
    fi

    log "Migration:"
    local m
    for m in "${MIGRATIONS_ALWAYS[@]}"; do
        apply_migration "$m"
    done
}

check_admin_user() {
    local n
    n=$(mysql_db -N -e "SELECT COUNT(*) FROM admin_users WHERE is_active = 1" 2>/dev/null) || n=""
    if [ -z "$n" ]; then
        warn "Tabel admin_users belum ada — login admin akan gagal."
        return 1
    fi
    if [ "$n" = "0" ]; then
        warn "admin_users masih kosong — belum ada yang bisa login. Buat admin dulu (DEPLOY.md bagian A6)."
        return 1
    fi
    log "Admin aktif: $n"
    return 0
}

# --------------------------------------------------------------------------
# Git
# --------------------------------------------------------------------------
git_update() {
    [ -d "$REPO_DIR/.git" ] || die "$REPO_DIR bukan repository git (DEPLOY.md bagian A2)."
    local dirty current
    dirty=$(git -C "$REPO_DIR" status --porcelain || true)
    [ -z "$dirty" ] || die "Working tree tidak bersih di server. Periksa: git -C $REPO_DIR status"
    current=$(git -C "$REPO_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "?")
    [ "$current" = "$BRANCH" ] || die "Branch sekarang '$current', diharapkan '$BRANCH'. Jalankan: git -C $REPO_DIR checkout $BRANCH"

    run git -C "$REPO_DIR" fetch origin
    run git -C "$REPO_DIR" merge --ff-only "origin/$BRANCH"
    log "Commit aktif: $(git -C "$REPO_DIR" rev-parse --short HEAD)"
}

# --------------------------------------------------------------------------
# Backup
# --------------------------------------------------------------------------
create_backup() {
    mkdir -p "$BACKUP_DIR"
    BACKUP_TS=$(date +%Y%m%d-%H%M%S)
    log "Backup ke $BACKUP_DIR"

    if [ "$DRY_RUN" = 1 ]; then
        log "[dry-run] mysqldump | gzip > $BACKUP_DIR/db-$BACKUP_TS.sql.gz"
        log "[dry-run] tar czf $BACKUP_DIR/uploads-$BACKUP_TS.tgz assets/uploads"
    else
        log "+ mysqldump | gzip"
        "$MYSQLDUMP_BIN" --defaults-extra-file="$MYSQL_DEFAULTS" \
            --default-character-set=utf8mb4 --single-transaction --routines --triggers \
            "$DB_NAME" | gzip > "$BACKUP_DIR/db-$BACKUP_TS.sql.gz"
        [ -s "$BACKUP_DIR/db-$BACKUP_TS.sql.gz" ] || die "Backup database gagal (file kosong)."
        ok "  db-$BACKUP_TS.sql.gz ($(du -h "$BACKUP_DIR/db-$BACKUP_TS.sql.gz" | cut -f1))"

        if [ -d "$REPO_DIR/assets/uploads" ]; then
            log "+ tar czf $BACKUP_DIR/uploads-$BACKUP_TS.tgz assets/uploads"
            tar czf "$BACKUP_DIR/uploads-$BACKUP_TS.tgz" -C "$REPO_DIR" assets/uploads
            ok "  uploads-$BACKUP_TS.tgz"
        else
            warn "assets/uploads belum ada, backup upload dilewati."
        fi

        printf '%s\n' "$BACKUP_TS" > "$BACKUP_DIR/LATEST"
        prune_backups
    fi

    if [ -d "$REPO_DIR/.git" ]; then
        PREV_SHA=$(git -C "$REPO_DIR" rev-parse HEAD)
        log "Commit sebelum deploy: ${PREV_SHA:0:12}"
        if [ "$DRY_RUN" != 1 ]; then
            printf '%s\n' "$PREV_SHA" > "$BACKUP_DIR/prev-sha-$BACKUP_TS"
        fi
    fi
}

prune_backups() {
    local pattern f count=0
    for pattern in "db-*.sql.gz" "uploads-*.tgz" "prev-sha-*"; do
        count=0
        while IFS= read -r f; do
            [ -n "$f" ] || continue
            count=$((count + 1))
            if [ "$count" -gt "$KEEP_BACKUPS" ]; then
                log "  hapus backup lama: $(basename "$f")"
                rm -f "$f"
            fi
        done < <(ls -1t "$BACKUP_DIR"/$pattern 2>/dev/null || true)
    done
}

# --------------------------------------------------------------------------
# Filesystem
# --------------------------------------------------------------------------
detect_web_user() {
    if [ -n "$WEB_USER" ]; then echo "$WEB_USER"; return 0; fi
    local u=""
    if [ -f /etc/apache2/envvars ]; then
        u=$(grep -E '^APACHE_RUN_USER=' /etc/apache2/envvars 2>/dev/null | tail -1 | cut -d= -f2- | tr -d "\"'" || true)
    fi
    if [ -z "$u" ] && has ps; then
        u=$(ps -o user= -C php-fpm 2>/dev/null | head -1 | tr -d ' ' || true)
    fi
    if [ -z "$u" ] && has ps; then
        u=$(ps -o user= -C apache2 2>/dev/null | head -1 | tr -d ' ' || true)
    fi
    echo "${u:-www-data}"
}

fix_upload_permissions() {
    local d
    for d in kegiatan anggota mitra profile homepage; do
        run mkdir -p "$REPO_DIR/assets/uploads/$d"
    done
    if [ "$DRY_RUN" = 1 ]; then
        log "[dry-run] chown + chmod 2775 assets/uploads"
        return 0
    fi
    local web owner
    web=$(detect_web_user)
    owner=$(id -un 2>/dev/null || echo "$USER")
    log "Ownership assets/uploads → $owner:$web (mode 2775)"
    priv chown -R "$owner:$web" "$REPO_DIR/assets/uploads" || true
    priv chmod -R 2775 "$REPO_DIR/assets/uploads" || true
    find "$REPO_DIR/assets/uploads" -type f -exec chmod 664 {} + 2>/dev/null || true
    find "$REPO_DIR/assets/uploads" -type d -exec chmod 2775 {} + 2>/dev/null || true
}

check_php_lint() {
    local bad=0 f
    [ -d "$REPO_DIR/api" ] || return 0
    while IFS= read -r -d '' f; do
        if ! "$PHP_BIN" -l "$f" >/dev/null 2>&1; then
            warn "Syntax error: $f"
            bad=1
        fi
    done < <(find "$REPO_DIR/api" "$REPO_DIR/scripts" -name '*.php' -print0 2>/dev/null)
    if [ "$bad" = 1 ]; then
        return 1
    fi
    log "php -l: tidak ada syntax error"
    return 0
}

# --------------------------------------------------------------------------
# Web server
# --------------------------------------------------------------------------
reload_webserver() {
    if [ "$DRY_RUN" = 1 ]; then
        log "[dry-run] cek konfigurasi web server lalu reload"
        return 0
    fi
    if has apache2ctl; then
        run apache2ctl -t
        priv systemctl reload apache2 || warn "Reload apache2 gagal (coba manual)."
    elif has httpd; then
        run httpd -t
        priv systemctl reload httpd || warn "Reload httpd gagal (coba manual)."
    elif has nginx; then
        run nginx -t
        priv systemctl reload nginx || warn "Reload nginx gagal (coba manual)."
    else
        warn "apache2ctl/httpd/nginx tidak ditemukan — reload dilewati (wajar di mesin development)."
    fi
    if has systemctl && systemctl list-units >/dev/null 2>&1; then
        local unit
        for unit in php8.3-fpm php8.2-fpm php8.1-fpm php-fpm; do
            if systemctl is-active --quiet "$unit" 2>/dev/null; then
                priv systemctl reload "$unit" || true
                log "reload $unit"
                break
            fi
        done
    fi
}

http_code() {
    "$CURL_BIN" -s --max-time 15 -o /dev/null -w '%{http_code}' "$1" 2>/dev/null || printf '000'
}

health_check() {
    local fail=0 u code
    log "Health check: $HEALTH_BASE_URL"
    for u in "${HEALTH_OK[@]}"; do
        code=$(http_code "$HEALTH_BASE_URL$u")
        if [ "$code" = "200" ]; then
            ok "  $code  $u"
        else
            warn "  $code  $u (diharapkan 200)"
            fail=1
        fi
    done

    if [ "$REQUIRE_HTACCESS" = "1" ]; then
        for u in "${HEALTH_BLOCKED[@]}"; do
            code=$(http_code "$HEALTH_BASE_URL$u")
            case "$code" in
                403|404) ok "  $code  $u (terblokir)" ;;
                *)       warn "  $code  $u (diharapkan 403/404 — TERBOCOR!)"; fail=1 ;;
            esac
        done
    else
        log "  blokade .htaccess dilewati (REQUIRE_HTACCESS=0)"
    fi

    return "$fail"
}

auto_rollback_code() {
    if [ "$AUTO_ROLLBACK" != 1 ] || [ -z "$PREV_SHA" ]; then
        return 0
    fi
    warn "Health check gagal → kembalikan kode ke ${PREV_SHA:0:12}"
    if [ "$DRY_RUN" = 1 ]; then
        log "[dry-run] git -C $REPO_DIR reset --hard $PREV_SHA"
        return 0
    fi
    git -C "$REPO_DIR" reset --hard "$PREV_SHA" >/dev/null 2>&1 || warn "git reset gagal, lakukan manual."
    reload_webserver
    warn "Kode sudah dikembalikan. Database TIDAK di-restore otomatis; jalankan ./deploy.sh rollback --yes bila perlu."
}

# --------------------------------------------------------------------------
# Perintah
# --------------------------------------------------------------------------
cmd_deploy() {
    log "=== Deploy branch '$BRANCH' ke $REPO_DIR ==="
    has git   || die "git tidak ditemukan."
    has "$PHP_BIN" || die "php tidak ditemukan."
    has "$CURL_BIN" || die "curl tidak ditemukan."
    has "$MYSQL_BIN" || die "mysql client tidak ditemukan."

    bootstrap_db || die "Konfigurasi database tidak valid. Lihat DEPLOY.md bagian A3-A4."
    check_database_exists
    create_backup
    git_update
    setup_database
    check_admin_user || true
    fix_upload_permissions
    check_php_lint || die "Ada file PHP dengan syntax error. Perbaiki dulu."
    reload_webserver

    if ! health_check; then
        warn "Health check gagal."
        auto_rollback_code
        die "Deploy tidak dinyatakan sukses. Backup tersimpan di: $BACKUP_DIR"
    fi

    ok "Deploy selesai."
    log "Backup   : $BACKUP_DIR/db-$BACKUP_TS.sql.gz"
    log "Commit   : $(git -C "$REPO_DIR" rev-parse --short HEAD 2>/dev/null || echo '-')"
    log "Website  : $HEALTH_BASE_URL"
}

cmd_rollback() {
    [ "$YES" = 1 ] || die "Rollback menghapus data. Konfirmasi dengan flag --yes"
    [ -d "$BACKUP_DIR" ] || die "Folder backup tidak ada: $BACKUP_DIR"

    local ts="${BACKUP_TS_OVERRIDE:-}"
    if [ -z "$ts" ]; then
        ts=$(cat "$BACKUP_DIR/LATEST" 2>/dev/null || true)
    fi
    [ -n "$ts" ] || die "Tidak ada backup tercatat di $BACKUP_DIR."

    local dbf="$BACKUP_DIR/db-$ts.sql.gz"
    local upf="$BACKUP_DIR/uploads-$ts.tgz"
    local shaf="$BACKUP_DIR/prev-sha-$ts"

    [ -f "$dbf" ] || die "Backup database tidak ada: $dbf"

    bootstrap_db || die "Konfigurasi database tidak valid. Lihat DEPLOY.md bagian A3-A4."
    check_database_exists

    warn "Rollback akan MENIMPA database '$DB_NAME' dengan isi $dbf"
    if [ "$DRY_RUN" = 1 ]; then
        log "[dry-run] gunzip -c $dbf | mysql $DB_NAME"
        [ -f "$upf" ] && log "[dry-run] tar xzf $upf -C $REPO_DIR"
        [ -f "$shaf" ] && log "[dry-run] git reset --hard $(cat "$shaf")"
        return 0
    fi

    log "+ restore database"
    gunzip -c "$dbf" | mysql_db

    if [ -f "$upf" ]; then
        log "+ restore assets/uploads"
        tar xzf "$upf" -C "$REPO_DIR"
    fi

    if [ -f "$shaf" ]; then
        local sha
        sha=$(cat "$shaf")
        if [ -d "$REPO_DIR/.git" ]; then
            log "+ git reset --hard ${sha:0:12}"
            git -C "$REPO_DIR" reset --hard "$sha" >/dev/null
        fi
    fi

    fix_upload_permissions
    reload_webserver

    if health_check; then
        ok "Rollback selesai."
    else
        warn "Health check belum lulus setelah rollback."
    fi
}

cmd_doctor() {
    log "=== Doctor: pemeriksaan server ==="
    local failed=0

    for c in git "$PHP_BIN" "$CURL_BIN" "$MYSQL_BIN" "$MYSQLDUMP_BIN" tar gzip; do
        if has "$c"; then ok "  tool       : $c"; else warn "  tool       : $c TIDAK ADA"; failed=1; fi
    done

    if [ -d "$REPO_DIR/.git" ]; then
        local cur
        cur=$(git -C "$REPO_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "?")
        if [ "$cur" = "$BRANCH" ]; then ok "  repo       : $REPO_DIR (branch $BRANCH)"; else warn "  repo       : branch '$cur' (diharapkan '$BRANCH')"; failed=1; fi
        local dirty
        dirty=$(git -C "$REPO_DIR" status --porcelain || true)
        if [ -z "$dirty" ]; then ok "  working tree: bersih"; else warn "  working tree: ada perubahan lokal"; failed=1; fi
    else
        warn "  repo       : $REPO_DIR bukan repository git"; failed=1
    fi

    if [ -f "$REPO_DIR/config/config.php" ]; then
        if bootstrap_db 2>/dev/null; then
            ok "  config     : config/config.php valid (tanpa kunci admin lama)"
        else
            warn "  config     : config/config.php tidak valid"; failed=1
        fi
    else
        warn "  config     : config/config.php belum ada (DEPLOY.md bagian A4)"; failed=1
    fi

    if [ -n "${DB_NAME:-}" ]; then
        if mysql_c -N -e "SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = '$DB_NAME'" 2>/dev/null | grep -q "$DB_NAME"; then
            ok "  database   : $DB_NAME ada"
            local state
            state=$(db_install_state)
            if [ "$state" = "installed" ]; then
                local rows
                rows=$(mysql_db -N -e "SELECT COUNT(*) FROM kegiatan" 2>/dev/null || echo 0)
                ok "  konten     : terisi ($rows skema) — seed tidak akan dijalankan"
            else
                warn "  konten     : masih kosong — 'deploy' akan menjalankan seed"
            fi

            if check_admin_user 2>/dev/null; then
                ok "  admin      : ada admin aktif"
            else
                warn "  admin      : belum ada admin aktif (DEPLOY.md bagian A6)"; failed=1
            fi
        else
            warn "  database   : $DB_NAME belum ada (DEPLOY.md bagian A3)"; failed=1
        fi
    fi

    local d
    for d in kegiatan anggota mitra profile homepage; do
        if [ -d "$REPO_DIR/assets/uploads/$d" ]; then
            if [ -w "$REPO_DIR/assets/uploads/$d" ]; then
                ok "  upload     : assets/uploads/$d bisa ditulis"
            else
                warn "  upload     : assets/uploads/$d TIDAK bisa ditulis"; failed=1
            fi
        else
            warn "  upload     : assets/uploads/$d belum ada"; failed=1
        fi
    done

    if [ -f "$REPO_DIR/.htaccess" ]; then
        if grep -q "scripts|database|docs|config" "$REPO_DIR/.htaccess"; then
            ok "  .htaccess  : blokade folder privat aktif"
        else
            warn "  .htaccess  : blokade folder privat tidak ditemukan"; failed=1
        fi
    else
        warn "  .htaccess  : tidak ada"; failed=1
    fi

    if has apache2ctl || has httpd || has nginx; then
        ok "  web server : ditemukan"
    else
        warn "  web server : apache2ctl/httpd/nginx tidak ditemukan (wajar di development)"
    fi

    if check_php_lint 2>/dev/null; then
        ok "  php -l     : bersih"
    else
        warn "  php -l     : ada syntax error"; failed=1
    fi

    if health_check 2>/dev/null; then
        ok "  health     : lulus"
    else
        warn "  health     : belum lulus (wajar bila situs belum live)"
    fi

    if [ "$failed" = 1 ]; then
        warn "Doctor: ada $failed pemeriksaan yang belum lulus."
        return 1
    fi
    ok "Doctor: semua pemeriksaan utama lulus."
    return 0
}

cmd_status() {
    log "=== Status ==="
    log "REPO_DIR      : $REPO_DIR"
    if [ -d "$REPO_DIR/.git" ]; then
        log "Branch        : $(git -C "$REPO_DIR" rev-parse --abbrev-ref HEAD)"
        log "Commit        : $(git -C "$REPO_DIR" rev-parse HEAD)"
        log "Status lokal  : $(git -C "$REPO_DIR" status --porcelain | wc -l) perubahan"
    fi
    log "BACKUP_DIR    : $BACKUP_DIR"
    local ts
    ts=$(cat "$BACKUP_DIR/LATEST" 2>/dev/null || true)
    if [ -n "$ts" ]; then
        log "Backup terakhir: $ts"
        ls -lh "$BACKUP_DIR/db-$ts.sql.gz" "$BACKUP_DIR/uploads-$ts.tgz" 2>/dev/null | sed 's/^/  /' || true
    else
        log "Backup terakhir: belum ada"
    fi
    health_check || warn "Health check belum lulus."
}

# --------------------------------------------------------------------------
# Argument
# --------------------------------------------------------------------------
while [ $# -gt 0 ]; do
    case "$1" in
        deploy|rollback|doctor|status) CMD="$1" ;;
        --dry-run) DRY_RUN=1 ;;
        --yes|-y) YES=1 ;;
        --allow-destructive) ALLOW_DESTRUCTIVE=1 ;;
        --no-auto-rollback) AUTO_ROLLBACK=0 ;;
        --backup=*) BACKUP_TS_OVERRIDE="${1#--backup=}" ;;
        -h|--help) usage; exit 0 ;;
        *) die "Argumen tidak dikenal: $1 (lihat --help)" ;;
    esac
    shift
done

case "$CMD" in
    deploy)   cmd_deploy ;;
    rollback) cmd_rollback ;;
    doctor)   cmd_doctor ;;
    status)   cmd_status ;;
    *)        die "Perintah tidak dikenal: $CMD" ;;
esac
