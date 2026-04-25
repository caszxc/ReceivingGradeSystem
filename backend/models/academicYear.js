const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AcademicYear = sequelize.define(
  "AcademicYear",
  {
    academic_year: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "academic_year",
  },
);

module.exports = AcademicYear;
