<?php
/**
 * Dedicated Journey Editor for Ptolemy
 *
 * Distinct URL: /journey/{id}/
 * Modes: /journey/{id}/visual/ or /journey/{id}/table/
 */

require_once __DIR__ . '/includes/auth_guard.php';
$currentUser = requireAuth();

$journeyId = trim($_GET['id'] ?? '');
if (empty($journeyId)) {
    header('Location: /dashboard/');
    exit;
}

require_once __DIR__ . '/../models/Journey.php';

$journeyRecord = Journey::findById($journeyId);
if (!$journeyRecord || ($journeyRecord['journey_status'] ?? '') === 'trash') {
    header('Location: /dashboard/');
    exit;
}

// Verify write access for user (owner or collaborator)
if (!Journey::hasAccess($journeyRecord, $currentUser['id'], true)) {
    header('Location: /dashboard/');
    exit;
}

$isOwner = ((string)$journeyRecord['owner_id'] === (string)$currentUser['id']);
$isCollaborator = !$isOwner;
$isPublic = !empty($journeyRecord['is_public']);
$collaborators = Journey::getCollaborators($journeyId);

$initialMode = in_array($_GET['mode'] ?? '', ['visual', 'table'], true) ? $_GET['mode'] : 'visual';
$initialNotes = $journeyRecord['description'] ?? '';
$initialOjf = is_string($journeyRecord['ojf_data']) ? json_decode($journeyRecord['ojf_data'], true) : ($journeyRecord['ojf_data'] ?? []);
if (empty($initialNotes) && !empty($initialOjf['notes'])) {
    $initialNotes = $initialOjf['notes'];
}

$pageTitle = htmlspecialchars($journeyRecord['title'] ?? 'Journey', ENT_QUOTES, 'UTF-8') . " | Editor";
$pageDescription = "Interactive OpenJourney format editor";
$extraCss = ["dashboard.css"];
include __DIR__ . '/includes/header.php';
?>

<!-- Export Libraries -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>

<style>
    .comment-pin {
        position: absolute;
        width: 24px;
        height: 24px;
        background: #f59e0b;
        color: white;
        border-radius: 50% 50% 50% 0;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: translate(-50%, -100%) rotate(-45deg);
        cursor: pointer;
        z-index: 100;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        transition: transform 0.1s;
    }

    .comment-pin i {
        transform: rotate(45deg);
        font-size: 12px;
    }

    .comment-pin:hover {
        transform: translate(-50%, -100%) rotate(-45deg) scale(1.2);
    }

    .feedback-active {
        cursor: crosshair !important;
    }

    .feedback-active .node-card {
        cursor: alias !important;
        outline: 2px solid #f59e0b !important;
        outline-offset: 2px;
    }
</style>

<!-- Loading Overlay -->
<div id="loading" class="loading-overlay">
    <div class="spinner-border text-primary" role="status"></div>
</div>

<?php 
$activeNav = 'dashboard';
include __DIR__ . '/includes/navbar.php'; 
?>

