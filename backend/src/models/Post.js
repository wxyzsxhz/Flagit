const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const CATEGORIES = [
  "Relationship", "Work", "School", "Family", "Friends",
  "Lifestyle", "Finance", "Social Media", "Gaming", "Others",
];

const Post = sequelize.define(
  "Post",
  {
    id: { type: DataTypes.STRING(64), primaryKey: true },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    category: { type: DataTypes.ENUM(...CATEGORIES), allowNull: false },
    image: { type: DataTypes.STRING(1000), allowNull: true },
    authorId: { type: DataTypes.STRING(64), allowNull: false },
    // Denormalized snapshot fields so post reads never require a join,
    // matching the shape the frontend already renders (authorName/Avatar).
    authorName: { type: DataTypes.STRING(20), allowNull: false },
    authorAvatar: { type: DataTypes.STRING(500), allowNull: false },
    deletedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "posts",
    indexes: [{ fields: ["authorId"] }, { fields: ["category"] }, { fields: ["createdAt"] }],
  }
);

Post.CATEGORIES = CATEGORIES;
module.exports = Post;
