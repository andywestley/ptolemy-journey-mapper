<?php
/**
 * Public Read-Only Journey Map Viewer for Ptolemy
 *
 * Distinct URL: /share/{id}/ or /share/{id}/visual/ or /share/{id}/table/
 */

require_once __DIR__ . '/../models/Journey.php';
initSecureSession();

$journeyId = trim($_GET['id'] ?? '');
$initialMode = in_array($_GET['mode'] ?? '', ['visual', 'table'], true) ? $_GET['mode'] : 'visual';

$journey = !empty($journeyId) ? Journey::findById($journeyId) : null;
$sessionUserId = $_SESSION['user_id'] ?? null;
$isAllowed = false;
$isEditorOrOwner = false;

if ($journey && ($journey['journey_status'] ?? '') !== 'trash') {
    $isAllowed = Journey::hasAccess($journey, $sessionUserId, false);
    $isEditorOrOwner = Journey::hasAccess($journey, $sessionUserId, true);
}

// Parse OJF
$ojfData = [];
if ($isAllowed && $journey) {
    $ojfData = is_string($journey['ojf_data']) ? json_decode($journey['ojf_data'], true) : $journey['ojf_data'];
}

$pageTitle = $isAllowed ? htmlspecialchars($journey['title'], ENT_QUOTES, 'UTF-8') . " | OpenJourney Map" : "Private Journey | Ptolemy";
$pageDescription = "View interactive customer journey map powered by the OpenJourney format";
$extraCss = ["dashboard.css"];
include __DIR__ . '/includes/header.php';
?>

<!-- Export Libraries -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>

<style>
    body {
        padding-top: 65px;
        background-color: #f8fafc;
    }
    .public-navbar {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(8px);
        border-bottom: 1px solid #e2e8f0;
    }
    .node-card {
        cursor: pointer;
        scroll-margin-left: 215px;
        scroll-margin-top: 80px;
    }
</style>

<!-- Loading Overlay -->
<div id="loading" class="loading-overlay">
    <div class="spinner-border text-primary" role="status"></div>
</div>

<?php if (!$isAllowed): ?>
<main id="main-content" class="container py-5 text-center" style="max-width: 550px; margin-top: 60px;">
    <div class="card p-5 border-0 shadow-sm rounded-4">
        <div class="mb-3">
            <i class="bi bi-shield-lock text-muted" style="font-size: 3.5rem;"></i>
        </div>
        <h1 class="h3 fw-bold mb-2">This Journey is Private</h1>
        <p class="text-muted small mb-4">
            The owner of this journey map has not enabled public link sharing, or the link has expired.
        </p>
        <div class="d-flex justify-content-center gap-2">
            <a href="/" class="btn btn-primary px-4">Sign In to Ptolemy</a>
            <a href="/about/" class="btn btn-outline-secondary px-3">Learn More</a>
        </div>
    </div>
</main>
<?php else: ?>

<!-- Clean Public Navbar (No administrative tools) -->
<nav class="navbar navbar-expand-lg fixed-top public-navbar" aria-label="Public Journey Navigation">
    <div class="container-fluid px-lg-5">
        <a class="navbar-brand d-flex align-items-center" href="/">
            <i class="bi bi-map-fill text-primary me-2"></i>
            <span class="fw-bold fs-6">Ptolemy</span>
            <span class="badge bg-light text-muted border ms-2 fw-normal d-none d-sm-inline" style="font-size: 0.7rem;">Read Only</span>
        </a>

        <div class="d-flex align-items-center gap-2 ms-auto">
            <!-- Mode Toggle Switch -->
            <div class="btn-group btn-group-sm" role="group" aria-label="Journey view mode">
                <button type="button" class="btn btn-outline-primary <?php echo $initialMode === 'visual' ? 'active' : ''; ?>" id="mode-visual" aria-pressed="<?php echo $initialMode === 'visual' ? 'true' : 'false'; ?>" onclick="switchEditorMode('visual')">
                    <i class="bi bi-diagram-3 me-1"></i>Visual
                </button>
                <button type="button" class="btn btn-outline-primary <?php echo $initialMode === 'table' ? 'active' : ''; ?>" id="mode-table" aria-pressed="<?php echo $initialMode === 'table' ? 'true' : 'false'; ?>" onclick="switchEditorMode('table')">
                    <i class="bi bi-table me-1"></i>Table
                </button>
            </div>

            <!-- Export Dropdown -->
            <div class="dropdown">
                <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    <i class="bi bi-download me-1"></i> Export
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                    <li><button type="button" class="dropdown-item py-2" onclick="exportToOJF()"><i class="bi bi-filetype-json me-2"></i>.ojf (JSON)</button></li>
                    <li><button type="button" class="dropdown-item py-2" onclick="exportToMarkdown()"><i class="bi bi-filetype-md me-2"></i>.md (Markdown)</button></li>
                    <li><button type="button" class="dropdown-item py-2" onclick="exportTextualPDF()"><i class="bi bi-file-earmark-pdf me-2"></i>Text Report (PDF)</button></li>
                    <li><button type="button" class="dropdown-item py-2" onclick="exportToPNG()"><i class="bi bi-file-earmark-image me-2"></i>PNG Image</button></li>
                    <li><button type="button" class="dropdown-item py-2" onclick="exportToPDF()"><i class="bi bi-file-earmark-pdf me-2"></i>PDF Document</button></li>
                </ul>
            </div>

            <?php if (!empty($isEditorOrOwner)): ?>
            <a href="/journey/<?php echo htmlspecialchars($journey['id'], ENT_QUOTES, 'UTF-8'); ?>/" class="btn btn-primary btn-sm ms-2">
                <i class="bi bi-pencil-square me-1"></i> Edit Journey
            </a>
            <?php else: ?>
            <a href="/dashboard/" class="btn btn-primary btn-sm ms-2 d-none d-md-inline-block">
                Open in Ptolemy <i class="bi bi-arrow-right ms-1"></i>
            </a>
            <?php endif; ?>
        </div>
    </div>
