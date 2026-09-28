<?php
declare(strict_types=1);

require __DIR__ . '/_bootstrap.php';

function delete_instructor_upload(string $photoUrl): void
{
    if (strpos($photoUrl, '/assets/uploads/instruktur/') !== 0) {
        return;
    }
    $path = __DIR__ . '/..' . $photoUrl;
    if (is_file($path)) {
        @unlink($path);
    }
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    try {
        $pdo = db();
    } catch (Throwable $error) {
        json_response(['ok' => true, 'items' => [], 'configured' => false]);
    }

    $includeInactive = isset($_GET['all']) && is_admin();
    $sql = $includeInactive
        ? 'SELECT * FROM instruktur ORDER BY is_active DESC, sort_order DESC, name ASC'
        : 'SELECT * FROM instruktur WHERE is_active = 1 ORDER BY sort_order DESC, name ASC';
    $items = array_map('instruktur_payload', $pdo->query($sql)->fetchAll());
    json_response(['ok' => true, 'items' => $items, 'configured' => true]);
}

if ($method === 'POST') {
    require_admin();
    $pdo = db();
    $action = trim((string) ($_POST['action'] ?? 'create'));

    if ($action === 'toggle_active') {
        $id = trim((string) ($_POST['id'] ?? ''));
        $isActive = (int) ((string) ($_POST['is_active'] ?? '1') === '1');
        if ($id === '') json_response(['ok' => false, 'message' => 'ID instruktur wajib diisi.'], 422);
        $statement = $pdo->prepare('UPDATE instruktur SET is_active = :is_active WHERE id = :id');
        $statement->execute(['id' => $id, 'is_active' => $isActive]);
        json_response(['ok' => true, 'isActive' => (bool) $isActive]);
    }

    $id = trim((string) ($_POST['id'] ?? ''));
    $name = trim((string) ($_POST['name'] ?? ''));
    $sortOrder = (int) ($_POST['sort_order'] ?? 0);
    $photo = $_FILES['photo'] ?? null;

    if ($name === '') {
        json_response(['ok' => false, 'message' => 'Nama instruktur wajib diisi.'], 422);
    }

    $existingPhotoUrl = '';
    if ($action === 'update') {
        if ($id === '') json_response(['ok' => false, 'message' => 'ID instruktur wajib diisi.'], 422);
        $existing = $pdo->prepare('SELECT * FROM instruktur WHERE id = :id LIMIT 1');
        $existing->execute(['id' => $id]);
        $existingRow = $existing->fetch();
        if (!$existingRow) json_response(['ok' => false, 'message' => 'Data instruktur tidak ditemukan.'], 404);
        $existingPhotoUrl = (string) $existingRow['photo_url'];
    }

    $hasPhoto = $photo && ($photo['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE;
    if ($action !== 'update' && !$hasPhoto) {
        json_response(['ok' => false, 'message' => 'Foto instruktur wajib diupload.'], 422);
    }

    $photoUrl = $existingPhotoUrl;
    $newUploadPath = '';
    if ($hasPhoto) {
        if (($photo['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            json_response(['ok' => false, 'message' => 'Upload foto instruktur gagal.'], 422);
        }
        if (($photo['size'] ?? 0) > 4 * 1024 * 1024) {
            json_response(['ok' => false, 'message' => 'Ukuran foto maksimal 4 MB.'], 422);
        }
        $info = @getimagesize((string) $photo['tmp_name']);
        $mime = $info['mime'] ?? '';
        $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png'];
        if (!isset($extensions[$mime])) {
            json_response(['ok' => false, 'message' => 'Format foto harus JPG atau PNG.'], 422);
        }
        $uploadDir = __DIR__ . '/../assets/uploads/instruktur';
        if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
            json_response(['ok' => false, 'message' => 'Folder upload instruktur tidak bisa dibuat.'], 500);
        }
        $fileName = bin2hex(random_bytes(12)) . '.' . $extensions[$mime];
        if (!move_uploaded_file((string) $photo['tmp_name'], $uploadDir . '/' . $fileName)) {
            json_response(['ok' => false, 'message' => 'Foto instruktur gagal disimpan.'], 500);
        }
        $photoUrl = '/assets/uploads/instruktur/' . $fileName;
        $newUploadPath = $photoUrl;
    }

    try {
        if ($action === 'update') {
            $statement = $pdo->prepare('UPDATE instruktur SET name = :name, photo_url = :photo_url, sort_order = :sort_order WHERE id = :id');
            $statement->execute(['id' => $id, 'name' => $name, 'photo_url' => $photoUrl, 'sort_order' => $sortOrder]);
        } else {
            $statement = $pdo->prepare('INSERT INTO instruktur (name, photo_url, sort_order) VALUES (:name, :photo_url, :sort_order)');
            $statement->execute(['name' => $name, 'photo_url' => $photoUrl, 'sort_order' => $sortOrder]);
            $id = (string) $pdo->lastInsertId();
        }
    } catch (Throwable $error) {
        if ($newUploadPath !== '') delete_instructor_upload($newUploadPath);
        json_response(['ok' => false, 'message' => 'Data instruktur gagal disimpan.'], 500);
    }

    if ($newUploadPath !== '' && $existingPhotoUrl !== '') {
        delete_instructor_upload($existingPhotoUrl);
    }
    $fetch = $pdo->prepare('SELECT * FROM instruktur WHERE id = :id LIMIT 1');
    $fetch->execute(['id' => $id]);
    json_response(['ok' => true, 'item' => instruktur_payload($fetch->fetch())], 201);
}

if ($method === 'DELETE') {
    require_admin();
    $id = trim((string) ($_GET['id'] ?? ''));
    if ($id === '') json_response(['ok' => false, 'message' => 'ID instruktur wajib diisi.'], 422);
    $pdo = db();
    $statement = $pdo->prepare('SELECT photo_url FROM instruktur WHERE id = :id LIMIT 1');
    $statement->execute(['id' => $id]);
    $photoUrl = (string) ($statement->fetchColumn() ?: '');
    $delete = $pdo->prepare('DELETE FROM instruktur WHERE id = :id');
    $delete->execute(['id' => $id]);
    delete_instructor_upload($photoUrl);
    json_response(['ok' => true]);
}

json_response(['ok' => false, 'message' => 'Method not allowed.'], 405);
