<?php
$pageTitle = "Login | Ptolemy - the OpenJourney editor";
$pageDescription = "Login or register to access the Ptolemy Editor.";
include __DIR__ . '/includes/header.php';
?>

<style>
    :root {
        --primary-bg: #f8f9fa;
        --accent-color: #6366f1;
        --card-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }

    body {
        font-family: 'Outfit', sans-serif;
        background-color: var(--primary-bg);
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        padding: 2rem;
        margin: 0;
    }

    .auth-card {
        max-width: 400px;
        width: 100%;
        border: none;
        border-radius: 1rem;
        box-shadow: var(--card-shadow);
        overflow: hidden;
        background: white;
        transition: transform 0.2s ease;
    }

    .auth-header {
        background: var(--accent-color);
        color: white;
        padding: 2rem;
        text-align: center;
    }

    .auth-header h1 {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
    }

    .auth-body {
        padding: 2rem;
    }

    .nav-pills .nav-link {
        color: #6c757d;
        border-radius: 0.5rem;
        font-weight: 500;
    }

    .nav-pills .nav-link.active {
        background-color: var(--accent-color);
        color: white;
    }

    .btn-primary {
        background-color: var(--accent-color);
        border-color: var(--accent-color);
        padding: 0.75rem;
        font-weight: 600;
        border-radius: 0.5rem;
        width: 100%;
        transition: all 0.3s ease;
    }

    .btn-primary:hover {
        background-color: #4f46e5;
        border-color: #4f46e5;
        transform: translateY(-1px);
    }

    .form-control {
        padding: 0.75rem;
        border-radius: 0.5rem;
        border: 1px solid #dee2e6;
    }

    .form-control:focus {
        border-color: var(--accent-color);
        box-shadow: 0 0 0 0.25rem rgba(99, 102, 241, 0.25);
    }

    #error-alert {
        display: none;
        margin-top: 1rem;
    }

    .loading-spinner {
        display: none;
        width: 1.5rem;
        height: 1.5rem;
        vertical-align: middle;
    }

    [data-bs-theme="dark"] body {
        background-color: #0f172a;
    }

    [data-bs-theme="dark"] .auth-card {
        background-color: #1e293b;
        color: #f8fafc;
    }

    [data-bs-theme="dark"] .form-control {
        background-color: #334155;
        border-color: #475569;
        color: white;
    }

    /* Post-it Note Styles */
    .hobby-note {
        background-color: #fef08a;
        color: #422006;
        padding: 1.25rem 1.5rem;
        box-shadow: 3px 5px 15px rgba(0, 0, 0, 0.1), inset 0 0 20px rgba(200, 150, 0, 0.1);
        transform: rotate(-3deg);
        max-width: 320px;
        border-bottom-right-radius: 10px 30px;
        font-size: 0.95rem;
        line-height: 1.5;
        position: relative;
    }

    .hobby-note::before {
        content: '';
        position: absolute;
        top: -10px;
        left: 50%;
        width: 80px;
        height: 25px;
        background-color: rgba(255, 255, 255, 0.4);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        transform: translateX(-50%) rotate(2deg);
    }

    .hobby-note a {
        color: #854d0e;
        font-weight: 600;
        text-decoration: underline;
    }

    .hobby-note a:hover {
        color: #422006;
    }

    [data-bs-theme="dark"] .hobby-note {
        background-color: #ca8a04;
        color: #fefce8;
    }

    [data-bs-theme="dark"] .hobby-note::before {
        background-color: rgba(255, 255, 255, 0.2);
    }

    [data-bs-theme="dark"] .hobby-note a {
        color: #fef08a;
    }

    [data-bs-theme="dark"] .hobby-note a:hover {
        color: #fff;
    }
</style>

