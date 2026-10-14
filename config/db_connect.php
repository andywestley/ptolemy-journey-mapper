<?php
/**
 * Core Database Connection Loader
 */

// Load the environment credentials config
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/logger.php';

/**
 * Returns a PDO connection instance
 */
function getDBConnection($exitOnError = true) {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );
            ensureSchemaUpToDate($pdo);
        } catch (PDOException $e) {
            if (function_exists('app_log')) {
                app_log('CRITICAL', "Database connection failed: " . $e->getMessage());
            } else {
                error_log("Database connection failed: " . $e->getMessage());
            }
            if ($exitOnError) {
                http_response_code(500);
                echo json_encode(["error" => "Database connection error."]);
                exit;
            }
            return null;
        }
    }
    return $pdo;
}

/**
 * Ensures database columns for Admin and Service Accounts exist
 */
function ensureSchemaUpToDate($pdo) {
    static $checked = false;
    if ($checked) return;
    $checked = true;

    try {
        // 1. is_admin column
        $cols = $pdo->query("SHOW COLUMNS FROM users LIKE 'is_admin'")->fetchAll();
        if (empty($cols)) {
            $pdo->exec("ALTER TABLE users ADD COLUMN is_admin TINYINT(1) DEFAULT 0");
            $pdo->exec("UPDATE users SET is_admin = 1 WHERE email = 'andy@andrewwestley.co.uk'");
        }

        // 2. username column
        $cols = $pdo->query("SHOW COLUMNS FROM users LIKE 'username'")->fetchAll();
        if (empty($cols)) {
            $pdo->exec("ALTER TABLE users ADD COLUMN username VARCHAR(100) UNIQUE NULL AFTER name");
        }

        // 3. is_service_account column
        $cols = $pdo->query("SHOW COLUMNS FROM users LIKE 'is_service_account'")->fetchAll();
        if (empty($cols)) {
            $pdo->exec("ALTER TABLE users ADD COLUMN is_service_account TINYINT(1) DEFAULT 0 AFTER is_admin");
        }

        // 4. Make email column nullable for service accounts
        $emailCol = $pdo->query("SHOW COLUMNS FROM users WHERE Field = 'email'")->fetch();
        if ($emailCol && strtoupper($emailCol['Null']) === 'NO') {
            $pdo->exec("ALTER TABLE users MODIFY COLUMN email VARCHAR(255) NULL");
        }

        // 5. is_public column on journeys table
        $cols = $pdo->query("SHOW COLUMNS FROM journeys LIKE 'is_public'")->fetchAll();
        if (empty($cols)) {
            $pdo->exec("ALTER TABLE journeys ADD COLUMN is_public TINYINT(1) DEFAULT 0 AFTER journey_status");
        }

        // 6. Auto-seed journeys if table is completely empty
        $count = (int)$pdo->query("SELECT COUNT(*) FROM journeys")->fetchColumn();
        if ($count === 0) {
            $seedScript = dirname(__DIR__) . '/scripts/seed_pocketbase_data.php';
            if (file_exists($seedScript)) {
                require_once $seedScript;
                if (function_exists('seedPocketBaseData')) {
                    $results = seedPocketBaseData($pdo);
                    if (function_exists('app_log')) {
                        app_log('INFO', 'Database auto-seeded successfully with original PocketBase data', $results);
                    }
                }
            }
        }
    } catch (Exception $e) {
        if (function_exists('app_log')) {
            app_log('WARNING', "Schema auto-update notice: " . $e->getMessage());
        } else {
            error_log("Schema auto-update notice: " . $e->getMessage());
        }
    }
}

/**
 * Initialize a secure PHP session across all endpoints
 */
function initSecureSession() {
    if (session_status() === PHP_SESSION_NONE) {
        ini_set('session.cookie_httponly', '1');
        ini_set('session.cookie_samesite', 'Lax');
        ini_set('session.use_strict_mode', '1');

        $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https')
            || (isset($_SERVER['HTTP_X_FORWARDED_SSL']) && $_SERVER['HTTP_X_FORWARDED_SSL'] === 'on')
            || (isset($_SERVER['SERVER_PORT']) && (int)$_SERVER['SERVER_PORT'] === 443);

        if ($isHttps) {
            ini_set('session.cookie_secure', '1');
        }
        session_start();
    }
}

/**
 * Generate a random 15-character ID to mimic PocketBase behavior
 */
function generateId() {
    return substr(bin2hex(random_bytes(8)), 0, 15);
}
