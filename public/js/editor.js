/**
 * Ptolemy Workspace Actions & Editor Controllers (Stages, Swimlanes, Nodes, Exporters)
 */

let currentJourney = window.currentJourney || null;
let originalOJF = window.originalOJF || {};
activeEditorMode = (typeof INITIAL_EDITOR_MODE !== 'undefined' && INITIAL_EDITOR_MODE) ? INITIAL_EDITOR_MODE : 'visual';
window.activeEditorMode = activeEditorMode;
let blueprintMode = false;

// Auto-save logic definition
const triggerAutoSave = debounce(async () => {
    if (!currentJourney) return;

    const statusEl = document.getElementById('save-status');
    const textEl = document.getElementById('save-text');
    const dotEl = statusEl.querySelector('.save-indicator-dot');

    if (statusEl) statusEl.classList.remove('opacity-0');
    if (textEl) textEl.textContent = 'Saving...';
    if (dotEl) dotEl.classList.add('save-indicator-syncing');

    try {
        const notesEl = document.getElementById('editor-notes');
        const notesVal = notesEl ? notesEl.value : '';
        const updatedData = {
            title: document.getElementById('editor-title').value,
            description: notesVal,
            notes: notesVal,
            ojf_data: {
                ...originalOJF,
                persona: document.getElementById('editor-persona').value,
                pointOfView: document.getElementById('editor-pov').value,
                notes: notesVal
            }
        };
        const response = await fetch(`/api/journeys.php?id=${currentJourney.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });
        if (!response.ok) throw new Error('Auto-save failed');
        const record = await response.json();
        currentJourney = record;
        originalOJF = JSON.parse(JSON.stringify(record.ojf_data)); // Keep local state in sync

        if (textEl) textEl.textContent = 'Saved';
        if (dotEl) dotEl.classList.remove('save-indicator-syncing');
        // Hide after 2 seconds of being saved
        setTimeout(() => {
            if (textEl && textEl.textContent === 'Saved' && statusEl) {
                statusEl.classList.add('opacity-0');
            }
        }, 2000);
    } catch (err) {
        console.error('Auto-save error:', err);
        if (textEl) textEl.textContent = 'Save Failed';
        if (dotEl) {
            dotEl.classList.remove('save-indicator-syncing');
            dotEl.style.background = '#ef4444'; // Red for error
        }

        // GTM Auto-save error
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            event: 'app_error',
            error_context: 'auto_save',
            error_message: err.message || 'Auto-save failed'
        });
    }
}, 2000);

/**
 * Stage Mutations
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

    // GTM Event
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'stage_add' });
}

function removeStage(idx) {
    originalOJF.stages.splice(idx, 1);
    if (activeEditorMode === 'table') {
        renderEditorTables();
    } else {
        renderVisualMap();
    }
    triggerAutoSave();

    // GTM Event
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'stage_remove' });
}

/**
 * Swimlane Mutations
 */
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

    // GTM Event
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'swimlane_add' });
}

function removeSwimlane(idx) {
    originalOJF.swimlanes.splice(idx, 1);
    if (activeEditorMode === 'table') {
        renderEditorTables();
    } else {
        renderVisualMap();
    }
    triggerAutoSave();

    // GTM Event
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'swimlane_remove' });
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
 * Node Modal Management
 */
function openNodeModal(nodeId = null, stageId = null, swimlaneId = null) {
    const modalEl = document.getElementById('nodeModal');
    if (!modalEl) return;
    const modal = new bootstrap.Modal(modalEl);
    const form = document.getElementById('node-form');
    if (form) form.reset();

    // Populate Stage/Swimlane Selects
    const stageSelect = document.getElementById('node-stage-id');
    const laneSelect = document.getElementById('node-swimlane-id');
    if (stageSelect) stageSelect.innerHTML = '';
    if (laneSelect) laneSelect.innerHTML = '';

    originalOJF.stages.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.name;
        if (stageSelect) stageSelect.appendChild(opt);
    });

    originalOJF.swimlanes.forEach(l => {
        const opt = document.createElement('option');
        opt.value = l.id;
        opt.textContent = l.name;
        if (laneSelect) laneSelect.appendChild(opt);
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
        if (stageSelect) stageSelect.value = stageId || originalOJF.stages[0]?.id || '';
        if (laneSelect) laneSelect.value = swimlaneId || originalOJF.swimlanes[0]?.id || '';
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

    // Populate Blueprint Lists
    renderBlueprintList('onstage', nodeId ? originalOJF.nodes.find(n => n.id === nodeId)?.blueprint?.onstage : []);
    renderBlueprintList('backstage', nodeId ? originalOJF.nodes.find(n => n.id === nodeId)?.blueprint?.backstage : []);
    renderBlueprintList('support', nodeId ? originalOJF.nodes.find(n => n.id === nodeId)?.blueprint?.support : []);
    renderBlueprintList('evidence', nodeId ? originalOJF.nodes.find(n => n.id === nodeId)?.blueprint?.evidence : []);

    // Reset to first tab
    const firstTabEl = document.getElementById('journey-tab');
    if (firstTabEl) {
        const firstTab = new bootstrap.Tab(firstTabEl);
        firstTab.show();
    }

    modal.show();
}

function renderBlueprintList(type, items = []) {
    const list = document.getElementById(`blueprint-${type}-list`);
    if (!list) return;
    list.innerHTML = '';
    
    if (!items || items.length === 0) {
        list.innerHTML = '<div class="text-muted small italic opacity-50 py-2 border-bottom border-dashed">No items added yet.</div>';
        return;
    }

    items.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'blueprint-item-row d-flex gap-2 mb-2 pb-2 border-bottom border-dashed';
        
        if (type === 'evidence') {
            div.innerHTML = `
                <input type="text" class="form-control form-control-sm" placeholder="Evidence item" value="${escapeHtml(item.item || '')}" data-field="item">
                <input type="text" class="form-control form-control-sm" placeholder="Type" value="${escapeHtml(item.type || '')}" data-field="type">
            `;
        } else if (type === 'support') {
            div.innerHTML = `
                <input type="text" class="form-control form-control-sm" placeholder="System/Dept" value="${escapeHtml(item.system || '')}" data-field="system">
                <input type="text" class="form-control form-control-sm" placeholder="Description" value="${escapeHtml(item.description || '')}" data-field="description">
            `;
        } else {
            div.innerHTML = `
                <input type="text" class="form-control form-control-sm" placeholder="Actor" value="${escapeHtml(item.actor || '')}" data-field="actor">
                <input type="text" class="form-control form-control-sm" placeholder="Action" value="${escapeHtml(item.action || '')}" data-field="action">
            `;
        }
        
        const delBtn = document.createElement('button');
        delBtn.className = 'btn btn-sm btn-outline-danger border-0';
        delBtn.innerHTML = '<i class="bi bi-x-lg"></i>';
        delBtn.onclick = () => {
            div.remove();
            if (list.children.length === 0) {
                list.innerHTML = '<div class="text-muted small italic opacity-50 py-2 border-bottom border-dashed">No items added yet.</div>';
            }
        };
        div.appendChild(delBtn);
        list.appendChild(div);
    });
}

function addBlueprintItem(type) {
    const list = document.getElementById(`blueprint-${type}-list`);
    if (!list) return;
    // Remove "No items" message if present
    if (list.querySelector('.text-muted')) list.innerHTML = '';
    
    renderBlueprintList(type, [...getBlueprintItemsFromUI(type), {}]);
}

function getBlueprintItemsFromUI(type) {
    const list = document.getElementById(`blueprint-${type}-list`);
    if (!list) return [];
    const rows = list.querySelectorAll('.blueprint-item-row');
    const items = [];
    
    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        const item = {};
        inputs.forEach(input => {
            item[input.dataset.field] = input.value;
        });
        if (Object.values(item).some(v => v.trim() !== '')) {
            items.push(item);
        }
    });
    
    return items;
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

    const blueprint = {
        onstage: getBlueprintItemsFromUI('onstage'),
        backstage: getBlueprintItemsFromUI('backstage'),
        support: getBlueprintItemsFromUI('support'),
        evidence: getBlueprintItemsFromUI('evidence')
    };

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
                score, sentiment, purpose, iconColor, isMomentOfTruth, tags, blueprint
            };
        }
    } else {
        // Create new
        const newNodeId = (typeof generateUUID === 'function') ? generateUUID() : ((typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15));
        const newNode = {
            id: 'n-' + newNodeId,
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
            tags,
            blueprint
        };
        originalOJF.nodes.push(newNode);
    }

    // Close modal
    const modalEl = document.getElementById('nodeModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();

    // GTM Node Save
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: 'node_save',
        is_new: !id,
        severity: severity,
        has_score: score !== null,
        is_moment_of_truth: isMomentOfTruth,
        has_blueprint: (blueprint.onstage.length > 0 || blueprint.backstage.length > 0 || blueprint.support.length > 0 || blueprint.evidence.length > 0)
    });

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

        // GTM Node Delete
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            event: 'node_delete',
            node_id: nodeId
        });

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

/**
 * Journey save
 */
async function saveJourney() {
    if (!currentJourney) return;
    toggleLoading(true);

    const notesEl = document.getElementById('editor-notes');
    const notesVal = notesEl ? notesEl.value : '';
    const updatedData = {
        title: document.getElementById('editor-title').value,
        description: notesVal,
        notes: notesVal,
        ojf_data: {
            ...originalOJF,
            persona: document.getElementById('editor-persona').value,
            pointOfView: document.getElementById('editor-pov').value,
            notes: notesVal
        }
    };

    try {
        const response = await fetch(`/api/journeys.php?id=${currentJourney.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });
        if (!response.ok) throw new Error('Save failed');
        const record = await response.json();
        currentJourney = record; // Update global state
        alert('Journey saved successfully!');
    } catch (err) {
        console.error('Save error:', err);
        alert('Error saving journey.');
    } finally {
        toggleLoading(false);
    }
}

/**
/**
 * Sharing & Privacy State Management
 */
function updatePrivacyUI() {
    if (!currentJourney) return;
    const isPublic = !!currentJourney.is_public;

    // Header badge button in editor
    const badge = document.getElementById('journey-privacy-badge');
    if (badge) {
        if (isPublic) {
            badge.className = 'btn btn-sm btn-outline-success rounded-pill px-3 py-1 d-flex align-items-center gap-1';
            badge.innerHTML = '<i class="bi bi-globe"></i> <span>Public</span>';
            badge.title = 'Anyone with the link can view. Click to change sharing settings.';
        } else {
            badge.className = 'btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 d-flex align-items-center gap-1';
            badge.innerHTML = '<i class="bi bi-lock"></i> <span>Private</span>';
            badge.title = 'Only you and collaborators can view. Click to change sharing settings.';
        }
    }

    // Modal status badge
    const modalBadge = document.getElementById('share-modal-status-badge');
    if (modalBadge) {
        if (isPublic) {
            modalBadge.className = 'badge bg-success-subtle text-success border border-success-subtle px-2 py-1';
            modalBadge.innerHTML = '<i class="bi bi-globe me-1"></i> Public';
        } else {
            modalBadge.className = 'badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1';
            modalBadge.innerHTML = '<i class="bi bi-lock me-1"></i> Private';
        }
    }

    // Modal description text
    const modalDesc = document.getElementById('share-modal-status-desc');
    if (modalDesc) {
        if (isPublic) {
            modalDesc.innerHTML = 'This journey map is <strong>Public</strong>. Anyone with the share link can view it without logging in.';
        } else {
            modalDesc.innerHTML = 'This journey map is <strong>Private</strong>. Only you and added collaborators can view or edit.';
        }
    }

    // Modal public toggle
    const publicToggle = document.getElementById('public-share-toggle');
    if (publicToggle) {
        publicToggle.checked = isPublic;
    }

    // Modal public link container
    const publicContainer = document.getElementById('public-link-container');
    if (publicContainer) {
        publicContainer.style.display = isPublic ? 'block' : 'none';
    }
}

function openShareModal() {
    if (!currentJourney) return;
    renderCollaborators();
    updatePrivacyUI();

    const publicUrlInput = document.getElementById('public-share-url');
    const publicPreview = document.getElementById('public-share-preview');
    const shareUrl = `${window.location.origin}/share/${currentJourney.id}/`;

    if (publicUrlInput) {
        publicUrlInput.value = shareUrl;
    }
    if (publicPreview) {
        publicPreview.href = shareUrl;
    }

    const modalEl = document.getElementById('shareModal');
    if (modalEl) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    }
}

