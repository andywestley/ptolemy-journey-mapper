/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1666204432");

  // Ensure journeyStatus and folder exist as simple text fields
  // We remove them first to be absolutely sure there's no collision or type mismatch
  collection.fields.removeByName("status");
  collection.fields.removeByName("journeyStatus");
  collection.fields.removeByName("folder");

  collection.fields.add(new Field({
    "name": "journeyStatus",
    "type": "text",
    "required": false
  }));

  collection.fields.add(new Field({
    "name": "folder",
    "type": "text",
    "required": false
  }));

  app.save(collection);

  // Set default values
  const records = app.findRecordsByFilter("journeys", "journeyStatus = '' || journeyStatus = null");
  for (const record of records) {
    record.set("journeyStatus", "active");
    app.save(record);
  }
}, (app) => {
  // no-op
})
