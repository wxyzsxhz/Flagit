// Shapes DB rows into the exact JSON the frontend's types (User, Post,
// Comment in vibe-store.ts) expect, and — critically — never includes
// passwordHash or other server-only fields.

function serializeUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    karma: user.karma,
    createdAt: new Date(user.createdAt).getTime(),
  };
}

// Public profile view (no email — don't expose other users' emails).
function serializePublicUser(user) {
  const full = serializeUser(user);
  delete full.email;
  return full;
}

function serializePost(post, votesByType) {
  return {
    id: post.id,
    title: post.title,
    description: post.description,
    category: post.category,
    image: post.image || undefined,
    authorId: post.authorId,
    authorName: post.authorName,
    authorAvatar: post.authorAvatar,
    createdAt: new Date(post.createdAt).getTime(),
    votes: votesByType, // { red: [...userIds], green: [...], black: [...] }
  };
}

function serializeComment(comment, reactionsByKey) {
  return {
    id: comment.id,
    postId: comment.postId,
    parentId: comment.parentId,
    authorId: comment.authorId,
    authorName: comment.authorName,
    authorAvatar: comment.authorAvatar,
    content: comment.content,
    createdAt: new Date(comment.createdAt).getTime(),
    editedAt: comment.editedAt ? new Date(comment.editedAt).getTime() : undefined,
    reactions: reactionsByKey, // { funny: [...userIds], ... }
  };
}

function serializeNotification(n) {
  return {
    id: n.id,
    type: n.type,
    actorId: n.actorId || undefined,
    actorName: n.actorName || undefined,
    postId: n.postId || undefined,
    commentId: n.commentId || undefined,
    message: n.message,
    meta: n.meta || undefined,
    read: n.read,
    createdAt: new Date(n.createdAt).getTime(),
  };
}

module.exports = {
  serializeUser,
  serializePublicUser,
  serializePost,
  serializeComment,
  serializeNotification,
};
