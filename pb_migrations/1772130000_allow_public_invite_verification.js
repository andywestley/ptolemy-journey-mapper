/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId("invites");

    // Allow anyone to check if an invite token is valid
    // (They still can't see other fields unless they know the secret token)
    collection.listRule = "";
    collection.viewRule = "";

    app.save(collection);
}, (app) => {
    const collection = app.findCollectionByNameOrId("invites");

    collection.listRule = "@request.auth.id != \"\"";
    collection.viewRule = "@request.auth.id != \"\"";

    app.save(collection);
})
