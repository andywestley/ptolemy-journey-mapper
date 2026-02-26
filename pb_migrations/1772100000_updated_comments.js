/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId("pbc_comments000");

    collection.fields.add(new Field({
        "id": "rel_parent",
        "name": "parent",
        "type": "relation",
        "collectionId": "pbc_comments000",
        "maxSelect": 1,
        "required": false
    }));

    return app.save(collection);
}, (app) => {
    const collection = app.findCollectionByNameOrId("pbc_comments000");
    collection.fields.removeById("rel_parent");
    return app.save(collection);
})
