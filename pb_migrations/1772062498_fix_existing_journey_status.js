/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const journeys = app.findRecordsByFilter("journeys", "status = '' || status = null");

  for (const journey of journeys) {
    journey.set("status", "active");
    app.save(journey);
  }
}, (app) => {
  // no-op
})
