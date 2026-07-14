const express = require("express");
const ctrl = require("../controllers/comment.controller");
const { validate } = require("../middleware/validate");
const schemas = require("../validation/content.schemas");
const { requireAuth } = require("../middleware/auth");
const { dailyKarmaTouch } = require("../middleware/dailyKarma");

const router = express.Router();

router.patch("/:id", requireAuth(), dailyKarmaTouch(), validate(schemas.editComment), ctrl.edit);
router.delete("/:id", requireAuth(), ctrl.remove);
router.post("/:id/react", requireAuth(), dailyKarmaTouch(), validate(schemas.react), ctrl.react);

module.exports = router;
