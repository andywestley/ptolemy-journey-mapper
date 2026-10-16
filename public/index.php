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

$initialTab = ($_GET['tab'] ?? '') === 'register' ? 'register' : 'login';
$serverError = !empty($_GET['error']) ? htmlspecialchars($_GET['error'], ENT_QUOTES, 'UTF-8') : '';

$pageTitle = ($initialTab === 'register') ? "Register | Ptolemy - the OpenJourney editor" : "Login | Ptolemy - the OpenJourney editor";
$pageDescription = "Login or register to access the Ptolemy Editor.";
$extraCss = ["auth.css"];
include __DIR__ . '/includes/header.php';
?>

<?php
$activePublicNav = 'home';
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
                <!-- Tabs -->
                <ul class="nav nav-pills mb-4 justify-content-center" id="authTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link <?= ($initialTab === 'login') ? 'active' : '' ?>" id="login-tab" data-bs-toggle="pill" data-bs-target="#login-pane" type="button" role="tab">Login</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link <?= ($initialTab === 'register') ? 'active' : '' ?>" id="register-tab" data-bs-toggle="pill" data-bs-target="#register-pane" type="button" role="tab">Register</button>
                    </li>
                </ul>

                <div class="tab-content">
                    <!-- Login Pane -->
                    <div class="tab-pane fade <?= ($initialTab === 'login') ? 'show active' : '' ?>" id="login-pane" role="tabpanel">
                        <form id="login-form" action="/api/auth.php?action=login" method="POST">
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
                            <button type="submit" class="btn btn-primary" id="login-btn">
                                <span class="btn-text">Sign In</span>
                                <div class="spinner-border loading-spinner" role="status"></div>
                            </button>
                        </form>
                    </div>

                    <!-- Registration Pane -->
                    <div class="tab-pane fade <?= ($initialTab === 'register') ? 'show active' : '' ?>" id="register-pane" role="tabpanel">
                        <form id="register-form" action="/api/auth.php?action=register" method="POST">
                            <div class="mb-3">
                                <label for="reg-name" class="form-label">Full Name</label>
                                <input type="text" class="form-control" id="reg-name" name="name" required placeholder="Alex Smith" autocomplete="name">
                            </div>
                            <div class="mb-3">
                                <label for="reg-email" class="form-label">Email address</label>
                                <input type="email" class="form-control" id="reg-email" name="email" required placeholder="name@example.com" autocomplete="email">
                            </div>
                            <div class="mb-3">
                                <label for="reg-password" class="form-label">Password</label>
                                <div class="input-group">
                                    <input type="password" class="form-control" id="reg-password" name="password" required minlength="8" placeholder="Minimum 8 characters" autocomplete="new-password">
                                    <button class="btn btn-outline-secondary toggle-password-btn" type="button" aria-label="Show password" data-target="reg-password">
                                        <i class="bi bi-eye"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="reg-password-confirm" class="form-label">Confirm Password</label>
                                <div class="input-group">
                                    <input type="password" class="form-control" id="reg-password-confirm" name="password_confirm" required placeholder="••••••••" autocomplete="new-password">
                                    <button class="btn btn-outline-secondary toggle-password-btn" type="button" aria-label="Show password" data-target="reg-password-confirm">
                                        <i class="bi bi-eye"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="reg-invite" class="form-label">Invite Code (Required for Beta)</label>
                                <input type="text" class="form-control" id="reg-invite" name="invite" required placeholder="Paste your invite code here">
                                <div class="form-text">
                                    Please <a href="https://github.com/andywestley/ptolemy-journey-mapper/issues" target="_blank" rel="noopener noreferrer" title="Opens in a new tab">request an invite code via GitHub issues <i class="bi bi-box-arrow-up-right ms-1" aria-hidden="true" style="font-size: 0.75rem;"></i><span class="visually-hidden">(opens in a new tab)</span></a> to join the beta.
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary" id="register-btn">
                                <span class="btn-text">Create Account</span>
                                <div class="spinner-border loading-spinner" role="status"></div>
                            </button>
                        </form>
                    </div>
                </div>

                <!-- Error Feedback -->
                <div id="error-alert" class="alert alert-danger alert-dismissible fade show" role="alert" style="<?= !empty($serverError) ? 'display: block;' : 'display: none;' ?>">
                    <span id="error-message"><?= $serverError ?></span>
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            </div>
        </div>

        <!-- Hobby Project Note -->
        <aside class="hobby-note" aria-label="About this hobby project">
            <p class="mb-2"><strong>👋 Hi there!</strong></p>
            <p class="mb-3">Just a quick note: this is a personal hobby project built by a UX professional, not corporate enterprise software.</p>
            <p class="mb-0"><a href="/about/">Read the story behind it &rarr;</a></p>
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
