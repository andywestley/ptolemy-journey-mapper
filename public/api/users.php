<?php
/**
 * Admin User Management API for Ptolemy
 *
 * Provides CRUD management of users and service accounts.
 * Strictly restricted to users with administrator privileges.
 */

require_once __DIR__ . '/../../config/db_connect.php';
initSecureSession();

header('Content-Type: application/json');

// 1. Require Authentication
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$db = getDBConnection();
$currentUserId = $_SESSION['user_id'];

// 2. Require Administrator Privileges
$stmt = $db->prepare("SELECT is_admin, email FROM users WHERE id = ?");
$stmt->execute([$currentUserId]);
$currentUser = $stmt->fetch();

if (!$currentUser || empty($currentUser['is_admin'])) {
    http_response_code(403);
    echo json_encode(["error" => "Access denied. Administrator privileges required."]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

// GET: List all users
if ($method === 'GET') {
    $stmt = $db->query("
        SELECT u.id, u.name, u.username, u.email, u.is_admin, u.is_service_account, u.created_at,
               (SELECT COUNT(*) FROM journeys WHERE owner_id = u.id) AS journey_count
        FROM users u
        ORDER BY u.created_at DESC
    ");
    $users = $stmt->fetchAll();

    $formatted = array_map(function($u) {
        return [
            'id' => $u['id'],
            'name' => $u['name'],
            'username' => $u['username'],
            'email' => $u['email'],
            'is_admin' => (bool)$u['is_admin'],
            'is_service_account' => (bool)$u['is_service_account'],
            'journey_count' => (int)$u['journey_count'],
            'created_at' => $u['created_at']
        ];
    }, $users);

    echo json_encode($formatted);
    exit;
}

// POST: Create a new User or Service Account
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];

    $accountType = trim($input['account_type'] ?? 'user'); // 'user' or 'service'
    $name = trim($input['name'] ?? '');
    $username = trim($input['username'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    $isAdmin = !empty($input['is_admin']) ? 1 : 0;

    if (empty($name)) {
        http_response_code(400);
        echo json_encode(["error" => "Account name is required."]);
        exit;
    }

    if (empty($password) || strlen($password) < 8) {
        http_response_code(400);
        echo json_encode(["error" => "Password must be at least 8 characters long."]);
        exit;
    }

    $isServiceAccount = ($accountType === 'service') ? 1 : 0;

    if ($isServiceAccount) {
        if (empty($username)) {
            http_response_code(400);
            echo json_encode(["error" => "Username identifier is required for service accounts."]);
            exit;
        }
        // Validate username format (alphanumeric, hyphens, underscores)
        if (!preg_match('/^[a-zA-Z0-9_-]{3,50}$/', $username)) {
            http_response_code(400);
            echo json_encode(["error" => "Username must be 3-50 characters and contain only letters, numbers, hyphens, or underscores."]);
            exit;
        }
        // Email is optional for service accounts; use null or custom placeholder if blank
        if (empty($email)) {
            $email = null;
        }
    } else {
        // Standard user requires valid email
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(["error" => "A valid email address is required for standard users."]);
            exit;
        }
        if (empty($username)) {
            $username = null;
        }
    }

    // Check username uniqueness
    if (!empty($username)) {
        $stmt = $db->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$username]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(["error" => "Username is already in use."]);
            exit;
        }
    }

    // Check email uniqueness
    if (!empty($email)) {
        $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(["error" => "Email address is already in use."]);
            exit;
        }
    }

    $userId = generateId();
    $pwdHash = password_hash($password, PASSWORD_BCRYPT);

    try {
        $stmt = $db->prepare("
            INSERT INTO users (id, name, username, email, password_hash, is_admin, is_service_account)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$userId, $name, $username, $email, $pwdHash, $isAdmin, $isServiceAccount]);

        echo json_encode([
            "success" => true,
            "id" => $userId,
            "name" => $name,
            "username" => $username,
            "email" => $email,
            "is_admin" => (bool)$isAdmin,
            "is_service_account" => (bool)$isServiceAccount
        ]);
    } catch (Exception $e) {
        error_log("Failed to create user: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(["error" => "Failed to create user account."]);
    }
    exit;
}

