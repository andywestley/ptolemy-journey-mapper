<?php
/**
 * CLI User Management Script for Ptolemy
 *
 * Usage:
 *   php scripts/create_user.php <email> <password> [name]
 *   php scripts/create_user.php --list
 */

require_once __DIR__ . '/../config/db_connect.php';

if ($argc < 2 || ($argc < 3 && $argv[1] !== '--list')) {
    echo "Usage:\n";
    echo "  php scripts/create_user.php <email_or_username> <password> [name] [--admin] [--service]\n";
    echo "  php scripts/create_user.php --list\n\n";
    echo "Examples:\n";
    echo "  php scripts/create_user.php user@example.com MyPass123! \"Standard User\"\n";
    echo "  php scripts/create_user.php site-audit AuditPass123! \"Site Audit Bot\" --service\n";
    echo "  php scripts/create_user.php admin@example.com AdminPass123! \"Super Admin\" --admin\n";
    exit(1);
}

$db = getDBConnection();

// List users flag
if ($argv[1] === '--list') {
    $stmt = $db->query("SELECT id, name, username, email, is_admin, is_service_account, created_at FROM users ORDER BY created_at DESC");
    $users = $stmt->fetchAll();
    echo "--- Ptolemy Users (" . count($users) . ") ---\n";
    foreach ($users as $u) {
        $type = $u['is_service_account'] ? '[Service Account]' : '[User]';
        $role = $u['is_admin'] ? '[Admin]' : '';
        $ident = $u['email'] ?: $u['username'];
        echo "ID: {$u['id']} | {$type} {$role} | Name: {$u['name']} | Login: {$ident}\n";
    }
    exit(0);
}

$identifier = trim($argv[1]);
$password = $argv[2];
$name = 'User';
$isAdmin = 0;
$isService = 0;

for ($i = 3; $i < $argc; $i++) {
    if ($argv[$i] === '--admin') {
        $isAdmin = 1;
    } elseif ($argv[$i] === '--service') {
        $isService = 1;
    } else {
        $name = trim($argv[$i]);
    }
}

if (strlen($password) < 8) {
    echo "Error: Password must be at least 8 characters long.\n";
    exit(1);
}

// Auto-detect service account if no '@' in identifier
if (!str_contains($identifier, '@')) {
    $isService = 1;
    $username = $identifier;
    $email = null;
} else {
    $username = null;
    $email = $identifier;
}

// Check for existing user
$stmt = $db->prepare("SELECT id FROM users WHERE (email IS NOT NULL AND email = ?) OR (username IS NOT NULL AND username = ?)");
$stmt->execute([$identifier, $identifier]);
if ($stmt->fetch()) {
    echo "Error: User with identifier '{$identifier}' already exists.\n";
    exit(1);
}

$userId = generateId();
$hash = password_hash($password, PASSWORD_BCRYPT);

try {
    $stmt = $db->prepare("
        INSERT INTO users (id, name, username, email, password_hash, is_admin, is_service_account)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$userId, $name, $username, $email, $hash, $isAdmin, $isService]);

    echo "Successfully created account!\n";
    echo "  ID:       {$userId}\n";
    echo "  Name:     {$name}\n";
    echo "  Login ID: " . ($email ?: $username) . "\n";
    echo "  Type:     " . ($isService ? "Service Account (No email)" : "Human User") . "\n";
    echo "  Role:     " . ($isAdmin ? "Administrator" : "Standard") . "\n";
} catch (Exception $e) {
    echo "Error creating user: " . $e->getMessage() . "\n";
    exit(1);
}
