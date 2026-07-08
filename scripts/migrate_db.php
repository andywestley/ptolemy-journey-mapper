<?php
/**
 * Ptolemy SQLite to MySQL Database Migration Script
 * Run this script via CLI: php scripts/migrate_db.php
 */

require_once __DIR__ . '/../config/database.php';

// Path to PocketBase SQLite database
$sqlitePath = $argv[1] ?? (__DIR__ . '/../pb_data/data.db');
$sqlitePath = realpath($sqlitePath) ?: $sqlitePath;

if (!file_exists($sqlitePath)) {
    echo "Error: PocketBase SQLite database not found.\n";
    echo "Checked path: $sqlitePath\n";
    echo "Usage: php scripts/migrate_db.php [optional_custom_sqlite_path]\n";
    exit(1);
}

echo "Starting database migration from SQLite to MySQL...\n";

try {
    // 1. Connect to SQLite
    $sqlite = new PDO("sqlite:" . $sqlitePath);
    $sqlite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $sqlite->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    echo "Connected to SQLite database successfully.\n";

    // 2. Connect to MySQL
    $mysql = getDBConnection();
    echo "Connected to MySQL database successfully.\n";

    // Disable foreign keys temporarily during migration to avoid insertion ordering issues
    $mysql->exec("SET FOREIGN_KEY_CHECKS = 0;");

    // --- Migrate Users ---
    echo "Migrating users...\n";
    // Check if the table is named _users or users in PocketBase SQLite
    $userTableName = 'users';
    $stmt = $sqlite->query("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('users', '_users')");
    $found = $stmt->fetch();
    if ($found) {
        $userTableName = $found['name'];
    }

    $sqliteUsers = $sqlite->query("SELECT * FROM `$userTableName`")->fetchAll();
    $mysql->exec("TRUNCATE TABLE users");

    $insertUser = $mysql->prepare("
        INSERT INTO users (id, name, email, password_hash, avatar, created_at, updated_at)
        VALUES (:id, :name, :email, :password_hash, :avatar, :created_at, :updated_at)
    ");

    foreach ($sqliteUsers as $user) {
        // PocketBase maps: passwordHash -> password_hash
        $insertUser->execute([
            ':id' => $user['id'],
            ':name' => $user['name'] ?? 'User',
            ':email' => $user['email'],
            ':password_hash' => $user['passwordHash'] ?? $user['password_hash'] ?? '',
            ':avatar' => $user['avatar'] ?? null,
            ':created_at' => $user['created'] ?? $user['created_at'] ?? date('Y-m-d H:i:s'),
            ':updated_at' => $user['updated'] ?? $user['updated_at'] ?? date('Y-m-d H:i:s')
        ]);
    }
    echo "Migrated " . count($sqliteUsers) . " users.\n";

    // --- Migrate Journeys & Collaborators ---
    echo "Migrating journeys and collaborators...\n";
    $sqliteJourneys = $sqlite->query("SELECT * FROM journeys")->fetchAll();
    $mysql->exec("TRUNCATE TABLE journeys");
    $mysql->exec("TRUNCATE TABLE journey_collaborators");

    $insertJourney = $mysql->prepare("
        INSERT INTO journeys (id, title, description, owner_id, ojf_data, folder, journey_status, created_at, updated_at)
        VALUES (:id, :title, :description, :owner_id, :ojf_data, :folder, :journey_status, :created_at, :updated_at)
    ");

    $insertCollaborator = $mysql->prepare("
        INSERT INTO journey_collaborators (journey_id, user_id)
        VALUES (:journey_id, :user_id)
    ");

    $journeyCount = 0;
    $collaboratorCount = 0;

    foreach ($sqliteJourneys as $journey) {
        // PocketBase stores collaborators as a JSON array of IDs in SQLite, e.g. ["id1", "id2"]
        $collabs = [];
        if (!empty($journey['collaborators'])) {
            $decoded = json_decode($journey['collaborators'], true);
            if (is_array($decoded)) {
                $collabs = $decoded;
            }
        }

        // Insert Journey
        $insertJourney->execute([
            ':id' => $journey['id'],
            ':title' => $journey['title'],
            ':description' => $journey['description'] ?? '',
            ':owner_id' => $journey['owner'] ?? $journey['owner_id'],
            ':ojf_data' => $journey['ojf_data'],
            ':folder' => $journey['folder'] ?? '',
            ':journey_status' => $journey['journey_status'] ?? 'active',
            ':created_at' => $journey['created'] ?? $journey['created_at'] ?? date('Y-m-d H:i:s'),
            ':updated_at' => $journey['updated'] ?? $journey['updated_at'] ?? date('Y-m-d H:i:s')
        ]);
        $journeyCount++;

        // Insert Collaborators
        foreach ($collabs as $collabUserId) {
            // Verify user exists in SQLite users to avoid broken refs
            $userCheck = $mysql->prepare("SELECT 1 FROM users WHERE id = ?");
            $userCheck->execute([$collabUserId]);
            if ($userCheck->fetch()) {
                $insertCollaborator->execute([
                    ':journey_id' => $journey['id'],
                    ':user_id' => $collabUserId
                ]);
                $collaboratorCount++;
            }
        }
    }
    echo "Migrated $journeyCount journeys and $collaboratorCount collaborator relations.\n";

    // --- Migrate Invites ---
    echo "Migrating invites...\n";
    $sqliteInvites = $sqlite->query("SELECT * FROM invites")->fetchAll();
    $mysql->exec("TRUNCATE TABLE invites");

    $insertInvite = $mysql->prepare("
        INSERT INTO invites (id, token, invited_by_id, is_used, created_at)
        VALUES (:id, :token, :invited_by_id, :is_used, :created_at)
    ");

    foreach ($sqliteInvites as $invite) {
        $insertInvite->execute([
            ':id' => $invite['id'],
            ':token' => $invite['token'],
            ':invited_by_id' => $invite['invitedBy'] ?? $invite['invited_by_id'],
            ':is_used' => (int)($invite['isUsed'] ?? $invite['is_used'] ?? 0),
            ':created_at' => $invite['created'] ?? $invite['created_at'] ?? date('Y-m-d H:i:s')
        ]);
    }
    echo "Migrated " . count($sqliteInvites) . " invites.\n";

    // --- Migrate Comments ---
    echo "Migrating comments...\n";
    $sqliteComments = $sqlite->query("SELECT * FROM comments")->fetchAll();
    $mysql->exec("TRUNCATE TABLE comments");

    $insertComment = $mysql->prepare("
        INSERT INTO comments (id, journey_id, user_id, content, x, y, node_id, parent_id, created_at)
        VALUES (:id, :journey_id, :user_id, :content, :x, :y, :node_id, :parent_id, :created_at)
    ");

    foreach ($sqliteComments as $comment) {
        $insertComment->execute([
            ':id' => $comment['id'],
            ':journey_id' => $comment['journey'] ?? $comment['journey_id'],
            ':user_id' => $comment['user'] ?? $comment['user_id'],
            ':content' => $comment['content'],
            ':x' => floatval($comment['x']),
            ':y' => floatval($comment['y']),
            ':node_id' => $comment['nodeId'] ?? $comment['node_id'] ?? null,
            ':parent_id' => $comment['parent'] ?? $comment['parent_id'] ?? null,
            ':created_at' => $comment['created'] ?? $comment['created_at'] ?? date('Y-m-d H:i:s')
        ]);
    }
    echo "Migrated " . count($sqliteComments) . " comments.\n";

    // Re-enable foreign key checks
    $mysql->exec("SET FOREIGN_KEY_CHECKS = 1;");
    echo "Database migration completed successfully!\n";

} catch (Exception $e) {
    echo "Migration failed with error: " . $e->getMessage() . "\n";
    exit(1);
}
