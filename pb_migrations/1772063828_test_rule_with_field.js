/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1666204432");

  collection.listRule = "(owner = @request.auth.id || collaborators ?= @request.auth.id) && journeyStatus != 'trash'";
  collection.viewRule = "(owner = @request.auth.id || collaborators ?= @request.auth.id) && journeyStatus != 'trash'";

  app.save(collection);
}, (app) => {
  // no-op
})
