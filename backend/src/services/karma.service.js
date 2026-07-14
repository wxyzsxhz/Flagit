const env = require("../config/env");

function todayUTC() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

// Grants the daily login karma bonus at most once per UTC calendar day,
// no matter how many times the user logs in/out or opens the site that
// day. Call this on login AND on any authenticated "site activity" (see
// dailyKarma middleware) so karma also ticks for users who stay logged
// in across midnight and just keep using the site.
async function grantDailyKarmaIfNeeded(user) {
  const today = todayUTC();
  if (user.lastKarmaDate === today) {
    return { granted: false, user };
  }
  user.karma += env.dailyLoginKarma;
  user.lastKarmaDate = today;
  await user.save();
  return { granted: true, amount: env.dailyLoginKarma, user };
}

module.exports = { grantDailyKarmaIfNeeded, todayUTC };
