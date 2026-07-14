const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Achievement = sequelize.define(
  "Achievement",
  {
    id: { type: DataTypes.STRING(64), primaryKey: true },
    userId: { type: DataTypes.STRING(64), allowNull: false },
    key: { type: DataTypes.STRING(50), allowNull: false }, // e.g. "flag_detective"
    name: { type: DataTypes.STRING(100), allowNull: false }, // e.g. "Flag Detective"
    description: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    tableName: "achievements",
    indexes: [{ unique: true, fields: ["userId", "key"] }],
  }
);

module.exports = Achievement;
