<?php
/**
 * Standalone Admin User Management Page for Ptolemy
 */

require_once __DIR__ . '/../config/db_connect.php';
initSecureSession();

// 1. Authentication Check
if (!isset($_SESSION['user_id'])) {
    header('Location: index.php');
    exit;
}

$db = getDBConnection();
$stmt = $db->prepare("SELECT id, name, email, is_admin FROM users WHERE id = ?");
$stmt->execute([$_SESSION['user_id']]);
$adminUser = $stmt->fetch();

// 2. Administrator Access Guard
if (!$adminUser || empty($adminUser['is_admin'])) {
    header('Location: dashboard.php');
    exit;
}

$pageTitle = "User Management | Ptolemy Admin";
$pageDescription = "Administrator panel for managing user accounts and audit service accounts.";
include __DIR__ . '/includes/header.php';
?>

<style>
    :root {
        --primary-bg: #f8f9fa;
        --accent-color: #6366f1;
    }

    body {
        font-family: 'Outfit', sans-serif;
        background-color: var(--primary-bg);
        min-height: 100vh;
    }

    .navbar-admin {
        background: #ffffff;
        border-bottom: 1px solid #e2e8f0;
    }

    .avatar-circle {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
    }

    .avatar-user {
        background-color: #e0e7ff;
        color: #4338ca;
    }

    .avatar-bot {
        background-color: #cffafe;
        color: #0e7490;
    }

    .stat-card {
        background: white;
        border-radius: 0.75rem;
        border: 1px solid #e2e8f0;
        padding: 1.25rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .stat-number {
        font-size: 1.75rem;
        font-weight: 700;
        color: #1e293b;
    }

    .filter-pill {
        border-radius: 2rem;
        font-size: 0.85rem;
        font-weight: 500;
        padding: 0.35rem 1rem;
    }

    .filter-pill.active {
        background-color: var(--accent-color);
        color: white;
        border-color: var(--accent-color);
    }

    [data-bs-theme="dark"] body {
        background-color: #0f172a;
        color: #f8fafc;
    }

    [data-bs-theme="dark"] .navbar-admin,
    [data-bs-theme="dark"] .stat-card,
    [data-bs-theme="dark"] .table-card {
        background-color: #1e293b;
        border-color: #334155;
        color: #f8fafc;
    }

    [data-bs-theme="dark"] .stat-number {
        color: #f8fafc;
    }

    [data-bs-theme="dark"] .table {
        color: #f8fafc;
    }
</style>

<!-- Top Admin Navigation -->
<nav class="navbar navbar-expand-lg navbar-admin sticky-top">
    <div class="container">
        <a class="navbar-brand d-flex align-items-center" href="/dashboard/">
            <i class="bi bi-map-fill me-2 text-primary"></i>
            <span class="fw-bold">Ptolemy</span>
            <span class="badge bg-primary ms-2 fs-7">Admin</span>
        </a>

        <div class="ms-auto d-flex align-items-center">
            <a href="/api/diagnostics.php" class="btn btn-outline-info btn-sm me-2">
                <i class="bi bi-activity me-1"></i>Diagnostics & Logs
            </a>
            <a href="/dashboard/" class="btn btn-outline-secondary btn-sm me-3">
                <i class="bi bi-arrow-left me-1"></i>Back to App
            </a>
            <span class="me-3 text-muted small d-none d-md-inline">
                <i class="bi bi-person-circle me-1"></i><?php echo htmlspecialchars($adminUser['email'] ?? $adminUser['name'], ENT_QUOTES, 'UTF-8'); ?>
            </span>
            <button class="btn btn-outline-danger btn-sm" onclick="logout()">
                <i class="bi bi-box-arrow-right me-1"></i>Logout
            </button>
        </div>
    </div>
</nav>

<div class="container my-5">

    <!-- Header Section -->
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
            <h2 class="fw-bold mb-1">User & Access Management</h2>
            <p class="text-muted mb-0">Manage human users, assign administrator privileges, and create automated service accounts for audit tools.</p>
        </div>
        <div>
            <button class="btn btn-primary px-3 shadow-sm" data-bs-toggle="modal" data-bs-target="#createUserModal">
                <i class="bi bi-plus-lg me-1"></i>New Account
            </button>
        </div>
    </div>

    <!-- Stats Row -->
    <div class="row g-3 mb-4">
        <div class="col-sm-4">
            <div class="stat-card">
                <div class="text-muted small text-uppercase fw-semibold mb-1">Total Accounts</div>
                <div class="stat-number" id="stat-total">0</div>
            </div>
        </div>
        <div class="col-sm-4">
            <div class="stat-card">
                <div class="text-muted small text-uppercase fw-semibold mb-1">Administrators</div>
                <div class="stat-number text-primary" id="stat-admins">0</div>
            </div>
        </div>
        <div class="col-sm-4">
            <div class="stat-card">
                <div class="text-muted small text-uppercase fw-semibold mb-1">Service Accounts</div>
                <div class="stat-number text-info" id="stat-services">0</div>
            </div>
        </div>
    </div>

    <!-- Filters & Search Toolbar -->
    <div class="stat-card mb-4 p-3">
        <div class="row g-3 align-items-center">
            <div class="col-md-6 col-lg-5">
                <div class="input-group">
                    <span class="input-group-text bg-transparent border-end-0"><i class="bi bi-search text-muted"></i></span>
                    <input type="text" id="user-search" class="form-control border-start-0" placeholder="Search by name, email, or username...">
                </div>
            </div>
            <div class="col-md-6 col-lg-7">
                <div class="d-flex gap-2 flex-wrap justify-content-md-end">
                    <button class="btn btn-outline-secondary filter-pill active" onclick="setFilter('all', this)">All</button>
                    <button class="btn btn-outline-secondary filter-pill" onclick="setFilter('standard', this)">Human Users</button>
                    <button class="btn btn-outline-secondary filter-pill" onclick="setFilter('service', this)">Service Accounts</button>
                    <button class="btn btn-outline-secondary filter-pill" onclick="setFilter('admin', this)">Admins</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Users Table Card -->
    <div class="stat-card p-0 overflow-hidden shadow-sm">
        <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                    <tr>
                        <th class="ps-4">User / Account</th>
                        <th>Login Identifier</th>
                        <th>Role</th>
                        <th>Journeys</th>
                        <th>Created</th>
                        <th class="text-end pe-4">Actions</th>
                    </tr>
                </thead>
                <tbody id="users-table-body">
                    <tr>
                        <td colspan="6" class="text-center py-4">
                            <div class="spinner-border text-primary spinner-border-sm me-2"></div>Loading users...
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- Modal 1: Create User / Service Account -->
<div class="modal fade" id="createUserModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title fw-bold">Create New Account</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form id="create-user-form" onsubmit="handleCreateUser(event)">
                <div class="modal-body">
                    <!-- Account Type Selector -->
                    <div class="mb-4">
                        <label class="form-label small text-muted text-uppercase fw-bold">Account Type</label>
                        <div class="d-flex gap-3">
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="account_type" id="type-user" value="user" checked>
                                <label class="form-check-label fw-semibold" for="type-user">
                                    <i class="bi bi-person me-1"></i>Standard User
                                </label>
                                <div class="form-text small">Human team member (requires email).</div>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="account_type" id="type-service" value="service">
                                <label class="form-check-label fw-semibold" for="type-service">
                                    <i class="bi bi-robot me-1"></i>Service Account
                                </label>
                                <div class="form-text small">Bot/Tool login (no email needed).</div>
                            </div>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label for="create-name" class="form-label">Display Name <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="create-name" required placeholder="e.g. Jane Doe">
                    </div>

                    <div class="mb-3" id="create-username-group" style="display: none;">
                        <label for="create-username" class="form-label">Username Identifier <span class="text-danger">*</span></label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="bi bi-at"></i></span>
                            <input type="text" class="form-control" id="create-username" placeholder="e.g. site-audit">
                        </div>
                        <div class="form-text">Your audit software will log in using this username.</div>
                    </div>

                    <div class="mb-3" id="create-email-group">
                        <label for="create-email" class="form-label">Email Address <span class="text-danger">*</span></label>
                        <input type="email" class="form-control" id="create-email" placeholder="name@example.com">
                    </div>

                    <div class="mb-3">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <label for="create-password" class="form-label mb-0">Password <span class="text-danger">*</span></label>
                            <button type="button" class="btn btn-link btn-sm py-0 text-decoration-none" onclick="generateRandomPassword('create-password')">
                                <i class="bi bi-dice-5 me-1"></i>Generate Strong Password
                            </button>
                        </div>
                        <input type="password" class="form-control" id="create-password" required minlength="8" placeholder="Minimum 8 characters">
                    </div>

                    <div class="form-check mt-3">
                        <input class="form-check-input" type="checkbox" id="create-is-admin">
                        <label class="form-check-label" for="create-is-admin">
                            Grant Administrator Privileges
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="create-submit-btn">Create Account</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Modal 2: Edit User Profile & Role -->
<div class="modal fade" id="editUserModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title fw-bold">Edit Account</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form id="edit-user-form" onsubmit="handleEditUser(event)">
                <input type="hidden" id="edit-id">
                <div class="modal-body">
                    <div class="mb-3">
                        <label for="edit-name" class="form-label">Display Name <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="edit-name" required>
                    </div>

                    <div class="mb-3">
                        <label for="edit-username" class="form-label">Username</label>
                        <input type="text" class="form-control" id="edit-username" placeholder="Optional for humans, required for service accounts">
                    </div>

                    <div class="mb-3">
                        <label for="edit-email" class="form-label">Email Address</label>
                        <input type="email" class="form-control" id="edit-email" placeholder="Optional for service accounts">
                    </div>

                    <div class="form-check mt-3">
                        <input class="form-check-input" type="checkbox" id="edit-is-admin">
                        <label class="form-check-label" for="edit-is-admin">
                            Administrator Privileges
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="edit-submit-btn">Save Changes</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Modal 3: Reset Password -->
<div class="modal fade" id="resetPasswordModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title fw-bold">Reset Password</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form id="reset-password-form" onsubmit="handleResetPassword(event)">
                <input type="hidden" id="reset-id">
                <div class="modal-body">
                    <p class="text-muted">Setting a new password for <strong id="reset-user-name">User</strong>.</p>
                    
                    <div class="mb-3">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <label for="reset-password" class="form-label mb-0">New Password <span class="text-danger">*</span></label>
                            <button type="button" class="btn btn-link btn-sm py-0 text-decoration-none" onclick="generateRandomPassword('reset-password')">
                                <i class="bi bi-dice-5 me-1"></i>Generate Password
                            </button>
                        </div>
                        <input type="password" class="form-control" id="reset-password" required minlength="8" placeholder="Minimum 8 characters">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="reset-submit-btn">Update Password</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Modal 4: Account Credentials Display -->
<div class="modal fade" id="credentialsModal" tabindex="-1" data-bs-backdrop="static">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title fw-bold" id="credentials-modal-title">Account Credentials</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="alert alert-success d-flex align-items-center mb-3">
                    <i class="bi bi-check-circle-fill fs-4 me-2"></i>
                    <div>
                        <span id="credentials-modal-status">Account successfully created!</span>
                        <div class="small text-muted">Please copy these credentials now.</div>
                    </div>
                </div>

                <div class="mb-3">
                    <label class="form-label small text-muted text-uppercase fw-bold">Login Identifier</label>
                    <div class="input-group">
                        <input type="text" class="form-control font-monospace" id="cred-identifier" readonly>
                        <button class="btn btn-outline-secondary" type="button" onclick="copyCredField('cred-identifier', this)" title="Copy Identifier">
                            <i class="bi bi-clipboard"></i>
                        </button>
                    </div>
                    <div class="form-text small" id="cred-hint">You can log in using either this username or with a leading @ (e.g. <code>@username</code>).</div>
                </div>

                <div class="mb-3">
                    <label class="form-label small text-muted text-uppercase fw-bold">Password</label>
                    <div class="input-group">
                        <input type="text" class="form-control font-monospace" id="cred-password" readonly>
                        <button class="btn btn-outline-secondary" type="button" onclick="copyCredField('cred-password', this)" title="Copy Password">
                            <i class="bi bi-clipboard"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Done</button>
            </div>
        </div>
    </div>
</div>


<script>
    window.currentUserId = "<?php echo htmlspecialchars($adminUser['id'], ENT_QUOTES, 'UTF-8'); ?>";
</script>

<?php
$extraJs = ["auth.js", "utils.js", "admin.js"];
include __DIR__ . '/includes/footer.php';
?>
