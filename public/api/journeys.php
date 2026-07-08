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

// Helper to expand owner & collaborators for a journey row
function expandJourney($db, $journey) {
    if (!$journey) return null;
    
    // Parse OJF data if it's a string
    if (is_string($journey['ojf_data'])) {
        $journey['ojf_data'] = json_decode($journey['ojf_data'], true);
    }
    
    // Fetch owner details
    $stmt = $db->prepare("SELECT id, name, email, avatar FROM users WHERE id = ?");
    $stmt->execute([$journey['owner_id']]);
    $owner = $stmt->fetch();
    
    // Fetch collaborators details
    $stmt = $db->prepare("
        SELECT u.id, u.name, u.email, u.avatar 
        FROM users u
        INNER JOIN journey_collaborators jc ON u.id = jc.user_id
        WHERE jc.journey_id = ?
    ");
    $stmt->execute([$journey['id']]);
    $collaborators = $stmt->fetchAll();
    
    // Format to match PocketBase's structure
    $journey['owner'] = $journey['owner_id'];
    // PocketBase collaborators field is an array of IDs
    $journey['collaborators'] = array_column($collaborators, 'id');
    
    $journey['expand'] = [
        'owner' => $owner ?: null,
        'collaborators' => $collaborators
    ];
    
    // Map timestamps to match PocketBase
    $journey['created'] = $journey['created_at'];
    $journey['updated'] = $journey['updated_at'];
    
    return $journey;
}

// Check if user has access to this journey
function hasJourneyAccess($db, $journeyId, $userId, $requireWrite = false) {
    $stmt = $db->prepare("SELECT owner_id FROM journeys WHERE id = ?");
    $stmt->execute([$journeyId]);
    $journey = $stmt->fetch();
    if (!$journey) return false;
    
    if ($journey['owner_id'] === $userId) return true;
    
    // Check if collaborator
    $stmt = $db->prepare("SELECT 1 FROM journey_collaborators WHERE journey_id = ? AND user_id = ?");
    $stmt->execute([$journeyId, $userId]);
    $isCollab = (bool)$stmt->fetch();
    
    if ($requireWrite) {
        return $isCollab; // In Ptolemy, both owner and collaborators can edit
    }
    return $isCollab;
}

if ($method === 'GET') {
    if ($id) {
        // Fetch a single journey
        if (!hasJourneyAccess($db, $id, $currentUserId)) {
            http_response_code(403);
            echo json_encode(["error" => "Access denied"]);
            exit;
        }
        
        $stmt = $db->prepare("SELECT * FROM journeys WHERE id = ?");
        $stmt->execute([$id]);
        $journey = $stmt->fetch();
        
        echo json_encode(expandJourney($db, $journey));
        exit;
    } else {
        // Fetch all journeys user has access to (owned or collaborated)
        $stmt = $db->prepare("
            SELECT j.* 
            FROM journeys j
            LEFT JOIN journey_collaborators jc ON j.id = jc.journey_id
            WHERE j.owner_id = ? OR jc.user_id = ?
            GROUP BY j.id
            ORDER BY j.created_at DESC
        ");
        $stmt->execute([$currentUserId, $currentUserId]);
        $journeys = $stmt->fetchAll();
        
        $expanded = [];
        foreach ($journeys as $j) {
            $expanded[] = expandJourney($db, $j);
        }
        echo json_encode($expanded);
        exit;
    }
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    
    $title = trim($input['title'] ?? 'Untitled Journey');
    $description = trim($input['description'] ?? '');
    $folder = trim($input['folder'] ?? '');
    $journeyStatus = trim($input['journey_status'] ?? 'active');
    
    // Default OJF structure if none provided
    $ojfData = $input['ojf_data'] ?? [
        "metadata" => [
            "title" => $title,
            "created" => date('c'),
            "version" => "1.0.0"
        ],
        "stages" => [
            ["id" => "s1", "name" => "Awareness"],
            ["id" => "s2", "name" => "Consideration"]
        ],
        "swimlanes" => [
            ["id" => "sw1", "name" => "Customer Steps"],
            ["id" => "sw2", "name" => "Emotional Curve", "type" => "sentiment"]
        ],
        "nodes" => [],
        "personas" => []
    ];
    
    $journeyId = generateId();
    
    $stmt = $db->prepare("
        INSERT INTO journeys (id, title, description, owner_id, ojf_data, folder, journey_status) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $journeyId,
        $title,
        $description,
        $currentUserId,
        json_encode($ojfData),
        $folder,
        $journeyStatus
    ]);
    
    // Fetch and return the newly created journey
    $stmt = $db->prepare("SELECT * FROM journeys WHERE id = ?");
    $stmt->execute([$journeyId]);
    $newJourney = $stmt->fetch();
    
    echo json_encode(expandJourney($db, $newJourney));
    exit;
}

if ($method === 'PUT' || $method === 'PATCH') {
    if (!$id) {
        http_response_code(400);
        echo json_encode(["error" => "Journey ID required"]);
        exit;
    }
    
    if (!hasJourneyAccess($db, $id, $currentUserId, true)) {
        http_response_code(403);
        echo json_encode(["error" => "Access denied"]);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    
    // Fetch existing journey to merge/patch
    $stmt = $db->prepare("SELECT * FROM journeys WHERE id = ?");
    $stmt->execute([$id]);
    $existing = $stmt->fetch();
    if (!$existing) {
        http_response_code(404);
        echo json_encode(["error" => "Journey not found"]);
        exit;
    }
    
    $title = isset($input['title']) ? trim($input['title']) : $existing['title'];
    $description = isset($input['description']) ? trim($input['description']) : $existing['description'];
    $folder = isset($input['folder']) ? trim($input['folder']) : $existing['folder'];
    $journeyStatus = isset($input['journey_status']) ? trim($input['journey_status']) : $existing['journey_status'];
    
    $ojfData = $existing['ojf_data'];
    if (isset($input['ojf_data'])) {
        $ojfData = json_encode($input['ojf_data']);
    }
    
    $stmt = $db->prepare("
        UPDATE journeys 
        SET title = ?, description = ?, ojf_data = ?, folder = ?, journey_status = ? 
        WHERE id = ?
    ");
    $stmt->execute([
        $title,
        $description,
        $ojfData,
        $folder,
        $journeyStatus,
        $id
    ]);
    
    // Handle collaborators updates if provided
    if (isset($input['collaborators']) && is_array($input['collaborators'])) {
        // Clear old ones
        $stmt = $db->prepare("DELETE FROM journey_collaborators WHERE journey_id = ?");
        $stmt->execute([$id]);
        
        // Add new ones
        if (!empty($input['collaborators'])) {
            $stmt = $db->prepare("INSERT INTO journey_collaborators (journey_id, user_id) VALUES (?, ?)");
            foreach ($input['collaborators'] as $collabId) {
                // Verify user exists before adding
                $uStmt = $db->prepare("SELECT 1 FROM users WHERE id = ?");
                $uStmt->execute([$collabId]);
                if ($uStmt->fetch()) {
                    $stmt->execute([$id, $collabId]);
                }
            }
        }
    }
    
    // Return updated journey
    $stmt = $db->prepare("SELECT * FROM journeys WHERE id = ?");
    $stmt->execute([$id]);
    $updated = $stmt->fetch();
    
    echo json_encode(expandJourney($db, $updated));
    exit;
}

if ($method === 'DELETE') {
    if (!$id) {
        http_response_code(400);
        echo json_encode(["error" => "Journey ID required"]);
        exit;
    }
    
    // Check ownership (only owner can delete the journey)
    $stmt = $db->prepare("SELECT owner_id FROM journeys WHERE id = ?");
    $stmt->execute([$id]);
    $journey = $stmt->fetch();
    
    if (!$journey) {
        http_response_code(404);
        echo json_encode(["error" => "Journey not found"]);
        exit;
    }
    
    if ($journey['owner_id'] !== $currentUserId) {
        http_response_code(403);
        echo json_encode(["error" => "Only the owner can delete this journey"]);
        exit;
    }
    
    $stmt = $db->prepare("DELETE FROM journeys WHERE id = ?");
    $stmt->execute([$id]);
    
    echo json_encode(["success" => true]);
    exit;
}

http_response_code(405);
echo json_encode(["error" => "Method not allowed"]);
