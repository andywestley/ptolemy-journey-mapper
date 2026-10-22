<?php
/**
 * Shared Public Navigation Bar for Ptolemy (for unauthenticated / public pages)
 *
 * Expected variables:
 * - $activePublicNav (string, optional): 'home', 'login', 'about', 'templates', 'share'
 */
if (empty($activePublicNav)) {
    $currentUri = $_SERVER['REQUEST_URI'] ?? '';
    if (strpos($currentUri, '/share/') !== false) {
        $activePublicNav = 'share';
    } elseif (strpos($currentUri, '/about') !== false) {
        $activePublicNav = 'about';
    } elseif (strpos($currentUri, '/login') !== false) {
        $activePublicNav = 'login';
    } elseif (strpos($currentUri, '/templates') !== false) {
        $activePublicNav = 'templates';
    } elseif ($currentUri === '/' || strpos($currentUri, '/index.php') !== false) {
        $activePublicNav = 'home';
    } else {
        $activePublicNav = 'home';
    }
}
?>
<nav class="navbar navbar-expand-lg bg-white border-bottom shadow-sm sticky-top" aria-label="Public Navigation">
    <div class="container" style="max-width: 1000px;">
        <a class="navbar-brand d-flex align-items-center <?php echo $activePublicNav === 'home' ? 'active' : ''; ?>" href="/" <?php echo $activePublicNav === 'home' ? 'aria-current="page"' : ''; ?>>
            <i class="bi bi-map-fill text-primary me-2 fs-5" aria-hidden="true"></i>
            <span class="fw-bold">Ptolemy</span>
            <small class="text-muted fw-normal ms-2 d-none d-sm-inline" style="font-size: 0.8rem;">the OpenJourney editor</small>
        </a>
        <?php if ($activePublicNav === 'share'): ?>
        <div class="d-flex align-items-center me-auto ms-2 ms-md-3 overflow-hidden">
            <span class="text-muted me-2 d-none d-sm-inline" aria-hidden="true">/</span>
            <a href="<?php echo htmlspecialchars($_SERVER['REQUEST_URI'] ?? '/share/', ENT_QUOTES, 'UTF-8'); ?>" class="nav-link active text-dark fw-semibold text-truncate p-0" aria-current="page">
                Shared Journey
            </a>
        </div>
        <?php endif; ?>
        <div class="d-flex align-items-center gap-2 ms-auto">
            <?php if ($activePublicNav !== 'home' && $activePublicNav !== 'login'): ?>
                <a href="/login" class="btn btn-outline-primary btn-sm fw-semibold">Sign In</a>
            <?php elseif ($activePublicNav === 'login'): ?>
                <a href="/login" class="btn btn-outline-primary btn-sm fw-semibold active" aria-current="page">Sign In</a>
            <?php endif; ?>
            <a href="/about/" class="btn btn-outline-secondary btn-sm fw-semibold <?php echo $activePublicNav === 'about' ? 'active' : ''; ?>" <?php echo $activePublicNav === 'about' ? 'aria-current="page"' : ''; ?> rel="help" title="About Ptolemy, guides, and help">
                <i class="bi bi-question-circle me-1" aria-hidden="true"></i>Help
            </a>
            <a href="https://github.com/andywestley/ptolemy-journey-mapper/issues" target="_blank" rel="noopener noreferrer help" class="btn btn-outline-secondary btn-sm fw-semibold" title="Get human support or report an issue on GitHub">
                <i class="bi bi-life-preserver me-1" aria-hidden="true"></i>Support
                <i class="bi bi-box-arrow-up-right ms-1" aria-hidden="true" style="font-size: 0.7rem;"></i>
                <span class="visually-hidden">(opens in a new tab)</span>
            </a>
            <a href="/templates/" class="btn btn-outline-secondary btn-sm fw-semibold <?php echo $activePublicNav === 'templates' ? 'active' : ''; ?>" <?php echo $activePublicNav === 'templates' ? 'aria-current="page"' : ''; ?>>Templates</a>
            <a href="https://github.com/andywestley/ptolemy-journey-mapper" target="_blank" rel="noopener noreferrer" class="btn btn-outline-dark btn-sm fw-semibold" title="Opens repository in a new tab">
                <i class="bi bi-github me-1" aria-hidden="true"></i>GitHub
                <i class="bi bi-box-arrow-up-right ms-1" aria-hidden="true" style="font-size: 0.7rem;"></i>
                <span class="visually-hidden">(opens in a new tab)</span>
            </a>
        </div>
    </div>
</nav>
