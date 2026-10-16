/**
 * Public Journey Map Viewer Controller (Read-Only)
 */

activeEditorMode = 'visual';
window.activeEditorMode = activeEditorMode;
let blueprintMode = false;

document.addEventListener('DOMContentLoaded', () => {
    if (!window.currentJourney || !window.originalOJF) return;

    // Check initial mode from button or radio selection
    const tableEl = document.getElementById('mode-table');
    const isTable = tableEl ? (tableEl.classList.contains('active') || !!tableEl.checked) : false;
    activeEditorMode = isTable ? 'table' : 'visual';

    if (activeEditorMode === 'visual') {
        renderVisualMap();
    } else {
        renderPublicTable();
    }

    calculateJourneyScorecard();
});

/**
 * Public Read-Only Node Inspection Modal
 */
function openNodeModal(nodeId) {
    if (!window.originalOJF || !window.originalOJF.nodes) return;
    const node = window.originalOJF.nodes.find(n => n.id === nodeId);
    if (!node) return;

    const stage = window.originalOJF.stages.find(s => s.id === node.stageId);
    const lane = window.originalOJF.swimlanes.find(l => l.id === node.swimlaneId);

    const titleEl = document.getElementById('inspect-title');
    const badgeEl = document.getElementById('inspect-stage-swimlane');
    const descEl = document.getElementById('inspect-description');
    const sevEl = document.getElementById('inspect-severity');
    const scoreEl = document.getElementById('inspect-score');
    const sentEl = document.getElementById('inspect-sentiment');
    const purpEl = document.getElementById('inspect-purpose');
    const motEl = document.getElementById('inspect-mot');

    if (titleEl) titleEl.textContent = node.title || 'Untitled Step';
    if (badgeEl) badgeEl.textContent = `${stage?.name || 'Stage'} • ${lane?.name || 'Swimlane'}`;
    if (descEl) descEl.textContent = node.description || 'No detailed description provided for this step.';

    if (sevEl) sevEl.textContent = node.severity ? node.severity.toUpperCase() : 'None';
    if (scoreEl) scoreEl.textContent = (node.score !== undefined && node.score !== null) ? `${node.score} / 10` : 'Unscored';
    if (sentEl) sentEl.textContent = node.sentiment ? node.sentiment.charAt(0).toUpperCase() + node.sentiment.slice(1) : 'Neutral';
    if (purpEl) purpEl.textContent = node.purpose ? node.purpose.charAt(0).toUpperCase() + node.purpose.slice(1) : 'None';

    if (motEl) {
        motEl.classList.toggle('d-none', !node.isMomentOfTruth);
    }

    // Blueprint Inspection
    const bpContainer = document.getElementById('inspect-blueprint-container');
    const bp = node.blueprint || {};
    const hasBp = (bp.onstage?.length || bp.backstage?.length || bp.support?.length || bp.evidence?.length);

    if (bpContainer) {
        bpContainer.classList.toggle('d-none', !hasBp);
        if (hasBp) {
            renderInspectBpList('inspect-onstage-list', 'inspect-onstage-group', bp.onstage, item => `<strong>${escapeHtml(item.actor || '')}:</strong> ${escapeHtml(item.action || '')}`);
            renderInspectBpList('inspect-backstage-list', 'inspect-backstage-group', bp.backstage, item => `<strong>${escapeHtml(item.actor || '')}:</strong> ${escapeHtml(item.action || '')}`);
            renderInspectBpList('inspect-support-list', 'inspect-support-group', bp.support, item => `<strong>${escapeHtml(item.system || '')}:</strong> ${escapeHtml(item.description || '')}`);
            renderInspectBpList('inspect-evidence-list', 'inspect-evidence-group', bp.evidence, item => `<strong>${escapeHtml(item.item || '')}</strong> <span class="badge bg-light text-muted border">${escapeHtml(item.type || '')}</span>`);
        }
    }

    const modal = new bootstrap.Modal(document.getElementById('publicNodeModal'));
    modal.show();
}

function renderInspectBpList(listId, groupId, items, formatFn) {
    const list = document.getElementById(listId);
    const group = document.getElementById(groupId);
    if (!list || !group) return;

    list.innerHTML = '';
    if (!items || items.length === 0) {
        group.classList.add('d-none');
    } else {
        group.classList.remove('d-none');
        items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'list-group-item px-0 py-1 bg-transparent border-0';
            li.innerHTML = formatFn(item);
            list.appendChild(li);
        });
    }
}

