/**
 * Admin User Management Controller for Ptolemy
 */

let allUsers = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    initPasswordToggles();

    // Search filter listener
    const searchInput = document.getElementById('user-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderUsersTable(filterUsers(e.target.value, currentFilter));
        });
    }

    // Account type switcher in create modal
    const typeRadios = document.querySelectorAll('input[name="account_type"]');
    typeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            toggleAccountTypeFields(e.target.value);
        });
    });
});

/**
 * Switch fields depending on user vs service account
 */
function toggleAccountTypeFields(type) {
    const emailGroup = document.getElementById('create-email-group');
    const usernameGroup = document.getElementById('create-username-group');
    const emailInput = document.getElementById('create-email');
    const usernameInput = document.getElementById('create-username');

    if (type === 'service') {
        emailGroup.style.display = 'none';
        emailInput.required = false;
        usernameGroup.style.display = 'block';
        usernameInput.required = true;
        document.getElementById('create-name').placeholder = 'e.g. Site Audit Scanner';
        document.getElementById('create-username').placeholder = 'e.g. site-audit';
    } else {
        emailGroup.style.display = 'block';
        emailInput.required = true;
        usernameGroup.style.display = 'none';
        usernameInput.required = false;
        document.getElementById('create-name').placeholder = 'e.g. Jane Doe';
    }
}

/**
 * Fetch and display all users
 */
async function loadUsers() {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><div class="spinner-border text-primary spinner-border-sm me-2"></div>Loading users...</td></tr>';

    try {
        const response = await fetch('/api/users.php');
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to load users');
        }

        allUsers = await response.json();
        renderUsersTable(filterUsers(document.getElementById('user-search')?.value || '', currentFilter));
        updateStats();
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger"><i class="bi bi-exclamation-triangle me-1"></i>${escapeHtml(err.message)}</td></tr>`;
    }
}

/**
 * Filter users based on query and filter pill
 */
function filterUsers(query, filter) {
    const q = query.toLowerCase().trim();
    return allUsers.filter(u => {
        const matchesQuery = !q ||
            (u.name && u.name.toLowerCase().includes(q)) ||
            (u.email && u.email.toLowerCase().includes(q)) ||
            (u.username && u.username.toLowerCase().includes(q));

        if (!matchesQuery) return false;

        if (filter === 'admin') return u.is_admin;
        if (filter === 'service') return u.is_service_account;
        if (filter === 'standard') return !u.is_service_account;
        return true;
    });
}

/**
 * Set active filter pill
 */
function setFilter(filter, el) {
    currentFilter = filter;
    document.querySelectorAll('.filter-pill').forEach(btn => btn.classList.remove('active'));
    if (el) el.classList.add('active');
    const query = document.getElementById('user-search')?.value || '';
    renderUsersTable(filterUsers(query, currentFilter));
}

/**
 * Update stats cards
 */
function updateStats() {
    const totalEl = document.getElementById('stat-total');
    const adminsEl = document.getElementById('stat-admins');
    const servicesEl = document.getElementById('stat-services');

    if (totalEl) totalEl.textContent = allUsers.length;
    if (adminsEl) adminsEl.textContent = allUsers.filter(u => u.is_admin).length;
    if (servicesEl) servicesEl.textContent = allUsers.filter(u => u.is_service_account).length;
}

/**
 * Render user rows into table
 */
