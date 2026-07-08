/**
 * Ptolemy Workspace Actions & Editor Controllers (Stages, Swimlanes, Nodes, Exporters)
 */

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
        const updatedData = {
            title: document.getElementById('editor-title').value,
            ojf_data: {
                ...originalOJF,
                persona: document.getElementById('editor-persona').value,
                pointOfView: document.getElementById('editor-pov').value
            }
        };
        const response = await fetch(`api/journeys.php?id=${currentJourney.id}`, {
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
                <input type="text" class="form-control form-control-sm" placeholder="Evidence item" value="${item.item || ''}" data-field="item">
                <input type="text" class="form-control form-control-sm" placeholder="Type" value="${item.type || ''}" data-field="type">
            `;
        } else if (type === 'support') {
            div.innerHTML = `
                <input type="text" class="form-control form-control-sm" placeholder="System/Dept" value="${item.system || ''}" data-field="system">
                <input type="text" class="form-control form-control-sm" placeholder="Description" value="${item.description || ''}" data-field="description">
            `;
        } else {
            div.innerHTML = `
                <input type="text" class="form-control form-control-sm" placeholder="Actor" value="${item.actor || ''}" data-field="actor">
                <input type="text" class="form-control form-control-sm" placeholder="Action" value="${item.action || ''}" data-field="action">
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
            tags,
            blueprint
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

/**
 * Journey save
 */
async function saveJourney() {
    if (!currentJourney) return;
    toggleLoading(true);

    const updatedData = {
        title: document.getElementById('editor-title').value,
        ojf_data: originalOJF
    };

    try {
        const response = await fetch(`api/journeys.php?id=${currentJourney.id}`, {
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
 * Collaboration Actions
 */
function openShareModal() {
    if (!currentJourney) return;
    renderCollaborators();
    const modal = new bootstrap.Modal(document.getElementById('shareModal'));
    modal.show();
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
        const userRes = await fetch(`api/auth.php?action=search&email=${encodeURIComponent(email)}`);
        if (!userRes.ok) throw new Error('User not found');
        const user = await userRes.json();

        // 2. Add to collaborators list
        const currentIds = currentJourney.collaborators || [];
        if (currentIds.includes(user.id)) {
            alert('User is already a collaborator.');
            return;
        }

        const updatedCollaborators = [...currentIds, user.id];

        const response = await fetch(`api/journeys.php?id=${currentJourney.id}`, {
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

        const response = await fetch(`api/journeys.php?id=${currentJourney.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ collaborators: updatedCollaborators })
        });
        if (!response.ok) throw new Error('Failed to remove collaborator');
        const record = await response.json();

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
 * Exporters & Importers
 */
async function exportTextualPDF() {
    if (!currentJourney) return;

    // GTM Custom Export Event
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: 'journey_export',
        export_format: 'textual_pdf'
    });

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

    // GTM Custom Export Event
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: 'journey_export',
        export_format: 'markdown'
    });

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

    // GTM Custom Export Event
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: 'journey_export',
        export_format: 'ojf'
    });

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
    // GTM Custom Export Event
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: 'journey_export',
        export_format: 'png'
    });

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
            document.getElementById('mode-table').checked = true;
            switchEditorMode('table');
        }
        toggleLoading(false);
    }
}

async function exportToPDF() {
    // GTM Custom Export Event
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: 'journey_export',
        export_format: 'visual_pdf'
    });

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

            if (!data.stages || !data.swimlanes) {
                throw new Error('Invalid OJF format: missing stages or swimlanes.');
            }

            toggleLoading(true);

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
            const response = await fetch('api/journeys.php', {
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

        if (!data.stages || !data.swimlanes) {
            throw new Error('Invalid OJF format in template.');
        }

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
        const formattedTitle = templateName.replace(/\b\w/g, l => l.toUpperCase());

        const saveResponse = await fetch('api/journeys.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: `Template: ${formattedTitle}`,
                description: "Imported from sample library.",
                journey_status: 'active',
                ojf_data: data
            })
        });
        if (!saveResponse.ok) throw new Error('Failed to import template');
        const record = await saveResponse.json();

        alert('Template imported successfully!');
        openEditor(record.id);
    } catch (err) {
        console.error('Template import error:', err);
        alert('Failed to import template: ' + err.message);
    } finally {
        toggleLoading(false);
    }
}