</nav>

<main id="main-content" class="container-fluid px-lg-5 mt-4">
    <!-- Journey Header Banner -->
    <div class="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-3">
            <div>
                <h1 class="h3 fw-bold mb-2 text-dark" id="display-title"><?php echo htmlspecialchars($journey['title'], ENT_QUOTES, 'UTF-8'); ?></h1>
                <?php if (!empty($journey['description'])): ?>
                <p class="text-muted small mb-3"><?php echo htmlspecialchars($journey['description'], ENT_QUOTES, 'UTF-8'); ?></p>
                <?php endif; ?>

                <div class="d-flex align-items-center gap-2 flex-wrap">
                    <?php if (!empty($ojfData['persona'])): ?>
                    <span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 py-2">
                        <i class="bi bi-person me-1"></i>Persona: <?php echo htmlspecialchars($ojfData['persona'], ENT_QUOTES, 'UTF-8'); ?>
                    </span>
                    <?php endif; ?>

                    <?php if (!empty($ojfData['pointOfView'])): ?>
                    <span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle rounded-pill px-3 py-2">
                        <i class="bi bi-eye me-1"></i>POV: <?php echo htmlspecialchars($ojfData['pointOfView'], ENT_QUOTES, 'UTF-8'); ?>
                    </span>
                    <?php endif; ?>

                    <span class="badge bg-light text-dark border rounded-pill px-3 py-2">
                        <i class="bi bi-calendar3 me-1"></i>Updated: <?php echo date('M j, Y', strtotime($journey['updated_at'])); ?>
                    </span>
                </div>
            </div>

            <div class="d-flex align-items-center bg-light p-3 rounded-3 border">
                <div class="text-end me-3">
                    <span class="d-block small text-muted text-uppercase fw-bold">Journey Score</span>
                    <span id="scorecard-sentiment" class="badge rounded-pill bg-secondary text-white fw-medium">Unscored</span>
                </div>
                <span id="scorecard-value" class="fw-bold fs-3 text-primary">-</span>
            </div>
        </div>
    </div>

    <!-- Hidden form elements for exporter compatibility -->
    <input type="hidden" id="editor-title" value="<?php echo htmlspecialchars($journey['title'], ENT_QUOTES, 'UTF-8'); ?>">
    <input type="hidden" id="editor-persona" value="<?php echo htmlspecialchars($ojfData['persona'] ?? '', ENT_QUOTES, 'UTF-8'); ?>">
    <input type="hidden" id="editor-pov" value="<?php echo htmlspecialchars($ojfData['pointOfView'] ?? '', ENT_QUOTES, 'UTF-8'); ?>">

    <!-- Sub-View: Visual Map -->
    <div id="visual-map-view" class="visual-map-wrapper" tabindex="0" role="region" aria-label="Visual Journey Map">
        <div class="d-flex justify-content-end mb-2 gap-3">
            <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="toggle-blueprint-mode" onchange="toggleBlueprintMode()">
                <label class="form-check-label text-muted small" for="toggle-blueprint-mode">Blueprint Mode</label>
            </div>
            <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="toggle-emotional-curve" checked onchange="drawEmotionalCurve()">
                <label class="form-check-label text-muted small" for="toggle-emotional-curve">Show Emotional Curve</label>
            </div>
        </div>
        <div id="map-grid" class="journey-grid position-relative">
            <svg id="emotional-curve-svg" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1;"></svg>
        </div>
    </div>

    <!-- Sub-View: Table View -->
    <div id="table-editor-view" class="table-editor-container" style="display: none;">
        <div class="card p-4 border-0 shadow-sm rounded-4 mb-4">
            <h5 class="fw-bold mb-3"><i class="bi bi-table me-2"></i>Journey Steps</h5>
            <div class="table-responsive" tabindex="0" role="region" aria-label="Journey Steps Table">
                <table class="table table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Step Title</th>
                            <th>Stage</th>
                            <th>Swimlane</th>
                            <th>Severity</th>
                            <th>Sentiment</th>
                            <th>Score</th>
                        </tr>
                    </thead>
                    <tbody id="public-nodes-table-body"></tbody>
                </table>
            </div>
        </div>
    </div>
