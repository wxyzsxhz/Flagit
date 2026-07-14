const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const { User, PasswordResetToken } = require("../models");
const { makeId } = require("../utils/id");
const { randomAvatar } = require("../utils/avatar");
const { serializeUser } = require("../utils/serialize");
const { ApiError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/auth.service");
const { grantDailyKarmaIfNeeded } = require("../services/karma.service");
const { sendPasswordResetEmail } = require("../services/email.service");
const { generateRefreshToken, hashToken } = require("../utils/jwt");
const env = require("../config/env");

const SALT_ROUNDS = 12;
const STARTING_KARMA = 5;

const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // Explicit, friendly uniqueness checks up front (in addition to the DB's
  // own unique indexes, which are the real source of truth under a race).
  const [existingUsername, existingEmail] = await Promise.all([
    User.findOne({ where: { username } }),
    User.findOne({ where: { email } }),
  ]);
  if (existingUsername) throw new ApiError(409, "Username already taken.");
  if (existingEmail) throw new ApiError(409, "Email already registered.");

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({
    id: makeId("u"),
    username,
    email,
    passwordHash,
    avatar: randomAvatar(username),
    karma: STARTING_KARMA,
    lastKarmaDate: null,
  });

  const accessToken = await authService.issueSession(user, req, res);
  res.status(201).json({ user: serializeUser(user), accessToken });
});

const login = asyncHandler(async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  const user = await User.findOne({
    where: { [Op.or]: [{ username: usernameOrEmail }, { email: usernameOrEmail }] },
  });
  // Same error for "no account" and "wrong password" — don't leak which
  // part was wrong, that's an account-enumeration vector.
  if (!user) throw new ApiError(401, "Incorrect username/email or password.");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new ApiError(401, "Incorrect username/email or password.");

  await grantDailyKarmaIfNeeded(user); // once-per-day bonus, safe to call every login

  const accessToken = await authService.issueSession(user, req, res);
  res.json({ user: serializeUser(user), accessToken });
});

const refresh = asyncHandler(async (req, res) => {
  const raw = req.cookies?.[env.jwt.refreshCookieName];
  const result = await authService.rotateSession(raw, req, res);
  if (!result) {
    authService.clearRefreshCookie(res);
    throw new ApiError(401, "Session expired. Please log in again.");
  }
  res.json({ user: serializeUser(result.user), accessToken: result.accessToken });
});

const logout = asyncHandler(async (req, res) => {
  const raw = req.cookies?.[env.jwt.refreshCookieName];
  await authService.revokeSession(raw);
  authService.clearRefreshCookie(res);
  res.status(204).send();
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: serializeUser(req.user) });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ where: { email } });

  // Spec explicitly asks for a distinct "not registered" error, so unlike
  // login we do NOT use a generic response here — but we still only ever
  // email the account owner, and the token itself never appears in the
  // response, so this doesn't enable password-reset abuse, only confirms
  // whether an email is registered (same info the signup form already
  // reveals via "email already registered").
  if (!user) throw new ApiError(404, "No account found with that email address.");

  const { raw, hash } = generateRefreshToken();
  await PasswordResetToken.create({
    id: makeId("prt"),
    userId: user.id,
    tokenHash: hash,
    expiresAt: new Date(Date.now() + env.resetTokenExpiresMin * 60 * 1000),
  });

  const resetLink = `${env.clientUrl}/change-password?token=${raw}`;
  await sendPasswordResetEmail(user.email, user.username, resetLink);

  res.json({ message: "A password reset link has been sent to your email." });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  const hash = hashToken(token);

  const record = await PasswordResetToken.findOne({
    where: { tokenHash: hash, usedAt: null, expiresAt: { [Op.gt]: new Date() } },
  });
  if (!record) throw new ApiError(400, "This reset link is invalid or has expired.");

  const user = await User.findByPk(record.userId);
  if (!user) throw new ApiError(400, "This reset link is invalid or has expired.");

  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.save();

  record.usedAt = new Date();
  await record.save();

  // A password reset invalidates every existing session, forcing
  // re-login everywhere — standard practice after a credential reset.
  await authService.revokeAllSessions(user.id);

  res.json({ message: "Password reset successfully. Please log in with your new password." });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user;

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new ApiError(401, "Current password is incorrect.");

  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.save();
  await authService.revokeAllSessions(user.id);

  const accessToken = await authService.issueSession(user, req, res);
  res.json({ user: serializeUser(user), accessToken });
});

module.exports = { register, login, refresh, logout, me, forgotPassword, resetPassword, changePassword };
