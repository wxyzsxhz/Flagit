const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

// type drives which icon/copy the frontend renders:
//   like_post, like_comment, reply_comment, post_milestone, achievement
const Notification = sequelize.define(
  "Notification",
  {
    id: { type: DataTypes.STRING(64), primaryKey: true },
    userId: { type: DataTypes.STRING(64), allowNull: false }, // recipient

    type: {
       type: DataTypes.ENUM("like_post", "like_comment", "reply_comment", "comment_post", "post_milestone", "achievement"),
       allowNull: false,
    },
    actorId: { type: DataTypes.STRING(64), allowNull: true }, // who triggered it (null for system/achievement)
    actorName: { type: DataTypes.STRING(20), allowNull: true },
    postId: { type: DataTypes.STRING(64), allowNull: true }, // redirect target
    commentId: { type: DataTypes.STRING(64), allowNull: true },
    message: { type: DataTypes.STRING(300), allowNull: false },
    meta: { type: DataTypes.JSON, allowNull: true }, // e.g. { badge: "Flag Detective", milestone: 1000 }
    read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    tableName: "notifications",
    indexes: [{ fields: ["userId", "read"] }, { fields: ["userId", "createdAt"] }],
  }
);

module.exports = Notification;
