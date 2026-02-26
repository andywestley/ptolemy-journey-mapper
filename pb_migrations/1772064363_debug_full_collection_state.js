/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  try {
    const collection = app.findCollectionByNameOrId("journeys");
    if (collection) {
      console.log("DIAG: Collection State:", JSON.stringify(collection.fields));
    }
  } catch (err) {
    console.log("DIAG: Full collection state test skipped (safe):", err.message);
  }
}, (app) => {
  // no-op
})
