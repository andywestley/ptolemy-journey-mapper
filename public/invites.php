<?php
/**
 * Standalone Beta Invites Management for Ptolemy
 *
 * Distinct URL: /invites/
 */

require_once __DIR__ . '/includes/auth_guard.php';
$currentUser = requireAuth();

$pageTitle = "Beta Invites | Ptolemy";
$pageDescription = "Generate and manage invitation codes for colleagues to join Ptolemy.";
$extraCss = ["dashboard.css"];
include __DIR__ . '/includes/header.php';
?>

<!-- Loading Overlay -->
<div id="loading" class="loading-overlay">
    <div class="spinner-border text-primary" role="status"></div>
</div>

<?php 
$activeNav = 'invites';
include __DIR__ . '/includes/navbar.php'; 
?>

<div class="container py-4" style="max-width: 900px;">
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
            <h1 class="h3 fw-bold mb-1"><i class="bi bi-envelope-paper text-primary me-2"></i>Beta Invites</h1>
            <p class="text-muted small mb-0">Generate unique invitation links to onboard team members and collaborators.</p>
        </div>
        <button class="btn btn-primary" onclick="generateInvite()">
            <i class="bi bi-plus-lg me-1"></i> Generate New Invite
        </button>
    </div>

    <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div class="card-body p-0">
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th class="ps-4">Invite Token / Link</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th class="text-end pe-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="invites-table-body">
                        <tr>
                            <td colspan="4" class="text-center py-4 text-muted">
                                <div class="spinner-border text-primary spinner-border-sm me-2"></div>Loading invites...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<?php
$extraJs = ["auth.js", "utils.js", "invites.js"];
include __DIR__ . '/includes/footer.php';
?>
