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

$db = getDBConnection();
$stmt = $db->prepare("SELECT * FROM journeys WHERE id = ?");
$stmt->execute([$journeyId]);
$journeyRecord = $stmt->fetch();

if (!$journeyRecord || $journeyRecord['journey_status'] === 'trash') {
    header('Location: /dashboard/');
    exit;
}

// Verify write/read access for user
$isOwner = ($journeyRecord['owner_id'] === $currentUser['id']);
$stmtCollab = $db->prepare("SELECT 1 FROM journey_collaborators WHERE journey_id = ? AND user_id = ?");
$stmtCollab->execute([$journeyId, $currentUser['id']]);
$isCollaborator = (bool)$stmtCollab->fetch();

if (!$isOwner && !$isCollaborator) {
    header('Location: /dashboard/');
    exit;
}

$initialMode = in_array($_GET['mode'] ?? '', ['visual', 'table'], true) ? $_GET['mode'] : 'table';

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

<div class="container-fluid px-lg-5 mt-4">
    <!-- Editor Header -->
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div class="d-flex align-items-center">
            <a href="/dashboard/" class="btn btn-link link-secondary me-3 p-0" title="Back to Journeys">
                <i class="bi bi-arrow-left fs-3"></i>
            </a>
            <div>
                <input type="text" id="editor-title" class="form-control form-control-lg border-0 fw-bold bg-transparent px-0 mb-2" style="max-width: 500px;" value="<?php echo htmlspecialchars($journeyRecord['title'] ?? 'Untitled Journey', ENT_QUOTES, 'UTF-8'); ?>">

                <div class="metadata-bar">
                    <div class="metadata-item">
                        <span class="metadata-label">Persona</span>
                        <input type="text" id="editor-persona" class="metadata-input" placeholder="e.g. Frequent Traveler">
                    </div>
                    <div class="vr mx-1 text-muted opacity-25"></div>
                    <div class="metadata-item">
                        <span class="metadata-label">POV</span>
                        <input type="text" id="editor-pov" class="metadata-input" placeholder="e.g. Booking a flight">
                    </div>
                    <div class="vr mx-3 text-muted opacity-25"></div>
                    <div class="metadata-item pe-none">
                        <span class="metadata-label">Journey Score</span>
                        <div class="d-flex align-items-center">
                            <span id="scorecard-value" class="fw-bold fs-5 me-2">-</span>
                            <span id="scorecard-sentiment" class="badge rounded-pill bg-secondary text-white fw-medium">Unscored</span>
                        </div>
                    </div>
                </div>

                <!-- Toggle Switch -->
                <div class="btn-group btn-group-sm mt-2" role="group">
                    <input type="radio" class="btn-check" name="editor-mode" id="mode-table" <?php echo $initialMode === 'table' ? 'checked' : ''; ?> onclick="switchEditorMode('table')">
                    <label class="btn btn-outline-primary" for="mode-table"><i class="bi bi-table me-1"></i>Table Editor</label>

                    <input type="radio" class="btn-check" name="editor-mode" id="mode-visual" <?php echo $initialMode === 'visual' ? 'checked' : ''; ?> onclick="switchEditorMode('visual')">
                    <label class="btn btn-outline-primary" for="mode-visual"><i class="bi bi-diagram-3 me-1"></i>Visual Map</label>
                </div>
            </div>
        </div>

        <div class="d-flex align-items-center gap-2">
            <button class="btn btn-accent px-4" onclick="saveJourney()">
                <i class="bi bi-cloud-upload me-2"></i>Save Changes
            </button>
            <div class="dropdown">
                <button class="btn btn-outline-secondary dropdown-toggle px-3" type="button" data-bs-toggle="dropdown">
                    <i class="bi bi-three-dots-vertical me-1"></i> Actions
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                    <li><a class="dropdown-item py-2" href="#" onclick="openShareModal()"><i class="bi bi-share me-2 text-primary"></i>Share Journey</a></li>
                    <li id="menu-item-feedback" style="display: none;"><a class="dropdown-item py-2" href="#" onclick="toggleFeedbackMode()"><i class="bi bi-chat-dots me-2"></i><span id="feedback-menu-text">Feedback: OFF</span></a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li class="dropdown-header text-uppercase small fw-bold text-muted">Export As...</li>
                    <li><a class="dropdown-item py-2" href="#" onclick="exportToOJF()"><i class="bi bi-filetype-json me-2"></i>.ojf (JSON)</a></li>
                    <li><a class="dropdown-item py-2" href="#" onclick="exportToMarkdown()"><i class="bi bi-filetype-md me-2"></i>.md (Markdown)</a></li>
                    <li><a class="dropdown-item py-2" href="#" onclick="exportTextualPDF()"><i class="bi bi-file-earmark-pdf me-2"></i>Text Report (PDF)</a></li>
                    <li><a class="dropdown-item py-2" href="#" onclick="exportToPNG()"><i class="bi bi-file-earmark-image me-2"></i>PNG Image</a></li>
                    <li><a class="dropdown-item py-2" href="#" onclick="exportToPDF()"><i class="bi bi-file-earmark-pdf me-2"></i>PDF Document</a></li>
                </ul>
            </div>
        </div>
    </div>

    <!-- Sub-View: Table Editor -->
    <div id="table-editor-view" class="table-editor-container">
        <div class="mb-5">
            <div class="d-flex justify-content-between align-items-baseline mb-3">
                <div>
                    <h4 class="mb-0">Stages (Columns)</h4>
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
                    <h4 class="mb-0">Swimlanes (Rows)</h4>
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
                <h4 class="mb-0">Nodes (Journey Steps)</h4>
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
    <div id="visual-map-view" class="visual-map-wrapper" style="display: none;">
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
</div>

