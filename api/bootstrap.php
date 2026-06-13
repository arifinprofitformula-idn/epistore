<?php

declare(strict_types=1);

const APP_YEAR = 2026;

function json_response(mixed $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function request_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        json_response(['message' => 'Payload JSON tidak valid.'], 400);
    }
    return $data;
}

function app_config(): array
{
    static $config;
    if ($config !== null) {
        return $config;
    }

    $file = __DIR__ . '/config.local.php';
    if (!is_file($file)) {
        json_response([
            'message' => 'Konfigurasi server belum tersedia. Buat api/config.local.php.',
        ], 503);
    }
    $config = require $file;
    return $config;
}

function db(): PDO
{
    static $pdo;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $database = app_config()['database'];
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        $database['host'],
        $database['port'],
        $database['name'],
    );
    $pdo = new PDO($dsn, $database['user'], $database['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    return $pdo;
}

function start_secure_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    $secure = (bool) (app_config()['app']['secure_cookie'] ?? true);
    session_name('epis_session');
    session_set_cookie_params([
        'lifetime' => 43200,
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function session_user(bool $required = true): ?array
{
    start_secure_session();
    $userId = $_SESSION['user_id'] ?? null;
    if (!$userId) {
        if ($required) {
            json_response(['message' => 'Silakan login kembali.'], 401);
        }
        return null;
    }

    $statement = db()->prepare(
        'SELECT id, name, role, is_active AS isActive FROM users WHERE id = ? LIMIT 1'
    );
    $statement->execute([$userId]);
    $user = $statement->fetch();
    if (!$user || !(bool) $user['isActive']) {
        session_destroy();
        if ($required) {
            json_response(['message' => 'Akun tidak aktif atau tidak ditemukan.'], 401);
        }
        return null;
    }

    $brands = db()->prepare(
        'SELECT brand_code
         FROM user_brands
         WHERE user_id = ?
         ORDER BY brand_code'
    );
    $brands->execute([$userId]);
    $user['id'] = (int) $user['id'];
    $user['isActive'] = (bool) $user['isActive'];
    $user['brandCodes'] = $brands->fetchAll(PDO::FETCH_COLUMN);
    return $user;
}

function require_admin(array $user): void
{
    if ($user['role'] !== 'admin') {
        json_response(['message' => 'Akses admin diperlukan.'], 403);
    }
}

function valid_pin(string $pin): bool
{
    return preg_match('/^\d{4,6}$/', $pin) === 1;
}

function normalize_brand_codes(mixed $values): array
{
    $allowed = ['goldgram', 'meezan_gold', 'silvergram'];
    if (!is_array($values)) {
        return [];
    }
    return array_values(array_unique(array_filter(
        array_map('strval', $values),
        static fn (string $value): bool => in_array($value, $allowed, true),
    )));
}

function amount(mixed $value): int
{
    if (!is_int($value) && !is_float($value) && !is_string($value)) {
        json_response(['message' => 'Nilai realisasi tidak valid.'], 400);
    }
    $number = filter_var($value, FILTER_VALIDATE_INT);
    if ($number === false || $number < 0) {
        json_response(['message' => 'Nilai realisasi tidak valid.'], 400);
    }
    return (int) $number;
}

function audit(
    PDO $pdo,
    int $userId,
    string $action,
    string $entity,
    string $entityId,
    mixed $oldValue,
    mixed $newValue,
): void {
    $statement = $pdo->prepare(
        'INSERT INTO audit_logs
         (user_id, action, entity, entity_id, old_value, new_value)
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    $statement->execute([
        $userId,
        $action,
        $entity,
        $entityId,
        $oldValue === null ? null : json_encode($oldValue),
        $newValue === null ? null : json_encode($newValue),
    ]);
}
