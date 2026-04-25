const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ActiveSemester = sequelize.define(
  "ActiveSemester",
  {
    semester: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "1ST SEMESTER",
    },
  },
  {
    tableName: "active_semester",
  },
);

module.exports = ActiveSemester;
