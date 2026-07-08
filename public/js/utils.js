/**
 * Ptolemy Shared Utilities & UI Controllers
 */

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
    const tableView = document.getElementById('table-editor-view');
    const visualView = document.getElementById('visual-map-view');
    const feedbackMenuItem = document.getElementById('menu-item-feedback');

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

    // GTM DataLayer Editor Mode Event
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: 'editor_mode_change',
        editor_mode: mode
    });
}

/**
 * Clean ID collisions
 */
function sanitizeOJFIds(ojf) {
    if (!ojf.nodes) return;
    const usedIds = new Set();
    let collisionDetected = false;

    ojf.nodes = ojf.nodes.map(node => {
        if (!node.id || usedIds.has(node.id)) {
            node.id = 'n-' + crypto.randomUUID();
            collisionDetected = true;
        }
        usedIds.add(node.id);
        return node;
    });

    if (collisionDetected) {
        console.warn('OJF ID collisions detected and resolved.');
        triggerAutoSave(); // Save the fixed IDs back to server
    }
}
