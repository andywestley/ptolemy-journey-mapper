// Initialize PocketBase
const pb = new PocketBase();

/**
 * Handle Login
 */
async function handleLogin(email, password) {
    try {
        const authData = await pb.collection('users').authWithPassword(email, password);
        console.log('Login successful:', authData);
        window.location.href = 'dashboard.html';
    } catch (err) {
        console.error('Login error:', err);
        throw err;
    }
}

/**
 * Handle Registration
 */
async function handleRegister(email, password, passwordConfirm) {
    try {
        // 1. Create the user
        await pb.collection('users').create({
            email,
            password,
            passwordConfirm,
        });

        // 2. Automatically log in after registration
        await pb.collection('users').authWithPassword(email, password);
        window.location.href = 'dashboard.html';
    } catch (err) {
        console.error('Registration error:', err);
        throw err;
    }
}

/**
 * Logout
 */
function logout() {
    pb.authStore.clear();
    window.location.href = 'index.html';
}

/**
 * Auth Guard
 */
function checkAuth() {
    if (!pb.authStore.isValid && !window.location.pathname.endsWith('index.html')) {
        window.location.href = 'index.html';
    } else if (pb.authStore.isValid && window.location.pathname.endsWith('index.html')) {
        window.location.href = 'dashboard.html';
    }
}
