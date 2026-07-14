const express = require("express");
const ctrl = require("../controllers/auth.controller");
const { validate } = require("../middleware/validate");
const schemas = require("../validation/auth.schemas");
const { requireAuth } = require("../middleware/auth");
const { authLimiter, forgotPasswordLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.post("/register", authLimiter, validate(schemas.register), ctrl.register);
router.post("/login", authLimiter, validate(schemas.login), ctrl.login);
router.post("/refresh", ctrl.refresh);
router.post("/logout", ctrl.logout);
router.get("/me", requireAuth(), ctrl.me);

router.post("/forgot-password", forgotPasswordLimiter, validate(schemas.forgotPassword), ctrl.forgotPassword);
router.post("/reset-password", authLimiter, validate(schemas.resetPassword), ctrl.resetPassword);
router.post("/change-password", requireAuth(), validate(schemas.changePassword), ctrl.changePassword);

module.exports = router;
