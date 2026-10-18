<?php
require_once __DIR__ . '/includes/auth_guard.php';
initSecureSession();

// If already authenticated via valid server session, redirect to dashboard or intended URL
if (!empty($_SESSION['user_id'])) {
    $redirect = $_GET['redirect'] ?? '/dashboard/';
    // Prevent open redirect vulnerabilities: must start with / and not //
    if (!str_starts_with($redirect, '/') || str_starts_with($redirect, '//')) {
        $redirect = '/dashboard/';
    }
    header("Location: " . $redirect);
    exit;
}

$serverError = !empty($_GET['error']) ? htmlspecialchars($_GET['error'], ENT_QUOTES, 'UTF-8') : '';
$redirectParam = $_GET['redirect'] ?? '';
$safeRedirect = '';
if (!empty($redirectParam) && str_starts_with($redirectParam, '/') && !str_starts_with($redirectParam, '//')) {
    $safeRedirect = $redirectParam;
}

$pageTitle = "Login | Ptolemy - the OpenJourney editor";
$pageDescription = "Sign in to access your Ptolemy journeys and the OpenJourney editor.";
$extraCss = ["auth.css"];
include __DIR__ . '/includes/header.php';
?>

<?php
$activePublicNav = 'login';
include __DIR__ . '/includes/public_navbar.php';
?>

<main id="main-content" class="w-100 flex-grow-1 d-flex flex-column align-items-center justify-content-center p-4">
    <div class="d-flex flex-column flex-lg-row align-items-center align-items-lg-end justify-content-center gap-5 w-100" style="max-width: 900px;">
        <div class="auth-card">
            <header class="auth-header">
                <h1 id="app-title">Ptolemy</h1>
                <p class="mb-0 text-white" style="font-weight: 500;">the OpenJourney editor</p>
            </header>

            <div class="auth-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h2 class="h5 fw-bold mb-0 text-dark">Sign In</h2>
                    <span class="text-muted small">New to Ptolemy? <a href="/?tab=register">Register</a></span>
                </div>

                <form id="login-form" action="/api/auth.php?action=login<?= !empty($safeRedirect) ? '&redirect=' . urlencode($safeRedirect) : '' ?>" method="POST">
                    <?php if (!empty($safeRedirect)): ?>
                        <input type="hidden" name="redirect" value="<?= htmlspecialchars($safeRedirect, ENT_QUOTES, 'UTF-8') ?>">
                    <?php endif; ?>

                    <div class="mb-3">
                        <label for="login-email" class="form-label">Email or Username</label>
                        <input type="text" class="form-control" id="login-email" name="identifier" required placeholder="name@example.com or username" autocomplete="username">
                    </div>

                    <div class="mb-3">
                        <label for="login-password" class="form-label">Password</label>
                        <div class="input-group">
                            <input type="password" class="form-control" id="login-password" name="password" required placeholder="••••••••" autocomplete="current-password">
                            <button class="btn btn-outline-secondary toggle-password-btn" type="button" aria-label="Show password" data-target="login-password">
                                <i class="bi bi-eye"></i>
                            </button>
                        </div>
                    </div>

                    <button type="submit" class="btn btn-primary w-100" id="login-btn">
                        <span class="btn-text">Sign In</span>
                        <div class="spinner-border loading-spinner" role="status"></div>
                    </button>
                </form>

                <!-- Error Feedback -->
                <div id="error-alert" class="alert alert-danger alert-dismissible fade show mt-3" role="alert" style="<?= !empty($serverError) ? 'display: block;' : 'display: none;' ?>">
                    <span id="error-message"><?= $serverError ?></span>
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            </div>
        </div>

        <!-- Hobby Project Note -->
        <aside class="hobby-note" aria-label="About this hobby project">
            <p class="mb-2"><strong>👋 Welcome back!</strong></p>
            <p class="mb-3">Log in to view, create, and collaborate on your OpenJourney maps.</p>
            <p class="mb-0"><a href="/about/">Read the story behind Ptolemy &rarr;</a></p>
        </aside>
    </div>

    <!-- Ad/Tease for open standard -->
    <section class="open-standard-teaser text-center mt-5" style="max-width: 600px;" aria-labelledby="teaser-heading">
        <h2 id="teaser-heading" class="h5 mb-3" style="font-weight: 600; color: var(--accent-color);">Powered by the OpenJourney Format (.ojf)</h2>
        <p class="text-muted mb-3">
            Ptolemy uses the open, human-readable <code>.ojf</code> JSON format to store and share customer journeys without proprietary lock-in.
        </p>
        <div class="text-start p-3 rounded-3 mb-4 shadow-sm" style="background-color: #1e293b; color: #e2e8f0; font-size: 0.85rem;">
            <pre class="mb-0 text-light" tabindex="0" role="region" aria-label="OpenJourney Format JSON preview" style="overflow: auto; max-height: 200px; color: inherit;"><code>{
  "metadata": {
    "title": "Example Journey",
    "version": "1.0"
  },
  "phases": [ { "id": "p1", "name": "Discovery" } ],
  "nodes": [ { "id": "n1", "phase": "p1", "text": "Customer searches online" } ]
}</code></pre>
        </div>
        <a href="/about/" class="btn btn-outline-secondary px-4 py-2" style="border-radius: 0.5rem; font-weight: 500;">Learn about our Open Standard</a>
    </section>
</main>

<footer class="w-100 py-4 mt-auto border-top text-muted small bg-white">
    <div class="container d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3" style="max-width: 1000px;">
        <nav aria-label="Footer Navigation" class="d-flex flex-wrap gap-2">
            <a href="/" class="text-decoration-none py-2 px-2 d-inline-flex align-items-center">Home</a>
            <a href="/login" class="text-decoration-none py-2 px-2 d-inline-flex align-items-center active fw-bold text-decoration-underline" aria-current="page">Sign In</a>
            <a href="/about/" class="text-decoration-none py-2 px-2 d-inline-flex align-items-center" rel="help">Help &amp; Guides</a>
            <a href="/templates/" class="text-decoration-none py-2 px-2 d-inline-flex align-items-center">Templates</a>
            <a href="https://github.com/andywestley/ptolemy-journey-mapper/issues" target="_blank" rel="noopener noreferrer help" class="text-decoration-none py-2 px-2 d-inline-flex align-items-center" title="Get human support or report an issue on GitHub">Help &amp; Support <i class="bi bi-box-arrow-up-right ms-1" aria-hidden="true" style="font-size: 0.7rem;"></i><span class="visually-hidden">(opens in a new tab)</span></a>
            <a href="https://github.com/andywestley/ptolemy-journey-mapper" target="_blank" rel="noopener noreferrer" class="text-decoration-none py-2 px-2 d-inline-flex align-items-center" title="Opens in a new tab">GitHub <i class="bi bi-box-arrow-up-right ms-1" aria-hidden="true" style="font-size: 0.7rem;"></i><span class="visually-hidden">(opens in a new tab)</span></a>
        </nav>
        <span>&copy; <?= date('Y') ?> Ptolemy</span>
    </div>
</footer>

<?php
$extraJs = ['auth.js'];
include __DIR__ . '/includes/footer.php';
?>