async function togglePublicShare(isPublic) {
    if (!currentJourney) return;
    toggleLoading(true);
    try {
        const response = await fetch(`/api/journeys.php?id=${currentJourney.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_public: isPublic ? 1 : 0 })
        });
        if (!response.ok) throw new Error('Failed to update public sharing setting');
        const record = await response.json();
        currentJourney = record;
        window.currentJourney = record;

        updatePrivacyUI();
    } catch (err) {
        console.error('Toggle public share error:', err);
        alert('Failed to update share setting: ' + err.message);
        const publicToggle = document.getElementById('public-share-toggle');
        if (publicToggle) publicToggle.checked = !isPublic;
    } finally {
        toggleLoading(false);
    }
}

function copyPublicShareUrl(btn) {
    const input = document.getElementById('public-share-url');
    if (!input) return;
    input.select();
    input.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(input.value).then(() => {
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-check-lg me-1"></i> Copied!';
        btn.classList.add('btn-success');
        btn.classList.remove('btn-primary');
        setTimeout(() => {
            btn.innerHTML = orig;
            btn.classList.remove('btn-success');
            btn.classList.add('btn-primary');
        }, 2000);
    }).catch(() => {
        alert('Copied to clipboard: ' + input.value);
    });
}

function renderCollaborators() {
    const list = document.getElementById('collaborators-list');
    if (!list) return;
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
            <span>${escapeHtml(user.email)}</span>
            <button class="btn btn-sm text-danger d-inline-flex align-items-center justify-content-center p-1" onclick="removeCollaborator('${escapeHtml(user.id)}')" title="Remove collaborator" aria-label="Remove collaborator ${escapeHtml(user.email || user.name || '')}" style="min-width: 28px; min-height: 28px;">
                <i class="bi bi-person-x" aria-hidden="true"></i>
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
        const userRes = await fetch(`/api/auth.php?action=search&email=${encodeURIComponent(email)}`);
        if (!userRes.ok) throw new Error('User not found');
        const user = await userRes.json();

        // 2. Add to collaborators list
        const currentIds = currentJourney.collaborators || [];
        if (currentIds.includes(user.id)) {
            alert('User is already a collaborator.');
            return;
        }

        const updatedCollaborators = [...currentIds, user.id];

        const response = await fetch(`/api/journeys.php?id=${currentJourney.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ collaborators: updatedCollaborators })
        });
        if (!response.ok) throw new Error('Failed to add collaborator');
        const record = await response.json();

        currentJourney = record;
        emailInput.value = '';
        renderCollaborators();
        alert('Collaborator added!');

        // GTM Collaborator Add
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'collaborator_add' });
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

        const response = await fetch(`/api/journeys.php?id=${currentJourney.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ collaborators: updatedCollaborators })
        });
        if (!response.ok) throw new Error('Failed to remove collaborator');
        const record = await response.json();

        currentJourney = record;
        renderCollaborators();

        // GTM Collaborator Remove
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'collaborator_remove' });
    } catch (err) {
        console.error('Remove error:', err);
        alert('Error removing collaborator.');
    } finally {
        toggleLoading(false);
    }
}

/**
 * Exporters & Importers
 */
async function exportExecutivePDF() {
    if (!currentJourney && !window.currentJourney) return;
    const journey = currentJourney || window.currentJourney;
    const ojf = originalOJF || window.originalOJF || {};

    // GTM Custom Export Event
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: 'journey_export',
        export_format: 'executive_pdf'
    });

    const title = (document.getElementById('editor-title')?.value || journey.title || 'Untitled Journey').trim();
    const persona = (document.getElementById('editor-persona')?.value || ojf.persona || '').trim();
    const pov = (document.getElementById('editor-pov')?.value || ojf.pointOfView || '').trim();
    const notesEl = document.getElementById('editor-notes');
    const notes = (notesEl ? notesEl.value : (journey.notes || journey.description || ojf.notes || '')).trim();

    const stages = ojf.stages || [];
    const swimlanes = ojf.swimlanes || [];
    const nodes = ojf.nodes || [];

    // Calculate metrics
    const scoredNodes = nodes.filter(n => n.score !== undefined && n.score !== null && n.score !== '');
    let overallScoreText = '-';
    let overallSentimentText = 'Unscored';
    let overallSentimentColor = '#64748b';
    if (scoredNodes.length > 0) {
        const sum = scoredNodes.reduce((acc, n) => acc + Number(n.score), 0);
        const avg = sum / scoredNodes.length;
        const roundedAvg = Math.round(avg * 10) / 10;
        overallScoreText = `${roundedAvg > 0 ? '+' : ''}${roundedAvg}`;
        if (roundedAvg >= 2) {
            overallSentimentText = 'Positive';
            overallSentimentColor = '#16a34a';
        } else if (roundedAvg >= -2) {
            overallSentimentText = 'Mixed';
            overallSentimentColor = '#d97706';
        } else {
            overallSentimentText = 'High Friction';
            overallSentimentColor = '#dc2626';
        }
    }

    const motNodes = nodes.filter(n => n.isMomentOfTruth);
    const highSevCount = nodes.filter(n => n.severity === 'high').length;
    const medSevCount = nodes.filter(n => n.severity === 'medium').length;

    // Build the PDF report container
    const container = document.createElement('div');
    container.style.padding = '0';
    container.style.margin = '0';
    container.style.fontFamily = "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
    container.style.color = '#1e293b';
    container.style.background = '#ffffff';
    container.style.lineHeight = '1.45';

    const esc = (s) => (typeof escapeHtml === 'function' ? escapeHtml(s) : String(s || ''));

    // PAGE 1: COVER & EXECUTIVE SUMMARY
    let html = `
        <div style="page-break-after: always; padding: 25px 25px 35px 25px; box-sizing: border-box;">
            <!-- Top Brand Bar -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #6366f1; padding-bottom: 12px; margin-bottom: 24px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 800; font-size: 18px; color: #4338ca; letter-spacing: -0.02em;">PTOLEMY</span>
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; font-weight: 600; border-left: 1px solid #cbd5e1; padding-left: 8px;">Executive Journey Report</span>
                </div>
                <div style="font-size: 11px; color: #64748b;">
                    Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
            </div>

            <!-- Title & Context -->
            <h1 style="font-size: 26px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; line-height: 1.25;">
                ${esc(title)}
            </h1>

            <div style="margin-bottom: 22px;">
                ${persona ? `
                <div style="display: flex; margin-bottom: 6px; font-size: 13px;">
                    <span style="font-weight: 700; color: #475569; width: 110px; flex-shrink: 0; text-transform: uppercase; font-size: 11px; letter-spacing: 0.04em;">Persona:</span>
                    <span style="color: #0f172a; font-weight: 500;">${esc(persona)}</span>
                </div>` : ''}
                ${pov ? `
                <div style="display: flex; margin-bottom: 6px; font-size: 13px;">
                    <span style="font-weight: 700; color: #475569; width: 110px; flex-shrink: 0; text-transform: uppercase; font-size: 11px; letter-spacing: 0.04em;">Point of View:</span>
                    <span style="color: #0f172a; font-weight: 500;">${esc(pov)}</span>
                </div>` : ''}
                ${notes ? `
                <div style="display: flex; margin-bottom: 6px; font-size: 13px;">
                    <span style="font-weight: 700; color: #475569; width: 110px; flex-shrink: 0; text-transform: uppercase; font-size: 11px; letter-spacing: 0.04em; padding-top: 6px;">Notes:</span>
                    <div style="color: #334155; white-space: pre-wrap; font-size: 12.5px; line-height: 1.5; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; flex-grow: 1;">${esc(notes)}</div>
                </div>` : ''}
            </div>

            <!-- Executive KPI Cards Grid -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px;">
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center;">
                    <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 4px;">Experience Score</div>
                    <div style="font-size: 22px; font-weight: 800; color: ${overallSentimentColor};">${esc(overallScoreText)}</div>
                    <div style="font-size: 10px; font-weight: 600; color: ${overallSentimentColor}; text-transform: uppercase;">${esc(overallSentimentText)}</div>
                </div>
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center;">
                    <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 4px;">Journey Scope</div>
                    <div style="font-size: 22px; font-weight: 800; color: #0f172a;">${stages.length}</div>
                    <div style="font-size: 10px; color: #64748b;">Stages • ${nodes.length} Steps</div>
                </div>
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center;">
                    <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 4px;">Moments of Truth</div>
                    <div style="font-size: 22px; font-weight: 800; color: #d97706;">${motNodes.length}</div>
                    <div style="font-size: 10px; color: #64748b;">Critical Touchpoints</div>
                </div>
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center;">
                    <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 4px;">Friction Points</div>
                    <div style="font-size: 22px; font-weight: 800; color: #ef4444;">${highSevCount}</div>
                    <div style="font-size: 10px; color: #64748b;">High (${medSevCount} Medium)</div>
                </div>
            </div>

            <!-- Stage Progression Flowbar -->
            <div style="margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; letter-spacing: 0.05em; margin-bottom: 8px;">Journey Stages Progression</div>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                    ${stages.map((st, idx) => `
                        <div style="flex: 1; min-width: 85px; background: #f1f5f9; border-top: 3px solid #6366f1; border-radius: 4px; padding: 6px 8px;">
                            <div style="font-size: 9px; font-weight: 700; color: #6366f1; text-transform: uppercase;">Stage ${idx + 1}</div>
                            <div style="font-size: 11px; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${esc(st.name)}">${esc(st.name)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Key Moments of Truth Overview -->
            ${motNodes.length > 0 ? `
            <div style="margin-bottom: 20px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #d97706; letter-spacing: 0.05em; margin-bottom: 8px;">
                    Key Moments of Truth (Critical Touchpoints)
                </div>
                <div style="border: 1px solid #fde68a; border-radius: 8px; overflow: hidden; background: #fffbeb;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 11.5px;">
                        <thead>
                            <tr style="background: #fef3c7; border-bottom: 1px solid #fde68a; text-align: left;">
                                <th style="padding: 7px 10px; font-weight: 700; color: #92400e;">Step</th>
                                <th style="padding: 7px 10px; font-weight: 700; color: #92400e;">Stage</th>
                                <th style="padding: 7px 10px; font-weight: 700; color: #92400e;">Score</th>
                                <th style="padding: 7px 10px; font-weight: 700; color: #92400e;">Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${motNodes.map(node => {
                                const stName = stages.find(s => s.id === node.stageId)?.name || '-';
                                return `
                                    <tr style="border-bottom: 1px solid #fef3c7;">
                                        <td style="padding: 7px 10px; font-weight: 600; color: #0f172a;">${esc(node.title)}</td>
                                        <td style="padding: 7px 10px; color: #64748b;">${esc(stName)}</td>
                                        <td style="padding: 7px 10px; font-weight: 700; color: ${Number(node.score) >= 0 ? '#16a34a' : '#dc2626'};">
                                            ${node.score !== undefined && node.score !== null ? (Number(node.score) > 0 ? '+' : '') + node.score : '-'}
                                        </td>
                                        <td style="padding: 7px 10px; color: #475569; max-width: 260px;">${esc(node.description || '—')}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>` : ''}

            <div style="font-size: 10px; color: #94a3b8; text-align: right; margin-top: 15px;">
                Page 1 • Executive Summary
            </div>
        </div>
    `;

    // STAGE-BY-STAGE DEEP DIVE PAGES
    const getThreadHtml = (parentId) => {
        if (!window.currentComments) return '';
        const replies = window.currentComments.filter(c => c.parent === parentId);
        if (replies.length === 0) return '';
        return `
            <div style="margin-left: 15px; padding-left: 8px; border-left: 2px solid #e2e8f0; margin-top: 6px;">
                ${replies.map(r => `
                    <div style="margin-bottom: 4px; font-size: 11px;">
                        <strong style="color: #64748b;">${esc(r.expand?.user?.email || 'User')}:</strong>
                        <span style="color: #334155;">${esc(r.content)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    };

    stages.forEach((stage, stIdx) => {
        const stageNodes = nodes.filter(n => n.stageId === stage.id);
        const stageAvg = (() => {
            const sc = stageNodes.filter(n => n.score !== undefined && n.score !== null && n.score !== '');
            if (sc.length === 0) return null;
            return Math.round((sc.reduce((a, b) => a + Number(b.score), 0) / sc.length) * 10) / 10;
        })();

        html += `
            <div class="pdf-stage-block" style="page-break-before: always; padding: 25px 25px 35px 25px; box-sizing: border-box;">
                <!-- Stage Header Banner -->
                <div style="background: #f1f5f9; border-left: 6px solid #6366f1; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #6366f1; letter-spacing: 0.05em;">Stage ${stIdx + 1} of ${stages.length}</div>
                        <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 2px 0 0 0;">${esc(stage.name)}</h2>
                    </div>
                    <div style="text-align: right;">
                        ${stage.overrideEmotion !== undefined && stage.overrideEmotion !== null && stage.overrideEmotion !== '' ? `
                            <span style="background: #e0e7ff; color: #3730a3; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 700;">Emotion Override: ${Number(stage.overrideEmotion) > 0 ? '+' : ''}${stage.overrideEmotion}</span>
                        ` : (stageAvg !== null ? `
                            <span style="background: #ffffff; border: 1px solid #cbd5e1; color: #1e293b; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 700;">Stage Avg: ${stageAvg > 0 ? '+' : ''}${stageAvg}</span>
                        ` : '')}
                    </div>
                </div>
        `;

        if (stageNodes.length === 0) {
            html += `
                <div style="padding: 20px; text-align: center; color: #94a3b8; font-style: italic; background: #f8fafc; border-radius: 6px; border: 1px dashed #cbd5e1;">
                    No touchpoints recorded in this stage.
                </div>
            `;
        } else {
            swimlanes.forEach(swimlane => {
                const cellNodes = stageNodes.filter(n => n.swimlaneId === swimlane.id);
                if (cellNodes.length === 0) return;

                html += `
                    <div style="margin-bottom: 18px;">
                        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 10px;">
                            Swimlane: ${esc(swimlane.name)}
                        </div>
                `;

                cellNodes.forEach(node => {
                    const themeColor = (node.iconColor && node.iconColor !== '#ffffff' && node.iconColor !== 'transparent') ? node.iconColor : '#6366f1';
                    const bp = node.blueprint || {};
                    const hasBp = (bp.onstage?.length || bp.backstage?.length || bp.support?.length || bp.evidence?.length);

                    html += `
                        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-left: 5px solid ${node.isMomentOfTruth ? '#f59e0b' : themeColor}; border-radius: 8px; padding: 14px 16px; margin-bottom: 14px; page-break-inside: avoid; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
                            <!-- Top row: MOT badge, Title, Badges -->
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 6px;">
                                <div style="display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap;">
                                    <h4 style="margin: 0; font-size: 15px; font-weight: 700; color: #0f172a;">${esc(node.title)}</h4>
                                    ${node.isMomentOfTruth ? `
                                        <span style="background: #fef3c7; color: #92400e; border: 1px solid #fde68a; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px; text-transform: uppercase;">
                                            ★ Moment of Truth
                                        </span>
                                    ` : ''}
                                </div>
                                <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
                                    ${node.score !== undefined && node.score !== null && node.score !== '' ? `
                                        <span style="font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 12px; background: ${Number(node.score) > 0 ? '#dcfce7; color: #15803d' : Number(node.score) < 0 ? '#fee2e2; color: #b91c1c' : '#f1f5f9; color: #475569'};">
                                            Score: ${Number(node.score) > 0 ? '+' : ''}${node.score}
                                        </span>
                                    ` : ''}
                                    ${node.sentiment ? `
                                        <span style="font-size: 11px; padding: 2px 8px; border-radius: 12px; background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; text-transform: capitalize;">
                                            ${esc(node.sentiment)}
                                        </span>
                                    ` : ''}
                                    ${node.severity && node.severity !== 'low' ? `
                                        <span style="font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 12px; background: ${node.severity === 'high' ? '#fee2e2; color: #b91c1c' : '#fef3c7; color: #b45309'}; text-transform: uppercase;">
                                            ${esc(node.severity)}
                                        </span>
                                    ` : ''}
                                </div>
                            </div>

                            <!-- Full Description -->
                            ${node.description ? `
                                <div style="color: #334155; font-size: 13px; line-height: 1.5; margin: 8px 0;">
                                    ${esc(node.description)}
                                </div>
                            ` : ''}

                            <!-- Tags & Purpose -->
                            ${(node.purpose || (node.tags && node.tags.length > 0)) ? `
                                <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; font-size: 11px; color: #64748b;">
                                    ${node.purpose ? `<span style="background: #e2e8f0; padding: 1px 6px; border-radius: 4px;">Purpose: ${esc(node.purpose)}</span>` : ''}
                                    ${node.tags ? node.tags.map(t => `<span style="background: #f1f5f9; border: 1px solid #e2e8f0; padding: 1px 6px; border-radius: 4px;">#${esc(t)}</span>`).join('') : ''}
                                </div>
                            ` : ''}

                            <!-- Service Blueprint Details (if present) -->
                            ${hasBp ? `
                                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; margin-top: 10px; font-size: 12px;">
                                    <div style="font-weight: 700; color: #475569; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; margin-bottom: 6px;">Service Blueprint Architecture</div>
                                    ${bp.onstage && bp.onstage.length > 0 ? `
                                        <div style="margin-bottom: 4px;">
                                            <strong style="color: #2563eb;">Frontstage (Visible):</strong>
                                            ${bp.onstage.map(i => `${esc(i.actor || '') ? `<strong>${esc(i.actor)}:</strong> ` : ''}${esc(i.action || '')}`).join('; ')}
                                        </div>
                                    ` : ''}
                                    ${bp.backstage && bp.backstage.length > 0 ? `
                                        <div style="margin-bottom: 4px;">
                                            <strong style="color: #4b5563;">Backstage (Invisible):</strong>
                                            ${bp.backstage.map(i => `${esc(i.actor || '') ? `<strong>${esc(i.actor)}:</strong> ` : ''}${esc(i.action || '')}`).join('; ')}
                                        </div>
                                    ` : ''}
                                    ${bp.support && bp.support.length > 0 ? `
                                        <div style="margin-bottom: 4px;">
                                            <strong style="color: #7c3aed;">Support Systems:</strong>
                                            ${bp.support.map(i => `${esc(i.system || '') ? `<strong>${esc(i.system)}:</strong> ` : ''}${esc(i.description || '')}`).join('; ')}
                                        </div>
                                    ` : ''}
                                    ${bp.evidence && bp.evidence.length > 0 ? `
                                        <div style="margin-bottom: 4px;">
                                            <strong style="color: #059669;">Physical Evidence:</strong>
                                            ${bp.evidence.map(i => `${esc(i.item || '')} ${i.type ? `<span style="color: #64748b;">(${esc(i.type)})</span>` : ''}`).join('; ')}
                                        </div>
                                    ` : ''}
                                </div>
                            ` : ''}

                            <!-- Node Comments / Feedback (if present) -->
                            ${(() => {
                                if (!window.currentComments) return '';
                                const nodeComments = window.currentComments.filter(c => c.nodeId === node.id && !c.parent && !c.resolved);
                                if (nodeComments.length === 0) return '';
                                return `
                                    <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 11.5px;">
                                        <div style="font-weight: 700; color: #d97706; margin-bottom: 4px;">Stakeholder Feedback</div>
                                        ${nodeComments.map(c => `
                                            <div style="margin-bottom: 4px;">
                                                <strong style="color: #64748b;">${esc(c.expand?.user?.email || 'User')}:</strong>
                                                <span style="color: #1e293b;">${esc(c.content)}</span>
                                                ${getThreadHtml(c.id)}
                                            </div>
                                        `).join('')}
                                    </div>
                                `;
                            })()}
                        </div>
                    `;
                });

                html += `</div>`;
            });
        }

        html += `
            <div style="font-size: 10px; color: #94a3b8; text-align: right; margin-top: 15px;">
                Stage ${stIdx + 1} of ${stages.length} • Ptolemy Report
            </div>
        </div>`;
    });

    // General Insight & Comments section if present
    if (window.currentComments) {
        const generalComments = window.currentComments.filter(c => !c.nodeId && !c.parent && !c.resolved);
        if (generalComments.length > 0) {
            html += `
                <div style="page-break-before: always; padding: 25px 25px 35px 25px; box-sizing: border-box;">
                    <div style="background: #fef3c7; border-left: 6px solid #f59e0b; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px;">
                        <h2 style="font-size: 20px; font-weight: 700; color: #92400e; margin: 0;">General Insights & Feedback</h2>
                    </div>
                    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
                        ${generalComments.map(c => `
                            <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9;">
                                <strong style="font-size: 12px; color: #64748b;">${esc(c.expand?.user?.email || 'User')}:</strong>
                                <p style="font-size: 13px; color: #1e293b; margin: 4px 0;">${esc(c.content)}</p>
                                ${getThreadHtml(c.id)}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }

    container.innerHTML = html;

    toggleLoading(true);
    const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_');
    const opt = {
        margin: [10, 10, 10, 10],
        filename: `${cleanTitle}_Executive_Report.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
        await ensureHtml2Pdf();
        await html2pdf().set(opt).from(container).save();
    } catch (err) {
        console.error('Executive PDF Export error:', err);
        alert('Failed to generate Executive PDF Report: ' + err.message);
    } finally {
        toggleLoading(false);
    }
}

// Aliases for backward compatibility
function exportTextualPDF() {
    return exportExecutivePDF();
}

function exportToMarkdown() {
    if (!currentJourney) return;

    // GTM Custom Export Event
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: 'journey_export',
        export_format: 'markdown'
    });

    const title = document.getElementById('editor-title').value;
    const persona = document.getElementById('editor-persona').value;
    const pov = document.getElementById('editor-pov').value;
    const notesEl = document.getElementById('editor-notes');
    const notes = notesEl ? notesEl.value : (currentJourney.description || currentJourney.ojf_data?.notes || '');
    const stages = originalOJF.stages || [];
    const swimlanes = originalOJF.swimlanes || [];
    const nodes = originalOJF.nodes || [];

    let md = `# Journey Map: ${title}\n\n`;
    if (persona) md += `**Persona:** ${persona}\n`;
    if (pov) md += `**Point of View:** ${pov}\n`;
    if (notes) md += `**Notes:** ${notes}\n`;
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

    // GTM Custom Export Event
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: 'journey_export',
        export_format: 'ojf'
    });

    const notesEl = document.getElementById('editor-notes');
    const notesVal = notesEl ? notesEl.value : (originalOJF.notes || '');

    const exportData = {
        ...originalOJF,
        title: document.getElementById('editor-title').value,
        persona: document.getElementById('editor-persona').value,
        pointOfView: document.getElementById('editor-pov').value,
        notes: notesVal
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
    // GTM Custom Export Event
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: 'journey_export',
        export_format: 'png'
    });

    const wasTable = (activeEditorMode === 'table');
    if (wasTable) {
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
        await ensureHtml2Canvas();
        const canvas = await html2canvas(element, {
            scale: 2,
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
        if (wasTable) {
            switchEditorMode('table');
        }
        toggleLoading(false);
    }
}

async function exportToPDF() {
    return exportExecutivePDF();
}

async function importJourney(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);

            if (!data.stages || !data.swimlanes) {
                throw new Error('Invalid OJF format: missing stages or swimlanes.');
            }

            toggleLoading(true);

            const usedIds = new Set();
            if (data.nodes) {
                data.nodes = data.nodes.map(node => {
                    if (!node.id || usedIds.has(node.id)) {
                        const uid = (typeof generateUUID === 'function') ? generateUUID() : ((typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15));
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
            const record = await response.json();

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

async function importTemplate(url) {
    if (!confirm('This will create a new journey map in your account. Continue?')) {
        return;
    }

    toggleLoading(true);
    try {
        const fetchUrl = url.startsWith('/') ? url : '/' + url;
        const response = await fetch(fetchUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (!data.stages || !data.swimlanes) {
            throw new Error('Invalid OJF format in template.');
        }

        const usedIds = new Set();
        if (data.nodes) {
            data.nodes = data.nodes.map(node => {
                if (!node.id || usedIds.has(node.id)) {
                    const uid = (typeof generateUUID === 'function') ? generateUUID() : ((typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15));
                    node.id = 'n-' + uid;
                }
                usedIds.add(node.id);
                return node;
            });
        }

        const templateName = url.split('/').pop().replace('.ojf', '').replace(/-/g, ' ');
        const formattedTitle = templateName.replace(/\b\w/g, l => l.toUpperCase());

        const saveResponse = await fetch('/api/journeys.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: `Template: ${formattedTitle}`,
                description: "Imported from sample library.",
                journey_status: 'active',
                ojf_data: data
            })
        });
        if (!saveResponse.ok) {
            const errData = await saveResponse.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to import template');
        }
        const record = await saveResponse.json();

        alert('Template imported successfully!');
        window.location.href = `/journey/${record.id}/`;
    } catch (err) {
        console.error('Template import error:', err);
        alert('Failed to import template: ' + err.message);

        // GTM Template Import Error
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            event: 'app_error',
            error_context: 'import_template',
            error_message: err.message
        });
    } finally {
        toggleLoading(false);
    }
}
window.importTemplate = importTemplate;
window.importJourney = importJourney;

// Standalone Editor Initialization
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof INITIAL_JOURNEY_ID !== 'undefined' && INITIAL_JOURNEY_ID) {
        const mode = (typeof INITIAL_EDITOR_MODE !== 'undefined' && INITIAL_EDITOR_MODE) ? INITIAL_EDITOR_MODE : 'table';
        await loadEditorJourney(INITIAL_JOURNEY_ID, mode);
    }
});

