const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Comment = sequelize.define(
  "Comment",
  {
    id: { type: DataTypes.STRING(64), primaryKey: true },
    postId: { type: DataTypes.STRING(64), allowNull: false },
    parentId: { type: DataTypes.STRING(64), allowNull: true },
    authorId: { type: DataTypes.STRING(64), allowNull: false },
    authorName: { type: DataTypes.STRING(20), allowNull: false },
    authorAvatar: { type: DataTypes.STRING(500), allowNull: false },
    content: { type: DataTypes.STRING(2000), allowNull: false },
    editedAt: { type: DataTypes.DATE, allowNull: true },
    deletedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "comments",
    indexes: [{ fields: ["postId"] }, { fields: ["parentId"] }, { fields: ["authorId"] }],
  }
);

module.exports = Comment;
