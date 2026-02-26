/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    // 1. Allow public registration
    const users = app.findCollectionByNameOrId("users");
    users.createRule = "";
    app.save(users);

    // 2. Allow guests to burn their invite code during registration
    const invites = app.findCollectionByNameOrId("invites");
    invites.updateRule = "";
    app.save(invites);
}, (app) => {
    // no-op
})
