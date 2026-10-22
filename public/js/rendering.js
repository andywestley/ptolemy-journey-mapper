/**
 * Ptolemy Visual Map Layout and Emotional Curve Rendering
 */

function renderVisualMap() {
    const grid = document.getElementById('map-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const stages = originalOJF.stages || [];
    const swimlanes = originalOJF.swimlanes || [];
    const nodes = originalOJF.nodes || [];
    const isReadOnly = !!window.isReadOnly;

    // Check for empty journey state on visual map
    if (nodes.length === 0) {
        grid.style.display = 'block';
        grid.style.gridTemplateColumns = 'none';
        grid.innerHTML = `
            <div class="visual-map-empty-state text-center p-5 my-3 border rounded-4 bg-white shadow-sm" style="max-width: 600px; margin: 0 auto;">
                <div class="mb-3">
                    <i class="bi bi-diagram-3 text-primary" style="font-size: 3rem;" aria-hidden="true"></i>
                </div>
                <h2 class="h4 fw-bold mb-2 text-dark">No Journey Steps Yet</h2>
                <p class="text-muted mb-4" style="font-size: 0.95rem; line-height: 1.6;">
                    Your journey map doesn't have any steps yet. Get started by defining phases and adding steps in the Table Editor, or create your first step right here.
                </p>
                <div class="d-flex justify-content-center gap-3 flex-wrap">
                    <button type="button" class="btn btn-primary px-4 py-2 fw-semibold" onclick="switchEditorMode('table')">
                        <i class="bi bi-table me-2" aria-hidden="true"></i>Open Table Editor
                    </button>
                    ${!isReadOnly ? `
                    <button type="button" class="btn btn-outline-primary px-4 py-2 fw-semibold" onclick="openNodeModal(null, (originalOJF.stages[0] || {}).id, (originalOJF.swimlanes[0] || {}).id)">
                        <i class="bi bi-plus-circle me-2" aria-hidden="true"></i>Add First Step
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
        const svg = document.getElementById('emotional-curve-svg');
        if (svg) svg.innerHTML = '';
        updateScorecard();
        return;
    } else {
        grid.style.display = 'grid';
    }

    // Define grid structure
    // Column 1 is for Swimlanes (200px), others for Stages (300px), last for Add Stage (50px, if editable)
    if (isReadOnly) {
        grid.style.gridTemplateColumns = `200px repeat(${stages.length}, 300px)`;
    } else {
        grid.style.gridTemplateColumns = `200px repeat(${stages.length}, 300px) 50px`;
    }

    // 1. Top-Left spacer
    const spacer = document.createElement('div');
    spacer.className = 'grid-header-empty';
    grid.appendChild(spacer);

    // 2. Stage Headers (Top Row)
    stages.forEach((stage, idx) => {
        const head = document.createElement('div');
        head.className = 'grid-header-stage';
        if (isReadOnly) {
            head.innerHTML = `<span class="editable-header-text fw-bold ugc" data-ugc="true" data-audit-ignore="content">${escapeHtml(stage.name)}</span>`;
        } else {
            head.innerHTML = `<span contenteditable="true" class="editable-header-text ugc" data-ugc="true" data-audit-ignore="content" onblur="updateStageNameFromVisual(${idx}, this.innerText)">${escapeHtml(stage.name)}</span>`;
        }
        grid.appendChild(head);
    });

    // 2b. Add Stage Button Header (only if editable)
    if (!isReadOnly) {
        const addStageHead = document.createElement('div');
        addStageHead.className = 'grid-header-stage-add';
        addStageHead.innerHTML = '<i class="bi bi-plus-lg"></i>';
        addStageHead.title = "Add Stage";
        addStageHead.onclick = () => addStage();
        grid.appendChild(addStageHead);
    }

    // 2c. Sentiment Row (Dedicated space for curve)
    const toggleCurve = document.getElementById('toggle-emotional-curve');
    const showEmotionalCurve = toggleCurve ? toggleCurve.checked : true;

    if (showEmotionalCurve) {
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

        if (!isReadOnly) {
            const sentimentEndSpacer = document.createElement('div');
            sentimentEndSpacer.className = 'grid-cell-empty';
            grid.appendChild(sentimentEndSpacer);
        }
    }

    // 3. Rows
    let firstCardFound = false;
    swimlanes.forEach((swimlane, idx) => {
        // Swimlane Header (Left Column)
        const sHead = document.createElement('div');
        sHead.className = 'grid-header-swimlane';
        if (isReadOnly) {
            sHead.innerHTML = `<span class="editable-header-text fw-bold ugc" data-ugc="true" data-audit-ignore="content">${escapeHtml(swimlane.name)}</span>`;
        } else {
            sHead.innerHTML = `<span contenteditable="true" class="editable-header-text ugc" data-ugc="true" data-audit-ignore="content" onblur="updateSwimlaneNameFromVisual(${idx}, this.innerText)">${escapeHtml(swimlane.name)}</span>`;
        }
        grid.appendChild(sHead);

        // Grid Cells for this row
        stages.forEach(stage => {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.stageId = stage.id;
            cell.dataset.swimlaneId = swimlane.id;

            // Drag & Drop for Cell (editable only)
            if (!isReadOnly) {
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
            }

            // Find nodes for this intersection
            const cellNodes = nodes.filter(n => n.stageId === stage.id && n.swimlaneId === swimlane.id);

            cellNodes.forEach(node => {
                const card = document.createElement('div');
                card.className = 'node-card node-body ugc';
                card.setAttribute('data-ugc', 'true');
                card.setAttribute('data-audit-ignore', 'content');
                card.dataset.nodeId = node.id;
                card.dataset.nodeTitle = node.title || 'Untitled Node';
                if (node.isMomentOfTruth) card.classList.add('moment-of-truth');

                // Roving tabindex: exactly one card in the grid has tabindex="0"
                const isActive = window.lastFocusedNodeId 
                    ? (node.id === window.lastFocusedNodeId) 
                    : !firstCardFound;
                if (isActive) firstCardFound = true;
                card.setAttribute('tabindex', isActive ? '0' : '-1');
                card.setAttribute('role', 'button');
                card.setAttribute('aria-label', `${node.title || 'Step'}. Use arrow keys to navigate steps, Enter to inspect details`);
                if (!isReadOnly) {
                    card.setAttribute('draggable', 'true');
                    card.ondragstart = (e) => handleNodeDragStart(e, node.id);
                }
                card.onclick = (e) => {
                    if (window.feedbackMode) return;
                    window.lastFocusedNodeId = node.id;
                    openNodeModal(node.id);
                };
                card.addEventListener('focus', () => {
                    window.lastFocusedNodeId = node.id;
                    const allCards = grid.querySelectorAll('.node-card');
                    allCards.forEach(c => {
                        if (c !== card) c.setAttribute('tabindex', '-1');
                    });
                    card.setAttribute('tabindex', '0');
                });
                card.onkeydown = (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (window.feedbackMode) return;
                        window.lastFocusedNodeId = node.id;
                        openNodeModal(node.id);
                        return;
                    }

                    const allCards = Array.from(grid.querySelectorAll('.node-card'));
                    const currentIdx = allCards.indexOf(card);
                    if (currentIdx === -1) return;

                    let targetCard = null;
                    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                        e.preventDefault();
                        targetCard = allCards[(currentIdx + 1) % allCards.length];
                    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                        e.preventDefault();
                        targetCard = allCards[(currentIdx - 1 + allCards.length) % allCards.length];
                    } else if (e.key === 'Home') {
                        e.preventDefault();
                        targetCard = allCards[0];
                    } else if (e.key === 'End') {
                        e.preventDefault();
                        targetCard = allCards[allCards.length - 1];
                    }

                    if (targetCard) {
                        allCards.forEach(c => c.setAttribute('tabindex', '-1'));
                        targetCard.setAttribute('tabindex', '0');
                        targetCard.focus();
                        window.lastFocusedNodeId = targetCard.dataset.nodeId;
                    }
                };

                // Emotional Score pill
                let scoreHTML = '';
                if (node.score !== undefined && node.score !== null && node.score !== '') {
                    const val = Number(node.score);
                    const pillClass = val > 0 ? 'score-pill-pos' : val < 0 ? 'score-pill-neg' : 'score-pill-zero';
                    scoreHTML = `<span class="score-pill ${pillClass}" title="Score: ${val}">${val > 0 ? '+' : ''}${val}</span>`;
                }

                // Sentiment badge (prominent badge with icon and label)
                let sentimentHTML = '';
                if (node.sentiment) {
                    const iconName = SENTIMENT_ICONS[node.sentiment] || 'emoji-smile';
                    const sLower = String(node.sentiment).toLowerCase();
                    const isNeg = ['negative', 'angry', 'frustrated'].includes(sLower);
                    const isAnx = ['anxious', 'confused', 'bored'].includes(sLower);
                    const isPos = ['positive', 'delighted', 'relieved', 'satisfied'].includes(sLower);
                    const toneClass = isNeg ? 'node-badge-neg' : isAnx ? 'node-badge-warn' : isPos ? 'node-badge-pos' : 'node-badge-neutral';
                    sentimentHTML = `<span class="node-meta-badge ${toneClass}" title="Sentiment: ${escapeHtml(node.sentiment)}"><i class="bi bi-${iconName} me-1" aria-hidden="true"></i>${escapeHtml(node.sentiment)}</span>`;
                }

                // Purpose badge (prominent badge with icon and label)
                let purposeHTML = '';
                if (node.purpose) {
                    const pIconName = PURPOSE_ICONS[node.purpose] || 'tag';
                    const cleanPurpose = String(node.purpose).replace(/-/g, ' ');
                    purposeHTML = `<span class="node-meta-badge node-badge-purpose" title="Purpose: ${escapeHtml(cleanPurpose)}"><i class="bi bi-${pIconName} me-1" aria-hidden="true"></i>${escapeHtml(cleanPurpose)}</span>`;
                }

                // Severity badge (explicit badge so color conveys clear meaning)
                let severityHTML = '';
                if (node.severity === 'high') {
                    severityHTML = `<span class="node-meta-badge node-badge-neg" title="Severity: High"><i class="bi bi-exclamation-triangle-fill me-1" aria-hidden="true"></i>High</span>`;
                } else if (node.severity === 'medium') {
                    severityHTML = `<span class="node-meta-badge node-badge-warn" title="Severity: Medium"><i class="bi bi-exclamation-circle-fill me-1" aria-hidden="true"></i>Medium</span>`;
                }

                // Theme color and pre-determined contrast
                const hasCustomColor = !!(node.iconColor && node.iconColor !== '#ffffff' && node.iconColor !== 'transparent');
                const headerBg = hasCustomColor ? node.iconColor : '#f1f5f9';
                const headerText = hasCustomColor ? (typeof getContrastColor === 'function' ? getContrastColor(node.iconColor) : '#ffffff') : '#1e293b';

                card.innerHTML = `
                    <div class="node-card-header" style="background-color: ${headerBg}; color: ${headerText};">
                        <div class="d-flex justify-content-between align-items-start gap-2">
                            <span class="node-card-title ugc" data-ugc="true" data-audit-ignore="content">${escapeHtml(node.title)}</span>
                            ${node.isMomentOfTruth ? `<span class="badge bg-warning text-dark border-0 py-1 px-2 d-inline-flex align-items-center flex-shrink-0" style="font-size: 0.65rem;" title="Key Moment of Truth"><i class="bi bi-star-fill me-1" aria-hidden="true"></i>Moment of Truth</span>` : ''}
                        </div>
                    </div>
                    <div class="node-card-body node-body ugc" data-ugc="true" data-audit-ignore="content">
                        ${node.description ? `<p class="node-card-desc mb-2 ugc" data-ugc="true" data-audit-ignore="content">${escapeHtml(node.description)}</p>` : ''}
                        <div class="node-card-footer mt-auto pt-2 d-flex justify-content-between align-items-center flex-wrap gap-1">
                            <div class="d-flex align-items-center flex-wrap gap-1">
                                ${sentimentHTML}
                                ${purposeHTML}
                                ${severityHTML}
                            </div>
                            ${scoreHTML}
                        </div>
                    </div>
                `;

                cell.appendChild(card);
            });

            grid.appendChild(cell);
        });

        // 3b. Empty cell at end of row (below Add Stage button, only if editable)
        if (!isReadOnly) {
            const rowEndSpacer = document.createElement('div');
            rowEndSpacer.className = 'grid-cell-empty';
            grid.appendChild(rowEndSpacer);
        }
    });

    // 4. Add Swimlane Row (Bottom, only if editable)
    if (!isReadOnly) {
        const addLaneHead = document.createElement('div');
        addLaneHead.className = 'grid-header-swimlane-add';
        addLaneHead.innerHTML = '<i class="bi bi-plus-lg"></i>';
        addLaneHead.title = "Add Swimlane";
        addLaneHead.onclick = () => addSwimlane();
        grid.appendChild(addLaneHead);

        for (let i = 0; i < stages.length + 1; i++) {
            const bottomSpacer = document.createElement('div');
            bottomSpacer.className = 'grid-cell-empty';
            grid.appendChild(bottomSpacer);
        }
    }

    // Ensure at least one card in the grid has tabindex="0" if nodes exist
    const allRenderedCards = grid.querySelectorAll('.node-card');
    if (allRenderedCards.length > 0) {
        const hasActive = Array.from(allRenderedCards).some(c => c.getAttribute('tabindex') === '0');
        if (!hasActive) {
            allRenderedCards[0].setAttribute('tabindex', '0');
        }
    }

    updateScorecard();
    // setTimeout to ensure DOM has fully painted the cards so bounding rects work
    setTimeout(() => {
        drawEmotionalCurve();
        if (blueprintMode) {
            renderBlueprintLayers();
        }
    }, 0);
}

