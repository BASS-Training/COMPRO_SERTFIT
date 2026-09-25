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
    'about_leader_kicker' => 'Sambutan Pimpinan',
    'about_leader_title' => 'Membangun kepercayaan melalui kompetensi',
    'about_leader_quote' => 'LSP FIT hadir untuk memastikan setiap proses sertifikasi berjalan objektif, profesional, dan memberi nilai nyata bagi peserta, dunia kerja, serta ekosistem pelatihan di Indonesia.',
    'about_leader_name' => 'Fitri Firmansyah',
    'about_leader_role' => 'Direktur LSP FIT',
    'about_video_kicker' => 'Kenali LSP FIT',
    'about_video_title' => 'Video perkenalan',
    'about_video_description' => 'Area ini disiapkan untuk menampilkan video profil dan layanan LSP FIT.',
    'about_video_url' => '',
    'about_video_note_label' => 'Siap diisi',
    'about_video_note_description' => 'Gunakan video yang menjelaskan profil lembaga, layanan sertifikasi, skema, dan alur pendaftaran.',
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

function valid_profile_video_url(string $url): bool
{
    if ($url === '') {
        return true;
    }

    if (preg_match('~^/assets/uploads/profile/[a-f0-9]{24}\.mp4$~', $url) === 1) {
        return true;
    }

    if (filter_var($url, FILTER_VALIDATE_URL) === false) {
        return false;
    }

    $parts = parse_url($url);
    $scheme = strtolower((string) ($parts['scheme'] ?? ''));
    $host = strtolower((string) ($parts['host'] ?? ''));
    $path = (string) ($parts['path'] ?? '');
    if (!in_array($scheme, ['http', 'https'], true) || $host === '' || isset($parts['user']) || isset($parts['pass'])) {
        return false;
    }

    $youtubeHost = preg_replace('/^(www\.|m\.)/', '', $host);
    $videoId = '';
    if ($youtubeHost === 'youtu.be') {
        $videoId = explode('/', trim($path, '/'))[0] ?? '';
    } elseif ($youtubeHost === 'youtube.com') {
        if (preg_match('~^/(?:embed|shorts)/([^/]+)~', $path, $matches) === 1) {
            $videoId = $matches[1];
        } else {
            parse_str((string) ($parts['query'] ?? ''), $query);
            $videoId = $path === '/watch' ? (string) ($query['v'] ?? '') : '';
        }
    }
    if ($videoId !== '') {
        return preg_match('/^[A-Za-z0-9_-]{6,}$/', $videoId) === 1;
    }

    return preg_match('/\.mp4$/i', $path) === 1;
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
    $maxVideoSize = 50 * 1024 * 1024;
    if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > $maxVideoSize + 1024 * 1024) {
        json_response(['ok' => false, 'message' => 'Ukuran video maksimal 50 MB.'], 413);
    }

    $input = [];
    foreach ($defaults as $key => $default) {
        $input[$key] = trim((string) ($_POST[$key] ?? $default));
    }
    $previousVideoStatement = $pdo->prepare('SELECT setting_value FROM site_settings WHERE setting_key = :setting_key LIMIT 1');
    $previousVideoStatement->execute(['setting_key' => 'about_video_url']);
    $previousVideoUrl = (string) ($previousVideoStatement->fetchColumn() ?: '');
    $videoFile = $_FILES['about_video_file'] ?? null;
    $hasVideoFile = $videoFile && ($videoFile['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE;
    $uploadedVideoPath = '';

    if ($hasVideoFile) {
        if (($videoFile['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            $uploadErrors = [
                UPLOAD_ERR_INI_SIZE => 'Ukuran video melebihi batas server.',
                UPLOAD_ERR_FORM_SIZE => 'Ukuran video melebihi batas form.',
                UPLOAD_ERR_PARTIAL => 'Video hanya terupload sebagian.',
                UPLOAD_ERR_NO_TMP_DIR => 'Folder sementara upload tidak tersedia.',
                UPLOAD_ERR_CANT_WRITE => 'Server tidak bisa menulis file video.',
                UPLOAD_ERR_EXTENSION => 'Upload video dihentikan oleh ekstensi server.',
            ];
            $errorCode = (int) ($videoFile['error'] ?? 0);
            json_response(['ok' => false, 'message' => $uploadErrors[$errorCode] ?? 'Upload video gagal.'], 422);
        }
        if (($videoFile['size'] ?? 0) > $maxVideoSize) {
            json_response(['ok' => false, 'message' => 'Ukuran video maksimal 50 MB.'], 422);
        }
        if (strtolower((string) pathinfo((string) ($videoFile['name'] ?? ''), PATHINFO_EXTENSION)) !== 'mp4') {
            json_response(['ok' => false, 'message' => 'Format video harus MP4.'], 422);
        }
        $fileInfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $fileInfo->file((string) $videoFile['tmp_name']);
        if (!in_array($mime, ['video/mp4', 'application/mp4'], true)) {
            json_response(['ok' => false, 'message' => 'Isi file video harus berformat MP4.'], 422);
        }

        $uploadDir = __DIR__ . '/../assets/uploads/profile';
        if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
            json_response(['ok' => false, 'message' => 'Folder upload video tidak bisa dibuat.'], 500);
        }
        $fileName = bin2hex(random_bytes(12)) . '.mp4';
        $target = $uploadDir . '/' . $fileName;
        if (!move_uploaded_file((string) $videoFile['tmp_name'], $target)) {
            json_response(['ok' => false, 'message' => 'Video gagal disimpan.'], 500);
        }
        $uploadedVideoPath = '/assets/uploads/profile/' . $fileName;
        $input['about_video_url'] = $uploadedVideoPath;
    } elseif (!valid_profile_video_url($input['about_video_url'])) {
        json_response(['ok' => false, 'message' => 'URL video harus berupa link YouTube atau file MP4 melalui HTTP/HTTPS.'], 422);
    }

    $statement = $pdo->prepare('INSERT INTO site_settings (setting_key, setting_value) VALUES (:setting_key, :setting_value) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)');
    try {
        foreach ($input as $key => $value) {
            $statement->execute([
                'setting_key' => $key,
                'setting_value' => $value,
            ]);
        }
    } catch (Throwable $error) {
        if ($uploadedVideoPath !== '') {
            @unlink(__DIR__ . '/..' . $uploadedVideoPath);
        }
        json_response(['ok' => false, 'message' => 'Profil website gagal disimpan.'], 500);
    }

    if ($previousVideoUrl !== $input['about_video_url'] && strpos($previousVideoUrl, '/assets/uploads/profile/') === 0) {
        $previousVideoPath = __DIR__ . '/..' . $previousVideoUrl;
        if (is_file($previousVideoPath)) {
            @unlink($previousVideoPath);
        }
    }
    json_response(['ok' => true, 'settings' => profile_items($pdo, $defaults)]);
}

json_response(['ok' => false, 'message' => 'Method not allowed.'], 405);
