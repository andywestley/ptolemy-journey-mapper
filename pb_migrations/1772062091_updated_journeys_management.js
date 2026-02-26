/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1666204432");

  // Add status field
  collection.fields.add(new Field({
    "name": "status",
    "type": "select",
    "values": ["active", "trash"]
  }));

  // Add folder field
  collection.fields.add(new Field({
    "name": "folder",
    "type": "text"
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1666204432");

  collection.fields.removeByName("status");
  collection.fields.removeByName("folder");

  return app.save(collection);
})
