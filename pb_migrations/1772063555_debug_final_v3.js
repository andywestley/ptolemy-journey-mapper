/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1666204432");
  const names = [];
  for (const field of collection.fields) {
    names.push(field.name);
  }
  console.log("FINAL_DIAG_FIELDS:", JSON.stringify(names));
  console.log("FINAL_DIAG_RULES:", JSON.stringify({
    list: collection.listRule,
    view: collection.viewRule
  }));
}, (app) => {
  // no-op
})
