/**
 * Ptolemy Shared Utilities & UI Controllers
 */

let autoSaveTimer = null;
let activeEditorMode = (typeof INITIAL_EDITOR_MODE !== 'undefined' && INITIAL_EDITOR_MODE) ? INITIAL_EDITOR_MODE : 'visual';
window.activeEditorMode = activeEditorMode;

/**
 * Calculates high-contrast text color (pure white or dark slate) based on background luminance
 */
function getContrastColor(hexColor) {
    if (!hexColor || hexColor === '#ffffff' || hexColor === 'transparent') {
        return '#0f172a';
    }
    let hex = String(hexColor).replace('#', '').trim();
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    // YIQ formula
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq < 145 ? '#ffffff' : '#0f172a';
}

function toggleLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = show ? 'flex' : 'none';
    }
}

const colors = [
    '#ffffff', // Default White
    '#f8fafc', // Slate
    '#f1f5f9', // Muted Slate
    '#eef2ff', // Indigo
    '#e0e7ff', // Soft Indigo
    '#e0f2fe', // Soft Blue
    '#dcfce7', // Soft Green
    '#fef9c3', // Soft Yellow
    '#ffedd5', // Soft Orange
    '#fee2e2', // Soft Red
    '#fce7f3', // Soft Pink
    '#f3e8ff'  // Soft Purple
];
let selectedColor = '#ffffff';

const SENTIMENT_ICONS = {
    'positive': 'emoji-smile',
    'negative': 'emoji-frown',
    'neutral': 'emoji-expressionless',
    'anxious': 'hourglass-split',
    'frustrated': 'exclamation-octagon',
    'delighted': 'magic',
    'surprised': 'lightning-fill',
    'confused': 'question-circle',
    'relieved': 'check-all',
    'bored': 'emoji-expressionless',
    'angry': 'exclamation-octagon'
};

const PURPOSE_ICONS = {
    'touchpoint': 'hand-index-thumb',
    'pain-point': 'exclamation-triangle',
    'gain': 'graph-up-arrow',
    'opportunity': 'lightbulb',
    'milestone': 'flag',
    'bottleneck': 'cone-striped',
    'decision': 'diagram-2',
    'observation': 'eye',
    'note': 'sticky'
};

/**
 * HTML Escaper to prevent XSS attacks
 */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Debounce helper
 */
function debounce(func, wait) {
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(autoSaveTimer);
            func(...args);
        };
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(later, wait);
    };
}

/**
 * Color picker initialization
 */
function initColorPicker() {
    const grid = document.getElementById('color-picker-grid');
    if (!grid) return;
    grid.innerHTML = '';
    colors.forEach(color => {
        const opt = document.createElement('div');
        opt.className = `color-option ${selectedColor === color ? 'selected' : ''}`;
        opt.style.backgroundColor = color;
        opt.onclick = () => {
            selectedColor = color;
            document.getElementById('node-icon-color').value = color;
            initColorPicker();
        };
        grid.appendChild(opt);
    });
}

/**
 * View switcher
 */
function switchView(viewId) {
    document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(viewId);
    if (target) target.classList.add('active');

    // GTM DataLayer Virtual Pageview
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: 'virtual_pageview',
        page_path: '/' + viewId,
        page_title: viewId === 'editor-view' ? 'Journey Editor' : 'Dashboard'
    });
}

/**
 * Editor mode switcher (Visual vs Table)
 */
function switchEditorMode(mode) {
    activeEditorMode = mode;
    window.activeEditorMode = mode;
    const tableView = document.getElementById('table-editor-view');
    const visualView = document.getElementById('visual-map-view');
    const feedbackMenuItem = document.getElementById('menu-item-feedback');

    // Update active states on mode toggles (supporting both buttons and radio inputs)
    const visualBtn = document.getElementById('mode-visual');
    const tableBtn = document.getElementById('mode-table');
    if (visualBtn && tableBtn) {
        const isVisual = mode === 'visual';
        if (visualBtn.tagName === 'BUTTON') {
            visualBtn.classList.toggle('active', isVisual);
            visualBtn.setAttribute('aria-pressed', isVisual ? 'true' : 'false');
            tableBtn.classList.toggle('active', !isVisual);
            tableBtn.setAttribute('aria-pressed', !isVisual ? 'true' : 'false');
        } else if ('checked' in visualBtn) {
            visualBtn.checked = isVisual;
            tableBtn.checked = !isVisual;
        }
    }

    if (mode === 'table') {
        if (tableView) tableView.style.display = 'block';
        if (visualView) visualView.style.display = 'none';
        if (feedbackMenuItem) feedbackMenuItem.style.display = 'none';
        renderEditorTables();
    } else {
        if (tableView) tableView.style.display = 'none';
        if (visualView) visualView.style.display = 'block';
        if (feedbackMenuItem) feedbackMenuItem.style.display = 'block';
        renderVisualMap();
        if (typeof loadComments === 'function') {
            loadComments();
        }
    }

    // Announce mode change to screen readers and live region listeners
    const announcer = document.getElementById('global-status-announcer');
    if (announcer) {
        announcer.textContent = mode === 'table' ? 'Switched to Table Editor view' : 'Switched to Visual Journey Map view';
    }

    // Update clean URL if on dedicated journey or share page
    if (window.currentJourney && (window.location.pathname.includes('/journey/') || window.location.pathname.includes('/share/'))) {
        const basePath = window.location.pathname.includes('/share/') ? '/share/' : '/journey/';
        try {
            window.history.replaceState(null, '', `${basePath}${window.currentJourney.id}/${mode}/`);
        } catch (e) {}
    }

    // GTM DataLayer Editor Mode Event
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: 'editor_mode_change',
        editor_mode: mode
    });
}

/**
 * Safe UUID Generator with fallback for non-secure contexts or older browsers
 */
function generateUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
window.generateUUID = generateUUID;

/**
 * Clean ID collisions
 */
function sanitizeOJFIds(ojf) {
    if (!ojf || !ojf.nodes) return;
    const usedIds = new Set();
    let collisionDetected = false;

    ojf.nodes = ojf.nodes.map(node => {
        if (!node.id || usedIds.has(node.id)) {
            node.id = 'n-' + generateUUID();
            collisionDetected = true;
        }
        usedIds.add(node.id);
        return node;
    });

    if (collisionDetected) {
        console.warn('OJF ID collisions detected and resolved.');
        if (typeof triggerAutoSave === 'function') {
            triggerAutoSave(); // Save the fixed IDs back to server
        }
    }
}
window.sanitizeOJFIds = sanitizeOJFIds;

/**
 * Asynchronously load an external script on demand
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
            if (existing.dataset.loaded === 'true') {
                return resolve();
            }
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', (e) => reject(e));
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.crossOrigin = 'anonymous';
        script.onload = () => {
            script.dataset.loaded = 'true';
            resolve();
        };
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
    });
}
window.loadScript = loadScript;

/**
 * On-demand loader for html2canvas
 */
async function ensureHtml2Canvas() {
    if (typeof html2canvas === 'function') return;
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
}
window.ensureHtml2Canvas = ensureHtml2Canvas;

/**
 * On-demand loader for html2pdf
 */
async function ensureHtml2Pdf() {
    if (typeof html2pdf === 'function') return;
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js');
}
window.ensureHtml2Pdf = ensureHtml2Pdf;

