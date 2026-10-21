<?php
/**
 * Journey Dashboard for Ptolemy
 *
 * Folder-Based URLs:
 *   /dashboard/                  (My Journeys)
 *   /dashboard/shared/           (Shared with Me)
 *   /dashboard/trash/            (Trash Bin)
 *   /dashboard/folder/{name}/    (Folder Filter)
 */

require_once __DIR__ . '/includes/auth_guard.php';
$currentUser = requireAuth();

$currentTab = in_array($_GET['tab'] ?? '', ['my', 'shared', 'trash'], true) ? $_GET['tab'] : 'my';
$currentFolder = isset($_GET['folder']) ? trim($_GET['folder']) : null;

$pageTitle = "My Journeys | Ptolemy";
$pageDescription = "Manage, organize, and edit your OpenJourney format maps.";
$extraCss = ["dashboard.css"];
include __DIR__ . '/includes/header.php';
?>

<!-- Loading Overlay -->
<div id="loading" class="loading-overlay">
    <div class="spinner-border text-primary" role="status"></div>
</div>

<?php 
$activeNav = 'dashboard';
include __DIR__ . '/includes/navbar.php'; 
?>

<main id="main-content" class="container py-4">
    <div id="journey-list-view" class="view-container active">
        <div class="row">
            <!-- Sidebar for Folders -->
            <aside class="col-md-3 col-lg-2 mb-4 mb-md-0" aria-label="Folders">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <span class="fw-bold mb-0 text-muted text-uppercase small">Folders</span>
                </div>
                <div class="list-group list-group-flush mb-4 folder-group shadow-sm rounded-3 overflow-hidden bg-white" id="folder-list">
                    <button class="list-group-item list-group-item-action border-0 p-2 <?php echo ($currentFolder === 'inbox' || empty($currentFolder)) ? 'active' : ''; ?>" data-folder="inbox" onclick="filterByFolder('inbox')">
                        <i class="bi bi-inbox-fill me-2"></i> Inbox
                    </button>
                    <div id="dynamic-folders"></div>
                    <button class="list-group-item list-group-item-action border-0 p-2 <?php echo ($currentFolder === 'all') ? 'active' : ''; ?>" data-folder="all" onclick="filterByFolder(null)">
                        <i class="bi bi-grid-fill me-2"></i> All Journeys
                    </button>
                </div>
            </aside>

            <!-- Journeys Grid Section -->
            <section class="col-md-9 col-lg-10" aria-labelledby="journeys-heading">
                <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                    <div class="d-flex align-items-center flex-wrap gap-2">
                        <h1 id="journeys-heading" class="h2 fw-bold mb-0 me-3">Journeys</h1>
                        <ul class="nav nav-pills" id="journey-tabs">
                            <li class="nav-item">
                                <button class="nav-link <?php echo $currentTab === 'my' ? 'active' : ''; ?>" onclick="loadJourneys('my')">My Journeys</button>
                            </li>
                            <li class="nav-item">
                                <button class="nav-link <?php echo $currentTab === 'shared' ? 'active' : ''; ?>" onclick="loadJourneys('shared')">Shared with Me</button>
                            </li>
                            <li class="nav-item">
                                <button class="nav-link <?php echo $currentTab === 'trash' ? 'active' : ''; ?>" onclick="loadJourneys('trash')">
                                    <i class="bi bi-trash3 me-1"></i> Trash
                                </button>
                            </li>
                        </ul>
                    </div>

                    <div class="d-flex gap-2">
                        <button class="btn btn-outline-secondary px-3" onclick="document.getElementById('import-ojf').click()">
                            <i class="bi bi-file-earmark-arrow-up me-1"></i> Import OJF
                        </button>
                        <input type="file" id="import-ojf" style="display: none;" accept=".ojf,.json" onchange="importJourney(this)">
                        
                        <button class="btn btn-accent px-3" onclick="createNewJourney()">
                            <i class="bi bi-plus-lg me-1"></i> New Journey
                        </button>
                    </div>
                </div>

                <div id="journey-grid" class="row g-4 mb-5">
                    <!-- Journey cards injected via dashboard.js -->
                </div>

                <div id="empty-state" class="empty-state" style="display: none;">
                    <i class="bi bi-folder2-open display-1 mb-3 text-muted"></i>
                    <h2 class="h4">No journeys yet</h2>
                    <p class="text-muted">Create your first user journey map or import an existing .ojf file.</p>
                </div>
            </section>
        </div>
    </div>
</main>

<script>
    const INITIAL_TAB = "<?php echo htmlspecialchars($currentTab, ENT_QUOTES, 'UTF-8'); ?>";
    const INITIAL_FOLDER = <?php echo json_encode($currentFolder); ?>;
</script>

<?php
$extraJs = ["auth.js", "utils.js", "dashboard.js"];
include __DIR__ . '/includes/footer.php';
?>
