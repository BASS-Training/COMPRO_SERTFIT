<?php
declare(strict_types=1);

$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
if (!is_string($requestPath)) {
    return false;
}

$requestPath = rawurldecode($requestPath);
if (preg_match('~^/([a-z0-9-]+)\.html$~i', $requestPath, $matches) === 1) {
    $htmlFile = __DIR__ . '/' . $matches[1] . '.html';
    if (is_file($htmlFile)) {
        header('Location: /' . $matches[1], true, 301);
        return true;
    }
}

if (preg_match('~^/([a-z0-9-]+)/?$~i', $requestPath, $matches) === 1) {
    $htmlFile = __DIR__ . '/' . $matches[1] . '.html';
    if (is_file($htmlFile)) {
        header('Content-Type: text/html; charset=UTF-8');
        readfile($htmlFile);
        return true;
    }
}

if ($requestPath === '/') {
    return false;
}

$rootPath = realpath(__DIR__);
$publicPath = realpath(__DIR__ . $requestPath);
$isPublicPath = $rootPath !== false
    && $publicPath !== false
    && ($publicPath === $rootPath || strpos($publicPath, $rootPath . DIRECTORY_SEPARATOR) === 0);
if ($isPublicPath && (is_file($publicPath) || is_dir($publicPath))) {
    return false;
}

http_response_code(404);
header('Content-Type: text/plain; charset=UTF-8');
echo 'Not found.';
return true;
