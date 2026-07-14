const express = require("express");
const ctrl = require("../controllers/notification.controller");
const { requireAuth } = require("../middleware/auth");
const { dailyKarmaTouch } = require("../middleware/dailyKarma");

const router = express.Router();

router.use(requireAuth(), dailyKarmaTouch());
router.get("/", ctrl.list);
router.post("/:id/read", ctrl.markRead);
router.post("/read-all", ctrl.markAllRead);

module.exports = router;