/**
 * Service Blueprint Rendering (Dynamic Layers)
 */
function toggleBlueprintMode() {
    blueprintMode = document.getElementById('toggle-blueprint-mode').checked;
    
    // GTM Blueprint Toggle
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: 'toggle_blueprint_mode',
        enabled: blueprintMode
    });

    renderVisualMap();
}

/**
 * Emotional Curve Toggle (toggles entire sentiment row & curve)
 */
function toggleEmotionalCurve() {
    const toggle = document.getElementById('toggle-emotional-curve');
    const enabled = toggle ? toggle.checked : true;
    
    // GTM Emotional Curve Toggle
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: 'toggle_emotional_curve',
        enabled: enabled
    });

    renderVisualMap();
}
window.toggleEmotionalCurve = toggleEmotionalCurve;

function renderBlueprintLayers() {
    const grid = document.getElementById('map-grid');
    const stages = originalOJF.stages || [];
    const nodes = originalOJF.nodes || [];

    // Define Blueprint Swimlanes
    const bpLanes = [
        { id: 'bp-evidence', name: 'Physical Evidence', type: 'evidence' },
        { id: 'bp-onstage', name: 'Frontstage (Visible)', type: 'onstage' },
        { id: 'bp-backstage', name: 'Backstage (Invisible)', type: 'backstage' },
        { id: 'bp-support', name: 'Support Processes', type: 'support' }
    ];

    bpLanes.forEach(lane => {
        // Line of Visibility / Interaction indicators (via CSS classes)
        const rowClass = `bp-row-${lane.type}`;
        
        // Lane Header
        const head = document.createElement('div');
        head.className = `grid-header-swimlane bp-lane-header ${rowClass}`;
        head.innerHTML = `<span>${lane.name}</span>`;
        grid.appendChild(head);

        // Cells per stage
        stages.forEach(stage => {
            const cell = document.createElement('div');
            cell.className = `grid-cell bp-cell ${rowClass}`;
            
            // Find all nodes in this stage that have blueprint data for this lane type
            const stageNodes = nodes.filter(n => n.stageId === stage.id && n.blueprint && n.blueprint[lane.type] && n.blueprint[lane.type].length > 0);
            
            stageNodes.forEach(node => {
                node.blueprint[lane.type].forEach(item => {
                    const el = document.createElement('div');
                    el.className = 'bp-item-card ugc';
                    el.setAttribute('data-ugc', 'true');
                    el.setAttribute('data-audit-ignore', 'content');
                    
                    let content = '';
                    if (lane.type === 'evidence') content = `<strong>${escapeHtml(item.item)}</strong> <small class="text-muted">(${escapeHtml(item.type)})</small>`;
                    else if (lane.type === 'support') content = `<strong>${escapeHtml(item.system)}</strong>: ${escapeHtml(item.description)}`;
                    else content = `<strong>${escapeHtml(item.actor)}</strong>: ${escapeHtml(item.action)}`;
                    
                    el.innerHTML = content;
                    el.title = `From: ${escapeHtml(node.title)}`;
                    cell.appendChild(el);
                });
            });

            grid.appendChild(cell);
        });

        // End spacer
        const spacer = document.createElement('div');
        spacer.className = 'grid-cell-empty';
        grid.appendChild(spacer);
    });
}

