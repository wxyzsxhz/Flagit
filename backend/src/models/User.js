const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define(
  "User",
  {
    id: { type: DataTypes.STRING(64), primaryKey: true },
    username: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    email: { type: DataTypes.STRING(190), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(100), allowNull: false },
    avatar: { type: DataTypes.STRING(500), allowNull: false },
    karma: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    // Date (YYYY-MM-DD, UTC) the daily login karma was last granted.
    // Comparing calendar dates (not timestamps) is what guarantees
    // "only once a day" regardless of how many times the user logs
    // in/out or opens the site within that same day.
    lastKarmaDate: { type: DataTypes.DATEONLY, allowNull: true },
  },
  {
    tableName: "users",
    indexes: [{ unique: true, fields: ["username"] }, { unique: true, fields: ["email"] }],
  }
);

module.exports = User;
