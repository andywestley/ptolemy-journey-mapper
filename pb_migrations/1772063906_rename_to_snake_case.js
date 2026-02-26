/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1666204432");

  // Rename fields
  const field = collection.fields.getByName("journeyStatus");
  if (field) {
    field.name = "journey_status";
  }

  // MUST update rules to use the new name otherwise save() fails validation
  collection.listRule = "owner = @request.auth.id || collaborators ?= @request.auth.id";
  collection.viewRule = "owner = @request.auth.id || collaborators ?= @request.auth.id";

  app.save(collection);

  // Data migration
  const records = app.findRecordsByFilter("journeys", "journey_status = '' || journey_status = null");
  for (const record of records) {
    record.set("journey_status", "active");
    app.save(record);
  }
}, (app) => {
  // no-op
})
