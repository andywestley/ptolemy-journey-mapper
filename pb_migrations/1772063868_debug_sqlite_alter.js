/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  try {
    app.db().newQuery("ALTER TABLE journeys ADD COLUMN journeyStatus TEXT DEFAULT 'active'").execute();
    console.log("SQL ALTER SUCCESS (column was missing)");
  } catch (err) {
    console.log("SQL ALTER SKIPPED (column probably exists):", err.message);
  }

  try {
    app.db().newQuery("ALTER TABLE journeys ADD COLUMN folder TEXT DEFAULT ''").execute();
    console.log("SQL ALTER FOLDER SUCCESS");
  } catch (err) {
    console.log("SQL ALTER FOLDER SKIPPED");
  }
}, (app) => {
  // no-op
})