async function loadEditorJourney(id, initialMode = 'table') {
    toggleLoading(true);
    try {
        let record = null;
        if (window.currentJourney && String(window.currentJourney.id) === String(id)) {
            record = window.currentJourney;
        } else {
            const response = await fetch(`/api/journeys.php?id=${id}`);
            if (!response.ok) throw new Error('Failed to load journey');
            record = await response.json();
        }
        currentJourney = record;
        window.currentJourney = record;

        const titleEl = document.getElementById('editor-title');
        if (titleEl) titleEl.value = currentJourney.title;

        const personaEl = document.getElementById('editor-persona');
        if (personaEl) personaEl.value = currentJourney.ojf_data?.persona || '';

        const povEl = document.getElementById('editor-pov');
        if (povEl) povEl.value = currentJourney.ojf_data?.pointOfView || '';

        originalOJF = JSON.parse(JSON.stringify(currentJourney.ojf_data || {}));
        if (!originalOJF.nodes) originalOJF.nodes = [];
        window.originalOJF = originalOJF;

        sanitizeOJFIds(originalOJF);

        activeEditorMode = initialMode;
        window.activeEditorMode = initialMode;
        const modeRadio = document.getElementById(`mode-${initialMode}`);
        if (modeRadio) modeRadio.checked = true;
        switchEditorMode(initialMode);
        updatePrivacyUI();

        if (typeof loadComments === 'function') {
            loadComments();
        }

        const notesEl = document.getElementById('editor-notes');
        if (notesEl) {
            notesEl.value = currentJourney.notes || currentJourney.description || currentJourney.ojf_data?.notes || '';
            const resizeNotes = () => {
                notesEl.style.height = 'auto';
                notesEl.style.height = notesEl.scrollHeight + 'px';
            };
            resizeNotes();
            if (!notesEl.dataset.bound) {
                notesEl.dataset.bound = 'true';
                notesEl.addEventListener('input', () => {
                    resizeNotes();
                    triggerAutoSave();
                });
            }
        }

        if (titleEl && !titleEl.dataset.bound) {
            titleEl.dataset.bound = 'true';
            titleEl.addEventListener('input', () => triggerAutoSave());
        }
        if (personaEl && !personaEl.dataset.bound) {
            personaEl.dataset.bound = 'true';
            personaEl.addEventListener('input', () => triggerAutoSave());
        }
        if (povEl && !povEl.dataset.bound) {
            povEl.dataset.bound = 'true';
            povEl.addEventListener('input', () => triggerAutoSave());
        }

    } catch (err) {
        console.error('Failed to load journey:', err);
        alert('Failed to load journey map: ' + err.message);
        window.location.href = '/dashboard/';
    } finally {
        toggleLoading(false);
    }
}