</main>

<!-- Read-Only Node Inspection Modal -->
<div class="modal fade" id="publicNodeModal" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0 shadow">
            <div class="modal-header">
                <div>
                    <span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill mb-1" id="inspect-stage-swimlane">Stage &bull; Swimlane</span>
                    <h5 class="modal-title fw-bold" id="inspect-title">Step Title</h5>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <p id="inspect-description" class="lead fs-6 text-muted mb-4"></p>

                <div class="row g-3 mb-4">
                    <div class="col-sm-3 col-6">
                        <small class="text-muted d-block text-uppercase fw-bold">Severity</small>
                        <span id="inspect-severity" class="fw-semibold">-</span>
                    </div>
                    <div class="col-sm-3 col-6">
                        <small class="text-muted d-block text-uppercase fw-bold">Emotion Score</small>
                        <span id="inspect-score" class="fw-semibold">-</span>
                    </div>
                    <div class="col-sm-3 col-6">
                        <small class="text-muted d-block text-uppercase fw-bold">Sentiment</small>
                        <span id="inspect-sentiment" class="fw-semibold">-</span>
                    </div>
                    <div class="col-sm-3 col-6">
                        <small class="text-muted d-block text-uppercase fw-bold">Purpose</small>
                        <span id="inspect-purpose" class="fw-semibold">-</span>
                    </div>
                </div>

                <div id="inspect-mot" class="alert alert-warning py-2 mb-4 d-none">
                    <i class="bi bi-star-fill text-warning me-1"></i> <strong>Moment of Truth:</strong> Critical decision or emotion checkpoint in the user journey.
                </div>

                <!-- Service Blueprint Section -->
                <div id="inspect-blueprint-container" class="border-top pt-3 d-none">
                    <h6 class="fw-bold mb-3 text-primary"><i class="bi bi-diagram-3 me-1"></i> Service Blueprint Context</h6>
                    <div class="row g-3">
                        <div class="col-md-6" id="inspect-onstage-group">
                            <h6 class="small text-muted text-uppercase fw-bold">Onstage Actions</h6>
                            <ul class="list-group list-group-flush small" id="inspect-onstage-list"></ul>
                        </div>
                        <div class="col-md-6" id="inspect-backstage-group">
                            <h6 class="small text-muted text-uppercase fw-bold">Backstage Actions</h6>
                            <ul class="list-group list-group-flush small" id="inspect-backstage-list"></ul>
                        </div>
                        <div class="col-md-6" id="inspect-support-group">
                            <h6 class="small text-muted text-uppercase fw-bold">Support Systems</h6>
                            <ul class="list-group list-group-flush small" id="inspect-support-list"></ul>
                        </div>
                        <div class="col-md-6" id="inspect-evidence-group">
                            <h6 class="small text-muted text-uppercase fw-bold">Physical Evidence</h6>
                            <ul class="list-group list-group-flush small" id="inspect-evidence-list"></ul>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>

<script>
    window.currentJourney = <?php echo json_encode([
        'id' => $journey['id'],
        'title' => $journey['title'],
        'description' => $journey['description'],
        'is_public' => (bool)$journey['is_public'],
        'ojf_data' => $ojfData
    ], JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP); ?>;
    window.originalOJF = window.currentJourney.ojf_data;
    window.isReadOnly = true;
</script>

<?php endif; ?>

<?php
$extraJs = ["utils.js", "rendering.js", "share.js"];
include __DIR__ . '/includes/footer.php';
?>
