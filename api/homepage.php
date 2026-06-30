<?php
declare(strict_types=1);

require __DIR__ . '/_bootstrap.php';

$defaults = [
    'home_hero_title' => 'Asosiasi Fasilitator Instruktur Nusantara',
    'home_hero_description' => 'Asosiasi Fasilitator Instruktur Nusantara menjadi wadah kolaborasi bagi fasilitator, instruktur, trainer, dan praktisi pengembangan SDM untuk memperkuat kompetensi, jejaring profesional, serta kontribusi dalam peningkatan kualitas pembelajaran di Indonesia.',
    'home_hero_button_text' => 'Hubungi Kami',
    'home_hero_button_url' => '/kontak.html',
    'home_hero_image' => 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
    'home_activities_kicker' => 'Kegiatan Terbaru',
    'home_activities_title' => 'Kegiatan AFIN',
    'home_activities_description' => 'Kumpulan kegiatan terbaru AFIN sebagai ruang silaturahmi, kolaborasi, dan penguatan jejaring profesional.',
    'home_profile_kicker' => 'Tentang AFIN',
    'home_profile_title' => 'Profil Singkat AFIN',
    'home_profile_card_title' => 'Dukungan Asosiasi',
    'home_profile_card_description' => 'AFIN menjadi wadah kolaborasi bagi fasilitator, instruktur, trainer, dan praktisi pengembangan SDM untuk memperkuat kompetensi, jejaring profesional, dan kontribusi pembelajaran di Indonesia.',
    'home_members_kicker' => 'Anggota',
    'home_members_title' => 'Anggota Perkumpulan Profesional',
    'home_partners_kicker' => 'Mitra & Kerjasama',
    'home_partners_title' => 'Jaringan Kolaborasi AFIN',
    'home_cta_title' => 'Ingin Bergabung dengan AFIN?',
    'home_cta_description' => 'Jadi bagian dari jejaring profesional fasilitator, instruktur, trainer, dan praktisi pengembangan SDM di Indonesia.',
    'home_cta_button_text' => 'Daftar Sekarang',
    'home_cta_button_url' => 'https://wa.me/6281112101007?text=Halo%20AFIN%2C%20saya%20ingin%20bergabung%20sebagai%20anggota',
    'home_show_activities' => '1',
    'home_show_profile' => '1',
    'home_show_members' => '1',
    'home_show_partners' => '1',
    'home_show_cta' => '1',
    'home_section_order' => 'activities,profile,members,partners,cta',
];

function homepage_items(PDO $pdo, array $defaults): array
{
    $settings = $defaults;
    $keys = array_keys($defaults);
    $placeholders = implode(',', array_fill(0, count($keys), '?'));
    $statement = $pdo->prepare("SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ({$placeholders})");
    $statement->execute($keys);
    foreach ($statement->fetchAll() as $row) {
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
    json_response(['ok' => true, 'settings' => homepage_items($pdo, $defaults), 'configured' => true]);
}

if ($method === 'POST') {
    require_admin();
    $pdo = db();
    $statement = $pdo->prepare('INSERT INTO site_settings (setting_key, setting_value) VALUES (:setting_key, :setting_value) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)');
    foreach ($defaults as $key => $default) {
        $value = strpos($key, 'home_show_') === 0
            ? (isset($_POST[$key]) && $_POST[$key] === '1' ? '1' : '0')
            : trim((string) ($_POST[$key] ?? $default));
        $statement->execute([
            'setting_key' => $key,
            'setting_value' => $value,
        ]);
    }
    json_response(['ok' => true, 'settings' => homepage_items($pdo, $defaults)]);
}

json_response(['ok' => false, 'message' => 'Method not allowed.'], 405);
