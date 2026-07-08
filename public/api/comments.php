<?php
require_once __DIR__ . '/../../config/database.php';

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
$journeyId = $_GET['journey_id'] ?? null;

// Helper to expand user info for a comment row
function expandComment($db, $comment) {
    if (!$comment) return null;
    
    // Fetch commenter details
    $stmt = $db->prepare("SELECT id, name, email, avatar FROM users WHERE id = ?");
    $stmt->execute([$comment['user_id']]);
    $user = $stmt->fetch();
    
    // Format to match PocketBase
    $comment['user'] = $comment['user_id'];
    $comment['journey'] = $comment['journey_id'];
    $comment['parent'] = $comment['parent_id'];
    $comment['nodeId'] = $comment['node_id'];
    $comment['resolved'] = (bool)$comment['resolved'];
    $comment['expand'] = [
        'user' => $user ?: null
    ];
    $comment['created'] = $comment['created_at'];
    
    return $comment;
}

if ($method === 'GET') {
    if (!$journeyId) {
        http_response_code(400);
        echo json_encode(["error" => "journey_id is required"]);
        exit;
    }

    $stmt = $db->prepare("
        SELECT c.* 
        FROM comments c
        INNER JOIN journeys j ON c.journey_id = j.id
        LEFT JOIN journey_collaborators jc ON j.id = jc.journey_id
        WHERE c.journey_id = ? AND (j.owner_id = ? OR jc.user_id = ?)
        ORDER BY c.created_at ASC
    ");
    $stmt->execute([$journeyId, $currentUserId, $currentUserId]);
    $comments = $stmt->fetchAll();
    
    $expanded = [];
    foreach ($comments as $c) {
        $expanded[] = expandComment($db, $c);
    }
    echo json_encode($expanded);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    
    $journey = $input['journey'] ?? '';
    $content = trim($input['content'] ?? '');
    $x = floatval($input['x'] ?? 0);
    $y = floatval($input['y'] ?? 0);
    $nodeId = $input['nodeId'] ?? null;
    $parent = $input['parent'] ?? null;
    $resolved = isset($input['resolved']) ? (int)$input['resolved'] : 0;
    
    if (empty($journey) || empty($content)) {
        http_response_code(400);
        echo json_encode(["error" => "journey and content are required"]);
        exit;
    }
    
    // Check access to journey
    $stmt = $db->prepare("
        SELECT 1 FROM journeys j
        LEFT JOIN journey_collaborators jc ON j.id = jc.journey_id
        WHERE j.id = ? AND (j.owner_id = ? OR jc.user_id = ?)
    ");
    $stmt->execute([$journey, $currentUserId, $currentUserId]);
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode(["error" => "No access to this journey"]);
        exit;
    }
    
    $commentId = generateId();
    $stmt = $db->prepare("
        INSERT INTO comments (id, journey_id, user_id, content, x, y, node_id, parent_id, resolved)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $commentId,
        $journey,
        $currentUserId,
        $content,
        $x,
        $y,
        $nodeId,
        $parent,
        $resolved
    ]);
    
    // Return the created comment
    $stmt = $db->prepare("SELECT * FROM comments WHERE id = ?");
    $stmt->execute([$commentId]);
    $newComment = $stmt->fetch();
    
    echo json_encode(expandComment($db, $newComment));
    exit;
}

if ($method === 'PUT' || $method === 'PATCH') {
    if (!$id) {
        http_response_code(400);
        echo json_encode(["error" => "Comment ID required"]);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    
    // Check access to the comment's journey
    $stmt = $db->prepare("
        SELECT c.user_id as commenter_id, j.id as journey_id, j.owner_id as journey_owner_id
        FROM comments c
        INNER JOIN journeys j ON c.journey_id = j.id
        WHERE c.id = ?
    ");
    $stmt->execute([$id]);
    $perms = $stmt->fetch();
    
    if (!$perms) {
        http_response_code(404);
        echo json_encode(["error" => "Comment not found"]);
        exit;
    }
    
    // Verify if user is collaborator on the journey to update comment status
    $stmt = $db->prepare("
        SELECT 1 FROM journeys j
        LEFT JOIN journey_collaborators jc ON j.id = jc.journey_id
        WHERE j.id = ? AND (j.owner_id = ? OR jc.user_id = ?)
    ");
    $stmt->execute([$perms['journey_id'], $currentUserId, $currentUserId]);
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode(["error" => "Access denied"]);
        exit;
    }
    
    // Update resolved status
    if (isset($input['resolved'])) {
        $resolvedVal = $input['resolved'] ? 1 : 0;
        $stmt = $db->prepare("UPDATE comments SET resolved = ? WHERE id = ?");
        $stmt->execute([$resolvedVal, $id]);
    }
    
    $stmt = $db->prepare("SELECT * FROM comments WHERE id = ?");
    $stmt->execute([$id]);
    $updated = $stmt->fetch();
    
    echo json_encode(expandComment($db, $updated));
    exit;
}

if ($method === 'DELETE') {
    if (!$id) {
        http_response_code(400);
        echo json_encode(["error" => "Comment ID required"]);
        exit;
    }
    
    // Check if commenter is the owner of the comment, OR owner of the journey
    $stmt = $db->prepare("
        SELECT c.user_id as commenter_id, j.owner_id as journey_owner_id
        FROM comments c
        INNER JOIN journeys j ON c.journey_id = j.id
        WHERE c.id = ?
    ");
    $stmt->execute([$id]);
    $perms = $stmt->fetch();
    
    if (!$perms) {
        http_response_code(404);
        echo json_encode(["error" => "Comment not found"]);
        exit;
    }
    
    if ($perms['commenter_id'] !== $currentUserId && $perms['journey_owner_id'] !== $currentUserId) {
        http_response_code(403);
        echo json_encode(["error" => "Permission denied to delete this comment"]);
        exit;
    }
    
    $stmt = $db->prepare("DELETE FROM comments WHERE id = ?");
    $stmt->execute([$id]);
    
    echo json_encode(["success" => true]);
    exit;
}

http_response_code(405);
echo json_encode(["error" => "Method not allowed"]);
