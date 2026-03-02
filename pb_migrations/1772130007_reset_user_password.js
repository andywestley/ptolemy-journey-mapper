migrate((app) => {
    try {
        const record = app.findFirstRecordByFilter("users", "email = 'andy@andrewwestley.co.uk'");
        if (record) {
            record.setPassword("password123");
            app.saveRecord(record);
            console.log("Successfully reset password for andy@andrewwestley.co.uk");
        } else {
            console.log("User andy@andrewwestley.co.uk not found");
        }
    } catch (err) {
        console.log("ERROR in reset migration:", err.message);
    }
}, (app) => {
    // no-op
})