// PUT / PATCH: Update user profile, role, or reset password
if ($method === 'PUT' || $method === 'PATCH') {
    if (!$id) {
        http_response_code(400);
        echo json_encode(["error" => "User ID is required."]);
        exit;
    }

    $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$id]);
    $targetUser = $stmt->fetch();

    if (!$targetUser) {
        http_response_code(404);
        echo json_encode(["error" => "User not found."]);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true) ?? [];

    $name = isset($input['name']) ? trim($input['name']) : $targetUser['name'];
    $username = isset($input['username']) ? (trim($input['username']) ?: null) : $targetUser['username'];
    $email = isset($input['email']) ? (trim($input['email']) ?: null) : $targetUser['email'];

    // Check username uniqueness if changed
    if ($username !== null && $username !== $targetUser['username']) {
        $stmt = $db->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
        $stmt->execute([$username, $id]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(["error" => "Username is already in use by another account."]);
            exit;
        }
    }

    // Check email uniqueness if changed
    if ($email !== null && $email !== $targetUser['email']) {
        $stmt = $db->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
        $stmt->execute([$email, $id]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(["error" => "Email is already in use by another account."]);
            exit;
        }
    }

    // Admin privilege toggle
    $isAdmin = $targetUser['is_admin'];
    if (isset($input['is_admin'])) {
        $newIsAdmin = !empty($input['is_admin']) ? 1 : 0;
        // Prevent demoting oneself
        if ($id === $currentUserId && $newIsAdmin === 0) {
            http_response_code(400);
            echo json_encode(["error" => "You cannot revoke your own administrator privileges."]);
            exit;
        }
        $isAdmin = $newIsAdmin;
    }

    // Password reset if provided
    $pwdHash = $targetUser['password_hash'];
    if (!empty($input['password'])) {
        if (strlen($input['password']) < 8) {
            http_response_code(400);
            echo json_encode(["error" => "New password must be at least 8 characters long."]);
            exit;
        }
        $pwdHash = password_hash($input['password'], PASSWORD_BCRYPT);
    }

    try {
        $stmt = $db->prepare("
            UPDATE users
            SET name = ?, username = ?, email = ?, is_admin = ?, password_hash = ?
            WHERE id = ?
        ");
        $stmt->execute([$name, $username, $email, $isAdmin, $pwdHash, $id]);

        echo json_encode([
            "success" => true,
            "id" => $id,
            "name" => $name,
            "username" => $username,
            "email" => $email,
            "is_admin" => (bool)$isAdmin
        ]);
    } catch (Exception $e) {
        error_log("Failed to update user: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(["error" => "Failed to update user account."]);
    }
    exit;
}

// DELETE: Delete user account
if ($method === 'DELETE') {
    if (!$id) {
        http_response_code(400);
        echo json_encode(["error" => "User ID is required."]);
        exit;
    }

    // Safeguard 1: Cannot delete oneself
    if ($id === $currentUserId) {
        http_response_code(400);
        echo json_encode(["error" => "You cannot delete your own logged-in account."]);
        exit;
    }

    $stmt = $db->prepare("SELECT id, is_admin FROM users WHERE id = ?");
    $stmt->execute([$id]);
    $targetUser = $stmt->fetch();

    if (!$targetUser) {
        http_response_code(404);
        echo json_encode(["error" => "User not found."]);
        exit;
    }

    // Safeguard 2: Cannot delete the last remaining admin
    if (!empty($targetUser['is_admin'])) {
        $adminCountStmt = $db->query("SELECT COUNT(*) FROM users WHERE is_admin = 1");
        $adminCount = (int)$adminCountStmt->fetchColumn();
        if ($adminCount <= 1) {
            http_response_code(400);
            echo json_encode(["error" => "Cannot delete the only remaining administrator."]);
            exit;
        }
    }

    try {
        $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$id]);

        echo json_encode(["success" => true]);
    } catch (Exception $e) {
        error_log("Failed to delete user: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(["error" => "Failed to delete user account."]);
    }
    exit;
}

http_response_code(405);
echo json_encode(["error" => "Method not allowed"]);
