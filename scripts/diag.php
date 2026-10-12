<?php
$pageTitle = "Journey Diagnostic | Ptolemy";
include __DIR__ . '/includes/header.php';
?>

<style>
    body {
        font-family: 'Outfit', sans-serif;
        padding: 20px;
        line-height: 1.6;
    }

    .log {
        background: #f4f4f4;
        padding: 10px;
        border: 1px solid #ddd;
        white-space: pre-wrap;
        margin-top: 10px;
    }

    .error {
        color: red;
    }

    .success {
        color: green;
    }

    button {
        padding: 10px;
        margin-right: 10px;
        cursor: pointer;
    }
</style>

<h1>Journey Management Diagnostic</h1>
<div id="auth-status">Checking auth...</div>
<div id="test-controls" style="display:none; margin-top:20px;">
    <button onclick="testLoad()">1. Test Load Journeys</button>
    <button onclick="testTrashFirst()">2. Try Trash First Journey</button>
    <button onclick="testDeleteFirst()">3. Try Delete First Journey (IRREVERSIBLE)</button>
</div>
<div id="output" class="log"></div>

<script>
    const output = document.getElementById('output');
    const controls = document.getElementById('test-controls');

    function log(msg, type = '') {
        const div = document.createElement('div');
        div.className = type;
        div.innerText = typeof msg === 'object' ? JSON.stringify(msg, null, 2) : msg;
        output.appendChild(div);
    }

    async function init() {
        try {
            const res = await fetch('api/auth.php?action=me');
            if (res.status === 401) {
                log("Not authenticated. Please log in to the main app first.", "error");
                return;
            }
            const user = await res.json();
            document.getElementById('auth-status').innerText = "Authenticated as: " + user.email;
            controls.style.display = 'block';
        } catch (err) {
            log("Error checking auth status", "error");
            log(err.message);
        }
    }

    async function testLoad() {
        log("\n--- Testing Load ---");
        try {
            const res = await fetch('api/journeys.php');
            const journeys = await res.json();
            log(`Loaded ${journeys.length} journeys.`);
            if (journeys.length > 0) {
                log("First Journey ID: " + journeys[0].id);
                log("Status: " + journeys[0].journey_status);
            }
        } catch (err) {
            log("Load failed!", "error");
            log(err.message);
        }
    }

    async function testTrashFirst() {
        log("\n--- Testing Trash (Update) ---");
        try {
            const res = await fetch('api/journeys.php');
            const journeys = await res.json();
            if (journeys.length === 0) { log("No journeys found."); return; }
            const id = journeys[0].id;
            log(`Attempting to update ${id} to trash...`);
            
            const putRes = await fetch(`api/journeys.php?id=${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ journey_status: 'trash' })
            });
            const updated = await putRes.json();
            log("Update successful!", "success");
            log(updated);
        } catch (err) {
            log("Update failed!", "error");
            log(err.message);
        }
    }

    async function testDeleteFirst() {
        log("\n--- Testing Delete ---");
        try {
            const res = await fetch('api/journeys.php');
            const journeys = await res.json();
            if (journeys.length === 0) { log("No journeys found."); return; }
            const id = journeys[0].id;
            log(`Attempting to delete ${id}...`);
            
            const delRes = await fetch(`api/journeys.php?id=${id}`, {
                method: 'DELETE'
            });
            const delData = await delRes.json();
            log("Delete successful!", "success");
            log(delData);
        } catch (err) {
            log("Delete failed!", "error");
            log(err.message);
        }
    }

    init();
</script>

<?php
include __DIR__ . '/includes/footer.php';
?>
