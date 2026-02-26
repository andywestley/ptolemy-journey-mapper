const pb = new PocketBase();
if (!pb.authStore.isValid) {
    window.location.href = 'index.html';
}

// Global State
let currentJourney = null;
let originalOJF = null;
let activeEditorMode = 'table';
let autoSaveTimer = null;

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
 * Auto-save Logic
 */
const triggerAutoSave = debounce(async () => {
    if (!currentJourney) return;

    const statusEl = document.getElementById('save-status');
    const textEl = document.getElementById('save-text');
    const dotEl = statusEl.querySelector('.save-indicator-dot');

    statusEl.classList.remove('opacity-0');
    textEl.textContent = 'Saving...';
    dotEl.classList.add('save-indicator-syncing');

    try {
        const updatedData = {
            title: document.getElementById('editor-title').value,
            ojf_data: {
                ...originalOJF,
                persona: document.getElementById('editor-persona').value,
                pointOfView: document.getElementById('editor-pov').value
            }
        };
        const record = await pb.collection('journeys').update(currentJourney.id, updatedData);
        currentJourney = record;
        originalOJF = JSON.parse(JSON.stringify(record.ojf_data)); // Keep local state in sync

        textEl.textContent = 'Saved';
        dotEl.classList.remove('save-indicator-syncing');
        // Hide after 2 seconds of being saved
        setTimeout(() => {
            if (textEl.textContent === 'Saved') {
                statusEl.classList.add('opacity-0');
            }
        }, 2000);
    } catch (err) {
        console.error('Auto-save error:', err);
        textEl.textContent = 'Save Failed';
        dotEl.classList.remove('save-indicator-syncing');
        dotEl.style.background = '#ef4444'; // Red for error
    }
}, 2000);

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

