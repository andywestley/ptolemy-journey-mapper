/**
 * Pinned Feedback Logic
 */

window.feedbackMode = false;
let currentComments = [];

function toggleFeedbackMode() {
    window.feedbackMode = !window.feedbackMode;
    const textEl = document.getElementById('feedback-menu-text');
    const grid = document.getElementById('map-grid');

    if (window.feedbackMode) {
        if (textEl) textEl.innerText = 'Feedback: ON';
        grid.classList.add('feedback-active');
        grid.onclick = (e) => handleGridClick(e);
        alert('Feedback Mode ON: Click anywhere on the map to drop a pin!');
    } else {
        if (textEl) textEl.innerText = 'Feedback: OFF';
        grid.classList.remove('feedback-active');
        grid.onclick = null;
    }
}

async function handleGridClick(e) {
    if (!window.feedbackMode) return;

    // Check if clicked exactly on a pin first, let that handle its own event
    if (e.target.closest('.comment-pin') || e.target.closest('.node-comment-badge')) {
        return;
    }

    // Check if clicked on a node card
    const nodeCard = e.target.closest('.node-card');
    let nodeId = null;
    let title = 'General Feedback';

    if (nodeCard) {
        nodeId = nodeCard.dataset.nodeId;
        title = `Feedback for: ${nodeCard.dataset.nodeTitle}`;
    }

    // Calculate percentage coordinates within the grid
    const rect = document.getElementById('map-grid').getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    openCommentModal(x, y, null, nodeId, title);
}

function openCommentModal(x, y, parentId = null, nodeId = null, title = 'Add Feedback') {
    document.getElementById('comment-x').value = x;
    document.getElementById('comment-y').value = y;
    document.getElementById('comment-parent-id').value = parentId || '';
    document.getElementById('comment-node-id').value = nodeId || '';
    document.getElementById('comment-content').value = '';
    document.getElementById('commentModalTitle').innerText = title;

    const modal = new bootstrap.Modal(document.getElementById('commentModal'));
    modal.show();
}

async function saveComment() {
    const content = document.getElementById('comment-content').value.trim();
    const x = parseFloat(document.getElementById('comment-x').value);
    const y = parseFloat(document.getElementById('comment-y').value);
    const parentId = document.getElementById('comment-parent-id').value;
    const nodeId = document.getElementById('comment-node-id').value;

    if (!content) return;

    toggleLoading(true);
    try {
        const data = {
            journey: currentJourney.id,
            user: (pb.authStore.record || pb.authStore.model || pb.authStore.admin).id,
            content: content,
            x: x || 0,
            y: y || 0
        };

        if (parentId && parentId.trim() !== '') {
            data.parent = parentId;
        }

        if (nodeId && nodeId.trim() !== '') {
            data.nodeId = nodeId;
        }

        await pb.collection('comments').create(data);

        // Close modal
        bootstrap.Modal.getInstance(document.getElementById('commentModal')).hide();
        loadComments(); // Refresh
    } catch (err) {
        console.error('Save comment error:', err);
    } finally {
        toggleLoading(false);
    }
}

async function loadComments() {
    if (!currentJourney) return;

    try {
        const comments = await pb.collection('comments').getFullList({
            filter: `journey = "${currentJourney.id}"`,
            sort: 'created',
            expand: 'user'
        });

        currentComments = comments;
        renderCommentPins();
    } catch (err) {
        console.error('Load comments error:', err);
    }
}

function renderCommentPins() {
    const grid = document.getElementById('map-grid');
    // Remove existing pins
    grid.querySelectorAll('.comment-pin').forEach(p => p.remove());
    document.querySelectorAll('.node-comment-badge').forEach(b => b.remove());

    // Only render top-level comments as pins that are NOT resolved
    const pins = currentComments.filter(c => !c.parent && !c.resolved);

    pins.forEach(comment => {
        if (comment.nodeId) {
            // Find the node card
            const nodeCard = document.querySelector(`.node-card[data-node-id="${comment.nodeId}"]`);
            if (nodeCard) {
                let badge = nodeCard.querySelector('.node-comment-badge');
                if (!badge) {
                    badge = document.createElement('div');
                    badge.className = 'node-comment-badge';
                    badge.innerHTML = `<i class="bi bi-chat-fill text-warning"></i>`;
                    badge.style.position = 'absolute';
                    badge.style.bottom = '-10px';
                    badge.style.right = '10px';
                    badge.style.background = 'white';
                    badge.style.borderRadius = '50%';
                    badge.style.padding = '2px 5px';
                    badge.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                    badge.style.cursor = 'pointer';
                    badge.style.zIndex = '10';
                    badge.onclick = (e) => {
                        e.stopPropagation();
                        showCommentThread(comment.id);
                    };
                    nodeCard.appendChild(badge);
                }
            }
        } else {
            const pin = document.createElement('div');
            pin.className = 'comment-pin';
            pin.style.left = `${comment.x}%`;
            pin.style.top = `${comment.y}%`;
            pin.innerHTML = '<i class="bi bi-chat-left-text-fill"></i>';
            pin.onclick = (e) => {
                e.stopPropagation();
                showCommentThread(comment.id);
            };
            grid.appendChild(pin);
        }
    });
}

function showCommentThread(commentId) {
    const thread = currentComments.filter(c => c.id === commentId || c.parent === commentId);
    const mainComment = thread.find(c => c.id === commentId);

    const list = document.getElementById('thread-list');
    list.innerHTML = '';

    thread.forEach(c => {
        const item = document.createElement('div');
        item.className = 'mb-2 p-2 border-bottom';
        item.innerHTML = `
            <div class="d-flex justify-content-between small text-muted mb-1">
                <strong>${c.expand?.user?.email || 'User'}</strong>
                <span>${new Date(c.created).toLocaleString()}</span>
            </div>
            <div>${c.content}</div>
        `;
        list.appendChild(item);
    });

    document.getElementById('reply-parent-id').value = commentId;
    document.getElementById('reply-resolve').checked = mainComment?.resolved || false;
    const modal = new bootstrap.Modal(document.getElementById('threadModal'));
    modal.show();
}

async function saveReply() {
    const content = document.getElementById('reply-content').value.trim();
    const parentId = document.getElementById('reply-parent-id').value;
    const parent = currentComments.find(c => c.id === parentId);

    if (!content || !parent) return;

    toggleLoading(true);
    try {
        const data = {
            journey: currentJourney.id,
            user: pb.authStore.model.id,
            content: content,
            x: parent.x || 0,
            y: parent.y || 0
        };

        if (parentId && parentId.trim() !== '') {
            data.parent = parentId;
        }

        if (parent.nodeId && parent.nodeId.trim() !== '') {
            data.nodeId = parent.nodeId;
        }

        await pb.collection('comments').create(data);

        const isResolving = document.getElementById('reply-resolve').checked;
        if (isResolving && !parent.resolved) {
            await pb.collection('comments').update(parentId, { resolved: true });
        } else if (!isResolving && parent.resolved) {
            // Optional: allow un-resolving by replying and unchecking
            await pb.collection('comments').update(parentId, { resolved: false });
        }

        document.getElementById('reply-content').value = '';
        document.getElementById('reply-resolve').checked = false;

        // If resolved, close the modal completely since it's "archived" from the map
        if (isResolving) {
            bootstrap.Modal.getInstance(document.getElementById('threadModal')).hide();
            loadComments();
        } else {
            loadComments().then(() => showCommentThread(parentId));
        }

    } catch (err) {
        console.error('Save reply error:', err);
    } finally {
        toggleLoading(false);
    }
}