/**
 * Editor Table Rendering
 */
function renderEditorTables() {
    const stagesBody = document.getElementById('stages-body');
    const swimlanesBody = document.getElementById('swimlanes-body');

    if (stagesBody) stagesBody.innerHTML = '';
    if (swimlanesBody) swimlanesBody.innerHTML = '';

    (originalOJF.stages || []).forEach((stage, idx) => {
        const tr = document.createElement('tr');
        tr.className = 'ugc';
        tr.setAttribute('data-ugc', 'true');
        tr.setAttribute('data-audit-ignore', 'content');
        tr.innerHTML = `
            <td class="text-muted small">${escapeHtml(stage.id)}</td>
            <td class="ugc" data-ugc="true" data-audit-ignore="content"><input type="text" class="w-100 ugc" data-ugc="true" data-audit-ignore="content" value="${escapeHtml(stage.name)}" onchange="updateStage(${idx}, this.value)" aria-label="Stage name for ${escapeHtml(stage.id)}"></td>
            <td><input type="number" class="w-100" min="-5" max="5" value="${escapeHtml(stage.overrideEmotion || '')}" onchange="updateStageEmotionOverride(${idx}, this.value)" placeholder="auto" aria-label="Override emotion for ${escapeHtml(stage.id)}"></td>
            <td><button class="btn btn-sm text-danger d-inline-flex align-items-center justify-content-center p-1" onclick="removeStage(${idx})" title="Remove stage" aria-label="Remove stage ${escapeHtml(stage.name || stage.id)}" style="min-width: 28px; min-height: 28px;"><i class="bi bi-trash" aria-hidden="true"></i></button></td>
        `;
        if (stagesBody) stagesBody.appendChild(tr);
    });

    (originalOJF.swimlanes || []).forEach((lane, idx) => {
        const tr = document.createElement('tr');
        tr.className = 'ugc';
        tr.setAttribute('data-ugc', 'true');
        tr.setAttribute('data-audit-ignore', 'content');
        tr.innerHTML = `
            <td class="text-muted small">${escapeHtml(lane.id)}</td>
            <td class="ugc" data-ugc="true" data-audit-ignore="content"><input type="text" class="w-100 ugc" data-ugc="true" data-audit-ignore="content" value="${escapeHtml(lane.name)}" onchange="updateSwimlane(${idx}, this.value)" aria-label="Swimlane name for ${escapeHtml(lane.id)}"></td>
            <td><button class="btn btn-sm text-danger d-inline-flex align-items-center justify-content-center p-1" onclick="removeSwimlane(${idx})" title="Remove swimlane" aria-label="Remove swimlane ${escapeHtml(lane.name || lane.id)}" style="min-width: 28px; min-height: 28px;"><i class="bi bi-trash" aria-hidden="true"></i></button></td>
        `;
        if (swimlanesBody) swimlanesBody.appendChild(tr);
    });

    // Render Nodes Table
    const nodesBody = document.getElementById('nodes-body');
    if (nodesBody) nodesBody.innerHTML = '';
    (originalOJF.nodes || []).forEach((node) => {
        const stage = originalOJF.stages.find(s => s.id === node.stageId)?.name || 'Unknown';
        const lane = originalOJF.swimlanes.find(l => l.id === node.swimlaneId)?.name || 'Unknown';

        const displayIcon = node.icon || SENTIMENT_ICONS[node.sentiment] || PURPOSE_ICONS[node.purpose];

        const tr = document.createElement('tr');
        tr.className = 'ugc';
        tr.setAttribute('data-ugc', 'true');
        tr.setAttribute('data-audit-ignore', 'content');
        tr.style.backgroundColor = node.iconColor || 'transparent';
        if (node.iconColor && node.iconColor !== '#ffffff' && node.iconColor !== 'transparent') {
            tr.classList.add('table-row-themed');
        }
        tr.innerHTML = `
            <td class="fw-bold ugc" data-ugc="true" data-audit-ignore="content">
                ${displayIcon ? `<i class="bi bi-${escapeHtml(displayIcon)} me-1"></i>` : ''}
                <span class="ugc" data-ugc="true" data-audit-ignore="content">${escapeHtml(node.title || '')}</span>
                ${node.isMomentOfTruth ? '<span class="badge bg-warning text-dark ms-1" style="font-size: 0.6rem;">MT</span>' : ''}
                ${node.description ? `<div class="small text-muted fw-normal mt-1 ugc" data-ugc="true" data-audit-ignore="content">${escapeHtml(node.description)}</div>` : ''}
            </td>
            <td class="ugc" data-ugc="true" data-audit-ignore="content"><span class="badge bg-light text-dark ugc" data-ugc="true" data-audit-ignore="content">${escapeHtml(stage)}</span></td>
            <td class="ugc" data-ugc="true" data-audit-ignore="content"><span class="badge bg-light text-dark ugc" data-ugc="true" data-audit-ignore="content">${escapeHtml(lane)}</span></td>
            <td>
                <span class="badge node-severity-${escapeHtml(node.severity || 'low')} border">${escapeHtml(node.severity || 'low')}</span>
                ${(node.score !== undefined && node.score !== null && node.score !== '') ? `<span class="badge bg-light text-muted border ms-1">Emotion: ${escapeHtml(node.score)}</span>` : ''}
            </td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-secondary me-1 d-inline-flex align-items-center justify-content-center" onclick="openNodeModal('${escapeHtml(node.id)}')" title="Edit step" aria-label="Edit step ${escapeHtml(node.title || node.id)}" style="min-width: 28px; min-height: 28px;"><i class="bi bi-pencil" aria-hidden="true"></i></button>
                <button class="btn btn-sm btn-outline-danger d-inline-flex align-items-center justify-content-center" data-bs-toggle="modal" data-bs-target="#deleteNodeConfirmModal" aria-haspopup="dialog" onclick="deleteNode('${escapeHtml(node.id)}')" title="Delete step" aria-label="Delete step ${escapeHtml(node.title || node.id)}" style="min-width: 28px; min-height: 28px;"><i class="bi bi-trash" aria-hidden="true"></i></button>
            </td>
        `;
        if (nodesBody) nodesBody.appendChild(tr);
    });

    updateScorecard();
}

/**
 * Scorecard updates
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

/**
 * Emotional Curve Generation
 */
function drawEmotionalCurve() {
    // Ensure we are in visual map mode before attempting to draw
    const visualView = document.getElementById('visual-map-view');
    if (!visualView || visualView.style.display === 'none') return;

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
        return;
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
    const visualView = document.getElementById('visual-map-view');
    if (visualView && visualView.style.display !== 'none') {
        drawEmotionalCurve();
    }
});
