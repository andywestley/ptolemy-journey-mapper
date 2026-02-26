/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("journeys");

  const field = collection.fields.getByName("status");
  if (field) {
    field.name = "journeyStatus";
    app.save(collection);
  }

  // Ensure all records have the new field populated
  const records = app.findRecordsByFilter("journeys", "journeyStatus = '' || journeyStatus = null");
  for (const record of records) {
    record.set("journeyStatus", "active");
    app.save(record);
  }
}, (app) => {
  // no-op
})
