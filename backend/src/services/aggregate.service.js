const { Vote, CommentReaction } = require("../models");

async function votesForPosts(postIds) {
  if (postIds.length === 0) return {};
  const rows = await Vote.findAll({ where: { postId: postIds } });
  const byPost = {};
  for (const id of postIds) byPost[id] = { red: [], green: [], black: [] };
  for (const v of rows) byPost[v.postId][v.type].push(v.userId);
  return byPost;
}

async function votesForPost(postId) {
  return (await votesForPosts([postId]))[postId] || { red: [], green: [], black: [] };
}

function emptyReactions() {
  return { funny: [], shocking: [], sad: [], crazy: [], confusing: [], agree: [], wild: [] };
}

async function reactionsForComments(commentIds) {
  if (commentIds.length === 0) return {};
  const rows = await CommentReaction.findAll({ where: { commentId: commentIds } });
  const byComment = {};
  for (const id of commentIds) byComment[id] = emptyReactions();
  for (const r of rows) byComment[r.commentId][r.reactionKey].push(r.userId);
  return byComment;
}

module.exports = { votesForPosts, votesForPost, reactionsForComments, emptyReactions };
