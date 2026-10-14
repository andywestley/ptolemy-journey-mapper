<?php
/**
 * Shared Authentication Guard for Ptolemy
 */
require_once __DIR__ . '/../../models/User.php';
initSecureSession();

/**
 * Require valid authenticated session.
 */
function requireAuth(): array {
    if (empty($_SESSION['user_id'])) {
        header('Location: /');
        exit;
    }

    $user = User::findById($_SESSION['user_id']);

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

/**
 * Require administrator session.
 */
function requireAdmin(): array {
    $user = requireAuth();
    if (empty($user['is_admin'])) {
        header('Location: /dashboard/');
        exit;
    }
    return $user;
}
