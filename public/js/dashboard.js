/**
 * Ptolemy Core Dashboard Navigation, Global State, and Initialization
 */

// Global State
let currentJourney = null;
let originalOJF = null;
let activeEditorMode = 'table';
let autoSaveTimer = null;
let blueprintMode = false;

let currentFolder = 'inbox';
let currentTab = 'my';

// Initialize UI
document.addEventListener('DOMContentLoaded', () => {
    const user = window.currentUser;
    if (!user) {
        localStorage.removeItem('ptolemy_user');
        window.location.href = 'index.php';
        return;
    }

    const userEmailEl = document.getElementById('user-email');
    if (userEmailEl) userEmailEl.textContent = user.email || 'Unknown';
    
    const editorTitle = document.getElementById('editor-title');
    if (editorTitle) editorTitle.addEventListener('input', () => triggerAutoSave());
    
    const editorPersona = document.getElementById('editor-persona');
    if (editorPersona) editorPersona.addEventListener('input', () => triggerAutoSave());
    
    const editorPov = document.getElementById('editor-pov');
    if (editorPov) editorPov.addEventListener('input', () => triggerAutoSave());

    // Default to the dashboard list view (Inbox)
    showListView();
});

/**
 * Show list view
 */
async function showListView() {
    switchView('journey-list-view');
    const grid = document.getElementById('journey-grid');
    const empty = document.getElementById('empty-state');
    const invites = document.getElementById('invites-view');
    
    if (grid) grid.style.display = 'flex';
    if (empty) empty.style.display = 'none';
    if (invites) invites.style.display = 'none';

    // Update active tab UI
    document.querySelectorAll('#journey-tabs .nav-link').forEach(link => {
        link.classList.toggle('active', !link.textContent.includes('Invites'));
    });

    loadFolders();
    loadJourneys();
}

/**
 * Load Journeys list
 */
