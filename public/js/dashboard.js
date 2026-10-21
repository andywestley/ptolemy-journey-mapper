/**
 * Ptolemy Dashboard Controller (Journey List, Folders, and Management)
 */

let currentFolder = (typeof INITIAL_FOLDER !== 'undefined' && INITIAL_FOLDER !== null) ? INITIAL_FOLDER : 'inbox';
let currentTab = (typeof INITIAL_TAB !== 'undefined' && INITIAL_TAB) ? INITIAL_TAB : 'my';

document.addEventListener('DOMContentLoaded', () => {
    // Detect folder/tab from URL if direct navigation occurred
    const path = window.location.pathname;
    if (path.includes('/dashboard/shared/')) {
        currentTab = 'shared';
    } else if (path.includes('/dashboard/trash/')) {
        currentTab = 'trash';
    } else if (path.includes('/dashboard/folder/')) {
        const match = path.match(/\/dashboard\/folder\/([^\/]+)/);
        if (match && match[1]) {
            currentFolder = decodeURIComponent(match[1]);
        }
    }

    loadJourneys(currentTab);
});

/**
 * Load and render journeys with filtering
 */
async function loadJourneys(type = null) {
    if (type) {
        currentTab = type;
        const targetPath = (type === 'my') ? '/dashboard/' : `/dashboard/${type}/`;
        if (window.location.pathname !== targetPath && !window.location.pathname.includes('/folder/')) {
            try {
                window.history.pushState(null, '', targetPath);
            } catch (e) {}
        }
    }

    const typeToLoad = currentTab;
    toggleLoading(true);

    // Update nav pills UI
    document.querySelectorAll('#journey-tabs .nav-link').forEach(link => {
        const text = link.textContent.toLowerCase();
        link.classList.toggle('active', 
            (typeToLoad === 'my' && text.includes('my')) ||
            (typeToLoad === 'shared' && text.includes('shared')) ||
            (typeToLoad === 'trash' && text.includes('trash'))
        );
    });

    try {
        const response = await fetch('/api/journeys.php');
        if (!response.ok) throw new Error('Failed to load journeys');
        const allJourneys = await response.json();
        loadFolders(allJourneys);

        const user = window.currentUser || {};
        const currentUserId = user.id ? String(user.id) : '';

        const journeys = allJourneys.filter(j => {
            const isOwner = currentUserId ? (String(j.owner) === currentUserId) : (typeToLoad !== 'shared');
            const isCollaborator = Array.isArray(j.collaborators) && currentUserId && j.collaborators.map(String).includes(currentUserId);

            // Tab filter
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
            } else if (currentFolder && currentFolder !== 'all' && j.folder !== currentFolder) {
                return false;
            }

            return true;
        });

        const grid = document.getElementById('journey-grid');
        const empty = document.getElementById('empty-state');
        if (grid) grid.innerHTML = '';

        if (journeys.length === 0) {
            if (empty) {
                empty.style.display = 'block';
                empty.innerHTML = `
                    <div class="text-center py-5">
                        <i class="bi bi-folder2-open display-1 text-light mb-3"></i>
                        <h2 class="h4">No journeys in this view</h2>
                        <p class="text-muted">Change your filters or create a new journey map.</p>
                    </div>
                `;
            }
        } else {
            if (empty) empty.style.display = 'none';

            journeys.forEach(j => {
                const isOwner = j.owner === currentUserId;
                const col = document.createElement('div');
                col.className = 'col-md-4 col-sm-6';

                const journeyTitle = j.title || 'Untitled Journey';
                const updatedDate = j.updated ? new Date(j.updated).toLocaleDateString() : '';
                const stagesCount = j.ojf_data?.stages?.length || 0;
                const shortId = j.id ? String(j.id).substring(0, 8) : '';
                const descDetails = [];
                if (updatedDate) descDetails.push(`updated ${updatedDate}`);
                descDetails.push(`${stagesCount} stage${stagesCount === 1 ? '' : 's'}`);
                if (j.folder && j.folder.trim()) descDetails.push(`folder: ${j.folder.trim()}`);
                if (shortId) descDetails.push(`ID: ${shortId}`);
                const disambiguatedLabel = `${journeyTitle} (${descDetails.join(', ')})`;

                let actionsHTML = '';
                if (typeToLoad === 'trash') {
                    actionsHTML = `
                        <div class="d-flex gap-2 position-relative" style="z-index: 2;">
                            <button class="btn btn-sm btn-outline-success d-inline-flex align-items-center justify-content-center" onclick="restoreJourney('${j.id}')" title="Restore" aria-label="Restore journey ${escapeHtml(journeyTitle)} (${shortId})" style="min-width: 32px; min-height: 32px;">
                                <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger d-inline-flex align-items-center justify-content-center" onclick="deletePermanently('${j.id}')" title="Delete Permanently" aria-label="Delete journey permanently ${escapeHtml(journeyTitle)} (${shortId})" style="min-width: 32px; min-height: 32px;">
                                <i class="bi bi-trash-fill" aria-hidden="true"></i>
                            </button>
                        </div>
                    `;
                } else if (isOwner) {
                    actionsHTML = `
                        <div class="dropdown position-relative" style="z-index: 2;">
                            <button class="btn btn-sm btn-link text-muted d-inline-flex align-items-center justify-content-center p-0 rounded-2" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Journey actions for ${escapeHtml(journeyTitle)} (${shortId})" style="min-width: 32px; min-height: 32px; width: 32px; height: 32px;">
                                <i class="bi bi-three-dots-vertical" aria-hidden="true"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                                <li><button type="button" class="dropdown-item py-2" onclick="promptFolder('${j.id}', '${escapeHtml(j.folder || '')}')"><i class="bi bi-folder-plus me-2" aria-hidden="true"></i> Move to Folder</button></li>
                                ${j.is_public ? `<li><a class="dropdown-item py-2" href="/share/${escapeHtml(j.id)}/" target="_blank" rel="noopener noreferrer" title="Opens in a new tab"><i class="bi bi-globe me-2 text-primary" aria-hidden="true"></i> View Public Link <i class="bi bi-box-arrow-up-right ms-1 text-muted" style="font-size: 0.75rem;" aria-hidden="true"></i><span class="visually-hidden">(opens in a new tab)</span></a></li>` : ''}
                                <li><hr class="dropdown-divider"></li>
                                <li><button type="button" class="dropdown-item py-2 text-danger" onclick="moveToTrash('${j.id}')"><i class="bi bi-trash3 me-2" aria-hidden="true"></i> Move to Trash</button></li>
                            </ul>
                        </div>
                    `;
                }

                col.innerHTML = `
                    <div class="card h-100 position-relative shadow-sm hover-shadow border-0 rounded-4 ugc" data-ugc="true" data-audit-ignore="content">
                        <div class="card-body d-flex flex-column ugc" data-ugc="true" data-audit-ignore="content">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h2 class="h5 card-title fw-bold mb-0 text-dark ugc" data-ugc="true" data-audit-ignore="content">
                                    <a href="/journey/${escapeHtml(j.id)}/" class="text-decoration-none text-dark stretched-link ugc" data-ugc="true" data-audit-ignore="content" aria-label="${escapeHtml(disambiguatedLabel)}">
                                        ${escapeHtml(journeyTitle)}
                                    </a>
                                </h2>
                                ${actionsHTML}
                            </div>
                            <p class="card-text text-muted small mb-3 text-truncate-2 ugc" data-ugc="true" data-audit-ignore="content">${escapeHtml(j.description || 'No description provided.')}</p>
                            
                            <div class="d-flex justify-content-between align-items-center mt-auto pt-3 border-top position-relative" style="z-index: 2;">
                                <div class="d-flex align-items-center gap-1">
                                    <span class="badge bg-light text-dark border rounded-pill px-2" style="font-size: 0.7rem;">
                                        ${j.ojf_data?.stages?.length || 0} Stages
                                    </span>
                                    ${j.is_public ? '<span class="badge bg-info-subtle text-info border border-info-subtle rounded-pill" style="font-size: 0.65rem;"><i class="bi bi-globe" aria-hidden="true"></i> Public</span>' : ''}
                                </div>
                                <small class="text-muted" style="font-size: 0.7rem;">${new Date(j.updated).toLocaleDateString()}</small>
                            </div>
                            ${j.folder ? `<div class="mt-2 position-relative" style="z-index: 2;"><span class="badge bg-primary-subtle text-primary border-0 rounded-pill"><i class="bi bi-folder2 me-1" aria-hidden="true"></i> ${escapeHtml(j.folder)}</span></div>` : ''}
                        </div>
                    </div>
                `;
                if (grid) grid.appendChild(col);
            });
        }
    } catch (err) {
        console.error('Fetch journeys error:', err);
        alert(`Failed to load journeys: ${err.message}`);
    } finally {
        toggleLoading(false);
    }
}

