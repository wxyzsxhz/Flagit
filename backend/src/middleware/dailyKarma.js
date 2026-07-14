const { grantDailyKarmaIfNeeded } = require("../services/karma.service");

// Mounted after requireAuth on general "site activity" routes so karma
// also ticks for a user who was already logged in when a new day started
// (spec: "added ... when people log in OR open/use the website"), while
// grantDailyKarmaIfNeeded's date-equality check guarantees it can never
// fire twice in the same UTC day no matter how many requests come in.
function dailyKarmaTouch() {
  return async (req, res, next) => {
    if (req.user) {
      try {
        await grantDailyKarmaIfNeeded(req.user);
      } catch {
        // Never block the request over a karma bookkeeping failure.
      }
    }
    next();
  };
}

module.exports = { dailyKarmaTouch };
