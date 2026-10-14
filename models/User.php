<?php
/**
 * User Model for Ptolemy
 */
require_once __DIR__ . '/../config/db_connect.php';

class User {
    /**
     * Find user by ID.
     */
    public static function findById(string $id): ?array {
        $db = getDBConnection();
        $stmt = $db->prepare("SELECT id, name, username, email, avatar, is_admin, is_service_account, created_at, updated_at FROM users WHERE id = ?");
        $stmt->execute([$id]);
        $user = $stmt->fetch();
        return $user ?: null;
    }

    /**
     * Check if user is an administrator.
     */
    public static function isAdmin(string $id): bool {
        $db = getDBConnection();
        $stmt = $db->prepare("SELECT is_admin FROM users WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return !empty($row['is_admin']);
    }
}
