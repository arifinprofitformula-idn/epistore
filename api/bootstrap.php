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

    ensure_user_brands_schema();
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
    $user['canReadAllStores'] = $user['role'] === 'admin';
    if ($user['role'] === 'admin') {
        $user['storeCodes'] = [];
        return $user;
    }

    ensure_user_stores_schema();
    $stores = db()->prepare(
        'SELECT store_code
         FROM user_stores
         WHERE user_id = ?
         ORDER BY store_code'
    );
    $stores->execute([$userId]);
    $user['storeCodes'] = array_map('intval', $stores->fetchAll(PDO::FETCH_COLUMN));
    return $user;
}

function ensure_user_brands_schema(): void
{
    static $ready = false;
    if ($ready) {
        return;
    }

    db()->exec(
        "CREATE TABLE IF NOT EXISTS user_brands (
           user_id BIGINT UNSIGNED NOT NULL,
           brand_code ENUM('goldgram', 'meezan_gold', 'silvergram') NOT NULL,
           PRIMARY KEY (user_id, brand_code),
           CONSTRAINT fk_php_user_brands_user
             FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
         ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
    db()->exec(
        "INSERT IGNORE INTO user_brands (user_id, brand_code)
         SELECT id, 'goldgram' FROM users
         WHERE role = 'be'
           AND NOT EXISTS (
             SELECT 1 FROM user_brands ub WHERE ub.user_id = users.id
           )"
    );
    $ready = true;
}

function ensure_user_stores_schema(): void
{
    static $ready = false;
    if ($ready) {
        return;
    }

    db()->exec(
        "CREATE TABLE IF NOT EXISTS user_stores (
           user_id BIGINT UNSIGNED NOT NULL,
           store_code SMALLINT UNSIGNED NOT NULL,
           PRIMARY KEY (user_id, store_code),
           CONSTRAINT fk_php_user_stores_user
             FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
           CONSTRAINT fk_php_user_stores_store
             FOREIGN KEY (store_code) REFERENCES stores(store_code) ON DELETE CASCADE
         ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
    $columnNames = table_columns('user_stores');
    if (!in_array('store_code', $columnNames, true)) {
        db()->exec(
            "ALTER TABLE user_stores
             ADD COLUMN store_code SMALLINT UNSIGNED NULL AFTER user_id"
        );
        if (in_array('store_id', $columnNames, true)) {
            db()->exec(
                "UPDATE user_stores us
                 JOIN stores s ON s.id = us.store_id
                 SET us.store_code = s.store_code
                 WHERE us.store_code IS NULL"
            );
        }
        db()->exec('DELETE FROM user_stores WHERE store_code IS NULL');
        db()->exec(
            "ALTER TABLE user_stores
             MODIFY store_code SMALLINT UNSIGNED NOT NULL"
        );
    }
    $columnNames = table_columns('user_stores');
    if (in_array('store_id', $columnNames, true)) {
        db()->exec(
            "INSERT IGNORE INTO user_stores (user_id, store_id, store_code)
             SELECT u.id, s.id, s.store_code
             FROM users u
             JOIN stores s
             WHERE u.role <> 'admin'
               AND NOT EXISTS (
                 SELECT 1 FROM user_stores us WHERE us.user_id = u.id
               )"
        );
    } else {
        db()->exec(
            "INSERT IGNORE INTO user_stores (user_id, store_code)
             SELECT u.id, s.store_code
             FROM users u
             JOIN stores s
             WHERE u.role <> 'admin'
               AND NOT EXISTS (
                 SELECT 1 FROM user_stores us WHERE us.user_id = u.id
               )"
        );
    }
    $ready = true;
}

function table_columns(string $tableName): array
{
    $statement = db()->prepare(
        "SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?"
    );
    $statement->execute([$tableName]);
    return $statement->fetchAll(PDO::FETCH_COLUMN);
}

function require_admin(array $user): void
{
    if ($user['role'] !== 'admin') {
        json_response(['message' => 'Akses admin diperlukan.'], 403);
    }
}

function require_writer(array $user): void
{
    if (!in_array($user['role'], ['admin', 'be'], true)) {
        json_response(['message' => 'Akun ini hanya memiliki akses lihat.'], 403);
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

function normalize_store_codes(mixed $values): array
{
    if (!is_array($values)) {
        return [];
    }
    $codes = [];
    foreach ($values as $value) {
        $code = filter_var($value, FILTER_VALIDATE_INT);
        if ($code !== false && $code >= 0) {
            $codes[] = (int) $code;
        }
    }
    return array_values(array_unique($codes));
}

function normalize_role(mixed $value): string
{
    $role = (string) $value;
    return in_array($role, ['admin', 'be', 'viewer'], true) ? $role : 'be';
}

function ensure_user_roles_schema(): void
{
    db()->exec(
        "ALTER TABLE users
         MODIFY role ENUM('admin', 'be', 'viewer') NOT NULL DEFAULT 'be'"
    );
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
