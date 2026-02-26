/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = new Collection({
        "id": "pbc_comments000",
        "name": "comments",
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
                "id": "rel_journey",
                "name": "journey",
                "type": "relation",
                "collectionId": "pbc_1666204432",
                "maxSelect": 1,
                "required": true
            },
            {
                "id": "rel_user",
                "name": "user",
                "type": "relation",
                "collectionId": "_pb_users_auth_",
                "maxSelect": 1,
                "required": true
            },
            {
                "id": "text_content",
                "name": "content",
                "type": "text",
                "required": true
            },
            {
                "id": "num_x",
                "name": "x",
                "type": "number",
                "required": true
            },
            {
                "id": "num_y",
                "name": "y",
                "type": "number",
                "required": true
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
        "listRule": "@request.auth.id != \"\"",
        "viewRule": "@request.auth.id != \"\"",
        "createRule": "@request.auth.id != \"\"",
        "updateRule": "@request.auth.id != \"\"",
        "deleteRule": "@request.auth.id = user.id"
    });

    return app.save(collection);
}, (app) => {
    const collection = app.findCollectionByNameOrId("pbc_comments000");
    return app.delete(collection);
})
