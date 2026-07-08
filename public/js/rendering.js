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
                
                // Blueprint Indicator
                const hasBlueprint = node.blueprint && (
                    (node.blueprint.onstage?.length > 0) || 
                    (node.blueprint.backstage?.length > 0) || 
                    (node.blueprint.support?.length > 0) || 
                    (node.blueprint.evidence?.length > 0)
                );
                if (hasBlueprint) {
                    cardHTML += `<span class="blueprint-indicator" title="Service Blueprint details available"><i class="bi bi-diagram-3"></i></span>`;
                }

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
                    el.className = 'bp-item-card';
                    
                    let content = '';
                    if (lane.type === 'evidence') content = `<strong>${item.item}</strong> <small class="text-muted">(${item.type})</small>`;
                    else if (lane.type === 'support') content = `<strong>${item.system}</strong>: ${item.description}`;
                    else content = `<strong>${item.actor}</strong>: ${item.action}`;
                    
                    el.innerHTML = content;
                    el.title = `From: ${node.title}`;
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
        tr.innerHTML = `
            <td class="text-muted small">${stage.id}</td>
            <td><input type="text" class="w-100" value="${stage.name}" onchange="updateStage(${idx}, this.value)"></td>
            <td><input type="number" class="w-100" min="-5" max="5" value="${stage.overrideEmotion || ''}" onchange="updateStageEmotionOverride(${idx}, this.value)" placeholder="auto"></td>
            <td><button class="btn btn-sm text-danger" onclick="removeStage(${idx})"><i class="bi bi-trash"></i></button></td>
        `;
        if (stagesBody) stagesBody.appendChild(tr);
    });

    (originalOJF.swimlanes || []).forEach((lane, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="text-muted small">${lane.id}</td>
            <td><input type="text" class="w-100" value="${lane.name}" onchange="updateSwimlane(${idx}, this.value)"></td>
            <td><button class="btn btn-sm text-danger" onclick="removeSwimlane(${idx})"><i class="bi bi-trash"></i></button></td>
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
