<?php
/**
 * SISPAM Cloud & MySQL Sync Engine for Rumahweb (cPanel / Apache / LiteSpeed)
 * Domain: sispam.hakito.my.id
 *
 * Mendukung 2 Mode Penyimpanan Otomatis:
 * 1. Mode Database Relasional MySQL / MariaDB (Direkomendasikan untuk cPanel)
 * 2. Mode Berkas JSON Server (Fallback instan tanpa koding)
 */

// Header CORS & Keamanan
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

// Tangani preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
    @file_put_contents($dataDir . '/.htaccess', "Deny from all\n");
}

$dbConfigFile = __DIR__ . '/db_config.php';
$jsonDbFile   = $dataDir . '/sispam_database.json';
$action       = isset($_GET['action']) ? $_GET['action'] : '';

// Fungsi helper koneksi PDO MySQL
function getMySQLConnection() {
    global $dbConfigFile;
    if (!file_exists($dbConfigFile)) {
        return null;
    }
    $cfg = @include $dbConfigFile;
    if (!is_array($cfg) || empty($cfg['database']) || empty($cfg['username'])) {
        return null;
    }

    $host = !empty($cfg['host']) ? $cfg['host'] : 'localhost';
    $port = !empty($cfg['port']) ? $cfg['port'] : 3306;
    $db   = $cfg['database'];
    $user = $cfg['username'];
    $pass = isset($cfg['password']) ? $cfg['password'] : '';

    try {
        $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 5
        ]);

        // Pastikan tabel penampung sinkronisasi cloud siap
        $pdo->exec("CREATE TABLE IF NOT EXISTS `sispam_cloud_data` (
            `id` VARCHAR(50) NOT NULL PRIMARY KEY,
            `payload` LONGTEXT NOT NULL,
            `updated_at` DATETIME NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        return $pdo;
    } catch (Exception $e) {
        return null;
    }
}

// 1. Simpan Konfigurasi Database MySQL dari Form SISPAM
if ($action === 'save_db_config' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true);

    $host = !empty($payload['host']) ? trim($payload['host']) : 'localhost';
    $port = !empty($payload['port']) ? intval($payload['port']) : 3306;
    $database = !empty($payload['database']) ? trim($payload['database']) : '';
    $username = !empty($payload['username']) ? trim($payload['username']) : '';
    $password = isset($payload['password']) ? $payload['password'] : '';

    if (empty($database) || empty($username)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Nama database dan username wajib diisi.']);
        exit;
    }

    // Uji koneksi sebelum menyimpan
    try {
        $dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";
        $testPdo = new PDO($dsn, $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 5
        ]);
        
        $testPdo->exec("CREATE TABLE IF NOT EXISTS `sispam_cloud_data` (
            `id` VARCHAR(50) NOT NULL PRIMARY KEY,
            `payload` LONGTEXT NOT NULL,
            `updated_at` DATETIME NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Gagal terhubung ke MySQL: ' . $e->getMessage() . '. Pastikan database & user sudah dibuat di cPanel MySQL Wizard dan diberi ALL PRIVILEGES.'
        ]);
        exit;
    }

    // Tulis berkas db_config.php dengan aman
    $phpCode = "<?php\n// Konfigurasi Database MySQL SISPAM Rumahweb\nreturn " . var_export([
        'host' => $host,
        'port' => $port,
        'database' => $database,
        'username' => $username,
        'password' => $password,
        'configured_at' => date('Y-m-d H:i:s')
    ], true) . ";\n";

    @file_put_contents($dbConfigFile, $phpCode);

    echo json_encode([
        'status' => 'success',
        'message' => "Koneksi berhasil! Database MySQL [{$database}] aktif dan terhubung.",
        'database' => $database,
        'user' => $username,
        'time' => date('Y-m-d H:i:s')
    ]);
    exit;
}