<main id="main-content" class="container-fluid px-lg-5 mt-4">
    <!-- Editor Header -->
    <div class="mb-4">
        <!-- Title Bar: Back Arrow, Title Input, Privacy Badge, Save Status, Actions Dropdown -->
        <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-3">
            <div class="d-flex align-items-center flex-grow-1 me-3">
                <a href="/dashboard/" class="btn btn-link link-secondary me-3 p-0" title="Back to Journeys">
                    <i class="bi bi-arrow-left fs-3"></i>
                </a>
                <div class="d-flex align-items-center gap-2 flex-grow-1 flex-wrap">
                    <h1 class="visually-hidden" id="editor-page-heading">Journey Editor: <?php echo htmlspecialchars($journeyRecord['title'] ?? 'Untitled Journey', ENT_QUOTES, 'UTF-8'); ?></h1>
                    <input type="text" id="editor-title" class="form-control form-control-lg border-0 fw-bold bg-transparent px-0 flex-grow-1" style="min-width: 240px;" value="<?php echo htmlspecialchars($journeyRecord['title'] ?? 'Untitled Journey', ENT_QUOTES, 'UTF-8'); ?>" aria-label="Journey Title">
                    <!-- Sharing & Privacy Status Badge -->
                    <button class="btn btn-sm <?php echo $isPublic ? 'btn-outline-success' : 'btn-outline-secondary'; ?> rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1 flex-shrink-0" id="journey-privacy-badge" type="button" onclick="openShareModal()" title="Sharing settings">
                        <i class="bi <?php echo $isPublic ? 'bi-globe' : 'bi-lock'; ?>"></i>
                        <span><?php echo $isPublic ? 'Public' : 'Private'; ?></span>
                    </button>
                </div>
            </div>

            <div class="d-flex align-items-center gap-3 ms-auto">
                <!-- Auto-save Sync Status Indicator -->
                <div id="save-status" class="d-flex align-items-center text-muted small opacity-0" aria-live="polite">
                    <span class="save-indicator-dot"></span>
                    <span id="save-text">Saved</span>
                </div>

                <!-- Clean Actions Menu -->
                <div class="dropdown">
                    <button class="btn btn-outline-secondary dropdown-toggle px-3" type="button" data-bs-toggle="dropdown">
                        <i class="bi bi-three-dots-vertical me-1"></i> Actions
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                        <li><button type="button" class="dropdown-item py-2" onclick="openShareModal()"><i class="bi bi-share me-2 text-primary"></i>Share Journey</button></li>
                        <li id="menu-item-feedback" style="display: none;"><button type="button" class="dropdown-item py-2" onclick="toggleFeedbackMode()"><i class="bi bi-chat-dots me-2"></i><span id="feedback-menu-text">Feedback: OFF</span></button></li>
                        <li><hr class="dropdown-divider"></li>
                        <li class="dropdown-header text-uppercase small fw-bold text-muted">Export As...</li>
                        <li><button type="button" class="dropdown-item py-2" onclick="exportToOJF()"><i class="bi bi-filetype-json me-2"></i>.ojf (JSON)</button></li>
                        <li><button type="button" class="dropdown-item py-2" onclick="exportToMarkdown()"><i class="bi bi-filetype-md me-2"></i>.md (Markdown)</button></li>
                        <li><button type="button" class="dropdown-item py-2" onclick="exportToPNG()"><i class="bi bi-file-earmark-image me-2"></i>PNG Image</button></li>
                        <li><button type="button" class="dropdown-item py-2 fw-medium" onclick="exportExecutivePDF()"><i class="bi bi-file-earmark-pdf me-2 text-danger"></i>Executive Report (PDF)</button></li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Separate lines for each datapoint to its full extent -->
        <div class="ps-sm-5 ms-sm-2 mb-3">
            <!-- Persona -->
            <div class="d-flex align-items-baseline mb-2">
                <span class="text-uppercase fw-semibold text-secondary me-3 flex-shrink-0" style="font-size: 0.75rem; letter-spacing: 0.05em; min-width: 105px;">Persona:</span>
                <input type="text" id="editor-persona" class="metadata-full-input" placeholder="e.g. Frequent Traveler" aria-label="Persona">
            </div>

            <!-- Point of View -->
            <div class="d-flex align-items-baseline mb-2">
                <span class="text-uppercase fw-semibold text-secondary me-3 flex-shrink-0" style="font-size: 0.75rem; letter-spacing: 0.05em; min-width: 105px;">Point of View:</span>
                <input type="text" id="editor-pov" class="metadata-full-input" placeholder="e.g. Booking an emergency business flight" aria-label="Point of view">
            </div>

            <!-- Score -->
            <div class="d-flex align-items-center mb-2">
                <span class="text-uppercase fw-semibold text-secondary me-3 flex-shrink-0" style="font-size: 0.75rem; letter-spacing: 0.05em; min-width: 105px;">Score:</span>
                <span id="scorecard-value" class="fw-bold text-dark me-2">-</span>
                <span id="scorecard-sentiment" class="badge rounded-pill bg-secondary text-white fw-medium">Unscored</span>
            </div>

            <!-- Notes field displayed above the map -->
            <div class="d-flex align-items-start mb-3">
                <span class="text-uppercase fw-semibold text-secondary me-3 flex-shrink-0 pt-1" style="font-size: 0.75rem; letter-spacing: 0.05em; min-width: 105px;">Notes:</span>
                <textarea id="editor-notes" class="metadata-full-textarea" rows="1" placeholder="Add notes or background context for this journey map..." aria-label="Journey Notes"><?php echo htmlspecialchars($initialNotes, ENT_QUOTES, 'UTF-8'); ?></textarea>
            </div>

            <!-- Mode Toggle (Visual Map | Table Editor) -->
            <div class="btn-group btn-group-sm mt-1" role="group" aria-label="Journey editor mode">
                <button type="button" class="btn btn-outline-primary <?php echo $initialMode === 'visual' ? 'active' : ''; ?>" id="mode-visual" aria-pressed="<?php echo $initialMode === 'visual' ? 'true' : 'false'; ?>" onclick="switchEditorMode('visual')">
                    <i class="bi bi-diagram-3 me-1"></i>Visual Map
                </button>
                <button type="button" class="btn btn-outline-primary <?php echo $initialMode === 'table' ? 'active' : ''; ?>" id="mode-table" aria-pressed="<?php echo $initialMode === 'table' ? 'true' : 'false'; ?>" onclick="switchEditorMode('table')">
                    <i class="bi bi-table me-1"></i>Table Editor
                </button>
            </div>
        </div>
    </div>

    <!-- Sub-View: Table Editor -->
    <div id="table-editor-view" class="table-editor-container" style="<?php echo $initialMode === 'visual' ? 'display: none;' : ''; ?>">
        <div class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom flex-wrap gap-2">
            <div>
                <h2 class="h4 fw-bold mb-1"><i class="bi bi-table text-primary me-2" aria-hidden="true"></i>Table Editor</h2>
                <p class="text-muted small mb-0">Define stages, swimlanes, and step details in structured tables.</p>
            </div>
            <button class="btn btn-accent px-4 py-2 fw-semibold" id="table-save-btn" type="button" onclick="saveJourney()">
                <i class="bi bi-cloud-upload me-2" aria-hidden="true"></i>Save Changes
            </button>
        </div>
        <div class="mb-5">
            <div class="d-flex justify-content-between align-items-baseline mb-3">
                <div>
                    <h2 class="h4 mb-0">Stages (Columns)</h2>
                    <p class="text-muted small mb-0">Define the chronological steps. Examples: <em>Awareness, Discovery, Evaluation, Purchase, Retention.</em></p>
                </div>
                <button class="btn btn-sm btn-outline-primary" onclick="addStage()">
                    <i class="bi bi-plus"></i> Add Stage
                </button>
            </div>
            <div class="table-responsive">
                <table class="table table-bordered oj-table align-middle">
                    <thead class="table-light">
                        <tr>
                            <th style="width: 80px;">ID</th>
                            <th>Stage Name</th>
                            <th style="width: 150px;" title="Optional score from -5 to +5">Emotion Override</th>
                            <th style="width: 50px;"></th>
                        </tr>
                    </thead>
                    <tbody id="stages-body"></tbody>
                </table>
            </div>
        </div>

        <div>
            <div class="d-flex justify-content-between align-items-baseline mb-3">
                <div>
                    <h2 class="h4 mb-0">Swimlanes (Rows)</h2>
                    <p class="text-muted small mb-0">Define the layers of data. Examples: <em>User Actions, Pain Points, Emotional State, Tools.</em></p>
                </div>
                <button class="btn btn-sm btn-outline-primary" onclick="addSwimlane()">
                    <i class="bi bi-plus"></i> Add Swimlane
                </button>
            </div>
            <div class="table-responsive">
                <table class="table table-bordered oj-table align-middle">
                    <thead class="table-light">
                        <tr>
                            <th style="width: 80px;">ID</th>
                            <th>Swimlane Name</th>
                            <th style="width: 50px;"></th>
                        </tr>
                    </thead>
                    <tbody id="swimlanes-body"></tbody>
                </table>
            </div>
        </div>

        <div class="mt-5">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h2 class="h4 mb-0">Nodes (Journey Steps)</h2>
                <button class="btn btn-sm btn-outline-primary" onclick="openNodeModal()">
                    <i class="bi bi-plus"></i> Add Node
                </button>
            </div>
            <div class="table-responsive">
                <table class="table table-sm table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Title</th>
                            <th>Stage</th>
                            <th>Swimlane</th>
                            <th>Severity</th>
                            <th class="text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="nodes-body"></tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Sub-View: Visual Map -->
    <div id="visual-map-view" class="visual-map-wrapper" tabindex="0" role="region" aria-label="Visual Journey Map" style="<?php echo $initialMode === 'visual' ? 'display: block;' : 'display: none;'; ?>">
        <div class="d-flex justify-content-end mb-2 gap-3">
            <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="toggle-blueprint-mode" onchange="toggleBlueprintMode()">
                <label class="form-check-label text-muted small" for="toggle-blueprint-mode">Blueprint Mode</label>
            </div>
            <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="toggle-emotional-curve" checked onchange="toggleEmotionalCurve()">
                <label class="form-check-label text-muted small" for="toggle-emotional-curve">Show Emotional Curve</label>
            </div>
        </div>
        <div id="map-grid" class="journey-grid position-relative">
            <svg id="emotional-curve-svg" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1;"></svg>
        </div>
    </div>
