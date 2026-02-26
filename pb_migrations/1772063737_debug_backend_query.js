/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  try {
    const records = app.findRecordsByFilter("journeys", "created != ''", "-created", 1);
    if (records.length > 0) {
      console.log("DIAG: Last journey title:", records[0].get("title"));
    }
  } catch (err) {
    console.log("DIAG: Backend query test skipped (safe):", err.message);
  }
}, (app) => {
  // no-op
})
