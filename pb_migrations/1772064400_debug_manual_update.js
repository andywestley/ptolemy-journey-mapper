/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const record = app.findFirstRecordByFilter("journeys", "journey_status = 'active'");
  if (!record) {
    console.log("TEST: No active journey found to test update.");
    return;
  }

  console.log("TEST: Attempting update on record:", record.id);
  try {
    record.set("journey_status", "trash");
    app.save(record);
    console.log("TEST: Update SUCCESSFUL.");

    // Revert it
    record.set("journey_status", "active");
    app.save(record);
    console.log("TEST: Revert SUCCESSFUL.");
  } catch (err) {
    console.log("TEST: Update FAILED:", err);
  }
}, (app) => {
  // no-op
})
