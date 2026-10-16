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

async function exportToPDF() {
    const wasTable = activeEditorMode === 'table';
    if (wasTable) {
        switchEditorMode('visual');
        await new Promise(r => setTimeout(r, 150));
    }

    const element = document.getElementById('map-grid');
    if (!element) return;

    toggleLoading(true);
    const opt = {
        margin: 10,
        filename: `${(window.currentJourney.title || 'journey').replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    try {
        await html2pdf().set(opt).from(element).save();
    } catch (err) {
        console.error('PDF Export error:', err);
        alert('Failed to export PDF.');
    } finally {
        if (wasTable) {
            switchEditorMode('table');
        }
        toggleLoading(false);
    }
}

async function exportTextualPDF() {
    const title = window.currentJourney?.title || 'Journey';
    const persona = window.originalOJF?.persona || '';
    const pov = window.originalOJF?.pointOfView || '';
    const notes = window.currentJourney?.notes || window.currentJourney?.description || window.originalOJF?.notes || '';
    const stages = window.originalOJF?.stages || [];
    const swimlanes = window.originalOJF?.swimlanes || [];
    const nodes = window.originalOJF?.nodes || [];

    const container = document.createElement('div');
    container.style.padding = '40px';
    container.style.fontFamily = "'Outfit', sans-serif";
    container.style.color = '#1e293b';

    let html = `
        <div style="border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="color: #6366f1; margin-bottom: 5px;">Journey Map Report: ${escapeHtml(title)}</h1>
            ${persona ? `<p style="margin: 5px 0;"><strong>Persona:</strong> ${escapeHtml(persona)}</p>` : ''}
            ${pov ? `<p style="margin: 5px 0;"><strong>Point of View:</strong> ${escapeHtml(pov)}</p>` : ''}
            ${notes ? `<p style="margin: 5px 0; white-space: pre-wrap;"><strong>Notes:</strong> ${escapeHtml(notes)}</p>` : ''}
        </div>
    `;

    stages.forEach(stage => {
        html += `<div style="margin-bottom: 30px;"><h2 style="background: #f1f5f9; padding: 10px 15px; border-radius: 8px; border-left: 5px solid #6366f1;">Stage: ${escapeHtml(stage.name)}</h2>`;
        swimlanes.forEach(swimlane => {
            const cellNodes = nodes.filter(n => n.stageId === stage.id && n.swimlaneId === swimlane.id);
            if (cellNodes.length > 0) {
                html += `<h3 style="color: #475569; margin-top: 15px;">${escapeHtml(swimlane.name)}</h3>`;
                cellNodes.forEach(node => {
                    html += `
                        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin: 10px 0;">
                            <h4>${escapeHtml(node.title)}</h4>
                            ${node.description ? `<p style="color: #64748b;">${escapeHtml(node.description)}</p>` : ''}
                        </div>
                    `;
                });
            }
        });
        html += `</div>`;
    });

    container.innerHTML = html;
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
        console.error('Text PDF Export error:', err);
    } finally {
        toggleLoading(false);
    }
}

function toggleLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = show ? 'flex' : 'none';
}
