/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  try {
    const records = app.findRecordsByFilter("journeys", "journeyStatus = 'active'");
    console.log("BACKEND FILTER TEST SUCCESS. Count:", records.length);
  } catch (err) {
    console.log("BACKEND FILTER TEST FAILED:", err);
  }
}, (app) => {
  // no-op
})
