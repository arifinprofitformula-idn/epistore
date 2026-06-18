<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

header('Cache-Control: no-store');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/api', PHP_URL_PATH);
$path = preg_replace('#^/api#', '', (string) $path) ?: '/';

try {
    if ($method === 'POST' && $path === '/install') {
        install_application();
    }

    if ($method === 'GET' && $path === '/session') {
        json_response(['session' => session_user(false)]);
    }

    if ($method === 'POST' && $path === '/login') {
        login();
    }

    if ($method === 'POST' && $path === '/logout') {
        start_secure_session();
        $_SESSION = [];
        session_destroy();
        setcookie('epis_session', '', time() - 3600, '/');
        http_response_code(204);
        exit;
    }

    $user = session_user();

    if ($method === 'GET' && $path === '/bootstrap') {
        bootstrap_data($user);
    }

    if ($method === 'PUT' && preg_match('#^/realisations/(\d+)/(\d+)$#', $path, $matches)) {
        require_writer($user);
        save_realisation($user, (int) $matches[1], (int) $matches[2]);
    }

    if ($method === 'POST' && $path === '/realisations/import') {
        require_admin($user);
        import_realisations($user);
    }

    if ($method === 'GET' && $path === '/users') {
        require_admin($user);
        list_users();
    }

    if ($method === 'POST' && $path === '/users') {
        require_admin($user);
        create_user($user);
    }

    if ($method === 'PATCH' && preg_match('#^/users/(\d+)$#', $path, $matches)) {
        require_admin($user);
        update_user($user, (int) $matches[1]);
    }

    json_response(['message' => 'Endpoint tidak ditemukan.'], 404);
} catch (PDOException $error) {
    error_log($error->__toString());
    json_response(['message' => 'Terjadi kesalahan database. Periksa konfigurasi dan log server.'], 500);
} catch (Throwable $error) {
    error_log($error->__toString());
    json_response(['message' => 'Terjadi kesalahan pada server.'], 500);
}

function install_application(): never
{
    $body = request_body();
    $expectedKey = (string) (app_config()['app']['install_key'] ?? '');
    if ($expectedKey === '' || !hash_equals($expectedKey, (string) ($body['installKey'] ?? ''))) {
        json_response(['message' => 'Kunci instalasi tidak valid.'], 403);
    }

    $pdo = db();
    $schema = file_get_contents(dirname(__DIR__) . '/database/schema.sql');
    if ($schema === false) {
        throw new RuntimeException('Schema database tidak ditemukan.');
    }
    $pdo->exec($schema);
    $pdo->exec(
        "ALTER TABLE users
         MODIFY role ENUM('admin', 'be', 'viewer') NOT NULL DEFAULT 'be'"
    );

    $master = json_decode(
        (string) file_get_contents(dirname(__DIR__) . '/server/master-data.json'),
        true,
        flags: JSON_THROW_ON_ERROR,
    );

    $pdo->beginTransaction();
    try {
        $storeStatement = $pdo->prepare(
            'INSERT INTO stores
             (store_code, name, segment, gold_target, meezan_target, silver_target)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               name = VALUES(name),
               segment = VALUES(segment),
               gold_target = VALUES(gold_target),
               meezan_target = VALUES(meezan_target),
               silver_target = VALUES(silver_target)'
        );
        foreach ($master['stores'] as $index => $store) {
            $storeStatement->execute([
                $index,
                $store['n'],
                $store['seg'],
                $store['g'],
                $store['m'],
                $store['s'],
            ]);
        }

        $userCount = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
        $adminId = null;
        if ($userCount === 0) {
            $adminPin = (string) (app_config()['app']['default_admin_pin'] ?? '9999');
            $bePin = (string) (app_config()['app']['default_be_pin'] ?? '1234');
            $statement = $pdo->prepare(
                "INSERT INTO users (name, role, pin_hash) VALUES (?, ?, ?)"
            );
            $statement->execute(['Admin', 'admin', password_hash($adminPin, PASSWORD_DEFAULT)]);
            $adminId = (int) $pdo->lastInsertId();
            $statement->execute(['BE Default', 'be', password_hash($bePin, PASSWORD_DEFAULT)]);
            $beId = (int) $pdo->lastInsertId();
            $assign = $pdo->prepare(
                "INSERT INTO user_brands (user_id, brand_code) VALUES (?, 'goldgram')"
            );
            $assign->execute([$beId]);
        } else {
            $adminId = $pdo->query(
                "SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1"
            )->fetchColumn() ?: null;
        }

        $realisationCount = (int) $pdo->query('SELECT COUNT(*) FROM realisations')->fetchColumn();
        if ($realisationCount === 0) {
            $seed = $pdo->prepare(
                'INSERT INTO realisations
                 (store_id, year, month_index, gold, meezan, silver, note, submitted_by, submitted_name)
                 SELECT id, ?, ?, ?, ?, ?, ?, ?, ?
                 FROM stores WHERE store_code = ?'
            );
            foreach ($master['seedData'] as $key => $value) {
                [$storeCode, $monthIndex] = array_map('intval', explode('-', $key));
                $seed->execute([
                    APP_YEAR,
                    $monthIndex,
                    $value['g'],
                    $value['m'],
                    $value['s'],
                    'Data awal import',
                    $adminId,
                    $value['be'] ?? 'Import',
                    $storeCode,
                ]);
            }
        }

        $pdo->exec(
            "INSERT IGNORE INTO user_brands (user_id, brand_code)
             SELECT id, 'goldgram' FROM users
             WHERE role = 'be'
               AND NOT EXISTS (
                 SELECT 1 FROM user_brands ub WHERE ub.user_id = users.id
               )"
        );

        $pdo->commit();
        json_response([
            'message' => 'Database berhasil diinisialisasi.',
            'stores' => count($master['stores']),
            'seedEntries' => count($master['seedData']),
        ]);
    } catch (Throwable $error) {
        $pdo->rollBack();
        throw $error;
    }
}

