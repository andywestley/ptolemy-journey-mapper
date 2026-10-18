/**
 * Invites Logic using Native Fetch
 */

async function showInvitesView() {
    switchView('journey-list-view'); // Dashboard container
    document.getElementById('journey-grid').style.display = 'none';
    document.getElementById('empty-state').style.display = 'none';
    document.getElementById('invites-view').style.display = 'block';

    // Update active tab UI
    document.querySelectorAll('#journey-tabs .nav-link').forEach(link => {
        link.classList.toggle('active', link.textContent.includes('Invites'));
    });

    loadInvites();
}

async function loadInvites() {
    const list = document.getElementById('invites-table-body');
    list.innerHTML = '<tr><td colspan="4" class="text-center">Loading...</td></tr>';

    try {
        const response = await fetch('/api/invites.php');
        if (!response.ok) throw new Error('Failed to fetch invites');
        const invites = await response.json();

        list.innerHTML = '';
        if (invites.length === 0) {
            list.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No invites generated yet.</td></tr>';
            return;
        }

        invites.forEach(inv => {
            const tr = document.createElement('tr');
            const inviteUrl = `${window.location.origin}/index.php?invite=${inv.token}`;

            tr.innerHTML = `
                <td>
                    <code class="user-select-all">${escapeHtml(inv.token)}</code>
                    <button class="btn btn-sm btn-link d-inline-flex align-items-center justify-content-center p-1" onclick="copyToClipboard('${escapeHtml(inviteUrl)}')" title="Copy Invite Link" aria-label="Copy invite link for token ${escapeHtml(inv.token)}" style="min-width: 28px; min-height: 28px;">
                        <i class="bi bi-clipboard" aria-hidden="true"></i>
                    </button>
                </td>
                <td>
                    ${inv.isUsed
                    ? '<span class="badge bg-success">Used</span>'
                    : '<span class="badge bg-primary">Active</span>'}
                </td>
                <td class="small text-muted">${new Date(inv.created).toLocaleString()}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-danger d-inline-flex align-items-center justify-content-center" onclick="deleteInvite('${escapeHtml(inv.id)}')" ${inv.isUsed ? 'disabled' : ''} title="Delete Invite" aria-label="Delete invite for token ${escapeHtml(inv.token)}" style="min-width: 28px; min-height: 28px;">
                        <i class="bi bi-trash" aria-hidden="true"></i>
                    </button>
                </td>
            `;
            list.appendChild(tr);
        });
    } catch (err) {
        console.error('Fetch invites error:', err);
        list.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error loading invites.</td></tr>';
    }
}

async function generateInvite() {
    toggleLoading(true);
    // Generate a secure random token
    const token = Array.from(crypto.getRandomValues(new Uint8Array(8)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    try {
        const response = await fetch('/api/invites.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to generate invite');
        
        loadInvites();
    } catch (err) {
        console.error('Generate invite error:', err);
        alert('Failed to generate invite: ' + (err.message || 'Unknown error. Check console.'));
    } finally {
        toggleLoading(false);
    }
}

async function deleteInvite(id) {
    if (!confirm('Delete this unused invite?')) return;
    toggleLoading(true);
    try {
        const response = await fetch(`/api/invites.php?id=${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to delete invite');
        }
        loadInvites();
    } catch (err) {
        console.error('Delete invite error:', err);
        alert(err.message);
    } finally {
        toggleLoading(false);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Invite link copied to clipboard!');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('invites-table-body')) {
        loadInvites();
    }
});

