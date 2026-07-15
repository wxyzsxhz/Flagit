const { Op } = require("sequelize");
const { Post, Vote, Report, sequelize } = require("../models");
const { makeId } = require("../utils/id");
const { serializePost } = require("../utils/serialize");
const { votesForPost, votesForPosts } = require("../services/aggregate.service");
const { moderate } = require("../services/moderation.service");
const { checkPostMilestones, checkVotingAchievements } = require("../services/achievement.service");
const { notifyPostLiked } = require("../services/notification.service");
const { ApiError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");

function totalVotes(v) {
  return v.red.length + v.green.length + v.black.length;
}

const list = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || "20", 10)));
  const where = { deletedAt: null };
  if (req.query.category) where.category = req.query.category;

  const { rows, count } = await Post.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]],
    limit,
    offset: (page - 1) * limit,
  });

  const votesMap = await votesForPosts(rows.map((p) => p.id));
  res.json({
    posts: rows.map((p) => serializePost(p, votesMap[p.id])),
    page,
    limit,
    total: count,
    hasMore: page * limit < count,
  });
});

// Backs the hall.$flag.tsx route: top posts for a given flag color,
// ranked by that flag's vote count.
const hallOfFlag = asyncHandler(async (req, res) => {
  const flag = req.params.flag;
  if (!["red", "green", "black"].includes(flag)) throw new ApiError(400, "Unknown flag type.");

  const posts = await Post.findAll({ where: { deletedAt: null }, order: [["createdAt", "DESC"]], limit: 200 });
  const votesMap = await votesForPosts(posts.map((p) => p.id));

  const ranked = posts
    .map((p) => ({ post: p, votes: votesMap[p.id] }))
    .sort((a, b) => b.votes[flag].length - a.votes[flag].length)
    .slice(0, 50);

  res.json({ posts: ranked.map(({ post, votes }) => serializePost(post, votes)) });
});

const getOne = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ where: { id: req.params.id, deletedAt: null } });
  if (!post) throw new ApiError(404, "Post not found.");
  const votes = await votesForPost(post.id);
  res.json({ post: serializePost(post, votes) });
});

const create = asyncHandler(async (req, res) => {
  const { title, description, category, image } = req.body;

  const m1 = moderate(title);
  if (!m1.ok) throw new ApiError(400, m1.reason);
  const m2 = moderate(description);
  if (!m2.ok) throw new ApiError(400, m2.reason);

  const post = await Post.create({
    id: makeId("p"),
    title: m1.cleaned,
    description: m2.cleaned,
    category,
    image: image || null,
    authorId: req.user.id,
    authorName: req.user.username,
    authorAvatar: req.user.avatar,
  });

  res.status(201).json({ post: serializePost(post, { red: [], green: [], black: [] }) });
});

// Delete own post only. Soft-deleted so votes/comments/notifications that
// reference it remain valid historical records.
const remove = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ where: { id: req.params.id, deletedAt: null } });
  if (!post) throw new ApiError(404, "Post not found.");
  if (post.authorId !== req.user.id) throw new ApiError(403, "You can only delete your own posts.");

  post.deletedAt = new Date();
  await post.save();
  res.status(204).send();
});

// Casts/changes the caller's flag vote on a post. A user holds exactly
// one vote per post at a time (switching flags moves it, matching the
// frontend's `vote()` behavior), enforced by the unique index on
// (postId, userId) plus this upsert-in-a-transaction.
const castVote = asyncHandler(async (req, res) => {
  const { type } = req.body; // `type` can be "red", "green", "black", or null for retraction
  const post = await Post.findOne({ where: { id: req.params.id, deletedAt: null } });
  if (!post) throw new ApiError(404, "Post not found.");

  const before = await votesForPost(post.id);
  const totalBefore = totalVotes(before);

  await sequelize.transaction(async (t) => {
    const existing = await Vote.findOne({ where: { postId: post.id, userId: req.user.id }, transaction: t });

    if (type === null) {
      // Retract vote
      if (existing) {
        await existing.destroy({ transaction: t });
      }
    } else {
      // Cast or change vote
      if (existing) {
        existing.type = type;
        await existing.save({ transaction: t });
      } else {
        await Vote.create({ id: makeId("v"), postId: post.id, userId: req.user.id, type }, { transaction: t });
      }
    }
  });

  const after = await votesForPost(post.id);
  const totalAfter = totalVotes(after);

  // Only notify if a new vote is cast, not on retraction or changing vote
  if (type !== null && !before[type].includes(req.user.id)) {
    await notifyPostLiked({
      postAuthorId: post.authorId,
      actorId: req.user.id,
      actorName: req.user.username,
      postId: post.id,
    });
  }
  await checkPostMilestones(post, totalBefore, totalAfter);
  await checkVotingAchievements(req.user.id);

  res.json({ post: serializePost(post, after) });
});

// Any user may report any post except their own.
const report = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const post = await Post.findOne({ where: { id: req.params.id, deletedAt: null } });
  if (!post) throw new ApiError(404, "Post not found.");
  if (post.authorId === req.user.id) throw new ApiError(400, "You can't report your own post.");

  const existing = await Report.findOne({ where: { postId: post.id, reporterId: req.user.id } });
  if (existing) throw new ApiError(409, "You've already reported this post.");

  await Report.create({ id: makeId("r"), postId: post.id, reporterId: req.user.id, reason });
  res.status(201).json({ message: "Thanks — this post has been reported for review." });
});

module.exports = { list, hallOfFlag, getOne, create, remove, castVote, report };