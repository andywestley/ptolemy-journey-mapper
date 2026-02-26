/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1666204432");
  const names = [];
  for (const field of collection.fields) {
    names.push(field.name);
  }
  console.log("FIELDS_V2:", JSON.stringify(names));
}, (app) => {
  // no-op
})
