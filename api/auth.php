<?php
declare(strict_types=1);

require __DIR__ . '/_bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    json_response([
        'ok' => true,
        'authenticated' => is_admin(),
        'role' => current_admin_role(),
        'username' => $_SESSION['admin_username'] ?? null,
        'name' => $_SESSION['admin_name'] ?? null,
    ]);
}

if ($method !== 'POST') {
    json_response(['ok' => false, 'message' => 'Method not allowed.'], 405);
}

$action = $_POST['action'] ?? 'login';

if ($action === 'logout') {
    $_SESSION = [];
    session_destroy();
    json_response(['ok' => true, 'authenticated' => false]);
}

try {
    $config = app_config();
} catch (Throwable $error) {
    json_response(['ok' => false, 'message' => 'Backend belum dikonfigurasi.'], 503);
}

$username = trim((string) ($_POST['username'] ?? ''));
$password = (string) ($_POST['password'] ?? '');

try {
    $pdo = db();
    $statement = $pdo->prepare('SELECT * FROM admin_users WHERE username = :username AND is_active = 1 LIMIT 1');
    $statement->execute(['username' => $username]);
    $adminUser = $statement->fetch();

    if ($adminUser && password_verify($password, (string) $adminUser['password_hash'])) {
        session_regenerate_id(true);
        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_user_id'] = (int) $adminUser['id'];
        $_SESSION['admin_username'] = $adminUser['username'];
        $_SESSION['admin_name'] = $adminUser['name'];
        $_SESSION['admin_role'] = $adminUser['role'];

        $update = $pdo->prepare('UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = :id');
        $update->execute(['id' => $adminUser['id']]);

        json_response([
            'ok' => true,
            'authenticated' => true,
            'role' => $adminUser['role'],
            'username' => $adminUser['username'],
            'name' => $adminUser['name'],
        ]);
    }
} catch (Throwable $error) {
    // Keep config-based login as fallback for servers that have not migrated admin_users yet.
}

if (
    hash_equals((string) ($config['admin_username'] ?? ''), $username)
    && password_verify($password, (string) ($config['admin_password_hash'] ?? ''))
) {
    session_regenerate_id(true);
    $_SESSION['admin_logged_in'] = true;
    $_SESSION['admin_username'] = $username;
    $_SESSION['admin_name'] = 'Super Admin';
    $_SESSION['admin_role'] = 'super_admin';
    json_response([
        'ok' => true,
        'authenticated' => true,
        'role' => 'super_admin',
        'username' => $username,
        'name' => 'Super Admin',
    ]);
}

json_response(['ok' => false, 'message' => 'Username atau password salah.'], 401);
