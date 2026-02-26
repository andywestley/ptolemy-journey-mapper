/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = new Collection({
        "id": "pbc_invites0000",
        "name": "invites",
        "type": "base",
        "system": false,
        "fields": [
            {
                "system": true,
                "id": "text3208210256",
                "name": "id",
                "type": "text",
                "required": true,
                "primaryKey": true,
                "autogeneratePattern": "[a-z0-9]{15}"
            },
            {
                "id": "text_token",
                "name": "token",
                "type": "text",
                "required": true,
                "unique": true
            },
            {
                "id": "rel_invitedBy",
                "name": "invitedBy",
                "type": "relation",
                "collectionId": "_pb_users_auth_",
                "maxSelect": 1,
                "required": true
            },
            {
                "id": "bool_isUsed",
                "name": "isUsed",
                "type": "bool",
                "required": false
            },
            {
                "id": "autodate_created",
                "name": "created",
                "type": "autodate",
                "onCreate": true
            },
            {
                "id": "autodate_updated",
                "name": "updated",
                "type": "autodate",
                "onCreate": true,
                "onUpdate": true
            }
        ],
        "indexes": [
            "CREATE UNIQUE INDEX `idx_token_invites` ON `invites` (`token`)"
        ],
        "listRule": "@request.auth.id != \"\"",
        "viewRule": "@request.auth.id != \"\"",
        "createRule": "@request.auth.id != \"\"",
        "updateRule": "@request.auth.id != \"\"",
        "deleteRule": null
    });

    return app.save(collection);
}, (app) => {
    const collection = app.findCollectionByNameOrId("pbc_invites0000");
    return app.delete(collection);
})