function login(): never
{
    $pin = trim((string) (request_body()['pin'] ?? ''));
    if (!valid_pin($pin)) {
        json_response(['message' => 'PIN tidak valid. Coba lagi.'], 401);
    }

    $users = db()->query(
        'SELECT id, pin_hash FROM users WHERE is_active = TRUE ORDER BY id'
    )->fetchAll();
    $matchedId = null;
    foreach ($users as $candidate) {
        if (password_verify($pin, $candidate['pin_hash'])) {
            $matchedId = (int) $candidate['id'];
            break;
        }
    }
    if ($matchedId === null) {
        json_response(['message' => 'PIN tidak valid. Coba lagi.'], 401);
    }

    start_secure_session();
    session_regenerate_id(true);
    $_SESSION['user_id'] = $matchedId;
    json_response(['session' => session_user()]);
}

function bootstrap_data(array $user): never
{
    if ($user['role'] !== 'admin' && $user['storeCodes'] === []) {
        json_response([
            'data' => [],
            'session' => $user,
            'access' => [
                'canReadAllStores' => false,
                'readableStoreCodes' => [],
                'writableBrandCodes' => $user['role'] === 'be' ? $user['brandCodes'] : [],
            ],
        ]);
    }
    $storeFilter = '';
    $parameters = [APP_YEAR];
    if ($user['role'] !== 'admin') {
        $placeholders = implode(',', array_fill(0, count($user['storeCodes']), '?'));
        $storeFilter = " AND s.store_code IN ({$placeholders})";
        array_push($parameters, ...$user['storeCodes']);
    }
    $statement = db()->prepare(
        'SELECT
           s.store_code AS storeIndex,
           r.month_index AS monthIndex,
           r.gold AS g,
           r.meezan AS m,
           r.silver AS s,
           r.note,
           r.submitted_name AS be,
           r.updated_at AS ts
         FROM realisations r
         JOIN stores s ON s.id = r.store_id
         WHERE r.year = ?' . $storeFilter . '
         ORDER BY s.store_code, r.month_index'
    );
    $statement->execute($parameters);
    $data = [];
    foreach ($statement as $row) {
        $data[$row['storeIndex'] . '-' . $row['monthIndex']] = [
            'g' => (int) $row['g'],
            'm' => (int) $row['m'],
            's' => (int) $row['s'],
            'note' => $row['note'] ?? '',
            'be' => $row['be'],
            'ts' => $row['ts'],
        ];
    }
    json_response([
        'data' => $data,
        'session' => $user,
        'access' => [
            'canReadAllStores' => $user['role'] === 'admin',
            'readableStoreCodes' => $user['role'] === 'admin' ? null : $user['storeCodes'],
            'writableBrandCodes' => $user['role'] === 'admin'
                ? ['goldgram', 'meezan_gold', 'silvergram']
                : $user['brandCodes'],
        ],
    ]);
}

