const PocketBase = require('pocketbase/cjs');

async function debug() {
    const pb = new PocketBase('http://127.0.0.1:8090');

    try {
        // Authenticate as a user (I need credentials, which I don't have easily)
        // BUT, I can try to list journeys without auth and see if it's a 403 or something else.
        const journeys = await pb.collection('journeys').getFullList({
            sort: '-created',
            filter: 'status != "trash"'
        });
        console.log('Success:', journeys.length);
    } catch (err) {
        console.log('Error Code:', err.status);
        console.log('Error Data:', JSON.stringify(err.data, null, 2));
        console.log('Error Original:', err.originalError ? err.originalError.message : 'none');
    }
}

debug();
