<?php
// Database credentials config

define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'ptolemy');
define('DB_USER', 'root');
define('DB_PASS', '');

/**
 * Returns a PDO connection instance
 */
function getDBConnection() {
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
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Database connection failed: " . $e->getMessage()]);
            exit;
        }
    }
    return $pdo;
}

/**
 * Generate a random 15-character ID to mimic PocketBase behavior
 */
function generateId() {
    return substr(bin2hex(random_bytes(8)), 0, 15);
}
