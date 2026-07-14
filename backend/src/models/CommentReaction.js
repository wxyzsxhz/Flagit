const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const REACTION_KEYS = ["funny", "shocking", "sad", "crazy", "confusing", "agree", "wild"];

const CommentReaction = sequelize.define(
  "CommentReaction",
  {
    id: { type: DataTypes.STRING(64), primaryKey: true },
    commentId: { type: DataTypes.STRING(64), allowNull: false },
    userId: { type: DataTypes.STRING(64), allowNull: false },
    reactionKey: { type: DataTypes.ENUM(...REACTION_KEYS), allowNull: false },
  },
  {
    tableName: "comment_reactions",
    indexes: [
      // A user may hold exactly one reaction on a given comment at a time
      // (matches the frontend's toggleReaction: picking a new one clears the old).
      { unique: true, fields: ["commentId", "userId"] },
    ],
  }
);

CommentReaction.REACTION_KEYS = REACTION_KEYS;
module.exports = CommentReaction;
