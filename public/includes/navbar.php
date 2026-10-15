<?php
/**
 * Shared Application Navigation Bar for Ptolemy
 *
 * Expected variables:
 * - $currentUser (array): Authenticated user details from requireAuth()
 * - $activeNav (string, optional): 'dashboard', 'templates', 'invites', 'admin'
 */
$activeNav = $activeNav ?? 'dashboard';
?>
<nav class="navbar navbar-expand-lg fixed-top bg-white border-bottom shadow-sm" aria-label="Main Navigation">
    <div class="container">
        <a class="navbar-brand d-flex align-items-center" href="/dashboard/">
            <i class="bi bi-map-fill text-primary me-2 fs-5"></i>
            <span class="fw-bold">Ptolemy</span>
            <small class="text-muted fw-normal ms-2 d-none d-md-inline" style="font-size: 0.8rem;">the OpenJourney editor</small>
        </a>

        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#ptolemyNavbar">
            <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="ptolemyNavbar">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-3">
                <li class="nav-item">
                    <a class="nav-link px-3 <?php echo $activeNav === 'dashboard' ? 'active fw-semibold text-primary' : ''; ?>" href="/dashboard/">
                        <i class="bi bi-grid me-1"></i>Journeys
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link px-3 <?php echo $activeNav === 'templates' ? 'active fw-semibold text-primary' : ''; ?>" href="/templates/">
                        <i class="bi bi-collection me-1"></i>Templates
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link px-3 <?php echo $activeNav === 'invites' ? 'active fw-semibold text-primary' : ''; ?>" href="/invites/">
                        <i class="bi bi-envelope-paper me-1"></i>Invites
                    </a>
                </li>
                <?php if (!empty($currentUser['is_admin'])): ?>
                <li class="nav-item">
                    <a class="nav-link px-3 <?php echo $activeNav === 'admin' ? 'active fw-semibold text-primary' : ''; ?>" href="/admin/">
                        <i class="bi bi-shield-lock me-1"></i>Admin
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link px-3 text-secondary" href="/api/diagnostics.php">
                        <i class="bi bi-activity me-1"></i>Diagnostics
                    </a>
                </li>
                <?php endif; ?>
                <li class="nav-item">
                    <a class="nav-link px-3 text-secondary <?php echo $activeNav === 'help' ? 'active fw-semibold text-primary' : ''; ?>" href="/about/" rel="help" title="Help documentation, guides, and OpenJourney format">
                        <i class="bi bi-question-circle me-1" aria-hidden="true"></i>Help
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link px-3 text-secondary" href="https://github.com/andywestley/ptolemy-journey-mapper/issues" target="_blank" rel="noopener noreferrer help" title="Get human support or report an issue on GitHub">
                        <i class="bi bi-life-preserver me-1" aria-hidden="true"></i>Support
                        <i class="bi bi-box-arrow-up-right ms-1" aria-hidden="true" style="font-size: 0.7rem;"></i>
                        <span class="visually-hidden">(opens in a new tab)</span>
                    </a>
                </li>
            </ul>

            <div class="d-flex align-items-center gap-3">
                <span id="save-status" class="opacity-0 save-status me-2">
                    <span class="save-indicator-dot"></span>
                    <span id="save-text">Saved</span>
                </span>

                <div class="d-flex align-items-center text-muted small d-none d-sm-flex">
                    <i class="bi bi-person-circle me-1 fs-5"></i>
                    <span id="user-email"><?php echo htmlspecialchars($currentUser['email'] ?: ($currentUser['username'] ?: $currentUser['name']), ENT_QUOTES, 'UTF-8'); ?></span>
                </div>

                <button class="btn btn-outline-danger btn-sm" onclick="logout()">
                    <i class="bi bi-box-arrow-right me-1"></i>Logout
                </button>
            </div>
        </div>
    </div>
</nav>
