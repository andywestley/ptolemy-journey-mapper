async function debug() {
    const baseUrl = 'http://127.0.0.1:8090';

    try {
        console.log('Creating a test user...');
        const email = `test_${Date.now()}@example.com`;
        const password = 'password123';

        let res = await fetch(`${baseUrl}/api/collections/users/records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                passwordConfirm: password,
                name: 'Test user'
            })
        });

        if (!res.ok) {
            console.error('Failed to create user', await res.text());
            return;
        }

        console.log('Authenticating...');
        res = await fetch(`${baseUrl}/api/collections/users/auth-with-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: email, password })
        });

        if (!res.ok) {
            console.error('Failed to auth', await res.text());
            return;
        }

        const authData = await res.json();
        const token = authData.token;
        const userId = authData.record.id;
        console.log('Authenticated user:', userId);

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        console.log('Creating a journey...');
        res = await fetch(`${baseUrl}/api/collections/journeys/records`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                title: "Test Journey",
                owner: userId,
                journey_status: "active"
            })
        });

        if (!res.ok) {
            console.error('Failed to create journey', await res.text());
            return;
        }

        const journey = await res.json();
        console.log('Created journey:', journey.id);

        console.log('Attempting update (Trash)...');
        res = await fetch(`${baseUrl}/api/collections/journeys/records/${journey.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
                journey_status: "trash"
            })
        });

        if (!res.ok) {
            console.log('Update failed with status:', res.status);
            console.log('Update Error Data:', await res.text());
        } else {
            console.log('Updated successfully:', (await res.json()).journey_status);
        }

        console.log('Attempting delete...');
        res = await fetch(`${baseUrl}/api/collections/journeys/records/${journey.id}`, {
            method: 'DELETE',
            headers
        });

        if (!res.ok) {
            console.log('Delete failed with status:', res.status);
            console.log('Delete Error Data:', await res.text());
        } else {
            console.log('Deleted successfully.');
        }

    } catch (err) {
        console.error('\n--- Script ERROR ---', err);
    }
}

debug();
