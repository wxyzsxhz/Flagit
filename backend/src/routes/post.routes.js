const express = require("express");
const ctrl = require("../controllers/post.controller");
const commentCtrl = require("../controllers/comment.controller");
const { validate } = require("../middleware/validate");
const schemas = require("../validation/content.schemas");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const { dailyKarmaTouch } = require("../middleware/dailyKarma");
const upload = require("../middleware/upload"); // add later if using multer

const router = express.Router();

router.get("/", optionalAuth(), dailyKarmaTouch(), ctrl.list);

router.get("/hall/:flag", ctrl.hallOfFlag);

router.get("/:id", optionalAuth(), dailyKarmaTouch(), ctrl.getOne);


// CHANGE THIS
router.post(
  "/",
  requireAuth(),
  dailyKarmaTouch(),
  upload.single("image"),
  //validate(schemas.createPost),
  ctrl.create
);


router.delete("/:id", requireAuth(), ctrl.remove);

router.post(
  "/:id/vote",
  requireAuth(),
  dailyKarmaTouch(),
  validate(schemas.vote),
  ctrl.castVote
);

router.post(
  "/:id/report",
  requireAuth(),
  validate(schemas.report),
  ctrl.report
);


router.get("/:id/comments", commentCtrl.listForPost);

router.post(
  "/:id/comments",
  requireAuth(),
  dailyKarmaTouch(),
  validate(schemas.createComment),
  commentCtrl.create
);

module.exports = router;