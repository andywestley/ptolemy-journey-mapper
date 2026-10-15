<?php
/**
 * Shared Public Navigation Bar for Ptolemy (for unauthenticated / public pages)
 *
 * Expected variables:
 * - $activePublicNav (string, optional): 'home', 'about', 'templates'
 */
$activePublicNav = $activePublicNav ?? '';
?>
<nav class="navbar navbar-expand-lg bg-white border-bottom shadow-sm" aria-label="Public Navigation">
    <div class="container" style="max-width: 1000px;">
        <a class="navbar-brand d-flex align-items-center" href="/">
            <i class="bi bi-map-fill text-primary me-2 fs-5" aria-hidden="true"></i>
            <span class="fw-bold">Ptolemy</span>
            <small class="text-muted fw-normal ms-2 d-none d-sm-inline" style="font-size: 0.8rem;">the OpenJourney editor</small>
        </a>
        <div class="d-flex align-items-center gap-2 ms-auto">
            <?php if ($activePublicNav !== 'home'): ?>
                <a href="/" class="btn btn-outline-primary btn-sm fw-semibold">Sign In</a>
            <?php endif; ?>
            <?php if ($activePublicNav !== 'about'): ?>
                <a href="/about/" class="btn btn-outline-secondary btn-sm fw-semibold">About</a>
            <?php endif; ?>
            <a href="/templates/" class="btn btn-outline-secondary btn-sm fw-semibold">Templates</a>
            <a href="https://github.com/andywestley/ptolemy-journey-mapper" target="_blank" rel="noopener noreferrer" class="btn btn-outline-dark btn-sm fw-semibold" title="Opens repository in a new tab">
                <i class="bi bi-github me-1" aria-hidden="true"></i>GitHub
                <i class="bi bi-box-arrow-up-right ms-1" aria-hidden="true" style="font-size: 0.7rem;"></i>
                <span class="visually-hidden">(opens in a new tab)</span>
            </a>
        </div>
    </div>
</nav>
