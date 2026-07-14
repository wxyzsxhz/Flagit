const Joi = require("joi");

// Mirrors the frontend's own rules exactly (register.tsx / vibe-context.tsx)
// so users never see a client-side "valid" form get rejected server-side.
const username = Joi.string().trim().lowercase().pattern(/^[a-z0-9_.]{3,20}$/).required().messages({
  "string.pattern.base": "Username: 3–20 chars, letters/numbers/._ only.",
});
const email = Joi.string().trim().lowercase().pattern(/^[\w.+-]+@[\w-]+\.[\w.-]+$/).required().messages({
  "string.pattern.base": "Enter a valid email.",
});
const password = Joi.string().min(6).max(72).required().messages({
  "string.min": "Password must be at least 6 characters.",
});

const register = Joi.object({ username, email, password });

const login = Joi.object({
  usernameOrEmail: Joi.string().trim().lowercase().required(),
  password: Joi.string().required(),
});

const forgotPassword = Joi.object({ email });

const resetPassword = Joi.object({
  token: Joi.string().required(),
  newPassword: password,
});

const changePassword = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: password,
});

const updateProfile = Joi.object({
  username: username.optional(),
  avatar: Joi.string().uri().max(500).optional(),
});

module.exports = { register, login, forgotPassword, resetPassword, changePassword, updateProfile };
