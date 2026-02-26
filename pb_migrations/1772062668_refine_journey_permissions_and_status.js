/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1666204432");

  // Allow collaborators to list and view
  collection.listRule = "owner = @request.auth.id || collaborators ?= @request.auth.id";
  collection.viewRule = "owner = @request.auth.id || collaborators ?= @request.auth.id";

  app.save(collection);

  // Force update any missing statuses
  const records = app.findRecordsByFilter("journeys", "status = '' || status = null");
  for (const record of records) {
    record.set("status", "active");
    app.save(record);
  }
}, (app) => {
  // no-op
})
