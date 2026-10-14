/**
 * Ptolemy Templates Gallery Controller
 */

async function importTemplate(url) {
    if (!confirm('This will create a new journey map in your account. Continue?')) {
        return;
    }

    if (typeof toggleLoading === 'function') {
        toggleLoading(true);
    }

    try {
        const fetchUrl = url.startsWith('/') ? url : '/' + url;
        const response = await fetch(fetchUrl);
        if (!response.ok) {
            throw new Error(`Failed to download template file (${response.status} ${response.statusText})`);
        }
        const data = await response.json();

        if (!data.stages || !data.swimlanes) {
            throw new Error('Invalid OpenJourney format: stages or swimlanes are missing.');
        }

        // Ensure unique node IDs using safe UUID generation
        const generateUID = () => {
            if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
                return crypto.randomUUID();
            }
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        };

        const usedIds = new Set();
        if (Array.isArray(data.nodes)) {
            data.nodes = data.nodes.map(node => {
                if (!node.id || usedIds.has(node.id)) {
                    node.id = 'n-' + generateUID();
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
            throw new Error(errData.error || `Server error (${saveResponse.status}) while saving template`);
        }

        const record = await saveResponse.json();
        if (!record || !record.id) {
            throw new Error('Server returned an invalid journey record.');
        }

        alert('Template imported successfully!');
        window.location.href = `/journey/${record.id}/`;
    } catch (err) {
        console.error('Template import error:', err);
        alert('Failed to import template: ' + err.message);

        if (window.dataLayer) {
            window.dataLayer.push({
                event: 'app_error',
                error_context: 'import_template',
                error_message: err.message
            });
        }
    } finally {
        if (typeof toggleLoading === 'function') {
            toggleLoading(false);
        }
    }
}

// Ensure global availability
window.importTemplate = importTemplate;
