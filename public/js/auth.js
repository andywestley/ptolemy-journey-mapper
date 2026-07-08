/**
 * Clean Vanilla PHP Auth Library for Ptolemy
 */

// Global User State
window.currentUser = null;

// Initialize from LocalStorage cache
const cachedUser = localStorage.getItem('ptolemy_user');
if (cachedUser) {
    try {
        window.currentUser = JSON.parse(cachedUser);
    } catch (e) {
        localStorage.removeItem('ptolemy_user');
    }
}

/**
 * Handle Login
 */
async function handleLogin(email, password) {
    try {
        const response = await fetch('api/auth.php?action=login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed.');
        }

        window.currentUser = data;
        localStorage.setItem('ptolemy_user', JSON.stringify(data));
        window.location.href = 'dashboard.php';
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
        const response = await fetch('api/auth.php?action=register', {
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
        window.location.href = 'dashboard.php';
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
        await fetch('api/auth.php?action=logout', { method: 'POST' });
    } catch (err) {
        console.error('Logout API error:', err);
    }
    window.currentUser = null;
    localStorage.removeItem('ptolemy_user');
    window.location.href = 'index.php';
}

/**
 * Auth Guard
 */
function checkAuth() {
    const isIndex = window.location.pathname.endsWith('index.php') || window.location.pathname.endsWith('/') || window.location.pathname === '';
    if (!window.currentUser && !isIndex) {
        window.location.href = 'index.php';
    } else if (window.currentUser && isIndex) {
        window.location.href = 'dashboard.php';
    }
}

// Session validation and form listeners
document.addEventListener('DOMContentLoaded', () => {
    const isIndex = window.location.pathname.endsWith('index.php') || window.location.pathname.endsWith('/') || window.location.pathname === '';

    // Validate session with backend
    if (window.currentUser) {
        fetch('api/auth.php?action=me')
            .then(res => {
                if (!res.ok) {
                    window.currentUser = null;
                    localStorage.removeItem('ptolemy_user');
                    if (!isIndex) window.location.href = 'index.php';
                } else {
                    res.json().then(user => {
                        window.currentUser = user;
                        localStorage.setItem('ptolemy_user', JSON.stringify(user));
                        
                        // Update UI if on dashboard
                        const emailEl = document.getElementById('user-email');
                        if (emailEl) emailEl.textContent = user.email;

                        // Auto-redirect to dashboard if valid session exists on index
                        if (isIndex) {
                            window.location.href = 'dashboard.php';
                        }
                    });
                }
            })
            .catch(() => {
                window.currentUser = null;
                localStorage.removeItem('ptolemy_user');
                if (!isIndex) window.location.href = 'index.php';
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

    if (isIndex && loginForm && registerForm) {
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

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError();
            setSubmitting('login-btn', true);

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                await handleLogin(email, password);
            } catch (err) {
                showError(err.message || 'Failed to login. Please check your credentials.');
                setSubmitting('login-btn', false);
            }
        });

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

        document.querySelectorAll('.nav-link').forEach(tab => {
            tab.addEventListener('shown.bs.tab', hideError);
        });
    }
});