// 2. Cek Status Server Hosting & Database
if ($action === 'status') {
    $pdo = getMySQLConnection();
    $usingMySQL = ($pdo !== null);

    $hasData = false;
    $lastModified = null;

    if ($usingMySQL) {
        try {
            $stmt = $pdo->query("SELECT updated_at FROM `sispam_cloud_data` WHERE id = 'main_database' LIMIT 1");
            $row = $stmt->fetch();
            if ($row) {
                $hasData = true;
                $lastModified = $row['updated_at'];
            }
        } catch (Exception $e) {}
    } else {
        $hasData = file_exists($jsonDbFile);
        $lastModified = $hasData ? date('Y-m-d H:i:s', filemtime($jsonDbFile)) : null;
    }

    echo json_encode([
        'status' => 'online',
        'server' => 'sispam.hakito.my.id',
        'time' => date('Y-m-d H:i:s'),
        'engine' => $usingMySQL ? 'MySQL Database (cPanel)' : 'JSON Server Storage',
        'has_database' => $hasData,
        'last_synced_at' => $lastModified,
        'message' => $usingMySQL 
            ? 'Terhubung resmi ke Database MySQL di cPanel Rumahweb.' 
            : 'Berjalan dengan modul penyimpanan Cloud File JSON (Database MySQL belum dikonfigurasi).'
    ]);
    exit;
}

// 3. PULL: Mengambil Data Terbaru dari Server ke Laptop / HP
if ($action === 'pull' || ($_SERVER['REQUEST_METHOD'] === 'GET' && empty($action))) {
    $pdo = getMySQLConnection();

    // Mode A: Tarik dari MySQL
    if ($pdo !== null) {
        try {
            $stmt = $pdo->prepare("SELECT payload, updated_at FROM `sispam_cloud_data` WHERE id = 'main_database' LIMIT 1");
            $stmt->execute();
            $row = $stmt->fetch();
            if ($row && !empty($row['payload'])) {
                $decoded = json_decode($row['payload'], true);
                echo json_encode([
                    'status' => 'success',
                    'engine' => 'mysql',
                    'server_time' => $row['updated_at'],
                    'data' => $decoded
                ]);
                exit;
            }
        } catch (Exception $e) {}
    }

    // Mode B: Fallback Tarik dari File JSON
    if (file_exists($jsonDbFile)) {
        $content = @file_get_contents($jsonDbFile);
        if (!empty($content)) {
            $decoded = json_decode($content, true);
            echo json_encode([
                'status' => 'success',
                'engine' => 'file',
                'server_time' => date('Y-m-d H:i:s', filemtime($jsonDbFile)),
                'data' => $decoded
            ]);
            exit;
        }
    }

    echo json_encode([
        'status' => 'empty',
        'message' => 'Basis data di server masih kosong. Akan otomatis terisi saat perangkat pertama menyimpan data.',
        'data' => null
    ]);
    exit;
}

// 4. PUSH: Mengirim Perubahan Data dari Laptop / HP ke Server Hosting
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    if (empty($rawInput)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Payload kosong']);
        exit;
    }

    $payload = json_decode($rawInput, true);
    if (!$payload) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Format JSON tidak valid']);
        exit;
    }

    $dataToSave = isset($payload['data']) ? $payload['data'] : $payload;
    if (is_array($dataToSave)) {
        $dataToSave['server_synced_at'] = date('Y-m-d H:i:s');
    }
    $encoded = json_encode($dataToSave, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    $now = date('Y-m-d H:i:s');

    $pdo = getMySQLConnection();
    $savedToMySQL = false;

    // Simpan ke MySQL jika aktif
    if ($pdo !== null) {
        try {
            $stmt = $pdo->prepare("INSERT INTO `sispam_cloud_data` (`id`, `payload`, `updated_at`) 
                VALUES ('main_database', :payload, :updated_at)
                ON DUPLICATE KEY UPDATE `payload` = VALUES(`payload`), `updated_at` = VALUES(`updated_at`)");
            $stmt->execute([
                ':payload' => $encoded,
                ':updated_at' => $now
            ]);
            $savedToMySQL = true;
        } catch (Exception $e) {
            $savedToMySQL = false;
        }
    }

    // Selalu simpan juga ke file JSON sebagai cadangan ganda (dual-redundancy)
    @file_put_contents($jsonDbFile, $encoded, LOCK_EX);

    echo json_encode([
        'status' => 'success',
        'engine' => $savedToMySQL ? 'MySQL Database (cPanel)' : 'JSON Server Storage',
        'message' => 'Data berhasil disinkronkan ke server sispam.hakito.my.id',
        'synced_at' => $now
    ]);
    exit;
}

echo json_encode(['status' => 'ready', 'message' => 'SISPAM Cloud Sync Engine']);