</main>

<!-- Share Modal (with Public Link Sharing) -->
<div class="modal fade" id="shareModal" tabindex="-1" aria-labelledby="shareModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title h5 fw-bold" id="shareModalLabel"><i class="bi bi-share me-2" aria-hidden="true"></i>Share Journey</h2>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <!-- Public Link Section -->
                <div class="card mb-4 border p-3 rounded-3 shadow-xs" id="share-modal-public-card">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <div>
                            <div class="d-flex align-items-center gap-2 mb-1">
                                <span class="fw-bold"><i class="bi bi-globe me-1 text-primary"></i> Public Link Sharing</span>
                                <span id="share-modal-status-badge" class="badge <?php echo $isPublic ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-secondary-subtle text-secondary border border-secondary-subtle'; ?> px-2 py-1">
                                    <i class="bi <?php echo $isPublic ? 'bi-globe' : 'bi-lock'; ?> me-1"></i><?php echo $isPublic ? 'Public' : 'Private'; ?>
                                </span>
                            </div>
                            <small class="text-muted d-block" id="share-modal-status-desc">
                                <?php echo $isPublic 
                                    ? 'This journey map is <strong>Public</strong>. Anyone with the link can view it without logging in.' 
                                    : 'This journey map is <strong>Private</strong>. Only you and added collaborators can view or edit.'; ?>
                            </small>
                        </div>
                        <div class="form-check form-switch fs-4 mb-0 ms-3">
                            <input class="form-check-input cursor-pointer" type="checkbox" id="public-share-toggle" role="switch" <?php echo $isPublic ? 'checked' : ''; ?> onchange="togglePublicShare(this.checked)">
                        </div>
                    </div>
                    <div id="public-link-container" style="display: <?php echo $isPublic ? 'block' : 'none'; ?>;" class="mt-3 pt-3 border-top">
                        <label class="form-label small fw-semibold text-muted mb-1">Public Share Link</label>
                        <div class="input-group input-group-sm">
                            <input type="text" class="form-control font-monospace" id="public-share-url" readonly onclick="this.select()">
                            <button class="btn btn-primary" type="button" id="copy-share-btn" onclick="copyPublicShareUrl(this)">
                                <i class="bi bi-clipboard me-1"></i> Copy Link
                            </button>
                            <a href="/share/<?php echo htmlspecialchars($journey['id'], ENT_QUOTES, 'UTF-8'); ?>/" id="public-share-preview" target="_blank" rel="noopener noreferrer" class="btn btn-outline-secondary" title="Open Public View in New Tab">
                                <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i>
                                <span class="visually-hidden">Open Public View in New Tab</span>
                            </a>
                        </div>
                        <small class="text-success d-block mt-2"><i class="bi bi-check-circle me-1"></i> Link sharing active &mdash; viewers have read-only access to this map.</small>
                    </div>
                </div>

                <!-- Collaborators Section -->
                <div class="mb-3">
                    <h3 class="h6 fw-bold">Collaborators (Edit Access)</h3>
                    <label for="share-email" class="form-label small text-muted">Add team members via email address</label>
                    <div class="input-group">
                        <input type="email" class="form-control" id="share-email" placeholder="collaborator@example.com" autocomplete="email">
                        <button class="btn btn-primary" onclick="addCollaborator()">Add</button>
                    </div>
                </div>
                <h4 class="small text-muted text-uppercase fw-bold mb-2">Current Collaborators</h4>
                <ul class="list-group list-group-flush border rounded" id="collaborators-list"></ul>
            </div>
        </div>
    </div>
