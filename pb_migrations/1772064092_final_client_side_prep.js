/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1666204432");

  // Relax rules for now to bypass 500 errors on filtering
  collection.listRule = "owner = @request.auth.id || collaborators ?= @request.auth.id";
  collection.viewRule = "owner = @request.auth.id || collaborators ?= @request.auth.id";

  app.save(collection);

  // Final data cleanup
  const records = app.findRecordsByFilter("journeys", "journey_status = '' || journey_status = null");
  for (const record of records) {
    record.set("journey_status", "active");
    app.save(record);
  }
}, (app) => {
  // no-op
})
