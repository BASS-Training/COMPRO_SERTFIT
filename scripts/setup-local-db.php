<?php
declare(strict_types=1);

$rootUser = getenv('MYSQL_USER') ?: 'root';
$passwordCandidates = [];

if (getenv('MYSQL_PASSWORD') !== false) {
    $passwordCandidates[] = (string) getenv('MYSQL_PASSWORD');
}

$passwordCandidates = array_values(array_unique(array_merge($passwordCandidates, ['', 'root'])));
$database = 'afin_compro';
$connectedPassword = null;
$pdo = null;

foreach ($passwordCandidates as $password) {
    try {
        $pdo = new PDO('mysql:host=127.0.0.1;charset=utf8mb4', $rootUser, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $connectedPassword = $password;
        break;
    } catch (Throwable $error) {
        $pdo = null;
    }
}

if (!$pdo instanceof PDO) {
    fwrite(STDERR, "Gagal konek MySQL lokal. Set env MYSQL_USER dan MYSQL_PASSWORD lalu jalankan ulang.\n");
    exit(1);
}

$pdo->exec("CREATE DATABASE IF NOT EXISTS {$database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
$pdo->exec("USE {$database}");

foreach ([
    __DIR__ . '/../database/schema.sql',
    __DIR__ . '/../database/seed_kegiatan_awal.sql',
    __DIR__ . '/../database/migrations/20260924_rebrand_lsp_fit.sql',
] as $sqlFile) {
    $sql = file_get_contents($sqlFile);
    if ($sql === false) {
        fwrite(STDERR, "Gagal membaca {$sqlFile}\n");
        exit(1);
    }
    $pdo->exec($sql);
}

$hash = password_hash('admin123', PASSWORD_DEFAULT);
$statement = $pdo->prepare(
    "INSERT INTO admin_users (username, name, password_hash, role, is_active)
     VALUES (:username, :name, :password_hash, 'super_admin', 1)
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       password_hash = VALUES(password_hash),
       role = 'super_admin',
       is_active = 1"
);
$statement->execute([
    'username' => 'admin',
    'name' => 'Super Admin LSP FIT',
    'password_hash' => $hash,
]);

$memberCount = (int) $pdo->query('SELECT COUNT(*) FROM anggota')->fetchColumn();
if ($memberCount === 0) {
    $anggotaHtml = file_get_contents(__DIR__ . '/../anggota.html');
    if ($anggotaHtml !== false) {
        preg_match_all(
            '~<article class="card assessor-card"><img class="assessor-photo" src="([^"]+)" alt="([^"]+)" /><div class="assessor-body"><h4>([^<]+)</h4><p>([^<]+)</p></div></article>~',
            $anggotaHtml,
            $matches,
            PREG_SET_ORDER
        );

        $insertMember = $pdo->prepare(
            'INSERT INTO anggota (name, role_label, photo_url, sort_order) VALUES (:name, :role_label, :photo_url, :sort_order)'
        );

        $sortOrder = count($matches);
        foreach ($matches as $match) {
            $insertMember->execute([
                'name' => html_entity_decode($match[3], ENT_QUOTES | ENT_HTML5, 'UTF-8'),
                'role_label' => html_entity_decode($match[4], ENT_QUOTES | ENT_HTML5, 'UTF-8'),
                'photo_url' => html_entity_decode($match[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'),
                'sort_order' => $sortOrder--,
            ]);
        }
    }
}

$defaultSettings = [
    'about_title' => 'Tentang LSP FIT',
    'about_description' => 'LSP FIT adalah Lembaga Sertifikasi Profesi Fasilitator, Instruktur dan Tenaga Kepelatihan berlisensi BNSP yang menjaga mutu dan relevansi sertifikasi kompetensi.',
    'vision' => 'Menjadi lembaga sertifikasi profesi yang terpercaya, objektif, dan relevan dengan kebutuhan dunia kerja nasional.',
    'mission' => "Menyelenggarakan sertifikasi kompetensi sesuai standar BNSP dan SKKNI.\nMenjaga objektivitas, konsistensi, dan mutu proses asesmen.\nMemperluas akses sertifikasi melalui layanan online dan offline.\nMembangun kemitraan dengan pemerintah, industri, lembaga pelatihan, dan perguruan tinggi.\nMendukung pengakuan kompetensi fasilitator, instruktur, dan tenaga kepelatihan.",
    'contact_email' => 'info.lspfit@gmail.com',
    'contact_website' => 'www.sertifikasifit.com',
    'contact_phone' => '0811-1210-1007',
    'contact_address' => 'Ruko Akasa Blok B No 5, Jl. Raya Astek, Kp. Jombang, Kel. Lengkong Gudang Timur, Kec. Serpong, Kota Tangerang Selatan',
];

$insertSetting = $pdo->prepare(
    'INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES (:setting_key, :setting_value)'
);
foreach ($defaultSettings as $key => $value) {
    $insertSetting->execute([
        'setting_key' => $key,
        'setting_value' => $value,
    ]);
}

$config = <<<PHP
<?php
return [
    'db_host' => '127.0.0.1',
    'db_name' => '{$database}',
    'db_user' => '{$rootUser}',
    'db_pass' => '{$connectedPassword}',
    'admin_username' => 'admin',
    'admin_password_hash' => '{$hash}',
];
PHP;

file_put_contents(__DIR__ . '/../config/config.php', $config);

$count = (int) $pdo->query('SELECT COUNT(*) FROM kegiatan')->fetchColumn();
$highlights = (int) $pdo->query('SELECT COUNT(*) FROM kegiatan WHERE is_highlight = 1')->fetchColumn();
$admins = (int) $pdo->query("SELECT COUNT(*) FROM admin_users WHERE role = 'super_admin' AND is_active = 1")->fetchColumn();
$members = (int) $pdo->query('SELECT COUNT(*) FROM anggota')->fetchColumn();
$settings = (int) $pdo->query('SELECT COUNT(*) FROM site_settings')->fetchColumn();

echo "OK\n";
echo "Database: {$database}\n";
echo "Kegiatan: {$count}\n";
echo "Highlight: {$highlights}\n";
echo "Anggota: {$members}\n";
echo "Pengaturan Profil: {$settings}\n";
echo "Super Admin: {$admins}\n";
echo "Login: admin / admin123\n";
