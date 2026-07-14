const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Vote = sequelize.define(
  "Vote",
  {
    id: { type: DataTypes.STRING(64), primaryKey: true },
    postId: { type: DataTypes.STRING(64), allowNull: false },
    userId: { type: DataTypes.STRING(64), allowNull: false },
    type: { type: DataTypes.ENUM("red", "green", "black"), allowNull: false },
  },
  {
    tableName: "votes",
    indexes: [
      { unique: true, fields: ["postId", "userId"] }, // one vote per user per post
      { fields: ["postId", "type"] },
    ],
  }
);

module.exports = Vote;
