<?php
require_once __DIR__ . '/../../config/db_connect.php';

session_start();

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$currentUserId = $_SESSION['user_id'];
$db = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

// Helper to expand invitedBy user info
function expandInvite($db, $invite) {
    if (!$invite) return null;
    
    $stmt = $db->prepare("SELECT id, name, email, avatar FROM users WHERE id = ?");
    $stmt->execute([$invite['invited_by_id']]);
    $user = $stmt->fetch();
    
    // Format to match PocketBase
    $invite['invitedBy'] = $invite['invited_by_id'];
    $invite['isUsed'] = (bool)$invite['is_used'];
    $invite['expand'] = [
        'invitedBy' => $user ?: null
    ];
    $invite['created'] = $invite['created_at'];
    
    return $invite;
}

if ($method === 'GET') {
    // List all invites
    $stmt = $db->prepare("SELECT * FROM invites ORDER BY created_at DESC");
    $stmt->execute();
    $invites = $stmt->fetchAll();
    
    $expanded = [];
    foreach ($invites as $inv) {
        $expanded[] = expandInvite($db, $inv);
    }
    echo json_encode($expanded);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    
    $token = $input['token'] ?? '';
    if (empty($token)) {
        http_response_code(400);
        echo json_encode(["error" => "Token is required"]);
        exit;
    }
    
    $inviteId = generateId();
    $stmt = $db->prepare("INSERT INTO invites (id, token, invited_by_id, is_used) VALUES (?, ?, ?, 0)");
    $stmt->execute([$inviteId, $token, $currentUserId]);
    
    $stmt = $db->prepare("SELECT * FROM invites WHERE id = ?");
    $stmt->execute([$inviteId]);
    $newInvite = $stmt->fetch();
    
    echo json_encode(expandInvite($db, $newInvite));
    exit;
}

if ($method === 'DELETE') {
    if (!$id) {
        http_response_code(400);
        echo json_encode(["error" => "Invite ID required"]);
        exit;
    }
    
    // Check if invite exists and is unused
    $stmt = $db->prepare("SELECT * FROM invites WHERE id = ?");
    $stmt->execute([$id]);
    $invite = $stmt->fetch();
    
    if (!$invite) {
        http_response_code(404);
        echo json_encode(["error" => "Invite not found"]);
        exit;
    }
    
    if ($invite['is_used']) {
        http_response_code(400);
        echo json_encode(["error" => "Cannot delete an invite that has already been used"]);
        exit;
    }
    
    $stmt = $db->prepare("DELETE FROM invites WHERE id = ?");
    $stmt->execute([$id]);
    
    echo json_encode(["success" => true]);
    exit;
}

http_response_code(405);
echo json_encode(["error" => "Method not allowed"]);
