<?php
/**
 * Temporary Login Verification and Repair Script
 */
require_once __DIR__ . '/../config/db_connect.php';

$email = 'andy@andrewwestley.co.uk';
$password = '#4HN' . '!' . '!' . 'od74T4XLL7';

$db = getDBConnection();
$stmt = $db->prepare('SELECT * FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

echo "User Found: " . ($user ? "Yes" : "No") . "\n";
if ($user) {
    echo "Stored Hash: " . $user['password_hash'] . "\n";
    $verify = password_verify($password, $user['password_hash']);
    echo "Verify Result: " . ($verify ? "SUCCESS" : "FAILED") . "\n";
    
    if (!$verify) {
        $newHash = password_hash($password, PASSWORD_BCRYPT);
        $update = $db->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        $update->execute([$newHash, $user['id']]);
        echo "Password hash was incorrect. Automatically reset it in the database!\n";
        echo "Please try logging in now.\n";
    } else {
        echo "Password is correct! You should be able to log in.\n";
    }
} else {
    echo "User not found in database. Check the email: $email\n";
}
