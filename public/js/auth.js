/**
 * Clean Vanilla PHP Auth Library for Ptolemy
 */

function isAuthPage() {
    const p = window.location.pathname;
    return p === '/' || p === '' || p.endsWith('/index.php') ||
           p === '/login' || p === '/login/' || p.endsWith('/login.php') ||
           p === '/signin' || p === '/signin/' ||
           p === '/register' || p === '/register/' ||
           p === '/signup' || p === '/signup/';
}

function getRedirectDestination() {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    // Prevent open redirect vulnerabilities: must start with / and not //
    if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
        return redirect;
    }
    return '/dashboard/';
}

// Global User State
if (!window.currentUser) {
    if (isAuthPage()) {
        // If we are on an auth/login page and PHP did not inject currentUser,
        // any cached user in localStorage is stale. Clear it to avoid redirect loops.
        localStorage.removeItem('ptolemy_user');
    } else {
        const cachedUser = localStorage.getItem('ptolemy_user');
        if (cachedUser) {
            try {
                window.currentUser = JSON.parse(cachedUser);
            } catch (e) {
                localStorage.removeItem('ptolemy_user');
            }
        }
    }
} else {
    try {
        localStorage.setItem('ptolemy_user', JSON.stringify(window.currentUser));
    } catch (e) {}
}

/**
 * Handle Login
 */
async function handleLogin(email, password) {
    try {
        const cleanIdent = (email || '').trim();
        const response = await fetch('/api/auth.php?action=login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                identifier: cleanIdent,
                email: cleanIdent,
                username: cleanIdent,
                password 
            })
        });
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed.');
        }

        window.currentUser = data;
        localStorage.setItem('ptolemy_user', JSON.stringify(data));
        window.location.href = getRedirectDestination();
    } catch (err) {
        console.error('Login error:', err);
        throw err;
    }
}

/**
 * Handle Registration
 */
async function handleRegister(email, password, passwordConfirm, inviteToken, name) {
    try {
        const response = await fetch('/api/auth.php?action=register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                passwordConfirm,
                inviteToken,
                name
            })
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Registration failed.');
        }

        // Auto log in after registration
        window.currentUser = data;
        localStorage.setItem('ptolemy_user', JSON.stringify(data));
        window.location.href = getRedirectDestination();
    } catch (err) {
        console.error('Registration error:', err);
        throw err;
    }
}

/**
 * Logout
 */
async function logout() {
    try {
        await fetch('/api/auth.php?action=logout', { method: 'POST' });
    } catch (err) {
        console.error('Logout API error:', err);
    }
    window.currentUser = null;
    localStorage.removeItem('ptolemy_user');
    window.location.href = '/';
}

/**
 * Auth Guard
 */
function checkAuth() {
    if (!window.currentUser && !isAuthPage()) {
        const currentTarget = window.location.pathname + window.location.search;
        window.location.href = '/login?redirect=' + encodeURIComponent(currentTarget);
    }
}

// Session validation and form listeners
document.addEventListener('DOMContentLoaded', () => {
    initPasswordToggles();
    const isIndex = isAuthPage();

    // Validate session with backend if not already verified by the server on this page
    if (window.currentUser && !window.serverAuthVerified) {
        fetch('/api/auth.php?action=me')
            .then(res => {
                if (!res.ok) {
                    window.currentUser = null;
                    localStorage.removeItem('ptolemy_user');
                    if (!isIndex) window.location.href = '/';
                } else {
                    res.json().then(user => {
                        window.currentUser = user;
                        localStorage.setItem('ptolemy_user', JSON.stringify(user));
                        
                        // Update UI if on dashboard
                        const emailEl = document.getElementById('user-email');
                        if (emailEl) emailEl.textContent = user.email || user.username;

                        const adminLink = document.getElementById('admin-nav-link');
                        if (adminLink && user.is_admin) {
                            adminLink.classList.remove('d-none');
                        }

                        // Auto-redirect to destination if valid session exists on auth page
                        if (isIndex) {
                            window.location.href = getRedirectDestination();
                        }
                    });
                }
            })
            .catch(() => {
                window.currentUser = null;
                localStorage.removeItem('ptolemy_user');
                if (!isIndex) window.location.href = '/';
            });
    }

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const errorAlert = document.getElementById('error-alert');
    const errorMessage = document.getElementById('error-message');

    console.log('auth.js diagnostics:', {
        isIndex,
        pathname: window.location.pathname,
        loginForm: loginForm ? 'found' : 'missing',
        registerForm: registerForm ? 'found' : 'missing'
    });

    if (isIndex) {
        function showError(message) {
            if (errorMessage && errorAlert) {
                errorMessage.textContent = message;
                errorAlert.style.display = 'block';
            }
        }

        function hideError() {
            if (errorAlert) errorAlert.style.display = 'none';
        }

        function setSubmitting(btnId, isSubmitting) {
            const btn = document.getElementById(btnId);
            if (!btn) return;
            const text = btn.querySelector('.btn-text');
            const spinner = btn.querySelector('.loading-spinner');

            if (isSubmitting) {
                btn.disabled = true;
                if (text) text.style.display = 'none';
                if (spinner) spinner.style.display = 'inline-block';
            } else {
                btn.disabled = false;
                if (text) text.style.display = 'inline';
                if (spinner) spinner.style.display = 'none';
            }
        }

        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                hideError();
                setSubmitting('login-btn', true);

                const email = document.getElementById('login-email').value.trim();
                const password = document.getElementById('login-password').value;

                try {
                    await handleLogin(email, password);
                } catch (err) {
                    showError(err.message || 'Failed to login. Please check your credentials.');
                    setSubmitting('login-btn', false);
                }
            });
        }

        if (registerForm) {
            // Auto-fill Invite code from URL
            const params = new URLSearchParams(window.location.search);
            const invite = params.get('invite');
            if (invite) {
                const inviteInput = document.getElementById('reg-invite');
                if (inviteInput) inviteInput.value = invite;
                const registerTab = document.getElementById('register-tab');
                if (registerTab) {
                    bootstrap.Tab.getOrCreateInstance(registerTab).show();
                }
            }

            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                hideError();

                const name = document.getElementById('reg-name').value.trim();
                const email = document.getElementById('reg-email').value;
                const password = document.getElementById('reg-password').value;
                const passwordConfirm = document.getElementById('reg-password-confirm').value;
                const inviteToken = document.getElementById('reg-invite').value.trim();

                if (password !== passwordConfirm) {
                    showError("Passwords do not match.");
                    return;
                }

                setSubmitting('register-btn', true);

                try {
                    await handleRegister(email, password, passwordConfirm, inviteToken, name);
                } catch (err) {
                    showError(err.message || 'Failed to create account.');
                    setSubmitting('register-btn', false);
                }
            });
        }

        document.querySelectorAll('.nav-link').forEach(tab => {
            tab.addEventListener('shown.bs.tab', hideError);
        });
    }
});

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

