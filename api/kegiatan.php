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

    $id = trim((string) ($_GET['id'] ?? ''));
    if ($id !== '') {
        if (ctype_digit($id)) {
            $statement = $pdo->prepare('SELECT * FROM kegiatan WHERE id = :id AND is_active = 1 LIMIT 1');
            $statement->execute(['id' => $id]);
        } else {
            $statement = $pdo->prepare('SELECT * FROM kegiatan WHERE slug = :slug AND is_active = 1 LIMIT 1');
            $statement->execute(['slug' => $id]);
        }
        $row = $statement->fetch();
        if (!$row && !ctype_digit($id) && strpos($id, 'kegiatan-') !== 0) {
            $statement = $pdo->prepare('SELECT * FROM kegiatan WHERE slug = :slug AND is_active = 1 LIMIT 1');
            $statement->execute(['slug' => 'kegiatan-' . $id]);
            $row = $statement->fetch();
        }
        if (!$row) {
            json_response(['ok' => false, 'message' => 'Kegiatan tidak ditemukan.'], 404);
        }
        json_response(['ok' => true, 'item' => kegiatan_payload($row)]);
    }

    $limit = max(1, min(50, (int) ($_GET['limit'] ?? 50)));
    $statement = $pdo->prepare('SELECT * FROM kegiatan WHERE is_active = 1 ORDER BY sort_order DESC, created_at DESC, id DESC LIMIT :limit');
    $statement->bindValue('limit', $limit, PDO::PARAM_INT);
    $statement->execute();
    $items = array_map('kegiatan_payload', $statement->fetchAll());
    json_response(['ok' => true, 'items' => $items, 'configured' => true]);
}