function save_realisation(array $user, int $storeIndex, int $monthIndex): never
{
    if ($monthIndex < 0 || $monthIndex > 11) {
        json_response(['message' => 'Periode tidak valid.'], 400);
    }
    if ($user['role'] !== 'admin' && $user['brandCodes'] === []) {
        json_response(['message' => 'Belum ada brand yang ditugaskan ke akun Anda.'], 403);
    }
    if ($user['role'] !== 'admin' && !in_array($storeIndex, $user['storeCodes'], true)) {
        json_response(['message' => 'Akun ini tidak memiliki akses ke EPI Store tersebut.'], 403);
    }

    $body = request_body();
    $submitted = [
        'g' => amount($body['g'] ?? null),
        'm' => amount($body['m'] ?? null),
        's' => amount($body['s'] ?? null),
    ];

    $pdo = db();
    $pdo->beginTransaction();
    try {
        $storeStatement = $pdo->prepare('SELECT id FROM stores WHERE store_code = ? FOR UPDATE');
        $storeStatement->execute([$storeIndex]);
        $storeId = $storeStatement->fetchColumn();
        if (!$storeId) {
            json_response(['message' => 'EPI Store tidak ditemukan.'], 404);
        }

        $oldStatement = $pdo->prepare(
            'SELECT gold AS g, meezan AS m, silver AS s, note, submitted_name AS be
             FROM realisations WHERE store_id = ? AND year = ? AND month_index = ?'
        );
        $oldStatement->execute([$storeId, APP_YEAR, $monthIndex]);
        $old = $oldStatement->fetch() ?: null;
        $entry = [
            'g' => (int) ($old['g'] ?? 0),
            'm' => (int) ($old['m'] ?? 0),
            's' => (int) ($old['s'] ?? 0),
            'note' => mb_substr(trim((string) ($body['note'] ?? '')), 0, 2000),
            'be' => $user['name'],
            'ts' => gmdate('c'),
        ];
        $fieldByBrand = [
            'goldgram' => 'g',
            'meezan_gold' => 'm',
            'silvergram' => 's',
        ];
        $allowedBrands = $user['role'] === 'admin'
            ? array_keys($fieldByBrand)
            : $user['brandCodes'];
        foreach ($allowedBrands as $brandCode) {
            $field = $fieldByBrand[$brandCode];
            $entry[$field] = $submitted[$field];
        }

        $save = $pdo->prepare(
            'INSERT INTO realisations
             (store_id, year, month_index, gold, meezan, silver, note, submitted_by, submitted_name)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               gold = VALUES(gold),
               meezan = VALUES(meezan),
               silver = VALUES(silver),
               note = VALUES(note),
               submitted_by = VALUES(submitted_by),
               submitted_name = VALUES(submitted_name)'
        );
        $save->execute([
            $storeId,
            APP_YEAR,
            $monthIndex,
            $entry['g'], $entry['m'], $entry['s'],
            $entry['note'],
            $user['id'],
            $user['name'],
        ]);
        audit(
            $pdo,
            $user['id'],
            $old ? 'update' : 'create',
            'realisation',
            $storeIndex . '-' . $monthIndex,
            $old,
            $entry,
        );
        $pdo->commit();
        json_response(['key' => $storeIndex . '-' . $monthIndex, 'entry' => $entry]);
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }
}

