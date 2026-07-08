<?php
/**
 * Temporary Journeys Diagnostic Script
 */
require_once __DIR__ . '/../config/db_connect.php';

$db = getDBConnection();

// 1. Check logged in session user details
session_start();
$sessionUserId = $_SESSION['user_id'] ?? 'NOT LOGGED IN';
$sessionUserEmail = $_SESSION['user_email'] ?? 'NOT LOGGED IN';

echo "=== Session Info ===\n";
echo "Session User ID: $sessionUserId\n";
echo "Session User Email: $sessionUserEmail\n\n";

// 2. Check all users in DB
echo "=== Users in DB ===\n";
$users = $db->query("SELECT id, name, email FROM users")->fetchAll();
foreach ($users as $u) {
    echo "ID: {$u['id']} | Email: {$u['email']} | Name: {$u['name']}\n";
}
echo "Total Users: " . count($users) . "\n\n";

// 3. Check all journeys in DB
echo "=== Journeys in DB ===\n";
$journeys = $db->query("SELECT id, title, owner_id, journey_status FROM journeys")->fetchAll();
foreach ($journeys as $j) {
    echo "ID: {$j['id']} | Title: {$j['title']} | Owner ID: {$j['owner_id']} | Status: {$j['journey_status']}\n";
}
echo "Total Journeys: " . count($journeys) . "\n\n";

// 4. Check collaborator mappings
echo "=== Collaborators in DB ===\n";
$collabs = $db->query("SELECT * FROM journey_collaborators")->fetchAll();
foreach ($collabs as $c) {
    echo "Journey ID: {$c['journey_id']} | User ID: {$c['user_id']}\n";
}
echo "Total Collaborators: " . count($collabs) . "\n";
