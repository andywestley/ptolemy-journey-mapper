<?php
require_once __DIR__ . '/../../config/db_connect.php';

// Configure session options for security
initSecureSession();

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';
$db = getDBConnection();

$input = json_decode(file_get_contents('php://input'), true) ?? [];

if ($action === 'login') {
    $identifier = trim($input['identifier'] ?? $input['username'] ?? $input['email'] ?? '');
    $password = $input['password'] ?? '';

    if (empty($identifier) || empty($password)) {
        http_response_code(400);
        echo json_encode(["error" => "Email/Username and password are required."]);
        exit;
    }

    // Support usernames entered with or without a leading '@'
    $cleanUsername = ltrim($identifier, '@');

    $stmt = $db->prepare("
        SELECT * FROM users 
        WHERE LOWER(email) = LOWER(?) 
           OR LOWER(username) = LOWER(?) 
           OR LOWER(username) = LOWER(?)
    ");
    $stmt->execute([$identifier, $identifier, $cleanUsername]);
    $user = $stmt->fetch();

    if ($user && (password_verify($password, $user['password_hash']) || password_verify(trim($password), $user['password_hash']))) {
        // Prevent session fixation
        session_regenerate_id(true);

        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_email'] = $user['email'] ?? $user['username'];
        $_SESSION['user_name'] = $user['name'];
        $_SESSION['is_admin'] = (int)($user['is_admin'] ?? 0);

        echo json_encode([
            "id" => $user['id'],
            "email" => $user['email'],
            "username" => $user['username'] ?? null,
            "name" => $user['name'],
            "avatar" => $user['avatar'],
            "is_admin" => (bool)($user['is_admin'] ?? 0),
            "is_service_account" => (bool)($user['is_service_account'] ?? 0)
        ]);
    } else {
        http_response_code(401);
        echo json_encode(["error" => "Invalid email/username or password."]);
    }
    exit;
}

if ($action === 'register') {
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    $passwordConfirm = $input['passwordConfirm'] ?? '';
    $name = trim($input['name'] ?? 'User');
    $inviteToken = trim($input['inviteToken'] ?? '');

    if (empty($email) || empty($password) || empty($passwordConfirm)) {
        http_response_code(400);
        echo json_encode(["error" => "Email, password and confirmation are required."]);
        exit;
    }

    if ($password !== $passwordConfirm) {
        http_response_code(400);
        echo json_encode(["error" => "Passwords do not match."]);
        exit;
    }

    if (strlen($password) < 8) {
        http_response_code(400);
        echo json_encode(["error" => "Password must be at least 8 characters long."]);
        exit;
    }

    // Check if invite tokens are required
    // (Ptolemy needs invites to prevent public abuse)
    if (empty($inviteToken)) {
        http_response_code(400);
        echo json_encode(["error" => "Invite code is required for registration."]);
        exit;
    }

    // Verify invite token
    $stmt = $db->prepare("SELECT * FROM invites WHERE token = ? AND is_used = 0");
    $stmt->execute([$inviteToken]);
    $invite = $stmt->fetch();

    if (!$invite) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid or already used invite code."]);
        exit;
    }

    // Check if email already exists
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(["error" => "Email already registered."]);
        exit;
    }

    // Create user
    $userId = generateId();
    $pwdHash = password_hash($password, PASSWORD_BCRYPT);

    $db->beginTransaction();
    try {
        $stmt = $db->prepare("INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)");
        $stmt->execute([$userId, $name, $email, $pwdHash]);

        // Mark invite as used
        $stmt = $db->prepare("UPDATE invites SET is_used = 1 WHERE id = ?");
        $stmt->execute([$invite['id']]);

        $db->commit();

        // Prevent session fixation
        session_regenerate_id(true);

        // Log in user
        $_SESSION['user_id'] = $userId;
        $_SESSION['user_email'] = $email;
        $_SESSION['user_name'] = $name;

        echo json_encode([
            "id" => $userId,
            "email" => $email,
            "name" => $name
        ]);
    } catch (Exception $e) {
        $db->rollBack();
        error_log("Failed to register user: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(["error" => "Failed to register user. Please try again."]);
    }
    exit;
}

if ($action === 'logout') {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
    echo json_encode(["success" => true]);
    exit;
}

if ($action === 'search') {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(["error" => "Unauthorized"]);
        exit;
    }
    
    $email = trim($_GET['email'] ?? '');
    if (empty($email)) {
        http_response_code(400);
        echo json_encode(["error" => "Email is required"]);
        exit;
    }
    
    $stmt = $db->prepare("SELECT id, name, email FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if ($user) {
        echo json_encode($user);
    } else {
        http_response_code(404);
        echo json_encode(["error" => "User not found"]);
    }
    exit;
}

if ($action === 'me') {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(["error" => "Unauthorized"]);
        exit;
    }

    $stmt = $db->prepare("SELECT id, email, username, name, avatar, is_admin, is_service_account FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();

    if ($user) {
        $_SESSION['is_admin'] = (int)($user['is_admin'] ?? 0);
        echo json_encode([
            "id" => $user['id'],
            "email" => $user['email'],
            "username" => $user['username'] ?? null,
            "name" => $user['name'],
            "avatar" => $user['avatar'],
            "is_admin" => (bool)($user['is_admin'] ?? 0),
            "is_service_account" => (bool)($user['is_service_account'] ?? 0)
        ]);
    } else {
        http_response_code(401);
        echo json_encode(["error" => "User not found"]);
    }
    exit;
}

http_response_code(404);
echo json_encode(["error" => "Endpoint not found."]);
