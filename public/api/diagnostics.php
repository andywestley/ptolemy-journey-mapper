<?php
/**
 * System Diagnostics, Health Check, and Live Log Stream
 *
 * Endpoint: /api/diagnostics.php
 * Options:
 *   ?format=html  - Render as interactive admin UI
 *   ?action=seed  - Manually trigger PocketBase data import
 *   ?action=test_log - Write a test log entry
 */

require_once __DIR__ . '/../../config/db_connect.php';
require_once __DIR__ . '/../../config/logger.php';
initSecureSession();

$currentUserId = $_SESSION['user_id'] ?? null;
$isAdmin = !empty($_SESSION['is_admin']);
$db = getDBConnection(false);

$action = $_GET['action'] ?? '';
$format = $_GET['format'] ?? (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'text/html') !== false ? 'html' : 'json');

// Handle actions for admins
$actionResult = null;
if ($isAdmin && $action === 'seed') {
    $seedScript = dirname(__DIR__, 2) . '/scripts/seed_pocketbase_data.php';
    if (file_exists($seedScript) && $db) {
        require_once $seedScript;
        if (function_exists('seedPocketBaseData')) {
            $actionResult = seedPocketBaseData($db, $currentUserId);
            app_log('INFO', 'Manual data seed triggered via diagnostics endpoint', [
                'triggered_by' => $currentUserId,
                'result' => $actionResult
            ]);
        }
    }
} elseif ($isAdmin && $action === 'test_log') {
    app_log('INFO', 'Test log entry generated from Diagnostics', [
        'user_id' => $currentUserId,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ]);
    $actionResult = ['message' => 'Test log recorded successfully'];
} elseif ($isAdmin && $action === 'clear_logs') {
    $filePath = getLogFilePath();
    if (file_exists($filePath)) {
        @file_put_contents($filePath, '');
        $actionResult = ['message' => 'Log file cleared'];
    }
}

// Gather system metrics
$dbConnected = ($db !== null);
$counts = [
    'users' => 0,
    'journeys' => 0,
    'journeys_active' => 0,
    'journeys_trash' => 0,
    'journeys_public' => 0,
    'comments' => 0,
    'invites' => 0,
];

if ($dbConnected) {
    try {
        $counts['users'] = (int)$db->query("SELECT COUNT(*) FROM users")->fetchColumn();
        $counts['journeys'] = (int)$db->query("SELECT COUNT(*) FROM journeys")->fetchColumn();
        $counts['journeys_active'] = (int)$db->query("SELECT COUNT(*) FROM journeys WHERE journey_status = 'active'")->fetchColumn();
        $counts['journeys_trash'] = (int)$db->query("SELECT COUNT(*) FROM journeys WHERE journey_status = 'trash'")->fetchColumn();
        $counts['journeys_public'] = (int)$db->query("SELECT COUNT(*) FROM journeys WHERE is_public = 1")->fetchColumn();
        $counts['comments'] = (int)$db->query("SELECT COUNT(*) FROM comments")->fetchColumn();
        $counts['invites'] = (int)$db->query("SELECT COUNT(*) FROM invites")->fetchColumn();
    } catch (Exception $e) {
        app_log('ERROR', 'Diagnostics DB count query failed: ' . $e->getMessage());
    }
}

$logFilePath = getLogFilePath();
$logFileExists = file_exists($logFilePath);
$logFileSize = $logFileExists ? filesize($logFilePath) : 0;
$logDir = dirname($logFilePath);
$logDirWritable = is_writable($logDir);

$recentLogs = $isAdmin ? get_recent_logs(80) : [];