/**
 * Render Public Table Mode
 */
function renderPublicTable() {
    const tbody = document.getElementById('public-nodes-table-body');
    if (!tbody || !window.originalOJF) return;
    tbody.innerHTML = '';

    const nodes = window.originalOJF.nodes || [];
    if (nodes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No nodes found in this map.</td></tr>';
        return;
    }

    nodes.forEach(node => {
        const stage = window.originalOJF.stages.find(s => s.id === node.stageId);
        const lane = window.originalOJF.swimlanes.find(l => l.id === node.swimlaneId);

        const tr = document.createElement('tr');
        tr.className = 'cursor-pointer';
        tr.setAttribute('role', 'button');
        tr.setAttribute('tabindex', '0');
        tr.setAttribute('aria-label', `Step: ${node.title || 'Untitled'}. Click to inspect details`);
        tr.onclick = () => openNodeModal(node.id);
        tr.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openNodeModal(node.id);
            }
        };
        tr.innerHTML = `
            <td>
                <span class="fw-semibold text-primary">${escapeHtml(node.title)}</span>
                ${node.isMomentOfTruth ? '<span class="badge bg-warning text-dark ms-1">Moment of Truth</span>' : ''}
            </td>
            <td><span class="badge bg-light text-dark border">${escapeHtml(stage?.name || '-')}</span></td>
            <td><span class="badge bg-light text-dark border">${escapeHtml(lane?.name || '-')}</span></td>
            <td><span class="badge bg-${getSeverityBadgeColor(node.severity)}">${escapeHtml(node.severity || 'low')}</span></td>
            <td><span class="text-muted small">${escapeHtml(node.sentiment || '—')}</span></td>
            <td><span class="fw-bold">${node.score !== undefined && node.score !== null ? node.score : '—'}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function getSeverityBadgeColor(sev) {
    if (sev === 'high') return 'danger';
    if (sev === 'medium') return 'warning text-dark';
    return 'secondary';
}

function renderEditorTables() {
    renderPublicTable();
}

/**
 * Read-Only Exporters
 */
function exportToOJF() {
    if (!window.currentJourney) return;
    const blob = new Blob([JSON.stringify(window.originalOJF, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(window.currentJourney.title || 'journey').replace(/\s+/g, '_')}.ojf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function exportToMarkdown() {
    if (!window.currentJourney || !window.originalOJF) return;
    const title = window.currentJourney.title || 'Untitled Journey';
    const persona = window.originalOJF.persona || '';
    const pov = window.originalOJF.pointOfView || '';
    const notes = window.currentJourney.notes || window.currentJourney.description || window.originalOJF.notes || '';
    const stages = window.originalOJF.stages || [];
    const swimlanes = window.originalOJF.swimlanes || [];
    const nodes = window.originalOJF.nodes || [];

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
                });
            }
        });
        md += `\n`;
    });

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

async function exportToPNG() {
    const wasTable = activeEditorMode === 'table';
    if (wasTable) {
        switchEditorMode('visual');
        await new Promise(r => setTimeout(r, 150));
    }

    const element = document.getElementById('map-grid');
    if (element) {
        toggleLoading(true);
        try {
            const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const link = document.createElement('a');
            link.download = `${(window.currentJourney.title || 'journey').replace(/\s+/g, '_')}.png`;
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
}

async function exportExecutivePDF() {
    if (!window.currentJourney) return;
    const journey = window.currentJourney;
    const ojf = window.originalOJF || {};

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
        await html2pdf().set(opt).from(container).save();
    } catch (err) {
        console.error('Executive PDF Export error:', err);
        alert('Failed to generate Executive PDF Report: ' + err.message);
    } finally {
        toggleLoading(false);
    }
}

// Aliases for backward compatibility
function exportToPDF() {
    return exportExecutivePDF();
}

function exportTextualPDF() {
    return exportExecutivePDF();
}

function toggleLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = show ? 'flex' : 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    if (!window.currentJourney || !window.originalOJF) return;
    const tableEl = document.getElementById('mode-table');
    const isTable = !!tableEl && (tableEl.classList.contains('active') || !!tableEl.checked);
    activeEditorMode = isTable ? 'table' : 'visual';
    if (activeEditorMode === 'visual') {
        renderVisualMap();
    } else {
        renderPublicTable();
    }
    if (typeof updateScorecard === 'function') {
        updateScorecard();
    }
});
