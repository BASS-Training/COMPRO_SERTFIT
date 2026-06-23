<?php
declare(strict_types=1);

require __DIR__ . '/_bootstrap.php';

$defaults = [
    'about_title' => 'Tentang AFIN',
    'about_description' => 'Asosiasi Fasilitator Instruktur Nusantara (AFIN) merupakan wadah profesi bagi fasilitator, instruktur, trainer, dan praktisi pengembangan sumber daya manusia untuk memperkuat kompetensi, jejaring kolaborasi, serta kontribusi dalam peningkatan mutu pembelajaran di Indonesia.',
    'vision' => 'Menjadi asosiasi profesi yang kredibel, inklusif, dan berpengaruh dalam pengembangan fasilitator, instruktur, trainer, serta praktisi pembelajaran di Indonesia.',
    'mission' => "Menghimpun dan memperkuat jejaring fasilitator, instruktur, trainer, dan praktisi pengembangan SDM di berbagai sektor.\nMendorong peningkatan kompetensi, etika profesi, dan kualitas praktik fasilitasi serta pembelajaran berkelanjutan.\nMembangun ruang kolaborasi, berbagi pengetahuan, dan pengembangan program yang relevan dengan kebutuhan anggota dan masyarakat.\nMenjalin kemitraan strategis dengan lembaga pendidikan, pelatihan, industri, pemerintah, dan komunitas profesi untuk memperluas dampak asosiasi.\nMemberikan dukungan advokasi, informasi, dan penguatan kapasitas bagi anggota agar mampu berkontribusi secara profesional.",
    'contact_email' => 'info@afin.or.id',
    'contact_website' => 'www.afin.or.id',
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
