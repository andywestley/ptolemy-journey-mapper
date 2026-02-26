/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const user = app.findFirstRecordByFilter("users", "email != ''");
  if (!user) {
    console.log("DIAG: No user found to test with.");
    return;
  }

  console.log("DIAG: Testing with user ID:", user.id);

  try {
    const records = app.findRecordsByFilter("journeys", `owner = '${user.id}' && journeyStatus = 'active'`);
    console.log("BACKEND COMPOSITE TEST SUCCESS. Count:", records.length);
  } catch (err) {
    console.log("BACKEND COMPOSITE TEST FAILED:", err);
  }
}, (app) => {
  // no-op
})