</div>

<!-- Node Modal -->
<div class="modal fade" id="nodeModal" tabindex="-1" aria-labelledby="nodeModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title h5 fw-bold" id="nodeModalLabel">Edit Node</h2>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body p-0">
                <ul class="nav nav-tabs nav-fill border-bottom-0 bg-light" id="nodeModalTabs" role="tablist">
                    <li class="nav-item">
                        <button class="nav-link active py-3 fw-bold" id="journey-tab" data-bs-toggle="tab" data-bs-target="#journey-panel" type="button" role="tab">
                            <i class="bi bi-geo-alt me-2"></i>Journey Step
                        </button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link py-3 fw-bold" id="blueprint-tab" data-bs-toggle="tab" data-bs-target="#blueprint-panel" type="button" role="tab">
                            <i class="bi bi-diagram-3 me-2"></i>Service Blueprint
                        </button>
                    </li>
                </ul>

                <div class="tab-content border-top">
                    <!-- Tab 1: Journey Details -->
                    <div class="tab-pane fade show active p-4" id="journey-panel" role="tabpanel">
                        <form id="node-form">
                            <input type="hidden" id="node-id">

                            <div class="mb-3">
                                <label for="node-title" class="form-label">Title</label>
                                <input type="text" class="form-control" id="node-title" required placeholder="Node title">
                            </div>
                            <div class="mb-3">
                                <label for="node-description" class="form-label">Description</label>
                                <textarea class="form-control" id="node-description" rows="3" placeholder="Brief description"></textarea>
                            </div>
                            <div class="row mb-3">
                                <div class="col-6">
                                    <label for="node-stage-id" class="form-label">Stage</label>
                                    <select class="form-select" id="node-stage-id"></select>
                                </div>
                                <div class="col-6">
                                    <label for="node-swimlane-id" class="form-label">Swimlane</label>
                                    <select class="form-select" id="node-swimlane-id"></select>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-6">
                                    <label for="node-severity" class="form-label">Severity</label>
                                    <select class="form-select" id="node-severity">
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                <div class="col-6">
                                    <label for="node-score" class="form-label">Emotion score (-5 to +5)</label>
                                    <input type="number" class="form-control" id="node-score" min="-5" max="5" placeholder="Emotion score">
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-6">
                                    <label for="node-sentiment" class="form-label">Sentiment (Tone)</label>
                                    <select class="form-select" id="node-sentiment">
                                        <option value="">None / Neutral</option>
                                        <option value="positive">Positive</option>
                                        <option value="negative">Negative</option>
                                        <option value="anxious">Anxious</option>
                                        <option value="frustrated">Frustrated</option>
                                        <option value="delighted">Delighted</option>
                                        <option value="surprised">Surprised</option>
                                        <option value="confused">Confused</option>
                                        <option value="relieved">Relieved</option>
                                        <option value="bored">Bored</option>
                                        <option value="angry">Angry</option>
                                    </select>
                                </div>
                                <div class="col-6">
                                    <label for="node-purpose" class="form-label">Purpose (Role)</label>
                                    <select class="form-select" id="node-purpose">
                                        <option value="">None</option>
                                        <option value="touchpoint">Touchpoint</option>
                                        <option value="pain-point">Pain Point</option>
                                        <option value="gain">Gain</option>
                                        <option value="opportunity">Opportunity</option>
                                        <option value="milestone">Milestone</option>
                                        <option value="bottleneck">Bottleneck</option>
                                        <option value="decision">Decision</option>
                                        <option value="observation">Observation</option>
                                        <option value="note">Note</option>
                                    </select>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-12">
                                    <label class="form-label">Background Theme</label>
                                    <div class="color-grid" id="color-picker-grid"></div>
                                    <input type="hidden" id="node-icon-color">
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-6">
                                    <label for="node-tags" class="form-label">Tags (comma separated)</label>
                                    <input type="text" class="form-control" id="node-tags" placeholder="tag1, tag2">
                                </div>
                                <div class="col-6 d-flex align-items-end">
                                    <div class="form-check form-switch mb-2">
                                        <input class="form-check-input" type="checkbox" id="node-moment-of-truth">
                                        <label class="form-check-label" for="node-moment-of-truth">Moment of Truth</label>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    <!-- Tab 2: Service Blueprint -->
                    <div class="tab-pane fade p-4" id="blueprint-panel" role="tabpanel">
                        <div class="alert alert-info py-2 small mb-4">
                            <i class="bi bi-info-circle me-2"></i> Document the internal processes and evidence that support this journey step.
                        </div>

                        <!-- Onstage Actions -->
                        <div class="blueprint-section mb-4">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h3 class="fw-bold mb-0 text-primary small text-uppercase">Onstage (Visible) Actions</h3>
                                <button class="btn btn-sm btn-link text-decoration-none p-0" onclick="addBlueprintItem('onstage')">
                                    <i class="bi bi-plus-circle me-1"></i>Add
                                </button>
                            </div>
                            <div id="blueprint-onstage-list" class="blueprint-item-list"></div>
                        </div>

                        <!-- Backstage Actions -->
                        <div class="blueprint-section mb-4">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h3 class="fw-bold mb-0 text-primary small text-uppercase">Backstage (Invisible) Actions</h3>
                                <button class="btn btn-sm btn-link text-decoration-none p-0" onclick="addBlueprintItem('backstage')">
                                    <i class="bi bi-plus-circle me-1"></i>Add
                                </button>
                            </div>
                            <div id="blueprint-backstage-list" class="blueprint-item-list"></div>
                        </div>

                        <!-- Support Processes -->
                        <div class="blueprint-section mb-4">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h3 class="fw-bold mb-0 text-primary small text-uppercase">Support Processes & Systems</h3>
                                <button class="btn btn-sm btn-link text-decoration-none p-0" onclick="addBlueprintItem('support')">
                                    <i class="bi bi-plus-circle me-1"></i>Add
                                </button>
                            </div>
                            <div id="blueprint-support-list" class="blueprint-item-list"></div>
                        </div>

                        <!-- Physical Evidence -->
                        <div class="blueprint-section">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h3 class="fw-bold mb-0 text-primary small text-uppercase">Physical Evidence</h3>
                                <button class="btn btn-sm btn-link text-decoration-none p-0" onclick="addBlueprintItem('evidence')">
                                    <i class="bi bi-plus-circle me-1"></i>Add
                                </button>
                            </div>
                            <div id="blueprint-evidence-list" class="blueprint-item-list"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-danger me-auto" id="delete-node-btn" onclick="deleteNodeFromModal()">Delete</button>
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="saveNode()">Save Node</button>
            </div>
        </div>
    </div>
