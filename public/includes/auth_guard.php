<?php
/**
 * Shared Authentication Guard for Ptolemy
 */
require_once __DIR__ . '/../../config/db_connect.php';
initSecureSession();

function requireAuth() {
    if (empty($_SESSION['user_id'])) {
        header('Location: /');
        exit;
    }

    $db = getDBConnection();
    $stmt = $db->prepare("SELECT id, name, username, email, is_admin, is_service_account FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();

    if (!$user) {
        // Stale session
        session_destroy();
        header('Location: /');
        exit;
    }

    // Refresh session role
    $_SESSION['is_admin'] = (int)($user['is_admin'] ?? 0);

    return [
        'id' => $user['id'],
        'name' => $user['name'],
        'username' => $user['username'],
        'email' => $user['email'],
        'is_admin' => (bool)$user['is_admin'],
        'is_service_account' => (bool)$user['is_service_account']
    ];
}
