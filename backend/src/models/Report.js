const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Report = sequelize.define(
  "Report",
  {
    id: { type: DataTypes.STRING(64), primaryKey: true },
    postId: { type: DataTypes.STRING(64), allowNull: false },
    reporterId: { type: DataTypes.STRING(64), allowNull: false },
    reason: { type: DataTypes.STRING(500), allowNull: false },
    status: { type: DataTypes.ENUM("open", "reviewed", "dismissed"), allowNull: false, defaultValue: "open" },
  },
  {
    tableName: "reports",
    indexes: [{ unique: true, fields: ["postId", "reporterId"] }],
  }
);

module.exports = Report;
