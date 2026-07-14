const sequelize = require("../config/db");
const User = require("./User");
const RefreshToken = require("./RefreshToken");
const PasswordResetToken = require("./PasswordResetToken");
const Post = require("./Post");
const Vote = require("./Vote");
const Comment = require("./Comment");
const CommentReaction = require("./CommentReaction");
const Report = require("./Report");
const Notification = require("./Notification");
const Achievement = require("./Achievement");

User.hasMany(RefreshToken, { foreignKey: "userId" });
User.hasMany(PasswordResetToken, { foreignKey: "userId" });
User.hasMany(Post, { foreignKey: "authorId" });
User.hasMany(Comment, { foreignKey: "authorId" });
User.hasMany(Notification, { foreignKey: "userId" });
User.hasMany(Achievement, { foreignKey: "userId" });

Post.hasMany(Vote, { foreignKey: "postId" });
Post.hasMany(Comment, { foreignKey: "postId" });
Post.hasMany(Report, { foreignKey: "postId" });

Comment.hasMany(CommentReaction, { foreignKey: "commentId" });
Comment.belongsTo(Post, { foreignKey: "postId" });

module.exports = {
  sequelize,
  User,
  RefreshToken,
  PasswordResetToken,
  Post,
  Vote,
  Comment,
  CommentReaction,
  Report,
  Notification,
  Achievement,
};
