<?php
declare(strict_types=1);

require __DIR__ . '/_bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    try {
        $pdo = db();
    } catch (Throwable $error) {
        json_response(['ok' => true, 'items' => [], 'configured' => false]);
    }

    $includeInactive = isset($_GET['all']) && is_admin();
    $sql = $includeInactive
        ? 'SELECT * FROM partners ORDER BY is_active DESC, sort_order DESC, name ASC'
        : 'SELECT * FROM partners WHERE is_active = 1 ORDER BY sort_order DESC, name ASC';
    $items = array_map('partner_payload', $pdo->query($sql)->fetchAll());
    json_response(['ok' => true, 'items' => $items, 'configured' => true]);
}

if ($method === 'POST') {
    require_admin();
    $action = trim((string) ($_POST['action'] ?? 'create'));
    $pdo = db();

    if ($action === 'toggle_active') {
        $id = trim((string) ($_POST['id'] ?? ''));
        $isActive = (int) ((string) ($_POST['is_active'] ?? '1') === '1');
        if ($id === '') json_response(['ok' => false, 'message' => 'ID mitra wajib diisi.'], 422);
        $statement = $pdo->prepare('UPDATE partners SET is_active = :is_active WHERE id = :id');
        $statement->execute(['id' => $id, 'is_active' => $isActive]);
        json_response(['ok' => true, 'isActive' => (bool) $isActive]);
    }

    $id = trim((string) ($_POST['id'] ?? ''));
    $name = trim((string) ($_POST['name'] ?? ''));
    $websiteUrl = trim((string) ($_POST['website_url'] ?? ''));
    $sortOrder = (int) ($_POST['sort_order'] ?? 0);
    $logo = $_FILES['logo'] ?? null;

    if ($name === '') {
        json_response(['ok' => false, 'message' => 'Nama mitra wajib diisi.'], 422);
    }

    $logoUrl = '';
    if ($action === 'update') {
        if ($id === '') json_response(['ok' => false, 'message' => 'ID mitra wajib diisi.'], 422);
        $existing = $pdo->prepare('SELECT * FROM partners WHERE id = :id LIMIT 1');
        $existing->execute(['id' => $id]);
        $existingRow = $existing->fetch();
        if (!$existingRow) json_response(['ok' => false, 'message' => 'Data mitra tidak ditemukan.'], 404);
        $logoUrl = $existingRow['logo_url'];
    }

    if ($logo && ($logo['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK) {
        if (($logo['size'] ?? 0) > 4 * 1024 * 1024) {
            json_response(['ok' => false, 'message' => 'Ukuran logo maksimal 4 MB.'], 422);
        }
        $info = @getimagesize((string) $logo['tmp_name']);
        $mime = $info['mime'] ?? '';
        $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
        if (!isset($extensions[$mime])) {
            json_response(['ok' => false, 'message' => 'Format logo harus JPG, PNG, atau WEBP.'], 422);
        }
        $uploadDir = __DIR__ . '/../assets/uploads/mitra';
        if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
            json_response(['ok' => false, 'message' => 'Folder upload mitra tidak bisa dibuat.'], 500);
        }
        $fileName = bin2hex(random_bytes(12)) . '.' . $extensions[$mime];
        if (!move_uploaded_file((string) $logo['tmp_name'], $uploadDir . '/' . $fileName)) {
            json_response(['ok' => false, 'message' => 'Logo mitra gagal disimpan.'], 500);
        }
        $logoUrl = '/assets/uploads/mitra/' . $fileName;
    }

    if ($logoUrl === '') {
        json_response(['ok' => false, 'message' => 'Logo mitra wajib diupload.'], 422);
    }

    if ($action === 'update') {
        $statement = $pdo->prepare('UPDATE partners SET name = :name, logo_url = :logo_url, website_url = :website_url, sort_order = :sort_order WHERE id = :id');
        $statement->execute(['id' => $id, 'name' => $name, 'logo_url' => $logoUrl, 'website_url' => $websiteUrl ?: null, 'sort_order' => $sortOrder]);
    } else {
        $statement = $pdo->prepare('INSERT INTO partners (name, logo_url, website_url, sort_order) VALUES (:name, :logo_url, :website_url, :sort_order)');
        $statement->execute(['name' => $name, 'logo_url' => $logoUrl, 'website_url' => $websiteUrl ?: null, 'sort_order' => $sortOrder]);
        $id = (string) $pdo->lastInsertId();
    }

    $fetch = $pdo->prepare('SELECT * FROM partners WHERE id = :id LIMIT 1');
    $fetch->execute(['id' => $id]);
    json_response(['ok' => true, 'item' => partner_payload($fetch->fetch())], 201);
}

if ($method === 'DELETE') {
    require_admin();
    $id = trim((string) ($_GET['id'] ?? ''));
    if ($id === '') json_response(['ok' => false, 'message' => 'ID mitra wajib diisi.'], 422);
    $pdo = db();
    $statement = $pdo->prepare('DELETE FROM partners WHERE id = :id');
    $statement->execute(['id' => $id]);
    json_response(['ok' => true]);
}

json_response(['ok' => false, 'message' => 'Method not allowed.'], 405);