/**
 * Load folders sidebar
 */
async function loadFolders(cachedJourneys = null) {
    try {
        let allJourneys = cachedJourneys;
        if (!allJourneys) {
            const response = await fetch('/api/journeys.php');
            if (!response.ok) return;
            allJourneys = await response.json();
        }

        const user = window.currentUser || {};
        const currentUserId = user.id ? String(user.id) : '';

        const journeys = allJourneys.filter(j => {
            const isOwner = currentUserId ? (String(j.owner) === currentUserId) : true;
            const isCollaborator = Array.isArray(j.collaborators) && currentUserId && j.collaborators.map(String).includes(currentUserId);
            return (isOwner || isCollaborator) && j.journey_status !== 'trash';
        });

        const folderNames = journeys.map(j => j.folder).filter(f => f && f.trim() !== '');
        const uniqueFolders = [...new Set(folderNames)];

        const container = document.getElementById('dynamic-folders');
        if (!container) return;
        container.innerHTML = '';

        uniqueFolders.forEach(folder => {
            const count = journeys.filter(j => j.folder === folder).length;
            const btn = document.createElement('button');
            btn.className = `list-group-item list-group-item-action border-0 p-2 ${currentFolder === folder ? 'active' : ''}`;
            btn.onclick = () => filterByFolder(folder);
            btn.innerHTML = `
                <i class="bi bi-folder2 me-2"></i> ${escapeHtml(folder)}
                <span class="badge bg-light text-dark rounded-pill float-end">${count}</span>
            `;
            container.appendChild(btn);
        });
    } catch (err) {
        console.error('Load folders error:', err);
    }
}

