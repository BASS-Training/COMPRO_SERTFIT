<?php
declare(strict_types=1);

require __DIR__ . '/_bootstrap.php';

$defaults = [
    'about_title' => 'Tentang LSP FIT',
    'about_description' => 'LSP FIT adalah Lembaga Sertifikasi Profesi Fasilitator, Instruktur dan Tenaga Kepelatihan berlisensi BNSP yang menjaga mutu dan relevansi sertifikasi kompetensi.',
    'about_profile_kicker' => 'Profil',
    'about_profile_title' => 'Berlisensi BNSP',
    'about_profile_description' => 'LSP FIT memiliki lisensi BNSP dengan Nomor LSP-444-ID dan berhak melaksanakan uji kompetensi mengacu SKKNI No. 333 Tahun 2020.',
    'about_support_kicker' => 'Dukungan',
    'about_support_title' => 'Didukung Asosiasi',
    'about_support_description' => 'LSP FIT didukung oleh APTISI wilayah 3 DKI Jakarta dan AFIN sebagai asosiasi pendukung dalam pengembangan kompetensi.',
    'about_reach_kicker' => 'Jangkauan',
    'about_reach_title' => 'Jangkauan Nasional',
    'about_reach_description' => 'LSP FIT membangun jaringan dengan instansi pemerintah, lembaga pelatihan, institusi pendidikan, dunia usaha, dan dunia industri di seluruh Indonesia.',
    'vision' => 'Menjadi lembaga sertifikasi profesi yang terpercaya, objektif, dan relevan dengan kebutuhan dunia kerja nasional.',
    'mission' => "Menyelenggarakan sertifikasi kompetensi sesuai standar BNSP dan SKKNI.\nMenjaga objektivitas, konsistensi, dan mutu proses asesmen.\nMemperluas akses sertifikasi melalui layanan online dan offline.\nMembangun kemitraan dengan pemerintah, industri, lembaga pelatihan, dan perguruan tinggi.\nMendukung pengakuan kompetensi fasilitator, instruktur, dan tenaga kepelatihan.",
    'contact_email' => 'info.lspfit@gmail.com',
    'contact_website' => 'www.sertifikasifit.com',
    'contact_phone' => '0811-1210-1007',
    'contact_address' => 'Ruko Akasa Blok B No 5, Jl. Raya Astek, Kp. Jombang, Kel. Lengkong Gudang Timur, Kec. Serpong, Kota Tangerang Selatan',
];

function profile_items(PDO $pdo, array $defaults): array
{
    $settings = $defaults;
    foreach ($pdo->query('SELECT setting_key, setting_value FROM site_settings')->fetchAll() as $row) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }
    return $settings;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    try {
        $pdo = db();
    } catch (Throwable $error) {
        json_response(['ok' => true, 'settings' => $defaults, 'configured' => false]);
    }
    json_response(['ok' => true, 'settings' => profile_items($pdo, $defaults), 'configured' => true]);
}

if ($method === 'POST') {
    require_admin();
    $pdo = db();
    $statement = $pdo->prepare('INSERT INTO site_settings (setting_key, setting_value) VALUES (:setting_key, :setting_value) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)');
    foreach ($defaults as $key => $default) {
        $statement->execute([
            'setting_key' => $key,
            'setting_value' => trim((string) ($_POST[$key] ?? $default)),
        ]);
    }
    json_response(['ok' => true, 'settings' => profile_items($pdo, $defaults)]);
}

json_response(['ok' => false, 'message' => 'Method not allowed.'], 405);