// If requested as JSON
if ($format === 'json') {
    header('Content-Type: application/json');
    $payload = [
        'status' => $dbConnected ? 'ok' : 'degraded',
        'timestamp' => date('c'),
        'database' => [
            'connected' => $dbConnected,
            'counts' => $counts
        ],
        'session' => [
            'authenticated' => (bool)$currentUserId,
            'user_id' => $currentUserId,
            'is_admin' => $isAdmin
        ],
        'logging' => [
            'log_path' => $isAdmin ? $logFilePath : null,
            'file_exists' => $logFileExists,
            'size_bytes' => $logFileSize,
            'dir_writable' => $logDirWritable,
            'entries' => $isAdmin ? array_reverse($recentLogs) : []
        ]
    ];
    if ($actionResult !== null) {
        $payload['action_result'] = $actionResult;
    }
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

// HTML View for browser inspection
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ptolemy Diagnostics & Logs</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Outfit', sans-serif; background-color: #0f172a; color: #f8fafc; }
        .card { background-color: #1e293b; border-color: #334155; }
        .table { color: #f8fafc; }
        .log-box {
            background-color: #090d16;
            color: #38bdf8;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.85rem;
            max-height: 480px;
            overflow-y: auto;
            white-space: pre-wrap;
            word-break: break-all;
            padding: 1rem;
            border-radius: 0.5rem;
            border: 1px solid #334155;
        }
        .log-error { color: #f87171; font-weight: bold; }
        .log-warning { color: #fbbf24; }
        .log-info { color: #38bdf8; }
    </style>
</head>
<body class="py-4">
    <div class="container">
        <div class="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary">
            <div>
                <h1 class="h3 fw-bold mb-1">
                    <i class="bi bi-activity text-primary me-2"></i>System Diagnostics & Logs
                </h1>
                <p class="text-secondary small mb-0">Live health indicators, database records, and application log stream.</p>
            </div>
            <div class="d-flex gap-2">
                <a href="/dashboard/" class="btn btn-outline-light btn-sm"><i class="bi bi-arrow-left me-1"></i>Dashboard</a>
                <a href="/admin/" class="btn btn-outline-info btn-sm"><i class="bi bi-shield-lock me-1"></i>Admin</a>
                <a href="?format=json" class="btn btn-outline-secondary btn-sm" target="_blank" rel="noopener noreferrer" title="Opens raw JSON in a new tab"><i class="bi bi-braces me-1" aria-hidden="true"></i>Raw JSON <i class="bi bi-box-arrow-up-right ms-1" aria-hidden="true" style="font-size: 0.75rem;"></i><span class="visually-hidden">(opens in a new tab)</span></a>
            </div>
        </div>

        <?php if ($actionResult): ?>
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <i class="bi bi-check-circle-fill me-2"></i>Action executed: 
                <strong><?php echo htmlspecialchars(json_encode($actionResult), ENT_QUOTES, 'UTF-8'); ?></strong>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        <?php endif; ?>

        <!-- Status Cards -->
        <div class="row g-3 mb-4">
            <div class="col-md-3 col-sm-6">
                <div class="card p-3 h-100">
                    <div class="text-secondary small fw-bold text-uppercase mb-1">Database Connection</div>
                    <div class="fs-4 fw-bold <?php echo $dbConnected ? 'text-success' : 'text-danger'; ?>">
                        <i class="bi <?php echo $dbConnected ? 'bi-check-circle' : 'bi-x-circle'; ?> me-1"></i>
                        <?php echo $dbConnected ? 'Connected' : 'Disconnected'; ?>
                    </div>
                    <div class="text-secondary small">MySQL via PDO utf8mb4</div>
                </div>
            </div>

            <div class="col-md-3 col-sm-6">
                <div class="card p-3 h-100">
                    <div class="text-secondary small fw-bold text-uppercase mb-1">Journeys in DB</div>
                    <div class="fs-4 fw-bold text-primary">
                        <?php echo $counts['journeys']; ?>
                    </div>
                    <div class="text-secondary small">
                        <?php echo $counts['journeys_active']; ?> active, 
                        <?php echo $counts['journeys_trash']; ?> trash, 
                        <?php echo $counts['journeys_public']; ?> public
                    </div>
                </div>
            </div>

            <div class="col-md-3 col-sm-6">
                <div class="card p-3 h-100">
                    <div class="text-secondary small fw-bold text-uppercase mb-1">Users & Invites</div>
                    <div class="fs-4 fw-bold text-info">
                        <?php echo $counts['users']; ?> Users
                    </div>
                    <div class="text-secondary small"><?php echo $counts['invites']; ?> Invites, <?php echo $counts['comments']; ?> Comments</div>
                </div>
            </div>

            <div class="col-md-3 col-sm-6">
                <div class="card p-3 h-100">
                    <div class="text-secondary small fw-bold text-uppercase mb-1">Session Auth</div>
                    <div class="fs-5 fw-bold <?php echo $currentUserId ? 'text-success' : 'text-warning'; ?>">
                        <?php echo $currentUserId ? 'Logged In (' . ($isAdmin ? 'Admin' : 'User') . ')' : 'Guest (No Auth)'; ?>
                    </div>
                    <div class="text-secondary small text-truncate">
                        <?php echo htmlspecialchars($_SESSION['user_email'] ?? 'Not signed in', ENT_QUOTES, 'UTF-8'); ?>
                    </div>
                </div>
            </div>
        </div>

        <!-- System Controls & Tools -->
        <div class="card p-4 mb-4">
            <h5 class="fw-bold mb-3"><i class="bi bi-tools text-primary me-2"></i>Quick Actions & Management</h5>
            <div class="d-flex flex-wrap gap-2">
                <?php if ($isAdmin): ?>
                    <a href="?action=seed" class="btn btn-primary" onclick="return confirm('Import original PocketBase maps and sample blueprints? Existing matching IDs will be refreshed.')">
                        <i class="bi bi-database-fill-up me-1"></i> Seed / Refresh PocketBase Data
                    </a>
                    <a href="?action=test_log" class="btn btn-outline-info">
                        <i class="bi bi-pencil-square me-1"></i> Write Test Log Entry
                    </a>
                    <a href="?action=clear_logs" class="btn btn-outline-danger" onclick="return confirm('Are you sure you want to clear app.log?')">
                        <i class="bi bi-trash me-1"></i> Clear Log File
                    </a>
                <?php else: ?>
                    <div class="text-warning">
                        <i class="bi bi-exclamation-triangle me-1"></i> Please <a href="/" class="alert-link">log in as an administrator</a> to trigger data seeding or view the full live log file.
                    </div>
                <?php endif; ?>
                <a href="?format=html" class="btn btn-outline-light ms-auto">
                    <i class="bi bi-arrow-clockwise me-1"></i> Refresh
                </a>
            </div>
        </div>

        <!-- Live Log Box -->
        <div class="card p-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="fw-bold mb-0">
                    <i class="bi bi-terminal text-info me-2"></i>Recent Application Logs
                    <span class="badge bg-secondary ms-2 fs-7"><?php echo count($recentLogs); ?> entries</span>
                </h5>
                <span class="text-secondary small font-monospace">
                    Log File: <?php echo htmlspecialchars($logFilePath, ENT_QUOTES, 'UTF-8'); ?> 
                    (<?php echo round($logFileSize / 1024, 1); ?> KB)
                </span>
            </div>

            <?php if (!$isAdmin): ?>
                <div class="alert alert-warning mb-0">
                    <i class="bi bi-lock-fill me-2"></i>Log stream is restricted to administrators. Please log in with your admin credentials.
                </div>
            <?php elseif (empty($recentLogs)): ?>
                <div class="log-box text-muted">
                    Log file is currently empty or has not received any events yet. Click "Write Test Log Entry" above to test logging.
                </div>
            <?php else: ?>
                <div class="log-box">
                    <?php 
                    foreach (array_reverse($recentLogs) as $line) {
                        $escaped = htmlspecialchars($line, ENT_QUOTES, 'UTF-8');
                        if (strpos($line, '[ERROR]') !== false || strpos($line, '[CRITICAL]') !== false) {
                            echo '<div class="log-error">' . $escaped . '</div>';
                        } elseif (strpos($line, '[WARNING]') !== false) {
                            echo '<div class="log-warning">' . $escaped . '</div>';
                        } else {
                            echo '<div class="log-info">' . $escaped . '</div>';
                        }
                    }
                    ?>
                </div>
            <?php endif; ?>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