</div>

<!-- Comment Modal -->
<div class="modal fade" id="commentModal" tabindex="-1">
    <div class="modal-dialog modal-sm">
        <div class="modal-content">
            <div class="modal-header py-2">
                <h2 class="modal-title h6" id="commentModalTitle">Add Feedback</h2>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="comment-x">
                <input type="hidden" id="comment-y">
                <input type="hidden" id="comment-parent-id">
                <input type="hidden" id="comment-node-id">
                <textarea id="comment-content" class="form-control mb-3" rows="3" placeholder="Drop a note..."></textarea>
                <button class="btn btn-warning w-100" onclick="saveComment()">Post Note</button>
            </div>
        </div>
    </div>
</div>

<!-- Thread Modal -->
<div class="modal fade" id="threadModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title h5">Discussion</h2>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div id="thread-list" class="mb-4"></div>
                <div class="input-group mb-2">
                    <input type="hidden" id="reply-parent-id">
                    <input type="text" id="reply-content" class="form-control" placeholder="Write a reply...">
                    <button class="btn btn-primary" onclick="saveReply()">Reply</button>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="reply-resolve">
                    <label class="form-check-label text-muted small" for="reply-resolve">
                        Resolve this thread (hides it from the map)
                    </label>
                </div>
            </div>
        </div>
    </div>
