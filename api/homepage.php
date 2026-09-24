<?php
declare(strict_types=1);

require __DIR__ . '/_bootstrap.php';

$defaults = [
    'home_hero_title' => 'LSP FIT untuk kompetensi profesional yang diakui.',
    'home_hero_description' => 'LSP FIT menyelenggarakan sertifikasi kompetensi bagi fasilitator, instruktur, dan tenaga kepelatihan dengan standar BNSP dan kebutuhan dunia kerja.',
    'home_hero_button_text' => 'Lihat Skema Sertifikasi',
    'home_hero_button_url' => '/kegiatan.html',
    'home_hero_image' => '/assets/lspfit/logofit-nobg.png',
    'home_activities_kicker' => 'LSP FIT dalam angka',
    'home_activities_title' => 'Pengalaman dan jangkauan nasional',
    'home_activities_description' => 'Sertifikasi kompetensi yang dikelola secara profesional, terukur, dan mudah diakses.',
    'home_profile_kicker' => 'Tentang LSP FIT',
    'home_profile_title' => 'Lembaga Sertifikasi Profesi berlisensi BNSP',
    'home_profile_card_title' => 'Berlisensi BNSP',
    'home_profile_card_description' => 'LSP FIT memiliki lisensi BNSP LSP-444-ID dan melaksanakan sertifikasi mengacu SKKNI No. 333 Tahun 2020.',
    'home_members_kicker' => 'Struktur LSP FIT',
    'home_members_title' => 'Tim pengelola sertifikasi profesional',
    'home_partners_kicker' => 'Mitra & Kerjasama',
    'home_partners_title' => 'Jaringan kolaborasi LSP FIT',
    'home_cta_title' => 'Siap mengikuti sertifikasi kompetensi?',
    'home_cta_description' => 'Hubungi tim LSP FIT untuk mendapatkan informasi skema, persyaratan, jadwal, dan proses pendaftaran.',
    'home_cta_button_text' => 'Konsultasi Sekarang',
    'home_cta_button_url' => '/kontak.html',
    'home_show_activities' => '0',
    'home_show_profile' => '1',
    'home_show_members' => '1',
    'home_show_partners' => '1',
    'home_show_cta' => '1',
    'home_section_order' => 'profile,members,partners,cta',
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
    $heroImageUrl = trim((string) ($_POST['home_hero_image'] ?? ''));
    $heroImage = $_FILES['home_hero_image_file'] ?? null;
    if ($heroImage && ($heroImage['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
        if (($heroImage['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            $uploadErrors = [
                UPLOAD_ERR_INI_SIZE => 'Ukuran file melebihi batas server.',
                UPLOAD_ERR_FORM_SIZE => 'Ukuran file melebihi batas form.',
                UPLOAD_ERR_PARTIAL => 'File hanya terupload sebagian.',
                UPLOAD_ERR_NO_TMP_DIR => 'Folder sementara upload tidak tersedia.',
                UPLOAD_ERR_CANT_WRITE => 'Server tidak bisa menulis file upload.',
                UPLOAD_ERR_EXTENSION => 'Upload dihentikan oleh ekstensi server.',
            ];
            $errorCode = (int) ($heroImage['error'] ?? 0);
            json_response(['ok' => false, 'message' => $uploadErrors[$errorCode] ?? 'Upload gambar hero gagal.'], 422);
        }
        if (($heroImage['size'] ?? 0) > 4 * 1024 * 1024) {
            json_response(['ok' => false, 'message' => 'Ukuran gambar hero maksimal 4 MB.'], 422);
        }
        $imageInfo = @getimagesize((string) $heroImage['tmp_name']);
        $mime = $imageInfo['mime'] ?? '';
        $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
        if (!isset($extensions[$mime])) {
            json_response(['ok' => false, 'message' => 'Format gambar hero harus JPG, PNG, atau WEBP.'], 422);
        }
        $uploadDir = __DIR__ . '/../assets/uploads/homepage';
        if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
            json_response(['ok' => false, 'message' => 'Folder upload homepage tidak bisa dibuat.'], 500);
        }
        $fileName = bin2hex(random_bytes(12)) . '.' . $extensions[$mime];
        if (!move_uploaded_file((string) $heroImage['tmp_name'], $uploadDir . '/' . $fileName)) {
            json_response(['ok' => false, 'message' => 'Gambar hero gagal disimpan.'], 500);
        }
        $heroImageUrl = '/assets/uploads/homepage/' . $fileName;
    }
    $statement = $pdo->prepare('INSERT INTO site_settings (setting_key, setting_value) VALUES (:setting_key, :setting_value) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)');
    foreach ($defaults as $key => $default) {
        $value = strpos($key, 'home_show_') === 0
            ? (isset($_POST[$key]) && $_POST[$key] === '1' ? '1' : '0')
            : trim((string) ($_POST[$key] ?? $default));
        if ($key === 'home_hero_image' && $heroImageUrl !== '') {
            $value = $heroImageUrl;
        }
        $statement->execute([
            'setting_key' => $key,
            'setting_value' => $value,
        ]);
    }
    json_response(['ok' => true, 'settings' => homepage_items($pdo, $defaults)]);
}

json_response(['ok' => false, 'message' => 'Method not allowed.'], 405);