function renderUsersTable(users) {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '';

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No accounts match the current filters.</td></tr>';
        return;
    }

    const currentLoggedInId = window.currentUserId || '';

    users.forEach(u => {
        const tr = document.createElement('tr');

        // Badges
        let typeBadge = '';
        if (u.is_service_account) {
            typeBadge = '<span class="badge bg-info-subtle text-info border border-info-subtle rounded-pill"><i class="bi bi-robot me-1"></i>Service Account</span>';
        } else {
            typeBadge = '<span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle rounded-pill"><i class="bi bi-person me-1"></i>User</span>';
        }

        let roleBadge = '';
        if (u.is_admin) {
            roleBadge = '<span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill"><i class="bi bi-shield-check me-1"></i>Admin</span>';
        } else {
            roleBadge = '<span class="badge bg-light text-muted border rounded-pill">Member</span>';
        }

        // Login Identifier
        const loginIdentifier = u.is_service_account
            ? `<code>${escapeHtml(u.username || 'no-username')}</code>`
            : `<span class="text-body">${escapeHtml(u.email || u.username || '—')}</span>`;

        const isSelf = (u.id === currentLoggedInId);

        tr.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <div class="avatar-circle me-3 ${u.is_service_account ? 'avatar-bot' : 'avatar-user'}">
                        <i class="bi ${u.is_service_account ? 'bi-cpu' : 'bi-person'}"></i>
                    </div>
                    <div>
                        <div class="fw-bold">${escapeHtml(u.name)} ${isSelf ? '<span class="badge bg-light text-primary border ms-1">You</span>' : ''}</div>
                        <small class="text-muted">${typeBadge}</small>
                    </div>
                </div>
            </td>
            <td>
                ${loginIdentifier}
            </td>
            <td>
                ${roleBadge}
            </td>
            <td>
                <span class="badge bg-light text-dark border">${u.journey_count || 0} journeys</span>
            </td>
            <td>
                <small class="text-muted">${new Date(u.created_at).toLocaleDateString()}</small>
            </td>
            <td class="text-end">
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-secondary" onclick="openEditModal('${escapeHtml(u.id)}')" title="Edit User">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-secondary" onclick="openResetPasswordModal('${escapeHtml(u.id)}', '${escapeHtml(u.name)}')" title="Reset Password">
                        <i class="bi bi-key"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteUser('${escapeHtml(u.id)}', '${escapeHtml(u.name)}')" ${isSelf ? 'disabled title="You cannot delete yourself"' : 'title="Delete User"'}>
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Generate a cryptographically strong random password
 */
function generateRandomPassword(targetInputId) {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%^&*';
    let pwd = '';
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    for (let i = 0; i < 16; i++) {
        pwd += chars[array[i] % chars.length];
    }
    const input = document.getElementById(targetInputId);
    if (input) {
        input.value = pwd;
        input.type = 'text'; // Show so admin can copy it
        const toggleBtn = document.querySelector(`.toggle-password-btn[data-target="${targetInputId}"]`);
        if (toggleBtn) {
            toggleBtn.setAttribute('aria-label', 'Hide password');
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.classList.remove('bi-eye');
                icon.classList.add('bi-eye-slash');
            }
        }
    }
}

/**
 * Submit Create Account Form
 */
async function handleCreateUser(e) {
    e.preventDefault();
    const btn = document.getElementById('create-submit-btn');
    btn.disabled = true;

    const accountType = document.querySelector('input[name="account_type"]:checked').value;
    const name = document.getElementById('create-name').value.trim();
    const username = document.getElementById('create-username').value.trim();
    const email = document.getElementById('create-email').value.trim();
    const password = document.getElementById('create-password').value;
    const isAdmin = document.getElementById('create-is-admin').checked;

    const payload = {
        account_type: accountType,
        name,
        username,
        email,
        password,
        is_admin: isAdmin
    };

    try {
        const res = await fetch('/api/users.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create account');

        // Close modal and refresh
        const modalEl = document.getElementById('createUserModal');
        bootstrap.Modal.getInstance(modalEl).hide();
        document.getElementById('create-user-form').reset();
        toggleAccountTypeFields('user');

        const loginIdent = data.username || data.email;
        showCredentialsModal(
            'Account Created',
            `Account '${data.name}' successfully created!`,
            loginIdent,
            password,
            !!data.username
        );
        loadUsers();
    } catch (err) {
        alert('Error: ' + err.message);
    } finally {
        btn.disabled = false;
    }
}

/**
 * Open Edit Modal
 */
function openEditModal(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    document.getElementById('edit-id').value = user.id;
    document.getElementById('edit-name').value = user.name || '';
    document.getElementById('edit-username').value = user.username || '';
    document.getElementById('edit-email').value = user.email || '';
    document.getElementById('edit-is-admin').checked = user.is_admin;

    // Show/hide username field
    const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
    modal.show();
}

/**
 * Submit Edit User Form
 */
async function handleEditUser(e) {
    e.preventDefault();
    const btn = document.getElementById('edit-submit-btn');
    btn.disabled = true;

    const userId = document.getElementById('edit-id').value;
    const payload = {
        name: document.getElementById('edit-name').value.trim(),
        username: document.getElementById('edit-username').value.trim(),
        email: document.getElementById('edit-email').value.trim(),
        is_admin: document.getElementById('edit-is-admin').checked
    };

    try {
        const res = await fetch(`/api/users.php?id=${encodeURIComponent(userId)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update account');

        bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide();
        loadUsers();
    } catch (err) {
        alert('Error: ' + err.message);
    } finally {
        btn.disabled = false;
    }
}

/**
 * Open Reset Password Modal
 */
function openResetPasswordModal(userId, userName) {
    document.getElementById('reset-id').value = userId;
    document.getElementById('reset-user-name').textContent = userName;
    document.getElementById('reset-password').value = '';
    const modal = new bootstrap.Modal(document.getElementById('resetPasswordModal'));
    modal.show();
}

/**
 * Submit Reset Password Form
 */
async function handleResetPassword(e) {
    e.preventDefault();
    const btn = document.getElementById('reset-submit-btn');
    btn.disabled = true;

    const userId = document.getElementById('reset-id').value;
    const password = document.getElementById('reset-password').value;

    try {
        const res = await fetch(`/api/users.php?id=${encodeURIComponent(userId)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to reset password');

        bootstrap.Modal.getInstance(document.getElementById('resetPasswordModal')).hide();
        const userName = document.getElementById('reset-user-name').textContent;
        const targetUser = allUsers.find(u => u.id === userId);
        const loginIdent = targetUser ? (targetUser.username || targetUser.email) : userName;
        
        showCredentialsModal(
            'Password Reset',
            `Password successfully updated for '${userName}'!`,
            loginIdent,
            password,
            targetUser ? !!targetUser.username : true
        );
    } catch (err) {
        alert('Error: ' + err.message);
    } finally {
        btn.disabled = false;
    }
}

/**
 * Display Credential Modal with copyable fields
 */
function showCredentialsModal(title, status, identifier, password, isService) {
    document.getElementById('credentials-modal-title').textContent = title;
    document.getElementById('credentials-modal-status').textContent = status;
    document.getElementById('cred-identifier').value = identifier;
    document.getElementById('cred-password').value = password;

    const hint = document.getElementById('cred-hint');
    if (hint) {
        if (isService) {
            hint.innerHTML = `You can log in using either <code>${escapeHtml(identifier)}</code> or with a leading @ (e.g. <code>@${escapeHtml(identifier)}</code>).`;
            hint.style.display = 'block';
        } else {
            hint.innerHTML = 'Log in with this email address.';
            hint.style.display = 'block';
        }
    }

    const modal = new bootstrap.Modal(document.getElementById('credentialsModal'));
    modal.show();
}

/**
 * Copy credential field to clipboard with visual feedback
 */
function copyCredField(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.select();
    input.setSelectionRange(0, 99999);

    navigator.clipboard.writeText(input.value).then(() => {
        const origHtml = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-check text-success"></i>';
        btn.classList.add('btn-outline-success');
        btn.classList.remove('btn-outline-secondary');

        setTimeout(() => {
            btn.innerHTML = origHtml;
            btn.classList.remove('btn-outline-success');
            btn.classList.add('btn-outline-secondary');
        }, 2000);
    }).catch(() => {
        // Fallback to execCommand
        try {
            document.execCommand('copy');
            alert('Copied to clipboard!');
        } catch (e) {
            alert('Please select and copy manually: ' + input.value);
        }
    });
}

/**
 * Delete User
 */
async function deleteUser(userId, userName) {
    if (!confirm(`Are you sure you want to permanently delete '${userName}'?\n\nThis will also remove any journey maps owned exclusively by this user. This action cannot be undone.`)) {
        return;
    }

    try {
        const res = await fetch(`/api/users.php?id=${encodeURIComponent(userId)}`, {
            method: 'DELETE'
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to delete user');

        loadUsers();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

/**
 * Initialize password show/hide toggles
 */
function initPasswordToggles() {
    document.querySelectorAll('.toggle-password-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (!input) return;
            const icon = btn.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                btn.setAttribute('aria-label', 'Hide password');
                if (icon) {
                    icon.classList.remove('bi-eye');
                    icon.classList.add('bi-eye-slash');
                }
            } else {
                input.type = 'password';
                btn.setAttribute('aria-label', 'Show password');
                if (icon) {
                    icon.classList.remove('bi-eye-slash');
                    icon.classList.add('bi-eye');
                }
            }
        });
    });
}

