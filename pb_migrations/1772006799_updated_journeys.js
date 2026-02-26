/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1666204432")

  // update collection data
  unmarshal({
    "deleteRule": "owner = @request.auth.id",
    "listRule": "owner = @request.auth.id",
    "updateRule": "owner = @request.auth.id",
    "viewRule": "owner = @request.auth.id"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1666204432")

  // update collection data
  unmarshal({
    "deleteRule": null,
    "listRule": null,
    "updateRule": "@request.auth.id != \"\"",
    "viewRule": null
  }, collection)

  return app.save(collection)
})