<div class="d-flex flex-column flex-lg-row align-items-center justify-content-center gap-5 w-100" style="max-width: 900px;">
    <div class="auth-card">
        <div class="auth-header">
            <h1 id="app-title">Ptolemy</h1>
            <p class="mb-0 opacity-75">the OpenJourney editor</p>
        </div>

        <div class="auth-body">
            <!-- Tabs -->
            <ul class="nav nav-pills mb-4 justify-content-center" id="authTabs" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="login-tab" data-bs-toggle="pill" data-bs-target="#login-pane" type="button" role="tab">Login</button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="register-tab" data-bs-toggle="pill" data-bs-target="#register-pane" type="button" role="tab">Register</button>
                </li>
            </ul>

            <div class="tab-content">
                <!-- Login Pane -->
                <div class="tab-pane fade show active" id="login-pane" role="tabpanel">
                    <form id="login-form">
                        <div class="mb-3">
                            <label for="login-email" class="form-label">Email address</label>
                            <input type="email" class="form-control" id="login-email" required placeholder="name@example.com">
                        </div>
                        <div class="mb-3">
                            <label for="login-password" class="form-label">Password</label>
                            <input type="password" class="form-control" id="login-password" required placeholder="••••••••">
                        </div>
                        <button type="submit" class="btn btn-primary" id="login-btn">
                            <span class="btn-text">Sign In</span>
                            <div class="spinner-border loading-spinner" role="status"></div>
                        </button>
                    </form>
                </div>

                <!-- Registration Pane -->
                <div class="tab-pane fade" id="register-pane" role="tabpanel">
                    <form id="register-form">
                        <div class="mb-3">
                            <label for="reg-name" class="form-label">Full Name</label>
                            <input type="text" class="form-control" id="reg-name" required placeholder="Alex Smith">
                        </div>
                        <div class="mb-3">
                            <label for="reg-email" class="form-label">Email address</label>
                            <input type="email" class="form-control" id="reg-email" required placeholder="name@example.com">
                        </div>
                        <div class="mb-3">
                            <label for="reg-password" class="form-label">Password</label>
                            <input type="password" class="form-control" id="reg-password" required minlength="8" placeholder="Minimum 8 characters">
                        </div>
                        <div class="mb-3">
                            <label for="reg-password-confirm" class="form-label">Confirm Password</label>
                            <input type="password" class="form-control" id="reg-password-confirm" required placeholder="••••••••">
                        </div>
                        <div class="mb-3">
                            <label for="reg-invite" class="form-label">Invite Code (Required for Beta)</label>
                            <input type="text" class="form-control" id="reg-invite" required placeholder="Paste your invite code here">
                            <div class="form-text">
                                Please <a href="https://github.com/andywestley/ptolemy-journey-mapper/issues" target="_blank">request an invite code via GitHub issues</a> to join the beta.
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
            <div id="error-alert" class="alert alert-danger alert-dismissible fade show" role="alert">
                <span id="error-message"></span>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        </div>
    </div>

    <!-- Hobby Project Note -->
    <div class="hobby-note">
        <p class="mb-2"><strong>👋 Hi there!</strong></p>
        <p class="mb-3">Just a quick note: this is a personal hobby project built by a UX professional, not corporate enterprise software.</p>
        <p class="mb-0"><a href="about.php">Read the story behind it &rarr;</a></p>
    </div>
</div>

<!-- Ad/Tease for open standard -->
<div class="open-standard-teaser text-center mt-5" style="max-width: 600px;">
    <h2 class="h5 mb-3" style="font-weight: 600; color: var(--accent-color);">Powered by the OpenJourney Format (.ojf)</h2>
    <p class="text-muted mb-3">
        Ptolemy uses the open, human-readable <code>.ojf</code> JSON format to store and share customer journeys without proprietary lock-in.
    </p>
    <div class="text-start p-3 rounded-3 mb-4 shadow-sm" style="background-color: #1e293b; color: #e2e8f0; font-size: 0.85rem; overflow-x: auto; max-height: 200px;">
        <pre class="mb-0"><code>{
  "metadata": {
    "title": "Example Journey",
    "version": "1.0"
  },
  "phases": [ { "id": "p1", "name": "Discovery" } ],
  "nodes": [ { "id": "n1", "phase": "p1", "text": "Customer searches online" } ]
}</code></pre>
    </div>
    <a href="about.php" class="btn btn-outline-secondary px-4 py-2" style="border-radius: 0.5rem; font-weight: 500;">Learn about our Open Standard</a>
</div>

<?php
$extraJs = ['auth.js'];
include __DIR__ . '/includes/footer.php';
?>
