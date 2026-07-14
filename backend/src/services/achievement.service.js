const { makeId } = require("../utils/id");
const { Vote, Achievement } = require("../models");
const { notifyPostMilestone, notifyAchievement } = require("./notification.service");

// Vote-count thresholds that trigger a "your post reached N votes"
// notification. Checked after every vote is cast; we only notify the
// instant a post crosses a threshold (not on every vote past it).
const POST_MILESTONES = [100, 500, 1000, 5000, 10000];

async function checkPostMilestones(post, totalVotesBefore, totalVotesAfter) {
  const crossed = POST_MILESTONES.find((m) => totalVotesBefore < m && totalVotesAfter >= m);
  if (crossed) {
    await notifyPostMilestone({ postAuthorId: post.authorId, postId: post.id, totalVotes: crossed });
  }
}

// "Flag Detective" — awarded once a user has cast 100 votes (i.e. helped
// flag 100 situations red/green/black). Idempotent: the unique index on
// (userId, key) plus a pre-check keeps this from double-firing.
const BADGES = {
  flag_detective: { name: "Flag Detective", description: "Cast 100 helpful votes", threshold: 100 },
};

async function checkVotingAchievements(userId) {
  const existing = await Achievement.findOne({ where: { userId, key: "flag_detective" } });
  if (existing) return;

  const voteCount = await Vote.count({ where: { userId } });
  const badge = BADGES.flag_detective;
  if (voteCount >= badge.threshold) {
    await Achievement.create({
      id: makeId("ach"),
      userId,
      key: "flag_detective",
      name: badge.name,
      description: badge.description,
    });
    await notifyAchievement({ userId, badgeName: badge.name, description: badge.description });
  }
}

module.exports = { checkPostMilestones, checkVotingAchievements };
