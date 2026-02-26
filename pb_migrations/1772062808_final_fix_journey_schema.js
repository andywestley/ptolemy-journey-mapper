/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1666204432");

  // Update collection rules and ensure fields are correct
  // Note: Using unmarshal to ensure the EXACT state we want for rules
  collection.listRule = "owner = @request.auth.id || collaborators ?= @request.auth.id";
  collection.viewRule = "owner = @request.auth.id || collaborators ?= @request.auth.id";
  collection.createRule = "@request.auth.id != ''";
  collection.updateRule = "owner = @request.auth.id || collaborators ?= @request.auth.id";
  collection.deleteRule = "owner = @request.auth.id";

  // Fix the status field to be a single-select (maxSelect: 1)
  const statusField = collection.fields.getByName("status");
  if (statusField) {
    statusField.maxSelect = 1;
  }

  app.save(collection);

  // One final sweep to ensure data is clean
  const records = app.findRecordsByFilter("journeys", "status = '' || status = null");
  for (const record of records) {
    record.set("status", "active");
    app.save(record);
  }
}, (app) => {
  // no-op
})
