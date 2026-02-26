/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_comments000")

  // add field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "bool3084178383",
    "name": "resolved",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_comments000")

  // remove field
  collection.fields.removeById("bool3084178383")

  return app.save(collection)
})
