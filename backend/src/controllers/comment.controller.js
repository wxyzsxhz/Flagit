const { Comment, CommentReaction, Post } = require("../models");
const { makeId } = require("../utils/id");
const { serializeComment } = require("../utils/serialize");
const { reactionsForComments, emptyReactions } = require("../services/aggregate.service");
const { moderate } = require("../services/moderation.service");
const { notifyCommentReply, notifyCommentReacted, notifyPostCommented } = require("../services/notification.service");
const { ApiError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");

const listForPost = asyncHandler(async (req, res) => {
  const postId = req.params.id;
  const comments = await Comment.findAll({
    where: { postId, deletedAt: null },
    order: [["createdAt", "ASC"]],
  });
  const reactionsMap = await reactionsForComments(comments.map((c) => c.id));
  res.json({ comments: comments.map((c) => serializeComment(c, reactionsMap[c.id])) });
});

const create = asyncHandler(async (req, res) => {
  const postId = req.params.id;
  const { content, parentId } = req.body;

  const post = await Post.findOne({ where: { id: postId, deletedAt: null } });
  if (!post) throw new ApiError(404, "Post not found.");

  let parent = null;
  if (parentId) {
    parent = await Comment.findOne({ where: { id: parentId, postId, deletedAt: null } });
    if (!parent) throw new ApiError(404, "The comment you're replying to no longer exists.");
  }

  const m = moderate(content);
  if (!m.ok) throw new ApiError(400, m.reason);

  const comment = await Comment.create({
    id: makeId("c"),
    postId,
    parentId: parentId || null,
    authorId: req.user.id,
    authorName: req.user.username,
    authorAvatar: req.user.avatar,
    content: m.cleaned,
  });

  // "if someone reply your comment --> get noti"
  if (parent) {
    await notifyCommentReply({
      parentAuthorId: parent.authorId,
      actorId: req.user.id,
      actorName: req.user.username,
      postId,
      commentId: comment.id,
    });
  } else {
    // Top-level comment on the post itself → notify the post author.
    await notifyPostCommented({
      postAuthorId: post.authorId,
      actorId: req.user.id,
      actorName: req.user.username,
      postId,
      commentId: comment.id,
    });
  }

  res.status(201).json({ comment: serializeComment(comment, emptyReactions()) });
});

const edit = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const comment = await Comment.findOne({ where: { id: req.params.id, deletedAt: null } });
  if (!comment) throw new ApiError(404, "Comment not found.");
  if (comment.authorId !== req.user.id) throw new ApiError(403, "You can only edit your own comments.");

  const m = moderate(content);
  if (!m.ok) throw new ApiError(400, m.reason);

  comment.content = m.cleaned;
  comment.editedAt = new Date();
  await comment.save();

  const reactionsMap = await reactionsForComments([comment.id]);
  res.json({ comment: serializeComment(comment, reactionsMap[comment.id]) });
});

// Deletes a comment and its full reply thread (matches the frontend's
// recursive delete in vibe-context.tsx).
const remove = asyncHandler(async (req, res) => {
  const comment = await Comment.findOne({ where: { id: req.params.id, deletedAt: null } });
  if (!comment) throw new ApiError(404, "Comment not found.");
  if (comment.authorId !== req.user.id) throw new ApiError(403, "You can only delete your own comments.");

  const all = await Comment.findAll({ where: { postId: comment.postId, deletedAt: null } });
  const toRemove = new Set([comment.id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const c of all) {
      if (c.parentId && toRemove.has(c.parentId) && !toRemove.has(c.id)) {
        toRemove.add(c.id);
        changed = true;
      }
    }
  }

  await Comment.update({ deletedAt: new Date() }, { where: { id: Array.from(toRemove) } });
  res.status(204).send();
});

// One reaction per user per comment: picking a new reaction moves it,
// picking the same one again clears it (matches the frontend's toggle).
const react = asyncHandler(async (req, res) => {
  const { reactionKey } = req.body;
  const comment = await Comment.findOne({ where: { id: req.params.id, deletedAt: null } });
  if (!comment) throw new ApiError(404, "Comment not found.");

  const existing = await CommentReaction.findOne({ where: { commentId: comment.id, userId: req.user.id } });
  let didReact = false;

  if (existing && existing.reactionKey === reactionKey) {
    await existing.destroy();
  } else if (existing) {
    existing.reactionKey = reactionKey;
    await existing.save();
    didReact = true;
  } else {
    await CommentReaction.create({
      id: makeId("cr"),
      commentId: comment.id,
      userId: req.user.id,
      reactionKey,
    });
    didReact = true;
  }

  if (didReact) {
    await notifyCommentReacted({
      commentAuthorId: comment.authorId,
      actorId: req.user.id,
      actorName: req.user.username,
      postId: comment.postId,
      commentId: comment.id,
    });
  }

  const reactionsMap = await reactionsForComments([comment.id]);
  res.json({ comment: serializeComment(comment, reactionsMap[comment.id]) });
});

module.exports = { listForPost, create, edit, remove, react };