</div>

<?php
$ojfData = is_string($journeyRecord['ojf_data']) ? json_decode($journeyRecord['ojf_data'], true) : $journeyRecord['ojf_data'];
?>
<script>
    const INITIAL_JOURNEY_ID = "<?php echo htmlspecialchars($journeyId, ENT_QUOTES, 'UTF-8'); ?>";
    const INITIAL_EDITOR_MODE = "<?php echo htmlspecialchars($initialMode, ENT_QUOTES, 'UTF-8'); ?>";
    window.currentJourney = <?php echo json_encode([
        'id' => $journeyRecord['id'],
        'title' => $journeyRecord['title'],
        'description' => $journeyRecord['description'],
        'owner' => (string)$journeyRecord['owner_id'],
        'folder' => $journeyRecord['folder'],
        'journey_status' => $journeyRecord['journey_status'],
        'is_public' => $isPublic,
        'collaborators' => array_map('strval', array_column($collaborators, 'id')),
        'expand' => [
            'collaborators' => $collaborators
        ],
        'ojf_data' => $ojfData
    ], JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP); ?>;
    window.originalOJF = window.currentJourney.ojf_data || {};
</script>

<?php
$extraJs = ["auth.js", "utils.js", "rendering.js", "editor.js", "comments.js"];
include __DIR__ . '/includes/footer.php';
?>