async function loadJourneys(type = null) {
    if (type) currentTab = type;
    const typeToLoad = currentTab;

    toggleLoading(true);

    // Update tab pills UI
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

        const allJourneysResponse = await fetch('api/journeys.php');
        if (!allJourneysResponse.ok) throw new Error('Failed to load journeys');
        const allJourneys = await allJourneysResponse.json();

        let journeys = allJourneys.filter(j => {
            const user = window.currentUser;
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
        if (grid) grid.innerHTML = '';

        if (journeys.length === 0) {
            if (empty) {
                empty.style.display = 'block';
                empty.innerHTML = `
                    <div class="text-center py-5">
                        <i class="bi bi-folder2-open display-1 text-light mb-3"></i>
                        <h4>No journeys found</h4>
                        <p class="text-muted">Try changing your filters or create a new one.</p>
                    </div>
                `;
            }
        } else {
            if (empty) empty.style.display = 'none';
            journeys.forEach(j => {
                const user = window.currentUser;
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
                if (grid) grid.appendChild(col);
            });
        }
    } catch (err) {
        if (err.isAbort) return;
        console.error('Fetch error details:', err);
        alert(`Failed to load journeys. (Error: ${err.message})`);
    } finally {
        toggleLoading(false);
    }
}

/**
 * Load Folders sidebar
 */
async function loadFolders() {
    try {
        const allJourneysResponse = await fetch('api/journeys.php');
        if (!allJourneysResponse.ok) throw new Error('Failed to load folders');
        const allJourneys = await allJourneysResponse.json();

        console.log('loadFolders: Total journeys fetched:', allJourneys.length);

        const user = window.currentUser;
        if (!user) {
            console.warn('loadFolders: No user found in state');
            return;
        }

        const journeys = allJourneys.filter(j => {
            const isOwner = j.owner === user.id;
            const isCollaborator = Array.isArray(j.collaborators) && j.collaborators.includes(user.id);
            return (isOwner || isCollaborator) && j.journey_status !== 'trash';
        });
        console.log('loadFolders: Filtered journeys for user (owner or collaborator):', journeys.length);

        const folderNames = journeys.map(j => j.folder).filter(f => f && f.trim() !== '');
        const uniqueFolders = [...new Set(folderNames)];

        console.log('loadFolders: Unique folders extracted:', uniqueFolders);

        const folderList = document.getElementById('folder-list');
        if (!folderList) return;
        folderList.innerHTML = '';

        // Inbox folder
        const inboxCount = journeys.filter(j => !j.folder || j.folder.trim() === '').length;
        const inboxLi = document.createElement('li');
        inboxLi.className = 'nav-item mb-1';
        inboxLi.innerHTML = `
            <a class="nav-link ${currentFolder === 'inbox' ? 'active' : ''}" href="#" onclick="event.preventDefault(); filterByFolder('inbox')">
                <i class="bi bi-inbox me-2"></i> Inbox
                <span class="badge bg-light text-dark rounded-pill float-end">${inboxCount}</span>
            </a>
        `;
        folderList.appendChild(inboxLi);

        // Custom Folders
        uniqueFolders.forEach(folder => {
            const count = journeys.filter(j => j.folder === folder).length;
            const li = document.createElement('li');
            li.className = 'nav-item mb-1';
            li.innerHTML = `
                <a class="nav-link ${currentFolder === folder ? 'active' : ''}" href="#" onclick="event.preventDefault(); filterByFolder('${folder}')">
                    <i class="bi bi-folder2 me-2"></i> ${folder}
                    <span class="badge bg-light text-dark rounded-pill float-end">${count}</span>
                </a>
            `;
            folderList.appendChild(li);
        });

    } catch (err) {
        console.error('Load folders error:', err);
    }
}

function filterByFolder(folder) {
    currentFolder = folder;
    loadFolders();
    loadJourneys();
}

/**
 * Journey operations
 */
async function moveToTrash(id) {
    if (!confirm('Move this journey to trash?')) return;

    // GTM Custom Trash Event
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: 'journey_trash',
        journey_id: id
    });

    try {
        console.log(`[Action] Moving journey ${id} to trash`);
        const res = await fetch(`api/journeys.php?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ journey_status: 'trash' })
        });
        if (!res.ok) throw new Error('Failed to trash journey');
        await res.json();
        loadJourneys();
    } catch (err) {
        console.error('Move to trash error:', err);
        alert(`Failed to move to trash: ${err.message}`);
    } finally {
        toggleLoading(false);
    }
}

async function restoreJourney(id) {
    try {
        const res = await fetch(`api/journeys.php?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ journey_status: 'active' })
        });
        if (!res.ok) throw new Error('Failed to restore journey');
        await res.json();
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
        const res = await fetch(`api/journeys.php?id=${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed to delete journey');
        console.log('Permanent delete successful');
        loadJourneys();
    } catch (err) {
        console.error('Permanent delete failed:', err);
        alert('Failed to delete: ' + err.message);
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
        const res = await fetch(`api/journeys.php?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folder: folder.trim() })
        });
        if (!res.ok) throw new Error('Failed to update folder');
        await res.json();
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

    // GTM Custom Create Event
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: 'journey_create'
    });
    const defaultOJF = {
        version: "1.0",
        persona: "",
        pointOfView: "",
        stages: [{ id: "s1", name: "Entry" }],
        swimlanes: [{ id: "sl1", name: "Interaction" }],
        nodes: []
    };

    try {
        const response = await fetch('api/journeys.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: "New User Journey",
                description: "Initial draft map.",
                journey_status: 'active',
                ojf_data: defaultOJF
            })
        });
        if (!response.ok) throw new Error('Failed to create journey');
        const record = await response.json();
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
        const response = await fetch(`api/journeys.php?id=${id}`);
        if (!response.ok) throw new Error('Failed to load journey');
        currentJourney = await response.json();
        
        const titleEl = document.getElementById('editor-title');
        if (titleEl) titleEl.value = currentJourney.title;
        
        const personaEl = document.getElementById('editor-persona');
        if (personaEl) personaEl.value = currentJourney.ojf_data?.persona || '';
        
        const povEl = document.getElementById('editor-pov');
        if (povEl) povEl.value = currentJourney.ojf_data?.pointOfView || '';

        // Keep deep copy of OJF data
        originalOJF = JSON.parse(JSON.stringify(currentJourney.ojf_data || {}));
        if (!originalOJF.nodes) originalOJF.nodes = [];

        // Resolve any existing ID collisions in the data
        sanitizeOJFIds(originalOJF);

        // Reset mode to table
        const modeTable = document.getElementById('mode-table');
        if (modeTable) modeTable.checked = true;
        switchEditorMode('table');

        switchView('editor-view');
    } catch (err) {
        console.error('Open error:', err);
        alert('Failed to open journey.');
    } finally {
        toggleLoading(false);
    }
}

function toggleLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = show ? 'flex' : 'none';
}

// Custom Styles Helper for Cursor
document.head.insertAdjacentHTML('beforeend', '<style>.cursor-pointer { cursor: pointer; }</style>');