function filterByFolder(folder) {
    currentFolder = folder;
    const targetPath = folder ? (folder === 'inbox' ? '/dashboard/' : `/dashboard/folder/${encodeURIComponent(folder)}/`) : '/dashboard/';
    try {
        window.history.pushState(null, '', targetPath);
    } catch (e) {}

    // Update active state in folder list
    document.querySelectorAll('#folder-list button').forEach(btn => {
        btn.classList.remove('active');
        if (folder === null && btn.dataset.folder === 'all') btn.classList.add('active');
        if (folder === 'inbox' && btn.dataset.folder === 'inbox') btn.classList.add('active');
    });

    loadJourneys();
}

/**
 * Open Dedicated Journey Editor
 */
function openEditor(id) {
    window.location.href = `/journey/${id}/`;
}

/**
 * Create New Journey and open dedicated editor
 */
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
        const response = await fetch('/api/journeys.php', {
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
        window.location.href = `/journey/${record.id}/`;
    } catch (err) {
        console.error('Create error:', err);
        alert('Failed to create journey: ' + err.message);
        toggleLoading(false);
    }
}

/**
 * Import Journey from file
 */
async function importJourney(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.stages || !data.swimlanes) throw new Error("Invalid OJF format: missing stages or swimlanes.");

            toggleLoading(true);
            const usedIds = new Set();
            if (data.nodes) {
                data.nodes = data.nodes.map(node => {
                    if (!node.id || usedIds.has(node.id)) {
                        node.id = "n-" + crypto.randomUUID();
                    }
                    usedIds.add(node.id);
                    return node;
                });
            }

            const response = await fetch('/api/journeys.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: data.title || "Imported Journey",
                    description: data.description || "Imported via .ojf file",
                    journey_status: 'active',
                    ojf_data: data
                })
            });

            if (!response.ok) throw new Error("Failed to import journey");
            const record = await response.json();
            window.location.href = `/journey/${record.id}/`;
        } catch (err) {
            console.error('Import error:', err);
            alert("Failed to import: " + err.message);
            toggleLoading(false);
        }
    };
    reader.readAsText(file);
}

