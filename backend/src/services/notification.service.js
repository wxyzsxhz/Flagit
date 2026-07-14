const { publishNotificationEvent } = require("../kafka/producer");

// Thin helpers so controllers stay readable; every one of these is a
// fire-and-forget publish to Kafka (see producer.js for why we never await
// failure into the caller's response).

function notifyPostLiked({ postAuthorId, actorId, actorName, postId }) {
  if (postAuthorId === actorId) return; // don't notify yourself
  return publishNotificationEvent({
    userId: postAuthorId,
    type: "like_post",
    actorId,
    actorName,
    postId,
    message: `${actorName} flagged to your post`,
  });
}

function notifyCommentReply({ parentAuthorId, actorId, actorName, postId, commentId }) {
  if (parentAuthorId === actorId) return;
  return publishNotificationEvent({
    userId: parentAuthorId,
    type: "reply_comment",
    actorId,
    actorName,
    postId,
    commentId,
    message: `${actorName} replied to your comment`,
  });
}

function notifyCommentReacted({ commentAuthorId, actorId, actorName, postId, commentId }) {
  if (commentAuthorId === actorId) return;
  return publishNotificationEvent({
    userId: commentAuthorId,
    type: "like_comment",
    actorId,
    actorName,
    postId,
    commentId,
    message: `${actorName} reacted to your comment`,
  });
}

function notifyPostMilestone({ postAuthorId, postId, totalVotes }) {
  return publishNotificationEvent({
    userId: postAuthorId,
    type: "post_milestone",
    postId,
    message: `Your post reached ${totalVotes.toLocaleString()} votes`,
    meta: { milestone: totalVotes },
  });
}

function notifyAchievement({ userId, badgeName, description }) {
  return publishNotificationEvent({
    userId,
    type: "achievement",
    message: `Congratulations! You unlocked "${badgeName}"`,
    meta: { badge: badgeName, description },
  });
}

module.exports = {
  notifyPostLiked,
  notifyCommentReply,
  notifyCommentReacted,
  notifyPostMilestone,
  notifyAchievement,
};
