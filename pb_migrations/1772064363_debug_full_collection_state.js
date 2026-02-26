/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1666204432");

  console.log("--- JOURNEYS COLLECTION STATE ---");
  console.log("Name:", collection.name);
  console.log("List Rule:", collection.listRule);
  console.log("View Rule:", collection.viewRule);
  console.log("Create Rule:", collection.createRule);
  console.log("Update Rule:", collection.updateRule);
  console.log("Delete Rule:", collection.deleteRule);

  const fields = [];
  for (const field of collection.fields) {
    fields.push({ name: field.name, type: field.type });
  }
  console.log("Fields:", JSON.stringify(fields));
  console.log("---------------------------------");
}, (app) => {
  // no-op
})
