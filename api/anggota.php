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
        ? 'SELECT * FROM anggota ORDER BY is_active DESC, sort_order DESC, name ASC'
        : 'SELECT * FROM anggota WHERE is_active = 1 ORDER BY sort_order DESC, name ASC';
    $items = array_map('anggota_payload', $pdo->query($sql)->fetchAll());
    json_response(['ok' => true, 'items' => $items, 'configured' => true]);
}

if ($method === 'POST') {
    require_admin();
    $action = trim((string) ($_POST['action'] ?? 'create'));
    $pdo = db();

    if ($action === 'toggle_active') {
        $id = trim((string) ($_POST['id'] ?? ''));
        $isActive = (int) ((string) ($_POST['is_active'] ?? '1') === '1');
        if ($id === '') json_response(['ok' => false, 'message' => 'ID anggota wajib diisi.'], 422);
        $statement = $pdo->prepare('UPDATE anggota SET is_active = :is_active WHERE id = :id');
        $statement->execute(['id' => $id, 'is_active' => $isActive]);
        json_response(['ok' => true, 'isActive' => (bool) $isActive]);
    }

    $id = trim((string) ($_POST['id'] ?? ''));
    $name = trim((string) ($_POST['name'] ?? ''));
    $roleLabel = trim((string) ($_POST['role_label'] ?? 'Anggota Perkumpulan'));
    $sortOrder = (int) ($_POST['sort_order'] ?? 0);
    $image = $_FILES['photo'] ?? null;

    if ($name === '') {
        json_response(['ok' => false, 'message' => 'Nama anggota wajib diisi.'], 422);
    }

    $photoUrl = 'https://ui-avatars.com/api/?name=' . rawurlencode($name) . '&size=600&background=E6F4FB&color=0D1B2A';
    if ($action === 'update') {
        if ($id === '') {
            json_response(['ok' => false, 'message' => 'ID anggota wajib diisi.'], 422);
        }
        $existing = $pdo->prepare('SELECT * FROM anggota WHERE id = :id LIMIT 1');
        $existing->execute(['id' => $id]);
        $existingRow = $existing->fetch();
        if (!$existingRow) {
            json_response(['ok' => false, 'message' => 'Data anggota tidak ditemukan.'], 404);
        }
        $photoUrl = $existingRow['photo_url'];
    }

    if ($image && ($image['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK) {
        if (($image['size'] ?? 0) > 4 * 1024 * 1024) {
            json_response(['ok' => false, 'message' => 'Ukuran foto maksimal 4 MB.'], 422);
        }
        $info = @getimagesize((string) $image['tmp_name']);
        $mime = $info['mime'] ?? '';
        $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
        if (!isset($extensions[$mime])) {
            json_response(['ok' => false, 'message' => 'Format foto harus JPG, PNG, atau WEBP.'], 422);
        }
        $uploadDir = __DIR__ . '/../assets/uploads/anggota';
        if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
            json_response(['ok' => false, 'message' => 'Folder upload anggota tidak bisa dibuat.'], 500);
        }
        $fileName = bin2hex(random_bytes(12)) . '.' . $extensions[$mime];
        if (!move_uploaded_file((string) $image['tmp_name'], $uploadDir . '/' . $fileName)) {
            json_response(['ok' => false, 'message' => 'Foto anggota gagal disimpan.'], 500);
        }
        $photoUrl = '/assets/uploads/anggota/' . $fileName;
    }

    if ($action === 'update') {
        $statement = $pdo->prepare('UPDATE anggota SET name = :name, role_label = :role_label, photo_url = :photo_url, sort_order = :sort_order WHERE id = :id');
        $statement->execute([
            'id' => $id,
            'name' => $name,
            'role_label' => $roleLabel !== '' ? $roleLabel : 'Anggota Perkumpulan',
            'photo_url' => $photoUrl,
            'sort_order' => $sortOrder,
        ]);
    } else {
        $statement = $pdo->prepare('INSERT INTO anggota (name, role_label, photo_url, sort_order) VALUES (:name, :role_label, :photo_url, :sort_order)');
        $statement->execute([
            'name' => $name,
            'role_label' => $roleLabel !== '' ? $roleLabel : 'Anggota Perkumpulan',
            'photo_url' => $photoUrl,
            'sort_order' => $sortOrder,
        ]);
        $id = (string) $pdo->lastInsertId();
    }

    $fetch = $pdo->prepare('SELECT * FROM anggota WHERE id = :id LIMIT 1');
    $fetch->execute(['id' => $id]);
    json_response(['ok' => true, 'item' => anggota_payload($fetch->fetch())], 201);
}

if ($method === 'DELETE') {
    require_admin();
    $id = trim((string) ($_GET['id'] ?? ''));
    if ($id === '') json_response(['ok' => false, 'message' => 'ID anggota wajib diisi.'], 422);
    $pdo = db();
    $statement = $pdo->prepare('DELETE FROM anggota WHERE id = :id');
    $statement->execute(['id' => $id]);
    json_response(['ok' => true]);
}

json_response(['ok' => false, 'message' => 'Method not allowed.'], 405);