function import_realisations(array $user): never
{
    $rows = request_body()['rows'] ?? [];
    if (!is_array($rows) || count($rows) === 0 || count($rows) > 5000) {
        json_response(['message' => 'Data import kosong atau terlalu besar.'], 400);
    }

    $pdo = db();
    $pdo->beginTransaction();
    try {
        $findStore = $pdo->prepare('SELECT id FROM stores WHERE store_code = ?');
        $save = $pdo->prepare(
            "INSERT INTO realisations
             (store_id, year, month_index, gold, meezan, silver, note, submitted_by, submitted_name)
             VALUES (?, ?, ?, ?, ?, ?, 'Import CSV', ?, ?)
             ON DUPLICATE KEY UPDATE
               gold = VALUES(gold),
               meezan = VALUES(meezan),
               silver = VALUES(silver),
               note = VALUES(note),
               submitted_by = VALUES(submitted_by),
               submitted_name = VALUES(submitted_name)"
        );
        $saved = [];
        foreach ($rows as $row) {
            $storeIndex = filter_var($row['storeIndex'] ?? null, FILTER_VALIDATE_INT);
            $monthIndex = filter_var($row['monthIndex'] ?? null, FILTER_VALIDATE_INT);
            if ($storeIndex === false || $monthIndex === false || $monthIndex < 0 || $monthIndex > 11) {
                json_response(['message' => 'Salah satu baris import tidak valid.'], 400);
            }
            $findStore->execute([$storeIndex]);
            $storeId = $findStore->fetchColumn();
            if (!$storeId) {
                json_response(['message' => "Store index {$storeIndex} tidak ditemukan."], 400);
            }
            $g = amount($row['g'] ?? null);
            $m = amount($row['m'] ?? null);
            $s = amount($row['s'] ?? null);
            $save->execute([$storeId, APP_YEAR, $monthIndex, $g, $m, $s, $user['id'], $user['name']]);
            $saved[$storeIndex . '-' . $monthIndex] = [
                'g' => $g,
                'm' => $m,
                's' => $s,
                'note' => 'Import CSV',
                'be' => $user['name'],
                'ts' => gmdate('c'),
            ];
        }
        audit($pdo, $user['id'], 'import', 'realisation', 'batch-' . time(), null, [
            'rowCount' => count($rows),
        ]);
        $pdo->commit();
        json_response(['data' => $saved, 'count' => count($rows)]);
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }
}

function list_users(): never
{
    ensure_user_stores_schema();
    $rows = db()->query(
        'SELECT
           u.id,
           u.name,
           u.role,
           u.is_active AS isActive,
           GROUP_CONCAT(DISTINCT ub.brand_code ORDER BY ub.brand_code) AS brandCodes,
           GROUP_CONCAT(DISTINCT us.store_code ORDER BY us.store_code) AS storeCodes
         FROM users u
         LEFT JOIN user_brands ub ON ub.user_id = u.id
         LEFT JOIN user_stores us ON us.user_id = u.id
         GROUP BY u.id
         ORDER BY u.role, u.name'
    )->fetchAll();
    foreach ($rows as &$row) {
        $row['id'] = (int) $row['id'];
        $row['isActive'] = (bool) $row['isActive'];
        $row['brandCodes'] = $row['brandCodes'] === null
            ? []
            : explode(',', $row['brandCodes']);
        $row['storeCodes'] = $row['storeCodes'] === null
            ? []
            : array_map('intval', explode(',', $row['storeCodes']));
    }
    json_response(['users' => $rows]);
}

function assert_unique_pin(PDO $pdo, string $pin, ?int $exceptUserId = null): void
{
    $sql = 'SELECT id, pin_hash FROM users WHERE is_active = TRUE';
    $parameters = [];
    if ($exceptUserId !== null) {
        $sql .= ' AND id <> ?';
        $parameters[] = $exceptUserId;
    }
    $statement = $pdo->prepare($sql);
    $statement->execute($parameters);
    foreach ($statement as $candidate) {
        if (password_verify($pin, $candidate['pin_hash'])) {
            json_response(['message' => 'PIN sudah digunakan pengguna lain.'], 409);
        }
    }
}

function create_user(array $admin): never
{
    ensure_user_roles_schema();
    ensure_user_stores_schema();
    $body = request_body();
    $name = mb_substr(trim((string) ($body['name'] ?? '')), 0, 120);
    $pin = trim((string) ($body['pin'] ?? ''));
    $role = normalize_role($body['role'] ?? 'be');
    $brands = normalize_brand_codes($body['brandCodes'] ?? []);
    $stores = normalize_store_codes($body['storeCodes'] ?? []);
    if ($name === '' || !valid_pin($pin)) {
        json_response(['message' => 'Nama dan PIN 4-6 digit wajib diisi.'], 400);
    }

    $pdo = db();
    assert_unique_pin($pdo, $pin);
    $pdo->beginTransaction();
    try {
        $statement = $pdo->prepare(
            'INSERT INTO users (name, role, pin_hash) VALUES (?, ?, ?)'
        );
        $statement->execute([$name, $role, password_hash($pin, PASSWORD_DEFAULT)]);
        $userId = (int) $pdo->lastInsertId();
        assign_brands($pdo, $userId, $role === 'be' ? $brands : []);
        assign_stores($pdo, $userId, $role === 'admin' ? [] : $stores);
        audit($pdo, $admin['id'], 'create', 'user', (string) $userId, null, [
            'name' => $name,
            'role' => $role,
            'brandCodes' => $brands,
            'storeCodes' => $stores,
        ]);
        $pdo->commit();
        json_response(['id' => $userId], 201);
    } catch (Throwable $error) {
        $pdo->rollBack();
        throw $error;
    }
}

