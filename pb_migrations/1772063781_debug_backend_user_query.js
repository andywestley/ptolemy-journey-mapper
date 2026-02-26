/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  try {
    const user = app.findFirstRecordByFilter("users", "email != ''");
    if (!user) {
      console.log("DIAG: No user found to test with. Skipping debug test.");
      return;
    }

    console.log("DIAG: Testing with user ID:", user.id);

    const records = app.findRecordsByFilter("journeys", `owner = '${user.id}' && journeyStatus = 'active'`);
    console.log("BACKEND COMPOSITE TEST SUCCESS. Count:", records.length);
  } catch (err) {
    console.log("DIAG: Debug test skipped or failed safely:", err.message);
  }
}, (app) => {
  // no-op
})