<!-- Share Modal (with Public Link Sharing) -->
<div class="modal fade" id="shareModal" tabindex="-1" aria-labelledby="shareModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title fw-bold" id="shareModalLabel"><i class="bi bi-share me-2"></i>Share Journey</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <!-- Public Link Section -->
                <div class="card mb-4 border-0 bg-light p-3 rounded-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <div>
                            <span class="fw-bold d-block"><i class="bi bi-globe me-1 text-primary"></i> Public Link Sharing</span>
                            <small class="text-muted">Anyone with this link can view this journey map without logging in.</small>
                        </div>
                        <div class="form-check form-switch fs-5 mb-0">
                            <input class="form-check-input" type="checkbox" id="public-share-toggle" onchange="togglePublicShare(this.checked)">
                        </div>
                    </div>
                    <div id="public-link-container" style="display: none;" class="mt-2">
                        <div class="input-group input-group-sm">
                            <input type="text" class="form-control font-monospace" id="public-share-url" readonly>
                            <button class="btn btn-primary" type="button" id="copy-share-btn" onclick="copyPublicShareUrl(this)">
                                <i class="bi bi-clipboard me-1"></i> Copy Link
                            </button>
                            <a href="#" id="public-share-preview" target="_blank" class="btn btn-outline-secondary" title="Open Public View">
                                <i class="bi bi-box-arrow-up-right"></i>
                            </a>
                        </div>
                    </div>
                </div>

                <!-- Collaborators Section -->
                <div class="mb-3">
                    <h6 class="fw-bold">Collaborators (Edit Access)</h6>
                    <label for="share-email" class="form-label small text-muted">Add team members via email address</label>
                    <div class="input-group">
                        <input type="email" class="form-control" id="share-email" placeholder="collaborator@example.com">
                        <button class="btn btn-primary" onclick="addCollaborator()">Add</button>
                    </div>
                </div>
                <h6 class="small text-muted text-uppercase fw-bold mb-2">Current Collaborators</h6>
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
                <h5 class="modal-title fw-bold" id="nodeModalLabel">Edit Node</h5>
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
                                <h6 class="fw-bold mb-0 text-primary small text-uppercase">Onstage (Visible) Actions</h6>
                                <button class="btn btn-sm btn-link text-decoration-none p-0" onclick="addBlueprintItem('onstage')">
                                    <i class="bi bi-plus-circle me-1"></i>Add
                                </button>
                            </div>
                            <div id="blueprint-onstage-list" class="blueprint-item-list"></div>
                        </div>

                        <!-- Backstage Actions -->
                        <div class="blueprint-section mb-4">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h6 class="fw-bold mb-0 text-primary small text-uppercase">Backstage (Invisible) Actions</h6>
                                <button class="btn btn-sm btn-link text-decoration-none p-0" onclick="addBlueprintItem('backstage')">
                                    <i class="bi bi-plus-circle me-1"></i>Add
                                </button>
                            </div>
                            <div id="blueprint-backstage-list" class="blueprint-item-list"></div>
                        </div>

                        <!-- Support Processes -->
                        <div class="blueprint-section mb-4">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h6 class="fw-bold mb-0 text-primary small text-uppercase">Support Processes & Systems</h6>
                                <button class="btn btn-sm btn-link text-decoration-none p-0" onclick="addBlueprintItem('support')">
                                    <i class="bi bi-plus-circle me-1"></i>Add
                                </button>
                            </div>
                            <div id="blueprint-support-list" class="blueprint-item-list"></div>
                        </div>

                        <!-- Physical Evidence -->
                        <div class="blueprint-section">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h6 class="fw-bold mb-0 text-primary small text-uppercase">Physical Evidence</h6>
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
                <h6 class="modal-title" id="commentModalTitle">Add Feedback</h6>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
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
                <h5 class="modal-title">Discussion</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
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

<script>
    const INITIAL_JOURNEY_ID = "<?php echo htmlspecialchars($journeyId, ENT_QUOTES, 'UTF-8'); ?>";
    const INITIAL_EDITOR_MODE = "<?php echo htmlspecialchars($initialMode, ENT_QUOTES, 'UTF-8'); ?>";
</script>

<?php
$extraJs = ["auth.js", "utils.js", "rendering.js", "editor.js", "comments.js"];
include __DIR__ . '/includes/footer.php';
?>