if ($method === 'POST') {
    require_admin();

    $action = trim((string) ($_POST['action'] ?? 'create'));
    if ($action === 'toggle_highlight') {
        $id = trim((string) ($_POST['id'] ?? ''));
        $isHighlight = (int) ((string) ($_POST['is_highlight'] ?? '0') === '1');
        if ($id === '') {
            json_response(['ok' => false, 'message' => 'ID kegiatan wajib diisi.'], 422);
        }

        $pdo = db();
        $statement = $pdo->prepare('UPDATE kegiatan SET is_highlight = :is_highlight WHERE id = :id');
        $statement->execute([
            'id' => $id,
            'is_highlight' => $isHighlight,
        ]);

        json_response(['ok' => true, 'isHighlight' => (bool) $isHighlight]);
    }

    $title = trim((string) ($_POST['title'] ?? ''));
    $category = trim((string) ($_POST['category'] ?? 'Kegiatan'));
    $summary = trim((string) ($_POST['summary'] ?? ''));
    $description = trim((string) ($_POST['description'] ?? ''));
    $isHighlight = (int) ((string) ($_POST['is_highlight'] ?? '0') === '1');
    $image = $_FILES['image'] ?? null;
    $id = trim((string) ($_POST['id'] ?? ''));

    if ($title === '' || $summary === '' || $description === '') {
        json_response(['ok' => false, 'message' => 'Judul, ringkasan, dan deskripsi wajib diisi.'], 422);
    }

    $pdo = db();
    $existingRow = null;
    if ($action === 'update') {
        if ($id === '') {
            json_response(['ok' => false, 'message' => 'ID kegiatan wajib diisi.'], 422);
        }

        $existing = $pdo->prepare('SELECT * FROM kegiatan WHERE id = :id LIMIT 1');
        $existing->execute(['id' => $id]);
        $existingRow = $existing->fetch();
        if (!$existingRow) {
            json_response(['ok' => false, 'message' => 'Kegiatan tidak ditemukan.'], 404);
        }
    }

    $hasImage = $image && ($image['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE;
    if (!$hasImage && $action !== 'update') {
        json_response(['ok' => false, 'message' => 'Foto wajib diisi untuk kegiatan baru.'], 422);
    }

    $imageUrl = $existingRow['image_url'] ?? '';
    if ($hasImage) {
        if (($image['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            json_response(['ok' => false, 'message' => 'Upload foto gagal.'], 422);
        }

        if (($image['size'] ?? 0) > 4 * 1024 * 1024) {
            json_response(['ok' => false, 'message' => 'Ukuran foto maksimal 4 MB.'], 422);
        }

        $info = @getimagesize((string) $image['tmp_name']);
        $mime = $info['mime'] ?? '';
        $extensions = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
        ];

        if (!isset($extensions[$mime])) {
            json_response(['ok' => false, 'message' => 'Format foto harus JPG, PNG, atau WEBP.'], 422);
        }

        $uploadDir = __DIR__ . '/../assets/uploads/kegiatan';
        if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
            json_response(['ok' => false, 'message' => 'Folder upload tidak bisa dibuat.'], 500);
        }

        $fileName = bin2hex(random_bytes(12)) . '.' . $extensions[$mime];
        $target = $uploadDir . '/' . $fileName;
        if (!move_uploaded_file((string) $image['tmp_name'], $target)) {
            json_response(['ok' => false, 'message' => 'Foto gagal disimpan.'], 500);
        }
        $imageUrl = '/assets/uploads/kegiatan/' . $fileName;
    }

    $baseSlug = slugify($title);
    $slug = $baseSlug;
    $counter = 2;
    while (true) {
        if ($action === 'update') {
            $check = $pdo->prepare('SELECT id FROM kegiatan WHERE slug = :slug AND id <> :id LIMIT 1');
            $check->execute([
                'slug' => $slug,
                'id' => $id,
            ]);
        } else {
            $check = $pdo->prepare('SELECT id FROM kegiatan WHERE slug = :slug LIMIT 1');
            $check->execute(['slug' => $slug]);
        }
        if (!$check->fetch()) {
            break;
        }
        $slug = $baseSlug . '-' . $counter;
        $counter++;
    }

    if ($action === 'update') {
        $statement = $pdo->prepare(
            'UPDATE kegiatan SET title = :title, slug = :slug, category = :category, summary = :summary, description = :description, image_url = :image_url, is_highlight = :is_highlight WHERE id = :id'
        );
        $statement->execute([
            'id' => $id,
            'title' => $title,
            'slug' => $slug,
            'category' => $category !== '' ? $category : 'Kegiatan',
            'summary' => $summary,
            'description' => $description,
            'image_url' => $imageUrl,
            'is_highlight' => $isHighlight,
        ]);
    } else {
        $statement = $pdo->prepare(
            'INSERT INTO kegiatan (title, slug, category, summary, description, image_url, is_highlight) VALUES (:title, :slug, :category, :summary, :description, :image_url, :is_highlight)'
        );
        $statement->execute([
            'title' => $title,
            'slug' => $slug,
            'category' => $category !== '' ? $category : 'Kegiatan',
            'summary' => $summary,
            'description' => $description,
            'image_url' => $imageUrl,
            'is_highlight' => $isHighlight,
        ]);

        $id = (string) $pdo->lastInsertId();
    }

    $fetch = $pdo->prepare('SELECT * FROM kegiatan WHERE id = :id LIMIT 1');
    $fetch->execute(['id' => $id]);
    json_response(['ok' => true, 'item' => kegiatan_payload($fetch->fetch())], $action === 'update' ? 200 : 201);
}

if ($method === 'DELETE') {
    require_admin();
    $id = trim((string) ($_GET['id'] ?? ''));
    if ($id === '') {
        json_response(['ok' => false, 'message' => 'ID kegiatan wajib diisi.'], 422);
    }

    $pdo = db();
    $fetch = $pdo->prepare('SELECT image_url FROM kegiatan WHERE id = :id LIMIT 1');
    $fetch->execute(['id' => $id]);
    $row = $fetch->fetch();

    $statement = $pdo->prepare('DELETE FROM kegiatan WHERE id = :id');
    $statement->execute(['id' => $id]);

    if ($row && strpos((string) $row['image_url'], '/assets/uploads/kegiatan/') === 0) {
        $path = __DIR__ . '/..' . $row['image_url'];
        if (is_file($path)) {
            @unlink($path);
        }
    }

    json_response(['ok' => true]);
}

json_response(['ok' => false, 'message' => 'Method not allowed.'], 405);