function initColorPicker() {
    const grid = document.getElementById('color-picker-grid');
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

// Initialize UI
document.addEventListener('DOMContentLoaded', () => {
    const user = pb.authStore.record || pb.authStore.model || pb.authStore.admin;
    if (!user) {
        // If there's a token but no user object (common when SDK versions mismatch)
        pb.authStore.clear();
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('user-email').textContent = user.email || 'Unknown';
    document.getElementById('editor-title').addEventListener('input', () => triggerAutoSave());
    document.getElementById('editor-persona').addEventListener('input', () => triggerAutoSave());
    document.getElementById('editor-pov').addEventListener('input', () => triggerAutoSave());

    // Default to the dashboard list view (Inbox)
    showListView();
});

/**
 * View Controller
 */
function switchView(viewId) {
    document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

function switchEditorMode(mode) {
    const tableView = document.getElementById('table-editor-view');
    const visualView = document.getElementById('visual-map-view');
    const feedbackMenuItem = document.getElementById('menu-item-feedback');

    if (mode === 'table') {
        tableView.style.display = 'block';
        visualView.style.display = 'none';
        if (feedbackMenuItem) feedbackMenuItem.style.display = 'none';
        renderEditorTables();
    } else {
        tableView.style.display = 'none';
        visualView.style.display = 'block';
        if (feedbackMenuItem) feedbackMenuItem.style.display = 'block';
        renderVisualMap();
        if (typeof loadComments === 'function') {
            loadComments();
        }
    }
}

let currentFolder = 'inbox';
let currentTab = 'my';

async function showListView() {
    switchView('journey-list-view');
    currentFolder = 'inbox'; // Default to Inbox
    currentTab = 'my';
    // Run sequentially to avoid PocketBase auto-cancellation alerts
    await loadJourneys();
    await loadFolders();
}

/**
 * Data Loading
 */
async function loadJourneys(type = null) {
    if (type) currentTab = type;
    const typeToLoad = currentTab;

    toggleLoading(true);
    document.getElementById('journey-grid').style.display = 'flex';
    document.getElementById('invites-view').style.display = 'none';

    // Update active tab UI
    document.querySelectorAll('#journey-tabs .nav-link').forEach(link => {
        const text = link.textContent.toLowerCase();
        link.classList.toggle('active',
            (typeToLoad === 'my' && text.includes('my')) ||
            (typeToLoad === 'shared' && text.includes('shared')) ||
            (typeToLoad === 'trash' && text.includes('trash'))
        );
    });

    try {
        console.log('Fetching all accessible journeys for client-side filtering...');

        // Fetch all journeys the user has access to
        const allJourneys = await pb.collection('journeys').getFullList({
            sort: '-created'
        });

        let journeys = allJourneys.filter(j => {
            const user = pb.authStore.record || pb.authStore.model || pb.authStore.admin;
            if (!user) return false;
            const isOwner = j.owner === user.id;
            const isCollaborator = Array.isArray(j.collaborators) && j.collaborators.includes(user.id);
            const statusMatch = (typeToLoad === 'trash') ? (j.journey_status === 'trash') : (j.journey_status !== 'trash');

            // Primary tab filter
            if (typeToLoad === 'my') {
                if (!isOwner || j.journey_status === 'trash') return false;
            } else if (typeToLoad === 'shared') {
                if (!isCollaborator || isOwner || j.journey_status === 'trash') return false;
            } else if (typeToLoad === 'trash') {
                if (!isOwner || j.journey_status !== 'trash') return false;
            }

            // Folder filter
            if (currentFolder === 'inbox') {
                if (j.folder && j.folder.trim() !== '') return false;
            } else if (currentFolder && j.folder !== currentFolder) {
                return false;
            }

            return true;
        });

        console.log(`Filtered to ${journeys.length} journeys for tab: ${typeToLoad}`);

        const grid = document.getElementById('journey-grid');
        const empty = document.getElementById('empty-state');
        grid.innerHTML = '';

        if (journeys.length === 0) {
            empty.style.display = 'block';
            empty.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-folder2-open display-1 text-light mb-3"></i>
                    <h4>No journeys found</h4>
                    <p class="text-muted">Try changing your filters or create a new one.</p>
                </div>
            `;
        } else {
            empty.style.display = 'none';
            journeys.forEach(j => {
                const user = pb.authStore.record || pb.authStore.model || pb.authStore.admin;
                const isOwner = j.owner === user.id;
                const col = document.createElement('div');
                col.className = 'col-md-4 col-sm-6';

                let actionsHTML = '';
                if (typeToLoad === 'trash') {
                    actionsHTML = `
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-outline-success" onclick="event.stopPropagation(); restoreJourney('${j.id}')" title="Restore">
                                <i class="bi bi-arrow-counterclockwise"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation(); deletePermanently('${j.id}')" title="Delete Permanently">
                                <i class="bi bi-trash-fill"></i>
                            </button>
                        </div>
                    `;
                } else if (isOwner) {
                    actionsHTML = `
                        <div class="dropdown" onclick="event.stopPropagation()">
                            <button class="btn btn-sm btn-link text-muted p-0" data-bs-toggle="dropdown">
                                <i class="bi bi-three-dots-vertical"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                                <li><a class="dropdown-item py-2" href="#" onclick="event.preventDefault(); promptFolder('${j.id}', '${j.folder || ''}')"><i class="bi bi-folder-plus me-2"></i> Move to Folder</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item py-2 text-danger" href="#" onclick="event.preventDefault(); moveToTrash('${j.id}')"><i class="bi bi-trash3 me-2"></i> Move to Trash</a></li>
                            </ul>
                        </div>
                    `;
                }

                col.innerHTML = `
                    <div class="card h-100 cursor-pointer shadow-sm hover-shadow" onclick="openEditor('${j.id}')">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h5 class="card-title fw-bold mb-0">${j.title || 'Untitled Journey'}</h5>
                                ${actionsHTML}
                            </div>
                            <p class="card-text text-muted small mb-3 text-truncate-2">${j.description || 'No description provided.'}</p>
                            <div class="d-flex justify-content-between align-items-center mt-auto pt-3">
                                <span class="badge bg-light text-dark border-0 rounded-pill px-2" style="font-size: 0.7rem;">
                                    ${j.ojf_data?.stages?.length || 0} Stages
                                </span>
                                <small class="text-muted" style="font-size: 0.7rem;">${new Date(j.updated).toLocaleDateString()}</small>
                            </div>
                            ${j.folder ? `<div class="mt-2"><span class="badge bg-primary-subtle text-primary border-0 rounded-pill"><i class="bi bi-folder2 me-1"></i> ${j.folder}</span></div>` : ''}
                        </div>
                    </div>
                `;
                grid.appendChild(col);
            });
        }
    } catch (err) {
        if (err.isAbort) return; // Ignore auto-cancelled requests
        console.error('Fetch error details:', err);
        const detail = err.data && err.data.message ? `: ${err.data.message}` : '';
        alert(`Failed to load journeys${detail}. (Error: ${err.message})`);
    } finally {
        toggleLoading(false);
    }
}

async function loadFolders() {
    try {
        const allJourneys = await pb.collection('journeys').getFullList({
            expand: 'owner'
        });

        console.log('loadFolders: Total journeys fetched:', allJourneys.length);

        const user = pb.authStore.record || pb.authStore.model || pb.authStore.admin;
        if (!user) {
            console.warn('loadFolders: No user found in authStore');
            return;
        }

        const journeys = allJourneys.filter(j => {
            const isOwner = j.owner === user.id;
            const isCollaborator = Array.isArray(j.collaborators) && j.collaborators.includes(user.id);
            return (isOwner || isCollaborator) && j.journey_status !== 'trash';
        });
        console.log('loadFolders: Filtered journeys for user (owner or collaborator):', journeys.length);

        const folderNames = journeys.map(j => j.folder).filter(f => f && f.trim() !== '');
        console.log('loadFolders: Raw folder names found:', folderNames);

        const folders = [...new Set(folderNames)].sort();
        console.log('loadFolders: Unique sorted folders:', folders);
        const dynamicList = document.getElementById('dynamic-folders');
        if (!dynamicList) return;

        dynamicList.innerHTML = '';

        folders.forEach(f => {
            const btn = document.createElement('button');
            btn.className = `list-group-item list-group-item-action border-0 rounded p-2 ${currentFolder === f ? 'active' : ''}`;
            btn.innerHTML = `<i class="bi bi-folder2 me-2"></i> ${f}`;
            btn.onclick = () => filterByFolder(f);
            dynamicList.appendChild(btn);
        });

        // Sync active state for Inbox and All buttons
        document.querySelectorAll('#folder-list button[data-folder]').forEach(btn => {
            const df = btn.getAttribute('data-folder');
            const target = df === 'all' ? null : df;
            btn.classList.toggle('active', currentFolder === target);
        });
    } catch (err) {
        if (err.isAbort) return;
        console.error('Folder fetch error:', err);
    }
}

function filterByFolder(folder) {
    currentFolder = folder;

    // Update active class for all buttons in the sidebar
    document.querySelectorAll('#folder-list button').forEach(btn => {
        const df = btn.getAttribute('data-folder');
        if (df) {
            // Static buttons (Inbox/All)
            const target = df === 'all' ? null : df;
            btn.classList.toggle('active', currentFolder === target);
        } else {
            // Dynamic folder buttons
            btn.classList.toggle('active', btn.textContent.trim() === folder);
        }
    });

    loadJourneys();
}

async function moveToTrash(id) {
    if (!confirm('Move this journey to trash?')) return;
    try {
        console.log(`[Action] Moving journey ${id} to trash`);
        toggleLoading(true);
        await pb.collection('journeys').update(id, { journey_status: 'trash' });
        loadJourneys();
    } catch (err) {
        console.error('Move to trash error:', err);
        const detail = err.data ? '\nDetails: ' + JSON.stringify(err.data) : '';
        alert(`Failed to move to trash: ${err.message}${detail}`);
    } finally {
        toggleLoading(false);
    }
}

async function restoreJourney(id) {
    try {
        toggleLoading(true);
        await pb.collection('journeys').update(id, { journey_status: 'active' });
        loadJourneys();
    } catch (err) {
        alert('Failed to restore: ' + err.message);
    } finally {
        toggleLoading(false);
    }
}

async function deletePermanently(id) {
    if (!confirm('Permanently delete this journey? This cannot be undone.')) return;
    try {
        console.log(`Attempting to permanently delete journey ${id}...`);
        toggleLoading(true);
        await pb.collection('journeys').delete(id);
        console.log('Permanent delete successful');
        loadJourneys();
    } catch (err) {
        console.error('Permanent delete failed:', err);
        console.error('Error data:', typeof err.data === 'object' ? JSON.stringify(err.data, null, 2) : err.data);
        alert('Failed to delete: ' + err.message + (err.data ? '\n\nDetails: ' + JSON.stringify(err.data) : ''));
    } finally {
        toggleLoading(false);
    }
}

function promptFolder(id, current) {
    const folder = prompt('Enter folder name:', current);
    if (folder === null) return;
    updateFolder(id, folder);
}

async function updateFolder(id, folder) {
    try {
        toggleLoading(true);
        await pb.collection('journeys').update(id, { folder: folder.trim() });
        loadFolders();
        loadJourneys();
    } catch (err) {
        alert('Failed to update folder: ' + err.message);
    } finally {
        toggleLoading(false);
    }
}

async function createNewJourney() {
    toggleLoading(true);
    const defaultOJF = {
        version: "1.0",
        persona: "",
        pointOfView: "",
        stages: [{ id: "s1", name: "Entry" }],
        swimlanes: [{ id: "sl1", name: "Interaction" }],
        nodes: []
    };

    try {
        const user = pb.authStore.record || pb.authStore.model || pb.authStore.admin;
        const record = await pb.collection('journeys').create({
            title: "New User Journey",
            description: "Initial draft map.",
            owner: user.id,
            collaborators: [],
            journey_status: 'active',
            ojf_data: defaultOJF
        });
        openEditor(record.id);
    } catch (err) {
        console.error('Create error:', err);
        alert('Failed to create journey.');
    } finally {
        toggleLoading(false);
    }
}

async function openEditor(id) {
    toggleLoading(true);
    try {
        currentJourney = await pb.collection('journeys').getOne(id, {
            expand: 'collaborators'
        });
        document.getElementById('editor-title').value = currentJourney.title;
        document.getElementById('editor-persona').value = currentJourney.ojf_data?.persona || '';
        document.getElementById('editor-pov').value = currentJourney.ojf_data?.pointOfView || '';

        // Keep deep copy of OJF data
        originalOJF = JSON.parse(JSON.stringify(currentJourney.ojf_data || {}));
        if (!originalOJF.nodes) originalOJF.nodes = [];

        // Resolve any existing ID collisions in the data
        sanitizeOJFIds(originalOJF);

        // Reset mode to table
        document.getElementById('mode-table').checked = true;
        switchEditorMode('table');

        switchView('editor-view');
    } catch (err) {
        console.error('Open error:', err);
        alert('Failed to open journey.');
    } finally {
        toggleLoading(false);
    }
}

/**
 * Visual Map Rendering
 */
function renderVisualMap() {
    const grid = document.getElementById('map-grid');
    grid.innerHTML = '';

    const stages = originalOJF.stages || [];
    const swimlanes = originalOJF.swimlanes || [];
    const nodes = originalOJF.nodes || [];

    // Define grid structure
    // Column 1 is for Swimlanes (200px), others for Stages (300px), last for Add Stage (50px)
    grid.style.gridTemplateColumns = `200px repeat(${stages.length}, 300px) 50px`;

    // 1. Top-Left spacer
    const spacer = document.createElement('div');
    spacer.className = 'grid-header-empty';
    grid.appendChild(spacer);

    // 2. Stage Headers (Top Row)
    stages.forEach((stage, idx) => {
        const head = document.createElement('div');
        head.className = 'grid-header-stage';
        head.innerHTML = `<span contenteditable="true" class="editable-header-text" onblur="updateStageNameFromVisual(${idx}, this.innerText)">${stage.name}</span>`;
        grid.appendChild(head);
    });

    // 2b. Add Stage Button Header
    const addStageHead = document.createElement('div');
    addStageHead.className = 'grid-header-stage-add';
    addStageHead.innerHTML = '<i class="bi bi-plus-lg"></i>';
    addStageHead.title = "Add Stage";
    addStageHead.onclick = () => addStage();
    grid.appendChild(addStageHead);

    // 2c. Sentiment Row (Dedicated space for curve)
    const sentimentHeader = document.createElement('div');
    sentimentHeader.className = 'grid-header-emotion';
    sentimentHeader.innerHTML = 'Sentiment';
    grid.appendChild(sentimentHeader);

    stages.forEach(stage => {
        const cell = document.createElement('div');
        cell.className = 'grid-cell-emotion';
        cell.dataset.stageId = stage.id;
        grid.appendChild(cell);
    });

    const sentimentEndSpacer = document.createElement('div');
    sentimentEndSpacer.className = 'grid-cell-empty';
    grid.appendChild(sentimentEndSpacer);

    // 3. Rows
    swimlanes.forEach((swimlane, idx) => {
        // Swimlane Header (Left Column)
        const sHead = document.createElement('div');
        sHead.className = 'grid-header-swimlane';
        sHead.innerHTML = `<span contenteditable="true" class="editable-header-text" onblur="updateSwimlaneNameFromVisual(${idx}, this.innerText)">${swimlane.name}</span>`;
        grid.appendChild(sHead);

        // Grid Cells for this row
        stages.forEach(stage => {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.stageId = stage.id;
            cell.dataset.swimlaneId = swimlane.id;

            // Drag & Drop for Cell
            cell.ondragover = (e) => handleCellDragOver(e);
            cell.ondragleave = (e) => handleCellDragLeave(e);
            cell.ondrop = (e) => handleNodeDrop(e, stage.id, swimlane.id);

            // Add Node Button (Hover)
            const addBtn = document.createElement('button');
            addBtn.className = 'add-node-btn';
            addBtn.innerHTML = '<i class="bi bi-plus"></i>';
            addBtn.onclick = (e) => {
                e.stopPropagation();
                openNodeModal(null, stage.id, swimlane.id);
            };
            cell.appendChild(addBtn);

            // Find nodes for this intersection
            const cellNodes = nodes.filter(n => n.stageId === stage.id && n.swimlaneId === swimlane.id);

            cellNodes.forEach(node => {
                const card = document.createElement('div');
                card.className = `node-card node-severity-${node.severity || 'low'}`;
                card.dataset.nodeId = node.id;
                card.dataset.nodeTitle = node.title || 'Untitled Node';
                if (node.isMomentOfTruth) card.classList.add('moment-of-truth');
                card.setAttribute('tabindex', '0');
                card.setAttribute('draggable', 'true'); // Make draggable
                card.onclick = (e) => {
                    if (window.feedbackMode) return; // Let it bubble up to the grid click handler
                    openNodeModal(node.id);
                };

                // Apply background theme
                if (node.iconColor) {
                    card.style.backgroundColor = node.iconColor;
                }

                // Drag & Drop for Card
                card.ondragstart = (e) => handleNodeDragStart(e, node.id);
                card.ondragend = (e) => e.currentTarget.classList.remove('dragging');

                let cardHTML = '';
                if (node.isMomentOfTruth) {
                    cardHTML += '<div class="moment-of-truth-badge"><i class="bi bi-star-fill"></i></div>';
                }

                // Determine icon: custom > sentiment > purpose
                const displayIcon = node.icon || SENTIMENT_ICONS[node.sentiment] || PURPOSE_ICONS[node.purpose];

                cardHTML += `<div class="d-flex align-items-baseline mb-1">`;
                if (displayIcon) {
                    cardHTML += `<i class="bi bi-${displayIcon} me-2"></i>`;
                }
                cardHTML += `<div class="fw-bold">${node.title || 'Untitled Node'}</div>`;
                cardHTML += `</div>`;

                cardHTML += `<div class="text-muted small mb-2">${node.description || ''}</div>`;

                cardHTML += `<div class="d-flex flex-wrap align-items-center">`;
                if (node.score !== undefined && node.score !== null && node.score !== '') {
                    cardHTML += `<span class="node-score-badge">Emotion: ${node.score}</span>`;
                }
                cardHTML += (node.tags || []).map(t => `<span class="tag-pill">${t}</span>`).join('');
                cardHTML += `</div>`;

                card.innerHTML = cardHTML;
                cell.appendChild(card);
            });

            grid.appendChild(cell);
        });

        // 3b. Empty cell at end of row (below Add Stage button)
        const rowEndSpacer = document.createElement('div');
        rowEndSpacer.className = 'grid-cell-empty';
        grid.appendChild(rowEndSpacer);
    });

    // 4. Add Swimlane Row (Bottom)
    const addLaneHead = document.createElement('div');
    addLaneHead.className = 'grid-header-swimlane-add';
    addLaneHead.innerHTML = '<i class="bi bi-plus-lg"></i>';
    addLaneHead.title = "Add Swimlane";
    addLaneHead.onclick = () => addSwimlane();
    grid.appendChild(addLaneHead);

    // Fill the rest of the bottom row with empty cells
    for (let i = 0; i < stages.length + 1; i++) {
        const bottomSpacer = document.createElement('div');
        bottomSpacer.className = 'grid-cell-empty';
        grid.appendChild(bottomSpacer);
    }

    updateScorecard();
    // setTimeout to ensure DOM has fully painted the cards so bounding rects work
    setTimeout(drawEmotionalCurve, 0);
}

/**
 * Editor Rendering
 */
function renderEditorTables() {
    const stagesBody = document.getElementById('stages-body');
    const swimlanesBody = document.getElementById('swimlanes-body');

    stagesBody.innerHTML = '';
    swimlanesBody.innerHTML = '';

    (originalOJF.stages || []).forEach((stage, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="text-muted small">${stage.id}</td>
            <td><input type="text" class="w-100" value="${stage.name}" onchange="updateStage(${idx}, this.value)"></td>
            <td><input type="number" class="w-100" min="-5" max="5" value="${stage.overrideEmotion || ''}" onchange="updateStageEmotionOverride(${idx}, this.value)" placeholder="auto"></td>
            <td><button class="btn btn-sm text-danger" onclick="removeStage(${idx})"><i class="bi bi-trash"></i></button></td>
        `;
        stagesBody.appendChild(tr);
    });

    (originalOJF.swimlanes || []).forEach((lane, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="text-muted small">${lane.id}</td>
            <td><input type="text" class="w-100" value="${lane.name}" onchange="updateSwimlane(${idx}, this.value)"></td>
            <td><button class="btn btn-sm text-danger" onclick="removeSwimlane(${idx})"><i class="bi bi-trash"></i></button></td>
        `;
        swimlanesBody.appendChild(tr);
    });

    // Render Nodes Table
    const nodesBody = document.getElementById('nodes-body');
    nodesBody.innerHTML = '';
    (originalOJF.nodes || []).forEach((node) => {
        const stage = originalOJF.stages.find(s => s.id === node.stageId)?.name || 'Unknown';
        const lane = originalOJF.swimlanes.find(l => l.id === node.swimlaneId)?.name || 'Unknown';

        const displayIcon = node.icon || SENTIMENT_ICONS[node.sentiment] || PURPOSE_ICONS[node.purpose];

        const tr = document.createElement('tr');
        tr.style.backgroundColor = node.iconColor || 'transparent';
        if (node.iconColor && node.iconColor !== '#ffffff' && node.iconColor !== 'transparent') {
            tr.classList.add('table-row-themed');
        }
        tr.innerHTML = `
            <td class="fw-bold">
                ${displayIcon ? `<i class="bi bi-${displayIcon} me-1"></i>` : ''}
                ${node.title}
                ${node.isMomentOfTruth ? '<span class="badge bg-warning text-dark ms-1" style="font-size: 0.6rem;">MT</span>' : ''}
            </td>
            <td><span class="badge bg-light text-dark">${stage}</span></td>
            <td><span class="badge bg-light text-dark">${lane}</span></td>
            <td>
                <span class="badge node-severity-${node.severity || 'low'} border">${node.severity || 'low'}</span>
                ${(node.score !== undefined && node.score !== null && node.score !== '') ? `<span class="badge bg-light text-muted border ms-1">Emotion: ${node.score}</span>` : ''}
            </td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-secondary me-1" onclick="openNodeModal('${node.id}')"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteNode('${node.id}')"><i class="bi bi-trash"></i></button>
            </td>
        `;
        nodesBody.appendChild(tr);
    });

    updateScorecard();
}

/**
 * Analytics & Visualization Features
 */
function updateScorecard() {
    const nodes = originalOJF.nodes || [];
    const scoredNodes = nodes.filter(n => n.score !== undefined && n.score !== null && n.score !== '');

    const valEl = document.getElementById('scorecard-value');
    const sentEl = document.getElementById('scorecard-sentiment');

    if (!valEl || !sentEl) return;

    if (scoredNodes.length === 0) {
        valEl.innerText = '-';
        sentEl.className = 'badge rounded-pill bg-secondary text-white fw-medium';
        sentEl.innerText = 'Unscored';
        return;
    }

    const sum = scoredNodes.reduce((acc, n) => acc + Number(n.score), 0);
    const avg = sum / scoredNodes.length;
    const roundedAvg = Math.round(avg * 10) / 10;

    valEl.innerText = `${roundedAvg > 0 ? '+' : ''}${roundedAvg}`;

    if (roundedAvg >= 2) {
        sentEl.className = 'badge rounded-pill bg-success text-white fw-medium';
        sentEl.innerText = 'Positive';
    } else if (roundedAvg >= -2) {
        sentEl.className = 'badge rounded-pill bg-warning text-dark fw-medium';
        sentEl.innerText = 'Mixed';
    } else {
        sentEl.className = 'badge rounded-pill bg-danger text-white fw-medium';
        sentEl.innerText = 'High Friction';
    }
}

function drawEmotionalCurve() {
    // Ensure we are in visual map mode before attempting to draw
    if (document.getElementById('visual-map-view').style.display === 'none') return;

    const gridMap = document.getElementById('map-grid');
    if (!gridMap) return;

    let svg = document.getElementById('emotional-curve-svg');
    if (!svg) {
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.id = 'emotional-curve-svg';
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.pointerEvents = 'none';
        svg.style.zIndex = '1';
        gridMap.appendChild(svg);
    }

    svg.innerHTML = ''; // Clear existing paths

    // Check user toggle
    const toggle = document.getElementById('toggle-emotional-curve');
    if (toggle && !toggle.checked) {
        return; // Don't draw the curve if disabled, but we already cleared it above
    }

    svg.style.width = gridMap.scrollWidth + 'px';
    svg.style.height = gridMap.scrollHeight + 'px';

    const stages = originalOJF.stages || [];
    const nodes = originalOJF.nodes || [];
    if (stages.length === 0) return;

    const gridRect = gridMap.getBoundingClientRect();

    const emotionCells = Array.from(document.querySelectorAll('.grid-cell-emotion'));
    if (emotionCells.length === 0) return;

    const firstCellRect = emotionCells[0].getBoundingClientRect();
    const lastCellRect = emotionCells[emotionCells.length - 1].getBoundingClientRect();
    const cellHeight = firstCellRect.height;
    const rowTop = (firstCellRect.top - gridRect.top) + gridMap.scrollTop;

    // Internal vertical padding for the curve within the row
    const padding = 25;
    const innerTop = rowTop + padding;
    const innerBottom = rowTop + cellHeight - padding;
    const innerHeight = innerBottom - innerTop;

    const minScore = -5;
    const maxScore = 5;

    const points = [];

    // Calculate one point per stage
    stages.forEach((stage) => {
        const cell = document.querySelector(`.grid-cell-emotion[data-stage-id="${stage.id}"]`);
        if (!cell) return;

        const cellRect = cell.getBoundingClientRect();
        const centerX = (cellRect.left - gridRect.left) + gridMap.scrollLeft + (cellRect.width / 2);

        let stageScore = 0;
        if (stage.overrideEmotion !== undefined && stage.overrideEmotion !== null && stage.overrideEmotion !== '') {
            stageScore = Number(stage.overrideEmotion);
            stageScore = Math.max(minScore, Math.min(maxScore, stageScore));
        } else {
            const stageNodes = nodes.filter(n => n.stageId === stage.id && n.score !== undefined && n.score !== null && n.score !== '');
            if (stageNodes.length > 0) {
                const sumScore = stageNodes.reduce((acc, n) => acc + Number(n.score), 0);
                stageScore = sumScore / stageNodes.length;
            }
        }

        const scoreRatio = Math.max(0, Math.min(1, (stageScore - minScore) / (maxScore - minScore)));
        const mappedY = innerBottom - (innerHeight * scoreRatio);

        points.push({ x: centerX, y: mappedY, score: stageScore });
    });

    if (points.length === 0) return;

    // Calculate left/right edges for extension
    const leftEdge = (firstCellRect.left - gridRect.left) + gridMap.scrollLeft;
    const rightEdge = (lastCellRect.right - gridRect.left) + gridMap.scrollLeft;

    const extendedPoints = [...points];
    if (points.length >= 2) {
        // Left extension (Trend based)
        const p0 = points[0], p1 = points[1];
        const m = (p1.y - p0.y) / (p1.x - p0.x);
        let yExtL = p0.y - m * (p0.x - leftEdge);
        yExtL = Math.max(innerTop - 15, Math.min(innerBottom + 15, yExtL));
        extendedPoints.unshift({ x: leftEdge, y: yExtL, score: p0.score });

        // Right extension (Trend based)
        const pn_1 = points[points.length - 2], pn = points[points.length - 1];
        const mTail = (pn.y - pn_1.y) / (pn.x - pn_1.x);
        let yExtR = pn.y + mTail * (rightEdge - pn.x);
        yExtR = Math.max(innerTop - 15, Math.min(innerBottom + 15, yExtR));
        extendedPoints.push({ x: rightEdge, y: yExtR, score: pn.score });
    } else {
        // Single point, extend straight
        extendedPoints.unshift({ x: leftEdge, y: points[0].y, score: points[0].score });
        extendedPoints.push({ x: rightEdge, y: points[0].y, score: points[0].score });
    }

    if (extendedPoints.length < 2) return;

    // 1. Create Linear Gradient Defs
    let defs = svg.querySelector('defs');
    if (!defs) {
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svg.appendChild(defs);
    }
    const gradId = 'emotion-gradient-' + Math.random().toString(36).substr(2, 9);
    const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    grad.id = gradId;
    grad.setAttribute('x1', '0%');
    grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%');
    grad.setAttribute('y2', '0%');
    grad.setAttribute('gradientUnits', 'userSpaceOnUse'); // Points are in absolute grid space
    defs.appendChild(grad);

    // 2. Trend Color Logic (Modern vibrant palette)
    const UP_COLOR = '#22c55e';      // Modern Green
    const DOWN_COLOR = '#ef4444';    // Modern Red
    const NEUTRAL_COLOR = '#3b82f6'; // Modern Blue

    const getTrendColor = (s1, s2) => {
        if (s2 > s1 + 0.01) return UP_COLOR;
        if (s2 < s1 - 0.01) return DOWN_COLOR;
        return NEUTRAL_COLOR;
    };

    const segmentColors = [];
    for (let i = 0; i < extendedPoints.length - 1; i++) {
        segmentColors.push(getTrendColor(extendedPoints[i].score, extendedPoints[i + 1].score));
    }

    // 3. Add Gradient Stops (Double-stop per segment for sharper colors)
    const totalWidth = gridMap.scrollWidth || 1;
    extendedPoints.forEach((p, i) => {
        if (i < extendedPoints.length - 1) {
            const nextP = extendedPoints[i + 1];
            const segColor = segmentColors[i];

            // Start of segment (after a brief transition from prev node)
            const stopStart = p.x + (nextP.x - p.x) * 0.15;
            const s1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            s1.setAttribute('offset', (stopStart / totalWidth * 100) + '%');
            s1.setAttribute('stop-color', segColor);
            grad.appendChild(s1);

            // End of segment (before starting transition to next node)
            const stopEnd = p.x + (nextP.x - p.x) * 0.85;
            const s2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            s2.setAttribute('offset', (stopEnd / totalWidth * 100) + '%');
            s2.setAttribute('stop-color', segColor);
            grad.appendChild(s2);
        }
    });

    // 4. Construct Single Smooth Path
    let d = `M ${extendedPoints[0].x} ${extendedPoints[0].y}`;
    for (let i = 0; i < extendedPoints.length - 1; i++) {
        const p1 = extendedPoints[i];
        const p2 = extendedPoints[i + 1];
        const cpLeft = p1.x + (p2.x - p1.x) / 3;
        const cpRight = p2.x - (p2.x - p1.x) / 3;
        d += ` C ${cpLeft} ${p1.y}, ${cpRight} ${p2.y}, ${p2.x} ${p2.y}`;
    }

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', `url(#${gradId})`);
    path.setAttribute('stroke-width', '5');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('filter', 'drop-shadow(0 2px 3px rgba(0,0,0,0.15))');
    svg.appendChild(path);

    // 5. Draw Decorative Dots and Labels (Original points only)
    points.forEach((p, i) => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', p.x);
        circle.setAttribute('cy', p.y);
        circle.setAttribute('r', '6');

        // Incoming segment is at index i, outgoing at i+1
        const c1 = segmentColors[i];
        const c2 = segmentColors[i + 1];

        // Blend colors for the dot anchor
        let dotColor = c1;
        if (c1 && c2 && c1 !== c2) {
            const parse = (c) => [parseInt(c.substring(1, 3), 16), parseInt(c.substring(3, 5), 16), parseInt(c.substring(5, 7), 16)];
            const [r1, g1, b1] = parse(c1);
            const [r2, g2, b2] = parse(c2);
            dotColor = `rgb(${Math.round((r1 + r2) / 2)},${Math.round((g1 + g2) / 2)},${Math.round((b1 + b2) / 2)})`;
        } else if (!c1) {
            dotColor = c2;
        }

        circle.setAttribute('fill', dotColor);
        circle.setAttribute('stroke', '#ffffff');
        circle.setAttribute('stroke-width', '2.5');
        svg.appendChild(circle);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', p.x);
        text.setAttribute('y', p.y - 15);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', dotColor);
        text.setAttribute('font-size', '11px');
        text.setAttribute('font-weight', 'bold');
        text.textContent = (p.score > 0 ? '+' : '') + (Math.round(p.score * 10) / 10);
        svg.appendChild(text);
    });
}

// Ensure curve resizes when window changes
window.addEventListener('resize', () => {
    if (document.getElementById('visual-map-view').style.display !== 'none') {
        drawEmotionalCurve();
    }
});

/**
 * Data Mutation
 */
function updateStage(idx, val) {
    originalOJF.stages[idx].name = val;
    triggerAutoSave();
}
function updateStageEmotionOverride(idx, val) {
    if (val === '' || val === null) {
        delete originalOJF.stages[idx].overrideEmotion;
    } else {
        originalOJF.stages[idx].overrideEmotion = Number(val);
    }
    triggerAutoSave();
}
function updateStageNameFromVisual(idx, val) {
    if (originalOJF.stages[idx].name !== val) {
        originalOJF.stages[idx].name = val;
        triggerAutoSave();
    }
}
function addStage() {
    const id = 's' + (originalOJF.stages.length + 1);
    originalOJF.stages.push({ id, name: 'New Stage' });
    if (activeEditorMode === 'table') {
        renderEditorTables();
    } else {
        renderVisualMap();
    }
    triggerAutoSave();
}
function removeStage(idx) {
    originalOJF.stages.splice(idx, 1);
    if (activeEditorMode === 'table') {
        renderEditorTables();
    } else {
        renderVisualMap();
    }
    triggerAutoSave();
}

function updateSwimlane(idx, val) {
    originalOJF.swimlanes[idx].name = val;
    triggerAutoSave();
}
function updateSwimlaneNameFromVisual(idx, val) {
    if (originalOJF.swimlanes[idx].name !== val) {
        originalOJF.swimlanes[idx].name = val;
        triggerAutoSave();
    }
}
function addSwimlane() {
    const id = 'sl' + (originalOJF.swimlanes.length + 1);
    originalOJF.swimlanes.push({ id, name: 'New Swimlane' });
    if (activeEditorMode === 'table') {
        renderEditorTables();
    } else {
        renderVisualMap();
    }
    triggerAutoSave();
}
function removeSwimlane(idx) {
    originalOJF.swimlanes.splice(idx, 1);
    if (activeEditorMode === 'table') {
        renderEditorTables();
    } else {
        renderVisualMap();
    }
    triggerAutoSave();
}

/**
 * Drag and Drop Handlers
 */
function handleNodeDragStart(e, nodeId) {
    e.dataTransfer.setData('text/plain', nodeId);
    e.currentTarget.classList.add('dragging');
}

function handleCellDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleCellDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleNodeDrop(e, stageId, swimlaneId) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const nodeId = e.dataTransfer.getData('text/plain');

    const nodeIdx = originalOJF.nodes.findIndex(n => n.id === nodeId);
    if (nodeIdx !== -1) {
        originalOJF.nodes[nodeIdx].stageId = stageId;
        originalOJF.nodes[nodeIdx].swimlaneId = swimlaneId;
        renderVisualMap();
        triggerAutoSave();
    }
}

/**
 * Node Management
 */
function openNodeModal(nodeId = null, stageId = null, swimlaneId = null) {
    const modalEl = document.getElementById('nodeModal');
    const modal = new bootstrap.Modal(modalEl);
    const form = document.getElementById('node-form');
    form.reset();

    // Populate Stage/Swimlane Selects
    const stageSelect = document.getElementById('node-stage-id');
    const laneSelect = document.getElementById('node-swimlane-id');
    stageSelect.innerHTML = '';
    laneSelect.innerHTML = '';

    originalOJF.stages.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.name;
        stageSelect.appendChild(opt);
    });

    originalOJF.swimlanes.forEach(l => {
        const opt = document.createElement('option');
        opt.value = l.id;
        opt.textContent = l.name;
        laneSelect.appendChild(opt);
    });

    if (nodeId) {
        const node = originalOJF.nodes.find(n => n.id === nodeId);
        if (node) {
            document.getElementById('node-id').value = node.id;
            document.getElementById('node-stage-id').value = node.stageId;
            document.getElementById('node-swimlane-id').value = node.swimlaneId;
            document.getElementById('node-title').value = node.title;
            document.getElementById('node-description').value = node.description;
            document.getElementById('node-severity').value = node.severity || 'low';
            document.getElementById('node-score').value = (node.score !== undefined && node.score !== null) ? node.score : '';
            document.getElementById('node-sentiment').value = node.sentiment || '';
            document.getElementById('node-purpose').value = node.purpose || '';
            selectedColor = node.iconColor || '#ffffff';
            document.getElementById('node-icon-color').value = selectedColor;
            document.getElementById('node-moment-of-truth').checked = node.isMomentOfTruth || false;
            document.getElementById('node-tags').value = (node.tags || []).join(', ');

            initColorPicker();

            document.getElementById('delete-node-btn').style.display = 'block';
            document.getElementById('nodeModalLabel').textContent = 'Edit Node';
        }
    } else {
        document.getElementById('node-id').value = '';
        document.getElementById('node-stage-id').value = stageId || originalOJF.stages[0]?.id || '';
        document.getElementById('node-swimlane-id').value = swimlaneId || originalOJF.swimlanes[0]?.id || '';
        document.getElementById('node-sentiment').value = '';
        document.getElementById('node-purpose').value = '';
        document.getElementById('node-score').value = '';
        selectedColor = '#ffffff';
        document.getElementById('node-icon-color').value = selectedColor;
        document.getElementById('node-moment-of-truth').checked = false;

        initColorPicker();

        document.getElementById('delete-node-btn').style.display = 'none';
        document.getElementById('nodeModalLabel').textContent = 'Add New Node';
    }

    modal.show();
}

function saveNode() {
    const id = document.getElementById('node-id').value;
    const stageId = document.getElementById('node-stage-id').value;
    const swimlaneId = document.getElementById('node-swimlane-id').value;
    const title = document.getElementById('node-title').value;
    const description = document.getElementById('node-description').value;
    const severity = document.getElementById('node-severity').value;
    const scoreVal = document.getElementById('node-score').value;
    const score = scoreVal !== '' ? parseInt(scoreVal) : null;
    const sentiment = document.getElementById('node-sentiment').value;
    const purpose = document.getElementById('node-purpose').value;
    const iconColor = document.getElementById('node-icon-color').value;
    const isMomentOfTruth = document.getElementById('node-moment-of-truth').checked;
    const tags = document.getElementById('node-tags').value.split(',').map(t => t.trim()).filter(t => t !== '');

    if (!title) {
        alert('Title is required');
        return;
    }

    if (id) {
        // Update existing
        const idx = originalOJF.nodes.findIndex(n => n.id === id);
        if (idx !== -1) {
            originalOJF.nodes[idx] = {
                ...originalOJF.nodes[idx],
                stageId, swimlaneId, title, description, severity,
                score, sentiment, purpose, iconColor, isMomentOfTruth, tags
            };
        }
    } else {
        // Create new
        const newNode = {
            id: 'n-' + crypto.randomUUID(),
            stageId,
            swimlaneId,
            title,
            description,
            severity,
            score,
            sentiment,
            purpose,
            iconColor,
            isMomentOfTruth,
            tags
        };
        originalOJF.nodes.push(newNode);
    }

    // Close modal
    const modalEl = document.getElementById('nodeModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();

    // Refresh UI
    if (activeEditorMode === 'table') {
        renderEditorTables();
    } else {
        renderVisualMap();
    }

    triggerAutoSave();
}

function deleteNode(nodeId) {
    if (confirm('Are you sure you want to delete this node?')) {
        originalOJF.nodes = originalOJF.nodes.filter(n => n.id !== nodeId);
        if (activeEditorMode === 'table') {
            renderEditorTables();
        } else {
            renderVisualMap();
        }
        triggerAutoSave();
    }
}

function deleteNodeFromModal() {
    const id = document.getElementById('node-id').value;
    if (id) {
        deleteNode(id);
        const modalEl = document.getElementById('nodeModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();
    }
}

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

async function saveJourney() {
    if (!currentJourney) return;
    toggleLoading(true);

    const updatedData = {
        title: document.getElementById('editor-title').value,
        ojf_data: originalOJF
    };

    try {
        const record = await pb.collection('journeys').update(currentJourney.id, updatedData);
        currentJourney = record; // Update global state
        alert('Journey saved successfully!');
    } catch (err) {
        console.error('Save error:', err);
        alert('Error saving journey.');
    } finally {
        toggleLoading(false);
    }
}

// --- Collaboration Actions ---

function openShareModal() {
    if (!currentJourney) return;
    renderCollaborators();
    const modal = new bootstrap.Modal(document.getElementById('shareModal'));
    modal.show();
}

function renderCollaborators() {
    const list = document.getElementById('collaborators-list');
    list.innerHTML = '';

    const collaborators = currentJourney.expand?.collaborators || [];

    if (collaborators.length === 0) {
        list.innerHTML = '<li class="list-group-item text-muted">No collaborators yet.</li>';
        return;
    }

    collaborators.forEach(user => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.innerHTML = `
            <span>${user.email}</span>
            <button class="btn btn-sm text-danger" onclick="removeCollaborator('${user.id}')">
                <i class="bi bi-person-x"></i>
            </button>
        `;
        list.appendChild(li);
    });
}

async function addCollaborator() {
    const emailInput = document.getElementById('share-email');
    const email = emailInput.value.trim();
    if (!email) return;

    toggleLoading(true);
    try {
        // 1. Find the user by email
        const user = await pb.collection('users').getFirstListItem(`email="${email}"`);

        // 2. Add to collaborators list
        const currentIds = currentJourney.collaborators || [];
        if (currentIds.includes(user.id)) {
            alert('User is already a collaborator.');
            return;
        }

        const updatedCollaborators = [...currentIds, user.id];

        const record = await pb.collection('journeys').update(currentJourney.id, {
            collaborators: updatedCollaborators
        }, {
            expand: 'collaborators'
        });

        currentJourney = record;
        emailInput.value = '';
        renderCollaborators();
        alert('Collaborator added!');
    } catch (err) {
        console.error('Share error:', err);
        alert('Could not find user or error sharing.');
    } finally {
        toggleLoading(false);
    }
}

async function removeCollaborator(userId) {
    if (!confirm('Remove this collaborator?')) return;

    toggleLoading(true);
    try {
        const currentIds = currentJourney.collaborators || [];
        const updatedCollaborators = currentIds.filter(id => id !== userId);

        const record = await pb.collection('journeys').update(currentJourney.id, {
            collaborators: updatedCollaborators
        }, {
            expand: 'collaborators'
        });

        currentJourney = record;
        renderCollaborators();
    } catch (err) {
        console.error('Remove error:', err);
        alert('Error removing collaborator.');
    } finally {
        toggleLoading(false);
    }
}

/**
 * Import / Export Logic
 */
async function exportTextualPDF() {
    if (!currentJourney) return;

    const title = document.getElementById('editor-title').value;
    const persona = document.getElementById('editor-persona').value;
    const pov = document.getElementById('editor-pov').value;
    const stages = originalOJF.stages || [];
    const swimlanes = originalOJF.swimlanes || [];
    const nodes = originalOJF.nodes || [];

    // Create temporary container for PDF generation
    const container = document.createElement('div');
    container.style.padding = '40px';
    container.style.fontFamily = "'Outfit', sans-serif";
    container.style.color = '#1e293b';

    let html = `
        <div style="border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="color: #6366f1; margin-bottom: 5px;">Journey Map Report: ${title}</h1>
            ${persona ? `<p style="margin: 5px 0;"><strong>Persona:</strong> ${persona}</p>` : ''}
            ${pov ? `<p style="margin: 5px 0;"><strong>Point of View:</strong> ${pov}</p>` : ''}
        </div>
    `;

    // Thread logic
    const getThreadHtml = (parentId) => {
        if (!window.currentComments) return '';
        const replies = window.currentComments.filter(c => c.parent === parentId);
        if (replies.length === 0) return '';
        return `<div style="margin-left: 20px; padding-left: 10px; border-left: 2px solid #e2e8f0; margin-top: 10px;">
            ${replies.map(r => `<div style="margin-bottom: 5px;"><strong style="font-size: 0.8rem; color: #64748b;">${r.expand?.user?.email || 'User'}:</strong> <span style="font-size: 0.85rem; color: #475569;">${r.content}</span></div>`).join('')}
        </div>`;
    };

    stages.forEach(stage => {
        html += `
            <div style="margin-bottom: 40px; page-break-inside: avoid;">
                <h2 style="background: #f1f5f9; padding: 10px 15px; border-radius: 8px; border-left: 5px solid #6366f1; margin-bottom: 20px;">
                    Stage: ${stage.name}
                </h2>
        `;

        swimlanes.forEach(swimlane => {
            const cellNodes = nodes.filter(n => n.stageId === stage.id && n.swimlaneId === swimlane.id);
            if (cellNodes.length > 0) {
                html += `<h3 style="color: #475569; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-top: 25px;">${swimlane.name}</h3>`;

                cellNodes.forEach(node => {
                    const displayIcon = node.icon || SENTIMENT_ICONS[node.sentiment] || PURPOSE_ICONS[node.purpose];
                    const themeColor = node.iconColor || '#e2e8f0';

                    html += `
                        <div style="background: white; border-radius: 8px; padding: 15px; margin: 15px 0; position: relative; border: ${node.isMomentOfTruth ? '2px solid #f59e0b' : '1px solid #e2e8f0'}; border-left: 5px solid ${node.isMomentOfTruth ? '#f59e0b' : themeColor};">
                            ${node.isMomentOfTruth ? '<div style="position: absolute; top: -10px; right: 10px; background: #f59e0b; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: bold;">MOMENT OF TRUTH</div>' : ''}
                            <div style="display: flex; align-items: baseline; margin-bottom: 8px;">
                                ${displayIcon ? `<i class="bi bi-${displayIcon}" style="margin-right: 10px; font-size: 1.1rem; color: #6366f1;"></i>` : ''}
                                <h4 style="margin: 0; font-size: 1.1rem;">${node.title}</h4>
                            </div>
                            ${node.description ? `<p style="margin: 8px 0; font-size: 0.95rem; line-height: 1.5; color: #475569;">${node.description}</p>` : ''}
                            
                            <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-top: 10px; font-size: 0.85rem;">
                                ${node.severity ? `<span><strong>Severity:</strong> ${node.severity}</span>` : ''}
                                ${node.score ? `<span><strong>Score:</strong> ${node.score}/10</span>` : ''}
                                ${node.sentiment ? `<span><strong>Sentiment:</strong> ${node.sentiment}</span>` : ''}
                                ${node.purpose ? `<span><strong>Purpose:</strong> ${node.purpose}</span>` : ''}
                            </div>
                            ${node.tags && node.tags.length > 0 ? `<div style="margin-top: 8px; font-size: 0.8rem; color: #64748b;"><strong>Tags:</strong> ${node.tags.join(', ')}</div>` : ''}
                            
                            ${(() => {
                            if (!window.currentComments) return '';
                            const nodeComments = window.currentComments.filter(c => c.nodeId === node.id && !c.parent && !c.resolved);
                            if (nodeComments.length === 0) return '';
                            return `<div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #cbd5e1;">
                                    <h5 style="margin: 0 0 10px 0; font-size: 0.9rem; color: #f59e0b;"><i class="bi bi-chat-text"></i> Feedback</h5>
                                    ${nodeComments.map(c => `
                                        <div style="margin-bottom: 10px;">
                                            <strong style="font-size: 0.8rem; color: #64748b;">${c.expand?.user?.email || 'User'}:</strong> 
                                            <span style="font-size: 0.85rem; color: #1e293b;">${c.content}</span>
                                            ${getThreadHtml(c.id)}
                                        </div>
                                    `).join('')}
                                </div>`;
                        })()}
                        </div>
                    `;
                });
            }
        });

        html += `</div>`;
    });

    if (window.currentComments) {
        const generalComments = window.currentComments.filter(c => !c.nodeId && !c.parent && !c.resolved);
        if (generalComments.length > 0) {
            html += `
                <div style="margin-top: 40px; page-break-inside: avoid;">
                    <h2 style="background: #fef3c7; padding: 10px 15px; border-radius: 8px; border-left: 5px solid #f59e0b; margin-bottom: 20px;">
                        General Insight & Feedback
                    </h2>
                    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px;">
                        ${generalComments.map(c => `
                            <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #f1f5f9;">
                                <strong style="font-size: 0.9rem; color: #64748b;">${c.expand?.user?.email || 'User'}:</strong> 
                                <span style="font-size: 0.95rem; color: #1e293b;">${c.content}</span>
                                ${getThreadHtml(c.id)}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }

    container.innerHTML = html;

    // Check if Bootstrap Icons are needed in the PDF
    // We'll append a link to the CDN inside the container to ensure they render
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css';
    container.appendChild(link);

    toggleLoading(true);
    const opt = {
        margin: 10,
        filename: `${title.replace(/\s+/g, '_')}_Text_Report.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
        await html2pdf().set(opt).from(container).save();
    } catch (err) {
        console.error('Textual PDF Export error:', err);
        alert('Failed to export PDF.');
    } finally {
        toggleLoading(false);
    }
}

function exportToMarkdown() {
    if (!currentJourney) return;

    const title = document.getElementById('editor-title').value;
    const persona = document.getElementById('editor-persona').value;
    const pov = document.getElementById('editor-pov').value;
    const stages = originalOJF.stages || [];
    const swimlanes = originalOJF.swimlanes || [];
    const nodes = originalOJF.nodes || [];

    let md = `# Journey Map: ${title}\n\n`;
    if (persona) md += `**Persona:** ${persona}\n`;
    if (pov) md += `**Point of View:** ${pov}\n`;
    md += `\n---\n\n`;

    stages.forEach(stage => {
        md += `## Stage: ${stage.name}\n\n`;

        swimlanes.forEach(swimlane => {
            const cellNodes = nodes.filter(n => n.stageId === stage.id && n.swimlaneId === swimlane.id);
            if (cellNodes.length > 0) {
                md += `### ${swimlane.name}\n\n`;
                cellNodes.forEach(node => {
                    md += `#### ${node.isMomentOfTruth ? '⭐ ' : ''}${node.title}\n`;
                    if (node.description) md += `${node.description}\n\n`;

                    let meta = [];
                    if (node.severity) meta.push(`**Severity:** ${node.severity}`);
                    if (node.score) meta.push(`**Emotional Score:** ${node.score}/10`);
                    if (node.tags && node.tags.length > 0) meta.push(`**Tags:** ${node.tags.join(', ')}`);

                    if (meta.length > 0) {
                        md += meta.map(m => `- ${m}`).join('\n') + '\n\n';
                    }

                    if (window.currentComments) {
                        const nodeComments = window.currentComments.filter(c => c.nodeId === node.id && !c.parent && !c.resolved);
                        if (nodeComments.length > 0) {
                            md += `**Feedback on ${node.title}:**\n`;
                            nodeComments.forEach(c => {
                                md += `> **${c.expand?.user?.email || 'User'}:** ${c.content}\n`;
                                const replies = window.currentComments.filter(r => r.parent === c.id);
                                replies.forEach(r => {
                                    md += `> > **${r.expand?.user?.email || 'User'}:** ${r.content}\n`;
                                });
                            });
                            md += `\n`;
                        }
                    }
                });
            }
        });
        md += `\n`;
    });

    if (window.currentComments) {
        const generalComments = window.currentComments.filter(c => !c.nodeId && !c.parent && !c.resolved);
        if (generalComments.length > 0) {
            md += `## General Insight & Feedback\n\n`;
            generalComments.forEach(c => {
                md += `> **${c.expand?.user?.email || 'User'}:** ${c.content}\n`;
                const replies = window.currentComments.filter(r => r.parent === c.id);
                replies.forEach(r => {
                    md += `> > **${r.expand?.user?.email || 'User'}:** ${r.content}\n`;
                });
                md += `\n`;
            });
        }
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_Report.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function exportToOJF() {
    if (!currentJourney) return;

    // Sync current header state into OJF data before export
    const exportData = {
        ...originalOJF,
        title: document.getElementById('editor-title').value,
        persona: document.getElementById('editor-persona').value,
        pointOfView: document.getElementById('editor-pov').value
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportData.title.replace(/\s+/g, '_')}_${Date.now()}.ojf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function exportToPNG() {
    const wasTable = (activeEditorMode === 'table');
    if (wasTable) {
        document.getElementById('mode-visual').checked = true;
        switchEditorMode('visual');
        await new Promise(r => setTimeout(r, 150)); // Wait for render
    }

    const element = document.getElementById('map-grid');
    if (!element) {
        if (wasTable) switchEditorMode('table');
        return;
    }

    toggleLoading(true);
    try {
        const canvas = await html2canvas(element, {
            scale: 2, // High resolution
            useCORS: true,
            backgroundColor: '#ffffff',
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight
        });

        const link = document.createElement('a');
        link.download = `${currentJourney.title.replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (err) {
        console.error('PNG Export error:', err);
        alert('Failed to export PNG.');
    } finally {
        // Restore pins
        pins.forEach(p => p.style.display = 'flex');
        if (wasTable) {
            document.getElementById('mode-table').checked = true;
            switchEditorMode('table');
        }
        toggleLoading(false);
    }
}

async function exportToPDF() {
    const wasTable = (activeEditorMode === 'table');
    if (wasTable) {
        document.getElementById('mode-visual').checked = true;
        switchEditorMode('visual');
        await new Promise(r => setTimeout(r, 150)); // Wait for render
    }

    const element = document.getElementById('map-grid');
    if (!element) {
        if (wasTable) switchEditorMode('table');
        return;
    }

    // Hide pins during export
    const pins = element.querySelectorAll('.comment-pin');
    pins.forEach(p => p.style.display = 'none');

    toggleLoading(true);
    const opt = {
        margin: 10,
        filename: `${currentJourney.title.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            windowWidth: element.scrollWidth
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    try {
        await html2pdf().set(opt).from(element).save();
    } catch (err) {
        console.error('PDF Export error:', err);
        alert('Failed to export PDF.');
    } finally {
        // Restore pins
        pins.forEach(p => p.style.display = 'flex');
        if (wasTable) {
            document.getElementById('mode-table').checked = true;
            switchEditorMode('table');
        }
        toggleLoading(false);
    }
}

async function importJourney(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);

            // Basic OJF Validation
            if (!data.stages || !data.swimlanes) {
                throw new Error('Invalid OJF format: missing stages or swimlanes.');
            }

            toggleLoading(true);

            // Ensure imported nodes have unique and valid IDs
            const usedIds = new Set();
            if (data.nodes) {
                data.nodes = data.nodes.map(node => {
                    if (!node.id || usedIds.has(node.id)) {
                        node.id = 'n-' + crypto.randomUUID();
                    }
                    usedIds.add(node.id);
                    return node;
                });
            }

            const user = pb.authStore.record || pb.authStore.model || pb.authStore.admin;
            const record = await pb.collection('journeys').create({
                title: data.title || "Imported Journey",
                description: data.description || "Imported via .ojf file",
                owner: user.id,
                collaborators: [],
                journey_status: 'active',
                ojf_data: data
            });

            input.value = ''; // Reset input
            loadJourneys();
            alert('Journey imported successfully!');
        } catch (err) {
            console.error('Import error:', err);
            alert('Failed to import: ' + err.message);
        } finally {
            toggleLoading(false);
        }
    };
    reader.readAsText(file);
}

async function importTemplate(url) {
    if (!confirm('This will create a new journey map in your account. Continue?')) {
        return;
    }

    toggleLoading(true);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Basic OJF Validation
        if (!data.stages || !data.swimlanes) {
            throw new Error('Invalid OJF format in template.');
        }

        // Ensure imported nodes have unique and valid IDs
        const usedIds = new Set();
        if (data.nodes) {
            data.nodes = data.nodes.map(node => {
                if (!node.id || usedIds.has(node.id)) {
                    node.id = 'n-' + crypto.randomUUID();
                }
                usedIds.add(node.id);
                return node;
            });
        }

        const templateName = url.split('/').pop().replace('.ojf', '').replace(/-/g, ' ');
        // capitalize first letters
        const formattedTitle = templateName.replace(/\b\w/g, l => l.toUpperCase());

        const user = pb.authStore.record || pb.authStore.model || pb.authStore.admin;
        const record = await pb.collection('journeys').create({
            title: `Template: ${formattedTitle}`,
            description: "Imported from sample library.",
            owner: user.id,
            collaborators: [],
            journey_status: 'active',
            ojf_data: data
        });

        alert('Template imported successfully!');
        openEditor(record.id);
    } catch (err) {
        console.error('Template import error:', err);
        alert('Failed to import template: ' + err.message);
    } finally {
        toggleLoading(false);
    }
}

function toggleLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

function logout() {
    pb.authStore.clear();
    window.location.href = 'index.html';
}

// Custom Styles Helper for Cursor
document.head.insertAdjacentHTML('beforeend', '<style>.cursor-pointer { cursor: pointer; }</style>');
