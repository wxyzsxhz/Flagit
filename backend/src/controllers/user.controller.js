const { Op } = require("sequelize");
const { User, Post, Comment } = require("../models");
const { serializePublicUser, serializeUser, serializePost } = require("../utils/serialize");
const { votesForPosts } = require("../services/aggregate.service");
const { ApiError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");

// Bounded user listing: no "get every user" endpoint exists (that
// wouldn't scale), so this backs the frontend's username search/typeahead
// and the leaderboard/sidebar widgets over a capped, karma-ranked slice.
// `q` does a prefix match for the search-as-you-type use case.
const list = asyncHandler(async (req, res) => {
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "100", 10)));
  const where = req.query.q ? { username: { [Op.like]: `${req.query.q}%` } } : {};
  const users = await User.findAll({ where, order: [["karma", "DESC"]], limit });
  res.json({ users: users.map(serializePublicUser) });
});

const getByUsername = asyncHandler(async (req, res) => {
  const user = await User.findOne({ where: { username: req.params.username } });
  if (!user) throw new ApiError(404, "User not found.");

  const posts = await Post.findAll({
    where: { authorId: user.id, deletedAt: null },
    order: [["createdAt", "DESC"]],
    limit: 50,
  });
  const votesMap = await votesForPosts(posts.map((p) => p.id));

  res.json({
    user: serializePublicUser(user),
    posts: posts.map((p) => serializePost(p, votesMap[p.id])),
  });
});

const updateMe = asyncHandler(async (req, res) => {
  const { username, avatar } = req.body;
  const user = req.user;

  if (username && username !== user.username) {
    const taken = await User.findOne({ where: { username } });
    if (taken) throw new ApiError(409, "Username already taken.");
    user.username = username;
    // Keep denormalized author name/avatar snapshots on existing content
    // consistent with the profile change.
    await Post.update({ authorName: username }, { where: { authorId: user.id } });
    await Comment.update({ authorName: username }, { where: { authorId: user.id } });
  }
  if (avatar) {
    user.avatar = avatar;
    await Post.update({ authorAvatar: avatar }, { where: { authorId: user.id } });
    await Comment.update({ authorAvatar: avatar }, { where: { authorId: user.id } });
  }

  await user.save();
  res.json({ user: serializeUser(user) });
});

const leaderboard = asyncHandler(async (req, res) => {
  const users = await User.findAll({ order: [["karma", "DESC"]], limit: 50 });
  res.json({ users: users.map(serializePublicUser) });
});

module.exports = { list, getByUsername, updateMe, leaderboard };
