/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1666204432");

  // Remove the old select field
  collection.fields.removeByName("status");

  // Add it back as a simple text field (more robust for filtering)
  collection.fields.add(new Field({
    "name": "status",
    "type": "text"
  }));

  app.save(collection);

  // Set all existing records to active
  const records = app.findRecordsByFilter("journeys", "status = '' || status = null");
  for (const record of records) {
    record.set("status", "active");
    app.save(record);
  }
}, (app) => {
  // no-op
})