async function moveToTrash(id) {
    if (!confirm('Move this journey to trash?')) return;
    toggleLoading(true);
    try {
        const res = await fetch(`/api/journeys.php?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ journey_status: 'trash' })
        });
        if (!res.ok) throw new Error('Failed to trash journey');
        loadJourneys();
    } catch (err) {
        alert('Failed to move to trash: ' + err.message);
    } finally {
        toggleLoading(false);
    }
}

async function restoreJourney(id) {
    toggleLoading(true);
    try {
        const res = await fetch(`/api/journeys.php?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ journey_status: 'active' })
        });
        if (!res.ok) throw new Error('Failed to restore journey');
        loadJourneys();
    } catch (err) {
        alert('Failed to restore: ' + err.message);
    } finally {
        toggleLoading(false);
    }
}

async function deletePermanently(id) {
    if (!confirm('Permanently delete this journey? This cannot be undone.')) return;
    toggleLoading(true);
    try {
        const res = await fetch(`/api/journeys.php?id=${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete journey');
        loadJourneys();
    } catch (err) {
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
    toggleLoading(true);
    try {
        const res = await fetch(`/api/journeys.php?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folder: folder.trim() })
        });
        if (!res.ok) throw new Error('Failed to update folder');
        loadFolders();
        loadJourneys();
    } catch (err) {
        alert('Failed to update folder: ' + err.message);
    } finally {
        toggleLoading(false);
    }
}

function openEditor(id) {
    if (!id) return;
    window.location.href = `/journey/${id}/`;
}

function toggleLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = show ? 'flex' : 'none';
}

async function importJourney(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.stages || !data.swimlanes) {
                throw new Error("Invalid OJF format: missing stages or swimlanes.");
            }

            toggleLoading(true);

            const usedIds = new Set();
            if (data.nodes) {
                data.nodes = data.nodes.map(node => {
                    if (!node.id || usedIds.has(node.id)) {
                        const uid = (typeof generateUUID === 'function') ? generateUUID() : Math.random().toString(36).substring(2, 15);
                        node.id = 'n-' + uid;
                    }
                    usedIds.add(node.id);
                    return node;
                });
            }
            const response = await fetch('/api/journeys.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: data.title || "Imported Journey",
                    description: data.description || "Imported via .ojf file",
                    journey_status: 'active',
                    ojf_data: data
                })
            });
            if (!response.ok) throw new Error('Failed to import journey');
            await response.json();

            input.value = ''; // Reset input
            loadJourneys();
            alert('Journey imported successfully!');
        } catch (err) {
            console.error('Import error:', err);
            alert('Failed to import: ' + err.message);

            // GTM Import Error
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
                event: 'app_error',
                error_context: 'import_ojf',
                error_message: err.message
            });
        } finally {
            toggleLoading(false);
        }
    };
    reader.readAsText(file);
}
window.importJourney = importJourney;
