<?php
declare(strict_types=1);

session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();

function json_response(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function app_config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $path = __DIR__ . '/../config/config.php';
    if (!is_file($path)) {
        throw new RuntimeException('Config file is missing.');
    }

    $config = require $path;
    return is_array($config) ? $config : [];
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $config = app_config();
    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=utf8mb4',
        $config['db_host'] ?? '127.0.0.1',
        $config['db_name'] ?? ''
    );

    $pdo = new PDO($dsn, $config['db_user'] ?? '', $config['db_pass'] ?? '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $pdo;
}

function is_admin(): bool
{
    return isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
}

function current_admin_role(): string
{
    return (string) ($_SESSION['admin_role'] ?? '');
}

function is_super_admin(): bool
{
    return is_admin() && current_admin_role() === 'super_admin';
}

function require_admin(): void
{
    if (!is_admin()) {
        json_response(['ok' => false, 'message' => 'Unauthorized.'], 401);
    }
}

function require_super_admin(): void
{
    if (!is_super_admin()) {
        json_response(['ok' => false, 'message' => 'Super admin access required.'], 403);
    }
}

function slugify(string $value): string
{
    $value = strtolower(trim($value));
    $value = preg_replace('/[^a-z0-9]+/i', '-', $value) ?: '';
    $value = trim($value, '-');
    return $value !== '' ? $value : 'kegiatan';
}

function kegiatan_payload(array $row): array
{
    return [
        'id' => (string) $row['id'],
        'slug' => $row['slug'],
        'title' => $row['title'],
        'category' => $row['category'],
        'summary' => $row['summary'],
        'description' => $row['description'],
        'image' => $row['image_url'],
        'isHighlight' => (bool) ($row['is_highlight'] ?? false),
        'createdAt' => $row['created_at'],
    ];
}

function anggota_payload(array $row): array
{
    return [
        'id' => (string) $row['id'],
        'name' => $row['name'],
        'roleLabel' => $row['role_label'],
        'photo' => $row['photo_url'],
        'isActive' => (bool) ($row['is_active'] ?? true),
        'sortOrder' => (int) ($row['sort_order'] ?? 0),
    ];
}

function partner_payload(array $row): array
{
    return [
        'id' => (string) $row['id'],
        'name' => $row['name'],
        'logo' => $row['logo_url'],
        'websiteUrl' => $row['website_url'] ?? '',
        'isActive' => (bool) ($row['is_active'] ?? true),
        'sortOrder' => (int) ($row['sort_order'] ?? 0),
    ];
}
