const express = require("express");
const ctrl = require("../controllers/user.controller");
const { validate } = require("../middleware/validate");
const schemas = require("../validation/auth.schemas");
const { requireAuth } = require("../middleware/auth");
const { dailyKarmaTouch } = require("../middleware/dailyKarma");

const router = express.Router();

router.get("/", ctrl.list);
router.get("/leaderboard", ctrl.leaderboard);
router.patch("/me", requireAuth(), dailyKarmaTouch(), validate(schemas.updateProfile), ctrl.updateMe);
router.get("/:username", ctrl.getByUsername);

module.exports = router;