function update_user(array $admin, int $userId): never
{
    ensure_user_roles_schema();
    ensure_user_stores_schema();
    $body = request_body();
    $name = mb_substr(trim((string) ($body['name'] ?? '')), 0, 120);
    $pin = trim((string) ($body['pin'] ?? ''));
    $role = normalize_role($body['role'] ?? 'be');
    $isActive = ($body['isActive'] ?? true) !== false;
    $brands = normalize_brand_codes($body['brandCodes'] ?? []);
    $stores = normalize_store_codes($body['storeCodes'] ?? []);
    if ($name === '' || ($pin !== '' && !valid_pin($pin))) {
        json_response(['message' => 'Data pengguna tidak valid.'], 400);
    }
    if ($userId === $admin['id'] && (!$isActive || $role !== 'admin')) {
        json_response([
            'message' => 'Admin tidak dapat menonaktifkan atau menurunkan peran akunnya sendiri.',
        ], 400);
    }

    $pdo = db();
    if ($pin !== '') {
        assert_unique_pin($pdo, $pin, $userId);
    }
    $pdo->beginTransaction();
    try {
        $oldStatement = $pdo->prepare(
            'SELECT id, name, role, is_active AS isActive FROM users WHERE id = ? FOR UPDATE'
        );
        $oldStatement->execute([$userId]);
        $old = $oldStatement->fetch();
        if (!$old) {
            json_response(['message' => 'Pengguna tidak ditemukan.'], 404);
        }

        if ($pin !== '') {
            $statement = $pdo->prepare(
                'UPDATE users SET name = ?, role = ?, is_active = ?, pin_hash = ? WHERE id = ?'
            );
            $statement->execute([
                $name,
                $role,
                $isActive,
                password_hash($pin, PASSWORD_DEFAULT),
                $userId,
            ]);
        } else {
            $statement = $pdo->prepare(
                'UPDATE users SET name = ?, role = ?, is_active = ? WHERE id = ?'
            );
            $statement->execute([$name, $role, $isActive, $userId]);
        }
        assign_brands($pdo, $userId, $role === 'be' ? $brands : []);
        assign_stores($pdo, $userId, $role === 'admin' ? [] : $stores);
        audit($pdo, $admin['id'], 'update', 'user', (string) $userId, $old, [
            'name' => $name,
            'role' => $role,
            'isActive' => $isActive,
            'brandCodes' => $brands,
            'storeCodes' => $stores,
            'pinChanged' => $pin !== '',
        ]);
        $pdo->commit();
        json_response(['ok' => true]);
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }
}

function assign_brands(PDO $pdo, int $userId, array $brandCodes): void
{
    $delete = $pdo->prepare('DELETE FROM user_brands WHERE user_id = ?');
    $delete->execute([$userId]);
    if ($brandCodes === []) {
        return;
    }
    $insert = $pdo->prepare(
        'INSERT INTO user_brands (user_id, brand_code) VALUES (?, ?)'
    );
    foreach ($brandCodes as $brandCode) {
        $insert->execute([$userId, $brandCode]);
    }
}

function assign_stores(PDO $pdo, int $userId, array $storeCodes): void
{
    $delete = $pdo->prepare('DELETE FROM user_stores WHERE user_id = ?');
    $delete->execute([$userId]);
    if ($storeCodes === []) {
        return;
    }
    $insert = $pdo->prepare(
        'INSERT INTO user_stores (user_id, store_code) VALUES (?, ?)'
    );
    foreach ($storeCodes as $storeCode) {
        $insert->execute([$userId, $storeCode]);
    }
}
