const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DefaultFilter = sequelize.define(
  "DefaultFilter",
  {
    default_year_level: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    default_semester: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    default_course: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    default_section: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    default_academic_year: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "default_filters",
  },
);

module.exports = DefaultFilter;
